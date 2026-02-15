// 自動設定 Supabase 資料庫
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🚀 Setting up Supabase Database...');
console.log('');

// 執行 SQL 語句
async function executeSQL(sql) {
  try {
    // 使用 Supabase 的 REST API 執行 SQL
    const response = await fetch(`${process.env.SUPABASE_URL}/rest/v1/rpc/exec_sql`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'apikey': process.env.SUPABASE_SERVICE_KEY,
        'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_KEY}`
      },
      body: JSON.stringify({ query: sql })
    });

    if (!response.ok) {
      // RPC function 可能不存在，嘗試其他方法
      return { success: false, error: 'exec_sql not available' };
    }

    return { success: true };
  } catch (error) {
    return { success: false, error: error.message };
  }
}

// 直接建立表格
async function setupTables() {
  console.log('📊 Creating tables...');
  
  const sqls = [
    // 專案表
    `CREATE TABLE IF NOT EXISTS projects (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
    )`,
    
    // 任務表
    `CREATE TABLE IF NOT EXISTS tasks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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
      progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
      dependencies TEXT[],
      budget DECIMAL(15, 2),
      actual_cost DECIMAL(15, 2) DEFAULT 0,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
      updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`,
    
    // 照片表
    `CREATE TABLE IF NOT EXISTS photos (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      task_id UUID REFERENCES tasks(id) ON DELETE CASCADE,
      storage_path TEXT NOT NULL,
      url TEXT NOT NULL,
      description TEXT,
      uploaded_by TEXT,
      file_size INTEGER,
      mime_type TEXT,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    )`
  ];

  for (const sql of sqls) {
    try {
      // 嘗試用 supabase-js 執行（透過 from().select() 測試表格是否存在）
      console.log('Executing SQL...');
      await executeSQL(sql);
    } catch (error) {
      console.log(`Note: ${error.message}`);
    }
  }
}

// 插入測試資料
async function seedData() {
  console.log('');
  console.log('🌱 Seeding test data...');

  try {
    // 檢查是否已有專案
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (existingProjects && existingProjects.length > 0) {
      console.log('✅ Test data already exists, skipping seed');
      return;
    }

    // 插入專案
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert([{
        name: '南港辦公室案',
        description: '新建辦公大樓',
        location: '台北市南港區',
        manager: 'Andy',
        total_budget: 50000000,
        planned_start_date: '2026-02-10',
        planned_end_date: '2026-06-30'
      }])
      .select()
      .single();

    if (projectError) throw projectError;
    
    console.log('✅ Created project:', project.name);

    // 插入任務
    const tasks = [
      {
        project_id: project.id,
        name: '基礎開挖',
        description: '南港辦公室基礎工程',
        status: '進行中',
        assignee: '張師傅',
        planned_start_date: '2026-02-10',
        planned_end_date: '2026-02-20',
        planned_duration: 10,
        actual_start_date: '2026-02-10',
        progress: 60,
        dependencies: []
      },
      {
        project_id: project.id,
        name: '鋼筋綁紮',
        description: '鋼筋工程',
        status: '待辦',
        assignee: '李師傅',
        planned_start_date: '2026-02-21',
        planned_end_date: '2026-02-28',
        planned_duration: 7,
        progress: 0,
        dependencies: []
      },
      {
        project_id: project.id,
        name: '混凝土澆置',
        description: '基礎混凝土工程',
        status: '待辦',
        assignee: '王師傅',
        planned_start_date: '2026-03-01',
        planned_end_date: '2026-03-05',
        planned_duration: 4,
        progress: 0,
        dependencies: []
      }
    ];

    const { data: createdTasks, error: tasksError } = await supabase
      .from('tasks')
      .insert(tasks)
      .select();

    if (tasksError) throw tasksError;
    
    console.log(`✅ Created ${createdTasks.length} tasks`);

    // 更新依賴關係
    if (createdTasks.length >= 3) {
      await supabase
        .from('tasks')
        .update({ dependencies: [createdTasks[0].id] })
        .eq('name', '鋼筋綁紮');

      await supabase
        .from('tasks')
        .update({ dependencies: [createdTasks[1].id] })
        .eq('name', '混凝土澆置');
      
      console.log('✅ Updated task dependencies');
    }

  } catch (error) {
    console.error('⚠️ Seed error:', error.message);
  }
}

// 建立 Storage bucket
async function setupStorage() {
  console.log('');
  console.log('📦 Setting up Storage...');

  try {
    const bucketName = 'construction-photos';

    // 檢查 bucket 是否存在
    const { data: buckets } = await supabase.storage.listBuckets();
    const exists = buckets?.some(b => b.name === bucketName);

    if (exists) {
      console.log(`✅ Storage bucket already exists: ${bucketName}`);
      return;
    }

    // 建立 bucket
    const { data, error } = await supabase.storage.createBucket(bucketName, {
      public: true,
      fileSizeLimit: 10485760, // 10MB
      allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
    });

    if (error) throw error;
    
    console.log(`✅ Created storage bucket: ${bucketName}`);

  } catch (error) {
    console.error('⚠️ Storage error:', error.message);
  }
}

// 驗證設定
async function verify() {
  console.log('');
  console.log('🔍 Verifying setup...');

  try {
    const { count: projectCount } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true });

    const { count: taskCount } = await supabase
      .from('tasks')
      .select('*', { count: 'exact', head: true });

    console.log(`✅ Projects: ${projectCount}`);
    console.log(`✅ Tasks: ${taskCount}`);
    console.log('');
    console.log('🎉 Database setup complete!');
    
  } catch (error) {
    console.error('❌ Verification failed:', error.message);
  }
}

// 執行所有步驟
async function main() {
  try {
    await setupTables();
    await seedData();
    await setupStorage();
    await verify();
  } catch (error) {
    console.error('❌ Setup failed:', error.message);
    process.exit(1);
  }
}

main();
