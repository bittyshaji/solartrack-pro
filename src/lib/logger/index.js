/**
 * Logger Index
 * Central exports for all logger modules
 *
 * Usage:
 *   // Import main logger
 *   import { logger, logMessage } from '@/lib/logger'
 *
 *   // Import error tracking
 *   import { trackError } from '@/lib/logger'
 *
 *   // Import storage functions
 *   import { getLogs, clearLogs } from '@/lib/logger/storage'
 */

export * from './logger'
export * from './errorTracking'
export * as storage from './storage/index'
