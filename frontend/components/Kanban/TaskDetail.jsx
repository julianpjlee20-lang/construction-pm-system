import React, { useState } from 'react';
import { useTaskStore } from '../../store/taskStore';
import PhotoUpload from '../Photos/PhotoUpload';
import PhotoTimeline from '../Photos/PhotoTimeline';

export default function TaskDetail({ taskId, onClose }) {
  const { tasks, updateTaskProgress } = useTaskStore();
  const task = tasks.find(t => t.id === taskId);
  const [progress, setProgress] = useState(task?.progress || 0);

  if (!task) {
    return (
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <div className="bg-white rounded-lg p-6">
          <p>找不到任務</p>
          <button onClick={onClose} className="mt-4 px-4 py-2 bg-gray-500 text-white rounded">
            關閉
          </button>
        </div>
      </div>
    );
  }

  const handleProgressChange = (e) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
  };

  const handleSaveProgress = () => {
    updateTaskProgress(taskId, progress);
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b p-6 flex justify-between items-start">
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-gray-800 mb-2">{task.name}</h2>
            <p className="text-gray-600">{task.description}</p>
          </div>
          <button
            onClick={onClose}
            className="ml-4 text-gray-400 hover:text-gray-600 text-2xl"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-6">
          {/* 任務資訊 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">負責人</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                👤 {task.assignee}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">狀態</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                {task.status === '待辦' && '📋 待辦'}
                {task.status === '進行中' && '🚧 進行中'}
                {task.status === '已完成' && '✅ 已完成'}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">預計開始</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                📅 {task.plannedStartDate}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">預計結束</label>
              <div className="text-gray-900 bg-gray-50 px-3 py-2 rounded">
                📅 {task.plannedEndDate}
              </div>
            </div>
          </div>

          {/* 進度調整 */}
          <div className="bg-blue-50 rounded-lg p-4">
            <label className="block text-sm font-medium text-gray-700 mb-3">
              調整進度：{progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={progress}
              onChange={handleProgressChange}
              className="w-full h-3 bg-gray-300 rounded-lg appearance-none cursor-pointer"
            />
            <div className="flex justify-between mt-2">
              <span className="text-xs text-gray-600">0%</span>
              <button
                onClick={handleSaveProgress}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 text-sm"
              >
                儲存進度
              </button>
              <span className="text-xs text-gray-600">100%</span>
            </div>
          </div>

          {/* 照片上傳 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📷 照片上傳</h3>
            <PhotoUpload taskId={taskId} />
          </div>

          {/* 照片時間軸 */}
          <div>
            <h3 className="text-lg font-semibold text-gray-800 mb-3">🕒 照片時間軸</h3>
            <PhotoTimeline photos={task.photos} />
          </div>
        </div>
      </div>
    </div>
  );
}
