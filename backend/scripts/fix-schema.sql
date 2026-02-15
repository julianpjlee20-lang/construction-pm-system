-- 修復資料庫 schema（新增缺少的欄位）

-- Tasks table
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- Photos table
ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- Projects table (如果需要)
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '進行中';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_created_at ON tasks(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_photos_task_id ON photos(task_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);
