/**
 * Retry Logic with Exponential Backoff
 * Provides configurable retry behavior with jitter for distributed systems
 */

/**
 * Exponential backoff retry strategy
 * @typedef {Object} RetryConfig
 * @property {number} maxRetries - Maximum number of retry attempts (default: 3)
 * @property {number} initialDelayMs - Initial delay in milliseconds (default: 100)
 * @property {number} maxDelayMs - Maximum delay in milliseconds (default: 10000)
 * @property {number} backoffMultiplier - Multiplier for exponential growth (default: 2)
 * @property {boolean} useJitter - Add randomized jitter (default: true)
 * @property {Function} shouldRetry - Predicate to determine if error should trigger retry (default: retryable errors)
 */

const DEFAULT_CONFIG = {
  maxRetries: 3,
  initialDelayMs: 100,
  maxDelayMs: 10000,
  backoffMultiplier: 2,
  useJitter: true,
  shouldRetry: isRetryableError
}

/**
 * Determine if an error is retryable
 * @param {Error} error - The error to check
 * @returns {boolean} - Whether the error is retryable
 */
function isRetryableError(error) {
  if (!error) return false

  const message = (error.message || '').toLowerCase()
  const status = error.status

  // Network errors
  if (error.code === 'ECONNREFUSED' || error.code === 'ECONNRESET' || error.code === 'ETIMEDOUT') {
    return true
  }

  // HTTP status codes that are retryable
  if (status === 408 || status === 429 || status === 500 || status === 502 || status === 503 || status === 504) {
    return true
  }

  // Supabase-specific retryable errors
  if (message.includes('connection') || message.includes('timeout') || message.includes('temporarily')) {
    return true
  }

  return false
}

/**
 * Calculate delay with exponential backoff and optional jitter
 * @param {number} attempt - Current attempt number (0-indexed)
 * @param {Object} config - Retry configuration
 * @returns {number} - Delay in milliseconds
 */
function calculateDelay(attempt, config) {
  const exponentialDelay = config.initialDelayMs * Math.pow(config.backoffMultiplier, attempt)
  const cappedDelay = Math.min(exponentialDelay, config.maxDelayMs)

  if (!config.useJitter) {
    return cappedDelay
  }

  // Add jitter: random value between 0 and cappedDelay
  return Math.random() * cappedDelay
}

/**
 * Sleep for a specified duration
 * @param {number} ms - Milliseconds to sleep
 * @returns {Promise<void>}
 */
function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Async function to retry
 * @param {RetryConfig} customConfig - Configuration overrides
 * @returns {Promise<*>} - Result of the function
 * @throws {Error} - Throws the last error after all retries are exhausted
 *
 * @example
 * const data = await withRetry(
 *   () => supabase.from('projects').select('*'),
 *   { maxRetries: 5 }
 * )
 */
export async function withRetry(fn, customConfig = {}) {
  const config = { ...DEFAULT_CONFIG, ...customConfig }
  let lastError

  for (let attempt = 0; attempt <= config.maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error

      // Check if we should retry
      if (!config.shouldRetry(error)) {
        throw error
      }

      // Check if we've exhausted retries
      if (attempt === config.maxRetries) {
        throw error
      }

      // Calculate delay and sleep
      const delay = calculateDelay(attempt, config)
      await sleep(delay)
    }
  }

  throw lastError
}

/**
 * Retry builder for creating configured retry handlers
 * @param {RetryConfig} config - Retry configuration
 * @returns {Function} - Preconfigured retry function
 *
 * @example
 * const apiRetry = createRetryHandler({ maxRetries: 5, maxDelayMs: 5000 })
 * const result = await apiRetry(() => someAsyncOperation())
 */
export function createRetryHandler(config = {}) {
  return (fn) => withRetry(fn, config)
}

export default withRetry
