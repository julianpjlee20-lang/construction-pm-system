import React, { useState } from 'react';
import Kanban from './src/components/Kanban';
import GanttChart from './src/components/GanttChart';
import PhotoUpload from './src/components/PhotoUpload';
import TaskDetail from './src/components/TaskDetail';
import useTaskStore from './src/store/useTaskStore';

function App() {
  const [currentView, setCurrentView] = useState('kanban'); // 'kanban', 'gantt', 'photos'
  const [selectedTaskForPhotos, setSelectedTaskForPhotos] = useState(null);
  const { selectedTask, setSelectedTask } = useTaskStore();

  const views = [
    { id: 'kanban', name: '看板', icon: '📋' },
    { id: 'gantt', name: '甘特圖', icon: '📊' },
    { id: 'photos', name: '照片', icon: '📷' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* 導航列 */}
      <nav className="bg-white shadow-md sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <h1 className="text-xl md:text-2xl font-bold text-gray-800">
                🏗️ 工程專案管理系統
              </h1>
            </div>

            {/* 視圖切換按鈕（桌面版） */}
            <div className="hidden md:flex space-x-2">
              {views.map((view) => (
                <button
                  key={view.id}
                  onClick={() => setCurrentView(view.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    currentView === view.id
                      ? 'bg-blue-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <span className="mr-2">{view.icon}</span>
                  {view.name}
                </button>
              ))}
            </div>
          </div>

          {/* 視圖切換按鈕（手機版） */}
          <div className="md:hidden flex space-x-2 pb-3 overflow-x-auto">
            {views.map((view) => (
              <button
                key={view.id}
                onClick={() => setCurrentView(view.id)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors whitespace-nowrap ${
                  currentView === view.id
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-100 text-gray-700'
                }`}
              >
                <span className="mr-2">{view.icon}</span>
                {view.name}
              </button>
            ))}
          </div>
        </div>
      </nav>

      {/* 主要內容區 */}
      <main className="flex-1 overflow-auto">
        {currentView === 'kanban' && (
          <Kanban 
            onTaskClick={(taskId) => {
              const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
              setSelectedTask(task);
            }}
          />
        )}
        {currentView === 'gantt' && (
          <GanttChart 
            onTaskClick={(taskId) => {
              const task = useTaskStore.getState().tasks.find(t => t.id === taskId);
              setSelectedTask(task);
            }}
          />
        )}
        {currentView === 'photos' && (
          <div className="p-4 md:p-6">
            <h1 className="text-2xl md:text-3xl font-bold mb-6 text-gray-800">
              工程照片管理
            </h1>

            {/* 任務選擇器 */}
            <div className="bg-white rounded-lg shadow-md p-4 mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                選擇任務
              </label>
              <select
                value={selectedTaskForPhotos || ''}
                onChange={(e) => setSelectedTaskForPhotos(e.target.value)}
                className="w-full md:w-1/2 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">請選擇任務...</option>
                {useTaskStore.getState().tasks.map((task) => (
                  <option key={task.id} value={task.id}>
                    {task.name} - {task.assignee || '未分配'}
                  </option>
                ))}
              </select>
            </div>

            {selectedTaskForPhotos ? (
              <PhotoUpload 
                taskId={selectedTaskForPhotos}
                photos={useTaskStore.getState().tasks.find(t => t.id === selectedTaskForPhotos)?.photos || []}
              />
            ) : (
              <div className="bg-white rounded-lg shadow-md p-12 text-center text-gray-400">
                <svg
                  className="mx-auto h-16 w-16 text-gray-300 mb-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z"
                  />
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 13a3 3 0 11-6 0 3 3 0 016 0z"
                  />
                </svg>
                <p>請先選擇一個任務</p>
              </div>
            )}
          </div>
        )}
      </main>

      {/* 任務詳情 Modal */}
      {selectedTask && (
        <TaskDetail
          task={selectedTask}
          onClose={() => setSelectedTask(null)}
          onSave={(taskId, updatedData) => {
            useTaskStore.getState().updateTask(taskId, updatedData);
            setSelectedTask(null);
          }}
        />
      )}
    </div>
  );
}

export default App;
