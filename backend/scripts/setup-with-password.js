// 用資料庫密碼直接設定
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';

dotenv.config();

const projectRef = 'igwafmmxfkaorzfimyum';
const password = process.env.SUPABASE_DB_PASSWORD;

// PostgreSQL 連接字串（直接連接，禁用 IPv6）
const client_config = {
  host: `db.${projectRef}.supabase.co`,
  port: 5432,
  user: 'postgres',
  password: password,
  database: 'postgres',
  ssl: { rejectUnauthorized: false },
  connectionTimeoutMillis: 10000
};

console.log('🚀 Setting up Supabase database with full schema...');
console.log('');

const client = new Client(client_config);

const fullSchema = `
-- 補充所有缺少的欄位
ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15,2);
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT '進行中';
ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE projects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_duration INTEGER;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_start_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_end_date DATE;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies TEXT[];
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS budget DECIMAL(15,2);
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_cost DECIMAL(15,2) DEFAULT 0;
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE tasks ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS file_size INTEGER;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS mime_type TEXT;
ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();

-- 建立索引
CREATE INDEX IF NOT EXISTS idx_tasks_project_id ON tasks(project_id);
CREATE INDEX IF NOT EXISTS idx_tasks_status ON tasks(status);
CREATE INDEX IF NOT EXISTS idx_tasks_assignee ON tasks(assignee);
CREATE INDEX IF NOT EXISTS idx_photos_task_id ON photos(task_id);
CREATE INDEX IF NOT EXISTS idx_photos_created_at ON photos(created_at DESC);

-- 更新現有資料
UPDATE projects SET 
  description = '新建辦公大樓',
  location = '台北市南港區',
  total_budget = 50000000,
  planned_start_date = '2026-02-10',
  planned_end_date = '2026-06-30',
  status = '進行中'
WHERE name = '南港辦公室案' AND description IS NULL;

UPDATE tasks SET
  description = '南港辦公室基礎工程',
  assignee = '張師傅',
  planned_start_date = '2026-02-10',
  planned_end_date = '2026-02-20',
  planned_duration = 10,
  actual_start_date = '2026-02-10'
WHERE name = '基礎開挖' AND description IS NULL;

-- 插入更多測試任務
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
WHERE p.name = '南港辦公室案'
AND NOT EXISTS (SELECT 1 FROM tasks WHERE name = '鋼筋綁紮');

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
WHERE p.name = '南港辦公室案'
AND NOT EXISTS (SELECT 1 FROM tasks WHERE name = '混凝土澆置');
`;

async function setup() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!');
    console.log('');
    
    console.log('📊 Executing schema updates...');
    await client.query(fullSchema);
    console.log('✅ Schema updated!');
    console.log('');
    
    // 驗證
    console.log('🔍 Verifying data...');
    
    const { rows: projects } = await client.query('SELECT * FROM projects');
    const { rows: tasks } = await client.query('SELECT * FROM tasks ORDER BY planned_start_date');
    
    console.log(`✅ Projects: ${projects.length}`);
    projects.forEach(p => console.log(`   - ${p.name} (${p.location})`));
    
    console.log('');
    console.log(`✅ Tasks: ${tasks.length}`);
    tasks.forEach(t => console.log(`   - ${t.name} (${t.status}, ${t.progress}%)`));
    
    console.log('');
    console.log('🎉 Database setup complete!');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error(error.stack);
    await client.end();
    process.exit(1);
  }
}

setup();
