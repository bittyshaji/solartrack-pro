/**
 * Common Utilities
 * General-purpose utility functions used across the application
 *
 * Usage:
 *   import { debounce, throttle, deepClone } from '@/utils/common'
 */

/**
 * Debounce function - delays execution until after the specified time
 * @param {Function} func - Function to debounce
 * @param {number} delay - Delay in milliseconds
 * @returns {Function} Debounced function
 */
export function debounce(func, delay) {
  let timeoutId
  return function debounced(...args) {
    clearTimeout(timeoutId)
    timeoutId = setTimeout(() => func.apply(this, args), delay)
  }
}

/**
 * Throttle function - limits execution to once per specified time period
 * @param {Function} func - Function to throttle
 * @param {number} limit - Time limit in milliseconds
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
  let inThrottle
  return function throttled(...args) {
    if (!inThrottle) {
      func.apply(this, args)
      inThrottle = true
      setTimeout(() => (inThrottle = false), limit)
    }
  }
}

/**
 * Deep clone an object
 * @param {any} obj - Object to clone
 * @returns {any} Cloned object
 */
export function deepClone(obj) {
  if (obj === null || typeof obj !== 'object') return obj
  if (obj instanceof Date) return new Date(obj.getTime())
  if (obj instanceof Array) return obj.map(item => deepClone(item))
  if (obj instanceof Object) {
    const cloned = {}
    for (const key in obj) {
      if (obj.hasOwnProperty(key)) {
        cloned[key] = deepClone(obj[key])
      }
    }
    return cloned
  }
}

/**
 * Deep merge objects
 * @param {Object} target - Target object
 * @param {Object} source - Source object
 * @returns {Object} Merged object
 */
export function deepMerge(target, source) {
  const output = deepClone(target)
  if (isObject(target) && isObject(source)) {
    Object.keys(source).forEach(key => {
      if (isObject(source[key])) {
        if (!(key in target)) {
          Object.assign(output, { [key]: source[key] })
        } else {
          output[key] = deepMerge(target[key], source[key])
        }
      } else {
        Object.assign(output, { [key]: source[key] })
      }
    })
  }
  return output
}

/**
 * Check if value is a plain object
 * @param {any} obj - Value to check
 * @returns {boolean} Whether value is a plain object
 */
export function isObject(obj) {
  return obj !== null && typeof obj === 'object' && obj.constructor === Object
}

/**
 * Check if value is empty
 * @param {any} value - Value to check
 * @returns {boolean} Whether value is empty
 */
export function isEmpty(value) {
  if (value === null || value === undefined) return true
  if (typeof value === 'string') return value.trim() === ''
  if (Array.isArray(value)) return value.length === 0
  if (typeof value === 'object') return Object.keys(value).length === 0
  return false
}

/**
 * Group array items by a property
 * @param {Array} arr - Array to group
 * @param {string|Function} key - Property name or function to group by
 * @returns {Object} Grouped object
 */
export function groupBy(arr, key) {
  return arr.reduce((acc, item) => {
    const groupKey = typeof key === 'function' ? key(item) : item[key]
    if (!acc[groupKey]) {
      acc[groupKey] = []
    }
    acc[groupKey].push(item)
    return acc
  }, {})
}

/**
 * Flatten nested array
 * @param {Array} arr - Array to flatten
 * @param {number} depth - Depth to flatten
 * @returns {Array} Flattened array
 */
export function flatten(arr, depth = Infinity) {
  return arr.reduce((flat, item) => {
    if (Array.isArray(item) && depth > 0) {
      return flat.concat(flatten(item, depth - 1))
    }
    return flat.concat(item)
  }, [])
}

/**
 * Unique array items
 * @param {Array} arr - Array to deduplicate
 * @param {string|Function} key - Property name or function to determine uniqueness
 * @returns {Array} Array with unique items
 */
export function unique(arr, key = null) {
  if (!key) return [...new Set(arr)]

  const seen = new Set()
  return arr.filter(item => {
    const value = typeof key === 'function' ? key(item) : item[key]
    if (seen.has(value)) return false
    seen.add(value)
    return true
  })
}

/**
 * Generate a unique ID
 * @returns {string} Unique ID
 */
export function generateId() {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
}

/**
 * Retry a function with exponential backoff
 * @param {Function} fn - Function to retry
 * @param {Object} options - Configuration options
 * @returns {Promise} Promise that resolves when function succeeds
 */
export async function retry(fn, options = {}) {
  const {
    maxAttempts = 3,
    initialDelay = 1000,
    backoffMultiplier = 2,
    maxDelay = 30000,
  } = options

  let lastError
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      return await fn()
    } catch (error) {
      lastError = error
      if (attempt < maxAttempts - 1) {
        const delay = Math.min(
          initialDelay * Math.pow(backoffMultiplier, attempt),
          maxDelay
        )
        await new Promise(resolve => setTimeout(resolve, delay))
      }
    }
  }
  throw lastError
}

/**
 * Wait for a specified time
 * @param {number} ms - Milliseconds to wait
 * @returns {Promise} Promise that resolves after delay
 */
export function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * Execute promise with timeout
 * @param {Promise} promise - Promise to execute
 * @param {number} ms - Timeout in milliseconds
 * @returns {Promise} Promise that rejects on timeout
 */
export function withTimeout(promise, ms) {
  return Promise.race([
    promise,
    new Promise((_, reject) =>
      setTimeout(() => reject(new Error('Operation timeout')), ms)
    ),
  ])
}

/**
 * Pick specific properties from an object
 * @param {Object} obj - Object to pick from
 * @param {Array<string>} keys - Keys to pick
 * @returns {Object} New object with picked properties
 */
export function pick(obj, keys) {
  return keys.reduce((result, key) => {
    if (key in obj) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

/**
 * Omit specific properties from an object
 * @param {Object} obj - Object to omit from
 * @param {Array<string>} keys - Keys to omit
 * @returns {Object} New object without omitted properties
 */
export function omit(obj, keys) {
  return Object.keys(obj).reduce((result, key) => {
    if (!keys.includes(key)) {
      result[key] = obj[key]
    }
    return result
  }, {})
}

/**
 * Get nested value from object safely
 * @param {Object} obj - Object to get from
 * @param {string} path - Dot notation path (e.g., 'user.profile.name')
 * @param {any} defaultValue - Default value if path not found
 * @returns {any} Value at path or default
 */
export function getIn(obj, path, defaultValue = undefined) {
  const keys = path.split('.')
  let result = obj
  for (const key of keys) {
    if (result && typeof result === 'object' && key in result) {
      result = result[key]
    } else {
      return defaultValue
    }
  }
  return result
}

/**
 * Set nested value in object safely
 * @param {Object} obj - Object to set value in
 * @param {string} path - Dot notation path
 * @param {any} value - Value to set
 * @returns {Object} New object with value set
 */
export function setIn(obj, path, value) {
  const keys = path.split('.')
  const newObj = deepClone(obj)
  let current = newObj
  for (let i = 0; i < keys.length - 1; i++) {
    const key = keys[i]
    if (!(key in current) || typeof current[key] !== 'object') {
      current[key] = {}
    }
    current = current[key]
  }
  current[keys[keys.length - 1]] = value
  return newObj
}

/**
 * Convert array of objects to map
 * @param {Array} arr - Array to convert
 * @param {string|Function} keyFn - Function to get key
 * @returns {Map} Map of items
 */
export function toMap(arr, keyFn) {
  const map = new Map()
  arr.forEach(item => {
    const key = typeof keyFn === 'function' ? keyFn(item) : item[keyFn]
    map.set(key, item)
  })
  return map
}

/**
 * Convert map to array of objects
 * @param {Map} map - Map to convert
 * @returns {Array} Array of items
 */
export function fromMap(map) {
  return Array.from(map.values())
}

/**
 * Compose multiple functions
 * @param {...Function} fns - Functions to compose
 * @returns {Function} Composed function
 */
export function compose(...fns) {
  return (value) =>
    fns.reduceRight((acc, fn) => fn(acc), value)
}

/**
 * Pipe multiple functions (opposite of compose)
 * @param {...Function} fns - Functions to pipe
 * @returns {Function} Piped function
 */
export function pipe(...fns) {
  return (value) =>
    fns.reduce((acc, fn) => fn(acc), value)
}

/**
 * Memoize function results
 * @param {Function} fn - Function to memoize
 * @returns {Function} Memoized function
 */
export function memoize(fn) {
  const cache = new Map()
  return function memoized(...args) {
    const key = JSON.stringify(args)
    if (cache.has(key)) {
      return cache.get(key)
    }
    const result = fn.apply(this, args)
    cache.set(key, result)
    return result
  }
}

/**
 * Swap object keys and values
 * @param {Object} obj - Object to swap
 * @returns {Object} Swapped object
 */
export function swapKeysValues(obj) {
  return Object.entries(obj).reduce((acc, [key, value]) => {
    acc[value] = key
    return acc
  }, {})
}
