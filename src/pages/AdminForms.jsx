import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  ClipboardList, Search, Filter, Eye, Check, Clock, AlertTriangle,
  AlertOctagon, DollarSign, Pill, Loader2, X, ChevronDown, Flag, Pencil, Save, Trash2,
  Plus, GripVertical, ToggleLeft, ToggleRight, Copy, FileText, Upload, Download, Printer,
  Sparkles, ArrowRight, BarChart3, Layers, Shield, Users, Calendar, Activity, Hash, Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import PrintableForm from '../components/FormPrintView'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      style={{
        background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`, borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}
    >{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) { const p = Math.min((now - start) / duration, 1); setDisplay(Math.round(num * (1 - Math.pow(1 - p, 3)))); if (p < 1) ref.current = requestAnimationFrame(tick) }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{display}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}


/* ─── Config (100% preserved) ─── */
const formLabels = {
  medication_chart: 'Medication Chart', medication_incident: 'Medication Incident',
  incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation',
  complaints_form: 'Complaints / Feedback', complaints_feedback: 'Complaints / Feedback',
  hazard_form: 'Hazard Report', hazard_report: 'Hazard Report',
}
const formIcons = {
  medication_chart: Pill, medication_incident: AlertOctagon,
  incident_report: AlertTriangle, cash_reconciliation: DollarSign,
  complaints_form: ClipboardList, complaints_feedback: ClipboardList,
  hazard_form: AlertTriangle, hazard_report: AlertTriangle,
}
const formColorValues = {
  medication_chart: { grad: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59,130,246,0.15)' },
  medication_incident: { grad: 'linear-gradient(135deg, #ef4444, #f43f5e)', glow: 'rgba(239,68,68,0.15)' },
  incident_report: { grad: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.15)' },
  cash_reconciliation: { grad: 'linear-gradient(135deg, #10b981, #14b8a6)', glow: 'rgba(16,185,129,0.15)' },
  complaints_form: { grad: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.15)' },
  complaints_feedback: { grad: 'linear-gradient(135deg, #8b5cf6, #7c3aed)', glow: 'rgba(139,92,246,0.15)' },
  hazard_form: { grad: 'linear-gradient(135deg, #f43f5e, #ec4899)', glow: 'rgba(244,63,94,0.15)' },
  hazard_report: { grad: 'linear-gradient(135deg, #f43f5e, #ec4899)', glow: 'rgba(244,63,94,0.15)' },
}
const formColors = {
  medication_chart: 'from-blue-500 to-indigo-500', medication_incident: 'from-red-500 to-rose-500',
  incident_report: 'from-amber-500 to-orange-500', cash_reconciliation: 'from-emerald-500 to-teal-500',
  complaints_form: 'from-violet-500 to-purple-500', complaints_feedback: 'from-violet-500 to-purple-500',
  hazard_form: 'from-rose-500 to-pink-500', hazard_report: 'from-rose-500 to-pink-500',
}
const formGlows = {
  medication_chart: 'rgba(59,130,246,0.15)', medication_incident: 'rgba(239,68,68,0.15)',
  incident_report: 'rgba(245,158,11,0.15)', cash_reconciliation: 'rgba(16,185,129,0.15)',
  complaints_form: 'rgba(139,92,246,0.15)', complaints_feedback: 'rgba(139,92,246,0.15)',
  hazard_form: 'rgba(244,63,94,0.15)', hazard_report: 'rgba(244,63,94,0.15)',
}
const statusLabels = { submitted: 'Submitted', reviewed: 'Reviewed', flagged: 'Flagged', archived: 'Archived' }
const statusColors = { submitted: 'amber', reviewed: 'green', flagged: 'red', archived: 'gray' }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function AdminForms() {
  const cc = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
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
  const [templates, setTemplates] = useState([])
  const [showTemplateModal, setShowTemplateModal] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState(null)
  const [templateForm, setTemplateForm] = useState({ title: '', description: '', mandatory: false, color: 'from-teal-500 to-cyan-500', fields: [] })
  const [savingTemplate, setSavingTemplate] = useState(false)
  const [docUploading, setDocUploading] = useState(false)
  const [docFile, setDocFile] = useState(null)
  const [docUrl, setDocUrl] = useState(null)

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }

  const stg = (i) => ({ transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0, transform: loaded ? 'translateY(0)' : 'translateY(14px)', transition: 'all .6s cubic-bezier(.16,1,.3,1)' })
  const inputStyle = { width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s' }


  /* ═══════════════════════════════════════════════════
     ALL BACKEND LOGIC — 100% PRESERVED, ZERO CHANGES
     ═══════════════════════════════════════════════════ */

  useEffect(() => {
    async function init() {
      try {
        const [formsRes, tplsRes] = await Promise.all([
          supabase.from('form_submissions').select('*, staff:staff_id(first_name, last_name, email)').order('submitted_at', { ascending: false }),
          supabase.from('form_templates').select('*').order('created_at', { ascending: false }),
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

  useEffect(() => { if (!loading) setTimeout(() => setLoaded(true), 50) }, [loading])

  const reloadSubmissions = async () => {
    try { const { data } = await supabase.from('form_submissions').select('*, staff:staff_id(first_name, last_name, email)').order('submitted_at', { ascending: false }); setSubmissions(data || []) } catch {}
  }

  const reloadTemplates = async () => {
    try { const { data } = await supabase.from('form_templates').select('*').order('created_at', { ascending: false }); if (data) setTemplates(data) } catch {}
  }

  const handleStatusChange = async (id, newStatus) => {
    setUpdating(true)
    try {
      const { error } = await supabase.from('form_submissions').update({ status: newStatus }).eq('id', id)
      if (error) throw error
      setSubmissions(prev => prev.map(s => s.id === id ? { ...s, status: newStatus } : s))
      if (viewForm?.id === id) setViewForm(prev => ({ ...prev, status: newStatus }))
    } catch (err) { alert('Failed to update: ' + err.message) }
    finally { setUpdating(false) }
  }

  const startEditing = () => { setEditData({ ...(viewForm.data || {}) }); setEditingForm(true) }

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
    } catch (err) { alert('Failed to save: ' + err.message) }
    finally { setUpdating(false) }
  }

  const handleDeleteForm = async (id) => {
    if (!confirm('Delete this form submission? This cannot be undone.')) return
    setUpdating(true)
    try {
      const { error } = await supabase.from('form_submissions').delete().eq('id', id)
      if (error) throw error
      setSubmissions(prev => prev.filter(s => s.id !== id))
      setViewForm(null); setEditingForm(false)
    } catch (err) { alert('Failed to delete: ' + err.message) }
    finally { setUpdating(false) }
  }

  const openNewTemplate = () => {
    setEditingTemplate(null)
    setTemplateForm({ title: '', description: '', mandatory: false, color: 'from-teal-500 to-cyan-500', fields: [{ key: 'participant_name', label: 'Participant Name', type: 'text', required: true }] })
    setDocFile(null); setDocUrl(null); setShowTemplateModal(true)
  }

  const openEditTemplate = (t) => {
    setEditingTemplate(t)
    setTemplateForm({ title: t.title, description: t.description || '', mandatory: t.mandatory || false, color: t.color || 'from-teal-500 to-cyan-500', fields: t.fields || [] })
    setDocFile(null); setDocUrl(t.document_url || null); setShowTemplateModal(true)
  }

  const handleDocUpload = async (file) => {
    if (!file) return
    const allowed = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']
    if (!allowed.includes(file.type) && !file.name.match(/\.(pdf|doc|docx)$/i)) { alert('Please upload a PDF or Word document (.pdf, .doc, .docx)'); return }
    if (file.size > 10 * 1024 * 1024) { alert('File too large — max 10MB'); return }
    setDocUploading(true); setDocFile(file)
    if (!templateForm.title.trim()) {
      const name = file.name.replace(/\.[^.]+$/, '').replace(/[_-]/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
      setTemplateForm(prev => ({ ...prev, title: name }))
    }
    try {
      const fileName = `form-templates/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('documents').upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type || 'application/octet-stream' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      setDocUrl(urlData.publicUrl)
    } catch (err) { console.error('Upload error:', err); alert('Upload failed: ' + (err.message || 'Unknown error')); setDocFile(null) }
    finally { setDocUploading(false) }
  }

  const addField = () => { setTemplateForm(prev => ({ ...prev, fields: [...prev.fields, { key: `field_${Date.now()}`, label: '', type: 'text', required: false }] })) }
  const updateField = (idx, updates) => { setTemplateForm(prev => ({ ...prev, fields: prev.fields.map((f, i) => i === idx ? { ...f, ...updates } : f) })) }
  const removeField = (idx) => { setTemplateForm(prev => ({ ...prev, fields: prev.fields.filter((_, i) => i !== idx) })) }
  const moveField = (idx, dir) => {
    const newIdx = idx + dir
    if (newIdx < 0 || newIdx >= templateForm.fields.length) return
    setTemplateForm(prev => { const arr = [...prev.fields]; [arr[idx], arr[newIdx]] = [arr[newIdx], arr[idx]]; return { ...prev, fields: arr } })
  }

  const handleSaveTemplate = async () => {
    if (!templateForm.title.trim()) { alert('Template title is required'); return }
    if (templateForm.fields.length === 0 && !docUrl) { alert('Add at least one field or upload a document'); return }
    const emptyLabel = templateForm.fields.find(f => !(f.label || '').trim())
    if (emptyLabel) { alert('All fields must have a label'); return }
    setSavingTemplate(true)
    try {
      const fields = templateForm.fields.map(f => ({ ...f, key: (f.label || '').toLowerCase().replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '') || f.key, options: f.type === 'select' ? (f.options || []) : undefined }))
      const payload = { title: templateForm.title.trim(), description: (templateForm.description || '').trim() || null, mandatory: templateForm.mandatory || false, color: templateForm.color || 'from-teal-500 to-cyan-500', fields, active: true }
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
    } catch (err) { console.error('Template save error:', err); alert('Failed to save: ' + (err.message || JSON.stringify(err))) }
    finally { setSavingTemplate(false) }
  }

  const handleToggleTemplate = async (id, active) => {
    try { const { error } = await supabase.from('form_templates').update({ active: !active }).eq('id', id); if (error) throw error; setTemplates(prev => prev.map(t => t.id === id ? { ...t, active: !active } : t)) }
    catch (err) { alert('Failed: ' + err.message) }
  }

  const handleDeleteTemplate = async (id) => {
    if (!confirm('Delete this template? Staff will no longer see it.')) return
    try { const { error } = await supabase.from('form_templates').delete().eq('id', id); if (error) throw error; setTemplates(prev => prev.filter(t => t.id !== id)) }
    catch (err) { alert('Failed: ' + err.message) }
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


  /* ── Computed (100% preserved) ── */
  const filtered = useMemo(() => submissions.filter(s => {
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
  }), [submissions, typeFilter, statusFilter, search])

  const totalSubmitted = submissions.filter(s => s.status === 'submitted').length
  const totalReviewed = submissions.filter(s => s.status === 'reviewed').length
  const totalFlagged = submissions.filter(s => s.status === 'flagged').length
  const typeCounts = {}
  submissions.forEach(s => { typeCounts[s.form_type] = (typeCounts[s.form_type] || 0) + 1 })

  const tplLabelMap = {}, tplColorMap = {}, tplDocMap = {}, tplFieldsMap = {}
  templates.forEach(t => {
    const key = `template_${t.id}`
    tplLabelMap[key] = t.title
    tplColorMap[key] = t.color || 'from-teal-500 to-cyan-500'
    if (t.document_url) tplDocMap[key] = t.document_url
    if (t.fields) tplFieldsMap[key] = t.fields
  })

  const getLabel = (ft) => formLabels[ft] || tplLabelMap[ft] || ft?.replace(/_/g, ' ') || 'Form'
  const getColor = (ft) => formColors[ft] || tplColorMap[ft] || 'from-gray-400 to-gray-500'
  const getGlow = (ft) => formGlows[ft] || `${cc.primary}15`
  const getDocUrl = (ft) => tplDocMap[ft] || null
  const getFields = (ft) => tplFieldsMap[ft] || null
  const getGradValue = (ft) => formColorValues[ft]?.grad || `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`
  const getGlowValue = (ft) => formColorValues[ft]?.glow || `${cc.primary}15`


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${cc.primary}40` }}><ClipboardList size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading forms...</p>
    </div>
  )

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={cc.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#ec4899" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${cc.primary} 0%, ${cc.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><ClipboardList size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Form Management</span></div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Forms & Templates</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>{submissions.length} submissions · {templates.filter(t => t.active).length} active templates</p>
                </div>
                <div style={{ display: 'flex', gap: 10 }}>
                  <button onClick={() => setActiveTab('templates')} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 18px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}><FileText size={16} /> Templates</button>
                  {activeTab === 'templates' && <button onClick={openNewTemplate} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 22px', borderRadius: 16, border: 'none', background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}><Plus size={18} /> Create</button>}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { text: `${totalSubmitted} pending review`, bg: totalSubmitted > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { text: `${totalReviewed} reviewed` },
                  { text: `${totalFlagged} flagged`, bg: totalFlagged > 0 ? 'rgba(239,68,68,0.3)' : undefined },
                  { text: `${templates.length} templates` },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ STAT CARDS ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, ...stg(1) }}>
          {[
            { label: 'Pending Review', count: totalSubmitted, icon: Clock, grad: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.2)' },
            { label: 'Reviewed', count: totalReviewed, icon: Check, grad: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.2)' },
            { label: 'Flagged', count: totalFlagged, icon: Flag, grad: 'linear-gradient(135deg, #ef4444, #f43f5e)', glow: 'rgba(239,68,68,0.2)', pulse: totalFlagged > 0 },
            { label: 'Total Forms', count: submissions.length, icon: ClipboardList, grad: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, glow: `${cc.primary}30` },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px', position: 'relative', overflow: 'hidden' }}>
              {card.pulse && <div style={{ position: 'absolute', top: 14, right: 14, width: 8, height: 8, borderRadius: '50%', background: '#ef4444', animation: 'pulse-dot 2s ease-in-out infinite' }} />}
              <div style={{ width: 42, height: 42, borderRadius: 12, background: card.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12 }}><card.icon size={20} color="white" /></div>
              <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up"><AnimNum value={card.count} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{card.label}</p>
            </Glass>
          ))}
        </div>

        {/* ══════════ TABS ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(2) }}>
          <div style={{ display: 'flex', gap: 4 }}>
            {[
              { id: 'submissions', label: 'Submissions', icon: ClipboardList, count: submissions.length },
              { id: 'templates', label: 'Templates', icon: FileText, count: templates.length },
            ].map(t => {
              const isActive = activeTab === t.id
              return (
                <button key={t.id} onClick={() => setActiveTab(t.id)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 20px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', flex: '1 1 auto', justifyContent: 'center',
                  background: isActive ? `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${cc.primary}60` : 'none',
                }}>
                  <t.icon size={15} /> {t.label}
                  <span style={{ fontSize: 10, fontWeight: 800, padding: '2px 7px', borderRadius: 8, background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2, color: isActive ? 'rgba(255,255,255,0.9)' : dk.textFaint }}>{t.count}</span>
                </button>
              )
            })}
          </div>
        </Glass>

        {/* ══════════ SUBMISSIONS TAB ══════════ */}
        {activeTab === 'submissions' && (<>
          {/* Form type breakdown */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 10, ...stg(3) }}>
            {Object.entries(formLabels).map(([type, label]) => {
              const Icon = formIcons[type] || ClipboardList
              const isActive = typeFilter === type
              const cv = formColorValues[type] || { grad: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, glow: `${cc.primary}15` }
              return (
                <Glass key={type} dark={isDark} hover glow={isActive ? `${cc.primary}25` : cv.glow}
                  style={{ padding: '16px 18px', cursor: 'pointer', borderColor: isActive ? `${cc.primary}50` : undefined }}
                  onClick={() => setTypeFilter(typeFilter === type ? 'all' : type)}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 10 }}>
                    <div style={{ width: 42, height: 42, borderRadius: 12, background: cv.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px -4px ${cv.glow}` }}><Icon size={20} color="white" /></div>
                    <span style={{ fontSize: 22, fontWeight: 800, color: dk.text }}>{typeCounts[type] || 0}</span>
                  </div>
                  <p style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{label}</p>
                  {isActive && <div style={{ height: 3, borderRadius: 999, marginTop: 10, background: `linear-gradient(to right, ${cc.primary}, ${cc.adminHover})` }} />}
                </Glass>
              )
            })}
          </div>

          {/* Search & Filters */}
          <Glass dark={isDark} style={{ ...stg(4), padding: '12px 18px' }}>
            <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
              <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
                <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by staff, participant, or form type..." style={{ ...inputStyle, paddingLeft: 40 }} onFocus={e => e.target.style.borderColor = cc.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
              </div>
              <div style={{ position: 'relative' }}>
                <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{ padding: '11px 36px 11px 14px', background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', appearance: 'none', cursor: 'pointer', minWidth: 140 }}>
                  <option value="all">All Statuses</option>
                  <option value="submitted">Pending Review</option>
                  <option value="reviewed">Reviewed</option>
                  <option value="flagged">Flagged</option>
                  <option value="archived">Archived</option>
                </select>
                <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
              </div>
              {(typeFilter !== 'all' || statusFilter !== 'all' || search) && (
                <button onClick={() => { setTypeFilter('all'); setStatusFilter('all'); setSearch('') }} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '11px 16px', borderRadius: 12, background: dk.subtleBg2, border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer' }}><X size={14} /> Clear</button>
              )}
              <span style={{ fontSize: 12, fontWeight: 600, color: dk.textFaint, padding: '6px 12px', borderRadius: 10, background: dk.subtleBg }}>{filtered.length} result{filtered.length !== 1 ? 's' : ''}</span>
            </div>
          </Glass>

          {/* Submissions list */}
          <Glass dark={isDark} glow={`${cc.primary}06`} style={{ ...stg(5), padding: 0, overflow: 'hidden' }}>
            {filtered.length > 0 ? (
              <div>
                {filtered.map((sub, i) => {
                  const Icon = formIcons[sub.form_type] || ClipboardList
                  const staffN = sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'
                  const pName = sub.data?.participant_name || '—'
                  const label = getLabel(sub.form_type)
                  const cv = formColorValues[sub.form_type] || { grad: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})` }

                  return (
                    <div key={sub.id} style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 14, borderBottom: i < filtered.length - 1 ? `1px solid ${dk.divider}` : undefined, transition: 'background .2s', cursor: 'default' }}
                      onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.02)' : `${cc.primary}02`}
                      onMouseLeave={e => e.currentTarget.style.background = ''}>
                      <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: cv.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 16px -4px ${cv.glow || cc.primary + '30'}` }}><Icon size={22} color="white" /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{label}</p>
                          {getDocUrl(sub.form_type) && <Badge color="blue" dark={isDark}>Doc</Badge>}
                          <Badge color={statusColors[sub.status] || 'gray'} dark={isDark}>{statusLabels[sub.status] || sub.status}</Badge>
                        </div>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}><span style={{ fontWeight: 600 }}>{staffN}</span>{pName !== '—' && <> · Participant: <span style={{ fontWeight: 600 }}>{pName}</span></>}</p>
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>
                          {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}
                          {sub.submitted_at && ` · ${new Date(sub.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}`}
                        </p>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                        {sub.status === 'submitted' && <button onClick={() => handleStatusChange(sub.id, 'reviewed')} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}`, background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Mark reviewed"><Check size={15} style={{ color: '#10b981' }} /></button>}
                        {sub.status !== 'flagged' && <button onClick={() => handleStatusChange(sub.id, 'flagged')} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`, background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Flag"><Flag size={15} style={{ color: '#ef4444' }} /></button>}
                        <button onClick={() => setPrintView(sub)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`, background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Print"><Printer size={15} style={{ color: '#3b82f6' }} /></button>
                        <button onClick={() => { setViewForm(sub); setEditingForm(true); setEditData({ ...(sub.data || {}) }) }} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${cc.primary}30`, background: `${cc.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Edit"><Pencil size={15} style={{ color: cc.primary }} /></button>
                        <button onClick={() => setViewForm(sub)} style={{ width: 36, height: 36, borderRadius: 10, border: `1px solid ${dk.inputBorder}`, background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="View"><Eye size={15} style={{ color: dk.textMuted }} /></button>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ClipboardList size={36} style={{ color: isDark ? '#334155' : '#d1d5db' }} /></div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>No form submissions found</p>
                <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6 }}>{submissions.length > 0 ? 'Try adjusting your filters' : 'Staff form submissions will appear here'}</p>
              </div>
            )}
          </Glass>


          {/* ══════════ VIEW / EDIT MODAL ══════════ */}
          <Modal isOpen={!!viewForm} onClose={() => { setViewForm(null); setEditingForm(false) }} title={viewForm ? getLabel(viewForm.form_type) : 'Form'} wide>
            {viewForm && (
              <div className="space-y-4">
                {/* Header bar */}
                <div className="p-3 rounded-xl flex items-center gap-3 bg-gray-50 border border-gray-200">
                  <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${getColor(viewForm.form_type)} flex items-center justify-center shadow`}>
                    {(() => { const I = formIcons[viewForm.form_type] || ClipboardList; return <I size={18} className="text-white" /> })()}
                  </div>
                  <div className="flex-1">
                    <p className="font-bold text-gray-800 text-sm">{getLabel(viewForm.form_type)}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <Badge color={statusColors[viewForm.status] || 'gray'}>{statusLabels[viewForm.status] || viewForm.status}</Badge>
                    </div>
                  </div>
                  {!editingForm ? (
                    <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/80 border border-gray-200 text-gray-700 text-xs font-semibold hover:bg-white"><Pencil size={13} /> Edit</button>
                  ) : (
                    <div className="flex gap-1.5">
                      <button onClick={() => setEditingForm(false)} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200"><X size={13} /> Cancel</button>
                      <button onClick={handleSaveEdit} disabled={updating} className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-white text-xs font-semibold shadow disabled:opacity-50" style={{ background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})` }}>
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

                {/* Document previews */}
                {getDocUrl(viewForm.form_type) && (
                  <div className="rounded-xl border border-blue-200 overflow-hidden">
                    <div className="p-3 bg-blue-50 flex items-center justify-between">
                      <div className="flex items-center gap-2"><FileText size={16} className="text-blue-600" /><p className="text-xs font-semibold text-blue-800">Reference Document</p></div>
                      <a href={getDocUrl(viewForm.form_type)} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold"><Download size={12} /> Download</a>
                    </div>
                    {getDocUrl(viewForm.form_type).toLowerCase().endsWith('.pdf') ? (
                      <iframe src={getDocUrl(viewForm.form_type)} className="w-full border-0" style={{ height: '350px' }} title="Form document" />
                    ) : (
                      <div className="p-4 text-center bg-gray-50"><FileText size={28} className="text-gray-300 mx-auto mb-1" /><p className="text-sm text-gray-500 font-medium">Word Document</p><a href={getDocUrl(viewForm.form_type)} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 rounded-lg text-white text-xs font-semibold"><Download size={14} /> Open Document</a></div>
                    )}
                  </div>
                )}

                {viewForm.data?._uploaded_document && (
                  <div className="rounded-xl border border-emerald-200 overflow-hidden">
                    <div className="p-3 bg-emerald-50 flex items-center justify-between">
                      <div className="flex items-center gap-2"><Check size={16} className="text-emerald-600" /><div><p className="text-xs font-semibold text-emerald-800">Completed Document (uploaded by staff)</p>{viewForm.data._uploaded_document_name && <p className="text-[10px] text-emerald-600">{viewForm.data._uploaded_document_name}</p>}</div></div>
                      <a href={viewForm.data._uploaded_document} target="_blank" rel="noopener noreferrer" className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-semibold"><Download size={12} /> Download</a>
                    </div>
                    {viewForm.data._uploaded_document.toLowerCase().endsWith('.pdf') ? (
                      <iframe src={viewForm.data._uploaded_document} className="w-full border-0" style={{ height: '400px' }} title="Completed document" />
                    ) : (
                      <div className="p-4 text-center bg-gray-50"><FileText size={28} className="text-gray-300 mx-auto mb-1" /><a href={viewForm.data._uploaded_document} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-emerald-600 hover:bg-emerald-700 rounded-lg text-white text-xs font-semibold"><Download size={14} /> Open Document</a></div>
                    )}
                  </div>
                )}

                {/* Edit mode */}
                {editingForm ? (
                  <div className="space-y-3">
                    <p className="text-xs font-bold uppercase tracking-wider flex items-center gap-1.5" style={{ color: cc.primary }}><Pencil size={12} /> Editing Form Data</p>
                    {(() => {
                      const fields = getFields(viewForm.form_type)
                      const fieldLabelMap = {}
                      if (fields) fields.forEach(f => { fieldLabelMap[f.key] = f.label })
                      return Object.entries(editData).map(([k, v]) => {
                        if (typeof v === 'string' && v.startsWith('data:image')) return null
                        if (Array.isArray(v) || (typeof v === 'object' && v !== null)) {
                          return (<div key={k} className="p-3 rounded-xl bg-gray-50 border border-gray-200"><p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabelMap[k] || k.replace(/_/g, ' ')}</p><p className="text-xs text-gray-500 italic">Complex data — view only</p></div>)
                        }
                        const isLong = typeof v === 'string' && v.length > 60
                        return (
                          <div key={k} className="p-3 rounded-xl bg-white border-2" style={{ borderColor: `${cc.primary}40` }}>
                            <p className="text-xs font-semibold capitalize mb-1" style={{ color: cc.primary }}>{fieldLabelMap[k] || k.replace(/_/g, ' ')}</p>
                            {isLong ? <textarea value={v || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} rows={3} className="w-full text-sm text-gray-800 border rounded-lg px-2.5 py-2 outline-none resize-none" style={{ background: `${cc.primary}08`, borderColor: `${cc.primary}20` }} />
                              : <input type="text" value={v || ''} onChange={e => setEditData({ ...editData, [k]: e.target.value })} className="w-full text-sm font-semibold text-gray-800 border rounded-lg px-2.5 py-1.5 outline-none" style={{ background: `${cc.primary}08`, borderColor: `${cc.primary}20` }} />}
                          </div>
                        )
                      })
                    })()}
                    {(() => {
                      const presetFields = [{ key: 'admin_notes', label: 'Admin Notes' }, { key: 'follow_up_action', label: 'Follow Up Action' }, { key: 'reviewed_comments', label: 'Reviewed Comments' }, { key: 'corrective_action', label: 'Corrective Action' }, { key: 'outcome', label: 'Outcome' }].filter(f => !editData[f.key])
                      if (presetFields.length === 0) return null
                      return (<div className="flex flex-wrap gap-2">{presetFields.map(f => (<button key={f.key} onClick={() => setEditData({ ...editData, [f.key]: '' })} className="px-3 py-2 border-2 border-dashed rounded-xl text-xs font-medium transition-all hover:scale-105" style={{ borderColor: `${cc.primary}30`, color: `${cc.primary}99` }}>+ {f.label}</button>))}</div>)
                    })()}
                  </div>
                ) : (
                  viewForm.data && Object.entries(viewForm.data).filter(([k, v]) => v !== null && v !== undefined && v !== '').length > 0 ? (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Form Data</p>
                        <button onClick={() => { const sub = viewForm; setViewForm(null); setTimeout(() => setPrintView(sub), 100) }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-white text-xs font-semibold shadow hover:shadow-lg transition-all" style={{ background: 'linear-gradient(135deg, #3b82f6, #6366f1)' }}><Printer size={12} /> View Full Form / Print</button>
                      </div>
                      {(() => {
                        const fields = getFields(viewForm.form_type)
                        const fMap = {}
                        if (fields) fields.forEach(f => { fMap[f.key] = f.label })
                        return Object.entries(viewForm.data).filter(([k, v]) => v !== null && v !== undefined && v !== '').map(([k, v]) => {
                          const fieldLabel = fMap[k] || k.replace(/_/g, ' ')
                          if (typeof v === 'string' && v.startsWith('data:image')) return (<div key={k} className="p-3 rounded-xl bg-white border border-gray-100"><p className="text-xs text-gray-400 font-medium capitalize mb-1">{fieldLabel}</p><img src={v} alt="Signature" className="h-12 border border-gray-200 rounded-lg bg-gray-50" /></div>)
                          if (Array.isArray(v)) {
                            if (v.length === 0) return null
                            if (typeof v[0] === 'string') return (<div key={k} className="p-3 rounded-xl bg-white border border-gray-100"><p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p><p className="text-sm text-gray-800">{v.join(', ')}</p></div>)
                            return (<div key={k} className="p-3 rounded-xl bg-white border border-gray-100"><p className="text-xs text-gray-400 font-medium capitalize mb-2">{fieldLabel} ({v.length} entries)</p><div className="space-y-1.5">{v.map((item, i) => (<div key={i} className="p-2 bg-gray-50 rounded-lg text-xs text-gray-700">{Object.entries(item).filter(([ik, iv]) => iv && !(typeof iv === 'string' && iv.startsWith('data:image'))).map(([ik, iv]) => (<span key={ik} className="inline-block mr-3"><span className="text-gray-400 capitalize">{ik.replace(/_/g, ' ')}:</span> <span className="font-medium">{String(iv)}</span></span>))}</div>))}</div></div>)
                          }
                          if (typeof v === 'object') return (<div key={k} className="p-3 rounded-xl bg-white border border-gray-100"><p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p><p className="text-sm text-gray-800">{Object.entries(v).map(([ok, ov]) => `${ok.replace(/_/g, ' ')}: ${ov}`).join(' · ')}</p></div>)
                          return (<div key={k} className="p-3 rounded-xl bg-white border border-gray-100"><p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{fieldLabel}</p><p className="text-sm text-gray-800 whitespace-pre-wrap">{String(v)}</p></div>)
                        })
                      })()}
                    </div>
                  ) : (<p className="text-sm text-gray-400 text-center py-4">No data recorded</p>)
                )}

                {/* Action buttons */}
                <div className="flex gap-2 pt-2 border-t border-gray-100">
                  {!editingForm && (<>
                    {viewForm.status === 'submitted' && <button onClick={() => handleStatusChange(viewForm.id, 'reviewed')} disabled={updating} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><Check size={16} /> Mark as Reviewed</button>}
                    {viewForm.status !== 'flagged' && <button onClick={() => handleStatusChange(viewForm.id, 'flagged')} disabled={updating} className="flex-1 py-2.5 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm font-bold flex items-center justify-center gap-2 hover:bg-red-100 disabled:opacity-50"><Flag size={16} /> Flag</button>}
                    {viewForm.status === 'flagged' && <button onClick={() => handleStatusChange(viewForm.id, 'reviewed')} disabled={updating} className="flex-1 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2 disabled:opacity-50" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><Check size={16} /> Resolve & Mark Reviewed</button>}
                    <button onClick={() => handleDeleteForm(viewForm.id)} disabled={updating} className="px-4 py-2.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 border border-gray-200 hover:border-red-200 rounded-xl text-sm font-semibold text-gray-500 transition-colors disabled:opacity-50 flex items-center gap-1.5"><Trash2 size={14} /> Delete</button>
                  </>)}
                  <button onClick={() => { setViewForm(null); setEditingForm(false) }} className="px-6 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">Close</button>
                </div>
              </div>
            )}
          </Modal>
        </>)}


        {/* ══════════ TEMPLATES TAB ══════════ */}
        {activeTab === 'templates' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(3) }}>
            {templates.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                {templates.map((t, i) => (
                  <Glass key={t.id} dark={isDark} hover glow={t.active ? (formGlows[t.color?.split(' ')[0]?.replace('from-', '')] || `${cc.primary}12`) : undefined} style={{ padding: '22px', opacity: t.active ? 1 : 0.5 }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 16, flexWrap: 'wrap' }}>
                      <div className={`w-14 h-14 rounded-xl bg-gradient-to-br ${t.color || 'from-teal-500 to-cyan-500'} flex items-center justify-center shadow-lg`} style={{ flexShrink: 0 }}><FileText size={26} color="white" /></div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                          <h3 style={{ fontSize: 18, fontWeight: 800, color: dk.text }}>{t.title}</h3>
                          {t.mandatory && <Badge color="red" dark={isDark}>Mandatory</Badge>}
                          {t.document_url && <Badge color="blue" dark={isDark}>Has Document</Badge>}
                          <Badge color={t.active ? 'green' : 'gray'} dark={isDark}>{t.active ? 'Active' : 'Inactive'}</Badge>
                        </div>
                        {t.description && <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 4 }}>{t.description}</p>}
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>
                          {(t.fields || []).map((f, fi) => (
                            <span key={fi} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 10, fontWeight: 600, background: dk.subtleBg2, color: dk.textFaint }}>{f.label} · {f.type}{f.required ? ' *' : ''}</span>
                          ))}
                        </div>
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 12 }}>{(t.fields || []).length} fields{t.document_url ? ' · Document attached' : ''} · Created {new Date(t.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flexShrink: 0 }}>
                        <button onClick={() => handleToggleTemplate(t.id, t.active)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${t.active ? (isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0') : dk.inputBorder}`, background: t.active ? (isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5') : dk.subtleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title={t.active ? 'Deactivate' : 'Activate'}>{t.active ? <ToggleRight size={18} style={{ color: '#10b981' }} /> : <ToggleLeft size={18} style={{ color: dk.textFaint }} />}</button>
                        <button onClick={() => openEditTemplate(t)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${cc.primary}30`, background: `${cc.primary}10`, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Edit"><Pencil size={18} style={{ color: cc.primary }} /></button>
                        <button onClick={() => duplicateTemplate(t)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`, background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Duplicate"><Copy size={18} style={{ color: '#3b82f6' }} /></button>
                        <button onClick={() => handleDeleteTemplate(t.id)} style={{ width: 40, height: 40, borderRadius: 12, border: `1px solid ${dk.inputBorder}`, background: dk.subtleBg, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }} title="Delete"><Trash2 size={18} style={{ color: dk.textFaint }} /></button>
                      </div>
                    </div>
                  </Glass>
                ))}
              </div>
            ) : (
              <Glass dark={isDark} glow={`${cc.primary}10`} style={{ padding: '56px 24px', textAlign: 'center' }}>
                <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 8px 32px -8px ${cc.primary}40` }}><FileText size={36} color="white" /></div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 18 }}>No form templates yet</p>
                <p style={{ fontSize: 14, color: dk.textFaint, marginTop: 6, marginBottom: 20 }}>Create a template and staff will see it on their forms page</p>
                <button onClick={openNewTemplate} style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '14px 24px', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px -6px ${cc.primary}50` }}><Plus size={16} /> Create First Template</button>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ TEMPLATE BUILDER MODAL — REDESIGNED ══════════ */}
        <Modal isOpen={showTemplateModal} onClose={() => setShowTemplateModal(false)} title={editingTemplate ? 'Edit Template' : 'Create Form Template'} wide>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

            {/* ── Gradient Hero Header ── */}
            <div style={{ margin: '-24px -24px 0 -24px', padding: '28px 28px 24px', position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0', background: templateForm.color ? undefined : `linear-gradient(135deg, ${cc.primary} 0%, ${cc.adminHover} 50%, #3b82f6 100%)` }}>
              {/* Dynamic gradient from selected color */}
              <div className={`absolute inset-0 bg-gradient-to-br ${templateForm.color || 'from-teal-500 to-cyan-500'}`} style={{ opacity: templateForm.color ? 1 : 0, transition: 'opacity .5s ease' }} />
              {!templateForm.color && <div style={{ position: 'absolute', inset: 0, background: `linear-gradient(135deg, ${cc.primary} 0%, ${cc.adminHover} 50%, #3b82f6 100%)` }} />}
              {/* Decorative elements */}
              <div style={{ position: 'absolute', width: 200, height: 200, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -60, right: -30 }} />
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -30, left: '30%' }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.4 }} />
              {[{ top: '20%', right: '15%', s: 3 }, { bottom: '30%', left: '20%', s: 4 }, { top: '50%', right: '40%', s: 2 }].map((dot, i) => (
                <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${5 + i}s ease-in-out infinite ${i * 0.8}s` }} />
              ))}
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 16 }}>
                <div style={{ width: 60, height: 60, borderRadius: 18, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px -4px rgba(0,0,0,0.15)', transition: 'transform .3s', flexShrink: 0 }}>
                  <FileText size={30} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 22, fontWeight: 900, color: 'white', letterSpacing: '-0.01em' }}>{editingTemplate ? 'Edit Template' : 'Create Template'}</h3>
                    {templateForm.mandatory && <span style={{ padding: '3px 10px', borderRadius: 999, background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fca5a5' }}>Mandatory</span>}
                  </div>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 4 }}>
                    {templateForm.title ? templateForm.title : 'Build a form template for your staff'}
                  </p>
                  {templateForm.fields.length > 0 && (
                    <div style={{ display: 'flex', gap: 8, marginTop: 10 }}>
                      <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)' }}>{templateForm.fields.length} field{templateForm.fields.length !== 1 ? 's' : ''}</span>
                      {docUrl && <span style={{ padding: '4px 10px', borderRadius: 8, background: 'rgba(255,255,255,0.12)', fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.8)', display: 'flex', alignItems: 'center', gap: 4 }}><FileText size={10} /> Doc attached</span>}
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* ── Body ── */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20, paddingTop: 24 }}>

              {/* Section: Identity */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cc.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Sparkles size={14} style={{ color: cc.primary }} /></div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Template Identity</p>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6, display: 'flex', alignItems: 'center', gap: 5 }}><Hash size={11} /> Title *</p>
                    <input type="text" value={templateForm.title} onChange={e => setTemplateForm({ ...templateForm, title: e.target.value })} placeholder="e.g. Daily Handover Report" style={inputStyle} onFocus={e => e.target.style.borderColor = cc.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                  </div>
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 6 }}>Description</p>
                    <input type="text" value={templateForm.description} onChange={e => setTemplateForm({ ...templateForm, description: e.target.value })} placeholder="Brief description for staff" style={inputStyle} onFocus={e => e.target.style.borderColor = cc.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                  </div>
                </div>

                {/* Color picker + Mandatory in a row */}
                <div style={{ display: 'flex', gap: 16, alignItems: 'flex-start', flexWrap: 'wrap' }}>
                  <div style={{ flex: 1, minWidth: 200 }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 8 }}>Theme Color</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                      {colorOptions.map(col => {
                        const isActive = templateForm.color === col.value
                        return (
                          <button key={col.value} onClick={() => setTemplateForm({ ...templateForm, color: col.value })}
                            className={`bg-gradient-to-br ${col.value}`}
                            style={{ width: 36, height: 36, borderRadius: 10, border: isActive ? '3px solid white' : '2px solid transparent', boxShadow: isActive ? '0 0 0 2px ' + cc.primary + ', 0 4px 12px -2px rgba(0,0,0,0.2)' : '0 2px 6px -1px rgba(0,0,0,0.1)', cursor: 'pointer', transition: 'all .25s cubic-bezier(.16,1,.3,1)', transform: isActive ? 'scale(1.15)' : 'scale(1)' }}
                            title={col.label}
                          />
                        )
                      })}
                    </div>
                  </div>
                  <div>
                    <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, marginBottom: 8 }}>Mandatory</p>
                    <button onClick={() => setTemplateForm({ ...templateForm, mandatory: !templateForm.mandatory })} style={{
                      display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderRadius: 12, cursor: 'pointer', transition: 'all .25s',
                      background: templateForm.mandatory ? (isDark ? 'rgba(239,68,68,0.12)' : '#fef2f2') : dk.subtleBg,
                      border: `1.5px solid ${templateForm.mandatory ? (isDark ? 'rgba(239,68,68,0.3)' : '#fecaca') : dk.inputBorder}`,
                      color: templateForm.mandatory ? '#ef4444' : dk.textMuted, fontSize: 13, fontWeight: 700,
                    }}>
                      {templateForm.mandatory ? <ToggleRight size={20} style={{ color: '#ef4444' }} /> : <ToggleLeft size={20} />}
                      {templateForm.mandatory ? 'Required' : 'Optional'}
                    </button>
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: dk.divider }} />

              {/* Section: Document Upload */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={14} style={{ color: '#3b82f6' }} /></div>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Document Attachment</p>
                  <span style={{ fontSize: 10, color: dk.textFaint, fontWeight: 500 }}>(optional)</span>
                </div>
                {docUrl || docFile ? (
                  <div style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(59,130,246,0.06)' : '#eff6ff', border: `1.5px solid ${isDark ? 'rgba(59,130,246,0.15)' : '#bfdbfe'}`, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 44, height: 44, borderRadius: 12, background: 'linear-gradient(135deg, #3b82f6, #6366f1)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -2px rgba(59,130,246,0.3)', flexShrink: 0 }}>
                      {docUploading ? <Loader2 size={20} color="white" className="animate-spin" /> : <FileText size={20} color="white" />}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{docFile?.name || docUrl?.split('/').pop()}</p>
                      <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>{docUploading ? 'Uploading...' : docFile ? `${(docFile.size / 1024).toFixed(0)} KB · Uploaded` : 'Uploaded'}</p>
                    </div>
                    {docUrl && <a href={docUrl} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: dk.subtleBg, border: `1px solid ${dk.inputBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><Download size={16} /></a>}
                    <button onClick={() => { setDocUrl(null); setDocFile(null) }} disabled={docUploading} style={{ width: 36, height: 36, borderRadius: 10, background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.15)' : '#fecaca'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', cursor: 'pointer', opacity: docUploading ? 0.3 : 1 }}><X size={16} /></button>
                  </div>
                ) : (
                  <label style={{ display: 'block', padding: '28px 24px', borderRadius: 14, border: `2px dashed ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`, background: isDark ? 'rgba(59,130,246,0.04)' : '#f8faff', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = cc.primary; e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff' }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'; e.currentTarget.style.background = isDark ? 'rgba(59,130,246,0.04)' : '#f8faff' }}>
                    <input type="file" accept=".pdf,.doc,.docx" style={{ display: 'none' }} onChange={e => handleDocUpload(e.target.files?.[0])} disabled={docUploading} />
                    {docUploading ? (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}><Loader2 size={28} className="animate-spin" style={{ color: cc.primary }} /><p style={{ fontSize: 13, fontWeight: 600, color: cc.primary }}>Uploading...</p></div>
                    ) : (
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8 }}>
                        <div style={{ width: 48, height: 48, borderRadius: 14, background: isDark ? 'rgba(59,130,246,0.1)' : '#dbeafe', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={22} style={{ color: '#3b82f6' }} /></div>
                        <p style={{ fontSize: 13, fontWeight: 600, color: dk.textSoft }}>Drop a PDF or Word document</p>
                        <p style={{ fontSize: 11, color: dk.textFaint }}>Staff will see this when filling out the form · Max 10MB</p>
                      </div>
                    )}
                  </label>
                )}
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: dk.divider }} />

              {/* Section: Fields Builder */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: `${cc.primary}12`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Layers size={14} style={{ color: cc.primary }} /></div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Form Fields</p>
                    <span style={{ fontSize: 11, fontWeight: 800, color: cc.primary, padding: '2px 8px', borderRadius: 8, background: `${cc.primary}10` }}>{templateForm.fields.length}</span>
                  </div>
                  <button onClick={addField} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, border: 'none', background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, color: 'white', fontSize: 12, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 12px -3px ${cc.primary}40`, transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                    <Plus size={14} /> Add Field
                  </button>
                </div>

                {templateForm.fields.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {templateForm.fields.map((field, idx) => (
                      <div key={idx} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1.5px solid ${dk.inputBorder}`, transition: 'all .2s' }}
                        onMouseEnter={e => e.currentTarget.style.borderColor = `${cc.primary}40`}
                        onMouseLeave={e => e.currentTarget.style.borderColor = dk.inputBorder}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                          {/* Reorder */}
                          <div style={{ display: 'flex', flexDirection: 'column', gap: 2, paddingTop: 4, flexShrink: 0 }}>
                            <button onClick={() => moveField(idx, -1)} disabled={idx === 0} style={{ width: 22, height: 18, borderRadius: 4, border: 'none', background: 'transparent', color: dk.textFaint, cursor: idx === 0 ? 'default' : 'pointer', opacity: idx === 0 ? 0.2 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={14} style={{ transform: 'rotate(180deg)' }} /></button>
                            <div style={{ width: 22, display: 'flex', justifyContent: 'center' }}><span style={{ fontSize: 10, fontWeight: 800, color: dk.textFaint }}>{idx + 1}</span></div>
                            <button onClick={() => moveField(idx, 1)} disabled={idx === templateForm.fields.length - 1} style={{ width: 22, height: 18, borderRadius: 4, border: 'none', background: 'transparent', color: dk.textFaint, cursor: idx === templateForm.fields.length - 1 ? 'default' : 'pointer', opacity: idx === templateForm.fields.length - 1 ? 0.2 : 0.6, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><ChevronDown size={14} /></button>
                          </div>
                          {/* Field inputs */}
                          <div style={{ flex: 1, display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 8 }}>
                            <input type="text" value={field.label} onChange={e => updateField(idx, { label: e.target.value })} placeholder="Field label" style={{ ...inputStyle, padding: '10px 12px', fontSize: 12, gridColumn: 'span 1' }} onFocus={e => e.target.style.borderColor = cc.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                            <select value={field.type} onChange={e => updateField(idx, { type: e.target.value })} style={{ ...inputStyle, padding: '10px 12px', fontSize: 12, cursor: 'pointer', gridColumn: 'span 1' }}>
                              <option value="text">Text (short)</option><option value="textarea">Text (long)</option><option value="number">Number</option><option value="date">Date</option><option value="time">Time</option><option value="select">Dropdown</option><option value="checkbox">Checkbox</option>
                            </select>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, gridColumn: 'span 1' }}>
                              <label style={{ display: 'flex', alignItems: 'center', gap: 5, cursor: 'pointer', fontSize: 11, fontWeight: 600, color: field.required ? cc.primary : dk.textFaint }}>
                                <input type="checkbox" checked={field.required || false} onChange={e => updateField(idx, { required: e.target.checked })} style={{ width: 16, height: 16, accentColor: cc.primary, borderRadius: 4 }} /> Req
                              </label>
                              <button onClick={() => removeField(idx)} style={{ marginLeft: 'auto', width: 32, height: 32, borderRadius: 8, border: 'none', background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', color: '#ef4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all .15s' }}
                                onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.15)' : '#fee2e2'}
                                onMouseLeave={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2'}>
                                <Trash2 size={13} />
                              </button>
                            </div>
                          </div>
                        </div>
                        {field.type === 'select' && (
                          <div style={{ marginTop: 10, marginLeft: 32 }}>
                            <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, marginBottom: 4 }}>Options (comma separated)</p>
                            <input type="text" value={(field.options || []).join(', ')} onChange={e => updateField(idx, { options: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })} placeholder="e.g. Low, Medium, High" style={{ ...inputStyle, padding: '8px 12px', fontSize: 11 }} onFocus={e => e.target.style.borderColor = cc.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ padding: '32px 24px', borderRadius: 14, border: `2px dashed ${dk.inputBorder}`, textAlign: 'center' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 12px' }}><Layers size={22} style={{ color: dk.textFaint }} /></div>
                    <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>No fields yet</p>
                    <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4 }}>Add fields below or click "Add Field" above</p>
                  </div>
                )}

                {/* Quick-add chips */}
                <div>
                  <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, marginBottom: 8 }}>Quick add:</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
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
                        style={{ padding: '6px 12px', borderRadius: 10, border: `1.5px dashed ${cc.primary}30`, background: `${cc.primary}04`, color: cc.primary, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                        onMouseEnter={e => { e.currentTarget.style.background = `${cc.primary}10`; e.currentTarget.style.borderColor = `${cc.primary}50` }}
                        onMouseLeave={e => { e.currentTarget.style.background = `${cc.primary}04`; e.currentTarget.style.borderColor = `${cc.primary}30` }}>
                        + {qf.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              {/* Divider */}
              <div style={{ height: 1, background: dk.divider }} />

              {/* Section: Live Preview */}
              {templateForm.fields.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <div style={{ width: 28, height: 28, borderRadius: 8, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Eye size={14} style={{ color: '#10b981' }} /></div>
                    <p style={{ fontSize: 12, fontWeight: 700, color: dk.textMuted, textTransform: 'uppercase', letterSpacing: '0.06em' }}>Live Preview</p>
                  </div>
                  <div style={{ padding: '20px', borderRadius: 16, background: isDark ? 'rgba(255,255,255,0.03)' : '#f8fafc', border: `1.5px solid ${isDark ? 'rgba(255,255,255,0.06)' : '#e2e8f0'}` }}>
                    {/* Mini form header */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 18, paddingBottom: 14, borderBottom: `1px solid ${dk.divider}` }}>
                      <div className={`bg-gradient-to-br ${templateForm.color}`} style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px -2px rgba(0,0,0,0.15)' }}><FileText size={16} color="white" /></div>
                      <div>
                        <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>{templateForm.title || 'Untitled Template'}</p>
                        {templateForm.description && <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 1 }}>{templateForm.description}</p>}
                      </div>
                    </div>
                    {/* Fields mockup */}
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                      {templateForm.fields.map((f, i) => (
                        <div key={i}>
                          <p style={{ fontSize: 11, fontWeight: 600, color: dk.textMuted, marginBottom: 4 }}>{f.label || 'Untitled'}{f.required ? <span style={{ color: '#ef4444' }}> *</span> : ''}</p>
                          {f.type === 'textarea' ? (
                            <div style={{ width: '100%', height: 56, borderRadius: 10, background: dk.inputBg, border: `1px solid ${dk.inputBorder}` }} />
                          ) : f.type === 'select' ? (
                            <div style={{ width: '100%', height: 38, borderRadius: 10, background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, display: 'flex', alignItems: 'center', padding: '0 12px', fontSize: 11, color: dk.textFaint }}>
                              {(f.options || []).join(' / ') || 'Select...'}
                            </div>
                          ) : f.type === 'checkbox' ? (
                            <div style={{ width: 18, height: 18, borderRadius: 4, background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}` }} />
                          ) : (
                            <div style={{ width: '100%', height: 38, borderRadius: 10, background: dk.inputBg, border: `1px solid ${dk.inputBorder}` }} />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* ── Action Buttons ── */}
              <div style={{ display: 'flex', gap: 12, paddingTop: 8, borderTop: `1px solid ${dk.divider}` }}>
                <button onClick={() => setShowTemplateModal(false)} style={{ flex: 1, padding: '16px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleSaveTemplate} disabled={savingTemplate}
                  style={{ flex: 2, padding: '16px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${cc.primary}, ${cc.adminHover})`, color: 'white', fontSize: 14, fontWeight: 800, cursor: 'pointer', boxShadow: `0 8px 32px -6px ${cc.primary}50`, opacity: savingTemplate ? 0.6 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
                  onMouseEnter={e => { if (!savingTemplate) e.currentTarget.style.transform = 'translateY(-1px)' }}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                  {savingTemplate ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                  {editingTemplate ? 'Update Template' : 'Create Template'}
                </button>
              </div>

            </div>
          </div>
        </Modal>

        {/* Print View */}
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
    </div>
  )
}