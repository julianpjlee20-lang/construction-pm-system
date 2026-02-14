const express = require('express');
const cors = require('cors');
const tasksRouter = require('./routes/tasks');
const photosRouter = require('./routes/photos');

const app = express();

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 請求日誌
app.use((req, res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// 路由
app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', photosRouter);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    service: '工程專案管理系統 API'
  });
});

// 根路徑
app.get('/', (req, res) => {
  res.json({
    message: '工程專案管理系統 API',
    version: '1.0.0',
    endpoints: {
      tasks: {
        'GET /api/tasks': '取得所有任務',
        'GET /api/tasks/:id': '取得單一任務',
        'POST /api/tasks': '建立任務',
        'PUT /api/tasks/:id': '更新任務',
        'DELETE /api/tasks/:id': '刪除任務'
      },
      photos: {
        'GET /api/tasks/:taskId/photos': '取得任務照片',
        'POST /api/tasks/:taskId/photos': '上傳照片',
        'POST /api/tasks/:taskId/photos/batch': '批次上傳照片'
      }
    },
    docs: 'README.md'
  });
});

// 404 處理
app.use((req, res) => {
  res.status(404).json({ error: '找不到此路徑' });
});

// 錯誤處理
app.use((err, req, res, next) => {
  console.error('❌ 伺服器錯誤:', err);
  
  // Multer 錯誤
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({ error: '檔案過大（最大 10MB）' });
    }
    return res.status(400).json({ error: '檔案上傳錯誤: ' + err.message });
  }
  
  res.status(500).json({ 
    error: '伺服器錯誤', 
    message: process.env.NODE_ENV === 'development' ? err.message : '請稍後再試'
  });
});

module.exports = app;
