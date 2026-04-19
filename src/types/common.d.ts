/**
 * Common Type Definitions
 * Shared types for API responses, errors, pagination, and utilities
 */

/**
 * Standard API Response Wrapper
 */
export interface ApiResponse<T = any> {
  data?: T
  error?: string | null
  success: boolean
  message?: string
}

/**
 * Pagination metadata
 */
export interface PaginationMeta {
  page: number
  limit: number
  total: number
  totalPages: number
}

/**
 * Paginated API Response
 */
export interface PaginatedResponse<T = any> {
  data: T[]
  meta: PaginationMeta
  error?: string | null
  success: boolean
}

/**
 * Standard error response
 */
export interface ErrorResponse {
  error: string
  code?: string
  details?: Record<string, any>
  timestamp?: string
}

/**
 * Date range for filtering
 */
export interface DateRange {
  startDate: Date | string
  endDate: Date | string
}

/**
 * Pagination params for queries
 */
export interface PaginationParams {
  page?: number
  limit?: number
  offset?: number
}

/**
 * Sort order
 */
export type SortOrder = 'asc' | 'desc' | 'ascending' | 'descending'

/**
 * Sort params
 */
export interface SortParams {
  field: string
  order: SortOrder
}

/**
 * Standard filter operator
 */
export type FilterOperator = 'eq' | 'neq' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'like' | 'ilike'

/**
 * Standard filter condition
 */
export interface FilterCondition {
  field: string
  operator: FilterOperator
  value: any
}

/**
 * Status indicator
 */
export type StatusIndicator = 'success' | 'error' | 'warning' | 'info' | 'pending'

/**
 * Audit metadata
 */
export interface AuditMeta {
  createdAt: string
  updatedAt: string
  createdBy?: string
  updatedBy?: string
  deletedAt?: string | null
  deletedBy?: string | null
}

/**
 * File metadata
 */
export interface FileMetadata {
  name: string
  size: number
  type: string
  url?: string
  uploadedAt?: string
}

/**
 * Cache entry
 */
export interface CacheEntry<T = any> {
  data: T
  timestamp: number
  ttl: number
  key: string
}

/**
 * Cache statistics
 */
export interface CacheStats {
  hits: number
  misses: number
  total: number
  hitRate: string
}

/**
 * Notification type
 */
export type NotificationType = 'success' | 'error' | 'warning' | 'info'

/**
 * Notification payload
 */
export interface NotificationPayload {
  type: NotificationType
  message: string
  duration?: number
  id?: string
}

/**
 * Async operation status
 */
export interface AsyncOperationStatus {
  loading: boolean
  error: string | null
  data?: any
  timestamp?: number
}

/**
 * Batch operation result
 */
export interface BatchOperationResult<T = any> {
  succeeded: T[]
  failed: Array<{ item: T; error: string }>
  total: number
  successCount: number
  failureCount: number
}
