/**
 * Mobile Photo Upload Component
 * Handles photo capture and upload with offline queuing support
 * Integrates with photoOfflineService for offline functionality
 */

import { useState, useRef, useEffect } from 'react'
import { Camera, Upload, AlertCircle, CheckCircle, Clock, X } from 'lucide-react'
import { useOfflineStatus } from '../hooks/useOfflineStatus'
import {
  queuePhotoForUpload,
  getQueuedPhotos,
  deleteQueuedPhoto,
  updatePhotoStatus,
} from '../lib/photoOfflineService'
import toast from 'react-hot-toast'

/**
 * Simple photo upload component for mobile
 */
export function MobilePhotoUpload({ onPhotoCapture, projectId, taskId }) {
  const [preview, setPreview] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [queuedPhotos, setQueuedPhotos] = useState([])
  const { isOnline } = useOfflineStatus()
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  // Load queued photos on mount
  useEffect(() => {
    loadQueuedPhotos()
  }, [])

  const loadQueuedPhotos = async () => {
    const photos = await getQueuedPhotos()
    setQueuedPhotos(photos)
  }

  const handlePhotoSelect = async (file) => {
    if (!file) return

    try {
      // Create preview - wait for it to complete
      const previewUrl = await new Promise((resolve, reject) => {
        const reader = new FileReader()
        reader.onload = e => resolve(e.target.result)
        reader.onerror = reject
        reader.readAsDataURL(file)
      })
      setPreview(previewUrl)

      // Queue photo for upload
      const result = await queuePhotoForUpload(file, {
        projectId,
        taskId,
      })

      if (result.success) {
        toast.success(result.message)
        loadQueuedPhotos()
        // Keep preview visible so user can see what was queued
        // setPreview(null) - removed to keep preview visible
      } else {
        toast.error(result.error)
      }
    } catch (error) {
      toast.error('Failed to process photo')
      console.error(error)
    }
  }

  const handleCameraCapture = (e) => {
    const file = e.target.files?.[0]
    console.log('Camera capture:', file?.name, file?.size)
    if (file) {
      handlePhotoSelect(file)
    } else {
      console.error('No file from camera capture')
      toast.error('Failed to capture photo')
    }
    // Reset input so same photo can be taken twice
    e.target.value = ''
  }

  const handleFileSelect = (e) => {
    const file = e.target.files?.[0]
    console.log('File select:', file?.name, file?.size)
    if (file) {
      handlePhotoSelect(file)
    } else {
      console.error('No file from file select')
      toast.error('Failed to select file')
    }
    // Reset input so same file can be selected twice
    e.target.value = ''
  }

  const handleRemovePhoto = async (photoId) => {
    const success = await deleteQueuedPhoto(photoId)
    if (success) {
      toast.success('Photo removed')
      loadQueuedPhotos()
    }
  }

  const getPhotoStatusBadge = (status) => {
    const statusConfig = {
      queued: { bg: 'bg-yellow-100', text: 'text-yellow-700', icon: Clock },
      uploading: { bg: 'bg-blue-100', text: 'text-blue-700', icon: Upload },
      completed: { bg: 'bg-green-100', text: 'text-green-700', icon: CheckCircle },
      failed: { bg: 'bg-red-100', text: 'text-red-700', icon: AlertCircle },
    }

    const config = statusConfig[status] || statusConfig.queued
    const Icon = config.icon

    return (
      <span className={`inline-flex items-center gap-1 px-2 py-1 rounded text-xs font-medium ${config.bg} ${config.text}`}>
        <Icon className="w-3 h-3" />
        {status}
      </span>
    )
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="mb-4">
        <h3 className="text-base font-semibold text-gray-900 mb-2">
          📸 Upload Photos
        </h3>
        <p className="text-sm text-gray-600">
          {isOnline
            ? 'Photos will upload immediately'
            : '📡 You\'re offline - photos will upload when you go online'}
        </p>
      </div>

      {/* Preview */}
      {preview && (
        <div className="mb-4 relative rounded-lg overflow-hidden bg-gray-100">
          <img
            src={preview}
            alt="Preview"
            className="w-full h-auto max-h-64 object-cover"
          />
          <button
            onClick={() => setPreview(null)}
            className="absolute top-2 right-2 bg-red-500 text-white p-2 rounded-full hover:bg-red-600"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Upload Buttons */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <button
          onClick={() => cameraInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 min-h-24 p-3 border-2 border-dashed border-orange-300 rounded-lg hover:bg-orange-50 transition-colors"
        >
          <Camera className="w-6 h-6 text-orange-500" />
          <span className="text-sm font-medium text-gray-700">Take Photo</span>
        </button>

        <button
          onClick={() => fileInputRef.current?.click()}
          className="flex flex-col items-center justify-center gap-2 min-h-24 p-3 border-2 border-dashed border-blue-300 rounded-lg hover:bg-blue-50 transition-colors"
        >
          <Upload className="w-6 h-6 text-blue-500" />
          <span className="text-sm font-medium text-gray-700">Choose File</span>
        </button>
      </div>

      {/* Hidden Inputs */}
      <input
        ref={cameraInputRef}
        type="file"
        accept="image/*"
        capture
        onChange={handleCameraCapture}
        className="hidden"
      />
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        onChange={handleFileSelect}
        className="hidden"
      />

      {/* Queued Photos List */}
      {queuedPhotos.length > 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <h4 className="text-sm font-semibold text-gray-900 mb-3">
            {queuedPhotos.length} Photo{queuedPhotos.length !== 1 ? 's' : ''} Pending
          </h4>

          <div className="space-y-2">
            {queuedPhotos.map(photo => (
              <div
                key={photo.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 truncate">
                    {photo.filename}
                  </p>
                  <p className="text-xs text-gray-500">
                    {(photo.size / 1024).toFixed(0)} KB •{' '}
                    {new Date(photo.metadata.capturedAt).toLocaleString()}
                  </p>
                </div>

                <div className="ml-3 flex items-center gap-2">
                  {getPhotoStatusBadge(photo.status)}

                  {photo.status === 'queued' || photo.status === 'failed' ? (
                    <button
                      onClick={() => handleRemovePhoto(photo.id)}
                      className="text-red-500 hover:text-red-700 transition-colors"
                      title="Remove photo"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {/* Error Messages */}
          {queuedPhotos.some(p => p.status === 'failed') && (
            <div className="mt-3 p-3 bg-red-50 rounded-lg border border-red-200">
              <p className="text-xs text-red-700">
                ⚠️ Some photos failed to upload. They'll be retried automatically.
              </p>
            </div>
          )}
        </div>
      )}

      {/* Empty State */}
      {queuedPhotos.length === 0 && (
        <div className="mt-6 pt-6 border-t border-gray-200">
          <p className="text-sm text-gray-500 text-center">
            No photos uploaded yet
          </p>
        </div>
      )}
    </div>
  )
}

/**
 * Photo Gallery Component
 * Displays photos with status indicators
 */
export function PhotoGallery({ photos = [] }) {
  if (photos.length === 0) {
    return (
      <div className="text-center py-8">
        <Camera className="w-12 h-12 text-gray-300 mx-auto mb-2" />
        <p className="text-gray-500">No photos yet</p>
      </div>
    )
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
      {photos.map(photo => (
        <div key={photo.id} className="relative group">
          <img
            src={photo.url}
            alt={photo.filename}
            className="w-full aspect-square object-cover rounded-lg"
          />
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 rounded-lg transition-colors" />
        </div>
      ))}
    </div>
  )
}
