/**
 * Zustand 全域狀態管理
 * 整合後端 API：http://localhost:8096
 */
import { create } from 'zustand';
import axios from 'axios';

const API_BASE_URL = 'http://localhost:8096/api';

// API 客戶端
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

const useTaskStore = create((set, get) => ({
  // 狀態
  tasks: [],
  selectedTask: null,
  loading: false,
  error: null,

  // ========== API 整合 ==========

  // 取得所有任務 (GET /api/tasks)
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await api.get('/tasks');
      set({ tasks: response.data, loading: false });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      set({ error: error.message, loading: false });
      // 如果後端未啟動，使用 mock 資料
      if (error.code === 'ERR_NETWORK') {
        console.warn('⚠️ 後端未啟動，使用 Mock 資料');
        set({ tasks: getMockTasks(), loading: false });
      }
    }
  },

  // 建立任務 (POST /api/tasks)
  createTask: async (taskData) => {
    try {
      const response = await api.post('/tasks', taskData);
      set((state) => ({
        tasks: [...state.tasks, response.data]
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to create task:', error);
      throw error;
    }
  },

  // 更新任務 (PUT /api/tasks/:id)
  updateTask: async (taskId, updatedData) => {
    try {
      const response = await api.put(`/tasks/${taskId}`, updatedData);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? response.data : task
        ),
      }));
      return response.data;
    } catch (error) {
      console.error('Failed to update task:', error);
      // 降級到本地更新
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...updatedData } : task
        ),
      }));
    }
  },

  // 更新任務狀態（拖拉卡片）
  updateTaskStatus: async (taskId, newStatus) => {
    // 後端使用中文狀態，直接傳遞
    await get().updateTask(taskId, { 
      status: newStatus
    });
  },

  // 上傳照片 (POST /api/tasks/:id/photos)
  uploadPhoto: async (taskId, file) => {
    try {
      const formData = new FormData();
      formData.append('photo', file);
      formData.append('description', file.name);
      formData.append('uploadedBy', '當前用戶'); // TODO: 實際用戶系統

      const response = await api.post(`/tasks/${taskId}/photos`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      // 更新本地任務的照片陣列
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, photos: [...(task.photos || []), response.data] }
            : task
        ),
      }));

      return response.data;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      
      // 降級：模擬上傳（本地預覽）
      const mockPhoto = {
        id: `photo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gdriveUrl: '#',
        thumbnailUrl: URL.createObjectURL(file),
        description: file.name,
        uploadedBy: '當前用戶'
      };

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, photos: [...(task.photos || []), mockPhoto] }
            : task
        ),
      }));

      return mockPhoto;
    }
  },

  // ========== 本地狀態操作 ==========

  // 選擇任務（開啟詳情頁）
  setSelectedTask: (task) => {
    set({ selectedTask: task });
  },

  // 關閉詳情頁
  closeTaskDetail: () => {
    set({ selectedTask: null });
  },

  // 取得任務（依狀態分組）
  getTasksByStatus: (status) => {
    const statusMapping = {
      '待辦': ['todo', '待辦'],
      '進行中': ['in-progress', '進行中'],
      '已完成': ['done', '已完成']
    };
    
    const allowedStatuses = statusMapping[status] || [status];
    return get().tasks.filter((task) => allowedStatuses.includes(task.status));
  },

  // 取得甘特圖資料
  getGanttData: () => {
    return get().tasks.map((task) => ({
      id: task.id,
      name: task.name,
      start: task.actualStartDate || task.plannedStartDate,
      end: task.actualEndDate || task.plannedEndDate,
      progress: task.progress,
      dependencies: (task.dependencies || []).join(','),
      custom_class: getTaskClass(task),
    }));
  },
}));

// ========== 輔助函數 ==========

// 計算任務警示顏色
function getTaskClass(task) {
  const statusMapping = {
    'done': '已完成',
    'in-progress': '進行中',
    'todo': '待辦'
  };
  
  const displayStatus = statusMapping[task.status] || task.status;
  
  if (displayStatus === '已完成') return 'bar-complete';
  
  const planned = new Date(task.plannedEndDate);
  const actual = task.actualEndDate ? new Date(task.actualEndDate) : new Date();
  const plannedStart = new Date(task.plannedStartDate);
  const totalPlannedDays = (planned - plannedStart) / (1000 * 60 * 60 * 24);
  const actualDays = (actual - plannedStart) / (1000 * 60 * 60 * 24);
  
  const delay = ((actualDays - totalPlannedDays) / totalPlannedDays) * 100;
  
  if (delay < 0) return 'bar-normal'; // 超前
  if (delay < 20) return 'bar-warning'; // 落後 < 20%
  return 'bar-danger'; // 落後 >= 20%
}

// Mock 資料（後端未啟動時使用）
function getMockTasks() {
  return [
    {
      id: "task-001",
      name: "鋼筋綁紮",
      description: "一樓鋼筋綁紮作業，需完成 A1-A5 區域",
      assignee: "張師傅",
      status: "in-progress",
      plannedStartDate: "2026-02-10",
      plannedEndDate: "2026-02-20",
      actualStartDate: "2026-02-12",
      actualEndDate: null,
      progress: 60,
      dependencies: [],
      photos: [
        {
          id: "photo-001",
          timestamp: "2026-02-14T15:30:00+08:00",
          gdriveUrl: "https://drive.google.com/file/d/example1",
          thumbnailUrl: "https://via.placeholder.com/150",
          description: "鋼筋綁紮進度 60%",
          uploadedBy: "張師傅"
        }
      ]
    },
    {
      id: "task-002",
      name: "模板組立",
      description: "一樓樑柱模板組立",
      assignee: "李師傅",
      status: "todo",
      plannedStartDate: "2026-02-21",
      plannedEndDate: "2026-02-28",
      actualStartDate: null,
      actualEndDate: null,
      progress: 0,
      dependencies: ["task-001"],
      photos: []
    },
    {
      id: "task-003",
      name: "基礎開挖",
      description: "地下室基礎開挖及整地",
      assignee: "王師傅",
      status: "done",
      plannedStartDate: "2026-02-01",
      plannedEndDate: "2026-02-09",
      actualStartDate: "2026-02-01",
      actualEndDate: "2026-02-08",
      progress: 100,
      dependencies: [],
      photos: [
        {
          id: "photo-002",
          timestamp: "2026-02-08T10:00:00+08:00",
          gdriveUrl: "https://drive.google.com/file/d/example2",
          thumbnailUrl: "https://via.placeholder.com/150",
          description: "開挖完成驗收",
          uploadedBy: "王師傅"
        }
      ]
    }
  ];
}

export default useTaskStore;
