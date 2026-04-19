/**
 * Request/Response Interceptors
 * Provides hooks for logging, validation, and error transformation
 */

/**
 * Interceptor callback types
 * @typedef {Object} InterceptorCallbacks
 * @property {Function} [beforeRequest] - Called before request (receives config)
 * @property {Function} [afterResponse] - Called after successful response (receives data)
 * @property {Function} [onError] - Called on error (receives error)
 */

/**
 * Default interceptor configuration
 */
const interceptors = {
  beforeRequest: [],
  afterResponse: [],
  onError: []
}

/**
 * Register a before-request interceptor
 * @param {Function} callback - Called with request config before execution
 * @returns {Function} - Unregister function
 *
 * @example
 * addBeforeRequestInterceptor((config) => {
 *   console.log('Making request:', config.operation, config.table)
 *   return config
 * })
 */
export function addBeforeRequestInterceptor(callback) {
  interceptors.beforeRequest.push(callback)
  return () => {
    interceptors.beforeRequest = interceptors.beforeRequest.filter(cb => cb !== callback)
  }
}

/**
 * Register an after-response interceptor
 * @param {Function} callback - Called with response data after successful execution
 * @returns {Function} - Unregister function
 *
 * @example
 * addAfterResponseInterceptor((data) => {
 *   console.log('Response received:', data)
 *   return data
 * })
 */
export function addAfterResponseInterceptor(callback) {
  interceptors.afterResponse.push(callback)
  return () => {
    interceptors.afterResponse = interceptors.afterResponse.filter(cb => cb !== callback)
  }
}

/**
 * Register an error interceptor
 * @param {Function} callback - Called with error after failure
 * @returns {Function} - Unregister function
 *
 * @example
 * addErrorInterceptor((error) => {
 *   console.error('Error occurred:', error.code, error.message)
 *   return error
 * })
 */
export function addErrorInterceptor(callback) {
  interceptors.onError.push(callback)
  return () => {
    interceptors.onError = interceptors.onError.filter(cb => cb !== callback)
  }
}

/**
 * Execute before-request interceptors
 * @param {Object} config - Request configuration
 * @returns {Object} - Modified configuration
 */
export function executeBeforeRequest(config) {
  let modifiedConfig = { ...config }

  for (const interceptor of interceptors.beforeRequest) {
    try {
      modifiedConfig = interceptor(modifiedConfig) || modifiedConfig
    } catch (error) {
      console.error('Error in before-request interceptor:', error)
    }
  }

  return modifiedConfig
}

/**
 * Execute after-response interceptors
 * @param {*} data - Response data
 * @param {Object} context - Context object with metadata
 * @returns {*} - Modified data
 */
export function executeAfterResponse(data, context) {
  let modifiedData = data

  for (const interceptor of interceptors.afterResponse) {
    try {
      modifiedData = interceptor(modifiedData, context) || modifiedData
    } catch (error) {
      console.error('Error in after-response interceptor:', error)
    }
  }

  return modifiedData
}

/**
 * Execute error interceptors
 * @param {Object} error - Error object
 * @param {Object} context - Context object with metadata
 * @returns {Object} - Modified error
 */
export function executeOnError(error, context) {
  let modifiedError = error

  for (const interceptor of interceptors.onError) {
    try {
      modifiedError = interceptor(modifiedError, context) || modifiedError
    } catch (err) {
      console.error('Error in error interceptor:', err)
    }
  }

  return modifiedError
}

/**
 * Clear all interceptors
 */
export function clearAllInterceptors() {
  interceptors.beforeRequest = []
  interceptors.afterResponse = []
  interceptors.onError = []
}

/**
 * Create a default logging interceptor set
 * @param {boolean} verbose - Enable verbose logging (default: false)
 * @returns {Object} - Object with unregister functions
 *
 * @example
 * const { unregisterAll } = createLoggingInterceptors(true)
 */
export function createLoggingInterceptors(verbose = false) {
  const unregisterBefore = addBeforeRequestInterceptor((config) => {
    const message = `[API] ${config.operation.toUpperCase()} ${config.table}`
    if (verbose) {
      console.log(message, config)
    } else {
      console.log(message)
    }
    return config
  })

  const unregisterAfter = addAfterResponseInterceptor((data, context) => {
    if (verbose) {
      console.log(`[API] Response (${context.duration}ms):`, data)
    }
    return data
  })

  const unregisterError = addErrorInterceptor((error, context) => {
    console.error(`[API] Error in ${context.operation}:`, error.code, error.message)
    return error
  })

  return {
    unregisterAll: () => {
      unregisterBefore()
      unregisterAfter()
      unregisterError()
    }
  }
}

/**
 * Create a validation interceptor
 * Validates inputs before requests
 * @returns {Function} - Unregister function
 *
 * @example
 * const unregister = createValidationInterceptor()
 */
export function createValidationInterceptor() {
  return addBeforeRequestInterceptor((config) => {
    // Validate table name
    if (!config.table || typeof config.table !== 'string') {
      throw new Error('Invalid table name')
    }

    // Validate operation
    const validOps = ['select', 'insert', 'update', 'delete', 'upsert']
    if (!validOps.includes(config.operation)) {
      throw new Error(`Invalid operation: ${config.operation}`)
    }

    return config
  })
}

export default {
  addBeforeRequestInterceptor,
  addAfterResponseInterceptor,
  addErrorInterceptor,
  executeBeforeRequest,
  executeAfterResponse,
  executeOnError,
  clearAllInterceptors,
  createLoggingInterceptors,
  createValidationInterceptor
}
