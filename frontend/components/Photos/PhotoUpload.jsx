import React, { useState, useCallback } from 'react';
import { useDropzone } from 'react-dropzone';
import imageCompression from 'browser-image-compression';
import useTaskStore from '../../store/useTaskStore';
import PhotoGallery from './PhotoGallery';

const PhotoUpload = ({ taskId }) => {
  const { uploadPhoto, tasks } = useTaskStore();
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const task = tasks.find((t) => t.id === taskId);
  const photos = task?.photos || [];

  // 壓縮圖片
  const compressImage = async (file) => {
    const options = {
      maxSizeMB: 2,
      maxWidthOrHeight: 1920,
      useWebWorker: true,
      onProgress: (progress) => {
        setUploadProgress(Math.round(progress));
      },
    };

    try {
      const compressedFile = await imageCompression(file, options);
      return compressedFile;
    } catch (error) {
      console.error('Image compression failed:', error);
      return file; // 壓縮失敗則使用原檔
    }
  };

  // 處理檔案上傳
  const onDrop = useCallback(
    async (acceptedFiles) => {
      if (!taskId) {
        alert('請先選擇任務');
        return;
      }

      setUploading(true);
      setUploadProgress(0);

      for (const file of acceptedFiles) {
        try {
          // 壓縮圖片
          const compressedFile = await compressImage(file);

          // 建立 FormData
          const formData = new FormData();
          formData.append('photo', compressedFile);
          formData.append('description', `上傳於 ${new Date().toLocaleString('zh-TW')}`);
          formData.append('uploadedBy', '當前使用者'); // TODO: 從登入狀態取得

          // 上傳到後端
          await uploadPhoto(taskId, formData);
        } catch (error) {
          console.error('Upload failed:', error);
          alert(`上傳失敗：${file.name}`);
        }
      }

      setUploading(false);
      setUploadProgress(0);
    },
    [taskId, uploadPhoto]
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png', '.gif', '.webp'],
    },
    multiple: true,
  });

  return (
    <div className="space-y-6">
      {/* 上傳區域 */}
      <div
        {...getRootProps()}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-colors ${
          isDragActive
            ? 'border-blue-500 bg-blue-50'
            : 'border-gray-300 hover:border-gray-400'
        } ${uploading ? 'opacity-50 pointer-events-none' : ''}`}
      >
        <input {...getInputProps()} />
        
        {/* 手機支援拍照 */}
        <input
          type="file"
          accept="image/*"
          capture="environment"
          style={{ display: 'none' }}
          id="camera-input"
          onChange={(e) => {
            if (e.target.files) {
              onDrop(Array.from(e.target.files));
            }
          }}
        />

        <div className="space-y-2">
          <svg
            className="mx-auto h-12 w-12 text-gray-400"
            stroke="currentColor"
            fill="none"
            viewBox="0 0 48 48"
          >
            <path
              d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>

          <div className="text-gray-600">
            {isDragActive ? (
              <p className="font-medium">放開以上傳照片</p>
            ) : (
              <>
                <p className="font-medium">拖曳照片到此處，或點擊上傳</p>
                <p className="text-sm text-gray-500 mt-1">支援 JPG、PNG、GIF、WebP</p>
              </>
            )}
          </div>

          {/* 手機拍照按鈕 */}
          <div className="md:hidden pt-4">
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                document.getElementById('camera-input')?.click();
              }}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              📷 拍照上傳
            </button>
          </div>
        </div>

        {/* 上傳進度 */}
        {uploading && (
          <div className="mt-4">
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-blue-600 h-2 rounded-full transition-all"
                style={{ width: `${uploadProgress}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">上傳中... {uploadProgress}%</p>
          </div>
        )}
      </div>

      {/* 照片展示區 */}
      <PhotoGallery photos={photos} />
    </div>
  );
};

export default PhotoUpload;
