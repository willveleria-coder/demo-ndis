import { useState, useRef, useEffect } from 'react'
import { PenTool, RotateCcw, Check, X } from 'lucide-react'

/**
 * SignaturePad - Canvas-based digital signature capture
 * 
 * @param {Object} props
 * @param {Function} props.onSave - Callback with base64 PNG data URL
 * @param {Function} props.onCancel - Cancel callback
 * @param {string} props.accentColor - Brand color
 * @param {boolean} props.isDark - Dark mode
 * @param {number} props.width - Canvas width (default: 400)
 * @param {number} props.height - Canvas height (default: 200)
 */
export default function SignaturePad({
  onSave,
  onCancel,
  accentColor = '#0d9488',
  isDark = false,
  width = 400,
  height = 200,
}) {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [hasSignature, setHasSignature] = useState(false)

  const dk = {
    bg: isDark ? '#0f172a' : '#ffffff',
    border: isDark ? '#334155' : '#d1d5db',
    text: isDark ? '#e2e8f0' : '#1f2937',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    stroke: isDark ? '#e2e8f0' : '#1f2937',
  }

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    
    // Set up canvas for retina
    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = height * dpr
    canvas.style.width = `${width}px`
    canvas.style.height = `${height}px`
    ctx.scale(dpr, dpr)
    
    // Clear
    ctx.fillStyle = dk.bg
    ctx.fillRect(0, 0, width, height)
    
    // Draw signature line
    ctx.strokeStyle = isDark ? '#334155' : '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, height - 40)
    ctx.lineTo(width - 20, height - 40)
    ctx.stroke()
    ctx.setLineDash([])
    
    // Label
    ctx.fillStyle = isDark ? '#475569' : '#d1d5db'
    ctx.font = '11px system-ui'
    ctx.fillText('Sign here', 20, height - 20)
  }, [isDark, width, height])

  const getPos = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const clientX = e.touches ? e.touches[0].clientX : e.clientX
    const clientY = e.touches ? e.touches[0].clientY : e.clientY
    return {
      x: clientX - rect.left,
      y: clientY - rect.top,
    }
  }

  const startDrawing = (e) => {
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    
    ctx.strokeStyle = dk.stroke
    ctx.lineWidth = 2.5
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
    
    setIsDrawing(true)
    setHasSignature(true)
  }

  const draw = (e) => {
    if (!isDrawing) return
    e.preventDefault()
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const pos = getPos(e)
    
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const stopDrawing = (e) => {
    if (e) e.preventDefault()
    setIsDrawing(false)
  }

  const clearSignature = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const dpr = window.devicePixelRatio || 1
    
    ctx.setTransform(1, 0, 0, 1, 0, 0)
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.scale(dpr, dpr)
    
    // Redraw background
    ctx.fillStyle = dk.bg
    ctx.fillRect(0, 0, width, height)
    
    // Redraw line
    ctx.strokeStyle = isDark ? '#334155' : '#e5e7eb'
    ctx.lineWidth = 1
    ctx.setLineDash([4, 4])
    ctx.beginPath()
    ctx.moveTo(20, height - 40)
    ctx.lineTo(width - 20, height - 40)
    ctx.stroke()
    ctx.setLineDash([])
    
    ctx.fillStyle = isDark ? '#475569' : '#d1d5db'
    ctx.font = '11px system-ui'
    ctx.fillText('Sign here', 20, height - 20)
    
    setHasSignature(false)
  }

  const saveSignature = () => {
    if (!hasSignature) return
    const canvas = canvasRef.current
    const dataUrl = canvas.toDataURL('image/png')
    if (onSave) onSave(dataUrl)
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <PenTool size={16} style={{ color: accentColor }} />
        <p className="text-sm font-semibold" style={{ color: dk.text }}>Digital Signature</p>
      </div>
      
      <div className="rounded-xl overflow-hidden border-2" style={{ borderColor: isDrawing ? accentColor : dk.border }}>
        <canvas
          ref={canvasRef}
          onMouseDown={startDrawing}
          onMouseMove={draw}
          onMouseUp={stopDrawing}
          onMouseLeave={stopDrawing}
          onTouchStart={startDrawing}
          onTouchMove={draw}
          onTouchEnd={stopDrawing}
          className="cursor-crosshair w-full touch-none"
          style={{ maxWidth: '100%', height: 'auto', aspectRatio: `${width}/${height}` }}
        />
      </div>

      <div className="flex gap-2">
        <button onClick={clearSignature} className="flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-colors" style={{ background: isDark ? '#334155' : '#f3f4f6', color: dk.textFaint }}>
          <RotateCcw size={14} /> Clear
        </button>
        <div className="flex-1" />
        {onCancel && (
          <button onClick={onCancel} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold" style={{ background: isDark ? '#334155' : '#f3f4f6', color: dk.text }}>
            <X size={14} /> Cancel
          </button>
        )}
        <button onClick={saveSignature} disabled={!hasSignature}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold text-white shadow disabled:opacity-50"
          style={{ background: accentColor }}>
          <Check size={14} /> Save Signature
        </button>
      </div>
    </div>
  )
}