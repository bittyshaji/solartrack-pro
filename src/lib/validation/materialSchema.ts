/**
 * Material/Inventory Validation Schema
 * Validates material and inventory management data
 */

import { z } from 'zod';

/**
 * Material type enum
 */
export const MaterialType = z.enum([
  'solar_panel',
  'inverter',
  'battery',
  'mounting_structure',
  'cable',
  'connector',
  'breaker',
  'fuse',
  'monitoring_device',
  'labor',
  'other',
]);

export type MaterialType = z.infer<typeof MaterialType>;

/**
 * Material unit enum
 */
export const MaterialUnit = z.enum([
  'piece',
  'meter',
  'kilogram',
  'liter',
  'box',
  'set',
  'hour',
  'day',
]);

export type MaterialUnit = z.infer<typeof MaterialUnit>;

/**
 * Base material schema
 */
export const baseMaterialSchema = z.object({
  name: z
    .string()
    .min(2, 'Material name must be at least 2 characters')
    .max(200, 'Material name must not exceed 200 characters')
    .describe('Name of the material'),

  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .describe('Detailed description of the material'),

  type: MaterialType.describe('Type of material'),

  sku: z
    .string()
    .min(1, 'SKU is required')
    .max(50, 'SKU must not exceed 50 characters')
    .describe('Stock keeping unit / product code'),

  unit: MaterialUnit.describe('Unit of measurement'),

  unitPrice: z
    .number()
    .positive('Unit price must be greater than 0')
    .describe('Cost per unit'),

  currentStock: z
    .number()
    .nonnegative('Stock quantity cannot be negative')
    .optional()
    .default(0)
    .describe('Current quantity in stock'),

  minimumStock: z
    .number()
    .nonnegative('Minimum stock cannot be negative')
    .optional()
    .default(5)
    .describe('Minimum stock level for reordering'),

  reorderQuantity: z
    .number()
    .positive('Reorder quantity must be greater than 0')
    .optional()
    .default(10)
    .describe('Quantity to order when stock is low'),

  supplier: z
    .string()
    .max(100, 'Supplier name must not exceed 100 characters')
    .optional()
    .describe('Supplier or vendor name'),

  supplierCode: z
    .string()
    .max(50, 'Supplier code must not exceed 50 characters')
    .optional()
    .describe('Supplier product code'),

  category: z
    .string()
    .max(50, 'Category must not exceed 50 characters')
    .optional()
    .describe('Material category for organization'),

  specifications: z
    .record(z.string(), z.any())
    .optional()
    .describe('Technical specifications as key-value pairs'),

  warrantyMonths: z
    .number()
    .nonnegative('Warranty months cannot be negative')
    .optional()
    .describe('Warranty period in months'),

  active: z
    .boolean()
    .optional()
    .default(true)
    .describe('Whether material is currently in use'),

  notes: z
    .string()
    .max(1000, 'Notes must not exceed 1000 characters')
    .optional()
    .describe('Additional notes about the material'),
});

/**
 * Create material schema
 */
export const createMaterialSchema = baseMaterialSchema.extend({
  sku: z.string().min(1, 'SKU is required').max(50),
  type: MaterialType,
});

/**
 * Update material schema - all fields optional
 */
export const updateMaterialSchema = baseMaterialSchema.partial();

/**
 * Material stock adjustment schema
 */
export const materialStockAdjustmentSchema = z.object({
  materialId: z.string().min(1, 'Material ID is required'),
  quantity: z
    .number()
    .refine((val) => val !== 0, 'Quantity cannot be zero')
    .describe('Quantity to add (positive) or remove (negative)'),

  reason: z
    .enum(['purchase', 'usage', 'damage', 'theft', 'adjustment', 'returned', 'inventory_check'])
    .describe('Reason for stock adjustment'),

  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .describe('Additional notes about the adjustment'),

  date: z
    .string()
    .datetime('Date must be a valid datetime')
    .optional()
    .describe('Date of adjustment'),
});

/**
 * Material usage record schema
 */
export const materialUsageRecordSchema = z.object({
  materialId: z.string().min(1, 'Material ID is required'),
  projectId: z.string().min(1, 'Project ID is required'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .describe('Quantity used'),

  usageDate: z
    .string()
    .datetime('Usage date must be a valid datetime')
    .describe('Date material was used'),

  usedBy: z
    .string()
    .optional()
    .describe('Name of person who used material'),

  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .describe('Notes about the usage'),
});

/**
 * Bulk material import schema
 */
export const bulkMaterialImportSchema = z.object({
  materials: z
    .array(createMaterialSchema)
    .min(1, 'At least one material is required'),
});

/**
 * Material reorder schema
 */
export const materialReorderSchema = z.object({
  materialId: z.string().min(1, 'Material ID is required'),
  quantity: z
    .number()
    .positive('Quantity must be greater than 0')
    .describe('Quantity to order'),

  expectedDeliveryDate: z
    .string()
    .datetime('Expected delivery date must be a valid datetime')
    .optional()
    .describe('Expected delivery date'),

  supplier: z
    .string()
    .optional()
    .describe('Supplier for this order'),

  notes: z
    .string()
    .max(500, 'Notes must not exceed 500 characters')
    .optional()
    .describe('Order notes'),
});

/**
 * Material filter/search schema
 */
export const materialFilterSchema = z.object({
  searchTerm: z.string().optional().describe('Search by name, SKU, or supplier'),
  type: MaterialType.optional(),
  category: z.string().optional(),
  supplier: z.string().optional(),
  activeOnly: z.boolean().optional().default(true),
  lowStockOnly: z.boolean().optional().default(false),
  sortBy: z.enum(['name', 'price', 'stock', 'category']).optional().default('name'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('asc'),
  limit: z.number().positive().optional().default(50),
  offset: z.number().nonnegative().optional().default(0),
});

/**
 * Material comparison schema - for comparing different suppliers/pricing
 */
export const materialComparisonSchema = z.object({
  materialIds: z
    .array(z.string().min(1))
    .min(2, 'At least two materials are required')
    .max(10, 'Cannot compare more than 10 materials'),
});

// Type exports for TypeScript
export type CreateMaterialData = z.infer<typeof createMaterialSchema>;
export type UpdateMaterialData = z.infer<typeof updateMaterialSchema>;
export type MaterialStockAdjustment = z.infer<typeof materialStockAdjustmentSchema>;
export type MaterialUsageRecord = z.infer<typeof materialUsageRecordSchema>;
export type BulkMaterialImportData = z.infer<typeof bulkMaterialImportSchema>;
export type MaterialReorderData = z.infer<typeof materialReorderSchema>;
export type MaterialFilterOptions = z.infer<typeof materialFilterSchema>;
export type MaterialComparisonData = z.infer<typeof materialComparisonSchema>;
