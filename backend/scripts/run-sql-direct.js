// 直接用 PostgreSQL 執行 SQL
import pkg from 'pg';
const { Client } = pkg;
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

// 從 Supabase URL 提取 project ref
const projectRef = process.env.SUPABASE_URL.match(/https:\/\/(.+?)\.supabase\.co/)[1];

// 構建連接字串（使用 IPv6 pooler）
const connectionString = `postgresql://postgres.${projectRef}:${process.env.SUPABASE_SERVICE_KEY}@aws-0-ap-southeast-1.pooler.supabase.com:6543/postgres`;

console.log('🔌 Connecting to Supabase PostgreSQL...');
console.log(`Project: ${projectRef}`);
console.log('');

const client = new Client({
  connectionString,
  ssl: { rejectUnauthorized: false }
});

const sql = `
-- 工程專案管理系統 Schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

CREATE TABLE IF NOT EXISTS projects (
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

CREATE TABLE IF NOT EXISTS tasks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  project_id UUID REFERENCES projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  status TEXT DEFAULT '待辦',
  assignee TEXT,
  planned_start_date DATE,
  planned_end_date DATE,
  planned_duration INTEGER,
  actual_start_date DATE,
  actual_end_date DATE,
  progress INTEGER DEFAULT 0,
  dependencies TEXT[],
  budget DECIMAL(15, 2),
  actual_cost DECIMAL(15, 2) DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS photos (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
  storage_path TEXT NOT NULL,
  url TEXT NOT NULL,
  description TEXT,
  uploaded_by TEXT,
  file_size INTEGER,
  mime_type TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE tasks ENABLE ROW LEVEL SECURITY;
ALTER TABLE photos ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Allow all" ON projects;
DROP POLICY IF EXISTS "Allow all" ON tasks;
DROP POLICY IF EXISTS "Allow all" ON photos;

CREATE POLICY "Allow all" ON projects FOR ALL USING (true);
CREATE POLICY "Allow all" ON tasks FOR ALL USING (true);
CREATE POLICY "Allow all" ON photos FOR ALL USING (true);

INSERT INTO projects (name, description, location, manager, total_budget, planned_start_date, planned_end_date)
SELECT '南港辦公室案', '新建辦公大樓', '台北市南港區', 'Andy', 50000000, '2026-02-10', '2026-06-30'
WHERE NOT EXISTS (SELECT 1 FROM projects WHERE name = '南港辦公室案');

INSERT INTO tasks (project_id, name, status, assignee, planned_start_date, planned_end_date, progress)
SELECT p.id, '基礎開挖', '進行中', '張師傅', '2026-02-10', '2026-02-20', 60
FROM projects p
WHERE p.name = '南港辦公室案'
AND NOT EXISTS (SELECT 1 FROM tasks WHERE name = '基礎開挖');
`;

async function run() {
  try {
    await client.connect();
    console.log('✅ Connected to PostgreSQL!');
    console.log('');
    
    console.log('🚀 Executing SQL migration...');
    await client.query(sql);
    
    console.log('✅ Migration completed!');
    console.log('');
    
    // 驗證
    console.log('🔍 Verifying tables...');
    const result = await client.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      AND table_name IN ('projects', 'tasks', 'photos')
      ORDER BY table_name
    `);
    
    console.log(`✅ Found ${result.rows.length} tables:`);
    result.rows.forEach(row => console.log(`   - ${row.table_name}`));
    console.log('');
    
    // 檢查資料
    const { rows: projects } = await client.query('SELECT COUNT(*) FROM projects');
    const { rows: tasks } = await client.query('SELECT COUNT(*) FROM tasks');
    console.log(`📊 Data:`);
    console.log(`   - Projects: ${projects[0].count}`);
    console.log(`   - Tasks: ${tasks[0].count}`);
    console.log('');
    console.log('🎉 Database setup complete!');
    
    await client.end();
    process.exit(0);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.error('');
    if (error.message.includes('password')) {
      console.log('⚠️ Connection failed with service key as password.');
      console.log('');
      console.log('Please run migration manually in Supabase SQL Editor:');
      console.log('https://app.supabase.com/project/igwafmmxfkaorzfimyum/sql/new');
    }
    await client.end();
    process.exit(1);
  }
}

run();
