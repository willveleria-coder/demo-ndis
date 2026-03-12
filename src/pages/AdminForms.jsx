import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Search, Filter, Eye, Check, Clock, AlertTriangle,
  AlertOctagon, DollarSign, Pill, Loader2, X, ChevronDown, Flag, Pencil, Save, Trash2,
  Plus, GripVertical, ToggleLeft, ToggleRight, Copy, FileText, Upload, Download, Printer
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import PrintableForm from '../components/FormPrintView'

const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-cyan-50 text-cyan-700', orange: 'bg-orange-50 text-orange-700', teal: 'bg-teal-50 text-teal-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

const formLabels = { medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation', complaints_form: 'Complaints / Feedback', complaints_feedback: 'Complaints / Feedback', hazard_form: 'Hazard Report', hazard_report: 'Hazard Report' }
const formIcons = { medication_chart: Pill, medication_incident: AlertOctagon, incident_report: AlertTriangle, cash_reconciliation: DollarSign, complaints_form: ClipboardList, complaints_feedback: ClipboardList, hazard_form: AlertTriangle, hazard_report: AlertTriangle }
const formColors = { medication_chart: 'from-blue-500 to-indigo-500', medication_incident: 'from-red-500 to-rose-500', incident_report: 'from-amber-500 to-orange-500', cash_reconciliation: 'from-emerald-500 to-teal-500', complaints_form: 'from-violet-500 to-purple-500', complaints_feedback: 'from-violet-500 to-purple-500', hazard_form: 'from-rose-500 to-pink-500', hazard_report: 'from-rose-500 to-pink-500' }
const formBadge = { medication_chart: 'blue', medication_incident: 'red', incident_report: 'amber', cash_reconciliation: 'green', complaints_form: 'teal', complaints_feedback: 'teal', hazard_form: 'orange', hazard_report: 'orange' }
const statusLabels = { submitted: 'Submitted', reviewed: 'Reviewed', flagged: 'Flagged', archived: 'Archived' }
const statusColors = { submitted: 'amber', reviewed: 'green', flagged: 'red', archived: 'gray' }

export default function AdminForms() {
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('submissions')
  const [submissions, setSubmissions] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('all')
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewForm, setViewForm] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [editingForm, setEditingForm] = useState(false)
  const [editData, setEditData] = useState({})
  const [printView, setPrintView] = useState(null)

  // Templates state
  const [templates, setTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null) // null = new, object = editing existing
  const [templateForm, setTemplateForm] = useState({ title: '', description: '', mandatory: false, color: 'from-teal-500 to-cyan-500', fields: [] })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docFile, setDocFile] = useState(null)
  const [docUrl, setDocUrl] = useState(null)

  useEffect(() => {
    async function init() {
      try {
        const [formsRes, tplsRes] = await Promise.all([
          supabase.from('form_submissions').select('*, staff:staff_id(first_name, last_name, email)').order('submitted_at', { ascending: false }),
          supabase.from('form_templates').select('*').order('created_at', { ascending: false })
        ])
        if (formsRes.data) setSubmissions(formsRes.data)
        if (tplsRes.data) setTemplates(tplsRes.data)
        if (formsRes.error) console.error('Submissions load error:', formsRes.error)
        if (tplsRes.error) console.error('Templates load error:', tplsRes.error)
      } catch (err) { console.error('Forms init error:', err) }
      finally { setLoading(false) }
    }
    init()
  }, [])

  const reloadSubmissions = async () => {
    try {
      const { data } = await supabase.from('form_submissions').select('*, staff:staff_id(first_name, last_name, email)').order('submitted_at', { ascending: false })
      setSubmissions(data || [])
    } catch {}
  }

  const reloadTemplates = async () => {
    try {
      const { data } = await supabase.from('form_templates').select('*').order('created_at', { ascending: false })
      if (data) setTemplates(data)
    } catch {}
  }

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase.from('form_submissions').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
      if (viewForm?.id === id) setViewForm(prev => ({ ...prev, status: newStatus }))
    } catch (err) {
      alert('Failed to update: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const startEditing = () => {
    setEditData({ ...(viewForm.data || {}) })
    setEditingForm(true)
  }

  const handleSaveEdit = async () => {
    if (!viewForm) return
    setUpdating(true)
    try {
      const { error } = await supabase.from('form_submissions').update({ data: editData }).eq('id', viewForm.id)
      if (error) throw error
      setSubmissions(prev => prev.map(s => s.id === viewForm.id ? { ...s, data: editData } : s))
      setViewForm(prev => ({ ...prev, data: editData }))
      setEditingForm(false)
      alert('Form updated and saved!')
    } catch (err) {
      alert('Failed to save: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  const handleDeleteForm = async (id) => {
    if (!confirm('Delete this form submission? This cannot be undone.')) return
    setUpdating(true)
    try {
      const { error } = await supabase.from('form_submissions').delete().eq('id', id)
      if (error) throw error
      setSubmissions(prev => prev.filter(s => s.id !== id))
      setViewForm(null)
      setEditingForm(false)
    } catch (err) {
      alert('Failed to delete: ' + err.message)
    } finally {
      setUpdating(false)
    }
  }

  // Template handlers
  const openNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({ title: '', description: '', mandatory: false, color: 'from-teal-500 to-cyan-500', fields: [{ key: 'participant_name', label: 'Participant Name', type: 'text', required: true }] })
    setDocFile(null)
    setDocUrl(null)
    setShowTemplateModal(true)
  }

  const openEditTemplate = (t) => {
    setEditingTemplate(t)
    setTemplateForm({ title: t.title, description: t.description || '', mandatory: t.mandatory || false, color: t.color || 'from-teal-500 to-cyan-500', fields: t.fields || [] })
    setDocFile(null)
    setDocUrl(t.document_url || null)
    setShowTemplateModal(true)
  }

  const handleDocUpload = async (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) {
      alert('Please upload a PDF or Word document (.pdf, .doc, .docx)')
      return
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('File too large — max 10MB')
      return
    }
    setDocUploading(true)
    setDocFile(file)
    // Auto-set title from filename immediately
    if (!templateForm.title.trim()) {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      setTemplateForm(prev => ({ ...prev, title: name }))
    }
    try {
      const fileName = `form-templates/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('documents').upload(fileName, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type || 'application/octet-stream',
      })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      setDocUrl(urlData.publicUrl)
    } catch (err) {
      console.error('Upload error:', err)
      alert('Upload failed: ' + (err.message || 'Unknown error'))
      setDocFile(null)
    } finally {
      setDocUploading(false)
    }
  }

  const addField = () => {
    setTemplateForm(prev => ({ ...prev, fields: [...prev.fields, { key: `field_${Date.now()}`, label: '', type: 'text', required: false }] }))
  }

  const updateField = (idx, updates) => {
    setTemplateForm(prev => ({ ...prev, fields: prev.fields.map((f, i) => i === idx ? { ...f, ...updates } : f) }))
  }

  const removeField = (idx) => {
    setTemplateForm(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== idx) }))
  }

  const moveField = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= templateForm.fields.length) return
    setTemplateForm(prev => {
      const arr = [...prev.fields]
      ;[arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]
      return { ...prev, fields: arr }
    })
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.title.trim()) { alert('Template title is required'); return }
    if (templateForm.fields.length === 0 && !docUrl) { alert('Add at least one field or upload a document'); return }
    const emptyLabel = templateForm.fields.find(f => !(f.label || '').trim())
    if (emptyLabel) { alert('All fields must have a label'); return }

    setSavingTemplate(true)
    try {
      // Auto-generate keys from labels
      const fields = templateForm.fields.map(f => ({
        ...f,
        key: (f.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || f.key,
        options: f.type === 'select' ? (f.options || []) : undefined,
      }))

      const payload = {
        title: templateForm.title.trim(),
        description: (templateForm.description || '').trim() || null,
        mandatory: templateForm.mandatory || false,
        color: templateForm.color || 'from-teal-500 to-cyan-500',
        fields,
        active: true,
      }
      // Only include document_url if we have one (column may not exist yet)
      if (docUrl) payload.document_url = docUrl

      if (editingTemplate) {
        const { error } = await supabase.from('form_templates').update(payload).eq('id', editingTemplate.id)
        if (error) throw error
        setTemplates(prev => prev.map(t => t.id === editingTemplate.id ? { ...t, ...payload } : t))
      } else {
        const { data, error } = await supabase.from('form_templates').insert(payload).select().single()
        if (error) throw error
        setTemplates(prev => [data, ...prev])
      }
      setShowTemplateModal(false)
      alert(editingTemplate ? 'Template updated!' : 'Template created!')
    } catch (err) {
      console.error('Template save error:', err)
      alert('Failed to save: ' + (err.message || JSON.stringify(err)))
    } finally {
      setSavingTemplate(false)
    }
  }

  const handleToggleTemplate = async (id, active) => {
    try {
      const { error } = await supabase.from('form_templates').update({ active: !active }).eq('id', id)
      if (error) throw error
      setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t))
    } catch (err) { alert('Failed: ' + err.message) }
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template? Staff will no longer see it.')) return
    try {
      const { error } = await supabase.from('form_templates').delete().eq('id', id)
      if (error) throw error
      setTemplates(prev => prev.filter(t => t.id !== id))
    } catch (err) { alert('Failed: ' + err.message) }
  }

  const duplicateTemplate = (t) => {
    setEditingTemplate(null)
    setTemplateForm({ title: `${t.title} (Copy)`, description: t.description || '', mandatory: false, color: t.color || 'from-teal-500 to-cyan-500', fields: [...(t.fields || [])] })
    setShowTemplateModal(true)
  }

  const colorOptions = [
    { value: 'from-teal-500 to-cyan-500', label: 'Teal' },
    { value: 'from-blue-500 to-indigo-500', label: 'Blue' },
    { value: 'from-emerald-500 to-green-600', label: 'Green' },
    { value: 'from-amber-500 to-orange-500', label: 'Orange' },
    { value: 'from-red-500 to-rose-500', label: 'Red' },
    { value: 'from-violet-500 to-purple-500', label: 'Purple' },
    { value: 'from-pink-500 to-rose-500', label: 'Pink' },
    { value: 'from-gray-500 to-gray-600', label: 'Gray' },
  ]

  const filtered = submissions.filter(s => {
    if (typeFilter !== 'all' && s.form_type !== typeFilter) return false
    if (statusFilter !== 'all' && s.status !== statusFilter) return false
    if (search) {
      const q = search.toLowerCase()
      const staffN = s.staff ? `${s.staff.first_name} ${s.staff.last_name}`.toLowerCase() : ''
      const pName = (s.data?.participant_name || '').toLowerCase()
      const formLabel = (formLabels[s.form_type] || '').toLowerCase()
      if (!staffN.includes(q) && !pName.includes(q) && !formLabel.includes(q)) return false
    }
    return true
  })

  // Stats
  const totalSubmitted = submissions.filter(s => s.status === 'submitted').length
  const totalReviewed = submissions.filter(s => s.status === 'reviewed').length
  const totalFlagged = submissions.filter(s => s.status === 'flagged').length
  const typeCounts = {}
  submissions.forEach(s => { typeCounts[s.form_type] = (typeCounts[s.form_type] || 0) + 1 })

  // Build template lookup maps so template submissions show proper names/colors
  const tplLabelMap = {}
  const tplColorMap = {}
  const tplDocMap = {}
  const tplFieldsMap = {}
  templates.forEach(t => {
    const key = `template_${t.id}`
    tplLabelMap[key] = t.title
    tplColorMap[key] = t.color || 'from-teal-500 to-cyan-500'
    if (t.document_url) tplDocMap[key] = t.document_url
    if (t.fields) tplFieldsMap[key] = t.fields
  })

  const getLabel = (ft) => formLabels[ft] || tplLabelMap[ft] || ft?.replace(/_/g, ' ') || 'Form'
  const getColor = (ft) => formColors[ft] || tplColorMap[ft] || 'from-gray-400 to-gray-500'
  const getDocUrl = (ft) => tplDocMap[ft] || null
  const getFields = (ft) => tplFieldsMap[ft] || null

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-orange-500" /></div>
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">Forms</h2>
          <p className="text-gray-500 text-sm">{submissions.length} submissions · {templates.filter(t => t.active).length} active templates</p>
        </div>
        {activeTab === 'templates' && (
          <button onClick={openNewTemplate} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 flex items-center gap-2 hover:shadow-xl transition-all">
            <Plus size={16} /> Create Template
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex gap-2">
        {[{ id: 'submissions', label: 'Submissions', count: submissions.length }, { id: 'templates', label: 'Form Templates', count: templates.length }].map(t => (
          <button key={t.id} onClick={() => setActiveTab(t.id)}
            className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 ${activeTab === t.id ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' : 'bg-white border border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
            {t.label}
            <span className={`px-1.5 py-0.5 rounded-full text-[10px] font-bold ${activeTab === t.id ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-500'}`}>{t.count}</span>
          </button>
        ))}
      </div>

      {activeTab === 'submissions' && (<>
      {/* Stat cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending Review', count: totalSubmitted, icon: Clock, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200' },
          { label: 'Reviewed', count: totalReviewed, icon: Check, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200' },
          { label: 'Flagged', count: totalFlagged, icon: Flag, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-200' },
          { label: 'Total Forms', count: submissions.length, icon: ClipboardList, color: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-200' },
        ].map(s => (
          <div key={s.label} className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow ${s.shadow} mb-2`}>
              <s.icon size={16} className="text-white" />
            </div>
            <p className="text-2xl font-black text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Form type breakdown */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {Object.entries(formLabels).map(([type, label]) => {
          const Icon = formIcons[type] || ClipboardList
          return (
            <button key={type} onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}
              className={`p-3 rounded-xl border transition-all text-left ${typeFilter === type ? 'border-orange-300 bg-orange-50 shadow-md' : 'border-gray-200 bg-white/80 hover:shadow-md'}`}>
              <div className="flex items-center gap-2 mb-1">
                <div className={`w-7 h-7 rounded-lg bg-gradient-to-br ${formColors[type]} flex items-center justify-center shadow-sm`}>
                  <Icon size={14} className="text-white" />
                </div>
                <span className="text-lg font-black text-gray-900">{typeCounts[type] || 0}</span>
              </div>
              <p className="text-[11px] text-gray-500 font-medium">{label}</p>
            </button>
          )
        })}
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by staff, participant, or form type..."
            className="w-full pl-10 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300" />
        </div>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)}
          className="px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 min-w-[140px]">
          <option value="all">All Statuses</option>
          <option value="submitted">Pending Review</option>
          <option value="reviewed">Reviewed</option>
          <option value="flagged">Flagged</option>
          <option value="archived">Archived</option>
        </select>
        {(typeFilter !== 'all' || statusFilter !== 'all' || search) && (
          <button onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearch('') }}
            className="px-3 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-medium text-gray-600 flex items-center gap-1.5">
            <X size={14} /> Clear
          </button>
        )}
      </div>

      {/* Submissions list */}
      <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
        {filtered.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {filtered.map(sub => {
              const Icon = formIcons[sub.form_type] || ClipboardList
              const staffN = sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'
              const pName = sub.data?.participant_name || '—'
              const label = getLabel(sub.form_type)
              const color = getColor(sub.form_type)
              return (
                <div key={sub.id} className="p-4 flex items-center gap-4 hover:bg-gray-50/50 transition-colors">
                  <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center shadow-lg shrink-0`}>
                    <Icon size={18} className="text-white" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 text-sm">{label}</p>
                      {getDocUrl(sub.form_type) && <Badge color="blue">Doc</Badge>}
                      <Badge color={statusColors[sub.status] || 'gray'}>{statusLabels[sub.status] || sub.status}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      <span className="font-medium">{staffN}</span>
                      {pName !== '—' && <> · Participant: <span className="font-medium">{pName}</span></>}
                    </p>
                    <p className="text-[10px] text-gray-400 mt-0.5">
                      {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                      {sub.submitted_at && ` · ${new Date(sub.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {sub.status === 'submitted' && (
                      <button onClick={() => handleStatusChange(sub.id, 'reviewed')} className="p-2 rounded-lg bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 transition-colors" title="Mark as reviewed">
                        <Check size={14} className="text-emerald-600" />
                      </button>
                    )}
                    {sub.status !== 'flagged' && (
                      <button onClick={() => handleStatusChange(sub.id, 'flagged')} className="p-2 rounded-lg bg-red-50 hover:bg-red-100 border border-red-200 transition-colors" title="Flag">
                        <Flag size={14} className="text-red-500" />
                      </button>
                    )}
                    <button onClick={() => setPrintView(sub)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors" title="View Full Form">
                      <Printer size={14} className="text-blue-600" />
                    </button>
                    <button onClick={() => { setViewForm(sub); setEditingForm(true); setEditData({ ...(sub.data || {}) }) }} className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors" title="Edit">
                      <Pencil size={14} className="text-orange-600" />
                    </button>
                    <button onClick={() => setViewForm(sub)} className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 border border-gray-200 transition-colors" title="View details">
                      <Eye size={14} className="text-gray-600" />
                    </button>
                  </div>
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-16 text-center">
            <ClipboardList size={48} className="text-gray-200 mx-auto mb-3" />
            <p className="font-bold text-gray-800">No form submissions found</p>
            <p className="text-sm text-gray-400 mt-1">{submissions.length > 0 ? 'Try adjusting your filters' : 'Staff form submissions will appear here'}</p>
          </div>
        )}
      </div>

      {/* View/Edit Form Detail Modal */}
      <Modal isOpen={!!viewForm} onClose={() => { setViewForm(null); setEditingForm(false) }} title={viewForm ? getLabel(viewForm.form_type) : 'Form'} wide>
        {viewForm && (
          <div className="space-y-4">
            {/* Form type header */}
            <div className={`p-3 rounded-xl flex items-center gap-3 bg-gray-50 border border-gray-200`}>
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getColor(viewForm.form_type)} flex items-center justify-center shadow`}>
                {(() => { const I = formIcons[viewForm.form_type] || ClipboardList; return <I size={18} className="text-white" /> })()}
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800 text-sm">{getLabel(viewForm.form_type)}</p>
                <div className="flex items-center gap-2 mt-0.5">
                  <Badge color={statusColors[viewForm.status] || 'gray'}>{statusLabels[viewForm.status] || viewForm.status}</Badge>
                  {viewForm.reviewed_at && <span className="text-[10px] text-gray-400">Reviewed</span>}
                </div>
              </div>
              {!editingForm ? (
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-white transition-all">
                  <Pencil size={13} /> Edit
                </button>
              ) : (
                <div className="flex gap-1.5">
                  <button onClick={() => setEditingForm(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200">
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={handleSaveEdit} disabled={updating} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-orange-500 to-amber-500 text-white text-xs font-semibold shadow disabled:opacity-50">
                    {updating ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} Save
                  </button>
                </div>
              )}
            </div>

            {/* Meta info */}
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Submitted by</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{viewForm.staff ? `${viewForm.staff.first_name} ${viewForm.staff.last_name}` : 'Unknown'}</p>
                {viewForm.staff?.email && <p className="text-[10px] text-gray-400">{viewForm.staff.email}</p>}
              </div>
              <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Date & Time</p>
                <p className="text-sm font-bold text-gray-800 mt-0.5">{viewForm.submitted_at ? new Date(viewForm.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                <p className="text-[10px] text-gray-400">{viewForm.submitted_at ? new Date(viewForm.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</p>
              </div>
            </div>

            {/* Attached document (if template has one) */}
            {getDocUrl(viewForm.form_type) && (
              <div className="rounded-xl border border-blue-200 overflow-hidden">
                <div className="p-3 bg-blue-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText size={16} className="text-blue-600" />
                    <p className="text-xs font-semibold text-blue-800">Reference Document</p>
                  </div>
                  <a href={getDocUrl(viewForm.form_type)} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold transition-colors">
                    <Download size={12} /> Download
                  </a>
                </div>
                {getDocUrl(viewForm.form_type).toLowerCase().endsWith('.pdf') ? (
                  <iframe src={getDocUrl(viewForm.form_type)} className="w-full border-0" style={{ height: '350px' }} title="Form document" />
                ) : (
                  <div className="p-4 text-center bg-gray-50">
                    <FileText size={28} className="text-gray-300 mx-auto mb-1" />
                    <p className="text-sm text-gray-500 font-medium">Word Document</p>
                    <a href={getDocUrl(viewForm.form_type)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold transition-colors">
                      <Download size={14} /> Open Document
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Staff's uploaded completed document */}
            {viewForm.data?._uploaded_document && (
              <div className="rounded-xl border border-emerald-200 overflow-hidden">
                <div className="p-3 bg-emerald-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Check size={16} className="text-emerald-600" />
                    <div>
                      <p className="text-xs font-semibold text-emerald-800">Completed Document (uploaded by staff)</p>
                      {viewForm.data._uploaded_document_name && <p className="text-[10px] text-emerald-600">{viewForm.data._uploaded_document_name}</p>}
                    </div>
                  </div>
                  <a href={viewForm.data._uploaded_document} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-semibold transition-colors">
                    <Download size={12} /> Download
                  </a>
                </div>
                {viewForm.data._uploaded_document.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={viewForm.data._uploaded_document} className="w-full border-0" style={{ height: '400px' }} title="Completed document" />
                ) : (
                  <div className="p-4 text-center bg-gray-50">
                    <FileText size={28} className="text-gray-300 mx-auto mb-1" />
                    <p className="text-sm text-gray-500 font-medium">Completed Document</p>
                    <a href={viewForm.data._uploaded_document} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-semibold transition-colors">
                      <Download size={14} /> Open Document
                    </a>
                  </div>
                )}
              </div>
            )}

            {/* Form data fields — view or edit mode */}
            {editingForm ? (
              <div className="space-y-3">
                <p className="text-xs font-bold text-orange-500 uppercase tracking-wider flex items-center gap-1.5"><Pencil size={12} /> Editing Form Data</p>
                {(() => {
                  const fields = getFields(viewForm.form_type)
                  const fieldLabelMap = {}
                  if (fields) fields.forEach(f => { fieldLabelMap[f.key] = f.label })
                  return Object.entries(editData).map(([k, v]) => {
                    if (typeof v === 'string' && v.startsWith('data:image')) return null
                    if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
                      return (
                        <div key={k} className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                          <p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabelMap[k] || k.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-500 italic">Complex data — view only</p>
                        </div>
                      )
                    }
                    const isLong = typeof v === 'string' && v.length > 60
                    return (
                      <div key={k} className="p-3 rounded-xl bg-white border-2 border-orange-200">
                        <p className="text-xs text-orange-600 font-semibold capitalize mb-1">{fieldLabelMap[k] || k.replace(/_/g, ' ')}</p>
                        {isLong ? (
                          <textarea value={v || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} rows={3}
                            className="w-full text-sm text-gray-800 bg-orange-50/50 border border-orange-100 rounded-lg px-2.5 py-2 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/50 resize-none" />
                        ) : (
                          <input type="text" value={v || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })}
                            className="w-full text-sm font-semibold text-gray-800 bg-orange-50/50 border border-orange-100 rounded-lg px-2.5 py-1.5 outline-none focus:border-orange-300 focus:ring-2 focus:ring-orange-200/50" />
                        )}
                      </div>
                    )
                  })
                })()}
                {(() => {
                  const presetFields = [
                    { key: 'admin_notes', label: 'Admin Notes' },
                    { key: 'follow_up_action', label: 'Follow Up Action' },
                    { key: 'reviewed_comments', label: 'Reviewed Comments' },
                    { key: 'corrective_action', label: 'Corrective Action' },
                    { key: 'outcome', label: 'Outcome' },
                  ].filter(f => !editData[f.key])
                  if (presetFields.length === 0) return null
                  return (
                    <div className="flex flex-wrap gap-2">
                      {presetFields.map(f => (
                        <button key={f.key} onClick={() => setEditData({ ...editData, [f.key]: '' })}
                          className="px-3 py-2 border-2 border-dashed border-gray-300 rounded-xl text-xs text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all">
                          + {f.label}
                        </button>
                      ))}
                    </div>
                  )
                })()}
              </div>
            ) : (
              viewForm.data && Object.entries(viewForm.data).filter(([k, v]) => v !== null && v !== undefined && v !== '').length > 0 ? (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Form Data</p>
                    <button onClick={() => { const sub = viewForm; setViewForm(null); setTimeout(() => setPrintView(sub), 100) }} className="flex items-center gap-1.5 px-3 py-1.5 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg text-white text-xs font-semibold shadow hover:shadow-lg transition-all">
                      <Printer size={12} /> View Full Form / Print
                    </button>
                  </div>
                  {(() => {
                    const fields = getFields(viewForm.form_type)
                    const fMap = {}; if (fields) fields.forEach(f => { fMap[f.key] = f.label })
                    return Object.entries(viewForm.data).filter(([k, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => {
                      const fieldLabel = fMap[k] || k.replace(/_/g, ' ')
                    // Skip base64 signatures in display
                    if (typeof v === 'string' && v.startsWith('data:image')) {
                      return (
                        <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium capitalize mb-1">{fieldLabel}</p>
                          <img src={v} alt="Signature" className="h-12 border border-gray-200 rounded-lg bg-gray-50" />
                        </div>
                      )
                    }
                    // Handle arrays (like items, actions, checkboxes)
                    if (Array.isArray(v)) {
                      if (v.length === 0) return null
                      if (typeof v[0] === 'string') {
                        return (
                          <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                            <p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p>
                            <p className="text-sm text-gray-800">{v.join(', ')}</p>
                          </div>
                        )
                      }
                      return (
                        <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium capitalize mb-2">{fieldLabel} ({v.length} entries)</p>
                          <div className="space-y-1.5">
                            {v.map((item, i) => (
                              <div key={i} className="p-2 bg-gray-50 rounded-lg text-xs text-gray-700">
                                {Object.entries(item).filter(([ik, iv]) => iv && !(typeof iv === 'string' && iv.startsWith('data:image'))).map(([ik, iv]) => (
                                  <span key={ik} className="inline-block mr-3"><span className="text-gray-400 capitalize">{ik.replace(/_/g, ' ')}:</span> <span className="font-medium">{String(iv)}</span></span>
                                ))}
                              </div>
                            ))}
                          </div>
                        </div>
                      )
                    }
                    // Handle objects (like totals)
                    if (typeof v === 'object') {
                      return (
                        <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                          <p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p>
                          <p className="text-sm text-gray-800">{Object.entries(v).map(([ok, ov]) => `${ok.replace(/_/g, ' ')}: ${ov}`).join(' · ')}</p>
                        </div>
                      )
                    }
                    return (
                      <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                        <p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p>
                        <p className="text-sm text-gray-800 whitespace-pre-wrap">{String(v)}</p>
                      </div>
                    )
                  })
                  })()}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No data recorded</p>
              )
            )}

            {/* Actions */}
            <div className="flex gap-2 pt-2 border-t border-gray-100">
              {!editingForm && (
                <>
                  {viewForm.status === 'submitted' && (
                    <button onClick={() => handleStatusChange(viewForm.id, 'reviewed')} disabled={updating}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50">
                      <Check size={16} /> Mark as Reviewed
                    </button>
                  )}
                  {viewForm.status !== 'flagged' && (
                    <button onClick={() => handleStatusChange(viewForm.id, 'flagged')} disabled={updating}
                      className="flex-1 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50">
                      <Flag size={16} /> Flag
                    </button>
                  )}
                  {viewForm.status === 'flagged' && (
                    <button onClick={() => handleStatusChange(viewForm.id, 'reviewed')} disabled={updating}
                      className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2 disabled:opacity-50">
                      <Check size={16} /> Resolve & Mark Reviewed
                    </button>
                  )}
                  <button onClick={() => handleDeleteForm(viewForm.id)} disabled={updating}
                    className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl text-sm font-semibold text-gray-500 transition-colors disabled:opacity-50 flex items-center gap-1.5">
                    <Trash2 size={14} /> Delete
                  </button>
                </>
              )}
              <button onClick={() => { setViewForm(null); setEditingForm(false) }} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">Close</button>
            </div>
          </div>
        )}
      </Modal>
      </>)}

      {/* ===== TEMPLATES TAB ===== */}
      {activeTab === 'templates' && (
        <div className="space-y-4">
          {templates.length > 0 ? (
            <div className="grid gap-4">
              {templates.map(t => (
                <div key={t.id} className={`bg-white/80 rounded-2xl border shadow-sm backdrop-blur-sm overflow-hidden transition-all ${t.active ? 'border-gray-200' : 'border-gray-100 opacity-60'}`}>
                  <div className="p-5 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${t.color || 'from-teal-500 to-cyan-500'} flex items-center justify-center shadow-lg shrink-0`}>
                      <FileText size={20} className="text-white" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        <h3 className="font-bold text-gray-900">{t.title}</h3>
                        {t.mandatory && <Badge color="red">Mandatory</Badge>}
                        {t.document_url && <Badge color="blue">Has Document</Badge>}
                        <Badge color={t.active ? 'green' : 'gray'}>{t.active ? 'Active' : 'Inactive'}</Badge>
                      </div>
                      {t.description && <p className="text-sm text-gray-500 mt-0.5">{t.description}</p>}
                      <div className="flex flex-wrap gap-1.5 mt-2">
                        {(t.fields || []).map((f, i) => (
                          <span key={i} className="px-2 py-0.5 bg-gray-100 rounded-md text-[10px] font-medium text-gray-500">
                            {f.label} <span className="text-gray-300">·</span> {f.type}{f.required ? ' *' : ''}
                          </span>
                        ))}
                      </div>
                      <p className="text-[10px] text-gray-400 mt-2">{(t.fields || []).length} fields{t.document_url ? ' · Document attached' : ''} · Created {new Date(t.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                    </div>
                    <div className="flex flex-col sm:flex-row gap-2 shrink-0">
                      <button onClick={() => handleToggleTemplate(t.id, t.active)}
                        className={`p-2 rounded-lg border transition-colors ${t.active ? 'bg-emerald-50 border-emerald-200 hover:bg-emerald-100' : 'bg-gray-50 border-gray-200 hover:bg-gray-100'}`}
                        title={t.active ? 'Deactivate' : 'Activate'}>
                        {t.active ? <ToggleRight size={16} className="text-emerald-600" /> : <ToggleLeft size={16} className="text-gray-400" />}
                      </button>
                      <button onClick={() => openEditTemplate(t)} className="p-2 rounded-lg bg-orange-50 hover:bg-orange-100 border border-orange-200 transition-colors" title="Edit">
                        <Pencil size={16} className="text-orange-600" />
                      </button>
                      <button onClick={() => duplicateTemplate(t)} className="p-2 rounded-lg bg-blue-50 hover:bg-blue-100 border border-blue-200 transition-colors" title="Duplicate">
                        <Copy size={16} className="text-blue-600" />
                      </button>
                      <button onClick={() => handleDeleteTemplate(t.id)} className="p-2 rounded-lg bg-gray-50 hover:bg-red-50 hover:border-red-200 border border-gray-200 transition-colors" title="Delete">
                        <Trash2 size={16} className="text-gray-400 hover:text-red-500" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm p-16 text-center">
              <FileText size={48} className="text-gray-200 mx-auto mb-3" />
              <p className="font-bold text-gray-800">No form templates yet</p>
              <p className="text-sm text-gray-400 mt-1 mb-4">Create a template and staff will see it on their forms page</p>
              <button onClick={openNewTemplate} className="px-5 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 inline-flex items-center gap-2">
                <Plus size={16} /> Create First Template
              </button>
            </div>
          )}
        </div>
      )}

      {/* ===== TEMPLATE BUILDER MODAL ===== */}
      <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={editingTemplate ? 'Edit Template' : 'Create Form Template'} wide>
        <div className="space-y-5">
          {/* Template basics */}
          <div className="space-y-3">
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Template Title *</label>
              <input type="text" value={templateForm.title} onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })}
                placeholder="e.g. Daily Handover Report" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300" />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-500 mb-1">Description</label>
              <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })}
                placeholder="Brief description for staff" className="w-full px-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-orange-500/20 focus:border-orange-300" />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="block text-xs font-bold text-gray-500 mb-1">Color</label>
                <div className="flex flex-wrap gap-2">
                  {colorOptions.map(c => (
                    <button key={c.value} onClick={() => setTemplateForm({ ...templateForm, color: c.value })}
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${c.value} shadow-sm transition-all ${templateForm.color === c.value ? 'ring-2 ring-offset-2 ring-orange-400 scale-110' : 'hover:scale-105'}`}
                      title={c.label} />
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-1">Mandatory</label>
                <button onClick={() => setTemplateForm({ ...templateForm, mandatory: !templateForm.mandatory })}
                  className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-sm font-semibold transition-all ${templateForm.mandatory ? 'bg-red-50 border-red-200 text-red-700' : 'bg-gray-50 border-gray-200 text-gray-500'}`}>
                  {templateForm.mandatory ? <ToggleRight size={18} className="text-red-500" /> : <ToggleLeft size={18} />}
                  {templateForm.mandatory ? 'Yes' : 'No'}
                </button>
              </div>
            </div>
          </div>

          {/* Document upload */}
          <div>
            <label className="block text-xs font-bold text-gray-500 mb-2">Attached Document (optional)</label>
            {docUrl || docFile ? (
              <div className="p-3 bg-white border border-gray-200 rounded-xl flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-blue-500 to-indigo-500 flex items-center justify-center shrink-0">
                  {docUploading ? <Loader2 size={18} className="text-white animate-spin" /> : <FileText size={18} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{docFile?.name || docUrl?.split('/').pop()}</p>
                  <p className="text-[10px] text-gray-400">{docUploading ? 'Uploading...' : docFile ? `${(docFile.size / 1024).toFixed(0)} KB · Uploaded` : 'Uploaded'}</p>
                </div>
                {docUrl && (
                  <a href={docUrl} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg hover:bg-gray-50 text-gray-400 hover:text-blue-500 transition-colors">
                    <Download size={16} />
                  </a>
                )}
                <button onClick={() => { setDocUrl(null); setDocFile(null) }} disabled={docUploading} className="p-2 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors disabled:opacity-30">
                  <X size={16} />
                </button>
              </div>
            ) : (
              <label className={`block p-6 border-2 border-dashed rounded-xl text-center cursor-pointer transition-all ${docUploading ? 'border-orange-300 bg-orange-50' : 'border-gray-200 hover:border-orange-300 hover:bg-orange-50/50'}`}>
                <input type="file" accept=".pdf,.doc,.docx" className="hidden" onChange={e => handleDocUpload(e.target.files?.[0])} disabled={docUploading} />
                {docUploading ? (
                  <div className="flex flex-col items-center gap-2">
                    <Loader2 size={24} className="animate-spin text-orange-500" />
                    <p className="text-sm text-orange-600 font-medium">Uploading...</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <Upload size={24} className="text-gray-300" />
                    <p className="text-sm text-gray-500 font-medium">Drop a PDF or Word document here</p>
                    <p className="text-[10px] text-gray-400">Staff will see this document when filling out the form</p>
                  </div>
                )}
              </label>
            )}
          </div>

          {/* Fields builder */}
          <div>
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Form Fields ({templateForm.fields.length})</p>
              <button onClick={addField} className="flex items-center gap-1 px-3 py-1.5 bg-orange-50 hover:bg-orange-100 border border-orange-200 rounded-lg text-xs font-bold text-orange-600 transition-all">
                <Plus size={13} /> Add Field
              </button>
            </div>

            {templateForm.fields.length > 0 ? (
              <div className="space-y-2">
                {templateForm.fields.map((field, idx) => (
                  <div key={idx} className="p-3 bg-white border border-gray-200 rounded-xl">
                    <div className="flex items-start gap-2">
                      {/* Reorder */}
                      <div className="flex flex-col gap-0.5 pt-1 shrink-0">
                        <button onClick={() => moveField(idx, -1)} disabled={idx === 0} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronDown size={12} className="rotate-180" /></button>
                        <button onClick={() => moveField(idx, 1)} disabled={idx === templateForm.fields.length - 1} className="p-0.5 rounded hover:bg-gray-100 text-gray-400 disabled:opacity-30"><ChevronDown size={12} /></button>
                      </div>

                      {/* Field config */}
                      <div className="flex-1 grid grid-cols-1 sm:grid-cols-3 gap-2">
                        <input type="text" value={field.label} onChange={e => updateField(idx, { label: e.target.value })}
                          placeholder="Field label" className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm font-semibold focus:outline-none focus:border-orange-300 sm:col-span-1" />
                        <select value={field.type} onChange={e => updateField(idx, { type: e.target.value })}
                          className="px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:border-orange-300">
                          <option value="text">Text (short)</option>
                          <option value="textarea">Text (long)</option>
                          <option value="number">Number</option>
                          <option value="date">Date</option>
                          <option value="time">Time</option>
                          <option value="select">Dropdown</option>
                          <option value="checkbox">Checkbox</option>
                        </select>
                        <div className="flex items-center gap-2">
                          <label className="flex items-center gap-1.5 text-xs font-medium text-gray-500 cursor-pointer">
                            <input type="checkbox" checked={field.required || false} onChange={e => updateField(idx, { required: e.target.checked })}
                              className="w-3.5 h-3.5 rounded border-gray-300 text-orange-500 focus:ring-orange-500" />
                            Required
                          </label>
                          <button onClick={() => removeField(idx)} className="ml-auto p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors">
                            <Trash2 size={13} />
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Dropdown options */}
                    {field.type === 'select' && (
                      <div className="mt-2 ml-7">
                        <p className="text-[10px] text-gray-400 font-medium mb-1">Options (comma separated)</p>
                        <input type="text" value={(field.options || []).join(', ')} onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
                          placeholder="e.g. Low, Medium, High" className="w-full px-2.5 py-1.5 bg-gray-50 border border-gray-200 rounded-lg text-xs focus:outline-none focus:border-orange-300" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center border-2 border-dashed border-gray-200 rounded-xl">
                <p className="text-sm text-gray-400">No fields yet. Click "Add Field" to start building your form.</p>
              </div>
            )}

            {/* Quick-add common fields */}
            <div className="mt-3">
              <p className="text-[10px] text-gray-400 font-medium mb-1.5">Quick add:</p>
              <div className="flex flex-wrap gap-1.5">
                {[
                  { label: 'Participant Name', type: 'text', required: true },
                  { label: 'Date', type: 'date', required: true },
                  { label: 'Time', type: 'time', required: false },
                  { label: 'Notes', type: 'textarea', required: false },
                  { label: 'Severity', type: 'select', required: false, options: ['Low', 'Medium', 'High', 'Critical'] },
                  { label: 'Location', type: 'text', required: false },
                  { label: 'Witness', type: 'text', required: false },
                  { label: 'Follow Up Required', type: 'checkbox', required: false },
                ].filter(qf => !templateForm.fields.some(f => f.label === qf.label)).map(qf => (
                  <button key={qf.label} onClick={() => setTemplateForm(prev => ({ ...prev, fields: [...prev.fields, { ...qf, key: qf.label.toLowerCase().replace(/\s+/g, '_') }] }))}
                    className="px-2.5 py-1 border border-dashed border-gray-300 rounded-lg text-[10px] text-gray-500 hover:border-orange-300 hover:text-orange-600 hover:bg-orange-50 font-medium transition-all">
                    + {qf.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Preview */}
          {templateForm.fields.length > 0 && (
            <div>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Preview</p>
              <div className="p-4 bg-gray-50 border border-gray-200 rounded-xl space-y-2.5">
                <div className="flex items-center gap-2 mb-3">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${templateForm.color} flex items-center justify-center shadow-sm`}>
                    <FileText size={14} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{templateForm.title || 'Untitled'}</p>
                    {templateForm.description && <p className="text-[10px] text-gray-400">{templateForm.description}</p>}
                  </div>
                </div>
                {templateForm.fields.map((f, i) => (
                  <div key={i}>
                    <label className="block text-xs font-medium text-gray-500 mb-0.5">{f.label}{f.required ? ' *' : ''}</label>
                    {f.type === 'textarea' ? (
                      <div className="w-full h-14 bg-white border border-gray-200 rounded-lg" />
                    ) : f.type === 'select' ? (
                      <div className="w-full h-8 bg-white border border-gray-200 rounded-lg flex items-center px-2 text-[10px] text-gray-400">{(f.options || []).join(' / ') || 'Select...'}</div>
                    ) : f.type === 'checkbox' ? (
                      <div className="w-4 h-4 bg-white border border-gray-200 rounded" />
                    ) : (
                      <div className="w-full h-8 bg-white border border-gray-200 rounded-lg" />
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Save/Cancel */}
          <div className="flex gap-2 pt-2 border-t border-gray-100">
            <button onClick={handleSaveTemplate} disabled={savingTemplate}
              className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 flex items-center justify-center gap-2 disabled:opacity-50">
              {savingTemplate ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {editingTemplate ? 'Update Template' : 'Create Template'}
            </button>
            <button onClick={() => setShowTemplateModal(false)} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">Cancel</button>
          </div>
        </div>
      </Modal>

      {/* Full Form Print View */}
      {printView && (
        <PrintableForm
          data={printView.data || {}}
          formType={printView.form_type}
          staffName={printView.staff ? `${printView.staff.first_name} ${printView.staff.last_name}` : 'Unknown'}
          submittedAt={printView.submitted_at}
          onClose={() => setPrintView(null)}
          templateFields={getFields(printView.form_type)}
        />
      )}
    </div>
  )
}