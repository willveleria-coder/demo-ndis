import { useState, useRef } from 'react'
import { Camera, ImagePlus, X, Loader2, Upload } from 'lucide-react'
import { compressImage, uploadPhoto } from '../utils/imageUtils'

/**
 * PhotoUploader - Mobile-friendly photo capture and upload
 * 
 * @param {Object} props
 * @param {Array} props.photos - Current photos array [{url, path, caption, timestamp}]
 * @param {Function} props.onPhotosChange - Callback when photos change
 * @param {string} props.bucket - Supabase storage bucket name
 * @param {string} props.folder - Folder within bucket
 * @param {number} props.maxPhotos - Max number of photos allowed
 * @param {string} props.accentColor - Brand accent color
 */
export default function PhotoUploader({ 
  photos = [], 
  onPhotosChange, 
  bucket = 'incident-photos', 
  folder = '',
  maxPhotos = 10,
  accentColor = '#0d9488'
}) {
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState('')
  const fileInputRef = useRef(null)
  const cameraInputRef = useRef(null)

  const handleFiles = async (files) => {
    if (!files || files.length === 0) return
    
    const remaining = maxPhotos - photos.length
    if (remaining <= 0) {
      alert(`Maximum ${maxPhotos} photos allowed`)
      return
    }
    
    const filesToProcess = Array.from(files).slice(0, remaining)
    setUploading(true)
    
    const newPhotos = [...photos]
    
    for (let i = 0; i < filesToProcess.length; i++) {
      const file = filesToProcess[i]
      setUploadProgress(`Uploading ${i + 1} of ${filesToProcess.length}...`)
      
      try {
        // Compress before upload
        const compressed = await compressImage(file, 1200, 0.8)
        const { url, path } = await uploadPhoto(compressed, bucket, folder)
        
        newPhotos.push({
          url,
          path,
          caption: '',
          timestamp: new Date().toISOString(),
        })
      } catch (err) {
        console.error('Photo upload failed:', err)
        alert(`Failed to upload photo: ${err.message}`)
      }
    }
    
    onPhotosChange(newPhotos)
    setUploading(false)
    setUploadProgress('')
    
    // Reset inputs
    if (fileInputRef.current) fileInputRef.current.value = ''
    if (cameraInputRef.current) cameraInputRef.current.value = ''
  }

  const removePhoto = (index) => {
    const updated = photos.filter((_, i) => i !== index)
    onPhotosChange(updated)
  }

  const canAdd = photos.length < maxPhotos

  return (
    <div className="space-y-3">
      {/* Upload buttons */}
      {canAdd && (
        <div className="flex gap-2">
          {/* Camera button - mobile */}
          <button
            type="button"
            onClick={() => cameraInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all text-sm font-medium disabled:opacity-50"
          >
            <Camera size={18} />
            <span className="hidden sm:inline">Take Photo</span>
            <span className="sm:hidden">Camera</span>
          </button>
          
          {/* Gallery button */}
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={uploading}
            className="flex-1 flex items-center justify-center gap-2 py-3 rounded-xl border-2 border-dashed border-gray-200 hover:border-gray-300 text-gray-500 hover:text-gray-700 transition-all text-sm font-medium disabled:opacity-50"
          >
            <ImagePlus size={18} />
            <span className="hidden sm:inline">Choose Photos</span>
            <span className="sm:hidden">Gallery</span>
          </button>
          
          {/* Hidden file inputs */}
          <input
            ref={cameraInputRef}
            type="file"
            accept="image/*"
            capture="environment"
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            multiple
            onChange={(e) => handleFiles(e.target.files)}
            className="hidden"
          />
        </div>
      )}

      {/* Upload progress */}
      {uploading && (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-gray-50 border border-gray-100">
          <Loader2 size={16} className="animate-spin" style={{ color: accentColor }} />
          <span className="text-sm text-gray-600">{uploadProgress || 'Uploading...'}</span>
        </div>
      )}

      {/* Photo previews */}
      {photos.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {photos.map((photo, index) => (
            <div key={index} className="relative group aspect-square rounded-xl overflow-hidden bg-gray-100 border border-gray-200">
              <img
                src={photo.url}
                alt={photo.caption || `Photo ${index + 1}`}
                className="w-full h-full object-cover"
                loading="lazy"
              />
              <button
                type="button"
                onClick={() => removePhoto(index)}
                className="absolute top-1 right-1 w-6 h-6 bg-red-500 hover:bg-red-600 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity shadow-lg"
              >
                <X size={12} className="text-white" />
              </button>
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/50 to-transparent p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <p className="text-[10px] text-white truncate">{new Date(photo.timestamp).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit' })}</p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Photo count */}
      {photos.length > 0 && (
        <p className="text-xs text-gray-400 text-right">{photos.length}/{maxPhotos} photos</p>
      )}
    </div>
  )
}