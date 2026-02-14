/**
 * App 主元件
 * 整合 Kanban、GanttChart、TaskDetail
 */
import React, { useState } from 'react';
import Kanban from './components/Kanban';
import GanttChart from './components/GanttChart';
import TaskDetail from './components/TaskDetail';
import useTaskStore from './store/useTaskStore';

function App() {
  const [activeTab, setActiveTab] = useState('kanban');
  const { selectedTask, selectTask, closeTaskDetail, updateTask } = useTaskStore();

  const handleTaskClick = (taskId) => {
    selectTask(taskId);
  };

  const handleSaveTask = (taskId, updatedData) => {
    updateTask(taskId, updatedData);
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-gray-900">
            工程專案管理系統
          </h1>
        </div>
      </header>

      {/* 分頁切換 */}
      <div className="max-w-7xl mx-auto px-4 py-4">
        <div className="flex gap-2 border-b border-gray-200">
          <button
            onClick={() => setActiveTab('kanban')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'kanban'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            任務看板
          </button>
          <button
            onClick={() => setActiveTab('gantt')}
            className={`px-6 py-3 font-medium transition-colors ${
              activeTab === 'gantt'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-600 hover:text-gray-900'
            }`}
          >
            甘特圖
          </button>
        </div>
      </div>

      {/* 主要內容 */}
      <main className="max-w-7xl mx-auto">
        {activeTab === 'kanban' && <Kanban onTaskClick={handleTaskClick} />}
        {activeTab === 'gantt' && <GanttChart onTaskClick={handleTaskClick} />}
      </main>

      {/* 任務詳情 Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={closeTaskDetail}
          onSave={handleSaveTask}
        />
      )}
    </div>
  );
}

export default App;
