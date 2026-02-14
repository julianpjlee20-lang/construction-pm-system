const Database = require('better-sqlite3');
const fs = require('fs');
const path = require('path');

const dbPath = process.env.DB_PATH || path.join(__dirname, 'tasks.db');
const db = new Database(dbPath);

// 啟用 foreign keys
db.pragma('foreign_keys = ON');

// 初始化資料庫
function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);
  console.log('✅ 資料庫初始化完成');
}

// 執行初始化
initializeDatabase();

module.exports = db;
