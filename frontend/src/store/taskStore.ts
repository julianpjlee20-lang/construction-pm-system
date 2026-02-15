import { create } from 'zustand';
import type { Task, TaskStatus, Photo } from '../types';

interface TaskStore {
  tasks: Task[];
  selectedTaskId: string | null;
  
  // Actions
  setTasks: (tasks: Task[]) => void;
  addTask: (task: Task) => void;
  updateTask: (id: string, updates: Partial<Task>) => void;
  deleteTask: (id: string) => void;
  updateTaskStatus: (id: string, status: TaskStatus) => void;
  updateTaskProgress: (id: string, progress: number) => void;
  addPhoto: (taskId: string, photo: Photo) => void;
  updatePhotoDescription: (taskId: string, photoId: string, description: string) => void;
  selectTask: (id: string | null) => void;
  
  // Getters
  getTaskById: (id: string) => Task | undefined;
  getTasksByStatus: (status: TaskStatus) => Task[];
}

// Mock 資料
const mockTasks: Task[] = [
  {
    id: 'task-001',
    name: '地基開挖',
    description: '深度 2.5m',
    assignee: '張師傅',
    status: 'inProgress',
    plannedStartDate: '2026-02-10',
    plannedEndDate: '2026-02-17',
    plannedDuration: 7,
    actualStartDate: '2026-02-10',
    actualEndDate: null,
    progress: 60,
    dependencies: [],
    photos: [
      {
        id: 'photo-001',
        timestamp: '2026-02-14T15:30:00+08:00',
        description: '開挖進度 60%',
        uploadedBy: '張師傅'
      }
    ]
  },
  {
    id: 'task-002',
    name: '鋼筋綁紮',
    description: '基礎鋼筋',
    assignee: '李師傅',
    status: 'todo',
    plannedStartDate: '2026-02-18',
    plannedEndDate: '2026-02-22',
    plannedDuration: 4,
    actualStartDate: '2026-02-18',
    actualEndDate: null,
    progress: 0,
    dependencies: ['task-001'],
    photos: []
  },
  {
    id: 'task-003',
    name: '混凝土澆置',
    description: 'C3000 混凝土',
    assignee: '王師傅',
    status: 'todo',
    plannedStartDate: '2026-02-23',
    plannedEndDate: '2026-02-25',
    plannedDuration: 2,
    actualStartDate: '2026-02-23',
    actualEndDate: null,
    progress: 0,
    dependencies: ['task-002'],
    photos: []
  },
  {
    id: 'task-004',
    name: '模板拆除',
    description: '養護 7 天後拆除',
    assignee: '張師傅',
    status: 'done',
    plannedStartDate: '2026-02-05',
    plannedEndDate: '2026-02-08',
    plannedDuration: 3,
    actualStartDate: '2026-02-05',
    actualEndDate: '2026-02-08',
    progress: 100,
    dependencies: [],
    photos: [
      {
        id: 'photo-002',
        timestamp: '2026-02-08T10:00:00+08:00',
        description: '拆模完成',
        uploadedBy: '張師傅'
      }
    ]
  }
];

export const useTaskStore = create<TaskStore>((set, get) => ({
  tasks: mockTasks,
  selectedTaskId: null,
  
  setTasks: (tasks) => set({ tasks }),
  
  addTask: (task) => set((state) => ({
    tasks: [...state.tasks, task]
  })),
  
  updateTask: (id, updates) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, ...updates } : task
    )
  })),
  
  deleteTask: (id) => set((state) => ({
    tasks: state.tasks.filter(task => task.id !== id)
  })),
  
  updateTaskStatus: (id, status) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, status } : task
    )
  })),
  
  updateTaskProgress: (id, progress) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === id ? { ...task, progress } : task
    )
  })),
  
  addPhoto: (taskId, photo) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId
        ? { ...task, photos: [...task.photos, photo] }
        : task
    )
  })),
  
  updatePhotoDescription: (taskId, photoId, description) => set((state) => ({
    tasks: state.tasks.map(task =>
      task.id === taskId
        ? {
            ...task,
            photos: task.photos.map(photo =>
              photo.id === photoId
                ? { ...photo, description }
                : photo
            )
          }
        : task
    )
  })),
  
  selectTask: (id) => set({ selectedTaskId: id }),
  
  getTaskById: (id) => get().tasks.find(task => task.id === id),
  
  getTasksByStatus: (status) => get().tasks.filter(task => task.status === status)
}));
