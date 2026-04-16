import { useState } from 'react'
import { X, Trash2, Download, ZoomIn } from 'lucide-react'
import toast from 'react-hot-toast'
import { deletePhoto } from '../lib/photoService'

/**
 * PhotoGallery Component
 * Displays a grid of photos with preview, download, and delete options
 * @param {Array} photos - Array of photo objects with id, file_url, created_at
 * @param {string} userId - Current user ID (for delete permission)
 * @param {Function} onPhotoDeleted - Callback when photo is deleted
 * @param {boolean} readOnly - If true, hide delete buttons
 */
export default function PhotoGallery({ photos = [], userId, onPhotoDeleted, readOnly = false }) {
  const [selectedPhoto, setSelectedPhoto] = useState(null)
  const [deleting, setDeleting] = useState(null)

  if (photos.length === 0) {
    return (
      <div className="text-center py-12 bg-gray-50 rounded-lg border-2 border-dashed border-gray-300">
        <svg
          className="mx-auto h-12 w-12 text-gray-400"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
          />
        </svg>
        <p className="mt-4 text-gray-600 text-sm">No photos yet</p>
      </div>
    )
  }

  const handleDeletePhoto = async (photo) => {
    if (!window.confirm('Delete this photo? This action cannot be undone.')) {
      return
    }

    setDeleting(photo.id)
    const { success, error } = await deletePhoto(photo.id, photo.file_url, userId)

    if (success) {
      toast.success('Photo deleted')
      onPhotoDeleted && onPhotoDeleted(photo.id)
    } else {
      toast.error(error || 'Failed to delete photo')
    }
    setDeleting(null)
  }

  const handleDownload = (photo) => {
    const link = document.createElement('a')
    link.href = photo.file_url
    link.download = `photo-${photo.id}.jpg`
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  return (
    <div>
      {/* Gallery Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
        {photos.map((photo) => (
          <div
            key={photo.id}
            className="relative group rounded-lg overflow-hidden bg-gray-200 aspect-square"
          >
            {/* Image */}
            <img
              src={photo.file_url}
              alt="Update photo"
              className="w-full h-full object-cover"
              loading="lazy"
            />

            {/* Overlay */}
            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/50 transition-colors duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
              {/* Preview Button */}
              <button
                onClick={() => setSelectedPhoto(photo)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Preview"
              >
                <ZoomIn className="w-5 h-5 text-gray-700" />
              </button>

              {/* Download Button */}
              <button
                onClick={() => handleDownload(photo)}
                className="p-2 bg-white rounded-full hover:bg-gray-100 transition-colors"
                title="Download"
              >
                <Download className="w-5 h-5 text-gray-700" />
              </button>

              {/* Delete Button (if not read-only) */}
              {!readOnly && (
                <button
                  onClick={() => handleDeletePhoto(photo)}
                  disabled={deleting === photo.id}
                  className="p-2 bg-red-500 hover:bg-red-600 disabled:bg-gray-400 rounded-full transition-colors"
                  title="Delete"
                >
                  {deleting === photo.id ? (
                    <div className="animate-spin">
                      <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full" />
                    </div>
                  ) : (
                    <Trash2 className="w-5 h-5 text-white" />
                  )}
                </button>
              )}
            </div>

            {/* Date Badge */}
            <div className="absolute top-2 left-2 bg-black/60 text-white text-xs px-2 py-1 rounded">
              {new Date(photo.created_at).toLocaleDateString()}
            </div>
          </div>
        ))}
      </div>

      {/* Full Screen Preview Modal */}
      {selectedPhoto && (
        <div
          className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4"
          onClick={() => setSelectedPhoto(null)}
        >
          <div className="relative max-w-4xl max-h-screen flex items-center justify-center">
            {/* Close Button */}
            <button
              onClick={(e) => {
                e.stopPropagation()
                setSelectedPhoto(null)
              }}
              className="absolute top-4 right-4 bg-white rounded-full p-2 hover:bg-gray-100 transition-colors"
            >
              <X className="w-6 h-6 text-gray-900" />
            </button>

            {/* Image */}
            <img
              src={selectedPhoto.file_url}
              alt="Preview"
              className="max-w-full max-h-[90vh] rounded-lg object-contain"
            />

            {/* Photo Info */}
            <div className="absolute bottom-4 left-4 bg-black/60 text-white text-sm px-3 py-2 rounded">
              Taken: {new Date(selectedPhoto.created_at).toLocaleString()}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
