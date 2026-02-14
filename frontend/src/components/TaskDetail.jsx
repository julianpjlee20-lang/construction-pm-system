/**
 * TaskDetail 元件 - 任務詳情 Modal
 * Props:
 * - task: 當前任務物件
 * - onClose: 關閉 Modal 的回調函數
 * - onSave: 儲存任務的回調函數
 */
import React, { useState, useEffect } from 'react';
import PhotoUpload from './PhotoUpload';

const TaskDetail = ({ task, onClose, onSave }) => {
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignee: '',
    status: '待辦',
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
    actualEndDate: '',
    progress: 0,
  });

  useEffect(() => {
    if (task) {
      setFormData({
        name: task.name || '',
        description: task.description || '',
        assignee: task.assignee || '',
        status: task.status || '待辦',
        plannedStartDate: task.plannedStartDate || '',
        plannedEndDate: task.plannedEndDate || '',
        actualStartDate: task.actualStartDate || '',
        actualEndDate: task.actualEndDate || '',
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
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-3xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b px-6 py-4 flex justify-between items-center">
          <h2 className="text-2xl font-bold text-gray-800">任務詳情</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl"
          >
            ×
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* 任務名稱 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              任務名稱
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              required
            />
          </div>

          {/* 描述 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              描述
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows="3"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* 負責人 & 狀態 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                負責人
              </label>
              <input
                type="text"
                name="assignee"
                value={formData.assignee}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                狀態
              </label>
              <select
                name="status"
                value={formData.status}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="待辦">待辦</option>
                <option value="進行中">進行中</option>
                <option value="已完成">已完成</option>
              </select>
            </div>
          </div>

          {/* 預計日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預計開始日期
              </label>
              <input
                type="date"
                name="plannedStartDate"
                value={formData.plannedStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預計結束日期
              </label>
              <input
                type="date"
                name="plannedEndDate"
                value={formData.plannedEndDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 實際日期 */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                實際開始日期
              </label>
              <input
                type="date"
                name="actualStartDate"
                value={formData.actualStartDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                實際結束日期
              </label>
              <input
                type="date"
                name="actualEndDate"
                value={formData.actualEndDate}
                onChange={handleChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>
          </div>

          {/* 進度滑桿 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              進度：{formData.progress}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              value={formData.progress}
              onChange={handleProgressChange}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer accent-blue-500"
            />
          </div>

          {/* 施工照片 */}
          <div className="border-t pt-4">
            <h3 className="text-lg font-semibold text-gray-800 mb-3">施工照片</h3>
            <PhotoUpload taskId={task.id} photos={task.photos || []} />
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end gap-3 pt-4 border-t">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskDetail;
