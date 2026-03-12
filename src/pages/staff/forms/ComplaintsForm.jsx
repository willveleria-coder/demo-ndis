import { useState, useRef } from 'react'
import { ArrowLeft, Send, Loader2, Trash2 } from 'lucide-react'
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

const Field = ({ label, name, form, setForm, type = 'text', placeholder, half, className = '' }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'} ${className}`}>
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <input type={type} value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all bg-white placeholder:text-gray-300" />
  </div>
)

const TextArea = ({ label, name, form, setForm, placeholder, rows = 4 }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <textarea value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} placeholder={placeholder || label} rows={rows} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all bg-white resize-none placeholder:text-gray-300" />
  </div>
)

const RadioGroup = ({ label, options, name, form, setForm }) => (
  <div className="col-span-2">
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">{label}</label>}
    <div className="flex gap-4">
      {options.map(opt => (
        <label key={opt} className="flex items-center gap-2 cursor-pointer group">
          <input type="radio" checked={form[name] === opt} onChange={() => setForm({ ...form, [name]: opt })} className="w-4 h-4 border-gray-300 text-violet-500 focus:ring-violet-400" />
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

const SelectField = ({ label, name, options, form, setForm, half }) => (
  <div className={`${half ? 'col-span-1' : 'col-span-2'}`}>
    {label && <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-1">{label}</label>}
    <select value={form[name] || ''} onChange={e => setForm({ ...form, [name]: e.target.value })} className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-violet-400/30 focus:border-violet-400 transition-all bg-white">
      <option value="">Select...</option>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
  </div>
)

export default function ComplaintsForm({ onBack }) {
  const { staffProfile, myShifts } = useStaff()
  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const [form, setForm] = useState({})
  const [submitting, setSubmitting] = useState(false)

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: 'complaints_feedback',
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: form,
        submitted_at: new Date().toISOString(),
      })
      if (insertError) throw insertError
      alert('Complaints / Feedback Form submitted successfully!')
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
            <h1 className="text-2xl font-black text-gray-900">Complaints Form</h1>
            <p className="text-sm text-gray-500 mt-0.5">Maple Care Support</p>
          </div>
          <img src={LOGO_URL} alt="MCS Logo" className="w-14 h-14 object-contain rounded-lg" onError={e => { e.target.style.display = 'none' }} />
        </div>

        <div className="p-6 space-y-6">

          {/* ═══ PAGE 1: Complainant Details ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Fill in the details of the person who is making the complaint/providing feedback</SectionHeader>
            <Field label="Name of Person" name="complainant_name" form={form} setForm={setForm} placeholder="Full name" />
            <Field label="Address" name="complainant_address" form={form} setForm={setForm} placeholder="Street address" />
            <Field label="Phone" name="complainant_phone" form={form} setForm={setForm} placeholder="Phone number" half />
            <Field label="Email" name="complainant_email" form={form} setForm={setForm} placeholder="Email address" half />
            <SelectField label="Preferred contact method" name="preferred_contact" options={['Phone', 'Email', 'Post', 'In Person']} form={form} setForm={setForm} />
          </div>

          {/* Anonymous */}
          <div className="grid grid-cols-2 gap-3">
            <Divider />
            <RadioGroup label="I am making this complaint anonymously" options={['Yes', 'No']} name="anonymous" form={form} setForm={setForm} />
            {form.anonymous === 'Yes' && (
              <div className="col-span-2 p-3 bg-red-50 border border-red-200 rounded-lg space-y-1">
                <p className="text-xs text-red-700 font-semibold">1. Please note that if you are making your complaint anonymously we may be unable to respond to your complaint and inform you about our actions.</p>
                <p className="text-xs text-red-700 font-semibold">2. Leave the personal information sections in blank if complaint anonymously.</p>
              </div>
            )}
          </div>

          {/* On behalf of another */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>If you are making the complaint/feedback on behalf of another person provide the following details</SectionHeader>
            <Field label="Your Name" name="on_behalf_name" form={form} setForm={setForm} placeholder="Your full name" />
            <Field label="What is your relationship to the person?" name="on_behalf_relationship" form={form} setForm={setForm} placeholder="e.g. Family member, carer, advocate..." />
            <RadioGroup label="Does the person know you are making this complaint/providing feedback?" options={['Yes', 'No']} name="person_aware" form={form} setForm={setForm} />
            <RadioGroup label="Does the person consent to the complaint/feedback being made?" options={['Yes', 'No']} name="person_consent" form={form} setForm={setForm} />
            <SelectField label="Preferred contact method" name="on_behalf_preferred_contact" options={['Phone', 'Email', 'Post', 'In Person']} form={form} setForm={setForm} />
          </div>

          {/* Who is the complaint about */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Who is the person, or the service about whom you are complaining or providing feedback about?</SectionHeader>
            <Field label="Name" name="complaint_about_name" form={form} setForm={setForm} placeholder="Name of person or service" />
            <Field label="Contact Details (if known)" name="complaint_about_contact" form={form} setForm={setForm} placeholder="Contact details" />
          </div>

          {/* Complaint details */}
          <div className="grid grid-cols-2 gap-3">
            <TextArea label="What is your Complaint/Feedback about? Provide some details to help us understand your concerns. You should include what happened, where it happened, time it happened and who was involved." name="complaint_details" form={form} setForm={setForm} placeholder="Detailed description of your complaint or feedback..." rows={6} />
          </div>

          {/* ═══ PAGE 2: Supporting info & outcomes ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <TextArea label="Supporting Information: Please attach copies of any documentation that may help us to investigate your complaint/feedback (for example letters, references, emails)." name="supporting_info" form={form} setForm={setForm} placeholder="List any supporting documents or evidence..." rows={5} />
            <TextArea label="What outcomes are you seeking as a result of the complaint/feedback?" name="desired_outcome" form={form} setForm={setForm} placeholder="What would you like to happen as a result?" rows={5} />
          </div>

          {/* ═══ PAGE 3: Office Use Only ═══ */}
          <div className="grid grid-cols-2 gap-3">
            <SectionHeader>Office Use Only</SectionHeader>
            <Field label="Complaint Received By" name="office_received_by" form={form} setForm={setForm} placeholder="Name of staff member" />
            <Field label="Date Received" name="office_date_received" form={form} setForm={setForm} type="date" />
            <TextArea label="Action Taken or Required" name="office_action_taken" form={form} setForm={setForm} placeholder="Details of action taken or required..." rows={4} />
            <Field label="Date Action Completed" name="office_date_completed" form={form} setForm={setForm} type="date" />
            <div className="col-span-2">
              <label className="block text-[11px] font-bold text-gray-600 uppercase tracking-wide mb-2">Signature</label>
              <SignaturePad value={form.office_signature} onChange={v => setForm({ ...form, office_signature: v })} />
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
            <button onClick={handleSubmit} disabled={submitting} className="flex-1 py-3 bg-gradient-to-r from-violet-500 to-purple-500 hover:from-violet-600 hover:to-purple-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 transition-all">
              {submitting ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : <><Send size={16} /> Submit Complaint / Feedback</>}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}