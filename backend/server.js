const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = require('./db');
const { uploadPhoto, STORAGE_MODE } = require('./gdrive');

const app = express();
const PORT = process.env.PORT || 8096;

// ==================== Middleware ====================

app.use(cors({
  origin: ['http://localhost:5173', 'http://localhost:3000'],
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 靜態檔案服務（local storage 模式）
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Multer 設定（記憶體暫存）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB 上限
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只允許上傳圖片檔案 (JPEG, PNG, WebP)'));
    }
  }
});

// ==================== Helper Functions ====================

/**
 * 壓縮圖片（如果超過 2MB）
 */
const compressImage = async (buffer) => {
  const sizeInMB = buffer.length / (1024 * 1024);
  
  if (sizeInMB <= 2) {
    return buffer; // 不需要壓縮
  }

  console.log(`🗜️  壓縮圖片：${sizeInMB.toFixed(2)}MB → 目標 <2MB`);

  // 逐步降低品質直到小於 2MB
  let quality = 85;
  let compressed = buffer;

  while (quality > 20) {
    compressed = await sharp(buffer)
      .jpeg({ quality, mozjpeg: true })
      .toBuffer();

    const newSizeInMB = compressed.length / (1024 * 1024);
    console.log(`   嘗試 quality=${quality} → ${newSizeInMB.toFixed(2)}MB`);

    if (newSizeInMB <= 2) {
      break;
    }

    quality -= 10;
  }

  const finalSize = compressed.length / (1024 * 1024);
  console.log(`✅ 壓縮完成：${finalSize.toFixed(2)}MB`);

  return compressed;
};

/**
 * 生成時間戳檔名
 */
const generateFileName = (originalName) => {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, -5);
  const ext = path.extname(originalName);
  const baseName = path.basename(originalName, ext);
  return `${timestamp}_${baseName}${ext}`;
};

// ==================== Routes ====================

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'OK',
    timestamp: new Date().toISOString(),
    storageMode: STORAGE_MODE
  });
});

// ==================== Tasks API ====================

// GET /api/tasks - 列出所有任務
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.getAllTasks();
    res.json(tasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ error: '無法取得任務列表' });
  }
});

// GET /api/tasks/:id - 取得單一任務
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }
    res.json(task);
  } catch (error) {
    console.error('GET /api/tasks/:id error:', error);
    res.status(500).json({ error: '無法取得任務' });
  }
});

// POST /api/tasks - 建立任務
app.post('/api/tasks', (req, res) => {
  try {
    const { name, description, assignee, status, ...rest } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name 欄位為必填' });
    }

    const taskData = {
      id: uuidv4(),
      name,
      description,
      assignee,
      status,
      ...rest
    };

    const task = db.createTask(taskData);
    res.status(201).json(task);
  } catch (error) {
    console.error('POST /api/tasks error:', error);
    res.status(500).json({ error: '建立任務失敗' });
  }
});

// PATCH /api/tasks/:id - 更新任務
app.patch('/api/tasks/:id', (req, res) => {
  try {
    const task = db.updateTask(req.params.id, req.body);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }
    res.json(task);
  } catch (error) {
    console.error('PATCH /api/tasks/:id error:', error);
    res.status(500).json({ error: '更新任務失敗' });
  }
});

// DELETE /api/tasks/:id - 刪除任務
app.delete('/api/tasks/:id', (req, res) => {
  try {
    const task = db.deleteTask(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }
    res.json({ message: '任務已刪除', task });
  } catch (error) {
    console.error('DELETE /api/tasks/:id error:', error);
    res.status(500).json({ error: '刪除任務失敗' });
  }
});

// ==================== Photos API ====================

// GET /api/tasks/:id/photos - 取得任務照片列表
app.get('/api/tasks/:id/photos', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    const photos = db.getPhotosByTaskId(req.params.id);
    res.json(photos);
  } catch (error) {
    console.error('GET /api/tasks/:id/photos error:', error);
    res.status(500).json({ error: '無法取得照片列表' });
  }
});

// POST /api/tasks/:id/photos - 上傳照片
app.post('/api/tasks/:id/photos', upload.single('photo'), async (req, res) => {
  try {
    const taskId = req.params.id;
    const task = db.getTaskById(taskId);

    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    if (!req.file) {
      return res.status(400).json({ error: '請上傳照片' });
    }

    const { description, uploaded_by } = req.body;

    // 壓縮圖片（如果需要）
    const compressedBuffer = await compressImage(req.file.buffer);

    // 生成檔名
    const fileName = generateFileName(req.file.originalname);

    // 上傳到 Google Drive 或 local storage
    const { url, fileId } = await uploadPhoto(
      compressedBuffer,
      fileName,
      task.name,
      req.file.mimetype
    );

    // 儲存到資料庫
    const photoData = {
      id: uuidv4(),
      task_id: taskId,
      gdrive_url: url,
      gdrive_file_id: fileId,
      description,
      uploaded_by
    };

    const photo = db.createPhoto(photoData);

    res.status(201).json({
      message: '照片上傳成功',
      photo,
      storageMode: STORAGE_MODE
    });
  } catch (error) {
    console.error('POST /api/tasks/:id/photos error:', error);
    res.status(500).json({ error: '上傳照片失敗：' + error.message });
  }
});

// DELETE /api/photos/:id - 刪除照片
app.delete('/api/photos/:id', async (req, res) => {
  try {
    const photoId = req.params.id;
    
    // TODO: 實作從 Google Drive 或 local 刪除實際檔案
    
    const deleted = db.deletePhoto(photoId);
    if (!deleted) {
      return res.status(404).json({ error: '照片不存在' });
    }

    res.json({ message: '照片已刪除' });
  } catch (error) {
    console.error('DELETE /api/photos/:id error:', error);
    res.status(500).json({ error: '刪除照片失敗' });
  }
});

// ==================== 錯誤處理 ====================

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: 'API endpoint 不存在' });
});

// 全域錯誤處理
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '檔案大小不可超過 10MB' });
    }
    return res.status(400).json({ error: err.message });
  }

  res.status(500).json({ error: '伺服器錯誤：' + err.message });
});

// ==================== 啟動伺服器 ====================

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 工程專案管理系統後端 API');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📦 Storage mode: ${STORAGE_MODE}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('   GET    /api/tasks          - 列出所有任務');
  console.log('   POST   /api/tasks          - 建立任務');
  console.log('   GET    /api/tasks/:id      - 取得任務');
  console.log('   PATCH  /api/tasks/:id      - 更新任務');
  console.log('   DELETE /api/tasks/:id      - 刪除任務');
  console.log('   GET    /api/tasks/:id/photos - 取得照片');
  console.log('   POST   /api/tasks/:id/photos - 上傳照片');
  console.log('');
});

module.exports = app;
