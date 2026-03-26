import { supabase } from '../lib/supabase'

/**
 * Compress an image file before upload
 * @param {File} file - The image file
 * @param {number} maxWidth - Max width in pixels
 * @param {number} quality - JPEG quality 0-1
 * @returns {Promise<Blob>}
 */
export async function compressImage(file, maxWidth = 1200, quality = 0.8) {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    
    img.onload = () => {
      URL.revokeObjectURL(url)
      
      let { width, height } = img
      if (width > maxWidth) {
        height = Math.round((height * maxWidth) / width)
        width = maxWidth
      }
      
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      
      const ctx = canvas.getContext('2d')
      ctx.drawImage(img, 0, 0, width, height)
      
      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob)
          else reject(new Error('Failed to compress image'))
        },
        'image/jpeg',
        quality
      )
    }
    
    img.onerror = () => {
      URL.revokeObjectURL(url)
      reject(new Error('Failed to load image'))
    }
    
    img.src = url
  })
}

/**
 * Upload a photo to Supabase Storage
 * @param {File|Blob} file - The file to upload
 * @param {string} bucket - Storage bucket name
 * @param {string} folder - Folder path within the bucket
 * @returns {Promise<{url: string, path: string}>}
 */
export async function uploadPhoto(file, bucket = 'incident-photos', folder = '') {
  const ext = file.type === 'image/png' ? 'png' : 'jpg'
  const fileName = `${folder ? folder + '/' : ''}${Date.now()}_${Math.random().toString(36).slice(2, 8)}.${ext}`
  
  const { data, error } = await supabase.storage
    .from(bucket)
    .upload(fileName, file, {
      contentType: file.type || 'image/jpeg',
      upsert: false,
    })
  
  if (error) throw error
  
  const { data: urlData } = supabase.storage
    .from(bucket)
    .getPublicUrl(fileName)
  
  return {
    url: urlData.publicUrl,
    path: fileName,
  }
}

/**
 * Delete a photo from Supabase Storage
 * @param {string} path - File path in the bucket
 * @param {string} bucket - Storage bucket name
 */
export async function deletePhoto(path, bucket = 'incident-photos') {
  const { error } = await supabase.storage
    .from(bucket)
    .remove([path])
  
  if (error) throw error
}

/**
 * Generate a thumbnail URL using Supabase image transforms
 * @param {string} url - The original image URL
 * @param {number} width - Thumbnail width
 * @returns {string}
 */
export function getThumbnailUrl(url, width = 200) {
  // If Supabase image transforms are enabled, use them
  // Otherwise just return the original URL
  if (url && url.includes('supabase')) {
    return url.replace('/object/public/', `/render/image/public/`) + `?width=${width}&resize=contain`
  }
  return url
}