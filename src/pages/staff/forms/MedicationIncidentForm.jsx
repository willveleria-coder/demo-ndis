import { useState, useRef } from 'react'
import { ArrowLeft, Send, Loader2, Trash2, Plus } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useStaff } from '../../../context/StaffContext'

const LOGO_URL = 'https://ojobajaedarprixqecxr.supabase.co/storage/v1/object/public/documents/logo.png'

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const getPos = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e; return { x: touch.clientX - rect.left, y: touch.clientY - rect.top } }
  const startDraw = (e) => { e.preventDefault(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  const draw = (e) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineWidth = 2; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a1a'; ctx.lineTo(pos.x, pos.y); ctx.stroke() }
  const endDraw = () => { setDrawing(false); if (canvasRef.current) onChange(canvasRef.current.toDataURL()) }
  const clear = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); onChange('') }
  return (
    <div>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas ref={canvasRef} width={500} height={120} className="w-full cursor-crosshair touch-none" onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <button onClick={clear} className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" type="button"><Trash2 size={14} className="text-gray-500" /></button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Draw your signature above</p>
    </div>
  )
}

function MiniSig({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const [signed, setSigned] = useState(!!value)
  const getPos = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e; return { x: (touch.clientX - rect.left) * (canvasRef.current.width / rect.width), y: (touch.clientY - rect.top) * (canvasRef.current.height / rect.height) } }
  const startDraw = (e) => { e.preventDefault(); e.stopPropagation(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  const draw = (e) => { if (!drawing) return; e.preventDefault(); e.stopPropagation(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineWidth = 1.5; ctx.lineCap = 'round'; ctx.strokeStyle = '#1a1a1a'; ctx.lineTo(pos.x, pos.y); ctx.stroke() }
  const endDraw = () => { if (drawing) { setDrawing(false); setSigned(true); onChange(canvasRef.current.toDataURL()) } }
  const clear = (e) => { e.stopPropagation(); const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); onChange(''); setSigned(false) }
  return (
    <div className="relative group">
      <canvas ref={canvasRef} width={200} height={50} className={`w-full h-[34px] rounded-lg cursor-crosshair touch-none border ${signed ? 'border-emerald-300 bg-emerald-50/30' : 'border-gray-200 bg-white'}`} onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw} onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
      {signed && <button onClick={clear} className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity" type="button"><Trash2 size={8} /></button>}
      {!signed && <p className="absolute inset-0 flex items-center justify-center text-[9px] text-gray-300 pointer-events-none">Sign here</p>}
    </div>
  )
}

const Field = ({ label, name, form, setForm, type = 'text', placeholder, half, className = '' }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'} ${className}`}>
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <input type={type} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all bg-white placeholder:text-gray-300" />
  </div>
)

const TextArea = ({ label, name, form, setForm, placeholder, rows = 4 }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <textarea value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} rows={rows} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-400/30 focus:border-red-400 transition-all bg-white resize-none placeholder:text-gray-300" />
  </div>
)

const RadioGroup = ({ label, options, name, form, setForm }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">{label}</label>}
    <div className="flex gap-4">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" checked={form[name] === opt} onChange={() => setForm({ ...form, [name]: opt })} className="w-4 h-4 border-gray-300 text-red-500 focus:ring-red-400" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
        </label>
      ))}
    </div>
  </div>
)

const SectionHeader = ({ children }) => (
  <div className="col-span-2 bg-gray-900 text-white px-4 py-2 rounded-lg">
    <h3 className="text-sm font-bold">{children}</h3>
  </div>
)

const Divider = () => <div className="col-span-2 border-t border-gray-200 my-1" />

const emptyAction = () => ({ description: '', by_when: '', by_whom: '', completed: '', date: '' })
const emptyCompletedBy = () => ({ staff_name: '', staff_position: '', signature: '', closed: '', date: '' })

export default function MedicationIncidentForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({
    service_user_name: '',
    dob: '',
    date_of_incident: new Date().toISOString().split('T')[0],
    incident_reported_by: staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : '',
  })
  const [immediateActions, setImmediateActions] = useState([emptyAction(), emptyAction(), emptyAction()])
  const [permanentActions, setPermanentActions] = useState([emptyAction(), emptyAction(), emptyAction()])
  const [completedBy, setCompletedBy] = useState([emptyCompletedBy(), emptyCompletedBy()])
  const [submitting, setSubmitting] = useState(false)

  const updateAction = (list, setList, idx, key, val) => { const u = [...list]; u[idx] = { ...u[idx], [key]: val }; setList(u) }
  const updateCompleted = (idx, key, val) => { const u = [...completedBy]; u[idx] = { ...u[idx], [key]: val }; setCompletedBy(u) }

  const inputClass = "w-full px-1.5 py-2 border border-gray-200 rounded-lg text-xs focus:outline-none focus:ring-1 focus:ring-red-400 bg-white"

  const handleSubmit = async () => {
    if (!form.service_user_name) { alert('Please enter Service User name'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'medication_incident',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: { ...form, immediate_actions: immediateActions, permanent_actions: permanentActions, completed_by: completedBy },
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Medication Incident Report submitted successfully!')
      onBack()
    } catch (err) {
      console.error(err)
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const ActionTable = ({ rows, setRows, label }) => (
    <div className="space-y-2">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse min-w-[600px]">
          <thead>
            <tr className="bg-gray-900 text-white">
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tl-lg">Action Description</th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left w-[110px]">By When</th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left w-[120px]">By Whom</th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-center w-[90px]">Completed</th>
              <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tr-lg w-[100px]">Date</th>
              <th className="w-8"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row, idx) => (
              <tr key={idx} className="border-b border-gray-100">
                <td className="p-1"><input type="text" value={row.description} onChange={e => updateAction(rows, setRows, idx, 'description', e.target.value)} placeholder="Action taken..." className={`${inputClass} placeholder:text-gray-300`} /></td>
                <td className="p-1"><input type="date" value={row.by_when} onChange={e => updateAction(rows, setRows, idx, 'by_when', e.target.value)} className={inputClass} /></td>
                <td className="p-1"><input type="text" value={row.by_whom} onChange={e => updateAction(rows, setRows, idx, 'by_whom', e.target.value)} placeholder="Name..." className={`${inputClass} placeholder:text-gray-300`} /></td>
                <td className="p-1">
                  <div className="flex justify-center gap-2">
                    {['Yes', 'No'].map(o => (
                      <label key={o} className="flex items-center gap-1 cursor-pointer">
                        <input type="radio" checked={row.completed === o} onChange={() => updateAction(rows, setRows, idx, 'completed', o)} className="w-3 h-3 text-red-500" />
                        <span className="text-[10px] text-gray-600">{o}</span>
                      </label>
                    ))}
                  </div>
                </td>
                <td className="p-1"><input type="date" value={row.date} onChange={e => updateAction(rows, setRows, idx, 'date', e.target.value)} className={inputClass} /></td>
                <td className="p-1">
                  {rows.length > 1 && <button onClick={() => { const u = rows.filter((_, i) => i !== idx); setRows(u) }} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <button onClick={() => setRows([...rows, emptyAction()])} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><Plus size={14} /> Add row</button>
    </div>
  )

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium"><ArrowLeft size={18} /> Back to Forms</button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Medication Incident Report</h1>
            <p className="text-sm text-gray-500 mt-0.5">Maple Care Support</p>
          </div>
          <img src={LOGO_URL} alt="MCS Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* ═══ General Information ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>General Information</SectionHeader>
            <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
              <p className="text-xs text-red-700 font-bold">This form MUST be completed on each occasion where there is an incident involving Service Users' medication/s.</p>
            </div>
            <Field label="Service User's Name" name="service_user_name" form={form} setForm={setForm} placeholder="Full name" half />
            <Field label="DOB" name="dob" form={form} setForm={setForm} type="date" half />
            <Field label="Date of Incident" name="date_of_incident" form={form} setForm={setForm} type="date" half />
            <Field label="Incident Reported By" name="incident_reported_by" form={form} setForm={setForm} placeholder="Your name" half />
            <Field label="Parent/Guardian's name and contact details" name="parent_guardian_contact" form={form} setForm={setForm} placeholder="Name and contact details..." />
            <TextArea label="Name of Medication/s and details of correct administration of the medication/s (e.g. dosage, time, frequency)" name="medication_details" form={form} setForm={setForm} placeholder="Medication names, dosage, time, frequency..." rows={4} />
          </div>

          {/* ═══ Details of Immediate Action ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Details of Immediate Action</SectionHeader>
          </div>
          <ActionTable rows={immediateActions} setRows={setImmediateActions} />

          {/* ═══ Details of Incident ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Details of Incident</SectionHeader>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[600px]">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tl-lg w-[180px]">Name of Medication</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left">Incident (e.g. missed medication, wrong medication, incorrect dosage, given to wrong person, refusal to take medication, etc)</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tr-lg w-[200px]">Factors (if any) contributing to incident</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-gray-100">
                  <td className="p-1"><textarea value={form.incident_med_name || ''} onChange={e => setForm({ ...form, incident_med_name: e.target.value })} placeholder="Medication name..." rows={4} className={`${inputClass} resize-none placeholder:text-gray-300`} /></td>
                  <td className="p-1"><textarea value={form.incident_description || ''} onChange={e => setForm({ ...form, incident_description: e.target.value })} placeholder="Describe the incident..." rows={4} className={`${inputClass} resize-none placeholder:text-gray-300`} /></td>
                  <td className="p-1"><textarea value={form.contributing_factors || ''} onChange={e => setForm({ ...form, contributing_factors: e.target.value })} placeholder="Contributing factors..." rows={4} className={`${inputClass} resize-none placeholder:text-gray-300`} /></td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* ═══ Medical Assistance ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <TextArea label="Was medical assistance sought/required? Any other relevant details" name="medical_assistance" form={form} setForm={setForm} placeholder="Details of medical assistance..." rows={4} />
          </div>

          {/* ═══ Communication ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Communication</SectionHeader>
            <RadioGroup label="Is this an NDIS reportable incident?" options={['Yes', 'No']} name="ndis_reportable" form={form} setForm={setForm} />
            {form.ndis_reportable === 'Yes' && (
              <TextArea label="If YES, give details (staff member notifying, name of person notified, date, time)" name="ndis_report_details" form={form} setForm={setForm} placeholder="Staff member, person notified, date, time..." rows={3} />
            )}
            <Divider />
            <RadioGroup label="Has Service User's family/guardian been notified of incident?" options={['Yes', 'No']} name="family_notified" form={form} setForm={setForm} />
            {form.family_notified === 'Yes' && (
              <TextArea label="If YES, give details (staff member notifying, name of person notified, date, time)" name="family_notification_details" form={form} setForm={setForm} placeholder="Staff member, person notified, date, time..." rows={3} />
            )}
            {form.family_notified === 'No' && (
              <TextArea label="If NO, why not?" name="family_not_notified_reason" form={form} setForm={setForm} placeholder="Reason for not notifying..." rows={3} />
            )}
          </div>

          {/* ═══ Details of Permanent Action ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Details of Permanent Action</SectionHeader>
          </div>
          <ActionTable rows={permanentActions} setRows={setPermanentActions} />

          {/* ═══ Form Completed By ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Form Completed By</SectionHeader>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[700px]">
              <thead>
                <tr className="bg-gray-900 text-white">
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tl-lg">Staff Name</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left w-[140px]">Staff Position</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-center w-[130px]">Signature</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-center w-[110px]">Actions Effectively Closed</th>
                  <th className="px-2 py-2 text-[10px] font-bold uppercase tracking-wider text-left rounded-tr-lg w-[100px]">Date</th>
                  <th className="w-8"></th>
                </tr>
              </thead>
              <tbody>
                {completedBy.map((row, idx) => (
                  <tr key={idx} className="border-b border-gray-100">
                    <td className="p-1"><input type="text" value={row.staff_name} onChange={e => updateCompleted(idx, 'staff_name', e.target.value)} placeholder="Full name..." className={`${inputClass} placeholder:text-gray-300`} /></td>
                    <td className="p-1"><input type="text" value={row.staff_position} onChange={e => updateCompleted(idx, 'staff_position', e.target.value)} placeholder="Position..." className={`${inputClass} placeholder:text-gray-300`} /></td>
                    <td className="p-1"><MiniSig value={row.signature} onChange={v => updateCompleted(idx, 'signature', v)} /></td>
                    <td className="p-1">
                      <div className="flex justify-center gap-2">
                        {['Yes', 'No'].map(o => (
                          <label key={o} className="flex items-center gap-1 cursor-pointer">
                            <input type="radio" checked={row.closed === o} onChange={() => updateCompleted(idx, 'closed', o)} className="w-3 h-3 text-red-500" />
                            <span className="text-[10px] text-gray-600">{o}</span>
                          </label>
                        ))}
                      </div>
                    </td>
                    <td className="p-1"><input type="date" value={row.date} onChange={e => updateCompleted(idx, 'date', e.target.value)} className={inputClass} /></td>
                    <td className="p-1">
                      {completedBy.length > 1 && <button onClick={() => setCompletedBy(completedBy.filter((_, i) => i !== idx))} className="p-1 text-gray-300 hover:text-red-500"><Trash2 size={12} /></button>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button onClick={() => setCompletedBy([...completedBy, emptyCompletedBy()])} className="flex items-center gap-1 text-xs font-semibold text-red-600 hover:text-red-700"><Plus size={14} /> Add row</button>

          {/* ═══ Footer ═══ */}
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
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-red-500 to-rose-500 hover:from-red-600 hover:to-rose-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Medication Incident Report</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}