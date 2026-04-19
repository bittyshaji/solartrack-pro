/**
 * Service Request Service Library
 * Handles all service request CRUD operations with Supabase
 * Manages customer service requests, status tracking, and audit history
 */

import { supabase } from './supabase'

/**
 * SERVICE REQUEST STATUS OPTIONS
 */
export const SERVICE_REQUEST_STATUSES = ['open', 'in_progress', 'resolved', 'closed']

/**
 * SERVICE REQUEST SEVERITY LEVELS
 */
export const SERVICE_REQUEST_SEVERITIES = ['low', 'medium', 'high', 'critical']

/**
 * Get all service requests for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>} - List of service requests ordered by created_at desc
 */
export async function getServiceRequests(projectId) {
  try {
    const { data, error } = await supabase
      .from('customer_service_requests')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching service requests:', err)
    return []
  }
}

/**
 * Get a single service request by ID with history
 * @param {string} id - Service request ID
 * @returns {Promise<Object|null>} - Service request with history array
 */
export async function getServiceRequestById(id) {
  try {
    const { data: request, error: requestError } = await supabase
      .from('customer_service_requests')
      .select('*')
      .eq('id', id)
      .single()

    if (requestError) throw requestError

    // Fetch history for this service request
    const { data: history, error: historyError } = await supabase
      .from('service_request_history')
      .select('*')
      .eq('service_request_id', id)
      .order('changed_at', { ascending: false })

    if (historyError) throw historyError

    return {
      ...request,
      history: history || []
    }
  } catch (err) {
    console.error('Error fetching service request:', err)
    return null
  }
}

/**
 * Create a new service request
 * @param {Object} data - { project_id, customer_id, issue_title, issue_description, severity, warranty_related }
 * @returns {Promise<Object>} - { success: boolean, data: request, error: string }
 */
export async function createServiceRequest(data) {
  try {
    // Get current user for audit trail
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    const insertData = {
      project_id: data.project_id,
      customer_id: data.customer_id || null,
      issue_title: data.issue_title,
      issue_description: data.issue_description,
      severity: data.severity || 'medium',
      status: 'open',
      warranty_related: data.warranty_related || false,
      assigned_to: data.assigned_to || null,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: request, error } = await supabase
      .from('customer_service_requests')
      .insert([insertData])
      .select()
      .single()

    if (error) throw error

    // Log initial status in history
    await supabase
      .from('service_request_history')
      .insert([
        {
          service_request_id: request.id,
          status_before: null,
          status_after: 'open',
          changed_by: user.id,
          change_reason: 'Service request created',
          changed_at: new Date().toISOString()
        }
      ])

    console.log('✅ Service request created:', request.id)
    return { success: true, data: request }
  } catch (err) {
    console.error('Error creating service request:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update service request fields
 * @param {string} id - Service request ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - { success: boolean, data: request, error: string }
 */
export async function updateServiceRequest(id, updates) {
  try {
    const updateData = {
      ...updates,
      updated_at: new Date().toISOString()
    }

    const { data, error } = await supabase
      .from('customer_service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating service request:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Update service request status and log to history
 * @param {string} id - Service request ID
 * @param {string} newStatus - New status (open, in_progress, resolved, closed)
 * @param {string} reason - Reason for status change
 * @returns {Promise<Object>} - { success: boolean, data: request, error: string }
 */
export async function updateServiceRequestStatus(id, newStatus, reason = '') {
  try {
    if (!SERVICE_REQUEST_STATUSES.includes(newStatus)) {
      throw new Error(`Invalid status: ${newStatus}. Must be one of: ${SERVICE_REQUEST_STATUSES.join(', ')}`)
    }

    // Get current user for audit trail
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get current status before updating
    const current = await getServiceRequestById(id)
    if (!current) {
      throw new Error('Service request not found')
    }

    // Update request status
    const updateData = {
      status: newStatus,
      updated_at: new Date().toISOString()
    }

    // If resolving, set resolved_at timestamp
    if (newStatus === 'resolved' && !current.resolved_at) {
      updateData.resolved_at = new Date().toISOString()
    }

    const { data: request, error } = await supabase
      .from('customer_service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log status change in history
    await supabase
      .from('service_request_history')
      .insert([
        {
          service_request_id: id,
          status_before: current.status,
          status_after: newStatus,
          changed_by: user.id,
          change_reason: reason,
          changed_at: new Date().toISOString()
        }
      ])

    console.log('✅ Service request status updated:', id, 'to', newStatus)
    return { success: true, data: request }
  } catch (err) {
    console.error('Error updating service request status:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Resolve a service request with notes and satisfaction rating
 * @param {string} id - Service request ID
 * @param {string} resolutionNotes - Resolution notes
 * @param {number} rating - Satisfaction rating (1-5)
 * @returns {Promise<Object>} - { success: boolean, data: request, error: string }
 */
export async function resolveServiceRequest(id, resolutionNotes = '', rating = null) {
  try {
    // Get current user for audit trail
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Get current request
    const current = await getServiceRequestById(id)
    if (!current) {
      throw new Error('Service request not found')
    }

    // Validate rating if provided
    if (rating !== null && (rating < 1 || rating > 5)) {
      throw new Error('Satisfaction rating must be between 1 and 5')
    }

    // Update request
    const updateData = {
      status: 'resolved',
      resolution_notes: resolutionNotes,
      satisfaction_rating: rating,
      resolved_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }

    const { data: request, error } = await supabase
      .from('customer_service_requests')
      .update(updateData)
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    // Log resolution in history
    await supabase
      .from('service_request_history')
      .insert([
        {
          service_request_id: id,
          status_before: current.status,
          status_after: 'resolved',
          changed_by: user.id,
          change_reason: resolutionNotes || 'Service request resolved',
          changed_at: new Date().toISOString()
        }
      ])

    console.log('✅ Service request resolved:', id)
    return { success: true, data: request }
  } catch (err) {
    console.error('Error resolving service request:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get service request statistics for a project
 * @param {string} projectId - Project ID
 * @returns {Promise<Object>} - Counts by status
 */
export async function getServiceRequestStats(projectId) {
  try {
    const { data, error } = await supabase
      .from('customer_service_requests')
      .select('status')
      .eq('project_id', projectId)

    if (error) throw error

    const stats = {
      total: data?.length || 0,
      open: 0,
      in_progress: 0,
      resolved: 0,
      closed: 0
    }

    ;(data || []).forEach(request => {
      if (request.status === 'open') stats.open++
      else if (request.status === 'in_progress') stats.in_progress++
      else if (request.status === 'resolved') stats.resolved++
      else if (request.status === 'closed') stats.closed++
    })

    return stats
  } catch (err) {
    console.error('Error fetching service request stats:', err)
    return { total: 0, open: 0, in_progress: 0, resolved: 0, closed: 0 }
  }
}

/**
 * Delete a service request (soft delete by closing)
 * @param {string} id - Service request ID
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function deleteServiceRequest(id) {
  try {
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      throw new Error('User not authenticated')
    }

    // Close the request instead of deleting
    return updateServiceRequestStatus(id, 'closed', 'Request deleted')
  } catch (err) {
    console.error('Error deleting service request:', err)
    return { success: false, error: err.message }
  }
}
