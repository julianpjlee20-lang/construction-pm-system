import { create } from 'zustand';

// Mock API 函式（後續替換為真實 API）
const mockApi = {
  getTasks: async () => {
    // 模擬網路延遲
    await new Promise(resolve => setTimeout(resolve, 300));
    return [
      {
        id: "task-001",
        name: "鋼筋綁紮",
        description: "1F 鋼筋綁紮作業",
        assignee: "張師傅",
        status: "進行中",
        plannedStartDate: "2026-02-10",
        plannedEndDate: "2026-02-15",
        plannedDuration: 5,
        actualStartDate: "2026-02-10",
        actualEndDate: null,
        progress: 60,
        dependencies: [],
        photos: [
          {
            id: "photo-001",
            timestamp: "2026-02-14T15:30:00Z",
            gdriveUrl: "https://via.placeholder.com/800x600",
            thumbnailUrl: "https://via.placeholder.com/200x150",
            description: "鋼筋綁紮完成 60%",
            uploadedBy: "張師傅"
          }
        ]
      },
      {
        id: "task-002",
        name: "模板組立",
        description: "1F 牆面模板安裝",
        assignee: "李師傅",
        status: "待辦",
        plannedStartDate: "2026-02-16",
        plannedEndDate: "2026-02-20",
        plannedDuration: 4,
        actualStartDate: null,
        actualEndDate: null,
        progress: 0,
        dependencies: ["task-001"],
        photos: []
      },
      {
        id: "task-003",
        name: "混凝土澆置",
        description: "1F 樓板混凝土",
        assignee: "王師傅",
        status: "已完成",
        plannedStartDate: "2026-02-05",
        plannedEndDate: "2026-02-09",
        plannedDuration: 4,
        actualStartDate: "2026-02-05",
        actualEndDate: "2026-02-09",
        progress: 100,
        dependencies: [],
        photos: [
          {
            id: "photo-002",
            timestamp: "2026-02-09T10:00:00Z",
            gdriveUrl: "https://via.placeholder.com/800x600",
            thumbnailUrl: "https://via.placeholder.com/200x150",
            description: "混凝土澆置完成",
            uploadedBy: "王師傅"
          }
        ]
      },
      {
        id: "task-004",
        name: "水電配管",
        description: "2F 水電管路配置",
        assignee: "陳師傅",
        status: "進行中",
        plannedStartDate: "2026-02-12",
        plannedEndDate: "2026-02-14",
        plannedDuration: 2,
        actualStartDate: "2026-02-13",
        actualEndDate: null,
        progress: 30,
        dependencies: [],
        photos: []
      }
    ];
  },
  
  updateTask: async (id, updates) => {
    await new Promise(resolve => setTimeout(resolve, 200));
    return { id, ...updates };
  },
  
  uploadPhoto: async (taskId, photoData) => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return {
      id: `photo-${Date.now()}`,
      timestamp: new Date().toISOString(),
      gdriveUrl: photoData.url,
      thumbnailUrl: photoData.url,
      description: photoData.description || "照片上傳",
      uploadedBy: photoData.uploadedBy || "使用者"
    };
  }
};

export const useTaskStore = create((set, get) => ({
  tasks: [],
  loading: false,
  selectedTask: null,
  
  // 載入任務
  fetchTasks: async () => {
    set({ loading: true });
    try {
      const tasks = await mockApi.getTasks();
      set({ tasks, loading: false });
    } catch (error) {
      console.error('Failed to fetch tasks:', error);
      set({ loading: false });
    }
  },
  
  // 更新任務狀態（Kanban 拖拉）
  updateTaskStatus: async (taskId, newStatus) => {
    const tasks = get().tasks;
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, status: newStatus } : task
    );
    set({ tasks: updatedTasks });
    
    try {
      await mockApi.updateTask(taskId, { status: newStatus });
    } catch (error) {
      console.error('Failed to update task status:', error);
      // 回滾
      set({ tasks });
    }
  },
  
  // 更新任務進度
  updateTaskProgress: async (taskId, progress) => {
    const tasks = get().tasks;
    const updatedTasks = tasks.map(task =>
      task.id === taskId ? { ...task, progress } : task
    );
    set({ tasks: updatedTasks });
    
    try {
      await mockApi.updateTask(taskId, { progress });
    } catch (error) {
      console.error('Failed to update task progress:', error);
      set({ tasks });
    }
  },
  
  // 上傳照片
  uploadPhoto: async (taskId, photoFile, description, uploadedBy) => {
    try {
      // 模擬照片 URL（實際應該先壓縮後上傳到後端）
      const url = URL.createObjectURL(photoFile);
      const newPhoto = await mockApi.uploadPhoto(taskId, {
        url,
        description,
        uploadedBy
      });
      
      const tasks = get().tasks;
      const updatedTasks = tasks.map(task =>
        task.id === taskId
          ? { ...task, photos: [...task.photos, newPhoto] }
          : task
      );
      set({ tasks: updatedTasks });
      
      return newPhoto;
    } catch (error) {
      console.error('Failed to upload photo:', error);
      throw error;
    }
  },
  
  // 選擇任務（進入詳情頁）
  selectTask: (taskId) => {
    const task = get().tasks.find(t => t.id === taskId);
    set({ selectedTask: task });
  },
  
  // 清除選擇
  clearSelectedTask: () => {
    set({ selectedTask: null });
  }
}));
