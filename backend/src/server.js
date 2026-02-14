require('dotenv').config();
const app = require('./app');
const { initDatabase } = require('./services/database');
const { checkConnection } = require('./services/googleDrive');

const PORT = process.env.PORT || 8096;

async function startServer() {
  try {
    console.log('🚀 正在啟動工程專案管理系統後端...');
    
    // 1. 初始化資料庫
    console.log('📊 初始化資料庫...');
    await initDatabase();
    
    // 2. 檢查 Google Drive 連線（可選）
    if (process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL) {
      console.log('☁️  檢查 Google Drive 連線...');
      const connected = await checkConnection();
      if (!connected) {
        console.warn('⚠️  Google Drive 連線失敗，照片上傳功能可能無法使用');
        console.warn('   請檢查 .env 檔案中的 Google 服務帳號設定');
      }
    } else {
      console.warn('⚠️  未設定 Google Drive 服務帳號，照片上傳功能將無法使用');
      console.warn('   請在 .env 檔案中設定 GOOGLE_SERVICE_ACCOUNT_EMAIL 和 GOOGLE_PRIVATE_KEY');
    }
    
    // 3. 啟動伺服器
    app.listen(PORT, () => {
      console.log('');
      console.log('✅ 伺服器啟動成功！');
      console.log(`📍 位址: http://localhost:${PORT}`);
      console.log(`📚 API 文件: http://localhost:${PORT}/`);
      console.log(`🏥 健康檢查: http://localhost:${PORT}/health`);
      console.log('');
      console.log('📝 可用 endpoints:');
      console.log('   GET    /api/tasks');
      console.log('   POST   /api/tasks');
      console.log('   GET    /api/tasks/:id');
      console.log('   PUT    /api/tasks/:id');
      console.log('   DELETE /api/tasks/:id');
      console.log('   GET    /api/tasks/:taskId/photos');
      console.log('   POST   /api/tasks/:taskId/photos');
      console.log('   POST   /api/tasks/:taskId/photos/batch');
      console.log('');
      console.log('按 Ctrl+C 停止伺服器');
    });
  } catch (error) {
    console.error('❌ 伺服器啟動失敗:', error);
    process.exit(1);
  }
}

// 優雅關閉
process.on('SIGTERM', () => {
  console.log('收到 SIGTERM 信號，正在關閉伺服器...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\n收到 SIGINT 信號，正在關閉伺服器...');
  process.exit(0);
});

startServer();
