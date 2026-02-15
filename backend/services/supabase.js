// Supabase 客戶端服務
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

// 從環境變數讀取配置
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_KEY; // 使用 Service Role Key

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase credentials! Please set SUPABASE_URL and SUPABASE_SERVICE_KEY in .env');
  process.exit(1);
}

// 建立 Supabase 客戶端（後端用 Service Role Key）
export const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// Storage Bucket 名稱
export const STORAGE_BUCKET = process.env.SUPABASE_STORAGE_BUCKET || 'construction-photos';

// 初始化 Storage Bucket
export async function initializeStorage() {
  try {
    // 檢查 bucket 是否存在
    const { data: buckets, error: listError } = await supabase
      .storage
      .listBuckets();

    if (listError) throw listError;

    const bucketExists = buckets.some(b => b.name === STORAGE_BUCKET);

    if (!bucketExists) {
      // 建立 bucket
      const { data, error } = await supabase
        .storage
        .createBucket(STORAGE_BUCKET, {
          public: true, // 公開存取（照片可直接分享）
          fileSizeLimit: 10485760, // 10MB
          allowedMimeTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/heic']
        });

      if (error) throw error;
      console.log(`✅ Created storage bucket: ${STORAGE_BUCKET}`);
    } else {
      console.log(`✅ Storage bucket already exists: ${STORAGE_BUCKET}`);
    }
  } catch (error) {
    console.error('❌ Failed to initialize storage:', error.message);
    throw error;
  }
}

// 測試連接
export async function testConnection() {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('count', { count: 'exact', head: true });

    if (error) throw error;
    console.log('✅ Supabase connection successful!');
    return true;
  } catch (error) {
    console.error('❌ Supabase connection failed:', error.message);
    return false;
  }
}

export default supabase;
