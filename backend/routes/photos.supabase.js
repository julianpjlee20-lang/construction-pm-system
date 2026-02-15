// Photos API - Supabase Storage + Google Drive 備份
import express from 'express';
import multer from 'multer';
import sharp from 'sharp';
import { supabase, STORAGE_BUCKET } from '../services/supabase.js';
import { v4 as uuidv4 } from 'uuid';

const router = express.Router();

// Multer 設定（記憶體儲存）
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('只支援 JPEG, PNG, WebP, HEIC 格式的照片'));
    }
  }
});

// 壓縮照片
async function compressImage(buffer, targetSizeMB = 2) {
  const targetSizeBytes = targetSizeMB * 1024 * 1024;
  let quality = 85;
  let compressed = buffer;

  // 先轉換為 JPEG 並調整品質
  while (compressed.length > targetSizeBytes && quality > 20) {
    compressed = await sharp(buffer)
      .jpeg({ quality, progressive: true })
      .toBuffer();
    
    quality -= 5;
  }

  // 如果還是太大，縮小尺寸
  if (compressed.length > targetSizeBytes) {
    const metadata = await sharp(buffer).metadata();
    const scale = Math.sqrt(targetSizeBytes / compressed.length);
    const newWidth = Math.floor(metadata.width * scale);

    compressed = await sharp(buffer)
      .resize(newWidth)
      .jpeg({ quality: 80, progressive: true })
      .toBuffer();
  }

  return compressed;
}

// POST /api/tasks/:taskId/photos - 上傳照片
router.post('/:taskId/photos', upload.single('photo'), async (req, res) => {
  try {
    const { taskId } = req.params;
    const { description } = req.body;

    if (!req.file) {
      return res.status(400).json({ error: 'No photo uploaded' });
    }

    // 1. 壓縮照片
    const compressedImage = await compressImage(req.file.buffer);
    const fileSize = compressedImage.length;

    // 2. 產生唯一檔名
    const fileExt = req.file.mimetype.split('/')[1] || 'jpg';
    const fileName = `${taskId}/${uuidv4()}.${fileExt}`;

    // 3. 上傳到 Supabase Storage
    const { data: uploadData, error: uploadError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .upload(fileName, compressedImage, {
        contentType: 'image/jpeg',
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) throw uploadError;

    // 4. 取得公開 URL
    const { data: { publicUrl } } = supabase
      .storage
      .from(STORAGE_BUCKET)
      .getPublicUrl(fileName);

    // 5. 儲存照片記錄到資料庫
    const { data: photoData, error: dbError } = await supabase
      .from('photos')
      .insert([{
        task_id: taskId,
        storage_path: fileName,
        url: publicUrl,
        description: description || '',
        uploaded_by: req.body.uploadedBy || '施工人員',
        file_size: fileSize,
        mime_type: 'image/jpeg'
      }])
      .select()
      .single();

    if (dbError) throw dbError;

    // 6. TODO: 非同步備份到 Google Drive（在背景執行）
    // await backupToGoogleDrive(fileName, compressedImage, taskId);

    res.status(201).json({
      ...photoData,
      message: '照片上傳成功'
    });

  } catch (error) {
    console.error('Error uploading photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// GET /api/tasks/:taskId/photos - 取得任務的所有照片
router.get('/:taskId/photos', async (req, res) => {
  try {
    const { taskId } = req.params;

    const { data, error } = await supabase
      .from('photos')
      .select('*')
      .eq('task_id', taskId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error fetching photos:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/photos/:id - 刪除照片（管理員用）
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 1. 取得照片資訊
    const { data: photo, error: fetchError } = await supabase
      .from('photos')
      .select('storage_path')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!photo) {
      return res.status(404).json({ error: 'Photo not found' });
    }

    // 2. 從 Supabase Storage 刪除檔案
    const { error: storageError } = await supabase
      .storage
      .from(STORAGE_BUCKET)
      .remove([photo.storage_path]);

    if (storageError) {
      console.error('Warning: Failed to delete from storage:', storageError.message);
    }

    // 3. 從資料庫刪除記錄
    const { error: dbError } = await supabase
      .from('photos')
      .delete()
      .eq('id', id);

    if (dbError) throw dbError;

    res.json({ message: 'Photo deleted successfully' });
  } catch (error) {
    console.error('Error deleting photo:', error);
    res.status(500).json({ error: error.message });
  }
});

// 備份到 Google Drive 的輔助函數（TODO）
async function backupToGoogleDrive(fileName, imageBuffer, taskId) {
  // 實作 Google Drive 上傳邏輯
  // 使用現有的 googleDrive.js 服務
  console.log(`TODO: Backup ${fileName} to Google Drive`);
}

export default router;
