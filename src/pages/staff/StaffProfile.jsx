import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  User, Mail, Phone, MapPin, Pencil, Save, X, Lock, Loader2, LogOut,
  CheckCircle2, Upload, FileText, Trash2, Shield, Clock, Flame, Calendar,
  Award, Heart, Eye, ChevronRight, AlertTriangle, Star, Target, ArrowRight
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

/* ═══════════════════════════════════════════════
   CONSTANTS — 100% preserved
   ═══════════════════════════════════════════════ */
const QUAL_TYPES = [
  { value:'ndis_screening',label:'NDIS Worker Screening' },{ value:'wwcc',label:'Working With Children Check' },
  { value:'first_aid',label:'First Aid Certificate' },{ value:'cpr',label:'CPR Certificate' },
  { value:'police_check',label:'Police Check' },{ value:'insurance',label:'Insurance' },
  { value:'infection_control',label:'Infection Control' },{ value:'other',label:'Other' },
]
const QUAL_TYPE_KEYS = QUAL_TYPES.map(t => t.value)
const GENERAL_TYPES = [
  { value:'contract',label:'Employment Contract' },{ value:'resume',label:'Resume / CV' },
  { value:'training',label:'Training Certificate' },{ value:'reference',label:'Reference Letter' },
  { value:'other',label:'Other' },
]

/* ═══════════════════════════════════════════════
   DESIGN SYSTEM
   ═══════════════════════════════════════════════ */
function Glass({ children, className='', glow, style={}, hover=false, isDark=false, onClick, ...p }) {
  const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)'
  const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'
  return (
    <div className={className} onClick={onClick}
      style={{ background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style }}
      onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)';e.currentTarget.style.boxShadow=glow?`0 16px 48px -8px ${glow}`:'0 12px 40px -8px rgba(0,0,0,0.12)'}:undefined}
      onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)';e.currentTarget.style.boxShadow=glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)'}:undefined}
      {...p}>{children}</div>
  )
}
function Orb({ color, size=200, top, left, right, bottom, delay=0 }) {
  return <div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}} />
}
function AnimNum({ value, duration=1200, suffix='' }) {
  const [display,setDisplay]=useState(0);const frameRef=useRef()
  useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))*10)/10);if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration])
  const isInt=Number.isInteger(typeof value==='number'?value:parseFloat(value))
  return <>{isInt?Math.round(display):display.toFixed(1)}{suffix}</>
}
function Badge({ children, color='gray', isDark }) {
  const palettes={
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
export default function StaffProfile() {
  const navigate = useNavigate()
  const { staffProfile, setStaffProfile, staffName, initials, handleLogout, completedShifts, myShifts } = useStaff()
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ current:'', new:'', confirm:'' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [docForm, setDocForm] = useState({ category:'', name:'', document_type:'', custom_type:'', expiry_date:'' })
  const [activeSection, setActiveSection] = useState('profile')

  useEffect(() => { const t=setTimeout(()=>setLoaded(true),80); return()=>clearTimeout(t) }, [])

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
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none',transition:'all .2s'}

  /* ─── data fetch (100% preserved) ─── */
  useEffect(() => {
    if (!staffProfile?.id) return
    ;(async () => {
      try {
        const { data } = await supabase.from('documents').select('*').eq('staff_id', staffProfile.id).order('uploaded_at', { ascending: false })
        if (data) setDocuments(data)
      } catch (e) { /* table may not exist */ }
      setLoadingDocs(false)
    })()
  }, [staffProfile?.id])

  /* ─── computed (100% preserved) ─── */
  const totalHours = completedShifts.reduce((a,s) => s.clock_in && s.clock_out ? a+(new Date(s.clock_out)-new Date(s.clock_in))/3600000 : a, 0)
  let streak = 0
  const sorted = completedShifts.sort((a,b) => new Date(b.shift_date)-new Date(a.shift_date))
  const today = new Date(); today.setHours(0,0,0,0)
  for (let i=0; i<sorted.length; i++) {
    const d = new Date(sorted[i].shift_date); d.setHours(0,0,0,0)
    const expected = new Date(today); expected.setDate(expected.getDate()-i)
    if (d.getTime()===expected.getTime()) streak++; else break
  }
  const qualDocs = documents.filter(d => QUAL_TYPE_KEYS.includes(d.document_type))
  const validQuals = qualDocs.filter(d => d.status === 'valid' || d.status === 'approved')
  const expiredDocs = documents.filter(d => d.expiry_date && new Date(d.expiry_date) < new Date())
  const pendingDocs = documents.filter(d => d.status === 'pending')

  /* ─── handlers (100% preserved) ─── */
  const startProfileEdit = () => {
    setProfileForm({ phone:staffProfile.phone||'', address:staffProfile.address||'', emergency_contact_name:staffProfile.emergency_contact_name||'', emergency_contact_phone:staffProfile.emergency_contact_phone||'', emergency_contact_relationship:staffProfile.emergency_contact_relationship||'' })
    setProfileEditing(true)
  }
  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const { data, error } = await supabase.from('staff').update(profileForm).eq('id', staffProfile.id).select().single()
      if (error) throw error
      setStaffProfile(prev => ({ ...prev, ...data }))
      setProfileEditing(false); alert('Profile updated!')
    } catch (err) { alert('Failed to save: '+err.message) }
    finally { setProfileSaving(false) }
  }
  const handleChangePassword = async () => {
    if (!passwordForm.new || !passwordForm.confirm) { alert('Please fill in all password fields'); return }
    if (passwordForm.new !== passwordForm.confirm) { alert('New passwords do not match'); return }
    if (passwordForm.new.length < 6) { alert('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    try {
      const timeout = new Promise((_,reject) => setTimeout(() => reject(new Error('Request timed out')), 10000))
      const update = supabase.auth.updateUser({ password: passwordForm.new })
      const { error } = await Promise.race([update, timeout])
      if (error) throw error
      setPasswordForm({ current:'', new:'', confirm:'' }); alert('Password changed successfully!')
    } catch (err) { alert('Failed to change password: '+(err.message || 'Unknown error. Please try logging out and back in.')) }
    finally { setChangingPassword(false) }
  }
  const handleUploadDocument = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    if (!docForm.document_type) { alert('Please select a document type'); return }
    if (docForm.document_type === 'other' && !docForm.custom_type) { alert('Please specify the document type'); return }
    setUploading(true)
    try {
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g,'_')
      const filePath = `staff/${staffProfile.id}/${Date.now()}_${safeName}`
      const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, selectedFile, { upsert:true })
      if (uploadErr) throw uploadErr
      const { data:{ publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)
      const isQualification = docForm.category === 'qualification' || QUAL_TYPE_KEYS.includes(docForm.document_type)
      const { data:doc, error:dbErr } = await supabase.from('documents').insert({
        staff_id:staffProfile.id, name:docForm.document_type==='other'&&docForm.custom_type?docForm.custom_type:(docForm.name||selectedFile.name),
        document_type:docForm.document_type, file_url:publicUrl, file_name:selectedFile.name,
        expiry_date:docForm.expiry_date||null, status:isQualification?'pending':'valid',
      }).select().single()
      if (dbErr) throw dbErr
      if (doc) setDocuments(prev => [doc, ...prev])
      setShowUploadModal(false); setSelectedFile(null)
      setDocForm({ category:'', name:'', document_type:'', custom_type:'', expiry_date:'' })
      alert(isQualification ? 'Qualification uploaded! Your admin will review it.' : 'Document uploaded!')
    } catch (err) { console.error('Upload error:',err); alert('Failed: '+(err.message||JSON.stringify(err))) }
    finally { setUploading(false) }
  }
  const handleDeleteDocument = async (doc) => {
    if (!confirm(`Delete "${doc.name||doc.title}"?`)) return
    try {
      if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path])
      await supabase.from('documents').delete().eq('id', doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) { alert('Failed: '+err.message) }
  }
  const getDocTypeLabel = (val) => {
    const allTypes = [...QUAL_TYPES, ...GENERAL_TYPES]
    const found = allTypes.find(t => t.value === val)
    return found ? found.label : (val||'Document').replace(/_/g,' ').replace(/\b\w/g, ch => ch.toUpperCase())
  }

  if (!staffProfile) return null

  return (
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
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
      <Orb color="#f59e0b" size={140} top="20%" left="20%" delay={3} />

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>

        {/* ═══════ HERO ═══════ */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
          <div style={{position:'absolute',top:'55%',right:'22%',width:50,height:50,borderRadius:'50%',background:'rgba(255,255,255,0.08)'}} />
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}} />
          {[{top:'15%',left:'85%',size:5,delay:'0s'},{top:'70%',left:'90%',size:3,delay:'1s'},{top:'35%',left:'8%',size:4,delay:'2s'}].map((dot,i)=>(
            <div key={i} style={{position:'absolute',top:dot.top,left:dot.left,width:dot.size,height:dot.size,borderRadius:'50%',background:'rgba(255,255,255,0.4)',animation:`pulse-dot 2s ease-in-out ${dot.delay} infinite`}} />
          ))}
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white',letterSpacing:'0.04em'}}>
                <User size={12} /> MY PROFILE
              </span>
              <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(16,185,129,0.3)',backdropFilter:'blur(8px)',fontSize:10,fontWeight:700,color:'#a7f3d0'}}>
                <CheckCircle2 size={10} /> {(staffProfile.status||'active').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}
              </span>
              {expiredDocs.length > 0 && (
                <span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(239,68,68,0.3)',backdropFilter:'blur(8px)',fontSize:10,fontWeight:700,color:'#fca5a5'}}>
                  <AlertTriangle size={10} /> {expiredDocs.length} EXPIRED
                </span>
              )}
            </div>
            <div style={{display:'flex',alignItems:'center',gap:16,flexWrap:'wrap'}}>
              <div style={{width:64,height:64,borderRadius:20,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.2)',fontSize:24,fontWeight:900,color:'white'}}>
                {initials}
              </div>
              <div>
                <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2}}>{staffName}</h1>
                <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginTop:2}}>
                  {staffProfile.role==='admin'?'Administrator':'Support Worker'} · {(staffProfile.employment_type||'full_time').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}
                </p>
              </div>
            </div>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginTop:16}}>
              {[
                { label:'Shifts',value:completedShifts.length,icon:Calendar },
                { label:'Hours',value:`${totalHours.toFixed(0)}h`,icon:Clock },
                { label:'Streak',value:`${streak}d`,icon:Flame },
                { label:'Documents',value:documents.length,icon:FileText },
              ].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}} />
                  <span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span>
                  <span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* ═══════ STAT CARDS ═══════ */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[
            { icon:Calendar,label:'Shifts Done',value:completedShifts.length,gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40` },
            { icon:Clock,label:'Hours Logged',value:totalHours,suffix:'h',decimals:1,gradient:'linear-gradient(135deg,#06b6d4,#0891b2)',glow:'rgba(6,182,212,0.3)' },
            { icon:Flame,label:'Day Streak',value:streak,gradient:'linear-gradient(135deg,#f97316,#ef4444)',glow:'rgba(249,115,22,0.3)' },
            { icon:FileText,label:'Documents',value:documents.length,gradient:'linear-gradient(135deg,#3b82f6,#6366f1)',glow:'rgba(59,130,246,0.3)' },
            { icon:Shield,label:'Valid Quals',value:validQuals.length,gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)' },
            { icon:AlertTriangle,label:'Expired',value:expiredDocs.length,gradient:'linear-gradient(135deg,#ef4444,#dc2626)',glow:'rgba(239,68,68,0.3)',alert:expiredDocs.length>0 },
          ].map((stat,i)=>(
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'16px 14px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                <div style={{width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient,boxShadow:`0 4px 12px -2px ${stat.glow}`}}>
                  <stat.icon size={16} style={{color:'white'}} />
                </div>
                {stat.alert && <span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s ease-in-out infinite'}} />}
              </div>
              <p style={{fontSize:24,fontWeight:900,color:dk.text,lineHeight:1}}>
                <AnimNum value={stat.decimals?Math.round(stat.value*10)/10:stat.value} suffix={stat.suffix||''} />
              </p>
              <p style={{fontSize:10,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* ═══════ SECTION TABS ═══════ */}
        <Glass isDark={isDark} style={{...stg(2),padding:6,marginBottom:20,display:'flex',gap:4,flexWrap:'wrap'}}>
          {[
            { id:'profile',label:'Profile',icon:User },
            { id:'documents',label:'Documents',icon:FileText,count:documents.length },
            { id:'security',label:'Security',icon:Lock },
          ].map(tab=>(
            <button key={tab.id} onClick={()=>setActiveSection(tab.id)}
              style={{flex:'1 1 auto',display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'10px 16px',borderRadius:14,border:'none',cursor:'pointer',fontSize:13,fontWeight:700,transition:'all .25s cubic-bezier(.16,1,.3,1)',
                background:activeSection===tab.id?`linear-gradient(135deg,${c.staff},${c.staffHover})`:'transparent',
                color:activeSection===tab.id?'white':dk.textMuted,
                boxShadow:activeSection===tab.id?`0 4px 16px -4px ${c.staff}50`:'none'}}>
              <tab.icon size={15} />
              {tab.label}
              {tab.count>0 && <span style={{padding:'1px 7px',borderRadius:999,fontSize:10,fontWeight:800,background:activeSection===tab.id?'rgba(255,255,255,0.25)':dk.subtleBg2,color:activeSection===tab.id?'white':dk.textMuted}}>{tab.count}</span>}
            </button>
          ))}
        </Glass>

        {/* ═══════ PROFILE SECTION ═══════ */}
        {activeSection === 'profile' && (
          <div style={{...stg(3),display:'flex',flexDirection:'column',gap:16}}>
            {/* Contact Info */}
            <Glass isDark={isDark} style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}>
                    <Mail size={13} style={{color:'white'}} />
                  </div>
                  <p style={{fontSize:14,fontWeight:800,color:dk.text}}>Contact Information</p>
                </div>
                {!profileEditing ? (
                  <button onClick={startProfileEdit} style={{display:'flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:10,background:isDark?`${c.staff}15`:`${c.staff}08`,border:`1px solid ${isDark?`${c.staff}30`:`${c.staff}20`}`,color:c.staff,fontSize:12,fontWeight:700,cursor:'pointer',transition:'all .2s'}}>
                    <Pencil size={12} /> Edit
                  </button>
                ) : (
                  <div style={{display:'flex',gap:6}}>
                    <button onClick={()=>setProfileEditing(false)} disabled={profileSaving} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 12px',borderRadius:10,border:`1px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:12,fontWeight:600,cursor:'pointer'}}>
                      <X size={12} /> Cancel
                    </button>
                    <button onClick={handleProfileSave} disabled={profileSaving} style={{display:'flex',alignItems:'center',gap:4,padding:'6px 14px',borderRadius:10,border:'none',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:12,fontWeight:700,cursor:'pointer',opacity:profileSaving?0.6:1}}>
                      {profileSaving?<Loader2 size={12} style={{animation:'spin 1s linear infinite'}}/>:<Save size={12}/>} {profileSaving?'Saving...':'Save'}
                    </button>
                  </div>
                )}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[
                  { icon:Mail,label:'Email',value:staffProfile.email||'—',field:null },
                  { icon:Phone,label:'Phone',value:staffProfile.phone||'—',field:'phone',type:'tel' },
                  { icon:MapPin,label:'Address',value:staffProfile.address||'—',field:'address',type:'text' },
                ].map(item=>(
                  <div key={item.label} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,background:dk.subtleBg}}>
                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:isDark?`${c.staff}15`:`${c.staff}08`,flexShrink:0}}>
                      <item.icon size={16} style={{color:c.staff}} />
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:10,fontWeight:600,color:dk.textFaint}}>{item.label}</p>
                      {profileEditing && item.field ? (
                        <input type={item.type} value={profileForm[item.field]} onChange={e=>setProfileForm({...profileForm,[item.field]:e.target.value})}
                          style={{...inputStyle,padding:'8px 10px',fontSize:13,marginTop:2}}
                          onFocus={e=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}}
                          onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}} />
                      ) : (
                        <p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:2}}>{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Glass>

            {/* Emergency Contact */}
            <Glass isDark={isDark} style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#ef4444,#dc2626)'}}>
                  <Heart size={13} style={{color:'white'}} />
                </div>
                <p style={{fontSize:14,fontWeight:800,color:dk.text}}>Emergency Contact</p>
                {!profileEditing && <span style={{fontSize:10,color:dk.textFaint,marginLeft:'auto'}}>Edit profile to change</span>}
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[
                  { icon:User,label:'Name',value:staffProfile.emergency_contact_name||'—',field:'emergency_contact_name' },
                  { icon:Phone,label:'Phone',value:staffProfile.emergency_contact_phone||'—',field:'emergency_contact_phone' },
                  { icon:User,label:'Relationship',value:staffProfile.emergency_contact_relationship||'—',field:'emergency_contact_relationship' },
                ].map(item=>(
                  <div key={item.label+item.field} style={{display:'flex',alignItems:'center',gap:12,padding:'10px 12px',borderRadius:12,background:dk.subtleBg}}>
                    <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:isDark?'rgba(239,68,68,0.1)':'#fef2f2',flexShrink:0}}>
                      <item.icon size={16} style={{color:isDark?'#fca5a5':'#ef4444'}} />
                    </div>
                    <div style={{flex:1,minWidth:0}}>
                      <p style={{fontSize:10,fontWeight:600,color:dk.textFaint}}>{item.label}</p>
                      {profileEditing ? (
                        <input type="text" value={profileForm[item.field]} onChange={e=>setProfileForm({...profileForm,[item.field]:e.target.value})}
                          style={{...inputStyle,padding:'8px 10px',fontSize:13,marginTop:2}}
                          onFocus={e=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}}
                          onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}} />
                      ) : (
                        <p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:2}}>{item.value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </Glass>

            {/* Compliance Status */}
            <Glass isDark={isDark} style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#10b981,#059669)'}}>
                  <Shield size={13} style={{color:'white'}} />
                </div>
                <p style={{fontSize:14,fontWeight:800,color:dk.text}}>Compliance Status</p>
                <Badge color={validQuals.length>=5?'green':validQuals.length>=3?'amber':'red'} isDark={isDark}>{validQuals.length} verified</Badge>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:8}}>
                {QUAL_TYPES.filter(t=>t.value!=='other').map(item=>{
                  const doc = qualDocs.find(d=>d.document_type===item.value)
                  const isValid = doc && (doc.status==='valid'||doc.status==='approved')
                  const isExpired = doc && doc.expiry_date && new Date(doc.expiry_date)<new Date()
                  const isPending = doc && doc.status==='pending'
                  return (
                    <div key={item.value} style={{display:'flex',alignItems:'center',gap:8,padding:'10px 12px',borderRadius:12,
                      background:isValid?(isDark?'rgba(16,185,129,0.08)':'#ecfdf5'):isExpired?(isDark?'rgba(239,68,68,0.08)':'#fef2f2'):isPending?(isDark?'rgba(245,158,11,0.08)':'#fffbeb'):dk.subtleBg,
                      border:`1px solid ${isValid?(isDark?'rgba(16,185,129,0.2)':'#a7f3d0'):isExpired?(isDark?'rgba(239,68,68,0.2)':'#fecaca'):isPending?(isDark?'rgba(245,158,11,0.2)':'#fde68a'):dk.divider}`}}>
                      {isValid?<CheckCircle2 size={14} style={{color:isDark?'#34d399':'#10b981',flexShrink:0}}/>:isExpired?<AlertTriangle size={14} style={{color:'#ef4444',flexShrink:0}}/>:isPending?<Clock size={14} style={{color:'#f59e0b',flexShrink:0}}/>:<div style={{width:14,height:14,borderRadius:7,border:`2px solid ${dk.divider}`,flexShrink:0}}/>}
                      <span style={{fontSize:11,fontWeight:600,color:isValid?(isDark?'#6ee7b7':'#047857'):isExpired?(isDark?'#fca5a5':'#dc2626'):isPending?(isDark?'#fbbf24':'#92400e'):dk.textFaint}}>{item.label}</span>
                    </div>
                  )
                })}
              </div>
            </Glass>
          </div>
        )}

        {/* ═══════ DOCUMENTS SECTION ═══════ */}
        {activeSection === 'documents' && (
          <div style={{...stg(3),display:'flex',flexDirection:'column',gap:16}}>
            <Glass isDark={isDark} style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:16,flexWrap:'wrap',gap:8}}>
                <div style={{display:'flex',alignItems:'center',gap:8}}>
                  <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#3b82f6,#6366f1)'}}>
                    <FileText size={13} style={{color:'white'}} />
                  </div>
                  <p style={{fontSize:14,fontWeight:800,color:dk.text}}>My Documents & Certificates</p>
                  <Badge color="blue" isDark={isDark}>{documents.length}</Badge>
                </div>
                <button onClick={()=>{setShowUploadModal(true);setSelectedFile(null);setDocForm({category:'',name:'',document_type:'',custom_type:'',expiry_date:''})}}
                  style={{display:'flex',alignItems:'center',gap:6,padding:'8px 16px',borderRadius:10,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:12,fontWeight:700,boxShadow:`0 4px 12px -2px ${c.staff}40`,transition:'all .2s'}}>
                  <Upload size={14} /> Upload Document
                </button>
              </div>
              <p style={{fontSize:11,color:dk.textFaint,marginBottom:14}}>Upload certificates, licences, qualifications, or other documents. Your admin will review uploads.</p>
              {documents.length > 0 ? (
                <div style={{display:'flex',flexDirection:'column',gap:8}}>
                  {documents.map(doc=>{
                    const statusColor = doc.status==='valid'||doc.status==='approved'?'green':doc.status==='expired'||doc.status==='rejected'?'red':'amber'
                    const isExpired = doc.expiry_date && new Date(doc.expiry_date)<new Date()
                    return (
                      <div key={doc.id} style={{display:'flex',alignItems:'center',gap:12,padding:'12px 14px',borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`,transition:'all .2s',
                        borderLeft:isExpired?'4px solid #ef4444':doc.status==='pending'?'4px solid #f59e0b':doc.status==='valid'||doc.status==='approved'?'4px solid #10b981':undefined}}>
                        <div style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:isDark?'rgba(59,130,246,0.1)':'#eff6ff',flexShrink:0}}>
                          <FileText size={16} style={{color:isDark?'#60a5fa':'#3b82f6'}} />
                        </div>
                        <div style={{flex:1,minWidth:0}}>
                          <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:2}}>
                            <p style={{fontSize:13,fontWeight:700,color:dk.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{doc.name||doc.file_name}</p>
                            <Badge color={statusColor} isDark={isDark}>{(doc.status||'pending').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</Badge>
                          </div>
                          <p style={{fontSize:10,color:dk.textFaint}}>
                            {getDocTypeLabel(doc.document_type)} · {new Date(doc.uploaded_at).toLocaleDateString('en-AU')}
                            {doc.expiry_date?` · Expires ${new Date(doc.expiry_date).toLocaleDateString('en-AU')}`:''}
                          </p>
                        </div>
                        <div style={{display:'flex',gap:4,flexShrink:0}}>
                          {doc.file_url && (
                            <a href={doc.file_url} target="_blank" rel="noopener noreferrer"
                              style={{padding:8,borderRadius:8,background:dk.subtleBg2,display:'flex',textDecoration:'none',transition:'all .2s'}}>
                              <Eye size={14} style={{color:dk.textMuted}} />
                            </a>
                          )}
                          <button onClick={()=>handleDeleteDocument(doc)}
                            style={{padding:8,borderRadius:8,background:'transparent',border:'none',cursor:'pointer',color:dk.textFaint,transition:'all .2s'}}
                            onMouseEnter={e=>e.currentTarget.style.color='#ef4444'}
                            onMouseLeave={e=>e.currentTarget.style.color=dk.textFaint}>
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div style={{padding:'40px 20px',textAlign:'center',borderRadius:14,border:`2px dashed ${dk.divider}`}}>
                  <Upload size={32} style={{color:dk.textFaint,margin:'0 auto 8px'}} />
                  <p style={{fontSize:14,fontWeight:700,color:dk.textMuted}}>No documents uploaded yet</p>
                  <p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Upload your certificates and qualifications above</p>
                </div>
              )}
            </Glass>
          </div>
        )}

        {/* ═══════ SECURITY SECTION ═══════ */}
        {activeSection === 'security' && (
          <div style={{...stg(3),display:'flex',flexDirection:'column',gap:16}}>
            <Glass isDark={isDark} style={{padding:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:16}}>
                <div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#f59e0b,#f97316)'}}>
                  <Lock size={13} style={{color:'white'}} />
                </div>
                <p style={{fontSize:14,fontWeight:800,color:dk.text}}>Change Password</p>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {[
                  { label:'Current Password',key:'current',placeholder:'Enter current password' },
                  { label:'New Password',key:'new',placeholder:'Enter new password (min 6 chars)' },
                  { label:'Confirm New Password',key:'confirm',placeholder:'Confirm new password' },
                ].map(item=>(
                  <div key={item.key}>
                    <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>{item.label}</p>
                    <div style={{position:'relative'}}>
                      <Lock size={14} style={{position:'absolute',left:14,top:'50%',transform:'translateY(-50%)',color:dk.textFaint}} />
                      <input type="password" value={passwordForm[item.key]} onChange={e=>setPasswordForm({...passwordForm,[item.key]:e.target.value})}
                        placeholder={item.placeholder}
                        style={{...inputStyle,paddingLeft:38}}
                        onFocus={e=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}}
                        onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}} />
                    </div>
                  </div>
                ))}
                <button onClick={handleChangePassword} disabled={changingPassword}
                  style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:changingPassword?'default':'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:changingPassword?0.6:1,boxShadow:`0 4px 16px -4px ${c.staff}50`,transition:'all .2s',marginTop:4}}>
                  {changingPassword?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Changing...</>:<><Lock size={16}/> Change Password</>}
                </button>
              </div>
            </Glass>

            {/* Sign Out */}
            <button onClick={handleLogout}
              style={{width:'100%',display:'flex',alignItems:'center',justifyContent:'center',gap:10,padding:'16px 20px',borderRadius:16,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:14,fontWeight:700,cursor:'pointer',transition:'all .2s'}}
              onMouseEnter={e=>{e.currentTarget.style.background=isDark?'rgba(239,68,68,0.1)':'#fef2f2';e.currentTarget.style.borderColor=isDark?'rgba(239,68,68,0.3)':'#fecaca';e.currentTarget.style.color='#ef4444'}}
              onMouseLeave={e=>{e.currentTarget.style.background='transparent';e.currentTarget.style.borderColor=dk.divider;e.currentTarget.style.color=dk.textMuted}}>
              <LogOut size={18} /> Sign Out
            </button>
          </div>
        )}
      </div>

      {/* ═══════ UPLOAD DOCUMENT MODAL ═══════ */}
      <Modal isOpen={showUploadModal} onClose={()=>setShowUploadModal(false)} title="" wide>
        <div>
          <div style={{margin:'-24px -24px 0',marginBottom:0}}>
            <div style={{background:`linear-gradient(135deg,${c.staff},${c.staffHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}} />
              <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}>
                  <Upload size={20} style={{color:'white'}} />
                </div>
                <div>
                  <h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Upload Document</h3>
                  <p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>Your admin will review and approve uploads</p>
                </div>
              </div>
            </div>
          </div>
          <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
            {/* Category */}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:8}}>Category *</p>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:8}}>
                {['qualification','document'].map(cat=>(
                  <button key={cat} onClick={()=>setDocForm({...docForm,category:cat,document_type:''})}
                    style={{padding:14,borderRadius:14,textAlign:'center',fontSize:13,fontWeight:700,cursor:'pointer',transition:'all .2s',
                      border:`2px solid ${docForm.category===cat?c.staff:dk.divider}`,
                      background:docForm.category===cat?(isDark?`${c.staff}15`:`${c.staff}08`):'transparent',
                      color:docForm.category===cat?c.staff:dk.textMuted}}>
                    {cat==='qualification'?'Qualification':'General Document'}
                  </button>
                ))}
              </div>
            </div>
            {docForm.category && (
              <div>
                <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Document Type *</p>
                <select value={docForm.document_type} onChange={e=>setDocForm({...docForm,document_type:e.target.value})} style={inputStyle}>
                  <option value="">Select type...</option>
                  {(docForm.category==='qualification'?QUAL_TYPES:GENERAL_TYPES).map(t=><option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {docForm.document_type==='other' && (
                  <input placeholder="Specify document type..." value={docForm.custom_type} onChange={e=>setDocForm({...docForm,custom_type:e.target.value})}
                    style={{...inputStyle,marginTop:8,borderColor:isDark?'rgba(249,115,22,0.3)':'#fed7aa'}}
                    onFocus={e=>{e.currentTarget.style.borderColor='#f97316';e.currentTarget.style.boxShadow='0 0 0 3px rgba(249,115,22,0.15)'}}
                    onBlur={e=>{e.currentTarget.style.borderColor=isDark?'rgba(249,115,22,0.3)':'#fed7aa';e.currentTarget.style.boxShadow='none'}} />
                )}
              </div>
            )}
            <div>
              <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Document Name</p>
              <input placeholder="e.g. First Aid - St John Ambulance" value={docForm.name} onChange={e=>setDocForm({...docForm,name:e.target.value})} style={inputStyle}
                onFocus={e=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}}
                onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}} />
            </div>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Expiry Date <span style={{fontWeight:500,color:dk.textFaint}}>(if applicable)</span></p>
              <input type="date" value={docForm.expiry_date} onChange={e=>setDocForm({...docForm,expiry_date:e.target.value})} style={inputStyle}
                onFocus={e=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}}
                onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}} />
            </div>
            <div>
              <p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>File *</p>
              {selectedFile ? (
                <div style={{display:'flex',alignItems:'center',gap:12,padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}>
                  <div style={{width:38,height:38,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff}20,${c.staffHover}15)`}}>
                    <FileText size={16} style={{color:c.staff}} />
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:dk.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{selectedFile.name}</p>
                    <p style={{fontSize:10,color:dk.textFaint}}>{(selectedFile.size/1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={()=>setSelectedFile(null)} style={{fontSize:11,fontWeight:700,color:'#ef4444',background:'none',border:'none',cursor:'pointer'}}>Remove</button>
                </div>
              ) : (
                <label style={{display:'flex',flexDirection:'column',alignItems:'center',gap:8,padding:'28px 16px',borderRadius:14,border:`2px dashed ${dk.divider}`,cursor:'pointer',textAlign:'center',transition:'all .2s'}}>
                  <Upload size={24} style={{color:dk.textFaint}} />
                  <p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Click to select a file</p>
                  <p style={{fontSize:10,color:dk.textFaint}}>PDF, JPG, PNG, DOC accepted</p>
                  <input type="file" style={{display:'none'}} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e=>setSelectedFile(e.target.files?.[0]||null)} />
                </label>
              )}
            </div>
            <div style={{display:'flex',gap:10,flexWrap:'wrap',paddingTop:4}}>
              <button onClick={()=>setShowUploadModal(false)}
                style={{flex:1,display:'flex',alignItems:'center',justifyContent:'center',gap:6,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>
                Cancel
              </button>
              <button onClick={handleUploadDocument} disabled={uploading}
                style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:uploading?'default':'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:uploading?0.6:1,boxShadow:`0 4px 16px -4px ${c.staff}50`,transition:'all .2s'}}>
                {uploading?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Uploading...</>:<><Upload size={16}/> Upload</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}