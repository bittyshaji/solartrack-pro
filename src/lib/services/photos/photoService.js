import { supabase } from './supabase'

const BUCKET_NAME = 'daily-update-photos'
const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp']

/**
 * Upload a photo to Supabase Storage
 * @param {File} file - Image file to upload
 * @param {string} updateId - The daily update ID
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadPhoto(file, updateId, userId) {
  try {
    // Validation
    if (!file) {
      return { success: false, error: 'No file selected' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File is too large (max 5MB)' }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
    }

    // Create file path: {userId}/{updateId}/{filename}
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/\s+/g, '-')}`
    const filePath = `${userId}/${updateId}/${filename}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    // Save photo reference to database
    const { error: dbError } = await supabase
      .from('update_photos')
      .insert({
        update_id: updateId,
        file_url: publicUrl,
        uploaded_by: userId,
      })

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete the uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      return { success: false, error: 'Failed to save photo reference' }
    }

    return { success: true, url: publicUrl }
  } catch (err) {
    console.error('Photo upload error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Delete a photo from storage and database
 * @param {string} photoId - Photo record ID
 * @param {string} fileUrl - Full URL of the photo
 * @param {string} userId - Current user ID
 * @returns {Promise<{success: boolean, error?: string}>}
 */
export async function deletePhoto(photoId, fileUrl, userId) {
  try {
    // Extract file path from URL
    // URL format: https://...storage.supabase.co/object/public/daily-update-photos/{userId}/{updateId}/{filename}
    const urlParts = fileUrl.split(`${BUCKET_NAME}/`)
    if (urlParts.length !== 2) {
      return { success: false, error: 'Invalid photo URL' }
    }
    const filePath = urlParts[1]

    // Delete from storage
    const { error: storageError } = await supabase.storage
      .from(BUCKET_NAME)
      .remove([filePath])

    if (storageError) {
      console.error('Storage delete error:', storageError)
      return { success: false, error: storageError.message }
    }

    // Delete from database
    const { error: dbError } = await supabase
      .from('update_photos')
      .delete()
      .eq('id', photoId)
      .eq('uploaded_by', userId) // Security: only delete own photos

    if (dbError) {
      console.error('Database delete error:', dbError)
      return { success: false, error: 'Failed to remove photo record' }
    }

    return { success: true }
  } catch (err) {
    console.error('Photo delete error:', err)
    return { success: false, error: err.message }
  }
}

/**
 * Get photos for a specific daily update
 * @param {string} updateId - Daily update ID
 * @returns {Promise<Array>}
 */
export async function getPhotosForUpdate(updateId) {
  try {
    const { data, error } = await supabase
      .from('update_photos')
      .select('*')
      .eq('update_id', updateId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch photos error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Get photos error:', err)
    return []
  }
}

/**
 * Get all photos for a specific project
 * @param {string} projectId - Project ID
 * @returns {Promise<Array>}
 */
export async function getPhotosForProject(projectId) {
  try {
    const { data, error } = await supabase
      .from('update_photos')
      .select('*, daily_updates!inner(project_id)')
      .eq('daily_updates.project_id', projectId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Fetch project photos error:', error)
      return []
    }

    return data || []
  } catch (err) {
    console.error('Get project photos error:', err)
    return []
  }
}

/**
 * Validate image file before upload
 * @param {File} file - File to validate
 * @returns {Object} - Validation result
 */
export function validateImageFile(file) {
  const errors = []

  if (!file) {
    errors.push('No file selected')
  } else {
    if (file.size > MAX_FILE_SIZE) {
      errors.push(`File is too large (max ${MAX_FILE_SIZE / 1024 / 1024}MB)`)
    }
    if (!ALLOWED_TYPES.includes(file.type)) {
      errors.push('Only JPEG, PNG, and WebP images are allowed')
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  }
}

/**
 * Upload a photo directly to a project (for ProjectDetail page)
 * @param {string} projectId - Project ID
 * @param {File} file - Image file to upload
 * @returns {Promise<{success: boolean, url?: string, error?: string}>}
 */
export async function uploadProjectPhoto(projectId, file) {
  try {
    // Validation
    if (!file) {
      return { success: false, error: 'No file selected' }
    }

    if (file.size > MAX_FILE_SIZE) {
      return { success: false, error: 'File is too large (max 5MB)' }
    }

    if (!ALLOWED_TYPES.includes(file.type)) {
      return { success: false, error: 'Only JPEG, PNG, and WebP images are allowed' }
    }

    // Create file path: projects/{projectId}/{timestamp}-{filename}
    const timestamp = Date.now()
    const filename = `${timestamp}-${file.name.replace(/\s+/g, '-')}`
    const filePath = `projects/${projectId}/${filename}`

    // Upload to Supabase Storage
    const { data, error: uploadError } = await supabase.storage
      .from(BUCKET_NAME)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false,
      })

    if (uploadError) {
      console.error('Upload error:', uploadError)
      return { success: false, error: uploadError.message }
    }

    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from(BUCKET_NAME)
      .getPublicUrl(filePath)

    // Save photo reference to database in project_photos table
    const { data: photoRecord, error: dbError } = await supabase
      .from('project_photos')
      .insert({
        project_id: projectId,
        photo_url: publicUrl,
        caption: file.name,
        created_at: new Date().toISOString()
      })
      .select()
      .single()

    if (dbError) {
      console.error('Database error:', dbError)
      // Try to delete the uploaded file if DB insert fails
      await supabase.storage.from(BUCKET_NAME).remove([filePath])
      return { success: false, error: 'Failed to save photo reference' }
    }

    return { success: true, url: publicUrl, photoId: photoRecord?.id }
  } catch (err) {
    console.error('Project photo upload error:', err)
    return { success: false, error: err.message }
  }
}
