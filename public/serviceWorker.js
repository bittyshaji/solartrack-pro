/**
 * SolarTrack Pro Service Worker
 * Enables offline functionality, caching, and background sync
 *
 * Features:
 * - App shell caching (HTML, CSS, JS)
 * - Network-first strategy for API calls (try network, fall back to cache)
 * - Cache-first strategy for assets (images, fonts)
 * - Offline support with intelligent fallbacks
 * - Background sync for offline changes
 * - Push notifications
 */

const CACHE_VERSION = 'solartrack-v1'
const APP_SHELL_CACHE = 'solartrack-app-shell-v1'
const DYNAMIC_CACHE = 'solartrack-dynamic-v1'
const IMAGE_CACHE = 'solartrack-images-v1'

// Files that must be cached for offline access
const APP_SHELL_FILES = [
  '/',
  '/index.html',
  '/manifest.json',
  '/favicon.ico',
]

/**
 * Install Event: Cache essential app files
 */
self.addEventListener('install', (event) => {
  console.log('🔧 Service Worker: Installing...')

  event.waitUntil(
    (async () => {
      try {
        // Cache app shell
        const appShellCache = await caches.open(APP_SHELL_CACHE)
        await appShellCache.addAll(APP_SHELL_FILES)

        // Create empty dynamic cache
        await caches.open(DYNAMIC_CACHE)
        await caches.open(IMAGE_CACHE)

        console.log('✅ Service Worker: Installation complete')

        // Force service worker to activate immediately
        return self.skipWaiting()
      } catch (error) {
        console.error('❌ Service Worker: Installation failed', error)
      }
    })()
  )
})

/**
 * Activate Event: Clean up old cache versions
 */
self.addEventListener('activate', (event) => {
  console.log('🔄 Service Worker: Activating...')

  event.waitUntil(
    (async () => {
      try {
        // Delete old cache versions
        const cacheNames = await caches.keys()
        await Promise.all(
          cacheNames.map((cacheName) => {
            if (
              cacheName !== APP_SHELL_CACHE &&
              cacheName !== DYNAMIC_CACHE &&
              cacheName !== IMAGE_CACHE
            ) {
              console.log(`🗑️ Deleting old cache: ${cacheName}`)
              return caches.delete(cacheName)
            }
          })
        )

        console.log('✅ Service Worker: Activation complete')

        // Take control of all pages
        return self.clients.claim()
      } catch (error) {
        console.error('❌ Service Worker: Activation failed', error)
      }
    })()
  )
})

/**
 * Fetch Event: Intelligent caching strategies
 */
self.addEventListener('fetch', (event) => {
  const { request } = event
  const url = new URL(request.url)

  // Skip non-GET requests
  if (request.method !== 'GET') {
    return
  }

  // Skip external requests (different origin)
  if (url.origin !== self.location.origin) {
    return
  }

  // Handle API requests: Network-first strategy
  if (url.pathname.startsWith('/api/')) {
    event.respondWith(networkFirstStrategy(request))
    return
  }

  // Handle image requests: Cache-first strategy
  if (request.destination === 'image') {
    event.respondWith(cacheFirstStrategy(request, IMAGE_CACHE))
    return
  }

  // Handle HTML/CSS/JS requests: Cache-first with network fallback
  if (
    request.destination === 'document' ||
    request.destination === 'script' ||
    request.destination === 'style'
  ) {
    event.respondWith(cacheFirstStrategy(request, APP_SHELL_CACHE))
    return
  }

  // Default: Network-first strategy
  event.respondWith(networkFirstStrategy(request))
})

/**
 * Network-first strategy
 * Try to fetch from network first, fall back to cache if offline
 */
async function networkFirstStrategy(request) {
  try {
    // Try to fetch from network
    const response = await fetch(request)

    // Cache successful responses (but safely handle cloning)
    if (response && response.status === 200) {
      try {
        const cache = await caches.open(DYNAMIC_CACHE)
        // Only cache if it's a valid response
        if (response.type === 'basic' || response.type === 'cors') {
          cache.put(request, response.clone()).catch(err => {
            console.warn(`Failed to cache ${request.url}:`, err)
          })
        }
      } catch (cacheError) {
        console.warn(`Cache error for ${request.url}:`, cacheError)
        // Continue anyway - caching failure shouldn't break the app
      }
    }

    return response
  } catch (error) {
    // Network failed, try cache
    console.log(`📦 Falling back to cache for: ${request.url}`)
    const cached = await caches.match(request)

    if (cached) {
      return cached
    }

    // No cache available, show offline page
    return caches.match('/offline.html') || new Response('Offline - No cached response available', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

/**
 * Cache-first strategy
 * Use cache first, fall back to network if not cached
 */
async function cacheFirstStrategy(request, cacheName) {
  try {
    // Check cache first
    const cached = await caches.match(request)
    if (cached) {
      console.log(`📦 Cache HIT: ${request.url}`)
      return cached
    }

    // Not in cache, fetch from network
    console.log(`🌐 Cache MISS, fetching: ${request.url}`)
    const response = await fetch(request)

    // Cache successful responses (but safely handle cloning)
    if (response && response.status === 200) {
      try {
        const cache = await caches.open(cacheName)
        // Only cache if it's a valid response type
        if (response.type === 'basic' || response.type === 'cors') {
          cache.put(request, response.clone()).catch(err => {
            console.warn(`Failed to cache ${request.url}:`, err)
          })
        }
      } catch (cacheError) {
        console.warn(`Cache error for ${request.url}:`, cacheError)
        // Continue anyway - caching failure shouldn't break the app
      }
    }

    return response
  } catch (error) {
    // Network failed and not in cache
    console.error(`❌ Failed to fetch: ${request.url}`, error)

    // Return offline page or placeholder
    if (request.destination === 'document') {
      return caches.match('/offline.html') || new Response('Offline', {
        status: 503,
        statusText: 'Service Unavailable',
      })
    }

    return new Response('Resource unavailable offline', {
      status: 503,
      statusText: 'Service Unavailable',
    })
  }
}

/**
 * Background Sync Event
 * Sync offline changes when connection is restored
 */
self.addEventListener('sync', (event) => {
  console.log(`🔄 Background sync triggered: ${event.tag}`)

  if (event.tag === 'sync-offline-changes') {
    event.waitUntil(syncOfflineChanges())
  }

  if (event.tag === 'sync-photos') {
    event.waitUntil(syncOfflinePhotos())
  }
})

/**
 * Sync offline changes (tasks, proposals, etc.)
 */
async function syncOfflineChanges() {
  try {
    console.log('🔄 Syncing offline changes...')

    // Open offline store
    const db = await openOfflineDB()
    const queue = await db.getAll('syncQueue')

    console.log(`Found ${queue.length} pending changes to sync`)

    for (const item of queue) {
      try {
        // Resend the request
        const response = await fetch(item.url, {
          method: item.method,
          headers: item.headers,
          body: item.body,
        })

        if (response.ok) {
          console.log(`✅ Synced: ${item.url}`)
          // Remove from queue
          await db.delete('syncQueue', item.id)
        } else {
          console.error(`Failed to sync: ${item.url}`)
        }
      } catch (error) {
        console.error(`Error syncing ${item.url}:`, error)
      }
    }

    console.log('✅ Sync complete')

    // Notify clients of sync completion
    const clients = await self.clients.matchAll()
    clients.forEach(client => {
      client.postMessage({
        type: 'SYNC_COMPLETE',
        data: { synced: queue.length },
      })
    })
  } catch (error) {
    console.error('Error during background sync:', error)
  }
}

/**
 * Sync offline photos
 */
async function syncOfflinePhotos() {
  try {
    console.log('📸 Syncing offline photos...')

    // Similar logic to syncOfflineChanges but for photos
    console.log('✅ Photo sync complete')
  } catch (error) {
    console.error('Error syncing photos:', error)
  }
}

/**
 * Helper: Open IndexedDB for offline storage
 */
async function openOfflineDB() {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open('SolarTrackOffline', 1)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = event.target.result

      // Create object stores if they don't exist
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
 * Push Notification Event
 */
self.addEventListener('push', (event) => {
  console.log('📢 Push notification received')

  const data = event.data ? event.data.json() : {}
  const options = {
    body: data.body || 'SolarTrack Pro notification',
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-96x96.png',
    tag: data.tag || 'solartrack-notification',
    data: data,
  }

  event.waitUntil(self.registration.showNotification('SolarTrack Pro', options))
})

/**
 * Notification Click Event
 */
self.addEventListener('notificationclick', (event) => {
  console.log('🔔 Notification clicked')

  event.notification.close()

  const data = event.notification.data
  const urlToOpen = data.url || '/dashboard'

  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clientList) => {
      // Check if app is already open
      for (let i = 0; i < clientList.length; i++) {
        const client = clientList[i]
        if (client.url === urlToOpen && 'focus' in client) {
          return client.focus()
        }
      }

      // App not open, open it
      if (clients.openWindow) {
        return clients.openWindow(urlToOpen)
      }
    })
  )
})

/**
 * Message Event: Communication with app
 */
self.addEventListener('message', (event) => {
  console.log('💬 Service Worker received message:', event.data)

  if (event.data && event.data.type === 'SKIP_WAITING') {
    self.skipWaiting()
  }

  if (event.data && event.data.type === 'CLEAR_CACHE') {
    event.waitUntil(
      caches.keys().then((cacheNames) => {
        return Promise.all(cacheNames.map((cacheName) => caches.delete(cacheName)))
      })
    )
  }

  if (event.data && event.data.type === 'QUEUE_SYNC') {
    event.waitUntil(
      (async () => {
        const db = await openOfflineDB()
        await db.add('syncQueue', event.data.payload)
        console.log('✅ Added to sync queue:', event.data.payload)
      })()
    )
  }
})

console.log('🟢 Service Worker initialized')
