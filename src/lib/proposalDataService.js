/**
 * Proposal Data Service
 * Manages proposal data loading and carryover between workflow states
 * Handles parent-child proposal relationships and task data inheritance
 */

import { supabase } from './supabase'

/**
 * Get proposal with all related data (tasks, estimates, etc.)
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} - Complete proposal data
 */
export async function getProposalData(proposalId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select(`
        *,
        project_estimates(
          id,
          grand_total,
          selected_stage_ids,
          created_at
        ),
        project_invoices(
          id,
          total_amount,
          payment_status,
          created_at
        )
      `)
      .eq('id', proposalId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching proposal data:', err)
    return null
  }
}

/**
 * Get parent proposal data (for loading in child state)
 * @param {string} parentProposalId - Parent proposal ID
 * @returns {Promise<Object>} - Parent proposal with all data
 */
export async function getParentProposalData(parentProposalId) {
  if (!parentProposalId) return null

  try {
    const proposal = await getProposalData(parentProposalId)
    return proposal
  } catch (err) {
    console.error('Error fetching parent proposal:', err)
    return null
  }
}

/**
 * Get latest proposal of a given type for a project
 * @param {string} projectId - Project ID
 * @param {string} proposalType - 'Estimation', 'Negotiation', 'Execution'
 * @returns {Promise<Object|null>} - Latest proposal of that type
 */
export async function getLatestProposalOfType(projectId, proposalType) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select(`
        *,
        project_estimates(
          id,
          grand_total,
          selected_stage_ids,
          created_at
        )
      `)
      .eq('project_id', projectId)
      .eq('proposal_type', proposalType)
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error) {
      if (error.code === 'PGRST116') {
        // No rows found
        return null
      }
      throw error
    }

    return data
  } catch (err) {
    console.error('Error fetching latest proposal:', err)
    return null
  }
}

/**
 * Load parent proposal and prepare data for child state
 * Loads ALL stages with their quantities and values (not just selected ones)
 * @param {string} projectId - Project ID
 * @param {string} childProposalType - 'Negotiation' or 'Execution'
 * @returns {Promise<Object>} - { parentProposal, parentEstimate, grandTotal }
 */
export async function loadParentProposalData(projectId, childProposalType) {
  try {
    // Determine parent type
    const parentType = childProposalType === 'Negotiation' ? 'Estimation' : 'Negotiation'

    // Get latest parent proposal
    const parentProposal = await getLatestProposalOfType(projectId, parentType)
    if (!parentProposal) {
      return {
        parentProposal: null,
        parentEstimate: null,
        grandTotal: 0
      }
    }

    // Get parent estimate with all data
    const parentEstimate = parentProposal.project_estimates?.[0]

    return {
      parentProposal,
      parentEstimate,
      grandTotal: parentEstimate?.grand_total || 0
    }
  } catch (err) {
    console.error('Error loading parent proposal data:', err)
    return {
      parentProposal: null,
      parentEstimate: null,
      grandTotal: 0
    }
  }
}

/**
 * Save proposal data/notes for tracking
 * @param {string} proposalId - Proposal ID
 * @param {Object} data - Data to save { notes, modifications, etc }
 * @returns {Promise<Object>}
 */
export async function updateProposalData(proposalId, data) {
  try {
    const { data: result, error } = await supabase
      .from('proposal_references')
      .update({
        ...data,
        updated_at: new Date().toISOString()
      })
      .eq('id', proposalId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data: result }
  } catch (err) {
    console.error('Error updating proposal:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all proposals in a chain (EST → NEG → EXE)
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Proposals ordered by type
 */
export async function getProposalChain(projectId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select(`
        *,
        project_estimates(grand_total, selected_stage_ids)
      `)
      .eq('project_id', projectId)
      .in('proposal_type', ['Estimation', 'Negotiation', 'Execution'])
      .order('created_at', { ascending: true })

    if (error) throw error

    // Organize by type
    const chain = {
      estimation: data.filter(p => p.proposal_type === 'Estimation'),
      negotiation: data.filter(p => p.proposal_type === 'Negotiation'),
      execution: data.filter(p => p.proposal_type === 'Execution')
    }

    return chain
  } catch (err) {
    console.error('Error fetching proposal chain:', err)
    return { estimation: [], negotiation: [], execution: [] }
  }
}
