import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import type { Task } from '../types';

interface TaskCardProps {
  task: Task;
}

const TaskCard: React.FC<TaskCardProps> = ({ task }) => {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: task.id });
  
  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };
  
  const getProgressColor = (progress: number) => {
    if (progress === 100) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress > 0) return 'bg-yellow-500';
    return 'bg-gray-300';
  };
  
  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      className="bg-white rounded-lg shadow-md p-3 md:p-4 cursor-pointer hover:shadow-lg transition-shadow"
    >
      {/* 標題與進度百分比 - 手機版縮小字體 */}
      <div className="flex items-start justify-between mb-2">
        <h3 className="font-semibold text-gray-800 text-sm md:text-base">{task.name}</h3>
        <span className="text-xs bg-gray-200 px-2 py-0.5 md:py-1 rounded whitespace-nowrap ml-2">
          {task.progress}%
        </span>
      </div>
      
      {/* 描述 - 手機版縮小字體 */}
      <p className="text-xs md:text-sm text-gray-600 mb-2 md:mb-3 line-clamp-2">
        {task.description}
      </p>
      
      {/* 進度條 - 手機版稍微縮小 */}
      <div className="w-full bg-gray-200 rounded-full h-1.5 md:h-2 mb-2 md:mb-3">
        <div
          className={`h-1.5 md:h-2 rounded-full transition-all ${getProgressColor(task.progress)}`}
          style={{ width: `${task.progress}%` }}
        />
      </div>
      
      {/* 負責人與照片數量 - 手機版縮小字體與間距 */}
      <div className="flex items-center justify-between text-xs text-gray-500 mb-1 md:mb-2">
        <div className="flex items-center">
          <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <span className="text-xs">{task.assignee}</span>
        </div>
        
        {task.photos.length > 0 && (
          <div className="flex items-center">
            <svg className="w-3 h-3 md:w-4 md:h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
            </svg>
            <span className="text-xs">{task.photos.length}</span>
          </div>
        )}
      </div>
      
      {/* 日期 - 手機版縮小字體 */}
      <div className="text-xs text-gray-400">
        {new Date(task.plannedStartDate).toLocaleDateString('zh-TW', { 
          month: '2-digit', 
          day: '2-digit' 
        })} - {new Date(task.plannedEndDate).toLocaleDateString('zh-TW', { 
          month: '2-digit', 
          day: '2-digit' 
        })}
      </div>
    </div>
  );
};

export default TaskCard;
