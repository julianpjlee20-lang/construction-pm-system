import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTaskStore } from '../store/taskStore';
import Lightbox from 'yet-another-react-lightbox';
import 'yet-another-react-lightbox/styles.css';
import type { Photo } from '../types';

interface PhotoUploadProps {
  taskId: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ taskId }) => {
  const { addPhoto, updatePhotoDescription, getTaskById } = useTaskStore();
  const task = getTaskById(taskId);
  const photos = task?.photos || [];
  
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [lightboxIndex, setLightboxIndex] = useState(-1);
  const [editingPhotoId, setEditingPhotoId] = useState<string | null>(null);
  const [editDescription, setEditDescription] = useState('');
  
  const onDrop = useCallback(async (acceptedFiles: File[]) => {
    setUploading(true);
    setUploadProgress(0);
    
    for (let i = 0; i < acceptedFiles.length; i++) {
      const file = acceptedFiles[i];
      
      try {
        // 壓縮圖片（模擬）
        const compressedFile = await compressImage(file);
        
        // 建立本地預覽 URL
        const localUrl = URL.createObjectURL(compressedFile);
        
        // TODO: 實際上傳到後端 API
        // const formData = new FormData();
        // formData.append('photo', compressedFile);
        // formData.append('taskId', taskId);
        // const response = await fetch('/api/photos', {
        //   method: 'POST',
        //   body: formData
        // });
        // const data = await response.json();
        
        // Mock: 建立照片記錄
        const photo: Photo = {
          id: `photo-${Date.now()}-${i}`,
          timestamp: new Date().toISOString(),
          description: file.name,
          uploadedBy: '目前使用者', // TODO: 從認證系統取得
          localUrl: localUrl,
          // gdriveUrl: data.gdriveUrl,
          // gdriveFileId: data.gdriveFileId,
        };
        
        addPhoto(taskId, photo);
        setUploadProgress(((i + 1) / acceptedFiles.length) * 100);
        
      } catch (error) {
        console.error('上傳失敗:', error);
        alert(`上傳 ${file.name} 失敗`);
      }
    }
    
    setUploading(false);
    setUploadProgress(0);
  }, [taskId, addPhoto]);
  
  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.png', '.jpg', '.jpeg', '.gif', '.webp']
    },
    multiple: true,
    maxSize: 10 * 1024 * 1024, // 10MB
  });
  
  // 格式化時間戳記
  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    const hours = String(date.getHours()).padStart(2, '0');
    const minutes = String(date.getMinutes()).padStart(2, '0');
    return `${year}-${month}-${day} ${hours}:${minutes}`;
  };
  
  // 開始編輯描述
  const startEditDescription = (photo: Photo) => {
    setEditingPhotoId(photo.id);
    setEditDescription(photo.description);
  };
  
  // 儲存描述
  const saveDescription = (photoId: string) => {
    if (editDescription.length > 200) {
      alert('描述最多 200 字');
      return;
    }
    updatePhotoDescription(taskId, photoId, editDescription);
    setEditingPhotoId(null);
  };
  
  // 取消編輯
  const cancelEdit = () => {
    setEditingPhotoId(null);
    setEditDescription('');
  };
  
  return (
    <div>
      {/* 上傳區域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
        }`}
      >
        <input {...getInputProps()} />
        
        <svg
          className="w-12 h-12 mx-auto mb-4 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
          />
        </svg>
        
        {isDragActive ? (
          <p className="text-blue-600 font-medium">放開以上傳照片...</p>
        ) : (
          <div>
            <p className="text-gray-700 font-medium mb-2">
              拖曳照片到此處，或點擊選擇檔案
            </p>
            <p className="text-sm text-gray-500">
              支援 PNG, JPG, GIF, WebP（單檔最大 10MB）
            </p>
          </div>
        )}
      </div>
      
      {uploading && (
        <div className="mt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-gray-600">上傳中...</span>
            <span className="text-sm font-medium text-blue-600">{Math.round(uploadProgress)}%</span>
          </div>
          <div className="w-full bg-gray-200 rounded-full h-2">
            <div
              className="bg-blue-500 h-2 rounded-full transition-all"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        </div>
      )}
      
      {/* 手機版：相機按鈕 */}
      <div className="mt-4 md:hidden">
        <label className="block w-full">
          <input
            type="file"
            accept="image/*"
            capture="environment"
            multiple
            onChange={(e) => {
              if (e.target.files) {
                onDrop(Array.from(e.target.files));
              }
            }}
            className="hidden"
          />
          <div className="bg-blue-500 text-white py-3 px-6 rounded-lg text-center cursor-pointer hover:bg-blue-600 flex items-center justify-center gap-2">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <span>📷 拍照上傳</span>
          </div>
        </label>
      </div>
      
      {/* 照片時間軸展示 */}
      {photos.length > 0 && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-4">照片記錄（{photos.length} 張）</h3>
          <div className="space-y-4">
            {photos.map((photo, index) => (
              <div
                key={photo.id}
                className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow"
              >
                <div className="flex flex-col md:flex-row gap-4">
                  {/* 照片縮圖 */}
                  <div 
                    className="w-full md:w-32 h-32 flex-shrink-0 cursor-pointer overflow-hidden rounded-lg bg-gray-100"
                    onClick={() => setLightboxIndex(index)}
                  >
                    <img
                      src={photo.localUrl || photo.gdriveUrl || '/placeholder.png'}
                      alt={photo.description}
                      className="w-full h-full object-cover hover:scale-105 transition-transform"
                    />
                  </div>
                  
                  {/* 照片資訊 */}
                  <div className="flex-1">
                    {/* 時間 & 上傳者 */}
                    <div className="flex flex-wrap items-center gap-2 md:gap-4 text-sm text-gray-600 mb-2">
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{formatTimestamp(photo.timestamp)}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                        </svg>
                        <span>{photo.uploadedBy}</span>
                      </div>
                    </div>
                    
                    {/* 照片描述（可編輯） */}
                    {editingPhotoId === photo.id ? (
                      <div className="space-y-2">
                        <textarea
                          value={editDescription}
                          onChange={(e) => setEditDescription(e.target.value)}
                          maxLength={200}
                          className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm md:text-base"
                          rows={3}
                          placeholder="輸入照片描述（最多 200 字）"
                        />
                        <div className="flex items-center justify-between">
                          <span className="text-xs text-gray-500">
                            {editDescription.length}/200 字
                          </span>
                          <div className="flex gap-2">
                            <button
                              onClick={cancelEdit}
                              className="px-3 py-1 text-sm text-gray-600 hover:bg-gray-100 rounded"
                            >
                              取消
                            </button>
                            <button
                              onClick={() => saveDescription(photo.id)}
                              className="px-3 py-1 text-sm bg-blue-500 text-white rounded hover:bg-blue-600"
                            >
                              儲存
                            </button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-gray-700 text-sm md:text-base flex-1">
                          {photo.description || '（無描述）'}
                        </p>
                        <button
                          onClick={() => startEditDescription(photo)}
                          className="text-blue-500 hover:text-blue-600 text-xs md:text-sm whitespace-nowrap"
                        >
                          編輯
                        </button>
                      </div>
                    )}
                    
                    {/* 操作按鈕 */}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={() => setLightboxIndex(index)}
                        className="px-3 py-1 text-xs md:text-sm bg-gray-100 text-gray-700 rounded hover:bg-gray-200"
                      >
                        🔍 放大檢視
                      </button>
                      <button
                        disabled
                        title="照片不可刪除，僅供稽核"
                        className="px-3 py-1 text-xs md:text-sm bg-gray-100 text-gray-400 rounded cursor-not-allowed relative group"
                      >
                        🗑️ 刪除
                        <span className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 text-xs text-white bg-gray-800 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                          照片不可刪除，僅供稽核
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
      
      {/* Lightbox 放大檢視 */}
      <Lightbox
        open={lightboxIndex >= 0}
        close={() => setLightboxIndex(-1)}
        index={lightboxIndex}
        slides={photos.map(photo => ({
          src: photo.localUrl || photo.gdriveUrl || '/placeholder.png',
          alt: photo.description,
        }))}
      />
    </div>
  );
};

// 壓縮圖片函數（簡化版）
async function compressImage(file: File): Promise<File> {
  return new Promise((resolve) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d')!;
        
        // 最大寬度/高度
        const MAX_WIDTH = 1920;
        const MAX_HEIGHT = 1920;
        
        let width = img.width;
        let height = img.height;
        
        if (width > height) {
          if (width > MAX_WIDTH) {
            height *= MAX_WIDTH / width;
            width = MAX_WIDTH;
          }
        } else {
          if (height > MAX_HEIGHT) {
            width *= MAX_HEIGHT / height;
            height = MAX_HEIGHT;
          }
        }
        
        canvas.width = width;
        canvas.height = height;
        ctx.drawImage(img, 0, 0, width, height);
        
        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, {
                type: 'image/jpeg',
                lastModified: Date.now(),
              });
              resolve(compressedFile);
            } else {
              resolve(file);
            }
          },
          'image/jpeg',
          0.8
        );
      };
      
      img.src = e.target?.result as string;
    };
    
    reader.readAsDataURL(file);
  });
}

export default PhotoUpload;
