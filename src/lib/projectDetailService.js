/**
 * Project Detail Service
 * Handles fetching detailed project information including related data
 */

import { supabase } from './supabase'

/**
 * Get full project details with related data
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>}
 */
export async function getProjectDetail(projectId) {
  try {
    // Fetch main project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError

    // If project has customer_id, fetch customer details separately
    if (project && project.customer_id) {
      const { data: customer, error: customerError } = await supabase
        .from('customers')
        .select('*')
        .eq('id', project.customer_id)
        .single()

      if (!customerError && customer) {
        project.customer = customer
      }
    }

    // Fetch project photos
    const { data: photos, error: photosError } = await supabase
      .from('project_photos')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (photosError) console.warn('Photos fetch warning:', photosError)

    // Fetch materials for this project
    const { data: materials, error: materialsError } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)

    if (materialsError) console.warn('Materials fetch warning:', materialsError)

    // Fetch daily updates for this project
    const { data: updates, error: updatesError } = await supabase
      .from('daily_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: false })
      .limit(20)

    if (updatesError) console.warn('Updates fetch warning:', updatesError)

    return {
      project,
      photos: photos || [],
      materials: materials || [],
      updates: updates || [],
      success: true
    }
  } catch (error) {
    console.error('Error fetching project details:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Update project details
 * @param {string} projectId - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateProjectDetail(projectId, updates) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', projectId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (error) {
    console.error('Error updating project:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get project materials with costs
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>}
 */
export async function getProjectMaterials(projectId) {
  try {
    const { data, error } = await supabase
      .from('materials')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error

    const summary = {
      totalItems: data?.length || 0,
      totalCost: (data || []).reduce((sum, m) => sum + ((m.quantity || 0) * (m.unit_cost || 0)), 0),
      byCategory: {}
    }

    ;(data || []).forEach(m => {
      const cat = m.category || 'Other'
      if (!summary.byCategory[cat]) {
        summary.byCategory[cat] = 0
      }
      summary.byCategory[cat] += (m.quantity || 0) * (m.unit_cost || 0)
    })

    return { success: true, materials: data || [], summary }
  } catch (error) {
    console.error('Error fetching materials:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get project timeline/progress
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>}
 */
export async function getProjectProgress(projectId) {
  try {
    const { data: updates, error } = await supabase
      .from('daily_updates')
      .select('*')
      .eq('project_id', projectId)
      .order('date', { ascending: true })

    if (error) throw error

    const timeline = (updates || []).map(u => ({
      date: u.date,
      progress: u.progress_pct || 0,
      hoursWorked: u.hours_worked || 0,
      worker: u.author_name || 'Unknown',
      notes: u.notes
    }))

    const avgProgress = timeline.length > 0
      ? Math.round(timeline.reduce((sum, t) => sum + t.progress, 0) / timeline.length)
      : 0

    const totalHours = timeline.reduce((sum, t) => sum + t.hoursWorked, 0)

    return {
      success: true,
      timeline,
      avgProgress,
      totalHours,
      totalUpdates: timeline.length
    }
  } catch (error) {
    console.error('Error fetching progress:', error)
    return { success: false, error: error.message }
  }
}
