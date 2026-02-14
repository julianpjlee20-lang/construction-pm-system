/**
 * GanttChart 元件 - 甘特圖
 * 使用 Frappe Gantt 顯示任務進度
 * 顯示預計進度（灰色底線）+ 實際進度（藍色進度條）
 * 落後警示顏色：綠（正常）、黃（落後 <20%）、紅（落後 ≥20%）
 */
import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import useTaskStore from '../store/useTaskStore';

const GanttChart = ({ onTaskClick }) => {
  const ganttRef = useRef(null);
  const ganttInstance = useRef(null);
  const { tasks } = useTaskStore();

  useEffect(() => {
    if (!ganttRef.current || tasks.length === 0) return;

    // 轉換任務資料為 Frappe Gantt 格式
    const ganttTasks = tasks.map((task) => {
      // 計算落後程度
      const planned = new Date(task.plannedEndDate);
      const actual = task.actualEndDate ? new Date(task.actualEndDate) : new Date();
      const plannedStart = new Date(task.plannedStartDate);
      const totalPlannedDays = (planned - plannedStart) / (1000 * 60 * 60 * 24);
      const actualDays = (actual - plannedStart) / (1000 * 60 * 60 * 24);
      const delay = ((actualDays - totalPlannedDays) / totalPlannedDays) * 100;

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
        start: task.actualStartDate || task.plannedStartDate,
        end: task.actualEndDate || task.plannedEndDate,
        progress: task.progress,
        dependencies: task.dependencies.join(','),
        custom_class: customClass,
      };
    });

    // 清除舊的甘特圖
    if (ganttInstance.current) {
      ganttRef.current.innerHTML = '';
    }

    // 建立新的甘特圖
    ganttInstance.current = new Gantt(ganttRef.current, ganttTasks, {
      view_mode: 'Day',
      bar_height: 30,
      bar_corner_radius: 3,
      arrow_curve: 5,
      padding: 18,
      date_format: 'YYYY-MM-DD',
      language: 'zh',
      on_click: (task) => {
        onTaskClick(task.id);
      },
      on_date_change: (task, start, end) => {
        console.log('Date changed:', task, start, end);
      },
      on_progress_change: (task, progress) => {
        console.log('Progress changed:', task, progress);
      },
    });

    // 自訂樣式
    const style = document.createElement('style');
    style.textContent = `
      .gantt .bar-normal { fill: #60a5fa; }
      .gantt .bar-warning { fill: #fbbf24; }
      .gantt .bar-danger { fill: #ef4444; }
      .gantt .bar-complete { fill: #10b981; }
      .gantt .bar-progress { fill: rgba(255,255,255,0.3); }
    `;
    document.head.appendChild(style);

    return () => {
      if (style.parentNode) {
        style.parentNode.removeChild(style);
      }
    };
  }, [tasks, onTaskClick]);

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">甘特圖</h2>
        
        {/* 圖例 */}
        <div className="flex gap-4 text-sm">
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-green-500 rounded"></div>
            <span>已完成</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-blue-400 rounded"></div>
            <span>正常</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-yellow-400 rounded"></div>
            <span>輕微延遲</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-4 h-4 bg-red-500 rounded"></div>
            <span>嚴重延遲</span>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-4 overflow-x-auto">
        <svg ref={ganttRef}></svg>
      </div>
    </div>
  );
};

export default GanttChart;
