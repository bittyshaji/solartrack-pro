/**
 * Estimate Service
 * Manages project estimates across Estimation, Negotiation, and Execution states
 */

import { supabase } from './supabase'

/**
 * Create a project estimate
 * @param {string} projectId - Project ID
 * @param {string} state - 'Estimation', 'Negotiation', or 'Execution'
 * @param {number} grandTotal - Total estimate amount
 * @param {string} notes - Additional notes
 * @param {string} proposalId - (Optional) Proposal reference ID
 * @param {string} selectedStageIds - (Optional) JSON string of selected stage IDs
 * @param {string} createdBy - (Optional) User who created the estimate
 * @param {string} customerName - (Optional) Customer name
 * @param {string} customerPhone - (Optional) Customer phone number
 * @param {string} customerId - (Optional) Unique customer ID
 * @returns {Promise<Object>}
 */
export async function createEstimate(projectId, state, grandTotal, notes = '', proposalId = null, selectedStageIds = null, createdBy = '', customerName = '', customerPhone = '', customerId = null) {
  try {
    const { data, error } = await supabase
      .from('project_estimates')
      .insert([
        {
          project_id: projectId,
          state,
          grand_total: grandTotal,
          notes,
          proposal_id: proposalId,
          selected_stage_ids: selectedStageIds,
          created_by: createdBy,
          customer_name: customerName || null,
          customer_phone: customerPhone || null,
          customer_id: customerId || null,
          estimate_date: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    console.log(`Created ${state} estimate with proposal ID:`, proposalId)
    return { success: true, data }
  } catch (err) {
    console.error('Error creating estimate:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all estimates for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getProjectEstimates(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_estimates')
      .select('*')
      .eq('project_id', projectId)
      .order('estimate_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching estimates:', err)
    return []
  }
}

/**
 * Get latest estimate for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>}
 */
export async function getLatestEstimate(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_estimates')
      .select('*')
      .eq('project_id', projectId)
      .order('estimate_date', { ascending: false })
      .limit(1)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching latest estimate:', err)
    return null
  }
}

/**
 * Update project state
 * @param {string} projectId - Project ID
 * @param {string} newState - New state
 * @returns {Promise<Object>}
 */
export async function updateProjectState(projectId, newState) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .update({ project_state: newState, updated_at: new Date().toISOString() })
      .eq('id', projectId)
      .select()

    if (error) {
      console.error('Supabase error:', error)
      throw error
    }

    if (!data || data.length === 0) {
      throw new Error('Failed to update project state - no data returned')
    }

    return { success: true, data: data[0] }
  } catch (err) {
    console.error('Error updating project state:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get project with current state
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>}
 */
export async function getProjectWithState(projectId) {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching project:', err)
    return null
  }
}
