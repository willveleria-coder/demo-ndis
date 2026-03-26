import { useState, useRef } from 'react'
import { ArrowLeft, Send, Loader2, Trash2, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useStaff } from '../../../context/StaffContext'

const LOGO_URL = '/logo.png'

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(!!value)
  const getPos = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e; return { x: touch.clientX - rect.left, y: touch.clientY - rect.top } }
  const startDraw = (e) => { e.preventDefault(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  const draw = (e) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a1a'; ctx.lineTo(pos.x, pos.y); ctx.stroke() }
  const endDraw = () => { if (drawing) { setDrawing(false); setSigned(true); onChange(canvasRef.current.toDataURL()) } }
  const clear = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); onChange(''); setSigned(false) }
  return (
    <div>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={500} height={140} className="w-full cursor-crosshair touch-none" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        {signed && <button onClick={clear} className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" type="button"><Trash2 size={14} className="text-gray-500" /></button>}
        {!signed && <p className="absolute inset-0 flex items-center justify-center text-sm text-gray-300 pointer-events-none">Sign here</p>}
      </div>
    </div>
  )
}

const emptyEntry = () => ({ date: '', time_am: '', time_pm: '', medication: '', dose: '', route: '', exp_date: '', comments: '', signature: '' })

export default function MedicationChartForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({
    participant_name: '',
    dob: '',
  })
  const [entries, setEntries] = useState([emptyEntry(), emptyEntry()])
  const [submitting, setSubmitting] = useState(false)

  const updateEntry = (idx, key, val) => {
    const u = [...entries]
    u[idx] = { ...u[idx], [key]: val }
    setEntries(u)
  }

  const addEntry = () => setEntries([...entries, emptyEntry()])
  const removeEntry = (idx) => { if (entries.length > 1) setEntries(entries.filter((_, i) => i !== idx)) }

  const handleSubmit = async () => {
    if (!form.participant_name) { alert('Please enter participant name'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'medication_chart',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: { ...form, entries },
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Medication Chart submitted successfully!')
      onBack()
    } catch (err) {
      console.error(err)
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-400/30 focus:border-blue-400 transition-all bg-white placeholder:text-gray-300"

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium"><ArrowLeft size={18} /> Back to Forms</button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Medication Chart Form</h1>
            <p className="text-sm text-gray-500 mt-0.5"></p>
          </div>
          <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* Participant Info */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Participant Name</label>
              <input type="text" value={form.participant_name} onChange={e => setForm({ ...form, participant_name: e.target.value })} placeholder="Full name" className={inputClass} />
            </div>
            <div>
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">DOB</label>
              <input type="date" value={form.dob} onChange={e => setForm({ ...form, dob: e.target.value })} className={inputClass} />
            </div>
          </div>

          {/* Medication Entries */}
          <div className="space-y-4">
            {entries.map((entry, idx) => (
              <div key={idx} className="border border-gray-200 rounded-xl overflow-hidden">
                {/* Entry Header */}
                <div className="bg-gray-900 px-4 py-2 flex items-center justify-between">
                  <p className="text-[10px] font-bold text-white uppercase tracking-widest">Entry {idx + 1}</p>
                  {entries.length > 1 && (
                    <button onClick={() => removeEntry(idx)} className="p-1 text-gray-400 hover:text-red-400 transition-colors"><Trash2 size={14} /></button>
                  )}
                </div>

                <div className="grid grid-cols-3 divide-x divide-gray-200">
                  {/* Column 1: Date/Time */}
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Date / Time</p>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Date</label>
                      <input type="date" value={entry.date} onChange={e => updateEntry(idx, 'date', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">AM Time</label>
                      <input type="time" value={entry.time_am} onChange={e => updateEntry(idx, 'time_am', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">PM Time</label>
                      <input type="time" value={entry.time_pm} onChange={e => updateEntry(idx, 'time_pm', e.target.value)} className={inputClass} />
                    </div>
                  </div>

                  {/* Column 2: Details of Injection Given */}
                  <div className="p-4 space-y-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Details of Injection Given</p>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Medication</label>
                      <input type="text" value={entry.medication} onChange={e => updateEntry(idx, 'medication', e.target.value)} placeholder="Medication name..." className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Dose</label>
                      <input type="text" value={entry.dose} onChange={e => updateEntry(idx, 'dose', e.target.value)} placeholder="e.g. 10mg, 2 tablets..." className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Route</label>
                      <input type="text" value={entry.route} onChange={e => updateEntry(idx, 'route', e.target.value)} placeholder="e.g. oral, topical, injection..." className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Exp Date</label>
                      <input type="date" value={entry.exp_date} onChange={e => updateEntry(idx, 'exp_date', e.target.value)} className={inputClass} />
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-gray-500 uppercase tracking-wide mb-1">Comments</label>
                      <textarea value={entry.comments} onChange={e => updateEntry(idx, 'comments', e.target.value)} placeholder="Any additional notes..." rows={2} className={`${inputClass} resize-none`} />
                    </div>
                  </div>

                  {/* Column 3: Signature */}
                  <div className="p-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Signature</p>
                    <SignaturePad value={entry.signature} onChange={v => updateEntry(idx, 'signature', v)} />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add Entry */}
          <button onClick={addEntry} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-blue-600 hover:border-blue-300 hover:bg-blue-50/50 flex items-center justify-center gap-2 transition-all">
            <Plus size={16} /> Add another entry
          </button>

          {/* Footer */}
          <div className="border-t border-gray-200 pt-4">
            <div className="flex items-center justify-between text-[10px] text-gray-400">
              <p>Drafted by: Healthcare Consulting</p>
              <p>Date of review: May 2025</p>
              <p>Next Review Date: May 2026</p>
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button onClick={onBack} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all">Cancel</button>
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-blue-500 to-indigo-500 hover:from-blue-600 hover:to-indigo-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Medication Chart</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}