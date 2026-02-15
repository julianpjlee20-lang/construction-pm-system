const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 設定
const CREDENTIALS_PATH = path.join(__dirname, '..', 'google-credentials.json');
const MAX_RETRIES = 3;
const RETRY_DELAY_MS = 1000;

let drive = null;
let rootFolderId = null;
let isInitialized = false;

/**
 * 延遲函數（用於重試）
 */
const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

/**
 * 初始化 Google Drive API
 */
const initGoogleDrive = async () => {
  if (isInitialized) return true;

  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.warn('⚠️  Google credentials 檔案不存在：', CREDENTIALS_PATH);
    return false;
  }

  try {
    const credentials = JSON.parse(fs.readFileSync(CREDENTIALS_PATH, 'utf8'));
    
    const auth = new google.auth.GoogleAuth({
      credentials,
      scopes: ['https://www.googleapis.com/auth/drive.file']
    });

    drive = google.drive({ version: 'v3', auth });
    
    // 建立或取得根資料夾「工程專案管理」
    rootFolderId = await getOrCreateFolder('工程專案管理', null);
    
    isInitialized = true;
    console.log('✅ Google Drive API initialized');
    return true;
  } catch (error) {
    console.error('❌ Google Drive 初始化失敗:', error.message);
    return false;
  }
};

/**
 * 取得或建立資料夾（帶重試機制）
 */
const getOrCreateFolder = async (folderName, parentId, retries = MAX_RETRIES) => {
  if (!drive) return null;

  try {
    // 搜尋是否已存在
    const query = parentId
      ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await drive.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      return response.data.files[0].id;
    }

    // 不存在，建立新資料夾
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };

    const folder = await drive.files.create({
      resource: fileMetadata,
      fields: 'id'
    });

    return folder.data.id;
  } catch (error) {
    if (retries > 0) {
      console.warn(`⚠️  建立資料夾失敗，重試中... (剩餘 ${retries} 次)`);
      await delay(RETRY_DELAY_MS);
      return getOrCreateFolder(folderName, parentId, retries - 1);
    }
    console.error('❌ 建立資料夾失敗（已無重試次數）:', error.message);
    throw error;
  }
};

/**
 * 上傳檔案到 Google Drive（帶重試機制）
 * @param {Buffer} fileBuffer - 檔案內容
 * @param {string} fileName - 檔案名稱
 * @param {string} taskName - 任務名稱（用於建立子資料夾）
 * @param {string} mimeType - MIME type
 * @returns {Promise<{url: string, fileId: string}>}
 */
const uploadToGoogleDrive = async (fileBuffer, fileName, taskName, mimeType, retries = MAX_RETRIES) => {
  if (!drive || !rootFolderId) {
    throw new Error('Google Drive 未初始化');
  }

  try {
    // 建立任務資料夾
    const taskFolderId = await getOrCreateFolder(taskName, rootFolderId);

    // 上傳檔案
    const fileMetadata = {
      name: fileName,
      parents: [taskFolderId]
    };

    const media = {
      mimeType,
      body: require('stream').Readable.from(fileBuffer)
    };

    const file = await drive.files.create({
      resource: fileMetadata,
      media: media,
      fields: 'id, webViewLink, webContentLink'
    });

    // 設定檔案為公開讀取
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log(`✅ Google Drive 上傳成功：${fileName}`);

    return {
      url: file.data.webViewLink,
      fileId: file.data.id
    };
  } catch (error) {
    if (retries > 0) {
      console.warn(`⚠️  Google Drive 上傳失敗，重試中... (剩餘 ${retries} 次)`);
      await delay(RETRY_DELAY_MS * (MAX_RETRIES - retries + 1)); // 漸進式延遲
      return uploadToGoogleDrive(fileBuffer, fileName, taskName, mimeType, retries - 1);
    }
    console.error('❌ Google Drive 上傳失敗（已無重試次數）:', error.message);
    throw error;
  }
};

/**
 * 刪除 Google Drive 檔案
 */
const deleteFromGoogleDrive = async (fileId) => {
  if (!drive || !fileId) return false;

  try {
    await drive.files.delete({ fileId });
    console.log(`✅ Google Drive 檔案已刪除：${fileId}`);
    return true;
  } catch (error) {
    console.error('❌ 刪除 Google Drive 檔案失敗:', error.message);
    return false;
  }
};

/**
 * 檢查是否已初始化
 */
const isReady = () => isInitialized && drive && rootFolderId;

module.exports = {
  initGoogleDrive,
  uploadToGoogleDrive,
  deleteFromGoogleDrive,
  isReady
};
