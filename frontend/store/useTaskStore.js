import { create } from 'zustand';
import { createClient } from '@supabase/supabase-js';

// Supabase 客戶端
const supabase = createClient(
  import.meta.env.VITE_SUPABASE_URL || 'https://igwafmmxfkaorzfimyum.supabase.co',
  import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imlnd2FmbW14Zmthb3J6ZmlteXVtIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzExMTg2MzIsImV4cCI6MjA4NjY5NDYzMn0.p0R2kO5I9kEL7QBS-rQwgMeG_w-2IqlqcbJnB0vgoW4'
);

const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  error: null,
  selectedTask: null,

  // 取得所有任務
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .order('id');

      if (error) throw error;

      // 補充預設值
      const tasksWithDefaults = (data || []).map(task => ({
        ...task,
        description: task.description || '',
        assignee: task.assignee || '',
        progress: task.progress || 0,
        status: task.status || '待辦',
        dependencies: task.dependencies || [],
        photos: []
      }));

      set({ tasks: tasksWithDefaults, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
      console.error('Failed to fetch tasks:', error);
    }
  },

  // 新增任務
  addTask: async (taskData) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .insert([{
          name: taskData.name,
          status: taskData.status || '待辦',
          progress: taskData.progress || 0,
          project_id: taskData.project_id
        }])
        .select()
        .single();

      if (error) throw error;

      set((state) => ({ tasks: [...state.tasks, data] }));
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務
  updateTask: async (taskId, updates) => {
    try {
      const { data, error } = await supabase
        .from('tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? data : task
        ),
      }));
      
      return data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務狀態
  updateTaskStatus: async (taskId, newStatus) => {
    return get().updateTask(taskId, { status: newStatus });
  },

  // 上傳照片（暫時用 base64，之後可升級到 Supabase Storage）
  uploadPhoto: async (taskId, photoFile) => {
    try {
      // 轉換為 base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(photoFile);
      });

      const photoData = {
        url: base64,
        description: photoFile.name,
        uploaded_by: '施工人員'
      };

      // TODO: 上傳到 Supabase Storage
      // 暫時儲存在 task 的 photos array（需要資料庫 schema 調整）

      return photoData;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 設定選中的任務
  setSelectedTask: (task) => set({ selectedTask: task }),

  // 清除錯誤
  clearError: () => set({ error: null }),
}));

export default useTaskStore;
