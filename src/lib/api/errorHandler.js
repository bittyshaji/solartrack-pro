/**
 * Standardized Error Handler
 * Converts Supabase and network errors to a consistent format
 */

/**
 * Standard error response format
 * @typedef {Object} StandardError
 * @property {string} code - Error code (e.g., 'AUTH_ERROR', 'NETWORK_ERROR', 'VALIDATION_ERROR')
 * @property {string} message - User-friendly error message
 * @property {string} [details] - Technical details for debugging
 * @property {Object} [originalError] - Original error object (only in development)
 */

/**
 * Error code constants
 */
export const ERROR_CODES = {
  // Authentication errors
  AUTH_ERROR: 'AUTH_ERROR',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',

  // Validation errors
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  MISSING_REQUIRED_FIELD: 'MISSING_REQUIRED_FIELD',
  INVALID_INPUT: 'INVALID_INPUT',

  // Network errors
  NETWORK_ERROR: 'NETWORK_ERROR',
  TIMEOUT_ERROR: 'TIMEOUT_ERROR',
  CONNECTION_ERROR: 'CONNECTION_ERROR',

  // Database errors
  DATABASE_ERROR: 'DATABASE_ERROR',
  DUPLICATE_KEY: 'DUPLICATE_KEY',
  RECORD_NOT_FOUND: 'RECORD_NOT_FOUND',
  FOREIGN_KEY_VIOLATION: 'FOREIGN_KEY_VIOLATION',

  // Server errors
  INTERNAL_SERVER_ERROR: 'INTERNAL_SERVER_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',

  // Generic errors
  UNKNOWN_ERROR: 'UNKNOWN_ERROR'
}

/**
 * Classify and standardize errors
 * @param {Error|Object} error - Error object or API response error
 * @returns {StandardError} - Standardized error object
 */
export function handleError(error) {
  if (!error) {
    return createError(ERROR_CODES.UNKNOWN_ERROR, 'An unknown error occurred')
  }

  // Handle Supabase-specific errors
  if (error.code) {
    return handleSupabaseError(error)
  }

  // Handle network errors
  if (error.message) {
    const message = error.message.toLowerCase()

    if (message.includes('network') || message.includes('fetch')) {
      return handleNetworkError(error)
    }

    if (message.includes('timeout')) {
      return createError(
        ERROR_CODES.TIMEOUT_ERROR,
        'Request took too long to complete. Please try again.',
        error.message
      )
    }

    if (message.includes('unauthorized') || message.includes('401')) {
      return createError(
        ERROR_CODES.UNAUTHORIZED,
        'You are not authorized to perform this action.',
        error.message
      )
    }

    if (message.includes('forbidden') || message.includes('403')) {
      return createError(
        ERROR_CODES.FORBIDDEN,
        'You do not have permission to perform this action.',
        error.message
      )
    }
  }

  // Handle HTTP errors
  if (error.status) {
    return handleHttpError(error)
  }

  // Generic error
  return createError(
    ERROR_CODES.UNKNOWN_ERROR,
    error.message || 'An unexpected error occurred',
    JSON.stringify(error)
  )
}

/**
 * Handle Supabase-specific errors
 * @param {Object} error - Supabase error object
 * @returns {StandardError}
 */
function handleSupabaseError(error) {
  const code = error.code || ''
  const message = error.message || ''

  // Authentication errors
  if (code === 'PGRST301' || message.includes('JWT')) {
    return createError(
      ERROR_CODES.AUTH_ERROR,
      'Authentication failed. Please log in again.',
      message
    )
  }

  // Duplicate key error
  if (code === '23505' || code === 'PGRST103' || message.includes('duplicate')) {
    return createError(
      ERROR_CODES.DUPLICATE_KEY,
      'This record already exists. Please use a different value.',
      message
    )
  }

  // Foreign key violation
  if (code === '23503' || message.includes('foreign key')) {
    return createError(
      ERROR_CODES.FOREIGN_KEY_VIOLATION,
      'This action violates a relationship constraint. Please check dependent records.',
      message
    )
  }

  // Record not found
  if (code === 'PGRST116' || message.includes('not found')) {
    return createError(
      ERROR_CODES.RECORD_NOT_FOUND,
      'The requested record was not found.',
      message
    )
  }

  // Validation errors
  if (message.includes('violates') || message.includes('constraint')) {
    return createError(
      ERROR_CODES.VALIDATION_ERROR,
      'The provided data does not meet validation requirements.',
      message
    )
  }

  // Generic database error
  return createError(
    ERROR_CODES.DATABASE_ERROR,
    'A database error occurred. Please try again.',
    message
  )
}

/**
 * Handle network errors
 * @param {Error} error - Network error
 * @returns {StandardError}
 */
function handleNetworkError(error) {
  const message = error.message || ''

  if (message.includes('offline') || message.includes('network')) {
    return createError(
      ERROR_CODES.NETWORK_ERROR,
      'Network connection failed. Please check your internet connection.',
      message
    )
  }

  if (message.includes('refused')) {
    return createError(
      ERROR_CODES.CONNECTION_ERROR,
      'Unable to connect to the server. Please try again later.',
      message
    )
  }

  return createError(
    ERROR_CODES.NETWORK_ERROR,
    'A network error occurred. Please check your connection.',
    message
  )
}

/**
 * Handle HTTP status code errors
 * @param {Object} error - Error with status property
 * @returns {StandardError}
 */
function handleHttpError(error) {
  const status = error.status
  const message = error.message || ''

  switch (status) {
    case 400:
      return createError(ERROR_CODES.VALIDATION_ERROR, 'Invalid request data.', message)
    case 401:
      return createError(ERROR_CODES.UNAUTHORIZED, 'Authentication required.', message)
    case 403:
      return createError(ERROR_CODES.FORBIDDEN, 'Access denied.', message)
    case 404:
      return createError(ERROR_CODES.RECORD_NOT_FOUND, 'Resource not found.', message)
    case 429:
      return createError(
        ERROR_CODES.TIMEOUT_ERROR,
        'Too many requests. Please wait a moment and try again.',
        message
      )
    case 500:
      return createError(
        ERROR_CODES.INTERNAL_SERVER_ERROR,
        'Server error. Please try again later.',
        message
      )
    case 502:
      return createError(ERROR_CODES.BAD_GATEWAY, 'Gateway error. Please try again.', message)
    case 503:
      return createError(
        ERROR_CODES.SERVICE_UNAVAILABLE,
        'Service is temporarily unavailable. Please try again later.',
        message
      )
    default:
      return createError(ERROR_CODES.UNKNOWN_ERROR, 'An error occurred.', message)
  }
}

/**
 * Create a standardized error object
 * @param {string} code - Error code
 * @param {string} message - User-friendly message
 * @param {string} [details] - Technical details
 * @returns {StandardError}
 */
function createError(code, message, details = null) {
  const error = {
    code,
    message
  }

  if (details) {
    error.details = details
  }

  // Include original error in development
  if (import.meta.env.DEV) {
    error._dev_message = details || 'Check details property'
  }

  return error
}

/**
 * Check if an error is of a specific type
 * @param {StandardError} error - Standardized error object
 * @param {string} code - Error code to check
 * @returns {boolean}
 */
export function isErrorType(error, code) {
  return error && error.code === code
}

/**
 * Create a validation error for missing required fields
 * @param {string[]} fields - Array of missing field names
 * @returns {StandardError}
 */
export function createValidationError(fields) {
  return createError(
    ERROR_CODES.VALIDATION_ERROR,
    `Missing required fields: ${fields.join(', ')}`,
    `Required fields: ${fields.join(', ')}`
  )
}

/**
 * Create a validation error for invalid input
 * @param {string} fieldName - Name of the invalid field
 * @param {string} reason - Reason why it's invalid
 * @returns {StandardError}
 */
export function createInvalidInputError(fieldName, reason) {
  return createError(
    ERROR_CODES.INVALID_INPUT,
    `Invalid value for ${fieldName}: ${reason}`,
    `Field: ${fieldName}, Reason: ${reason}`
  )
}

export default handleError
