/**
 * Project Service Library
 * Handles all project CRUD operations with Supabase
 */

import { supabase } from './supabase'
import { queueStatusUpdate } from './emailService'

/**
 * PROJECT STATUS OPTIONS
 */
export const PROJECT_STATUSES = [
  'Planning',
  'In Progress',
  'On Hold',
  'Completed',
  'Cancelled'
]

/**
 * PROJECT STATES (Workflow/Status phases)
 */
export const PROJECT_STATES = [
  'Estimation',
  'Negotiation',
  'Execution'
]

/**
 * PROJECT STAGES (Technical breakdown of work)
 */
export const PROJECT_STAGES = [
  { id: 1, name: 'Site Survey' },
  { id: 2, name: 'KSEB Application' },
  { id: 3, name: 'Mounting Work' },
  { id: 4, name: 'Panel Installation' },
  { id: 5, name: 'Wiring & Inverter' },
  { id: 6, name: 'Earthing & Safety' },
  { id: 7, name: 'KSEB Inspection' },
  { id: 8, name: 'Net Meter' },
  { id: 9, name: 'Commissioning' },
  { id: 10, name: 'Completed' }
]

/**
 * Get all projects with optional filtering
 * @param {Object} filters - { status, stage, searchTerm }
 * @returns {Promise<Array>}
 */
export async function getProjects(filters = {}) {
  try {
    let query = supabase
      .from('projects')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.stage) {
      query = query.eq('stage', filters.stage)
    }

    const { data, error } = await query

    if (error) throw error

    // Client-side search filter
    let results = data || []
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      results = results.filter(p =>
        p.name?.toLowerCase().includes(term)
      )
    }

    return results
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}

/**
 * Get single project by ID
 * @param {string} id - Project ID
 * @returns {Promise<Object|null>}
 */
export async function getProjectById(id) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching project:', err)
    return null
  }
}

/**
 * Get project with linked customer information
 * @param {string} id - Project ID
 * @returns {Promise<Object|null>} - Project with customer details
 */
export async function getProjectWithCustomer(id) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select(`
        *,
        customer:customer_id_ref (
          customer_id,
          name,
          email,
          phone,
          address,
          city,
          state,
          postal_code,
          company,
          notes
        )
      `)
      .eq('id', id)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching project with customer:', err)
    return null
  }
}

/**
 * Create a new project
 * @param {Object} projectData - { name, client_name, location, status, stage, start_date, end_date, capacity_kw, notes, customer_id }
 * @returns {Promise<Object>}
 */
export async function createProject(projectData) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Build insert data with only non-empty fields
    const insertData = {
      user_id: user.id,
      name: projectData.name,
      status: projectData.status || 'Planning',
      stage: projectData.stage || 1,
      project_state: 'Estimation', // New projects always start in Estimation state
      client_name: projectData.client_name || null,
      location: projectData.location || null,
      capacity_kw: projectData.capacity_kw ? parseFloat(projectData.capacity_kw) : null,
      start_date: projectData.start_date || null,
      end_date: projectData.end_date || null,
      notes: projectData.notes || null,
      customer_id_ref: projectData.customer_id || null  // Link to pre-created customer
    }

    const { data, error } = await supabase
      .from('projects')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error
    console.log('✅ Project created:', data.id, 'with customer:', projectData.customer_id)
    return { success: true, data }
  } catch (err) {
    console.error('Error creating project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update an existing project
 * @param {string} id - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>}
 */
export async function updateProject(id, updates) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update(updates)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete a project
 * @param {string} id - Project ID
 * @returns {Promise<Object>}
 */
export async function deleteProject(id) {
  try {
    const { error } = await supabase
      .from('projects')
      .delete()
      .eq('id', id)

    if (error) throw error
    return { success: true }
  } catch (err) {
    console.error('Error deleting project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update project status
 * @param {string} id - Project ID
 * @param {string} status - New status
 * @returns {Promise<Object>}
 */
export async function updateProjectStatus(id, status) {
  return updateProject(id, { status })
}

/**
 * Update project workflow state (Estimation → Negotiation → Execution)
 * @param {string} id - Project ID
 * @param {string} state - New state (Estimation, Negotiation, or Execution)
 * @returns {Promise<Object>}
 */
export async function updateProjectState(id, state) {
  if (!PROJECT_STATES.includes(state)) {
    return { success: false, error: `Invalid state: ${state}. Must be one of: ${PROJECT_STATES.join(', ')}` }
  }

  try {
    // Get current project state for comparison
    const project = await getProjectById(id)
    const previousState = project?.project_state

    // Update project state
    const result = await updateProject(id, { project_state: state })

    // Send status update email if state changed (Phase 2B)
    if (result.success && previousState && previousState !== state) {
      try {
        // Get customer emails for this project
        const { data: projectCustomers } = await supabase
          .from('project_customers')
          .select('customer_id(email)')
          .eq('project_id', id)

        const customerEmails = []
        if (projectCustomers) {
          projectCustomers.forEach(pc => {
            if (pc.customer_id?.email && !customerEmails.includes(pc.customer_id.email)) {
              customerEmails.push(pc.customer_id.email)
            }
          })
        }

        if (customerEmails.length > 0) {
          await queueStatusUpdate(id, customerEmails, `Project status updated to ${state}`)
        }
      } catch (emailErr) {
        console.warn('Failed to queue status update email:', emailErr)
      }
    }

    return result
  } catch (err) {
    console.error('Error updating project state:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get project statistics
 * @returns {Promise<Object>}
 */
export async function getProjectStats() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('id, status')

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      planning: 0,
      inProgress: 0,
      onHold: 0,
      completed: 0,
      cancelled: 0
    }

    ;(data || []).forEach(p => {
      const status = p.status?.toLowerCase()
      if (status === 'planning') stats.planning++
      else if (status === 'in progress') stats.inProgress++
      else if (status === 'on hold') stats.onHold++
      else if (status === 'completed') stats.completed++
      else if (status === 'cancelled') stats.cancelled++
    })

    return stats
  } catch (err) {
    console.error('Error fetching project stats:', err)
    return { total: 0, planning: 0, inProgress: 0, onHold: 0, completed: 0, cancelled: 0 }
  }
}
