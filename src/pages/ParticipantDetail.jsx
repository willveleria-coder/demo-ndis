import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, FileText, Upload, AlertCircle, Phone, DollarSign, Shield, Loader2, X,
  Download, Trash2, Pencil, Save, ClipboardList, Eye, Users, CheckCircle, Clock,
  Activity, ChevronRight, User, Mail, MapPin, Hash, Calendar, Heart, Star,
  TrendingUp, Zap, Target, Briefcase, Lock, BookOpen, Play, AlertTriangle
} from 'lucide-react'
import { getParticipant } from '../services/participantService'
import { getShifts } from '../services/shiftService'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import FamilyAccessManager from '../components/FamilyAccessManager'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{
      background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${border}`, borderRadius: '1.25rem',
      boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
      transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
      ...style,
    }}
    onMouseEnter={hover ? e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)'
    } : undefined}
    onMouseLeave={hover ? e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)'
    } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{
    position: 'absolute', width: size, height: size, top, left, right, bottom,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: 0.12, borderRadius: '50%',
    animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none', zIndex: 0,
  }} />)
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
    pink: dark ? { bg: 'rgba(236,72,153,0.15)', text: '#f472b6', border: 'rgba(236,72,153,0.3)' } : { bg: '#fdf2f8', text: '#db2777', border: '#fbcfe8' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: p.bg, color: p.text, border: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}

function InfoField({ label, value, icon: Icon, color, dark, dk }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={12} style={{ color: color || dk.textFaint }} />}
        <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{value || '—'}</p>
    </div>
  )
}

function EditField({ label, value, onChange, type = 'text', icon: Icon, color, dark, dk }) {
  return (
    <div style={{
      padding: '14px 16px', borderRadius: 14,
      background: dark ? `${color}08` : `${color}06`,
      border: `2px solid ${color}40`,
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={12} style={{ color }} />}
        <p style={{ fontSize: 10, fontWeight: 700, color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      </div>
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)}
        style={{ width: '100%', fontSize: 14, fontWeight: 700, color: dk.text, background: 'transparent', border: 'none', outline: 'none' }} />
    </div>
  )
}

function docStatusColor(d) {
  if (!d.expiry_date) return 'green'
  const days = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000)
  if (days < 0) return 'red'
  if (days < 30) return 'amber'
  return 'green'
}
function docStatusLabel(d) {
  if (!d.expiry_date) return 'Valid'
  const days = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000)
  if (days < 0) return 'Expired'
  if (days < 30) return 'Expiring Soon'
  return 'Valid'
}

const docGrads = { green: 'linear-gradient(135deg, #10b981, #34d399)', amber: 'linear-gradient(135deg, #f59e0b, #fbbf24)', red: 'linear-gradient(135deg, #ef4444, #f87171)' }
const docAccents = { green: '#10b981', amber: '#f59e0b', red: '#ef4444' }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function ParticipantDetail() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [p, setP] = useState(null)
  const [shifts, setShifts] = useState([])
  const [shiftNotes, setShiftNotes] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', document_type: 'service_agreement', expiry_date: '', visible_to_staff: true, requires_signoff: false })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formSubmissions, setFormSubmissions] = useState([])
  const [viewForm, setViewForm] = useState(null)
  const [docSignoffs, setDocSignoffs] = useState({})
  const [viewSignoffs, setViewSignoffs] = useState(null)
  const [allStaff, setAllStaff] = useState([])
  const [docAccessMap, setDocAccessMap] = useState({})
  const [manageAccessDoc, setManageAccessDoc] = useState(null)
  const [savingAccess, setSavingAccess] = useState(false)
  const [timeline, setTimeline] = useState([])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white', inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', transition: 'all .2s',
  }

  const tabConfig = [
    { key: 'profile', label: 'Profile', icon: User },
    { key: 'timeline', label: 'Timeline', icon: Activity },
    { key: 'documents', label: 'Documents', icon: FileText },
    { key: 'shifts', label: 'Shifts', icon: Calendar },
    { key: 'notes', label: 'Notes', icon: ClipboardList },
    { key: 'forms', label: 'Forms', icon: BookOpen },
    { key: 'goals', label: 'Goals', icon: Target },
    { key: 'family', label: 'Family', icon: Heart },
  ]


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this participant? This cannot be undone.')) return
    try { const { error } = await supabase.from('participants').delete().eq('id', id); if (error) throw error; navigate('/admin/participants') }
    catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  const startEditing = () => {
    setEditForm({
      first_name: p.first_name || '', last_name: p.last_name || '',
      phone: p.phone || '', email: p.email || '', address: p.address || '',
      ndis_number: p.ndis_number || '', date_of_birth: p.date_of_birth || '',
      gender: p.gender || '', status: p.status || 'active',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || '',
      funding_type: p.funding_type || '', plan_manager_name: p.plan_manager_name || '',
      support_coordinator: p.support_coordinator || '',
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.first_name || !editForm.last_name) { alert('Name is required'); return }
    setSaving(true)
    try { const { error } = await supabase.from('participants').update(editForm).eq('id', id); if (error) throw error; setP(prev => ({ ...prev, ...editForm })); setEditing(false) }
    catch (err) { alert('Failed to save: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  useEffect(() => {
    async function load() {
      try {
        const [participant, allShifts] = await Promise.all([getParticipant(id), getShifts().catch(() => [])])
        setP(participant)
        const pShifts = allShifts.filter(s => s.participant_id === id)
        setShifts(pShifts)
        if (pShifts.length > 0) {
          const shiftIds = pShifts.map(s => s.id)
          const { data: notes } = await supabase.from('shift_notes').select('*, staff:staff_id(first_name, last_name)').in('shift_id', shiftIds).order('created_at', { ascending: false })
          setShiftNotes(notes || [])
        }
        try {
          const { data: allForms } = await supabase.from('form_submissions').select('*, staff:staff_id(first_name, last_name)').order('submitted_at', { ascending: false })
          if (allForms && participant) {
            const pName = `${participant.first_name} ${participant.last_name}`.toLowerCase()
            const pFirst = participant.first_name?.toLowerCase()
            const pLast = participant.last_name?.toLowerCase()
            const matched = allForms.filter(f => { const dp = (f.data?.participant_name || '').toLowerCase(); return dp && (dp.includes(pName) || dp.includes(pFirst) || dp.includes(pLast)) })
            setFormSubmissions(matched)
          }
        try {
          const timelineItems = []
          const pShifts2 = allShifts.filter(s => s.participant_id === id)
          pShifts2.forEach(s => { timelineItems.push({ id: `shift-${s.id}`, type: 'shift', icon: '📅', color: s.status === 'completed' ? 'green' : 'blue', title: `Shift — ${s.staff?.first_name || ''} ${s.staff?.last_name || ''}`, desc: `${s.title || s.service_type || 'Support'} · ${formatLabel(s.service_type)}`, date: s.shift_date || s.start_time, link: `/admin/roster/shift/${s.id}` }) })
          let tlNotes = []
          if (pShifts2.length > 0) { const { data } = await supabase.from('shift_notes').select('*, staff:staff_id(first_name, last_name)').in('shift_id', pShifts2.map(s => s.id)).order('created_at', { ascending: false }); tlNotes = data || [] }
          tlNotes.forEach(n => { timelineItems.push({ id: `note-${n.id}`, type: 'note', icon: '📝', color: 'teal', title: `Shift Note — ${n.staff?.first_name || ''} ${n.staff?.last_name || ''}`, desc: n.mood || n.activities || n.content || 'Note submitted', date: n.created_at }) })
          const { data: pIncidents } = await supabase.from('incidents').select('id, incident_type, severity, status, created_at, description').eq('participant_id', id).order('created_at', { ascending: false })
          ;(pIncidents || []).forEach(i => { timelineItems.push({ id: `inc-${i.id}`, type: 'incident', icon: '⚠️', color: i.severity === 'critical' || i.severity === 'high' ? 'red' : 'amber', title: `Incident — ${(i.incident_type || '').replace(/_/g, ' ')}`, desc: (i.description || '').slice(0, 120), date: i.created_at, link: `/admin/incidents/${i.id}` }) })
          if (participant.goals) { participant.goals.forEach(g => { timelineItems.push({ id: `goal-${g.id}`, type: 'goal', icon: '🎯', color: 'purple', title: `Goal — ${g.title}`, desc: `${g.progress}% complete · ${g.status}`, date: g.created_at || g.target_date }) }) }
          if (participant.documents) { participant.documents.forEach(d => { timelineItems.push({ id: `doc-${d.id}`, type: 'document', icon: '📄', color: 'gray', title: `Document — ${d.name}`, desc: `${(d.document_type || '').replace(/_/g, ' ')}${d.expiry_date ? ` · Expires ${new Date(d.expiry_date).toLocaleDateString('en-AU')}` : ''}`, date: d.created_at || d.uploaded_at }) }) }
          const { data: medAdmins } = await supabase.from('medication_administrations').select('*, medication:medication_id(medication_name)').eq('participant_id', id).order('administered_at', { ascending: false }).limit(20)
          ;(medAdmins || []).forEach(m => { timelineItems.push({ id: `med-${m.id}`, type: 'medication', icon: m.refused ? '🚫' : '💊', color: m.refused ? 'red' : 'blue', title: `Medication — ${m.medication?.medication_name || 'Unknown'}`, desc: m.refused ? `Refused: ${m.refused_reason || 'No reason given'}` : (m.notes || 'Administered'), date: m.administered_at }) })
          timelineItems.sort((a, b) => new Date(b.date || 0) - new Date(a.date || 0))
          setTimeline(timelineItems)
        } catch (e) { console.error('Timeline error:', e) }
        } catch (e) { /* table may not exist */ }
      } catch (err) { console.error('Failed to load participant:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [id])

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `participants/${id}/${Date.now()}.${fileExt}`
      const { data: fileData, error: fileError } = await supabase.storage.from('documents').upload(fileName, selectedFile)
      if (fileError) throw fileError
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(fileName)
      const { error: dbError } = await supabase.from('documents').insert({ participant_id: id, name: uploadForm.name || selectedFile.name, document_type: uploadForm.document_type, file_url: publicUrl, file_name: selectedFile.name, expiry_date: uploadForm.expiry_date || null, visible_to_staff: uploadForm.visible_to_staff, requires_signoff: uploadForm.requires_signoff, status: 'valid' })
      if (dbError) throw dbError
      const updated = await getParticipant(id); setP(updated)
      setShowUpload(false); setSelectedFile(null)
      setUploadForm({ name: '', document_type: 'service_agreement', expiry_date: '', visible_to_staff: true, requires_signoff: false })
      alert('Document uploaded successfully!')
    } catch (err) { console.error('Upload failed:', err); alert('Upload failed: ' + (err.message || 'Unknown error')) }
    finally { setUploading(false) }
  }

  const toggleDocField = async (docId, field, currentVal) => {
    try { const { error } = await supabase.from('documents').update({ [field]: !currentVal }).eq('id', docId); if (error) throw error; const updated = await getParticipant(id); setP(updated) }
    catch (err) { alert('Failed to update: ' + (err.message || 'Unknown error')) }
  }

  const loadSignoffs = async (docId) => {
    try {
      const { data, error } = await supabase.from('document_signoffs').select('*').eq('document_id', docId)
      if (error) { setDocSignoffs(prev => ({ ...prev, [docId]: [] })); setViewSignoffs(docId); return }
      const signoffList = data || []
      const staffIds = [...new Set(signoffList.map(s => s.staff_id).filter(Boolean))]
      let staffMap = {}
      if (staffIds.length > 0) { const { data: staffData } = await supabase.from('staff').select('id, first_name, last_name').in('id', staffIds); if (staffData) staffData.forEach(s => { staffMap[s.id] = s }) }
      const enriched = signoffList.map(s => ({ ...s, staff: staffMap[s.staff_id] || null }))
      setDocSignoffs(prev => ({ ...prev, [docId]: enriched })); setViewSignoffs(docId)
    } catch (err) { setDocSignoffs(prev => ({ ...prev, [docId]: [] })); setViewSignoffs(docId) }
  }

  const openManageAccess = async (doc) => {
    setManageAccessDoc(doc)
    try {
      if (allStaff.length === 0) { const { data: staffList } = await supabase.from('staff').select('id, first_name, last_name, role, status').order('first_name'); setAllStaff(staffList || []) }
      const { data: access } = await supabase.from('document_staff_access').select('staff_id').eq('document_id', doc.id)
      const accessSet = new Set((access || []).map(a => a.staff_id))
      setDocAccessMap(prev => ({ ...prev, [doc.id]: accessSet }))
    } catch (err) { console.error('Load access error:', err) }
  }

  const toggleStaffAccess = async (docId, staffId, hasAccess) => {
    setSavingAccess(true)
    try {
      if (hasAccess) await supabase.from('document_staff_access').delete().eq('document_id', docId).eq('staff_id', staffId)
      else await supabase.from('document_staff_access').insert({ document_id: docId, staff_id: staffId })
      setDocAccessMap(prev => { const newSet = new Set(prev[docId] || []); if (hasAccess) newSet.delete(staffId); else newSet.add(staffId); return { ...prev, [docId]: newSet } })
    } catch (err) { alert('Failed to update access: ' + (err.message || 'Unknown error')) }
    finally { setSavingAccess(false) }
  }

  const grantAllStaffAccess = async (docId) => {
    setSavingAccess(true)
    try {
      const currentAccess = docAccessMap[docId] || new Set()
      const toInsert = allStaff.filter(s => !currentAccess.has(s.id)).map(s => ({ document_id: docId, staff_id: s.id }))
      if (toInsert.length > 0) await supabase.from('document_staff_access').insert(toInsert)
      setDocAccessMap(prev => ({ ...prev, [docId]: new Set(allStaff.map(s => s.id)) }))
    } catch (err) { console.error('Grant all error:', err) }
    finally { setSavingAccess(false) }
  }

  const revokeAllStaffAccess = async (docId) => {
    setSavingAccess(true)
    try { await supabase.from('document_staff_access').delete().eq('document_id', docId); setDocAccessMap(prev => ({ ...prev, [docId]: new Set() })) }
    catch (err) { console.error('Revoke all error:', err) }
    finally { setSavingAccess(false) }
  }

  /* ─── Loading / Not found ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><User size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading participant...</p>
    </div>
  )

  if (!p) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={32} style={{ color: c.primary }} /></div>
      <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>Participant not found</p>
      <Link to="/admin/participants" style={{ color: c.primary, fontSize: 14, fontWeight: 600, marginTop: 8, display: 'inline-block' }}>Back to participants</Link>
    </div>
  )

  const completedShifts = shifts.filter(s => s.status === 'completed').length
  const totalDocs = p.documents?.length || 0
  const expiringDocs = (p.documents || []).filter(d => docStatusColor(d) === 'amber').length
  const expiredDocs = (p.documents || []).filter(d => docStatusColor(d) === 'red').length
  const totalGoals = p.goals?.length || 0
  const achievedGoals = (p.goals || []).filter(g => g.status === 'achieved').length

  const timelineColorMap = {
    green: { bg: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0' },
    blue: { bg: isDark ? 'rgba(59,130,246,0.08)' : '#eff6ff', border: isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe' },
    teal: { bg: isDark ? 'rgba(20,184,166,0.08)' : '#f0fdfa', border: isDark ? 'rgba(20,184,166,0.2)' : '#99f6e4' },
    amber: { bg: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: isDark ? 'rgba(245,158,11,0.2)' : '#fde68a' },
    red: { bg: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2', border: isDark ? 'rgba(239,68,68,0.2)' : '#fecaca' },
    purple: { bg: isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff', border: isDark ? 'rgba(139,92,246,0.2)' : '#ddd6fe' },
    gray: { bg: dk.subtleBg, border: dk.subtleBg2 },
  }


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#ec4899" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#3b82f6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#f59e0b" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Back button */}
        <div style={stg(0)}>
          <Link to="/admin/participants" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.8)'}` }}>
              <ArrowLeft size={18} style={{ color: dk.textMuted }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Back to Participants</span>
          </Link>
        </div>

        {/* ══════════ HERO BANNER ══════════ */}
        <div style={stg(1)}>
          <div style={{ borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 35%, #ec4899 65%, #f59e0b 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Heart size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Participant</span>
                </div>
                <Badge color={p.status === 'active' ? 'green' : p.status === 'inactive' ? 'red' : 'amber'} dark>{p.status}</Badge>
                {p.funding_type && <Badge color="orange" dark>{p.funding_type}</Badge>}
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 72, height: 72, borderRadius: 20, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: 'white', flexShrink: 0 }}>
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{p.first_name} {p.last_name}</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>NDIS: {p.ndis_number || 'Not set'}</p>
                </div>
                <div style={{ display: 'flex', gap: 8, flexShrink: 0 }}>
                  {!editing ? (<>
                    <button onClick={startEditing} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                      <Pencil size={14} /> Edit
                    </button>
                    <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}>
                      <Trash2 size={14} /> Delete
                    </button>
                  </>) : (<>
                    <button onClick={() => setEditing(false)} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>
                      <X size={14} /> Cancel
                    </button>
                    <button onClick={handleSaveEdit} disabled={saving} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(16,185,129,0.4)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', opacity: saving ? 0.6 : 1 }}>
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />} {saving ? 'Saving...' : 'Save'}
                    </button>
                  </>)}
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Calendar, text: `${shifts.length} shifts` },
                  { icon: CheckCircle, text: `${completedShifts} completed` },
                  { icon: FileText, text: `${totalDocs} documents` },
                  { icon: Target, text: `${achievedGoals}/${totalGoals} goals` },
                  p.plan_budget && { icon: DollarSign, text: `$${Number(p.plan_budget).toLocaleString()} budget`, bg: 'rgba(16,185,129,0.2)' },
                ].filter(Boolean).map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ TABS ══════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(2) }}>
          <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch', scrollbarWidth: 'none' }}>
            {tabConfig.map(t => {
              const isActive = tab === t.key
              return (
                <button key={t.key} onClick={() => setTab(t.key)} style={{
                  display: 'flex', alignItems: 'center', gap: 6, padding: '12px 16px', borderRadius: 14, border: 'none',
                  fontSize: 13, fontWeight: 700, cursor: 'pointer', whiteSpace: 'nowrap',
                  transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                  background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : 'transparent',
                  color: isActive ? 'white' : dk.textMuted,
                  boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)' }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.background = 'transparent' }}>
                  <t.icon size={15} /> {t.label}
                </button>
              )
            })}
          </div>
        </Glass>

        {/* ══════════ PROFILE TAB ══════════ */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(3) }}>
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${dk.divider}` }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`, border: `1px solid ${c.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <User size={16} style={{ color: c.primary }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Personal Details</p>
              </div>
              <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {editing ? (<>
                  <EditField label="First Name" value={editForm.first_name} onChange={v => setEditForm({...editForm, first_name: v})} icon={User} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="Last Name" value={editForm.last_name} onChange={v => setEditForm({...editForm, last_name: v})} icon={User} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="NDIS Number" value={editForm.ndis_number} onChange={v => setEditForm({...editForm, ndis_number: v})} icon={Hash} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="Date of Birth" value={editForm.date_of_birth} onChange={v => setEditForm({...editForm, date_of_birth: v})} type="date" icon={Calendar} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="Gender" value={editForm.gender} onChange={v => setEditForm({...editForm, gender: v})} icon={User} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="Phone" value={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} type="tel" icon={Phone} color={c.primary} dark={isDark} dk={dk} />
                  <EditField label="Email" value={editForm.email} onChange={v => setEditForm({...editForm, email: v})} type="email" icon={Mail} color={c.primary} dark={isDark} dk={dk} />
                  <div style={{ gridColumn: 'span 2' }}><EditField label="Address" value={editForm.address} onChange={v => setEditForm({...editForm, address: v})} icon={MapPin} color={c.primary} dark={isDark} dk={dk} /></div>
                </>) : (<>
                  <InfoField label="First Name" value={p.first_name} icon={User} color={c.primary} dk={dk} />
                  <InfoField label="Last Name" value={p.last_name} icon={User} color={c.primary} dk={dk} />
                  <InfoField label="NDIS Number" value={p.ndis_number} icon={Hash} color="#3b82f6" dk={dk} />
                  <InfoField label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-AU') : null} icon={Calendar} color="#8b5cf6" dk={dk} />
                  <InfoField label="Gender" value={p.gender} icon={User} dk={dk} />
                  <InfoField label="Phone" value={p.phone} icon={Phone} color="#10b981" dk={dk} />
                  <InfoField label="Email" value={p.email} icon={Mail} color="#f59e0b" dk={dk} />
                  <InfoField label="Address" value={p.address} icon={MapPin} color="#ef4444" dk={dk} />
                </>)}
              </div>
            </Glass>

            {/* Emergency Contact */}
            <Glass dark={isDark} glow="rgba(239,68,68,0.1)" style={{ padding: 0, overflow: 'hidden', borderColor: isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.2)' }}>
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.1)'}`, background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))', border: '1px solid rgba(239,68,68,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <AlertCircle size={16} style={{ color: '#ef4444' }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Emergency Contact</p>
              </div>
              <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                <InfoField label="Name" value={p.emergency_contact_name} icon={User} color="#ef4444" dk={dk} />
                <InfoField label="Phone" value={p.emergency_contact_phone} icon={Phone} color="#ef4444" dk={dk} />
                <InfoField label="Relationship" value={p.emergency_contact_relationship} icon={Heart} color="#ef4444" dk={dk} />
              </div>
            </Glass>

            {/* NDIS Plan */}
            <Glass dark={isDark} glow={`${c.primary}10`} style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${dk.divider}`, background: isDark ? `rgba(124,58,237,0.04)` : 'rgba(124,58,237,0.02)' }}>
                <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`, border: `1px solid ${c.primary}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <DollarSign size={16} style={{ color: c.primary }} />
                </div>
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>NDIS Plan</p>
              </div>
              <div style={{ padding: 22, display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                <InfoField label="Funding Type" value={p.funding_type} icon={Briefcase} color="#ec4899" dk={dk} />
                <InfoField label="Plan Start" value={p.plan_start_date ? new Date(p.plan_start_date).toLocaleDateString('en-AU') : null} icon={Calendar} color="#3b82f6" dk={dk} />
                <InfoField label="Plan End" value={p.plan_end_date ? new Date(p.plan_end_date).toLocaleDateString('en-AU') : null} icon={Calendar} color="#8b5cf6" dk={dk} />
                <InfoField label="Budget" value={p.plan_budget ? `$${Number(p.plan_budget).toLocaleString()}` : null} icon={DollarSign} color="#10b981" dk={dk} />
              </div>
            </Glass>

            {p.notes && (
              <Glass dark={isDark} style={{ padding: 22 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <FileText size={16} style={{ color: dk.textMuted }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Notes</p>
                </div>
                <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.6 }}>{p.notes}</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ TIMELINE TAB ══════════ */}
        {tab === 'timeline' && (
          <div style={{ ...stg(3), display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
              <Activity size={18} style={{ color: c.primary }} />
              <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Activity Timeline</p>
              <span style={{ fontSize: 12, color: dk.textFaint }}>({timeline.length} events)</span>
            </div>
            {timeline.length > 0 ? (
              <div style={{ position: 'relative', paddingLeft: 32 }}>
                <div style={{ position: 'absolute', left: 11, top: 0, bottom: 0, width: 2, borderRadius: 1, background: dk.subtleBg2 }} />
                {timeline.map((item, i) => {
                  const tc = timelineColorMap[item.color] || timelineColorMap.gray
                  const inner = (
                    <Glass dark={isDark} hover={!!item.link} glow={`${tc.border}30`} style={{ padding: '14px 18px', borderColor: tc.border, background: tc.bg }}>
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 10 }}>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{item.title}</p>
                          <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{item.desc}</p>
                        </div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexShrink: 0 }}>
                          <span style={{ fontSize: 11, color: dk.textFaint, fontWeight: 600 }}>{item.date ? new Date(item.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</span>
                          {item.link && <ChevronRight size={14} style={{ color: dk.textFaint }} />}
                        </div>
                      </div>
                    </Glass>
                  )
                  return (
                    <div key={item.id} style={{ position: 'relative', marginBottom: 10 }}>
                      <div style={{ position: 'absolute', left: -25, top: 14, width: 24, height: 24, borderRadius: 8, background: isDark ? 'rgba(30,41,59,0.9)' : 'white', border: `2px solid ${tc.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, zIndex: 2 }}>{item.icon}</div>
                      {item.link ? <Link to={item.link} style={{ textDecoration: 'none' }}>{inner}</Link> : inner}
                    </div>
                  )
                })}
              </div>
            ) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Activity size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No activity recorded yet</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ DOCUMENTS TAB ══════════ */}
        {tab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...stg(3) }}>
            {p.documents && p.documents.length > 0 ? p.documents.map(d => {
              const sc = docStatusColor(d); const accent = docAccents[sc]; const grad = docGrads[sc]
              return (
                <Glass key={d.id} dark={isDark} hover glow={`${accent}12`} style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 14 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                      <div style={{ width: 44, height: 44, borderRadius: 12, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px -4px ${accent}40`, flexShrink: 0 }}>
                        <FileText size={20} color="white" />
                      </div>
                      <div style={{ minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{d.name}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{d.document_type?.replace(/_/g, ' ')} · {d.expiry_date ? `Expires: ${new Date(d.expiry_date).toLocaleDateString('en-AU')}` : 'No expiry'}</p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <Badge color={sc} dark={isDark}>{docStatusLabel(d)}</Badge>
                          {d.visible_to_staff && <Badge color="blue" dark={isDark}>Staff Visible</Badge>}
                          {d.requires_signoff && <Badge color="amber" dark={isDark}>Sign-off</Badge>}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                      <button onClick={() => toggleDocField(d.id, 'visible_to_staff', d.visible_to_staff)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: d.visible_to_staff ? (isDark ? 'rgba(59,130,246,0.15)' : '#eff6ff') : dk.subtleBg2, color: d.visible_to_staff ? '#3b82f6' : dk.textFaint, display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Eye size={14} /></button>
                      {d.visible_to_staff && <button onClick={() => openManageAccess(d)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: isDark ? 'rgba(139,92,246,0.15)' : '#f5f3ff', color: '#8b5cf6', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><Users size={14} /></button>}
                      <button onClick={() => loadSignoffs(d.id)} style={{ width: 36, height: 36, borderRadius: 10, border: 'none', background: isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb', color: '#f59e0b', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}><CheckCircle size={14} /></button>
                      {d.file_url && <a href={d.file_url} target="_blank" rel="noopener noreferrer" style={{ width: 36, height: 36, borderRadius: 10, background: dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', color: dk.textMuted }}><Download size={14} /></a>}
                    </div>
                  </div>
                </Glass>
              )
            }) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <FileText size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No documents uploaded yet</p>
              </Glass>
            )}
            <button onClick={() => setShowUpload(true)} style={{ width: '100%', padding: '18px', borderRadius: 16, border: `2px dashed ${dk.inputBorder}`, background: 'transparent', color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
              onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.primary }}
              onMouseLeave={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.color = dk.textMuted }}>
              <Upload size={18} /> Upload Document
            </button>
          </div>
        )}

        {/* ══════════ SHIFTS TAB ══════════ */}
        {tab === 'shifts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10, ...stg(3) }}>
            {shifts.length > 0 ? shifts.map(s => {
              const sColor = s.status === 'completed' ? '#8b5cf6' : s.status === 'in_progress' ? '#10b981' : '#3b82f6'
              const sGrad = s.status === 'completed' ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : s.status === 'in_progress' ? 'linear-gradient(135deg, #10b981, #14b8a6)' : 'linear-gradient(135deg, #3b82f6, #60a5fa)'
              return (
                <Link key={s.id} to={`/admin/roster/shift/${s.id}`} style={{ textDecoration: 'none' }}>
                  <Glass dark={isDark} hover glow={`${sColor}12`} style={{ padding: '16px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      <div style={{ width: 4, height: 40, borderRadius: 4, background: `linear-gradient(to bottom, ${sColor}, ${sColor}60)`, flexShrink: 0 }} />
                      <div style={{ width: 40, height: 40, borderRadius: 12, background: sGrad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 4px 14px -4px ${sColor}40`, flexShrink: 0 }}>
                        {s.status === 'completed' ? <CheckCircle size={18} color="white" /> : s.status === 'in_progress' ? <Play size={18} color="white" /> : <Calendar size={18} color="white" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 13 }}>{s.title || s.service_type || 'Shift'}</p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                          {s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'} · {new Date(s.start_time).toLocaleDateString('en-AU')}
                        </p>
                      </div>
                      <Badge color={s.status === 'completed' ? 'purple' : s.status === 'in_progress' ? 'green' : 'blue'} dark={isDark}>{s.status.replace('_', ' ')}</Badge>
                      <ChevronRight size={16} style={{ color: dk.textFaint }} />
                    </div>
                  </Glass>
                </Link>
              )
            }) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Calendar size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No shifts for this participant</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ NOTES TAB ══════════ */}
        {tab === 'notes' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...stg(3) }}>
            {shiftNotes.length > 0 && (<>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <ClipboardList size={16} style={{ color: '#0d9488' }} />
                <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Shift Notes</p>
              </div>
              {shiftNotes.map(n => (
                <Glass key={n.id} dark={isDark} glow="rgba(20,184,166,0.1)" style={{ padding: '18px 22px', borderColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.2)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : 'Staff'}</p>
                    <span style={{ fontSize: 11, color: dk.textFaint }}>{new Date(n.created_at).toLocaleDateString('en-AU')}</span>
                  </div>
                  {[
                    { key: 'mood', label: 'Mood & Wellbeing', icon: Heart, color: '#ec4899' },
                    { key: 'activities', label: 'Activities', icon: Activity, color: '#3b82f6' },
                    { key: 'goals_progress', label: 'Goals Progress', icon: TrendingUp, color: '#10b981' },
                    { key: 'concerns', label: 'Concerns', icon: AlertTriangle, color: '#f59e0b' },
                    { key: 'recommendations', label: 'Recommendations', icon: Star, color: '#8b5cf6' },
                  ].filter(f => n[f.key]).map(f => (
                    <div key={f.key} style={{ marginBottom: 10 }}>
                      <p style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 4 }}>
                        <f.icon size={10} /> {f.label}
                      </p>
                      <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.5 }}>{n[f.key]}</p>
                    </div>
                  ))}
                  {n.content && !n.mood && <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.5 }}>{n.content}</p>}
                </Glass>
              ))}
            </>)}
            {p.progress_notes && p.progress_notes.length > 0 && (<>
              {shiftNotes.length > 0 && <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 8 }}><FileText size={16} style={{ color: '#3b82f6' }} /><p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Progress Notes</p></div>}
              {p.progress_notes.map(n => (
                <Glass key={n.id} dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: '18px 22px' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : 'Unknown'}</p>
                    <Badge color="teal" dark={isDark}>{n.category}</Badge>
                  </div>
                  <p style={{ fontSize: 11, color: dk.textFaint }}>{new Date(n.note_date).toLocaleDateString('en-AU')}</p>
                  <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.5, marginTop: 8 }}>{n.content}</p>
                </Glass>
              ))}
            </>)}
            {shiftNotes.length === 0 && (!p.progress_notes || p.progress_notes.length === 0) && (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <ClipboardList size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No notes yet</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ FORMS TAB ══════════ */}
        {tab === 'forms' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...stg(3) }}>
            {formSubmissions.length > 0 ? formSubmissions.map(sub => {
              const formLabels = { medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation' }
              const formIcons = { medication_chart: '💊', medication_incident: '🚨', incident_report: '⚠️', cash_reconciliation: '💵' }
              const formBadge = { medication_chart: 'blue', medication_incident: 'red', incident_report: 'amber', cash_reconciliation: 'green' }
              const formAccent = { medication_chart: '#3b82f6', medication_incident: '#ef4444', incident_report: '#f59e0b', cash_reconciliation: '#10b981' }
              const accent = formAccent[sub.form_type] || '#94a3b8'
              const staffN = sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'
              return (
                <Glass key={sub.id} dark={isDark} hover glow={`${accent}12`} style={{ padding: '18px 22px', cursor: 'pointer' }} onClick={() => setViewForm(sub)}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <span style={{ fontSize: 24 }}>{formIcons[sub.form_type] || '📋'}</span>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{formLabels[sub.form_type] || sub.form_type}</p>
                      <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>By {staffN} · {sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</p>
                    </div>
                    <Badge color={formBadge[sub.form_type] || 'gray'} dark={isDark}>{formLabels[sub.form_type] || 'Form'}</Badge>
                    <ChevronRight size={16} style={{ color: dk.textFaint }} />
                  </div>
                  {sub.data && <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px 16px', marginTop: 12, paddingTop: 12, borderTop: `1px solid ${dk.divider}` }}>
                    {Object.entries(sub.data).filter(([k, v]) => v && typeof v === 'string' && v.length > 0 && k !== 'participant_name').slice(0, 4).map(([k, v]) => (
                      <div key={k}><p style={{ fontSize: 10, color: dk.textFaint, textTransform: 'capitalize', fontWeight: 600 }}>{k.replace(/_/g, ' ')}</p><p style={{ fontSize: 12, color: dk.textSoft, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{v}</p></div>
                    ))}
                  </div>}
                </Glass>
              )
            }) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <ClipboardList size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No form submissions for this participant</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ GOALS TAB ══════════ */}
        {tab === 'goals' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12, ...stg(3) }}>
            {p.goals && p.goals.length > 0 ? p.goals.map(g => (
              <Glass key={g.id} dark={isDark} hover glow={g.status === 'achieved' ? 'rgba(16,185,129,0.12)' : `${c.primary}10`} style={{ padding: '18px 22px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 10 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, background: g.status === 'achieved' ? 'linear-gradient(135deg, #10b981, #34d399)' : `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <Target size={18} color="white" />
                    </div>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{g.title}</p>
                  </div>
                  <Badge color={g.status === 'achieved' ? 'green' : g.status === 'active' ? 'blue' : 'gray'} dark={isDark}>{g.status}</Badge>
                </div>
                {g.description && <p style={{ fontSize: 13, color: dk.textMuted, marginBottom: 12 }}>{g.description}</p>}
                <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                  <div style={{ height: '100%', borderRadius: 999, width: `${g.progress}%`, background: g.status === 'achieved' ? 'linear-gradient(90deg, #10b981, #34d399)' : `linear-gradient(90deg, ${c.primary}, ${c.adminHover})`, transition: 'width 1s cubic-bezier(.16,1,.3,1)' }} />
                </div>
                <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 6 }}>{g.progress}% complete{g.target_date ? ` · Target: ${new Date(g.target_date).toLocaleDateString('en-AU')}` : ''}</p>
              </Glass>
            )) : (
              <Glass dark={isDark} style={{ padding: '48px 24px', textAlign: 'center' }}>
                <Target size={32} style={{ color: dk.textFaint, margin: '0 auto 12px' }} />
                <p style={{ color: dk.textMuted, fontWeight: 600 }}>No goals set yet</p>
              </Glass>
            )}
          </div>
        )}

        {/* ══════════ FAMILY TAB ══════════ */}
        {tab === 'family' && (
          <div style={stg(3)}>
            <FamilyAccessManager participantId={p.id} participantName={`${p.first_name} ${p.last_name}`} portalEnabled={p.family_portal_enabled || false} onPortalToggle={(enabled) => setP(prev => ({ ...prev, family_portal_enabled: enabled }))} accentColor="#ec4899" />
          </div>
        )}

      </div>

      {/* ══════════ UPLOAD MODAL ══════════ */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null) }} title="Upload Document">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`, position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
            <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
            <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Upload size={24} color="white" /></div>
              <div><h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>Upload Document</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Add a document to this participant's file</p></div>
            </div>
          </div>
          <div>
            <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}><FileText size={11} /> Document Name</p>
            <input value={uploadForm.name} onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })} placeholder="e.g. NDIS Plan 2026" style={inputStyle}
              onFocus={e => e.target.style.borderColor = c.primary} onBlur={e => e.target.style.borderColor = dk.inputBorder} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Type</p>
              <select value={uploadForm.document_type} onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })} style={{ ...inputStyle, cursor: 'pointer' }}>
                <option value="service_agreement">Service Agreement</option><option value="ndis_plan">NDIS Plan</option><option value="support_plan">Support Plan</option><option value="risk_assessment">Risk Assessment</option><option value="consent_form">Consent Form</option><option value="medical_report">Medical Report</option><option value="behaviour_support_plan">Behaviour Support Plan</option><option value="other">Other</option>
              </select>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Expiry Date</p>
              <input type="date" value={uploadForm.expiry_date} onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })} style={inputStyle} />
            </div>
          </div>
          {/* Toggles */}
          <div style={{ padding: '16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div><p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Visible to Workers</p><p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Staff assigned to this participant can view</p></div>
              <button onClick={() => setUploadForm({ ...uploadForm, visible_to_staff: !uploadForm.visible_to_staff })} style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: uploadForm.visible_to_staff ? '#10b981' : (isDark ? 'rgba(51,65,85,0.6)' : '#d1d5db'), border: 'none', cursor: 'pointer', transition: 'background .25s', flexShrink: 0 }}>
                <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: uploadForm.visible_to_staff ? 25 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
              </button>
            </div>
            {uploadForm.visible_to_staff && (
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', paddingTop: 12, borderTop: `1px solid ${dk.divider}` }}>
                <div><p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Requires Sign-off</p><p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>Staff must acknowledge they've read this</p></div>
                <button onClick={() => setUploadForm({ ...uploadForm, requires_signoff: !uploadForm.requires_signoff })} style={{ width: 48, height: 26, borderRadius: 999, position: 'relative', background: uploadForm.requires_signoff ? '#f59e0b' : (isDark ? 'rgba(51,65,85,0.6)' : '#d1d5db'), border: 'none', cursor: 'pointer', transition: 'background .25s', flexShrink: 0 }}>
                  <div style={{ width: 20, height: 20, borderRadius: '50%', background: 'white', position: 'absolute', top: 3, left: uploadForm.requires_signoff ? 25 : 3, transition: 'left .25s cubic-bezier(.16,1,.3,1)', boxShadow: '0 1px 4px rgba(0,0,0,0.15)' }} />
                </button>
              </div>
            )}
          </div>
          {/* File picker */}
          <div>
            <input type="file" ref={fileRef} style={{ display: 'none' }} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setSelectedFile(e.target.files[0])} />
            {selectedFile ? (
              <div style={{ padding: '16px', borderRadius: 14, background: isDark ? 'rgba(20,184,166,0.08)' : '#f0fdfa', border: `1px solid ${isDark ? 'rgba(20,184,166,0.2)' : '#99f6e4'}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  <FileText size={20} style={{ color: '#0d9488' }} />
                  <div><p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{selectedFile.name}</p><p style={{ fontSize: 11, color: dk.textFaint }}>{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p></div>
                </div>
                <button onClick={() => { setSelectedFile(null); fileRef.current.value = '' }} style={{ width: 32, height: 32, borderRadius: 8, background: 'transparent', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dk.textFaint }}><X size={16} /></button>
              </div>
            ) : (
              <button onClick={() => fileRef.current.click()} style={{ width: '100%', padding: '28px 16px', border: `2px dashed ${dk.inputBorder}`, borderRadius: 16, background: 'transparent', cursor: 'pointer', textAlign: 'center', transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dk.inputBorder }}>
                <Upload size={28} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Click to select file</p>
                <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4 }}>PDF, JPG, PNG, DOC up to 10MB</p>
              </button>
            )}
          </div>
          <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
            <button onClick={() => { setShowUpload(false); setSelectedFile(null) }} style={{ flex: 1, padding: '15px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile} style={{ flex: 2, padding: '15px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 8px 28px -6px ${c.primary}50`, opacity: (uploading || !selectedFile) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* ══════════ VIEW FORM MODAL ══════════ */}
      <Modal isOpen={!!viewForm} onClose={() => setViewForm(null)} title={viewForm ? ({ medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation' }[viewForm.form_type] || 'Form Submission') : 'Form'} wide>
        {viewForm && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ padding: '14px 18px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, display: 'flex', justifyContent: 'space-between' }}>
              <div><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>Submitted by</p><p style={{ fontSize: 14, fontWeight: 700, color: dk.text, marginTop: 2 }}>{viewForm.staff ? `${viewForm.staff.first_name} ${viewForm.staff.last_name}` : 'Unknown'}</p></div>
              <div style={{ textAlign: 'right' }}><p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase' }}>Date</p><p style={{ fontSize: 13, fontWeight: 700, color: dk.textSoft, marginTop: 2 }}>{viewForm.submitted_at ? new Date(viewForm.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p></div>
            </div>
            {viewForm.data && Object.entries(viewForm.data).filter(([k, v]) => v).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {Object.entries(viewForm.data).filter(([k, v]) => v).map(([k, v]) => (
                  <div key={k} style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'capitalize', marginBottom: 4 }}>{k.replace(/_/g, ' ')}</p>
                    <p style={{ fontSize: 13, color: dk.text, whiteSpace: 'pre-wrap', lineHeight: 1.5 }}>{v}</p>
                  </div>
                ))}
              </div>
            ) : <p style={{ fontSize: 13, color: dk.textFaint, textAlign: 'center', padding: 20 }}>No data</p>}
            <button onClick={() => setViewForm(null)} style={{ width: '100%', padding: '14px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Close</button>
          </div>
        )}
      </Modal>

      {/* ══════════ SIGNOFFS MODAL ══════════ */}
      <Modal isOpen={!!viewSignoffs} onClose={() => setViewSignoffs(null)} title="Document Sign-offs">
        {viewSignoffs && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {(() => { const doc = p.documents?.find(d => d.id === viewSignoffs); return doc ? <div style={{ padding: '14px 18px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}><p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{doc.name}</p><p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{doc.document_type?.replace(/_/g, ' ')}</p></div> : null })()}
            {(docSignoffs[viewSignoffs] || []).length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {docSignoffs[viewSignoffs].map(s => (
                  <div key={s.id || s.staff_id} style={{ padding: '14px 18px', borderRadius: 14, background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <div style={{ width: 38, height: 38, borderRadius: 10, background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0 }}>{s.staff?.first_name?.[0]}{s.staff?.last_name?.[0]}</div>
                      <div style={{ flex: 1 }}><p style={{ fontWeight: 700, color: dk.text, fontSize: 13 }}>{s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown'}</p><p style={{ fontSize: 11, color: '#10b981', marginTop: 2 }}>Signed {s.signed_at ? new Date(s.signed_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit' }) : ''}</p></div>
                      <CheckCircle size={18} style={{ color: '#10b981', flexShrink: 0 }} />
                    </div>
                    {s.signature_data && <div style={{ marginTop: 10, paddingTop: 10, borderTop: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` }}><p style={{ fontSize: 9, fontWeight: 700, color: '#10b981', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Signature</p><img src={s.signature_data} alt="Signature" style={{ height: 48, background: 'white', borderRadius: 8, border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}`, padding: 4 }} /></div>}
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ padding: '32px 24px', textAlign: 'center' }}>
                <Users size={32} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>No sign-offs yet</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* ══════════ MANAGE ACCESS MODAL ══════════ */}
      <Modal isOpen={!!manageAccessDoc} onClose={() => setManageAccessDoc(null)} title="Manage Staff Access">
        {manageAccessDoc && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ margin: '-20px -20px 0 -20px', padding: '24px 28px 20px', background: 'linear-gradient(135deg, #8b5cf6 0%, #7c3aed 50%, #6366f1 100%)', position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0' }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Lock size={24} color="white" /></div>
                <div><h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>{manageAccessDoc.name}</h3><p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Manage who can view this document</p></div>
              </div>
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff', border: `1px solid ${isDark ? 'rgba(139,92,246,0.2)' : '#ddd6fe'}`, fontSize: 12, fontWeight: 600, color: isDark ? '#a78bfa' : '#7c3aed', display: 'flex', alignItems: 'center', gap: 8 }}>
              <Shield size={14} /> If no staff are selected, all staff with shifts for this participant can view the document.
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Staff Members</p>
              <div style={{ display: 'flex', gap: 6 }}>
                <button onClick={() => grantAllStaffAccess(manageAccessDoc.id)} disabled={savingAccess} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5', color: '#10b981', fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Select All</button>
                <button onClick={() => revokeAllStaffAccess(manageAccessDoc.id)} disabled={savingAccess} style={{ padding: '6px 12px', borderRadius: 8, border: 'none', background: dk.subtleBg2, color: dk.textMuted, fontSize: 11, fontWeight: 700, cursor: 'pointer' }}>Clear All</button>
              </div>
            </div>
            <div style={{ maxHeight: 360, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
              {allStaff.filter(s => s.status !== 'terminated').map(s => {
                const hasAccess = (docAccessMap[manageAccessDoc.id] || new Set()).has(s.id)
                return (
                  <button key={s.id} onClick={() => toggleStaffAccess(manageAccessDoc.id, s.id, hasAccess)} disabled={savingAccess}
                    style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 12, padding: '12px 14px', borderRadius: 12, border: `1.5px solid ${hasAccess ? (isDark ? 'rgba(139,92,246,0.3)' : '#ddd6fe') : dk.inputBorder}`, background: hasAccess ? (isDark ? 'rgba(139,92,246,0.08)' : '#f5f3ff') : dk.inputBg, cursor: 'pointer', textAlign: 'left', transition: 'all .2s' }}>
                    <div style={{ width: 36, height: 36, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 12, fontWeight: 800, color: 'white', background: hasAccess ? '#8b5cf6' : '#9ca3af', flexShrink: 0 }}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: 13, fontWeight: 700, color: hasAccess ? dk.text : dk.textMuted }}>{s.first_name} {s.last_name}</p>
                      <p style={{ fontSize: 11, color: dk.textFaint }}>{s.role || 'Staff'}</p>
                    </div>
                    <div style={{ width: 22, height: 22, borderRadius: 6, border: `2px solid ${hasAccess ? '#8b5cf6' : (isDark ? '#475569' : '#d1d5db')}`, background: hasAccess ? '#8b5cf6' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all .2s' }}>
                      {hasAccess && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                )
              })}
              {allStaff.length === 0 && <div style={{ padding: 24, textAlign: 'center' }}><Loader2 size={20} className="animate-spin" style={{ color: dk.textFaint, margin: '0 auto 8px' }} /><p style={{ fontSize: 12, color: dk.textFaint }}>Loading staff...</p></div>}
            </div>
            <div style={{ padding: '12px 16px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`, fontSize: 12, fontWeight: 600, color: dk.textMuted }}>
              <strong>{(docAccessMap[manageAccessDoc.id] || new Set()).size}</strong> staff member{(docAccessMap[manageAccessDoc.id] || new Set()).size !== 1 ? 's' : ''} selected{(docAccessMap[manageAccessDoc.id] || new Set()).size === 0 && ' — all assigned staff can view'}
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}