import React, { useEffect, useRef, useState } from 'react';
import Gantt from 'frappe-gantt';
import { useTaskStore } from '../store/taskStore';

const GanttChart: React.FC = () => {
  const { tasks, selectTask, updateTask } = useTaskStore();
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<any>(null);
  const [viewMode, setViewMode] = useState<string>('Day');
  
  // 編輯表單狀態
  const [editingTask, setEditingTask] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    plannedStartDate: '',
    plannedEndDate: '',
    actualStartDate: '',
  });
  
  useEffect(() => {
    if (!ganttRef.current) return;
    
    // 準備甘特圖資料
    const ganttTasks = tasks.map(task => {
      const actualStart = new Date(task.actualStartDate);
      const plannedStart = new Date(task.plannedStartDate);
      const plannedEnd = new Date(task.plannedEndDate);
      
      // 計算實際結束日期（根據進度）
      let actualEnd: Date;
      if (task.progress === 100 && task.actualEndDate) {
        actualEnd = new Date(task.actualEndDate);
      } else {
        // 如果未完成，使用預計結束日期
        actualEnd = plannedEnd;
      }
      
      // 計算預期進度（用於顏色判斷）
      const now = new Date();
      const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
      const elapsed = Math.max(0, now.getTime() - actualStart.getTime());
      const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
      
      return {
        id: task.id,
        name: task.name,
        start: actualStart.toISOString().split('T')[0],
        end: actualEnd.toISOString().split('T')[0],
        progress: task.progress,
        dependencies: task.dependencies.join(','),
        custom_class: getTaskClass(task.progress, expectedProgress, actualStart, plannedEnd)
      };
    });
    
    // 清除舊的甘特圖
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }
    
    // 建立新的甘特圖
    ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
      view_mode: viewMode,
      date_format: 'YYYY-MM-DD',
      language: 'zh',
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      view_modes: ['Day', 'Week', 'Month'],
      on_click: (task: any) => {
        selectTask(task.id);
        setEditingTask(task.id);
        const taskData = tasks.find(t => t.id === task.id);
        if (taskData) {
          setFormData({
            plannedStartDate: taskData.plannedStartDate,
            plannedEndDate: taskData.plannedEndDate,
            actualStartDate: taskData.actualStartDate,
          });
        }
      },
      on_date_change: (task: any, start: Date, end: Date) => {
        console.log('Date changed:', task, start, end);
        // TODO: 更新任務日期
      },
      on_progress_change: (task: any, progress: number) => {
        console.log('Progress changed:', task, progress);
        // TODO: 更新任務進度
      },
      custom_popup_html: (task: any) => {
        const taskData = tasks.find(t => t.id === task.id);
        if (!taskData) return '';
        
        const plannedStart = new Date(taskData.plannedStartDate);
        const plannedEnd = new Date(taskData.plannedEndDate);
        const now = new Date();
        const totalDuration = plannedEnd.getTime() - plannedStart.getTime();
        const elapsed = Math.max(0, now.getTime() - plannedStart.getTime());
        const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
        const delay = taskData.progress < expectedProgress ? expectedProgress - taskData.progress : 0;
        
        return `
          <div class="gantt-popup">
            <div class="font-bold mb-2">${taskData.name}</div>
            <div class="text-sm mb-1">負責人: ${taskData.assignee}</div>
            <div class="text-sm mb-1">實際進度: ${taskData.progress}%</div>
            <div class="text-sm mb-1">預期進度: ${Math.round(expectedProgress)}%</div>
            ${delay > 10 ? `<div class="text-sm text-red-600 font-semibold">⚠️ 落後 ${Math.round(delay)}%</div>` : ''}
            <div class="text-sm mb-1 mt-2 border-t pt-2">
              <div>預計: ${plannedStart.toLocaleDateString('zh-TW')} - ${plannedEnd.toLocaleDateString('zh-TW')}</div>
              <div>實際: ${new Date(taskData.actualStartDate).toLocaleDateString('zh-TW')} - ${taskData.actualEndDate ? new Date(taskData.actualEndDate).toLocaleDateString('zh-TW') : '進行中'}</div>
            </div>
            <div class="text-sm mt-2">${getStatusText(taskData.progress, expectedProgress, new Date(taskData.actualStartDate), plannedEnd)}</div>
          </div>
        `;
      }
    });
    
    // 添加預計時程的視覺效果（灰色半透明底線）
    addPlannedBaselines();
    
  }, [tasks, viewMode]);
  
  // 根據進度和預期進度判斷任務樣式類別
  const getTaskClass = (progress: number, expectedProgress: number, actualStart: Date, plannedEnd: Date): string => {
    const now = new Date();
    
    // 已完成
    if (progress === 100) {
      return 'bar-complete';
    }
    
    // 延遲（超過預計結束日期）
    if (now > plannedEnd && progress < 100) {
      return 'bar-delayed';
    }
    
    // 落後 >= 10%
    if (progress < expectedProgress - 10) {
      return 'bar-behind';
    }
    
    // 落後 < 10% 或正常
    if (progress < expectedProgress) {
      return 'bar-warning';
    }
    
    return 'bar-ontrack';
  };
  
  const getStatusText = (progress: number, expectedProgress: number, actualStart: Date, plannedEnd: Date): string => {
    const now = new Date();
    
    if (progress === 100) return '✅ 已完成';
    if (now > plannedEnd) return '🔴 延遲';
    
    const delay = expectedProgress - progress;
    
    if (delay >= 10) return '🔴 落後 ≥10%';
    if (delay > 0) return '🟡 落後 <10%';
    return '🟢 進度正常';
  };
  
  // 添加預計時程基準線（灰色半透明）
  const addPlannedBaselines = () => {
    // 此功能需要自訂 Frappe Gantt 的 SVG 渲染
    // 這裡提供基本實作概念，實際可能需要更深入的 DOM 操作
    setTimeout(() => {
      const bars = ganttRef.current?.querySelectorAll('.bar-wrapper');
      bars?.forEach((barWrapper, index) => {
        const task = tasks[index];
        if (!task) return;
        
        // 在這裡可以添加額外的 SVG 元素來顯示預計時程
        // 由於 Frappe Gantt 的限制，這部分可能需要在後端或更複雜的客製化
      });
    }, 100);
  };
  
  const changeViewMode = (mode: string) => {
    setViewMode(mode);
  };
  
  // 儲存任務編輯
  const saveTaskEdit = () => {
    if (!editingTask) return;
    
    updateTask(editingTask, {
      plannedStartDate: formData.plannedStartDate,
      plannedEndDate: formData.plannedEndDate,
      actualStartDate: formData.actualStartDate,
    });
    
    setEditingTask(null);
  };
  
  return (
    <div className="h-full p-4 md:p-6 bg-white">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <h1 className="text-xl md:text-2xl font-bold">工程進度甘特圖</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => changeViewMode('Day')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded transition-colors ${
              viewMode === 'Day' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            日
          </button>
          <button
            onClick={() => changeViewMode('Week')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded transition-colors ${
              viewMode === 'Week' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            週
          </button>
          <button
            onClick={() => changeViewMode('Month')}
            className={`px-3 md:px-4 py-2 text-sm md:text-base rounded transition-colors ${
              viewMode === 'Month' 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
            }`}
          >
            月
          </button>
        </div>
      </div>
      
      {/* 圖例 */}
      <div className="mb-4 flex flex-wrap gap-3 md:gap-4 text-xs md:text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>進度正常</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>落後 &lt;10%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>落後 ≥10%</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>已完成</span>
        </div>
      </div>
      
      {/* 甘特圖容器（手機版橫向滾動） */}
      <div className="overflow-x-auto border rounded-lg">
        <div ref={ganttRef} className="min-w-[600px]"></div>
      </div>
      
      {/* 任務編輯表單（點擊任務後顯示） */}
      {editingTask && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg p-4 md:p-6 max-w-md w-full max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg md:text-xl font-bold mb-4">編輯任務時程</h3>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  預計開始日期
                </label>
                <input
                  type="date"
                  value={formData.plannedStartDate}
                  onChange={(e) => setFormData({ ...formData, plannedStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  預計結束日期
                </label>
                <input
                  type="date"
                  value={formData.plannedEndDate}
                  onChange={(e) => setFormData({ ...formData, plannedEndDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  實際開始日期
                </label>
                <input
                  type="date"
                  value={formData.actualStartDate}
                  onChange={(e) => setFormData({ ...formData, actualStartDate: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              
              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-4 py-2 bg-gray-200 text-gray-700 rounded-lg hover:bg-gray-300"
                >
                  取消
                </button>
                <button
                  onClick={saveTaskEdit}
                  className="flex-1 px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600"
                >
                  儲存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* 自訂樣式 */}
      <style>{`
        /* 完成任務 - 綠色 */
        .bar-complete .bar {
          fill: #10b981 !important;
        }
        
        /* 延遲任務 - 深紅色 */
        .bar-delayed .bar {
          fill: #dc2626 !important;
        }
        
        /* 落後 >= 10% - 紅色 */
        .bar-behind .bar {
          fill: #ef4444 !important;
        }
        
        /* 落後 < 10% - 黃色 */
        .bar-warning .bar {
          fill: #f59e0b !important;
        }
        
        /* 正常 - 藍色 */
        .bar-ontrack .bar {
          fill: #3b82f6 !important;
        }
        
        /* Popup 樣式 */
        .gantt-popup {
          padding: 12px;
          min-width: 250px;
          max-width: 300px;
        }
        
        /* 預計時程基準線（半透明灰色） */
        .bar-wrapper .bar-expected {
          fill: #9ca3af;
          opacity: 0.3;
        }
        
        /* RWD: 手機版調整 */
        @media (max-width: 768px) {
          .gantt .bar-label {
            font-size: 11px;
          }
          
          .gantt-popup {
            font-size: 12px;
            min-width: 200px;
          }
        }
      `}</style>
    </div>
  );
};

export default GanttChart;
