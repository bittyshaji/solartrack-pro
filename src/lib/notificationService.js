/**
 * Notification Service
 * Triggers and manages notifications for various events
 * Phase 2B: Email & Notifications
 */

import { supabase } from './supabase'
import {
  queueInvoiceEmail,
  queueTaskReminder,
  queueStatusUpdate,
  sendEmailWithTemplate
} from './emailService'

/**
 * Trigger invoice email
 * Called when invoice is created or updated
 * @param {string} invoiceId - Invoice ID
 * @returns {Promise<string|null>} Notification ID
 */
export async function triggerInvoiceEmail(invoiceId) {
  try {
    // Fetch invoice
    const { data: invoice, error: invoiceError } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) throw invoiceError
    if (!invoice) throw new Error('Invoice not found')

    // Fetch project and customer email
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, customer_id, project_name')
      .eq('id', invoice.project_id)
      .single()

    if (projectError) throw projectError

    // Fetch customer email
    const { data: customer, error: customerError } = await supabase
      .from('customers')
      .select('id, email, business_name')
      .eq('id', project.customer_id)
      .single()

    if (customerError) throw customerError
    if (!customer?.email) {
      console.warn(`No email found for customer ${project.customer_id}`)
      return null
    }

    // Queue invoice email
    const notificationId = await queueInvoiceEmail(invoiceId, customer.email)

    console.log(`Invoice email triggered for invoice ${invoiceId}`)
    logTriggerEvent('invoice_email', invoiceId, project.id, customer.email)

    return notificationId
  } catch (error) {
    console.error('Error triggering invoice email:', error)
    return null
  }
}

/**
 * Trigger task reminder
 * Called when task is created with due date or due date approaches
 * @param {string} taskId - Task ID
 * @returns {Promise<Array<string>>} Array of notification IDs
 */
export async function triggerTaskReminder(taskId) {
  try {
    // Fetch task
    const { data: task, error: taskError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError
    if (!task) throw new Error('Task not found')

    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, team_id')
      .eq('id', task.project_id)
      .single()

    if (projectError) throw projectError

    // Fetch assigned user email
    const recipientEmails = []

    if (task.assigned_to) {
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', task.assigned_to)
        .single()

      if (!userError && user?.email) {
        recipientEmails.push(user.email)
      }
    }

    // Fetch project team emails
    if (project.team_id) {
      const { data: teamMembers, error: teamError } = await supabase
        .from('team_members')
        .select('user_id(email)')
        .eq('team_id', project.team_id)

      if (!teamError && teamMembers) {
        teamMembers.forEach(member => {
          if (member.user_id?.email && !recipientEmails.includes(member.user_id.email)) {
            recipientEmails.push(member.user_id.email)
          }
        })
      }
    }

    if (recipientEmails.length === 0) {
      console.warn(`No recipients found for task reminder ${taskId}`)
      return []
    }

    // Queue task reminders
    const notificationIds = await queueTaskReminder(taskId, recipientEmails)

    console.log(`Task reminder triggered for task ${taskId} to ${recipientEmails.length} recipients`)
    logTriggerEvent('task_reminder', taskId, project.id, recipientEmails.join(', '))

    return notificationIds
  } catch (error) {
    console.error('Error triggering task reminder:', error)
    return []
  }
}

/**
 * Trigger project status update
 * Called when project status changes
 * @param {string} projectId - Project ID
 * @param {string} previousStatus - Previous status (EST, NEG, EXE, Complete)
 * @param {string} newStatus - New status
 * @param {string} message - Optional custom message
 * @returns {Promise<Array<string>>} Array of notification IDs
 */
export async function triggerProjectStatusUpdate(projectId, previousStatus, newStatus, message = '') {
  try {
    // Fetch project
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    if (!project) throw new Error('Project not found')

    // Fetch customer emails
    const { data: projectCustomers, error: customersError } = await supabase
      .from('project_customers')
      .select('customer_id(email)')
      .eq('project_id', projectId)

    if (customersError) throw customersError

    const customerEmails = []
    if (projectCustomers) {
      projectCustomers.forEach(pc => {
        if (pc.customer_id?.email && !customerEmails.includes(pc.customer_id.email)) {
          customerEmails.push(pc.customer_id.email)
        }
      })
    }

    if (customerEmails.length === 0) {
      console.warn(`No customer emails found for project ${projectId}`)
      return []
    }

    // Build status message
    const statusMessage = message || getDefaultStatusMessage(previousStatus, newStatus)

    // Queue status update emails
    const notificationIds = await queueStatusUpdate(projectId, customerEmails, statusMessage)

    console.log(`Project status update triggered: ${previousStatus} -> ${newStatus}`)
    logTriggerEvent('project_status_update', projectId, projectId, customerEmails.join(', '))

    return notificationIds
  } catch (error) {
    console.error('Error triggering project status update:', error)
    return []
  }
}

/**
 * Send welcome email
 * Called when new user signs up
 * @param {string} userId - User ID
 * @param {string} userEmail - User email
 * @param {string} userName - User name
 * @returns {Promise<Object>}
 */
export async function sendWelcomeEmail(userId, userEmail, userName) {
  try {
    if (!userEmail) {
      throw new Error('User email is required')
    }

    const gettingStartedLink = `${typeof window !== 'undefined' ? window.location.origin : 'https://solartrack.com'}/getting-started`

    const result = await sendEmailWithTemplate(userEmail, 'welcome', {
      userName: userName || 'User',
      gettingStartedLink: gettingStartedLink,
      relatedData: { userId }
    })

    if (result.success) {
      console.log(`Welcome email sent to ${userEmail}`)
      logTriggerEvent('welcome_email', userId, null, userEmail)
    }

    return result
  } catch (error) {
    console.error('Error sending welcome email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get notification preferences for a customer
 * @param {string} customerId - Customer ID
 * @returns {Promise<Object>}
 */
export async function getNotificationPreferences(customerId) {
  try {
    const { data, error } = await supabase
      .from('project_customers')
      .select('contact_preferences')
      .eq('customer_id', customerId)
      .single()

    if (error) throw error

    return data?.contact_preferences || {
      emailUpdates: true,
      smsNotifications: false,
      weeklyDigest: true,
      invoiceNotifications: true
    }
  } catch (error) {
    console.error('Error fetching notification preferences:', error)
    return {
      emailUpdates: true,
      smsNotifications: false,
      weeklyDigest: true,
      invoiceNotifications: true
    }
  }
}

/**
 * Update notification preferences for a customer
 * @param {string} customerId - Customer ID
 * @param {Object} preferences - New preferences
 * @returns {Promise<Object>}
 */
export async function updateNotificationPreferences(customerId, preferences) {
  try {
    const { data, error } = await supabase
      .from('project_customers')
      .update({ contact_preferences: preferences })
      .eq('customer_id', customerId)
      .select()
      .single()

    if (error) throw error

    console.log(`Notification preferences updated for customer ${customerId}`)
    return { success: true, preferences: data?.contact_preferences }
  } catch (error) {
    console.error('Error updating notification preferences:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Get default status message based on status transition
 * @param {string} previousStatus - Previous status
 * @param {string} newStatus - New status
 * @returns {string}
 */
function getDefaultStatusMessage(previousStatus, newStatus) {
  const messages = {
    'EST_NEG': 'We have reviewed your requirements and are preparing a detailed proposal for your solar project.',
    'NEG_EXE': 'Great news! Your proposal has been accepted and we are now moving forward with project execution. We will keep you updated on our progress.',
    'EXE_Complete': 'Congratulations! Your solar project has been completed. Thank you for choosing our services. Please review the final documentation attached.',
    'EST_EXE': 'We are moving directly to execution phase based on your requirements.',
    'NEG_Complete': 'Your solar project proposal process has been completed.',
    'EST_Complete': 'Your solar project estimation is complete.'
  }

  const key = `${previousStatus}_${newStatus}`
  return messages[key] || `Your project status has been updated from ${previousStatus} to ${newStatus}.`
}

/**
 * Log trigger event for monitoring
 * @param {string} triggerType - Type of trigger
 * @param {string} relatedId - Related entity ID
 * @param {string} projectId - Project ID
 * @param {string} details - Additional details
 */
async function logTriggerEvent(triggerType, relatedId, projectId, details) {
  try {
    await supabase
      .from('notification_logs')
      .insert([
        {
          trigger_type: triggerType,
          related_id: relatedId,
          project_id: projectId,
          details: details,
          triggered_at: new Date().toISOString()
        }
      ])
  } catch (error) {
    console.warn('Failed to log trigger event:', error)
  }
}

/**
 * Check if notifications should be sent based on preferences
 * @param {string} customerId - Customer ID
 * @param {string} notificationType - Type of notification
 * @returns {Promise<boolean>}
 */
export async function shouldSendNotification(customerId, notificationType) {
  try {
    const preferences = await getNotificationPreferences(customerId)

    switch (notificationType) {
      case 'invoice':
        return preferences.invoiceNotifications !== false
      case 'status_update':
        return preferences.emailUpdates !== false
      case 'task_reminder':
        return preferences.emailUpdates !== false
      case 'weekly_digest':
        return preferences.weeklyDigest !== false
      default:
        return preferences.emailUpdates !== false
    }
  } catch (error) {
    console.error('Error checking notification preferences:', error)
    return true // Default to sending
  }
}
