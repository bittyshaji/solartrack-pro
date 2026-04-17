/**
 * Proposal Reference Service
 * Manages unique proposal numbers and proposal tracking across workflow states
 * Examples: EST-20260324-0001, NEG-20260324-0001, EXE-20260324-0001
 */

import { supabase } from './supabase'

/**
 * Generate unique proposal number
 * Format: {TYPE}-{YYYYMMDD}-{XXXX}
 * Types: EST (Estimation), NEG (Negotiation), EXE (Execution)
 * @param {string} proposalType - 'Estimation', 'Negotiation', or 'Execution'
 * @returns {string} - Unique proposal number
 */
function generateProposalNumber(proposalType) {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)

  const typeCode =
    proposalType === 'Estimation' ? 'EST' :
    proposalType === 'Negotiation' ? 'NEG' :
    proposalType === 'Execution' ? 'EXE' : 'PRO'

  return `${typeCode}-${year}${month}${day}-${String(random).padStart(4, '0')}`
}

/**
 * Create a new proposal reference
 * @param {string} projectId - Project ID
 * @param {string} proposalType - 'Estimation', 'Negotiation', or 'Execution'
 * @param {string} parentProposalId - (Optional) Parent proposal ID for child proposals
 * @param {string} createdBy - (Optional) User who created this proposal
 * @returns {Promise<Object>} - { success: boolean, data: proposal, error: string }
 */
export async function createProposalReference(projectId, proposalType, parentProposalId = null, createdBy = null) {
  try {
    const proposalNumber = generateProposalNumber(proposalType)

    const { data, error } = await supabase
      .from('proposal_references')
      .insert([{
        project_id: projectId,
        proposal_number: proposalNumber,
        proposal_type: proposalType,
        parent_proposal_id: parentProposalId || null,
        status: 'Draft',
        created_by: createdBy || 'system',
        created_at: new Date().toISOString()
      }])
      .select()
      .single()

    if (error) throw error

    console.log(`Created ${proposalType} proposal: ${proposalNumber}`)
    return { success: true, data }
  } catch (err) {
    console.error('Error creating proposal reference:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all proposals for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Array of proposals ordered by type and date
 */
export async function getProposalsByProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select(`
        id,
        proposal_number,
        proposal_type,
        parent_proposal_id,
        status,
        created_at,
        created_by,
        project_estimates(grand_total, selected_stage_ids),
        project_invoices(total_amount, payment_status)
      `)
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching proposals:', err)
    return []
  }
}

/**
 * Get specific proposal by ID
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object|null>} - Proposal object or null
 */
export async function getProposalById(proposalId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select('*')
      .eq('id', proposalId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching proposal:', err)
    return null
  }
}

/**
 * Get latest estimation proposal for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object|null>} - Latest estimation proposal or null
 */
export async function getLatestEstimationProposal(projectId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select('*')
      .eq('project_id', projectId)
      .eq('proposal_type', 'Estimation')
      .order('created_at', { ascending: false })
      .limit(1)
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (err) {
    console.error('Error fetching latest estimation:', err)
    return null
  }
}

/**
 * Get negotiation proposals for an estimation proposal
 * @param {string} estimationProposalId - Estimation proposal ID
 * @returns {Promise<Array>} - Array of negotiation proposals that reference this estimation
 */
export async function getNegotiationProposals(estimationProposalId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select('*')
      .eq('parent_proposal_id', estimationProposalId)
      .eq('proposal_type', 'Negotiation')
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching negotiation proposals:', err)
    return []
  }
}

/**
 * Get execution/invoice for a negotiation proposal
 * @param {string} negotiationProposalId - Negotiation proposal ID
 * @returns {Promise<Object|null>} - Execution proposal or null
 */
export async function getExecutionProposal(negotiationProposalId) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .select('*')
      .eq('parent_proposal_id', negotiationProposalId)
      .eq('proposal_type', 'Execution')
      .single()

    if (error && error.code !== 'PGRST116') throw error
    return data || null
  } catch (err) {
    console.error('Error fetching execution proposal:', err)
    return null
  }
}

/**
 * Get full proposal hierarchy/chain
 * Shows: Estimation → Negotiation → Execution
 * Fetches complete data including estimates and invoices
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - Proposal chain organized by parent-child relationships
 */
export async function getProposalHierarchy(projectId) {
  try {
    const proposals = await getProposalsByProject(projectId)

    // Fetch complete details for each proposal to get related estimates and invoices
    const proposalsWithDetails = await Promise.all(
      proposals.map(async (p) => {
        const details = await getProposalWithDetails(p.id)
        return {
          ...p,
          estimate: details?.estimate || null,
          invoice: details?.invoice || null
        }
      })
    )

    // Group by type
    const estimations = proposalsWithDetails.filter(p => p.proposal_type === 'Estimation')
    const negotiations = proposalsWithDetails.filter(p => p.proposal_type === 'Negotiation')
    const executions = proposalsWithDetails.filter(p => p.proposal_type === 'Execution')

    // Build hierarchy
    const hierarchy = estimations.map(estimation => ({
      estimation,
      negotiations: negotiations.filter(n => n.parent_proposal_id === estimation.id),
      executions: executions.filter(e =>
        negotiations
          .filter(n => n.parent_proposal_id === estimation.id)
          .map(n => n.id)
          .includes(e.parent_proposal_id)
      )
    }))

    return hierarchy
  } catch (err) {
    console.error('Error getting proposal hierarchy:', err)
    return []
  }
}

/**
 * Update proposal status
 * @param {string} proposalId - Proposal ID
 * @param {string} status - New status ('Draft', 'Submitted', 'Approved', 'Rejected')
 * @returns {Promise<Object>} - { success: boolean, data: updated proposal, error: string }
 */
export async function updateProposalStatus(proposalId, status) {
  try {
    const { data, error } = await supabase
      .from('proposal_references')
      .update({ status })
      .eq('id', proposalId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating proposal status:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get proposal with related estimates and invoices
 * @param {string} proposalId - Proposal ID
 * @returns {Promise<Object>} - Complete proposal data with all related information
 */
export async function getProposalWithDetails(proposalId) {
  try {
    const proposal = await getProposalById(proposalId)
    if (!proposal) return null

    // Get associated estimate
    const { data: estimateData, error: estimateError } = await supabase
      .from('project_estimates')
      .select('*')
      .eq('proposal_id', proposalId)
      .single()

    // Get associated invoice
    const { data: invoiceData, error: invoiceError } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('proposal_id', proposalId)
      .single()

    return {
      proposal,
      estimate: estimateData || null,
      invoice: invoiceData || null
    }
  } catch (err) {
    console.error('Error getting proposal details:', err)
    return { proposal: null, estimate: null, invoice: null }
  }
}

/**
 * Format proposal number for display
 * @param {string} proposalNumber - Proposal number (e.g., "EST-20260324-0001")
 * @returns {string} - Formatted string
 */
export function formatProposalNumber(proposalNumber) {
  return proposalNumber || 'N/A'
}

/**
 * Get proposal type label
 * @param {string} proposalType - Proposal type
 * @returns {string} - Formatted label
 */
export function getProposalTypeLabel(proposalType) {
  const labels = {
    'Estimation': '📋 Estimation Proposal',
    'Negotiation': '💬 Negotiation Proposal',
    'Execution': '✅ Execution Proposal'
  }
  return labels[proposalType] || proposalType
}
