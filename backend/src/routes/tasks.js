const express = require('express');
const { v4: uuidv4 } = require('uuid');
const { runAsync, getAsync, allAsync } = require('../services/database');

const router = express.Router();

/**
 * GET /api/tasks - 取得所有任務
 */
router.get('/', async (req, res) => {
  try {
    const tasks = await allAsync(`
      SELECT 
        id, name, description, assignee, status,
        planned_start_date as plannedStartDate,
        planned_end_date as plannedEndDate,
        actual_start_date as actualStartDate,
        actual_end_date as actualEndDate,
        progress, dependencies,
        created_at as createdAt,
        updated_at as updatedAt
      FROM tasks
      ORDER BY created_at DESC
    `);

    // 解析 dependencies (JSON array)
    const tasksWithDeps = tasks.map(task => ({
      ...task,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : []
    }));

    res.json(tasksWithDeps);
  } catch (error) {
    console.error('❌ 取得任務失敗:', error);
    res.status(500).json({ error: '取得任務失敗', message: error.message });
  }
});

/**
 * GET /api/tasks/:id - 取得單一任務
 */
router.get('/:id', async (req, res) => {
  try {
    const task = await getAsync(`
      SELECT 
        id, name, description, assignee, status,
        planned_start_date as plannedStartDate,
        planned_end_date as plannedEndDate,
        actual_start_date as actualStartDate,
        actual_end_date as actualEndDate,
        progress, dependencies,
        created_at as createdAt,
        updated_at as updatedAt
      FROM tasks
      WHERE id = ?
    `, [req.params.id]);

    if (!task) {
      return res.status(404).json({ error: '任務不存在' });
    }

    task.dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];
    res.json(task);
  } catch (error) {
    console.error('❌ 取得任務失敗:', error);
    res.status(500).json({ error: '取得任務失敗', message: error.message });
  }
});

/**
 * POST /api/tasks - 建立任務
 */
router.post('/', async (req, res) => {
  try {
    const {
      name,
      description,
      assignee,
      status = '待辦',
      plannedStartDate,
      plannedEndDate,
      actualStartDate,
      actualEndDate,
      progress = 0,
      dependencies = []
    } = req.body;

    // 驗證必填欄位
    if (!name) {
      return res.status(400).json({ error: '任務名稱為必填' });
    }

    // 驗證 status
    const validStatuses = ['待辦', '進行中', '已完成'];
    if (status && !validStatuses.includes(status)) {
      return res.status(400).json({ error: '無效的狀態值' });
    }

    // 驗證 progress
    if (progress < 0 || progress > 100) {
      return res.status(400).json({ error: '進度必須在 0-100 之間' });
    }

    const id = `task-${uuidv4().slice(0, 8)}`;
    const now = new Date().toISOString();

    await runAsync(`
      INSERT INTO tasks (
        id, name, description, assignee, status,
        planned_start_date, planned_end_date,
        actual_start_date, actual_end_date,
        progress, dependencies, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `, [
      id, name, description, assignee, status,
      plannedStartDate, plannedEndDate,
      actualStartDate, actualEndDate,
      progress, JSON.stringify(dependencies), now, now
    ]);

    const task = await getAsync('SELECT * FROM tasks WHERE id = ?', [id]);
    
    res.status(201).json({
      id: task.id,
      name: task.name,
      description: task.description,
      assignee: task.assignee,
      status: task.status,
      plannedStartDate: task.planned_start_date,
      plannedEndDate: task.planned_end_date,
      actualStartDate: task.actual_start_date,
      actualEndDate: task.actual_end_date,
      progress: task.progress,
      dependencies: JSON.parse(task.dependencies || '[]'),
      createdAt: task.created_at,
      updatedAt: task.updated_at
    });
  } catch (error) {
    console.error('❌ 建立任務失敗:', error);
    res.status(500).json({ error: '建立任務失敗', message: error.message });
  }
});

/**
 * PUT /api/tasks/:id - 更新任務
 */
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const {
      name,
      description,
      assignee,
      status,
      plannedStartDate,
      plannedEndDate,
      actualStartDate,
      actualEndDate,
      progress,
      dependencies
    } = req.body;

    // 檢查任務是否存在
    const existingTask = await getAsync('SELECT id FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 驗證 status
    if (status) {
      const validStatuses = ['待辦', '進行中', '已完成'];
      if (!validStatuses.includes(status)) {
        return res.status(400).json({ error: '無效的狀態值' });
      }
    }

    // 驗證 progress
    if (progress !== undefined && (progress < 0 || progress > 100)) {
      return res.status(400).json({ error: '進度必須在 0-100 之間' });
    }

    // 建立更新語句
    const updates = [];
    const params = [];

    if (name !== undefined) { updates.push('name = ?'); params.push(name); }
    if (description !== undefined) { updates.push('description = ?'); params.push(description); }
    if (assignee !== undefined) { updates.push('assignee = ?'); params.push(assignee); }
    if (status !== undefined) { updates.push('status = ?'); params.push(status); }
    if (plannedStartDate !== undefined) { updates.push('planned_start_date = ?'); params.push(plannedStartDate); }
    if (plannedEndDate !== undefined) { updates.push('planned_end_date = ?'); params.push(plannedEndDate); }
    if (actualStartDate !== undefined) { updates.push('actual_start_date = ?'); params.push(actualStartDate); }
    if (actualEndDate !== undefined) { updates.push('actual_end_date = ?'); params.push(actualEndDate); }
    if (progress !== undefined) { updates.push('progress = ?'); params.push(progress); }
    if (dependencies !== undefined) { updates.push('dependencies = ?'); params.push(JSON.stringify(dependencies)); }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());
    params.push(id);

    await runAsync(`
      UPDATE tasks
      SET ${updates.join(', ')}
      WHERE id = ?
    `, params);

    const task = await getAsync(`
      SELECT 
        id, name, description, assignee, status,
        planned_start_date as plannedStartDate,
        planned_end_date as plannedEndDate,
        actual_start_date as actualStartDate,
        actual_end_date as actualEndDate,
        progress, dependencies,
        created_at as createdAt,
        updated_at as updatedAt
      FROM tasks
      WHERE id = ?
    `, [id]);

    task.dependencies = task.dependencies ? JSON.parse(task.dependencies) : [];
    res.json(task);
  } catch (error) {
    console.error('❌ 更新任務失敗:', error);
    res.status(500).json({ error: '更新任務失敗', message: error.message });
  }
});

/**
 * DELETE /api/tasks/:id - 刪除任務
 */
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    // 檢查任務是否存在
    const existingTask = await getAsync('SELECT id FROM tasks WHERE id = ?', [id]);
    if (!existingTask) {
      return res.status(404).json({ error: '任務不存在' });
    }

    // 刪除任務（會自動刪除關聯的照片，因為有 ON DELETE CASCADE）
    await runAsync('DELETE FROM tasks WHERE id = ?', [id]);

    res.json({ message: '任務已刪除', id });
  } catch (error) {
    console.error('❌ 刪除任務失敗:', error);
    res.status(500).json({ error: '刪除任務失敗', message: error.message });
  }
});

module.exports = router;
