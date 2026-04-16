/**
 * Invoice Service
 * Manages project invoices and final billing
 */

import { supabase } from './supabase'

/**
 * Generate invoice number
 * @returns {string}
 */
function generateInvoiceNumber() {
  const date = new Date()
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const random = Math.floor(Math.random() * 10000)
  return `INV-${year}${month}${day}-${String(random).padStart(4, '0')}`
}

/**
 * Create a project invoice
 * @param {string} projectId - Project ID
 * @param {string} proposalId - (Optional) Proposal ID this invoice is linked to
 * @param {number} totalAmount - Total invoice amount
 * @returns {Promise<Object>}
 */
export async function createInvoice(projectId, proposalId, totalAmount) {
  try {
    const invoiceNumber = generateInvoiceNumber()

    // Support legacy calls with 2 arguments (projectId, totalAmount)
    let finalProposalId = proposalId
    let finalTotalAmount = totalAmount

    if (typeof proposalId === 'number') {
      // Old signature: (projectId, totalAmount)
      finalTotalAmount = proposalId
      finalProposalId = null
    }

    const { data, error } = await supabase
      .from('project_invoices')
      .insert([
        {
          project_id: projectId,
          proposal_id: finalProposalId || null,
          invoice_number: invoiceNumber,
          total_amount: finalTotalAmount,
          paid_amount: 0,
          payment_status: 'Pending',
          invoice_date: new Date().toISOString()
        }
      ])
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error creating invoice:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get project invoices
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getProjectInvoices(projectId) {
  try {
    const { data, error } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('project_id', projectId)
      .order('invoice_date', { ascending: false })

    if (error) throw error
    return data || []
  } catch (err) {
    console.error('Error fetching invoices:', err)
    return []
  }
}

/**
 * Get invoice by ID
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<Object|null>}
 */
export async function getInvoiceById(invoiceId) {
  try {
    const { data, error } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (error) throw error
    return data
  } catch (err) {
    console.error('Error fetching invoice:', err)
    return null
  }
}

/**
 * Update invoice payment
 * @param {string} invoiceId - Invoice ID
 * @param {number} paidAmount - Amount paid
 * @returns {Promise<Object>}
 */
export async function updateInvoicePayment(invoiceId, paidAmount) {
  try {
    // Fetch current invoice
    const invoice = await getInvoiceById(invoiceId)
    if (!invoice) throw new Error('Invoice not found')

    // Determine payment status
    let paymentStatus = 'Pending'
    if (paidAmount >= invoice.total_amount) {
      paymentStatus = 'Paid'
    } else if (paidAmount > 0) {
      paymentStatus = 'Partial'
    }

    const { data, error } = await supabase
      .from('project_invoices')
      .update({
        paid_amount: paidAmount,
        payment_status: paymentStatus
      })
      .eq('id', invoiceId)
      .select()
      .single()

    if (error) throw error
    return { success: true, data }
  } catch (err) {
    console.error('Error updating invoice payment:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Format currency for display
 * @param {number} amount - Amount to format
 * @returns {string}
 */
export function formatCurrency(amount) {
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR'
  }).format(amount)
}
