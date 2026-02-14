const { google } = require('googleapis');
const fs = require('fs');
const path = require('path');

// 設定模式：'gdrive' 或 'local'
const STORAGE_MODE = process.env.STORAGE_MODE || 'local';
const CREDENTIALS_PATH = path.join(__dirname, 'google-credentials.json');
const LOCAL_UPLOADS_DIR = path.join(__dirname, 'uploads');

// 確保 local uploads 目錄存在
if (!fs.existsSync(LOCAL_UPLOADS_DIR)) {
  fs.mkdirSync(LOCAL_UPLOADS_DIR, { recursive: true });
}

// Google Drive 設定
let drive = null;
let rootFolderId = null;

/**
 * 初始化 Google Drive API
 */
const initGoogleDrive = async () => {
  if (!fs.existsSync(CREDENTIALS_PATH)) {
    console.warn('⚠️  Google credentials 檔案不存在，使用 local storage 模式');
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
    
    console.log('✅ Google Drive API initialized');
    return true;
  } catch (error) {
    console.error('❌ Google Drive 初始化失敗:', error.message);
    return false;
  }
};

/**
 * 取得或建立資料夾
 */
const getOrCreateFolder = async (folderName, parentId) => {
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
    console.error('建立資料夾失敗:', error.message);
    return null;
  }
};

/**
 * 上傳檔案到 Google Drive
 * @param {Buffer} fileBuffer - 檔案內容
 * @param {string} fileName - 檔案名稱
 * @param {string} taskName - 任務名稱（用於建立子資料夾）
 * @param {string} mimeType - MIME type
 * @returns {Promise<{url: string, fileId: string}>}
 */
const uploadToGoogleDrive = async (fileBuffer, fileName, taskName, mimeType) => {
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

    // 設定檔案為公開讀取（可選）
    await drive.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    return {
      url: file.data.webViewLink,
      fileId: file.data.id
    };
  } catch (error) {
    console.error('Google Drive 上傳失敗:', error.message);
    throw error;
  }
};

/**
 * 儲存到本地端（fallback）
 */
const saveToLocal = async (fileBuffer, fileName, taskName) => {
  const taskDir = path.join(LOCAL_UPLOADS_DIR, taskName);
  
  if (!fs.existsSync(taskDir)) {
    fs.mkdirSync(taskDir, { recursive: true });
  }

  const filePath = path.join(taskDir, fileName);
  fs.writeFileSync(filePath, fileBuffer);

  // 返回本地 URL（相對路徑）
  return {
    url: `/uploads/${taskName}/${fileName}`,
    fileId: null
  };
};

/**
 * 統一上傳介面（自動選擇 GDrive 或 local）
 */
const uploadPhoto = async (fileBuffer, fileName, taskName, mimeType) => {
  if (STORAGE_MODE === 'gdrive' && drive && rootFolderId) {
    return await uploadToGoogleDrive(fileBuffer, fileName, taskName, mimeType);
  } else {
    console.log('📁 使用 local storage 模式');
    return await saveToLocal(fileBuffer, fileName, taskName);
  }
};

/**
 * 刪除 Google Drive 檔案
 */
const deleteFromGoogleDrive = async (fileId) => {
  if (!drive || !fileId) return false;

  try {
    await drive.files.delete({ fileId });
    return true;
  } catch (error) {
    console.error('刪除 Google Drive 檔案失敗:', error.message);
    return false;
  }
};

/**
 * 刪除本地檔案
 */
const deleteFromLocal = async (fileUrl) => {
  try {
    const filePath = path.join(__dirname, fileUrl);
    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
      return true;
    }
    return false;
  } catch (error) {
    console.error('刪除本地檔案失敗:', error.message);
    return false;
  }
};

// 啟動時初始化（如果 credentials 存在）
if (STORAGE_MODE === 'gdrive') {
  initGoogleDrive().catch(err => {
    console.error('Google Drive 自動初始化失敗，使用 local storage 模式');
  });
}

module.exports = {
  uploadPhoto,
  deleteFromGoogleDrive,
  deleteFromLocal,
  initGoogleDrive,
  STORAGE_MODE
};
