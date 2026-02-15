-- 工程專案管理系統 - Supabase Schema
-- 建立時間：2026-02-15

-- 啟用 UUID 擴充
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 專案表
CREATE TABLE projects (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  name TEXT NOT NULL,
  description TEXT,
  location TEXT,
  manager TEXT,
  total_budget DECIMAL(15, 2),
  planned_start_date DATE,
  planned_end_date DATE,
  status TEXT DEFAULT '進行中',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 任務表
CREATE TABLE tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT '待辦', -- 待辦、進行中、已完成
  assignee TEXT,
  
  -- 甘特圖：預計進度
  planned_start_date DATE,
  planned_end_date DATE,
  planned_duration INTEGER,
  
  -- 甘特圖：實際進度
  actual_start_date DATE,
  actual_end_date DATE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  
  -- 依賴關係
  dependencies TEXT[], -- Array of task IDs
  
  -- 預算
  budget DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2) DEFAULT 0,
  
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 照片表
CREATE TABLE photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL, -- Supabase Storage path
  url TEXT NOT NULL, -- Public URL
  description TEXT,
  uploaded_by TEXT,
  file_size INTEGER, -- bytes
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 索引（加速查詢）
CREATE INDEX idx_tasks_project_id ON tasks(project_id);
CREATE INDEX idx_tasks_status ON tasks(status);
CREATE INDEX idx_tasks_assignee ON tasks(assignee);
CREATE INDEX idx_photos_task_id ON photos(task_id);
CREATE INDEX idx_photos_created_at ON photos(created_at DESC);

-- 自動更新 updated_at 的觸發器
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_projects_updated_at BEFORE UPDATE ON projects
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_tasks_updated_at BEFORE UPDATE ON tasks
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Row Level Security (RLS)
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

-- 暫時允許所有人存取（之後可加入使用者認證）
CREATE POLICY "Allow all access to projects" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all access to tasks" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all access to photos" ON photos FOR ALL USING (true);

-- 初始測試資料
INSERT INTO projects (name, description, location, manager, total_budget, planned_start_date, planned_end_date)
VALUES ('南港辦公室案', '新建辦公大樓', '台北市南港區', 'Andy', 50000000, '2026-02-10', '2026-06-30');

INSERT INTO tasks (project_id, name, description, status, assignee, planned_start_date, planned_end_date, planned_duration, progress, dependencies)
SELECT 
  p.id,
  '基礎開挖',
  '南港辦公室基礎工程',
  '進行中',
  '張師傅',
  '2026-02-10',
  '2026-02-20',
  10,
  60,
  ARRAY[]::TEXT[]
FROM projects p
WHERE p.name = '南港辦公室案';

INSERT INTO tasks (project_id, name, description, status, assignee, planned_start_date, planned_end_date, planned_duration, progress, dependencies)
SELECT 
  p.id,
  '鋼筋綁紮',
  '鋼筋工程',
  '待辦',
  '李師傅',
  '2026-02-21',
  '2026-02-28',
  7,
  0,
  ARRAY[(SELECT id::TEXT FROM tasks WHERE name = '基礎開挖' LIMIT 1)]
FROM projects p
WHERE p.name = '南港辦公室案';

INSERT INTO tasks (project_id, name, description, status, assignee, planned_start_date, planned_end_date, planned_duration, progress, dependencies)
SELECT 
  p.id,
  '混凝土澆置',
  '基礎混凝土工程',
  '待辦',
  '王師傅',
  '2026-03-01',
  '2026-03-05',
  4,
  0,
  ARRAY[(SELECT id::TEXT FROM tasks WHERE name = '鋼筋綁紮' LIMIT 1)]
FROM projects p
WHERE p.name = '南港辦公室案';
