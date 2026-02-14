// Vercel Serverless Function: Photos API
// 照片以 base64 儲存（之後可升級為 Google Drive）

const photos = new Map();

export const config = {
  api: {
    bodyParser: {
      sizeLimit: '10mb'
    }
  }
};

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const { taskId } = req.query;

    // GET /api/photos?taskId=xxx - 取得任務照片
    if (req.method === 'GET' && taskId) {
      const taskPhotos = Array.from(photos.values()).filter(
        p => p.taskId === taskId
      );
      return res.status(200).json(taskPhotos);
    }

    // POST /api/photos - 上傳照片
    if (req.method === 'POST') {
      const { taskId, photo, description } = req.body;
      
      if (!taskId || !photo) {
        return res.status(400).json({ error: 'Missing taskId or photo' });
      }

      const photoData = {
        id: Date.now().toString(),
        taskId,
        url: photo, // base64 data URL
        description: description || '',
        timestamp: new Date().toISOString(),
        uploadedBy: '施工人員'
      };

      photos.set(photoData.id, photoData);
      return res.status(201).json(photoData);
    }

    // DELETE /api/photos/:id - 刪除照片（管理用）
    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!photos.has(id)) {
        return res.status(404).json({ error: 'Photo not found' });
      }
      const deleted = photos.get(id);
      photos.delete(id);
      return res.status(200).json(deleted);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('Photos API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
