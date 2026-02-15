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

      // 補充預設值（適應最小 schema）
      const tasksWithDefaults = (data || []).map(task => ({
        id: task.id,
        project_id: task.project_id,
        name: task.name || '',
        description: task.description || '',
        assignee: task.assignee || '',
        status: task.status || '待辦',
        progress: task.progress || 0,
        planned_start_date: task.planned_start_date || null,
        planned_end_date: task.planned_end_date || null,
        actual_start_date: task.actual_start_date || null,
        actual_end_date: task.actual_end_date || null,
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
      // 只插入存在的欄位
      const cleanData = {
        name: taskData.name,
        status: taskData.status || '待辦',
        progress: taskData.progress || 0,
        project_id: taskData.project_id
      };

      const { data, error } = await supabase
        .from('tasks')
        .insert([cleanData])
        .select()
        .single();

      if (error) throw error;

      // 補充預設值
      const fullData = {
        ...data,
        description: '',
        assignee: '',
        dependencies: [],
        photos: []
      };

      set((state) => ({ tasks: [...state.tasks, fullData] }));
      return fullData;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務
  updateTask: async (taskId, updates) => {
    try {
      // 只更新存在的欄位
      const cleanUpdates = {};
      if (updates.name !== undefined) cleanUpdates.name = updates.name;
      if (updates.status !== undefined) cleanUpdates.status = updates.status;
      if (updates.progress !== undefined) cleanUpdates.progress = updates.progress;

      const { data, error } = await supabase
        .from('tasks')
        .update(cleanUpdates)
        .eq('id', taskId)
        .select()
        .single();

      if (error) throw error;

      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId ? { ...task, ...data } : task
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

  // 上傳照片（暫時儲存在本地）
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

      // 更新本地 state
      set((state) => ({
        tasks: state.tasks.map((task) =>
          task.id === taskId
            ? { ...task, photos: [...(task.photos || []), photoData] }
            : task
        ),
      }));

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
