import { useState, useEffect, useRef } from 'react'
import { useParams, Link } from 'react-router-dom'
import {
  ArrowLeft, Shield, FileText, Upload, AlertCircle, Phone, Mail, Calendar,
  Clock, Loader2, MapPin, Check, CheckCircle, XCircle, AlertTriangle,
  Pencil, X, Save, Trash2, ExternalLink, Plus, ChevronRight, User,
  Briefcase, Hash, Star, Activity, Heart, Eye, Download, RefreshCw,
  Sun, Moon, Sunrise, Sunset, Award, ShieldCheck, FileCheck, TrendingUp,
  UserCheck, ClipboardList, Zap
} from 'lucide-react'
import { getStaffMember, updateStaffMember } from '../services/staffService'
import { getShifts } from '../services/shiftService'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM COMPONENTS
   ───────────────────────────────────────────── */

function Glass({ children, className = '', dark, glow, hover, style, ...p }) {
  const base = dark
    ? 'rgba(30,41,59,0.6)'
    : 'rgba(255,255,255,0.55)'
  const border = dark
    ? 'rgba(51,65,85,0.4)'
    : 'rgba(255,255,255,0.7)'
  return (
    <div
      className={className}
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover ? 'pointer' : undefined,
        ...style,
      }}
      onMouseEnter={hover ? e => {
        e.currentTarget.style.transform = 'translateY(-2px)'
        e.currentTarget.style.boxShadow = glow
          ? `0 16px 48px -8px ${glow}`
          : '0 12px 40px -8px rgba(0,0,0,0.12)'
      } : undefined}
      onMouseLeave={hover ? e => {
        e.currentTarget.style.transform = 'translateY(0)'
        e.currentTarget.style.boxShadow = glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 24px -4px rgba(0,0,0,0.06)'
      } : undefined}
      {...p}
    >
      {children}
    </div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top, left, right, bottom,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.12,
        borderRadius: '50%',
        animation: `orbFloat 8s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const start = performance.now()
    const from = 0
    const to = typeof value === 'number' ? value : parseInt(value) || 0
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(from + (to - from) * eased))
      if (progress < 1) ref.current = requestAnimationFrame(tick)
    }
    ref.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(ref.current)
  }, [value, duration])
  return <>{display}</>
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray:   dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
                 : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green:  dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }
                 : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber:  dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
                 : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red:    dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
                 : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' }
                 : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal:   dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' }
                 : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    blue:   dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
                 : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' }
                 : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  }
  const p = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>
      {children}
    </span>
  )
}


/* ─────────────────────────────────────────────
   CONSTANTS & HELPERS
   ───────────────────────────────────────────── */

function docStatus(doc) {
  if (doc.status === 'pending') return 'blue'
  if (doc.status === 'expired' || doc.status === 'rejected') return 'red'
  if (!doc.expiry_date) return 'green'
  const days = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'red'
  if (days < 30) return 'amber'
  return 'green'
}

function docLabel(doc) {
  if (doc.status === 'pending') return 'Pending Review'
  if (doc.status === 'rejected') return 'Rejected'
  if (!doc.expiry_date) return 'Valid'
  const days = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days < 30) return 'Expiring Soon'
  return 'Valid'
}

function formatType(type) {
  if (!type) return '—'
  return type.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contract', label: 'Contract' },
]

const ROLES = [
  { value: 'support_worker', label: 'Support Worker' },
  { value: 'team_leader', label: 'Team Leader' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'admin', label: 'Admin' },
]

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
]

const QUAL_DOC_TYPES = [
  { value: 'ndis_screening', label: 'NDIS Worker Screening' },
  { value: 'wwcc', label: 'Working With Children Check' },
  { value: 'first_aid', label: 'First Aid Certificate' },
  { value: 'cpr', label: 'CPR Certificate' },
  { value: 'police_check', label: 'Police Check' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'infection_control', label: 'Infection Control' },
  { value: 'other', label: 'Other' },
]

const GENERAL_DOC_TYPES = [
  { value: 'contract', label: 'Employment Contract' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'training', label: 'Training Certificate' },
  { value: 'reference', label: 'Reference Letter' },
  { value: 'other', label: 'Other' },
]

const QUAL_TYPE_KEYS = QUAL_DOC_TYPES.map(t => t.value)

const TAB_ICONS = {
  profile: User,
  qualifications: ShieldCheck,
  documents: FileCheck,
  shifts: Calendar,
  availability: Clock,
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function StaffDetail() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { id } = useParams()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [s, setS] = useState(null)
  const [shifts, setShifts] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [staffAvailability, setStaffAvailability] = useState([])
  const [availLoaded, setAvailLoaded] = useState(false)

  /* ── Dark mode color system ── */
  const dk = {
    text:        isDark ? '#e2e8f0' : '#1f2937',
    textSoft:    isDark ? '#cbd5e1' : '#374151',
    textMuted:   isDark ? '#94a3b8' : '#6b7280',
    textFaint:   isDark ? '#64748b' : '#9ca3af',
    inputBg:     isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider:     isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    cardBg:      isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.6)',
    cardBorder:  isDark ? 'rgba(51,65,85,0.3)' : 'rgba(255,255,255,0.8)',
    sectionBg:   isDark ? 'rgba(30,41,59,0.4)' : 'rgba(249,250,251,0.8)',
    pageBg:      isDark ? '#0f172a' : '#eff6ff',
  }

  /* ── Stagger helper ── */
  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  /* ── Availability loader ── */
  const loadAvailability = async (staffId) => {
    try {
      const { data: avail, error: availErr } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
      if (!availErr && avail) setStaffAvailability(avail)
      setAvailLoaded(true)
    } catch (e) {
      console.warn('staff_availability not loaded:', e)
      setAvailLoaded(true)
    }
  }

  /* ── Document upload state ── */
  const [viewDoc, setViewDoc] = useState(null)
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState('qualification')
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({
    name: '',
    document_type: '',
    expiry_date: '',
    document_number: '',
  })

  /* ── Load data ── */
  useEffect(() => {
    async function load() {
      try {
        const [staff, allShifts] = await Promise.all([
          getStaffMember(id),
          getShifts().catch(() => []),
        ])
        setS(staff)
        setShifts(allShifts.filter(sh => sh.staff_id === id))
        loadAvailability(id)
      } catch (err) {
        console.error('Failed to load staff member:', err)
      } finally {
        setLoading(false)
        setTimeout(() => setLoaded(true), 50)
      }
    }
    load()
  }, [id])

  /* ── Edit handlers ── */
  const startEditing = () => {
    setEditForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      phone: s.phone || '',
      email: s.email || '',
      date_of_birth: s.date_of_birth || '',
      gender: s.gender || '',
      address: s.address || '',
      employment_type: s.employment_type || '',
      role: s.role || '',
      start_date: s.start_date || '',
      status: s.status || 'active',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      emergency_contact_relationship: s.emergency_contact_relationship || '',
      notes: s.notes || '',
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditForm({})
  }

  const handleSave = async () => {
    if (!editForm.first_name || !editForm.last_name) {
      alert('First name and last name are required')
      return
    }
    setSaving(true)
    try {
      const updated = await updateStaffMember(id, editForm)
      setS(prev => ({ ...prev, ...updated }))
      setEditing(false)
      setEditForm({})
    } catch (err) {
      console.error('Failed to update staff:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) =>
    setEditForm(prev => ({ ...prev, [field]: value }))

  /* ── Upload handlers ── */
  const openUploadModal = (type) => {
    setUploadType(type)
    setUploadForm({
      name: '',
      document_type: type === 'qualification' ? 'ndis_screening' : 'contract',
      expiry_date: '',
      document_number: '',
    })
    setSelectedFile(null)
    setShowUpload(true)
  }

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    if (!uploadForm.document_type) { alert('Please select a document type'); return }
    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `staff/${id}/${Date.now()}.${fileExt}`
      const { error: fileError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile)
      if (fileError) throw fileError
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)
      const { error: dbError } = await supabase.from('documents').insert({
        staff_id: id,
        name: uploadForm.document_type === 'other' && uploadForm.custom_type
          ? uploadForm.custom_type
          : (uploadForm.name || selectedFile.name),
        document_type: uploadForm.document_type,
        file_url: publicUrl,
        file_name: selectedFile.name,
        expiry_date: uploadForm.expiry_date || null,
        document_number: uploadForm.document_number || null,
        status: 'valid',
      })
      if (dbError) throw dbError
      const updated = await getStaffMember(id)
      setS(updated)
      setShowUpload(false)
      setSelectedFile(null)
      setUploadForm({ name: '', document_type: '', expiry_date: '', document_number: '' })
      alert('Document uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  /* ── Document management ── */
  const handleDeleteDoc = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId)
      if (error) throw error
      const updated = await getStaffMember(id)
      setS(updated)
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete document')
    }
  }

  const handleDocStatus = async (docId, newStatus) => {
    try {
      const { error } = await supabase
        .from('documents')
        .update({ status: newStatus })
        .eq('id', docId)
      if (error) throw error
      const updated = await getStaffMember(id)
      setS(updated)
      setViewDoc(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (err) {
      console.error('Status update failed:', err)
      alert('Failed to update document status')
    }
  }


  /* ─────────────────────────────────────────────
     LOADING / NOT FOUND STATES
     ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        height: '60vh', flexDirection: 'column', gap: 16,
      }}>
        <div style={{
          width: 56, height: 56, borderRadius: '50%',
          background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: `0 8px 32px -8px ${c.staff}60`,
        }}>
          <Loader2 size={28} color="white" className="animate-spin" />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>
          Loading staff profile...
        </p>
      </div>
    )
  }

  if (!s) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '50vh', gap: 16,
      }}>
        <div style={{
          width: 72, height: 72, borderRadius: '50%',
          background: isDark ? 'rgba(51,65,85,0.3)' : '#f1f5f9',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <User size={32} style={{ color: dk.textFaint }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 15, fontWeight: 600 }}>
          Staff member not found
        </p>
        <Link
          to="/admin/staff"
          style={{
            color: c.staff, fontWeight: 600, fontSize: 14,
            textDecoration: 'none',
          }}
        >
          ← Back to Staff
        </Link>
      </div>
    )
  }


  /* ─────────────────────────────────────────────
     DERIVED DATA
     ───────────────────────────────────────────── */

  const tabs = ['profile', 'qualifications', 'documents', 'shifts', 'availability']
  const docs = s.documents || []
  const qualDocs = docs.filter(d => QUAL_TYPE_KEYS.includes(d.document_type))
  const otherDocs = docs.filter(d => !QUAL_TYPE_KEYS.includes(d.document_type))
  const expiringCount = docs.filter(d => docStatus(d) === 'amber').length
  const expiredCount = docs.filter(d => docStatus(d) === 'red').length
  const pendingCount = docs.filter(d => d.status === 'pending').length
  const validCount = docs.filter(d => docStatus(d) === 'green').length
  const totalShifts = shifts.length
  const completedShifts = shifts.filter(sh => sh.status === 'completed').length


  /* ─────────────────────────────────────────────
     SUB-COMPONENTS
     ───────────────────────────────────────────── */

  const InfoField = ({ label, value, icon: Icon }) => (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: dk.cardBg,
      border: `1px solid ${dk.cardBorder}`,
      backdropFilter: 'blur(12px)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 4 }}>
        {Icon && <Icon size={12} style={{ color: dk.textFaint }} />}
        <p style={{ fontSize: 11, color: dk.textFaint, fontWeight: 600, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
      <p style={{ color: dk.text, fontWeight: 700, fontSize: 14 }}>
        {value || '—'}
      </p>
    </div>
  )

  const EditField = ({ label, value, onChange, type = 'text', options, icon: Icon }) => (
    <div style={{
      padding: '14px 16px',
      borderRadius: 14,
      background: dk.inputBg,
      border: `2px solid ${c.staff}40`,
      transition: 'all .2s ease',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={12} style={{ color: c.staff }} />}
        <p style={{ fontSize: 11, color: c.staff, fontWeight: 700, letterSpacing: '0.03em', textTransform: 'uppercase' }}>
          {label}
        </p>
      </div>
      {options ? (
        <select
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', fontSize: 14, fontWeight: 600, color: dk.text,
            background: 'transparent', border: 'none', outline: 'none',
          }}
        >
          <option value="">Select...</option>
          {options.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          value={value || ''}
          onChange={e => onChange(e.target.value)}
          style={{
            width: '100%', fontSize: 14, fontWeight: 600, color: dk.text,
            background: 'transparent', border: 'none', outline: 'none',
          }}
        />
      )}
    </div>
  )

  const StatPill = ({ icon: Icon, label, value, color, delay = 0 }) => (
    <div style={{
      ...stg(delay),
      display: 'flex', alignItems: 'center', gap: 12,
      padding: '14px 18px', borderRadius: 16,
      background: dk.cardBg,
      border: `1px solid ${dk.cardBorder}`,
      backdropFilter: 'blur(12px)',
      flex: 1, minWidth: 140,
    }}>
      <div style={{
        width: 42, height: 42, borderRadius: 12,
        background: `linear-gradient(135deg, ${color}20, ${color}10)`,
        border: `1px solid ${color}30`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        flexShrink: 0,
      }}>
        <Icon size={20} style={{ color }} />
      </div>
      <div>
        <p style={{ fontSize: 11, color: dk.textFaint, fontWeight: 600, letterSpacing: '0.04em', textTransform: 'uppercase' }}>
          {label}
        </p>
        <p style={{ fontSize: 22, fontWeight: 800, color: dk.text, lineHeight: 1.1 }}>
          <AnimNum value={value} />
        </p>
      </div>
    </div>
  )

  const DocCard = ({ d, index }) => {
    const status = docStatus(d)
    const statusColors = {
      green: '#10b981',
      amber: '#f59e0b',
      red: '#ef4444',
      blue: '#3b82f6',
    }
    const statusColor = statusColors[status] || '#6b7280'

    return (
      <Glass
        dark={isDark}
        hover
        glow={`${statusColor}20`}
        style={{ ...stg(index + 2), padding: '16px 20px', cursor: 'pointer' }}
        onClick={() => setViewDoc(d)}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            {/* Status accent bar */}
            <div style={{
              width: 4, height: 44, borderRadius: 4,
              background: `linear-gradient(to bottom, ${statusColor}, ${statusColor}60)`,
              flexShrink: 0,
            }} />
            {/* Icon */}
            <div style={{
              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
              background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}08)`,
              border: `1px solid ${statusColor}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              {QUAL_TYPE_KEYS.includes(d.document_type)
                ? <Shield size={20} style={{ color: statusColor }} />
                : <FileText size={20} style={{ color: statusColor }} />
              }
            </div>
            {/* Text */}
            <div style={{ minWidth: 0 }}>
              <p style={{
                fontWeight: 700, color: dk.text, fontSize: 14,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {d.name || formatType(d.document_type)}
              </p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 2 }}>
                {d.status === 'pending' ? 'Uploaded by staff · ' : ''}
                {d.document_number && `#${d.document_number} · `}
                {d.expiry_date
                  ? `Expires: ${new Date(d.expiry_date).toLocaleDateString('en-AU')}`
                  : 'No expiry'}
              </p>
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexShrink: 0 }}>
            <Badge color={status} dark={isDark}>{docLabel(d)}</Badge>
            <ChevronRight size={16} style={{ color: dk.textFaint }} />
          </div>
        </div>
      </Glass>
    )
  }


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>

      {/* Orb keyframes */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1) }
          50% { transform: translateY(-15px) scale(1.03) }
        }
        @keyframes shimmer {
          0% { opacity: 0.5 }
          50% { opacity: 1 }
          100% { opacity: 0.5 }
        }
        @keyframes pulse-ring {
          0% { transform: scale(0.95); opacity: 0.7 }
          50% { transform: scale(1.05); opacity: 1 }
          100% { transform: scale(0.95); opacity: 0.7 }
        }
      `}</style>

      {/* Background orbs */}
      <Orb color={c.staff} size={300} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={220} bottom="10%" left="-40px" delay={2} />
      <Orb color="#10b981" size={180} top="40%" right="5%" delay={4} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 4px' }}>

        {/* ── BACK BUTTON ── */}
        <div style={stg(0)}>
          <Link
            to="/admin/staff"
            style={{
              display: 'inline-flex', alignItems: 'center', gap: 8,
              color: dk.textMuted, fontWeight: 600, fontSize: 14,
              textDecoration: 'none', padding: '8px 0', marginBottom: 8,
              transition: 'color .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.color = c.staff}
            onMouseLeave={e => e.currentTarget.style.color = dk.textMuted}
          >
            <ArrowLeft size={18} /> Back to Staff
          </Link>
        </div>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={{
          ...stg(1),
          borderRadius: 20,
          background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
          padding: '32px 28px',
          position: 'relative',
          overflow: 'hidden',
          marginBottom: 20,
        }}>
          {/* Floating decoration circles */}
          <div style={{
            position: 'absolute', width: 140, height: 140, borderRadius: '50%',
            background: 'rgba(255,255,255,0.08)', top: -30, right: -20,
          }} />
          <div style={{
            position: 'absolute', width: 80, height: 80, borderRadius: '50%',
            background: 'rgba(255,255,255,0.06)', bottom: -15, left: '30%',
          }} />
          <div style={{
            position: 'absolute', width: 50, height: 50, borderRadius: '50%',
            background: 'rgba(255,255,255,0.05)', top: 20, left: '60%',
          }} />
          {/* Dot grid */}
          <div style={{
            position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
            backgroundImage: 'radial-gradient(rgba(255,255,255,0.12) 1px, transparent 1px)',
            backgroundSize: '24px 24px', opacity: 0.5,
          }} />

          <div style={{ position: 'relative', zIndex: 1 }}>
            {/* Top row: avatar + info + action buttons */}
            <div style={{ display: 'flex', alignItems: 'flex-start', gap: 20, flexWrap: 'wrap' }}>
              {/* Avatar */}
              <div style={{
                width: 80, height: 80, borderRadius: 20,
                background: 'rgba(255,255,255,0.2)',
                backdropFilter: 'blur(12px)',
                border: '2px solid rgba(255,255,255,0.3)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 28, fontWeight: 800, color: 'white',
                boxShadow: '0 8px 32px -8px rgba(0,0,0,0.2)',
                flexShrink: 0,
              }}>
                {s.first_name[0]}{s.last_name[0]}
              </div>

              {/* Name, role, badges */}
              <div style={{ flex: 1, minWidth: 200 }}>
                <h1 style={{
                  fontSize: 26, fontWeight: 800, color: 'white',
                  lineHeight: 1.2, marginBottom: 4,
                }}>
                  {s.first_name} {s.last_name}
                </h1>
                <p style={{
                  fontSize: 14, color: 'rgba(255,255,255,0.75)', fontWeight: 500,
                  marginBottom: 10,
                }}>
                  {formatType(s.role) || 'Support Worker'} · {formatType(s.employment_type) || 'Not set'}
                  {s.start_date && ` · Since ${new Date(s.start_date).toLocaleDateString('en-AU', { month: 'short', year: 'numeric' })}`}
                </p>
                <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                  <Badge
                    color={s.status === 'active' ? 'green' : s.status === 'on_leave' ? 'amber' : 'red'}
                    dark
                  >
                    {s.status === 'active' && <span style={{
                      width: 7, height: 7, borderRadius: '50%', background: '#34d399',
                      display: 'inline-block', marginRight: 4,
                      animation: 'pulse-ring 2s ease-in-out infinite',
                    }} />}
                    {formatType(s.status) || 'Active'}
                  </Badge>
                  {expiredCount > 0 && <Badge color="red" dark>{expiredCount} Expired</Badge>}
                  {expiringCount > 0 && <Badge color="amber" dark>{expiringCount} Expiring</Badge>}
                  {pendingCount > 0 && <Badge color="blue" dark>{pendingCount} Pending</Badge>}
                </div>
              </div>

              {/* Quick action buttons */}
              <div style={{ display: 'flex', gap: 10, flexShrink: 0, alignItems: 'flex-start' }}>
                {s.phone && (
                  <a href={`tel:${s.phone}`} style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', textDecoration: 'none',
                    transition: 'all .2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    title="Call"
                  >
                    <Phone size={18} />
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} style={{
                    width: 44, height: 44, borderRadius: 14,
                    background: 'rgba(255,255,255,0.15)',
                    backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.2)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'white', textDecoration: 'none',
                    transition: 'all .2s',
                  }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}
                    title="Email"
                  >
                    <Mail size={18} />
                  </a>
                )}
              </div>
            </div>

            {/* Hero stat pills row */}
            <div style={{
              display: 'flex', gap: 12, marginTop: 22, flexWrap: 'wrap',
            }}>
              {[
                { icon: FileCheck, label: 'Documents', value: docs.length },
                { icon: ShieldCheck, label: 'Qualifications', value: qualDocs.length },
                { icon: Calendar, label: 'Total Shifts', value: totalShifts },
                { icon: CheckCircle, label: 'Completed', value: completedShifts },
              ].map((pill, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: 8,
                  padding: '8px 14px', borderRadius: 12,
                  background: 'rgba(255,255,255,0.12)',
                  backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.15)',
                }}>
                  <pill.icon size={15} style={{ color: 'rgba(255,255,255,0.8)' }} />
                  <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)', fontWeight: 600 }}>
                    {pill.label}
                  </span>
                  <span style={{ fontSize: 16, color: 'white', fontWeight: 800 }}>
                    <AnimNum value={pill.value} />
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════
            STAT CARDS ROW
            ══════════════════════════════════════════ */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
          gap: 14, marginBottom: 20,
        }}>
          <StatPill icon={ShieldCheck} label="Valid Docs" value={validCount} color="#10b981" delay={2} />
          <StatPill icon={AlertTriangle} label="Expiring" value={expiringCount} color="#f59e0b" delay={3} />
          <StatPill icon={XCircle} label="Expired" value={expiredCount} color="#ef4444" delay={4} />
          <StatPill icon={Clock} label="Pending Review" value={pendingCount} color="#3b82f6" delay={5} />
        </div>


        {/* ══════════════════════════════════════════
            TAB NAVIGATION
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} style={{ padding: '6px', marginBottom: 20, ...stg(6) }}>
          <div style={{ display: 'flex', gap: 4, flexWrap: 'wrap' }}>
            {tabs.map((t, i) => {
              const Icon = TAB_ICONS[t]
              const isActive = tab === t
              return (
                <button
                  key={t}
                  onClick={() => {
                    setTab(t)
                    if (t === 'availability') loadAvailability(id)
                  }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: 14,
                    fontSize: 13, fontWeight: 700, border: 'none', cursor: 'pointer',
                    transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                    background: isActive
                      ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`
                      : 'transparent',
                    color: isActive ? 'white' : dk.textMuted,
                    boxShadow: isActive ? `0 4px 16px -4px ${c.staff}60` : 'none',
                    flex: '1 1 auto',
                    justifyContent: 'center',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <Icon size={16} />
                  {t.charAt(0).toUpperCase() + t.slice(1)}
                </button>
              )
            })}
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            TAB CONTENT
            ══════════════════════════════════════════ */}

        {/* ── PROFILE TAB ── */}
        {tab === 'profile' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Edit controls bar */}
            <Glass dark={isDark} style={{ ...stg(7), padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${c.staff}20, ${c.staff}08)`,
                    border: `1px solid ${c.staff}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <User size={18} style={{ color: c.staff }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Personal Details</h3>
                    <p style={{ fontSize: 12, color: dk.textFaint }}>
                      {editing ? 'Edit mode active — make changes below' : 'View and manage staff information'}
                    </p>
                  </div>
                </div>
                {!editing ? (
                  <button
                    onClick={startEditing}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 6,
                      padding: '10px 18px', borderRadius: 12, border: 'none',
                      background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                      color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      boxShadow: `0 4px 16px -4px ${c.staff}60`,
                      transition: 'all .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                    onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                  >
                    <Pencil size={14} /> Edit Profile
                  </button>
                ) : (
                  <div style={{ display: 'flex', gap: 8 }}>
                    <button
                      onClick={cancelEditing}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 16px', borderRadius: 12,
                        background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                        border: `1px solid ${dk.inputBorder}`,
                        color: dk.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer',
                      }}
                    >
                      <X size={14} /> Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      disabled={saving}
                      style={{
                        display: 'flex', alignItems: 'center', gap: 6,
                        padding: '10px 18px', borderRadius: 12, border: 'none',
                        background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                        color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                        boxShadow: `0 4px 16px -4px ${c.staff}60`,
                        opacity: saving ? 0.6 : 1,
                      }}
                    >
                      {saving ? <Loader2 size={14} className="animate-spin" /> : <Save size={14} />}
                      {saving ? 'Saving...' : 'Save Changes'}
                    </button>
                  </div>
                )}
              </div>
            </Glass>

            {/* Editing mode banner */}
            {editing && (
              <div style={{
                ...stg(8),
                padding: '12px 18px', borderRadius: 14,
                background: `linear-gradient(135deg, ${c.staff}12, ${c.staffHover}08)`,
                border: `1px solid ${c.staff}30`,
                display: 'flex', alignItems: 'center', gap: 10,
                fontSize: 13, fontWeight: 600, color: c.staff,
              }}>
                <Zap size={16} />
                Editing mode — fields are now editable. Click Save when done.
              </div>
            )}

            {/* Main info grid */}
            <Glass dark={isDark} style={{ ...stg(8), padding: '24px' }}>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {editing ? (
                  <>
                    <EditField label="First Name" value={editForm.first_name} onChange={v => updateField('first_name', v)} icon={User} />
                    <EditField label="Last Name" value={editForm.last_name} onChange={v => updateField('last_name', v)} icon={User} />
                    <EditField label="Phone" value={editForm.phone} onChange={v => updateField('phone', v)} type="tel" icon={Phone} />
                    <EditField label="Email" value={editForm.email} onChange={v => updateField('email', v)} type="email" icon={Mail} />
                    <EditField label="Date of Birth" value={editForm.date_of_birth} onChange={v => updateField('date_of_birth', v)} type="date" icon={Calendar} />
                    <EditField label="Gender" value={editForm.gender} onChange={v => updateField('gender', v)} options={GENDERS} icon={User} />
                    <div style={{ gridColumn: '1 / -1' }}>
                      <EditField label="Address" value={editForm.address} onChange={v => updateField('address', v)} icon={MapPin} />
                    </div>
                    <EditField label="Employment Type" value={editForm.employment_type} onChange={v => updateField('employment_type', v)} options={EMPLOYMENT_TYPES} icon={Briefcase} />
                    <EditField label="Role" value={editForm.role} onChange={v => updateField('role', v)} options={ROLES} icon={Star} />
                    <EditField label="Status" value={editForm.status} onChange={v => updateField('status', v)} options={STATUSES} icon={Activity} />
                    <EditField label="Start Date" value={editForm.start_date} onChange={v => updateField('start_date', v)} type="date" icon={Calendar} />
                  </>
                ) : (
                  <>
                    <InfoField label="First Name" value={s.first_name} icon={User} />
                    <InfoField label="Last Name" value={s.last_name} icon={User} />
                    <InfoField label="Phone" value={s.phone} icon={Phone} />
                    <InfoField label="Email" value={s.email} icon={Mail} />
                    <InfoField label="Date of Birth" value={s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-AU') : null} icon={Calendar} />
                    <InfoField label="Gender" value={formatType(s.gender)} icon={User} />
                    <InfoField label="Address" value={s.address} icon={MapPin} />
                    <InfoField label="Employment Type" value={formatType(s.employment_type)} icon={Briefcase} />
                    <InfoField label="Role" value={formatType(s.role)} icon={Star} />
                    <InfoField label="Status" value={formatType(s.status)} icon={Activity} />
                    <InfoField label="Start Date" value={s.start_date ? new Date(s.start_date).toLocaleDateString('en-AU') : null} icon={Calendar} />
                  </>
                )}
              </div>
            </Glass>

            {/* Emergency contact */}
            <Glass dark={isDark} glow="rgba(239,68,68,0.1)" style={{ ...stg(9), padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))',
                  border: '1px solid rgba(239,68,68,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Heart size={18} style={{ color: '#ef4444' }} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Emergency Contact</h4>
                  <p style={{ fontSize: 12, color: dk.textFaint }}>In case of emergency</p>
                </div>
              </div>
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}>
                {editing ? (
                  <>
                    <EditField label="Name" value={editForm.emergency_contact_name} onChange={v => updateField('emergency_contact_name', v)} icon={User} />
                    <EditField label="Phone" value={editForm.emergency_contact_phone} onChange={v => updateField('emergency_contact_phone', v)} type="tel" icon={Phone} />
                    <EditField label="Relationship" value={editForm.emergency_contact_relationship} onChange={v => updateField('emergency_contact_relationship', v)} icon={Heart} />
                  </>
                ) : (
                  <>
                    <InfoField label="Name" value={s.emergency_contact_name} icon={User} />
                    <InfoField label="Phone" value={s.emergency_contact_phone} icon={Phone} />
                    <InfoField label="Relationship" value={s.emergency_contact_relationship} icon={Heart} />
                  </>
                )}
              </div>
            </Glass>

            {/* Notes */}
            <Glass dark={isDark} style={{ ...stg(10), padding: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
                  border: `1px solid ${c.staff}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <ClipboardList size={18} style={{ color: c.staff }} />
                </div>
                <div>
                  <h4 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Notes</h4>
                  <p style={{ fontSize: 12, color: dk.textFaint }}>Internal notes about this staff member</p>
                </div>
              </div>
              {editing ? (
                <textarea
                  value={editForm.notes}
                  onChange={e => updateField('notes', e.target.value)}
                  rows={4}
                  placeholder="Add notes about this staff member..."
                  style={{
                    width: '100%', fontSize: 14, color: dk.text,
                    background: dk.inputBg,
                    border: `2px solid ${c.staff}40`,
                    borderRadius: 14, padding: 16, outline: 'none',
                    resize: 'vertical', fontFamily: 'inherit',
                  }}
                />
              ) : (
                <p style={{
                  fontSize: 14, color: s.notes ? dk.textSoft : dk.textFaint,
                  lineHeight: 1.6, fontStyle: s.notes ? 'normal' : 'italic',
                }}>
                  {s.notes || 'No notes added'}
                </p>
              )}
            </Glass>
          </div>
        )}


        {/* ── QUALIFICATIONS TAB ── */}
        {tab === 'qualifications' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Compliance alert */}
            {(expiredCount > 0 || expiringCount > 0) && (
              <Glass
                dark={isDark}
                glow={expiredCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}
                style={{ ...stg(7), padding: '18px 22px' }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{
                    width: 44, height: 44, borderRadius: 12,
                    background: expiredCount > 0
                      ? 'linear-gradient(135deg, rgba(239,68,68,0.15), rgba(239,68,68,0.05))'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.15), rgba(245,158,11,0.05))',
                    border: `1px solid ${expiredCount > 0 ? 'rgba(239,68,68,0.25)' : 'rgba(245,158,11,0.25)'}`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}>
                    <AlertTriangle size={22} style={{ color: expiredCount > 0 ? '#ef4444' : '#f59e0b' }} />
                  </div>
                  <div>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Compliance Alert</p>
                    <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                      {expiredCount > 0 && `${expiredCount} expired document(s). `}
                      {expiringCount > 0 && `${expiringCount} expiring soon.`}
                    </p>
                  </div>
                </div>
              </Glass>
            )}

            {/* Header + upload button */}
            <Glass dark={isDark} style={{ ...stg(8), padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${c.staff}20, ${c.staff}08)`,
                    border: `1px solid ${c.staff}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <ShieldCheck size={18} style={{ color: c.staff }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>
                      Mandatory Checks & Qualifications
                    </h3>
                    <p style={{ fontSize: 12, color: dk.textFaint }}>
                      {qualDocs.length} qualification{qualDocs.length !== 1 ? 's' : ''} on file
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openUploadModal('qualification')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 4px 16px -4px ${c.staff}60`,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Plus size={15} /> Upload
                </button>
              </div>
            </Glass>

            {/* Document list */}
            {qualDocs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {qualDocs.map((d, i) => (
                  <DocCard key={d.id} d={d} index={i} />
                ))}
              </div>
            ) : (
              <Glass dark={isDark} style={{ ...stg(9), padding: '48px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                  background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
                  border: `1px solid ${c.staff}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Shield size={28} style={{ color: c.staff }} />
                </div>
                <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  No qualifications uploaded yet
                </p>
                <p style={{ color: dk.textFaint, fontSize: 13, marginBottom: 20 }}>
                  Upload NDIS screening, WWCC, first aid, and other compliance documents
                </p>
                <button
                  onClick={() => openUploadModal('qualification')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 14, border: 'none',
                    background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 6px 24px -6px ${c.staff}60`,
                  }}
                >
                  <Upload size={16} /> Upload Qualification
                </button>
              </Glass>
            )}
          </div>
        )}


        {/* ── DOCUMENTS TAB ── */}
        {tab === 'documents' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Glass dark={isDark} style={{ ...stg(7), padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10,
                    background: `linear-gradient(135deg, ${c.staff}20, ${c.staff}08)`,
                    border: `1px solid ${c.staff}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <FileCheck size={18} style={{ color: c.staff }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>General Documents</h3>
                    <p style={{ fontSize: 12, color: dk.textFaint }}>
                      {otherDocs.length} document{otherDocs.length !== 1 ? 's' : ''} on file
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => openUploadModal('general')}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '10px 18px', borderRadius: 12, border: 'none',
                    background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 4px 16px -4px ${c.staff}60`,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
                >
                  <Plus size={15} /> Upload
                </button>
              </div>
            </Glass>

            {otherDocs.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {otherDocs.map((d, i) => (
                  <DocCard key={d.id} d={d} index={i} />
                ))}
              </div>
            ) : (
              <Glass dark={isDark} style={{ ...stg(8), padding: '48px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                  background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
                  border: `1px solid ${c.staff}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={28} style={{ color: c.staff }} />
                </div>
                <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 15, marginBottom: 4 }}>
                  No general documents uploaded yet
                </p>
                <p style={{ color: dk.textFaint, fontSize: 13, marginBottom: 20 }}>
                  Upload contracts, resumes, training certificates, and references
                </p>
                <button
                  onClick={() => openUploadModal('general')}
                  style={{
                    display: 'inline-flex', alignItems: 'center', gap: 8,
                    padding: '12px 24px', borderRadius: 14, border: 'none',
                    background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    boxShadow: `0 6px 24px -6px ${c.staff}60`,
                  }}
                >
                  <Upload size={16} /> Upload Document
                </button>
              </Glass>
            )}
          </div>
        )}


        {/* ── SHIFTS TAB ── */}
        {tab === 'shifts' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <Glass dark={isDark} style={{ ...stg(7), padding: '14px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  background: `linear-gradient(135deg, ${c.staff}20, ${c.staff}08)`,
                  border: `1px solid ${c.staff}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={18} style={{ color: c.staff }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Shift History</h3>
                  <p style={{ fontSize: 12, color: dk.textFaint }}>
                    {shifts.length} shift{shifts.length !== 1 ? 's' : ''} assigned
                  </p>
                </div>
              </div>
            </Glass>

            {shifts.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {shifts.map((sh, i) => {
                  const shiftStatusColor = sh.status === 'completed' ? '#10b981'
                    : sh.status === 'in_progress' ? '#14b8a6' : '#3b82f6'
                  return (
                    <Link key={sh.id} to={`/admin/roster/shift/${sh.id}`} style={{ textDecoration: 'none' }}>
                      <Glass dark={isDark} hover glow={`${shiftStatusColor}15`} style={{ ...stg(i + 8), padding: '16px 20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                            <div style={{
                              width: 4, height: 44, borderRadius: 4,
                              background: `linear-gradient(to bottom, ${shiftStatusColor}, ${shiftStatusColor}60)`,
                              flexShrink: 0,
                            }} />
                            <div style={{
                              width: 42, height: 42, borderRadius: 12, flexShrink: 0,
                              background: `linear-gradient(135deg, ${shiftStatusColor}20, ${shiftStatusColor}08)`,
                              border: `1px solid ${shiftStatusColor}25`,
                              display: 'flex', alignItems: 'center', justifyContent: 'center',
                            }}>
                              <Calendar size={20} style={{ color: shiftStatusColor }} />
                            </div>
                            <div>
                              <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                                {sh.title || sh.service_type || 'Shift'}
                              </p>
                              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 2 }}>
                                {sh.participants
                                  ? `${sh.participants.first_name} ${sh.participants.last_name}`
                                  : 'Unassigned'
                                } · {new Date(sh.shift_date || sh.start_time).toLocaleDateString('en-AU')}
                              </p>
                            </div>
                          </div>
                          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                            <Badge
                              color={sh.status === 'completed' ? 'green' : sh.status === 'in_progress' ? 'teal' : 'blue'}
                              dark={isDark}
                            >
                              {formatType(sh.status || 'scheduled')}
                            </Badge>
                            <ChevronRight size={16} style={{ color: dk.textFaint }} />
                          </div>
                        </div>
                      </Glass>
                    </Link>
                  )
                })}
              </div>
            ) : (
              <Glass dark={isDark} style={{ ...stg(8), padding: '48px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                  background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
                  border: `1px solid ${c.staff}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={28} style={{ color: c.staff }} />
                </div>
                <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 15 }}>
                  No shifts assigned yet
                </p>
                <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>
                  Shifts will appear here once rostered
                </p>
              </Glass>
            )}
          </div>
        )}


        {/* ── AVAILABILITY TAB ── */}
        {tab === 'availability' && (() => {
          const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
          const SLOTS = [
            { key: 'morning', label: 'Morning', sub: '6am–12pm', icon: Sunrise, color: '#f59e0b' },
            { key: 'afternoon', label: 'Afternoon', sub: '12pm–6pm', icon: Sun, color: '#3b82f6' },
            { key: 'evening', label: 'Evening', sub: '6pm–10pm', icon: Sunset, color: '#8b5cf6' },
            { key: 'night', label: 'Night', sub: '10pm–6am', icon: Moon, color: '#6366f1' },
          ]
          const availMap = {}
          staffAvailability.forEach(r => { availMap[r.day_of_week] = r })
          const availDays = DAYS.filter(d => availMap[d])
          const totalSlots = staffAvailability.reduce(
            (sum, r) => sum + (r.morning ? 1 : 0) + (r.afternoon ? 1 : 0) + (r.evening ? 1 : 0) + (r.night ? 1 : 0),
            0
          )

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Availability summary stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 14 }}>
                <Glass dark={isDark} glow={`${c.staff}20`} style={{ ...stg(7), padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `linear-gradient(135deg, ${c.staff}, #10b981)`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 6px 20px -4px ${c.staff}50`,
                    }}>
                      <Calendar size={22} color="white" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: dk.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Days Available
                      </p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: dk.text, lineHeight: 1.1 }}>
                        <AnimNum value={availDays.length} />
                        <span style={{ fontSize: 14, fontWeight: 500, color: dk.textFaint }}> / 7</span>
                      </p>
                    </div>
                  </div>
                </Glass>

                <Glass dark={isDark} glow="rgba(245,158,11,0.15)" style={{ ...stg(8), padding: '20px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{
                      width: 48, height: 48, borderRadius: 14,
                      background: `linear-gradient(135deg, #f59e0b, ${c.staff})`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: '0 6px 20px -4px rgba(245,158,11,0.5)',
                    }}>
                      <Clock size={22} color="white" />
                    </div>
                    <div>
                      <p style={{ fontSize: 11, color: dk.textFaint, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        Time Slots
                      </p>
                      <p style={{ fontSize: 28, fontWeight: 800, color: dk.text, lineHeight: 1.1 }}>
                        <AnimNum value={totalSlots} />
                      </p>
                    </div>
                  </div>
                </Glass>
              </div>

              {/* Day-by-day availability */}
              {staffAvailability.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {DAYS.map((day, dayIdx) => {
                    const row = availMap[day]
                    if (!row) return (
                      <Glass
                        key={day}
                        dark={isDark}
                        style={{
                          ...stg(dayIdx + 9),
                          padding: '14px 20px',
                          opacity: loaded ? 0.6 : 0,
                        }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: isDark ? 'rgba(51,65,85,0.4)' : '#f1f5f9',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: dk.textFaint,
                          }}>
                            {DAY_LABELS[day]}
                          </div>
                          <p style={{ fontSize: 14, color: dk.textFaint, fontWeight: 500 }}>Not available</p>
                        </div>
                      </Glass>
                    )

                    const activeSlots = SLOTS.filter(sl => row[sl.key])
                    return (
                      <Glass
                        key={day}
                        dark={isDark}
                        hover
                        glow={`${c.staff}12`}
                        style={{ ...stg(dayIdx + 9), padding: '18px 20px' }}
                      >
                        <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: activeSlots.length > 0 ? 12 : 0 }}>
                          <div style={{
                            width: 42, height: 42, borderRadius: 12,
                            background: `linear-gradient(135deg, ${c.staff}, #10b981)`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            fontSize: 12, fontWeight: 800, color: 'white',
                            boxShadow: `0 4px 12px -4px ${c.staff}50`,
                          }}>
                            {DAY_LABELS[day]}
                          </div>
                          <div style={{ flex: 1 }}>
                            <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                              {day.charAt(0).toUpperCase() + day.slice(1)}
                            </p>
                            {row.notes && (
                              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 2 }}>{row.notes}</p>
                            )}
                          </div>
                          <div style={{
                            width: 28, height: 28, borderRadius: 8,
                            background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                            border: '1px solid rgba(16,185,129,0.2)',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <Check size={14} style={{ color: '#10b981' }} />
                          </div>
                        </div>

                        {activeSlots.length > 0 && (
                          <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {activeSlots.map(sl => (
                              <div key={sl.key} style={{
                                display: 'flex', alignItems: 'center', gap: 6,
                                padding: '6px 12px', borderRadius: 10,
                                background: isDark ? `${sl.color}15` : `${sl.color}10`,
                                border: `1px solid ${sl.color}25`,
                              }}>
                                <sl.icon size={13} style={{ color: sl.color }} />
                                <span style={{ fontSize: 12, fontWeight: 700, color: sl.color }}>
                                  {sl.label}
                                </span>
                                <span style={{ fontSize: 11, fontWeight: 500, color: `${sl.color}90` }}>
                                  {sl.sub}
                                </span>
                              </div>
                            ))}
                          </div>
                        )}
                      </Glass>
                    )
                  })}
                </div>
              ) : (
                <Glass dark={isDark} style={{ ...stg(9), padding: '48px 24px', textAlign: 'center' }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 18, margin: '0 auto 16px',
                    background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
                    border: `1px solid ${c.staff}20`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Clock size={28} style={{ color: c.staff }} />
                  </div>
                  <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 15 }}>
                    No availability set
                  </p>
                  <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>
                    This staff member hasn't configured their availability yet
                  </p>
                </Glass>
              )}
            </div>
          )
        })()}

      </div>


      {/* ══════════════════════════════════════════
          UPLOAD MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showUpload}
        onClose={() => setShowUpload(false)}
        title={uploadType === 'qualification' ? 'Upload Qualification Document' : 'Upload Document'}
        wide
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Info banner */}
          <div style={{
            padding: '14px 18px', borderRadius: 14,
            background: `linear-gradient(135deg, ${c.staff}10, ${c.staffHover}05)`,
            border: `1px solid ${c.staff}25`,
            fontSize: 13, fontWeight: 600, color: c.staff,
            display: 'flex', alignItems: 'center', gap: 10,
          }}>
            <AlertCircle size={16} />
            {uploadType === 'qualification'
              ? 'Upload mandatory compliance documents. Set expiry dates to get automatic alerts.'
              : 'Upload general documents such as contracts, training certificates, or references.'
            }
          </div>

          {/* Form grid */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
            gap: 14,
          }}>
            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft, marginBottom: 6 }}>
                Document Type *
              </p>
              <select
                value={uploadForm.document_type}
                onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                  borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                }}
              >
                <option value="">Select type...</option>
                {(uploadType === 'qualification' ? QUAL_DOC_TYPES : GENERAL_DOC_TYPES).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {uploadForm.document_type === 'other' && (
                <input
                  placeholder="Specify type..."
                  value={uploadForm.custom_type || ''}
                  onChange={e => setUploadForm({ ...uploadForm, custom_type: e.target.value })}
                  style={{
                    width: '100%', marginTop: 8, padding: '12px 14px',
                    background: dk.inputBg, border: `2px solid #f97316`,
                    borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                  }}
                />
              )}
            </div>

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft, marginBottom: 6 }}>
                Document Name
              </p>
              <input
                placeholder="e.g. First Aid - St John"
                value={uploadForm.name}
                onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                  borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                }}
              />
            </div>

            {uploadType === 'qualification' && (
              <div>
                <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft, marginBottom: 6 }}>
                  Document / Certificate Number
                </p>
                <input
                  placeholder="e.g. NSW-12345"
                  value={uploadForm.document_number}
                  onChange={e => setUploadForm({ ...uploadForm, document_number: e.target.value })}
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                    borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                  }}
                />
              </div>
            )}

            <div>
              <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft, marginBottom: 6 }}>
                Expiry Date
              </p>
              <input
                type="date"
                value={uploadForm.expiry_date}
                onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                style={{
                  width: '100%', padding: '12px 14px',
                  background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                  borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                }}
              />
            </div>
          </div>

          {/* File picker */}
          <div>
            <p style={{ fontSize: 12, fontWeight: 700, color: dk.textSoft, marginBottom: 6 }}>
              File *
            </p>
            <label style={{
              display: 'block', padding: '28px 20px', borderRadius: 16,
              border: `2px dashed ${dk.inputBorder}`,
              textAlign: 'center', cursor: 'pointer',
              transition: 'all .2s',
              background: dk.cardBg,
            }}
              onMouseEnter={e => {
                e.currentTarget.style.borderColor = c.staff
                e.currentTarget.style.background = `${c.staff}08`
              }}
              onMouseLeave={e => {
                e.currentTarget.style.borderColor = dk.inputBorder
                e.currentTarget.style.background = dk.cardBg
              }}
            >
              <input
                type="file"
                style={{ display: 'none' }}
                onChange={e => setSelectedFile(e.target.files[0])}
                accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
              />
              {selectedFile ? (
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10 }}>
                  <FileText size={22} style={{ color: c.staff }} />
                  <span style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>
                    {selectedFile.name}
                  </span>
                  <span style={{ fontSize: 12, color: dk.textFaint }}>
                    ({(selectedFile.size / 1024).toFixed(0)} KB)
                  </span>
                </div>
              ) : (
                <div>
                  <Upload size={32} style={{ color: dk.textFaint, margin: '0 auto 8px' }} />
                  <p style={{ fontSize: 14, fontWeight: 600, color: dk.textMuted }}>
                    Click to select file
                  </p>
                  <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>
                    PDF, JPG, PNG, DOC up to 10MB
                  </p>
                </div>
              )}
            </label>
          </div>

          {/* Action buttons */}
          <div style={{ display: 'flex', gap: 12, paddingTop: 4 }}>
            <button
              onClick={() => setShowUpload(false)}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14,
                background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                border: `1px solid ${dk.inputBorder}`,
                color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}
            >
              Cancel
            </button>
            <button
              onClick={handleUpload}
              disabled={uploading}
              style={{
                flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 6px 24px -6px ${c.staff}60`,
                opacity: uploading ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}
            >
              {uploading
                ? <><Loader2 size={16} className="animate-spin" /> Uploading...</>
                : <><Upload size={16} /> Upload</>
              }
            </button>
          </div>
        </div>
      </Modal>


      {/* ══════════════════════════════════════════
          DOCUMENT DETAIL MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={!!viewDoc}
        onClose={() => setViewDoc(null)}
        title="Document Details"
        wide
      >
        {viewDoc && (() => {
          const status = docStatus(viewDoc)
          const statusColors = {
            green: '#10b981', amber: '#f59e0b',
            red: '#ef4444', blue: '#3b82f6',
          }
          const sc = statusColors[status] || '#6b7280'

          return (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

              {/* Document header banner */}
              <div style={{
                padding: '20px', borderRadius: 16,
                background: `linear-gradient(135deg, ${sc}12, ${sc}04)`,
                border: `1px solid ${sc}25`,
                display: 'flex', alignItems: 'center', gap: 16,
              }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 14,
                  background: `linear-gradient(135deg, ${sc}20, ${sc}08)`,
                  border: `1px solid ${sc}30`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  flexShrink: 0,
                }}>
                  {QUAL_TYPE_KEYS.includes(viewDoc.document_type)
                    ? <Shield size={26} style={{ color: sc }} />
                    : <FileText size={26} style={{ color: sc }} />
                  }
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>
                    {viewDoc.name || formatType(viewDoc.document_type)}
                  </p>
                  <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                    {viewDoc.status === 'pending'
                      ? 'Uploaded by staff member · Awaiting review'
                      : QUAL_TYPE_KEYS.includes(viewDoc.document_type)
                        ? 'Qualification Document'
                        : 'General Document'
                    }
                  </p>
                </div>
                <Badge color={status} dark={isDark}>{docLabel(viewDoc)}</Badge>
              </div>

              {/* Pending review notice */}
              {viewDoc.status === 'pending' && (
                <div style={{
                  padding: '12px 18px', borderRadius: 14,
                  background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                  border: '1px solid rgba(59,130,246,0.2)',
                  fontSize: 13, fontWeight: 600, color: '#3b82f6',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <Clock size={15} />
                  This document was uploaded by the staff member and needs your review.
                </div>
              )}

              {/* Document fields */}
              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
                gap: 12,
              }}>
                <InfoField label="Document Type" value={formatType(viewDoc.document_type)} icon={FileText} />
                <InfoField label="Status" value={docLabel(viewDoc)} icon={Activity} />
                {viewDoc.document_number && (
                  <InfoField label="Document / Certificate Number" value={viewDoc.document_number} icon={Hash} />
                )}
                <InfoField
                  label="Expiry Date"
                  value={viewDoc.expiry_date
                    ? new Date(viewDoc.expiry_date).toLocaleDateString('en-AU')
                    : 'No expiry set'
                  }
                  icon={Calendar}
                />
                {viewDoc.file_name && (
                  <InfoField label="File Name" value={viewDoc.file_name} icon={FileText} />
                )}
                <InfoField
                  label="Uploaded"
                  value={viewDoc.uploaded_at
                    ? new Date(viewDoc.uploaded_at).toLocaleDateString('en-AU', {
                        day: 'numeric', month: 'short', year: 'numeric',
                      })
                    : '—'
                  }
                  icon={Calendar}
                />
              </div>

              {/* Expired / expiring alerts */}
              {status === 'red' && viewDoc.status !== 'pending' && viewDoc.status !== 'rejected' && (
                <div style={{
                  padding: '12px 18px', borderRadius: 14,
                  background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                  border: '1px solid rgba(239,68,68,0.2)',
                  fontSize: 13, fontWeight: 600, color: '#ef4444',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertTriangle size={15} />
                  This document has expired. Please upload a renewed version to maintain compliance.
                </div>
              )}
              {status === 'amber' && (
                <div style={{
                  padding: '12px 18px', borderRadius: 14,
                  background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb',
                  border: '1px solid rgba(245,158,11,0.2)',
                  fontSize: 13, fontWeight: 600, color: '#f59e0b',
                  display: 'flex', alignItems: 'center', gap: 10,
                }}>
                  <AlertTriangle size={15} />
                  This document is expiring soon. Arrange renewal before the expiry date.
                </div>
              )}

              {/* Action buttons */}
              <div style={{ display: 'flex', gap: 10, paddingTop: 4, flexWrap: 'wrap' }}>
                {viewDoc.status === 'pending' && (
                  <>
                    <button
                      onClick={async () => { await handleDocStatus(viewDoc.id, 'valid'); setViewDoc(null) }}
                      style={{
                        flex: 1, padding: '14px 0', borderRadius: 14, border: 'none',
                        background: 'linear-gradient(135deg, #10b981, #059669)',
                        color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        boxShadow: '0 6px 24px -6px rgba(16,185,129,0.5)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                      }}
                    >
                      <CheckCircle size={16} /> Approve
                    </button>
                    <button
                      onClick={async () => { await handleDocStatus(viewDoc.id, 'rejected'); setViewDoc(null) }}
                      style={{
                        padding: '14px 24px', borderRadius: 14,
                        background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                        border: '1px solid rgba(239,68,68,0.2)',
                        color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                        display: 'flex', alignItems: 'center', gap: 8,
                      }}
                    >
                      <XCircle size={16} /> Reject
                    </button>
                  </>
                )}

                {viewDoc.file_url ? (
                  <a
                    href={viewDoc.file_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{
                      flex: viewDoc.status === 'pending' ? undefined : 1,
                      padding: '14px 24px', borderRadius: 14, border: 'none',
                      background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                      color: 'white', fontSize: 14, fontWeight: 700, textDecoration: 'none',
                      boxShadow: `0 6px 24px -6px ${c.staff}60`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    }}
                  >
                    <ExternalLink size={16} /> View / Download
                  </a>
                ) : (
                  <div style={{
                    flex: viewDoc.status === 'pending' ? undefined : 1,
                    padding: '14px 24px', borderRadius: 14,
                    background: isDark ? 'rgba(51,65,85,0.3)' : '#f1f5f9',
                    color: dk.textFaint, fontSize: 14, fontWeight: 700,
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    cursor: 'not-allowed',
                  }}>
                    <ExternalLink size={16} /> No File Attached
                  </div>
                )}

                <button
                  onClick={async () => { await handleDeleteDoc(viewDoc.id); setViewDoc(null) }}
                  style={{
                    padding: '14px 24px', borderRadius: 14,
                    background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                    border: '1px solid rgba(239,68,68,0.2)',
                    color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    display: 'flex', alignItems: 'center', gap: 8,
                  }}
                >
                  <Trash2 size={16} /> Delete
                </button>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}