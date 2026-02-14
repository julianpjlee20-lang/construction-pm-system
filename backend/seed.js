const { v4: uuidv4 } = require('uuid');
const db = require('./db');

console.log('🌱 開始建立測試資料...\n');

// 清空現有資料（可選）
const clearData = () => {
  db.db.exec('DELETE FROM photos');
  db.db.exec('DELETE FROM tasks');
  console.log('🗑️  已清空現有資料');
};

// 建立測試任務
const seedTasks = () => {
  const tasks = [
    {
      id: 'task-001',
      name: '基地整地',
      description: '清除雜草、整平地面、設置排水系統',
      assignee: '張師傅',
      status: 'done',
      planned_start_date: '2026-01-05',
      planned_end_date: '2026-01-15',
      planned_duration: 10,
      actual_start_date: '2026-01-05',
      actual_end_date: '2026-01-14',
      progress: 100,
      dependencies: []
    },
    {
      id: 'task-002',
      name: '基礎開挖',
      description: '挖掘基礎、設置鋼筋籠',
      assignee: '李師傅',
      status: 'done',
      planned_start_date: '2026-01-16',
      planned_end_date: '2026-01-25',
      planned_duration: 9,
      actual_start_date: '2026-01-16',
      actual_end_date: '2026-01-26',
      progress: 100,
      dependencies: ['task-001']
    },
    {
      id: 'task-003',
      name: '基礎澆置',
      description: '混凝土澆置、養護',
      assignee: '王師傅',
      status: 'in-progress',
      planned_start_date: '2026-01-27',
      planned_end_date: '2026-02-05',
      planned_duration: 9,
      actual_start_date: '2026-01-28',
      actual_end_date: null,
      progress: 60,
      dependencies: ['task-002']
    },
    {
      id: 'task-004',
      name: '一樓結構施工',
      description: '立柱、樑板施作',
      assignee: '陳師傅',
      status: 'todo',
      planned_start_date: '2026-02-06',
      planned_end_date: '2026-02-20',
      planned_duration: 14,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-003']
    },
    {
      id: 'task-005',
      name: '二樓結構施工',
      description: '立柱、樑板施作',
      assignee: '陳師傅',
      status: 'todo',
      planned_start_date: '2026-02-21',
      planned_end_date: '2026-03-10',
      planned_duration: 17,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-004']
    },
    {
      id: 'task-006',
      name: '屋頂防水',
      description: '防水層施作、隔熱處理',
      assignee: '林師傅',
      status: 'todo',
      planned_start_date: '2026-03-11',
      planned_end_date: '2026-03-18',
      planned_duration: 7,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-005']
    },
    {
      id: 'task-007',
      name: '水電配管',
      description: '給排水、電力管線配置',
      assignee: '黃師傅',
      status: 'todo',
      planned_start_date: '2026-03-19',
      planned_end_date: '2026-04-02',
      planned_duration: 14,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-004']
    },
    {
      id: 'task-008',
      name: '內部裝修',
      description: '牆面粉刷、地板鋪設',
      assignee: '吳師傅',
      status: 'todo',
      planned_start_date: '2026-04-03',
      planned_end_date: '2026-04-25',
      planned_duration: 22,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-006', 'task-007']
    },
    {
      id: 'task-009',
      name: '外牆施作',
      description: '外牆磁磚、塗料施工',
      assignee: '鄭師傅',
      status: 'todo',
      planned_start_date: '2026-04-10',
      planned_end_date: '2026-04-30',
      planned_duration: 20,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-006']
    },
    {
      id: 'task-010',
      name: '最終驗收',
      description: '全面檢查、清潔、交屋',
      assignee: '專案經理',
      status: 'todo',
      planned_start_date: '2026-05-01',
      planned_end_date: '2026-05-05',
      planned_duration: 4,
      actual_start_date: null,
      actual_end_date: null,
      progress: 0,
      dependencies: ['task-008', 'task-009']
    }
  ];

  tasks.forEach(task => {
    try {
      db.createTask(task);
      console.log(`✅ 建立任務: ${task.name}`);
    } catch (error) {
      console.error(`❌ 建立失敗: ${task.name}`, error.message);
    }
  });
};

// 建立測試照片資料（模擬）
const seedPhotos = () => {
  const photos = [
    {
      id: uuidv4(),
      task_id: 'task-001',
      gdrive_url: '/uploads/基地整地/2026-01-14_整地完成.jpg',
      gdrive_file_id: null,
      description: '整地完成照片',
      uploaded_by: '張師傅'
    },
    {
      id: uuidv4(),
      task_id: 'task-002',
      gdrive_url: '/uploads/基礎開挖/2026-01-26_基礎開挖完成.jpg',
      gdrive_file_id: null,
      description: '基礎開挖完成',
      uploaded_by: '李師傅'
    },
    {
      id: uuidv4(),
      task_id: 'task-003',
      gdrive_url: '/uploads/基礎澆置/2026-02-01_混凝土澆置中.jpg',
      gdrive_file_id: null,
      description: '混凝土澆置進行中',
      uploaded_by: '王師傅'
    },
    {
      id: uuidv4(),
      task_id: 'task-003',
      gdrive_url: '/uploads/基礎澆置/2026-02-03_養護狀況.jpg',
      gdrive_file_id: null,
      description: '養護狀況檢查',
      uploaded_by: '王師傅'
    }
  ];

  photos.forEach(photo => {
    try {
      db.createPhoto(photo);
      console.log(`📷 建立照片: ${photo.description}`);
    } catch (error) {
      console.error(`❌ 建立照片失敗`, error.message);
    }
  });
};

// 執行 seed
try {
  clearData();
  console.log('');
  
  seedTasks();
  console.log('');
  
  seedPhotos();
  console.log('');
  
  console.log('✅ 測試資料建立完成！');
  console.log('');
  console.log('📊 統計：');
  const tasks = db.getAllTasks();
  console.log(`   任務總數: ${tasks.length}`);
  console.log(`   已完成: ${tasks.filter(t => t.status === 'done').length}`);
  console.log(`   進行中: ${tasks.filter(t => t.status === 'in-progress').length}`);
  console.log(`   待處理: ${tasks.filter(t => t.status === 'todo').length}`);
  
  const allPhotos = tasks.reduce((sum, task) => sum + task.photos.length, 0);
  console.log(`   照片總數: ${allPhotos}`);
  
} catch (error) {
  console.error('❌ Seed 失敗:', error);
  process.exit(1);
}
