import React, { useEffect } from 'react';
import { format, parseISO } from 'date-fns';
import { zhTW } from 'date-fns/locale';

const Lightbox = ({ photo, photos, onClose, onNavigate }) => {
  const currentIndex = photos.findIndex((p) => p.id === photo.id);

  // 鍵盤導航
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'ArrowLeft' && currentIndex > 0) {
        onNavigate(photos[currentIndex - 1]);
      } else if (e.key === 'ArrowRight' && currentIndex < photos.length - 1) {
        onNavigate(photos[currentIndex + 1]);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [currentIndex, photos, onClose, onNavigate]);

  // 防止背景滾動
  useEffect(() => {
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, []);

  const handlePrevious = () => {
    if (currentIndex > 0) {
      onNavigate(photos[currentIndex - 1]);
    }
  };

  const handleNext = () => {
    if (currentIndex < photos.length - 1) {
      onNavigate(photos[currentIndex + 1]);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center">
      {/* 關閉按鈕 */}
      <button
        onClick={onClose}
        className="absolute top-4 right-4 text-white hover:text-gray-300 transition-colors z-10"
      >
        <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>

      {/* 上一張按鈕 */}
      {currentIndex > 0 && (
        <button
          onClick={handlePrevious}
          className="absolute left-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
        </button>
      )}

      {/* 下一張按鈕 */}
      {currentIndex < photos.length - 1 && (
        <button
          onClick={handleNext}
          className="absolute right-4 top-1/2 transform -translate-y-1/2 text-white hover:text-gray-300 transition-colors z-10"
        >
          <svg className="w-12 h-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      )}

      {/* 圖片容器 */}
      <div className="max-w-7xl max-h-screen w-full h-full flex flex-col items-center justify-center p-4">
        <img
          src={photo.gdriveUrl}
          alt={photo.description}
          className="max-w-full max-h-[80vh] object-contain"
        />

        {/* 資訊欄 */}
        <div className="bg-black bg-opacity-75 text-white rounded-lg p-4 mt-4 max-w-2xl w-full">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center text-sm">
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>
                {format(parseISO(photo.timestamp), 'yyyy/MM/dd HH:mm', { locale: zhTW })}
              </span>
            </div>
            <div className="text-sm text-gray-300">
              {currentIndex + 1} / {photos.length}
            </div>
          </div>

          <p className="mb-2">{photo.description}</p>

          <div className="flex items-center text-sm text-gray-300">
            <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
            <span>上傳者：{photo.uploadedBy}</span>
          </div>
        </div>
      </div>

      {/* 手機端提示 */}
      <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 text-white text-sm text-center md:hidden">
        <p>左右滑動切換照片</p>
      </div>
    </div>
  );
};

export default Lightbox;
