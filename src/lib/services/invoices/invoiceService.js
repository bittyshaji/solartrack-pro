/**
 * Invoice Service
 * Manages project invoices and final billing
 * Uses the centralized API layer for database operations
 */

import { select, insert, update, query } from './api/client'
import { queueInvoiceEmail } from './emailService'

/**
 * PHASE 2B NOTE: Email triggering is now MANUAL (button-based) instead of automatic.
 * Use sendInvoiceEmail() to manually trigger email notifications.
 */

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

    const data = await insert('project_invoices', {
      project_id: projectId,
      proposal_id: finalProposalId || null,
      invoice_number: invoiceNumber,
      total_amount: finalTotalAmount,
      paid_amount: 0,
      payment_status: 'Pending',
      invoice_date: new Date().toISOString()
    })

    // NOTE: Email notification is now MANUAL (button-based) instead of automatic
    // To send email, call sendInvoiceEmail(invoiceId, customerEmail) manually

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
    return await query('project_invoices')
      .filter('project_id', 'eq', projectId)
      .orderBy('invoice_date', 'desc')
      .execute()
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
    const results = await select('project_invoices', {
      filters: { 'id__eq': invoiceId }
    })
    return results?.[0] || null
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

    const data = await update(
      'project_invoices',
      {
        paid_amount: paidAmount,
        payment_status: paymentStatus
      },
      { 'id__eq': invoiceId }
    )

    return { success: true, data: data?.[0] }
  } catch (err) {
    console.error('Error updating invoice payment:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Send invoice email manually (button-based)
 * @param {string} invoiceId - Invoice ID
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<string|null>} Notification ID or null
 */
export async function sendInvoiceEmail(invoiceId, recipientEmail) {
  return await queueInvoiceEmail(invoiceId, recipientEmail)
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
