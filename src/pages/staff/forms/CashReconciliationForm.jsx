import { useState, useRef, useEffect } from 'react'
import { ArrowLeft, Send, Loader2, Trash2, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useStaff } from '../../../context/StaffContext'

const LOGO_URL = 'https://ojobajaedarprixqecxr.supabase.co/storage/v1/object/public/documents/logo.png'

function MiniSig({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(false)

  useEffect(() => {
    if (value && canvasRef.current) setSigned(true)
  }, [value])

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return { x: (touch.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (touch.clientY - rect.top) * (canvasRef.current.height / rect.height) }
  }
  const startDraw = (e) => { e.preventDefault(); e.stopPropagation(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  const draw = (e) => { if (!drawing) return; e.preventDefault(); e.stopPropagation(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a1a'; ctx.lineTo(pos.x, pos.y); ctx.stroke() }
  const endDraw = () => { if (drawing) { setDrawing(false); setSigned(true); onChange(canvasRef.current.toDataURL()) } }
  const clear = (e) => { e.stopPropagation(); const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); onChange(''); setSigned(false) }

  return (
    <div className="relative group">
      <canvas
        ref={canvasRef} width={200} height={50}
        className={`w-full h-[34px] rounded-lg cursor-crosshair touch-none border ${signed ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 bg-white'}`}
        onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
        onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
      />
      {signed && (
        <button onClick={clear} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" type="button">
          <Trash2 size={8} />
        </button>
      )}
      {!signed && <p className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-300 pointer-events-none">Sign here</p>}
    </div>
  )
}

const emptyRow = () => ({ date: '', description: '', amount_given: '', amount_spent: '', change_given: '', receipt: '', client_sig: '', worker_sig: '' })

export default function CashReconciliationForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({
    participant_name: '',
    support_worker: staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : '',
  })
  const [rows, setRows] = useState([emptyRow(), emptyRow(), emptyRow()])
  const [submitting, setSubmitting] = useState(false)

  const updateRow = (idx, key, val) => {
    const updated = [...rows]
    updated[idx] = { ...updated[idx], [key]: val }
    setRows(updated)
  }

  const addRow = () => setRows([...rows, emptyRow()])
  const removeRow = (idx) => { if (rows.length > 1) setRows(rows.filter((_, i) => i !== idx)) }

  const totalGiven = rows.reduce((a, r) => a + (parseFloat(r.amount_given) || 0), 0)
  const totalSpent = rows.reduce((a, r) => a + (parseFloat(r.amount_spent) || 0), 0)
  const totalChange = rows.reduce((a, r) => a + (parseFloat(r.change_given) || 0), 0)

  const handleSubmit = async () => {
    if (!form.participant_name) { alert('Please enter participant name'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'cash_reconciliation',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: { ...form, items: rows, totals: { given: totalGiven, spent: totalSpent, change: totalChange } },
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Cash Reconciliation Form submitted successfully!')
      onBack()
    } catch (err) {
      console.error(err)
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const inputClass = "w-full px-1.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-emerald-400 bg-white"

  return (
    <div className="max-w-4xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium"><ArrowLeft size={18} /> Back to Forms</button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Cash Reconciliation Form</h1>
            <p className="text-sm text-gray-500 mt-0.5">Maple Care Support</p>
          </div>
          <img src={LOGO_URL} alt="MCS Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* Participant Name */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Participant's Name</label>
            <input type="text" value={form.participant_name} onChange={e => setForm({ ...form, participant_name: e.target.value })} placeholder="Full name of participant" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all bg-white placeholder:text-gray-300" />
          </div>

          {/* Table */}
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[900px]">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-left rounded-tl-lg w-[90px]">Date</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-left">Expenditure Description</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-right w-[85px]">Amount Given</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-right w-[85px]">Amount Spent</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-right w-[80px]">Change Given</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center w-[55px]">Receipt Y/N</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center w-[130px]">Client Signature</th>
                  <th className="px-2 py-2.5 text-[10px] font-bold uppercase tracking-wider text-center rounded-tr-lg w-[130px]">Support Worker Signature</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100 hover:bg-gray-50/50">
                    <td className="p-1">
                      <input type="date" value={row.date} onChange={e => updateRow(idx, 'date', e.target.value)} className={inputClass} />
                    </td>
                    <td className="p-1">
                      <input type="text" value={row.description} onChange={e => updateRow(idx, 'description', e.target.value)} placeholder="What was purchased..." className={`${inputClass} placeholder:text-gray-300`} />
                    </td>
                    <td className="p-1">
                      <input type="number" step="0.01" value={row.amount_given} onChange={e => updateRow(idx, 'amount_given', e.target.value)} placeholder="$0.00" className={`${inputClass} text-right placeholder:text-gray-300`} />
                    </td>
                    <td className="p-1">
                      <input type="number" step="0.01" value={row.amount_spent} onChange={e => updateRow(idx, 'amount_spent', e.target.value)} placeholder="$0.00" className={`${inputClass} text-right placeholder:text-gray-300`} />
                    </td>
                    <td className="p-1">
                      <input type="number" step="0.01" value={row.change_given} onChange={e => updateRow(idx, 'change_given', e.target.value)} placeholder="$0.00" className={`${inputClass} text-right placeholder:text-gray-300`} />
                    </td>
                    <td className="p-1">
                      <select value={row.receipt} onChange={e => updateRow(idx, 'receipt', e.target.value)} className={`${inputClass} text-center`}>
                        <option value="">-</option>
                        <option value="Y">Y</option>
                        <option value="N">N</option>
                      </select>
                    </td>
                    <td className="p-1">
                      <MiniSig value={row.client_sig} onChange={v => updateRow(idx, 'client_sig', v)} />
                    </td>
                    <td className="p-1">
                      <MiniSig value={row.worker_sig} onChange={v => updateRow(idx, 'worker_sig', v)} />
                    </td>
                    <td className="p-1">
                      {rows.length > 1 && (
                        <button onClick={() => removeRow(idx)} className="p-1 text-gray-300 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-gray-50 border-t-2 border-gray-300">
                  <td className="px-2 py-2.5 text-xs font-bold text-gray-700" colSpan={2}>Totals</td>
                  <td className="px-2 py-2.5 text-xs font-bold text-gray-700 text-right">${totalGiven.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-xs font-bold text-gray-700 text-right">${totalSpent.toFixed(2)}</td>
                  <td className="px-2 py-2.5 text-xs font-bold text-gray-700 text-right">${totalChange.toFixed(2)}</td>
                  <td colSpan={4}></td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Add Row */}
          <button onClick={addRow} className="w-full py-2.5 border-2 border-dashed border-gray-200 rounded-xl text-sm font-semibold text-emerald-600 hover:border-emerald-300 hover:bg-emerald-50/50 flex items-center justify-center gap-2 transition-all">
            <Plus size={16} /> Add another row
          </button>

          {/* Support Worker */}
          <div>
            <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Support Worker Name</label>
            <input type="text" value={form.support_worker} onChange={e => setForm({ ...form, support_worker: e.target.value })} placeholder="Your full name" className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-emerald-400/30 focus:border-emerald-400 transition-all bg-white placeholder:text-gray-300" />
          </div>

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
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Cash Reconciliation</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}