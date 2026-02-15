import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import useTaskStore from '../../store/useTaskStore';

const TaskCard = ({ task, isDragging = false, onClick }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortableDragging,
  } = useSortable({ id: task.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortableDragging ? 0.5 : 1,
  };

  // 進度條顏色
  const getProgressColor = (progress) => {
    if (progress >= 75) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 25) return 'bg-yellow-500';
    return 'bg-red-500';
  };

  const handleClick = (e) => {
    // 如果正在拖曳，不觸發點擊
    if (isDragging || isSortableDragging) return;
    
    // 阻止拖曳事件傳播
    e.stopPropagation();
    
    if (onClick) {
      onClick();
    }
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      className={`bg-white border border-gray-200 rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow ${
        isDragging ? 'shadow-xl ring-2 ring-blue-400' : ''
      }`}
    >
      {/* 拖曳手柄區域 */}
      <div 
        {...listeners}
        className="cursor-move mb-2 -mt-2 -mx-2 px-2 py-2 hover:bg-gray-50 rounded-t-lg"
      >
        <div className="flex items-center justify-center text-gray-400">
          <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 16 16">
            <path d="M7 2a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 5a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zM7 8a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm-3 3a1 1 0 1 1-2 0 1 1 0 0 1 2 0zm3 0a1 1 0 1 1-2 0 1 1 0 0 1 2 0z"/>
          </svg>
        </div>
      </div>
      
      {/* 可點擊的內容區域 */}
      <div onClick={handleClick} className="cursor-pointer">
      <h3 className="font-medium text-gray-800 mb-2 line-clamp-2">
        {task.name}
      </h3>

      <div className="flex items-center text-sm text-gray-600 mb-3">
        <svg
          className="w-4 h-4 mr-1"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
        <span>{task.assignee || '未分配'}</span>
      </div>

      <div className="space-y-1">
        <div className="flex justify-between text-xs text-gray-500 mb-1">
          <span>進度</span>
          <span className="font-medium">{task.progress || 0}%</span>
        </div>
        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(task.progress || 0)}`}
            style={{ width: `${task.progress || 0}%` }}
          />
        </div>
      </div>

      {task.photos && task.photos.length > 0 && (
        <div className="mt-3 flex items-center text-xs text-gray-500">
          <svg
            className="w-4 h-4 mr-1"
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
          <span>{task.photos.length} 張照片</span>
        </div>
      )}
      </div>
    </div>
  );
};

export default TaskCard;
