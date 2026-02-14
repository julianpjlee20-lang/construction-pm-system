/**
 * TaskCard 元件
 * Props:
 * - task: 任務物件（包含 id, name, assignee, progress）
 * - onClick: 點擊卡片的回調函數
 */
import React from 'react';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

const TaskCard = ({ task, onClick }) => {
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

  // 進度顏色
  const getProgressColor = (progress) => {
    if (progress >= 80) return 'bg-green-500';
    if (progress >= 50) return 'bg-blue-500';
    if (progress >= 20) return 'bg-yellow-500';
    return 'bg-gray-400';
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={onClick}
      className="bg-white p-4 rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer border border-gray-200"
    >
      <h3 className="font-semibold text-gray-800 mb-2">{task.name}</h3>
      <p className="text-sm text-gray-600 mb-3">負責人：{task.assignee}</p>
      
      <div className="flex items-center gap-2">
        <div className="flex-1 bg-gray-200 rounded-full h-2">
          <div
            className={`h-2 rounded-full transition-all ${getProgressColor(task.progress)}`}
            style={{ width: `${task.progress}%` }}
          />
        </div>
        <span className="text-sm font-medium text-gray-700">{task.progress}%</span>
      </div>
    </div>
  );
};

export default TaskCard;
