/**
 * Project Validation Schema
 * Validates project data for creation, updates, and form submissions
 */

import { z } from 'zod';

/**
 * Project status enum - matches database values
 */
export const ProjectStatus = z.enum([
  'site_survey',
  'proposal',
  'customer_approval',
  'advanced_payment',
  'material_procurement',
  'installation',
  'testing_commissioning',
  'final_approval',
  'completed',
  'hold',
  'cancelled',
]);

export type ProjectStatus = z.infer<typeof ProjectStatus>;

/**
 * Site survey schema - for initial site survey data
 */
export const siteSurveySchema = z.object({
  roofType: z
    .string()
    .min(1, 'Roof type is required')
    .describe('Type of roof (e.g., concrete, tiled, corrugated)'),
  roofArea: z
    .number()
    .positive('Roof area must be greater than 0')
    .describe('Total roof area in square meters'),
  shading: z
    .string()
    .min(1, 'Shading information is required')
    .describe('Description of any shading or obstructions'),
  soilType: z
    .string()
    .min(1, 'Soil type is required')
    .describe('Type of soil for foundation assessment'),
});

/**
 * Basic project schema for creation and updates
 */
export const baseProjectSchema = z.object({
  projectName: z
    .string()
    .min(2, 'Project name must be at least 2 characters')
    .max(100, 'Project name must not exceed 100 characters')
    .describe('Name/identifier for the project'),

  customerId: z
    .string()
    .min(1, 'Customer is required')
    .describe('Reference to the customer'),

  description: z
    .string()
    .max(1000, 'Description must not exceed 1000 characters')
    .optional()
    .describe('Detailed project description'),

  status: ProjectStatus.describe('Current project status'),

  systemSize: z
    .number()
    .positive('System size must be greater than 0')
    .max(1000, 'System size must be reasonable')
    .describe('Solar system capacity in kW'),

  estimatedCost: z
    .number()
    .nonnegative('Estimated cost cannot be negative')
    .describe('Estimated project cost in currency units'),

  startDate: z
    .string()
    .datetime('Start date must be a valid datetime')
    .optional()
    .describe('Project start date'),

  endDate: z
    .string()
    .datetime('End date must be a valid datetime')
    .optional()
    .describe('Project end date'),

  location: z
    .string()
    .min(2, 'Location must be at least 2 characters')
    .max(200, 'Location must not exceed 200 characters')
    .describe('Physical location of the project'),

  tags: z
    .array(z.string())
    .optional()
    .default([])
    .describe('Tags for categorization'),

  notes: z
    .string()
    .max(2000, 'Notes must not exceed 2000 characters')
    .optional()
    .describe('Additional project notes'),
});

/**
 * Project creation schema with required fields
 */
export const createProjectSchema = baseProjectSchema.extend({
  startDate: z.string().datetime('Start date must be a valid datetime'),
  endDate: z.string().datetime('End date must be a valid datetime'),
}).refine(
  (data) => new Date(data.startDate) < new Date(data.endDate),
  {
    message: 'End date must be after start date',
    path: ['endDate'],
  }
);

/**
 * Project update schema - all fields optional
 */
export const updateProjectSchema = baseProjectSchema.partial().refine(
  (data) => {
    if (data.startDate && data.endDate) {
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
 * Site survey update schema
 */
export const updateSiteSurveySchema = siteSurveySchema.partial();

/**
 * Project with site survey schema - for projects with survey data
 */
export const projectWithSiteSurveySchema = createProjectSchema.extend({
  siteSurvey: siteSurveySchema.optional(),
});

/**
 * Project status update schema
 */
export const updateProjectStatusSchema = z.object({
  projectId: z.string().min(1, 'Project ID is required'),
  newStatus: ProjectStatus,
  reason: z
    .string()
    .max(500, 'Reason must not exceed 500 characters')
    .optional()
    .describe('Reason for status change'),
});

/**
 * Project bulk operations schema
 */
export const projectBulkOperationSchema = z.object({
  projectIds: z
    .array(z.string().min(1, 'Invalid project ID'))
    .min(1, 'At least one project must be selected'),
  operation: z.enum(['status_change', 'assign_team', 'add_tag', 'delete']),
  payload: z.record(z.any()).optional(),
});

/**
 * Filter/search projects schema
 */
export const projectFilterSchema = z.object({
  status: ProjectStatus.optional(),
  customerId: z.string().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  minCost: z.number().nonnegative().optional(),
  maxCost: z.number().nonnegative().optional(),
  searchTerm: z.string().optional(),
  tags: z.array(z.string()).optional(),
  sortBy: z.enum(['name', 'date', 'cost', 'status']).optional().default('date'),
  sortOrder: z.enum(['asc', 'desc']).optional().default('desc'),
});

// Type exports for TypeScript
export type SiteSurveyData = z.infer<typeof siteSurveySchema>;
export type CreateProjectData = z.infer<typeof createProjectSchema>;
export type UpdateProjectData = z.infer<typeof updateProjectSchema>;
export type ProjectWithSiteSurvey = z.infer<typeof projectWithSiteSurveySchema>;
export type UpdateProjectStatusData = z.infer<typeof updateProjectStatusSchema>;
export type ProjectBulkOperation = z.infer<typeof projectBulkOperationSchema>;
export type ProjectFilterOptions = z.infer<typeof projectFilterSchema>;
