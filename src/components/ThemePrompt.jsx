import { useState, useEffect } from 'react'
import { Palette, X } from 'lucide-react'

export default function ThemePrompt() {
  const [show, setShow] = useState(false)

  useEffect(() => {
    const seen = localStorage.getItem('theme_prompt_seen')
    if (!seen) {
      const t = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(t)
    }
  }, [])

  const dismiss = () => {
    setShow(false)
    localStorage.setItem('theme_prompt_seen', 'true')
  }

  if (!show) return null

  return (
    <>
     {/* Desktop: positioned near theme dropdown in top right */}
     <div className="hidden lg:block fixed top-20 right-24 z-[200]" style={{ animation: 'glow 2s ease-in-out infinite' }}>
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-4 w-64">
          <button onClick={dismiss} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100">
            <X size={14} className="text-gray-400" />
          </button>
          <div className="flex items-start gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow shrink-0">
              <Palette size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Customise Your CRM!</p>
              <p className="text-xs text-gray-500 mt-0.5 leading-relaxed">Click the theme button to change colours, styles, and make this system your own brand.</p>
            </div>
          </div>
          {/* Arrow pointing up-right toward the theme button */}
         <div className="absolute -top-2 right-10 w-4 h-4 bg-white border-l border-t border-gray-200 rotate-45" />
        </div>
      </div>

      {/* Mobile: positioned at top of page */}
      <div className="lg:hidden fixed left-3 right-3 z-[200]" style={{ top: 'calc(90px + env(safe-area-inset-top, 0px))' }}>
        <div className="relative bg-white rounded-2xl shadow-2xl border border-gray-200 p-3">
          <button onClick={dismiss} className="absolute top-2 right-2 p-1 rounded-lg hover:bg-gray-100">
            <X size={14} className="text-gray-400" />
          </button>
          <div className="flex items-center gap-3 pr-6">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 flex items-center justify-center shadow shrink-0">
              <Palette size={16} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Customise Your CRM!</p>
              <p className="text-xs text-gray-500 mt-0.5">Open the menu and tap Settings to change your brand colours and theme.</p>
            </div>
          </div>
        </div>
      </div>

      {/* Auto dismiss after 8 seconds */}
      {show && <div className="hidden" ref={el => { if (el) setTimeout(dismiss, 8000) }} />}
    </>
  )
}