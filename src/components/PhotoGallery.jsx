import { useState } from 'react'
import { createPortal } from 'react-dom'
import { X, ChevronLeft, ChevronRight, ZoomIn } from 'lucide-react'

export default function PhotoGallery({ photos = [], accentColor = '#ec4899' }) {
  const [lightboxIndex, setLightboxIndex] = useState(null)

  if (!photos || photos.length === 0) return null

  const getUrl = (photo) => typeof photo === 'string' ? photo : photo?.url

  const lightbox = lightboxIndex !== null ? createPortal(
    <div
      onClick={() => setLightboxIndex(null)}
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0, bottom: 0,
        zIndex: 99999,
        background: 'rgba(0,0,0,0.92)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: 20,
      }}
    >
      <button
        onClick={() => setLightboxIndex(null)}
        style={{
          position: 'fixed', top: 16, right: 16, zIndex: 100000,
          width: 40, height: 40, borderRadius: 12,
          background: 'rgba(255,255,255,0.15)',
          border: 'none', color: 'white', cursor: 'pointer',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}
      >
        <X size={22} />
      </button>

      <div style={{
        position: 'fixed', top: 16, left: 16, zIndex: 100000,
        padding: '6px 14px', borderRadius: 10,
        background: 'rgba(255,255,255,0.15)',
        color: 'white', fontSize: 13, fontWeight: 700,
      }}>
        {lightboxIndex + 1} / {photos.length}
      </div>

      {photos.length > 1 && (
        <>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev - 1 + photos.length) % photos.length) }}
            style={{
              position: 'fixed', left: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 100000,
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronLeft size={22} />
          </button>
          <button
            onClick={(e) => { e.stopPropagation(); setLightboxIndex((prev) => (prev + 1) % photos.length) }}
            style={{
              position: 'fixed', right: 12, top: '50%', transform: 'translateY(-50%)', zIndex: 100000,
              width: 40, height: 40, borderRadius: 12,
              background: 'rgba(255,255,255,0.15)',
              border: 'none', color: 'white', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <ChevronRight size={22} />
          </button>
        </>
      )}

      <img
        src={getUrl(photos[lightboxIndex])}
        alt={`Photo ${lightboxIndex + 1}`}
        onClick={(e) => e.stopPropagation()}
        onError={(e) => { e.target.style.display = 'none' }}
        style={{
          maxWidth: 'calc(100vw - 80px)',
          maxHeight: 'calc(100vh - 120px)',
          width: 'auto',
          height: 'auto',
          objectFit: 'contain',
          borderRadius: 14,
          boxShadow: '0 20px 60px -12px rgba(0,0,0,0.5)',
        }}
      />
    </div>,
    document.body
  ) : null

  return (
    <>
      <div>
        <p style={{ fontSize: 13, fontWeight: 800, color: '#374151', display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
          <ZoomIn size={14} style={{ color: accentColor }} />
          Photos ({photos.length})
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
          {photos.map((photo, index) => (
            <button
              key={index}
              onClick={() => setLightboxIndex(index)}
              style={{
                aspectRatio: '1',
                borderRadius: 12,
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.08)',
                cursor: 'pointer',
                padding: 0,
                background: '#f3f4f6',
                position: 'relative',
              }}
            >
              <img
                src={getUrl(photo)}
                alt={`Photo ${index + 1}`}
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
                loading="lazy"
                onError={(e) => { e.target.style.display = 'none' }}
              />
            </button>
          ))}
        </div>
      </div>
      {lightbox}
    </>
  )
}