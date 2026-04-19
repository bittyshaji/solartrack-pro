/**
 * Supabase API Client Wrapper
 * Centralized abstraction layer for all Supabase operations
 * Provides unified error handling, retry logic, logging, and query building
 */

import { supabase } from '../supabase'
import { handleError, ERROR_CODES } from './errorHandler'
import { withRetry } from './retry'
import {
  executeBeforeRequest,
  executeAfterResponse,
  executeOnError
} from './interceptors'

/**
 * API Client Configuration
 */
const DEFAULT_CONFIG = {
  enableRetry: true,
  retryConfig: {
    maxRetries: 3,
    initialDelayMs: 100,
    maxDelayMs: 5000
  },
  enableLogging: true,
  timeout: 30000
}

let clientConfig = { ...DEFAULT_CONFIG }

/**
 * Configure the API client
 * @param {Object} config - Configuration options
 *
 * @example
 * configureClient({
 *   enableRetry: true,
 *   retryConfig: { maxRetries: 5 }
 * })
 */
export function configureClient(config) {
  clientConfig = { ...clientConfig, ...config }
}

/**
 * Get current client configuration
 * @returns {Object} - Current configuration
 */
export function getClientConfig() {
  return { ...clientConfig }
}

/**
 * Request configuration builder
 * @typedef {Object} RequestConfig
 * @property {string} table - Table name
 * @property {string} operation - Operation type (select, insert, update, delete, upsert)
 * @property {Object} [filters] - Filtering criteria
 * @property {Object} [data] - Data for insert/update
 * @property {Object} [orderBy] - Ordering configuration
 * @property {Object} [pagination] - Pagination configuration
 * @property {Array<string>} [select] - Columns to select
 */

/**
 * Query builder for common operations
 */
class QueryBuilder {
  constructor(table) {
    this.table = table
    this.filters = {}
    this.orderBy = null
    this.pagination = { from: 0, to: null }
    this.selectedColumns = '*'
  }

  /**
   * Add filter condition
   * @param {string} column - Column name
   * @param {string} operator - Operator (eq, neq, gt, gte, lt, lte, in, contains)
   * @param {*} value - Filter value
   * @returns {QueryBuilder} - For chaining
   */
  filter(column, operator = 'eq', value) {
    this.filters[`${column}__${operator}`] = value
    return this
  }

  /**
   * Add ordering
   * @param {string} column - Column to order by
   * @param {string} direction - 'asc' or 'desc'
   * @returns {QueryBuilder} - For chaining
   */
  orderBy(column, direction = 'asc') {
    this.orderBy = { column, direction }
    return this
  }

  /**
   * Add pagination
   * @param {number} page - Page number (1-indexed)
   * @param {number} pageSize - Items per page
   * @returns {QueryBuilder} - For chaining
   */
  paginate(page = 1, pageSize = 10) {
    const from = (page - 1) * pageSize
    const to = from + pageSize - 1
    this.pagination = { from, to, pageSize, page }
    return this
  }

  /**
   * Select specific columns
   * @param {Array<string>|string} columns - Columns to select
   * @returns {QueryBuilder} - For chaining
   */
  select(columns) {
    this.selectedColumns = Array.isArray(columns) ? columns.join(',') : columns
    return this
  }

  /**
   * Build query configuration (returns config object for inspection)
   * @returns {RequestConfig}
   */
  build() {
    return {
      table: this.table,
      filters: this.filters,
      orderBy: this.orderBy,
      pagination: this.pagination,
      select: this.selectedColumns
    }
  }

  /**
   * Execute the query
   * @returns {Promise<Array>} - Query results
   */
  async execute() {
    const config = {
      table: this.table,
      operation: 'select',
      filters: this.filters,
      orderBy: this.orderBy,
      pagination: this.pagination,
      select: this.selectedColumns
    }
    return executeQuery(config)
  }
}

/**
 * Create a query builder
 * @param {string} table - Table name
 * @returns {QueryBuilder}
 *
 * @example
 * const data = await query('projects')
 *   .filter('status', 'eq', 'active')
 *   .orderBy('created_at', 'desc')
 *   .paginate(1, 20)
 *   .execute()
 */
export function query(table) {
  return new QueryBuilder(table)
}

/**
 * Execute SELECT query
 * @param {string|RequestConfig} tableOrConfig - Table name or request config
 * @param {Object} [options] - Additional options
 * @returns {Promise<Array|Object>} - Query results
 *
 * @example
 * // Simple select
 * const projects = await select('projects')
 *
 * // With filters
 * const activeProjects = await select('projects', {
 *   filters: { status: 'active' }
 * })
 *
 * // With pagination
 * const paginated = await select('projects', {
 *   filters: { status: 'active' },
 *   pagination: { from: 0, to: 9 }
 * })
 */
export async function select(tableOrConfig, options = {}) {
  const config = normalizeConfig(tableOrConfig, 'select', options)
  return executeQuery(config)
}

/**
 * Execute INSERT query
 * @param {string} table - Table name
 * @param {Object|Array<Object>} data - Data to insert
 * @param {Object} [options] - Additional options (e.g., { returning: true })
 * @returns {Promise<Object|Array>} - Inserted record(s)
 *
 * @example
 * const project = await insert('projects', {
 *   name: 'Solar Array Installation',
 *   customer_id: 'CUST-123',
 *   status: 'Planning'
 * })
 */
export async function insert(table, data, options = {}) {
  if (!data) {
    const error = handleError({ message: 'No data provided for insert' })
    throw error
  }

  const config = {
    table,
    operation: 'insert',
    data: Array.isArray(data) ? data : [data],
    ...options
  }

  return executeQuery(config)
}

/**
 * Execute UPDATE query
 * @param {string} table - Table name
 * @param {Object} updates - Fields to update
 * @param {Object} filters - WHERE conditions
 * @param {Object} [options] - Additional options
 * @returns {Promise<Array>} - Updated records
 *
 * @example
 * const updated = await update('projects',
 *   { status: 'In Progress' },
 *   { id: 'proj-123' }
 * )
 */
export async function update(table, updates, filters, options = {}) {
  if (!updates || Object.keys(updates).length === 0) {
    const error = handleError({ message: 'No updates provided' })
    throw error
  }

  if (!filters || Object.keys(filters).length === 0) {
    const error = handleError({ message: 'No filters provided for update' })
    throw error
  }

  const config = {
    table,
    operation: 'update',
    data: updates,
    filters,
    ...options
  }

  return executeQuery(config)
}

/**
 * Execute DELETE query
 * @param {string} table - Table name
 * @param {Object} filters - WHERE conditions
 * @param {Object} [options] - Additional options
 * @returns {Promise<void>}
 *
 * @example
 * await delete('projects', { id: 'proj-123' })
 */
export async function delete_(table, filters, options = {}) {
  if (!filters || Object.keys(filters).length === 0) {
    const error = handleError({ message: 'No filters provided for delete' })
    throw error
  }

  const config = {
    table,
    operation: 'delete',
    filters,
    ...options
  }

  return executeQuery(config)
}

/**
 * Execute UPSERT query (insert or update)
 * @param {string} table - Table name
 * @param {Object|Array<Object>} data - Data to upsert
 * @param {Array<string>} onConflict - Column names for conflict detection
 * @param {Object} [options] - Additional options
 * @returns {Promise<Object|Array>} - Upserted record(s)
 *
 * @example
 * const result = await upsert('projects',
 *   { id: 'proj-123', name: 'Updated Name' },
 *   ['id']
 * )
 */
export async function upsert(table, data, onConflict, options = {}) {
  if (!data) {
    const error = handleError({ message: 'No data provided for upsert' })
    throw error
  }

  if (!onConflict || onConflict.length === 0) {
    const error = handleError({
      message: 'No conflict columns specified for upsert'
    })
    throw error
  }

  const config = {
    table,
    operation: 'upsert',
    data: Array.isArray(data) ? data : [data],
    onConflict,
    ...options
  }

  return executeQuery(config)
}

/**
 * Execute a raw query
 * @param {string} query - SQL query
 * @param {Object} [variables] - Query parameters
 * @returns {Promise<*>} - Query results
 */
export async function raw(query, variables = {}) {
  const config = {
    operation: 'raw',
    query,
    variables
  }

  return executeQuery(config)
}

/**
 * Count records matching filters
 * @param {string} table - Table name
 * @param {Object} [filters] - Filter conditions
 * @returns {Promise<number>} - Record count
 *
 * @example
 * const count = await count('projects', { status: 'active' })
 */
export async function count(table, filters = {}) {
  const config = {
    table,
    operation: 'count',
    filters
  }

  return executeQuery(config)
}

/**
 * Check if record exists
 * @param {string} table - Table name
 * @param {Object} filters - Filter conditions
 * @returns {Promise<boolean>}
 *
 * @example
 * const exists = await exists('projects', { id: 'proj-123' })
 */
export async function exists(table, filters) {
  const config = {
    table,
    operation: 'exists',
    filters
  }

  return executeQuery(config)
}

/**
 * Normalize table or config argument
 * @private
 */
function normalizeConfig(tableOrConfig, operation, options) {
  if (typeof tableOrConfig === 'string') {
    return {
      table: tableOrConfig,
      operation,
      ...options
    }
  }

  return {
    operation,
    ...tableOrConfig,
    ...options
  }
}

/**
 * Execute a query with error handling and retry logic
 * @private
 */
async function executeQuery(config) {
  const startTime = performance.now()
  const context = {
    operation: config.operation,
    table: config.table,
    startTime
  }

  try {
    // Execute before-request interceptors
    const modifiedConfig = executeBeforeRequest(config)

    // Execute query with retry logic if enabled
    let result
    if (clientConfig.enableRetry) {
      result = await withRetry(
        () => executeOperation(modifiedConfig),
        clientConfig.retryConfig
      )
    } else {
      result = await executeOperation(modifiedConfig)
    }

    // Execute after-response interceptors
    const duration = performance.now() - startTime
    context.duration = duration
    const finalResult = executeAfterResponse(result, context)

    return finalResult
  } catch (error) {
    const duration = performance.now() - startTime
    context.duration = duration

    // Handle and transform error
    const standardError = handleError(error)
    const finalError = executeOnError(standardError, context)

    if (clientConfig.enableLogging) {
      console.error(`[API Error] ${context.operation}:`, finalError)
    }

    throw finalError
  }
}

/**
 * Execute the actual Supabase operation
 * @private
 */
async function executeOperation(config) {
  const { table, operation, data, filters, onConflict, select: columns } = config

  switch (operation) {
    case 'select': {
      let query = supabase.from(table).select(columns || '*')
      query = applyFilters(query, filters)
      if (config.orderBy) {
        const { column, direction } = config.orderBy
        query = query.order(column, { ascending: direction === 'asc' })
      }
      if (config.pagination) {
        const { from, to } = config.pagination
        query = query.range(from, to)
      }
      const { data: result, error } = await query
      if (error) throw error
      return result
    }

    case 'insert': {
      const { data: result, error } = await supabase
        .from(table)
        .insert(data)
        .select()
      if (error) throw error
      return result
    }

    case 'update': {
      let query = supabase.from(table).update(data)
      query = applyFilters(query, filters)
      const { data: result, error } = await query.select()
      if (error) throw error
      return result
    }

    case 'delete': {
      let query = supabase.from(table)
      query = applyFilters(query, filters)
      const { error } = await query.delete()
      if (error) throw error
      return null
    }

    case 'upsert': {
      const { data: result, error } = await supabase
        .from(table)
        .upsert(data, { onConflict: onConflict.join(',') })
        .select()
      if (error) throw error
      return result
    }

    case 'count': {
      let query = supabase.from(table).select('*', { count: 'exact', head: true })
      query = applyFilters(query, filters)
      const { count, error } = await query
      if (error) throw error
      return count || 0
    }

    case 'exists': {
      let query = supabase
        .from(table)
        .select('1', { count: 'exact', head: true })
      query = applyFilters(query, filters)
      const { count, error } = await query
      if (error) throw error
      return (count || 0) > 0
    }

    case 'raw': {
      // Note: Raw queries require RLS policies or service role
      return await supabase.rpc(config.query, config.variables)
    }

    default:
      throw handleError({ message: `Unknown operation: ${operation}` })
  }
}

/**
 * Apply filters to a Supabase query
 * @private
 */
function applyFilters(query, filters = {}) {
  if (!filters || typeof filters !== 'object') {
    return query
  }

  for (const [key, value] of Object.entries(filters)) {
    const [column, operator] = key.split('__')
    const op = operator || 'eq'

    switch (op) {
      case 'eq':
        query = query.eq(column, value)
        break
      case 'neq':
        query = query.neq(column, value)
        break
      case 'gt':
        query = query.gt(column, value)
        break
      case 'gte':
        query = query.gte(column, value)
        break
      case 'lt':
        query = query.lt(column, value)
        break
      case 'lte':
        query = query.lte(column, value)
        break
      case 'in':
        query = query.in(column, value)
        break
      case 'contains':
        query = query.contains(column, value)
        break
      case 'like':
        query = query.like(column, value)
        break
      case 'ilike':
        query = query.ilike(column, value)
        break
      case 'is':
        query = query.is(column, value)
        break
      default:
        console.warn(`Unknown filter operator: ${op}`)
    }
  }

  return query
}

/**
 * Get the raw Supabase client for advanced operations
 * @returns {Object} - Supabase client
 *
 * @example
 * const { data } = await getSupabaseClient()
 *   .from('projects')
 *   .select('*')
 */
export function getSupabaseClient() {
  return supabase
}

/**
 * API Client batch operations
 */
export const batch = {
  /**
   * Execute multiple operations in sequence
   * @param {Array<Function>} operations - Array of query functions
   * @returns {Promise<Array>} - Results of all operations
   */
  async sequence(operations) {
    const results = []
    for (const operation of operations) {
      results.push(await operation())
    }
    return results
  },

  /**
   * Execute multiple operations in parallel
   * @param {Array<Function>} operations - Array of query functions
   * @returns {Promise<Array>} - Results of all operations
   */
  async parallel(operations) {
    return Promise.all(operations.map(op => op()))
  }
}

// Export all error codes for use in applications
export { ERROR_CODES, handleError } from './errorHandler'

export default {
  configureClient,
  getClientConfig,
  query,
  select,
  insert,
  update,
  delete: delete_,
  upsert,
  count,
  exists,
  raw,
  getSupabaseClient,
  batch
}
