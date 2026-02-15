/**
 * GanttChart 元件 - 可編輯甘特圖
 * ✨ 支援拖拉調整日期與進度！
 */
import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import useTaskStore from '../store/useTaskStore';

const GanttChart = ({ onTaskClick }) => {
  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);
  const { tasks, updateTask } = useTaskStore();

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    // 轉換任務資料為 Frappe Gantt 格式
    const ganttTasks = tasks.map((task) => {
      const plannedStart = task.planned_start_date || new Date().toISOString().split('T')[0];
      const plannedEnd = task.planned_end_date || new Date(Date.now() + 7*24*60*60*1000).toISOString().split('T')[0];
      const actualStart = task.actual_start_date || plannedStart;
      const actualEnd = task.actual_end_date || plannedEnd;

      // 計算落後程度
      const planned = new Date(plannedEnd);
      const actual = task.actual_end_date ? new Date(task.actual_end_date) : new Date();
      const plannedStartDate = new Date(plannedStart);
      const totalPlannedDays = (planned - plannedStartDate) / (1000 * 60 * 60 * 24);
      const actualDays = (actual - plannedStartDate) / (1000 * 60 * 60 * 24);
      const delay = totalPlannedDays > 0 ? ((actualDays - totalPlannedDays) / totalPlannedDays) * 100 : 0;

      let customClass = 'bar-normal';
      if (task.status === '已完成') {
        customClass = 'bar-complete';
      } else if (delay >= 20) {
        customClass = 'bar-danger';
      } else if (delay >= 0) {
        customClass = 'bar-warning';
      }

      return {
        id: task.id,
        name: task.name,
        start: actualStart,
        end: actualEnd,
        progress: task.progress || 0,
        dependencies: (task.dependencies || []).join(','),
        custom_class: customClass,
      };
    });

    // 清除舊的甘特圖
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = '';
    }

    // 建立新的甘特圖（啟用可編輯模式）
    ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
      view_mode: 'Day',
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      date_format: 'YYYY-MM-DD',
      language: 'zh',
      
      // ✨ 啟用點擊事件
      on_click: (task) => {
        if (onTaskClick) {
          onTaskClick(task.id);
        }
      },
      
      // ✨ 啟用拖拉調整日期
      on_date_change: (task, start, end) => {
        console.log('📅 Date changed:', task.name, start, end);
        
        // 更新到 Supabase
        updateTask(task.id, {
          actual_start_date: start.toISOString().split('T')[0],
          actual_end_date: end.toISOString().split('T')[0]
        }).then(() => {
          console.log('✅ Dates saved to database');
        }).catch(err => {
          console.error('❌ Failed to save dates:', err);
        });
      },
      
      // ✨ 啟用拖拉調整進度
      on_progress_change: (task, progress) => {
        console.log('📊 Progress changed:', task.name, progress);
        
        // 更新到 Supabase
        updateTask(task.id, {
          progress: progress
        }).then(() => {
          console.log('✅ Progress saved to database');
        }).catch(err => {
          console.error('❌ Failed to save progress:', err);
        });
      },
      
      // ✨ 啟用視圖切換
      on_view_change: (mode) => {
        console.log('👁️ View changed to:', mode);
      }
    });

    // 自訂樣式
    const style = document.createElement('style');
    style.textContent = `
      .gantt .bar-normal { fill: #60a5fa; }
      .gantt .bar-warning { fill: #fbbf24; }
      .gantt .bar-danger { fill: #ef4444; }
      .gantt .bar-complete { fill: #10b981; }
      .gantt .bar-progress { fill: rgba(255,255,255,0.3); }
      .gantt .bar:hover { opacity: 0.9; cursor: move; }
      .gantt .bar-progress:hover { cursor: ew-resize; }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [tasks, onTaskClick, updateTask]);

  // 視圖切換按鈕
  const changeView = (mode) => {
    if (ganttInstance.current) {
      ganttInstance.current.change_view_mode(mode);
    }
  };

  return (
    <div className="p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <h2 className="text-2xl font-bold text-gray-800">📊 甘特圖</h2>
        
        <div className="flex flex-col md:flex-row gap-4 items-start md:items-center">
          {/* 視圖切換 */}
          <div className="flex gap-2 flex-wrap">
            <button onClick={() => changeView('Day')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">日</button>
            <button onClick={() => changeView('Week')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">週</button>
            <button onClick={() => changeView('Month')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">月</button>
          </div>
          
          {/* 圖例 */}
          <div className="flex gap-3 text-xs md:text-sm flex-wrap">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>正常</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>延遲</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-red-500 rounded"></div>
              <span>嚴重</span>
            </div>
          </div>
        </div>
      </div>

      {/* 操作提示 */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4 text-sm text-blue-800">
        <span className="font-semibold">💡 提示：</span>
        <span className="ml-2">拖拉任務條可調整日期，拖拉進度條右側可調整完成度！</span>
      </div>

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <svg ref={ganttRef}></svg>
      </div>

      {tasks.length === 0 && (
        <div className="text-center text-gray-400 py-12">
          <p>暫無任務資料</p>
          <p className="text-sm mt-2">請先在看板中建立任務</p>
        </div>
      )}
    </div>
  );
};

export default GanttChart;
