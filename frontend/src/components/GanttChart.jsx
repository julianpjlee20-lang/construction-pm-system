/**
 * GanttChart 元件 - 甘特圖（簡化版）
 * 由於資料庫目前只有 id, name, status, progress
 * 暫時使用模擬日期資料
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

    // 為每個任務生成模擬日期（基於任務順序）
    const ganttTasks = tasks.map((task, index) => {
      const today = new Date();
      const startDate = new Date(today);
      startDate.setDate(today.getDate() + index * 5);  // 每個任務間隔 5 天
      
      const endDate = new Date(startDate);
      endDate.setDate(startDate.getDate() + 10);  // 每個任務持續 10 天

      let customClass = 'bar-normal';
      if (task.status === '已完成') {
        customClass = 'bar-complete';
      } else if (task.status === '進行中') {
        customClass = 'bar-progress';
      }

      return {
        id: task.id,
        name: task.name,
        start: startDate.toISOString().split('T')[0],
        end: endDate.toISOString().split('T')[0],
        progress: task.progress || 0,
        dependencies: '',
        custom_class: customClass,
      };
    });

    // 清除舊的甘特圖
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = '';
    }

    // 建立新的甘特圖
    try {
      ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: 'Day',
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        date_format: 'YYYY-MM-DD',
        language: 'zh',
        
        on_click: (task) => {
          if (onTaskClick) {
            onTaskClick(task.id);
          }
        },
        
        on_date_change: (task, start, end) => {
          console.log('📅 Date changed (not saved - schema limitation)');
          // 資料庫沒有日期欄位，無法儲存
        },
        
        on_progress_change: (task, progress) => {
          console.log('📊 Progress changed:', task.name, progress);
          
          // 更新進度到 Supabase
          updateTask(task.id, {
            progress: progress
          }).then(() => {
            console.log('✅ Progress saved');
          }).catch(err => {
            console.error('❌ Failed to save progress:', err);
          });
        },
      });

      // 自訂樣式
      const style = document.createElement('style');
      style.id = 'gantt-custom-style';
      
      // 移除舊樣式
      const oldStyle = document.getElementById('gantt-custom-style');
      if (oldStyle) oldStyle.remove();
      
      style.textContent = `
        .gantt .bar-normal { fill: #60a5fa; }
        .gantt .bar-progress { fill: #fbbf24; }
        .gantt .bar-complete { fill: #10b981; }
        .gantt .bar-label { fill: #333; font-size: 12px; }
        .gantt .bar:hover { opacity: 0.9; cursor: pointer; }
        .gantt .bar-progress-handle { cursor: ew-resize; }
      `;
      document.head.appendChild(style);

    } catch (error) {
      console.error('Failed to create Gantt chart:', error);
    }

    return () => {
      const style = document.getElementById('gantt-custom-style');
      if (style) style.remove();
    };
  }, [tasks, onTaskClick, updateTask]);

  // 視圖切換
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
          <div className="flex gap-2">
            <button onClick={() => changeView('Day')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">日</button>
            <button onClick={() => changeView('Week')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">週</button>
            <button onClick={() => changeView('Month')} className="px-3 py-1 text-sm bg-blue-100 text-blue-700 rounded hover:bg-blue-200">月</button>
          </div>
          
          {/* 圖例 */}
          <div className="flex gap-3 text-xs md:text-sm">
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-green-500 rounded"></div>
              <span>已完成</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-yellow-400 rounded"></div>
              <span>進行中</span>
            </div>
            <div className="flex items-center gap-1">
              <div className="w-3 h-3 bg-blue-400 rounded"></div>
              <span>待辦</span>
            </div>
          </div>
        </div>
      </div>

      {/* 提示訊息 */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 mb-4 text-sm text-yellow-800">
        <span className="font-semibold">⚠️ 注意：</span>
        <span className="ml-2">目前資料庫僅支援進度編輯。日期功能需要資料庫升級後才能使用。</span>
      </div>

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        {tasks.length > 0 ? (
          <svg ref={ganttRef}></svg>
        ) : (
          <div className="text-center text-gray-400 py-12">
            <p>暫無任務資料</p>
            <p className="text-sm mt-2">請先在看板中建立任務</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
