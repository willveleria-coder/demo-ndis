import { useState, useEffect, useRef } from 'react'
import {
  GraduationCap, Plus, Loader2, Search, CheckCircle, Clock, AlertTriangle,
  User, Trash2, RefreshCw, BookOpen, Award, ShieldCheck, Calendar,
  Hash, FileText, ChevronDown, ChevronRight, Filter, TrendingUp,
  Zap, Star, Target, BarChart3, Users, ClipboardCheck, XCircle,
  ArrowUpRight, Eye, Building, BadgeCheck, Sparkles, Shield,
  Activity, ArrowRight, ChevronUp
} from 'lucide-react'
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
        animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
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
    }}>
      {children}
    </span>
  )
}


/* ─────────────────────────────────────────────
   CONSTANTS & HELPERS
   ───────────────────────────────────────────── */

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', {
    day: 'numeric', month: 'short', year: 'numeric',
  })
}

function daysUntil(dateStr) {
  if (!dateStr) return null
  return Math.ceil((new Date(dateStr) - new Date()) / 86400000)
}

const TRAINING_TYPES = [
  'NDIS Worker Orientation', 'Manual Handling', 'First Aid', 'CPR',
  'Medication Administration', 'Behaviour Support', 'Infection Control',
  'Fire Safety', 'Cultural Awareness', 'Mental Health First Aid',
  'Restrictive Practices', 'Mealtime Management', 'Epilepsy Management',
  'Diabetes Management', 'Privacy & Confidentiality', 'Abuse & Neglect Prevention',
  'WHS Induction', 'Company Policies', 'Participant-Specific Training', 'Other',
]

const ONBOARDING_CHECKLIST = [
  { key: 'wwcc', label: 'Working With Children Check', mandatory: true },
  { key: 'ndis_screening', label: 'NDIS Worker Screening Check', mandatory: true },
  { key: 'police_check', label: 'National Police Check', mandatory: true },
  { key: 'first_aid', label: 'First Aid Certificate', mandatory: true },
  { key: 'cpr', label: 'CPR Certificate', mandatory: true },
  { key: 'ndis_orientation', label: 'NDIS Worker Orientation Module', mandatory: true },
  { key: 'manual_handling', label: 'Manual Handling Training', mandatory: true },
  { key: 'infection_control', label: 'Infection Control Training', mandatory: true },
  { key: 'company_induction', label: 'Company Induction Completed', mandatory: true },
  { key: 'policies_read', label: 'Policies & Procedures Acknowledged', mandatory: true },
  { key: 'uniform_issued', label: 'Uniform / ID Badge Issued', mandatory: false },
  { key: 'system_access', label: 'System Access Set Up', mandatory: false },
  { key: 'buddy_shift', label: 'Buddy / Shadow Shift Completed', mandatory: false },
  { key: 'emergency_contacts', label: 'Emergency Contacts Provided', mandatory: false },
  { key: 'bank_details', label: 'Bank & Tax Details Submitted', mandatory: false },
  { key: 'car_insurance', label: 'Car Insurance & Registration (if driving)', mandatory: false },
]


/* ─────────────────────────────────────────────
   COMPLIANCE RING
   ───────────────────────────────────────────── */

function ComplianceRing({ score, size = 120, dark = false }) {
  const r = (size - 14) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ
  const col = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  return (
    <div style={{ position: 'relative', width: size, height: size }}>
      <svg width={size} height={size} style={{ transform: 'rotate(-90deg)' }}>
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth="10"
        />
        <circle
          cx={size / 2} cy={size / 2} r={r}
          fill="none"
          stroke={col}
          strokeWidth="10"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 6px ${col}40)`,
          }}
        />
      </svg>
      <div style={{
        position: 'absolute', inset: 0,
        display: 'flex', flexDirection: 'column',
        alignItems: 'center', justifyContent: 'center',
      }}>
        <p style={{ fontSize: 26, fontWeight: 900, color: col, lineHeight: 1 }}>
          {score}%
        </p>
        <p style={{
          fontSize: 9, fontWeight: 600,
          color: dark ? '#64748b' : '#9ca3af',
          textTransform: 'uppercase', letterSpacing: '0.06em',
        }}>
          compliant
        </p>
      </div>
    </div>
  )
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function StaffTraining() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [trainings, setTrainings] = useState([])
  const [staffList, setStaffList] = useState([])
  const [search, setSearch] = useState('')
  const [filterStaff, setFilterStaff] = useState('all')
  const [showAdd, setShowAdd] = useState(false)
  const [showOnboarding, setShowOnboarding] = useState(null)
  const [saving, setSaving] = useState(false)
  const [tab, setTab] = useState('training')

  const [newTraining, setNewTraining] = useState({
    staff_id: '',
    training_type: '',
    provider: '',
    completed_date: '',
    expiry_date: '',
    certificate_number: '',
    notes: '',
    status: 'completed',
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
    cardBg:      isDark ? 'rgba(30,41,59,0.5)' : 'rgba(255,255,255,0.6)',
    cardBorder:  isDark ? 'rgba(51,65,85,0.3)' : 'rgba(255,255,255,0.8)',
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

  /* ── Data loading ── */
  useEffect(() => { loadData() }, [])

  const loadData = async () => {
    try {
      const [trainRes, staffRes] = await Promise.all([
        supabase
          .from('staff_training')
          .select('*, staff:staff_id(id, first_name, last_name)')
          .order('completed_date', { ascending: false }),
        supabase
          .from('staff')
          .select('id, first_name, last_name, status, onboarding_checklist')
          .order('first_name'),
      ])
      setTrainings(trainRes.data || [])
      setStaffList(staffRes.data || [])
    } catch (err) {
      console.error('Training load error:', err)
    } finally {
      setLoading(false)
      setTimeout(() => setLoaded(true), 50)
    }
  }

  /* ── Create training ── */
  const handleCreate = async () => {
    if (!newTraining.staff_id || !newTraining.training_type) {
      alert('Please select staff and training type')
      return
    }
    setSaving(true)
    try {
      const payload = { ...newTraining }
      if (!payload.completed_date) {
        payload.completed_date = new Date().toISOString().split('T')[0]
      }
      if (!payload.expiry_date) delete payload.expiry_date

      const { data, error } = await supabase
        .from('staff_training')
        .insert(payload)
        .select('*, staff:staff_id(id, first_name, last_name)')
        .single()
      if (error) throw error

      setTrainings([data, ...trainings])
      setShowAdd(false)
      setNewTraining({
        staff_id: '', training_type: '', provider: '', completed_date: '',
        expiry_date: '', certificate_number: '', notes: '', status: 'completed',
      })
    } catch (err) {
      alert('Failed to create: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  /* ── Delete training ── */
  const handleDelete = async (id) => {
    if (!confirm('Delete this training record?')) return
    try {
      const { error } = await supabase.from('staff_training').delete().eq('id', id)
      if (error) throw error
      setTrainings(trainings.filter(t => t.id !== id))
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    }
  }

  /* ── Toggle onboarding item ── */
  const toggleOnboardingItem = async (staffId, key, current) => {
    const staff = staffList.find(s => s.id === staffId)
    const checklist = { ...(staff?.onboarding_checklist || {}), [key]: !current }
    try {
      const { error } = await supabase
        .from('staff')
        .update({ onboarding_checklist: checklist })
        .eq('id', staffId)
      if (error) throw error
      setStaffList(staffList.map(s =>
        s.id === staffId ? { ...s, onboarding_checklist: checklist } : s
      ))
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    }
  }

  /* ── Filtering ── */
  const filtered = trainings.filter(t => {
    if (filterStaff !== 'all' && t.staff_id !== filterStaff) return false
    if (search) {
      const q = search.toLowerCase()
      const sName = t.staff
        ? `${t.staff.first_name} ${t.staff.last_name}`.toLowerCase()
        : ''
      return t.training_type.toLowerCase().includes(q) || sName.includes(q)
    }
    return true
  })

  /* ── Computed stats ── */
  const completedCount = trainings.filter(t => t.status === 'completed').length
  const expiringCount = trainings.filter(t => {
    const days = daysUntil(t.expiry_date)
    return days !== null && days <= 30 && days >= 0
  }).length
  const expiredCount = trainings.filter(t => {
    const days = daysUntil(t.expiry_date)
    return days !== null && days < 0
  }).length
  const validCount = trainings.length - expiredCount - expiringCount

  /* ── Onboarding computed ── */
  const activeStaff = staffList.filter(s => s.status === 'active' || s.status === 'pending')
  const totalOnboardingItems = ONBOARDING_CHECKLIST.length
  const fullyOnboarded = activeStaff.filter(staff => {
    const cl = staff.onboarding_checklist || {}
    return ONBOARDING_CHECKLIST.filter(i => i.mandatory).every(i => cl[i.key])
  }).length
  const onboardingPct = activeStaff.length
    ? Math.round((fullyOnboarded / activeStaff.length) * 100)
    : 100

  /* ── Training type breakdown for insights ── */
  const typeBreakdown = {}
  trainings.forEach(t => {
    typeBreakdown[t.training_type] = (typeBreakdown[t.training_type] || 0) + 1
  })
  const topTypes = Object.entries(typeBreakdown)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)


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
            background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: `0 0 40px ${c.primary}40`,
          }}>
            <GraduationCap size={32} color="white" />
          </div>
          <div style={{
            position: 'absolute', inset: 0, borderRadius: 22,
            background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
            animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
            opacity: 0.3,
          }} />
        </div>
        <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>
          Loading training records...
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
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1) }
          50% { transform: translateY(-15px) scale(1.03) }
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0 }
        }
        @keyframes shimmer {
          0% { background-position: 200% 0 }
          100% { background-position: -200% 0 }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1 }
          50% { opacity: 0.4 }
        }
        @keyframes countUp {
          from { opacity: 0; transform: translateY(8px) scale(0.95) }
          to { opacity: 1; transform: translateY(0) scale(1) }
        }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      {/* Background orbs */}
      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#f59e0b" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={stg(0)}>
          <div style={{
            borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}>
            {/* Decorative circles */}
            <div style={{
              position: 'absolute', width: 300, height: 300, borderRadius: '50%',
              background: 'rgba(255,255,255,0.08)', top: -80, right: -40,
            }} />
            <div style={{
              position: 'absolute', width: 180, height: 180, borderRadius: '50%',
              background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%',
            }} />
            <div style={{
              position: 'absolute', width: 100, height: 100, borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
              top: 30, left: '55%',
              animation: 'orbFloat 8s ease-in-out infinite',
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
              {/* Top badge row */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                  <GraduationCap size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    Training & Compliance
                  </span>
                </div>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: 6,
                  padding: '5px 12px', borderRadius: 999,
                  background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)',
                }}>
                  <div style={{
                    width: 6, height: 6, borderRadius: '50%', background: '#34d399',
                    animation: 'pulse-dot 2s ease-in-out infinite',
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>
                    {trainings.length} Records
                  </span>
                </div>
              </div>

              {/* Title + action */}
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{
                    fontSize: 32, fontWeight: 900, color: 'white',
                    letterSpacing: '-0.02em', lineHeight: 1.15,
                  }}>
                    Staff Training
                  </h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>
                    Track qualifications, certifications, and onboarding progress across your team
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
                  <Plus size={18} /> Add Training
                </button>
              </div>

              {/* Hero stat pills */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: Award, text: `${completedCount} completed`, bg: 'rgba(255,255,255,0.12)' },
                  { icon: AlertTriangle, text: `${expiringCount} expiring`, bg: expiringCount > 0 ? 'rgba(245,158,11,0.35)' : 'rgba(255,255,255,0.1)' },
                  { icon: XCircle, text: `${expiredCount} expired`, bg: expiredCount > 0 ? 'rgba(239,68,68,0.35)' : 'rgba(255,255,255,0.1)' },
                  { icon: Users, text: `${fullyOnboarded}/${activeStaff.length} onboarded`, bg: 'rgba(255,255,255,0.1)' },
                  { icon: ShieldCheck, text: `${onboardingPct}% compliance`, bg: 'rgba(255,255,255,0.1)' },
                ].map((pill, i) => (
                  <div key={i} style={{
                    display: 'flex', alignItems: 'center', gap: 6,
                    padding: '7px 14px', borderRadius: 12,
                    background: pill.bg, backdropFilter: 'blur(8px)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    transition: 'all .2s', cursor: 'default',
                  }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>
                      {pill.text}
                    </span>
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
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))',
          gap: 14,
          ...stg(1),
        }}>
          {[
            {
              icon: GraduationCap, label: 'Total Records', value: trainings.length,
              grad: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
              glow: `${c.primary}35`,
            },
            {
              icon: CheckCircle, label: 'Completed', value: completedCount,
              grad: 'linear-gradient(135deg, #10b981, #34d399)',
              glow: 'rgba(16,185,129,0.2)',
            },
            {
              icon: AlertTriangle, label: 'Expiring Soon', value: expiringCount,
              grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              glow: 'rgba(245,158,11,0.2)',
            },
            {
              icon: XCircle, label: 'Expired', value: expiredCount,
              grad: 'linear-gradient(135deg, #ef4444, #f87171)',
              glow: 'rgba(239,68,68,0.2)',
            },
            {
              icon: BadgeCheck, label: 'Onboarded', value: fullyOnboarded,
              grad: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              glow: 'rgba(59,130,246,0.2)',
            },
          ].map((card, i) => (
            <Glass key={i} dark={isDark} hover glow={card.glow} style={{ padding: '18px 20px' }}>
              <div style={{
                width: 42, height: 42, borderRadius: 12,
                background: card.grad,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: `0 6px 20px -4px ${card.glow}`,
                marginBottom: 12,
              }}>
                <card.icon size={20} color="white" />
              </div>
              <p style={{ fontSize: 24, fontWeight: 800, color: dk.text, lineHeight: 1 }}
                 className="count-up">
                <AnimNum value={card.value} />
              </p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                {card.label}
              </p>
            </Glass>
          ))}
        </div>


        {/* ══════════════════════════════════════════
            TAB NAVIGATION
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} style={{ padding: 6, ...stg(2) }}>
        <div className="no-scrollbar" style={{ display: 'flex', gap: 4, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {[
              { key: 'training', icon: GraduationCap, label: 'Training Records' },
              { key: 'onboarding', icon: BookOpen, label: 'Onboarding Checklists' },
              { key: 'insights', icon: BarChart3, label: 'Insights' },
            ].map(t => {
              const isActive = tab === t.key
              return (
                <button
                  key={t.key}
                  onClick={() => setTab(t.key)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 8,
                    padding: '12px 20px', borderRadius: 14, border: 'none',
                    fontSize: 13, fontWeight: 700, cursor: 'pointer',
                    flexShrink: 0,
                    transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                    background: isActive
                      ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`
                      : 'transparent',
                    color: isActive ? 'white' : dk.textMuted,
                    boxShadow: isActive ? `0 4px 16px -4px ${c.primary}60` : 'none',
                  }}
                  onMouseEnter={e => {
                    if (!isActive) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)'
                  }}
                  onMouseLeave={e => {
                    if (!isActive) e.currentTarget.style.background = 'transparent'
                  }}
                >
                  <t.icon size={16} />
                  {t.label}
                </button>
              )
            })}
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            COMPLIANCE ALERT BANNER
            ══════════════════════════════════════════ */}
        {(expiringCount > 0 || expiredCount > 0) && tab === 'training' && (
          <Glass
            dark={isDark}
            glow={expiredCount > 0 ? 'rgba(239,68,68,0.15)' : 'rgba(245,158,11,0.15)'}
            style={{ ...stg(3), padding: '16px 22px' }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{
                width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                background: expiredCount > 0
                  ? 'linear-gradient(135deg, #ef4444, #f87171)'
                  : 'linear-gradient(135deg, #f59e0b, #fbbf24)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                boxShadow: expiredCount > 0
                  ? '0 6px 20px -4px rgba(239,68,68,0.4)'
                  : '0 6px 20px -4px rgba(245,158,11,0.4)',
              }}>
                <AlertTriangle size={22} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                  Training Compliance Alert
                </p>
                <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                  {expiredCount > 0 ? `${expiredCount} expired` : ''}
                  {expiredCount > 0 && expiringCount > 0 ? ' · ' : ''}
                  {expiringCount > 0 ? `${expiringCount} expiring within 30 days` : ''}
                </p>
              </div>
            </div>
          </Glass>
        )}


        {/* ══════════════════════════════════════════
            TRAINING RECORDS TAB
            ══════════════════════════════════════════ */}
        {tab === 'training' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Search + filter bar */}
            <Glass dark={isDark} style={{ ...stg(4), padding: '14px 18px' }}>
              <div style={{ display: 'flex', gap: 12, flexWrap: 'wrap', alignItems: 'center' }}>
                {/* Search */}
                <div style={{ flex: 1, minWidth: 200, position: 'relative' }}>
                  <Search size={16} style={{
                    position: 'absolute', left: 14, top: '50%', transform: 'translateY(-50%)',
                    color: dk.textFaint,
                  }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search by training type or staff name..."
                    style={{
                      width: '100%', padding: '11px 14px 11px 40px',
                      background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                      borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                      transition: 'border-color .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = c.primary}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder}
                  />
                </div>

                {/* Staff filter */}
                <div style={{ position: 'relative' }}>
                  <select
                    value={filterStaff}
                    onChange={e => setFilterStaff(e.target.value)}
                    style={{
                      padding: '11px 36px 11px 14px',
                      background: dk.inputBg, border: `1px solid ${dk.inputBorder}`,
                      borderRadius: 12, fontSize: 14, color: dk.text, outline: 'none',
                      appearance: 'none', cursor: 'pointer',
                      minWidth: 160,
                    }}
                  >
                    <option value="all">All Staff</option>
                    {staffList.map(s => (
                      <option key={s.id} value={s.id}>
                        {s.first_name} {s.last_name}
                      </option>
                    ))}
                  </select>
                  <ChevronDown size={14} style={{
                    position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                    color: dk.textFaint, pointerEvents: 'none',
                  }} />
                </div>

                {/* Result count */}
                <span style={{
                  fontSize: 12, fontWeight: 600, color: dk.textFaint,
                  padding: '6px 12px', borderRadius: 10,
                  background: dk.subtleBg,
                }}>
                  {filtered.length} result{filtered.length !== 1 ? 's' : ''}
                </span>
              </div>
            </Glass>

            {/* Training records list */}
            {filtered.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                {filtered.map((t, i) => {
                  const days = daysUntil(t.expiry_date)
                  const isExpired = days !== null && days < 0
                  const isExpiring = days !== null && days <= 30 && days >= 0
                  const sName = t.staff
                    ? `${t.staff.first_name} ${t.staff.last_name}`
                    : 'Unknown'
                  const statusColor = isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : '#10b981'

                  return (
                    <Glass
                      key={t.id}
                      dark={isDark}
                      hover
                      glow={`${statusColor}15`}
                      style={{ ...stg(i + 5), padding: '18px 22px' }}
                    >
                      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 16 }}>
                        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14, flex: 1, minWidth: 0 }}>
                          {/* Color accent bar */}
                          <div style={{
                            width: 4, height: 52, borderRadius: 4, flexShrink: 0,
                            background: `linear-gradient(to bottom, ${statusColor}, ${statusColor}60)`,
                            marginTop: 2,
                          }} />
                          {/* Icon */}
                          <div style={{
                            width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                            background: `linear-gradient(135deg, ${statusColor}20, ${statusColor}08)`,
                            border: `1px solid ${statusColor}25`,
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                          }}>
                            <GraduationCap size={20} style={{ color: statusColor }} />
                          </div>
                          {/* Content */}
                          <div style={{ minWidth: 0, flex: 1 }}>
                            <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                              {t.training_type}
                            </p>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 3, flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 12, color: dk.textMuted,
                              }}>
                                <User size={11} /> {sName}
                              </span>
                              {t.provider && (
                                <span style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  fontSize: 12, color: dk.textFaint,
                                }}>
                                  <Building size={11} /> {t.provider}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 6, flexWrap: 'wrap' }}>
                              <span style={{
                                display: 'flex', alignItems: 'center', gap: 4,
                                fontSize: 11, color: dk.textFaint,
                              }}>
                                <Calendar size={10} /> {formatDate(t.completed_date)}
                              </span>
                              {t.expiry_date && (
                                <span style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  fontSize: 11, color: isExpired ? '#ef4444' : isExpiring ? '#f59e0b' : dk.textFaint,
                                  fontWeight: isExpired || isExpiring ? 600 : 400,
                                }}>
                                  <Clock size={10} /> Exp: {formatDate(t.expiry_date)}
                                </span>
                              )}
                              {t.certificate_number && (
                                <span style={{
                                  display: 'flex', alignItems: 'center', gap: 4,
                                  fontSize: 11, color: dk.textFaint,
                                }}>
                                  <Hash size={10} /> {t.certificate_number}
                                </span>
                              )}
                            </div>
                            <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
                              <Badge
                                color={isExpired ? 'red' : isExpiring ? 'amber' : 'green'}
                                dark={isDark}
                              >
                                {isExpired
                                  ? 'Expired'
                                  : isExpiring
                                    ? `Expiring in ${days}d`
                                    : 'Valid'
                                }
                              </Badge>
                            </div>
                          </div>
                        </div>

                        {/* Delete button */}
                        <button
                          onClick={(e) => { e.stopPropagation(); handleDelete(t.id) }}
                          style={{
                            width: 38, height: 38, borderRadius: 10, border: 'none',
                            background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2',
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            cursor: 'pointer', flexShrink: 0, transition: 'all .2s',
                          }}
                          onMouseEnter={e => {
                            e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.2)' : '#fee2e2'
                            e.currentTarget.style.transform = 'scale(1.1)'
                          }}
                          onMouseLeave={e => {
                            e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'
                            e.currentTarget.style.transform = 'scale(1)'
                          }}
                        >
                          <Trash2 size={15} style={{ color: '#ef4444' }} />
                        </button>
                      </div>
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass dark={isDark} style={{ ...stg(5), padding: '56px 24px', textAlign: 'center' }}>
                <div style={{
                  width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px',
                  background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`,
                  border: `1px solid ${c.primary}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GraduationCap size={32} style={{ color: c.primary }} />
                </div>
                <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>
                  No training records found
                </p>
                <p style={{ color: dk.textFaint, fontSize: 13, marginTop: 4 }}>
                  {search || filterStaff !== 'all'
                    ? 'Try adjusting your search or filter'
                    : 'Click "Add Training" to create the first record'
                  }
                </p>
              </Glass>
            )}
          </div>
        )}


        {/* ══════════════════════════════════════════
            ONBOARDING TAB
            ══════════════════════════════════════════ */}
        {tab === 'onboarding' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Onboarding info header */}
            <Glass dark={isDark} style={{ ...stg(3), padding: '16px 22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 44, height: 44, borderRadius: 12, flexShrink: 0,
                  background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
                  border: `1px solid ${c.primary}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <BookOpen size={20} style={{ color: c.primary }} />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                    Onboarding Progress
                  </p>
                  <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>
                    Track completion for each staff member. Mandatory items must be done before shift assignment.
                  </p>
                </div>
                <div style={{
                  marginLeft: 'auto', padding: '6px 14px', borderRadius: 10,
                  background: fullyOnboarded === activeStaff.length
                    ? (isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5')
                    : (isDark ? 'rgba(245,158,11,0.15)' : '#fffbeb'),
                  border: `1px solid ${fullyOnboarded === activeStaff.length ? 'rgba(16,185,129,0.3)' : 'rgba(245,158,11,0.3)'}`,
                  flexShrink: 0,
                }}>
                  <p style={{
                    fontSize: 18, fontWeight: 800,
                    color: fullyOnboarded === activeStaff.length ? '#10b981' : '#f59e0b',
                    textAlign: 'center', lineHeight: 1,
                  }}>
                    {fullyOnboarded}/{activeStaff.length}
                  </p>
                  <p style={{
                    fontSize: 9, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em',
                    color: dk.textFaint, textAlign: 'center', marginTop: 2,
                  }}>
                    Ready
                  </p>
                </div>
              </div>
            </Glass>

            {/* Staff onboarding cards */}
            {activeStaff.map((staff, sIdx) => {
              const checklist = staff.onboarding_checklist || {}
              const completedCount = ONBOARDING_CHECKLIST.filter(item => checklist[item.key]).length
              const mandatoryComplete = ONBOARDING_CHECKLIST.filter(item => item.mandatory).every(item => checklist[item.key])
              const pct = Math.round((completedCount / ONBOARDING_CHECKLIST.length) * 100)
              const mandatoryCount = ONBOARDING_CHECKLIST.filter(i => i.mandatory).length
              const mandatoryDone = ONBOARDING_CHECKLIST.filter(i => i.mandatory && checklist[i.key]).length
              const isOpen = showOnboarding === staff.id

              return (
                <Glass
                  key={staff.id}
                  dark={isDark}
                  glow={mandatoryComplete ? 'rgba(16,185,129,0.1)' : `${c.primary}10`}
                  style={{ ...stg(sIdx + 4), overflow: 'hidden' }}
                >
                  {/* Staff header row */}
                  <div
                    onClick={() => setShowOnboarding(isOpen ? null : staff.id)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                      padding: '18px 22px', cursor: 'pointer',
                      transition: 'background .2s',
                    }}
                    onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                      {/* Avatar */}
                      <div style={{
                        width: 44, height: 44, borderRadius: 13,
                        background: mandatoryComplete
                          ? 'linear-gradient(135deg, #10b981, #059669)'
                          : `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        color: 'white', fontSize: 14, fontWeight: 800,
                        boxShadow: mandatoryComplete
                          ? '0 4px 16px -4px rgba(16,185,129,0.4)'
                          : `0 4px 16px -4px ${c.primary}40`,
                        flexShrink: 0,
                      }}>
                        {staff.first_name?.[0]}{staff.last_name?.[0]}
                      </div>
                      {/* Name + progress text */}
                      <div>
                        <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>
                          {staff.first_name} {staff.last_name}
                        </p>
                        <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                          {completedCount}/{ONBOARDING_CHECKLIST.length} complete
                          <span style={{ margin: '0 6px', color: dk.textFaint }}>·</span>
                          {mandatoryDone}/{mandatoryCount} mandatory
                        </p>
                      </div>
                    </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 10, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
                      <Badge color={mandatoryComplete ? 'green' : 'amber'} dark={isDark}>
                        {mandatoryComplete ? 'Ready' : 'Incomplete'}
                      </Badge>

                      {/* Progress bar */}
                      <div style={{ width: 100 }}>
                        <div style={{
                          height: 8, borderRadius: 999, overflow: 'hidden',
                          background: dk.subtleBg2,
                        }}>
                          <div style={{
                            height: '100%', borderRadius: 999,
                            width: `${pct}%`,
                            background: pct === 100
                              ? 'linear-gradient(90deg, #10b981, #34d399)'
                              : `linear-gradient(90deg, ${c.primary}, ${c.adminHover})`,
                            transition: 'width .8s cubic-bezier(.16,1,.3,1)',
                            position: 'relative',
                          }}>
                            <div style={{
                              position: 'absolute', inset: 0, borderRadius: 999,
                              background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                              backgroundSize: '200% 100%',
                              animation: 'shimmer 2s infinite',
                            }} />
                          </div>
                        </div>
                        <p style={{
                          fontSize: 10, fontWeight: 700, color: dk.textFaint,
                          textAlign: 'right', marginTop: 3,
                        }}>
                          {pct}%
                        </p>
                      </div>

                      {/* Chevron */}
                      <div style={{
                        transition: 'transform .3s',
                        transform: isOpen ? 'rotate(180deg)' : 'rotate(0)',
                      }}>
                        <ChevronDown size={18} style={{ color: dk.textFaint }} />
                      </div>
                    </div>
                  </div>

                  {/* Checklist (expandable) */}
                  {isOpen && (
                    <div style={{
                      padding: '0 22px 20px',
                      borderTop: `1px solid ${dk.divider}`,
                    }}>
                      <div style={{ paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 6 }}>

                        {/* Section: Mandatory */}
                        <p style={{
                          fontSize: 11, fontWeight: 700, color: c.primary,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          marginBottom: 4, marginTop: 4,
                        }}>
                          Mandatory Requirements
                        </p>

                        {ONBOARDING_CHECKLIST.filter(i => i.mandatory).map(item => {
                          const done = !!checklist[item.key]
                          return (
                            <button
                              key={item.key}
                              onClick={() => toggleOnboardingItem(staff.id, item.key, done)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                width: '100%', padding: '12px 14px', borderRadius: 12,
                                border: `1px solid ${done
                                  ? (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0')
                                  : (isDark ? 'rgba(51,65,85,0.4)' : '#e5e7eb')
                                }`,
                                background: done
                                  ? (isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5')
                                  : (isDark ? 'rgba(30,41,59,0.4)' : '#fafafa'),
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all .2s',
                              }}
                              onMouseEnter={e => {
                                if (!done) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.3)' : '#f1f5f9'
                              }}
                              onMouseLeave={e => {
                                if (!done) e.currentTarget.style.background = isDark ? 'rgba(30,41,59,0.4)' : '#fafafa'
                              }}
                            >
                              {/* Checkbox */}
                              <div style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                border: `2px solid ${done ? '#10b981' : (isDark ? '#475569' : '#d1d5db')}`,
                                background: done ? '#10b981' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .2s',
                              }}>
                                {done && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              {/* Label */}
                              <span style={{
                                flex: 1, fontSize: 13, fontWeight: 600,
                                color: done ? (isDark ? '#34d399' : '#059669') : dk.text,
                                textDecoration: done ? 'line-through' : 'none',
                              }}>
                                {item.label}
                              </span>
                              {/* Required badge */}
                              <span style={{
                                fontSize: 9, fontWeight: 800, textTransform: 'uppercase',
                                color: done ? '#10b981' : '#ef4444',
                                letterSpacing: '0.05em',
                              }}>
                                {done ? '✓ Done' : 'Required'}
                              </span>
                            </button>
                          )
                        })}

                        {/* Section: Optional */}
                        <p style={{
                          fontSize: 11, fontWeight: 700, color: dk.textMuted,
                          textTransform: 'uppercase', letterSpacing: '0.06em',
                          marginTop: 16, marginBottom: 4,
                        }}>
                          Additional Items
                        </p>

                        {ONBOARDING_CHECKLIST.filter(i => !i.mandatory).map(item => {
                          const done = !!checklist[item.key]
                          return (
                            <button
                              key={item.key}
                              onClick={() => toggleOnboardingItem(staff.id, item.key, done)}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 12,
                                width: '100%', padding: '12px 14px', borderRadius: 12,
                                border: `1px solid ${done
                                  ? (isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0')
                                  : (isDark ? 'rgba(51,65,85,0.4)' : '#e5e7eb')
                                }`,
                                background: done
                                  ? (isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5')
                                  : (isDark ? 'rgba(30,41,59,0.4)' : '#fafafa'),
                                cursor: 'pointer', textAlign: 'left',
                                transition: 'all .2s',
                              }}
                              onMouseEnter={e => {
                                if (!done) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.3)' : '#f1f5f9'
                              }}
                              onMouseLeave={e => {
                                if (!done) e.currentTarget.style.background = isDark ? 'rgba(30,41,59,0.4)' : '#fafafa'
                              }}
                            >
                              <div style={{
                                width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                                border: `2px solid ${done ? '#10b981' : (isDark ? '#475569' : '#d1d5db')}`,
                                background: done ? '#10b981' : 'transparent',
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                transition: 'all .2s',
                              }}>
                                {done && (
                                  <svg width="12" height="12" viewBox="0 0 12 12" fill="none">
                                    <path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                  </svg>
                                )}
                              </div>
                              <span style={{
                                flex: 1, fontSize: 13, fontWeight: 600,
                                color: done ? (isDark ? '#34d399' : '#059669') : dk.text,
                                textDecoration: done ? 'line-through' : 'none',
                              }}>
                                {item.label}
                              </span>
                              <span style={{
                                fontSize: 9, fontWeight: 700, textTransform: 'uppercase',
                                color: done ? '#10b981' : dk.textFaint,
                                letterSpacing: '0.05em',
                              }}>
                                {done ? '✓ Done' : 'Optional'}
                              </span>
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}
                </Glass>
              )
            })}
          </div>
        )}


        {/* ══════════════════════════════════════════
            INSIGHTS TAB (NEW!)
            ══════════════════════════════════════════ */}
        {tab === 'insights' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16 }}>

              {/* Compliance Ring Card */}
              <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ ...stg(3), padding: '28px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, alignSelf: 'flex-start', marginBottom: 20 }}>
                  <Shield size={18} style={{ color: '#10b981' }} />
                  <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>
                    Overall Compliance
                  </h3>
                </div>
                <ComplianceRing
                  score={trainings.length > 0
                    ? Math.round(((trainings.length - expiredCount) / trainings.length) * 100)
                    : 100
                  }
                  dark={isDark}
                />
                <p style={{
                  fontSize: 13, fontWeight: 600, marginTop: 16,
                  color: expiredCount === 0 ? '#10b981' : expiredCount > 3 ? '#ef4444' : '#f59e0b',
                }}>
                  {expiredCount === 0 ? 'All training current' : `${expiredCount} record${expiredCount !== 1 ? 's' : ''} need renewal`}
                </p>
              </Glass>

              {/* Top Training Types */}
              <Glass dark={isDark} glow={`${c.primary}10`} style={{ ...stg(4), padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <BarChart3 size={18} style={{ color: c.primary }} />
                  <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>
                    Most Common Training
                  </h3>
                </div>
                {topTypes.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                    {topTypes.map(([name, count], i) => {
                      const maxCount = topTypes[0][1]
                      const pct = Math.round((count / maxCount) * 100)
                      const colors = [c.primary, '#3b82f6', '#10b981', '#f59e0b', '#ec4899']
                      const col = colors[i % colors.length]
                      return (
                        <div key={name}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                            <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>
                              {name}
                            </span>
                            <span style={{ fontSize: 13, fontWeight: 800, color: col }}>
                              {count}
                            </span>
                          </div>
                          <div style={{
                            height: 6, borderRadius: 999, overflow: 'hidden',
                            background: dk.subtleBg2,
                          }}>
                            <div style={{
                              height: '100%', borderRadius: 999,
                              width: `${pct}%`, background: col,
                              transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                            }} />
                          </div>
                        </div>
                      )
                    })}
                  </div>
                ) : (
                  <p style={{ color: dk.textFaint, fontSize: 13 }}>
                    No training data yet
                  </p>
                )}
              </Glass>

              {/* Staff Coverage */}
              <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ ...stg(5), padding: '28px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                  <Users size={18} style={{ color: '#3b82f6' }} />
                  <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>
                    Staff Coverage
                  </h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
                  {[
                    {
                      label: 'Fully Onboarded',
                      value: fullyOnboarded,
                      total: activeStaff.length,
                      color: '#10b981',
                    },
                    {
                      label: 'With Training Records',
                      value: new Set(trainings.map(t => t.staff_id)).size,
                      total: staffList.length,
                      color: '#3b82f6',
                    },
                    {
                      label: 'Expired Training',
                      value: new Set(
                        trainings
                          .filter(t => {
                            const d = daysUntil(t.expiry_date)
                            return d !== null && d < 0
                          })
                          .map(t => t.staff_id)
                      ).size,
                      total: activeStaff.length,
                      color: '#ef4444',
                    },
                  ].map((metric, i) => (
                    <div key={i}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                        <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>
                          {metric.label}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 800, color: metric.color }}>
                          {metric.value}/{metric.total}
                        </span>
                      </div>
                      <div style={{
                        height: 8, borderRadius: 999, overflow: 'hidden',
                        background: dk.subtleBg2,
                      }}>
                        <div style={{
                          height: '100%', borderRadius: 999,
                          width: `${metric.total ? (metric.value / metric.total) * 100 : 0}%`,
                          background: `linear-gradient(90deg, ${metric.color}, ${metric.color}cc)`,
                          transition: 'width 1s cubic-bezier(.16,1,.3,1)',
                          position: 'relative',
                        }}>
                          <div style={{
                            position: 'absolute', inset: 0, borderRadius: 999,
                            background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                            backgroundSize: '200% 100%',
                            animation: 'shimmer 2s infinite',
                          }} />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </Glass>
            </div>
          </div>
        )}

      </div>


      {/* ══════════════════════════════════════════
          ADD TRAINING MODAL
          ══════════════════════════════════════════ */}
      <Modal
        isOpen={showAdd}
        onClose={() => setShowAdd(false)}
        title="Add Training Record"
        wide
      >
        <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>

          {/* ── Modal Hero Header ── */}
          <div style={{
            margin: '-20px -20px 0 -20px',
            padding: '28px 28px 22px',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 50%, #3b82f6 100%)`,
            position: 'relative', overflow: 'hidden',
            borderRadius: '16px 16px 0 0',
          }}>
            {/* Decoration */}
            <div style={{
              position: 'absolute', width: 160, height: 160, borderRadius: '50%',
              background: 'rgba(255,255,255,0.06)', top: -40, right: -20,
            }} />
            <div style={{
              position: 'absolute', width: 80, height: 80, borderRadius: '50%',
              background: 'rgba(255,255,255,0.04)', bottom: -20, left: '40%',
            }} />
            <div style={{
              position: 'absolute', inset: 0,
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)',
              backgroundSize: '20px 20px', opacity: 0.5,
            }} />

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{
                  width: 52, height: 52, borderRadius: 16,
                  background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
                  border: '1px solid rgba(255,255,255,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GraduationCap size={26} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: 20, fontWeight: 800, color: 'white' }}>
                    New Training Record
                  </h3>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.6)', marginTop: 2 }}>
                    Record a certification, qualification, or completed training
                  </p>
                </div>
              </div>

              {/* Progress indicator dots */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginTop: 18 }}>
                {['Staff', 'Training', 'Dates', 'Details'].map((step, i) => {
                  const filled = (i === 0 && newTraining.staff_id)
                    || (i === 1 && newTraining.training_type)
                    || (i === 2 && (newTraining.completed_date || newTraining.expiry_date))
                    || (i === 3 && (newTraining.certificate_number || newTraining.notes || newTraining.provider))
                  return (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                      <div style={{
                        width: 24, height: 24, borderRadius: 8,
                        background: filled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                        border: `1.5px solid ${filled ? 'rgba(255,255,255,0.5)' : 'rgba(255,255,255,0.15)'}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        transition: 'all .3s',
                      }}>
                        {filled
                          ? <CheckCircle size={13} style={{ color: 'white' }} />
                          : <span style={{ fontSize: 10, fontWeight: 700, color: 'rgba(255,255,255,0.4)' }}>{i + 1}</span>
                        }
                      </div>
                      <span style={{
                        fontSize: 11, fontWeight: 600,
                        color: filled ? 'rgba(255,255,255,0.8)' : 'rgba(255,255,255,0.3)',
                      }}>
                        {step}
                      </span>
                      {i < 3 && (
                        <div style={{
                          width: 20, height: 1.5,
                          background: filled ? 'rgba(255,255,255,0.3)' : 'rgba(255,255,255,0.08)',
                          borderRadius: 2,
                        }} />
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          {/* ── Form Body ── */}
          <div style={{ padding: '24px 4px 0', display: 'flex', flexDirection: 'column', gap: 22 }}>

            {/* Section 1: Staff Selection */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: `linear-gradient(135deg, ${c.primary}20, ${c.primary}08)`,
                  border: `1px solid ${c.primary}25`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <User size={14} style={{ color: c.primary }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Staff Member</p>
                  <p style={{ fontSize: 11, color: dk.textFaint }}>Who completed this training?</p>
                </div>
                <span style={{
                  marginLeft: 'auto', fontSize: 10, fontWeight: 700,
                  color: '#ef4444', textTransform: 'uppercase', letterSpacing: '0.05em',
                }}>
                  Required
                </span>
              </div>
              <select
                value={newTraining.staff_id}
                onChange={e => setNewTraining({ ...newTraining, staff_id: e.target.value })}
                style={{
                  width: '100%', padding: '14px 16px',
                  background: dk.inputBg,
                  border: `2px solid ${newTraining.staff_id ? `${c.primary}50` : dk.inputBorder}`,
                  borderRadius: 14, fontSize: 14, fontWeight: 600,
                  color: newTraining.staff_id ? dk.text : dk.textFaint,
                  outline: 'none', cursor: 'pointer',
                  transition: 'border-color .2s, box-shadow .2s',
                  boxShadow: newTraining.staff_id ? `0 0 0 3px ${c.primary}10` : 'none',
                }}
                onFocus={e => {
                  e.target.style.borderColor = c.primary
                  e.target.style.boxShadow = `0 0 0 3px ${c.primary}15`
                }}
                onBlur={e => {
                  e.target.style.borderColor = newTraining.staff_id ? `${c.primary}50` : dk.inputBorder
                  e.target.style.boxShadow = newTraining.staff_id ? `0 0 0 3px ${c.primary}10` : 'none'
                }}
              >
                <option value="">Select a staff member...</option>
                {staffList.map(s => (
                  <option key={s.id} value={s.id}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: dk.divider }} />

            {/* Section 2: Training Info */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(59,130,246,0.15), rgba(59,130,246,0.05))',
                  border: '1px solid rgba(59,130,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <GraduationCap size={14} style={{ color: '#3b82f6' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Training Details</p>
                  <p style={{ fontSize: 11, color: dk.textFaint }}>What training was completed?</p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {/* Training Type */}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Award size={11} /> Training Type
                    <span style={{ color: '#ef4444', fontSize: 13 }}>*</span>
                  </p>
                  <select
                    value={newTraining.training_type}
                    onChange={e => setNewTraining({ ...newTraining, training_type: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: dk.inputBg,
                      border: `1.5px solid ${newTraining.training_type ? `${c.primary}40` : dk.inputBorder}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600,
                      color: newTraining.training_type ? dk.text : dk.textFaint,
                      outline: 'none', cursor: 'pointer', transition: 'all .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = c.primary}
                    onBlur={e => e.target.style.borderColor = newTraining.training_type ? `${c.primary}40` : dk.inputBorder}
                  >
                    <option value="">Select type...</option>
                    {TRAINING_TYPES.map(t => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                </div>

                {/* Provider */}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Building size={11} /> Provider
                  </p>
                  <input
                    value={newTraining.provider}
                    onChange={e => setNewTraining({ ...newTraining, provider: e.target.value })}
                    placeholder="e.g. St John Ambulance"
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600,
                      color: dk.text, outline: 'none', transition: 'all .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = c.primary}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder}
                  />
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: dk.divider }} />

            {/* Section 3: Dates */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(16,185,129,0.05))',
                  border: '1px solid rgba(16,185,129,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Calendar size={14} style={{ color: '#10b981' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Dates & Validity</p>
                  <p style={{ fontSize: 11, color: dk.textFaint }}>When was it completed and when does it expire?</p>
                </div>
              </div>

              <div style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
                gap: 12,
              }}>
                {/* Completed Date */}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <CheckCircle size={11} /> Completed Date
                  </p>
                  <input
                    type="date"
                    value={newTraining.completed_date}
                    onChange={e => setNewTraining({ ...newTraining, completed_date: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600,
                      color: dk.text, outline: 'none', transition: 'all .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#10b981'}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder}
                  />
                  <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 4, fontStyle: 'italic' }}>
                    Defaults to today if left empty
                  </p>
                </div>

                {/* Expiry Date */}
                <div>
                  <p style={{
                    fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                    textTransform: 'uppercase', letterSpacing: '0.04em',
                    display: 'flex', alignItems: 'center', gap: 5,
                  }}>
                    <Clock size={11} /> Expiry Date
                  </p>
                  <input
                    type="date"
                    value={newTraining.expiry_date}
                    onChange={e => setNewTraining({ ...newTraining, expiry_date: e.target.value })}
                    style={{
                      width: '100%', padding: '12px 14px',
                      background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`,
                      borderRadius: 12, fontSize: 13, fontWeight: 600,
                      color: dk.text, outline: 'none', transition: 'all .2s',
                    }}
                    onFocus={e => e.target.style.borderColor = '#f59e0b'}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder}
                  />
                  <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 4, fontStyle: 'italic' }}>
                    Set to receive automatic renewal alerts
                  </p>
                </div>
              </div>
            </div>

            {/* Divider */}
            <div style={{ height: 1, background: dk.divider }} />

            {/* Section 4: Additional Details */}
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{
                  width: 28, height: 28, borderRadius: 8,
                  background: 'linear-gradient(135deg, rgba(139,92,246,0.15), rgba(139,92,246,0.05))',
                  border: '1px solid rgba(139,92,246,0.2)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <FileText size={14} style={{ color: '#8b5cf6' }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Additional Details</p>
                  <p style={{ fontSize: 11, color: dk.textFaint }}>Optional reference information</p>
                </div>
              </div>

              {/* Certificate Number */}
              <div style={{ marginBottom: 12 }}>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <Hash size={11} /> Certificate Number
                </p>
                <input
                  value={newTraining.certificate_number}
                  onChange={e => setNewTraining({ ...newTraining, certificate_number: e.target.value })}
                  placeholder="e.g. HLTAID011-2024-12345"
                  style={{
                    width: '100%', padding: '12px 14px',
                    background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`,
                    borderRadius: 12, fontSize: 13, fontWeight: 600,
                    color: dk.text, outline: 'none', transition: 'all .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = dk.inputBorder}
                />
              </div>

              {/* Notes */}
              <div>
                <p style={{
                  fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6,
                  textTransform: 'uppercase', letterSpacing: '0.04em',
                  display: 'flex', alignItems: 'center', gap: 5,
                }}>
                  <ClipboardCheck size={11} /> Notes
                </p>
                <textarea
                  value={newTraining.notes}
                  onChange={e => setNewTraining({ ...newTraining, notes: e.target.value })}
                  rows={3}
                  placeholder="Any additional context, observations, or follow-up actions..."
                  style={{
                    width: '100%', padding: '14px 16px',
                    background: dk.inputBg, border: `1.5px solid ${dk.inputBorder}`,
                    borderRadius: 14, fontSize: 13, fontWeight: 500,
                    color: dk.text, outline: 'none', resize: 'vertical',
                    fontFamily: 'inherit', lineHeight: 1.6,
                    transition: 'all .2s',
                  }}
                  onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                  onBlur={e => e.target.style.borderColor = dk.inputBorder}
                />
              </div>
            </div>

            {/* ── Action Buttons ── */}
            <div style={{
              display: 'flex', gap: 12, paddingTop: 8,
              borderTop: `1px solid ${dk.divider}`,
              marginTop: 4,
            }}>
              <button
                onClick={() => setShowAdd(false)}
                style={{
                  flex: 1, padding: '15px 0', borderRadius: 14,
                  background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                  border: `1px solid ${dk.inputBorder}`,
                  color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  transition: 'all .2s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.7)' : '#e2e8f0'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9'
                }}
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={saving || !newTraining.staff_id || !newTraining.training_type}
                style={{
                  flex: 2, padding: '15px 0', borderRadius: 14, border: 'none',
                  background: (!newTraining.staff_id || !newTraining.training_type)
                    ? (isDark ? 'rgba(51,65,85,0.4)' : '#e2e8f0')
                    : `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                  color: (!newTraining.staff_id || !newTraining.training_type)
                    ? dk.textFaint
                    : 'white',
                  fontSize: 14, fontWeight: 700, cursor: 'pointer',
                  boxShadow: (newTraining.staff_id && newTraining.training_type)
                    ? `0 8px 28px -6px ${c.primary}50`
                    : 'none',
                  opacity: saving ? 0.6 : 1,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                  transition: 'all .3s cubic-bezier(.16,1,.3,1)',
                  transform: (newTraining.staff_id && newTraining.training_type) ? 'scale(1)' : 'scale(0.98)',
                }}
                onMouseEnter={e => {
                  if (newTraining.staff_id && newTraining.training_type) {
                    e.currentTarget.style.transform = 'translateY(-1px) scale(1.01)'
                    e.currentTarget.style.boxShadow = `0 12px 36px -6px ${c.primary}60`
                  }
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = (newTraining.staff_id && newTraining.training_type) ? 'scale(1)' : 'scale(0.98)'
                  e.currentTarget.style.boxShadow = (newTraining.staff_id && newTraining.training_type) ? `0 8px 28px -6px ${c.primary}50` : 'none'
                }}
              >
                {saving ? (
                  <><Loader2 size={16} className="animate-spin" /> Saving...</>
                ) : (
                  <>
                    <GraduationCap size={16} />
                    {(!newTraining.staff_id || !newTraining.training_type)
                      ? 'Select staff & type to continue'
                      : 'Add Training Record'
                    }
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      </Modal>

    </div>
  )
}