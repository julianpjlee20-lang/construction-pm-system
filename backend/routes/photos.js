const express = require('express');
const router = express.Router();
const multer = require('multer');
const db = require('../db/database');
const { uploadPhoto } = require('../services/googleDrive');
const { v4: uuidv4 } = require('uuid');

// 設定 Multer（檔案上傳）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 限制
  },
  fileFilter: (req, file, cb) => {
    // 只接受圖片檔案
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('只接受圖片檔案'));
    }
  }
});

// POST /api/tasks/:id/photos - 上傳照片
router.post('/:id/photos', upload.single('file'), async (req, res) => {
  try {
    const taskId = req.params.id;
    
    // 檢查任務是否存在
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: '任務不存在',
        message: `找不到 ID 為 ${taskId} 的任務`,
        code: 'TASK_NOT_FOUND'
      });
    }
    
    // 檢查是否有上傳檔案
    if (!req.file) {
      return res.status(400).json({
        error: '缺少檔案',
        message: '請上傳照片檔案',
        code: 'MISSING_FILE'
      });
    }
    
    const { description, uploadedBy } = req.body;
    const projectName = req.body.projectName || '預設專案';
    
    // 上傳到 Google Drive
    const { gdriveFileId, gdriveUrl, thumbnailUrl } = await uploadPhoto(
      taskId,
      req.file,
      projectName
    );
    
    // 儲存到資料庫
    const photoId = uuidv4();
    const timestamp = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO photos (
        id, task_id, gdrive_url, gdrive_file_id, thumbnail_url,
        description, uploaded_by, timestamp
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      photoId,
      taskId,
      gdriveUrl,
      gdriveFileId,
      thumbnailUrl,
      description || null,
      uploadedBy || null,
      timestamp
    );
    
    res.status(201).json({
      id: photoId,
      taskId: taskId,
      gdriveUrl: gdriveUrl,
      gdriveFileId: gdriveFileId,
      thumbnailUrl: thumbnailUrl,
      description: description || null,
      uploadedBy: uploadedBy || null,
      timestamp: timestamp
    });
  } catch (error) {
    console.error('照片上傳失敗:', error);
    
    // 判斷錯誤類型
    if (error.message === '只接受圖片檔案') {
      return res.status(400).json({
        error: '檔案格式錯誤',
        message: '只接受圖片檔案（JPG、PNG、GIF 等）',
        code: 'INVALID_FILE_TYPE'
      });
    }
    
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: '檔案過大',
        message: '檔案大小不可超過 10MB',
        code: 'FILE_TOO_LARGE'
      });
    }
    
    // Google Drive API 錯誤
    if (error.code && error.code >= 400) {
      return res.status(500).json({
        error: '照片上傳失敗',
        message: 'Google Drive API 錯誤',
        code: 'GDRIVE_API_ERROR',
        details: error.message
      });
    }
    
    res.status(500).json({
      error: '照片上傳失敗',
      message: error.message,
      code: 'UPLOAD_FAILED'
    });
  }
});

// GET /api/tasks/:id/photos - 取得任務的照片列表
router.get('/:id/photos', (req, res) => {
  try {
    const taskId = req.params.id;
    
    // 檢查任務是否存在
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(taskId);
    
    if (!task) {
      return res.status(404).json({
        error: '任務不存在',
        message: `找不到 ID 為 ${taskId} 的任務`,
        code: 'TASK_NOT_FOUND'
      });
    }
    
    const photos = db.prepare(`
      SELECT * FROM photos WHERE task_id = ? ORDER BY timestamp DESC
    `).all(taskId);
    
    res.json(photos.map(p => ({
      id: p.id,
      taskId: p.task_id,
      gdriveUrl: p.gdrive_url,
      gdriveFileId: p.gdrive_file_id,
      thumbnailUrl: p.thumbnail_url,
      description: p.description,
      uploadedBy: p.uploaded_by,
      timestamp: p.timestamp
    })));
  } catch (error) {
    console.error('取得照片列表失敗:', error);
    res.status(500).json({
      error: '取得照片列表失敗',
      message: error.message,
      code: 'FETCH_PHOTOS_FAILED'
    });
  }
});

module.exports = router;
