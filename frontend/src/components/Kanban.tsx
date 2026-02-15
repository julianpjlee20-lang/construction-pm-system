import React from 'react';
import {
  DndContext,
  type DragEndEvent,
  DragOverlay,
  type DragStartEvent,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';
import type { Task, TaskStatus } from '../types';
import { TASK_STATUS_LABELS } from '../types';
import { useTaskStore } from '../store/taskStore';
import TaskCard from './TaskCard';

const Kanban: React.FC = () => {
  const { tasks, updateTaskStatus, selectTask } = useTaskStore();
  const [activeTask, setActiveTask] = React.useState<Task | null>(null);
  
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    })
  );
  
  const columns: TaskStatus[] = ['todo', 'inProgress', 'done'];
  
  const getTasksByStatus = (status: TaskStatus) => {
    return tasks.filter(task => task.status === status);
  };
  
  const handleDragStart = (event: DragStartEvent) => {
    const task = tasks.find(t => t.id === event.active.id);
    setActiveTask(task || null);
  };
  
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveTask(null);
      return;
    }
    
    const taskId = active.id as string;
    const newStatus = over.id as TaskStatus;
    
    // 檢查 newStatus 是否為有效的欄位
    if (columns.includes(newStatus)) {
      updateTaskStatus(taskId, newStatus);
    }
    
    setActiveTask(null);
  };
  
  const handleTaskClick = (taskId: string) => {
    selectTask(taskId);
  };
  
  return (
    <div className="h-full p-3 md:p-6 bg-gray-50">
      {/* 標題 - 手機版縮小 */}
      <h1 className="text-lg md:text-2xl font-bold mb-4 md:mb-6">工程任務看板</h1>
      
      <DndContext
        sensors={sensors}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* 手機版：單欄垂直排列；桌面版：三欄並排 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4 h-full">
          {columns.map((status) => (
            <KanbanColumn
              key={status}
              status={status}
              tasks={getTasksByStatus(status)}
              onTaskClick={handleTaskClick}
            />
          ))}
        </div>
        
        <DragOverlay>
          {activeTask ? (
            <div className="opacity-50">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

interface KanbanColumnProps {
  status: TaskStatus;
  tasks: Task[];
  onTaskClick: (taskId: string) => void;
}

const KanbanColumn: React.FC<KanbanColumnProps> = ({ status, tasks, onTaskClick }) => {
  const statusColors = {
    todo: 'bg-gray-100 border-gray-300',
    inProgress: 'bg-blue-50 border-blue-300',
    done: 'bg-green-50 border-green-300'
  };
  
  return (
    <div
      className={`rounded-lg border-2 p-3 md:p-4 ${statusColors[status]} min-h-[300px] md:min-h-[500px]`}
      id={status}
    >
      {/* 欄位標題 - 手機版縮小 */}
      <h2 className="text-base md:text-lg font-semibold mb-3 md:mb-4 flex items-center justify-between">
        <span>{TASK_STATUS_LABELS[status]}</span>
        <span className="text-xs md:text-sm font-normal text-gray-500">({tasks.length})</span>
      </h2>
      
      <SortableContext
        items={tasks.map(t => t.id)}
        strategy={verticalListSortingStrategy}
      >
        {/* 手機版：間距縮小 */}
        <div className="space-y-2 md:space-y-3">
          {tasks.map((task) => (
            <div key={task.id} onClick={() => onTaskClick(task.id)}>
              <TaskCard task={task} />
            </div>
          ))}
        </div>
      </SortableContext>
    </div>
  );
};

export default Kanban;
