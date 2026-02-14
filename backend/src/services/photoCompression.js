const sharp = require('sharp');

/**
 * 壓縮照片
 * @param {Buffer} buffer - 原始照片 buffer
 * @param {Object} options - 壓縮選項
 * @returns {Promise<Buffer>} 壓縮後的 buffer
 */
async function compressPhoto(buffer, options = {}) {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 85,
    maxSizeMB = 2
  } = options;

  try {
    // 第一次壓縮：調整尺寸和品質
    let compressed = await sharp(buffer)
      .resize(maxWidth, maxHeight, {
        fit: 'inside',
        withoutEnlargement: true
      })
      .jpeg({
        quality,
        progressive: true
      })
      .toBuffer();

    // 檢查檔案大小，如果超過限制則降低品質
    const maxSizeBytes = maxSizeMB * 1024 * 1024;
    let currentQuality = quality;

    while (compressed.length > maxSizeBytes && currentQuality > 60) {
      currentQuality -= 5;
      compressed = await sharp(buffer)
        .resize(maxWidth, maxHeight, {
          fit: 'inside',
          withoutEnlargement: true
        })
        .jpeg({
          quality: currentQuality,
          progressive: true
        })
        .toBuffer();
    }

    console.log(`✅ 照片壓縮完成：${buffer.length} → ${compressed.length} bytes (品質: ${currentQuality}%)`);
    
    return compressed;
  } catch (error) {
    console.error('❌ 照片壓縮失敗:', error);
    throw new Error('照片壓縮失敗: ' + error.message);
  }
}

/**
 * 取得照片 metadata
 */
async function getPhotoMetadata(buffer) {
  try {
    const metadata = await sharp(buffer).metadata();
    return {
      width: metadata.width,
      height: metadata.height,
      format: metadata.format,
      size: buffer.length,
      exif: metadata.exif
    };
  } catch (error) {
    console.error('❌ 取得照片 metadata 失敗:', error);
    return null;
  }
}

module.exports = {
  compressPhoto,
  getPhotoMetadata
};
