const { google } = require('googleapis');
const path = require('path');
const fs = require('fs');

let drive = null;

// 初始化 Google Drive API
function initializeDrive() {
  if (drive) return drive;
  
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  
  if (!keyPath) {
    throw new Error('未設定 GOOGLE_SERVICE_ACCOUNT_KEY 環境變數');
  }
  
  if (!fs.existsSync(keyPath)) {
    throw new Error(`找不到 Service Account 金鑰檔案: ${keyPath}`);
  }
  
  const auth = new google.auth.GoogleAuth({
    keyFile: keyPath,
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });
  
  drive = google.drive({ version: 'v3', auth });
  console.log('✅ Google Drive API 初始化完成');
  
  return drive;
}

// 尋找或建立資料夾
async function findOrCreateFolder(name, parentId = null) {
  const driveInstance = initializeDrive();
  
  // 先搜尋是否已存在
  const query = parentId
    ? `name='${name}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
    : `name='${name}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;
  
  const response = await driveInstance.files.list({
    q: query,
    fields: 'files(id, name)',
    spaces: 'drive'
  });
  
  if (response.data.files.length > 0) {
    return response.data.files[0].id;
  }
  
  // 不存在則建立
  const fileMetadata = {
    name: name,
    mimeType: 'application/vnd.google-apps.folder'
  };
  
  if (parentId) {
    fileMetadata.parents = [parentId];
  }
  
  const folder = await driveInstance.files.create({
    resource: fileMetadata,
    fields: 'id'
  });
  
  console.log(`📁 建立資料夾: ${name} (${folder.data.id})`);
  
  return folder.data.id;
}

// 確保任務資料夾存在（/工程專案管理/{專案名稱}/{任務ID}/）
async function ensureTaskFolder(taskId, projectName = '預設專案') {
  // 1. 確保「工程專案管理」根資料夾存在
  const rootFolderId = await findOrCreateFolder('工程專案管理');
  
  // 2. 確保專案資料夾存在
  const projectFolderId = await findOrCreateFolder(projectName, rootFolderId);
  
  // 3. 確保任務資料夾存在
  const taskFolderId = await findOrCreateFolder(taskId, projectFolderId);
  
  return taskFolderId;
}

// 上傳照片到 Google Drive
async function uploadPhoto(taskId, file, projectName = '預設專案') {
  try {
    const driveInstance = initializeDrive();
    
    // 1. 確保資料夾存在
    const folderId = await ensureTaskFolder(taskId, projectName);
    
    // 2. 上傳檔案
    const fileMetadata = {
      name: file.originalname,
      parents: [folderId]
    };
    
    const media = {
      mimeType: file.mimetype,
      body: require('stream').Readable.from(file.buffer)
    };
    
    const response = await driveInstance.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, webViewLink, thumbnailLink'
    });
    
    const fileId = response.data.id;
    
    // 3. 設定權限（任何人可檢視）
    await driveInstance.permissions.create({
      fileId: fileId,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });
    
    console.log(`📸 照片上傳成功: ${file.originalname} (${fileId})`);
    
    // 4. 返回檢視 URL
    return {
      gdriveFileId: fileId,
      gdriveUrl: `https://drive.google.com/file/d/${fileId}/view`,
      thumbnailUrl: response.data.thumbnailLink || null
    };
  } catch (error) {
    console.error('Google Drive 上傳失敗:', error);
    throw error;
  }
}

// 取得檔案資訊
async function getFileInfo(fileId) {
  try {
    const driveInstance = initializeDrive();
    
    const response = await driveInstance.files.get({
      fileId: fileId,
      fields: 'id, name, webViewLink, thumbnailLink, createdTime'
    });
    
    return response.data;
  } catch (error) {
    console.error('取得檔案資訊失敗:', error);
    throw error;
  }
}

module.exports = {
  initializeDrive,
  uploadPhoto,
  getFileInfo,
  ensureTaskFolder
};
