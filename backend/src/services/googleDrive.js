const { google } = require('googleapis');
const stream = require('stream');

// Google Drive API 初始化
let drive = null;

/**
 * 初始化 Google Drive API
 */
function initDrive() {
  if (drive) return drive;

  const auth = new google.auth.GoogleAuth({
    credentials: {
      client_email: process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL,
      private_key: process.env.GOOGLE_PRIVATE_KEY?.replace(/\\n/g, '\n')
    },
    scopes: ['https://www.googleapis.com/auth/drive.file']
  });

  drive = google.drive({ version: 'v3', auth });
  console.log('✅ Google Drive API 初始化完成');
  return drive;
}

/**
 * 建立或取得資料夾
 * @param {string} folderName - 資料夾名稱
 * @param {string} parentId - 父資料夾 ID
 * @returns {Promise<string>} 資料夾 ID
 */
async function getOrCreateFolder(folderName, parentId = null) {
  const driveClient = initDrive();

  try {
    // 先查詢是否存在
    const query = parentId
      ? `name='${folderName}' and '${parentId}' in parents and mimeType='application/vnd.google-apps.folder' and trashed=false`
      : `name='${folderName}' and mimeType='application/vnd.google-apps.folder' and trashed=false`;

    const response = await driveClient.files.list({
      q: query,
      fields: 'files(id, name)',
      spaces: 'drive'
    });

    if (response.data.files.length > 0) {
      console.log(`📁 找到現有資料夾: ${folderName} (ID: ${response.data.files[0].id})`);
      return response.data.files[0].id;
    }

    // 不存在則建立
    const fileMetadata = {
      name: folderName,
      mimeType: 'application/vnd.google-apps.folder',
      parents: parentId ? [parentId] : []
    };

    const folder = await driveClient.files.create({
      requestBody: fileMetadata,
      fields: 'id'
    });

    console.log(`✅ 建立新資料夾: ${folderName} (ID: ${folder.data.id})`);
    return folder.data.id;
  } catch (error) {
    console.error('❌ 建立/取得資料夾失敗:', error);
    throw new Error('Google Drive 資料夾操作失敗: ' + error.message);
  }
}

/**
 * 上傳檔案到 Google Drive
 * @param {Buffer} buffer - 檔案內容
 * @param {Object} options - 上傳選項
 * @returns {Promise<Object>} 檔案資訊
 */
async function uploadFile(buffer, options = {}) {
  const driveClient = initDrive();
  const {
    fileName,
    mimeType = 'image/jpeg',
    taskId
  } = options;

  try {
    // 建立專案資料夾結構：工程專案管理/{taskId}/
    const rootFolderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    const projectFolder = await getOrCreateFolder('工程專案管理', rootFolderId);
    const taskFolder = await getOrCreateFolder(taskId, projectFolder);

    // 建立檔案 stream
    const bufferStream = new stream.PassThrough();
    bufferStream.end(buffer);

    // 上傳檔案
    const fileMetadata = {
      name: fileName,
      parents: [taskFolder]
    };

    const media = {
      mimeType,
      body: bufferStream
    };

    const file = await driveClient.files.create({
      requestBody: fileMetadata,
      media: media,
      fields: 'id, name, size, webViewLink, webContentLink, thumbnailLink'
    });

    // 設定檔案為公開可讀
    await driveClient.permissions.create({
      fileId: file.data.id,
      requestBody: {
        role: 'reader',
        type: 'anyone'
      }
    });

    console.log(`✅ 檔案上傳成功: ${fileName} (ID: ${file.data.id})`);

    return {
      fileId: file.data.id,
      fileName: file.data.name,
      fileSize: parseInt(file.data.size),
      viewUrl: file.data.webViewLink,
      downloadUrl: file.data.webContentLink,
      thumbnailUrl: file.data.thumbnailLink || `https://drive.google.com/thumbnail?id=${file.data.id}`
    };
  } catch (error) {
    console.error('❌ 檔案上傳失敗:', error);
    
    // 提供更詳細的錯誤訊息
    if (error.code === 403) {
      throw new Error('Google Drive API 權限不足或配額超限');
    } else if (error.code === 401) {
      throw new Error('Google Drive API 認證失敗，請檢查服務帳號設定');
    } else {
      throw new Error('Google Drive 上傳失敗: ' + error.message);
    }
  }
}

/**
 * 檢查 Google Drive 連線狀態
 */
async function checkConnection() {
  try {
    const driveClient = initDrive();
    const response = await driveClient.files.list({
      pageSize: 1,
      fields: 'files(id, name)'
    });
    console.log('✅ Google Drive 連線正常');
    return true;
  } catch (error) {
    console.error('❌ Google Drive 連線失敗:', error.message);
    return false;
  }
}

module.exports = {
  initDrive,
  uploadFile,
  getOrCreateFolder,
  checkConnection
};
