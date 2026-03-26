import { useState, useEffect, useRef, useCallback } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { X, ChevronRight, ChevronLeft, Sparkles, Shield, Users, Calendar, FileText, AlertTriangle, DollarSign, BarChart3, MapPin, Activity, Home, Clock, Heart, Target, Pill, GraduationCap, Megaphone, Bot, Briefcase, Eye, Play, Flame, ArrowRight } from 'lucide-react'
import { useTheme } from '../context/ThemeContext'
import { useBrandColors } from '../hooks/useBrandColors'

/* ═══ ADMIN STEPS ═══ */
const ADMIN_STEPS = [
  { icon: Home, title: "Welcome to VelCare!", target: 'tour-hero', pos: 'bottom',
    message: "G'day! I'm Merlin, your guide. This is your admin command centre — everything happening across your organisation, right here.",
    features: ['Live stats', 'Quick actions', 'System status'], related: null },
  { icon: BarChart3, title: 'Key Metrics', target: 'tour-stats', pos: 'bottom',
    message: "8 stat cards tracking participants, staff, incidents, shifts, revenue, medications, training, and goals. Each one links to its full page.",
    features: ['Participants', 'Staff', 'Incidents', 'Revenue', 'Medications', 'Training', 'Goals'],
    related: "Tap any card to jump straight to that section — full NDIS profiles, compliance tracking, invite codes, and more." },
  { icon: Shield, title: 'Compliance & Revenue', target: 'tour-score', pos: 'bottom',
    message: "Compliance score out of 100, weekly progress bars, and your revenue pipeline from draft claims to paid invoices.",
    features: ['Compliance ring', 'Progress bars', 'Revenue pipeline', 'Audit report'],
    related: "Hit 'Full Report' for a one-click PDF audit report. The billing section tracks every NDIS claim from creation to payment." },
  { icon: MapPin, title: 'Live Staff GPS Map', target: 'tour-map', pos: 'bottom',
    message: "Every staff member's live location. Green = on-shift, amber = travelling, blue = available. Click to call or view profile.",
    features: ['GPS tracking', 'Live status', 'Click to call', 'Geofence 200m'],
    related: "Staff clock in/out via GPS verification on their phone. The system confirms they're within 200m of the shift location." },
  { icon: BarChart3, title: 'Charts & Incidents', target: 'tour-charts', pos: 'top',
    message: "Weekly shift chart and 30-day incident breakdown. Auto-flags NDIS reportable incidents with deadline alerts.",
    features: ['Bar chart', 'Pie chart', 'NDIS flags', 'Severity tracking'],
    related: "Incidents, Medications, Goals, Restrictive Practices — all have their own dedicated pages with full CRUD." },
  { icon: Calendar, title: "Today's Activity", target: 'tour-activity', pos: 'top',
    message: "Today's shifts with live status badges and a real-time activity feed showing every action in the system.",
    features: ['Today\'s schedule', 'Live badges', 'Activity feed', 'Audit trail'],
    related: "Roster has full shift management with SCHADS payroll export. Calendar gives month/week/day views." },
  { icon: Activity, title: 'Leaderboard & Calendar', target: 'tour-list', pos: 'top',
    message: "Staff leaderboard with medals, expiring document alerts, and an interactive shift calendar.",
    features: ['Leaderboard', 'Doc alerts', 'Calendar', 'Shift density'],
    related: "Training, Broadcasts, Audit Log, Reports, Integrations (Xero/MYOB), AI Assistant — all accessible from the sidebar." },
  { icon: Heart, title: 'The Full Platform', target: null, pos: 'center',
    message: "This Admin Portal has 30+ pages. Plus there's a Staff Portal (GPS clock in, shift notes, forms, tasks, expenses, leaderboard) and a Family Portal (care updates, photos, AI assistant). All sharing data in real-time.",
    features: ['Admin 30+ pages', 'Staff 20 pages', 'Family 5 pages', '$149/mo flat'],
    related: "White-label ready — your brand, logo, domain. Unlimited staff, participants, family users. No per-user charges." },
  { icon: Sparkles, title: "You're All Set!", target: null, pos: 'center', isLast: true,
    message: "That's the admin tour! Have a click around — try creating a shift, viewing a participant, or running the audit report. Everything uses sample data so you can't break anything. ✨",
    features: ['50+ features', 'Sample data', 'Dark/light mode', 'Accent colours'], related: null },
]

/* ═══ STAFF STEPS ═══ */
const STAFF_STEPS = [
  { icon: Home, title: "Welcome to Your Portal!", target: 'tour-hero', pos: 'bottom',
    message: "Hey! I'm Merlin. This is your personal dashboard — your shifts, hours, streaks, and everything you need for your day.",
    features: ['Live greeting', 'Stat pills', 'Quick actions'], related: null },
  { icon: BarChart3, title: 'Your Key Stats', target: 'tour-stats', pos: 'bottom',
    message: "6 cards tracking upcoming shifts, overdue notes, total hours, day streak, weekly completions, and participant count. Tap 'Notes Due' to submit overdue notes.",
    features: ['Upcoming shifts', 'Notes due', 'Total hours', 'Day streak', 'Participants'],
    related: "Each card links to its section — shifts, notes, calendar, and more." },
  { icon: Activity, title: 'Overview, Shifts & Insights', target: 'tour-tabs', pos: 'bottom',
    message: "Three tabs: Overview shows your next shift and activity. Shifts shows today's schedule and this week. Insights has charts and performance stats.",
    features: ['Overview tab', 'Shifts tab', 'Insights tab'],
    related: "The Insights tab has hours breakdown charts, service type analysis, note compliance scores, and participant stats." },
  { icon: Play, title: 'Shifts & Clock In', target: 'tour-shift', pos: 'bottom',
    message: "Clock in with GPS verification — the system confirms you're within 200m of the shift location. Once active, a live timer tracks your hours. Clock out when done and submit your notes.",
    features: ['GPS clock in', '200m geofence', 'Live timer', 'Voice notes'],
    related: "Submit shift notes with voice-to-text, complete digital forms, log incidents, and administer medications — all from your phone." },
  { icon: Clock, title: 'Weekly Progress', target: 'tour-progress', pos: 'bottom',
    message: "Your hours progress bar toward the weekly target, and your note completion rate. NDIS requires timely notes — overdue ones get flagged in audits.",
    features: ['Hours bar', 'Note completion', 'Weekly target', 'Compliance tracking'],
    related: "Your admin can see your compliance rate. Keeping notes up to date helps the whole team stay audit-ready." },
  { icon: Calendar, title: 'Upcoming Shifts', target: 'tour-upcoming', pos: 'top',
    message: "All your scheduled shifts with dates, times, participants, and locations. Today's shifts are highlighted. Tap any shift for details.",
    features: ['Shift list', 'Today highlight', 'Participant info', 'Location'],
    related: "The Shifts tab has a full day-by-day breakdown with clock in/out buttons, and a weekly overview grid." },
  { icon: Briefcase, title: 'Calendar & Quick Actions', target: 'tour-sidebar', pos: 'top',
    message: "Mini calendar showing which days have shifts (coloured dots by status). Quick action buttons for roster, forms, incidents, and your profile.",
    features: ['Mini calendar', 'Quick actions', 'Frequent participants'],
    related: "You also have shift swaps, availability settings, time-off requests, training records, expenses, mileage tracking, and a gamified leaderboard." },
  { icon: Sparkles, title: "You're Ready!", target: null, pos: 'center', isLast: true,
    message: "That's your portal! Clock in to your next shift, submit your notes on time, and check the leaderboard to see how you rank. You've got this! 💪",
    features: ['GPS clock in/out', 'Voice notes', 'Digital forms', 'Leaderboard'], related: null },
]

/* ═══ FAMILY STEPS ═══ */
const FAMILY_STEPS = [
  { icon: Heart, title: "Welcome to the Family Portal!", target: null, pos: 'center',
    message: "This portal gives you secure, read-only access to your loved one's care. See shift updates, goals, medications, and photos from their support workers.",
    features: ['Care updates', 'Goal tracking', 'Medications', 'Photo gallery'], related: null },
  { icon: Sparkles, title: "That's It!", target: null, pos: 'center', isLast: true,
    message: "Everything updates in real-time as carers submit notes and complete shifts. You can also ask the AI Care Assistant questions about your loved one's care. ✨",
    features: ['Real-time updates', 'AI assistant', 'Secure access'], related: null },
]

/* ═══ MAIN COMPONENT ═══ */
export default function DemoTour() {
  const location = useLocation()
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const c = useBrandColors()

  const [active, setActive] = useState(false)
  const [step, setStep] = useState(0)
  const [minimized, setMinimized] = useState(false)
  const [hasSeenTour, setHasSeenTour] = useState(false)
  const [wizardBounce, setWizardBounce] = useState(true)
  const [overlayVisible, setOverlayVisible] = useState(false)
  const [tooltipVisible, setTooltipVisible] = useState(false)
  const [pillsVisible, setPillsVisible] = useState(false)
  const [targetRect, setTargetRect] = useState(null)
  const [smoothRect, setSmoothRect] = useState(null)
  const frameRef = useRef(null)
  const smoothRef = useRef(null)
  const timersRef = useRef([])

  // Detect portal
  const isStaff = location.pathname.startsWith('/staff')
  const isFamily = location.pathname.startsWith('/family')
  const isAdmin = location.pathname.startsWith('/admin')
  const portal = isStaff ? 'staff' : isFamily ? 'family' : 'admin'
  const STEPS = isStaff ? STAFF_STEPS : isFamily ? FAMILY_STEPS : ADMIN_STEPS
  const portalColor = isStaff ? (c.staff || '#3b82f6') : isFamily ? '#ec4899' : (c.primary || '#7c3aed')
  const portalHover = isStaff ? (c.staffHover || '#60a5fa') : isFamily ? '#db2777' : (c.adminHover || '#a855f7')
  const grad = `linear-gradient(135deg, ${portalColor}, ${portalHover})`

  const dk = { text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151', textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af', border: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.08)' }
  const cs = STEPS[step] || STEPS[0]
  const SI = cs?.icon || Sparkles
  const prog = ((step + 1) / STEPS.length) * 100

  const clearTimers = () => { timersRef.current.forEach(clearTimeout); timersRef.current = [] }
  const addTimer = (fn, ms) => { const t = setTimeout(fn, ms); timersRef.current.push(t); return t }
  const showSequence = () => { clearTimers(); setOverlayVisible(false); setTooltipVisible(false); setPillsVisible(false); addTimer(() => setOverlayVisible(true), 50); addTimer(() => setTooltipVisible(true), 350); addTimer(() => setPillsVisible(true), 650) }

  useEffect(() => { if (localStorage.getItem(`demo_tour_seen_${portal}`)) setHasSeenTour(true); const t = setTimeout(() => setWizardBounce(false), 3000); return () => { clearTimeout(t); clearTimers() } }, [portal])

  const measureTarget = useCallback(() => {
    if (!active || minimized || !cs?.target) { setTargetRect(null); return }
    const el = document.querySelector(`[data-tour="${cs.target}"]`)
    if (el) { const r = el.getBoundingClientRect(); if (r.width > 0 && r.height > 0) setTargetRect({ top: r.top, left: r.left, width: r.width, height: r.height, bottom: r.bottom, right: r.right }); else setTargetRect(null) } else setTargetRect(null)
    frameRef.current = requestAnimationFrame(measureTarget)
  }, [active, minimized, cs])

  useEffect(() => {
    if (!targetRect) { setSmoothRect(null); return }
    if (!smoothRect) { setSmoothRect(targetRect); return }
    const lerp = (a, b, t) => a + (b - a) * t
    const anim = () => { setSmoothRect(prev => { if (!prev || !targetRect) return targetRect; const n = { top: lerp(prev.top, targetRect.top, 0.12), left: lerp(prev.left, targetRect.left, 0.12), width: lerp(prev.width, targetRect.width, 0.12), height: lerp(prev.height, targetRect.height, 0.12), bottom: lerp(prev.bottom, targetRect.bottom, 0.12), right: lerp(prev.right, targetRect.right, 0.12) }; return Math.abs(n.top - targetRect.top) < 0.5 ? targetRect : n }); smoothRef.current = requestAnimationFrame(anim) }
    smoothRef.current = requestAnimationFrame(anim)
    return () => { if (smoothRef.current) cancelAnimationFrame(smoothRef.current) }
  }, [targetRect])

  useEffect(() => { if (active && !minimized) { const t = setTimeout(() => { frameRef.current = requestAnimationFrame(measureTarget) }, 300); return () => { clearTimeout(t); if (frameRef.current) cancelAnimationFrame(frameRef.current) } }; return () => { if (frameRef.current) cancelAnimationFrame(frameRef.current) } }, [active, minimized, step, measureTarget])

  useEffect(() => { if (!active || minimized || !cs?.target) return; const t = setTimeout(() => { const el = document.querySelector(`[data-tour="${cs.target}"]`); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'center' }) }, 400); return () => clearTimeout(t) }, [active, minimized, step])

  useEffect(() => { if (active && !minimized) showSequence() }, [active, minimized])

  const dashboardPath = isStaff ? '/staff/dashboard' : isFamily ? '/family/dashboard' : '/admin/dashboard'

  const startTour = () => { if (!location.pathname.startsWith(dashboardPath)) navigate(dashboardPath); setStep(0); setActive(true); setMinimized(false); setTimeout(() => showSequence(), 100) }
  const endTour = () => { clearTimers(); setOverlayVisible(false); setTooltipVisible(false); setPillsVisible(false); addTimer(() => { setActive(false); setStep(0); setMinimized(false); setTargetRect(null); setSmoothRect(null); localStorage.setItem(`demo_tour_seen_${portal}`, 'true'); setHasSeenTour(true) }, 400) }
  const goStep = (dir) => { const next = step + dir; if (next < 0 || next >= STEPS.length) { if (dir > 0) endTour(); return }; clearTimers(); setTooltipVisible(false); setPillsVisible(false); addTimer(() => { setStep(next); addTimer(() => setTooltipVisible(true), 250); addTimer(() => setPillsVisible(true), 500) }, 300) }

  // Only show on dashboard pages
  const showPaths = ['/admin/dashboard', '/staff/dashboard', '/family/dashboard']
  if (!showPaths.some(p => location.pathname.startsWith(p))) return null

  const getTP = () => {
    const r = smoothRect
    if (!r) return { s: { position: 'fixed', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }, ad: null }
    const mW = 400; const p = 16; const vw = window.innerWidth; const vh = window.innerHeight
    let top, left, dir
    if ((cs.pos === 'bottom' || !cs.pos) && r.bottom + p + 14 + 340 < vh) { top = r.bottom + p + 14; left = Math.max(20, Math.min(r.left + r.width / 2 - mW / 2, vw - mW - 20)); dir = 'up' }
    else if (cs.pos === 'top' && r.top - p - 14 - 340 > 0) { top = r.top - p - 14 - 320; left = Math.max(20, Math.min(r.left + r.width / 2 - mW / 2, vw - mW - 20)); dir = 'down' }
    else if (r.bottom + p + 14 + 340 < vh) { top = r.bottom + p + 14; left = Math.max(20, Math.min(r.left + r.width / 2 - mW / 2, vw - mW - 20)); dir = 'up' }
    else { top = Math.max(20, r.top - p - 320); left = Math.max(20, Math.min(r.left + r.width / 2 - mW / 2, vw - mW - 20)); dir = 'down' }
    return { s: { position: 'fixed', top, left, width: mW, maxWidth: 'calc(100vw - 40px)' }, ad: dir, al: Math.max(24, Math.min(r.left + r.width / 2 - left - 8, mW - 40)) }
  }
  const tp = getTP()

  return (
    <>
      <style>{`
        @keyframes tGlow{0%,100%{box-shadow:0 0 20px ${portalColor}25,0 0 60px ${portalColor}08}50%{box-shadow:0 0 32px ${portalColor}40,0 0 80px ${portalColor}12}}
        @keyframes wFl{0%,100%{transform:translateY(0) rotate(-1deg)}50%{transform:translateY(-6px) rotate(1deg)}}
        @keyframes wPu{0%,100%{box-shadow:0 8px 32px -8px ${portalColor}50}50%{box-shadow:0 8px 40px -8px ${portalColor}80,0 0 0 8px ${portalColor}10}}
      `}</style>

      {/* Spotlight */}
      {active && !minimized && smoothRect && (
        <svg style={{ position: 'fixed', inset: 0, zIndex: 9990, pointerEvents: 'none', width: '100vw', height: '100vh', opacity: overlayVisible ? 1 : 0, transition: 'opacity 0.5s cubic-bezier(.16,1,.3,1)' }}>
          <defs><mask id="tm"><rect x="0" y="0" width="100%" height="100%" fill="white" /><rect x={smoothRect.left - 12} y={smoothRect.top - 12} width={smoothRect.width + 24} height={smoothRect.height + 24} rx="18" ry="18" fill="black" /></mask></defs>
          <rect x="0" y="0" width="100%" height="100%" fill={isDark ? 'rgba(0,0,0,0.7)' : 'rgba(0,0,0,0.5)'} mask="url(#tm)" />
        </svg>
      )}
      {active && !minimized && smoothRect && <div style={{ position: 'fixed', zIndex: 9991, pointerEvents: 'none', top: smoothRect.top - 12, left: smoothRect.left - 12, width: smoothRect.width + 24, height: smoothRect.height + 24, borderRadius: 18, border: `2px solid ${portalColor}60`, animation: 'tGlow 2.5s ease-in-out infinite', opacity: overlayVisible ? 1 : 0, transition: 'opacity 0.4s ease' }} />}
      {active && !minimized && <div style={{ position: 'fixed', inset: 0, zIndex: 9992, cursor: 'pointer', opacity: overlayVisible ? 1 : 0, transition: 'opacity 0.4s ease' }} onClick={() => setMinimized(true)} />}
      {active && !minimized && !cs?.target && <div style={{ position: 'fixed', inset: 0, zIndex: 9990, background: isDark ? 'rgba(0,0,0,0.6)' : 'rgba(0,0,0,0.4)', backdropFilter: 'blur(4px)', WebkitBackdropFilter: 'blur(4px)', opacity: overlayVisible ? 1 : 0, transition: 'opacity 0.5s ease' }} onClick={() => setMinimized(true)} />}

      {/* Tooltip */}
      {active && !minimized && (
        <div style={{ ...tp.s, zIndex: 9995, opacity: tooltipVisible ? 1 : 0, transform: tooltipVisible ? 'translateY(0) scale(1)' : 'translateY(14px) scale(0.97)', transition: 'all 0.5s cubic-bezier(.16,1,.3,1)' }}>
          {tp.ad && <div style={{ position: 'absolute', ...(tp.ad === 'up' ? { top: -7 } : { bottom: -7 }), left: tp.al, opacity: tooltipVisible ? 1 : 0, transition: 'opacity 0.3s ease 0.15s' }}><div style={{ width: 14, height: 14, background: isDark ? 'rgba(30,41,59,0.97)' : 'rgba(255,255,255,0.98)', border: `1px solid ${dk.border}`, transform: 'rotate(45deg)', ...(tp.ad === 'up' ? { borderBottom: 'none', borderRight: 'none' } : { borderTop: 'none', borderLeft: 'none' }) }} /></div>}
          <div style={{ borderRadius: 22, overflow: 'hidden', background: isDark ? 'rgba(30,41,59,0.97)' : 'rgba(255,255,255,0.98)', border: `1px solid ${dk.border}`, backdropFilter: 'blur(24px)', WebkitBackdropFilter: 'blur(24px)', boxShadow: isDark ? '0 24px 80px -16px rgba(0,0,0,0.7)' : '0 24px 80px -16px rgba(0,0,0,0.18)' }}>
            {/* Header */}
            <div style={{ background: grad, padding: '16px 18px', display: 'flex', alignItems: 'center', gap: 12, position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ width: 44, height: 44, borderRadius: 14, flexShrink: 0, background: 'rgba(255,255,255,0.18)', border: '1.5px solid rgba(255,255,255,0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backdropFilter: 'blur(8px)' }}>
                <img src="/wizard.png" alt="Merlin" style={{ width: 34, height: 34, objectFit: 'contain', animation: 'wFl 4s ease-in-out infinite' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:20px">🧙</span>' }} />
              </div>
              <div style={{ flex: 1, minWidth: 0, position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><SI size={14} style={{ color: 'rgba(255,255,255,0.8)' }} /><p style={{ fontSize: 15, fontWeight: 800, color: 'white' }}>{cs.title}</p></div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginTop: 3 }}>
                  <p style={{ fontSize: 10, color: 'rgba(255,255,255,0.5)', fontWeight: 600 }}>Step {step + 1} of {STEPS.length}</p>
                  <div style={{ flex: 1, height: 3, borderRadius: 99, background: 'rgba(255,255,255,0.15)', overflow: 'hidden', maxWidth: 80 }}><div style={{ height: '100%', borderRadius: 99, background: 'rgba(255,255,255,0.6)', width: `${prog}%`, transition: 'width 0.6s cubic-bezier(.16,1,.3,1)' }} /></div>
                </div>
              </div>
              <button onClick={endTour} style={{ width: 30, height: 30, borderRadius: 10, background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s', position: 'relative', zIndex: 2 }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}><X size={14} style={{ color: 'white' }} /></button>
            </div>
            {/* Body */}
            <div style={{ padding: '16px 18px 10px' }}>
              <p style={{ fontSize: 13, lineHeight: 1.8, color: dk.textSoft, opacity: tooltipVisible ? 1 : 0, transform: tooltipVisible ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.4s cubic-bezier(.16,1,.3,1) 0.1s' }}>{cs.message}</p>
              {cs.features && <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6, marginTop: 12 }}>{cs.features.map((f, i) => (<div key={f} style={{ padding: '5px 12px', borderRadius: 9, fontSize: 10, fontWeight: 700, background: isDark ? 'rgba(255,255,255,0.06)' : `${portalColor}06`, border: `1px solid ${isDark ? 'rgba(255,255,255,0.08)' : `${portalColor}10`}`, color: dk.textMuted, opacity: pillsVisible ? 1 : 0, transform: pillsVisible ? 'translateY(0) scale(1)' : 'translateY(6px) scale(0.92)', transition: `all 0.4s cubic-bezier(.16,1,.3,1) ${i * 70 + 100}ms` }}>{f}</div>))}</div>}
              {cs.related && <div style={{ marginTop: 14, padding: '10px 14px', borderRadius: 12, background: isDark ? `${portalColor}08` : `${portalColor}04`, border: `1px solid ${isDark ? `${portalColor}15` : `${portalColor}10`}`, opacity: pillsVisible ? 1 : 0, transform: pillsVisible ? 'translateY(0)' : 'translateY(6px)', transition: 'all 0.4s cubic-bezier(.16,1,.3,1) 0.5s' }}><div style={{ display: 'flex', alignItems: 'flex-start', gap: 8 }}><Eye size={13} style={{ color: portalColor, flexShrink: 0, marginTop: 2 }} /><p style={{ fontSize: 11, lineHeight: 1.65, color: dk.textMuted, fontWeight: 500 }}>{cs.related}</p></div></div>}
            </div>
            {/* Footer */}
            <div style={{ padding: '10px 18px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: `1px solid ${dk.border}` }}>
              <button onClick={() => goStep(-1)} disabled={step === 0} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '9px 14px', borderRadius: 11, border: 'none', background: 'transparent', cursor: step === 0 ? 'not-allowed' : 'pointer', fontSize: 12, fontWeight: 600, color: dk.textFaint, opacity: step === 0 ? 0.3 : 1 }} onMouseEnter={e => { if (step > 0) e.currentTarget.style.background = isDark ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.03)' }} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}><ChevronLeft size={14} /> Back</button>
              <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>{STEPS.map((_, i) => (<div key={i} style={{ width: i === step ? 20 : 6, height: 6, borderRadius: 50, background: i === step ? grad : i < step ? `${portalColor}40` : (isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'), transition: 'all 0.4s cubic-bezier(.16,1,.3,1)' }} />))}</div>
              <button onClick={() => goStep(1)} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '9px 20px', borderRadius: 11, border: 'none', background: grad, cursor: 'pointer', fontSize: 12, fontWeight: 700, color: 'white', boxShadow: `0 4px 16px -4px ${portalColor}50`, transition: 'all 0.25s cubic-bezier(.16,1,.3,1)' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-1px)' }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)' }}>{cs.isLast ? <><Sparkles size={13} /> Finish</> : <>Next <ChevronRight size={14} /></>}</button>
            </div>
          </div>
        </div>
      )}

      {/* Wizard button */}
      {!active && <button onClick={startTour} className={`fixed z-[999] group ${wizardBounce ? 'animate-bounce' : ''}`} style={{ bottom: 24, right: 24 }}><div style={{ position: 'relative' }}><div style={{ width: 58, height: 58, borderRadius: 18, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2.5px solid ${isDark ? 'rgba(255,255,255,0.15)' : 'rgba(255,255,255,0.8)'}`, animation: 'wPu 3s ease-in-out infinite', overflow: 'hidden', transition: 'transform 0.3s cubic-bezier(.16,1,.3,1)' }} className="group-hover:scale-110 group-active:scale-95"><img src="/wizard.png" alt="Merlin" style={{ width: 42, height: 42, objectFit: 'contain', animation: 'wFl 4s ease-in-out infinite' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:26px">🧙</span>' }} /></div><div style={{ position: 'absolute', top: -5, right: -5, width: 22, height: 22, borderRadius: 50, background: '#fbbf24', display: 'flex', alignItems: 'center', justifyContent: 'center', border: `2.5px solid ${isDark ? '#0f172a' : '#ffffff'}`, boxShadow: '0 2px 8px rgba(251,191,36,0.4)' }}><Sparkles size={10} style={{ color: '#ffffff' }} /></div></div><div style={{ position: 'absolute', bottom: '100%', right: 0, marginBottom: 10, padding: '8px 14px', borderRadius: 12, background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)', border: `1px solid ${dk.border}`, backdropFilter: 'blur(12px)', boxShadow: isDark ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.1)', whiteSpace: 'nowrap', pointerEvents: 'none', opacity: 0, transform: 'translateY(4px)', transition: 'all 0.25s cubic-bezier(.16,1,.3,1)' }} className="group-hover:!opacity-100 group-hover:!translate-y-0"><p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>{hasSeenTour ? 'Restart Tour' : 'Take the Tour!'} ✨</p></div></button>}

      {/* Minimized */}
      {active && minimized && <button onClick={() => { setMinimized(false); showSequence() }} style={{ position: 'fixed', bottom: 24, right: 24, zIndex: 999, display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px 10px 10px', borderRadius: 16, background: isDark ? 'rgba(30,41,59,0.95)' : 'rgba(255,255,255,0.98)', border: `1px solid ${dk.border}`, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', boxShadow: isDark ? '0 12px 48px -8px rgba(0,0,0,0.5)' : '0 12px 48px -8px rgba(0,0,0,0.12)', cursor: 'pointer', transition: 'all 0.3s cubic-bezier(.16,1,.3,1)' }} onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-3px)'} onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}><div style={{ width: 36, height: 36, borderRadius: 11, background: grad, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}><img src="/wizard.png" alt="" style={{ width: 28, height: 28, objectFit: 'contain' }} onError={e => { e.target.style.display = 'none'; e.target.parentElement.innerHTML = '<span style="font-size:16px">🧙</span>' }} /></div><div><p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>Continue Tour</p><p style={{ fontSize: 9, color: dk.textFaint }}>{step + 1}/{STEPS.length} · {cs.title}</p></div><svg width={30} height={30} style={{ transform: 'rotate(-90deg)' }}><circle cx={15} cy={15} r={11} fill="none" stroke={isDark ? 'rgba(255,255,255,0.08)' : 'rgba(0,0,0,0.06)'} strokeWidth={2.5} /><circle cx={15} cy={15} r={11} fill="none" stroke={portalColor} strokeWidth={2.5} strokeLinecap="round" strokeDasharray={2 * Math.PI * 11} strokeDashoffset={2 * Math.PI * 11 * (1 - prog / 100)} style={{ transition: 'stroke-dashoffset 0.6s cubic-bezier(.16,1,.3,1)' }} /></svg></button>}
    </>
  )
}