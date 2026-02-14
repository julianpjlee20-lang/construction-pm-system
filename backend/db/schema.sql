-- 任務表
CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  assignee TEXT,
  status TEXT CHECK(status IN ('待辦', '進行中', '已完成')) DEFAULT '待辦',
  
  -- 甘特圖：預計
  planned_start_date TEXT,
  planned_end_date TEXT,
  planned_duration INTEGER,
  
  -- 甘特圖：實際
  actual_start_date TEXT,
  actual_end_date TEXT,
  progress INTEGER CHECK(progress >= 0 AND progress <= 100) DEFAULT 0,
  
  -- 依賴關係（JSON array）
  dependencies TEXT,
  
  created_at TEXT DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT DEFAULT CURRENT_TIMESTAMP
);

-- 照片表
CREATE TABLE IF NOT EXISTS photos (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  gdrive_url TEXT NOT NULL,
  gdrive_file_id TEXT NOT NULL,
  thumbnail_url TEXT,
  description TEXT,
  uploaded_by TEXT,
  timestamp TEXT DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (task_id) REFERENCES tasks(id) ON DELETE CASCADE
);

-- 建立索引以提升查詢效能
CREATE INDEX IF NOT EXISTS idx_photos_task_id ON photos(task_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
