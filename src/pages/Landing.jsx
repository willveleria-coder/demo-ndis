import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, Users, Calendar, FileText, Clock, AlertTriangle, Heart,
  ChevronRight, ChevronDown, Star, Check, Zap, BarChart3, DollarSign, Pill,
  GraduationCap, Upload, Bot, ArrowRight, Globe, Lock,
  TrendingUp, Activity, Megaphone, ArrowLeftRight, Target,
  BookOpen, Download, UserCog, LogIn, UserPlus, CheckCircle,
  Monitor, MapPin, Mic, Camera, FileSignature, X, Minus, Smartphone, Sparkles,
  Sun, Moon, Play, Eye, Phone, Mail, ArrowUpRight, Wand2,
  ClipboardList, Bell, MessageSquare, Palette,
  Layers, Radio, Fingerprint, Database,
  Home, Briefcase, Trophy, CheckSquare, ArrowDown,
  Car, Send, FolderOpen, PieChart, Settings,
  Link2, Timer, CreditCard, UserCheck,
  StickyNote, Search, AlertOctagon, Image as ImageIcon
} from 'lucide-react'
import { brand } from '../config/branding'


/* ═══════════════════════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════════════════════ */

const DS = {
  primary: '#7c3aed',
  primaryHover: '#a855f7',
  blue: '#3b82f6',
  blueLight: '#60a5fa',
  pink: '#ec4899',
  pinkDark: '#db2777',
  emerald: '#10b981',
  amber: '#f59e0b',
  red: '#ef4444',
  cyan: '#06b6d4',
  gradPrimary: 'linear-gradient(135deg, #7c3aed, #a855f7)',
  gradStaff: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
  gradFamily: 'linear-gradient(135deg, #ec4899, #db2777, #a855f7)',
  gradHero: 'linear-gradient(135deg, #7c3aed 0%, #a855f7 40%, #3b82f6 70%, #06b6d4 100%)',
}

const dk = (isDark) => ({
  text: isDark ? '#e2e8f0' : '#1f2937',
  textSoft: isDark ? '#cbd5e1' : '#374151',
  textMuted: isDark ? '#94a3b8' : '#6b7280',
  textFaint: isDark ? '#64748b' : '#9ca3af',
  bg: isDark ? '#0f172a' : '#f5f3ff',
  bg2: isDark ? '#1e293b' : '#ffffff',
  subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
  subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  glass: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)',
  glassBorder: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)',
  glassHover: isDark ? 'rgba(30,41,59,0.75)' : 'rgba(255,255,255,0.7)',
})


/* ═══════════════════════════════════════════════
   REUSABLE COMPONENTS
   ═══════════════════════════════════════════════ */

function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, ...p }) {
  const d = dk(isDark)
  return (
    <div
      className={`rounded-2xl border ${hover ? 'transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}
      style={{
        background: d.glass,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: d.glassBorder,
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 16px -4px rgba(0,0,0,0.06)',
        ...style,
      }}
      {...p}
    >{children}</div>
  )
}

function Orb({ color, size, top, left, right, bottom, delay = 0 }) {
  return (
    <div className="absolute rounded-full pointer-events-none" style={{
      width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left, right, bottom, opacity: 0.12,
      animation: `orbFloat ${6 + delay}s ease-in-out infinite`,
      animationDelay: `${delay}s`,
    }} />
  )
}

function AnimNum({ value, duration = 1200, suffix = '', prefix = '' }) {
  const [display, setDisplay] = useState(0)
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.3 })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  useEffect(() => {
    if (!visible) return
    const num = Number(value) || 0
    const start = Date.now()
    const step = () => {
      const p = Math.min((Date.now() - start) / duration, 1)
      setDisplay(Math.round((1 - Math.pow(1 - p, 3)) * num))
      if (p < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [visible, value, duration])
  return <span ref={ref}>{prefix}{display}{suffix}</span>
}

function TypeWriter({ texts }) {
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)
  useEffect(() => {
    const text = texts[idx]
    if (!deleting && charIdx < text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 35 + Math.random() * 25)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === text.length) {
      const t = setTimeout(() => setDeleting(true), 3000)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), 18)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) { setDeleting(false); setIdx(i => (i + 1) % texts.length) }
  }, [charIdx, deleting, idx, texts])
  return (
    <span>
      {texts[idx].slice(0, charIdx)}
      <span style={{ display: 'inline-block', width: 2, height: '1em', background: 'rgba(255,255,255,0.6)', marginLeft: 2, verticalAlign: 'middle', animation: 'blink 1s step-end infinite' }} />
    </span>
  )
}

function Reveal({ children, delay = 0, className = '' }) {
  const ref = useRef(null)
  const [visible, setVisible] = useState(false)
  useEffect(() => {
    const obs = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setVisible(true); obs.disconnect() } }, { threshold: 0.08, rootMargin: '0px 0px -30px 0px' })
    if (ref.current) obs.observe(ref.current)
    return () => obs.disconnect()
  }, [])
  return (
    <div ref={ref} className={className} style={{
      opacity: visible ? 1 : 0,
      transform: visible ? 'translateY(0)' : 'translateY(24px)',
      transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${delay}ms`,
    }}>{children}</div>
  )
}

function LiveClock() {
  const [t, setT] = useState(new Date())
  useEffect(() => { const i = setInterval(() => setT(new Date()), 1000); return () => clearInterval(i) }, [])
  return (
    <div style={{ textAlign: 'right' }}>
      <p style={{ fontSize: 13, fontWeight: 700, color: '#374151', fontVariantNumeric: 'tabular-nums' }}>
        {t.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </p>
      <p style={{ fontSize: 10, color: '#9ca3af', fontWeight: 500 }}>
        {t.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}
      </p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}


/* ═══════════════════════════════════════════════
   ALL FEATURES — Categorised by portal
   ═══════════════════════════════════════════════ */

const ADMIN_FEATURES = [
  { icon: Home, title: 'Dashboard', desc: 'Animated charts, live stats, shift activity feed, staff GPS map' },
  { icon: Users, title: 'Participants', desc: 'Full CRUD, NDIS plans, contact details, status management' },
  { icon: UserCog, title: 'Staff Management', desc: 'Profiles, qualifications, compliance tracking, document management' },
  { icon: Calendar, title: 'Roster', desc: 'Drag-and-drop rostering, recurring shifts, conflict detection' },
  { icon: Calendar, title: 'Calendar', desc: 'Monthly/weekly views with full shift overview' },
  { icon: Clock, title: 'Availability', desc: 'Staff availability grid with weekly patterns' },
  { icon: ArrowLeftRight, title: 'Shift Swaps', desc: 'Swap request management with admin approval workflow' },
  { icon: Shield, title: 'Compliance Dashboard', desc: 'Compliance score ring, expired docs, training gaps, incident tracking' },
  { icon: AlertTriangle, title: 'Incidents', desc: 'Incident management, severity levels, NDIS reportable flags' },
  { icon: Pill, title: 'Medications', desc: 'Medication register, PRN tracking, administration logs' },
  { icon: Target, title: 'Goals', desc: 'NDIS goal tracking with progress rings and Recharts charts' },
  { icon: AlertOctagon, title: 'Restrictive Practices', desc: 'Register, monitoring, and authorisation tracking' },
  { icon: FileSignature, title: 'Service Agreements', desc: 'NDIS line items, budget allocations, rate tracking' },
  { icon: TrendingUp, title: 'Budget Tracker', desc: 'Financial tracking across all participants' },
  { icon: PieChart, title: 'Budget Utilisation', desc: 'Per-participant NDIS plan burn rate, at-risk alerts' },
  { icon: FileText, title: 'Shift Notes', desc: 'Structured 5-section NDIS care notes — mood, activities, goals' },
  { icon: StickyNote, title: 'Progress Notes', desc: 'Standalone notes — phone calls, meetings, observations, referrals' },
  { icon: ClipboardList, title: 'Forms', desc: 'Digital form templates with signatures — hazard, incident, complaint' },
  { icon: MessageSquare, title: 'Feedback', desc: 'Complaints, compliments, and suggestions management' },
  { icon: Star, title: 'Satisfaction Surveys', desc: 'Emoji scores, rating distribution charts' },
  { icon: CreditCard, title: 'Billing / NDIS Claims', desc: 'NDIS claim management with price guide rates' },
  { icon: DollarSign, title: 'Invoicing', desc: 'Professional NDIS tax invoices, PDF generation, status workflow' },
  { icon: GraduationCap, title: 'Staff Training', desc: 'Training register with expiry tracking' },
  { icon: Megaphone, title: 'Broadcasts', desc: 'Staff messaging system with read receipts' },
  { icon: BarChart3, title: 'Reports', desc: 'Customisable report builder with export' },
  { icon: Link2, title: 'Integrations', desc: 'Xero/MYOB integration panel' },
  { icon: Activity, title: 'Audit Log', desc: 'Full system activity tracking with timestamps' },
  { icon: Upload, title: 'Import Data', desc: 'CSV/data import tool for migration' },
  { icon: BarChart3, title: 'Audit Report', desc: 'PDF audit report generator scored out of 100' },
  { icon: Bot, title: 'AI Assistant', desc: 'AI-powered care insights and natural language queries' },
  { icon: Settings, title: 'Settings', desc: 'System configuration, branding, and preferences' },
  { icon: DollarSign, title: 'NDIS Price Guide', desc: 'Built-in rate lookup for all support categories' },
]

const STAFF_FEATURES = [
  { icon: Home, title: 'Dashboard', desc: 'Live shift timer, upcoming shifts, quick actions, weekly stats' },
  { icon: Calendar, title: 'My Shifts', desc: 'Clock-in/out with GPS verification, voice notes, photo capture' },
  { icon: FileText, title: 'Shift Notes', desc: 'Structured 5-section NDIS care notes per shift' },
  { icon: Calendar, title: 'Calendar', desc: 'Personal shift calendar with month/week views' },
  { icon: FolderOpen, title: 'Participant Docs', desc: 'View assigned participant documents and care plans' },
  { icon: Clock, title: 'Availability', desc: 'Set weekly availability patterns' },
  { icon: Timer, title: 'Time Off', desc: 'Request leave, view approved/pending requests' },
  { icon: ClipboardList, title: 'Forms', desc: 'Complete digital forms with signatures' },
  { icon: AlertTriangle, title: 'Incidents', desc: 'Report incidents with severity and NDIS reportable flag' },
  { icon: Pill, title: 'Medications', desc: 'View and administer medications, record refusals' },
  { icon: CheckSquare, title: 'Shift Tasks', desc: '12 default NDIS tasks + custom task checklists per shift' },
  { icon: ArrowRight, title: 'Handover', desc: 'Write handover notes with concerns and pending tasks' },
  { icon: ArrowLeftRight, title: 'Shift Swaps', desc: 'Request and manage shift swaps with colleagues' },
  { icon: Megaphone, title: 'Broadcasts', desc: 'View team broadcasts and urgent messages' },
  { icon: GraduationCap, title: 'Training', desc: 'View training records and expiry dates' },
  { icon: UserCheck, title: 'My Profile', desc: 'Personal profile, qualifications, and documents' },
  { icon: Trophy, title: 'Leaderboard', desc: 'Gamification with points, streaks, and achievements' },
  { icon: Car, title: 'Mileage', desc: 'Travel log at ATO rate ($0.88/km), reimbursement tracking' },
  { icon: CreditCard, title: 'Expenses', desc: 'Expense claims with receipt tracking and approval status' },
  { icon: AlertTriangle, title: 'Lone Worker Safety', desc: 'GPS check-in/out, SOS emergency alert button' },
]

const FAMILY_FEATURES = [
  { icon: Home, title: 'Family Dashboard', desc: 'Participant overview, recent activities, mood trends' },
  { icon: FileText, title: 'Care Updates', desc: 'Shift notes and activity feed from carers' },
  { icon: ImageIcon, title: 'Photo Gallery', desc: 'Photos from shifts and activities' },
  { icon: FolderOpen, title: 'Documents', desc: 'View participant care plans and NDIS plans' },
  { icon: Bot, title: 'AI Care Assistant', desc: 'Ask questions about your loved one\'s care' },
]

const CROSS_FEATURES = [
  { icon: Moon, title: 'Dark/Light Mode', desc: 'Smooth transitions with system preference detection' },
  { icon: Palette, title: 'Accent Colour Picker', desc: '6 presets to customise the look and feel' },
  { icon: Smartphone, title: 'PWA Installable', desc: 'Add to home screen, works offline-capable' },
  { icon: MapPin, title: 'GPS Clock In/Out', desc: '200m geofence verification at shift locations' },
  { icon: Mic, title: 'Voice-to-Text Notes', desc: 'Dictate shift notes hands-free' },
  { icon: FileSignature, title: 'Digital Signatures', desc: 'Sign forms and documents on any device' },
  { icon: Monitor, title: 'Responsive Design', desc: 'Optimised for mobile, tablet, and desktop' },
  { icon: Layers, title: 'White-Label Ready', desc: 'Your brand, logo, and domain — clients never see Veleria' },
  { icon: Database, title: 'Real-time Backend', desc: 'Supabase with row-level security and live subscriptions' },
  { icon: FileText, title: 'PDF Invoice Generation', desc: 'Professional tax invoices with one click' },
]

const HERO_TEXTS = [
  'Rostering, billing, compliance — all in one platform',
  'GPS clock in/out with live staff map tracking',
  'Family portal with real-time care visibility',
  'One-click audit reports scored out of 100',
  '50+ features built specifically for NDIS providers',
]

const BENEFITS = [
  { icon: Layers, title: 'All-in-one system', desc: 'Not templates or document packs — a full working CRM with 50+ interconnected features.' },
  { icon: Fingerprint, title: 'White-labelled', desc: 'Your brand, your logo, your domain. Clients never see Veleria — it\'s your platform.' },
  { icon: Shield, title: 'NDIS-specific', desc: 'Built from the ground up for Australian disability support providers.' },
  { icon: Smartphone, title: 'Mobile-first', desc: 'Staff clock in, write notes, submit forms, and check shifts from their phone.' },
  { icon: Eye, title: 'Family transparency', desc: 'Families see shift notes, goals, and medications through a secure portal.' },
  { icon: CheckCircle, title: 'Compliance-ready', desc: 'Tracks training, document expiry, and generates one-click audit reports.' },
  { icon: Users, title: 'No per-user pricing', desc: 'Flat $149/month regardless of how many staff, participants, or family users.' },
  { icon: Radio, title: 'Real-time visibility', desc: 'Live dashboard with staff GPS locations, active shifts, and animated charts.' },
  { icon: Bot, title: 'AI-powered', desc: 'AI care assistant for families, smart insights, and natural language queries.' },
]


/* ═══════════════════════════════════════════════
   FEATURE TAB COMPONENT
   ═══════════════════════════════════════════════ */

function FeatureTabs({ isDark }) {
  const d = dk(isDark)
  const [activeTab, setActiveTab] = useState('admin')
  const [showAll, setShowAll] = useState(false)

  const tabs = [
    { id: 'admin', label: 'Admin Portal', count: ADMIN_FEATURES.length, icon: Shield, color: DS.primary, grad: DS.gradPrimary },
    { id: 'staff', label: 'Staff Portal', count: STAFF_FEATURES.length, icon: Briefcase, color: DS.blue, grad: DS.gradStaff },
    { id: 'family', label: 'Family Portal', count: FAMILY_FEATURES.length, icon: Heart, color: DS.pink, grad: DS.gradFamily },
    { id: 'cross', label: 'Cross-Cutting', count: CROSS_FEATURES.length, icon: Zap, color: DS.amber, grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  ]

  const featureMap = { admin: ADMIN_FEATURES, staff: STAFF_FEATURES, family: FAMILY_FEATURES, cross: CROSS_FEATURES }
  const currentFeatures = featureMap[activeTab] || []
  const currentTab = tabs.find(t => t.id === activeTab)
  const visibleFeatures = showAll ? currentFeatures : currentFeatures.slice(0, 8)

  return (
    <div>
      {/* Tab buttons — horizontal scroll on mobile */}
      <div className="flex gap-2 mb-6 overflow-x-auto no-scrollbar pb-2 -mx-1 px-1">
        {tabs.map(tab => {
          const active = activeTab === tab.id
          return (
            <button
              key={tab.id}
              onClick={() => { setActiveTab(tab.id); setShowAll(false) }}
              className="flex items-center gap-2 shrink-0 transition-all"
              style={{
                padding: '10px 18px', borderRadius: 14, border: 'none', cursor: 'pointer',
                fontSize: 13, fontWeight: active ? 700 : 600,
                background: active ? tab.grad : d.subtleBg2,
                color: active ? '#fff' : d.textMuted,
                boxShadow: active ? `0 4px 16px -4px ${tab.color}50` : 'none',
              }}
            >
              <tab.icon size={15} />
              <span className="hidden sm:inline">{tab.label}</span>
              <span className="sm:hidden">{tab.label.split(' ')[0]}</span>
              <span style={{
                fontSize: 10, fontWeight: 800,
                padding: '2px 7px', borderRadius: 8,
                background: active ? 'rgba(255,255,255,0.25)' : d.subtleBg,
                color: active ? '#fff' : d.textFaint,
              }}>{tab.count}</span>
            </button>
          )
        })}
      </div>

      {/* Feature grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {visibleFeatures.map((f, i) => (
          <Reveal key={`${activeTab}-${i}`} delay={i * 30}>
            <Glass isDark={isDark} hover glow={`${currentTab.color}10`}
              className="group p-4 sm:p-5 cursor-default h-full relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-16 h-16 rounded-full -translate-y-1/2 translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-500"
                style={{ background: `radial-gradient(circle, ${currentTab.color}20, transparent)` }}
              />
              <div className="relative z-10">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg mb-3"
                  style={{ background: currentTab.grad }}
                >
                  <f.icon size={18} className="text-white" />
                </div>
                <h4 className="font-bold text-sm mb-1" style={{ color: d.text }}>{f.title}</h4>
                <p className="text-xs leading-relaxed" style={{ color: d.textMuted }}>{f.desc}</p>
              </div>
            </Glass>
          </Reveal>
        ))}
      </div>

      {/* Show more / less */}
      {currentFeatures.length > 8 && (
        <Reveal delay={100}>
          <div className="mt-6 text-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-sm font-bold text-white transition-all hover:shadow-lg hover:-translate-y-0.5"
              style={{ background: currentTab.grad, boxShadow: `0 4px 16px -4px ${currentTab.color}40` }}
            >
              {showAll ? 'Show Less' : `Show All ${currentFeatures.length} Features`}
              <ChevronDown size={14} className={`transition-transform ${showAll ? 'rotate-180' : ''}`} />
            </button>
          </div>
        </Reveal>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════
   MAIN LANDING PAGE
   ═══════════════════════════════════════════════ */

export default function Landing() {
  const [isDark] = useState(false)
  const [loaded, setLoaded] = useState(false)
  const [mobileNav, setMobileNav] = useState(false)

  useEffect(() => { requestAnimationFrame(() => setLoaded(true)) }, [])

  const d = dk(isDark)

  const stg = (i) => ({
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(24px)',
    transition: `all 0.7s cubic-bezier(0.16, 1, 0.3, 1) ${80 + i * 60}ms`,
  })

  return (
   <div className="min-h-screen flex flex-col relative overflow-hidden"
      style={{ background: `linear-gradient(180deg, #7c3aed 0%, #7c3aed 450px, ${d.bg} 450px)` }}
    >
      {/* Status bar fill for PWA */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9998, height: 'env(safe-area-inset-top, 0px)', background: '#7c3aed' }} />

      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-18px) scale(1.04)}}
        @keyframes blink{0%,100%{opacity:1}50%{opacity:0}}
        @keyframes shimmer{0%{background-position:200% 0}100%{background-position:-200% 0}}
        @keyframes glow{0%,100%{box-shadow:0 0 24px rgba(124,58,237,0.25),0 0 60px rgba(124,58,237,0.08)}50%{box-shadow:0 0 36px rgba(124,58,237,0.4),0 0 80px rgba(124,58,237,0.15)}}
        @keyframes float{0%,100%{transform:translateY(0)}50%{transform:translateY(-14px)}}
        @keyframes pulse-border{0%,100%{border-color:rgba(124,58,237,0.3)}50%{border-color:rgba(124,58,237,0.6)}}
        @keyframes wizard-bob{0%,100%{transform:translateY(0) rotate(-2deg)}25%{transform:translateY(-8px) rotate(0deg)}50%{transform:translateY(-2px) rotate(2deg)}75%{transform:translateY(-10px) rotate(0deg)}}
        @keyframes gradient-shift{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
        @keyframes videoGlow{0%,100%{box-shadow:0 0 40px rgba(124,58,237,0.15),0 0 80px rgba(59,130,246,0.08)}50%{box-shadow:0 0 60px rgba(124,58,237,0.25),0 0 100px rgba(59,130,246,0.12)}}
        .glow-box{animation:glow 3s ease-in-out infinite}
        .float-anim{animation:float 5s ease-in-out infinite}
        .no-scrollbar::-webkit-scrollbar{display:none}
        .no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}
        ::selection{background:rgba(124,58,237,0.25)}
        @media(min-width:1024px){.desktop-only{display:block !important}}
        @media(max-width:1023px){.desktop-only{display:none !important}}
      `}</style>

      {/* Background orbs */}
      <Orb color={DS.primary} size="500px" top="-150px" right="-120px" delay={0} />
      <Orb color={DS.blue} size="400px" top="800px" left="-140px" delay={2} />
      <Orb color={DS.pink} size="350px" bottom="1200px" right="5%" delay={4} />
      <Orb color={DS.emerald} size="280px" bottom="600px" left="20%" delay={3} />
      <Orb color={DS.amber} size="220px" top="1800px" left="55%" delay={5} />
      <Orb color={DS.primary} size="320px" top="3000px" right="-80px" delay={1} />
      <Orb color={DS.cyan} size="260px" top="4200px" left="-60px" delay={6} />


      {/* ═══ NAV BAR ═══ */}
 <header className="sticky z-50 mx-auto w-full max-w-6xl px-4 sm:px-6" style={{ ...stg(0), top: 'calc(12px + env(safe-area-inset-top, 0px))' }}>
        <Glass isDark={isDark} className="px-4 sm:px-5 py-3 flex items-center justify-between"
          glow="rgba(124,58,237,0.06)" style={{ borderRadius: 18 }}
        >
          <Link to="/" className="flex items-center gap-2.5 group shrink-0">
            <img src="/logo.png" alt={brand.appName} className="w-9 h-9 object-contain drop-shadow-sm" />
            <div className="leading-tight">
              <h1 className="text-[17px] font-extrabold tracking-tight" style={{ color: d.text }}>{brand.appName}</h1>
              <p className="text-[9px] font-semibold tracking-[0.18em] uppercase" style={{ color: d.textFaint }}>NDIS Care Platform</p>
            </div>
          </Link>

          <nav className="hidden md:flex items-center gap-1">
            {['Features', 'Benefits', 'Pricing', 'Portals'].map((label, i) => (
              <a key={i} href={`#${label.toLowerCase()}`}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:scale-105"
                style={{ color: d.textMuted }}
                onMouseEnter={e => { e.target.style.background = d.subtleBg2; e.target.style.color = d.text }}
                onMouseLeave={e => { e.target.style.background = ''; e.target.style.color = d.textMuted }}
              >{label}</a>
            ))}
          </nav>

          <div className="flex items-center gap-2.5">
            <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-full" style={{ background: 'rgba(16,185,129,0.08)' }}>
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-[10px] font-semibold" style={{ color: '#10b981' }}>Live Demo</span>
            </div>
            <div className="hidden sm:block"><LiveClock /></div>
            <Link to="/enter/admin"
              className="px-4 sm:px-5 py-2.5 rounded-xl text-white text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all flex items-center gap-2"
              style={{ background: DS.gradPrimary, boxShadow: '0 4px 20px -4px rgba(124,58,237,0.4)' }}
            >
              <Sparkles size={14} /> <span className="hidden sm:inline">Try Demo</span>
            </Link>
            <button onClick={() => setMobileNav(!mobileNav)}
              className="md:hidden w-9 h-9 rounded-xl flex items-center justify-center"
              style={{ background: d.subtleBg2 }}
            >
              {mobileNav ? <X size={16} style={{ color: d.textMuted }} /> : <span style={{ color: d.textMuted, fontSize: 18 }}>☰</span>}
            </button>
          </div>
        </Glass>

        {mobileNav && (
          <div className="mt-2 p-4 md:hidden rounded-2xl"
            style={{
              background: '#ffffff',
              border: '1px solid rgba(0,0,0,0.08)',
              boxShadow: '0 20px 60px -12px rgba(0,0,0,0.25)',
              position: 'relative',
              zIndex: 60,
            }}
          >
            <div className="space-y-1">
              {['Features', 'Benefits', 'Pricing', 'Portals'].map((label, i) => (
                <a key={i} href={`#${label.toLowerCase()}`} onClick={() => setMobileNav(false)}
                  className="block px-4 py-3 rounded-xl text-sm font-semibold transition-colors"
                  style={{ color: '#374151' }}
                  onMouseEnter={e => e.currentTarget.style.background = '#f3f4f6'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                >{label}</a>
              ))}
              <div style={{ height: 1, margin: '10px 0', background: '#e5e7eb' }} />
              <Link to="/enter/admin" onClick={() => setMobileNav(false)}
                className="block px-4 py-3.5 rounded-xl text-sm font-bold text-white text-center"
                style={{ background: DS.gradPrimary, boxShadow: '0 4px 12px -4px rgba(124,58,237,0.4)' }}
              >Try Admin Demo</Link>
              <Link to="/enter/staff" onClick={() => setMobileNav(false)}
                className="block px-4 py-3.5 rounded-xl text-sm font-bold text-center mt-2"
                style={{ background: DS.gradStaff, color: '#fff', boxShadow: '0 4px 12px -4px rgba(59,130,246,0.4)' }}
              >Try Staff Demo</Link>
            </div>
          </div>
        )}
      </header>


      {/* ═══ HERO ═══ */}
      <section className="relative z-10" style={stg(1)}>
        <div className="px-4 sm:px-6 md:px-10 lg:px-16 pt-8 sm:pt-12 md:pt-16 pb-10 sm:pb-14 md:pb-16 relative overflow-hidden"
          style={{ background: DS.gradHero }}
        >
          {/* Decorative */}
          <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full -translate-y-1/3 translate-x-1/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
          <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full translate-y-1/3 -translate-x-1/4" style={{ background: 'rgba(255,255,255,0.05)' }} />
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '28px 28px', opacity: 0.4 }} />

          <div className="relative z-10 max-w-6xl lg:max-w-[1400px] mx-auto">
            {/* 2-column: text 6cols, video 6cols — video bleeds right */}
            <div className="grid lg:grid-cols-12 gap-6 items-center">
              {/* LEFT: Text content — full on mobile, 6 cols on desktop */}
              <div className="lg:col-span-6 text-center lg:text-left min-w-0">
                {/* Badge row */}
                <div className="flex flex-wrap items-center justify-center lg:justify-start gap-2 mb-4">
                  {[
                    { icon: Sparkles, text: getGreeting(), bg: 'rgba(255,255,255,0.12)' },
                    { icon: null, text: 'Live Demo Available', bg: 'rgba(255,255,255,0.1)', dot: true },
                    { icon: Shield, text: 'NDIS Compliant', bg: 'rgba(16,185,129,0.2)', border: '1px solid rgba(16,185,129,0.3)', color: '#6ee7b7' },
                  ].map((b, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full backdrop-blur-sm"
                      style={{ background: b.bg, border: b.border || 'none' }}
                    >
                      {b.dot && <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />}
                      {b.icon && <b.icon size={12} style={{ color: b.color || 'rgba(255,255,255,0.7)' }} />}
                      <span className="text-[10px] sm:text-[11px] font-semibold" style={{ color: b.color || 'rgba(255,255,255,0.7)' }}>{b.text}</span>
                    </div>
                  ))}
                </div>

                <h1 className="text-[32px] sm:text-4xl md:text-5xl lg:text-[3.4rem] font-black text-white tracking-tight leading-[1.08]">
                  The complete<br />
                  <span style={{
                    background: 'linear-gradient(90deg, #fde68a, #fbbf24, #f59e0b, #fde68a)',
                    backgroundSize: '200% auto', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
                    animation: 'gradient-shift 4s ease-in-out infinite',
                  }}>NDIS platform</span>
                  <br />for modern providers.
                </h1>

                <div className="mt-3 sm:mt-4 h-6 sm:h-7 overflow-hidden" style={{ color: 'rgba(255,255,255,0.5)', fontSize: 13, fontWeight: 500 }}>
                  <TypeWriter texts={HERO_TEXTS} />
                </div>

                {/* Stat pills — wrap to fit on all screens */}
                <div className="flex flex-wrap gap-2 mt-5 sm:mt-6 justify-center lg:justify-start">
                  {[
                    { icon: Zap, text: '7-day free trial' },
                    { icon: Users, text: 'Unlimited users' },
                    { icon: Shield, text: '50+ features' },
                    { icon: Heart, text: '3 portals' },
                    { icon: Globe, text: 'AU hosted' },
                  ].map((p, i) => (
                    <div key={i} className="flex items-center gap-1.5 px-3 py-1.5 sm:py-2 rounded-xl text-[11px] sm:text-xs font-semibold text-white backdrop-blur-sm"
                      style={{ background: `rgba(255,255,255,${0.15 - i * 0.02})` }}
                    >
                      <p.icon size={12} /> {p.text}
                    </div>
                  ))}
                </div>

                {/* CTA buttons — stack on mobile */}
                <div className="flex flex-col sm:flex-row flex-wrap gap-2.5 sm:gap-3 mt-6 sm:mt-8 sm:justify-center lg:justify-start">
                  <Link to="/enter/admin"
                    className="glow-box inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-2xl text-sm font-bold shadow-xl hover:shadow-2xl hover:-translate-y-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #c4b5fd, #e9d5ff)', color: '#5b21b6' }}
                  ><Shield size={16} /> Admin Portal <ArrowRight size={14} /></Link>
                  <Link to="/enter/staff"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #bfdbfe, #dbeafe)', color: '#1e40af' }}
                  ><LogIn size={16} /> Staff Portal</Link>
                  <Link to="/family/dashboard"
                    className="inline-flex items-center justify-center gap-2 px-5 py-3 sm:px-7 sm:py-4 rounded-2xl text-sm font-bold shadow-lg hover:shadow-xl hover:-translate-y-1 transition-all"
                    style={{ background: 'linear-gradient(135deg, #fbcfe8, #fce7f3)', color: '#9d174d' }}
                  ><Heart size={16} /> Family Portal</Link>
                </div>
              </div>

              {/* RIGHT: Dashboard preview — Desktop only, 6 cols, overflows right */}
              <div className="desktop-only lg:col-span-6" style={{ marginRight: '-12rem' }}>
                <div style={{
                  position: 'relative', width: '100%',
                  borderRadius: 18, overflow: 'hidden',
                  background: 'rgba(0,0,0,0.2)',
                  border: '2px solid rgba(255,255,255,0.15)',
                  animation: 'videoGlow 4s ease-in-out infinite',
                  boxShadow: '0 24px 80px -16px rgba(0,0,0,0.4)',
                }}>
                  {/* Browser chrome bar at top */}
                  <div style={{
                    position: 'relative', zIndex: 2, height: 36,
                    background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(8px)',
                    display: 'flex', alignItems: 'center', padding: '0 14px', gap: 6,
                  }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#ef4444', opacity: 0.7 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#f59e0b', opacity: 0.7 }} />
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: '#10b981', opacity: 0.7 }} />
                    <div style={{
                      flex: 1, marginLeft: 8, height: 22, borderRadius: 6,
                      background: 'rgba(255,255,255,0.08)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 10, color: 'rgba(255,255,255,0.35)', fontWeight: 500,
                    }}>VELCARE</div>
                  </div>

                  {/* Dashboard screenshot — replace src when you have a video */}
                  <img
                    src="/dashboard-preview.png"
                    alt="VelCare Admin Dashboard"
                    style={{
                      display: 'block', width: '100%', height: 'auto',
                      objectFit: 'cover',
                    }}
                    onError={e => {
                      // Fallback if image doesn't exist yet — show gradient placeholder
                      e.target.style.display = 'none'
                      e.target.nextElementSibling.style.display = 'flex'
                    }}
                  />
                  {/* Fallback placeholder if image not found */}
                  <div style={{
                    display: 'none', width: '100%', aspectRatio: '16/9',
                    background: 'linear-gradient(135deg, rgba(124,58,237,0.15), rgba(59,130,246,0.15))',
                    alignItems: 'center', justifyContent: 'center', flexDirection: 'column',
                  }}>
                    <Monitor size={40} style={{ color: 'rgba(255,255,255,0.3)' }} />
                    <p style={{ marginTop: 12, fontSize: 13, fontWeight: 600, color: 'rgba(255,255,255,0.4)' }}>Dashboard Preview</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>


      {/* ═══ STATS BAR ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-5">
        <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2 sm:gap-3">
            {[
              { value: 149, label: 'Flat Monthly Fee', prefix: '$', color: DS.primary },
              { value: '∞', label: 'Unlimited Users', color: DS.blue },
              { value: 50, label: 'Feature Modules', suffix: '+', color: DS.emerald },
              { value: 3, label: 'Portal Types', color: DS.pink },
              { value: 100, label: 'Compliance Score', suffix: '/100', color: DS.amber },
            ].map((s, i) => (
              <Reveal key={i} delay={i * 60}>
                <Glass isDark={isDark} hover glow={`${s.color}15`} className="p-3 sm:p-4 text-center">
                  <p className="text-xl sm:text-2xl md:text-3xl font-black" style={{ color: d.text }}>
                    {typeof s.value === 'number' ? <AnimNum value={s.value} prefix={s.prefix || ''} suffix={s.suffix || ''} /> : s.value}
                  </p>
                  <p className="text-[9px] sm:text-[10px] font-semibold mt-1" style={{ color: d.textFaint }}>{s.label}</p>
                </Glass>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ PORTALS + HERO IMAGE — Side by side ═══ */}
      <section id="portals" className="relative z-10 scroll-mt-24 px-4 sm:px-6 mt-10 md:mt-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid lg:grid-cols-12 gap-6 lg:gap-10 items-center">

            {/* LEFT: Hero image smaller with floating badges */}
            <div className="lg:col-span-5">
              <Reveal>
                <div className="relative flex justify-center">
                  <img
                    src="/hero.png"
                    alt="VelCare NDIS CRM Platform"
                    className="w-full max-w-[260px] sm:max-w-[320px] lg:max-w-[380px] h-auto object-contain drop-shadow-2xl rounded-2xl"
                    onError={e => { e.target.style.display = 'none' }}
                  />
                  {/* Floating badges — smaller, black text */}
                  <div className="hidden md:block absolute -top-2 -left-4 float-anim" style={{ animationDelay: '0.5s' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: DS.gradPrimary }}>
                        <Users size={10} className="text-white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>Participant Profiles</p>
                        <p style={{ fontSize: 8, color: '#6b7280' }}>NDIS plans & goals</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block absolute top-1/4 -right-4 float-anim" style={{ animationDelay: '1.2s' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: DS.gradStaff }}>
                        <Calendar size={10} className="text-white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>Smart Rostering</p>
                        <p style={{ fontSize: 8, color: '#6b7280' }}>GPS clock in/out</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block absolute bottom-1/4 -right-6 float-anim" style={{ animationDelay: '0.8s' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #10b981, #34d399)' }}>
                        <DollarSign size={10} className="text-white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>NDIS Billing</p>
                        <p style={{ fontSize: 8, color: '#6b7280' }}>Auto claim generation</p>
                      </div>
                    </div>
                  </div>
                  <div className="hidden md:block absolute -bottom-2 -left-6 float-anim" style={{ animationDelay: '1.6s' }}>
                    <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg shadow-lg"
                      style={{ background: 'rgba(255,255,255,0.9)', backdropFilter: 'blur(12px)', border: '1px solid rgba(0,0,0,0.06)' }}
                    >
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: DS.gradFamily }}>
                        <Heart size={10} className="text-white" />
                      </div>
                      <div>
                        <p style={{ fontSize: 10, fontWeight: 700, color: '#111827' }}>Family Portal</p>
                        <p style={{ fontSize: 8, color: '#6b7280' }}>Secure read-only</p>
                      </div>
                    </div>
                  </div>
                </div>
              </Reveal>
            </div>

            {/* RIGHT: Portal heading + cards */}
            <div className="lg:col-span-7">
              <Reveal>
                <div className="mb-6 sm:mb-8 text-center lg:text-left">
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Three Portals, One System</p>
                  <h2 className="text-2xl md:text-4xl font-black" style={{ color: d.text }}>Built for everyone in the care chain</h2>
                </div>
              </Reveal>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
                {[
                  { to: '/enter/admin', icon: Shield, title: 'Admin Portal', desc: 'Full control over participants, staff, rostering, billing, incidents, compliance, and reports.', gradient: 'linear-gradient(135deg, #c4b5fd, #a78bfa)', glow: 'rgba(124,58,237,0.15)', tag: '32 pages', accent: '#7c3aed' },
                  { to: '/enter/staff', icon: LogIn, title: 'Staff Portal', desc: 'Clock in with GPS, submit voice notes, view shifts, request swaps, and submit forms.', gradient: 'linear-gradient(135deg, #93c5fd, #60a5fa)', glow: 'rgba(59,130,246,0.15)', tag: '20 pages', accent: '#3b82f6' },
                  { to: '/family/dashboard', icon: Heart, title: 'Family Portal', desc: 'Secure read-only access. See shift updates, care notes, goals, and medications.', gradient: 'linear-gradient(135deg, #f9a8d4, #f472b6)', glow: 'rgba(236,72,153,0.15)', tag: '5 pages', accent: '#ec4899' },
                ].map((p, i) => (
                  <Reveal key={i} delay={i * 80}>
                    <Link to={p.to} className="block h-full">
                      <Glass isDark={isDark} hover glow={p.glow} className="group p-4 sm:p-5 cursor-pointer h-full relative overflow-hidden">
                        <div className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500 rounded-2xl"
                          style={{ background: `linear-gradient(135deg, ${p.glow}, transparent)` }} />
                        <div className="relative z-10">
                          <div className="flex items-center justify-between mb-3">
                            <div className="w-11 h-11 rounded-xl flex items-center justify-center shadow-lg"
                              style={{ background: p.gradient, boxShadow: `0 6px 20px -4px ${p.glow}` }}
                            ><p.icon size={20} className="text-white" /></div>
                            <span className="text-[9px] font-bold px-2.5 py-0.5 rounded-full" style={{ background: d.subtleBg2, color: d.textFaint }}>{p.tag}</span>
                          </div>
                          <h3 className="text-base font-bold mb-1.5" style={{ color: d.text }}>{p.title}</h3>
                          <p className="text-xs leading-relaxed mb-3" style={{ color: d.textMuted }}>{p.desc}</p>
                          <div className="flex items-center gap-1 text-xs font-semibold opacity-0 group-hover:opacity-100 transition-all" style={{ color: p.accent }}>
                            Open <ArrowRight size={12} />
                          </div>
                        </div>
                      </Glass>
                    </Link>
                  </Reveal>
                ))}
              </div>
            </div>

          </div>
        </div>
      </section>


      {/* ═══ ALL FEATURES — Tabbed by portal ═══ */}
      <section id="features" className="relative z-10 scroll-mt-24 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>50+ Feature Modules</p>
              <h2 className="text-2xl md:text-4xl font-black" style={{ color: d.text }}>Everything an NDIS provider needs</h2>
              <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm" style={{ color: d.textMuted }}>
                Admin, staff, and family — every portal is packed with purpose-built features for NDIS care management.
              </p>
            </div>
          </Reveal>
          <FeatureTabs isDark={isDark} />
        </div>
      </section>


      {/* ═══ WIZARD MASCOT ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Glass isDark={isDark} className="p-5 sm:p-8 md:p-14 relative overflow-hidden" glow="rgba(124,58,237,0.08)">
              <div className="absolute top-4 right-8 text-4xl opacity-20 float-anim">✨</div>
              <div className="absolute bottom-6 left-12 text-3xl opacity-15 float-anim" style={{ animationDelay: '1s' }}>🌟</div>
              <div className="grid md:grid-cols-2 gap-6 sm:gap-8 items-center">
                <div className="flex justify-center">
                  <div className="relative">
                    <div className="absolute inset-0 rounded-full blur-3xl opacity-20" style={{ background: DS.gradPrimary, transform: 'scale(1.3)' }} />
                    <img src="/wizard.png" alt="VelCare Wizard"
                      className="relative z-10 w-36 sm:w-48 md:w-64 h-auto drop-shadow-2xl"
                      style={{ animation: 'wizard-bob 6s ease-in-out infinite' }}
                      onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<div style="width:160px;height:160px;border-radius:50%;background:linear-gradient(135deg,#7c3aed,#a855f7,#3b82f6);display:flex;align-items:center;justify-content:center;font-size:64px;box-shadow:0 20px 60px -12px rgba(124,58,237,0.4)">🧙</div>' }}
                    />
                  </div>
                </div>
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Meet Your Care Wizard</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4" style={{ color: d.text }}>Managing NDIS care just got magical</h2>
                  <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6" style={{ color: d.textMuted }}>
                    From shift rostering to compliance audits, VelCare handles the heavy lifting so you can focus on delivering exceptional care.
                  </p>
                  <div className="space-y-2.5 sm:space-y-3">
                    {[
                      { icon: Wand2, text: 'AI-powered insights and natural language queries' },
                      { icon: Sparkles, text: 'One-click compliance audit reports' },
                      { icon: Zap, text: 'Auto-generated NDIS claims from shifts' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${DS.primary}15` }}>
                          <item.icon size={14} style={{ color: DS.primary }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium" style={{ color: d.textSoft }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Glass>
          </Reveal>
        </div>
      </section>


      {/* ═══ BENEFITS ═══ */}
      <section id="benefits" className="relative z-10 scroll-mt-24 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Why Providers Choose VelCare</p>
              <h2 className="text-2xl md:text-4xl font-black" style={{ color: d.text }}>Built different. Built for NDIS.</h2>
            </div>
          </Reveal>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3 sm:gap-4">
            {BENEFITS.map((b, i) => (
              <Reveal key={i} delay={i * 50}>
                <Glass isDark={isDark} hover className="p-4 sm:p-5 h-full group" glow={`${DS.primary}08`}>
                  <div className="flex items-start gap-3 sm:gap-4">
                    <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center shrink-0 transition-transform group-hover:scale-110"
                      style={{ background: `linear-gradient(135deg, ${DS.primary}18, ${DS.primary}08)`, border: `1px solid ${DS.primary}20` }}
                    ><b.icon size={17} style={{ color: DS.primary }} /></div>
                    <div>
                      <h4 className="font-bold text-sm mb-1" style={{ color: d.text }}>{b.title}</h4>
                      <p className="text-xs leading-relaxed" style={{ color: d.textMuted }}>{b.desc}</p>
                    </div>
                  </div>
                </Glass>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

   {/* Full-width image banner */}
<div style={{
  width: '100vw',
  marginLeft: 'calc(-50vw + 50%)',
  marginTop: 60,
  position: 'relative',
  overflow: 'hidden',
  background: '#1f2937',
}}>
  <img
    src="/demo-banner.png"
    alt="NDIS Care Management"
    style={{
      width: '100%',
      height: 'auto',
      display: 'block',
      minHeight: 300,
      objectFit: 'cover',
    }}
  />
  {/* Dark overlay */}
  <div style={{
    position: 'absolute',
    inset: 0,
    background: 'linear-gradient(180deg, rgba(0,0,0,0.2) 0%, rgba(0,0,0,0.6) 100%)',
  }} />
  {/* Text overlay */}
  <div style={{
    position: 'absolute',
    inset: 0,
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '40px 24px',
    textAlign: 'center',
  }}>
    <p style={{
      fontSize: 'clamp(10px, 2vw, 14px)',
      fontWeight: 700,
      letterSpacing: '0.15em',
      textTransform: 'uppercase',
      color: 'rgba(255,255,255,0.7)',
      marginBottom: 12,
    }}>
      Purpose-built for NDIS providers
    </p>
    <h2 style={{
      fontSize: 'clamp(24px, 5vw, 48px)',
      fontWeight: 900,
      color: 'white',
      lineHeight: 1.2,
      maxWidth: 700,
      textShadow: '0 2px 20px rgba(0,0,0,0.3)',
    }}>
      Less paperwork.<br />More care.
    </h2>
    <p style={{
      fontSize: 'clamp(12px, 2vw, 18px)',
      color: 'rgba(255,255,255,0.85)',
      marginTop: 12,
      maxWidth: 540,
      lineHeight: 1.6,
    }}>
      Everything your team needs to deliver exceptional disability support — rostering, compliance, billing, and family updates — in one platform.
    </p>
    <button
      onClick={() => document.getElementById('portals')?.scrollIntoView({ behavior: 'smooth' })}
      style={{
        marginTop: 24,
        display: 'inline-flex',
        alignItems: 'center',
        gap: 8,
        padding: 'clamp(10px, 2vw, 14px) clamp(20px, 4vw, 32px)',
        borderRadius: 14,
        background: 'rgba(255,255,255,0.15)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        border: '1px solid rgba(255,255,255,0.25)',
        color: 'white',
        fontSize: 'clamp(12px, 2vw, 15px)',
        fontWeight: 700,
        cursor: 'pointer',
        transition: 'all 0.3s',
      }}
      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.25)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.transform = 'translateY(0)' }}
    >
      Try the Demo →
    </button>
  </div>
</div>


      {/* ═══ SOCIAL PROOF ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Glass isDark={isDark} className="p-5 sm:p-8 md:p-14 relative overflow-hidden" glow="rgba(16,185,129,0.08)">
              <div className="absolute inset-0 opacity-30"
                style={{ background: 'linear-gradient(90deg, transparent, rgba(124,58,237,0.03), transparent)', backgroundSize: '200% 100%', animation: 'shimmer 6s infinite' }} />
              <div className="relative z-10 text-center mb-6 sm:mb-8">
                <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.emerald }}>Trusted by NDIS Providers</p>
                <h2 className="text-xl sm:text-2xl md:text-3xl font-black" style={{ color: d.text }}>Built for real providers across Australia</h2>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4 relative z-10">
                {[
                  { value: 500, suffix: '+', label: 'Shifts Managed', icon: Calendar, color: DS.blue },
                  { value: 50, suffix: '+', label: 'Staff Tracked', icon: Users, color: DS.primary },
                  { value: 100, suffix: '%', label: 'NDIS Compliant', icon: Shield, color: DS.emerald },
                  { value: 24, suffix: '/7', label: 'System Uptime', icon: Activity, color: DS.amber },
                ].map((s, i) => (
                  <div key={i} className="text-center">
                    <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl flex items-center justify-center mx-auto mb-2 sm:mb-3" style={{ background: `${s.color}15` }}>
                      <s.icon size={20} style={{ color: s.color }} />
                    </div>
                    <p className="text-2xl sm:text-3xl md:text-4xl font-black" style={{ color: d.text }}><AnimNum value={s.value} suffix={s.suffix} /></p>
                    <p className="text-[10px] sm:text-[11px] font-semibold mt-1" style={{ color: d.textFaint }}>{s.label}</p>
                  </div>
                ))}
              </div>
              <div className="mt-8 sm:mt-10 max-w-2xl mx-auto text-center relative z-10">
                <div className="flex justify-center gap-1 mb-3">{[1,2,3,4,5].map(i => <Star key={i} size={14} fill="#fbbf24" style={{ color: '#fbbf24' }} />)}</div>
                <p className="text-xs sm:text-sm italic leading-relaxed" style={{ color: d.textSoft }}>
                  "Finally an NDIS platform that actually understands what disability support providers need. The flat pricing means I don't have to worry about costs as my team grows."
                </p>
                <p className="text-xs font-bold mt-3" style={{ color: d.textFaint }}>— Compass Care, Australia</p>
              </div>
            </Glass>
          </Reveal>
        </div>
      </section>


      {/* ═══ PRICING ═══ */}
      <section id="pricing" className="relative z-10 scroll-mt-24 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-8 sm:mb-10">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Transparent Pricing</p>
              <h2 className="text-2xl md:text-4xl font-black" style={{ color: d.text }}>One flat fee. No per-user charges. Ever.</h2>
              <p className="mt-3 max-w-2xl mx-auto text-xs sm:text-sm" style={{ color: d.textMuted }}>
                Most NDIS software charges per user per month. With VelCare, pay $149/month no matter how many staff, participants, or family users.
              </p>
            </div>
          </Reveal>
          <div className="grid md:grid-cols-5 gap-4 sm:gap-5">
            <Reveal delay={0} className="md:col-span-2">
              <Glass isDark={isDark} className="p-5 sm:p-6 h-full" glow="rgba(239,68,68,0.06)">
                <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: d.textFaint }}>Industry Average</p>
                <p className="text-xs sm:text-sm mb-4" style={{ color: d.textMuted }}>Per-user pricing (typical NDIS software)</p>
                <div className="mb-5">
                  <p className="text-3xl sm:text-4xl font-black" style={{ color: d.textFaint }}>$9-15</p>
                  <p className="text-xs" style={{ color: d.textFaint }}>per user / month</p>
                </div>
                <div className="space-y-2.5 text-xs" style={{ color: d.textMuted }}>
                  {['10 staff = $90-150/mo', '25 staff = $225-375/mo', '50 staff = $450-750/mo', '100 staff = $900-1,500/mo'].map((line, i) => (
                    <div key={i} className="flex items-center gap-2"><TrendingUp size={12} style={{ color: DS.red }} /><span>{line}</span></div>
                  ))}
                </div>
                <p className="mt-5 text-[11px] leading-relaxed" style={{ color: d.textFaint }}>Plus setup fees, add-ons, and 12-month lock-ins.</p>
              </Glass>
            </Reveal>
            <Reveal delay={100} className="md:col-span-3">
              <Glass isDark={isDark} className="p-5 sm:p-7 relative overflow-hidden h-full" glow="rgba(124,58,237,0.15)"
                style={{ borderColor: DS.primary, borderWidth: 2, animation: 'pulse-border 4s ease-in-out infinite' }}
              >
                <div className="absolute -top-px left-1/2 -translate-x-1/2 px-5 py-1.5 rounded-b-xl text-xs font-bold text-white shadow-lg" style={{ background: DS.gradPrimary }}>✨ Best Value</div>
                <div className="mt-4 mb-5 sm:mb-6">
                  <p className="text-xs font-bold uppercase tracking-wider mb-1" style={{ color: DS.primary }}>VelCare</p>
                  <p className="text-xs sm:text-sm mb-4" style={{ color: d.textMuted }}>Flat monthly fee, unlimited everything</p>
                  <div className="flex items-end gap-2">
                    <p className="text-4xl sm:text-5xl md:text-7xl font-black" style={{ color: d.text }}>$149</p>
                    <span className="text-sm font-semibold mb-2" style={{ color: d.textFaint }}>/month</span>
                  </div>
                  <div className="flex flex-wrap items-center gap-2 mt-2">
                    <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-bold text-white" style={{ background: 'linear-gradient(135deg, #10b981, #059669)' }}><Zap size={11} /> 7-day free trial</span>
                    <span className="text-xs" style={{ color: d.textMuted }}>then $149/mo · cancel anytime</span>
                  </div>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-2.5 mb-5 sm:mb-6">
                  {['Unlimited staff accounts', 'Unlimited participants', 'Unlimited family portal users', 'All 50+ features included', 'No setup fees', 'No contract lock-in', 'Free data migration support', 'White-label branding', 'Dedicated support', 'Automatic updates'].map((item, i) => (
                    <div key={i} className="flex items-center gap-2.5">
                      <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${DS.primary}15` }}><Check size={11} style={{ color: DS.primary }} /></div>
                      <p className="text-xs font-medium" style={{ color: d.textSoft }}>{item}</p>
                    </div>
                  ))}
                </div>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link to="/enter/admin" className="flex-1 py-3.5 rounded-xl text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all flex items-center justify-center gap-2"
                    style={{ background: DS.gradPrimary, boxShadow: '0 6px 20px -4px rgba(124,58,237,0.4)' }}
                  ><Play size={14} /> Try the Demo</Link>
                  <a href="https://veleria.com.au" target="_blank" rel="noopener noreferrer"
                    className="flex-1 py-3.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
                    style={{ background: d.subtleBg2, color: d.textMuted, border: `1px solid ${d.glassBorder}` }}
                  ><Phone size={14} /> Contact Sales</a>
                </div>
                <div className="mt-4 sm:mt-5 p-3 rounded-xl text-center" style={{ background: d.subtleBg, border: `1px solid ${d.glassBorder}` }}>
                  <p className="text-xs font-semibold" style={{ color: d.textMuted }}>
                    🛠️ Want your own custom system? We build <strong style={{ color: d.text }}>bespoke platforms</strong>.{' '}
                    <a href="https://veleria.com.au/contact" target="_blank" rel="noopener noreferrer" className="underline" style={{ color: DS.primary }}>Contact us</a>
                  </p>
                </div>
              </Glass>
            </Reveal>
          </div>
        </div>
      </section>


      {/* ═══ COMPLIANCE ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Glass isDark={isDark} className="p-5 sm:p-8 md:p-10" glow="rgba(16,185,129,0.08)">
              <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.emerald }}>NDIS Compliance</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4" style={{ color: d.text }}>Audit ready at the click of a button</h2>
                  <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6" style={{ color: d.textMuted }}>
                    Generate a full compliance audit report with a score out of 100. Export as PDF for your next NDIS Quality & Safeguards Commission audit.
                  </p>
                  <div className="space-y-2.5 sm:space-y-3">
                    {['Automatic NDIS reportable incident flagging', 'Document and training expiry alerts', 'Restrictive practice authorisation tracking', 'Complete audit trail for all system actions', 'One-click PDF compliance audit report', '7-year data retention as per NDIS standards'].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-5 h-5 rounded-full flex items-center justify-center shrink-0" style={{ background: `${DS.emerald}15` }}><Check size={11} style={{ color: DS.emerald }} /></div>
                        <p className="text-xs sm:text-sm" style={{ color: d.textSoft }}>{item}</p>
                      </div>
                    ))}
                  </div>
                </div>
                <div className="flex items-center justify-center">
                  <div className="text-center">
                    <div className="relative inline-block">
                      <svg width={180} height={180} style={{ transform: 'rotate(-90deg)' }}>
                        <circle cx={90} cy={90} r={72} fill="none" stroke="rgba(0,0,0,0.04)" strokeWidth="13" />
                        <circle cx={90} cy={90} r={72} fill="none" stroke={DS.emerald} strokeWidth="13" strokeLinecap="round"
                          strokeDasharray={2 * Math.PI * 72} strokeDashoffset={2 * Math.PI * 72 * 0.08}
                          style={{ transition: 'stroke-dashoffset 2s cubic-bezier(0.16,1,0.3,1)', filter: `drop-shadow(0 0 12px ${DS.emerald}40)` }}
                        />
                      </svg>
                      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                        <p style={{ fontSize: 42, fontWeight: 900, color: DS.emerald }}>92</p>
                        <p style={{ fontSize: 11, fontWeight: 600, color: d.textFaint }}>/ 100</p>
                      </div>
                    </div>
                    <p style={{ fontSize: 13, fontWeight: 700, color: DS.emerald, marginTop: 10 }}>Audit Ready</p>
                    <p style={{ fontSize: 10, color: d.textFaint }}>Sample compliance score</p>
                  </div>
                </div>
              </div>
            </Glass>
          </Reveal>
        </div>
      </section>


      {/* ═══ MIGRATION ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="text-center mb-6 sm:mb-8">
              <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Easy Migration</p>
              <h2 className="text-xl sm:text-2xl md:text-3xl font-black" style={{ color: d.text }}>Switch in minutes, not months</h2>
            </div>
          </Reveal>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2 sm:gap-3 max-w-3xl mx-auto">
            {['ShiftCare', 'SupportAbility', 'Lumary', 'Any CSV'].map((p, i) => (
              <Reveal key={i} delay={i * 60}>
                <Glass isDark={isDark} hover className="p-3 sm:p-4 text-center" glow={`${DS.primary}08`}>
                  <Upload size={18} style={{ color: d.textFaint }} className="mx-auto mb-2" />
                  <p className="text-xs sm:text-sm font-bold" style={{ color: d.text }}>{p}</p>
                  <p className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: d.textFaint }}>Import supported</p>
                </Glass>
              </Reveal>
            ))}
          </div>
        </div>
      </section>


      {/* ═══ CUSTOM SYSTEMS ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <Glass isDark={isDark} className="p-5 sm:p-8 md:p-14 relative overflow-hidden" glow="rgba(124,58,237,0.08)">
              <div className="absolute top-0 right-0 w-64 h-64 rounded-full -translate-y-1/2 translate-x-1/4 opacity-5" style={{ background: DS.gradPrimary }} />
              <div className="grid md:grid-cols-2 gap-6 sm:gap-10 items-center relative z-10">
                <div>
                  <p className="text-xs font-bold uppercase tracking-[0.2em] mb-2" style={{ color: DS.primary }}>Custom Development</p>
                  <h2 className="text-xl sm:text-2xl md:text-3xl font-black mb-3 sm:mb-4" style={{ color: d.text }}>We build custom systems too</h2>
                  <p className="text-xs sm:text-sm leading-relaxed mb-4 sm:mb-6" style={{ color: d.textMuted }}>
                    Need something beyond an NDIS CRM? Veleria builds bespoke software platforms for organisations of all sizes.
                  </p>
                  <div className="space-y-2.5 sm:space-y-3 mb-5 sm:mb-6">
                    {[
                      { icon: Layers, text: 'Custom web applications & internal tools' },
                      { icon: Database, text: 'Full-stack development with modern tech' },
                      { icon: Globe, text: 'Custom branded software, made for you' },
                      { icon: Zap, text: 'Rapid prototyping & MVP development' },
                      { icon: Lock, text: 'Enterprise-grade security & hosting' },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${DS.primary}12` }}>
                          <item.icon size={15} style={{ color: DS.primary }} />
                        </div>
                        <span className="text-xs sm:text-sm font-medium" style={{ color: d.textSoft }}>{item.text}</span>
                      </div>
                    ))}
                  </div>
                  <a href="https://veleria.com.au/custom" target="_blank" rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 px-5 sm:px-6 py-3 rounded-xl text-sm font-bold text-white shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                    style={{ background: DS.gradPrimary, boxShadow: '0 4px 16px -4px rgba(124,58,237,0.4)' }}
                  ><Mail size={14} /> Learn More <ArrowRight size={14} /></a>
                </div>
                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  {[
                    { icon: Monitor, title: 'Web Apps', desc: 'React, Next.js, modern', color: DS.blue },
                    { icon: Smartphone, title: 'Mobile', desc: 'PWA & responsive', color: DS.pink },
                    { icon: Database, title: 'Backend', desc: 'Supabase, APIs, cloud', color: DS.emerald },
                    { icon: Palette, title: 'Design', desc: 'UI/UX & branding', color: DS.amber },
                  ].map((item, i) => (
                    <Glass key={i} isDark={isDark} hover className="p-3 sm:p-4 text-center" glow={`${item.color}10`}>
                      <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl flex items-center justify-center mx-auto mb-2" style={{ background: `${item.color}15` }}>
                        <item.icon size={17} style={{ color: item.color }} />
                      </div>
                      <p className="text-xs font-bold" style={{ color: d.text }}>{item.title}</p>
                      <p className="text-[9px] sm:text-[10px] mt-0.5" style={{ color: d.textFaint }}>{item.desc}</p>
                    </Glass>
                  ))}
                </div>
              </div>
            </Glass>
          </Reveal>
        </div>
      </section>


      {/* ═══ FINAL CTA ═══ */}
      <section className="relative z-10 px-4 sm:px-6 mt-16 md:mt-24">
        <div className="max-w-6xl mx-auto">
          <Reveal>
            <div className="p-6 sm:p-8 md:p-14 rounded-3xl relative overflow-hidden" style={{ background: DS.gradHero }}>
              <div className="absolute top-0 right-0 w-80 h-80 rounded-full -translate-y-1/3 translate-x-1/4" style={{ background: 'rgba(255,255,255,0.08)' }} />
              <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.08) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
              <div className="relative z-10 text-center">
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-black text-white leading-tight">
                  Ready to transform your<br className="hidden sm:inline" /> NDIS operations?
                </h2>
                <p className="text-xs sm:text-sm mt-3 sm:mt-4 max-w-xl mx-auto" style={{ color: 'rgba(255,255,255,0.5)' }}>
                  $149/month · Unlimited users · No lock-in · Try the demo now
                </p>
                <div className="flex flex-col sm:flex-row gap-3 justify-center mt-6 sm:mt-8">
                  <Link to="/enter/admin" className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm transition-all hover:shadow-xl hover:-translate-y-1 shadow-lg"
                    style={{ background: 'rgba(255,255,255,0.95)', color: DS.primary }}
                  ><span className="flex items-center justify-center gap-2"><Shield size={16} /> Try Admin Demo</span></Link>
                  <Link to="/enter/staff" className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.15)', border: '1px solid rgba(255,255,255,0.25)' }}
                  ><span className="flex items-center justify-center gap-2"><LogIn size={16} /> Staff Demo</span></Link>
                  <a href="https://veleria.com.au/contact" target="_blank" rel="noopener noreferrer"
                    className="px-6 sm:px-8 py-3.5 sm:py-4 rounded-2xl font-bold text-sm text-white transition-all hover:shadow-xl hover:-translate-y-1 backdrop-blur-sm"
                    style={{ background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.15)' }}
                  ><span className="flex items-center justify-center gap-2"><Mail size={16} /> Contact Sales</span></a>
                </div>
              </div>
            </div>
          </Reveal>
        </div>
      </section>


      {/* ═══ FOOTER ═══ */}
<footer className="relative z-10 px-4 sm:px-6 mt-16" style={{ paddingBottom: 'calc(32px + env(safe-area-inset-bottom, 0px))' }}>
        <div className="max-w-6xl mx-auto">
          <div className="pt-8" style={{ borderTop: `1px solid ${d.glassBorder}` }}>
            {/* Footer grid — stack on mobile, 4 cols on md+ */}
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8 mb-8">
              <div className="sm:col-span-2 md:col-span-1">
                <div className="flex items-center gap-2 mb-3">
                  <img src="/logo.png" alt={brand.appName} className="w-7 h-7 object-contain" />
                  <span className="text-lg font-bold" style={{ color: d.text }}>{brand.appName}</span>
                </div>
                <p className="text-xs leading-relaxed" style={{ color: d.textFaint }}>
                  Complete NDIS care management. $149/month, unlimited everything.
                </p>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: d.textSoft }}>Platform</p>
                <div className="space-y-2">
                  <Link to="/enter/admin" className="block text-xs sm:text-sm hover:underline" style={{ color: d.textMuted }}>Admin Portal</Link>
                  <Link to="/enter/staff" className="block text-xs sm:text-sm hover:underline" style={{ color: d.textMuted }}>Staff Portal</Link>
                  <Link to="/family/dashboard" className="block text-xs sm:text-sm hover:underline" style={{ color: d.textMuted }}>Family Portal</Link>
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: d.textSoft }}>Features</p>
                <div className="space-y-2">
                  {['Rostering & GPS', 'NDIS Billing', 'Compliance', 'Staff Training'].map((f, i) => (
                    <p key={i} className="text-xs sm:text-sm" style={{ color: d.textMuted }}>{f}</p>
                  ))}
                </div>
              </div>
              <div>
                <p className="text-xs font-bold uppercase tracking-wider mb-3" style={{ color: d.textSoft }}>Security</p>
                <div className="space-y-2">
                  {['AES-256 Encryption', 'Row Level Security', 'Australian Hosted', 'NDIS Compliant'].map((s, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <CheckCircle size={11} style={{ color: DS.emerald }} />
                      <span className="text-xs sm:text-sm" style={{ color: d.textMuted }}>{s}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
            {/* Bottom bar */}
            <div className="pt-6 flex flex-col items-center gap-3 text-center"
              style={{ borderTop: `1px solid ${d.glassBorder}` }}
            >
              <div className="flex items-center gap-2 flex-wrap justify-center">
                <span className="text-[11px]" style={{ color: d.textFaint }}>© {new Date().getFullYear()} {brand.appName}</span>
                <span className="text-[11px]" style={{ color: d.textFaint }}>·</span>
                <span className="text-[11px]" style={{ color: d.textFaint }}>All prices in AUD</span>
                <span className="text-[11px]" style={{ color: d.textFaint }}>·</span>
                <div className="flex items-center gap-1">
                  <CheckCircle size={10} style={{ color: DS.emerald }} />
                  <span className="text-[11px] font-medium" style={{ color: d.textFaint }}>NDIS Registered</span>
                </div>
                <span className="text-[11px]" style={{ color: d.textFaint }}>·</span>
                <a href="https://veleria.com.au" target="_blank" rel="noopener noreferrer" className="text-[11px] font-semibold hover:underline" style={{ color: DS.primary }}>
                  Built by Veleria
                </a>
              </div>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}