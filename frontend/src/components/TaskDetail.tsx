import React, { useState, useEffect } from 'react';
import { useTaskStore } from '../store/taskStore';
import { TASK_STATUS_LABELS } from '../types';
import PhotoUpload from './PhotoUpload';
import Timeline from './Timeline';

const TaskDetail: React.FC = () => {
  const { selectedTaskId, getTaskById, updateTaskProgress, updateTask, selectTask } = useTaskStore();
  const task = selectedTaskId ? getTaskById(selectedTaskId) : null;
  
  const [progress, setProgress] = useState(0);
  const [isEditing, setIsEditing] = useState(false);
  
  useEffect(() => {
    if (task) {
      setProgress(task.progress);
    }
  }, [task]);
  
  if (!task) {
    return (
      <div className="h-full flex items-center justify-center bg-gray-50">
        <div className="text-center text-gray-500">
          <svg className="w-16 h-16 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <p className="text-lg">請選擇一個任務查看詳情</p>
        </div>
      </div>
    );
  }
  
  const handleProgressChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newProgress = parseInt(e.target.value);
    setProgress(newProgress);
  };
  
  const handleProgressSave = () => {
    updateTaskProgress(task.id, progress);
    setIsEditing(false);
    
    // 如果進度達到 100%，自動更新狀態為已完成
    if (progress === 100 && task.status !== 'done') {
      updateTask(task.id, {
        status: 'done',
        actualEndDate: new Date().toISOString().split('T')[0]
      });
    }
  };
  
  const handleClose = () => {
    selectTask(null);
  };
  
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };
  
  const getStatusBadgeColor = (status: string) => {
    switch (status) {
      case 'done':
        return 'bg-green-100 text-green-800';
      case 'inProgress':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  return (
    <div className="h-full overflow-y-auto bg-gray-50">
      <div className="max-w-4xl mx-auto p-6">
        {/* Header */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-3xl font-bold text-gray-800 mb-2">{task.name}</h1>
              <span className={`inline-block px-3 py-1 rounded-full text-sm font-medium ${getStatusBadgeColor(task.status)}`}>
                {TASK_STATUS_LABELS[task.status]}
              </span>
            </div>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          
          <p className="text-gray-600 mb-6">{task.description}</p>
          
          {/* 基本資訊 */}
          <div className="grid grid-cols-2 gap-4 mb-6">
            <div>
              <p className="text-sm text-gray-500">負責人</p>
              <p className="font-medium">{task.assignee}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">預計工期</p>
              <p className="font-medium">{task.plannedDuration} 天</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">預計開始</p>
              <p className="font-medium">{new Date(task.plannedStartDate).toLocaleDateString('zh-TW')}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">預計完成</p>
              <p className="font-medium">{new Date(task.plannedEndDate).toLocaleDateString('zh-TW')}</p>
            </div>
          </div>
          
          {/* 進度控制 */}
          <div className="border-t pt-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">任務進度</h2>
              {!isEditing ? (
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                >
                  更新進度
                </button>
              ) : (
                <div className="flex gap-2">
                  <button
                    onClick={handleProgressSave}
                    className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  >
                    儲存
                  </button>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setProgress(task.progress);
                    }}
                    className="px-4 py-2 bg-gray-300 text-gray-700 rounded hover:bg-gray-400"
                  >
                    取消
                  </button>
                </div>
              )}
            </div>
            
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-2xl font-bold text-gray-800">{progress}%</span>
                {isEditing && (
                  <span className="text-sm text-gray-500">拖曳滑桿調整進度</span>
                )}
              </div>
              
              {/* 進度條 */}
              <div className="w-full bg-gray-200 rounded-full h-4 mb-3">
                <div
                  className={`h-4 rounded-full transition-all ${getProgressColor(progress)}`}
                  style={{ width: `${progress}%` }}
                />
              </div>
              
              {/* 進度滑桿 */}
              {isEditing && (
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="5"
                  value={progress}
                  onChange={handleProgressChange}
                  className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer"
                />
              )}
            </div>
          </div>
        </div>
        
        {/* 照片上傳 */}
        <div className="bg-white rounded-lg shadow-md p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">施工照片</h2>
          <PhotoUpload taskId={task.id} />
        </div>
        
        {/* 時間軸 */}
        <div className="bg-white rounded-lg shadow-md p-6">
          <h2 className="text-xl font-semibold mb-4">更新紀錄</h2>
          <Timeline photos={task.photos} />
        </div>
      </div>
    </div>
  );
};

export default TaskDetail;
