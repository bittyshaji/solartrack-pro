/**
 * Photo Upload Section
 * Allows users to upload project photos directly from project page
 * Integrated with ProjectUpdates and offline support
 */

import { useState } from 'react'
import { Upload, X, Image as ImageIcon } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadProjectPhoto } from '../lib/photoService'

export default function PhotoUploadSection({ projectId, onPhotoUploaded }) {
  const [uploading, setUploading] = useState(false)
  const [selectedFiles, setSelectedFiles] = useState([])
  const [uploadProgress, setUploadProgress] = useState({})

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files || [])

    // Validate files
    const validFiles = files.filter(file => {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error(`${file.name} is too large (max 10MB)`)
        return false
      }
      if (!file.type.startsWith('image/')) {
        toast.error(`${file.name} is not an image`)
        return false
      }
      return true
    })

    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles])
    }
  }

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index))
    setUploadProgress(prev => {
      const newProgress = { ...prev }
      delete newProgress[index]
      return newProgress
    })
  }

  const handleUpload = async () => {
    if (selectedFiles.length === 0) {
      toast.error('Please select photos to upload')
      return
    }

    setUploading(true)
    let successCount = 0
    let errorCount = 0

    for (let i = 0; i < selectedFiles.length; i++) {
      const file = selectedFiles[i]
      try {
        setUploadProgress(prev => ({ ...prev, [i]: 'uploading' }))

        const result = await uploadProjectPhoto(projectId, file)

        if (result.success) {
          setUploadProgress(prev => ({ ...prev, [i]: 'success' }))
          successCount++
        } else {
          setUploadProgress(prev => ({ ...prev, [i]: 'error' }))
          errorCount++
          console.error(`Failed to upload ${file.name}:`, result.error)
        }
      } catch (error) {
        setUploadProgress(prev => ({ ...prev, [i]: 'error' }))
        errorCount++
        console.error(`Error uploading ${file.name}:`, error)
      }
    }

    setUploading(false)

    if (successCount > 0) {
      toast.success(`${successCount} photo(s) uploaded successfully`)
      setSelectedFiles([])
      setUploadProgress({})
      if (onPhotoUploaded) onPhotoUploaded()
    }

    if (errorCount > 0) {
      toast.error(`${errorCount} photo(s) failed to upload`)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex items-center gap-2 mb-4">
        <ImageIcon size={20} className="text-blue-600" />
        <h3 className="text-lg font-bold text-gray-900">Upload Project Photos</h3>
      </div>

      {/* File Input */}
      <div className="mb-4">
        <label className="block mb-2 cursor-pointer">
          <div className="border-2 border-dashed border-blue-300 rounded-lg p-6 text-center hover:border-blue-500 transition bg-blue-50">
            <Upload size={24} className="mx-auto mb-2 text-blue-600" />
            <p className="text-sm font-medium text-gray-700">Click to select photos or drag and drop</p>
            <p className="text-xs text-gray-500 mt-1">Maximum 10MB per image</p>
          </div>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleFileSelect}
            disabled={uploading}
            className="hidden"
          />
        </label>
      </div>

      {/* Selected Files Preview */}
      {selectedFiles.length > 0 && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-gray-700">
              Selected: {selectedFiles.length} photo{selectedFiles.length !== 1 ? 's' : ''}
            </p>
            {selectedFiles.length > 0 && !uploading && (
              <button
                onClick={() => setSelectedFiles([])}
                className="text-xs text-gray-500 hover:text-gray-700"
              >
                Clear all
              </button>
            )}
          </div>

          <div className="grid grid-cols-4 md:grid-cols-6 gap-2">
            {selectedFiles.map((file, idx) => (
              <div
                key={idx}
                className="relative aspect-square rounded-lg overflow-hidden bg-gray-100 group"
              >
                {uploadProgress[idx] === 'success' && (
                  <div className="absolute inset-0 bg-green-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✓</span>
                  </div>
                )}
                {uploadProgress[idx] === 'error' && (
                  <div className="absolute inset-0 bg-red-500 flex items-center justify-center">
                    <span className="text-white text-xs font-bold">✕</span>
                  </div>
                )}
                {uploadProgress[idx] === 'uploading' && (
                  <div className="absolute inset-0 bg-gray-400 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  </div>
                )}
                {!uploadProgress[idx] && (
                  <img
                    src={URL.createObjectURL(file)}
                    alt={`Preview ${idx}`}
                    className="w-full h-full object-cover"
                  />
                )}
                <button
                  onClick={() => removeFile(idx)}
                  className="absolute top-1 right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                  disabled={uploading}
                  title="Remove"
                >
                  <X size={14} />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Upload Button */}
      {selectedFiles.length > 0 && (
        <button
          onClick={handleUpload}
          disabled={uploading}
          className={`w-full px-4 py-2.5 rounded-lg font-medium transition flex items-center justify-center gap-2 ${
            uploading
              ? 'bg-gray-400 text-gray-600 cursor-not-allowed'
              : 'bg-blue-600 text-white hover:bg-blue-700'
          }`}
        >
          {uploading ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Uploading...
            </>
          ) : (
            <>
              <Upload size={18} />
              Upload {selectedFiles.length} Photo{selectedFiles.length !== 1 ? 's' : ''}
            </>
          )}
        </button>
      )}
    </div>
  )
}
