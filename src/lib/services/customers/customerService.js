/**
 * Customer Service
 * Manages standalone customer records with unique IDs
 * Customers are created separately and linked to projects
 * Uses the centralized API layer for database operations
 */

import { select, insert, update, count, query } from './api/client'

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
 * Create a new customer (standalone)
 * @param {Object} customerData - { name, email, phone, address, city, state, postal_code, company, notes }
 * @returns {Promise<Object>} - { success: boolean, data: customer, error: string }
 */
export async function createCustomer(customerData = {}) {
  try {
    if (!customerData.name) {
      throw new Error('Customer name is required')
    }

    const customerId = generateCustomerId()

    const data = await insert('project_customers', {
      customer_id: customerId,
      name: customerData.name,
      email: customerData.email || null,
      phone: customerData.phone || null,
      address: customerData.address || null,
      city: customerData.city || null,
      state: customerData.state || null,
      postal_code: customerData.postal_code || null,
      company: customerData.company || null,
      notes: customerData.notes || null,
      is_active: true,
      created_at: new Date().toISOString()
    })

    console.log('✅ Customer created:', customerId)
    return { success: true, data, customerId }
  } catch (err) {
    console.error('Error creating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get all active customers
 * @returns {Promise<Array>} - List of customers
 */
export async function getAllCustomers() {
  try {
    return await query('project_customers')
      .filter('is_active', 'eq', true)
      .orderBy('name', 'asc')
      .execute()
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
    const results = await select('project_customers', {
      filters: { 'customer_id__eq': customerId }
    })
    return results?.[0] || null
  } catch (err) {
    console.error('Error fetching customer:', err)
    return null
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
    const data = await update(
      'project_customers',
      {
        ...updates,
        updated_at: new Date().toISOString()
      },
      { 'customer_id__eq': customerId }
    )
    return { success: true, data: data?.[0] }
  } catch (err) {
    console.error('Error updating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Deactivate customer (soft delete)
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>} - { success: boolean, error: string }
 */
export async function deactivateCustomer(customerId) {
  try {
    await update(
      'project_customers',
      {
        is_active: false,
        updated_at: new Date().toISOString()
      },
      { 'customer_id__eq': customerId }
    )
    return { success: true }
  } catch (err) {
    console.error('Error deactivating customer:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Search customers by name or email
 * @param {string} searchTerm - Search term
 * @returns {Promise<Array>} - Matching customers
 */
export async function searchCustomers(searchTerm) {
  try {
    return await query('project_customers')
      .filter('is_active', 'eq', true)
      .filter('name', 'ilike', `%${searchTerm}%`)
      .orderBy('name', 'asc')
      .execute()
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
    return await count('project_customers', { 'is_active__eq': true })
  } catch (err) {
    console.error('Error getting customer count:', err)
    return 0
  }
}
