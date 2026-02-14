import { create } from 'zustand';

// LocalStorage 鍵名
const STORAGE_KEY = 'construction-pm-tasks';

// 從 localStorage 讀取資料
const loadFromStorage = () => {
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    return saved ? JSON.parse(saved) : getInitialTasks();
  } catch (error) {
    console.error('Failed to load from localStorage:', error);
    return getInitialTasks();
  }
};

// 儲存到 localStorage
const saveToStorage = (tasks) => {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
};

// 初始任務資料
const getInitialTasks = () => [
  {
    id: "1",
    name: "基礎開挖",
    description: "南港辦公室基礎工程",
    status: "進行中",
    assignee: "張師傅",
    plannedStartDate: "2026-02-10",
    plannedEndDate: "2026-02-20",
    plannedDuration: 10,
    actualStartDate: "2026-02-10",
    actualEndDate: null,
    progress: 60,
    dependencies: [],
    photos: []
  },
  {
    id: "2",
    name: "鋼筋綁紮",
    description: "鋼筋工程",
    status: "待辦",
    assignee: "李師傅",
    plannedStartDate: "2026-02-21",
    plannedEndDate: "2026-02-28",
    plannedDuration: 7,
    actualStartDate: null,
    actualEndDate: null,
    progress: 0,
    dependencies: ["1"],
    photos: []
  },
  {
    id: "3",
    name: "混凝土澆置",
    description: "基礎混凝土工程",
    status: "待辦",
    assignee: "王師傅",
    plannedStartDate: "2026-03-01",
    plannedEndDate: "2026-03-05",
    plannedDuration: 4,
    actualStartDate: null,
    actualEndDate: null,
    progress: 0,
    dependencies: ["2"],
    photos: []
  }
];

const useTaskStore = create((set, get) => ({
  tasks: loadFromStorage(),
  loading: false,
  error: null,
  selectedTask: null,

  // 取得所有任務（從 localStorage）
  fetchTasks: async () => {
    set({ loading: true, error: null });
    try {
      // 模擬 API 延遲
      await new Promise(resolve => setTimeout(resolve, 300));
      const tasks = loadFromStorage();
      set({ tasks, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // 新增任務
  addTask: async (taskData) => {
    try {
      const newTask = {
        id: Date.now().toString(),
        ...taskData,
        photos: [],
        actualStartDate: null,
        actualEndDate: null,
        progress: 0
      };
      
      const updatedTasks = [...get().tasks, newTask];
      saveToStorage(updatedTasks);
      set({ tasks: updatedTasks });
      return newTask;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務
  updateTask: async (taskId, updates) => {
    try {
      const updatedTasks = get().tasks.map((task) =>
        task.id === taskId ? { ...task, ...updates } : task
      );
      
      saveToStorage(updatedTasks);
      set({ tasks: updatedTasks });
      
      return updatedTasks.find(t => t.id === taskId);
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 更新任務狀態（用於 Kanban 拖拉）
  updateTaskStatus: async (taskId, newStatus) => {
    return get().updateTask(taskId, { status: newStatus });
  },

  // 上傳照片（儲存 base64）
  uploadPhoto: async (taskId, photoFile) => {
    try {
      // 轉換為 base64
      const base64 = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onloadend = () => resolve(reader.result);
        reader.readAsDataURL(photoFile);
      });

      const photoData = {
        id: Date.now().toString(),
        url: base64,
        description: photoFile.name,
        timestamp: new Date().toISOString(),
        uploadedBy: '施工人員'
      };

      const updatedTasks = get().tasks.map((task) =>
        task.id === taskId
          ? { ...task, photos: [...(task.photos || []), photoData] }
          : task
      );

      saveToStorage(updatedTasks);
      set({ tasks: updatedTasks });
      
      return photoData;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  // 設定選中的任務（用於 Modal）
  setSelectedTask: (task) => set({ selectedTask: task }),

  // 清除錯誤
  clearError: () => set({ error: null }),

  // 重置資料
  resetData: () => {
    const initialTasks = getInitialTasks();
    saveToStorage(initialTasks);
    set({ tasks: initialTasks });
  }
}));

export default useTaskStore;
