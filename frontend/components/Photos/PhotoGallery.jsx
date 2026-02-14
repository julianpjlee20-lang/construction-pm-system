import React, { useState } from 'react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';
import Lightbox from './Lightbox';

const PhotoGallery = ({ photos = [] }) => {
  const [selectedPhoto, setSelectedPhoto] = useState(null);
  const [viewMode, setViewMode] = useState('timeline'); // 'timeline' or 'grid'

  if (photos.length === 0) {
    return (
      <div className="text-center text-gray-400 py-12 bg-white rounded-lg">
        <svg
          className="mx-auto h-12 w-12 text-gray-300"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4">尚無照片</p>
      </div>
    );
  };

  // 依時間排序（最新在上）
  const sortedPhotos = [...photos].sort((a, b) => {
    return new Date(b.timestamp) - new Date(a.timestamp);
  });

  return (
    <div>
      {/* 視圖切換 */}
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          工程照片 ({photos.length})
        </h3>
        <div className="flex space-x-2">
          <button
            onClick={() => setViewMode('timeline')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'timeline'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            時間軸
          </button>
          <button
            onClick={() => setViewMode('grid')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${
              viewMode === 'grid'
                ? 'bg-blue-600 text-white'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            網格
          </button>
        </div>
      </div>

      {/* 時間軸視圖 */}
      {viewMode === 'timeline' && (
        <div className="space-y-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow"
            >
              <div className="md:flex">
                <div className="md:w-1/3">
                  <img
                    src={photo.gdriveUrl}
                    alt={photo.description}
                    className="w-full h-48 md:h-full object-cover cursor-pointer"
                    onClick={() => setSelectedPhoto(photo)}
                  />
                </div>
                <div className="p-4 md:w-2/3">
                  <div className="flex items-center text-sm text-gray-500 mb-2">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span>
                      {format(parseISO(photo.timestamp), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
                    </span>
                  </div>
                  <p className="text-gray-700 mb-2">{photo.description}</p>
                  <div className="flex items-center text-sm text-gray-600">
                    <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                    <span>{photo.uploadedBy}</span>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* 網格視圖 */}
      {viewMode === 'grid' && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {sortedPhotos.map((photo) => (
            <div
              key={photo.id}
              className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow cursor-pointer group"
              onClick={() => setSelectedPhoto(photo)}
            >
              <div className="aspect-square relative overflow-hidden">
                <img
                  src={photo.gdriveUrl}
                  alt={photo.description}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform"
                />
                <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-30 transition-all flex items-end p-2">
                  <p className="text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity truncate">
                    {format(parseISO(photo.timestamp), 'MM/dd HH:mm')}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {selectedPhoto && (
        <Lightbox
          photo={selectedPhoto}
          photos={sortedPhotos}
          onClose={() => setSelectedPhoto(null)}
          onNavigate={setSelectedPhoto}
        />
      )}
    </div>
  );
};

export default PhotoGallery;
