import { useState, useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Sparkles } from 'lucide-react'

const TOUR_STEPS = [
  {
    title: 'Welcome to the Family Portal!',
    message: "G'day! I'm Merlin, your guide. This is your family dashboard where you can stay connected with your loved one's care. Everything here is read only so you can check in anytime without worrying about changing anything.",
  },
  {
    title: 'Shift Updates',
    message: "The Shift Updates tab shows you what happened during each support shift. You can see which worker visited, how long they stayed, and read their notes about mood, activities, goals progress, and any concerns.",
  },
  {
    title: 'Upcoming Shifts',
    message: "Check the Upcoming tab to see when the next support visits are scheduled. You'll see the date, time, and which support worker is assigned.",
  },
  {
    title: 'Goals & Progress',
    message: "The Goals tab shows your loved one's active NDIS goals with progress bars. You can track how they're progressing towards each outcome over time.",
  },
  {
    title: 'Medications',
    message: "View all current medications including dosages, frequency, and special instructions. This is a read only view so you always know what's being administered.",
  },
  {
    title: 'Care Team',
    message: "See all the support workers who have worked with your loved one and how many shifts each has completed. This helps you know who's providing the care.",
    isLast: true,
  },
]

export default function FamilyTour() {
  const location = useLocation()
  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(false)
  const [wizardBounce, setWizardBounce] = useState(true)

  useEffect(() => {
    const seen = localStorage.getItem('family_tour_seen')
    if (seen) setHasSeenTour(true)
    const t = setTimeout(() => setWizardBounce(false), 3000)
    return () => clearTimeout(t)
  }, [])

  if (!location.pathname.startsWith('/family')) return null

  const startTour = () => { setActive(true); setStep(0); setMinimized(false) }
  const endTour = () => { setActive(false); setStep(0); setMinimized(false); localStorage.setItem('family_tour_seen', 'true'); setHasSeenTour(true) }
  const nextStep = () => { if (step + 1 >= TOUR_STEPS.length) { endTour(); return }; setStep(step + 1) }
  const prevStep = () => { if (step > 0) setStep(step - 1) }

  const currentStep = TOUR_STEPS[step]
  const progress = ((step + 1) / TOUR_STEPS.length) * 100

  return (
    <>
      {!active && (
        <button onClick={startTour}
          className={`fixed bottom-6 right-6 z-[999] group ${wizardBounce ? 'animate-bounce' : ''}`}
          style={{ filter: 'drop-shadow(0 4px 12px rgba(0,0,0,0.25))' }}>
          <div className="relative">
            <img src="/wizard.png" alt="Merlin" className="w-12 h-12 lg:w-20 lg:h-20 object-contain rounded-full bg-gradient-to-br from-rose-400 to-pink-500 p-1 lg:p-1.5 border-2 border-white shadow-xl group-hover:scale-110 transition-transform" />
            <div className="absolute -top-1 -right-1 w-5 h-5 bg-amber-400 rounded-full flex items-center justify-center shadow">
              <Sparkles size={10} className="text-white" />
            </div>
          </div>
          <div className="absolute bottom-full right-0 mb-2 px-3 py-1.5 bg-gray-900 text-white text-xs font-semibold rounded-lg whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {hasSeenTour ? 'Ask Merlin again' : 'Meet Merlin!'} ✨
          </div>
        </button>
      )}

      {active && !minimized && (
        <>
          <div className="fixed inset-0 bg-black/30 backdrop-blur-[2px] z-[998] transition-opacity" onClick={() => setMinimized(true)} />
          <div className="fixed bottom-6 left-4 right-4 sm:left-auto sm:right-6 z-[999] sm:w-[380px]">
            <div className="h-1 bg-gray-200 rounded-full mb-2 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-rose-400 to-pink-500 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <div className="bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden">
              <div className="bg-gradient-to-r from-rose-400 to-pink-500 p-4 flex items-center gap-3">
                <img src="/wizard.png" alt="Merlin" className="w-12 h-12 object-contain rounded-full bg-white/20 p-0.5 border border-white/30" />
                <div className="flex-1 min-w-0">
                  <p className="text-white font-bold text-sm">{currentStep.title}</p>
                  <p className="text-white/60 text-[10px]">Step {step + 1} of {TOUR_STEPS.length}</p>
                </div>
                <button onClick={endTour} className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 transition-colors"><X size={16} /></button>
              </div>
              <div className="p-4">
                <p className="text-sm text-gray-700 leading-relaxed">{currentStep.message}</p>
              </div>
              <div className="px-4 pb-4 flex items-center justify-between gap-2">
                <button onClick={prevStep} disabled={step === 0} className="flex items-center gap-1 px-3 py-2 rounded-xl text-xs font-semibold text-gray-500 hover:bg-gray-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors">
                  <ChevronLeft size={14} /> Back
                </button>
                <div className="flex gap-1">
                  {TOUR_STEPS.map((_, i) => (
                    <div key={i} className={`w-1.5 h-1.5 rounded-full transition-all ${i === step ? 'bg-pink-500 w-4' : i < step ? 'bg-pink-300' : 'bg-gray-200'}`} />
                  ))}
                </div>
                {currentStep.isLast ? (
                  <button onClick={endTour} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg bg-gradient-to-r from-rose-400 to-pink-500 hover:shadow-xl transition-all">
                    <Sparkles size={14} /> Finish
                  </button>
                ) : (
                  <button onClick={nextStep} className="flex items-center gap-1 px-4 py-2 rounded-xl text-xs font-bold text-white shadow-lg bg-gradient-to-r from-rose-400 to-pink-500 hover:shadow-xl transition-all">
                    Next <ChevronRight size={14} />
                  </button>
                )}
              </div>
            </div>
          </div>
        </>
      )}

      {active && minimized && (
        <button onClick={() => setMinimized(false)} className="fixed bottom-6 right-6 z-[999] flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-rose-400 to-pink-500 text-white rounded-full shadow-xl hover:shadow-2xl transition-all">
          <img src="/wizard.png" alt="Merlin" className="w-8 h-8 object-contain rounded-full bg-white/20 p-0.5" />
          <span className="text-xs font-bold">Continue Tour ({step + 1}/{TOUR_STEPS.length})</span>
        </button>
      )}
    </>
  )
}