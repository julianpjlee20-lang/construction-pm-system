/**
 * Zustand 全域狀態管理
 * 管理所有任務資料、狀態更新、照片上傳
 */
import { create } from 'zustand';

// Mock 資料
const mockTasks = [
  {
    id: "task-001",
    name: "鋼筋綁紮",
    description: "一樓鋼筋綁紮作業，需完成 A1-A5 區域",
    assignee: "張師傅",
    status: "進行中",
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
    status: "待辦",
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
    status: "已完成",
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

const useTaskStore = create((set, get) => ({
  // 狀態
  tasks: mockTasks,
  selectedTask: null,

  // 更新任務狀態（拖拉卡片）
  updateTaskStatus: (taskId, newStatus) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, status: newStatus } : task
      ),
    }));
  },

  // 更新任務詳情
  updateTask: (taskId, updatedData) => {
    set((state) => ({
      tasks: state.tasks.map((task) =>
        task.id === taskId ? { ...task, ...updatedData } : task
      ),
    }));
  },

  // 選擇任務（開啟詳情頁）
  selectTask: (taskId) => {
    const task = get().tasks.find((t) => t.id === taskId);
    set({ selectedTask: task });
  },

  // 關閉詳情頁
  closeTaskDetail: () => {
    set({ selectedTask: null });
  },

  // 上傳照片（Mock 實作）
  uploadPhoto: async (taskId, file) => {
    // 模擬上傳進度
    return new Promise((resolve) => {
      setTimeout(() => {
        const newPhoto = {
          id: `photo-${Date.now()}`,
          timestamp: new Date().toISOString(),
          gdriveUrl: `https://drive.google.com/file/d/mock-${Date.now()}`,
          thumbnailUrl: URL.createObjectURL(file),
          description: file.name,
          uploadedBy: "當前用戶"
        };

        set((state) => ({
          tasks: state.tasks.map((task) =>
            task.id === taskId
              ? { ...task, photos: [...task.photos, newPhoto] }
              : task
          ),
        }));

        resolve(newPhoto);
      }, 1500); // 模擬 1.5 秒上傳時間
    });
  },

  // 取得任務（依狀態分組）
  getTasksByStatus: (status) => {
    return get().tasks.filter((task) => task.status === status);
  },

  // 取得甘特圖資料
  getGanttData: () => {
    return get().tasks.map((task) => ({
      id: task.id,
      name: task.name,
      start: task.actualStartDate || task.plannedStartDate,
      end: task.actualEndDate || task.plannedEndDate,
      progress: task.progress,
      dependencies: task.dependencies.join(','),
      custom_class: getTaskClass(task),
    }));
  },
}));

// 計算任務警示顏色
function getTaskClass(task) {
  if (task.status === '已完成') return 'bar-complete';
  
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

export default useTaskStore;
