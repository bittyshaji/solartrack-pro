/**
 * Photo Offline Service
 * Handles queuing photos for upload when offline
 * Auto-uploads photos when connectivity is restored
 */

import { openOfflineDB, subscribeToOnlineStatus } from './pwaService'

/**
 * Queue a photo for offline storage
 * Stores photo blob and metadata in IndexedDB
 */
export async function queuePhotoForUpload(file, metadata = {}) {
  try {
    if (!file) {
      throw new Error('No file provided')
    }

    // Validate file is image
    if (!file.type.startsWith('image/')) {
      throw new Error('File must be an image')
    }

    // Check file size (max 10MB)
    const maxSize = 10 * 1024 * 1024
    if (file.size > maxSize) {
      throw new Error('File size must be less than 10MB')
    }

    const db = await openOfflineDB()
    if (!db) {
      throw new Error('IndexedDB not available')
    }

    // Read file as blob
    const fileBlob = file.slice(0, file.size, file.type)

    // Create offline photo object
    const offlinePhoto = {
      id: `photo-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      filename: file.name,
      mimeType: file.type,
      size: file.size,
      blob: fileBlob,
      metadata: {
        ...metadata,
        capturedAt: new Date().toISOString(),
      },
      status: 'queued', // queued, uploading, completed, failed
      uploadError: null,
      retries: 0,
      maxRetries: 3,
    }

    // Store in IndexedDB
    await db.add('offlinePhotos', offlinePhoto)

    console.log('✅ Photo queued for upload:', offlinePhoto.id)

    return {
      success: true,
      photoId: offlinePhoto.id,
      message: 'Photo saved. It will upload when you go online.',
    }
  } catch (error) {
    console.error('❌ Failed to queue photo:', error)
    return {
      success: false,
      error: error.message,
    }
  }
}

/**
 * Get all queued photos
 */
export async function getQueuedPhotos() {
  try {
    const db = await openOfflineDB()
    if (!db) {
      return []
    }

    const result = await db.getAll('offlinePhotos')
    return result || []
  } catch (error) {
    console.error('Failed to fetch queued photos:', error)
    return []
  }
}

/**
 * Get queued photos by status
 */
export async function getPhotosByStatus(status) {
  try {
    const photos = await getQueuedPhotos()
    return photos.filter(p => p.status === status)
  } catch (error) {
    console.error('Failed to filter photos:', error)
    return []
  }
}

/**
 * Update photo status
 */
export async function updatePhotoStatus(photoId, status, error = null) {
  try {
    const db = await openOfflineDB()
    if (!db) {
      return false
    }

    const photos = await db.getAll('offlinePhotos')
    const photo = photos.find(p => p.id === photoId)

    if (!photo) {
      throw new Error('Photo not found')
    }

    photo.status = status
    if (error) {
      photo.uploadError = error
      photo.retries = (photo.retries || 0) + 1
    }

    // Delete and re-add (simulating update)
    await db.delete('offlinePhotos', photoId)
    await db.add('offlinePhotos', photo)

    console.log(`📸 Photo ${photoId} status: ${status}`)
    return true
  } catch (error) {
    console.error('Failed to update photo status:', error)
    return false
  }
}

/**
 * Delete queued photo
 */
export async function deleteQueuedPhoto(photoId) {
  try {
    const db = await openOfflineDB()
    if (!db) {
      return false
    }

    await db.delete('offlinePhotos', photoId)
    console.log('✅ Photo deleted:', photoId)
    return true
  } catch (error) {
    console.error('Failed to delete photo:', error)
    return false
  }
}

/**
 * Upload queued photos when online
 * This should be called when device comes online
 */
export async function uploadQueuedPhotos(uploadFunction) {
  try {
    const queuedPhotos = await getPhotosByStatus('queued')

    if (queuedPhotos.length === 0) {
      console.log('No photos to upload')
      return { success: true, uploaded: 0, failed: 0 }
    }

    console.log(`🚀 Starting upload of ${queuedPhotos.length} photos`)

    let uploaded = 0
    let failed = 0

    for (const photo of queuedPhotos) {
      try {
        // Check if we've exceeded max retries
        if (photo.retries >= photo.maxRetries) {
          await updatePhotoStatus(
            photo.id,
            'failed',
            'Max retries exceeded'
          )
          failed++
          continue
        }

        // Mark as uploading
        await updatePhotoStatus(photo.id, 'uploading')

        // Call the upload function provided by the component
        await uploadFunction(photo)

        // Mark as completed
        await updatePhotoStatus(photo.id, 'completed')
        uploaded++

        console.log('✅ Photo uploaded:', photo.id)
      } catch (error) {
        console.error('Failed to upload photo:', photo.id, error)
        await updatePhotoStatus(photo.id, 'queued', error.message)
        failed++
      }
    }

    console.log(
      `✅ Upload complete: ${uploaded} uploaded, ${failed} failed`
    )

    return { success: true, uploaded, failed }
  } catch (error) {
    console.error('Failed to process photo uploads:', error)
    return { success: false, error: error.message, uploaded: 0, failed: 0 }
  }
}

/**
 * Clear all photos (completed or failed)
 */
export async function clearProcessedPhotos(status = 'completed') {
  try {
    const db = await openOfflineDB()
    if (!db) {
      return false
    }

    const photos = await db.getAll('offlinePhotos')
    const photosToDelete = photos.filter(p => p.status === status)

    for (const photo of photosToDelete) {
      await db.delete('offlinePhotos', photo.id)
    }

    console.log(`🗑️  Cleared ${photosToDelete.length} ${status} photos`)
    return true
  } catch (error) {
    console.error('Failed to clear photos:', error)
    return false
  }
}

/**
 * Initialize photo sync on online event
 * Should be called once from app initialization
 */
export function initializePhotoSync(uploadFunction) {
  subscribeToOnlineStatus((isOnline) => {
    if (isOnline) {
      console.log('📱 Device online - syncing queued photos')
      uploadQueuedPhotos(uploadFunction)
        .then(result => {
          if (result.success) {
            console.log(`✅ Photo sync complete: ${result.uploaded} uploaded`)
          }
        })
        .catch(error => {
          console.error('Photo sync failed:', error)
        })
    }
  })
}
