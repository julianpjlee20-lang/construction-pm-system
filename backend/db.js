const Database = require('better-sqlite3');
const path = require('path');

// 初始化資料庫
const dbPath = path.join(__dirname, 'construction-pm.db');
const db = new Database(dbPath);

// 啟用外鍵約束
db.pragma('foreign_keys = ON');

// 建立資料表
const initDB = () => {
  // Tasks 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS tasks (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      assignee TEXT,
      status TEXT DEFAULT 'todo',
      
      planned_start_date TEXT,
      planned_end_date TEXT,
      planned_duration INTEGER,
      
      actual_start_date TEXT,
      actual_end_date TEXT,
      progress INTEGER DEFAULT 0,
      
      dependencies TEXT,
      
      created_at TEXT DEFAULT CURRENT_TIMESTAMP,
      updated_at TEXT DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // Photos 表
  db.exec(`
    CREATE TABLE IF NOT EXISTS photos (
      id TEXT PRIMARY KEY,
      task_id TEXT NOT NULL,
      gdrive_url TEXT NOT NULL,
      gdrive_file_id TEXT,
      description TEXT,
      uploaded_by TEXT,
      uploaded_at TEXT DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
    )
  `);

  console.log('✅ Database initialized');
};

// ==================== Tasks CRUD ====================

const getAllTasks = () => {
  const stmt = db.prepare('SELECT * FROM tasks ORDER BY created_at DESC');
  const tasks = stmt.all();
  
  // 為每個任務附加照片
  const photosStmt = db.prepare('SELECT * FROM photos WHERE task_id = ?');
  return tasks.map(task => ({
    ...task,
    dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
    photos: photosStmt.all(task.id)
  }));
};

const getTaskById = (id) => {
  const stmt = db.prepare('SELECT * FROM tasks WHERE id = ?');
  const task = stmt.get(id);
  
  if (!task) return null;
  
  const photosStmt = db.prepare('SELECT * FROM photos WHERE task_id = ?');
  return {
    ...task,
    dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
    photos: photosStmt.all(id)
  };
};

const createTask = (taskData) => {
  const {
    id,
    name,
    description = null,
    assignee = null,
    status = 'todo',
    planned_start_date = null,
    planned_end_date = null,
    planned_duration = null,
    actual_start_date = null,
    actual_end_date = null,
    progress = 0,
    dependencies = []
  } = taskData;

  const stmt = db.prepare(`
    INSERT INTO tasks (
      id, name, description, assignee, status,
      planned_start_date, planned_end_date, planned_duration,
      actual_start_date, actual_end_date, progress, dependencies
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    id,
    name,
    description,
    assignee,
    status,
    planned_start_date,
    planned_end_date,
    planned_duration,
    actual_start_date,
    actual_end_date,
    progress,
    JSON.stringify(dependencies)
  );

  return getTaskById(id);
};

const updateTask = (id, updates) => {
  const task = getTaskById(id);
  if (!task) return null;

  const allowedFields = [
    'name', 'description', 'assignee', 'status',
    'planned_start_date', 'planned_end_date', 'planned_duration',
    'actual_start_date', 'actual_end_date', 'progress', 'dependencies'
  ];

  const setClause = [];
  const values = [];

  Object.keys(updates).forEach(key => {
    if (allowedFields.includes(key)) {
      setClause.push(`${key} = ?`);
      values.push(key === 'dependencies' ? JSON.stringify(updates[key]) : updates[key]);
    }
  });

  if (setClause.length === 0) return task;

  setClause.push('updated_at = CURRENT_TIMESTAMP');
  values.push(id);

  const stmt = db.prepare(`
    UPDATE tasks SET ${setClause.join(', ')} WHERE id = ?
  `);

  stmt.run(...values);
  return getTaskById(id);
};

const deleteTask = (id) => {
  const task = getTaskById(id);
  if (!task) return null;

  const stmt = db.prepare('DELETE FROM tasks WHERE id = ?');
  stmt.run(id);
  
  return task;
};

// ==================== Photos CRUD ====================

const getPhotosByTaskId = (taskId) => {
  const stmt = db.prepare('SELECT * FROM photos WHERE task_id = ? ORDER BY uploaded_at DESC');
  return stmt.all(taskId);
};

const createPhoto = (photoData) => {
  const {
    id,
    task_id,
    gdrive_url,
    gdrive_file_id = null,
    description = null,
    uploaded_by = null
  } = photoData;

  const stmt = db.prepare(`
    INSERT INTO photos (id, task_id, gdrive_url, gdrive_file_id, description, uploaded_by)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  stmt.run(id, task_id, gdrive_url, gdrive_file_id, description, uploaded_by);

  const getStmt = db.prepare('SELECT * FROM photos WHERE id = ?');
  return getStmt.get(id);
};

const deletePhoto = (id) => {
  const stmt = db.prepare('DELETE FROM photos WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
};

// 初始化資料庫
initDB();

module.exports = {
  db,
  getAllTasks,
  getTaskById,
  createTask,
  updateTask,
  deleteTask,
  getPhotosByTaskId,
  createPhoto,
  deletePhoto
};
