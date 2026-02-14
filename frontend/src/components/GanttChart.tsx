import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import { useTaskStore } from '../store/taskStore';

const GanttChart: React.FC = () => {
  const { tasks, selectTask } = useTaskStore();
  const ganttRef = useRef<HTMLDivElement>(null);
  const ganttInstanceRef = useRef<any>(null);
  
  useEffect(() => {
    if (!ganttRef.current) return;
    
    // 準備甘特圖資料
    const ganttTasks = tasks.map(task => {
      const start = new Date(task.actualStartDate);
      const plannedEnd = new Date(task.plannedEndDate);
      
      // 計算實際結束日期（根據進度）
      let end: Date;
      if (task.progress === 100 && task.actualEndDate) {
        end = new Date(task.actualEndDate);
      } else {
        // 如果未完成，使用預計結束日期
        end = plannedEnd;
      }
      
      return {
        id: task.id,
        name: task.name,
        start: start.toISOString().split('T')[0],
        end: end.toISOString().split('T')[0],
        progress: task.progress,
        dependencies: task.dependencies.join(','),
        custom_class: getTaskClass(task.progress, start, plannedEnd)
      };
    });
    
    // 清除舊的甘特圖
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }
    
    // 建立新的甘特圖
    ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
      view_mode: 'Day',
      date_format: 'YYYY-MM-DD',
      language: 'zh',
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      view_modes: ['Day', 'Week', 'Month'],
      on_click: (task: any) => {
        selectTask(task.id);
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
        
        return `
          <div class="gantt-popup">
            <div class="font-bold mb-2">${taskData.name}</div>
            <div class="text-sm mb-1">負責人: ${taskData.assignee}</div>
            <div class="text-sm mb-1">進度: ${taskData.progress}%</div>
            <div class="text-sm mb-1">預計: ${new Date(taskData.plannedStartDate).toLocaleDateString('zh-TW')} - ${new Date(taskData.plannedEndDate).toLocaleDateString('zh-TW')}</div>
            <div class="text-sm">狀態: ${getStatusText(taskData.progress, new Date(taskData.actualStartDate), new Date(taskData.plannedEndDate))}</div>
          </div>
        `;
      }
    });
    
  }, [tasks]);
  
  const getTaskClass = (progress: number, actualStart: Date, plannedEnd: Date): string => {
    const now = new Date();
    
    if (progress === 100) {
      return 'bar-complete';
    }
    
    // 檢查是否落後
    if (now > plannedEnd && progress < 100) {
      return 'bar-delayed';
    }
    
    // 計算預期進度
    const totalDuration = plannedEnd.getTime() - actualStart.getTime();
    const elapsed = now.getTime() - actualStart.getTime();
    const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
    
    if (progress < expectedProgress - 10) {
      return 'bar-behind';
    }
    
    return 'bar-ontrack';
  };
  
  const getStatusText = (progress: number, actualStart: Date, plannedEnd: Date): string => {
    const now = new Date();
    
    if (progress === 100) return '✅ 已完成';
    if (now > plannedEnd) return '🔴 延遲';
    
    const totalDuration = plannedEnd.getTime() - actualStart.getTime();
    const elapsed = now.getTime() - actualStart.getTime();
    const expectedProgress = Math.min(100, (elapsed / totalDuration) * 100);
    
    if (progress < expectedProgress - 10) return '🟡 落後';
    return '🟢 正常';
  };
  
  const changeViewMode = (mode: string) => {
    if (ganttInstanceRef.current) {
      ganttInstanceRef.current.change_view_mode(mode);
    }
  };
  
  return (
    <div className="h-full p-6 bg-white">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">工程進度甘特圖</h1>
        
        <div className="flex gap-2">
          <button
            onClick={() => changeViewMode('Day')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            日
          </button>
          <button
            onClick={() => changeViewMode('Week')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            週
          </button>
          <button
            onClick={() => changeViewMode('Month')}
            className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
          >
            月
          </button>
        </div>
      </div>
      
      <div className="mb-4 flex gap-4 text-sm">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-green-500 rounded"></div>
          <span>正常</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-yellow-500 rounded"></div>
          <span>落後</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-red-500 rounded"></div>
          <span>延遲</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 bg-blue-500 rounded"></div>
          <span>已完成</span>
        </div>
      </div>
      
      <div ref={ganttRef} className="overflow-x-auto"></div>
      
      <style>{`
        .bar-complete .bar {
          fill: #10b981 !important;
        }
        .bar-delayed .bar {
          fill: #ef4444 !important;
        }
        .bar-behind .bar {
          fill: #f59e0b !important;
        }
        .bar-ontrack .bar {
          fill: #3b82f6 !important;
        }
        .gantt-popup {
          padding: 12px;
          min-width: 200px;
        }
      `}</style>
    </div>
  );
};

export default GanttChart;
