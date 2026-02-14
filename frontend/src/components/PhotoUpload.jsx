/**
 * PhotoUpload 元件 - 施工照片管理
 * Props:
 * - taskId: 任務 ID
 * - photos: 已上傳照片陣列
 */
import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import useTaskStore from '../store/useTaskStore';

const PhotoUpload = ({ taskId, photos = [] }) => {
  const { uploadPhoto } = useTaskStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState({});

  const onDrop = useCallback(async (acceptedFiles) => {
    setUploading(true);

    for (const file of acceptedFiles) {
      setUploadProgress((prev) => ({ ...prev, [file.name]: 0 }));

      try {
        // 壓縮照片（max 2MB）
        const options = {
          maxSizeMB: 2,
          maxWidthOrHeight: 1920,
          useWebWorker: true,
          onProgress: (progress) => {
            // 壓縮進度 0-50%
            setUploadProgress((prev) => ({ 
              ...prev, 
              [file.name]: Math.round(progress / 2) 
            }));
          }
        };

        const compressedFile = await imageCompression(file, options);
        
        // 模擬上傳進度 50-90%
        const interval = setInterval(() => {
          setUploadProgress((prev) => {
            const current = prev[file.name] || 50;
            if (current >= 90) {
              clearInterval(interval);
              return prev;
            }
            return { ...prev, [file.name]: current + 10 };
          });
        }, 150);

        await uploadPhoto(taskId, compressedFile);
        clearInterval(interval);
        setUploadProgress((prev) => ({ ...prev, [file.name]: 100 }));
        
        // 1 秒後移除進度條
        setTimeout(() => {
          setUploadProgress((prev) => {
            const newProgress = { ...prev };
            delete newProgress[file.name];
            return newProgress;
          });
        }, 1000);
      } catch (error) {
        console.error('Upload/compression failed:', error);
        setUploadProgress((prev) => {
          const newProgress = { ...prev };
          delete newProgress[file.name];
          return newProgress;
        });
      }
    }

    setUploading(false);
  }, [taskId, uploadPhoto]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif']
    },
    multiple: true
  });

  const formatTimestamp = (timestamp) => {
    const date = new Date(timestamp);
    return date.toLocaleString('zh-TW', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-4">
      {/* 上傳區域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        }`}
      >
        <input {...getInputProps()} />
        <div className="text-gray-600">
          {isDragActive ? (
            <p className="text-blue-600 font-medium">拖放照片到這裡...</p>
          ) : (
            <>
              <p className="font-medium">點擊或拖放照片上傳</p>
              <p className="text-sm mt-1">支援 JPG, PNG, GIF 格式</p>
            </>
          )}
        </div>
      </div>

      {/* 上傳進度 */}
      {Object.keys(uploadProgress).length > 0 && (
        <div className="space-y-2">
          <h4 className="text-sm font-medium text-gray-700">上傳中...</h4>
          {Object.entries(uploadProgress).map(([filename, progress]) => (
            <div key={filename} className="flex items-center gap-3">
              <span className="text-sm text-gray-600 flex-shrink-0 w-40 truncate">
                {filename}
              </span>
              <div className="flex-1 bg-gray-200 rounded-full h-2">
                <div
                  className="bg-blue-500 h-2 rounded-full transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <span className="text-sm font-medium text-gray-700 w-12 text-right">
                {progress}%
              </span>
            </div>
          ))}
        </div>
      )}

      {/* 已上傳照片時間軸 */}
      {photos.length > 0 && (
        <div className="space-y-3">
          <h4 className="text-sm font-medium text-gray-700">已上傳照片</h4>
          <div className="space-y-4">
            {photos.map((photo) => (
              <div
                key={photo.id}
                className="flex gap-4 p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors"
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.description}
                  className="w-24 h-24 object-cover rounded cursor-pointer"
                  onClick={() => window.open(photo.gdriveUrl, '_blank')}
                />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-800">
                    {photo.description}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    {formatTimestamp(photo.timestamp)}
                  </p>
                  <p className="text-xs text-gray-500">
                    上傳者：{photo.uploadedBy}
                  </p>
                </div>
                <button
                  onClick={() => window.open(photo.gdriveUrl, '_blank')}
                  className="text-blue-600 hover:text-blue-700 text-sm font-medium self-start"
                >
                  查看原圖
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default PhotoUpload;
