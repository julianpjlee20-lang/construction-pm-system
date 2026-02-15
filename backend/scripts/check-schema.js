// 檢查資料庫 schema
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

async function checkSchema() {
  console.log('🔍 Checking database schema...');
  console.log('');

  const tables = ['projects', 'tasks', 'photos'];

  for (const table of tables) {
    try {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });

      if (error) {
        console.log(`❌ ${table}: NOT FOUND`);
      } else {
        console.log(`✅ ${table}: EXISTS (${count} rows)`);
      }
    } catch (err) {
      console.log(`❌ ${table}: ERROR - ${err.message}`);
    }
  }

  console.log('');
  
  // 測試插入一筆測試資料
  console.log('🧪 Testing data insertion...');
  
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .limit(1);

    if (error) throw error;

    if (data && data.length > 0) {
      console.log('✅ Found existing data:');
      console.log(JSON.stringify(data[0], null, 2));
    } else {
      console.log('⚠️ No data found, tables may be empty');
    }
  } catch (err) {
    console.error('❌ Error:', err.message);
  }

  console.log('');
}

checkSchema();
