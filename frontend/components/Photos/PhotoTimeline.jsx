import React, { useState } from 'react';

export default function PhotoTimeline({ photos }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null);

  if (!photos || photos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8 bg-gray-50 rounded-lg">
        尚無照片記錄
      </div>
    );
  }

  const formatDate = (timestamp) => {
    const date = new Date(timestamp);
    return {
      date: date.toLocaleDateString('zh-TW'),
      time: date.toLocaleTimeString('zh-TW', { 
        hour: '2-digit', 
        minute: '2-digit' 
      })
    };
  };

  return (
    <>
      <div className="space-y-4">
        {photos.map((photo, index) => {
          const { date, time } = formatDate(photo.timestamp);
          
          return (
            <div
              key={photo.id}
              className="flex gap-4 p-4 bg-white border border-gray-200 rounded-lg hover:shadow-md transition-shadow"
            >
              {/* 時間軸線 */}
              <div className="flex flex-col items-center">
                <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
                {index < photos.length - 1 && (
                  <div className="w-0.5 h-full bg-gray-300 mt-2"></div>
                )}
              </div>

              {/* 縮圖 */}
              <div 
                className="flex-shrink-0 cursor-pointer"
                onClick={() => setSelectedPhoto(photo)}
              >
                <img
                  src={photo.thumbnailUrl}
                  alt={photo.description}
                  className="w-24 h-24 object-cover rounded-lg hover:opacity-80 transition-opacity"
                />
              </div>

              {/* 資訊 */}
              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between mb-2">
                  <div>
                    <p className="font-semibold text-gray-800">{photo.description}</p>
                    <p className="text-sm text-gray-500">
                      📅 {date} {time}
                    </p>
                  </div>
                </div>
                <p className="text-sm text-gray-600">
                  👤 上傳者：{photo.uploadedBy}
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {/* 照片預覽燈箱 */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-5xl max-h-[90vh]">
            <button
              onClick={() => setSelectedPhoto(null)}
              className="absolute -top-12 right-0 text-white text-3xl hover:text-gray-300"
            >
              ✕
            </button>
            
            <img
              src={selectedPhoto.gdriveUrl}
              alt={selectedPhoto.description}
              className="max-w-full max-h-[85vh] object-contain rounded-lg"
              onClick={(e) => e.stopPropagation()}
            />
            
            <div className="mt-4 text-white text-center">
              <p className="text-lg font-semibold">{selectedPhoto.description}</p>
              <p className="text-sm text-gray-300 mt-1">
                {formatDate(selectedPhoto.timestamp).date} {formatDate(selectedPhoto.timestamp).time}
                {' • '}
                {selectedPhoto.uploadedBy}
              </p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
