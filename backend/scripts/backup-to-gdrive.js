// 自動備份 Supabase 資料到 Google Drive
// 使用 OpenClaw Cron Job 每日執行

import { supabase, STORAGE_BUCKET } from '../services/supabase.js';
import { google } from 'googleapis';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

// Google Drive OAuth 設定
const oauth2Client = new google.auth.OAuth2(
  process.env.GOOGLE_DRIVE_CLIENT_ID,
  process.env.GOOGLE_DRIVE_CLIENT_SECRET
);

oauth2Client.setCredentials({
  refresh_token: process.env.GOOGLE_DRIVE_REFRESH_TOKEN
});

const drive = google.drive({ version: 'v3', auth: oauth2Client });

// 備份資料夾 ID
const BACKUP_FOLDER_ID = process.env.GOOGLE_DRIVE_BACKUP_FOLDER_ID;

// 匯出資料庫資料為 JSON
async function exportDatabase() {
  try {
    console.log('📊 Exporting database...');

    // 匯出所有表格
    const { data: projects } = await supabase.from('projects').select('*');
    const { data: tasks } = await supabase.from('tasks').select('*');
    const { data: photos } = await supabase.from('photos').select('*');

    const backup = {
      timestamp: new Date().toISOString(),
      version: '2.0.0',
      projects,
      tasks,
      photos
    };

    return backup;
  } catch (error) {
    console.error('❌ Failed to export database:', error.message);
    throw error;
  }
}

// 下載 Supabase Storage 的所有照片
async function downloadPhotos() {
  try {
    console.log('📸 Downloading photos from Supabase Storage...');

    // 列出所有檔案
    const { data: files, error } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .list('', {
        limit: 1000,
        sortBy: { column: 'created_at', order: 'desc' }
      });

    if (error) throw error;

    const downloads = [];

    for (const file of files) {
      // 下載檔案
      const { data, error: downloadError } = await supabase
        .storage
        .from(STORAGE_BUCKET)
        .download(file.name);

      if (downloadError) {
        console.error(`⚠️ Failed to download ${file.name}:`, downloadError.message);
        continue;
      }

      downloads.push({
        name: file.name,
        data: Buffer.from(await data.arrayBuffer())
      });
    }

    console.log(`✅ Downloaded ${downloads.length} photos`);
    return downloads;
  } catch (error) {
    console.error('❌ Failed to download photos:', error.message);
    throw error;
  }
}

// 上傳備份到 Google Drive
async function uploadBackup(backup, photos) {
  try {
    const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
    console.log(`☁️ Uploading backup to Google Drive (${today})...`);

    // 1. 建立今日備份資料夾
    const folderMetadata = {
      name: today,
      mimeType: 'application/vnd.google-apps.folder',
      parents: [BACKUP_FOLDER_ID]
    };

    const folderResponse = await drive.files.create({
      resource: folderMetadata,
      fields: 'id'
    });

    const todayFolderId = folderResponse.data.id;
    console.log(`📁 Created folder: ${today} (${todayFolderId})`);

    // 2. 上傳資料庫備份 JSON
    const dbBackupContent = JSON.stringify(backup, null, 2);
    const dbFileMetadata = {
      name: 'database-backup.json',
      parents: [todayFolderId]
    };

    await drive.files.create({
      resource: dbFileMetadata,
      media: {
        mimeType: 'application/json',
        body: dbBackupContent
      }
    });

    console.log('✅ Uploaded database-backup.json');

    // 3. 建立 photos 子資料夾
    const photosFolderMetadata = {
      name: 'photos',
      mimeType: 'application/vnd.google-apps.folder',
      parents: [todayFolderId]
    };

    const photosFolderResponse = await drive.files.create({
      resource: photosFolderMetadata,
      fields: 'id'
    });

    const photosFolderId = photosFolderResponse.data.id;

    // 4. 上傳所有照片
    for (const photo of photos) {
      const photoFileMetadata = {
        name: photo.name.replace(/\//g, '_'), // 移除路徑分隔符
        parents: [photosFolderId]
      };

      await drive.files.create({
        resource: photoFileMetadata,
        media: {
          mimeType: 'image/jpeg',
          body: photo.data
        }
      });
    }

    console.log(`✅ Uploaded ${photos.length} photos`);
    
    return {
      folderId: todayFolderId,
      date: today,
      dbSize: dbBackupContent.length,
      photoCount: photos.length
    };

  } catch (error) {
    console.error('❌ Failed to upload to Google Drive:', error.message);
    throw error;
  }
}

// 清理舊備份（保留最近 30 天）
async function cleanupOldBackups() {
  try {
    console.log('🧹 Cleaning up old backups...');

    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    // 列出備份資料夾中的所有子資料夾
    const response = await drive.files.list({
      q: `'${BACKUP_FOLDER_ID}' in parents and mimeType='application/vnd.google-apps.folder'`,
      fields: 'files(id, name, createdTime)',
      orderBy: 'createdTime desc'
    });

    const folders = response.data.files;
    let deletedCount = 0;

    for (const folder of folders) {
      const createdDate = new Date(folder.createdTime);
      
      if (createdDate < thirtyDaysAgo) {
        await drive.files.delete({ fileId: folder.id });
        console.log(`🗑️ Deleted old backup: ${folder.name}`);
        deletedCount++;
      }
    }

    console.log(`✅ Cleaned up ${deletedCount} old backups`);
  } catch (error) {
    console.error('⚠️ Failed to cleanup old backups:', error.message);
    // 不拋出錯誤，清理失敗不應中斷備份流程
  }
}

// 主要執行函數
async function main() {
  try {
    console.log('');
    console.log('🚀 Starting Supabase → Google Drive Backup');
    console.log('='.repeat(50));
    console.log('');

    const startTime = Date.now();

    // 1. 匯出資料庫
    const backup = await exportDatabase();

    // 2. 下載照片
    const photos = await downloadPhotos();

    // 3. 上傳到 Google Drive
    const result = await uploadBackup(backup, photos);

    // 4. 清理舊備份
    await cleanupOldBackups();

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('');
    console.log('✅ Backup completed successfully!');
    console.log('='.repeat(50));
    console.log(`📅 Date: ${result.date}`);
    console.log(`📊 Database size: ${(result.dbSize / 1024).toFixed(2)} KB`);
    console.log(`📸 Photos: ${result.photoCount}`);
    console.log(`⏱️ Duration: ${duration}s`);
    console.log('');

    return {
      success: true,
      ...result,
      duration
    };

  } catch (error) {
    console.error('');
    console.error('❌ Backup failed:', error.message);
    console.error('');
    return {
      success: false,
      error: error.message
    };
  }
}

// 如果直接執行（非 import）
if (import.meta.url === `file://${process.argv[1]}`) {
  main().then(result => {
    process.exit(result.success ? 0 : 1);
  });
}

export default main;
