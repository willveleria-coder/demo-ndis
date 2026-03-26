import { useState, useEffect, useRef, useMemo } from 'react'
import { Link } from 'react-router-dom'
import {
  Search, Plus, UserCog, Check, AlertCircle, XCircle, Loader2, Copy, Pencil,
  Trash2, Shield, Users, Star, ChevronRight, ChevronDown, Filter, LayoutGrid,
  List, Phone, Mail, Calendar, Briefcase, Activity, Hash, User, Award,
  ShieldCheck, TrendingUp, AlertTriangle, BadgeCheck, FileCheck, Clock,
  Download, BarChart3, Sparkles, Eye, MapPin, Zap, RefreshCw, Building
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, Tooltip, CartesianGrid } from 'recharts'
import { getStaffMembers } from '../services/staffService'
import { createStaffInvite } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM COMPONENTS
   ───────────────────────────────────────────── */

function Glass({ children, className = '', dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      className={className}
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
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
    >{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div style={{
      position: 'absolute', width: size, height: size,
      top, left, right, bottom,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      opacity: 0.12, borderRadius: '50%',
      animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
      pointerEvents: 'none', zIndex: 0,
    }} />
  )
}

function AnimNum({ value, duration = 900 }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) {
      const elapsed = now - start
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(num * eased))
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
    blue:   dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
                 : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' }
                 : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    teal:   dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' }
                 : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' }
                 : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  }
  const p = palettes[color] || palettes.gray
  return (
    <span style={{
      display: 'inline-flex', alignItems: 'center', gap: 4,
      padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
      background: p.bg, color: p.text, border: `1px solid ${p.border}`,
      letterSpacing: '0.01em', whiteSpace: 'nowrap',
    }}>{children}</span>
  )
}


/* ─────────────────────────────────────────────
   COMPLIANCE RING
   ───────────────────────────────────────────── */

function ComplianceRing({ score, size = 56, dark = false }) {
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ
  const col = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle cx={size/2} cy={size/2} r={r} fill="none"
          stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'} strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={col}
          strokeWidth="6" strokeLinecap="round"
          strokeDasharray={circ} strokeDashoffset={off}
          style={{ transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 4px ${col}40)` }} />
      </svg>
      <div style={{
        position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        <span style={{ fontSize: size * 0.22, fontWeight: 900, color: col }}>{score}%</span>
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatType(type) {
  if (!type) return '—'
  return type.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase())
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Staff() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { user } = useAuth()

  const [search, setSearch] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [allStaff, setAllStaff] = useState([])
  const [inviteCode, setInviteCode] = useState(null)
  const [editStaff, setEditStaff] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [viewMode, setViewMode] = useState('grid')
  const [statusFilter, setStatusFilter] = useState('all')
  const [complianceFilter, setComplianceFilter] = useState('all')
  const [selectedStaff, setSelectedStaff] = useState(new Set())
  const [newStaff, setNewStaff] = useState({
    firstName: '', lastName: '', phone: '', email: '', position: '', employment_type: '',
  })

  /* ── Dark mode color system ── */
  const dk = {
    text:        isDark ? '#e2e8f0' : '#1f2937',
    textSoft:    isDark ? '#cbd5e1' : '#374151',
    textMuted:   isDark ? '#94a3b8' : '#6b7280',
    textFaint:   isDark ? '#64748b' : '#9ca3af',
    inputBg:     isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider:     isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg:    isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2:   isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  /* ── Stagger helper ── */
  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  /* ── Chart tooltip ── */
  const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)', borderRadius: 16,
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`,
        padding: '14px 18px',
        boxShadow: isDark ? '0 16px 40px -8px rgba(0,0,0,0.5)' : '0 16px 40px -8px rgba(0,0,0,0.12)',
      }}>
        <p style={{ fontWeight: 800, fontSize: 13, color: dk.text, marginBottom: 8,
          paddingBottom: 6, borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)'}` }}>
          {label}
        </p>
        {payload.map((p, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 16, marginTop: i > 0 ? 6 : 0 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 8, height: 8, borderRadius: 3, background: p.color }} />
              <span style={{ fontSize: 12, color: dk.textMuted }}>{p.name}</span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>{p.value}</span>
          </div>
        ))}
      </div>
    )
  }

  /* ── Debounced search ── */
  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search), 200)
    return () => clearTimeout(t)
  }, [search])


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */
  useEffect(() => { loadStaff() }, [])
  useEffect(() => { if (!loading) requestAnimationFrame(() => setLoaded(true)) }, [loading])

  async function loadStaff() {
    try {
      const data = await getStaffMembers()
      setAllStaff(data.filter(s => s.role !== 'admin'))
    } catch (err) {
      console.error('Failed to load staff:', err)
    } finally {
      setLoading(false)
    }
  }

  /* ── Filtering ── */
  const filtered = useMemo(() => {
    return allStaff.filter(s => {
      const name = `${s.first_name} ${s.last_name}`.toLowerCase()
      if (!name.includes(debouncedSearch.toLowerCase())) return false
      if (statusFilter !== 'all' && s.status !== statusFilter) return false
      if (complianceFilter === 'expiring') {
        return s.documents && s.documents.some(d => d.status === 'expiring_soon')
      }
      if (complianceFilter === 'expired') {
        return s.documents && s.documents.some(d => d.status === 'expired')
      }
      if (complianceFilter === 'compliant') {
        return !s.documents || s.documents.every(d => d.status !== 'expired' && d.status !== 'expiring_soon')
      }
      return true
    })
  }, [allStaff, debouncedSearch, statusFilter, complianceFilter])

  /* ── Computed stats ── */
  const activeStaff = allStaff.filter(s => s.status === 'active')
  const pendingStaff = allStaff.filter(s => s.status === 'pending')
  const inactiveStaff = allStaff.filter(s => s.status === 'inactive')
  const expDocs = allStaff.reduce((a, s) => {
    if (!s.documents) return a
    return a + s.documents.filter(d => d.status === 'expiring_soon').length
  }, 0)
  const expiredDocs = allStaff.reduce((a, s) => {
    if (!s.documents) return a
    return a + s.documents.filter(d => d.status === 'expired').length
  }, 0)
  const complianceScore = allStaff.length > 0
    ? Math.round(((allStaff.length - allStaff.filter(s => s.documents?.some(d => d.status === 'expired')).length) / allStaff.length) * 100)
    : 100

  /* ── Employment type breakdown ── */
  const empBreakdown = useMemo(() => {
    const map = {}
    allStaff.forEach(s => {
      const t = formatType(s.employment_type) || 'Not Set'
      map[t] = (map[t] || 0) + 1
    })
    return Object.entries(map).map(([name, value]) => ({ name, value }))
  }, [allStaff])

  /* ── Status breakdown for pie ── */
  const statusBreakdown = useMemo(() => [
    { name: 'Active', value: activeStaff.length, color: '#10b981' },
    { name: 'Pending', value: pendingStaff.length, color: '#f59e0b' },
    { name: 'Inactive', value: inactiveStaff.length, color: '#94a3b8' },
  ].filter(s => s.value > 0), [activeStaff, pendingStaff, inactiveStaff])

  /* ── Bulk select ── */
  const toggleSelect = (id) => {
    setSelectedStaff(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }
  const selectAll = () => {
    if (selectedStaff.size === filtered.length) {
      setSelectedStaff(new Set())
    } else {
      setSelectedStaff(new Set(filtered.map(s => s.id)))
    }
  }

  /* ── Export CSV ── */
  const exportCSV = () => {
    const rows = [['First Name', 'Last Name', 'Email', 'Phone', 'Position', 'Status', 'Employment Type']]
    const targets = selectedStaff.size > 0
      ? allStaff.filter(s => selectedStaff.has(s.id))
      : filtered
    targets.forEach(s => {
      rows.push([s.first_name, s.last_name, s.email || '', s.phone || '', s.position || '', s.status || '', s.employment_type || ''])
    })
    const csv = rows.map(r => r.map(c => `"${(c || '').replace(/"/g, '""')}"`).join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'staff-export.csv'; a.click()
    URL.revokeObjectURL(url)
  }

  const handleAddStaff = async () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
      alert('Please fill in First Name, Last Name, and Email')
      return
    }
    setSaving(true)
    try {
      const result = await createStaffInvite({
        orgId: user.org_id,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone || null,
        position: newStaff.position || 'Support Worker',
        employmentType: newStaff.employment_type || 'casual',
      })
      setInviteCode(result.inviteCode)
      await loadStaff()
    } catch (err) {
      console.error('Failed to create staff:', err)
      alert('Failed to add staff: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseModal = () => {
    setShowAdd(false)
    setInviteCode(null)
    setNewStaff({ firstName: '', lastName: '', phone: '', email: '', position: '', employment_type: '' })
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    alert('Code copied!')
  }

  const openEdit = (e, staff) => {
    e.preventDefault()
    e.stopPropagation()
    setEditStaff({
      id: staff.id,
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      position: staff.position || '',
      employment_type: staff.employment_type || 'casual',
      status: staff.status || 'active',
    })
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!editStaff.first_name || !editStaff.last_name) {
      alert('First and last name are required')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          first_name: editStaff.first_name,
          last_name: editStaff.last_name,
          email: editStaff.email,
          phone: editStaff.phone,
          position: editStaff.position,
          employment_type: editStaff.employment_type,
          status: editStaff.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editStaff.id)
      if (error) throw error
      await loadStaff()
      setShowEdit(false)
      setEditStaff(null)
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const openDelete = (e, staff) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(staff)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase.from('staff').delete().eq('id', deleteTarget.id)
      if (error) throw error
      await loadStaff()
      setShowDelete(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }


  /* ─────────────────────────────────────────────
     LOADING STATE
     ───────────────────────────────────────────── */

  if (loading) {
    return (
      <div style={{
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        justifyContent: 'center', height: '60vh', gap: 16,
      }}>
        <div style={{ position: 'relative' }}>
          <div style={{
            width: 72, height: 72, borderRadius: 22,
            background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${c.staff}40`,
          }}>
            <Users size={32} color="white" />
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            opacity: 0.3,
          }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>
          Loading staff...
        </p>
      </div>
    )
  }


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      {/* Keyframes */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* Background orbs */}
      <Orb color={c.staff} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={stg(0)}>
          <div style={{
            borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}>
            {/* Decorative circles */}
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
              top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite',
            }} />
            {/* Dot grid */}
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '24px 24px', opacity: 0.5,
            }} />
            {/* Floating dots */}
            {[
              { top: '15%', right: '20%', s: 4, d: 0 },
              { top: '60%', right: '10%', s: 3, d: 1.5 },
              { bottom: '25%', left: '35%', s: 5, d: 3 },
              { top: '35%', left: '12%', s: 2, d: 2 },
            ].map((dot, i) => (
              <div key={i} style={{
                position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)',
                width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right,
                bottom: dot.bottom, left: dot.left,
                animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s`,
              }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              {/* Badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                  <Users size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Team Management</span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                  <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#34d399', animation: 'pulse-dot 2s ease-in-out infinite' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>{activeStaff.length} On Roster</span>
                </div>
                {(expDocs > 0 || expiredDocs > 0) && (
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '5px 12px', borderRadius: 999,
                    background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)',
                  }}>
                    <AlertCircle size={13} style={{ color: 'rgba(255,255,255,0.9)' }} />
                    <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.9)' }}>{expDocs + expiredDocs} doc alerts</span>
                  </div>
                )}
              </div>

              {/* Title + action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>
                    Staff Directory
                  </h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                    Manage your team, track compliance, and monitor qualifications
                  </p>
                </div>
                <button
                  onClick={() => setShowAdd(true)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 22px', borderRadius: 16, border: 'none',
                    background: 'rgba(255,255,255,0.18)', backdropFilter: 'blur(8px)',
                    color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                    transition: 'all .2s',
                  }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.28)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.18)'}
                >
                  <Plus size={18} /> Add Staff
                </button>
              </div>

              {/* Hero stat pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Users, text: `${allStaff.length} total` },
                  { icon: Check, text: `${activeStaff.length} active`, bg: 'rgba(16,185,129,0.25)' },
                  { icon: Clock, text: `${pendingStaff.length} pending` },
                  { icon: AlertTriangle, text: `${expDocs} expiring docs`, bg: expDocs > 0 ? 'rgba(245,158,11,0.35)' : undefined },
                  { icon: XCircle, text: `${expiredDocs} expired docs`, bg: expiredDocs > 0 ? 'rgba(239,68,68,0.35)' : undefined },
                  { icon: ShieldCheck, text: `${complianceScore}% compliant` },
                ].map((pill, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 12,
                    background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                  }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ══════════════════════════════════════════
            STAT CARDS
            ══════════════════════════════════════════ */}
        <div style={{
          display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(155px, 1fr))',
          gap: 14, ...stg(1),
        }}>
          {[
            { icon: UserCog, label: 'Total Staff', value: allStaff.length,
              grad: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}35` },
            { icon: Check, label: 'Active', value: activeStaff.length,
              grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.2)' },
            { icon: Clock, label: 'Pending', value: pendingStaff.length,
              grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)', glow: 'rgba(245,158,11,0.2)' },
            { icon: AlertTriangle, label: 'Expiring Docs', value: expDocs,
              grad: 'linear-gradient(135deg, #f97316, #fb923c)', glow: 'rgba(249,115,22,0.2)' },
            { icon: XCircle, label: 'Expired Docs', value: expiredDocs,
              grad: 'linear-gradient(135deg, #ef4444, #f87171)', glow: 'rgba(239,68,68,0.2)' },
            { icon: ShieldCheck, label: 'Compliance', value: complianceScore, suffix: '%',
              grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.2)' },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12, background: card.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px -4px ${card.glow}`, marginBottom: 12,
              }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: dk.text, lineHeight: 1 }} className="count-up">
                <AnimNum value={card.value} />{card.suffix || ''}
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </p>
            </Glass>
          ))}
        </div>


        {/* ══════════════════════════════════════════
            COMPLIANCE ALERT BANNER
            ══════════════════════════════════════════ */}
        {(expDocs > 0 || expiredDocs > 0) && (
          <Glass dark={isDark}
            glow={expiredDocs > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}
            style={{ ...stg(2), padding: '16px 22px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: expiredDocs > 0
                  ? 'linear-gradient(135deg, #ef4444, #f87171)'
                  : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: expiredDocs > 0
                  ? '0 6px 20px -4px rgba(239,68,68,0.4)'
                  : '0 6px 20px -4px rgba(245,158,11,0.4)',
              }}>
                <Shield size={22} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>Compliance Alert</p>
                <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                  {expiredDocs > 0 && `${expiredDocs} expired document${expiredDocs > 1 ? 's' : ''}. `}
                  {expDocs > 0 && `${expDocs} document${expDocs > 1 ? 's' : ''} expiring soon. `}
                  Review staff profiles to maintain compliance.
                </p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            SEARCH + FILTER + ACTIONS BAR
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} style={{ ...stg(3), padding: '14px 18px' }}>
          <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>

            {/* Search */}
            <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
              <Search size={16} style={{ position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
              <input
                value={search}
                onChange={e => setSearch(e.target.value)}
                placeholder="Search staff..."
                style={{
                  width: '100%', padding: '11px 14px 11px 40px',
                  background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                  borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                  transition: 'border-color .2s',
                }}
                onFocus={e => e.target.style.borderColor = c.staff}
                onBlur={e => e.target.style.borderColor = dk.inputBorder}
              />
            </div>

            {/* Status filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value)}
                style={{
                  padding: '11px 36px 11px 14px', background: dk.inputBg,
                  border: `1px solid ${dk.inputBorder}`, borderRadius: 12,
                  fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                  appearance: 'none', cursor: 'pointer', minWidth: 120,
                }}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="pending">Pending</option>
                <option value="inactive">Inactive</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>

            {/* Compliance filter */}
            <div style={{ position: 'relative' }}>
              <select
                value={complianceFilter}
                onChange={e => setComplianceFilter(e.target.value)}
                style={{
                  padding: '11px 36px 11px 14px', background: dk.inputBg,
                  border: `1px solid ${dk.inputBorder}`, borderRadius: 12,
                  fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                  appearance: 'none', cursor: 'pointer', minWidth: 140,
                }}
              >
                <option value="all">All Compliance</option>
                <option value="compliant">Compliant</option>
                <option value="expiring">Expiring</option>
                <option value="expired">Expired</option>
              </select>
              <ChevronDown size={14} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint, pointerEvents: 'none' }} />
            </div>

            {/* View toggle */}
            <div style={{ display: 'flex', gap: 4, background: dk.subtleBg, borderRadius: 10, padding: 3 }}>
              {[
                { key: 'grid', icon: LayoutGrid },
                { key: 'list', icon: List },
              ].map(v => (
                <button key={v.key} onClick={() => setViewMode(v.key)}
                  style={{
                    width: 36, height: 36, borderRadius: 8, border: 'none',
                    background: viewMode === v.key ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                    color: viewMode === v.key ? 'white' : dk.textFaint,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', transition: 'all .2s',
                  }}
                >
                  <v.icon size={16} />
                </button>
              ))}
            </div>

            {/* Export + count */}
            <button onClick={exportCSV} style={{
              display: 'flex', alignItems: 'center', gap: 6,
              padding: '10px 16px', borderRadius: 12, border: 'none',
              background: dk.subtleBg2, color: dk.textMuted, fontSize: 13,
              fontWeight: 600, cursor: 'pointer', transition: 'all .2s',
            }}
              onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
              onMouseLeave={e => e.currentTarget.style.background = dk.subtleBg2}
            >
              <Download size={14} /> Export{selectedStaff.size > 0 ? ` (${selectedStaff.size})` : ''}
            </button>

            <span style={{
              fontSize: 12, fontWeight: 600, color: dk.textFaint,
              padding: '6px 12px', borderRadius: 10, background: dk.subtleBg,
            }}>
              {filtered.length} result{filtered.length !== 1 ? 's' : ''}
            </span>
          </div>

          {/* Bulk select bar */}
          {selectedStaff.size > 0 && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12, marginTop: 12,
              padding: '10px 16px', borderRadius: 12,
              background: `linear-gradient(135deg, ${c.staff}12, ${c.staffHover}08)`,
              border: `1px solid ${c.staff}30`,
            }}>
              <button onClick={selectAll} style={{
                fontSize: 12, fontWeight: 700, color: c.staff,
                background: 'none', border: 'none', cursor: 'pointer',
              }}>
                {selectedStaff.size === filtered.length ? 'Deselect All' : 'Select All'}
              </button>
              <span style={{ fontSize: 12, fontWeight: 600, color: dk.textMuted }}>
                {selectedStaff.size} selected
              </span>
            </div>
          )}
        </Glass>


        {/* ══════════════════════════════════════════
            STAFF GRID / LIST
            ══════════════════════════════════════════ */}
        {filtered.length > 0 ? (
          <div style={{
            display: viewMode === 'grid' ? 'grid' : 'flex',
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(300px, 1fr))' : undefined,
            flexDirection: viewMode === 'list' ? 'column' : undefined,
            gap: viewMode === 'grid' ? 14 : 10,
            ...stg(4),
          }}>
            {filtered.map((s, i) => {
              const hasExpiring = s.documents && s.documents.filter(d => d.status === 'expiring_soon').length > 0
              const hasExpired = s.documents && s.documents.filter(d => d.status === 'expired').length > 0
              const statusColor = s.status === 'active' ? '#10b981' : s.status === 'pending' ? '#f59e0b' : '#94a3b8'
              const isSelected = selectedStaff.has(s.id)

              return (
                <Link key={s.id} to={`/admin/staff/${s.id}`} style={{ textDecoration: 'none' }}>
                  <Glass
                    dark={isDark} hover
                    glow={hasExpired ? 'rgba(239,68,68,0.12)' : hasExpiring ? 'rgba(245,158,11,0.12)' : `${c.staff}10`}
                    style={{
                      padding: viewMode === 'grid' ? '20px' : '16px 20px',
                      position: 'relative', overflow: 'hidden',
                      borderColor: isSelected ? `${c.staff}60` : undefined,
                    }}
                  >
                    {/* Left accent bar */}
                    <div style={{
                      position: 'absolute', left: 0, top: 0, bottom: 0, width: 4, borderRadius: '0 4px 4px 0',
                      background: `linear-gradient(to bottom, ${statusColor}, ${statusColor}60)`,
                    }} />

                    <div style={{ display: 'flex', alignItems: 'center', gap: 14, paddingLeft: 8 }}>
                      {/* Select checkbox */}
                      <div
                        onClick={e => { e.preventDefault(); e.stopPropagation(); toggleSelect(s.id) }}
                        style={{
                          width: 22, height: 22, borderRadius: 6, flexShrink: 0, cursor: 'pointer',
                          border: `2px solid ${isSelected ? c.staff : (isDark ? '#475569' : '#d1d5db')}`,
                          background: isSelected ? c.staff : 'transparent',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          transition: 'all .2s',
                        }}
                      >
                        {isSelected && (
                          <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                            <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        )}
                      </div>

                      {/* Avatar */}
                      <div style={{
                        width: 48, height: 48, borderRadius: 14,
                        background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 15, fontWeight: 800,
                        boxShadow: `0 4px 16px -4px ${c.staff}40`,
                        flexShrink: 0,
                      }}>
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                          {s.first_name} {s.last_name}
                        </p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                          {s.position || 'Support Worker'}
                          {s.employment_type && ` · ${formatType(s.employment_type)}`}
                        </p>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <Badge color={s.status === 'active' ? 'green' : s.status === 'pending' ? 'amber' : 'gray'} dark={isDark}>
                            {s.status === 'active' && (
                              <span style={{
                                width: 6, height: 6, borderRadius: '50%', background: '#34d399',
                                display: 'inline-block', marginRight: 3,
                                animation: 'pulse-dot 2s ease-in-out infinite',
                              }} />
                            )}
                            {formatType(s.status)}
                          </Badge>
                          {hasExpired && (
                            <Badge color="red" dark={isDark}>
                              {s.documents.filter(d => d.status === 'expired').length} expired
                            </Badge>
                          )}
                          {hasExpiring && !hasExpired && (
                            <Badge color="amber" dark={isDark}>
                              {s.documents.filter(d => d.status === 'expiring_soon').length} expiring
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Actions */}
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                        <button
                          onClick={e => openEdit(e, s)}
                          style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            background: isDark ? 'rgba(20,184,166,0.1)' : '#f0fdfa',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all .2s', color: c.staff,
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <Pencil size={14} />
                        </button>
                        <button
                          onClick={e => openDelete(e, s)}
                          style={{
                            width: 34, height: 34, borderRadius: 10, border: 'none',
                            background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', transition: 'all .2s', color: '#ef4444',
                          }}
                          onMouseEnter={e => { e.currentTarget.style.transform = 'scale(1.1)' }}
                          onMouseLeave={e => { e.currentTarget.style.transform = 'scale(1)' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>

                      <ChevronRight size={18} style={{ color: dk.textFaint, flexShrink: 0 }} />
                    </div>
                  </Glass>
                </Link>
              )
            })}
          </div>
        ) : (
          <Glass dark={isDark} style={{ ...stg(4), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{
              width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
              background: `linear-gradient(135deg, ${c.staff}15, ${c.staff}05)`,
              border: `1px solid ${c.staff}20`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Users size={32} style={{ color: c.staff }} />
            </div>
            <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>
              {search || statusFilter !== 'all' || complianceFilter !== 'all'
                ? 'No staff found matching your filters'
                : 'No staff yet. Add your first team member!'
              }
            </p>
            <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>
              {search ? 'Try adjusting your search or filters' : 'Click "Add Staff" to get started'}
            </p>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            INSIGHTS SECTION
            ══════════════════════════════════════════ */}
        {allStaff.length > 0 && (
          <div style={{
            display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
            gap: 16, ...stg(5),
          }}>

            {/* Staff Status Pie */}
            <Glass dark={isDark} glow={`${c.staff}10`} style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Activity size={18} style={{ color: c.staff }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Status Breakdown</h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 20 }}>
                <ResponsiveContainer width={120} height={120}>
                  <PieChart>
                    <Pie data={statusBreakdown} dataKey="value" cx="50%" cy="50%"
                      innerRadius={35} outerRadius={55} paddingAngle={3}
                      stroke="none"
                    >
                      {statusBreakdown.map((entry, i) => (
                        <Cell key={i} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CT />} />
                  </PieChart>
                </ResponsiveContainer>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {statusBreakdown.map((s, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div style={{ width: 10, height: 10, borderRadius: 3, background: s.color }} />
                      <span style={{ fontSize: 12, color: dk.textMuted }}>{s.name}</span>
                      <span style={{ fontSize: 13, fontWeight: 800, color: dk.text, marginLeft: 'auto' }}>{s.value}</span>
                    </div>
                  ))}
                </div>
              </div>
            </Glass>

            {/* Employment Type Bar Chart */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
                <Briefcase size={18} style={{ color: '#3b82f6' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Employment Types</h3>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                {empBreakdown.map((item, i) => {
                  const maxVal = Math.max(...empBreakdown.map(e => e.value))
                  const pct = Math.round((item.value / maxVal) * 100)
                  const colors = [c.staff, '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
                  const col = colors[i % colors.length]
                  return (
                    <div key={item.name}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>{item.name}</span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: col }}>{item.value}</span>
                      </div>
                      <div style={{ height: 6, borderRadius: 999, overflow: 'hidden', background: dk.subtleBg2 }}>
                        <div style={{
                          height: '100%', borderRadius: 999, width: `${pct}%`, background: col,
                          transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                        }} />
                      </div>
                    </div>
                  )
                })}
              </div>
            </Glass>

            {/* Compliance overview */}
            <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}>
                <ShieldCheck size={18} style={{ color: '#10b981' }} />
                <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>Team Compliance</h3>
              </div>
              <ComplianceRing score={complianceScore} size={110} dark={isDark} />
              <p style={{
                fontSize: 13, fontWeight: 600, marginTop: 16, textAlign: 'center',
                color: complianceScore >= 90 ? '#10b981' : complianceScore >= 70 ? '#f59e0b' : '#ef4444',
              }}>
                {complianceScore >= 90 ? 'Excellent compliance' : complianceScore >= 70 ? 'Some attention needed' : 'Action required'}
              </p>
              <div style={{ display: 'flex', gap: 16, marginTop: 12 }}>
                {[
                  { label: 'Valid', value: allStaff.length - allStaff.filter(s => s.documents?.some(d => d.status === 'expired')).length, color: '#10b981' },
                  { label: 'Expired', value: allStaff.filter(s => s.documents?.some(d => d.status === 'expired')).length, color: '#ef4444' },
                ].map((m, i) => (
                  <div key={i} style={{ textAlign: 'center' }}>
                    <p style={{ fontSize: 20, fontWeight: 800, color: m.color }}>{m.value}</p>
                    <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{m.label}</p>
                  </div>
                ))}
              </div>
            </Glass>
          </div>
        )}

      </div>


      {/* ══════════════════════════════════════════
          ADD STAFF MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={showAdd} onClose={handleCloseModal} title={inviteCode ? 'Staff Invite Created' : 'Add New Staff Member'} wide>
        {inviteCode ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20, alignItems: 'center', padding: '8px 0' }}>
            <div style={{
              width: 72, height: 72, borderRadius: '50%',
              background: `linear-gradient(135deg, #10b981, ${c.staff})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 8px 32px -8px rgba(16,185,129,0.5)',
            }}>
              <Check size={36} color="white" />
            </div>
            <p style={{ fontSize: 14, color: dk.textMuted, textAlign: 'center' }}>
              Give this code to <strong style={{ color: dk.text }}>{newStaff.firstName} {newStaff.lastName}</strong> so they can set up their account:
            </p>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span style={{
                fontSize: 32, fontFamily: 'monospace', fontWeight: 800, letterSpacing: '0.15em',
                padding: '16px 28px', borderRadius: 16,
                background: isDark ? 'rgba(30,41,59,0.8)' : '#f1f5f9',
                border: `2px solid ${c.staff}40`, color: dk.text,
              }}>
                {inviteCode}
              </span>
              <button onClick={copyCode} style={{
                width: 48, height: 48, borderRadius: 14, border: 'none',
                background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer', color: dk.textMuted,
              }}>
                <Copy size={20} />
              </button>
            </div>
            <p style={{ fontSize: 12, color: dk.textFaint, textAlign: 'center' }}>
              This code expires in 48 hours. They should go to <strong>/setup/staff</strong> to set their password.
            </p>
            <button onClick={handleCloseModal} style={{
              width: '100%', padding: '15px 0', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 8px 28px -6px ${c.staff}50`,
            }}>
              Done
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Modal hero */}
            <div style={{
              margin: '-24px -24px 0 -24px', padding: '28px 28px 22px',
              background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, #3b82f6 100%)`,
              position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0',
            }}>
              <div style={{ position: 'absolute', width: 160, height: 160, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -40, right: -20 }} />
              <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '20px 20px', opacity: 0.5 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16, background: 'rgba(255,255,255,0.15)',
                  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Plus size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>New Staff Member</h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    An invite code will be generated for account setup
                  </p>
                </div>
              </div>
            </div>

            {/* Form fields */}
            <div style={{ padding: '0 4px', display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `linear-gradient(135deg, ${c.staff}20, ${c.staff}08)`,
                  border: `1px solid ${c.staff}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={14} style={{ color: c.staff }} />
                </div>
                <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Personal Details</p>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
                {[
                  { label: 'First Name *', key: 'firstName', icon: User },
                  { label: 'Last Name *', key: 'lastName', icon: User },
                  { label: 'Email *', key: 'email', type: 'email', icon: Mail },
                  { label: 'Phone', key: 'phone', type: 'tel', icon: Phone },
                  { label: 'Position', key: 'position', icon: Briefcase },
                ].map(f => (
                  <div key={f.key}>
                    <p style={{
                      fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                      textTransform: 'uppercase', letterSpacing: '0.04em',
                      display: 'flex', alignItems: 'center', gap: 5,
                    }}>
                      <f.icon size={11} /> {f.label}
                    </p>
                    <input
                      type={f.type || 'text'}
                      value={newStaff[f.key]}
                      onChange={e => setNewStaff({ ...newStaff, [f.key]: e.target.value })}
                      placeholder={f.label.replace(' *', '')}
                      style={{
                        width: '100%', padding: '12px 14px', background: dk.inputBg,
                        border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                        fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                        transition: 'all .2s',
                      }}
                      onFocus={e => e.target.style.borderColor = c.staff}
                      onBlur={e => e.target.style.borderColor = dk.inputBorder}
                    />
                  </div>
                ))}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Briefcase size={11} /> Employment Type
                  </p>
                  <select
                    value={newStaff.employment_type}
                    onChange={e => setNewStaff({ ...newStaff, employment_type: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 14px', background: dk.inputBg,
                      border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                      fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                      cursor: 'pointer',
                    }}
                  >
                    <option value="">Select...</option>
                    <option value="full_time">Full Time</option>
                    <option value="part_time">Part Time</option>
                    <option value="casual">Casual</option>
                    <option value="contractor">Contractor</option>
                  </select>
                </div>
              </div>

              {/* Info banner */}
              <div style={{
                padding: '12px 16px', borderRadius: 12,
                background: `linear-gradient(135deg, ${c.staff}10, ${c.staffHover}05)`,
                border: `1px solid ${c.staff}25`,
                fontSize: 12, fontWeight: 600, color: c.staff,
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
                <Zap size={14} />
                An invite code will be generated. Give it to the staff member so they can set up their own login.
              </div>

              {/* Buttons */}
              <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16 }}>
                <button onClick={handleCloseModal} style={{
                  flex: 1, padding: '15px 0', borderRadius: 14,
                  background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                  border: `1px solid ${dk.inputBorder}`,
                  color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                }}>
                  Cancel
                </button>
                <button onClick={handleAddStaff} disabled={saving} style={{
                  flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
                  background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                  color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: `0 8px 28px -6px ${c.staff}50`,
                  opacity: saving ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                }}>
                  {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : <><Plus size={16} /> Add & Generate Code</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>


      {/* ══════════════════════════════════════════
          EDIT STAFF MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditStaff(null) }} title="Edit Staff Member" wide>
        {editStaff && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>

            {/* Modal hero */}
            <div style={{
              margin: '-24px -24px 0 -24px', padding: '24px 28px 20px',
              background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 50%, #3b82f6 100%)`,
              position: 'relative', overflow: 'hidden', borderRadius: '16px 16px 0 0',
            }}>
              <div style={{ position: 'absolute', width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.06)', top: -30, right: -10 }} />
              <div style={{ position: 'relative', zIndex: 1, display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 48, height: 48, borderRadius: 14, background: 'rgba(255,255,255,0.2)',
                  backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 16, fontWeight: 800, color: 'white',
                }}>
                  {editStaff.first_name?.[0]}{editStaff.last_name?.[0]}
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 800, color: 'white' }}>
                    {editStaff.first_name} {editStaff.last_name}
                  </h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.6)' }}>Edit staff details</p>
                </div>
              </div>
            </div>

            <div style={{ padding: '0 4px', display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 12 }}>
              {[
                { label: 'First Name *', key: 'first_name', icon: User },
                { label: 'Last Name *', key: 'last_name', icon: User },
                { label: 'Email', key: 'email', type: 'email', icon: Mail },
                { label: 'Phone', key: 'phone', type: 'tel', icon: Phone },
                { label: 'Position', key: 'position', icon: Briefcase },
              ].map(f => (
                <div key={f.key}>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <f.icon size={11} /> {f.label}
                  </p>
                  <input
                    type={f.type || 'text'}
                    value={editStaff[f.key]}
                    onChange={e => setEditStaff({ ...editStaff, [f.key]: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 14px', background: dk.inputBg,
                      border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
                      fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
                      transition: 'all .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = c.staff}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder}
                  />
                </div>
              ))}
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Briefcase size={11} /> Employment Type
                </p>
                <select value={editStaff.employment_type} onChange={e => setEditStaff({ ...editStaff, employment_type: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', cursor: 'pointer' }}>
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="casual">Casual</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                  <Activity size={11} /> Status
                </p>
                <select value={editStaff.status} onChange={e => setEditStaff({ ...editStaff, status: e.target.value })}
                  style={{ width: '100%', padding: '12px 14px', background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12, fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none', cursor: 'pointer' }}>
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>

            <div style={{ display: 'flex', gap: 12, borderTop: `1px solid ${dk.divider}`, paddingTop: 16, padding: '16px 4px 0' }}>
              <button onClick={() => { setShowEdit(false); setEditStaff(null) }} style={{
                flex: 1, padding: '15px 0', borderRadius: 14,
                background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} style={{
                flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
                background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: `0 8px 28px -6px ${c.staff}50`, opacity: saving ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : <><Check size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>


      {/* ══════════════════════════════════════════
          DELETE CONFIRMATION MODAL
          ══════════════════════════════════════════ */}
      <Modal isOpen={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null) }} title="Delete Staff Member">
        {deleteTarget && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              padding: '24px', borderRadius: 16, textAlign: 'center',
              background: isDark ? 'rgba(239,68,68,0.08)' : '#fef2f2',
              border: `1px solid ${isDark ? 'rgba(239,68,68,0.2)' : '#fecaca'}`,
            }}>
              <div style={{
                width: 56, height: 56, borderRadius: 16, margin: '0 auto 12px',
                background: 'linear-gradient(135deg, #ef4444, #f87171)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: '0 6px 24px -6px rgba(239,68,68,0.5)',
              }}>
                <Trash2 size={26} color="white" />
              </div>
              <p style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Are you sure?</p>
              <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 6 }}>
                This will permanently delete <strong style={{ color: dk.text }}>{deleteTarget.first_name} {deleteTarget.last_name}</strong> from the system. This action cannot be undone.
              </p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => { setShowDelete(false); setDeleteTarget(null) }} style={{
                flex: 1, padding: '15px 0', borderRadius: 14,
                background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                border: `1px solid ${dk.inputBorder}`, color: dk.textMuted,
                fontSize: 14, fontWeight: 700, cursor: 'pointer',
              }}>Cancel</button>
              <button onClick={handleDelete} disabled={deleting} style={{
                flex: 1, padding: '15px 0', borderRadius: 14, border: 'none',
                background: 'linear-gradient(135deg, #ef4444, #f87171)',
                color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
                boxShadow: '0 6px 24px -6px rgba(239,68,68,0.5)',
                opacity: deleting ? 0.6 : 1,
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
              }}>
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : <><Trash2 size={16} /> Delete</>}
              </button>
            </div>
          </div>
        )}
      </Modal>

    </div>
  )
}