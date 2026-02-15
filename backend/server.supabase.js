// 工程專案管理系統後端 - Supabase 版本
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { initializeStorage, testConnection } from './services/supabase.js';
import tasksRouter from './routes/tasks.supabase.js';
import photosRouter from './routes/photos.supabase.js';

// 載入環境變數
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8096;

// 中介軟體
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// 路由
app.use('/api/tasks', tasksRouter);
app.use('/api/tasks', photosRouter);

// 健康檢查
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    service: 'construction-pm-backend',
    version: '2.0.0-supabase'
  });
});

// 根路由
app.get('/', (req, res) => {
  res.json({
    name: '工程專案管理系統 API',
    version: '2.0.0',
    database: 'Supabase PostgreSQL',
    storage: 'Supabase Storage + Google Drive Backup',
    endpoints: {
      tasks: '/api/tasks',
      photos: '/api/tasks/:taskId/photos',
      health: '/health'
    }
  });
});

// 錯誤處理中介軟體
app.use((err, req, res, next) => {
  console.error('Error:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 啟動伺服器
async function startServer() {
  try {
    console.log('🚀 Starting Construction PM Backend (Supabase)...');
    
    // 測試 Supabase 連接
    console.log('📡 Testing Supabase connection...');
    const connected = await testConnection();
    
    if (!connected) {
      throw new Error('Failed to connect to Supabase. Please check your credentials in .env');
    }

    // 初始化 Storage
    console.log('📦 Initializing Supabase Storage...');
    await initializeStorage();

    // 啟動伺服器
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ Server is running!');
      console.log(`📍 URL: http://localhost:${PORT}`);
      console.log(`🏥 Health: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📋 API Endpoints:');
      console.log(`   GET    /api/tasks              - 取得所有任務`);
      console.log(`   POST   /api/tasks              - 新增任務`);
      console.log(`   PUT    /api/tasks/:id          - 更新任務`);
      console.log(`   PATCH  /api/tasks/:id/status   - 更新狀態`);
      console.log(`   PATCH  /api/tasks/:id/progress - 更新進度`);
      console.log(`   POST   /api/tasks/:id/photos   - 上傳照片`);
      console.log(`   GET    /api/tasks/:id/photos   - 取得照片`);
      console.log('');
      console.log('💾 Database: Supabase PostgreSQL');
      console.log('📸 Storage: Supabase Storage + Google Drive Backup');
      console.log('');
    });

  } catch (error) {
    console.error('❌ Failed to start server:', error.message);
    console.error('');
    console.error('Please check:');
    console.error('1. SUPABASE_URL is set in .env');
    console.error('2. SUPABASE_SERVICE_KEY is set in .env');
    console.error('3. Database schema is migrated');
    console.error('');
    process.exit(1);
  }
}

startServer();

export default app;
