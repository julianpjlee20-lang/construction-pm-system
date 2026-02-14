const sqlite3 = require('sqlite3').verbose();
const path = require('path');

const dbPath = path.join(__dirname, '../../database.sqlite');
const db = new sqlite3.Database(dbPath);

// 初始化資料庫
function initDatabase() {
  return new Promise((resolve, reject) => {
    db.serialize(() => {
      // 建立 tasks 表
      db.run(`
        CREATE TABLE IF NOT EXISTS tasks (
          id TEXT PRIMARY KEY,
          name TEXT NOT NULL,
          description TEXT,
          assignee TEXT,
          status TEXT CHECK(status IN ('待辦', '進行中', '已完成')) DEFAULT '待辦',
          planned_start_date TEXT,
          planned_end_date TEXT,
          actual_start_date TEXT,
          actual_end_date TEXT,
          progress INTEGER CHECK(progress >= 0 AND progress <= 100) DEFAULT 0,
          dependencies TEXT,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          updated_at TEXT DEFAULT CURRENT_TIMESTAMP
        )
      `, (err) => {
        if (err) reject(err);
      });

      // 建立 photos 表
      db.run(`
        CREATE TABLE IF NOT EXISTS photos (
          id TEXT PRIMARY KEY,
          task_id TEXT NOT NULL,
          timestamp TEXT NOT NULL,
          gdrive_url TEXT NOT NULL,
          gdrive_file_id TEXT NOT NULL,
          thumbnail_url TEXT,
          description TEXT,
          uploaded_by TEXT,
          file_size INTEGER,
          created_at TEXT DEFAULT CURRENT_TIMESTAMP,
          FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
        )
      `, (err) => {
        if (err) reject(err);
        else {
          console.log('✅ 資料庫初始化完成');
          resolve();
        }
      });
    });
  });
}

// 查詢輔助函數
function runAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.run(sql, params, function(err) {
      if (err) reject(err);
      else resolve({ lastID: this.lastID, changes: this.changes });
    });
  });
}

function getAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.get(sql, params, (err, row) => {
      if (err) reject(err);
      else resolve(row);
    });
  });
}

function allAsync(sql, params = []) {
  return new Promise((resolve, reject) => {
    db.all(sql, params, (err, rows) => {
      if (err) reject(err);
      else resolve(rows);
    });
  });
}

// 如果直接執行此檔案，則初始化資料庫
if (require.main === module) {
  initDatabase()
    .then(() => {
      console.log('資料庫初始化成功');
      process.exit(0);
    })
    .catch(err => {
      console.error('資料庫初始化失敗:', err);
      process.exit(1);
    });
}

module.exports = {
  db,
  initDatabase,
  runAsync,
  getAsync,
  allAsync
};
