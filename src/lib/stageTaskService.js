/**
 * Stage Task Service
 * Manages tasks (with quantities and costs) for each of the 10 project stages
 * Used to generate project estimates
 */

import { supabase } from './supabase'

/**
 * Get all tasks for a specific stage and project
 * @param {number} stageId - Stage ID (1-10)
 * @param {string} projectId - Project ID (required for filtering by project)
 * @returns {Promise<Array>}
 */
export async function getStageTasksByStage(stageId, projectId) {
  try {
    // First, check if this project has ANY project-specific tasks for this stage
    const { data: projectTasks, error: projectError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('stage_id', stageId)
      .eq('project_id', projectId)
      .order('created_at', { ascending: true })

    if (projectError) throw projectError

    // If this project has its own tasks, use only those (isolated)
    if (projectTasks && projectTasks.length > 0) {
      return projectTasks
    }

    // If no project-specific tasks exist yet, load legacy shared templates (NULL project_id)
    // IMPORTANT: We create isolated copies immediately to prevent cross-project contamination
    const { data: legacyTasks, error: legacyError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('stage_id', stageId)
      .is('project_id', null)  // Legacy tasks only
      .order('created_at', { ascending: true })

    if (legacyError) throw legacyError

    // Create project-specific COPIES of legacy tasks with qty=0
    // This ensures each project gets isolated data from the start
    if (legacyTasks && legacyTasks.length > 0) {
      const copiedTasks = await Promise.all(
        legacyTasks.map(async (task) => {
          const { data: newTask, error: copyError } = await supabase
            .from('stage_tasks')
            .insert([{
              stage_id: task.stage_id,
              task_name: task.task_name,
              quantity: 0,  // Always start at 0 for new project
              unit_cost: task.unit_cost,
              description: task.description || '',
              project_id: projectId,  // Assign to this project
              created_at: new Date().toISOString()
            }])
            .select()
            .single()

          if (copyError) {
            console.error(`Error creating project-specific task copy:`, copyError)
            return task  // Fall back to legacy task if copy fails
          }
          return newTask || task
        })
      )

      console.log(`[Setup] Created ${copiedTasks.length} project-specific task copies for project: ${projectId}`)
      return copiedTasks
    }

    return legacyTasks || []
  } catch (err) {
    console.error('Error fetching stage tasks:', err)
    return []
  }
}

/**
 * Get all stage tasks
 * @returns {Promise<Array>}
 */
export async function getAllStageTasks() {
  try {
    const { data, error } = supabase
      .from('stage_tasks')
      .select('*')
      .order('stage_id', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching all stage tasks:', err)
    return []
  }
}

/**
 * Get all stage tasks grouped by stage (OPTIMIZED - single query)
 * This is much faster than making individual queries per stage
 * @param {string} projectId - Project ID (REQUIRED for filtering by project)
 * @returns {Promise<Object>} - { stageId: [tasks] }
 */
export async function getAllStageTasksGrouped(projectId) {
  try {
    // First, check if this project has ANY project-specific tasks
    const { data: projectTasks, error: projectError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_id', { ascending: true })

    if (projectError) throw projectError

    let tasksToUse = projectTasks || []

    // If no project-specific tasks exist yet, load legacy shared templates (NULL project_id)
    // IMPORTANT: We create isolated copies immediately to prevent cross-project contamination
    if (!tasksToUse || tasksToUse.length === 0) {
      const { data: legacyTasks, error: legacyError } = await supabase
        .from('stage_tasks')
        .select('*')
        .is('project_id', null)  // Legacy tasks only
        .order('stage_id', { ascending: true })

      if (legacyError) throw legacyError

      // Create project-specific COPIES of legacy tasks with qty=0
      // This ensures each project gets isolated data from the start
      if (legacyTasks && legacyTasks.length > 0) {
        const copiedTasks = await Promise.all(
          legacyTasks.map(async (task) => {
            const { data: newTask, error: copyError } = await supabase
              .from('stage_tasks')
              .insert([{
                stage_id: task.stage_id,
                task_name: task.task_name,
                quantity: 0,  // Always start at 0 for new project
                unit_cost: task.unit_cost,
                description: task.description || '',
                project_id: projectId,  // Assign to this project
                created_at: new Date().toISOString()
              }])
              .select()
              .single()

            if (copyError) {
              console.error(`Error creating project-specific task copy:`, copyError)
              return task  // Fall back to legacy task if copy fails
            }
            return newTask || task
          })
        )

        console.log(`[Setup] Created ${copiedTasks.length} project-specific task copies for project: ${projectId}`)
        tasksToUse = copiedTasks
      } else {
        tasksToUse = legacyTasks || []
      }
    }

    // Group tasks by stage ID
    const grouped = {}
    ;(tasksToUse || []).forEach(task => {
      if (!grouped[task.stage_id]) {
        grouped[task.stage_id] = []
      }
      grouped[task.stage_id].push(task)
    })

    console.log('[Performance] Batch loaded all stage tasks in single query for project:', projectId)
    return grouped
  } catch (err) {
    console.error('Error fetching grouped stage tasks:', err)
    return {}
  }
}

/**
 * Create a new stage task
 * @param {Object} taskData - { stage_id, task_name, quantity, unit_cost, description, project_id }
 * @returns {Promise<Object>}
 */
export async function createStageTask(taskData) {
  try {
    const { data, error } = await supabase
      .from('stage_tasks')
      .insert([
        {
          stage_id: taskData.stage_id,
          task_name: taskData.task_name,
          quantity: taskData.quantity || 1,
          unit_cost: taskData.unit_cost || 0,
          description: taskData.description || '',
          project_id: taskData.project_id,  // ✅ ADDED: Include project_id
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error creating stage task:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update a stage task
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateStageTask(taskId, updates) {
  try {
    const { data, error } = await supabase
      .from('stage_tasks')
      .update(updates)
      .eq('id', taskId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating stage task:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update a stage task for a specific project (handles legacy task conversion)
 * If the task is a legacy task (project_id=NULL), creates a project-specific copy
 * instead of updating the original (which would affect all projects)
 * @param {string} taskId - Task ID
 * @param {Object} updates - Fields to update
 * @param {string} projectId - Project ID (required for creating project-specific copies)
 * @returns {Promise<Object>}
 */
export async function updateStageTaskForProject(taskId, updates, projectId) {
  try {
    // First, fetch the task to check if it's a legacy task
    const { data: taskData, error: fetchError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (fetchError) throw fetchError
    if (!taskData) throw new Error('Task not found')

    // If task is a legacy task (project_id=NULL), create a project-specific copy
    if (taskData.project_id === null) {
      // Create new project-specific task with updated values
      const { data: newTask, error: createError } = await supabase
        .from('stage_tasks')
        .insert([{
          stage_id: taskData.stage_id,
          task_name: taskData.task_name,
          quantity: updates.quantity !== undefined ? updates.quantity : taskData.quantity,
          unit_cost: updates.unit_cost !== undefined ? updates.unit_cost : taskData.unit_cost,
          description: updates.description !== undefined ? updates.description : taskData.description,
          project_id: projectId,  // ✅ Assign to this project
          created_at: new Date().toISOString()
        }])
        .select()
        .single()

      if (createError) throw createError
      console.log(`[Migration] Created project-specific task copy for project: ${projectId}`)
      return { success: true, data: newTask }
    } else {
      // Already project-specific, update normally
      const { data: updatedTask, error: updateError } = await supabase
        .from('stage_tasks')
        .update(updates)
        .eq('id', taskId)
        .select()
        .single()

      if (updateError) throw updateError
      return { success: true, data: updatedTask }
    }
  } catch (err) {
    console.error('Error updating stage task for project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete a stage task
 * @param {string} taskId - Task ID
 * @returns {Promise<Object>}
 */
export async function deleteStageTask(taskId) {
  try {
    const { error } = await supabase
      .from('stage_tasks')
      .delete()
      .eq('id', taskId)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error deleting stage task:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Calculate total cost for a stage (sum of all task costs)
 * @param {Array} tasks - Array of tasks with quantity and unit_cost
 * @returns {number}
 */
export function calculateStageTotalCost(tasks) {
  return tasks.reduce((sum, task) => {
    const taskTotal = (task.quantity || 0) * (task.unit_cost || 0)
    return sum + taskTotal
  }, 0)
}

/**
 * Calculate estimate for selected stages
 * @param {Array} selectedStageIds - Array of stage IDs to include
 * @param {Array} allTasks - All available tasks
 * @returns {Object} - { stageTotals, grandTotal }
 */
export function calculateEstimate(selectedStageIds, allTasks) {
  const stageTotals = {}
  let grandTotal = 0

  selectedStageIds.forEach(stageId => {
    const stageTasks = allTasks.filter(t => t.stage_id === stageId)
    const stageTotal = calculateStageTotalCost(stageTasks)
    stageTotals[stageId] = stageTotal
    grandTotal += stageTotal
  })

  return { stageTotals, grandTotal }
}
