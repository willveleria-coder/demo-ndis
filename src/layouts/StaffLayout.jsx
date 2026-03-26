import { useState, useEffect, useRef, useCallback } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import {
  Home, Calendar, FileText, Clock, User, Bell, Menu, X, LogOut,
  Briefcase, CheckCircle, Activity, ArrowLeftRight, Megaphone,
  GraduationCap, ArrowLeft, Settings, Search, ChevronDown,
  ChevronRight, ExternalLink, LayoutGrid, Heart, Palette,
  Sun, Moon, Check, Eye, Trophy, AlertTriangle, Pill, CheckSquare, ArrowRight,
} from 'lucide-react'
import { useStaff } from '../context/StaffContext'
import { brand } from '../config/branding'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme, ACCENT_PRESETS } from '../context/ThemeContext'


/* ─────────────────────────────────────────────
   NAV STRUCTURE
   ───────────────────────────────────────────── */

const menuSections = [
  {
    label: 'Main',
    icon: Home,
    items: [
      { id: 'dashboard', path: '/staff/dashboard', label: 'Dashboard', icon: Home },
      { id: 'shifts', path: '/staff/shifts', label: 'My Shifts', icon: Calendar },
      { id: 'notes', path: '/staff/notes', label: 'Notes', icon: FileText },
      { id: 'calendar', path: '/staff/calendar', label: 'Calendar', icon: Calendar },
    ],
  },
  {
    label: 'Work',
    icon: Briefcase,
    items: [
      { id: 'participant-docs', path: '/staff/participant-docs', label: 'Participant Docs', icon: Briefcase },
      { id: 'availability', path: '/staff/availability', label: 'Availability', icon: Clock },
      { id: 'timeoff', path: '/staff/time-off', label: 'Time Off', icon: Clock },
      { id: 'forms', path: '/staff/forms', label: 'Forms', icon: CheckCircle },
      { id: 'incidents', path: '/staff/incidents', label: 'Incidents', icon: AlertTriangle },
      { id: 'medications', path: '/staff/medications', label: 'Medications', icon: Pill },
      { id: 'tasks', path: '/staff/tasks', label: 'Shift Tasks', icon: CheckSquare },
      { id: 'handover', path: '/staff/handover', label: 'Handover', icon: ArrowRight },
    ],
  },
  {
    label: 'Communication',
    icon: Megaphone,
    items: [
      { id: 'swaps', path: '/staff/swaps', label: 'Shift Swaps', icon: ArrowLeftRight },
      { id: 'broadcasts', path: '/staff/broadcasts', label: 'Broadcasts', icon: Megaphone },
      { id: 'training', path: '/staff/training', label: 'Training', icon: GraduationCap },
      { id: 'profile', path: '/staff/profile', label: 'My Profile', icon: User },
    ],
  },
  {
    label: 'Engage',
    icon: Trophy,
    items: [
      { id: 'leaderboard', path: '/staff/leaderboard', label: 'Leaderboard', icon: Trophy },
    ],
  },
  {
    label: 'Travel & Safety',
    icon: Briefcase,
    items: [
      { id: 'mileage', path: '/staff/mileage', label: 'Mileage', icon: Clock },
      { id: 'expenses', path: '/staff/expenses', label: 'Expenses', icon: CheckCircle },
      { id: 'safety', path: '/staff/safety', label: 'Lone Worker', icon: AlertTriangle },
    ],
  },
]

const allNavItems = menuSections.flatMap(s => s.items)

/* Sidebar constants */
const SIDEBAR_COLLAPSED = 68
const SIDEBAR_EXPANDED = 252


/* ─────────────────────────────────────────────
   THEME DROPDOWN (inline, matches admin)
   ───────────────────────────────────────────── */

function ThemeDropdownInline({ dk, c, isDark: isDarkProp }) {
  const { mode, setMode, isDark, accentId, setAccentId } = useTheme()
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    function h(e) { if (ref.current && !ref.current.contains(e.target)) setOpen(false) }
    document.addEventListener('mousedown', h)
    return () => document.removeEventListener('mousedown', h)
  }, [])

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        className="nav-btn"
        title="Customise appearance"
        style={{
          width: 40, height: 40, borderRadius: 12,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          background: open
            ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`
            : isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}0a`,
          color: open ? '#fff' : dk.textMuted,
          border: open ? 'none' : `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}15`}`,
          boxShadow: open ? `0 4px 16px -4px ${c.staff}50` : 'none',
          cursor: 'pointer',
        }}
      >
        <Palette size={16} />
      </button>

      {open && (
        <div className="notif-enter" style={{
          position: 'absolute', right: 0, top: 50, width: 280,
          borderRadius: 18, overflow: 'hidden', zIndex: 100,
          background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)',
          border: `1px solid ${isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.8)'}`,
          boxShadow: isDark ? '0 20px 60px -12px rgba(0,0,0,0.5)' : `0 20px 60px -12px ${c.staff}15`,
        }}>
          <div style={{
            padding: '14px 18px', display: 'flex', alignItems: 'center', gap: 8,
            borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)'}`,
          }}>
            <Palette size={14} style={{ color: c.staff }} />
            <span style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>Customise Theme</span>
          </div>

          <div style={{ padding: '12px 16px' }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dk.textFaint, marginBottom: 8 }}>Appearance</p>
            <div style={{ display: 'flex', gap: 6 }}>
              {[{ id: 'light', label: 'Light', icon: Sun }, { id: 'dark', label: 'Dark', icon: Moon }].map(m => {
                const isA = mode === m.id
                return (
                  <button key={m.id} onClick={() => setMode(m.id)} style={{
                    flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    gap: 6, padding: '9px 0', borderRadius: 11, border: 'none', fontSize: 12, fontWeight: 600, cursor: 'pointer',
                    background: isA ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : isDark ? 'rgba(51,65,85,0.4)' : '#f1f5f9',
                    color: isA ? 'white' : dk.textMuted,
                    boxShadow: isA ? `0 3px 12px -3px ${c.staff}40` : 'none',
                  }}>
                    <m.icon size={14} /> {m.label}
                  </button>
                )
              })}
            </div>
          </div>

          <div style={{ padding: '12px 16px 16px', borderTop: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)'}` }}>
            <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: dk.textFaint, marginBottom: 8 }}>Accent Colour</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
              {ACCENT_PRESETS.map(preset => {
                const isA = accentId === preset.id
                const col = preset.hex || brand.colors.primary
                return (
                  <button key={preset.id} onClick={() => setAccentId(preset.id)} style={{
                    display: 'flex', alignItems: 'center', gap: 7,
                    padding: '8px 10px', borderRadius: 10, border: 'none', cursor: 'pointer',
                    background: isA ? `${col}15` : 'transparent',
                    outline: isA ? `2px solid ${col}` : 'none', outlineOffset: -1,
                  }}
                    onMouseEnter={e => { if (!isA) e.currentTarget.style.background = isDark ? 'rgba(51,65,85,0.3)' : '#f8fafc' }}
                    onMouseLeave={e => { if (!isA) e.currentTarget.style.background = 'transparent' }}
                  >
                    <div style={{
                      width: 20, height: 20, borderRadius: '50%', flexShrink: 0, background: col,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      boxShadow: `0 2px 6px -2px ${col}50`,
                    }}>
                      {isA && <Check size={10} color="white" strokeWidth={3} />}
                    </div>
                    <span style={{ fontSize: 10, fontWeight: 600, color: isA ? col : dk.textMuted, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {preset.id === 'brand' ? 'Default' : preset.label?.split(' ').pop()}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}


/* ─────────────────────────────────────────────
   SIDEBAR TOOLTIP
   ───────────────────────────────────────────── */

function SidebarTooltip({ label, visible, top }) {
  if (!visible) return null
  return (
    <div style={{
      position: 'fixed', left: SIDEBAR_COLLAPSED + 8, top,
      padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600,
      background: 'rgba(15,23,42,0.92)', color: '#e2e8f0',
      backdropFilter: 'blur(8px)', WebkitBackdropFilter: 'blur(8px)',
      boxShadow: '0 4px 16px -4px rgba(0,0,0,0.3)',
      whiteSpace: 'nowrap', pointerEvents: 'none', zIndex: 70,
      animation: 'tooltipIn .15s cubic-bezier(.16,1,.3,1) forwards',
    }}>
      {label}
    </div>
  )
}


/* ─────────────────────────────────────────────
   STAFF LAYOUT
   ───────────────────────────────────────────── */

const StaffLayout = () => {
  const [menuOpen, setMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [menuSearch, setMenuSearch] = useState('')
  const [collapsedSections, setCollapsedSections] = useState({})
  const [sidebarHover, setSidebarHover] = useState(false)
  const [tooltipItem, setTooltipItem] = useState(null)
  const [tooltipTop, setTooltipTop] = useState(0)
  const notifRef = useRef(null)
  const menuSearchRef = useRef(null)
  const sidebarTimerRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, staffProfile, staffName, initials, handleLogout, pendingNotes, inProgressShift, upcomingShifts } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const isDemo = brand.style === 'demo'

  const dk = {
    pageBg: isDark ? '#0f172a' : '#eff6ff',
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    menuBg: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.92)',
    menuBorder: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.8)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'rgba(255,255,255,0.9)',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    hover: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(59,130,246,0.06)',
    sidebarBg: isDark ? 'rgba(15,23,42,0.92)' : 'rgba(255,255,255,0.72)',
    sidebarBorder: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)',
  }

  const displayEmail = staffProfile?.email || ''
  const demoBannerH = isDemo ? 32 : 0

  useEffect(() => { setMenuOpen(false); setMenuSearch('') }, [location.pathname])
  useEffect(() => { if (menuOpen && menuSearchRef.current) setTimeout(() => menuSearchRef.current?.focus(), 350) }, [menuOpen])
  useEffect(() => {
    function h(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  /* Sidebar hover with delay */
  const handleSidebarEnter = useCallback(() => {
    clearTimeout(sidebarTimerRef.current)
    sidebarTimerRef.current = setTimeout(() => setSidebarHover(true), 200)
  }, [])
  const handleSidebarLeave = useCallback(() => {
    clearTimeout(sidebarTimerRef.current)
    setSidebarHover(false)
    setTooltipItem(null)
  }, [])

  const toggleSection = (label) => setCollapsedSections(prev => ({ ...prev, [label]: !prev[label] }))
  const filteredSections = menuSearch
    ? menuSections.map(s => ({ ...s, items: s.items.filter(i => i.label.toLowerCase().includes(menuSearch.toLowerCase())) })).filter(s => s.items.length > 0)
    : menuSections

  /* Build notifications */
  const notifications = []
  const todayStr = new Date().toISOString().split('T')[0]
  pendingNotes.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `note-${s.id}`, icon: FileText, color: '#f59e0b', title: 'Shift note overdue', desc: pName, link: '/staff/notes', urgent: true })
  })
  upcomingShifts.filter(s => s.shift_date === todayStr).forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `shift-${s.id}`, icon: Calendar, color: '#10b981', title: 'Shift today', desc: pName, link: '/staff/shifts' })
  })
  if (inProgressShift) {
    notifications.push({ id: 'active', icon: Activity, color: '#10b981', title: 'Shift in progress', desc: "Don't forget to clock out", link: '/staff/shifts' })
  }
  const notifCount = notifications.filter(n => n.urgent).length || notifications.length

  /* Flat items for sidebar icon view */
  const sidebarItems = menuSections.flatMap((s, si) =>
    s.items.map((item, i) => ({ ...item, sectionIdx: si, isFirst: i === 0 && si > 0 }))
  )

  const expanded = sidebarHover

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: isDark ? '#0f172a' : 'linear-gradient(135deg, #eff6ff, #f0f9ff)' }}>
      <img src="/logo.png" alt={brand.appName} className="h-16 object-contain animate-pulse" />
      <p className="mt-4 text-sm font-medium animate-pulse" style={{ color: dk.textMuted }}>Loading your portal...</p>
    </div>
  )

  return (
    <div className="min-h-screen transition-colors" style={{ backgroundColor: dk.pageBg }}>
      {/* ═══ STATUS BAR FILL — z65, matches MainLayout exactly ═══ */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 65, height: 'env(safe-area-inset-top, 0px)', background: isDemo ? `linear-gradient(90deg, ${c.staff}, ${c.staffHover})` : (isDark ? '#0f172a' : '#eff6ff') }} />

      <style>{`
        @keyframes slideIn{from{opacity:0;transform:translateX(-14px)}to{opacity:1;transform:translateX(0)}}
        @keyframes notifSlide{from{opacity:0;transform:translateY(-8px) scale(.96)}to{opacity:1;transform:translateY(0) scale(1)}}
        @keyframes demoShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes demoPulse{0%,100%{opacity:1}50%{opacity:.5}}
        @keyframes tooltipIn{from{opacity:0;transform:translateX(-4px)}to{opacity:1;transform:translateX(0)}}
        @keyframes sidebarFadeIn{from{opacity:0;transform:translateX(-6px)}to{opacity:1;transform:translateX(0)}}
        .menu-item-enter{animation:slideIn .3s cubic-bezier(.16,1,.3,1) forwards;opacity:0}
        .notif-enter{animation:notifSlide .25s cubic-bezier(.16,1,.3,1) forwards}
        .glass-nav{backdrop-filter:blur(24px);-webkit-backdrop-filter:blur(24px)}
        .no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        .nav-btn{transition:all .2s cubic-bezier(.16,1,.3,1)}.nav-btn:hover{transform:translateY(-1px)}.nav-btn:active{transform:translateY(0) scale(.97)}
        .sidebar-label-enter{animation:sidebarFadeIn .2s cubic-bezier(.16,1,.3,1) forwards;animation-delay:.05s;opacity:0}
      `}</style>

      {/* ═══ DEMO BANNER — z60, matches MainLayout exactly ═══ */}
      {isDemo && (
        <div style={{
          position: 'fixed', top: 'env(safe-area-inset-top, 0px)', left: 0, right: 0, zIndex: 60, height: demoBannerH,
          background: `linear-gradient(90deg, ${c.staff}, ${c.staffHover}, #3b82f6, #06b6d4)`,
          backgroundSize: '300% 100%', animation: 'demoShimmer 8s linear infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 14px', gap: 6,
        }}>
          <style>{`
            @media (max-width: 639px) { .staff-demo-desktop { display: none !important; } }
            @media (min-width: 640px) { .staff-demo-mobile { display: none !important; } }
          `}</style>
          <div className="staff-demo-mobile" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'demoPulse 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 11, fontWeight: 700, color: 'white' }}>DEMO MODE</span>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>— Sample Data</span>
            </div>
          </div>
          <div className="staff-demo-desktop" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', width: '100%' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'demoPulse 2s ease-in-out infinite', flexShrink: 0 }} />
              <span style={{ fontSize: 12, fontWeight: 700, color: 'white', letterSpacing: '0.06em' }}>DEMO MODE</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Sample Data</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>·</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Powered by Veleria</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.7)' }}>Questions? Contact us</span>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>·</span>
              <a href="https://veleria.com.au" target="_blank" rel="noopener noreferrer" style={{ fontSize: 12, fontWeight: 600, color: 'white', textDecoration: 'none', borderBottom: '1px solid rgba(255,255,255,0.3)' }}>veleria.com.au</a>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>·</span>
              <a href="mailto:contact@veleria.com.au" style={{ fontSize: 12, fontWeight: 600, color: 'white', textDecoration: 'none' }}>contact@veleria.com.au</a>
              <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.5)' }}>·</span>
              <a href="tel:0478333107" style={{ fontSize: 12, fontWeight: 600, color: 'white', textDecoration: 'none' }}>0478 333 107</a>
            </div>
          </div>
        </div>
      )}

      {/* ═══ DESKTOP SIDEBAR (lg+ only) — z51, matches MainLayout exactly ═══ */}
      <div
        className="hidden lg:flex glass-nav no-scrollbar"
        onMouseEnter={handleSidebarEnter}
        onMouseLeave={handleSidebarLeave}
        style={{
          position: 'fixed', left: 0, top: `calc(${demoBannerH}px + env(safe-area-inset-top, 0px))`, bottom: 0, zIndex: 51,
          width: expanded ? SIDEBAR_EXPANDED : SIDEBAR_COLLAPSED,
          flexDirection: 'column',
          overflowY: 'auto', overflowX: 'hidden',
          background: dk.sidebarBg,
          borderRight: `1px solid ${dk.sidebarBorder}`,
          boxShadow: expanded
            ? (isDark ? '6px 0 40px -6px rgba(0,0,0,0.4)' : `6px 0 40px -6px ${c.staff}08`)
            : 'none',
          transition: 'width .3s cubic-bezier(.16,1,.3,1), box-shadow .3s ease',
        }}
      >
        {inProgressShift && (
          <div style={{
            margin: expanded ? '10px 10px 0' : '10px 8px 0',
            display: 'flex', alignItems: 'center', justifyContent: expanded ? 'flex-start' : 'center',
            gap: 8, padding: expanded ? '8px 12px' : '8px 0',
            borderRadius: 10,
            background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)',
            border: '1px solid rgba(16,185,129,0.2)',
          }}>
            <span className="relative flex h-2.5 w-2.5" style={{ flexShrink: 0 }}>
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            {expanded && <span className="sidebar-label-enter" style={{ fontSize: 11, fontWeight: 700, color: '#10b981' }}>On Shift</span>}
          </div>
        )}

        <div style={{ padding: expanded ? '10px 10px 0' : '10px 8px 0' }}>
          <button onClick={() => navigate('/')} style={{
            display: 'flex', alignItems: 'center', gap: 10,
            padding: expanded ? '8px 12px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center',
            borderRadius: 12, border: 'none', cursor: 'pointer', width: '100%',
            background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
            color: 'white', transition: 'all .2s', minHeight: 40,
            boxShadow: `0 4px 14px -4px ${c.staff}40`,
          }}>
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)' }}>
              <ArrowLeft size={16} style={{ color: 'white' }} />
            </div>
            {expanded && <span className="sidebar-label-enter" style={{ fontSize: 13, fontWeight: 700 }}>Back to Landing</span>}
          </button>
        </div>

        <div style={{ flex: 1, minHeight: 0, padding: expanded ? '10px 10px 6px' : '10px 8px 6px', display: 'flex', flexDirection: 'column', gap: 1, overflowY: 'auto', overflowX: 'hidden' }} className="no-scrollbar">
          {sidebarItems.map((item, idx) => {
            const active = location.pathname.startsWith(item.path)
            const badgeCount = item.id === 'notes' ? pendingNotes.length : 0
            return (
              <div key={item.id}>
                {item.isFirst && (
                  <div style={{ height: 1, margin: expanded ? '6px 8px' : '6px 6px', background: dk.divider }} />
                )}
                <NavLink
                  to={item.path}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: expanded ? '8px 12px' : '8px 0',
                    justifyContent: expanded ? 'flex-start' : 'center',
                    borderRadius: 12, textDecoration: 'none', position: 'relative',
                    background: active ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                    color: active ? '#fff' : dk.textMuted,
                    boxShadow: active ? `0 4px 14px -4px ${c.staff}40` : 'none',
                    transition: 'all .2s cubic-bezier(.16,1,.3,1)', minHeight: 40,
                  }}
                  onMouseEnter={e => {
                    if (!active) { e.currentTarget.style.background = dk.hover; e.currentTarget.style.color = dk.text }
                    if (!expanded) { const rect = e.currentTarget.getBoundingClientRect(); setTooltipItem(item.label); setTooltipTop(rect.top + rect.height / 2 - 14) }
                  }}
                  onMouseLeave={e => {
                    if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted }
                    if (!expanded) setTooltipItem(null)
                  }}
                >
                  <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(51,65,85,0.3)' : `${c.staff}06`, transition: 'background .2s' }}>
                    <item.icon size={16} strokeWidth={active ? 2.5 : 2} style={{ color: active ? '#fff' : dk.textFaint }} />
                  </div>
                  {expanded && (
                    <span className="sidebar-label-enter" style={{ fontSize: 13, fontWeight: active ? 700 : 500, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', flex: 1 }}>
                      {item.label}
                    </span>
                  )}
                  {badgeCount > 0 && (
                    <div style={{ position: expanded ? 'relative' : 'absolute', top: expanded ? 'auto' : 4, right: expanded ? 'auto' : 4, minWidth: 18, height: 18, borderRadius: 999, fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', background: active ? 'rgba(255,255,255,0.3)' : '#ef4444', color: 'white' }}>
                      {badgeCount}
                    </div>
                  )}
                </NavLink>
              </div>
            )
          })}
        </div>

        <div style={{ padding: expanded ? '8px 10px 14px' : '8px 8px 14px', borderTop: `1px solid ${dk.divider}`, display: 'flex', flexDirection: 'column', gap: 2 }}>
          <NavLink to="/staff/profile" style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: expanded ? '8px 12px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center', borderRadius: 12, textDecoration: 'none',
            color: dk.textMuted, transition: 'all .2s', minHeight: 40,
            background: location.pathname.startsWith('/staff/profile') ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
            ...(location.pathname.startsWith('/staff/profile') && { color: '#fff', boxShadow: `0 4px 14px -4px ${c.staff}40` }),
          }}
            onMouseEnter={e => { if (!location.pathname.startsWith('/staff/profile')) { e.currentTarget.style.background = dk.hover; e.currentTarget.style.color = dk.text } }}
            onMouseLeave={e => { if (!location.pathname.startsWith('/staff/profile')) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted } }}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(51,65,85,0.3)' : `${c.staff}06` }}>
              <User size={16} style={{ color: dk.textFaint }} />
            </div>
            {expanded && <span className="sidebar-label-enter" style={{ fontSize: 13, fontWeight: 500 }}>My Profile</span>}
          </NavLink>

          <button onClick={handleLogout} style={{
            display: 'flex', alignItems: 'center', gap: 10, padding: expanded ? '8px 12px' : '8px 0',
            justifyContent: expanded ? 'flex-start' : 'center', borderRadius: 12, border: 'none', cursor: 'pointer',
            background: 'transparent', color: '#ef4444', transition: 'all .2s', minHeight: 40,
          }}
            onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)'}
            onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
          >
            <div style={{ width: 32, height: 32, borderRadius: 10, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)' }}>
              <LogOut size={16} style={{ color: '#ef4444' }} />
            </div>
            {expanded && <span className="sidebar-label-enter" style={{ fontSize: 13, fontWeight: 500 }}>Sign Out</span>}
          </button>

          {expanded && (<>
            <div style={{ height: 1, margin: '4px 6px', background: dk.divider }} />
            <button onClick={() => setMenuOpen(true)} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '6px 10px', justifyContent: 'flex-start', borderRadius: 12, border: 'none', cursor: 'pointer', background: 'transparent', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = dk.hover} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 36, height: 36, borderRadius: 11, flexShrink: 0, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#fff', fontSize: 12, fontWeight: 800, boxShadow: `0 3px 10px -3px ${c.staff}40`, border: `2px solid ${isDark ? 'rgba(255,255,255,0.1)' : 'rgba(255,255,255,0.6)'}` }}>
                {initials}
              </div>
              <div className="sidebar-label-enter" style={{ flex: 1, minWidth: 0, textAlign: 'left' }}>
                <p style={{ fontSize: 12, fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staffName}</p>
                <p style={{ fontSize: 10, color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</p>
              </div>
            </button>
          </>)}

          {expanded && (
            <div className="sidebar-label-enter" style={{ marginTop: 6, textAlign: 'center' }}>
              <a href="https://veleria.com.au" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
                Built by <span style={{ color: c.staff, fontWeight: 700 }}>Veleria</span> <ExternalLink size={8} style={{ color: dk.textFaint }} />
              </a>
            </div>
          )}
        </div>
      </div>

      {!expanded && tooltipItem && <SidebarTooltip label={tooltipItem} visible top={tooltipTop} />}

      {/* ═══ TOP NAV BAR — z-50 class, matches MainLayout exactly ═══ */}
      <div className="staff-topbar-wrap fixed right-0 z-50" style={{ top: `calc(${demoBannerH}px + env(safe-area-inset-top, 0px))`, left: 0 }}>
        <style>{`
          @media (min-width: 1024px) { .staff-topbar-wrap { left: ${SIDEBAR_COLLAPSED}px !important; } }
          @media (min-width: 1024px) { .staff-hamburger { display: none !important; } }
          @media (max-width: 639px) { .staff-avatar-btn { display: none !important; } }
          @media (min-width: 640px) { .staff-theme-mobile { display: none !important; } }
        `}</style>
        <div className="glass-nav" style={{
          background: isDark ? 'rgba(15,23,42,0.82)' : 'rgba(255,255,255,0.55)',
          borderBottom: `1px solid ${dk.menuBorder}`,
          boxShadow: isDark ? '0 4px 32px -4px rgba(0,0,0,0.3)' : `0 4px 32px -4px ${c.staff}08`,
        }}>
          <div style={{ height: 56, maxWidth: 1600, margin: '0 auto', padding: '0 12px', display: 'flex', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 90, flexShrink: 0 }}>
              <div className="staff-hamburger" style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                <button onClick={() => setMenuOpen(!menuOpen)} className="nav-btn" style={{
                  width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: menuOpen ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}0a`,
                  color: menuOpen ? '#fff' : c.staff,
                  border: menuOpen ? 'none' : `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}15`}`,
                  boxShadow: menuOpen ? `0 4px 16px -4px ${c.staff}50` : 'none', cursor: 'pointer',
                }}>
                  <div style={{ transition: 'all .3s cubic-bezier(.16,1,.3,1)', transform: menuOpen ? 'rotate(90deg)' : 'rotate(0)' }}>
                    {menuOpen ? <X size={16} /> : <Menu size={16} />}
                  </div>
                </button>
                {inProgressShift && (
                  <div style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 8px', borderRadius: 8, background: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.08)', border: '1px solid rgba(16,185,129,0.2)' }}>
                    <span className="relative flex h-2 w-2">
                      <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                      <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
                    </span>
                    <span style={{ fontSize: 9, fontWeight: 700, color: '#10b981' }}>Live</span>
                  </div>
                )}
              </div>
            </div>

            <NavLink to="/staff/dashboard" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textDecoration: 'none', flex: 1, minWidth: 0, height: '100%' }}>
              <h1 style={{ fontSize: 16, fontWeight: 800, letterSpacing: '-0.02em', lineHeight: 1.1, color: dk.text, whiteSpace: 'nowrap' }}>VelCare Demo</h1>
              <p style={{ fontSize: 8, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.staff, marginTop: 2 }}>Staff Portal</p>
            </NavLink>

            <div style={{ display: 'flex', alignItems: 'center', gap: 6, width: 90, flexShrink: 0 }}>
              <div className="staff-theme-mobile"><ThemeDropdownInline dk={dk} c={c} isDark={isDark} /></div>
              <div className="staff-avatar-btn"><ThemeDropdownInline dk={dk} c={c} isDark={isDark} /></div>

              <div ref={notifRef} style={{ position: 'relative' }}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="nav-btn" style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: notifOpen ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}0a`,
                  color: notifOpen ? '#fff' : dk.textMuted,
                  border: notifOpen ? 'none' : `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : `${c.staff}15`}`,
                  boxShadow: notifOpen ? `0 4px 16px -4px ${c.staff}50` : 'none', cursor: 'pointer', position: 'relative',
                }}>
                  <Bell size={17} />
                  {notifCount > 0 && (
                    <span style={{ position: 'absolute', top: -3, right: -3, minWidth: 17, height: 17, borderRadius: 999, background: 'linear-gradient(135deg,#ef4444,#f87171)', color: 'white', fontSize: 9, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '0 4px', boxShadow: '0 2px 8px -2px rgba(239,68,68,0.5)', border: `2px solid ${isDark ? '#0f172a' : '#fff'}` }}>{notifCount > 9 ? '9+' : notifCount}</span>
                  )}
                </button>

                {notifOpen && (
                  <div className="notif-enter glass-nav" style={{ position: 'absolute', right: 0, top: 50, width: 380, maxWidth: 'calc(100vw - 2rem)', borderRadius: 20, overflow: 'hidden', zIndex: 100, background: dk.menuBg, border: `1px solid ${dk.menuBorder}`, boxShadow: isDark ? '0 20px 60px -12px rgba(0,0,0,0.5)' : `0 20px 60px -12px ${c.staff}15` }}>
                    <div style={{ padding: '14px 18px', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Bell size={15} color="white" /><span style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>Notifications</span></div>
                      <span style={{ fontSize: 10, fontWeight: 700, padding: '3px 10px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', color: 'white' }}>{notifCount} active</span>
                    </div>
                    <div style={{ maxHeight: 340, overflowY: 'auto' }} className="no-scrollbar">
                      {notifications.length > 0 ? notifications.map((n, i) => (
                        <button key={n.id} onClick={() => { setNotifOpen(false); navigate(n.link) }} className="menu-item-enter" style={{ width: '100%', padding: '12px 18px', display: 'flex', alignItems: 'flex-start', gap: 12, textAlign: 'left', cursor: 'pointer', background: 'transparent', border: 'none', borderBottom: `1px solid ${dk.divider}`, animationDelay: `${i * 30}ms` }}
                          onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                          <div style={{ width: 34, height: 34, borderRadius: 10, flexShrink: 0, background: `${n.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><n.icon size={16} style={{ color: n.color }} /></div>
                          <div style={{ flex: 1, minWidth: 0 }}>
                            <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>{n.title}</p>
                            <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>{n.desc}</p>
                          </div>
                          {n.urgent && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444', flexShrink: 0, marginTop: 6 }} />}
                        </button>
                      )) : (
                        <div style={{ padding: '44px 20px', textAlign: 'center' }}>
                          <div style={{ width: 48, height: 48, borderRadius: 14, margin: '0 auto 10px', background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><CheckCircle size={22} style={{ color: '#10b981' }} /></div>
                          <p style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ═══ MOBILE MENU OVERLAY — z55, inset 0, matches MainLayout exactly ═══ */}
      <style>{`
        @media (min-width: 1024px) { .staff-mobile-menu, .staff-mobile-overlay { display: none !important; } }
      `}</style>
      {menuOpen && <style>{`body { overflow: hidden !important; }`}</style>}
      <div className="staff-mobile-overlay" style={{
        position: 'fixed', inset: 0, zIndex: 55,
        background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
        backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
        opacity: menuOpen ? 1 : 0, pointerEvents: menuOpen ? 'auto' : 'none',
        transition: 'opacity .3s cubic-bezier(.16,1,.3,1)',
      }} onClick={() => setMenuOpen(false)} />

      {/* ═══ MOBILE SLIDE-OUT MENU — z56, top = banner + safe area, matches MainLayout exactly ═══ */}
      <div className="staff-mobile-menu no-scrollbar glass-nav" style={{
        position: 'fixed', left: 0, top: `calc(${demoBannerH}px + env(safe-area-inset-top, 0px))`, bottom: 0, zIndex: 56,
        width: 300, overflowY: 'auto',
        background: dk.menuBg, borderRight: `1px solid ${dk.menuBorder}`,
        boxShadow: menuOpen ? (isDark ? '12px 0 60px -12px rgba(0,0,0,0.5)' : `12px 0 60px -12px ${c.staff}12`) : 'none',
        transform: menuOpen ? 'translateX(0)' : 'translateX(-100%)',
        transition: 'transform .35s cubic-bezier(.16,1,.3,1)',
      }}>
        <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${dk.divider}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <img src="/logo.png" alt={brand.appName} style={{ width: 38, height: 38, objectFit: 'contain' }} />
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-0.02em', color: dk.text }}>VelCare Demo</h2>
              <p style={{ fontSize: 9, fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: c.staff }}>Staff Portal</p>
            </div>
          </div>
          <button onClick={() => setMenuOpen(false)} className="nav-btn" style={{ width: 32, height: 32, borderRadius: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)', color: dk.textMuted, border: 'none', cursor: 'pointer' }}>
            <X size={16} />
          </button>
        </div>

        <div style={{ padding: '12px 14px 4px' }}>
          <button onClick={() => { setMenuOpen(false); navigate('/') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 8, padding: '11px 14px', borderRadius: 13, border: 'none', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px -4px ${c.staff}50` }}>
            <ArrowLeft size={15} /> Back to Landing
          </button>
        </div>

        {inProgressShift && (
          <div style={{ margin: '10px 14px 0', display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12, background: isDark ? 'rgba(16,185,129,0.12)' : 'rgba(16,185,129,0.06)', border: '1px solid rgba(16,185,129,0.2)' }}>
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative h-2.5 w-2.5 rounded-full bg-emerald-500" />
            </span>
            <span style={{ fontSize: 12, fontWeight: 700, color: '#10b981' }}>Currently On Shift</span>
          </div>
        )}

        <div style={{ padding: '10px 14px 6px' }}>
          <div style={{ position: 'relative' }}>
            <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: dk.textFaint }} />
            <input ref={menuSearchRef} value={menuSearch} onChange={e => setMenuSearch(e.target.value)} placeholder="Search pages..."
              style={{ width: '100%', padding: '10px 12px 10px 34px', borderRadius: 11, fontSize: 13, fontWeight: 500, background: dk.inputBg, border: `1px solid ${dk.inputBorder}`, color: dk.text, outline: 'none' }}
              onFocus={e => e.target.style.borderColor = c.staff} onBlur={e => e.target.style.borderColor = dk.inputBorder}
            />
            {menuSearch && <button onClick={() => setMenuSearch('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', width: 20, height: 20, borderRadius: 6, border: 'none', background: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: dk.textFaint, cursor: 'pointer' }}><X size={10} /></button>}
          </div>
        </div>

        <nav style={{ padding: '6px 10px 10px' }}>
          {filteredSections.map((section, si) => {
            const isCol = collapsedSections[section.label] && !menuSearch
            const SI = section.icon || LayoutGrid
            return (
              <div key={section.label}>
                {si > 0 && <div style={{ height: 1, margin: '8px 8px', background: dk.divider }} />}
                <button onClick={() => toggleSection(section.label)} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 6, padding: '8px 10px 6px', background: 'none', border: 'none', cursor: 'pointer' }}>
                  <SI size={11} style={{ color: c.staff, opacity: 0.6 }} />
                  <span style={{ fontSize: 10, fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase', color: dk.textFaint, flex: 1, textAlign: 'left' }}>{section.label}</span>
                  <span style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint, padding: '1px 6px', borderRadius: 6, background: dk.subtleBg }}>{section.items.length}</span>
                  <ChevronDown size={12} style={{ color: dk.textFaint, transition: 'transform .2s', transform: isCol ? 'rotate(-90deg)' : 'rotate(0)' }} />
                </button>
                {!isCol && <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                  {section.items.map((item, i) => {
                    const active = location.pathname.startsWith(item.path)
                    const badgeCount = item.id === 'notes' ? pendingNotes.length : 0
                    return (
                      <NavLink key={item.id} to={item.path} onClick={() => setMenuOpen(false)} className="menu-item-enter" style={{
                        animationDelay: menuOpen ? `${(si * 5 + i) * 20}ms` : '0ms',
                        display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11,
                        fontSize: 13, fontWeight: active ? 700 : 500, textDecoration: 'none',
                        background: active ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                        color: active ? 'white' : dk.textMuted,
                        boxShadow: active ? `0 4px 14px -4px ${c.staff}40` : 'none',
                      }}
                        onMouseEnter={e => { if (!active) { e.currentTarget.style.background = dk.hover; e.currentTarget.style.color = dk.text; e.currentTarget.style.transform = 'translateX(3px)' } }}
                        onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted; e.currentTarget.style.transform = 'translateX(0)' } }}
                      >
                        <div style={{ width: 30, height: 30, borderRadius: 8, flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,0.2)' : isDark ? 'rgba(51,65,85,0.3)' : `${c.staff}06` }}>
                          <item.icon size={15} strokeWidth={active ? 2.5 : 2} style={{ color: active ? 'white' : dk.textFaint }} />
                        </div>
                        <span style={{ flex: 1 }}>{item.label}</span>
                        {badgeCount > 0 && (
                          <span style={{ width: 20, height: 20, borderRadius: '50%', fontSize: 10, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', background: active ? 'rgba(255,255,255,0.3)' : '#ef4444', color: 'white' }}>{badgeCount}</span>
                        )}
                        {active && <ChevronRight size={13} style={{ color: 'rgba(255,255,255,0.5)' }} />}
                      </NavLink>
                    )
                  })}
                </div>}
              </div>
            )
          })}
        </nav>

        <div style={{ padding: '12px 14px', marginTop: 8, borderTop: `1px solid ${dk.divider}` }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: 12, borderRadius: 13, marginBottom: 10, background: isDark ? 'rgba(51,65,85,0.2)' : `${c.staff}04`, border: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : `${c.staff}10`}` }}>
            <div style={{ width: 38, height: 38, borderRadius: 11, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 12, fontWeight: 800, flexShrink: 0, boxShadow: `0 3px 10px -3px ${c.staff}40` }}>{initials}</div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{staffName}</p>
              <p style={{ fontSize: 11, color: dk.textFaint, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{displayEmail}</p>
            </div>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <button onClick={() => { setMenuOpen(false); navigate('/staff/profile') }} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, border: 'none', background: 'transparent', color: dk.textMuted, fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => { e.currentTarget.style.background = dk.hover; e.currentTarget.style.color = dk.text }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted }}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? 'rgba(51,65,85,0.3)' : `${c.staff}06`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><User size={15} style={{ color: dk.textFaint }} /></div> My Profile
            </button>
            <button onClick={handleLogout} style={{ width: '100%', display: 'flex', alignItems: 'center', gap: 10, padding: '9px 12px', borderRadius: 11, border: 'none', background: 'transparent', color: '#ef4444', fontSize: 13, fontWeight: 500, cursor: 'pointer' }}
              onMouseEnter={e => e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <div style={{ width: 30, height: 30, borderRadius: 8, background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={15} style={{ color: '#ef4444' }} /></div> Sign Out
            </button>
          </div>
          <div style={{ marginTop: 12, paddingTop: 12, textAlign: 'center', borderTop: `1px solid ${dk.divider}` }}>
            <a href="https://veleria.com.au" target="_blank" rel="noopener noreferrer" style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textDecoration: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}>
              Built by <span style={{ color: c.staff, fontWeight: 700 }}>Veleria</span> <ExternalLink size={8} style={{ color: dk.textFaint }} />
            </a>
          </div>
        </div>
      </div>

      {/* ═══ MAIN CONTENT ═══ */}
      <main className="staff-main" style={{
        paddingTop: `calc(${demoBannerH + 56}px + 8px + env(safe-area-inset-top, 0px))`,
        paddingBottom: `calc(16px + env(safe-area-inset-bottom, 0px))`,
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}>
        <style>{`
          @media (min-width: 1024px) {
            .staff-main { padding-left: calc(${SIDEBAR_COLLAPSED}px + 1.5rem) !important; padding-right: 1.5rem !important; }
          }
        `}</style>
        <Outlet />
      </main>
    </div>
  )
}

export default StaffLayout