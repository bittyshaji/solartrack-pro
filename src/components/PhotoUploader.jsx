import { useRef, useState } from 'react'
import { Upload, X, AlertCircle } from 'lucide-react'
import toast from 'react-hot-toast'
import { uploadPhoto, validateImageFile } from '../lib/photoService'

/**
 * PhotoUploader Component
 * Provides drag-drop and file input for photo uploads
 * @param {string} updateId - The daily update ID to attach photos to
 * @param {string} userId - Current user ID
 * @param {Function} onPhotoUploaded - Callback when photo is successfully uploaded
 * @param {boolean} disabled - Disable upload when true
 */
export default function PhotoUploader({ updateId, userId, onPhotoUploaded, disabled = false }) {
  const fileInputRef = useRef(null)
  const [isDragging, setIsDragging] = useState(false)
  const [isUploading, setIsUploading] = useState(false)
  const [previewFile, setPreviewFile] = useState(null)
  const [errors, setErrors] = useState([])

  const handleDragEnter = (e) => {
    e.preventDefault()
    e.stopPropagation()
    if (!disabled) setIsDragging(true)
  }

  const handleDragLeave = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)
  }

  const handleDragOver = (e) => {
    e.preventDefault()
    e.stopPropagation()
  }

  const processFile = async (file) => {
    setErrors([])

    // Validate
    const validation = validateImageFile(file)
    if (!validation.isValid) {
      setErrors(validation.errors)
      toast.error(validation.errors[0])
      return
    }

    // Show preview
    const reader = new FileReader()
    reader.onload = (e) => setPreviewFile(e.target.result)
    reader.readAsDataURL(file)

    // Upload
    setIsUploading(true)
    const { success, error, url } = await uploadPhoto(file, updateId, userId)

    if (success) {
      toast.success('Photo uploaded successfully!')
      onPhotoUploaded && onPhotoUploaded({ url, file_url: url })
      setPreviewFile(null)
      if (fileInputRef.current) fileInputRef.current.value = ''
    } else {
      toast.error(error || 'Upload failed')
      setErrors([error])
    }

    setIsUploading(false)
    setIsDragging(false)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    e.stopPropagation()
    setIsDragging(false)

    if (disabled || isUploading) return

    const files = e.dataTransfer.files
    if (files.length > 0) {
      processFile(files[0])
    }
  }

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0]
    if (file) {
      processFile(file)
    }
  }

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click()
    }
  }

  return (
    <div className="space-y-4">
      {/* Error Messages */}
      {errors.length > 0 && (
        <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2">
          <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-red-700">
            {errors.map((err, idx) => (
              <div key={idx}>{err}</div>
            ))}
          </div>
        </div>
      )}

      {/* Preview */}
      {previewFile && (
        <div className="relative rounded-lg overflow-hidden border-2 border-blue-300 bg-blue-50 p-4">
          <img src={previewFile} alt="Preview" className="max-h-48 mx-auto rounded" />
          <button
            onClick={() => {
              setPreviewFile(null)
              if (fileInputRef.current) fileInputRef.current.value = ''
            }}
            className="absolute top-2 right-2 bg-white rounded-full p-1 hover:bg-gray-100"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
          {isUploading && (
            <div className="absolute inset-0 bg-black/50 flex items-center justify-center rounded">
              <div className="text-white flex flex-col items-center">
                <div className="animate-spin rounded-full h-8 w-8 border-2 border-white border-t-transparent mb-2" />
                <span className="text-sm">Uploading...</span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Upload Area */}
      <div
        onDragEnter={handleDragEnter}
        onDragLeave={handleDragLeave}
        onDragOver={handleDragOver}
        onDrop={handleDrop}
        onClick={handleClick}
        className={`border-2 border-dashed rounded-lg p-8 text-center cursor-pointer transition-all ${
          isDragging
            ? 'border-orange-500 bg-orange-50'
            : 'border-gray-300 hover:border-orange-400 bg-gray-50 hover:bg-orange-50'
        } ${disabled || isUploading ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleFileInputChange}
          className="hidden"
          disabled={disabled || isUploading}
        />

        <div className="flex flex-col items-center gap-2">
          <div className={`p-3 rounded-full ${isDragging ? 'bg-orange-200' : 'bg-gray-200'}`}>
            <Upload className={`w-6 h-6 ${isDragging ? 'text-orange-600' : 'text-gray-600'}`} />
          </div>
          <div>
            <p className="font-medium text-gray-900">Drag photos here or click to select</p>
            <p className="text-xs text-gray-500 mt-1">PNG, JPG, WebP up to 5MB</p>
          </div>
        </div>
      </div>

      {/* Tips */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-xs text-blue-700">
        <strong>💡 Tip:</strong> Add clear, well-lit photos of your work progress for better documentation.
      </div>
    </div>
  )
}
