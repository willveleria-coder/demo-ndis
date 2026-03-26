import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  ClipboardList, Pill, AlertTriangle, AlertOctagon, DollarSign, ChevronRight,
  Check, Loader2, Clock, FileText, Download, Upload, X, Repeat, MapPin, Heart,
  Utensils, Activity, Brain, Target, ShieldCheck, Shield, ShieldAlert, Smile, Car,
  Truck, MessageCircle, HardHat, Move, Siren, ClipboardCheck, Phone, Users, SprayCan,
  Moon, Search, Filter, CheckCircle, Eye, ArrowRight, Sparkles, BarChart3, Star
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../../components/ui/Modal'
import HazardForm from './forms/HazardForm'
import IncidentForm from './forms/IncidentForm'
import ComplaintsForm from './forms/ComplaintsForm'
import CashReconciliationForm from './forms/CashReconciliationForm'
import MedicationIncidentForm from './forms/MedicationIncidentForm'
import MedicationChartForm from './forms/MedicationChartForm'

/* ═══════════════════════════════════════════════
   CONSTANTS — 100% preserved
   ═══════════════════════════════════════════════ */
const CUSTOM_FORM_MAP = {
  'hazard report': 'hazard', 'hazard': 'hazard',
  'incident report': 'incident', 'incident': 'incident',
  'complaints / feedback form': 'complaints', 'complaints': 'complaints', 'complaints / feedback': 'complaints', 'complaints/feedback': 'complaints',
  'cash reconciliation': 'cash',
  'medication incident report': 'med_incident', 'medication incident': 'med_incident',
  'medication chart form': 'med_chart', 'medication chart': 'med_chart',
}

function matchCustomForm(title) {
  if (!title) return null
  const t = title.toLowerCase().trim()
  if (CUSTOM_FORM_MAP[t]) return CUSTOM_FORM_MAP[t]
  if (t.includes('hazard')) return 'hazard'
  if (t.includes('medication') && t.includes('incident')) return 'med_incident'
  if (t.includes('medication') && t.includes('chart')) return 'med_chart'
  if (t.includes('incident')) return 'incident'
  if (t.includes('complaint') || t.includes('feedback')) return 'complaints'
  if (t.includes('cash') || t.includes('reconciliation')) return 'cash'
  return null
}

const iconMap = {
  'pill': Pill, 'alert-octagon': AlertOctagon, 'alert-triangle': AlertTriangle,
  'dollar-sign': DollarSign, 'clipboard': ClipboardList, 'clipboard-list': ClipboardList,
  'file-text': FileText, 'truck': Truck, 'message-circle': MessageCircle,
  'repeat': Repeat, 'map-pin': MapPin, 'heart': Heart, 'utensils': Utensils,
  'activity': Activity, 'brain': Brain, 'target': Target, 'shield-check': ShieldCheck,
  'shield': Shield, 'shield-alert': ShieldAlert, 'smile': Smile, 'car': Car, 'clock': Clock,
  'hard-hat': HardHat, 'move': Move, 'siren': Siren, 'clipboard-check': ClipboardCheck,
  'phone': Phone, 'users': Users, 'spray-can': SprayCan, 'moon': Moon,
}

function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  return d.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })
}
function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'Just now'
  if (diff < 3600) return `${Math.floor(diff/60)}m ago`
  if (diff < 86400) return `${Math.floor(diff/3600)}h ago`
  if (diff < 604800) return `${Math.floor(diff/86400)}d ago`
  return formatDate(iso)
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{
        background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`, borderRadius: '1.25rem',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        cursor: hover || onClick ? 'pointer' : undefined, ...style,
      }}
      onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
      onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
      {...p}>{children}</div>
  )
}
function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return <div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6+delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />
}
function AnimNum({ value, duration = 1200 }) {
  const [display, setDisplay] = useState(0)
  const frameRef = useRef()
  useEffect(() => {
    const num = typeof value === 'number' ? value : parseInt(value) || 0
    const start = performance.now()
    function tick(now) { const p = Math.min((now-start)/duration,1); setDisplay(Math.round(num*(1-Math.pow(1-p,3)))); if(p<1) frameRef.current=requestAnimationFrame(tick) }
    frameRef.current = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frameRef.current)
  }, [value, duration])
  return <>{display}</>
}
function Badge({ children, color = 'gray', isDark }) {
  const palettes = {
    gray: isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},
    green: isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},
    amber: isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},
    red: isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},
    blue: isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},
    purple: isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},
    orange: isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},
    teal: isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'},
  }
  const pl = palettes[color]||palettes.gray
  return <span style={{ display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap' }}>{children}</span>
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffForms() {
  const navigate = useNavigate()
  const { staffProfile, myShifts } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [showForm, setShowForm] = useState(null)
  const [formData, setFormData] = useState({})
  const [submitting, setSubmitting] = useState(false)
  const [recentSubmissions, setRecentSubmissions] = useState([])
  const [templates, setTemplates] = useState([])
  const [loading, setLoading] = useState(true)
  const [customForm, setCustomForm] = useState(null)
  const [uploadingDoc, setUploadingDoc] = useState(false)
  const [uploadedDocUrl, setUploadedDocUrl] = useState(null)
  const [uploadedDocName, setUploadedDocName] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeTab, setActiveTab] = useState('forms')

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }
  const stg = (i) => ({ transitionDelay:`${i*50}ms`, opacity:loaded?1:0, transform:loaded?'translateY(0)':'translateY(14px)', transition:'all .6s cubic-bezier(.16,1,.3,1)' })
  const inputStyle = { width:'100%', padding:'12px 14px', background:dk.inputBg, border:`1.5px solid ${dk.inputBorder}`, borderRadius:12, fontSize:13, fontWeight:600, color:dk.text, outline:'none', transition:'all .2s' }

  const activeShift = myShifts.find(s => s.status === 'in_progress') || null
  const staffName = staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Staff Member'

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => { loadData() }, [staffProfile?.id])
  useEffect(() => { const h = () => loadData(); window.addEventListener('focus', h); return () => window.removeEventListener('focus', h) }, [staffProfile?.id])

  const loadData = async () => {
    try {
      const { data: tpls } = await supabase.from('form_templates').select('*').eq('active', true).order('mandatory', { ascending: false }).order('title', { ascending: true })
      if (tpls) setTemplates(tpls)
      if (staffProfile?.id) {
        const { data: subs } = await supabase.from('form_submissions').select('*').eq('staff_id', staffProfile.id).order('submitted_at', { ascending: false }).limit(20)
        if (subs) setRecentSubmissions(subs)
      }
    } catch (e) { console.error('Failed to load forms:', e) }
    finally { setLoading(false) }
  }

  /* ─── handlers (100% preserved) ─── */
  const handleDocUpload = async (file) => {
    if (!file) return
    if (file.size > 10 * 1024 * 1024) { alert('File too large — max 10MB'); return }
    setUploadingDoc(true)
    try {
      const fileName = `form-submissions/${staffProfile?.id || 'unknown'}/${Date.now()}_${file.name.replace(/[^a-zA-Z0-9._-]/g, '_')}`
      const { error } = await supabase.storage.from('documents').upload(fileName, file, { cacheControl: '3600', upsert: true, contentType: file.type || 'application/octet-stream' })
      if (error) throw error
      const { data: urlData } = supabase.storage.from('documents').getPublicUrl(fileName)
      setUploadedDocUrl(urlData.publicUrl)
      setUploadedDocName(file.name)
    } catch (err) { console.error('Upload error:', err); alert('Upload failed: ' + (err.message || 'Unknown error')) }
    finally { setUploadingDoc(false) }
  }

  const handleSubmit = async () => {
    setSubmitting(true)
    try {
      const submissionData = { ...formData }
      if (uploadedDocUrl) { submissionData._uploaded_document = uploadedDocUrl; submissionData._uploaded_document_name = uploadedDocName }
      const { error: insertError } = await supabase.from('form_submissions').insert({ form_type: showForm.templateId ? `template_${showForm.templateId}` : showForm.id, staff_id: staffProfile?.id, shift_id: activeShift?.id || null, data: submissionData, submitted_at: new Date().toISOString() })
      if (insertError) throw insertError
      alert('Form submitted successfully!')
      setShowForm(null); setFormData({}); setUploadedDocUrl(null); setUploadedDocName(null)
      if (staffProfile?.id) {
        const { data: subs } = await supabase.from('form_submissions').select('*').eq('staff_id', staffProfile.id).order('submitted_at', { ascending: false }).limit(20)
        if (subs) setRecentSubmissions(subs)
      }
    } catch (err) { console.error('Form save failed:', err); alert('Failed to submit: ' + (err.message || 'Unknown error')) }
    finally { setSubmitting(false) }
  }

  /* ─── computed ─── */
  const templateLabelMap = {}
  templates.forEach(t => { templateLabelMap[`template_${t.id}`] = t.title })
  const getFormLabel = (formType) => templateLabelMap[formType] || formType?.replace(/_/g, ' ') || 'Form'
  const mandatoryCount = templates.filter(t => t.mandatory).length
  const docFormCount = templates.filter(t => t.document_url).length
  const submittedCount = recentSubmissions.length
  const reviewedCount = recentSubmissions.filter(s => s.status === 'reviewed').length
  const flaggedCount = recentSubmissions.filter(s => s.status === 'flagged').length
  const pendingCount = recentSubmissions.filter(s => !s.status || s.status === 'submitted').length

  const filteredTemplates = templates.filter(t => {
    if (!searchQuery.trim()) return true
    const q = searchQuery.toLowerCase()
    return (t.title || '').toLowerCase().includes(q) || (t.description || '').toLowerCase().includes(q)
  })

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', height:'60vh', gap:16 }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }}>
          <ClipboardList size={22} style={{ color:'white' }} />
        </div>
        <div style={{ position:'absolute', inset:-4, borderRadius:18, border:`2px solid ${c.staff}`, opacity:0.3, animation:'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize:13, fontWeight:600, color:dk.textMuted }}>Loading forms...</p>
    </div>
  )

  /* ─── custom form routing (100% preserved) ─── */
  if (customForm === 'hazard') return <HazardForm onBack={() => setCustomForm(null)} />
  if (customForm === 'incident') return <IncidentForm onBack={() => setCustomForm(null)} />
  if (customForm === 'complaints') return <ComplaintsForm onBack={() => setCustomForm(null)} />
  if (customForm === 'cash') return <CashReconciliationForm onBack={() => setCustomForm(null)} />
  if (customForm === 'med_incident') return <MedicationIncidentForm onBack={() => setCustomForm(null)} />
  if (customForm === 'med_chart') return <MedicationChartForm onBack={() => setCustomForm(null)} />

  return (
    <div style={{ position:'relative', minHeight:'100vh', overflow:'hidden' }}>
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes countUp { from { opacity:0;transform:translateY(8px) scale(0.95) } to { opacity:1;transform:translateY(0) scale(1) } }
        .count-up { animation: countUp .7s cubic-bezier(.16,1,.3,1) forwards }
      `}</style>

      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0} />
      <Orb color={c.staffHover} size={200} bottom="10%" left="-40px" delay={2} />
      <Orb color="#8b5cf6" size={160} top="40%" right="15%" delay={4} />
      <Orb color="#06b6d4" size={200} bottom="-50px" right="25%" delay={1} />
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      <div style={{ position:'relative', zIndex:1, padding:'0 0 40px' }}>

        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0), background:`linear-gradient(135deg, ${c.staff} 0%, ${c.staffHover} 40%, #3b82f6 70%, #06b6d4 100%)`, borderRadius:20, padding:'28px 24px', marginBottom:24, position:'relative', overflow:'hidden' }}>
          <div style={{ position:'absolute', top:-40, right:-40, width:180, height:180, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
          <div style={{ position:'absolute', bottom:-50, left:-30, width:150, height:150, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
          <div style={{ position:'absolute', top:'55%', right:'22%', width:50, height:50, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
          <div style={{ position:'absolute', inset:0, opacity:0.15, backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px, transparent 1px)', backgroundSize:'16px 16px' }} />
          {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'},{top:'35%',left:'8%',size:4,delay:'2s'}].map((dot,i)=>(
            <div key={i} style={{ position:'absolute', top:dot.top, left:dot.left, width:dot.size, height:dot.size, borderRadius:'50%', background:'rgba(255,255,255,0.4)', animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite` }} />
          ))}
          <div style={{ position:'relative', zIndex:2 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:14, flexWrap:'wrap' }}>
              <span style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'4px 12px', borderRadius:999, background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', fontSize:11, fontWeight:700, color:'white', letterSpacing:'0.04em' }}>
                <ClipboardList size={12} /> FORMS
              </span>
              {mandatoryCount > 0 && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, background:'rgba(239,68,68,0.3)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:700, color:'#fca5a5' }}>
                  <AlertTriangle size={10} /> {mandatoryCount} REQUIRED
                </span>
              )}
              {activeShift && (
                <span style={{ display:'inline-flex', alignItems:'center', gap:4, padding:'4px 10px', borderRadius:999, background:'rgba(16,185,129,0.3)', backdropFilter:'blur(8px)', fontSize:10, fontWeight:700, color:'#a7f3d0' }}>
                  <span style={{ width:6, height:6, borderRadius:3, background:'#34d399', animation:'pulse-dot 1.5s infinite' }} /> ON SHIFT
                </span>
              )}
            </div>
            <h1 style={{ fontSize:26, fontWeight:900, color:'white', lineHeight:1.2, marginBottom:4 }}>Forms & Templates</h1>
            <p style={{ fontSize:13, color:'rgba(255,255,255,0.75)', marginBottom:16 }}>
              {templates.length} available form{templates.length !== 1 ? 's' : ''} · {submittedCount} submission{submittedCount !== 1 ? 's' : ''}
            </p>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {[
                { label:'Available', value:templates.length, icon:ClipboardList },
                { label:'Required', value:mandatoryCount, icon:AlertTriangle },
                { label:'Submitted', value:submittedCount, icon:CheckCircle },
                { label:'With Docs', value:docFormCount, icon:FileText },
              ].map((pill,i) => (
                <div key={i} style={{ display:'inline-flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:999, background:'rgba(255,255,255,0.15)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.15)' }}>
                  <pill.icon size={12} style={{ color:'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize:12, fontWeight:800, color:'white' }}>{pill.value}</span>
                  <span style={{ fontSize:10, color:'rgba(255,255,255,0.6)' }}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{ ...stg(1), display:'grid', gridTemplateColumns:'repeat(auto-fit, minmax(150px, 1fr))', gap:14, marginBottom:24 }}>
          {[
            { icon:ClipboardList, label:'Available Forms', value:templates.length, gradient:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, glow:`${c.staff}40` },
            { icon:CheckCircle, label:'Submitted', value:submittedCount, gradient:'linear-gradient(135deg, #10b981, #059669)', glow:'rgba(16,185,129,0.3)' },
            { icon:Eye, label:'Reviewed', value:reviewedCount, gradient:'linear-gradient(135deg, #3b82f6, #06b6d4)', glow:'rgba(59,130,246,0.3)' },
            { icon:AlertTriangle, label:'Flagged', value:flaggedCount, gradient:'linear-gradient(135deg, #ef4444, #dc2626)', glow:'rgba(239,68,68,0.3)', alert:flaggedCount > 0 },
          ].map((stat,i) => (
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{ padding:'18px 16px' }}>
              <div style={{ display:'flex', alignItems:'flex-start', justifyContent:'space-between', marginBottom:10 }}>
                <div style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:stat.gradient, boxShadow:`0 4px 12px -2px ${stat.glow}` }}>
                  <stat.icon size={18} style={{ color:'white' }} />
                </div>
                {stat.alert && <span style={{ width:8, height:8, borderRadius:4, background:'#ef4444', animation:'pulse-dot 1.5s ease-in-out infinite' }} />}
              </div>
              <p style={{ fontSize:26, fontWeight:900, color:dk.text, lineHeight:1 }}><AnimNum value={stat.value} /></p>
              <p style={{ fontSize:11, fontWeight:600, color:dk.textFaint, marginTop:4 }}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ ACTIVE SHIFT BANNER ═══════ */}
        {activeShift ? (
          <Glass isDark={isDark} glow={`${c.staff}20`} style={{ ...stg(2), padding:16, marginBottom:20, position:'relative', overflow:'hidden' }}>
            <div style={{ position:'absolute', inset:0, opacity:0.05, background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})` }} />
            <div style={{ position:'relative', display:'flex', alignItems:'center', gap:14 }}>
              <div style={{ width:44, height:44, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, flexShrink:0 }}>
                <Clock size={20} style={{ color:'white' }} />
              </div>
              <div style={{ flex:1 }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:c.staff }}>Active Shift — Forms linked automatically</p>
                <p style={{ fontSize:14, fontWeight:700, color:dk.text, marginTop:2 }}>{activeShift.participants ? `${activeShift.participants.first_name} ${activeShift.participants.last_name}` : 'Current Shift'}</p>
                <p style={{ fontSize:11, color:dk.textMuted }}>{activeShift.service_type || activeShift.title || 'Support'}{activeShift.location ? ` · ${activeShift.location}` : ''}</p>
              </div>
              <Badge color="green" isDark={isDark}>Active</Badge>
            </div>
          </Glass>
        ) : (
          <Glass isDark={isDark} style={{ ...stg(2), padding:16, marginBottom:20, borderLeft:`4px solid #f59e0b` }}>
            <div style={{ display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:38, height:38, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #f59e0b, #f97316)', flexShrink:0 }}>
                <AlertTriangle size={16} style={{ color:'white' }} />
              </div>
              <div>
                <p style={{ fontSize:13, fontWeight:700, color:dk.text }}>No Active Shift</p>
                <p style={{ fontSize:11, color:dk.textMuted }}>You can still submit forms — they'll be saved without a shift reference</p>
              </div>
            </div>
          </Glass>
        )}

        {/* ═══════ TABS ═══════ */}
        <Glass isDark={isDark} style={{ ...stg(3), padding:6, marginBottom:20, display:'flex', gap:4, flexWrap:'wrap' }}>
          {[
            { id:'forms', label:'Available Forms', icon:ClipboardList, count:templates.length },
            { id:'submissions', label:'My Submissions', icon:CheckCircle, count:submittedCount },
          ].map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              style={{
                flex:'1 1 auto', display:'flex', alignItems:'center', justifyContent:'center', gap:6,
                padding:'10px 16px', borderRadius:14, border:'none', cursor:'pointer',
                fontSize:13, fontWeight:700, transition:'all .25s cubic-bezier(.16,1,.3,1)',
                background: activeTab===tab.id ? `linear-gradient(135deg, ${c.staff}, ${c.staffHover})` : 'transparent',
                color: activeTab===tab.id ? 'white' : dk.textMuted,
                boxShadow: activeTab===tab.id ? `0 4px 16px -4px ${c.staff}50` : 'none',
              }}>
              <tab.icon size={15} />
              {tab.label}
              {tab.count > 0 && <span style={{ padding:'1px 7px', borderRadius:999, fontSize:10, fontWeight:800, background:activeTab===tab.id?'rgba(255,255,255,0.25)':dk.subtleBg2, color:activeTab===tab.id?'white':dk.textMuted }}>{tab.count}</span>}
            </button>
          ))}
        </Glass>

        {/* ═══════ FORMS TAB ═══════ */}
        {activeTab === 'forms' && (
          <div style={stg(4)}>
            {/* Search */}
            <Glass isDark={isDark} style={{ padding:'4px 14px', display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <Search size={16} style={{ color:dk.textFaint, flexShrink:0 }} />
              <input type="text" placeholder="Search forms..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
                style={{ flex:1, padding:'10px 0', background:'transparent', border:'none', outline:'none', fontSize:13, fontWeight:600, color:dk.text, minWidth:0 }} />
              {searchQuery && <button onClick={() => setSearchQuery('')} style={{ padding:4, borderRadius:6, border:'none', cursor:'pointer', background:dk.subtleBg2, color:dk.textFaint }}><X size={12} /></button>}
            </Glass>

            <div style={{ display:'flex', alignItems:'center', justifyContent:'space-between', marginBottom:12 }}>
              <p style={{ fontSize:12, color:dk.textFaint }}>{filteredTemplates.length} form{filteredTemplates.length !== 1 ? 's' : ''}{searchQuery && ` matching "${searchQuery}"`}</p>
            </div>

            {filteredTemplates.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {filteredTemplates.map((tpl, idx) => {
                  const Icon = iconMap[tpl.icon] || ClipboardList
                  const isRequired = tpl.mandatory
                  const hasDoc = !!tpl.document_url
                  const gradientColors = tpl.color || 'from-teal-500 to-cyan-500'
                  // Parse Tailwind gradient to inline
                  const gradientMap = {
                    'from-teal-500 to-cyan-500': 'linear-gradient(135deg, #14b8a6, #06b6d4)',
                    'from-red-500 to-rose-500': 'linear-gradient(135deg, #ef4444, #f43f5e)',
                    'from-amber-500 to-orange-500': 'linear-gradient(135deg, #f59e0b, #f97316)',
                    'from-blue-500 to-indigo-500': 'linear-gradient(135deg, #3b82f6, #6366f1)',
                    'from-purple-500 to-violet-500': 'linear-gradient(135deg, #a855f7, #8b5cf6)',
                    'from-emerald-500 to-green-500': 'linear-gradient(135deg, #10b981, #22c55e)',
                    'from-pink-500 to-rose-500': 'linear-gradient(135deg, #ec4899, #f43f5e)',
                    'from-sky-500 to-blue-500': 'linear-gradient(135deg, #0ea5e9, #3b82f6)',
                    'from-indigo-500 to-purple-500': 'linear-gradient(135deg, #6366f1, #a855f7)',
                    'from-violet-500 to-purple-500': 'linear-gradient(135deg, #8b5cf6, #a855f7)',
                    'from-yellow-500 to-amber-500': 'linear-gradient(135deg, #eab308, #f59e0b)',
                    'from-indigo-500 to-gray-600': 'linear-gradient(135deg, #6366f1, #4b5563)',
                  }
                  const inlineGrad = gradientMap[gradientColors] || `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`

                  return (
                    <Glass key={tpl.id} isDark={isDark} hover
                      onClick={() => {
                        const customKey = matchCustomForm(tpl.title)
                        if (customKey) { setCustomForm(customKey); return }
                        setShowForm({ id: tpl.id, templateId: tpl.id, title: tpl.title, desc: tpl.description || `${(tpl.fields || []).length} fields`, color: tpl.color || 'from-teal-500 to-cyan-500', mandatory: tpl.mandatory, fields: (tpl.fields || []).map(f => ({ ...f, key: f.key || f.id })), document_url: tpl.document_url || null })
                        setFormData({})
                      }}
                      style={{ padding:16, display:'flex', alignItems:'center', gap:14, borderLeft: isRequired ? '4px solid #ef4444' : undefined }}
                    >
                      <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:inlineGrad, boxShadow:'0 4px 12px -2px rgba(0,0,0,0.15)', flexShrink:0 }}>
                        <Icon size={22} style={{ color:'white' }} />
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, flexWrap:'wrap', marginBottom:2 }}>
                          <p style={{ fontSize:14, fontWeight:700, color:dk.text }}>{tpl.title}</p>
                          {isRequired && <Badge color="red" isDark={isDark}>Required</Badge>}
                          {hasDoc && <Badge color="blue" isDark={isDark}>Doc</Badge>}
                        </div>
                        <p style={{ fontSize:11, color:dk.textFaint, lineHeight:1.5 }}>{tpl.description || `${(tpl.fields || []).length} fields`}</p>
                      </div>
                      <div style={{ width:36, height:36, borderRadius:10, display:'flex', alignItems:'center', justifyContent:'center', background:dk.subtleBg, flexShrink:0 }}>
                        <ChevronRight size={16} style={{ color:dk.textFaint }} />
                      </div>
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass isDark={isDark} style={{ padding:'50px 24px', textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:18, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background:`linear-gradient(135deg, ${c.staff}20, ${c.staffHover}15)` }}>
                  <ClipboardList size={24} style={{ color:c.staff }} />
                </div>
                <p style={{ fontSize:15, fontWeight:800, color:dk.text }}>{searchQuery ? 'No matching forms' : 'No forms available'}</p>
                <p style={{ fontSize:12, color:dk.textFaint, marginTop:4 }}>{searchQuery ? 'Try adjusting your search' : 'Form templates will appear here once your admin creates them'}</p>
                {searchQuery && <button onClick={() => setSearchQuery('')} style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:14, padding:'10px 20px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white', fontSize:13, fontWeight:700 }}>Clear search</button>}
              </Glass>
            )}
          </div>
        )}

        {/* ═══════ SUBMISSIONS TAB ═══════ */}
        {activeTab === 'submissions' && (
          <div style={stg(4)}>
            {recentSubmissions.length > 0 ? (
              <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
                {recentSubmissions.map((sub, idx) => {
                  const statusColor = sub.status === 'reviewed' ? 'green' : sub.status === 'flagged' ? 'red' : 'amber'
                  return (
                    <Glass key={sub.id} isDark={isDark} style={{ padding:16, display:'flex', alignItems:'center', gap:14 }}>
                      <div style={{
                        width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
                        background: sub.status === 'reviewed' ? 'linear-gradient(135deg, #10b981, #059669)' : sub.status === 'flagged' ? 'linear-gradient(135deg, #ef4444, #dc2626)' : 'linear-gradient(135deg, #f59e0b, #f97316)',
                      }}>
                        {sub.status === 'reviewed' ? <CheckCircle size={18} style={{color:'white'}} /> : sub.status === 'flagged' ? <AlertTriangle size={18} style={{color:'white'}} /> : <Clock size={18} style={{color:'white'}} />}
                      </div>
                      <div style={{ flex:1, minWidth:0 }}>
                        <div style={{ display:'flex', alignItems:'center', gap:6, marginBottom:2 }}>
                          <p style={{ fontSize:13, fontWeight:700, color:dk.text }}>{getFormLabel(sub.form_type)}</p>
                          <Badge color={statusColor} isDark={isDark}>{(sub.status || 'submitted').replace(/\b\w/g, ch => ch.toUpperCase())}</Badge>
                        </div>
                        <p style={{ fontSize:11, color:dk.textFaint }}>
                          {sub.data?.participant_name && `${sub.data.participant_name} · `}
                          {formatDate(sub.submitted_at)} · {formatTime(sub.submitted_at)}
                        </p>
                      </div>
                      <span style={{ fontSize:10, fontWeight:600, color:dk.textFaint }}>{timeAgo(sub.submitted_at)}</span>
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass isDark={isDark} style={{ padding:'50px 24px', textAlign:'center' }}>
                <div style={{ width:56, height:56, borderRadius:18, margin:'0 auto 14px', display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, rgba(16,185,129,0.15), rgba(5,150,105,0.1))' }}>
                  <CheckCircle size={24} style={{ color:'#10b981' }} />
                </div>
                <p style={{ fontSize:15, fontWeight:800, color:dk.text }}>No submissions yet</p>
                <p style={{ fontSize:12, color:dk.textFaint, marginTop:4 }}>Your submitted forms will appear here</p>
                <button onClick={() => setActiveTab('forms')} style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:14, padding:'10px 20px', borderRadius:12, border:'none', cursor:'pointer', background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white', fontSize:13, fontWeight:700 }}>
                  <ClipboardList size={14} /> Browse forms
                </button>
              </Glass>
            )}
          </div>
        )}

      </div>

      {/* ═══════ FORM MODAL — gradient hero header ═══════ */}
      <Modal isOpen={!!showForm} onClose={() => { setShowForm(null); setUploadedDocUrl(null); setUploadedDocName(null) }} title="" wide>
        {showForm && (
          <div>
            {/* Gradient hero header */}
           <div style={{ margin:'-20px -20px 0', marginBottom:0 }}>
              <div style={{
                background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover}, #3b82f6)`,
                padding:'24px', position:'relative', overflow:'hidden',
              }}>
                <div style={{ position:'absolute', top:-20, right:-20, width:100, height:100, borderRadius:'50%', background:'rgba(255,255,255,0.1)' }} />
                <div style={{ position:'absolute', bottom:-15, left:-15, width:60, height:60, borderRadius:'50%', background:'rgba(255,255,255,0.08)' }} />
                <div style={{ position:'relative', zIndex:2, display:'flex', alignItems:'center', gap:14 }}>
                  <div style={{ width:48, height:48, borderRadius:14, display:'flex', alignItems:'center', justifyContent:'center', background:'rgba(255,255,255,0.2)', backdropFilter:'blur(8px)', border:'1px solid rgba(255,255,255,0.2)' }}>
                    <ClipboardList size={22} style={{ color:'white' }} />
                  </div>
                  <div>
                    <h3 style={{ fontSize:18, fontWeight:900, color:'white' }}>{showForm.title}</h3>
                    <p style={{ fontSize:12, color:'rgba(255,255,255,0.75)', marginTop:2 }}>{showForm.desc}</p>
                  </div>
                  {showForm.mandatory && <Badge color="red" isDark={false}>Required</Badge>}
                </div>
              </div>
            </div>

            <div style={{ padding:'20px 0 0', display:'flex', flexDirection:'column', gap:16 }}>
              {/* Shift link */}
              {activeShift && (
                <div style={{ padding:14, borderRadius:14, background: isDark ? `${c.staff}12` : `${c.staff}06`, border:`1px solid ${isDark ? `${c.staff}25` : `${c.staff}15`}`, display:'flex', alignItems:'center', gap:10 }}>
                  <Clock size={14} style={{ color:c.staff, flexShrink:0 }} />
                  <div>
                    <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.06em', color:c.staff }}>Linked to Shift</p>
                    <p style={{ fontSize:12, color:dk.text, marginTop:2 }}>
                      {activeShift.participants ? `${activeShift.participants.first_name} ${activeShift.participants.last_name}` : 'Current shift'} · {activeShift.shift_date ? new Date(activeShift.shift_date).toLocaleDateString('en-AU') : 'Today'}
                    </p>
                  </div>
                </div>
              )}

              {/* Document template */}
              {showForm.document_url && (
                <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${dk.divider}` }}>
                  <div style={{ padding:14, display:'flex', alignItems:'center', justifyContent:'space-between', background: isDark ? `${c.staff}10` : `${c.staff}05` }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <FileText size={16} style={{ color:c.staff }} />
                      <p style={{ fontSize:12, fontWeight:700, color:dk.text }}>Reference Document</p>
                    </div>
                    <a href={showForm.document_url} target="_blank" rel="noopener noreferrer"
                      style={{ display:'flex', alignItems:'center', gap:6, padding:'6px 14px', borderRadius:10, background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white', fontSize:11, fontWeight:700, textDecoration:'none' }}>
                      <Download size={12} /> Download
                    </a>
                  </div>
                  {showForm.document_url.toLowerCase().endsWith('.pdf') ? (
                    <iframe src={showForm.document_url} style={{ width:'100%', height:400, border:'none' }} title="Form document" />
                  ) : (
                    <div style={{ padding:'40px 20px', textAlign:'center', background:dk.subtleBg }}>
                      <FileText size={36} style={{ color:dk.textFaint, margin:'0 auto 8px' }} />
                      <p style={{ fontSize:13, fontWeight:600, color:dk.textMuted }}>Word Document</p>
                      <p style={{ fontSize:11, color:dk.textFaint, marginTop:4 }}>Click Download to view and fill out</p>
                      <a href={showForm.document_url} target="_blank" rel="noopener noreferrer"
                        style={{ display:'inline-flex', alignItems:'center', gap:6, marginTop:12, padding:'10px 20px', borderRadius:12, background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white', fontSize:12, fontWeight:700, textDecoration:'none' }}>
                        <Download size={14} /> Open Document
                      </a>
                    </div>
                  )}
                </div>
              )}

              {/* Upload completed doc */}
              {showForm.document_url && (
                <div style={{ borderRadius:14, overflow:'hidden', border:`1px solid ${dk.divider}` }}>
                  <div style={{ padding:14, background: isDark ? `${c.staff}10` : `${c.staff}05` }}>
                    <p style={{ fontSize:12, fontWeight:700, color:dk.text, display:'flex', alignItems:'center', gap:6 }}><Upload size={14} style={{ color:c.staff }} /> Upload Completed Document</p>
                    <p style={{ fontSize:10, color:dk.textMuted, marginTop:2 }}>Download the template above, fill it out, then upload here</p>
                  </div>
                  <div style={{ padding:14 }}>
                    {uploadedDocUrl ? (
                      <div style={{ display:'flex', alignItems:'center', gap:12, padding:12, borderRadius:12, background:dk.subtleBg, border:`1px solid ${dk.divider}` }}>
                        <div style={{ width:40, height:40, borderRadius:12, display:'flex', alignItems:'center', justifyContent:'center', background:'linear-gradient(135deg, #10b981, #059669)', flexShrink:0 }}>
                          <Check size={18} style={{ color:'white' }} />
                        </div>
                        <div style={{ flex:1, minWidth:0 }}>
                          <p style={{ fontSize:12, fontWeight:700, color:dk.text, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{uploadedDocName}</p>
                          <p style={{ fontSize:10, color:'#10b981' }}>Ready to submit</p>
                        </div>
                        <button onClick={() => { setUploadedDocUrl(null); setUploadedDocName(null) }}
                          style={{ padding:6, borderRadius:8, border:'none', cursor:'pointer', background:dk.subtleBg2, color:dk.textFaint }}>
                          <X size={14} />
                        </button>
                      </div>
                    ) : (
                      <label style={{
                        display:'block', padding:20, border:`2px dashed ${uploadingDoc ? c.staff : dk.divider}`,
                        borderRadius:14, textAlign:'center', cursor:'pointer', transition:'all .2s',
                        background: uploadingDoc ? (isDark ? `${c.staff}10` : `${c.staff}04`) : 'transparent',
                      }}>
                        <input type="file" accept=".pdf,.doc,.docx" style={{ display:'none' }} onChange={e => handleDocUpload(e.target.files?.[0])} disabled={uploadingDoc} />
                        {uploadingDoc ? (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                            <Loader2 size={18} style={{ color:c.staff, animation:'spin 1s linear infinite' }} />
                            <p style={{ fontSize:13, fontWeight:600, color:c.staff }}>Uploading...</p>
                          </div>
                        ) : (
                          <div style={{ display:'flex', alignItems:'center', justifyContent:'center', gap:8 }}>
                            <Upload size={18} style={{ color:dk.textFaint }} />
                            <p style={{ fontSize:13, fontWeight:600, color:dk.textMuted }}>Choose file (.pdf, .doc, .docx)</p>
                          </div>
                        )}
                      </label>
                    )}
                  </div>
                </div>
              )}

              {/* Dynamic form fields */}
              {showForm.fields.map(field => (
                <div key={field.key}>
                  {field.type === 'checkbox' ? (
                    <label style={{ display:'flex', alignItems:'center', gap:10, cursor:'pointer', padding:'4px 0' }}>
                      <input type="checkbox" checked={formData[field.key] === 'Yes'}
                        onChange={e => setFormData({ ...formData, [field.key]: e.target.checked ? 'Yes' : 'No' })}
                        style={{ width:18, height:18, borderRadius:4, accentColor:c.staff }} />
                      <span style={{ fontSize:13, fontWeight:600, color:dk.text }}>{field.label}{field.required ? ' *' : ''}</span>
                    </label>
                  ) : (
                    <>
                      <p style={{ fontSize:11, fontWeight:700, color:dk.textMuted, marginBottom:6 }}>{field.label}{field.required ? ' *' : ''}</p>
                      {field.type === 'textarea' ? (
                        <textarea value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          rows={3} placeholder={`Enter ${field.label.toLowerCase()}...`}
                          style={{ ...inputStyle, resize:'vertical', minHeight:80 }}
                          onFocus={e => { e.currentTarget.style.borderColor=c.staff; e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15` }}
                          onBlur={e => { e.currentTarget.style.borderColor=dk.inputBorder; e.currentTarget.style.boxShadow='none' }} />
                      ) : field.type === 'select' ? (
                        <select value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          style={inputStyle}
                          onFocus={e => { e.currentTarget.style.borderColor=c.staff; e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15` }}
                          onBlur={e => { e.currentTarget.style.borderColor=dk.inputBorder; e.currentTarget.style.boxShadow='none' }}>
                          <option value="">Select...</option>
                          {(field.options || []).map(opt => <option key={opt} value={opt}>{opt}</option>)}
                        </select>
                      ) : (
                        <input type={field.type} value={formData[field.key] || ''} onChange={e => setFormData({ ...formData, [field.key]: e.target.value })}
                          placeholder={`Enter ${field.label.toLowerCase()}...`}
                          style={inputStyle}
                          onFocus={e => { e.currentTarget.style.borderColor=c.staff; e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15` }}
                          onBlur={e => { e.currentTarget.style.borderColor=dk.inputBorder; e.currentTarget.style.boxShadow='none' }} />
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Submitted by info */}
              <div style={{ padding:14, borderRadius:14, background:dk.subtleBg, border:`1px solid ${dk.divider}` }}>
                <p style={{ fontSize:10, fontWeight:700, textTransform:'uppercase', letterSpacing:'0.05em', color:dk.textFaint }}>Submitted by</p>
                <p style={{ fontSize:13, fontWeight:800, color:dk.text, marginTop:4 }}>{staffName}</p>
                <p style={{ fontSize:10, color:dk.textFaint, marginTop:2 }}>
                  {new Date().toLocaleDateString('en-AU', { weekday:'long', day:'numeric', month:'long', year:'numeric' })} · {new Date().toLocaleTimeString('en-AU', { hour:'numeric', minute:'2-digit', hour12:true })}
                </p>
              </div>

              {/* Action buttons */}
              <div style={{ display:'flex', gap:10, flexWrap:'wrap' }}>
                <button onClick={() => setShowForm(null)}
                  style={{ flex:1, display:'flex', alignItems:'center', justifyContent:'center', gap:6, padding:'14px 20px', borderRadius:14, border:`1.5px solid ${dk.divider}`, background:'transparent', color:dk.text, fontSize:13, fontWeight:600, cursor:'pointer', transition:'all .2s' }}
                  onMouseEnter={e => e.currentTarget.style.background=dk.subtleBg2}
                  onMouseLeave={e => e.currentTarget.style.background='transparent'}>
                  Cancel
                </button>
                <button disabled={submitting} onClick={handleSubmit}
                  style={{
                    flex:2, display:'flex', alignItems:'center', justifyContent:'center', gap:8,
                    padding:'14px 20px', borderRadius:14, border:'none', cursor:submitting?'default':'pointer',
                    background:`linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, color:'white',
                    fontSize:13, fontWeight:800, opacity:submitting?0.6:1,
                    boxShadow:`0 4px 16px -4px ${c.staff}50`, transition:'all .2s',
                  }}
                  onMouseEnter={e => { if(!submitting) e.currentTarget.style.transform='scale(1.02)' }}
                  onMouseLeave={e => { e.currentTarget.style.transform='scale(1)' }}>
                  {submitting ? <><Loader2 size={16} style={{ animation:'spin 1s linear infinite' }} /> Submitting...</> : <><Check size={16} /> Submit Form</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}