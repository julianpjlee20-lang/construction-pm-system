import React, { useState, useEffect } from 'react';
import useTaskStore from '../../store/useTaskStore';
import { format } from 'date-fns';

const TaskModal = ({ isOpen, onClose }) => {
  const { selectedTask, updateTask } = useTaskStore();
  const [formData, setFormData] = useState({});

  useEffect(() => {
    if (selectedTask) {
      setFormData(selectedTask);
    }
  }, [selectedTask]);

  if (!isOpen || !selectedTask) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await updateTask(selectedTask.id, formData);
      onClose();
    } catch (error) {
      console.error('Failed to update task:', error);
    }
  };

  const handleChange = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black bg-opacity-50">
      <div className="bg-white rounded-lg shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">任務詳情</h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
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
              value={formData.name || ''}
              onChange={(e) => handleChange('name', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              required
            />
          </div>

          {/* 負責人 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              負責人
            </label>
            <input
              type="text"
              value={formData.assignee || ''}
              onChange={(e) => handleChange('assignee', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          {/* 進度 */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              進度：{formData.progress || 0}%
            </label>
            <input
              type="range"
              min="0"
              max="100"
              step="5"
              value={formData.progress || 0}
              onChange={(e) => handleChange('progress', parseInt(e.target.value))}
              className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
            />
          </div>

          {/* 預計時程 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預計開始日期
              </label>
              <input
                type="date"
                value={formData.plannedStartDate || ''}
                onChange={(e) => handleChange('plannedStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                預計結束日期
              </label>
              <input
                type="date"
                value={formData.plannedEndDate || ''}
                onChange={(e) => handleChange('plannedEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 實際時程 */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                實際開始日期
              </label>
              <input
                type="date"
                value={formData.actualStartDate || ''}
                onChange={(e) => handleChange('actualStartDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                實際結束日期
              </label>
              <input
                type="date"
                value={formData.actualEndDate || ''}
                onChange={(e) => handleChange('actualEndDate', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          {/* 按鈕 */}
          <div className="flex justify-end space-x-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              取消
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              儲存
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TaskModal;
