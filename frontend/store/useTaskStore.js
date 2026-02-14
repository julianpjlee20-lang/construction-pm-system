import { create } from 'zustand';
import axios from 'axios';

// API 基礎 URL（可從環境變數讀取）
const API_BASE = import.meta.env.VITE_API_BASE || '/api';

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,

  // 取得所有任務
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await axios.get(`${API_BASE}/tasks`);
      set({ tasks: response.data, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch tasks:', error);
    }
  },

  // 新增任務
  addTask: async (taskData) => {
    try {
      const response = await axios.post(`${API_BASE}/tasks`, taskData);
      set((state) => ({ tasks: [...state.tasks, response.data] }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務
  updateTask: async (taskId, updates) => {
    try {
      const response = await axios.put(`${API_BASE}/tasks/${taskId}`, updates);
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? response.data : task
        ),
      }));
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務狀態（用於 Kanban 拖拉）
  updateTaskStatus: async (taskId, newStatus) => {
    return get().updateTask(taskId, { status: newStatus });
  },

  // 上傳照片
  uploadPhoto: async (taskId, photoData) => {
    try {
      const response = await axios.post(
        `${API_BASE}/tasks/${taskId}/photos`,
        photoData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
        }
      );
      
      // 更新本地任務的照片列表
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, photos: [...(task.photos || []), response.data] }
            : task
        ),
      }));
      
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 設定選中的任務（用於 Modal）
  setSelectedTask: (task) => set({ selectedTask: task }),

  // 清除錯誤
  clearError: () => set({ error: null }),
}));

export default useTaskStore;
