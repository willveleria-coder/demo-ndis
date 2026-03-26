import { useState, useRef } from 'react'
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react'
import { supabase } from '../../../lib/supabase'
import { useStaff } from '../../../context/StaffContext'

const LOGO_URL = '/logo.png'

function SignaturePad({ value, onChange }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)

  const getPos = (e) => {
    const rect = canvasRef.current.getBoundingClientRect()
    const touch = e.touches ? e.touches[0] : e
    return { x: touch.clientX - rect.left, y: touch.clientY - rect.top }
  }

  const startDraw = (e) => {
    e.preventDefault()
    setDrawing(true)
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e) => {
    if (!drawing) return
    e.preventDefault()
    const ctx = canvasRef.current.getContext('2d')
    const pos = getPos(e)
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.strokeStyle = '#1a1a1a'
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
  }

  const endDraw = () => {
    setDrawing(false)
    if (canvasRef.current) onChange(canvasRef.current.toDataURL())
  }

  const clear = () => {
    const ctx = canvasRef.current.getContext('2d')
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height)
    onChange('')
  }

  return (
    <div>
      <div className="relative border-2 border-gray-300 rounded-lg overflow-hidden bg-white">
        <canvas
          ref={canvasRef} width={500} height={120}
          className="w-full cursor-crosshair touch-none"
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw}
        />
        <button onClick={clear} className="absolute top-2 right-2 p-1.5 bg-gray-100 hover:bg-gray-200 rounded-lg transition-colors" type="button">
          <Trash2 size={14} className="text-gray-500" />
        </button>
      </div>
      <p className="text-[10px] text-gray-400 mt-1">Draw your signature above</p>
    </div>
  )
}

const Field = ({ label, name, form, setForm, type = 'text', placeholder, half, className = '' }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'} ${className}`}>
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <input
      type={type}
      value={form[name] || ''}
      onChange={e => setForm({ ...form, [name]: e.target.value })}
      placeholder={placeholder || label}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white placeholder:text-gray-300"
    />
  </div>
)

const TextArea = ({ label, name, form, setForm, placeholder, rows = 4 }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <textarea
      value={form[name] || ''}
      onChange={e => setForm({ ...form, [name]: e.target.value })}
      placeholder={placeholder || label}
      rows={rows}
      className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-400/30 focus:border-amber-400 transition-all bg-white resize-none placeholder:text-gray-300"
    />
  </div>
)

const CheckboxGroup = ({ label, options, name, form, setForm }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">{label}</label>}
    <div className="flex flex-wrap gap-3">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input
            type="checkbox"
            checked={(form[name] || []).includes(opt)}
            onChange={() => {
              const current = form[name] || []
              setForm({ ...form, [name]: current.includes(opt) ? current.filter(v => v !== opt) : [...current, opt] })
            }}
            className="w-4 h-4 rounded border-gray-300 text-amber-500 focus:ring-amber-400"
          />
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
          <input
            type="radio"
            checked={form[name] === opt}
            onChange={() => setForm({ ...form, [name]: opt })}
            className="w-4 h-4 border-gray-300 text-amber-500 focus:ring-amber-400"
          />
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

export default function HazardForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({
    persons_name: staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : '',
    date: new Date().toISOString().split('T')[0],
    person_type: [],
  })
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    if (!form.persons_name || !form.date) { alert('Please fill in required fields'); return }
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'hazard_report',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: form,
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Hazard Report submitted successfully!')
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
      {/* Back button */}
      <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-4 text-sm font-medium">
        <ArrowLeft size={18} /> Back to Forms
      </button>

      {/* Form document */}
      <div className="bg-white rounded-2xl shadow-lg border border-gray-200 overflow-hidden">

        {/* Header */}
        <div className="p-6 pb-4 flex items-start justify-between border-b border-gray-100">
          <div>
            <h1 className="text-2xl font-black text-gray-900">Hazard Form</h1>
            <p className="text-sm text-gray-500 mt-0.5">VelCare Demo</p>
          </div>
          <img src={LOGO_URL} alt="Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* ═══ SECTION 1: Information ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Information</SectionHeader>
            <Field label="Person's Name" name="persons_name" form={form} setForm={setForm} placeholder="Full name" />
            <Field label="Date" name="date" form={form} setForm={setForm} type="date" half />
            <div className="col-span-1" />
            <CheckboxGroup label="Person Type" options={['Employee', 'Client', 'Visitor', 'Other']} name="person_type" form={form} setForm={setForm} />
            <Field label="Address" name="address" form={form} setForm={setForm} placeholder="Street address" />
            <Field label="Home Phone" name="home_phone" form={form} setForm={setForm} placeholder="Home phone number" half />
            <Field label="Mobile Phone" name="mobile_phone" form={form} setForm={setForm} placeholder="Mobile number" half />
          </div>

          {/* ═══ SECTION 2: Hazard Details ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Hazard Details</SectionHeader>
            <Field label="Date of Hazard Identification" name="hazard_date" form={form} setForm={setForm} type="date" half />
            <Field label="Time of Hazard Identification" name="hazard_time" form={form} setForm={setForm} type="time" half />
            <Field label="Location of Hazard" name="hazard_location" form={form} setForm={setForm} placeholder="Where did the hazard occur?" />
            <Field label="Who was the hazard reported to?" name="reported_to" form={form} setForm={setForm} placeholder="Name of person" />
            <Field label="Position" name="reported_to_position" form={form} setForm={setForm} placeholder="Their position/role" half />
            <Field label="Date Reported" name="date_reported" form={form} setForm={setForm} type="date" half />
          </div>

          {/* ═══ SECTION 3: Injury & Description ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <RadioGroup label="Was anyone injured as a result of the hazard?" options={['Yes', 'No']} name="anyone_injured" form={form} setForm={setForm} />
            {form.anyone_injured === 'Yes' && (
              <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-xs text-red-700 font-bold">⚠ An Injury Report must also be completed.</p>
              </div>
            )}
            <TextArea label="What caused this report to be recorded? Describe what happened and what you did about it. (Include area and task involved and any equipment, tools or people involved)" name="description" form={form} setForm={setForm} placeholder="Detailed description of the hazard..." rows={5} />
            <TextArea label="What short term action/s have been taken?" name="short_term_actions" form={form} setForm={setForm} placeholder="Describe immediate actions taken..." rows={4} />
            <TextArea label="Include any suggestions for reducing or eliminating the problem (e.g. use of mechanical devices or training)" name="suggestions" form={form} setForm={setForm} placeholder="Suggestions for prevention..." rows={4} />
          </div>

          {/* ═══ SECTION 4: Signature ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">Signature</label>
              <SignaturePad value={form.signature} onChange={v => setForm({ ...form, signature: v })} />
            </div>
          </div>

          {/* ═══ SECTION 5: Manager to Complete ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Manager to Complete</SectionHeader>
            <p className="col-span-2 text-xs text-red-600 font-semibold italic">*This form must be forwarded to the relevant Service Manager/Coordinator.</p>
            <Field label="Hazard Category" name="hazard_category_text" form={form} setForm={setForm} placeholder="Category" half />
            <Field label="Date" name="manager_date" form={form} setForm={setForm} type="date" half />
            <CheckboxGroup label="Hazard Type" options={['Physical', 'Chemical', 'Biological', 'Psychological', 'Ergonomic', 'Other']} name="hazard_type" form={form} setForm={setForm} />
            <TextArea label="Upon investigation, provide any information, further actions, who will follow this up and when this will occur" name="investigation_notes" form={form} setForm={setForm} placeholder="Investigation details and follow-up actions..." rows={4} />
            <RadioGroup label="Outcome Evaluation" options={['Hazard Eliminated', 'Risk Controlled']} name="outcome_evaluation" form={form} setForm={setForm} />
            <TextArea label="Outcome details (attach any relevant evidence e.g. invoices, records of action taken)" name="outcome_details" form={form} setForm={setForm} placeholder="Details of outcome..." rows={3} />
            <Field label="HAZPAK Risk Score" name="risk_score" form={form} setForm={setForm} placeholder="Risk score" half />
            <div className="col-span-1">
              <p className="text-[10px] text-red-600 font-medium mt-6">As per the Risk Matrix, Senior Manager must be notified immediately for risk scores of 1 or 2</p>
            </div>
          </div>

          {/* ═══ SECTION 6: Manager Sign-off ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <Field label="Manager Name" name="manager_name" form={form} setForm={setForm} placeholder="Manager's full name" half />
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Manager Signature</label>
              <SignaturePad value={form.manager_signature} onChange={v => setForm({ ...form, manager_signature: v })} />
            </div>
            <Field label="Senior Manager (if risk score 1 or 2)" name="senior_manager_name" form={form} setForm={setForm} placeholder="Senior Manager's full name" half />
            <div className="col-span-1">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">Senior Manager Signature</label>
              <SignaturePad value={form.senior_manager_signature} onChange={v => setForm({ ...form, senior_manager_signature: v })} />
            </div>
          </div>

          {/* ═══ Filing Instructions ═══ */}
          <div className="bg-gray-50 rounded-xl p-4 border border-gray-200">
            <h4 className="text-xs font-bold text-gray-700 mb-2">This form is to be forwarded or filed as below</h4>
            <div className="text-xs text-gray-600 space-y-1">
              <p><span className="font-semibold">All Hazards:</span> Service Manager (file in Risk Management folder)</p>
              <p className="pl-[88px]">Copy to Human Resources</p>
            </div>
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
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Hazard Report</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}