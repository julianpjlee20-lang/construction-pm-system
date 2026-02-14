const express = require('express');
const router = express.Router();
const db = require('../db/database');
const { v4: uuidv4 } = require('uuid');

// GET /api/tasks - 取得所有任務
router.get('/', (req, res) => {
  try {
    const tasks = db.prepare(`
      SELECT * FROM tasks ORDER BY created_at DESC
    `).all();
    
    // 為每個任務加入照片列表
    const tasksWithPhotos = tasks.map(task => {
      const photos = db.prepare(`
        SELECT * FROM photos WHERE task_id = ? ORDER BY timestamp DESC
      `).all(task.id);
      
      return {
        id: task.id,
        name: task.name,
        description: task.description,
        assignee: task.assignee,
        status: task.status,
        plannedStartDate: task.planned_start_date,
        plannedEndDate: task.planned_end_date,
        plannedDuration: task.planned_duration,
        actualStartDate: task.actual_start_date,
        actualEndDate: task.actual_end_date,
        progress: task.progress,
        dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
        createdAt: task.created_at,
        updatedAt: task.updated_at,
        photos: photos.map(p => ({
          id: p.id,
          timestamp: p.timestamp,
          gdriveUrl: p.gdrive_url,
          gdriveFileId: p.gdrive_file_id,
          thumbnailUrl: p.thumbnail_url,
          description: p.description,
          uploadedBy: p.uploaded_by
        }))
      };
    });
    
    res.json(tasksWithPhotos);
  } catch (error) {
    console.error('取得任務列表失敗:', error);
    res.status(500).json({
      error: '取得任務列表失敗',
      message: error.message,
      code: 'FETCH_TASKS_FAILED'
    });
  }
});

// GET /api/tasks/:id - 取得單一任務
router.get('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        error: '任務不存在',
        message: `找不到 ID 為 ${req.params.id} 的任務`,
        code: 'TASK_NOT_FOUND'
      });
    }
    
    const photos = db.prepare(`
      SELECT * FROM photos WHERE task_id = ? ORDER BY timestamp DESC
    `).all(task.id);
    
    res.json({
      id: task.id,
      name: task.name,
      description: task.description,
      assignee: task.assignee,
      status: task.status,
      plannedStartDate: task.planned_start_date,
      plannedEndDate: task.planned_end_date,
      plannedDuration: task.planned_duration,
      actualStartDate: task.actual_start_date,
      actualEndDate: task.actual_end_date,
      progress: task.progress,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      photos: photos.map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        gdriveUrl: p.gdrive_url,
        gdriveFileId: p.gdrive_file_id,
        thumbnailUrl: p.thumbnail_url,
        description: p.description,
        uploadedBy: p.uploaded_by
      }))
    });
  } catch (error) {
    console.error('取得任務失敗:', error);
    res.status(500).json({
      error: '取得任務失敗',
      message: error.message,
      code: 'FETCH_TASK_FAILED'
    });
  }
});

// POST /api/tasks - 建立任務
router.post('/', (req, res) => {
  try {
    const {
      name,
      description,
      assignee,
      status = '待辦',
      plannedStartDate,
      plannedEndDate,
      plannedDuration,
      dependencies = []
    } = req.body;
    
    if (!name) {
      return res.status(400).json({
        error: '缺少必要欄位',
        message: '任務名稱為必填欄位',
        code: 'MISSING_REQUIRED_FIELD'
      });
    }
    
    const id = uuidv4();
    const now = new Date().toISOString();
    
    db.prepare(`
      INSERT INTO tasks (
        id, name, description, assignee, status,
        planned_start_date, planned_end_date, planned_duration,
        dependencies, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      id, name, description, assignee, status,
      plannedStartDate, plannedEndDate, plannedDuration,
      JSON.stringify(dependencies), now, now
    );
    
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(id);
    
    res.status(201).json({
      id: task.id,
      name: task.name,
      description: task.description,
      assignee: task.assignee,
      status: task.status,
      plannedStartDate: task.planned_start_date,
      plannedEndDate: task.planned_end_date,
      plannedDuration: task.planned_duration,
      actualStartDate: task.actual_start_date,
      actualEndDate: task.actual_end_date,
      progress: task.progress,
      dependencies: task.dependencies ? JSON.parse(task.dependencies) : [],
      createdAt: task.created_at,
      updatedAt: task.updated_at,
      photos: []
    });
  } catch (error) {
    console.error('建立任務失敗:', error);
    res.status(500).json({
      error: '建立任務失敗',
      message: error.message,
      code: 'CREATE_TASK_FAILED'
    });
  }
});

// PATCH /api/tasks/:id - 更新任務
router.patch('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        error: '任務不存在',
        message: `找不到 ID 為 ${req.params.id} 的任務`,
        code: 'TASK_NOT_FOUND'
      });
    }
    
    const {
      name,
      description,
      assignee,
      status,
      plannedStartDate,
      plannedEndDate,
      plannedDuration,
      actualStartDate,
      actualEndDate,
      progress,
      dependencies
    } = req.body;
    
    const updates = [];
    const values = [];
    
    if (name !== undefined) { updates.push('name = ?'); values.push(name); }
    if (description !== undefined) { updates.push('description = ?'); values.push(description); }
    if (assignee !== undefined) { updates.push('assignee = ?'); values.push(assignee); }
    if (status !== undefined) { updates.push('status = ?'); values.push(status); }
    if (plannedStartDate !== undefined) { updates.push('planned_start_date = ?'); values.push(plannedStartDate); }
    if (plannedEndDate !== undefined) { updates.push('planned_end_date = ?'); values.push(plannedEndDate); }
    if (plannedDuration !== undefined) { updates.push('planned_duration = ?'); values.push(plannedDuration); }
    if (actualStartDate !== undefined) { updates.push('actual_start_date = ?'); values.push(actualStartDate); }
    if (actualEndDate !== undefined) { updates.push('actual_end_date = ?'); values.push(actualEndDate); }
    if (progress !== undefined) { updates.push('progress = ?'); values.push(progress); }
    if (dependencies !== undefined) { updates.push('dependencies = ?'); values.push(JSON.stringify(dependencies)); }
    
    if (updates.length === 0) {
      return res.status(400).json({
        error: '沒有提供更新欄位',
        message: '請至少提供一個欄位進行更新',
        code: 'NO_UPDATE_FIELDS'
      });
    }
    
    updates.push('updated_at = ?');
    values.push(new Date().toISOString());
    values.push(req.params.id);
    
    db.prepare(`
      UPDATE tasks SET ${updates.join(', ')} WHERE id = ?
    `).run(...values);
    
    const updatedTask = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    const photos = db.prepare('SELECT * FROM photos WHERE task_id = ? ORDER BY timestamp DESC').all(req.params.id);
    
    res.json({
      id: updatedTask.id,
      name: updatedTask.name,
      description: updatedTask.description,
      assignee: updatedTask.assignee,
      status: updatedTask.status,
      plannedStartDate: updatedTask.planned_start_date,
      plannedEndDate: updatedTask.planned_end_date,
      plannedDuration: updatedTask.planned_duration,
      actualStartDate: updatedTask.actual_start_date,
      actualEndDate: updatedTask.actual_end_date,
      progress: updatedTask.progress,
      dependencies: updatedTask.dependencies ? JSON.parse(updatedTask.dependencies) : [],
      createdAt: updatedTask.created_at,
      updatedAt: updatedTask.updated_at,
      photos: photos.map(p => ({
        id: p.id,
        timestamp: p.timestamp,
        gdriveUrl: p.gdrive_url,
        gdriveFileId: p.gdrive_file_id,
        thumbnailUrl: p.thumbnail_url,
        description: p.description,
        uploadedBy: p.uploaded_by
      }))
    });
  } catch (error) {
    console.error('更新任務失敗:', error);
    res.status(500).json({
      error: '更新任務失敗',
      message: error.message,
      code: 'UPDATE_TASK_FAILED'
    });
  }
});

// DELETE /api/tasks/:id - 刪除任務
router.delete('/:id', (req, res) => {
  try {
    const task = db.prepare('SELECT * FROM tasks WHERE id = ?').get(req.params.id);
    
    if (!task) {
      return res.status(404).json({
        error: '任務不存在',
        message: `找不到 ID 為 ${req.params.id} 的任務`,
        code: 'TASK_NOT_FOUND'
      });
    }
    
    db.prepare('DELETE FROM tasks WHERE id = ?').run(req.params.id);
    
    res.json({
      message: '任務已刪除',
      id: req.params.id
    });
  } catch (error) {
    console.error('刪除任務失敗:', error);
    res.status(500).json({
      error: '刪除任務失敗',
      message: error.message,
      code: 'DELETE_TASK_FAILED'
    });
  }
});

module.exports = router;
