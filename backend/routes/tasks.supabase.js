// Tasks API - 適應最小 schema
import express from 'express';
import { supabase } from '../services/supabase.js';

const router = express.Router();

// GET /api/tasks - 取得所有任務
router.get('/', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*')
      .order('id');

    if (error) throw error;

    // 補充缺少的欄位為預設值
    const tasksWithDefaults = (data || []).map(task => ({
      id: task.id,
      project_id: task.project_id,
      name: task.name || '',
      description: task.description || '',
      status: task.status || '待辦',
      assignee: task.assignee || '',
      progress: task.progress || 0,
      planned_start_date: task.planned_start_date || null,
      planned_end_date: task.planned_end_date || null,
      planned_duration: task.planned_duration || 0,
      actual_start_date: task.actual_start_date || null,
      actual_end_date: task.actual_end_date || null,
      dependencies: task.dependencies || [],
      budget: task.budget || 0,
      actual_cost: task.actual_cost || 0,
      photos: []
    }));

    res.json(tasksWithDefaults);
  } catch (error) {
    console.error('Error fetching tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

// POST /api/tasks - 新增任務
router.post('/', async (req, res) => {
  try {
    const taskData = {
      name: req.body.name,
      status: req.body.status || '待辦',
      progress: req.body.progress || 0,
      project_id: req.body.project_id
    };

    // 只插入存在的欄位
    if (req.body.description) taskData.description = req.body.description;
    if (req.body.assignee) taskData.assignee = req.body.assignee;
    if (req.body.planned_start_date) taskData.planned_start_date = req.body.planned_start_date;
    if (req.body.planned_end_date) taskData.planned_end_date = req.body.planned_end_date;
    if (req.body.actual_start_date) taskData.actual_start_date = req.body.actual_start_date;
    if (req.body.dependencies) taskData.dependencies = req.body.dependencies;

    const { data, error } = await supabase
      .from('tasks')
      .insert([taskData])
      .select()
      .single();

    if (error) throw error;

    res.status(201).json(data);
  } catch (error) {
    console.error('Error creating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// PUT /api/tasks/:id - 更新任務
router.put('/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = {};

    // 只更新提供的欄位
    if (req.body.name !== undefined) updates.name = req.body.name;
    if (req.body.status !== undefined) updates.status = req.body.status;
    if (req.body.progress !== undefined) updates.progress = req.body.progress;
    if (req.body.description !== undefined) updates.description = req.body.description;
    if (req.body.assignee !== undefined) updates.assignee = req.body.assignee;
    if (req.body.planned_start_date !== undefined) updates.planned_start_date = req.body.planned_start_date;
    if (req.body.planned_end_date !== undefined) updates.planned_end_date = req.body.planned_end_date;
    if (req.body.actual_start_date !== undefined) updates.actual_start_date = req.body.actual_start_date;
    if (req.body.dependencies !== undefined) updates.dependencies = req.body.dependencies;

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating task:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id/status - 更新狀態
router.patch('/:id/status', async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body;

    const updates = { status };

    // 自動更新日期（如果欄位存在）
    if (status === '進行中') {
      updates.actual_start_date = new Date().toISOString().split('T')[0];
    } else if (status === '已完成') {
      updates.progress = 100;
    }

    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating status:', error);
    res.status(500).json({ error: error.message });
  }
});

// PATCH /api/tasks/:id/progress - 更新進度
router.patch('/:id/progress', async (req, res) => {
  try {
    const { id } = req.params;
    const { progress } = req.body;

    const { data, error } = await supabase
      .from('tasks')
      .update({ progress })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;

    res.json(data);
  } catch (error) {
    console.error('Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

// DELETE /api/tasks/:id - 刪除任務
router.delete('/:id', async (req, res) => {
  try {
    const { id } = req.params;

    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', id);

    if (error) throw error;

    res.json({ message: 'Task deleted' });
  } catch (error) {
    console.error('Error deleting task:', error);
    res.status(500).json({ error: error.message });
  }
});

export default router;
