import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  FileText, ChevronRight, ChevronLeft, Download, Check, Loader2, Search,
  Users, Eye, CheckCircle, Clock, AlertTriangle, X, Trash2, Shield, Filter,
  ArrowRight, Sparkles, BarChart3, FolderOpen, PenTool, Star
} from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import Modal from '../../components/ui/Modal'

/* ═══════════════════════════════════════════════
   CONSTANTS — 100% preserved
   ═══════════════════════════════════════════════ */
const DOC_TYPE_LABELS = {
  service_agreement: 'Service Agreement', ndis_plan: 'NDIS Plan', risk_assessment: 'Risk Assessment',
  consent_form: 'Consent Form', medical_report: 'Medical Report', behaviour_support_plan: 'Behaviour Support Plan',
  support_plan: 'Support Plan', other: 'Other',
}
const DOC_TYPE_COLORS_INLINE = {
  service_agreement: 'linear-gradient(135deg, #3b82f6, #6366f1)',
  ndis_plan: 'linear-gradient(135deg, #10b981, #14b8a6)',
  risk_assessment: 'linear-gradient(135deg, #f59e0b, #f97316)',
  consent_form: 'linear-gradient(135deg, #8b5cf6, #a855f7)',
  medical_report: 'linear-gradient(135deg, #ef4444, #f43f5e)',
  behaviour_support_plan: 'linear-gradient(135deg, #ec4899, #f43f5e)',
  support_plan: 'linear-gradient(135deg, #06b6d4, #3b82f6)',
  other: 'linear-gradient(135deg, #64748b, #475569)',
}

/* ═══════════════════════════════════════════════
   SIGNATURE PAD — 100% preserved logic
   ═══════════════════════════════════════════════ */
function SignaturePad({ value, onChange, isDark, accentColor }) {
  const canvasRef = useRef(null)
  const [drawing, setDrawing] = useState(false)
  const getPos = (e) => { const rect = canvasRef.current.getBoundingClientRect(); const touch = e.touches ? e.touches[0] : e; return { x: touch.clientX - rect.left, y: touch.clientY - rect.top } }
  const startDraw = (e) => { e.preventDefault(); setDrawing(true); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.beginPath(); ctx.moveTo(pos.x, pos.y) }
  const draw = (e) => { if (!drawing) return; e.preventDefault(); const ctx = canvasRef.current.getContext('2d'); const pos = getPos(e); ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = isDark ? '#e2e8f0' : '#1a1a1a'; ctx.lineTo(pos.x, pos.y); ctx.stroke() }
  const endDraw = () => { setDrawing(false); if (canvasRef.current) onChange(canvasRef.current.toDataURL()) }
  const clear = () => { const ctx = canvasRef.current.getContext('2d'); ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height); onChange('') }
  return (
    <div>
      <div style={{ position:'relative', borderRadius:14, overflow:'hidden', border:`2px solid ${isDark?'rgba(71,85,105,0.5)':'#d1d5db'}`, background:isDark?'#0f172a':'#fff' }}>
        <canvas ref={canvasRef} width={460} height={160} style={{ width:'100%', touchAction:'none', cursor:'crosshair' }}
          onMouseDown={startDraw} onMouseMove={draw} onMouseUp={endDraw} onMouseLeave={endDraw}
          onTouchStart={startDraw} onTouchMove={draw} onTouchEnd={endDraw} />
        <div style={{ position:'absolute', bottom:12, left:16, right:16, borderTop:`1px solid ${isDark?'rgba(51,65,85,0.4)':'#d1d5db'}`, pointerEvents:'none' }} />
        <p style={{ position:'absolute', bottom:2, left:16, fontSize:9, color:isDark?'#475569':'#d1d5db', pointerEvents:'none' }}>Sign here</p>
      </div>
      {value && (
        <button onClick={clear} style={{ display:'flex', alignItems:'center', gap:6, marginTop:8, padding:0, border:'none', background:'none', cursor:'pointer', fontSize:12, fontWeight:600, color:'#ef4444' }}>
          <Trash2 size={12} /> Clear signature
        </button>
      )}
    </div>
  )
}

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({ children, className = '', glow, style = {}, hover = false, isDark = false, onClick, ...p }) {
  const base = isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{ background:base, backdropFilter:'blur(20px)', WebkitBackdropFilter:'blur(20px)', border:`1px solid ${border}`, borderRadius:'1.25rem', boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)', transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined, cursor:hover||onClick?'pointer':undefined, ...style }}
      onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined}
      onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined}
      {...p}>{children}</div>
  )
}
function Orb({ color, size=200, top, left, right, bottom, delay=0 }) {
  return <div style={{ position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0 }} />
}
function AnimNum({ value, duration=1200 }) {
  const [display, setDisplay] = useState(0); const frameRef = useRef()
  useEffect(() => { const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current) }, [value,duration])
  return <>{display}</>
}
function Badge({ children, color='gray', isDark }) {
  const palettes = {
    gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},
    green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},
    amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},
    red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},
    blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},
    purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},
    orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'},
    teal:isDark?{bg:'rgba(20,184,166,0.15)',text:'#2dd4bf',border:'rgba(20,184,166,0.3)'}:{bg:'#f0fdfa',text:'#0d9488',border:'#99f6e4'},
  }
  const pl=palettes[color]||palettes.gray
  return <span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,letterSpacing:'0.02em',borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */
export default function StaffParticipantDocs() {
  const navigate = useNavigate()
  const { staffProfile, myShifts } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [loading, setLoading] = useState(true)
  const [participants, setParticipants] = useState([])
  const [selectedParticipant, setSelectedParticipant] = useState(null)
  const [documents, setDocuments] = useState([])
  const [signoffs, setSignoffs] = useState({})
  const [loadingDocs, setLoadingDocs] = useState(false)
  const [viewDoc, setViewDoc] = useState(null)
  const [signing, setSigning] = useState(false)
  const [search, setSearch] = useState('')
  const [signModal, setSignModal] = useState(null)
  const [signature, setSignature] = useState('')
  const [docTypeFilter, setDocTypeFilter] = useState('all')

  useEffect(() => { const t = setTimeout(() => setLoaded(true), 80); return () => clearTimeout(t) }, [])

  const dk = {
    text:isDark?'#e2e8f0':'#1f2937', textSoft:isDark?'#cbd5e1':'#374151',
    textMuted:isDark?'#94a3b8':'#6b7280', textFaint:isDark?'#64748b':'#9ca3af',
    subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',
    subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',
    inputBg:isDark?'rgba(30,41,59,0.8)':'white',
    inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',
    divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)',
  }
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => {
    async function loadParticipants() {
      try {
        const participantIds = [...new Set(myShifts.filter(s => s.participant_id || s.participants?.id).map(s => s.participant_id || s.participants?.id).filter(Boolean))]
        if (participantIds.length === 0) { setParticipants([]); setLoading(false); return }
        const { data } = await supabase.from('participants').select('id, first_name, last_name, ndis_number, status, address').in('id', participantIds).order('first_name', { ascending: true })
        setParticipants(data || [])
      } catch (err) { console.error('Load participants error:', err) }
      finally { setLoading(false) }
    }
    loadParticipants()
  }, [myShifts])

  const loadDocuments = async (participantId) => {
    setLoadingDocs(true)
    try {
      const { data: allDocs, error: docsErr } = await supabase.from('documents').select('*').eq('participant_id', participantId)
      if (docsErr) { console.error('Documents query error:', docsErr); setDocuments([]); setLoadingDocs(false); return }
      const docs = (allDocs || []).filter(d => d.visible_to_staff !== false)
      let filteredDocs = docs || []
      if (staffProfile?.id && filteredDocs.length > 0) {
        try {
          const docIds = filteredDocs.map(d => d.id)
          const { data: accessRows, error: accessErr } = await supabase.from('document_staff_access').select('document_id, staff_id').in('document_id', docIds)
          if (!accessErr && accessRows && accessRows.length > 0) {
            const accessByDoc = {}
            accessRows.forEach(r => { if (!accessByDoc[r.document_id]) accessByDoc[r.document_id] = new Set(); accessByDoc[r.document_id].add(r.staff_id) })
            filteredDocs = filteredDocs.filter(d => { if (!accessByDoc[d.id]) return true; return accessByDoc[d.id].has(staffProfile.id) })
          }
        } catch (accessErr) { console.warn('document_staff_access table may not exist yet') }
      }
      setDocuments(filteredDocs)
      if (staffProfile?.id && filteredDocs.length > 0) {
        try {
          const docIds = filteredDocs.map(d => d.id)
          const { data: sigs, error: sigErr } = await supabase.from('document_signoffs').select('*').eq('staff_id', staffProfile.id).in('document_id', docIds)
          if (!sigErr) { const sigMap = {}; (sigs || []).forEach(s => { sigMap[s.document_id] = s }); setSignoffs(sigMap) }
        } catch (sigErr) { console.warn('document_signoffs table may not exist yet') }
      } else { setSignoffs({}) }
    } catch (err) { console.error('Load docs error:', err) }
    finally { setLoadingDocs(false) }
  }

  const handleSelectParticipant = (p) => { setSelectedParticipant(p); setDocTypeFilter('all'); loadDocuments(p.id) }
  const openSignModal = (docId) => { setSignature(''); setSignModal(docId) }

  const handleSignOff = async () => {
    if (!staffProfile?.id || !signModal) return
    if (!signature) { alert('Please sign before submitting'); return }
    setSigning(true)
    try {
      const { error } = await supabase.from('document_signoffs').insert({ document_id: signModal, staff_id: staffProfile.id, signature_data: signature })
      if (error) throw error
      setSignoffs(prev => ({ ...prev, [signModal]: { document_id: signModal, staff_id: staffProfile.id, signed_at: new Date().toISOString(), signature_data: signature } }))
      setSignModal(null); setSignature(''); setViewDoc(null)
    } catch (err) {
      if (err.message?.includes('duplicate')) { alert('You have already signed off on this document') }
      else { console.error('Sign off error:', err); alert('Failed to sign off: ' + (err.message || 'Unknown error')) }
    } finally { setSigning(false) }
  }

  /* ─── computed ─── */
  const filtered = participants.filter(p => {
    if (!search) return true
    const q = search.toLowerCase()
    return `${p.first_name} ${p.last_name}`.toLowerCase().includes(q) || (p.ndis_number || '').toLowerCase().includes(q)
  })
  const needsSignoff = documents.filter(d => d.requires_signoff && !signoffs[d.id])
  const signedCount = documents.filter(d => signoffs[d.id]).length
  const totalDocs = documents.length

  const docTypes = [...new Set(documents.map(d => d.document_type).filter(Boolean))]
  const filteredDocs = docTypeFilter === 'all' ? documents : documents.filter(d => d.document_type === docTypeFilter)

  /* ─── loading ─── */
  if (loading) return (
    <div style={{ display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16 }}>
      <div style={{ position:'relative' }}>
        <div style={{ width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})` }}><FolderOpen size={22} style={{color:'white'}} /></div>
        <div style={{ position:'absolute',inset:-4,borderRadius:18,border:`2px solid ${c.staff}`,opacity:0.3,animation:'ping 1.5s cubic-bezier(0,0,0.2,1) infinite' }} />
      </div>
      <p style={{ fontSize:13,fontWeight:600,color:dk.textMuted }}>Loading documents...</p>
    </div>
  )

  /* ═══════════════════════════════════════════════
     DOCUMENT LIST VIEW (selected participant)
     ═══════════════════════════════════════════════ */
  if (selectedParticipant) {
    return (
      <div style={{ position:'relative',minHeight:'100vh',overflow:'hidden' }}>
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
        <Orb color="#06b6d4" size={200} bottom="-50px" right="25%" delay={1} />

        <div style={{ position:'relative',zIndex:1,padding:'0 0 40px' }}>
          {/* Back button */}
          <button onClick={() => { setSelectedParticipant(null); setDocuments([]); setSignoffs({}); setDocTypeFilter('all') }}
            style={{ display:'flex',alignItems:'center',gap:6,fontSize:13,fontWeight:600,color:dk.textMuted,background:'none',border:'none',cursor:'pointer',marginBottom:16,padding:0 }}>
            <ChevronLeft size={16} /> Back to Participants
          </button>

          {/* ═══════ HERO ═══════ */}
          <div style={{ ...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden' }}>
            <div style={{ position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)' }} />
            <div style={{ position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)' }} />
            <div style={{ position:'absolute',top:'55%',right:'22%',width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.08)' }} />
            <div style={{ position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px' }} />
            {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'},{top:'35%',left:'8%',size:4,delay:'2s'}].map((dot,i)=>(
              <div key={i} style={{position:'absolute',top:dot.top,left:dot.left,width:dot.size,height:dot.size,borderRadius:'50%',background:'rgba(255,255,255,0.4)',animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite`}} />
            ))}
            <div style={{ position:'relative',zIndex:2 }}>
              <div style={{ display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap' }}>
                <span style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white',letterSpacing:'0.04em' }}>
                  <FolderOpen size={12} /> DOCUMENTS
                </span>
                {needsSignoff.length > 0 && (
                  <span style={{ display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(245,158,11,0.3)',backdropFilter:'blur(8px)',fontSize:10,fontWeight:700,color:'#fde68a' }}>
                    <PenTool size={10} /> {needsSignoff.length} NEEDS SIGN
                  </span>
                )}
              </div>
              <div style={{ display:'flex',alignItems:'center',gap:16,flexWrap:'wrap' }}>
                <div style={{ width:56,height:56,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',fontSize:20,fontWeight:900,color:'white' }}>
                  {selectedParticipant.first_name?.[0]}{selectedParticipant.last_name?.[0]}
                </div>
                <div>
                  <h1 style={{ fontSize:24,fontWeight:900,color:'white',lineHeight:1.2 }}>{selectedParticipant.first_name} {selectedParticipant.last_name}</h1>
                  <p style={{ fontSize:13,color:'rgba(255,255,255,0.75)',marginTop:2 }}>
                    {selectedParticipant.ndis_number && `NDIS: ${selectedParticipant.ndis_number} · `}{totalDocs} document{totalDocs !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
              <div style={{ display:'flex',gap:8,flexWrap:'wrap',marginTop:16 }}>
                {[
                  { label:'Total',value:totalDocs,icon:FileText },
                  { label:'Signed',value:signedCount,icon:CheckCircle },
                  { label:'Needs Sign',value:needsSignoff.length,icon:PenTool },
                ].map((pill,i) => (
                  <div key={i} style={{ display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)' }}>
                    <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}} />
                    <span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span>
                    <span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* ═══════ STAT CARDS ═══════ */}
          <div style={{ ...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24 }}>
            {[
              { icon:FileText,label:'Total Documents',value:totalDocs,gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40` },
              { icon:CheckCircle,label:'Signed Off',value:signedCount,gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)' },
              { icon:PenTool,label:'Needs Signature',value:needsSignoff.length,gradient:'linear-gradient(135deg,#f59e0b,#f97316)',glow:'rgba(245,158,11,0.3)',alert:needsSignoff.length>0 },
            ].map((stat,i) => (
              <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                  <div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient,boxShadow:`0 4px 12px -2px ${stat.glow}`}}>
                    <stat.icon size={18} style={{color:'white'}} />
                  </div>
                  {stat.alert && <span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s ease-in-out infinite'}} />}
                </div>
                <p style={{fontSize:26,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value} /></p>
                <p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
              </Glass>
            ))}
          </div>

          {/* Signoff alert */}
          {needsSignoff.length > 0 && (
            <div style={{ ...stg(2),background:'linear-gradient(135deg,#f59e0b,#f97316)',borderRadius:16,padding:20,marginBottom:20,display:'flex',alignItems:'flex-start',gap:14,position:'relative',overflow:'hidden' }}>
              <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
              <PenTool size={22} style={{color:'white',flexShrink:0,marginTop:2}} />
              <div>
                <p style={{fontSize:15,fontWeight:800,color:'white'}}>{needsSignoff.length} document{needsSignoff.length!==1?'s':''} require your acknowledgement</p>
                <p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>Review and sign off on the highlighted documents below</p>
              </div>
            </div>
          )}

          {/* Doc type filter */}
          {docTypes.length > 1 && (
            <Glass isDark={isDark} style={{ ...stg(3),padding:6,marginBottom:20,display:'flex',gap:4,flexWrap:'wrap' }}>
              <button onClick={() => setDocTypeFilter('all')}
                style={{ padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,transition:'all .25s',
                  background:docTypeFilter==='all'?`linear-gradient(135deg,${c.staff},${c.staffHover})`:'transparent',
                  color:docTypeFilter==='all'?'white':dk.textMuted,
                  boxShadow:docTypeFilter==='all'?`0 4px 16px -4px ${c.staff}50`:'none' }}>
                All ({totalDocs})
              </button>
              {docTypes.map(dt => (
                <button key={dt} onClick={() => setDocTypeFilter(dt)}
                  style={{ padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,transition:'all .25s',
                    background:docTypeFilter===dt?`linear-gradient(135deg,${c.staff},${c.staffHover})`:'transparent',
                    color:docTypeFilter===dt?'white':dk.textMuted,
                    boxShadow:docTypeFilter===dt?`0 4px 16px -4px ${c.staff}50`:'none' }}>
                  {DOC_TYPE_LABELS[dt]||dt} ({documents.filter(d=>d.document_type===dt).length})
                </button>
              ))}
            </Glass>
          )}

          {/* ═══════ DOCUMENT LIST ═══════ */}
          <div style={stg(4)}>
            {loadingDocs ? (
              <div style={{display:'flex',alignItems:'center',justifyContent:'center',height:160}}>
                <Loader2 size={24} style={{color:c.staff,animation:'spin 1s linear infinite'}} />
              </div>
            ) : filteredDocs.length > 0 ? (
              <div style={{display:'flex',flexDirection:'column',gap:10}}>
                <p style={{fontSize:12,color:dk.textFaint}}>{filteredDocs.length} document{filteredDocs.length!==1?'s':''}</p>
                {filteredDocs.map(doc => {
                  const signed = !!signoffs[doc.id]
                  const needsSign = doc.requires_signoff && !signed
                  const docGrad = DOC_TYPE_COLORS_INLINE[doc.document_type] || 'linear-gradient(135deg,#64748b,#475569)'
                  const label = DOC_TYPE_LABELS[doc.document_type] || doc.document_type?.replace(/_/g,' ') || 'Document'
                  return (
                    <Glass key={doc.id} isDark={isDark} hover
                      glow={needsSign?'rgba(245,158,11,0.15)':undefined}
                      style={{ padding:16,display:'flex',alignItems:'center',gap:14,borderLeft:needsSign?'4px solid #f59e0b':signed?'4px solid #10b981':undefined }}>
                      <div style={{ width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:docGrad,boxShadow:'0 4px 12px -2px rgba(0,0,0,0.15)',flexShrink:0 }}>
                        <FileText size={20} style={{color:'white'}} />
                      </div>
                      <div style={{flex:1,minWidth:0}}>
                        <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:2}}>
                          <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{doc.name||'Untitled'}</p>
                          {needsSign && <Badge color="amber" isDark={isDark}>Sign Required</Badge>}
                          {signed && <Badge color="green" isDark={isDark}>Signed</Badge>}
                        </div>
                        <p style={{fontSize:11,color:dk.textFaint}}>
                          {label}{doc.expiry_date&&` · Expires: ${new Date(doc.expiry_date).toLocaleDateString('en-AU')}`}{doc.created_at&&` · Added: ${new Date(doc.created_at).toLocaleDateString('en-AU')}`}
                        </p>
                        {signed && signoffs[doc.id]?.signed_at && (
                          <p style={{fontSize:10,color:isDark?'#34d399':'#059669',marginTop:2}}>
                            Acknowledged {new Date(signoffs[doc.id].signed_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}
                          </p>
                        )}
                      </div>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexShrink:0,flexWrap:'wrap'}}>
                        {doc.file_url && (
                          <button onClick={() => setViewDoc(doc)} style={{ padding:10,borderRadius:10,border:'none',cursor:'pointer',background:isDark?'rgba(59,130,246,0.1)':'#eff6ff',transition:'all .2s' }}>
                            <Eye size={16} style={{color:isDark?'#60a5fa':'#2563eb'}} />
                          </button>
                        )}
                        {doc.file_url && (
                          <a href={doc.file_url} target="_blank" rel="noopener noreferrer" style={{ padding:10,borderRadius:10,background:dk.subtleBg,border:`1px solid ${dk.divider}`,display:'flex',textDecoration:'none' }}>
                            <Download size={16} style={{color:dk.textMuted}} />
                          </a>
                        )}
                        {needsSign && (
                          <button onClick={() => openSignModal(doc.id)} disabled={signing}
                            style={{ display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:11,fontWeight:700,boxShadow:`0 4px 12px -2px ${c.staff}40`,transition:'all .2s' }}>
                            <CheckCircle size={14} /> Acknowledge
                          </button>
                        )}
                      </div>
                    </Glass>
                  )
                })}
              </div>
            ) : (
              <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
                <div style={{width:56,height:56,borderRadius:18,margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff}20,${c.staffHover}15)`}}>
                  <FileText size={24} style={{color:c.staff}} />
                </div>
                <p style={{fontSize:15,fontWeight:800,color:dk.text}}>No documents available</p>
                <p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Documents shared by admin will appear here</p>
              </Glass>
            )}
          </div>

        {/* ═══════ DOCUMENT VIEWER MODAL ═══════ */}
        <Modal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title="" wide>
          {viewDoc && (
            <div>
              <div style={{ margin:'-24px -24px 0',marginBottom:0 }}>
                <div style={{ background:DOC_TYPE_COLORS_INLINE[viewDoc.document_type]||`linear-gradient(135deg,${c.staff},${c.staffHover})`,padding:'24px',position:'relative',overflow:'hidden' }}>
                  <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
                  <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)'}}>
                      <FileText size={22} style={{color:'white'}} />
                    </div>
                    <div style={{flex:1}}>
                      <h3 style={{fontSize:18,fontWeight:900,color:'white'}}>{viewDoc.name}</h3>
                      <p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{DOC_TYPE_LABELS[viewDoc.document_type]||viewDoc.document_type}</p>
                    </div>
                    <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer"
                      style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:11,fontWeight:700,textDecoration:'none'}}>
                      <Download size={12} /> Download
                    </a>
                  </div>
                </div>
              </div>
              <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:16}}>
                {viewDoc.file_url?.toLowerCase().endsWith('.pdf') ? (
                  <iframe src={viewDoc.file_url} style={{width:'100%',height:500,border:'none',borderRadius:14}} title="Document viewer" />
                ) : viewDoc.file_url?.match(/\.(jpg|jpeg|png|gif)$/i) ? (
                  <img src={viewDoc.file_url} alt={viewDoc.name} style={{width:'100%',borderRadius:14,border:`1px solid ${dk.divider}`}} />
                ) : (
                  <div style={{padding:'50px 20px',textAlign:'center',borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}>
                    <FileText size={40} style={{color:dk.textFaint,margin:'0 auto 8px'}} />
                    <p style={{fontSize:14,fontWeight:600,color:dk.textMuted}}>Preview not available</p>
                    <p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Click Download to view this document</p>
                  </div>
                )}
                {viewDoc.requires_signoff && !signoffs[viewDoc.id] && (
                  <button onClick={() => openSignModal(viewDoc.id)} disabled={signing}
                    style={{ width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700,boxShadow:`0 4px 16px -4px ${c.staff}50` }}>
                    <CheckCircle size={16} /> I acknowledge I have read this document — Sign Now
                  </button>
                )}
                {viewDoc.requires_signoff && signoffs[viewDoc.id] && (
                  <div style={{ padding:14,borderRadius:14,display:'flex',alignItems:'center',gap:8,background:isDark?'rgba(16,185,129,0.1)':'#ecfdf5',border:`1px solid ${isDark?'rgba(16,185,129,0.2)':'#a7f3d0'}` }}>
                    <CheckCircle size={16} style={{color:isDark?'#34d399':'#059669'}} />
                    <p style={{fontSize:13,fontWeight:600,color:isDark?'#6ee7b7':'#047857'}}>Acknowledged {new Date(signoffs[viewDoc.id].signed_at).toLocaleDateString('en-AU')}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </Modal>

        {/* ═══════ SIGNATURE MODAL ═══════ */}
        <Modal isOpen={!!signModal} onClose={() => { setSignModal(null); setSignature('') }} title="" wide>
          {signModal && (() => {
            const doc = documents.find(d => d.id === signModal)
            return (
              <div>
                <div style={{ margin:'-24px -24px 0',marginBottom:0 }}>
                  <div style={{ background:`linear-gradient(135deg,${c.staff},${c.staffHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden' }}>
                    <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
                    <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}>
                      <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}>
                        <PenTool size={20} style={{color:'white'}} />
                      </div>
                      <div>
                        <h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Acknowledge Document</h3>
                        <p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>Sign to confirm you've read and understood</p>
                      </div>
                    </div>
                  </div>
                </div>
                <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:16}}>
                  {doc && (
                    <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}>
                      <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{doc.name}</p>
                      <p style={{fontSize:11,color:dk.textFaint,marginTop:2}}>{DOC_TYPE_LABELS[doc.document_type]||doc.document_type}</p>
                    </div>
                  )}
                  <div style={{padding:16,borderRadius:14,background:isDark?'rgba(245,158,11,0.08)':'#fffbeb',border:`1px solid ${isDark?'rgba(245,158,11,0.2)':'#fde68a'}`}}>
                    <p style={{fontSize:13,fontWeight:700,color:isDark?'#fbbf24':'#92400e'}}>Declaration</p>
                    <p style={{fontSize:12,color:isDark?'#fcd34d':'#78350f',marginTop:6,lineHeight:1.6}}>
                      I, <strong>{staffProfile?`${staffProfile.first_name} ${staffProfile.last_name}`:'Staff Member'}</strong>, confirm that I have read, understood, and acknowledge the contents of this document. I understand my responsibilities as outlined within.
                    </p>
                  </div>
                  <div>
                    <p style={{fontSize:11,fontWeight:700,textTransform:'uppercase',letterSpacing:'0.05em',color:dk.textMuted,marginBottom:8}}>Your Signature</p>
                    <SignaturePad value={signature} onChange={setSignature} isDark={isDark} accentColor={c.staff} />
                  </div>
                  <div style={{display:'flex',gap:10,flexWrap:'wrap'}}>
                    <button onClick={() => { setSignModal(null); setSignature('') }}
                      style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                      Cancel
                    </button>
                    <button onClick={handleSignOff} disabled={signing||!signature}
                      style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:signing?'default':'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:(signing||!signature)?0.6:1,boxShadow:`0 4px 16px -4px ${c.staff}50`,transition:'all .2s'}}>
                      {signing?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Submitting...</>:<><CheckCircle size={16}/> Sign & Acknowledge</>}
                    </button>
                  </div>
                </div>
              </div>
            )
          })()}
        </Modal>
        </div>
      </div>
    )
  }

  /* ═══════════════════════════════════════════════
     PARTICIPANT LIST VIEW
     ═══════════════════════════════════════════════ */
  return (
    <div style={{ position:'relative',minHeight:'100vh',overflow:'hidden' }}>
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
      <Orb color="#06b6d4" size={200} bottom="-50px" right="25%" delay={1} />

      <div style={{ position:'relative',zIndex:1,padding:'0 0 40px' }}>
        {/* ═══════ HERO ═══════ */}
        <div style={{ ...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden' }}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}} />
          {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'}].map((dot,i)=>(
            <div key={i} style={{position:'absolute',top:dot.top,left:dot.left,width:dot.size,height:dot.size,borderRadius:'50%',background:'rgba(255,255,255,0.4)',animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite`}} />
          ))}
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white',letterSpacing:'0.04em'}}>
                <FolderOpen size={12} /> PARTICIPANT DOCS
              </span>
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Participant Documents</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>{participants.length} participant{participants.length!==1?'s':''} you support</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              <div style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                <Users size={12} style={{color:'rgba(255,255,255,0.7)'}} />
                <span style={{fontSize:12,fontWeight:800,color:'white'}}>{participants.length}</span>
                <span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>Participants</span>
              </div>
            </div>
          </div>
        </div>

        {/* Search */}
        {participants.length > 2 && (
          <Glass isDark={isDark} style={{...stg(1),padding:'4px 14px',display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
            <Search size={16} style={{color:dk.textFaint,flexShrink:0}} />
            <input type="text" placeholder="Search participants..." value={search} onChange={e => setSearch(e.target.value)}
              style={{flex:1,padding:'10px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text,minWidth:0}} />
            {search && <button onClick={() => setSearch('')} style={{padding:4,borderRadius:6,border:'none',cursor:'pointer',background:dk.subtleBg2,color:dk.textFaint}}><X size={12} /></button>}
          </Glass>
        )}

        {/* Participant cards */}
        <div style={stg(2)}>
          {filtered.length > 0 ? (
            <div style={{display:'flex',flexDirection:'column',gap:10}}>
              <p style={{fontSize:12,color:dk.textFaint}}>{filtered.length} participant{filtered.length!==1?'s':''}{search&&` matching "${search}"`}</p>
              {filtered.map((p,idx) => (
                <Glass key={p.id} isDark={isDark} hover onClick={() => handleSelectParticipant(p)}
                  style={{padding:16,display:'flex',alignItems:'center',gap:14}}>
                  <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,boxShadow:`0 4px 12px -2px ${c.staff}40`,fontSize:16,fontWeight:900,color:'white',flexShrink:0}}>
                    {p.first_name?.[0]}{p.last_name?.[0]}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{p.first_name} {p.last_name}</p>
                    <p style={{fontSize:11,color:dk.textFaint,marginTop:2}}>
                      {p.ndis_number&&`NDIS: ${p.ndis_number}`}{p.address&&` · ${p.address}`}
                    </p>
                  </div>
                  <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:dk.subtleBg,flexShrink:0}}>
                    <ChevronRight size={16} style={{color:dk.textFaint}} />
                  </div>
                </Glass>
              ))}
            </div>
          ) : (
            <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <div style={{width:56,height:56,borderRadius:18,margin:'0 auto 14px',display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff}20,${c.staffHover}15)`}}>
                <Users size={24} style={{color:c.staff}} />
              </div>
              <p style={{fontSize:15,fontWeight:800,color:dk.text}}>{search?'No participants found':'No participants yet'}</p>
              <p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>{search?'Try a different search':"You'll see participants here once you have shifts assigned"}</p>
              {search && <button onClick={() => setSearch('')} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700}}>Clear search</button>}
            </Glass>
          )}
        </div>
      </div>
    </div>
  )
}