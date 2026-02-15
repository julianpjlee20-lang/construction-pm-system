/**
 * TaskDetail 元件 - 任務詳情 Modal
 * 適應最小 schema：只有 id, project_id, name, status, progress
 */
import React, { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';

const TaskDetail = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    status: '待辦',
    progress: 0,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        status: task.status || '待辦',
        progress: task.progress || 0,
      });
    }
  }, [task]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleProgressChange = (e) => {
    setFormData((prev) => ({ ...prev, progress: parseInt(e.target.value) }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(task.id, formData);
    onClose();
  };

  if (!task) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">📝 任務詳情</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-3xl leading-none"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 任務名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任務名稱 *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 狀態 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              狀態 *
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="待辦">待辦</option>
              <option value="進行中">進行中</option>
              <option value="已完成">已完成</option>
            </select>
          </div>

          {/* 進度滑桿 */}
          <div className="border-t pt-4">
            <label className="block text-sm font-medium text-gray-700 mb-2">
              📊 進度：<span className="text-blue-600 font-bold text-lg">{formData.progress}%</span>
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress}
              onChange={handleProgressChange}
              className="w-full h-3 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-600"
            />
            <div className="flex justify-between text-xs text-gray-500 mt-1">
              <span>0%</span>
              <span>25%</span>
              <span>50%</span>
              <span>75%</span>
              <span>100%</span>
            </div>
          </div>

          {/* 施工照片 */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">📷 施工照片</h3>
            <PhotoUpload taskId={task.id} photos={task.photos || []} />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
            >
              💾 儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetail;
