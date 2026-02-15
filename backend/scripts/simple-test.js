// 簡單測試 - 嘗試插入資料
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY,
  {
    db: { schema: 'public' },
    auth: { persistSession: false }
  }
);

async function test() {
  console.log('🧪 Testing direct data insertion...');
  console.log('');

  // 嘗試插入一筆專案
  const { data, error } = await supabase
    .from('projects')
    .insert([{
      name: '測試專案',
      description: '這是一個測試',
      manager: 'Andy'
    }])
    .select();

  if (error) {
    console.log('❌ Insert failed:', error.message);
    console.log('');
    console.log('Error details:', JSON.stringify(error, null, 2));
    
    if (error.message.includes('relation') || error.message.includes('does not exist')) {
      console.log('');
      console.log('⚠️ Tables do not exist! Need to run migration.');
      console.log('');
      console.log('請前往：');
      console.log('https://app.supabase.com/project/igwafmmxfkaorzfimyum/sql/new');
      console.log('');
      console.log('並執行檔案：supabase/migrations/20260215_initial_schema.sql');
    }
    return false;
  }

  console.log('✅ Success! Data inserted:');
  console.log(JSON.stringify(data, null, 2));
  return true;
}

test();
