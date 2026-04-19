/**
 * DEPRECATED: Compatibility wrapper for backward compatibility
 * 
 * This file re-exports from the new location for backward compatibility.
 * New code should import directly from @/lib/logger
 * 
 * Migration path:
 *   OLD: import { logger } from '../lib/logger'
 *   NEW: import { logger } from '@/lib/logger'
 */

export * from './logger/logger'

console.warn(
  'DEPRECATION WARNING: Importing from src/lib/logger is deprecated. ' +
  'Please update to import from @/lib/logger instead.'
)
