import { useState, useRef } from 'react'
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useStaff } from '../../../context/StaffContext'

const LOGO_URL = '/logo.png'

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

const Field = ({ label, name, form, setForm, type = 'text', placeholder, half, className = '' }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'} ${className}`}>
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <input type={type} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all bg-white placeholder:text-gray-300" />
  </div>
)

const TextArea = ({ label, name, form, setForm, placeholder, rows = 4 }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <textarea value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} rows={rows} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-orange-400/30 focus:border-orange-400 transition-all bg-white resize-none placeholder:text-gray-300" />
  </div>
)

const CheckboxGroup = ({ label, options, name, form, setForm }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">{label}</label>}
    <div className="flex flex-wrap gap-3">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input type="checkbox" checked={(form[name] || []).includes(opt)} onChange={() => { const c = form[name] || []; setForm({ ...form, [name]: c.includes(opt) ? c.filter(v => v !== opt) : [...c, opt] }) }} className="w-4 h-4 rounded border-gray-300 text-orange-500 focus:ring-orange-400" />
          <span className="text-sm text-gray-700 group-hover:text-gray-900">{opt}</span>
        </label>
      ))}
    </div>
  </div>
)

const RadioGroup = ({ label, options, name, form, setForm }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">{label}</label>}
    <div className="flex gap-4">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" checked={form[name] === opt} onChange={() => setForm({ ...form, [name]: opt })} className="w-4 h-4 border-gray-300 text-orange-500 focus:ring-orange-400" />
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

export default function IncidentForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({
    employee_name: staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : '',
    date_signed: new Date().toISOString().split('T')[0],
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.employee_name) { alert('Please fill in required fields'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'incident_report',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: form,
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Incident Report submitted successfully!')
      onBack()
    } catch (err) {
      console.error(err)
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium"><ArrowLeft size={18} /> Back to Forms</button>

      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">
        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Incident Report Form</h1>
            <p className="text-sm text-gray-500 mt-0.5"></p>
          </div>
          <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* ═══ PAGE 1: Type of Incident ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Type of Incident</SectionHeader>
            <RadioGroup label="Is it a reportable incident? NDIS or any other authorities?" options={['Yes', 'No']} name="ndis_reportable" form={form} setForm={setForm} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <Field label="Name of employee providing report" name="employee_name" form={form} setForm={setForm} placeholder="Full name" />
            <Field label="Names of witnesses (if applicable)" name="witness_names" form={form} setForm={setForm} placeholder="Witness names" />
            <CheckboxGroup label="This report is about a (please circle)" options={['Hazard', 'Near-miss Incident', 'Concern/Change']} name="report_type" form={form} setForm={setForm} />
            <Field label="Date and time of when issue occurred or was noticed" name="date_time_occurred" form={form} setForm={setForm} type="datetime-local" />
            <Field label="Location / Address" name="location" form={form} setForm={setForm} placeholder="Where did it happen?" />
            <Field label="Name of Client" name="client_name" form={form} setForm={setForm} placeholder="Client's full name" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Description of issue being reported (sketch if required)</SectionHeader>
            <TextArea name="description" form={form} setForm={setForm} placeholder="Detailed description of the issue being reported..." rows={5} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Immediate action taken (if taken)</SectionHeader>
            <TextArea name="immediate_action" form={form} setForm={setForm} placeholder="Describe immediate actions taken..." rows={4} />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Suggested further action (include suggestions for reducing or eliminating the issue &amp; timelines)</SectionHeader>
            <TextArea name="suggested_action" form={form} setForm={setForm} placeholder="Suggestions for further action and timelines..." rows={4} />
          </div>

          {/* ═══ PAGE 2: Reported to / Signed ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <Field label="Reported to: (Name of Manager/Coordinator)" name="reported_to" form={form} setForm={setForm} placeholder="Manager or Coordinator name" half />
            <Field label="Date" name="reported_date" form={form} setForm={setForm} type="date" half />
            <Field label="Signed by: (Name of Employee)" name="signed_by_employee" form={form} setForm={setForm} placeholder="Employee name" half />
            <Field label="Date" name="date_signed" form={form} setForm={setForm} type="date" half />
          </div>

          <div className="col-span-2 p-3 bg-amber-50 border border-amber-200 rounded-lg">
            <p className="text-xs text-amber-800 font-bold">*Note: Forward Incident Report Form immediately to Unit Manager/Coordinator</p>
          </div>

          {/* ═══ Incident Investigation ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Incident Investigation</SectionHeader>
            <Field label="Date received at head office" name="date_received_head_office" form={form} setForm={setForm} type="date" />
            <CheckboxGroup label="Please circle" options={['Hazard', 'Near-miss', 'Incident', 'Concern/Change']} name="investigation_type" form={form} setForm={setForm} />
            <Field label="Name of employee" name="investigation_employee" form={form} setForm={setForm} placeholder="Employee name" />
            <Field label="Name of client" name="investigation_client" form={form} setForm={setForm} placeholder="Client name" />
          </div>

          {/* ═══ Short-Term Responses ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Short-Term Responses</SectionHeader>
            <div className="col-span-2 p-3 bg-gray-50 border border-gray-200 rounded-lg">
              <p className="text-xs text-gray-600 leading-relaxed">Action/resolution of the issue and feedback to the worker is required immediately if urgent, within 2 days if the situation requires a prompt response and within 5 days for others. Indicate action taken by Unit Manager/Coordinator: (include discussion &amp; feedback with employee, client/carer) to resolve the issue or provide an interim resolution.</p>
            </div>
            <TextArea name="short_term_response" form={form} setForm={setForm} placeholder="Describe short-term actions and resolutions taken..." rows={4} />
            <Field label="Signed by" name="short_term_signed_by" form={form} setForm={setForm} placeholder="Name" half />
            <Field label="Date" name="short_term_date" form={form} setForm={setForm} type="date" half />
          </div>

          {/* ═══ Response Timeframe ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Response Timeframe</SectionHeader>
            <div className="col-span-2 grid grid-cols-2 gap-3">
              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form.response_timeframe || []).includes('Immediate')} onChange={() => { const c = form.response_timeframe || []; setForm({ ...form, response_timeframe: c.includes('Immediate') ? c.filter(v => v !== 'Immediate') : [...c, 'Immediate'] }) }} className="w-4 h-4 rounded border-gray-300 text-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Immediate</span>
                </label>
                <span className="text-sm text-gray-600 font-semibold">Urgent</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <Field label="Date" name="immediate_date" form={form} setForm={setForm} type="date" />
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form.response_timeframe || []).includes('Within 2 days')} onChange={() => { const c = form.response_timeframe || []; setForm({ ...form, response_timeframe: c.includes('Within 2 days') ? c.filter(v => v !== 'Within 2 days') : [...c, 'Within 2 days'] }) }} className="w-4 h-4 rounded border-gray-300 text-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Within 2 days</span>
                </label>
                <span className="text-sm text-gray-600 font-semibold">Prompt response required</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <Field label="Date" name="within_2_days_date" form={form} setForm={setForm} type="date" />
              </div>

              <div className="flex items-center gap-3 p-3 border border-gray-200 rounded-lg">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={(form.response_timeframe || []).includes('Within 5 days')} onChange={() => { const c = form.response_timeframe || []; setForm({ ...form, response_timeframe: c.includes('Within 5 days') ? c.filter(v => v !== 'Within 5 days') : [...c, 'Within 5 days'] }) }} className="w-4 h-4 rounded border-gray-300 text-orange-500" />
                  <span className="text-sm font-bold text-gray-700">Within 5 days</span>
                </label>
                <span className="text-sm text-gray-600 font-semibold">Other matters</span>
              </div>
              <div className="p-3 border border-gray-200 rounded-lg">
                <Field label="Date" name="within_5_days_date" form={form} setForm={setForm} type="date" />
              </div>
            </div>
          </div>

          {/* ═══ PAGE 3: Long-Term Responses ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Long-Term Responses</SectionHeader>
            <TextArea label="If further action is required, outline this and include timelines for review/resolution" name="long_term_response" form={form} setForm={setForm} placeholder="Long-term actions, timelines, and resolution plan..." rows={5} />
          </div>

          {/* ═══ Outcome Checkboxes ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <div className="col-span-2 grid grid-cols-2 gap-2">
              {[
                'Reassessment required (if yes, completed and filed with this report)',
                'Issue, action/outcome entered in client file',
                'Issue reduced',
                'The incident recorded in the Incidents Register',
                'Issue resolved/eliminated',
                'The incident recorded in the Violent Incidents Register',
              ].map(opt => (
                <label key={opt} className="flex items-start gap-2 p-2.5 border border-gray-200 rounded-lg cursor-pointer hover:bg-gray-50 transition-colors">
                  <input type="checkbox" checked={(form.outcome_checks || []).includes(opt)} onChange={() => { const c = form.outcome_checks || []; setForm({ ...form, outcome_checks: c.includes(opt) ? c.filter(v => v !== opt) : [...c, opt] }) }} className="w-4 h-4 rounded border-gray-300 text-orange-500 mt-0.5 shrink-0" />
                  <span className="text-xs text-gray-700 leading-snug">{opt}</span>
                </label>
              ))}
            </div>
          </div>

          {/* ═══ Manager Sign-off ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <Field label="Manager / Coordinator" name="manager_name" form={form} setForm={setForm} placeholder="Manager's full name" half />
            <Field label="Date" name="manager_date" form={form} setForm={setForm} type="date" half />
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">Manager Signature</label>
              <SignaturePad value={form.manager_signature} onChange={v => setForm({ ...form, manager_signature: v })} />
            </div>
            <Field label="Reported to the Health and Safety Committee" name="reported_health_safety" form={form} setForm={setForm} placeholder="Details..." />
          </div>

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
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-600 hover:to-orange-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Incident Report</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}