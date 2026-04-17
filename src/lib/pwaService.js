/**
 * PWA Service Module
 * Handles service worker registration, offline detection, and PWA features
 */

/**
 * Register Service Worker
 */
export async function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) {
    console.log('⚠️ Service Workers not supported')
    return null
  }

  try {
    const registration = await navigator.serviceWorker.register('/serviceWorker.js', {
      scope: '/',
    })

    console.log('✅ Service Worker registered successfully')

    // Listen for updates
    registration.addEventListener('updatefound', () => {
      const newWorker = registration.installing
      newWorker.addEventListener('statechange', () => {
        if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
          console.log('📢 New service worker available - triggering update')
          notifyUpdateAvailable(registration)
        }
      })
    })

    return registration
  } catch (error) {
    console.error('❌ Service Worker registration failed:', error)
    return null
  }
}

/**
 * Notify user that app update is available
 */
function notifyUpdateAvailable(registration) {
  if ('Notification' in window && Notification.permission === 'granted') {
    new Notification('SolarTrack Pro Updated', {
      body: 'A new version is available. Refresh to update.',
      icon: '/icons/icon-192x192.png',
    })
  }

  // Also send message to app
  if (navigator.serviceWorker.controller) {
    navigator.serviceWorker.controller.postMessage({
      type: 'SKIP_WAITING',
    })
  }
}

/**
 * Check if device is online
 */
export function isOnline() {
  return navigator.onLine
}

/**
 * Listen for online/offline changes
 */
export function subscribeToOnlineStatus(callback) {
  const handleOnline = () => callback(true)
  const handleOffline = () => callback(false)

  window.addEventListener('online', handleOnline)
  window.addEventListener('offline', handleOffline)

  // Return unsubscribe function
  return () => {
    window.removeEventListener('online', handleOnline)
    window.removeEventListener('offline', handleOffline)
  }
}

/**
 * Request notification permission
 */
export async function requestNotificationPermission() {
  if (!('Notification' in window)) {
    console.log('⚠️ Notifications not supported')
    return false
  }

  if (Notification.permission === 'granted') {
    return true
  }

  if (Notification.permission !== 'denied') {
    const permission = await Notification.requestPermission()
    return permission === 'granted'
  }

  return false
}

/**
 * Show notification
 */
export function showNotification(title, options = {}) {
  if ('Notification' in window && Notification.permission === 'granted') {
    return new Notification(title, {
      icon: '/icons/icon-192x192.png',
      badge: '/icons/icon-96x96.png',
      ...options,
    })
  }
}

/**
 * Queue action for background sync
 * Stores the action in IndexedDB for syncing when online
 */
export async function queueAction(action) {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.controller?.postMessage({
      type: 'QUEUE_SYNC',
      payload: action,
    })

    // Also store locally for manual retry
    const db = await openOfflineDB()
    if (db) {
      const now = new Date()
      const queuedAction = {
        id: `${action.type}-${now.getTime()}`,
        ...action,
        timestamp: now.toISOString(),
      }

      if (db.add) {
        await db.add('syncQueue', queuedAction)
      } else {
        // Fallback to localStorage
        const queue = JSON.parse(localStorage.getItem('solartrack_sync_queue') || '[]')
        queue.push(queuedAction)
        localStorage.setItem('solartrack_sync_queue', JSON.stringify(queue))
      }

      console.log('✅ Action queued for sync:', queuedAction)
    }
  }
}

/**
 * Open IndexedDB for offline storage
 */
export function openOfflineDB() {
  return new Promise((resolve, reject) => {
    if (!('indexedDB' in window)) {
      console.warn('⚠️ IndexedDB not supported')
      resolve(null)
      return
    }

    const request = indexedDB.open('SolarTrackOffline', 1)

    request.onerror = () => {
      console.error('Failed to open IndexedDB:', request.error)
      resolve(null)
    }

    request.onsuccess = () => {
      const db = request.result
      resolve({
        add: (storeName, data) => {
          const transaction = db.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          return store.add(data)
        },
        get: (storeName, key) => {
          const transaction = db.transaction([storeName], 'readonly')
          const store = transaction.objectStore(storeName)
          return store.get(key)
        },
        getAll: (storeName) => {
          const transaction = db.transaction([storeName], 'readonly')
          const store = transaction.objectStore(storeName)
          return store.getAll()
        },
        delete: (storeName, key) => {
          const transaction = db.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          return store.delete(key)
        },
        clear: (storeName) => {
          const transaction = db.transaction([storeName], 'readwrite')
          const store = transaction.objectStore(storeName)
          return store.clear()
        },
      })
    }

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      if (!db.objectStoreNames.contains('syncQueue')) {
        db.createObjectStore('syncQueue', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('offlinePhotos')) {
        db.createObjectStore('offlinePhotos', { keyPath: 'id' })
      }

      if (!db.objectStoreNames.contains('offlineData')) {
        db.createObjectStore('offlineData', { keyPath: 'key' })
      }
    }
  })
}

/**
 * Store data for offline access
 */
export async function storeOfflineData(key, data) {
  const db = await openOfflineDB()
  if (db) {
    return db.add('offlineData', { key, data, timestamp: Date.now() })
  }

  // Fallback to localStorage
  localStorage.setItem(`solartrack_offline_${key}`, JSON.stringify(data))
  return Promise.resolve()
}

/**
 * Retrieve offline data
 */
export async function getOfflineData(key) {
  const db = await openOfflineDB()
  if (db) {
    const result = await db.get('offlineData', key)
    return result ? result.data : null
  }

  // Fallback to localStorage
  const data = localStorage.getItem(`solartrack_offline_${key}`)
  return data ? JSON.parse(data) : null
}

/**
 * Clear all offline data
 */
export async function clearOfflineData() {
  const db = await openOfflineDB()
  if (db) {
    await db.clear('offlineData')
    await db.clear('syncQueue')
    await db.clear('offlinePhotos')
  }

  // Clear localStorage
  Object.keys(localStorage).forEach(key => {
    if (key.startsWith('solartrack_offline_')) {
      localStorage.removeItem(key)
    }
  })
}

/**
 * Check if app can be installed as PWA
 */
export function canInstallPWA() {
  return (
    'serviceWorker' in navigator &&
    'PushManager' in window &&
    'Notification' in window &&
    'localStorage' in window
  )
}

/**
 * Initialize PWA features
 */
export async function initializePWA() {
  console.log('🚀 Initializing PWA features...')

  // Register service worker
  const swRegistration = await registerServiceWorker()

  // Request notification permission
  await requestNotificationPermission()

  // Subscribe to online/offline changes
  subscribeToOnlineStatus((isOnline) => {
    if (isOnline) {
      console.log('✅ Back online - syncing changes')
      // Trigger sync
      if ('serviceWorker' in navigator && navigator.serviceWorker.ready) {
        navigator.serviceWorker.ready.then(registration => {
          registration.sync.register('sync-offline-changes').catch(err => {
            console.log('Background sync not available:', err)
          })
        })
      }
    } else {
      console.log('📡 Offline mode activated')
    }
  })

  console.log('✅ PWA initialization complete')

  return {
    serviceWorkerRegistration: swRegistration,
    isOnline: isOnline(),
  }
}
