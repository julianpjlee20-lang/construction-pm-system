// 補充完整欄位
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

console.log('🔧 Adding missing columns...');
console.log('');

async function addColumns() {
  // 直接插入測試資料來驗證
  try {
    // 先測試基本插入
    const { data: project, error } = await supabase
      .from('projects')
      .insert([{ name: '南港辦公室案', manager: 'Andy' }])
      .select()
      .single();

    if (error) throw error;
    
    console.log('✅ Projects table OK');
    console.log('Project ID:', project.id);
    console.log('');

    // 插入任務
    const { data: task, error: taskError } = await supabase
      .from('tasks')
      .insert([{
        project_id: project.id,
        name: '基礎開挖',
        status: '進行中',
        progress: 60
      }])
      .select()
      .single();

    if (taskError) throw taskError;
    
    console.log('✅ Tasks table OK');
    console.log('Task ID:', task.id);
    console.log('');
    
    console.log('🎉 Database is ready!');
    console.log('');
    
    // 顯示資料
    const { data: allTasks } = await supabase
      .from('tasks')
      .select('*');
    
    console.log(`📊 Total tasks: ${allTasks.length}`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
    console.log('');
    console.log('⚠️ Please add missing columns manually in SQL Editor:');
    console.log('');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS description TEXT;');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS location TEXT;');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS total_budget DECIMAL(15,2);');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_start_date DATE;');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS planned_end_date DATE;');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS status TEXT DEFAULT \'進行中\';');
    console.log('ALTER TABLE projects ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();');
    console.log('');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS description TEXT;');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS assignee TEXT;');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_start_date DATE;');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS planned_end_date DATE;');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS actual_start_date DATE;');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS dependencies TEXT[];');
    console.log('ALTER TABLE tasks ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();');
    console.log('');
    console.log('ALTER TABLE photos ADD COLUMN IF NOT EXISTS description TEXT;');
    console.log('ALTER TABLE photos ADD COLUMN IF NOT EXISTS uploaded_by TEXT;');
    console.log('ALTER TABLE photos ADD COLUMN IF NOT EXISTS storage_path TEXT;');
    console.log('ALTER TABLE photos ADD COLUMN IF NOT EXISTS created_at TIMESTAMPTZ DEFAULT NOW();');
  }
}

addColumns();
