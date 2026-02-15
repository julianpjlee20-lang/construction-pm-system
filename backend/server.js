const express = require('express');
const cors = require('cors');
const multer = require('multer');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');
const path = require('path');

const db = require('./db');
const { uploadPhoto, STORAGE_MODE } = require('./gdrive');
const { initGoogleDrive, uploadToGoogleDrive, isReady } = require('./config/google-drive');

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

// GET /api/tasks - 列出所有任務（含落後天數計算）
app.get('/api/tasks', (req, res) => {
  try {
    const tasks = db.getAllTasks();

    // 為每個任務計算甘特圖指標
    const enrichedTasks = tasks.map(task => {
      let scheduleStatus = 'unknown';
      let daysDelayed = 0;

      if (task.planned_start_date && task.planned_end_date && task.progress !== null) {
        const now = Date.now();
        const plannedStart = new Date(task.planned_start_date).getTime();
        const plannedEnd = new Date(task.planned_end_date).getTime();
        const totalDuration = plannedEnd - plannedStart;

        if (totalDuration > 0 && now >= plannedStart) {
          const elapsed = Math.min(now - plannedStart, totalDuration);
          const expectedProgress = (elapsed / totalDuration) * 100;
          const progressGap = task.progress - expectedProgress;

          if (progressGap >= 0) {
            scheduleStatus = 'on-track';
            daysDelayed = 0;
          } else if (progressGap >= -10) {
            scheduleStatus = 'warning';
            daysDelayed = Math.round((Math.abs(progressGap) / 100) * (totalDuration / (1000 * 60 * 60 * 24)));
          } else {
            scheduleStatus = 'critical';
            daysDelayed = Math.round((Math.abs(progressGap) / 100) * (totalDuration / (1000 * 60 * 60 * 24)));
          }
        }
      }

      let dependencies = [];
      try {
        dependencies = task.dependencies && task.dependencies !== '' ? JSON.parse(task.dependencies) : [];
      } catch (e) {
        dependencies = [];
      }

      return {
        ...task,
        dependencies,
        scheduleStatus,
        daysDelayed
      };
    });

    res.json(enrichedTasks);
  } catch (error) {
    console.error('GET /api/tasks error:', error);
    res.status(500).json({ error: '無法取得任務列表' });
  }
});

// GET /api/tasks/:id - 取得單一任務（含落後天數計算）
app.get('/api/tasks/:id', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 計算甘特圖相關指標
    let scheduleStatus = 'unknown';
    let daysDelayed = 0;

    if (task.planned_start_date && task.planned_end_date && task.progress !== null) {
      const now = Date.now();
      const plannedStart = new Date(task.planned_start_date).getTime();
      const plannedEnd = new Date(task.planned_end_date).getTime();
      const totalDuration = plannedEnd - plannedStart;

      if (totalDuration > 0 && now >= plannedStart) {
        // 計算預期進度
        const elapsed = Math.min(now - plannedStart, totalDuration);
        const expectedProgress = (elapsed / totalDuration) * 100;

        // 計算落後情況
        const progressGap = task.progress - expectedProgress;

        if (progressGap >= 0) {
          scheduleStatus = 'on-track';
          daysDelayed = 0;
        } else if (progressGap >= -10) {
          scheduleStatus = 'warning';
          daysDelayed = Math.round((Math.abs(progressGap) / 100) * (totalDuration / (1000 * 60 * 60 * 24)));
        } else {
          scheduleStatus = 'critical';
          daysDelayed = Math.round((Math.abs(progressGap) / 100) * (totalDuration / (1000 * 60 * 60 * 24)));
        }
      }
    }

    // 加入計算結果
    let dependencies = [];
    try {
      dependencies = task.dependencies && task.dependencies !== '' ? JSON.parse(task.dependencies) : [];
    } catch (e) {
      console.error('解析 dependencies 失敗:', e);
      dependencies = [];
    }

    const enrichedTask = {
      ...task,
      dependencies,
      photos: task.photos || [],
      scheduleStatus,
      daysDelayed
    };

    res.json(enrichedTask);
  } catch (error) {
    console.error('GET /api/tasks/:id error:', error);
    res.status(500).json({ error: '無法取得任務' });
  }
});

// POST /api/tasks - 建立任務
app.post('/api/tasks', (req, res) => {
  try {
    const {
      name,
      description,
      assignee,
      status,
      plannedStartDate,
      plannedEndDate,
      plannedDuration,
      actualStartDate,
      actualEndDate,
      progress,
      dependencies
    } = req.body;

    if (!name) {
      return res.status(400).json({ error: 'name 欄位為必填' });
    }

    const taskData = {
      id: uuidv4(),
      name,
      description,
      assignee,
      status,
      planned_start_date: plannedStartDate,
      planned_end_date: plannedEndDate,
      planned_duration: plannedDuration,
      actual_start_date: actualStartDate,
      actual_end_date: actualEndDate,
      progress: progress || 0,
      dependencies: dependencies || []
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
    // 轉換 camelCase 到 snake_case
    const {
      plannedStartDate,
      plannedEndDate,
      plannedDuration,
      actualStartDate,
      actualEndDate,
      ...otherFields
    } = req.body;

    const updates = { ...otherFields };
    if (plannedStartDate !== undefined) updates.planned_start_date = plannedStartDate;
    if (plannedEndDate !== undefined) updates.planned_end_date = plannedEndDate;
    if (plannedDuration !== undefined) updates.planned_duration = plannedDuration;
    if (actualStartDate !== undefined) updates.actual_start_date = actualStartDate;
    if (actualEndDate !== undefined) updates.actual_end_date = actualEndDate;

    const task = db.updateTask(req.params.id, updates);
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

// GET /api/tasks/:id/photos - 取得任務照片列表（按時間排序）
app.get('/api/tasks/:id/photos', (req, res) => {
  try {
    const task = db.getTaskById(req.params.id);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    const photos = db.getPhotosByTaskId(req.params.id);
    
    // 格式化輸出（按時間倒序排列）
    const formattedPhotos = photos.map(p => ({
      id: p.id,
      gdriveUrl: p.gdrive_url || p.local_path, // fallback 到本地
      localPath: p.local_path,
      uploadedBy: p.uploaded_by,
      timestamp: p.timestamp || p.uploaded_at,
      description: p.description,
      needsSync: p.needs_sync
    }));

    res.json(formattedPhotos);
  } catch (error) {
    console.error('GET /api/tasks/:id/photos error:', error);
    res.status(500).json({ error: '無法取得照片列表' });
  }
});

// POST /api/tasks/:id/photos - 上傳照片（Phase 2 增強版）
app.post('/api/tasks/:id/photos', upload.single('photo'), async (req, res) => {
  const photoId = uuidv4();
  let localPath = null;
  let gdriveUrl = null;
  let gdriveFileId = null;
  let needsSync = 0;
  let warnings = [];

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
    const timestamp = new Date().toISOString();

    // 1. 壓縮圖片（Sharp，目標 <2MB）
    console.log(`📸 處理照片：${req.file.originalname} (${(req.file.size / 1024 / 1024).toFixed(2)}MB)`);
    const compressedBuffer = await compressImage(req.file.buffer);

    // 2. 生成檔名
    const fileName = generateFileName(req.file.originalname);

    // 3. 上傳到 Google Drive
    if (isReady()) {
      try {
        const result = await uploadToGoogleDrive(
          compressedBuffer,
          fileName,
          task.name,
          req.file.mimetype
        );
        gdriveUrl = result.url;
        gdriveFileId = result.fileId;
        console.log(`✅ Google Drive 上傳成功：${gdriveUrl}`);
      } catch (gdriveError) {
        console.error('⚠️  Google Drive 上傳失敗，fallback 到本地儲存:', gdriveError.message);
        warnings.push('Google Drive 上傳失敗，照片暫存於本地，稍後將自動同步');
        needsSync = 1;
      }
    } else {
      console.log('⚠️  Google Drive 未啟用，使用本地儲存');
      warnings.push('Google Drive 未啟用，照片僅儲存於本地');
      needsSync = 1;
    }

    // 4. 儲存到本地（備份或 fallback）
    try {
      const taskDir = path.join(__dirname, 'uploads', task.name);
      if (!require('fs').existsSync(taskDir)) {
        require('fs').mkdirSync(taskDir, { recursive: true });
      }

      const filePath = path.join(taskDir, fileName);
      require('fs').writeFileSync(filePath, compressedBuffer);
      localPath = `/uploads/${task.name}/${fileName}`;
      console.log(`💾 本地備份完成：${localPath}`);
    } catch (localError) {
      console.error('❌ 本地儲存失敗:', localError.message);
      
      // 如果 Google Drive 也失敗了，這是嚴重錯誤
      if (!gdriveUrl) {
        return res.status(500).json({
          error: '照片上傳失敗',
          message: 'Google Drive 和本地儲存都失敗了',
          details: localError.message
        });
      }
      
      warnings.push('本地備份失敗，僅儲存於 Google Drive');
    }

    // 5. 寫入資料庫
    const photoData = {
      id: photoId,
      task_id: taskId,
      gdrive_url: gdriveUrl,
      gdrive_file_id: gdriveFileId,
      local_path: localPath,
      needs_sync: needsSync,
      description,
      uploaded_by,
      timestamp
    };

    const photo = db.createPhoto(photoData);

    // 6. 回傳結果
    res.status(201).json({
      id: photo.id,
      gdriveUrl: photo.gdrive_url || photo.local_path, // fallback 到本地 URL
      localPath: photo.local_path,
      uploadedBy: photo.uploaded_by,
      timestamp: photo.timestamp,
      description: photo.description,
      needsSync: photo.needs_sync,
      warnings: warnings.length > 0 ? warnings : undefined
    });

  } catch (error) {
    console.error('❌ POST /api/tasks/:id/photos error:', error);
    res.status(500).json({
      error: '上傳照片失敗',
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
    });
  }
});

// PATCH /api/tasks/:taskId/photos/:photoId - 更新照片描述
app.patch('/api/tasks/:taskId/photos/:photoId', async (req, res) => {
  try {
    const { taskId, photoId } = req.params;
    const { description } = req.body;

    // 驗證任務存在
    const task = db.getTaskById(taskId);
    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 驗證照片存在且屬於該任務
    const photos = db.getPhotosByTaskId(taskId);
    const photo = photos.find(p => p.id === photoId);
    
    if (!photo) {
      return res.status(404).json({ error: '照片不存在或不屬於此任務' });
    }

    // 更新描述
    const success = db.updatePhoto(photoId, { description });

    if (!success) {
      return res.status(500).json({ error: '更新失敗' });
    }

    res.json({ success: true, message: '照片描述已更新' });
  } catch (error) {
    console.error('PATCH /api/tasks/:taskId/photos/:photoId error:', error);
    res.status(500).json({ error: '更新照片失敗：' + error.message });
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

// 初始化 Google Drive（非阻塞）
initGoogleDrive().catch(err => {
  console.warn('⚠️  Google Drive 初始化失敗，將使用本地儲存模式');
});

app.listen(PORT, () => {
  console.log('');
  console.log('🚀 工程專案管理系統後端 API - Phase 2');
  console.log(`📡 Server running on http://localhost:${PORT}`);
  console.log(`📦 Storage mode: ${STORAGE_MODE}`);
  console.log('');
  console.log('📚 API Endpoints:');
  console.log('   GET    /api/tasks                      - 列出所有任務（含落後計算）');
  console.log('   POST   /api/tasks                      - 建立任務');
  console.log('   GET    /api/tasks/:id                  - 取得任務（含落後計算）');
  console.log('   PATCH  /api/tasks/:id                  - 更新任務');
  console.log('   DELETE /api/tasks/:id                  - 刪除任務');
  console.log('   GET    /api/tasks/:id/photos           - 取得照片（按時間排序）');
  console.log('   POST   /api/tasks/:id/photos           - 上傳照片（GDrive + 本地備份）');
  console.log('   PATCH  /api/tasks/:taskId/photos/:photoId - 更新照片描述');
  console.log('   DELETE /api/photos/:id                 - 刪除照片');
  console.log('');
  console.log('✨ Phase 2 新功能：');
  console.log('   • Google Drive 整合（自動重試）');
  console.log('   • 照片壓縮（Sharp <2MB）');
  console.log('   • 本地備份 fallback');
  console.log('   • 甘特圖落後天數計算');
  console.log('');
});

module.exports = app;
