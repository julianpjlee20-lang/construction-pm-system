import React, { useEffect, useRef } from 'react';
import Gantt from 'frappe-gantt';
import useTaskStore from '../../store/useTaskStore';
import { differenceInDays, parseISO } from 'date-fns';
import './gantt-custom.css';

const GanttChart = ({ onTaskClick }) => {
  const { tasks, fetchTasks } = useTaskStore();
  const ganttRef = useRef(null);
  const ganttInstanceRef = useRef(null);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  useEffect(() => {
    if (tasks.length === 0 || !ganttRef.current) return;

    // 轉換任務資料為 Frappe Gantt 格式
    const ganttTasks = tasks.map((task) => {
      const status = calculateTaskStatus(task);
      
      return {
        id: task.id,
        name: task.name,
        start: task.actualStartDate || task.plannedStartDate,
        end: task.actualEndDate || task.plannedEndDate,
        progress: task.progress || 0,
        dependencies: task.dependencies?.join(',') || '',
        custom_class: `status-${status}`,
        // 儲存原始資料用於點擊事件
        _task: task,
      };
    });

    // 清除舊的 Gantt 實例
    if (ganttInstanceRef.current) {
      ganttRef.current.innerHTML = '';
    }

    // 建立新的 Gantt 圖表
    try {
      ganttInstanceRef.current = new Gantt(ganttRef.current, ganttTasks, {
        view_mode: 'Day',
        date_format: 'YYYY-MM-DD',
        language: 'zh',
        bar_height: 30,
        bar_corner_radius: 3,
        arrow_curve: 5,
        padding: 18,
        popup_trigger: 'click',
        on_click: (task) => {
          // 點擊任務開啟詳情 Modal
          if (task._task && onTaskClick) {
            onTaskClick(task._task.id);
          }
        },
        on_view_change: (mode) => {
          console.log('View mode changed to:', mode);
        },
        custom_popup_html: (task) => {
          const progress = task.progress || 0;
          const status = calculateTaskStatus(task._task);
          const statusText = {
            'on-time': '準時',
            'warning': '延遲 1-3 天',
            'late': '延遲 >3 天',
          }[status] || '準時';

          return `
            <div class="gantt-popup">
              <h3>${task.name}</h3>
              <p><strong>負責人：</strong>${task._task?.assignee || '未分配'}</p>
              <p><strong>進度：</strong>${progress}%</p>
              <p><strong>狀態：</strong><span class="status-badge status-${status}">${statusText}</span></p>
              <p class="text-sm text-gray-500">點擊查看詳情</p>
            </div>
          `;
        },
      });
    } catch (error) {
      console.error('Failed to create Gantt chart:', error);
    }

    return () => {
      if (ganttInstanceRef.current) {
        ganttRef.current.innerHTML = '';
      }
    };
  }, [tasks, onTaskClick]);

  // 計算任務狀態（落後警示）
  const calculateTaskStatus = (task) => {
    if (!task.plannedEndDate) return 'on-time';

    const today = new Date();
    const plannedEnd = parseISO(task.plannedEndDate);
    const actualEnd = task.actualEndDate ? parseISO(task.actualEndDate) : today;
    
    // 如果已完成，檢查實際結束日期
    if (task.status === '已完成') {
      const delay = differenceInDays(actualEnd, plannedEnd);
      if (delay <= 0) return 'on-time';
      if (delay <= 3) return 'warning';
      return 'late';
    }

    // 進行中或待辦，檢查目前日期與預計進度
    const totalDays = differenceInDays(plannedEnd, parseISO(task.plannedStartDate || task.plannedEndDate));
    const elapsedDays = differenceInDays(today, parseISO(task.actualStartDate || task.plannedStartDate));
    const expectedProgress = totalDays > 0 ? (elapsedDays / totalDays) * 100 : 0;
    const actualProgress = task.progress || 0;

    // 比較實際進度與預期進度
    const progressGap = expectedProgress - actualProgress;
    
    if (progressGap <= 0) return 'on-time'; // 提前或準時
    if (progressGap <= 15) return 'warning'; // 稍微落後
    return 'late'; // 嚴重落後
  };

  // 視圖切換
  const changeViewMode = (mode) => {
    if (ganttInstanceRef.current) {
      ganttInstanceRef.current.change_view_mode(mode);
    }
  };

  return (
    <div className="h-full p-4 md:p-6">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h1 className="text-2xl md:text-3xl font-bold text-gray-800 mb-4 md:mb-0">
          甘特圖
        </h1>

        {/* 視圖切換按鈕 */}
        <div className="flex space-x-2 overflow-x-auto pb-2 md:pb-0">
          {['Day', 'Week', 'Month'].map((mode) => (
            <button
              key={mode}
              onClick={() => changeViewMode(mode)}
              className="px-4 py-2 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors text-sm whitespace-nowrap"
            >
              {mode === 'Day' ? '日' : mode === 'Week' ? '週' : '月'}
            </button>
          ))}
        </div>
      </div>

      {/* 圖例 */}
      <div className="bg-white rounded-lg shadow-md p-4 mb-4">
        <div className="flex flex-wrap gap-4 text-sm">
          <div className="flex items-center">
            <div className="w-4 h-4 bg-green-500 rounded mr-2"></div>
            <span className="text-gray-700">準時</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-yellow-500 rounded mr-2"></div>
            <span className="text-gray-700">延遲 1-3 天</span>
          </div>
          <div className="flex items-center">
            <div className="w-4 h-4 bg-red-500 rounded mr-2"></div>
            <span className="text-gray-700">延遲 &gt;3 天</span>
          </div>
        </div>
      </div>

      {/* 甘特圖容器 */}
      <div className="bg-white rounded-lg shadow-md p-4 overflow-x-auto">
        {tasks.length === 0 ? (
          <div className="text-center text-gray-400 py-12">
            <p>目前無任務資料</p>
          </div>
        ) : (
          <div ref={ganttRef} className="gantt-container"></div>
        )}
      </div>
    </div>
  );
};

export default GanttChart;
