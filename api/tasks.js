// Vercel Serverless Function: Tasks API
// 使用 Vercel KV 儲存（之後可升級為 Vercel Postgres）

let tasks = [
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
  }
];

export default async function handler(req, res) {
  // CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    // GET /api/tasks - 取得所有任務
    if (req.method === 'GET') {
      return res.status(200).json(tasks);
    }

    // POST /api/tasks - 新增任務
    if (req.method === 'POST') {
      const newTask = {
        id: Date.now().toString(),
        ...req.body,
        photos: []
      };
      tasks.push(newTask);
      return res.status(201).json(newTask);
    }

    // PUT /api/tasks/:id - 更新任務
    if (req.method === 'PUT') {
      const { id } = req.query;
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }
      tasks[index] = { ...tasks[index], ...req.body };
      return res.status(200).json(tasks[index]);
    }

    // DELETE /api/tasks/:id - 刪除任務
    if (req.method === 'DELETE') {
      const { id } = req.query;
      const index = tasks.findIndex(t => t.id === id);
      if (index === -1) {
        return res.status(404).json({ error: 'Task not found' });
      }
      const deleted = tasks.splice(index, 1);
      return res.status(200).json(deleted[0]);
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
