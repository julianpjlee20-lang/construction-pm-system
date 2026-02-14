import React from 'react';
import type { Photo } from '../types';

interface TimelineProps {
  photos: Photo[];
}

const Timeline: React.FC<TimelineProps> = ({ photos }) => {
  if (photos.length === 0) {
    return (
      <div className="text-center text-gray-500 py-8">
        <svg className="w-12 h-12 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
        </svg>
        <p>尚無更新紀錄</p>
      </div>
    );
  }
  
  // 按時間排序（最新的在上面）
  const sortedPhotos = [...photos].sort((a, b) => 
    new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
  );
  
  return (
    <div className="space-y-6">
      {sortedPhotos.map((photo, index) => (
        <div key={photo.id} className="flex gap-4">
          {/* 時間軸線 */}
          <div className="flex flex-col items-center">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            {index < sortedPhotos.length - 1 && (
              <div className="w-0.5 flex-1 bg-gray-300 min-h-[60px]"></div>
            )}
          </div>
          
          {/* 內容 */}
          <div className="flex-1 pb-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-sm text-gray-500">
                    {formatDateTime(photo.timestamp)}
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    由 {photo.uploadedBy} 更新
                  </p>
                </div>
              </div>
              
              {/* 照片預覽 */}
              {(photo.localUrl || photo.thumbnailUrl || photo.gdriveUrl) && (
                <div className="mb-3">
                  <img
                    src={photo.localUrl || photo.thumbnailUrl || photo.gdriveUrl}
                    alt={photo.description}
                    className="rounded-lg max-w-full h-auto cursor-pointer hover:opacity-90 transition-opacity"
                    onClick={() => {
                      // TODO: 開啟大圖預覽
                      window.open(photo.gdriveUrl || photo.localUrl, '_blank');
                    }}
                  />
                </div>
              )}
              
              <p className="text-gray-800">{photo.description}</p>
              
              {photo.gdriveUrl && (
                <a
                  href={photo.gdriveUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-blue-600 hover:text-blue-800 inline-flex items-center mt-2"
                >
                  <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                  </svg>
                  在 Google Drive 查看
                </a>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
};

function formatDateTime(isoString: string): string {
  const date = new Date(isoString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  
  if (diffMins < 1) return '剛剛';
  if (diffMins < 60) return `${diffMins} 分鐘前`;
  if (diffHours < 24) return `${diffHours} 小時前`;
  if (diffDays < 7) return `${diffDays} 天前`;
  
  return date.toLocaleString('zh-TW', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default Timeline;
