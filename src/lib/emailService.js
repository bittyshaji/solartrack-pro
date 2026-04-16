/**
 * Email Service - Resend Integration
 * Manages email sending, queuing, and notification tracking
 * Phase 2B: Email & Notifications
 */

import { supabase } from './supabase'

// Configuration
const RESEND_API_KEY = import.meta.env.VITE_RESEND_API_KEY
const EMAIL_FROM = import.meta.env.VITE_EMAIL_FROM || 'noreply@solartrack.com'
const BATCH_SIZE = parseInt(import.meta.env.VITE_EMAIL_BATCH_SIZE || '10')
const MAX_RETRIES = parseInt(import.meta.env.VITE_MAX_EMAIL_RETRIES || '3')
const RETRY_DELAY_MS = parseInt(import.meta.env.VITE_EMAIL_RETRY_DELAY_MS || '3600000') // 1 hour

// Email templates as constants (using [PLACEHOLDER] syntax to avoid template evaluation)
const EMAIL_TEMPLATES = {
  invoice: {
    subject: 'Invoice #[INVOICE_NUMBER] - [PROJECT_NAME]',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .invoice-details { margin: 20px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 8px 0; border-bottom: 1px solid #eee; }
            .amount-due { font-size: 24px; font-weight: bold; color: #667eea; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            .unsubscribe { font-size: 11px; color: #999; margin-top: 10px; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>SolarTrack Pro</h1>
              <p>Invoice for [PROJECT_NAME]</p>
            </div>

            <p>Dear [CUSTOMER_NAME],</p>

            <p>Thank you for your business. Your invoice is ready for payment.</p>

            <div class="invoice-details">
              <div class="detail-row">
                <span><strong>Invoice Number:</strong></span>
                <span>[INVOICE_NUMBER]</span>
              </div>
              <div class="detail-row">
                <span><strong>Project:</strong></span>
                <span>[PROJECT_NAME]</span>
              </div>
              <div class="detail-row">
                <span><strong>Invoice Date:</strong></span>
                <span>[INVOICE_DATE]</span>
              </div>
              <div class="detail-row">
                <span><strong>Due Date:</strong></span>
                <span>[DUE_DATE]</span>
              </div>
              <div class="detail-row" style="margin-top: 10px; padding-top: 10px; border-top: 2px solid #667eea;">
                <span style="font-size: 18px; font-weight: bold;">Amount Due:</span>
                <span class="amount-due">[AMOUNT]</span>
              </div>
            </div>

            <a href="[VIEW_LINK]" class="cta-button">View Full Invoice</a>

            <div class="footer">
              <p>If you have any questions about this invoice, please contact us.</p>
              <p><strong>SolarTrack Pro</strong><br/>
              Email: support@solartrack.com<br/>
              Phone: +1 (800) 123-4567</p>
              <div class="unsubscribe">
                <p><a href="[UNSUBSCRIBE_LINK]">Unsubscribe</a> from invoice notifications</p>
              </div>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Invoice #\[INVOICE_NUMBER] - \[PROJECT_NAME]

Dear \[CUSTOMER_NAME],

Thank you for your business. Your invoice is ready for payment.

Invoice Number: \[INVOICE_NUMBER]
Project: \[PROJECT_NAME]
Invoice Date: \[INVOICE_DATE]
Due Date: \[DUE_DATE]
Amount Due: \[AMOUNT]

View Full Invoice: \[VIEW_LINK]

If you have any questions about this invoice, please contact us.

SolarTrack Pro
Email: support@solartrack.com
Phone: +1 (800) 123-4567

\[UNSUBSCRIBE_LINK]`
  },

  reminder: {
    subject: 'Task Reminder: [TASK_TITLE]',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 20px; border-radius: 5px; }
            .task-details { background: #f9f9f9; padding: 15px; border-left: 4px solid #f5576c; margin: 20px 0; }
            .detail-row { padding: 8px 0; }
            .label { font-weight: bold; color: #f5576c; }
            .cta-button { background: #f5576c; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
            .priority { display: inline-block; padding: 4px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .priority-high { background: #fee; color: #c33; }
            .priority-medium { background: #fef4e6; color: #f5a623; }
            .priority-low { background: #e8f5e9; color: #4caf50; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Task Reminder</h1>
              <p>[PROJECT_NAME]</p>
            </div>

            <p>Hi [RECIPIENT_NAME],</p>

            <p>You have a task due soon. Here are the details:</p>

            <div class="task-details">
              <div class="detail-row">
                <span class="label">Task:</span> [TASK_TITLE]
              </div>
              <div class="detail-row">
                <span class="label">Description:</span> [TASK_DESCRIPTION]
              </div>
              <div class="detail-row">
                <span class="label">Project:</span> [PROJECT_NAME]
              </div>
              <div class="detail-row">
                <span class="label">Due Date:</span> [DUE_DATE]
              </div>
              <div class="detail-row">
                <span class="label">Priority:</span>
                <span class="priority priority-[PRIORITY_CLASS]">[PRIORITY]</span>
              </div>
              <div class="detail-row">
                <span class="label">Assigned To:</span> [ASSIGNED_TO]
              </div>
            </div>

            <a href="[VIEW_LINK]" class="cta-button">View Task Details</a>

            <div class="footer">
              <p>Please log in to SolarTrack Pro to update the task status.</p>
              <p><strong>SolarTrack Pro</strong><br/>
              Email: support@solartrack.com<br/>
              Phone: +1 (800) 123-4567</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Task Reminder: \[TASK_TITLE]

Hi \[RECIPIENT_NAME],

You have a task due soon. Here are the details:

Task: \[TASK_TITLE]
Description: \[TASK_DESCRIPTION]
Project: \[PROJECT_NAME]
Due Date: \[DUE_DATE]
Priority: \[PRIORITY]
Assigned To: \[ASSIGNED_TO]

View Task Details: \[VIEW_LINK]

Please log in to SolarTrack Pro to update the task status.

SolarTrack Pro
Email: support@solartrack.com
Phone: +1 (800) 123-4567`
  },

  status_update: {
    subject: 'Project Status Update: [PROJECT_NAME]',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; border-radius: 5px; }
            .status-details { background: #f9f9f9; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0; }
            .detail-row { padding: 8px 0; }
            .label { font-weight: bold; color: #667eea; }
            .status-badge { display: inline-block; padding: 6px 12px; border-radius: 20px; font-size: 12px; font-weight: bold; }
            .status-estimate { background: #e3f2fd; color: #1976d2; }
            .status-negotiation { background: #fff3e0; color: #f57c00; }
            .status-execution { background: #f3e5f5; color: #7b1fa2; }
            .status-complete { background: #e8f5e9; color: #388e3c; }
            .progress-bar { background: #eee; height: 20px; border-radius: 10px; overflow: hidden; margin: 10px 0; }
            .progress-fill { background: linear-gradient(90deg, #667eea 0%, #764ba2 100%); height: 100%; text-align: center; color: white; font-size: 12px; line-height: 20px; }
            .message { background: #fff8e1; padding: 15px; border-radius: 5px; margin: 15px 0; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block; margin-top: 20px; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Project Status Update</h1>
              <p>[PROJECT_NAME]</p>
            </div>

            <p>Hi [CUSTOMER_NAME],</p>

            <p>We have an important update on your project:</p>

            <div class="status-details">
              <div class="detail-row">
                <span class="label">Project:</span> [PROJECT_NAME]
              </div>
              <div class="detail-row">
                <span class="label">Current Status:</span>
                <span class="status-badge status-[STATUS_CLASS]">[CURRENT_STATUS]</span>
              </div>
              <div class="detail-row">
                <span class="label">Completion:</span>
              </div>
              <div class="progress-bar">
                <div class="progress-fill" style="width: [COMPLETION_PERCENT]%">[COMPLETION_PERCENT]%</div>
              </div>
              <div class="detail-row">
                <span class="label">Updated At:</span> [UPDATE_DATE]
              </div>
            </div>

            ${customMessage ? `<div class="message"><strong>Message:</strong><br/>[CUSTOM_MESSAGE]</div>` : ''}

            <a href="[VIEW_LINK]" class="cta-button">View Project Details</a>

            <div class="footer">
              <p>Have questions? Reply to this email or contact us directly.</p>
              <p><strong>SolarTrack Pro</strong><br/>
              Email: support@solartrack.com<br/>
              Phone: +1 (800) 123-4567</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Project Status Update: \[PROJECT_NAME]

Hi \[CUSTOMER_NAME],

We have an important update on your project:

Project: \[PROJECT_NAME]
Current Status: \[CURRENT_STATUS]
Completion: \[COMPLETION_PERCENT]%
Updated At: \[UPDATE_DATE]

\${customMessage ? \`Message: \[CUSTOM_MESSAGE]\` : ''}

View Project Details: \[VIEW_LINK]

Have questions? Reply to this email or contact us directly.

SolarTrack Pro
Email: support@solartrack.com
Phone: +1 (800) 123-4567`
  },

  welcome: {
    subject: 'Welcome to SolarTrack Pro!',
    htmlTemplate: `
      <!DOCTYPE html>
      <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; border-radius: 5px; text-align: center; }
            .features { margin: 20px 0; }
            .feature { padding: 15px; margin: 10px 0; background: #f9f9f9; border-left: 4px solid #667eea; }
            .feature-title { font-weight: bold; color: #667eea; }
            .cta-button { background: #667eea; color: white; padding: 12px 24px; border-radius: 5px; text-decoration: none; display: inline-block; margin: 20px 0; }
            .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #eee; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>Welcome to SolarTrack Pro!</h1>
              <p>Your platform for solar project management</p>
            </div>

            <p>Hi ${userName},</p>

            <p>Welcome! We're excited to have you join SolarTrack Pro. This platform will help you manage your solar projects efficiently and professionally.</p>

            <div class="features">
              <div class="feature">
                <div class="feature-title">Project Management</div>
                <p>Create and manage solar projects from estimation to execution.</p>
              </div>
              <div class="feature">
                <div class="feature-title">Proposal & Invoicing</div>
                <p>Generate professional proposals and invoices for your clients.</p>
              </div>
              <div class="feature">
                <div class="feature-title">Photo Documentation</div>
                <p>Organize and manage project photos with GPS tagging and categories.</p>
              </div>
              <div class="feature">
                <div class="feature-title">Analytics & Reporting</div>
                <p>Track performance metrics and generate comprehensive reports.</p>
              </div>
            </div>

            <a href="${gettingStartedLink}" class="cta-button">Get Started</a>

            <div class="footer">
              <p>If you have any questions, our support team is here to help.</p>
              <p><strong>SolarTrack Pro</strong><br/>
              Email: support@solartrack.com<br/>
              Phone: +1 (800) 123-4567</p>
            </div>
          </div>
        </body>
      </html>
    `,
    textTemplate: `Welcome to SolarTrack Pro!

Hi \${userName},

Welcome! We're excited to have you join SolarTrack Pro. This platform will help you manage your solar projects efficiently and professionally.

Features:

Project Management
Create and manage solar projects from estimation to execution.

Proposal & Invoicing
Generate professional proposals and invoices for your clients.

Photo Documentation
Organize and manage project photos with GPS tagging and categories.

Analytics & Reporting
Track performance metrics and generate comprehensive reports.

Get Started: \${gettingStartedLink}

If you have any questions, our support team is here to help.

SolarTrack Pro
Email: support@solartrack.com
Phone: +1 (800) 123-4567`
  }
}

/**
 * Send email via Resend API
 * @param {string} to - Recipient email address
 * @param {string} subject - Email subject
 * @param {string} htmlBody - HTML email body
 * @param {string} emailType - Type of email (invoice, reminder, etc.)
 * @param {Object} relatedData - Related data for logging
 * @returns {Promise<Object>} {success, messageId, error}
 */
export async function sendEmailViaResend(to, subject, htmlBody, emailType = 'general', relatedData = {}) {
  try {
    if (!RESEND_API_KEY) {
      throw new Error('Resend API key not configured. Add VITE_RESEND_API_KEY to .env.local')
    }

    if (!to || !subject || !htmlBody) {
      throw new Error('Missing required parameters: to, subject, htmlBody')
    }

    // Call Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: to,
        subject: subject,
        html: htmlBody
      })
    })

    if (!response.ok) {
      const errorData = await response.json()
      throw new Error(`Resend API error: ${errorData.message || response.statusText}`)
    }

    const data = await response.json()
    const messageId = data.id

    // Log to database
    const { error: logError } = await supabase
      .from('email_notifications')
      .insert([
        {
          recipient: to,
          email_type: emailType,
          subject: subject,
          status: 'sent',
          message_id: messageId,
          sent_at: new Date().toISOString(),
          related_project_id: relatedData.projectId || null,
          related_invoice_id: relatedData.invoiceId || null,
          related_task_id: relatedData.taskId || null,
          retry_count: 0
        }
      ])

    if (logError) {
      console.warn('Failed to log email notification:', logError)
    }

    console.log(`Email sent successfully to ${to}. Message ID: ${messageId}`)
    return { success: true, messageId, to }
  } catch (error) {
    console.error('Error sending email via Resend:', error)

    // Log failure to database
    try {
      const { error: logError } = await supabase
        .from('email_notifications')
        .insert([
          {
            recipient: to,
            email_type: emailType,
            subject: subject,
            status: 'failed',
            error_message: error.message,
            related_project_id: relatedData.projectId || null,
            related_invoice_id: relatedData.invoiceId || null,
            related_task_id: relatedData.taskId || null,
            retry_count: 0
          }
        ])

      if (logError) {
        console.warn('Failed to log failed email:', logError)
      }
    } catch (logErr) {
      console.error('Error logging failed email:', logErr)
    }

    return { success: false, error: error.message }
  }
}

/**
 * Get email template by type
 * @param {string} emailType - Type of email
 * @returns {Object} {subject, htmlTemplate, textTemplate}
 */
export function getEmailTemplate(emailType) {
  return EMAIL_TEMPLATES[emailType] || EMAIL_TEMPLATES.general
}

/**
 * Send email with template
 * @param {string} to - Recipient email address
 * @param {string} templateName - Template name
 * @param {Object} variables - Template variables
 * @returns {Promise<Object>}
 */
export async function sendEmailWithTemplate(to, templateName, variables = {}) {
  try {
    const template = getEmailTemplate(templateName)
    if (!template) {
      throw new Error(`Template '${templateName}' not found`)
    }

    // Replace template variables
    let subject = template.subject
    let htmlBody = template.htmlTemplate

    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\$\\{${key}\\}`, 'g')
      subject = subject.replace(regex, value || '')
      htmlBody = htmlBody.replace(regex, value || '')
    })

    return await sendEmailViaResend(to, subject, htmlBody, templateName, variables.relatedData || {})
  } catch (error) {
    console.error('Error sending templated email:', error)
    return { success: false, error: error.message }
  }
}

/**
 * Queue email notification for later sending
 * @param {Object} emailNotification - Email notification object
 * @returns {Promise<string|null>} Notification ID or null
 */
export async function queueEmailNotification(emailNotification) {
  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .insert([
        {
          recipient: emailNotification.recipient,
          email_type: emailNotification.emailType,
          subject: emailNotification.subject,
          html_body: emailNotification.htmlBody || null,
          status: 'pending',
          scheduled_at: new Date().toISOString(),
          related_project_id: emailNotification.projectId || null,
          related_invoice_id: emailNotification.invoiceId || null,
          related_task_id: emailNotification.taskId || null,
          retry_count: 0
        }
      ])
      .select()
      .single()

    if (error) throw error
    console.log(`Email queued for ${emailNotification.recipient}`)
    return data.id
  } catch (error) {
    console.error('Error queuing email notification:', error)
    return null
  }
}

/**
 * Queue invoice email
 * @param {string} invoiceId - Invoice ID
 * @param {string} recipientEmail - Recipient email address
 * @returns {Promise<string|null>} Notification ID
 */
export async function queueInvoiceEmail(invoiceId, recipientEmail) {
  try {
    // Fetch invoice details
    const { data: invoice, error: invoiceError } = await supabase
      .from('project_invoices')
      .select('*')
      .eq('id', invoiceId)
      .single()

    if (invoiceError) throw invoiceError
    if (!invoice) throw new Error('Invoice not found')

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', invoice.project_id)
      .single()

    if (projectError) throw projectError

    const invoiceDate = new Date(invoice.invoice_date).toLocaleDateString('en-IN')
    const dueDate = invoice.due_date ? new Date(invoice.due_date).toLocaleDateString('en-IN') : 'Not specified'
    const viewLink = `${window.location.origin}/invoices/${invoiceId}`
    const unsubscribeLink = `${window.location.origin}/preferences/unsubscribe?type=invoices`

    const notificationId = await queueEmailNotification({
      recipient: recipientEmail,
      emailType: 'invoice',
      subject: `Invoice #${invoice.invoice_number} - ${project.project_name}`,
      projectId: invoice.project_id,
      invoiceId: invoiceId,
      htmlBody: EMAIL_TEMPLATES.invoice.htmlTemplate
        .replace(/\[INVOICE_NUMBER\]/g, invoice.invoice_number)
        .replace(/\[PROJECT_NAME\]/g, project.project_name)
        .replace(/\[CUSTOMER_NAME\]/g, 'Valued Customer')
        .replace(/\[AMOUNT\]/g, `₹${invoice.total_amount.toLocaleString('en-IN')}`)
        .replace(/\[INVOICE_DATE\]/g, invoiceDate)
        .replace(/\[DUE_DATE\]/g, dueDate)
        .replace(/\[VIEW_LINK\]/g, viewLink)
        .replace(/\[UNSUBSCRIBE_LINK\]/g, unsubscribeLink)
    })

    return notificationId
  } catch (error) {
    console.error('Error queuing invoice email:', error)
    return null
  }
}

/**
 * Queue task reminder emails
 * @param {string} taskId - Task ID
 * @param {Array<string>} recipientEmails - Recipient email addresses
 * @returns {Promise<Array<string>>} Array of notification IDs
 */
export async function queueTaskReminder(taskId, recipientEmails = []) {
  try {
    // Fetch task details
    const { data: task, error: taskError } = await supabase
      .from('stage_tasks')
      .select('*')
      .eq('id', taskId)
      .single()

    if (taskError) throw taskError
    if (!task) throw new Error('Task not found')

    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('id, project_name')
      .eq('id', task.project_id)
      .single()

    if (projectError) throw projectError

    const dueDate = task.due_date ? new Date(task.due_date).toLocaleDateString('en-IN') : 'No due date'
    const viewLink = `${window.location.origin}/tasks/${taskId}`
    const priorityClass = (task.priority || 'medium').toLowerCase()

    const notificationIds = []

    for (const email of recipientEmails) {
      const notificationId = await queueEmailNotification({
        recipient: email,
        emailType: 'reminder',
        subject: `Task Reminder: ${task.task_title}`,
        projectId: task.project_id,
        taskId: taskId,
        htmlBody: EMAIL_TEMPLATES.reminder.htmlTemplate
          .replace(/\$\{taskTitle\}/g, task.task_title)
          .replace(/\$\{taskDescription\}/g, task.task_description || 'No description')
          .replace(/\$\{projectName\}/g, project.project_name)
          .replace(/\$\{dueDate\}/g, dueDate)
          .replace(/\$\{priority\}/g, task.priority || 'Medium')
          .replace(/\$\{priorityClass\}/g, priorityClass)
          .replace(/\$\{assignedTo\}/g, task.assigned_to || 'Unassigned')
          .replace(/\$\{recipientName\}/g, 'Team Member')
          .replace(/\$\{viewLink\}/g, viewLink)
      })

      if (notificationId) {
        notificationIds.push(notificationId)
      }
    }

    return notificationIds
  } catch (error) {
    console.error('Error queuing task reminder:', error)
    return []
  }
}

/**
 * Queue project status update emails
 * @param {string} projectId - Project ID
 * @param {Array<string>} customerEmails - Customer email addresses
 * @param {string} message - Custom message
 * @returns {Promise<Array<string>>} Array of notification IDs
 */
export async function queueStatusUpdate(projectId, customerEmails = [], message = '') {
  try {
    // Fetch project details
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .select('*')
      .eq('id', projectId)
      .single()

    if (projectError) throw projectError
    if (!project) throw new Error('Project not found')

    const statusClass = (project.current_stage || 'EST').toLowerCase()
    const updateDate = new Date().toLocaleDateString('en-IN')
    const viewLink = `${window.location.origin}/projects/${projectId}`
    const completionPercent = project.completion_percentage || 0

    const notificationIds = []

    for (const email of customerEmails) {
      const notificationId = await queueEmailNotification({
        recipient: email,
        emailType: 'status_update',
        subject: `Project Status Update: ${project.project_name}`,
        projectId: projectId,
        htmlBody: EMAIL_TEMPLATES.status_update.htmlTemplate
          .replace(/\$\{projectName\}/g, project.project_name)
          .replace(/\$\{currentStatus\}/g, project.current_stage || 'EST')
          .replace(/\$\{statusClass\}/g, statusClass)
          .replace(/\$\{completionPercent\}/g, completionPercent)
          .replace(/\$\{customMessage\}/g, message)
          .replace(/\$\{updateDate\}/g, updateDate)
          .replace(/\$\{customerName\}/g, 'Valued Customer')
          .replace(/\$\{viewLink\}/g, viewLink)
      })

      if (notificationId) {
        notificationIds.push(notificationId)
      }
    }

    return notificationIds
  } catch (error) {
    console.error('Error queuing status update:', error)
    return []
  }
}

/**
 * Schedule email notification for delayed sending
 * @param {string} notificationId - Notification ID
 * @param {number} delayMs - Delay in milliseconds
 * @returns {Promise<boolean>}
 */
export async function scheduleEmailNotification(notificationId, delayMs = 0) {
  try {
    const scheduledTime = new Date(Date.now() + delayMs).toISOString()

    const { error } = await supabase
      .from('email_notifications')
      .update({ scheduled_at: scheduledTime })
      .eq('id', notificationId)

    if (error) throw error
    console.log(`Email notification scheduled for ${new Date(scheduledTime).toLocaleString()}`)
    return true
  } catch (error) {
    console.error('Error scheduling email notification:', error)
    return false
  }
}

/**
 * Get email logs with filters
 * @param {Object} filters - Filter options
 * @returns {Promise<Array>}
 */
export async function getEmailLogs(filters = {}) {
  try {
    let query = supabase
      .from('email_notifications')
      .select('*')

    if (filters.projectId) {
      query = query.eq('related_project_id', filters.projectId)
    }

    if (filters.status) {
      query = query.eq('status', filters.status)
    }

    if (filters.recipient) {
      query = query.ilike('recipient', `%${filters.recipient}%`)
    }

    if (filters.dateRange) {
      const { start, end } = filters.dateRange
      query = query
        .gte('created_at', start.toISOString())
        .lte('created_at', end.toISOString())
    }

    const { data, error } = await query
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching email logs:', error)
    return []
  }
}

/**
 * Get notification queue (pending emails)
 * @returns {Promise<Array>}
 */
export async function getNotificationQueue() {
  try {
    const { data, error } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .order('scheduled_at', { ascending: true })

    if (error) throw error
    return data || []
  } catch (error) {
    console.error('Error fetching notification queue:', error)
    return []
  }
}

/**
 * Mark email as sent
 * @param {string} notificationId - Notification ID
 * @param {string} messageId - Message ID from Resend
 * @returns {Promise<boolean>}
 */
export async function markEmailSent(notificationId, messageId) {
  try {
    const { error } = await supabase
      .from('email_notifications')
      .update({
        status: 'sent',
        message_id: messageId,
        sent_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking email as sent:', error)
    return false
  }
}

/**
 * Mark email as failed
 * @param {string} notificationId - Notification ID
 * @param {string} errorMessage - Error message
 * @param {number} retryCount - Current retry count
 * @returns {Promise<boolean>}
 */
export async function markEmailFailed(notificationId, errorMessage, retryCount = 0) {
  try {
    const newRetryCount = retryCount + 1
    const newStatus = newRetryCount < MAX_RETRIES ? 'pending' : 'failed'

    const { error } = await supabase
      .from('email_notifications')
      .update({
        status: newStatus,
        error_message: errorMessage,
        retry_count: newRetryCount,
        failed_at: new Date().toISOString()
      })
      .eq('id', notificationId)

    if (error) throw error
    return true
  } catch (error) {
    console.error('Error marking email as failed:', error)
    return false
  }
}

/**
 * Resend failed emails with exponential backoff
 * @param {number} limit - Max emails to resend
 * @returns {Promise<Object>} {resent, stillFailed}
 */
export async function resendFailedEmails(limit = 10) {
  try {
    const { data: failedEmails, error: fetchError } = await supabase
      .from('email_notifications')
      .select('*')
      .eq('status', 'pending')
      .lt('retry_count', MAX_RETRIES)
      .lt('failed_at', new Date(Date.now() - RETRY_DELAY_MS).toISOString())
      .limit(limit)

    if (fetchError) throw fetchError

    let resent = 0
    let stillFailed = 0

    for (const notification of failedEmails || []) {
      try {
        const result = await sendEmailViaResend(
          notification.recipient,
          notification.subject,
          notification.html_body,
          notification.email_type,
          {
            projectId: notification.related_project_id,
            invoiceId: notification.related_invoice_id,
            taskId: notification.related_task_id
          }
        )

        if (result.success) {
          resent++
          await markEmailSent(notification.id, result.messageId)
        } else {
          stillFailed++
          await markEmailFailed(notification.id, result.error, notification.retry_count)
        }
      } catch (error) {
        console.error(`Error resending email ${notification.id}:`, error)
        stillFailed++
      }
    }

    console.log(`Resend failed emails: ${resent} resent, ${stillFailed} still failing`)
    return { resent, stillFailed }
  } catch (error) {
    console.error('Error in resendFailedEmails:', error)
    return { resent: 0, stillFailed: 0 }
  }
}

/**
 * Clean up old email logs
 * @param {number} olderThanDays - Delete logs older than this many days
 * @returns {Promise<number>} Count of deleted records
 */
export async function cleanupOldEmailLogs(olderThanDays = 90) {
  try {
    const cutoffDate = new Date(Date.now() - olderThanDays * 24 * 60 * 60 * 1000).toISOString()

    const { data: toDelete, error: fetchError } = await supabase
      .from('email_notifications')
      .select('id')
      .eq('status', 'sent')
      .lt('created_at', cutoffDate)

    if (fetchError) throw fetchError

    const count = toDelete?.length || 0

    if (count > 0) {
      const { error: deleteError } = await supabase
        .from('email_notifications')
        .delete()
        .eq('status', 'sent')
        .lt('created_at', cutoffDate)

      if (deleteError) throw deleteError
      console.log(`Cleaned up ${count} old email logs`)
    }

    return count
  } catch (error) {
    console.error('Error cleaning up old email logs:', error)
    return 0
  }
}
