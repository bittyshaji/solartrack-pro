/**
 * Estimate/Proposal Validation Schema
 * Validates estimate and proposal data for solar projects
 */

import { z } from 'zod';

/**
 * Estimate status enum
 */
export const EstimateStatus = z.enum([
  'draft',
  'sent',
  'viewed',
  'accepted',
  'rejected',
  'expired',
  'converted_to_invoice',
]);

export type EstimateStatus = z.infer<typeof EstimateStatus>;

/**
 * Equipment specification schema
 */
export const equipmentSpecSchema = z.object({
  type: z
    .enum(['panel', 'inverter', 'battery', 'mounting', 'cable', 'breaker', 'monitoring', 'other'])
    .describe('Type of equipment'),

  name: z
    .string()
    .min(1, 'Equipment name is required')
    .max(200, 'Equipment name must not exceed 200 characters')
    .describe('Brand and model of equipment'),

  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .describe('Number of units'),

  unitPrice: z
    .number()
    .nonnegative('Unit price cannot be negative')
    .describe('Price per unit'),

  specifications: z
    .object({})
    .passthrough()
    .optional()
    .describe('Equipment-specific specifications'),

  manufacturer: z
    .string()
    .optional()
    .describe('Equipment manufacturer'),

  warrantyYears: z
    .number()
    .nonnegative()
    .optional()
    .describe('Warranty period in years'),
});

/**
 * Service/labor item schema
 */
export const estimateServiceItemSchema = z.object({
  description: z
    .string()
    .min(1, 'Service description is required')
    .max(500, 'Description must not exceed 500 characters')
    .describe('Description of service or labor'),

  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .optional()
    .default(1)
    .describe('Number of service units'),

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
    .describe('Tax rate as percentage'),

  discount: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .default(0)
    .describe('Discount percentage'),

  hsn: z
    .string()
    .optional()
    .describe('HSN code for tax'),

  sac: z
    .string()
    .optional()
    .describe('SAC code for services'),
});

/**
 * System design schema
 */
export const systemDesignSchema = z.object({
  totalCapacityKw: z
    .number()
    .positive('System capacity must be greater than 0')
    .describe('Total system capacity in kW'),

  panelCount: z
    .number()
    .positive('Panel count must be greater than 0')
    .describe('Number of solar panels'),

  inverterCapacityKw: z
    .number()
    .positive('Inverter capacity must be greater than 0')
    .describe('Inverter capacity in kW'),

  batteryCapacityKwh: z
    .number()
    .nonnegative('Battery capacity cannot be negative')
    .optional()
    .describe('Battery storage capacity in kWh'),

  estimatedAnnualYield: z
    .number()
    .positive('Annual yield must be greater than 0')
    .optional()
    .describe('Estimated annual energy generation in kWh'),

  systemType: z
    .enum(['grid_connected', 'off_grid', 'hybrid'])
    .describe('Type of solar system'),

  roofArea: z
    .number()
    .positive('Roof area must be greater than 0')
    .optional()
    .describe('Required roof area in square meters'),
});

/**
 * Base estimate schema
 */
export const baseEstimateSchema = z.object({
  projectId: z
    .string()
    .min(1, 'Project ID is required')
    .describe('Reference to the project'),

  customerId: z
    .string()
    .min(1, 'Customer ID is required')
    .describe('Reference to the customer'),

  estimateNumber: z
    .string()
    .min(1, 'Estimate number is required')
    .max(50, 'Estimate number must not exceed 50 characters')
    .describe('Unique estimate identifier'),

  title: z
    .string()
    .min(1, 'Title is required')
    .max(200, 'Title must not exceed 200 characters')
    .describe('Estimate title or proposal name'),

  estimateDate: z
    .string()
    .datetime('Estimate date must be a valid datetime')
    .describe('Date estimate was created'),

  validUntilDate: z
    .string()
    .datetime('Valid until date must be a valid datetime')
    .describe('Date until which estimate is valid'),

  status: EstimateStatus.optional().default('draft'),

  systemDesign: systemDesignSchema.describe('Solar system design details'),

  equipment: z
    .array(equipmentSpecSchema)
    .min(1, 'At least one equipment item is required')
    .describe('Equipment specifications and costs'),

  services: z
    .array(estimateServiceItemSchema)
    .optional()
    .default([])
    .describe('Labor and service items'),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .describe('Additional notes or special conditions'),

  termsConditions: z
    .string()
    .max(2000, 'Terms and conditions must not exceed 2000 characters')
    .optional()
    .describe('Terms and conditions of the estimate'),

  discountPercentage: z
    .number()
    .min(0, 'Discount cannot be negative')
    .max(100, 'Discount cannot exceed 100%')
    .optional()
    .default(0)
    .describe('Overall discount percentage'),

  currency: z
    .string()
    .length(3, 'Currency must be a 3-letter code')
    .optional()
    .default('INR')
    .describe('Currency code'),

  validityDays: z
    .number()
    .positive('Validity days must be greater than 0')
    .optional()
    .default(30)
    .describe('Number of days estimate is valid'),
}).refine(
  (data) => new Date(data.estimateDate) <= new Date(data.validUntilDate),
  {
    message: 'Valid until date must be on or after estimate date',
    path: ['validUntilDate'],
  }
);

/**
 * Create estimate schema
 */
export const createEstimateSchema = baseEstimateSchema;

/**
 * Update estimate schema - all fields optional
 */
export const updateEstimateSchema = baseEstimateSchema.partial();

/**
 * Convert estimate to invoice schema
 */
export const convertEstimateToInvoiceSchema = z.object({
  estimateId: z.string().min(1, 'Estimate ID is required'),
  invoiceNumber: z
    .string()
    .min(1, 'Invoice number is required')
    .describe('Number for the new invoice'),

  invoiceDate: z
    .string()
    .datetime('Invoice date must be a valid datetime')
    .describe('Date for the new invoice'),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .describe('Additional notes for the invoice'),
});

/**
 * Estimate send schema
 */
export const estimateSendSchema = z.object({
  estimateId: z.string().min(1, 'Estimate ID is required'),
  recipientEmail: z
    .string()
    .email('Please enter a valid email address')
    .describe('Email address to send estimate to'),

  subject: z
    .string()
    .optional()
    .describe('Email subject line'),

  message: z
    .string()
    .max(1000, 'Message must not exceed 1000 characters')
    .optional()
    .describe('Additional message to include'),

  attachPDF: z
    .boolean()
    .optional()
    .default(true)
    .describe('Attach PDF version'),
});

/**
 * Estimate comparison schema
 */
export const estimateComparisonSchema = z.object({
  estimateIds: z
    .array(z.string().min(1))
    .min(2, 'At least two estimates are required to compare')
    .max(5, 'Cannot compare more than 5 estimates'),
});

/**
 * Estimate filter/search schema
 */
export const estimateFilterSchema = z.object({
  status: EstimateStatus.optional(),
  customerId: z.string().optional(),
  projectId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minAmount: z.number().nonnegative().optional(),
  maxAmount: z.number().nonnegative().optional(),
  searchTerm: z.string().optional(),
  sortBy: z.enum(['date', 'amount', 'status']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type exports for TypeScript
export type EquipmentSpec = z.infer<typeof equipmentSpecSchema>;
export type EstimateServiceItem = z.infer<typeof estimateServiceItemSchema>;
export type SystemDesign = z.infer<typeof systemDesignSchema>;
export type CreateEstimateData = z.infer<typeof createEstimateSchema>;
export type UpdateEstimateData = z.infer<typeof updateEstimateSchema>;
export type ConvertEstimateToInvoiceData = z.infer<typeof convertEstimateToInvoiceSchema>;
export type EstimateSendData = z.infer<typeof estimateSendSchema>;
export type EstimateComparisonData = z.infer<typeof estimateComparisonSchema>;
export type EstimateFilterOptions = z.infer<typeof estimateFilterSchema>;
