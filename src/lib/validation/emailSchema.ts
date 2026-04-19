/**
 * Email Template and Communication Validation Schema
 * Validates email templates, recipient lists, and email campaigns
 */

import { z } from 'zod';

/**
 * Email template type enum
 */
export const EmailTemplateType = z.enum([
  'project_update',
  'invoice_sent',
  'estimate_request',
  'payment_reminder',
  'project_completion',
  'survey_request',
  'support_ticket',
  'welcome',
  'custom',
]);

export type EmailTemplateType = z.infer<typeof EmailTemplateType>;

/**
 * Email variable schema - for template placeholders
 */
export const emailVariableSchema = z.object({
  key: z
    .string()
    .regex(/^[A-Z_]+$/, 'Variable key must be uppercase with underscores')
    .describe('Variable placeholder key (e.g., CUSTOMER_NAME)'),

  description: z
    .string()
    .max(200, 'Description must not exceed 200 characters')
    .optional()
    .describe('Description of what this variable represents'),

  sampleValue: z
    .string()
    .optional()
    .describe('Sample value for preview'),

  required: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether this variable is required'),
});

/**
 * Base email template schema
 */
export const baseEmailTemplateSchema = z.object({
  name: z
    .string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must not exceed 100 characters')
    .describe('Name of the email template'),

  type: EmailTemplateType.describe('Type of email template'),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .describe('Email subject line'),

  fromName: z
    .string()
    .min(1, 'From name is required')
    .max(100, 'From name must not exceed 100 characters')
    .describe('Display name for sender'),

  fromEmail: z
    .string()
    .email('Please enter a valid email address')
    .describe('Sender email address'),

  replyTo: z
    .string()
    .email('Please enter a valid email address')
    .optional()
    .describe('Reply-to email address'),

  htmlContent: z
    .string()
    .min(10, 'HTML content must be at least 10 characters')
    .max(50000, 'HTML content must not exceed 50000 characters')
    .describe('HTML content of the email'),

  textContent: z
    .string()
    .min(10, 'Text content must be at least 10 characters')
    .max(50000, 'Text content must not exceed 50000 characters')
    .describe('Plain text version of the email'),

  variables: z
    .array(emailVariableSchema)
    .optional()
    .default([])
    .describe('Template variables/placeholders'),

  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .describe('Description of when to use this template'),

  isActive: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether template is active and available'),

  tags: z
    .array(z.string())
    .optional()
    .default([])
    .describe('Tags for organization'),
});

/**
 * Create email template schema
 */
export const createEmailTemplateSchema = baseEmailTemplateSchema;

/**
 * Update email template schema - all fields optional
 */
export const updateEmailTemplateSchema = baseEmailTemplateSchema.partial();

/**
 * Email recipient schema
 */
export const emailRecipientSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Recipient email address'),

  name: z
    .string()
    .max(100, 'Name must not exceed 100 characters')
    .optional()
    .describe('Recipient name'),

  variables: z
    .record(z.string())
    .optional()
    .describe('Template variables for this recipient'),

  status: z
    .enum(['pending', 'sent', 'opened', 'failed'])
    .optional()
    .default('pending')
    .describe('Send status'),
});

/**
 * Send single email schema
 */
export const sendSingleEmailSchema = z.object({
  recipientEmail: z
    .string()
    .email('Please enter a valid email address')
    .describe('Recipient email address'),

  recipientName: z
    .string()
    .max(100, 'Name must not exceed 100 characters')
    .optional()
    .describe('Recipient name'),

  templateId: z
    .string()
    .optional()
    .describe('ID of email template to use'),

  subject: z
    .string()
    .min(5, 'Subject must be at least 5 characters')
    .max(200, 'Subject must not exceed 200 characters')
    .optional()
    .describe('Email subject (overrides template)'),

  htmlContent: z
    .string()
    .optional()
    .describe('Email HTML content (overrides template)'),

  variables: z
    .record(z.string())
    .optional()
    .describe('Variables to replace in template'),

  attachments: z
    .array(
      z.object({
        filename: z.string(),
        mimeType: z.string().optional(),
        content: z.string().or(z.instanceof(Buffer)),
      })
    )
    .optional()
    .describe('Attachments to include'),

  priority: z
    .enum(['low', 'normal', 'high'])
    .optional()
    .default('normal')
    .describe('Email priority level'),
});

/**
 * Bulk email send schema
 */
export const bulkEmailSendSchema = z.object({
  recipients: z
    .array(emailRecipientSchema)
    .min(1, 'At least one recipient is required')
    .describe('List of email recipients'),

  templateId: z
    .string()
    .optional()
    .describe('ID of email template to use'),

  subject: z
    .string()
    .max(200, 'Subject must not exceed 200 characters')
    .optional()
    .describe('Email subject (overrides template)'),

  htmlContent: z
    .string()
    .optional()
    .describe('Email HTML content (overrides template)'),

  scheduleTime: z
    .string()
    .datetime()
    .optional()
    .describe('When to send emails'),

  trackOpens: z
    .boolean()
    .optional()
    .default(true)
    .describe('Track email opens'),

  trackClicks: z
    .boolean()
    .optional()
    .default(false)
    .describe('Track link clicks'),
});

/**
 * Email campaign schema
 */
export const emailCampaignSchema = z.object({
  name: z
    .string()
    .min(1, 'Campaign name is required')
    .max(100, 'Campaign name must not exceed 100 characters')
    .describe('Name of the email campaign'),

  description: z
    .string()
    .max(500, 'Description must not exceed 500 characters')
    .optional()
    .describe('Campaign description and goals'),

  templateId: z
    .string()
    .min(1, 'Template ID is required')
    .describe('ID of email template to use'),

  recipientList: z
    .array(z.string())
    .min(1, 'At least one recipient is required')
    .describe('List of recipient email addresses'),

  startDate: z
    .string()
    .datetime('Start date must be a valid datetime')
    .describe('Campaign start date'),

  endDate: z
    .string()
    .datetime('End date must be a valid datetime')
    .optional()
    .describe('Campaign end date'),

  timezone: z
    .string()
    .optional()
    .default('UTC')
    .describe('Timezone for scheduling'),

  frequency: z
    .enum(['once', 'daily', 'weekly', 'monthly'])
    .optional()
    .default('once')
    .describe('Email frequency if recurring'),

  tags: z
    .array(z.string())
    .optional()
    .describe('Campaign tags'),
}).refine(
  (data) => {
    if (data.endDate) {
      return new Date(data.startDate) < new Date(data.endDate);
    }
    return true;
  },
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Email unsubscribe schema
 */
export const emailUnsubscribeSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email to unsubscribe'),

  reason: z
    .enum(['spam', 'not_interested', 'too_frequent', 'other'])
    .optional()
    .describe('Reason for unsubscribing'),

  feedback: z
    .string()
    .max(500, 'Feedback must not exceed 500 characters')
    .optional()
    .describe('Additional feedback'),
});

/**
 * Email bounce/complaint schema
 */
export const emailBounceSchema = z.object({
  email: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email address that bounced'),

  bounceType: z
    .enum(['permanent', 'temporary', 'complaint'])
    .describe('Type of bounce'),

  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .describe('Reason for bounce'),

  timestamp: z
    .string()
    .datetime()
    .optional()
    .describe('When the bounce occurred'),
});

// Type exports for TypeScript
export type EmailVariable = z.infer<typeof emailVariableSchema>;
export type CreateEmailTemplateData = z.infer<typeof createEmailTemplateSchema>;
export type UpdateEmailTemplateData = z.infer<typeof updateEmailTemplateSchema>;
export type EmailRecipient = z.infer<typeof emailRecipientSchema>;
export type SendSingleEmailData = z.infer<typeof sendSingleEmailSchema>;
export type BulkEmailSendData = z.infer<typeof bulkEmailSendSchema>;
export type EmailCampaignData = z.infer<typeof emailCampaignSchema>;
export type EmailUnsubscribeData = z.infer<typeof emailUnsubscribeSchema>;
export type EmailBounceData = z.infer<typeof emailBounceSchema>;
