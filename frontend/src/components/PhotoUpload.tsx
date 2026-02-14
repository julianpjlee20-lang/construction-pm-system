import React, { useCallback, useState } from 'react';
import { useDropzone } from 'react-dropzone';
import { useTaskStore } from '../store/taskStore';
import type { Photo } from '../types';

interface PhotoUploadProps {
  taskId: string;
}

const PhotoUpload: React.FC<PhotoUploadProps> = ({ taskId }) => {
  const { addPhoto } = useTaskStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  
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
  
  return (
    <div>
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
          <div className="bg-blue-500 text-white py-3 px-6 rounded-lg text-center cursor-pointer hover:bg-blue-600">
            <svg className="w-6 h-6 inline-block mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            開啟相機拍照
          </div>
        </label>
      </div>
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
