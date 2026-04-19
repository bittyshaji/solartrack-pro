/**
 * Storage Utilities
 * Wrapper functions for localStorage and sessionStorage with type safety
 *
 * Usage:
 *   import { storage } from '@/utils/storage'
 *   storage.set('key', { data: 'value' })
 *   const value = storage.get('key')
 */

/**
 * Create a storage wrapper with serialization
 * @param {Storage} storageImpl - localStorage or sessionStorage
 * @returns {Object} Storage wrapper with get/set/remove/clear methods
 */
function createStorageWrapper(storageImpl) {
  return {
    /**
     * Set item in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to store (will be JSON serialized)
     */
    set(key, value) {
      try {
        const serialized = JSON.stringify(value)
        storageImpl.setItem(key, serialized)
      } catch (error) {
        console.error(`Failed to set storage key "${key}":`, error)
      }
    },

    /**
     * Get item from storage
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found
     * @returns {any} Deserialized value or default
     */
    get(key, defaultValue = null) {
      try {
        const item = storageImpl.getItem(key)
        return item ? JSON.parse(item) : defaultValue
      } catch (error) {
        console.error(`Failed to get storage key "${key}":`, error)
        return defaultValue
      }
    },

    /**
     * Remove item from storage
     * @param {string} key - Storage key
     */
    remove(key) {
      try {
        storageImpl.removeItem(key)
      } catch (error) {
        console.error(`Failed to remove storage key "${key}":`, error)
      }
    },

    /**
     * Clear all items from storage
     */
    clear() {
      try {
        storageImpl.clear()
      } catch (error) {
        console.error('Failed to clear storage:', error)
      }
    },

    /**
     * Check if key exists in storage
     * @param {string} key - Storage key
     * @returns {boolean} Whether key exists
     */
    has(key) {
      try {
        return storageImpl.getItem(key) !== null
      } catch (error) {
        console.error(`Failed to check storage key "${key}":`, error)
        return false
      }
    },

    /**
     * Get all keys in storage
     * @returns {Array<string>} Array of keys
     */
    keys() {
      try {
        return Object.keys(storageImpl)
      } catch (error) {
        console.error('Failed to get storage keys:', error)
        return []
      }
    },

    /**
     * Get all items from storage as object
     * @returns {Object} Object with all storage items
     */
    getAll() {
      try {
        const items = {}
        for (let i = 0; i < storageImpl.length; i++) {
          const key = storageImpl.key(i)
          items[key] = this.get(key)
        }
        return items
      } catch (error) {
        console.error('Failed to get all storage items:', error)
        return {}
      }
    },

    /**
     * Get size of item in storage
     * @param {string} key - Storage key
     * @returns {number} Size in bytes
     */
    getSize(key) {
      try {
        const item = storageImpl.getItem(key)
        return item ? new Blob([item]).size : 0
      } catch (error) {
        console.error(`Failed to get storage key size "${key}":`, error)
        return 0
      }
    },

    /**
     * Get total storage size used
     * @returns {number} Total size in bytes
     */
    getTotalSize() {
      try {
        let total = 0
        for (let i = 0; i < storageImpl.length; i++) {
          const key = storageImpl.key(i)
          total += this.getSize(key)
        }
        return total
      } catch (error) {
        console.error('Failed to get total storage size:', error)
        return 0
      }
    },

    /**
     * Set item with expiration time
     * @param {string} key - Storage key
     * @param {any} value - Value to store
     * @param {number} ttlMs - Time to live in milliseconds
     */
    setWithExpiry(key, value, ttlMs) {
      try {
        const item = {
          value,
          expiry: Date.now() + ttlMs,
        }
        this.set(key, item)
      } catch (error) {
        console.error(`Failed to set storage key with expiry "${key}":`, error)
      }
    },

    /**
     * Get item with expiration checking
     * @param {string} key - Storage key
     * @param {any} defaultValue - Default value if not found or expired
     * @returns {any} Deserialized value or default
     */
    getWithExpiry(key, defaultValue = null) {
      try {
        const item = this.get(key)
        if (!item || !item.expiry) {
          return item ?? defaultValue
        }

        if (Date.now() > item.expiry) {
          this.remove(key)
          return defaultValue
        }

        return item.value ?? defaultValue
      } catch (error) {
        console.error(`Failed to get storage key with expiry "${key}":`, error)
        return defaultValue
      }
    },

    /**
     * Increment numeric value in storage
     * @param {string} key - Storage key
     * @param {number} amount - Amount to increment
     * @returns {number} New value
     */
    increment(key, amount = 1) {
      try {
        const current = this.get(key, 0)
        const newValue = (current || 0) + amount
        this.set(key, newValue)
        return newValue
      } catch (error) {
        console.error(`Failed to increment storage key "${key}":`, error)
        return 0
      }
    },

    /**
     * Decrement numeric value in storage
     * @param {string} key - Storage key
     * @param {number} amount - Amount to decrement
     * @returns {number} New value
     */
    decrement(key, amount = 1) {
      return this.increment(key, -amount)
    },

    /**
     * Append value to array in storage
     * @param {string} key - Storage key
     * @param {any} value - Value to append
     */
    append(key, value) {
      try {
        const current = this.get(key, [])
        const arr = Array.isArray(current) ? current : []
        arr.push(value)
        this.set(key, arr)
      } catch (error) {
        console.error(`Failed to append to storage key "${key}":`, error)
      }
    },

    /**
     * Merge object in storage
     * @param {string} key - Storage key
     * @param {Object} obj - Object to merge
     */
    merge(key, obj) {
      try {
        const current = this.get(key, {})
        const merged = { ...current, ...obj }
        this.set(key, merged)
      } catch (error) {
        console.error(`Failed to merge storage key "${key}":`, error)
      }
    },
  }
}

// Create instances for localStorage and sessionStorage
export const localStorage = createStorageWrapper(globalThis.localStorage)
export const sessionStorage = createStorageWrapper(globalThis.sessionStorage)

/**
 * Default storage instance (localStorage)
 */
export const storage = localStorage

/**
 * Get storage implementation
 * @param {string} type - 'local' or 'session'
 * @returns {Object} Storage wrapper
 */
export function getStorage(type = 'local') {
  return type === 'session' ? sessionStorage : localStorage
}

/**
 * Memory-based storage for testing or when localStorage is unavailable
 */
function createMemoryStorage() {
  const data = {}
  return createStorageWrapper({
    getItem: (key) => data[key] ?? null,
    setItem: (key, value) => {
      data[key] = value
    },
    removeItem: (key) => {
      delete data[key]
    },
    clear: () => {
      Object.keys(data).forEach(key => delete data[key])
    },
    key: (index) => Object.keys(data)[index] ?? null,
    get length() {
      return Object.keys(data).length
    },
  })
}

export const memoryStorage = createMemoryStorage()

/**
 * Safe storage - fallback to memory storage if localStorage is unavailable
 */
export const safeStorage = (() => {
  try {
    // Test if localStorage is available
    const test = '__storage_test__'
    localStorage.set(test, true)
    localStorage.remove(test)
    return localStorage
  } catch {
    console.warn('localStorage not available, using memory storage')
    return memoryStorage
  }
})()
