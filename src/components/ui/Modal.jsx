import { useEffect } from 'react'
import { createPortal } from 'react-dom'
import { X } from 'lucide-react'

export default function Modal({ isOpen, onClose, title, children, wide }) {
  useEffect(() => {
    if (isOpen) document.body.style.overflow = 'hidden'
    else document.body.style.overflow = ''
    return () => { document.body.style.overflow = '' }
  }, [isOpen])

  if (!isOpen) return null

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-0 sm:p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />
      
      {/* Modal */}
      <div className={`relative w-full ${wide ? 'sm:max-w-2xl' : 'sm:max-w-md'} bg-white sm:rounded-2xl rounded-t-2xl shadow-2xl max-h-[100dvh] sm:max-h-[90vh] flex flex-col sm:my-0 mt-auto`}>
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-100 shrink-0">
          <div className="absolute top-2 left-1/2 -translate-x-1/2 w-10 h-1 bg-gray-300 rounded-full sm:hidden" />
          <h3 className="text-base md:text-lg font-bold text-gray-800 pr-8">{title}</h3>
          <button onClick={onClose} className="absolute right-3 top-3 p-2 rounded-xl hover:bg-gray-100 transition-colors">
            <X size={20} className="text-gray-500" />
          </button>
        </div>
        
        {/* Content */}
        <div className="p-4 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>,
    document.body
  )
}