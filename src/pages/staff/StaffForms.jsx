import { useState, useEffect } from 'react'
import { ClipboardList, Pill, AlertTriangle, AlertOctagon, DollarSign, ChevronRight, Check, Loader2, Clock, FileText, Download, Upload, X } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import Modal from '../../components/ui/Modal'
import HazardForm from './forms/HazardForm'
import IncidentForm from './forms/IncidentForm'
import ComplaintsForm from './forms/ComplaintsForm'
import CashReconciliationForm from './forms/CashReconciliationForm'
import MedicationIncidentForm from './forms/MedicationIncidentForm'
import MedicationChartForm from './forms/MedicationChartForm'

const CUSTOM_FORM_MAP = {
  'hazard report': 'hazard',
  'hazard': 'hazard',
  'incident report': 'incident',
  'incident': 'incident',
  'complaints / feedback form': 'complaints',
  'complaints': 'complaints',
  'complaints / feedback': 'complaints',
  'complaints/feedback': 'complaints',
  'cash reconciliation': 'cash',
  'medication incident report': 'med_incident',
  'medication incident': 'med_incident',
  'medication chart form': 'med_chart',
  'medication chart': 'med_chart',
}

function matchCustomForm(title) {
  if (!title) return null
  const t = title.toLowerCase().trim()
  // Exact match first
  if (CUSTOM_FORM_MAP[t]) return CUSTOM_FORM_MAP[t]
  // Partial match
  if (t.includes('hazard')) return 'hazard'
  if (t.includes('medication') && t.includes('incident')) return 'med_incident'
  if (t.includes('medication') && t.includes('chart')) return 'med_chart'
  if (t.includes('incident')) return 'incident'
  if (t.includes('complaint') || t.includes('feedback')) return 'complaints'
  if (t.includes('cash') || t.includes('reconciliation')) return 'cash'
  return null
}

const iconMap = {
  'pill': Pill,
  'alert-octagon': AlertOctagon,
  'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign,
  'clipboard': ClipboardList,
  'clipboard-list': ClipboardList,
}

export default function StaffForms() {
  const { staffProfile, myShifts } = useStaff()
  const [showForm, setShowForm] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [customForm, setCustomForm] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedDocUrl, setUploadedDocUrl] = useState(null)
  const [uploadedDocName, setUploadedDocName] = useState(null)

  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const staffName = staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Staff Member'

  useEffect(() => {
    loadData()
  }, [staffProfile?.id])

  // Refresh templates when tab gets focus (picks up admin changes)
  useEffect(() => {
    const handleFocus = () => loadData()
    window.addEventListener('focus', handleFocus)
    return () => window.removeEventListener('focus', handleFocus)
  }, [staffProfile?.id])

  const loadData = async () => {
    try {
      const { data: tpls } = await supabase
        .from('form_templates')
        .select('*')
        .eq('active', true)
        .order('mandatory', { ascending: false })
        .order('title', { ascending: true })
      if (tpls) setTemplates(tpls)

      if (staffProfile?.id) {
        const { data: subs } = await supabase
          .from('form_submissions')
          .select('*')
          .eq('staff_id', staffProfile.id)
          .order('submitted_at', { ascending: false })
          .limit(10)
        if (subs) setRecentSubmissions(subs)
      }
    } catch (e) {
      console.error('Failed to load forms:', e)
    } finally {
      setLoading(false)
    }
  }

  const handleDocUpload = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large — max 10MB'); return }
    setUploadingDoc(true)
    try {
      const fileName = `form-submissions/${staffProfile?.id || 'unknown'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('documents').upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type || 'application/octet-stream' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      setUploadedDocUrl(urlData.publicUrl)
      setUploadedDocName(file.name)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploadingDoc(false)
    }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const submissionData = { ...formData }
      if (uploadedDocUrl) {
        submissionData._uploaded_document = uploadedDocUrl
        submissionData._uploaded_document_name = uploadedDocName
      }
      const { error: insertError } = await supabase.from('form_submissions').insert({
        form_type: showForm.templateId ? `template_${showForm.templateId}` : showForm.id,
        staff_id: staffProfile?.id,
        shift_id: activeShift?.id || null,
        data: submissionData,
        submitted_at: new Date().toISOString()
      })
      if (insertError) throw insertError
      alert('Form submitted successfully!')
      setShowForm(null)
      setFormData({})
      setUploadedDocUrl(null)
      setUploadedDocName(null)
      if (staffProfile?.id) {
        const { data: subs } = await supabase
          .from('form_submissions')
          .select('*')
          .eq('staff_id', staffProfile.id)
          .order('submitted_at', { ascending: false })
          .limit(10)
        if (subs) setRecentSubmissions(subs)
      }
    } catch (err) {
      console.error('Form save failed:', err)
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  // Build label map from templates
  const templateLabelMap = {}
  templates.forEach(t => { templateLabelMap[`template_${t.id}`] = t.title })
  const getFormLabel = (formType) => templateLabelMap[formType] || formType?.replace(/_/g, ' ') || 'Form'

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
  }

  if (customForm === 'hazard') {
    return <HazardForm onBack={() => setCustomForm(null)} />
  }
  if (customForm === 'incident') {
    return <IncidentForm onBack={() => setCustomForm(null)} />
  }
  if (customForm === 'complaints') {
    return <ComplaintsForm onBack={() => setCustomForm(null)} />
  }
  if (customForm === 'cash') {
    return <CashReconciliationForm onBack={() => setCustomForm(null)} />
  }
  if (customForm === 'med_incident') {
    return <MedicationIncidentForm onBack={() => setCustomForm(null)} />
  }
  if (customForm === 'med_chart') {
    return <MedicationChartForm onBack={() => setCustomForm(null)} />
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-black text-gray-900">Forms</h2>
        <p className="text-gray-500 text-sm">{templates.length} available · {recentSubmissions.length} submitted</p>
      </div>

      {/* Active Shift Banner */}
      {activeShift ? (
        <div className="p-4 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-500 shadow-lg text-white">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-white/20 flex items-center justify-center shrink-0">
              <Clock size={20} className="text-white" />
            </div>
            <div>
              <p className="text-[10px] font-semibold opacity-80 uppercase tracking-wider">Active Shift</p>
              <p className="font-bold text-sm">{activeShift.participants ? `${activeShift.participants.first_name} ${activeShift.participants.last_name}` : 'Current Shift'}</p>
              <p className="text-xs opacity-80">{activeShift.service_type || activeShift.title || 'Support'}{activeShift.location ? ` · ${activeShift.location}` : ''}</p>
            </div>
          </div>
        </div>
      ) : (
        <div className="p-4 rounded-2xl bg-amber-50 border border-amber-200">
          <div className="flex items-center gap-3">
            <AlertTriangle size={20} className="text-amber-500 shrink-0" />
            <div>
              <p className="font-semibold text-gray-800 text-sm">No Active Shift</p>
              <p className="text-xs text-gray-500">You can still submit forms — they'll be saved without a shift reference</p>
            </div>
          </div>
        </div>
      )}

      {/* Form Cards — all from database */}
      <div>
        <h3 className="font-bold text-gray-800 text-base mb-3">Available Forms</h3>
        {templates.length > 0 ? (
          <div className="space-y-2.5">
            {templates.map(tpl => {
              const Icon = iconMap[tpl.icon] || ClipboardList
              return (
                <button key={tpl.id} onClick={() => {
                  const customKey = matchCustomForm(tpl.title)
                  if (customKey) {
                    setCustomForm(customKey)
                    return
                  }
                  setShowForm({
                    id: tpl.id,
                    templateId: tpl.id,
                    title: tpl.title,
                    desc: tpl.description || `${(tpl.fields || []).length} fields`,
                    color: tpl.color || 'from-teal-500 to-cyan-500',
                    mandatory: tpl.mandatory,
                    fields: tpl.fields || [],
                    document_url: tpl.document_url || null,
                  })
                  setFormData({})
                }} className="w-full p-4 rounded-2xl bg-white/80 border border-gray-200 hover:shadow-lg hover:border-gray-300 hover:-translate-y-[1px] transition-all text-left flex items-center gap-4 backdrop-blur-sm">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${tpl.color || 'from-teal-500 to-cyan-500'} flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon size={22} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-800 text-[15px]">{tpl.title}</p>
                      {tpl.mandatory && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-red-100 text-red-600 uppercase tracking-wider">Required</span>}
                      {tpl.document_url && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-100 text-blue-600 uppercase tracking-wider flex items-center gap-0.5"><FileText size={8} /> Doc</span>}
                    </div>
                    <p className="text-xs text-gray-400 mt-0.5 leading-relaxed">{tpl.description || `${(tpl.fields || []).length} fields`}</p>
                  </div>
                  <div className="w-9 h-9 rounded-xl bg-gray-50 flex items-center justify-center shrink-0">
                    <ChevronRight size={16} className="text-gray-300" />
                  </div>
                </button>
              )
            })}
          </div>
        ) : (
          <div className="p-8 rounded-2xl bg-white/80 border border-gray-200 text-center backdrop-blur-sm">
            <ClipboardList size={32} className="text-gray-200 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No forms available yet</p>
          </div>
        )}
      </div>

      {/* Recent Submissions */}
      {recentSubmissions.length > 0 && (
        <div>
          <h3 className="font-bold text-gray-800 text-base mb-3">Recent Submissions</h3>
          <div className="space-y-2">
            {recentSubmissions.map(sub => (
              <div key={sub.id} className="p-3 rounded-xl bg-white/80 border border-gray-200 flex items-center gap-3 backdrop-blur-sm">
                <div className="w-8 h-8 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                  <Check size={14} className="text-emerald-600" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-semibold text-gray-800 text-sm">{getFormLabel(sub.form_type)}</p>
                  <p className="text-[10px] text-gray-400">
                    {sub.data?.participant_name && `${sub.data.participant_name} · `}
                    {new Date(sub.submitted_at).toLocaleDateString('en-AU')} · {new Date(sub.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                  </p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-semibold shrink-0 ${sub.status === 'reviewed' ? 'bg-emerald-50 text-emerald-700' : sub.status === 'flagged' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                  {(sub.status || 'submitted').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Form Modal */}
      <Modal isOpen={!!showForm} onClose={() => { setShowForm(null); setUploadedDocUrl(null); setUploadedDocName(null) }} title={showForm?.title || 'Form'} wide>
        {showForm && (
          <div className="space-y-4">
            {/* Form header */}
            <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${showForm.color} flex items-center justify-center shadow shrink-0`}>
                <ClipboardList size={16} className="text-white" />
              </div>
              <div>
                <p className="text-xs md:text-sm font-semibold text-blue-800">{showForm.title}</p>
                <p className="text-[10px] md:text-xs text-blue-600">{showForm.desc}</p>
              </div>
            </div>

            {/* Active shift context */}
            {activeShift && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-[10px] text-emerald-600 font-semibold uppercase tracking-wider">Linked to Shift</p>
                <p className="text-xs text-gray-700 mt-0.5">
                  {activeShift.participants ? `${activeShift.participants.first_name} ${activeShift.participants.last_name}` : 'Current shift'} · {activeShift.shift_date ? new Date(activeShift.shift_date).toLocaleDateString('en-AU') : 'Today'}
                </p>
              </div>
            )}

            {/* Attached Document */}
            {showForm.document_url && (
              <div className="rounded-xl border border-blue-200 overflow-hidden">
                <div className="p-3 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">Reference Document</p>
                  </div>
                  <a href={showForm.document_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold transition-colors">
                    <Download size={12} /> Download
                  </a>
                </div>
                {showForm.document_url.toLowerCase().endsWith('.pdf') ? (
                  <iframe
                    src={showForm.document_url}
                    className="w-full border-0"
                    style={{ height: '400px' }}
                    title="Form document"
                  />
                ) : (
                  <div className="p-6 text-center bg-gray-50">
                    <FileText size={36} className="text-gray-300 mx-auto mb-2" />
                    <p className="text-sm text-gray-500 font-medium">Word Document</p>
                    <p className="text-xs text-gray-400 mt-1">Click Download to view and fill out this document</p>
                    <a href={showForm.document_url} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-3 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-sm font-semibold transition-colors">
                      <Download size={14} /> Open Document
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Upload completed document (for doc-based templates) */}
            {showForm.document_url && (
              <div className="rounded-xl border border-emerald-200 overflow-hidden">
                <div className="p-3 bg-emerald-50">
                  <p className="text-xs font-semibold text-emerald-800 flex items-center gap-2"><Upload size={14} /> Upload Completed Document</p>
                  <p className="text-[10px] text-emerald-600 mt-0.5">Download the template above, fill it out, then upload your completed version here</p>
                </div>
                <div className="p-3">
                  {uploadedDocUrl ? (
                    <div className="flex items-center gap-3 p-3 bg-white border border-gray-200 rounded-xl">
                      <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center shrink-0">
                        <Check size={18} className="text-emerald-600" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold text-gray-800 truncate">{uploadedDocName}</p>
                        <p className="text-[10px] text-emerald-600">Ready to submit</p>
                      </div>
                      <button onClick={() => { setUploadedDocUrl(null); setUploadedDocName(null) }} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500">
                        <X size={14} />
                      </button>
                    </div>
                  ) : (
                    <label className={`block p-4 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${uploadingDoc ? 'border-emerald-300 bg-emerald-50' : 'border-gray-200 hover:border-emerald-300 hover:bg-emerald-50/50'}`}>
                      <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleDocUpload(e.target.files?.[0])} disabled={uploadingDoc} />
                      {uploadingDoc ? (
                        <div className="flex items-center justify-center gap-2">
                          <Loader2 size={18} className="animate-spin text-emerald-500" />
                          <p className="text-sm text-emerald-600 font-medium">Uploading...</p>
                        </div>
                      ) : (
                        <div className="flex items-center justify-center gap-2">
                          <Upload size={18} className="text-gray-400" />
                          <p className="text-sm text-gray-500 font-medium">Choose completed file (.pdf, .doc, .docx)</p>
                        </div>
                      )}
                    </label>
                  )}
                </div>
              </div>
            )}

            {/* Dynamic form fields */}
            {showForm.fields.map(field => (
              <div key={field.key}>
                {field.type === 'checkbox' ? (
                  <label className="flex items-center gap-2.5 cursor-pointer py-1">
                    <input type="checkbox" checked={formData[field.key] === 'Yes'} onChange={e => setFormData({ ...formData, [field.key]: e.target.checked ? 'Yes' : 'No' })}
                      className="w-4 h-4 rounded border-gray-300 text-teal-500 focus:ring-teal-500" />
                    <span className="text-sm text-gray-700 font-medium">{field.label}{field.required ? ' *' : ''}</span>
                  </label>
                ) : (
                  <>
                    <p className="text-xs text-gray-500 font-medium mb-1">{field.label}{field.required ? ' *' : ''}</p>
                    {field.type === 'textarea' ? (
                      <textarea
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all"
                        rows={3}
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    ) : field.type === 'select' ? (
                      <select
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all"
                      >
                        <option value="">Select...</option>
                        {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                      </select>
                    ) : (
                      <input
                        type={field.type}
                        value={formData[field.key] || ''}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                        className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all"
                        placeholder={`Enter ${field.label.toLowerCase()}...`}
                      />
                    )}
                  </>
                )}
              </div>
            ))}

            {/* Signature */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Submitted by</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{staffName}</p>
              <p className="text-[10px] text-gray-400 mt-0.5">
                {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })} · {new Date().toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
              </p>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <button onClick={() => setShowForm(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">
                Cancel
              </button>
              <button
                disabled={submitting}
                onClick={handleSubmit}
                className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50 transition-all"
              >
                {submitting ? 'Submitting...' : 'Submit Form'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}