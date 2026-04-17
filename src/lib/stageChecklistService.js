/**
 * Stage Checklist Service
 * Handles all stage metrics and checklist operations with Supabase
 */

import { supabase } from './supabase'

/**
 * Default checklist items for each construction stage
 */
export const DEFAULT_CHECKLIST_ITEMS = {
  'Site Survey': [
    'Verify roof area measurements',
    'Check orientation and tilt angle',
    'Assess shading conditions',
    'Document electrical panel location',
    'Photograph site from all angles',
    'Record GPS coordinates'
  ],
  'KSEB Application': [
    'Prepare consumer agreement',
    'Complete technical specifications form',
    'Submit online application',
    'Get reference number from KSEB',
    'Create project documentation folder',
    'Maintain communication log'
  ],
  'Mounting Work': [
    'Prepare roof surface and waterproofing',
    'Install mounting structure',
    'Verify structural integrity',
    'Quality check all connections',
    'Photograph installed structure',
    'Get structural certification'
  ],
  'Panel Installation': [
    'Verify panels quality and count',
    'Install panels on mounting structure',
    'Check panel alignment and spacing',
    'Secure all panel connections',
    'Quality inspection of installation',
    'Document panel serial numbers'
  ],
  'Wiring & Inverter': [
    'Run DC wiring from panels',
    'Install DC combiner box',
    'Install and configure inverter',
    'Run AC wiring to consumer panel',
    'Test all connections and grounding',
    'Verify inverter commissioning codes'
  ],
  'Earthing & Safety': [
    'Install earthing electrode',
    'Run earthing conductor',
    'Install lightning arrestor',
    'Conduct earth resistance testing',
    'Install safety signage',
    'Complete safety certificate'
  ],
  'KSEB Inspection': [
    'Notify KSEB for inspection',
    'Prepare all required documentation',
    'Conduct inspection with KSEB officer',
    'Address any inspection remarks',
    'Obtain inspection approval certificate',
    'Schedule net meter installation'
  ],
  'Net Meter': [
    'Receive net meter from KSEB',
    'Install net meter at consumer panel',
    'Verify net meter calibration',
    'Test meter with test load',
    'Seal and verify by KSEB',
    'Get net meter installation certificate'
  ],
  'Commissioning': [
    'Perform system performance testing',
    'Verify production data on inverter',
    'Test all safety systems',
    'Complete performance documentation',
    'Train customer on system operation',
    'Get commissioning certificate'
  ],
  'Completed': [
    'Finalize project documentation',
    'Handover all manuals to customer',
    'Complete warranty registration',
    'Schedule follow-up maintenance',
    'Collect customer feedback',
    'Archive all project records'
  ]
}

/**
 * Get all stage metrics for a project, ordered by sequence
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getStageMetrics(projectId) {
  try {
    const { data, error } = await supabase
      .from('construction_stage_metrics')
      .select('*')
      .eq('project_id', projectId)
      .order('stage_sequence', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching stage metrics:', err)
    return []
  }
}

/**
 * Get single stage metric by name
 * @param {string} projectId - Project ID
 * @param {string} stageName - Stage name
 * @returns {Promise<Object|null>}
 */
export async function getStageMetricByName(projectId, stageName) {
  try {
    const { data, error } = await supabase
      .from('construction_stage_metrics')
      .select('*')
      .eq('project_id', projectId)
      .eq('stage_name', stageName)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (err) {
    console.error(`Error fetching metric for ${stageName}:`, err)
    return null
  }
}

/**
 * Create or update stage metrics (upsert)
 * @param {string} projectId - Project ID
 * @param {string} stageName - Stage name
 * @param {Object} data - Metric data
 * @returns {Promise<Object|null>}
 */
export async function createStageMetrics(projectId, stageName, data) {
  try {
    const stageSequence = getStageSequence(stageName)

    const { data: result, error } = await supabase
      .from('construction_stage_metrics')
      .upsert({
        project_id: projectId,
        stage_name: stageName,
        stage_sequence: stageSequence,
        ...data,
        updated_at: new Date().toISOString()
      }, {
        onConflict: 'project_id,stage_name'
      })
      .select()
      .single()

    if (error) throw error
    return result
  } catch (err) {
    console.error('Error creating stage metrics:', err)
    return null
  }
}

/**
 * Update stage metrics
 * @param {string} projectId - Project ID
 * @param {string} stageName - Stage name
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object|null>}
 */
export async function updateStageMetrics(projectId, stageName, updates) {
  try {
    const { data, error } = await supabase
      .from('construction_stage_metrics')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('project_id', projectId)
      .eq('stage_name', stageName)
      .select()
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error(`Error updating metrics for ${stageName}:`, err)
    return null
  }
}

/**
 * Get checklist items for a specific stage, ordered by item number
 * @param {string} projectId - Project ID
 * @param {string} stageName - Stage name
 * @returns {Promise<Array>}
 */
export async function getStageChecklist(projectId, stageName) {
  try {
    const { data, error } = await supabase
      .from('stage_checklists')
      .select('*')
      .eq('project_id', projectId)
      .eq('stage_name', stageName)
      .order('item_number', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error(`Error fetching checklist for ${stageName}:`, err)
    return []
  }
}

/**
 * Add a new checklist item with auto-incrementing item_number
 * @param {string} projectId - Project ID
 * @param {string} stageName - Stage name
 * @param {string} description - Item description
 * @returns {Promise<Object|null>}
 */
export async function addChecklistItem(projectId, stageName, description) {
  try {
    // Get max item_number for this stage
    const { data: items, error: fetchError } = await supabase
      .from('stage_checklists')
      .select('item_number')
      .eq('project_id', projectId)
      .eq('stage_name', stageName)
      .order('item_number', { ascending: false })
      .limit(1)

    if (fetchError) throw fetchError

    const nextItemNumber = (items && items.length > 0)
      ? (items[0].item_number || 0) + 1
      : 1

    const { data, error } = await supabase
      .from('stage_checklists')
      .insert({
        project_id: projectId,
        stage_name: stageName,
        item_number: nextItemNumber,
        item_description: description,
        is_completed: false
      })
      .select()
      .single()

    if (error) throw error

    // Update metrics to reflect new total item count
    const { data: checklist } = await supabase
      .from('stage_checklists')
      .select('*')
      .eq('project_id', projectId)
      .eq('stage_name', stageName)

    if (checklist) {
      await updateStageMetrics(projectId, stageName, {
        checklist_items_total: checklist.length
      })
    }

    return data
  } catch (err) {
    console.error('Error adding checklist item:', err)
    return null
  }
}

/**
 * Toggle a checklist item's completion status
 * @param {string} checklistItemId - Checklist item ID
 * @param {boolean} isCompleted - New completion status
 * @param {string} userId - User ID (from auth)
 * @returns {Promise<Object|null>}
 */
export async function toggleChecklistItem(checklistItemId, isCompleted, userId = null) {
  try {
    const { data, error } = await supabase
      .from('stage_checklists')
      .update({
        is_completed: isCompleted,
        completed_by: isCompleted ? userId : null,
        completed_at: isCompleted ? new Date().toISOString() : null
      })
      .eq('id', checklistItemId)
      .select()
      .single()

    if (error) throw error

    // Update metrics - recalculate completion count
    if (data) {
      const { data: allItems } = await supabase
        .from('stage_checklists')
        .select('*')
        .eq('project_id', data.project_id)
        .eq('stage_name', data.stage_name)

      if (allItems) {
        const completedCount = allItems.filter(item => item.is_completed).length
        await updateStageMetrics(data.project_id, data.stage_name, {
          checklist_items_completed: completedCount,
          completion_percentage: Math.round((completedCount / allItems.length) * 100)
        })
      }
    }

    return data
  } catch (err) {
    console.error('Error toggling checklist item:', err)
    return null
  }
}

/**
 * Delete a checklist item
 * @param {string} itemId - Checklist item ID
 * @returns {Promise<boolean>}
 */
export async function deleteChecklistItem(itemId) {
  try {
    // First get the item details to update metrics after deletion
    const { data: item } = await supabase
      .from('stage_checklists')
      .select('project_id, stage_name')
      .eq('id', itemId)
      .single()

    const { error } = await supabase
      .from('stage_checklists')
      .delete()
      .eq('id', itemId)

    if (error) throw error

    // Update metrics
    if (item) {
      const { data: remainingItems } = await supabase
        .from('stage_checklists')
        .select('*')
        .eq('project_id', item.project_id)
        .eq('stage_name', item.stage_name)

      if (remainingItems) {
        const completedCount = remainingItems.filter(i => i.is_completed).length
        await updateStageMetrics(item.project_id, item.stage_name, {
          checklist_items_total: remainingItems.length,
          checklist_items_completed: completedCount,
          completion_percentage: remainingItems.length > 0
            ? Math.round((completedCount / remainingItems.length) * 100)
            : 0
        })
      }
    }

    return true
  } catch (err) {
    console.error('Error deleting checklist item:', err)
    return false
  }
}

/**
 * Get stage completion summary for all stages of a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getStageCompletionSummary(projectId) {
  try {
    const { data, error } = await supabase
      .from('construction_stage_metrics')
      .select('stage_name, completion_percentage, checklist_items_completed, checklist_items_total')
      .eq('project_id', projectId)
      .order('stage_sequence', { ascending: true })

    if (error) throw error

    return (data || []).map(stage => ({
      stageName: stage.stage_name,
      completionPercentage: stage.completion_percentage || 0,
      checklistProgress: {
        completed: stage.checklist_items_completed || 0,
        total: stage.checklist_items_total || 0
      }
    }))
  } catch (err) {
    console.error('Error fetching completion summary:', err)
    return []
  }
}

/**
 * Initialize all default checklists for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<boolean>}
 */
export async function initializeDefaultChecklists(projectId) {
  try {
    const stages = Object.keys(DEFAULT_CHECKLIST_ITEMS)

    for (const stageName of stages) {
      // Create stage metrics entry
      const stageSequence = getStageSequence(stageName)
      const items = DEFAULT_CHECKLIST_ITEMS[stageName]

      // Check if metrics already exists
      const existingMetrics = await getStageMetricByName(projectId, stageName)
      if (!existingMetrics) {
        await createStageMetrics(projectId, stageName, {
          checklist_items_total: items.length,
          checklist_items_completed: 0,
          completion_percentage: 0
        })
      }

      // Add checklist items
      for (let i = 0; i < items.length; i++) {
        const existingItems = await getStageChecklist(projectId, stageName)
        if (!existingItems.some(item => item.item_description === items[i])) {
          await supabase
            .from('stage_checklists')
            .insert({
              project_id: projectId,
              stage_name: stageName,
              item_number: i + 1,
              item_description: items[i],
              is_completed: false
            })
        }
      }
    }

    return true
  } catch (err) {
    console.error('Error initializing default checklists:', err)
    return false
  }
}

/**
 * Helper function to get stage sequence number from stage name
 * @param {string} stageName - Stage name
 * @returns {number}
 */
function getStageSequence(stageName) {
  const stages = {
    'Site Survey': 1,
    'KSEB Application': 2,
    'Mounting Work': 3,
    'Panel Installation': 4,
    'Wiring & Inverter': 5,
    'Earthing & Safety': 6,
    'KSEB Inspection': 7,
    'Net Meter': 8,
    'Commissioning': 9,
    'Completed': 10
  }
  return stages[stageName] || 0
}
