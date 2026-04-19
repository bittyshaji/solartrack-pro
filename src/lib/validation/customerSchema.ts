/**
 * Customer Validation Schema
 * Validates customer data for creation, updates, and contact information
 */

import { z } from 'zod';

/**
 * Phone number validation with common international formats
 */
const phoneSchema = z
  .string()
  .regex(
    /^[\+]?[(]?[0-9]{1,4}[)]?[-\s\.]?[(]?[0-9]{1,4}[)]?[-\s\.]?[0-9]{1,9}$/,
    'Please enter a valid phone number'
  )
  .describe('Phone number in any common format');

/**
 * Email validation
 */
const emailSchema = z
  .string()
  .email('Please enter a valid email address')
  .describe('Valid email address');

/**
 * Address schema for street address
 */
export const addressSchema = z.object({
  street: z
    .string()
    .min(5, 'Street address must be at least 5 characters')
    .max(200, 'Street address must not exceed 200 characters')
    .describe('Street name and number'),

  city: z
    .string()
    .min(2, 'City must be at least 2 characters')
    .max(100, 'City must not exceed 100 characters')
    .describe('City name'),

  state: z
    .string()
    .min(2, 'State must be at least 2 characters')
    .max(100, 'State must not exceed 100 characters')
    .describe('State or province'),

  postalCode: z
    .string()
    .regex(/^\d{5,10}$/, 'Postal code must be 5-10 digits')
    .describe('Postal/ZIP code'),

  country: z
    .string()
    .min(2, 'Country must be at least 2 characters')
    .describe('Country name'),
});

/**
 * Base customer schema with common fields
 */
export const baseCustomerSchema = z.object({
  firstName: z
    .string()
    .min(1, 'First name is required')
    .max(50, 'First name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'First name can only contain letters, spaces, hyphens, and apostrophes')
    .describe('Customer first name'),

  lastName: z
    .string()
    .min(1, 'Last name is required')
    .max(50, 'Last name must not exceed 50 characters')
    .regex(/^[a-zA-Z\s'-]+$/, 'Last name can only contain letters, spaces, hyphens, and apostrophes')
    .describe('Customer last name'),

  email: emailSchema,

  phone: phoneSchema,

  alternatePhone: phoneSchema.optional().describe('Secondary phone number'),

  address: addressSchema.describe('Physical address'),

  companyName: z
    .string()
    .max(100, 'Company name must not exceed 100 characters')
    .optional()
    .describe('Company or organization name if applicable'),

  gstin: z
    .string()
    .regex(/^\d{2}[A-Z]{5}\d{4}[A-Z]{1}[A-Z\d]{1}[Z]{1}[A-Z\d]{1}$/, 'Please enter a valid GSTIN')
    .optional()
    .describe('GSTIN for Indian businesses'),

  panNumber: z
    .string()
    .regex(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/, 'Please enter a valid PAN number')
    .optional()
    .describe('PAN number for Indian customers'),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .describe('Additional notes about the customer'),

  preferredContactMethod: z
    .enum(['email', 'phone', 'sms'])
    .optional()
    .default('email')
    .describe('Preferred method of contact'),

  taxExempt: z
    .boolean()
    .optional()
    .default(false)
    .describe('Whether customer is tax exempt'),
});

/**
 * Customer creation schema
 */
export const createCustomerSchema = baseCustomerSchema;

/**
 * Customer update schema - all fields optional
 */
export const updateCustomerSchema = baseCustomerSchema.partial();

/**
 * Bulk customer import schema
 */
export const bulkCustomerImportSchema = z.object({
  customers: z
    .array(baseCustomerSchema)
    .min(1, 'At least one customer is required'),
});

/**
 * Customer contact information update
 */
export const updateCustomerContactSchema = z.object({
  email: emailSchema.optional(),
  phone: phoneSchema.optional(),
  alternatePhone: phoneSchema.optional(),
  preferredContactMethod: z
    .enum(['email', 'phone', 'sms'])
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  'At least one contact field must be provided'
);

/**
 * Customer search/filter schema
 */
export const customerFilterSchema = z.object({
  searchTerm: z
    .string()
    .optional()
    .describe('Search by name, email, or phone'),

  city: z
    .string()
    .optional()
    .describe('Filter by city'),

  state: z
    .string()
    .optional()
    .describe('Filter by state'),

  sortBy: z
    .enum(['name', 'email', 'createdDate'])
    .optional()
    .default('name'),

  sortOrder: z
    .enum(['asc', 'desc'])
    .optional()
    .default('asc'),

  taxExempt: z
    .boolean()
    .optional()
    .describe('Filter tax exempt customers'),

  limit: z
    .number()
    .positive()
    .optional()
    .default(50),

  offset: z
    .number()
    .nonnegative()
    .optional()
    .default(0),
});

/**
 * Customer communication preferences
 */
export const customerCommunicationSchema = z.object({
  customerId: z.string().min(1, 'Customer ID is required'),
  receiveNewsletters: z.boolean().optional().default(false),
  receivePromotions: z.boolean().optional().default(false),
  unsubscribeFrom: z.array(z.string()).optional(),
  communicationLanguage: z.enum(['en', 'hi', 'te', 'ta', 'ml']).optional().default('en'),
});

/**
 * Validate single email uniqueness async
 * Note: The actual async check should be done in the application layer
 */
export const emailUniqueSchema = z.object({
  email: emailSchema,
});

// Type exports for TypeScript
export type Address = z.infer<typeof addressSchema>;
export type CreateCustomerData = z.infer<typeof createCustomerSchema>;
export type UpdateCustomerData = z.infer<typeof updateCustomerSchema>;
export type BulkCustomerImportData = z.infer<typeof bulkCustomerImportSchema>;
export type UpdateCustomerContactData = z.infer<typeof updateCustomerContactSchema>;
export type CustomerFilterOptions = z.infer<typeof customerFilterSchema>;
export type CustomerCommunicationPrefs = z.infer<typeof customerCommunicationSchema>;
