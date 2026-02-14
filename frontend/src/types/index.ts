// 類型定義
export interface Photo {
  id: string;
  timestamp: string;
  gdriveUrl?: string;
  gdriveFileId?: string;
  description: string;
  uploadedBy: string;
  thumbnailUrl?: string;
  localUrl?: string; // 本地預覽URL
}

export interface Task {
  // 基本資訊
  id: string;
  name: string;
  description: string;
  assignee: string;
  
  // Kanban
  status: 'todo' | 'inProgress' | 'done'; // 待辦/進行中/已完成
  
  // 甘特圖：預計 vs 實際
  plannedStartDate: string; // ISO 8601
  plannedEndDate: string;
  plannedDuration: number; // 天
  
  actualStartDate: string;
  actualEndDate: string | null; // 未完成時為 null
  progress: number; // 0-100%
  
  dependencies: string[]; // 前置任務 ID
  
  // 照片記錄
  photos: Photo[];
}

export type TaskStatus = Task['status'];

export const TASK_STATUS_LABELS: Record<TaskStatus, string> = {
  todo: '待辦',
  inProgress: '進行中',
  done: '已完成'
};
