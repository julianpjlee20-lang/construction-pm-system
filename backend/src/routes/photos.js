const express = require('express');
const multer = require('multer');
const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../services/database');
const { uploadFile } = require('../services/googleDrive');
const { compressPhoto } = require('../services/photoCompression');

const router = express.Router();

// 設定 multer（記憶體儲存）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 上傳限制
  },
  fileFilter: (req, file, cb) => {
    // 只接受圖片
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只接受圖片檔案'));
    }
  }
});

/**
 * GET /api/tasks/:taskId/photos - 取得任務的所有照片
 */
router.get('/:taskId/photos', async (req, res) => {
  try {
    const { taskId } = req.params;

    // 檢查任務是否存在
    const task = await getAsync('SELECT id FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 取得照片清單
    const photos = await allAsync(`
      SELECT 
        id, task_id as taskId, timestamp,
        gdrive_url as gdriveUrl,
        gdrive_file_id as gdriveFileId,
        thumbnail_url as thumbnailUrl,
        description, uploaded_by as uploadedBy,
        file_size as fileSize,
        created_at as createdAt
      FROM photos
      WHERE task_id = ?
      ORDER BY timestamp DESC
    `, [taskId]);

    res.json(photos);
  } catch (error) {
    console.error('❌ 取得照片清單失敗:', error);
    res.status(500).json({ error: '取得照片清單失敗', message: error.message });
  }
});

/**
 * POST /api/tasks/:taskId/photos - 上傳照片到任務
 */
router.post('/:taskId/photos', upload.single('photo'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description, uploadedBy } = req.body;

    // 檢查任務是否存在
    const task = await getAsync('SELECT id, name FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 檢查是否有上傳檔案
    if (!req.file) {
      return res.status(400).json({ error: '未上傳照片檔案' });
    }

    console.log(`📸 開始處理照片上傳：${req.file.originalname} (${req.file.size} bytes)`);

    // 1. 壓縮照片
    let photoBuffer;
    try {
      photoBuffer = await compressPhoto(req.file.buffer, {
        maxWidth: 1920,
        maxHeight: 1080,
        quality: 85,
        maxSizeMB: 2
      });
    } catch (error) {
      console.error('⚠️ 壓縮失敗，使用原圖:', error);
      photoBuffer = req.file.buffer;
    }

    // 2. 上傳到 Google Drive
    const timestamp = new Date().toISOString();
    const fileName = `${task.name}_${timestamp.replace(/[:.]/g, '-')}.jpg`;
    
    let driveFile;
    try {
      driveFile = await uploadFile(photoBuffer, {
        fileName,
        mimeType: 'image/jpeg',
        taskId
      });
    } catch (error) {
      console.error('❌ Google Drive 上傳失敗:', error);
      return res.status(500).json({ 
        error: 'Google Drive 上傳失敗', 
        message: error.message,
        hint: '請檢查 .env 設定及 Google Drive API 權限'
      });
    }

    // 3. 儲存到資料庫
    const photoId = `photo-${uuidv4().slice(0, 8)}`;
    
    await runAsync(`
      INSERT INTO photos (
        id, task_id, timestamp,
        gdrive_url, gdrive_file_id, thumbnail_url,
        description, uploaded_by, file_size, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      photoId, taskId, timestamp,
      driveFile.viewUrl, driveFile.fileId, driveFile.thumbnailUrl,
      description, uploadedBy, driveFile.fileSize, timestamp
    ]);

    // 4. 回傳結果
    res.status(201).json({
      id: photoId,
      taskId,
      timestamp,
      gdriveUrl: driveFile.viewUrl,
      gdriveFileId: driveFile.fileId,
      thumbnailUrl: driveFile.thumbnailUrl,
      description,
      uploadedBy,
      fileSize: driveFile.fileSize,
      createdAt: timestamp
    });

    console.log(`✅ 照片上傳成功: ${photoId} → ${driveFile.viewUrl}`);
  } catch (error) {
    console.error('❌ 照片上傳失敗:', error);
    res.status(500).json({ error: '照片上傳失敗', message: error.message });
  }
});

/**
 * POST /api/tasks/:taskId/photos/batch - 批次上傳多張照片
 */
router.post('/:taskId/photos/batch', upload.array('photos', 10), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { uploadedBy } = req.body;

    // 檢查任務是否存在
    const task = await getAsync('SELECT id, name FROM tasks WHERE id = ?', [taskId]);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 檢查是否有上傳檔案
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({ error: '未上傳照片檔案' });
    }

    console.log(`📸 開始批次上傳 ${req.files.length} 張照片`);

    const results = [];
    const errors = [];

    // 依序處理每張照片
    for (let i = 0; i < req.files.length; i++) {
      const file = req.files[i];
      
      try {
        // 壓縮
        const photoBuffer = await compressPhoto(file.buffer, {
          maxWidth: 1920,
          maxHeight: 1080,
          quality: 85,
          maxSizeMB: 2
        });

        // 上傳到 Google Drive
        const timestamp = new Date().toISOString();
        const fileName = `${task.name}_${timestamp.replace(/[:.]/g, '-')}_${i + 1}.jpg`;
        
        const driveFile = await uploadFile(photoBuffer, {
          fileName,
          mimeType: 'image/jpeg',
          taskId
        });

        // 儲存到資料庫
        const photoId = `photo-${uuidv4().slice(0, 8)}`;
        
        await runAsync(`
          INSERT INTO photos (
            id, task_id, timestamp,
            gdrive_url, gdrive_file_id, thumbnail_url,
            description, uploaded_by, file_size, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `, [
          photoId, taskId, timestamp,
          driveFile.viewUrl, driveFile.fileId, driveFile.thumbnailUrl,
          file.originalname, uploadedBy, driveFile.fileSize, timestamp
        ]);

        results.push({
          id: photoId,
          fileName: file.originalname,
          gdriveUrl: driveFile.viewUrl,
          success: true
        });
      } catch (error) {
        console.error(`❌ 照片 ${file.originalname} 上傳失敗:`, error);
        errors.push({
          fileName: file.originalname,
          error: error.message
        });
      }
    }

    res.status(201).json({
      success: results.length,
      failed: errors.length,
      results,
      errors
    });

    console.log(`✅ 批次上傳完成: ${results.length} 成功, ${errors.length} 失敗`);
  } catch (error) {
    console.error('❌ 批次上傳失敗:', error);
    res.status(500).json({ error: '批次上傳失敗', message: error.message });
  }
});

module.exports = router;
