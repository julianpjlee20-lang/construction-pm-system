// 建立測試資料
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

function seedData() {
  console.log('🌱 開始建立測試資料...');
  
  // 清空現有資料（可選）
  // db.prepare('DELETE FROM photos').run();
  // db.prepare('DELETE FROM tasks').run();
  
  const now = new Date().toISOString();
  
  // 測試任務資料
  const tasks = [
    {
      id: 'task-001',
      name: '鋼筋綁紮',
      description: '1F 鋼筋綁紮作業',
      assignee: '張師傅',
      status: '進行中',
      plannedStartDate: '2026-02-10',
      plannedEndDate: '2026-02-15',
      plannedDuration: 5,
      actualStartDate: '2026-02-10',
      actualEndDate: null,
      progress: 60,
      dependencies: JSON.stringify([])
    },
    {
      id: 'task-002',
      name: '混凝土澆置',
      description: '1F 樓板混凝土澆置',
      assignee: '李師傅',
      status: '待辦',
      plannedStartDate: '2026-02-16',
      plannedEndDate: '2026-02-17',
      plannedDuration: 2,
      actualStartDate: null,
      actualEndDate: null,
      progress: 0,
      dependencies: JSON.stringify(['task-001'])
    },
    {
      id: 'task-003',
      name: '模板組立',
      description: '2F 模板組立作業',
      assignee: '王師傅',
      status: '待辦',
      plannedStartDate: '2026-02-18',
      plannedEndDate: '2026-02-20',
      plannedDuration: 3,
      actualStartDate: null,
      actualEndDate: null,
      progress: 0,
      dependencies: JSON.stringify(['task-002'])
    },
    {
      id: 'task-004',
      name: '基地整地',
      description: '基地整地與放樣',
      assignee: '陳師傅',
      status: '已完成',
      plannedStartDate: '2026-02-01',
      plannedEndDate: '2026-02-05',
      plannedDuration: 5,
      actualStartDate: '2026-02-01',
      actualEndDate: '2026-02-04',
      progress: 100,
      dependencies: JSON.stringify([])
    },
    {
      id: 'task-005',
      name: '水電配管',
      description: '1F 水電管線配置',
      assignee: '林師傅',
      status: '進行中',
      plannedStartDate: '2026-02-12',
      plannedEndDate: '2026-02-16',
      plannedDuration: 4,
      actualStartDate: '2026-02-13',
      actualEndDate: null,
      progress: 40,
      dependencies: JSON.stringify(['task-001'])
    }
  ];
  
  const insert = db.prepare(`
    INSERT OR IGNORE INTO tasks (
      id, name, description, assignee, status,
      planned_start_date, planned_end_date, planned_duration,
      actual_start_date, actual_end_date, progress,
      dependencies, created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  
  for (const task of tasks) {
    insert.run(
      task.id,
      task.name,
      task.description,
      task.assignee,
      task.status,
      task.plannedStartDate,
      task.plannedEndDate,
      task.plannedDuration,
      task.actualStartDate,
      task.actualEndDate,
      task.progress,
      task.dependencies,
      now,
      now
    );
    console.log(`✅ 建立任務: ${task.name}`);
  }
  
  console.log('');
  console.log('🎉 測試資料建立完成！');
  console.log(`📊 共建立 ${tasks.length} 個任務`);
  console.log('');
  console.log('💡 提示: 可使用 POST /api/tasks/:id/photos 上傳照片測試 Google Drive 整合');
}

// 執行
if (require.main === module) {
  seedData();
}

module.exports = seedData;
