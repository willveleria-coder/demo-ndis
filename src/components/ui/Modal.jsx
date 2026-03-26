import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'
import { useTheme } from '../../context/ThemeContext'

export default function Modal({ isOpen, onClose, title, children, wide, noHeader }) {
  const { isDark } = useTheme()

  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  const bg = isDark ? '#1e293b' : '#ffffff'
  const headerBorder = isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'
  const titleColor = isDark ? '#e2e8f0' : '#1f2937'

  return createPortal(
    <div
      style={{
        position: 'fixed', inset: 0, zIndex: 9999,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        padding: 24, overflowX: 'hidden',
      }}
    >
      {/* Backdrop */}
      <div
        style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)' }}
        onClick={onClose}
      />

      {/* Outer wrapper */}
      <div style={{
        position: 'relative',
        width: '100%',
        maxWidth: wide ? 580 : 420,
        maxHeight: '80dvh',
        display: 'flex',
        flexDirection: 'column',
      }}>

        {/* Close button — overlaps top-right corner of the modal box */}
        <button
          onClick={onClose}
          style={{
            position: 'absolute', right: -6, top: -6, zIndex: 20,
            width: 32, height: 32, borderRadius: 50,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? '#334155' : '#1f2937',
            border: isDark ? '2px solid #475569' : '2px solid #ffffff',
            cursor: 'pointer', transition: 'all 0.2s',
            boxShadow: '0 4px 14px rgba(0,0,0,0.4)',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.background = isDark ? '#475569' : '#374151'
            e.currentTarget.style.transform = 'scale(1.1)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.background = isDark ? '#334155' : '#1f2937'
            e.currentTarget.style.transform = 'scale(1)'
          }}
        >
          <X size={14} strokeWidth={3} style={{ color: '#ffffff' }} />
        </button>

        {/* Modal box */}
        <div style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          borderRadius: 20,
          overflow: 'hidden',
          background: bg,
          boxShadow: isDark ? '0 25px 60px -12px rgba(0,0,0,0.6)' : '0 25px 60px -12px rgba(0,0,0,0.25)',
          maxHeight: '80dvh',
        }}>

          {/* Header */}
          {!noHeader && title && (
            <div style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${headerBorder}`,
              flexShrink: 0,
              background: bg,
            }}>
              <h3 style={{ fontSize: 16, fontWeight: 700, color: titleColor, margin: 0 }}>{title}</h3>
            </div>
          )}

          {/* Content */}
          <div style={{
            flex: 1,
            overflowY: 'auto',
            overflowX: 'hidden',
            padding: noHeader ? 0 : 20,
            background: noHeader ? 'transparent' : bg,
          }}>
            {children}
          </div>
        </div>
      </div>
    </div>,
    document.body
  )
}