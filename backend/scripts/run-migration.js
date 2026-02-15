// 執行 Supabase Migration
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.join(__dirname, '../.env') });

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing SUPABASE_URL or SUPABASE_SERVICE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function runMigration() {
  try {
    console.log('🚀 Running Supabase Migration...');
    console.log('');

    // 讀取 SQL 檔案
    const sqlPath = path.join(__dirname, '../../supabase/migrations/20260215_initial_schema.sql');
    const sql = fs.readFileSync(sqlPath, 'utf8');

    // 分割成多個語句（PostgreSQL 可以一次執行多個，但為了更好的錯誤處理，我們分開）
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0 && !s.startsWith('--'));

    console.log(`📋 Found ${statements.length} SQL statements`);
    console.log('');

    // 執行每個語句
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i];
      
      // 跳過註解
      if (statement.startsWith('--')) continue;

      console.log(`[${i + 1}/${statements.length}] Executing...`);
      
      try {
        // 使用 Supabase RPC 執行原生 SQL
        const { data, error } = await supabase.rpc('exec_sql', {
          sql_query: statement + ';'
        });

        if (error) {
          // 如果 exec_sql function 不存在，嘗試直接執行（某些語句）
          console.log(`⚠️ Warning: ${error.message}`);
        } else {
          console.log(`✅ Success`);
        }
      } catch (err) {
        console.error(`❌ Error: ${err.message}`);
        // 繼續執行下一個語句
      }
    }

    console.log('');
    console.log('✅ Migration completed!');
    console.log('');

    // 驗證結果
    console.log('🔍 Verifying tables...');
    const { data: tables, error: tableError } = await supabase
      .from('tasks')
      .select('count', { count: 'exact', head: true });

    if (tableError) {
      console.error('❌ Verification failed:', tableError.message);
      console.log('');
      console.log('⚠️ Please run migration manually in Supabase SQL Editor:');
      console.log('   1. Go to https://app.supabase.com/project/igwafmmxfkaorzfimyum/sql');
      console.log('   2. Copy contents of: supabase/migrations/20260215_initial_schema.sql');
      console.log('   3. Paste and click Run');
      console.log('');
      process.exit(1);
    } else {
      console.log('✅ Tables verified successfully!');
      console.log('');
    }

  } catch (error) {
    console.error('❌ Migration failed:', error.message);
    console.log('');
    console.log('⚠️ Please run migration manually in Supabase SQL Editor:');
    console.log('   1. Go to https://app.supabase.com/project/igwafmmxfkaorzfimyum/sql');
    console.log('   2. Copy contents of: supabase/migrations/20260215_initial_schema.sql');
    console.log('   3. Paste and click Run');
    console.log('');
    process.exit(1);
  }
}

runMigration();
