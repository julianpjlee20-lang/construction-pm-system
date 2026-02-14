import React, { useEffect } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  TouchSensor,
} from '@dnd-kit/core';
import { arrayMove, SortableContext } from '@dnd-kit/sortable';
import KanbanColumn from './KanbanColumn';
import TaskCard from './TaskCard';
import useTaskStore from '../../store/useTaskStore';

const COLUMNS = [
  { id: '待辦', title: '待辦', status: '待辦' },
  { id: '進行中', title: '進行中', status: '進行中' },
  { id: '已完成', title: '已完成', status: '已完成' },
];

const KanbanBoard = () => {
  const { tasks, fetchTasks, updateTaskStatus } = useTaskStore();
  const [activeId, setActiveId] = React.useState(null);

  // 設定感應器（支援觸控）
  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 8,
      },
    }),
    useSensor(TouchSensor, {
      activationConstraint: {
        delay: 250,
        tolerance: 5,
      },
    }),
    useSensor(KeyboardSensor)
  );

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleDragStart = (event) => {
    setActiveId(event.active.id);
  };

  const handleDragOver = (event) => {
    const { active, over } = event;
    if (!over) return;

    const activeTask = tasks.find((t) => t.id === active.id);
    const overColumn = COLUMNS.find((c) => c.id === over.id);

    if (overColumn && activeTask.status !== overColumn.status) {
      updateTaskStatus(active.id, overColumn.status);
    }
  };

  const handleDragEnd = (event) => {
    setActiveId(null);
  };

  // 依狀態分組任務
  const getTasksByStatus = (status) => {
    return tasks.filter((task) => task.status === status);
  };

  const activeTask = tasks.find((task) => task.id === activeId);

  return (
    <div className="h-full p-4 md:p-6">
      <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
        專案看板
      </h1>

      <DndContext
        sensors={sensors}
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6">
          {COLUMNS.map((column) => (
            <KanbanColumn
              key={column.id}
              id={column.id}
              title={column.title}
              tasks={getTasksByStatus(column.status)}
            />
          ))}
        </div>

        <DragOverlay>
          {activeTask ? <TaskCard task={activeTask} isDragging /> : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
};

export default KanbanBoard;
