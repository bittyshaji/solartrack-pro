/**
 * ENHANCED Project Service Library
 * Handles all project CRUD operations with Supabase
 *
 * ENHANCEMENTS FOR CUSTOMER-FIRST WORKFLOW:
 * - customer_id is REQUIRED for all projects
 * - Customer validation before project creation
 * - Project filtering by customer
 * - Enhanced project queries with customer details
 */

import { supabase } from './supabase'
import { validateCustomerExists } from './customerService'

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
 * ENHANCED: Create a new project (CUSTOMER REQUIRED - ENFORCED)
 *
 * This function REQUIRES a valid customer_id. Projects cannot be created
 * without being linked to a customer.
 *
 * @param {Object} projectData - {
 *   name: string (required),
 *   customer_id: string (required - CUST-YYYYMMDD-XXXX format),
 *   description: string,
 *   status: string (Planning|In Progress|On Hold|Completed|Cancelled),
 *   stage: string (Site Survey|KSEB Application|etc)
 * }
 * @returns {Promise<Object>} - {
 *   success: boolean,
 *   data: project,
 *   error: string
 * }
 */
export async function createProject(projectData = {}) {
  try {
    // ====== VALIDATION ======

    // Validate required: name
    if (!projectData.name || projectData.name.trim() === '') {
      throw new Error('Project name is required')
    }

    // ====== ENFORCE: customer_id is REQUIRED ======
    if (!projectData.customer_id || projectData.customer_id.trim() === '') {
      throw new Error(
        '⚠️ CUSTOMER REQUIRED: You must select or create a customer first. ' +
        'Every project must be linked to a customer.'
      )
    }

    const customerId = projectData.customer_id.trim()

    // ====== VALIDATE: customer exists and is active ======
    console.log(`🔍 Validating customer: ${customerId}`)
    const customerIsValid = await validateCustomerExists(customerId)

    if (!customerIsValid) {
      throw new Error(
        `Customer "${customerId}" does not exist or is inactive. ` +
        'Please create a customer first.'
      )
    }

    console.log(`✅ Customer validated: ${customerId}`)

    // ====== CREATE PROJECT ======
    const { data, error } = await supabase
      .from('projects')
      .insert([
        {
          name: projectData.name.trim(),
          customer_id: customerId,
          description: projectData.description?.trim() || null,
          status: projectData.status || 'Planning',
          stage: projectData.stage || 'Site Survey',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) {
      if (error.message.includes('violates foreign key')) {
        throw new Error('Selected customer does not exist. Please refresh and try again.')
      }
      throw error
    }

    console.log(
      `✅ Project created successfully!`,
      `Project: ${data.name}`,
      `Customer: ${customerId}`
    )

    return { success: true, data }
  } catch (err) {
    console.error('❌ Error creating project:', err.message)
    return { success: false, error: err.message }
  }
}

/**
 * ENHANCED: Get all projects with optional filtering
 * RETURNS CUSTOMER INFORMATION with each project
 *
 * @param {Object} filters - {
 *   status?: string,
 *   stage?: string,
 *   customer_id?: string,
 *   searchTerm?: string
 * }
 * @returns {Promise<Array>} - Projects with customer details
 */
export async function getProjects(filters = {}) {
  try {
    let query = supabase
      .from('projects_with_customers')
      .select('*')
      .order('created_at', { ascending: false })

    // Apply filters
    if (filters.status) {
      query = query.eq('status', filters.status)
    }
    if (filters.stage) {
      query = query.eq('stage', filters.stage)
    }
    if (filters.customer_id) {
      query = query.eq('customer_id', filters.customer_id)
    }

    const { data, error } = await query

    if (error) throw error

    // Client-side search filter
    let results = data || []
    if (filters.searchTerm) {
      const term = filters.searchTerm.toLowerCase()
      results = results.filter(p =>
        p.project_name?.toLowerCase().includes(term) ||
        p.customer_name?.toLowerCase().includes(term) ||
        p.customer_email?.toLowerCase().includes(term)
      )
    }

    return results
  } catch (err) {
    console.error('Error fetching projects:', err)
    return []
  }
}

/**
 * ENHANCED: Get all projects for a specific customer
 * @param {string} customerId - Customer ID (CUST-YYYYMMDD-XXXX format)
 * @returns {Promise<Array>} - Customer's projects
 */
export async function getProjectsByCustomer(customerId) {
  try {
    if (!customerId) {
      throw new Error('Customer ID is required')
    }

    const { data, error } = await supabase
      .from('projects')
      .select('*')
      .eq('customer_id', customerId)
      .order('created_at', { ascending: false })

    if (error) throw error

    console.log(`📋 Found ${data?.length || 0} projects for customer: ${customerId}`)
    return data || []
  } catch (err) {
    console.error('Error fetching projects by customer:', err)
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
    console.error('Error fetching project by ID:', err)
    return null
  }
}

/**
 * ENHANCED: Get project with full customer details
 * @param {string} id - Project ID
 * @returns {Promise<Object|null>} - Project with customer information
 */
export async function getProjectWithCustomer(id) {
  try {
    const { data, error } = await supabase
      .from('projects_with_customers')
      .select('*')
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
 * Update project
 * @param {string} id - Project ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - { success: boolean, data: project, error: string }
 */
export async function updateProject(id, updates = {}) {
  try {
    // Don't allow changing customer_id via update
    // Create new project if customer needs to change
    if (updates.customer_id) {
      throw new Error(
        'Cannot change customer for existing project. ' +
        'Create a new project for a different customer.'
      )
    }

    const { data, error } = await supabase
      .from('projects')
      .update({
        ...updates,
        updated_at: new Date().toISOString()
      })
      .eq('id', id)
      .select()
      .single()

    if (error) throw error

    console.log(`✅ Project updated: ${id}`)
    return { success: true, data }
  } catch (err) {
    console.error('Error updating project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete (soft delete) a project
 * @param {string} id - Project ID
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function deleteProject(id) {
  try {
    const { error } = await supabase
      .from('projects')
      .update({
        status: 'Cancelled',
        updated_at: new Date().toISOString()
      })
      .eq('id', id)

    if (error) throw error

    console.log(`✅ Project cancelled: ${id}`)
    return { success: true }
  } catch (err) {
    console.error('Error deleting project:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get project count
 * @returns {Promise<number>} - Total number of projects
 */
export async function getProjectCount() {
  try {
    const { count, error } = await supabase
      .from('projects')
      .select('*', { count: 'exact', head: true })

    if (error) throw error
    return count || 0
  } catch (err) {
    console.error('Error getting project count:', err)
    return 0
  }
}

/**
 * ENHANCED: Get project statistics by status
 * @returns {Promise<Object>} - Stats by status
 */
export async function getProjectStatistics() {
  try {
    const { data, error } = await supabase
      .from('projects')
      .select('status')

    if (error) throw error

    const stats = {
      planning: 0,
      inProgress: 0,
      onHold: 0,
      completed: 0,
      cancelled: 0,
      total: data?.length || 0
    }

    data?.forEach(project => {
      switch (project.status) {
        case 'Planning':
          stats.planning++
          break
        case 'In Progress':
          stats.inProgress++
          break
        case 'On Hold':
          stats.onHold++
          break
        case 'Completed':
          stats.completed++
          break
        case 'Cancelled':
          stats.cancelled++
          break
        default:
          break
      }
    })

    return stats
  } catch (err) {
    console.error('Error getting project statistics:', err)
    return {}
  }
}

/**
 * ENHANCED: Batch create projects for a customer
 * @param {string} customerId - Customer ID
 * @param {Array<Object>} projectsData - Array of project data
 * @returns {Promise<Object>} - { success: boolean, created: count, failed: Array, error: string }
 */
export async function batchCreateProjects(customerId, projectsData = []) {
  try {
    // Validate customer first
    const customerIsValid = await validateCustomerExists(customerId)
    if (!customerIsValid) {
      throw new Error(`Customer "${customerId}" does not exist or is inactive`)
    }

    const projects = projectsData.map(p => ({
      name: p.name,
      customer_id: customerId,
      description: p.description || null,
      status: p.status || 'Planning',
      stage: p.stage || 'Site Survey',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }))

    const { data, error } = await supabase
      .from('projects')
      .insert(projects)
      .select()

    if (error) throw error

    console.log(`✅ Batch created ${data?.length || 0} projects for customer: ${customerId}`)
    return {
      success: true,
      created: data?.length || 0,
      data: data || [],
      failed: []
    }
  } catch (err) {
    console.error('Error batch creating projects:', err)
    return {
      success: false,
      created: 0,
      failed: projectsData,
      error: err.message
    }
  }
}

/**
 * Get projects for dashboard/analytics
 * @returns {Promise<Array>} - Projects grouped by status
 */
export async function getProjectsForDashboard() {
  try {
    const { data, error } = await supabase
      .from('projects_with_customers')
      .select('*')
      .limit(50)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching dashboard projects:', err)
    return []
  }
}
