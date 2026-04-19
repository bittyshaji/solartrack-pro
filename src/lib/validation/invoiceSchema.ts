/**
 * Invoice Validation Schema
 * Validates invoice data, line items, and payment information
 */

import { z } from 'zod';

/**
 * Invoice status enum
 */
export const InvoiceStatus = z.enum([
  'draft',
  'sent',
  'viewed',
  'partially_paid',
  'paid',
  'overdue',
  'cancelled',
]);

export type InvoiceStatus = z.infer<typeof InvoiceStatus>;

/**
 * Invoice line item schema
 */
export const invoiceLineItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Line item description is required')
    .max(500, 'Description must not exceed 500 characters')
    .describe('Description of the item or service'),

  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .describe('Quantity of items or service hours'),

  unitPrice: z
    .number()
    .nonnegative('Unit price cannot be negative')
    .describe('Price per unit'),

  taxRate: z
    .number()
    .min(0, 'Tax rate cannot be negative')
    .max(100, 'Tax rate cannot exceed 100%')
    .optional()
    .default(18)
    .describe('Tax rate as percentage (e.g., 18 for 18%)'),

  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .default(0)
    .describe('Discount as percentage'),

  hsn: z
    .string()
    .optional()
    .describe('HSN/SAC code for tax classification'),

  sac: z
    .string()
    .optional()
    .describe('SAC code for services'),
});

/**
 * Base invoice schema
 */
export const baseInvoiceSchema = z.object({
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .describe('Reference to the project'),

  customerId: z
    .string()
    .min(1, 'Customer ID is required')
    .describe('Reference to the customer'),

  invoiceNumber: z
    .string()
    .min(1, 'Invoice number is required')
    .max(50, 'Invoice number must not exceed 50 characters')
    .describe('Unique invoice identifier'),

  invoiceDate: z
    .string()
    .datetime('Invoice date must be a valid datetime')
    .describe('Date invoice was created'),

  dueDate: z
    .string()
    .datetime('Due date must be a valid datetime')
    .describe('Payment due date'),

  lineItems: z
    .array(invoiceLineItemSchema)
    .min(1, 'At least one line item is required')
    .describe('Items or services on the invoice'),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .describe('Additional notes or terms'),

  internalNotes: z
    .string()
    .max(1000, 'Internal notes must not exceed 1000 characters')
    .optional()
    .describe('Internal notes not visible to customer'),

  termsConditions: z
    .string()
    .max(2000, 'Terms and conditions must not exceed 2000 characters')
    .optional()
    .describe('Terms and conditions of the invoice'),

  discountPercentage: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .default(0)
    .describe('Overall invoice discount percentage'),

  status: InvoiceStatus.optional().default('draft'),

  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .optional()
    .default('INR')
    .describe('Currency code (e.g., INR, USD)'),
}).refine(
  (data) => new Date(data.invoiceDate) <= new Date(data.dueDate),
  {
    message: 'Due date must be on or after invoice date',
    path: ['dueDate'],
  }
);

/**
 * Create invoice schema
 */
export const createInvoiceSchema = baseInvoiceSchema;

/**
 * Update invoice schema - all fields optional
 */
export const updateInvoiceSchema = baseInvoiceSchema.partial().extend({
  // Prevent updating certain fields after invoice is sent
  invoiceNumber: z.string().optional(),
  invoiceDate: z.string().optional(),
});

/**
 * Invoice payment record schema
 */
export const invoicePaymentSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  amount: z
    .number()
    .positive('Payment amount must be greater than 0')
    .describe('Amount paid'),

  paymentDate: z
    .string()
    .datetime('Payment date must be a valid datetime')
    .describe('Date payment was received'),

  paymentMethod: z
    .enum(['cash', 'check', 'bank_transfer', 'credit_card', 'upi', 'other'])
    .describe('Method of payment'),

  transactionId: z
    .string()
    .optional()
    .describe('Transaction or reference number'),

  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .describe('Notes about the payment'),
});

/**
 * Invoice send schema - for sending invoices to customers
 */
export const invoiceSendSchema = z.object({
  invoiceId: z.string().min(1, 'Invoice ID is required'),
  recipientEmail: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email address to send invoice to'),

  subject: z
    .string()
    .optional()
    .describe('Email subject line'),

  message: z
    .string()
    .max(1000, 'Message must not exceed 1000 characters')
    .optional()
    .describe('Additional message to include in email'),

  sendReminders: z
    .boolean()
    .optional()
    .default(true)
    .describe('Enable automatic payment reminders'),

  attachPDF: z
    .boolean()
    .optional()
    .default(true)
    .describe('Attach PDF version of invoice'),
});

/**
 * Invoice filter/search schema
 */
export const invoiceFilterSchema = z.object({
  status: InvoiceStatus.optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'dueDate', 'status']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
  limit: z.number().positive().optional().default(50),
  offset: z.number().nonnegative().optional().default(0),
});

/**
 * Invoice bulk operations schema
 */
export const invoiceBulkOperationSchema = z.object({
  invoiceIds: z
    .array(z.string().min(1))
    .min(1, 'At least one invoice must be selected'),
  operation: z.enum(['send', 'mark_paid', 'cancel', 'resend']),
  payload: z.record(z.any()).optional(),
});

/**
 * Calculate invoice totals schema - for validation of calculated amounts
 */
export const invoiceTotalsSchema = z.object({
  subtotal: z.number().nonnegative(),
  tax: z.number().nonnegative(),
  discount: z.number().nonnegative(),
  total: z.number().nonnegative(),
}).refine(
  (data) => Math.abs(data.total - (data.subtotal + data.tax - data.discount)) < 0.01,
  {
    message: 'Invoice totals do not match',
    path: ['total'],
  }
);

// Type exports for TypeScript
export type InvoiceLineItem = z.infer<typeof invoiceLineItemSchema>;
export type CreateInvoiceData = z.infer<typeof createInvoiceSchema>;
export type UpdateInvoiceData = z.infer<typeof updateInvoiceSchema>;
export type InvoicePaymentData = z.infer<typeof invoicePaymentSchema>;
export type InvoiceSendData = z.infer<typeof invoiceSendSchema>;
export type InvoiceFilterOptions = z.infer<typeof invoiceFilterSchema>;
export type InvoiceBulkOperation = z.infer<typeof invoiceBulkOperationSchema>;
export type InvoiceTotals = z.infer<typeof invoiceTotalsSchema>;
