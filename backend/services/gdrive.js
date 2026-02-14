const { google } = require('googleapis');
const fs = require('fs-extra');
const path = require('path');
const stream = require('stream');

class GoogleDriveService {
  constructor() {
    this.enabled = process.env.GOOGLE_DRIVE_ENABLED === 'true';
    this.drive = null;
    this.rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    
    if (this.enabled) {
      this.initialize();
    }
  }

  async initialize() {
    try {
      const credentialsPath = process.env.GOOGLE_APPLICATION_CREDENTIALS || './credentials.json';
      
      if (!(await fs.pathExists(credentialsPath))) {
        console.warn('⚠️  Google Drive credentials not found. Using local storage.');
        this.enabled = false;
        return;
      }

      const credentials = await fs.readJson(credentialsPath);
      
      const auth = new google.auth.GoogleAuth({
        credentials,
        scopes: ['https://www.googleapis.com/auth/drive.file']
      });

      this.drive = google.drive({ version: 'v3', auth });
      console.log('✅ Google Drive API 已初始化');
    } catch (error) {
      console.error('❌ Google Drive API 初始化失敗:', error.message);
      this.enabled = false;
    }
  }

  /**
   * 建立或取得資料夾
   * @param {string} folderName - 資料夾名稱
   * @param {string} parentId - 父資料夾 ID（可選）
   */
  async getOrCreateFolder(folderName, parentId = null) {
    if (!this.enabled) return null;

    try {
      const parent = parentId || this.rootFolderId || 'root';
      
      // 搜尋是否已存在
      const query = `name='${folderName}' and '${parent}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`;
      
      const response = await this.drive.files.list({
        q: query,
        fields: 'files(id, name)',
        spaces: 'drive'
      });

      if (response.data.files.length > 0) {
        return response.data.files[0].id;
      }

      // 不存在則建立
      const fileMetadata = {
        name: folderName,
        mimeType: 'application/vnd.google-apps.folder',
        parents: [parent]
      };

      const folder = await this.drive.files.create({
        resource: fileMetadata,
        fields: 'id'
      });

      return folder.data.id;
    } catch (error) {
      console.error('建立資料夾失敗:', error.message);
      return null;
    }
  }

  /**
   * 上傳照片到 Google Drive
   * @param {Buffer} fileBuffer - 照片 Buffer
   * @param {string} fileName - 檔案名稱
   * @param {string} projectId - 專案 ID
   * @param {string} taskId - 任務 ID
   */
  async uploadPhoto(fileBuffer, fileName, projectId, taskId) {
    if (!this.enabled) {
      return {
        success: false,
        localPath: null,
        gdriveUrl: null,
        gdriveFileId: null
      };
    }

    try {
      // 建立資料夾結構：/工程專案管理/{projectId}/{taskId}/
      const projectFolderId = await this.getOrCreateFolder('工程專案管理');
      const projectSubFolderId = await this.getOrCreateFolder(projectId, projectFolderId);
      const taskFolderId = await this.getOrCreateFolder(taskId, projectSubFolderId);

      // 上傳檔案
      const fileMetadata = {
        name: fileName,
        parents: [taskFolderId]
      };

      const media = {
        mimeType: 'image/jpeg',
        body: stream.Readable.from(fileBuffer)
      };

      const file = await this.drive.files.create({
        resource: fileMetadata,
        media: media,
        fields: 'id, webViewLink, webContentLink'
      });

      // 設定檔案為公開可讀（可選）
      await this.drive.permissions.create({
        fileId: file.data.id,
        requestBody: {
          role: 'reader',
          type: 'anyone'
        }
      });

      return {
        success: true,
        gdriveUrl: file.data.webViewLink,
        gdriveFileId: file.data.id
      };
    } catch (error) {
      console.error('上傳 Google Drive 失敗:', error.message);
      return {
        success: false,
        gdriveUrl: null,
        gdriveFileId: null
      };
    }
  }
}

module.exports = new GoogleDriveService();
