// 測試 Supabase 連接
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

console.log('🧪 Testing Supabase Connection...');
console.log('');
console.log(`URL: ${supabaseUrl}`);
console.log(`Service Key: ${supabaseServiceKey.substring(0, 20)}...`);
console.log('');

const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 測試連接
async function test() {
  try {
    // 測試簡單查詢
    const { data, error } = await supabase
      .from('tasks')
      .select('count', { count: 'exact', head: true });

    if (error) {
      if (error.message.includes('relation') || error.message.includes('does not exist')) {
        console.log('⚠️ Tables not created yet (this is expected)');
        console.log('✅ Connection successful! Ready for migration.');
        console.log('');
        return true;
      }
      throw error;
    }

    console.log('✅ Connection successful!');
    console.log(`✅ Tasks table exists (${data} rows)`);
    console.log('');
    return true;

  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    console.log('');
    return false;
  }
}

test().then(success => {
  process.exit(success ? 0 : 1);
});
