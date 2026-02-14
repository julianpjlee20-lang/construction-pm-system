// Mock API 資料（開發用）
import axios from 'axios';

const mockTasks = [
  {
    id: 'task-001',
    name: '基礎開挖',
    assignee: '王師傅',
    status: '已完成',
    plannedStartDate: '2026-02-01',
    plannedEndDate: '2026-02-05',
    actualStartDate: '2026-02-01',
    actualEndDate: '2026-02-04',
    progress: 100,
    dependencies: [],
    photos: [
      {
        id: 'photo-001',
        timestamp: '2026-02-04T15:30:00',
        gdriveUrl: 'https://via.placeholder.com/800x600/4CAF50/FFFFFF?text=基礎開挖完成',
        description: '基礎開挖已完成，深度符合設計要求',
        uploadedBy: '王師傅',
      },
    ],
  },
  {
    id: 'task-002',
    name: '鋼筋綁紮',
    assignee: '張師傅',
    status: '進行中',
    plannedStartDate: '2026-02-05',
    plannedEndDate: '2026-02-10',
    actualStartDate: '2026-02-05',
    actualEndDate: null,
    progress: 60,
    dependencies: ['task-001'],
    photos: [
      {
        id: 'photo-002',
        timestamp: '2026-02-08T10:15:00',
        gdriveUrl: 'https://via.placeholder.com/800x600/2196F3/FFFFFF?text=鋼筋綁紮進度60%',
        description: '鋼筋綁紮進度 60%，主筋已完成',
        uploadedBy: '張師傅',
      },
      {
        id: 'photo-003',
        timestamp: '2026-02-09T14:20:00',
        gdriveUrl: 'https://via.placeholder.com/800x600/2196F3/FFFFFF?text=箍筋施工中',
        description: '箍筋施工中，預計明天完成',
        uploadedBy: '張師傅',
      },
    ],
  },
  {
    id: 'task-003',
    name: '模板組立',
    assignee: '李師傅',
    status: '待辦',
    plannedStartDate: '2026-02-10',
    plannedEndDate: '2026-02-12',
    actualStartDate: null,
    actualEndDate: null,
    progress: 0,
    dependencies: ['task-002'],
    photos: [],
  },
  {
    id: 'task-004',
    name: '混凝土澆置',
    assignee: '陳師傅',
    status: '待辦',
    plannedStartDate: '2026-02-12',
    plannedEndDate: '2026-02-13',
    actualStartDate: null,
    actualEndDate: null,
    progress: 0,
    dependencies: ['task-003'],
    photos: [],
  },
  {
    id: 'task-005',
    name: '養護及拆模',
    assignee: '劉師傅',
    status: '待辦',
    plannedStartDate: '2026-02-13',
    plannedEndDate: '2026-02-20',
    actualStartDate: null,
    actualEndDate: null,
    progress: 0,
    dependencies: ['task-004'],
    photos: [],
  },
];

// Mock Axios 攔截器
let tasks = [...mockTasks];

// GET /api/tasks
axios.interceptors.request.use((config) => {
  if (config.url === '/api/tasks' && config.method === 'get') {
    return Promise.resolve({
      ...config,
      adapter: () =>
        Promise.resolve({
          data: tasks,
          status: 200,
          statusText: 'OK',
          headers: {},
          config,
        }),
    });
  }

  // POST /api/tasks
  if (config.url === '/api/tasks' && config.method === 'post') {
    const newTask = {
      id: `task-${Date.now()}`,
      ...config.data,
      photos: [],
    };
    tasks.push(newTask);

    return Promise.resolve({
      ...config,
      adapter: () =>
        Promise.resolve({
          data: newTask,
          status: 201,
          statusText: 'Created',
          headers: {},
          config,
        }),
    });
  }

  // PUT /api/tasks/:id
  const putMatch = config.url?.match(/^\/api\/tasks\/(.+)$/);
  if (putMatch && config.method === 'put') {
    const taskId = putMatch[1];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex !== -1) {
      tasks[taskIndex] = { ...tasks[taskIndex], ...config.data };

      return Promise.resolve({
        ...config,
        adapter: () =>
          Promise.resolve({
            data: tasks[taskIndex],
            status: 200,
            statusText: 'OK',
            headers: {},
            config,
          }),
      });
    }
  }

  // POST /api/tasks/:id/photos
  const photoMatch = config.url?.match(/^\/api\/tasks\/(.+)\/photos$/);
  if (photoMatch && config.method === 'post') {
    const taskId = photoMatch[1];
    const taskIndex = tasks.findIndex((t) => t.id === taskId);

    if (taskIndex !== -1) {
      const newPhoto = {
        id: `photo-${Date.now()}`,
        timestamp: new Date().toISOString(),
        gdriveUrl: 'https://via.placeholder.com/800x600/FF9800/FFFFFF?text=上傳的照片',
        description: config.data.get('description') || '無說明',
        uploadedBy: config.data.get('uploadedBy') || '未知',
      };

      tasks[taskIndex].photos = [...(tasks[taskIndex].photos || []), newPhoto];

      return Promise.resolve({
        ...config,
        adapter: () =>
          Promise.resolve({
            data: newPhoto,
            status: 201,
            statusText: 'Created',
            headers: {},
            config,
          }),
      });
    }
  }

  return config;
});

console.log('🎭 Mock API 已啟用 - 使用模擬資料');
