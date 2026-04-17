/**
 * Task Service Library
 * Handles task CRUD operations and management
 */

import { supabase } from './supabase'

export const TASK_STATUSES = ['todo', 'in_progress', 'in_review', 'completed']
export const TASK_PRIORITIES = ['low', 'medium', 'high', 'urgent']

/**
 * Get all tasks with filters
 * @param {Object} filters - { projectId, status, priority, assignedTo }
 * @returns {Promise<Array>}
 */
export async function getTasks(filters = {}) {
  try {
    let query = supabase
      .from('tasks')
      .select('*, projects(id, name), team_members(id, full_name)')
      .order('created_at', { ascending: false })

    if (filters.projectId) query = query.eq('project_id', filters.projectId)
    if (filters.status) query = query.eq('status', filters.status)
    if (filters.priority) query = query.eq('priority', filters.priority)
    if (filters.assignedTo) query = query.eq('assigned_to', filters.assignedTo)

    const { data, error } = await query

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching tasks:', error)
    return []
  }
}

/**
 * Get single task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function getTask(taskId) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .select('*, projects(id, name), team_members(id, full_name)')
      .eq('id', taskId)
      .single()

    if (error) throw error
    return data
  } catch (error) {
    console.error('Error fetching task:', error)
    return null
  }
}

/**
 * Create new task
 * @param {Object} taskData - Task data
 * @returns {Promise<Object>}
 */
export async function createTask(taskData) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .insert([
        {
          title: taskData.title,
          description: taskData.description || null,
          project_id: taskData.projectId,
          assigned_to: taskData.assignedTo || null,
          status: taskData.status || 'todo',
          priority: taskData.priority || 'medium',
          due_date: taskData.dueDate || null,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error creating task:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateTask(taskId, updates) {
  try {
    const { data, error } = await supabase
      .from('tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating task:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Delete task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function deleteTask(taskId) {
  try {
    const { error } = await supabase
      .from('tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return { success: true }
  } catch (error) {
    console.error('Error deleting task:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get project tasks
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>}
 */
export async function getProjectTasks(projectId) {
  try {
    const tasks = await getTasks({ projectId })

    const summary = {
      total: tasks.length,
      todo: tasks.filter(t => t.status === 'todo').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      inReview: tasks.filter(t => t.status === 'in_review').length,
      completed: tasks.filter(t => t.status === 'completed').length,
      completionRate: tasks.length > 0 ? Math.round((tasks.filter(t => t.status === 'completed').length / tasks.length) * 100) : 0
    }

    return { success: true, tasks, summary }
  } catch (error) {
    console.error('Error fetching project tasks:', error)
    return { success: false, error: error.message }
  }
}
