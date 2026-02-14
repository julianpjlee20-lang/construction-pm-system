import { useState } from 'react';
import { BrowserRouter as Router } from 'react-router-dom';
import Kanban from './components/Kanban';
import GanttChart from './components/GanttChart';
import TaskDetail from './components/TaskDetail';
import { useTaskStore } from './store/taskStore';

type View = 'kanban' | 'gantt';

function App() {
  const [currentView, setCurrentView] = useState<View>('kanban');
  const { selectedTaskId } = useTaskStore();
  
  return (
    <Router>
      <div className="h-screen flex flex-col">
        {/* Header */}
        <header className="bg-blue-600 text-white shadow-lg">
          <div className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-bold">向上建設 - 工程專案管理系統</h1>
              
              {/* 切換按鈕 */}
              <div className="flex gap-2">
                <button
                  onClick={() => setCurrentView('kanban')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'kanban'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  📋 看板
                </button>
                <button
                  onClick={() => setCurrentView('gantt')}
                  className={`px-6 py-2 rounded-lg font-medium transition-colors ${
                    currentView === 'gantt'
                      ? 'bg-white text-blue-600'
                      : 'bg-blue-500 text-white hover:bg-blue-400'
                  }`}
                >
                  📊 甘特圖
                </button>
              </div>
            </div>
          </div>
        </header>
        
        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          <div className="h-full flex">
            {/* 左側：看板或甘特圖 */}
            <div className={`${selectedTaskId ? 'w-1/2' : 'w-full'} h-full transition-all duration-300`}>
              {currentView === 'kanban' ? <Kanban /> : <GanttChart />}
            </div>
            
            {/* 右側：任務詳情（當有選中任務時顯示） */}
            {selectedTaskId && (
              <div className="w-1/2 h-full border-l border-gray-200">
                <TaskDetail />
              </div>
            )}
          </div>
        </main>
        
        {/* Footer */}
        <footer className="bg-gray-100 border-t border-gray-200 py-3 px-4">
          <div className="container mx-auto text-center text-sm text-gray-600">
            <p>© 2026 向上建設有限公司 | 工程專案管理系統 v1.0</p>
          </div>
        </footer>
      </div>
    </Router>
  );
}

export default App;
