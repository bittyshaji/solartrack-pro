/**
 * ENHANCED Customer Service
 * Manages standalone customer records with unique IDs
 * Customers are created separately and linked to projects
 *
 * ENHANCEMENTS FOR CUSTOMER-FIRST WORKFLOW:
 * - Validation of customer existence
 * - Customer statistics with project counts
 * - Enhanced search and filtering
 * - Customer lifecycle management
 */

import { supabase } from './supabase'

/**
 * Generate unique customer ID
 * Format: CUST-{YYYYMMDD}-{XXXX}
 * @returns {string} - Unique customer ID
 */
function generateCustomerId() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)

  return `CUST-${year}${month}${day}-${String(random).padStart(4, '0')}`
}

/**
 * Create a new customer (standalone, REQUIRED for projects)
 * @param {Object} customerData - { name, email, phone, address, city, state, postal_code, company, notes }
 * @returns {Promise<Object>} - { success: boolean, data: customer, error: string, customerId: string }
 */
export async function createCustomer(customerData = {}) {
  try {
    // Validate required fields
    if (!customerData.name || customerData.name.trim() === '') {
      throw new Error('Customer name is required')
    }

    // Validate email format if provided
    if (customerData.email && !isValidEmail(customerData.email)) {
      throw new Error('Invalid email format')
    }

    const customerId = generateCustomerId()

    const { data, error } = await supabase
      .from('project_customers')
      .insert([
        {
          customer_id: customerId,
          name: customerData.name.trim(),
          email: customerData.email?.trim() || null,
          phone: customerData.phone?.trim() || null,
          address: customerData.address?.trim() || null,
          city: customerData.city?.trim() || null,
          state: customerData.state?.trim() || null,
          postal_code: customerData.postal_code?.trim() || null,
          company: customerData.company?.trim() || null,
          notes: customerData.notes?.trim() || null,
          is_active: true,
          created_at: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error

    console.log('✅ Customer created:', customerId, customerData.name)
    return { success: true, data, customerId }
  } catch (err) {
    console.error('Error creating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all active customers (for dropdown selectors)
 * @returns {Promise<Array>} - List of active customers
 */
export async function getAllCustomers() {
  try {
    const { data, error } = await supabase
      .from('project_customers')
      .select('*')
      .eq('is_active', true)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching customers:', err)
    return []
  }
}

/**
 * Get customer by ID
 * @param {string} customerId - Customer ID (CUST-YYYYMMDD-XXXX format)
 * @returns {Promise<Object|null>} - Customer data or null
 */
export async function getCustomerById(customerId) {
  try {
    const { data, error } = await supabase
      .from('project_customers')
      .select('*')
      .eq('customer_id', customerId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching customer:', err)
    return null
  }
}

/**
 * ENHANCED: Get customer with project statistics
 * Returns customer info along with project count and status breakdown
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object|null>} - Customer with project stats
 */
export async function getCustomerWithStats(customerId) {
  try {
    // Get customer data
    const customer = await getCustomerById(customerId)
    if (!customer) return null

    // Get projects for this customer
    const { data: projects, error } = await supabase
      .from('projects')
      .select('id, status')
      .eq('customer_id', customerId)

    if (error) throw error

    // Calculate statistics
    const stats = {
      total: projects?.length || 0,
      completed: projects?.filter(p => p.status === 'Completed').length || 0,
      inProgress: projects?.filter(p => p.status === 'In Progress').length || 0,
      onHold: projects?.filter(p => p.status === 'On Hold').length || 0,
      cancelled: projects?.filter(p => p.status === 'Cancelled').length || 0,
      planning: projects?.filter(p => p.status === 'Planning').length || 0
    }

    return {
      ...customer,
      projectStats: stats,
      projects: projects || []
    }
  } catch (err) {
    console.error('Error fetching customer with stats:', err)
    return null
  }
}

/**
 * ENHANCED: Validate customer exists and is active
 * Used before creating projects
 * @param {string} customerId - Customer ID to validate
 * @returns {Promise<boolean>} - True if valid and active, false otherwise
 */
export async function validateCustomerExists(customerId) {
  try {
    if (!customerId) return false

    const customer = await getCustomerById(customerId)
    return customer && customer.is_active === true
  } catch (err) {
    console.error('Error validating customer:', err)
    return false
  }
}

/**
 * ENHANCED: Batch validate multiple customers
 * @param {Array<string>} customerIds - Array of customer IDs
 * @returns {Promise<Object>} - { valid: [], invalid: [] }
 */
export async function batchValidateCustomers(customerIds) {
  try {
    if (!Array.isArray(customerIds) || customerIds.length === 0) {
      return { valid: [], invalid: [] }
    }

    const { data: customers, error } = await supabase
      .from('project_customers')
      .select('customer_id')
      .in('customer_id', customerIds)
      .eq('is_active', true)

    if (error) throw error

    const validIds = customers?.map(c => c.customer_id) || []
    const invalid = customerIds.filter(id => !validIds.includes(id))

    return { valid: validIds, invalid }
  } catch (err) {
    console.error('Error batch validating customers:', err)
    return { valid: [], invalid: customerIds }
  }
}

/**
 * Update customer information
 * @param {string} customerId - Customer ID
 * @param {Object} updates - Fields to update
 * @returns {Promise<Object>} - { success: boolean, data: customer, error: string }
 */
export async function updateCustomer(customerId, updates = {}) {
  try {
    // Validate email if provided
    if (updates.email && !isValidEmail(updates.email)) {
      throw new Error('Invalid email format')
    }

    const cleanUpdates = {}
    Object.keys(updates).forEach(key => {
      if (typeof updates[key] === 'string') {
        cleanUpdates[key] = updates[key].trim()
      } else {
        cleanUpdates[key] = updates[key]
      }
    })

    const { data, error } = await supabase
      .from('project_customers')
      .update({
        ...cleanUpdates,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId)
      .select()
      .single()

    if (error) throw error

    console.log('✅ Customer updated:', customerId)
    return { success: true, data }
  } catch (err) {
    console.error('Error updating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Deactivate customer (soft delete)
 * Note: Cannot deactivate if customer has active projects
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function deactivateCustomer(customerId) {
  try {
    // Check if customer has active projects
    const { data: activeProjects, error: checkError } = await supabase
      .from('projects')
      .select('id')
      .eq('customer_id', customerId)
      .neq('status', 'Cancelled')

    if (checkError) throw checkError

    if (activeProjects && activeProjects.length > 0) {
      throw new Error(
        `Cannot deactivate customer with ${activeProjects.length} active project(s). ` +
        'Complete or cancel all projects first.'
      )
    }

    const { error } = await supabase
      .from('project_customers')
      .update({
        is_active: false,
        updated_at: new Date().toISOString()
      })
      .eq('customer_id', customerId)

    if (error) throw error

    console.log('✅ Customer deactivated:', customerId)
    return { success: true }
  } catch (err) {
    console.error('Error deactivating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Search customers by name or email
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} - Matching active customers
 */
export async function searchCustomers(searchTerm) {
  try {
    if (!searchTerm || searchTerm.trim() === '') {
      return getAllCustomers()
    }

    const { data, error } = await supabase
      .from('project_customers')
      .select('*')
      .eq('is_active', true)
      .or(`name.ilike.%${searchTerm}%,email.ilike.%${searchTerm}%`)
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error searching customers:', err)
    return []
  }
}

/**
 * Get customer count
 * @returns {Promise<number>} - Total number of active customers
 */
export async function getCustomerCount() {
  try {
    const { count, error } = await supabase
      .from('project_customers')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    if (error) throw error
    return count || 0
  } catch (err) {
    console.error('Error getting customer count:', err)
    return 0
  }
}

/**
 * ENHANCED: Get customers with project summary from view
 * Uses the database view for optimized queries
 * @returns {Promise<Array>} - Customers with project statistics
 */
export async function getCustomerProjectSummary() {
  try {
    const { data, error } = await supabase
      .from('customer_project_summary')
      .select('*')
      .order('name', { ascending: true })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching customer project summary:', err)
    return []
  }
}

/**
 * ENHANCED: Get global customer-project statistics
 * Returns overview of the entire system
 * @returns {Promise<Object>} - Statistics object
 */
export async function getSystemCustomerStats() {
  try {
    const { data: stats, error } = await supabase
      .rpc('get_customer_project_stats')

    if (error) throw error
    return stats?.[0] || {}
  } catch (err) {
    console.error('Error fetching system stats:', err)
    return {}
  }
}

/**
 * Helper: Validate email format
 * @param {string} email - Email to validate
 * @returns {boolean}
 */
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

/**
 * ENHANCED: Export function to get all customer data for reports
 * @returns {Promise<Array>} - All active customers with complete data
 */
export async function exportAllCustomers() {
  try {
    const { data, error } = await supabase
      .from('project_customers')
      .select('*')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error exporting customers:', err)
    return []
  }
}
