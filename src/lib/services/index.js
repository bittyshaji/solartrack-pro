/**
 * Services Index
 * Central exports for all service modules
 *
 * Usage:
 *   // Import specific service category
 *   import { createProject } from '@/services/projects'
 *
 *   // Import from operations
 *   import { getBatchOperationStatus } from '@/services/operations/batch'
 */

// Project services
export * from './projects/index'

// Customer services
export * from './customers/index'

// Email services
export * from './emails/index'

// Invoice services
export * from './invoices/index'

// Material services
export * from './materials/index'

// Proposal services
export * from './proposals/index'

// Operations services (batch, export, filtering, etc.)
export * from './operations/index'

// Site survey services
export * from './site-survey/index'

// KSEB services
export * from './kseb/index'

// Finance services
export * from './finance/index'

// Staff services
export * from './staff/index'

// Notification services
export * from './notifications/index'

// Photo services
export * from './photos/index'

// Task services
export * from './tasks/index'

// Team services
export * from './teams/index'

// Warranty services
export * from './warranty/index'
