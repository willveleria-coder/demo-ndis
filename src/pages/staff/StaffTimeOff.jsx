import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, Clock, Plus, Check, X, Loader2, Search, Filter,
  AlertTriangle, CheckCircle, XCircle, ChevronRight, Eye,
  Palmtree, ArrowRight, Shield
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({children,className='',glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div className={className} onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffTimeOff() {
  const navigate = useNavigate()
  const { staffProfile, timeOffRequests, setTimeOffRequests } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [showAddUnavail, setShowAddUnavail] = useState(false)
  const [newUnavail, setNewUnavail] = useState({ reason: '', start_date: '', end_date: '', notes: '' })
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false)
  const [statusFilter, setStatusFilter] = useState('all')
  const [viewRequest, setViewRequest] = useState(null)

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

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

  /* ─── handlers (100% preserved) ─── */
  const handleSubmitTimeOff = async () => {
    if (!newUnavail.reason || !newUnavail.start_date || !newUnavail.end_date) { alert('Please fill in reason, start date, and end date'); return }
    if (new Date(newUnavail.end_date) < new Date(newUnavail.start_date)) { alert('End date must be after start date'); return }
    setSubmittingTimeOff(true)
    try {
      const { data, error } = await supabase.from('time_off_requests').insert({ staff_id: staffProfile.id, reason: newUnavail.reason, start_date: newUnavail.start_date, end_date: newUnavail.end_date, notes: newUnavail.notes || null, status: 'pending' }).select().single()
      if (error) throw error
      setTimeOffRequests(prev => [data, ...prev])
      setShowAddUnavail(false); setNewUnavail({ reason: '', start_date: '', end_date: '', notes: '' }); alert('Time off request submitted!')
    } catch (err) { alert('Failed to submit: ' + err.message) }
    finally { setSubmittingTimeOff(false) }
  }

  const handleCancelTimeOff = async (id) => {
    if (!confirm('Cancel this time off request?')) return
    try {
      const { error } = await supabase.from('time_off_requests').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
      setTimeOffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } catch (err) { alert('Failed to cancel: ' + err.message) }
  }

  /* ─── computed ─── */
  const pendingCount = timeOffRequests.filter(r => r.status === 'pending').length
  const approvedCount = timeOffRequests.filter(r => r.status === 'approved').length
  const declinedCount = timeOffRequests.filter(r => r.status === 'declined').length
  const cancelledCount = timeOffRequests.filter(r => r.status === 'cancelled').length
  const activeCount = timeOffRequests.filter(r => r.status !== 'cancelled').length
  const today = new Date().toISOString().split('T')[0]
  const upcomingApproved = timeOffRequests.filter(r => r.status === 'approved' && r.end_date >= today)
  const totalDaysApproved = upcomingApproved.reduce((a, r) => a + Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1, 0)

  const getDays = (r) => Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1

  const filteredRequests = statusFilter === 'all' ? timeOffRequests : timeOffRequests.filter(r => r.status === statusFilter)

  const statusConfig = {
    pending: { color: 'amber', label: 'Pending Review', icon: Clock, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)' },
    approved: { color: 'green', label: 'Approved', icon: CheckCircle, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
    declined: { color: 'red', label: 'Declined', icon: XCircle, gradient: 'linear-gradient(135deg, #ef4444, #dc2626)', glow: 'rgba(239,68,68,0.3)' },
    cancelled: { color: 'gray', label: 'Cancelled', icon: X, gradient: 'linear-gradient(135deg, #64748b, #475569)', glow: 'rgba(100,116,139,0.2)' },
  }

  return (
    <div style={{ position: 'relative', minHeight: '100vh', overflow: 'hidden' }}>
      <style>{`
        @keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}
        @keyframes ping{75%,100%{transform:scale(1.8);opacity:0}}
        @keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}
        @keyframes countUp{from{opacity:0;transform:translateY(8px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .count-up{animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards}
      `}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#f59e0b" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#06b6d4" size={140} top="20%" left="20%" delay={3} />

      <div style={{ position: 'relative', zIndex: 1, padding: '0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background: `linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius: 20, padding: '28px 24px', marginBottom: 24, position: 'relative', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', top: -40, right: -40, width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', bottom: -50, left: -30, width: 150, height: 150, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
          <div style={{ position: 'absolute', top: '55%', right: '22%', width: 50, height: 50, borderRadius: '50%', background: 'rgba(255,255,255,0.08)' }} />
          <div style={{ position: 'absolute', inset: 0, opacity: 0.15, backgroundImage: 'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize: '16px 16px' }} />
          {[{ top: '15%', left: '85%', size: 5, delay: '0s' }, { top: '70%', left: '90%', size: 3, delay: '1s' }, { top: '35%', left: '8%', size: 4, delay: '2s' }].map((dot, i) => (
            <div key={i} style={{ position: 'absolute', top: dot.top, left: dot.left, width: dot.size, height: dot.size, borderRadius: '50%', background: 'rgba(255,255,255,0.4)', animation: `pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}
          <div style={{ position: 'relative', zIndex: 2 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
              <span style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '4px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', fontSize: 11, fontWeight: 700, color: 'white', letterSpacing: '0.04em' }}>
                <Palmtree size={12} /> TIME OFF
              </span>
              {pendingCount > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(245,158,11,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#fde68a' }}>
                  <Clock size={10} /> {pendingCount} PENDING
                </span>
              )}
              {upcomingApproved.length > 0 && (
                <span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, background: 'rgba(16,185,129,0.3)', backdropFilter: 'blur(8px)', fontSize: 10, fontWeight: 700, color: '#a7f3d0' }}>
                  <CheckCircle size={10} /> {upcomingApproved.length} UPCOMING
                </span>
              )}
            </div>
            <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', lineHeight: 1.2, marginBottom: 4 }}>Time Off</h1>
            <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.75)', marginBottom: 16 }}>Request and manage your leave</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 16 }}>
              {[
                { label: 'Requests', value: activeCount, icon: Calendar },
                { label: 'Pending', value: pendingCount, icon: Clock },
                { label: 'Approved', value: approvedCount, icon: CheckCircle },
                { label: 'Days Booked', value: totalDaysApproved, icon: Palmtree },
              ].map((pill, i) => (
                <div key={i} style={{ display: 'inline-flex', alignItems: 'center', gap: 6, padding: '6px 14px', borderRadius: 999, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 12, fontWeight: 800, color: 'white' }}>{pill.value}</span>
                  <span style={{ fontSize: 10, color: 'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
            <button onClick={() => setShowAddUnavail(true)}
              style={{ display: 'inline-flex', alignItems: 'center', gap: 8, padding: '10px 20px', borderRadius: 12, background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.25)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.3)'}
              onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}>
              <Plus size={16} /> Request Time Off
            </button>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 14, marginBottom: 24 }}>
          {[
            { icon: Calendar, label: 'Total Requests', value: activeCount, gradient: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow: `${c.staff}40` },
            { icon: Clock, label: 'Pending', value: pendingCount, gradient: 'linear-gradient(135deg, #f59e0b, #f97316)', glow: 'rgba(245,158,11,0.3)', alert: pendingCount > 0 },
            { icon: CheckCircle, label: 'Approved', value: approvedCount, gradient: 'linear-gradient(135deg, #10b981, #059669)', glow: 'rgba(16,185,129,0.3)' },
            { icon: Palmtree, label: 'Days Booked', value: totalDaysApproved, gradient: 'linear-gradient(135deg, #06b6d4, #0891b2)', glow: 'rgba(6,182,212,0.3)' },
          ].map((stat, i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding: '18px 16px' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 10 }}>
                <div style={{ width: 38, height: 38, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: stat.gradient, boxShadow: `0 4px 12px -2px ${stat.glow}` }}>
                  <stat.icon size={18} style={{ color: 'white' }} />
                </div>
                {stat.alert && <span style={{ width: 8, height: 8, borderRadius: 4, background: '#ef4444', animation: 'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize: 26, fontWeight: 900, color: dk.text, lineHeight: 1 }}><AnimNum value={stat.value} /></p>
              <p style={{ fontSize: 11, fontWeight: 600, color: dk.textFaint, marginTop: 4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ UPCOMING APPROVED ═══════ */}
        {upcomingApproved.length > 0 && (
          <div style={{ ...stg(2), background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, borderRadius: 16, padding: 20, marginBottom: 20, position: 'relative', overflow: 'hidden' }}>
            <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
            <p style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,0.8)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 12 }}>Upcoming Approved Leave</p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {upcomingApproved.map(r => (
                <div key={r.id} style={{ display: 'flex', alignItems: 'center', gap: 12, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', borderRadius: 12, padding: '12px 16px' }}>
                  <Calendar size={16} style={{ color: 'white', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: 13, fontWeight: 700, color: 'white' }}>{r.reason}</p>
                    <p style={{ fontSize: 11, color: 'rgba(255,255,255,0.7)' }}>
                      {new Date(r.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}
                    </p>
                  </div>
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'rgba(255,255,255,0.8)' }}>{getDays(r)} day{getDays(r) !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══════ FILTER TABS ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(3), padding: 6, marginBottom: 20, display: 'flex', gap: 4, flexWrap: 'wrap' }}>
          {[
            { id: 'all', label: 'All', count: timeOffRequests.length },
            { id: 'pending', label: 'Pending', count: pendingCount },
            { id: 'approved', label: 'Approved', count: approvedCount },
            { id: 'declined', label: 'Declined', count: declinedCount },
            { id: 'cancelled', label: 'Cancelled', count: cancelledCount },
          ].map(f => (
            <button key={f.id} onClick={() => setStatusFilter(f.id)}
              style={{
                flex: '1 1 auto', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
                padding: '8px 12px', borderRadius: 12, border: 'none', cursor: 'pointer',
                fontSize: 12, fontWeight: 700, transition: 'all .25s cubic-bezier(.16,1,.3,1)',
                background: statusFilter === f.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: statusFilter === f.id ? 'white' : dk.textMuted,
                boxShadow: statusFilter === f.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
              }}>
              {f.label}
              {f.count > 0 && <span style={{ padding: '1px 7px', borderRadius: 999, fontSize: 9, fontWeight: 800, background: statusFilter === f.id ? 'rgba(255,255,255,0.25)' : dk.subtleBg2, color: statusFilter === f.id ? 'white' : dk.textFaint }}>{f.count}</span>}
            </button>
          ))}
        </Glass>

        {/* ═══════ REQUESTS LIST ═══════ */}
        <div style={stg(4)}>
          <p style={{ fontSize: 12, color: dk.textFaint, marginBottom: 10 }}>{filteredRequests.length} request{filteredRequests.length !== 1 ? 's' : ''}</p>
          {filteredRequests.length > 0 ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filteredRequests.map(r => {
                const days = getDays(r)
                const isPast = new Date(r.end_date) < new Date()
                const sc = statusConfig[r.status] || statusConfig.pending
                return (
                  <Glass key={r.id} isDark={isDark} hover onClick={() => setViewRequest(r)}
                    style={{
                      padding: 16, display: 'flex', alignItems: 'flex-start', gap: 14,
                      opacity: isPast && r.status !== 'pending' ? 0.65 : 1,
                      borderLeft: `4px solid ${r.status === 'approved' ? '#10b981' : r.status === 'declined' ? '#ef4444' : r.status === 'cancelled' ? '#64748b' : '#f59e0b'}`,
                    }}>
                    <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: sc.gradient, boxShadow: `0 4px 12px -2px ${sc.glow}`, flexShrink: 0 }}>
                      <sc.icon size={18} style={{ color: 'white' }} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap', marginBottom: 4 }}>
                        <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{r.reason}</p>
                        <Badge color={sc.color} isDark={isDark}>{sc.label}</Badge>
                      </div>
                      <p style={{ fontSize: 12, color: dk.textMuted }}>
                        {new Date(r.start_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                        <span style={{ color: dk.textFaint }}> · </span><span style={{ fontWeight: 600 }}>{days} day{days !== 1 ? 's' : ''}</span>
                      </p>
                      {r.notes && <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4, fontStyle: 'italic' }}>"{r.notes}"</p>}
                      {r.created_at && <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 4 }}>Submitted {new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>}
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6, flexShrink: 0 }}>
                      {r.status === 'pending' && (
                        <button onClick={(e) => { e.stopPropagation(); handleCancelTimeOff(r.id) }}
                          style={{ padding: '6px 12px', borderRadius: 8, border: `1px solid ${dk.divider}`, background: 'transparent', color: dk.textMuted, fontSize: 11, fontWeight: 600, cursor: 'pointer', transition: 'all .2s' }}
                          onMouseEnter={e => { e.currentTarget.style.background = isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2'; e.currentTarget.style.color = '#ef4444' }}
                          onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = dk.textMuted }}>
                          Cancel
                        </button>
                      )}
                      <ChevronRight size={14} style={{ color: dk.textFaint }} />
                    </div>
                  </Glass>
                )
              })}
            </div>
          ) : (
            <Glass isDark={isDark} style={{ padding: '50px 24px', textAlign: 'center' }}>
              <div style={{ width: 56, height: 56, borderRadius: 18, margin: '0 auto 14px', display: 'flex', alignItems: 'center', justifyContent: 'center', background: `linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)` }}>
                <Palmtree size={24} style={{ color: c.staff }} />
              </div>
              <p style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>{statusFilter !== 'all' ? 'No matching requests' : 'No time off requests'}</p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 4 }}>{statusFilter !== 'all' ? 'Try a different filter' : 'Submit a request to get started'}</p>
              {statusFilter === 'all' && (
                <button onClick={() => setShowAddUnavail(true)}
                  style={{ display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 14, padding: '10px 20px', borderRadius: 12, border: 'none', cursor: 'pointer', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 700 }}>
                  <Plus size={14} /> Request Time Off
                </button>
              )}
            </Glass>
          )}
        </div>
      </div>

      {/* ═══════ NEW REQUEST MODAL ═══════ */}
      <Modal isOpen={showAddUnavail} onClose={() => setShowAddUnavail(false)} title="" wide>
        <div>
          <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
            <div style={{ background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 12 }}>
                <div style={{ width: 44, height: 44, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                  <Palmtree size={20} style={{ color: 'white' }} />
                </div>
                <div>
                  <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>Request Time Off</h3>
                  <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>Your manager will review the request</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ padding: 12, borderRadius: 12, display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff', border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}` }}>
              <Shield size={14} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: isDark ? '#93c5fd' : '#1d4ed8' }}>You'll see the status update here once it's been reviewed.</p>
            </div>
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Leave Type *</p>
              <select value={newUnavail.reason} onChange={e => setNewUnavail({ ...newUnavail, reason: e.target.value })} style={inputStyle}
                onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }}>
                <option value="">Select type...</option>
                <option>Annual Leave</option><option>Sick Leave</option><option>Personal Leave</option><option>Carer's Leave</option><option>Compassionate Leave</option><option>Training</option><option>Unpaid Leave</option><option>Other</option>
              </select>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Start Date *</p>
                <input type="date" value={newUnavail.start_date} onChange={e => setNewUnavail({ ...newUnavail, start_date: e.target.value })} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                  onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
              <div>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>End Date *</p>
                <input type="date" value={newUnavail.end_date} onChange={e => setNewUnavail({ ...newUnavail, end_date: e.target.value })} style={inputStyle}
                  onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                  onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
              </div>
            </div>
            {newUnavail.start_date && newUnavail.end_date && new Date(newUnavail.end_date) >= new Date(newUnavail.start_date) && (
              <div style={{ padding: '10px 14px', borderRadius: 12, textAlign: 'center', fontSize: 13, fontWeight: 700, background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}`, color: isDark ? '#34d399' : '#059669' }}>
                {Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1} day{Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1 !== 1 ? 's' : ''} requested
              </div>
            )}
            <div>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6 }}>Notes <span style={{ fontWeight: 500, color: dk.textFaint }}>(optional)</span></p>
              <textarea value={newUnavail.notes} onChange={e => setNewUnavail({ ...newUnavail, notes: e.target.value })} placeholder="Any additional details for your manager..." rows={2}
                style={{ ...inputStyle, resize: 'vertical', minHeight: 60 }}
                onFocus={e => { e.currentTarget.style.borderColor = c.staff; e.currentTarget.style.boxShadow = `0 0 0 3px ${c.staff}15` }}
                onBlur={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.boxShadow = 'none' }} />
            </div>
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', paddingTop: 4 }}>
              <button onClick={() => setShowAddUnavail(false)}
                style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.text, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                Cancel
              </button>
              <button onClick={handleSubmitTimeOff} disabled={submittingTimeOff}
                style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, padding: '14px 20px', borderRadius: 14, border: 'none', cursor: submittingTimeOff ? 'default' : 'pointer', background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color: 'white', fontSize: 13, fontWeight: 800, opacity: submittingTimeOff ? 0.6 : 1, boxShadow: `0 4px 16px -4px ${c.staff}50`, transition: 'all .2s' }}>
                {submittingTimeOff ? <><Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> Submitting...</> : <><Palmtree size={16} /> Submit Request</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* ═══════ DETAIL MODAL ═══════ */}
      <Modal isOpen={!!viewRequest} onClose={() => setViewRequest(null)} title="" wide>
        {viewRequest && (() => {
          const sc = statusConfig[viewRequest.status] || statusConfig.pending
          const days = getDays(viewRequest)
          return (
            <div>
              <div style={{ margin: '-24px -24px 0', marginBottom: 0 }}>
                <div style={{ background: sc.gradient.replace('135deg', '135deg').replace(')', ', #3b82f6)').replace('linear-gradient(135deg, ', 'linear-gradient(135deg, ') || `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, padding: '24px', position: 'relative', overflow: 'hidden' }}>
                  <div style={{ position: 'absolute', top: -20, right: -20, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
                  <div style={{ position: 'relative', zIndex: 2, display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(8px)' }}>
                      <sc.icon size={22} style={{ color: 'white' }} />
                    </div>
                    <div>
                      <h3 style={{ fontSize: 18, fontWeight: 900, color: 'white' }}>{viewRequest.reason}</h3>
                      <p style={{ fontSize: 12, color: 'rgba(255,255,255,0.8)', marginTop: 2 }}>{days} day{days !== 1 ? 's' : ''} · {sc.label}</p>
                    </div>
                  </div>
                </div>
              </div>
              <div style={{ padding: '20px 0 0', display: 'flex', flexDirection: 'column', gap: 14 }}>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(130px, 1fr))', gap: 10 }}>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Start Date</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{new Date(viewRequest.start_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>End Date</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{new Date(viewRequest.end_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Duration</p>
                    <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginTop: 4 }}>{days} day{days !== 1 ? 's' : ''}</p>
                  </div>
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}`, display: 'flex', alignItems: 'center', gap: 8 }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint }}>Status</p>
                    <Badge color={sc.color} isDark={isDark}>{sc.label}</Badge>
                  </div>
                </div>
                {viewRequest.notes && (
                  <div style={{ padding: 14, borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.divider}` }}>
                    <p style={{ fontSize: 10, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.05em', color: dk.textFaint, marginBottom: 6 }}>Notes</p>
                    <p style={{ fontSize: 13, color: dk.text, lineHeight: 1.6, fontStyle: 'italic' }}>"{viewRequest.notes}"</p>
                  </div>
                )}
                {viewRequest.created_at && (
                  <p style={{ fontSize: 11, color: dk.textFaint }}>Submitted {new Date(viewRequest.created_at).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                )}
                <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
                  {viewRequest.status === 'pending' && (
                    <button onClick={() => { handleCancelTimeOff(viewRequest.id); setViewRequest(null) }}
                      style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${isDark ? 'rgba(239,68,68,0.3)' : '#fecaca'}`, background: 'transparent', color: isDark ? '#f87171' : '#dc2626', fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                      <X size={14} /> Cancel Request
                    </button>
                  )}
                  <button onClick={() => setViewRequest(null)}
                    style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6, padding: '14px 20px', borderRadius: 14, border: `1.5px solid ${dk.divider}`, background: 'transparent', color: dk.textMuted, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
                    Close
                  </button>
                </div>
              </div>
            </div>
          )
        })()}
      </Modal>
    </div>
  )
}