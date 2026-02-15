/**
 * Kanban 看板元件
 * 三欄式看板：待辦 / 進行中 / 已完成
 * 使用 DnD Kit 實現拖拉功能
 */
import React from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable';
import TaskCard from './TaskCard';
import useTaskStore from '../store/useTaskStore';

const COLUMNS = [
  { id: '待辦', title: '待辦', color: 'bg-gray-100' },
  { id: '進行中', title: '進行中', color: 'bg-blue-50' },
  { id: '已完成', title: '已完成', color: 'bg-green-50' },
];

const Kanban = ({ onTaskClick }) => {
  const { tasks, updateTaskStatus, getTasksByStatus } = useTaskStore();
  const [activeId, setActiveId] = React.useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor)
  );

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragEnd = (event) => {
    const { active, over } = event;
    
    if (!over) {
      setActiveId(null);
      return;
    }

    // 判斷拖拉到哪一欄
    const overId = over.id;
    let newStatus = null;

    // 如果拖到欄位上
    if (['待辦', '進行中', '已完成'].includes(overId)) {
      newStatus = overId;
    } else {
      // 如果拖到其他卡片上，找出該卡片的狀態
      const overTask = tasks.find((t) => t.id === overId);
      if (overTask) {
        newStatus = overTask.status;
      }
    }

    if (newStatus && active.id !== over.id) {
      updateTaskStatus(active.id, newStatus);
    }

    setActiveId(null);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <div className="p-4 md:p-6">
      <h2 className="text-xl md:text-2xl font-bold text-gray-800 mb-4 md:mb-6">任務看板</h2>
      
      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragEnd={handleDragEnd}
      >
        {/* RWD: 手機版垂直排列，桌面版三欄 */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {COLUMNS.map((column) => {
            const columnTasks = getTasksByStatus(column.id);
            
            return (
              <div key={column.id} className={`${column.color} rounded-lg p-4`}>
                <h3 className="font-semibold text-gray-700 mb-4 flex items-center justify-between">
                  {column.title}
                  <span className="text-sm bg-white px-2 py-1 rounded-full">
                    {columnTasks.length}
                  </span>
                </h3>

                <SortableContext
                  id={column.id}
                  items={columnTasks.map((t) => t.id)}
                  strategy={verticalListSortingStrategy}
                >
                  <div className="space-y-3 min-h-[200px]">
                    {columnTasks.map((task) => (
                      <TaskCard
                        key={task.id}
                        task={task}
                        onClick={() => onTaskClick(task.id)}
                      />
                    ))}
                  </div>
                </SortableContext>
              </div>
            );
          })}
        </div>

        <DragOverlay>
          {activeTask ? (
            <div className="opacity-80">
              <TaskCard task={activeTask} />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default Kanban;
