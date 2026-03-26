import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Plus, Search, X, Clock, CheckCircle, Eye, Loader2,
  Shield, MapPin, Calendar, ChevronRight, Camera, Upload, FileText,
  Activity, Flame, AlertCircle, Filter
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

/* ═══════ DESIGN SYSTEM ═══════ */
function Glass({children,glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'},orange:isDark?{bg:'rgba(249,115,22,0.15)',text:'#fb923c',border:'rgba(249,115,22,0.3)'}:{bg:'#fff7ed',text:'#ea580c',border:'#fed7aa'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

const SEVERITY_CONFIG={low:{color:'blue',icon:Shield,gradient:'linear-gradient(135deg,#3b82f6,#2563eb)'},medium:{color:'amber',icon:AlertCircle,gradient:'linear-gradient(135deg,#f59e0b,#d97706)'},high:{color:'orange',icon:AlertTriangle,gradient:'linear-gradient(135deg,#f97316,#ea580c)'},critical:{color:'red',icon:Flame,gradient:'linear-gradient(135deg,#ef4444,#dc2626)'}}
const STATUS_CONFIG={open:{color:'amber',label:'Open'},investigating:{color:'purple',label:'Investigating'},resolved:{color:'green',label:'Resolved'},closed:{color:'gray',label:'Closed'}}
const INCIDENT_TYPES=['fall','injury','behavioural','medication','near_miss','property_damage','equipment','other']

export default function StaffIncidents(){
  const navigate=useNavigate()
  const{staffProfile,myShifts}=useStaff()
  const c=useBrandColors()
  const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false)
  const[loading,setLoading]=useState(true)
  const[incidents,setIncidents]=useState([])
  const[participants,setParticipants]=useState([])
  const[statusFilter,setStatusFilter]=useState('all')
  const[searchQuery,setSearchQuery]=useState('')
  const[showCreate,setShowCreate]=useState(false)
  const[viewIncident,setViewIncident]=useState(null)
  const[saving,setSaving]=useState(false)
  const[newInc,setNewInc]=useState({participant_id:'',incident_type:'',severity:'medium',description:'',location:'',immediate_action:'',ndis_reportable:false,incident_date:new Date().toISOString().slice(0,16)})

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none',transition:'all .2s'}
  const focusStyle=(e)=>{e.currentTarget.style.borderColor=c.staff;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.staff}15`}
  const blurStyle=(e)=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}

  useEffect(()=>{async function load(){try{const[incRes,partRes]=await Promise.all([supabase.from('incidents').select('*,participants(first_name,last_name)').eq('reported_by',staffProfile?.id).order('incident_date',{ascending:false}),supabase.from('participants').select('id,first_name,last_name').eq('status','active').order('first_name')]);setIncidents(incRes.data||[]);setParticipants(partRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}if(staffProfile?.id)load()},[staffProfile?.id])

  const handleCreate=async()=>{if(!newInc.participant_id||!newInc.description||!newInc.incident_type){alert('Please fill in participant, type, and description');return}
    setSaving(true);try{const{data,error}=await supabase.from('incidents').insert({...newInc,reported_by:staffProfile.id,status:'open'}).select('*,participants(first_name,last_name)').single();if(error)throw error;setIncidents([data,...incidents]);setShowCreate(false);setNewInc({participant_id:'',incident_type:'',severity:'medium',description:'',location:'',immediate_action:'',ndis_reportable:false,incident_date:new Date().toISOString().slice(0,16)})}catch(err){alert('Failed: '+(err.message||'Unknown error'))}finally{setSaving(false)}}

  const openCount=incidents.filter(i=>i.status==='open').length
  const investigatingCount=incidents.filter(i=>i.status==='investigating').length
  const resolvedCount=incidents.filter(i=>i.status==='resolved').length
  const ndisCount=incidents.filter(i=>i.ndis_reportable).length
  const filtered=incidents.filter(i=>{if(statusFilter!=='all'&&i.status!==statusFilter)return false;if(searchQuery.trim()){const q=searchQuery.toLowerCase();const pName=i.participants?`${i.participants.first_name} ${i.participants.last_name}`.toLowerCase():'';return pName.includes(q)||(i.description||'').toLowerCase().includes(q)||(i.incident_type||'').toLowerCase().includes(q)}return true})

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}><AlertTriangle size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading incidents...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#ef4444" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#f59e0b" size={160} top="40%" right="15%" delay={4}/>

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* HERO */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white'}}><AlertTriangle size={12}/> INCIDENTS</span>
              {openCount>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(239,68,68,0.3)',fontSize:10,fontWeight:700,color:'#fca5a5'}}><span style={{width:6,height:6,borderRadius:3,background:'#f87171',animation:'pulse-dot 1.5s infinite'}}/> {openCount} OPEN</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Incident Reports</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Report and track incidents for NDIS compliance</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[{label:'Total',value:incidents.length,icon:AlertTriangle},{label:'Open',value:openCount,icon:AlertCircle},{label:'Investigating',value:investigatingCount,icon:Eye},{label:'NDIS Reportable',value:ndisCount,icon:Shield}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}><Plus size={16}/> Report Incident</button>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[{icon:AlertTriangle,label:'Total',value:incidents.length,gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40`},{icon:AlertCircle,label:'Open',value:openCount,gradient:'linear-gradient(135deg,#f59e0b,#f97316)',glow:'rgba(245,158,11,0.3)',alert:openCount>0},{icon:Eye,label:'Investigating',value:investigatingCount,gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)',glow:'rgba(139,92,246,0.3)'},{icon:CheckCircle,label:'Resolved',value:resolvedCount,gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'}].map((stat,i)=>(
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient}}><stat.icon size={18} style={{color:'white'}}/></div>
                {stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s ease-in-out infinite'}}/>}
              </div>
              <p style={{fontSize:26,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value}/></p>
              <p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{...stg(2),display:'flex',flexWrap:'wrap',gap:12,marginBottom:20}}>
          <Glass isDark={isDark} style={{padding:6,display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{id:'all',label:'All',count:incidents.length},{id:'open',label:'Open',count:openCount},{id:'investigating',label:'Investigating',count:investigatingCount},{id:'resolved',label:'Resolved',count:resolvedCount}].map(f=>(
              <button key={f.id} onClick={()=>setStatusFilter(f.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,background:statusFilter===f.id?`linear-gradient(135deg,${c.staff},${c.staffHover})`:'transparent',color:statusFilter===f.id?'white':dk.textMuted,boxShadow:statusFilter===f.id?`0 4px 16px -4px ${c.staff}50`:'none'}}>
                {f.label}{f.count>0&&<span style={{padding:'1px 7px',borderRadius:999,fontSize:9,fontWeight:800,background:statusFilter===f.id?'rgba(255,255,255,0.25)':dk.subtleBg2,color:statusFilter===f.id?'white':dk.textFaint}}>{f.count}</span>}
              </button>
            ))}
          </Glass>
          <Glass isDark={isDark} style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flex:'1 1 200px',minWidth:0}}>
            <Search size={16} style={{color:dk.textFaint}}/><input type="text" placeholder="Search incidents..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{flex:1,padding:'8px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text}}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{padding:4,borderRadius:6,border:'none',cursor:'pointer',background:dk.subtleBg2,color:dk.textFaint}}><X size={12}/></button>}
          </Glass>
        </div>

        {/* LIST */}
        <div style={stg(3)}>
          {filtered.length>0?<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(inc=>{const sev=SEVERITY_CONFIG[inc.severity]||SEVERITY_CONFIG.medium;const st=STATUS_CONFIG[inc.status]||STATUS_CONFIG.open;const pName=inc.participants?`${inc.participants.first_name} ${inc.participants.last_name}`:'—'
              return(
                <Glass key={inc.id} isDark={isDark} hover onClick={()=>setViewIncident(inc)} style={{padding:16,display:'flex',alignItems:'flex-start',gap:14,borderLeft:`4px solid ${inc.severity==='critical'||inc.severity==='high'?'#ef4444':inc.severity==='medium'?'#f59e0b':'#3b82f6'}`}}>
                  <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:sev.gradient,flexShrink:0}}><sev.icon size={18} style={{color:'white'}}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
                      <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{(inc.incident_type||'incident').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</p>
                      <Badge color={sev.color} isDark={isDark}>{(inc.severity||'medium').toUpperCase()}</Badge>
                      <Badge color={st.color} isDark={isDark}>{st.label}</Badge>
                      {inc.ndis_reportable&&<Badge color="red" isDark={isDark}>NDIS Reportable</Badge>}
                    </div>
                    <p style={{fontSize:12,color:dk.textMuted}}>{pName}{inc.location?` · ${inc.location}`:''}</p>
                    <p style={{fontSize:12,color:dk.textFaint,marginTop:4,lineHeight:1.5}}>{(inc.description||'').substring(0,120)}{(inc.description||'').length>120?'...':''}</p>
                    <p style={{fontSize:10,color:dk.textFaint,marginTop:4}}>{inc.incident_date?new Date(inc.incident_date).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',year:'numeric',hour:'numeric',minute:'2-digit'}):''}</p>
                  </div>
                  <ChevronRight size={14} style={{color:dk.textFaint,flexShrink:0,marginTop:4}}/>
                </Glass>
              )})}
          </div>:(
            <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <AlertTriangle size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No incidents recorded</p><p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Report incidents to maintain NDIS compliance</p>
              <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700}}><Plus size={14}/> Report Incident</button>
            </Glass>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="" wide>
        <div>
          <div style={{margin:'-24px -24px 0'}}>
            <div style={{background:`linear-gradient(135deg,#ef4444,#dc2626,#f97316)`,padding:'24px',position:'relative',overflow:'hidden'}}>
              <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
              <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}>
                <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}><AlertTriangle size={20} style={{color:'white'}}/></div>
                <div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Report Incident</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>Document for NDIS compliance</p></div>
              </div>
            </div>
          </div>
          <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Participant *</p><select value={newInc.participant_id} onChange={e=>setNewInc({...newInc,participant_id:e.target.value})} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}><option value="">Select...</option>{participants.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select></div>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Incident Type *</p><select value={newInc.incident_type} onChange={e=>setNewInc({...newInc,incident_type:e.target.value})} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}><option value="">Select...</option>{INCIDENT_TYPES.map(t=><option key={t} value={t}>{t.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</option>)}</select></div>
            </div>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Severity *</p><select value={newInc.severity} onChange={e=>setNewInc({...newInc,severity:e.target.value})} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}><option value="low">Low</option><option value="medium">Medium</option><option value="high">High</option><option value="critical">Critical</option></select></div>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Date/Time *</p><input type="datetime-local" value={newInc.incident_date} onChange={e=>setNewInc({...newInc,incident_date:e.target.value})} style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}/></div>
            </div>
            <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Location</p><input type="text" value={newInc.location} onChange={e=>setNewInc({...newInc,location:e.target.value})} placeholder="Where did it happen?" style={inputStyle} onFocus={focusStyle} onBlur={blurStyle}/></div>
            <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Description *</p><textarea value={newInc.description} onChange={e=>setNewInc({...newInc,description:e.target.value})} rows={4} placeholder="Describe what happened in detail..." style={{...inputStyle,resize:'vertical',minHeight:80}} onFocus={focusStyle} onBlur={blurStyle}/></div>
            <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Immediate Action Taken</p><textarea value={newInc.immediate_action} onChange={e=>setNewInc({...newInc,immediate_action:e.target.value})} rows={2} placeholder="What did you do immediately?" style={{...inputStyle,resize:'vertical',minHeight:60}} onFocus={focusStyle} onBlur={blurStyle}/></div>
            <label style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,background:isDark?'rgba(239,68,68,0.08)':'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.15)',cursor:'pointer'}}>
              <input type="checkbox" checked={newInc.ndis_reportable} onChange={e=>setNewInc({...newInc,ndis_reportable:e.target.checked})} style={{width:18,height:18,accentColor:'#ef4444'}}/>
              <div><p style={{fontSize:13,fontWeight:700,color:'#ef4444'}}>NDIS Reportable Incident</p><p style={{fontSize:11,color:dk.textFaint}}>Check if this must be reported to the NDIS Commission</p></div>
            </label>
            <div style={{display:'flex',gap:10,paddingTop:4}}>
              <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:saving?'default':'pointer',background:'linear-gradient(135deg,#ef4444,#dc2626)',color:'white',fontSize:13,fontWeight:800,opacity:saving?0.6:1}}>
                {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Submitting...</>:<><AlertTriangle size={16}/> Submit Incident</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>

      {/* VIEW MODAL */}
      <Modal isOpen={!!viewIncident} onClose={()=>setViewIncident(null)} title="" wide>
        {viewIncident&&(()=>{const sev=SEVERITY_CONFIG[viewIncident.severity]||SEVERITY_CONFIG.medium;const st=STATUS_CONFIG[viewIncident.status]||STATUS_CONFIG.open;const pName=viewIncident.participants?`${viewIncident.participants.first_name} ${viewIncident.participants.last_name}`:'—'
          return(<div>
            <div style={{margin:'-24px -24px 0'}}><div style={{background:sev.gradient.replace(')',',#1e293b)'),padding:'24px',position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/><div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:14}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)'}}><sev.icon size={22} style={{color:'white'}}/></div><div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>{(viewIncident.incident_type||'Incident').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{pName}</p></div><span style={{marginLeft:'auto',padding:'4px 12px',borderRadius:999,fontSize:10,fontWeight:700,background:'rgba(255,255,255,0.2)',color:'white'}}>{st.label}</span></div></div></div>
            <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(130px,1fr))',gap:10}}>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:dk.textFaint}}>Severity</p><div style={{marginTop:4}}><Badge color={sev.color} isDark={isDark}>{(viewIncident.severity||'medium').toUpperCase()}</Badge></div></div>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:dk.textFaint}}>Date</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{viewIncident.incident_date?new Date(viewIncident.incident_date).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'—'}</p></div>
                {viewIncident.location&&<div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:dk.textFaint}}>Location</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{viewIncident.location}</p></div>}
                {viewIncident.ndis_reportable&&<div style={{padding:14,borderRadius:14,background:isDark?'rgba(239,68,68,0.1)':'#fef2f2',border:'1px solid rgba(239,68,68,0.2)'}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#ef4444'}}>NDIS Status</p><p style={{fontSize:13,fontWeight:700,color:'#ef4444',marginTop:4}}>Reportable</p></div>}
              </div>
              <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:dk.textFaint,marginBottom:6}}>Description</p><p style={{fontSize:13,color:dk.text,lineHeight:1.6}}>{viewIncident.description}</p></div>
              {viewIncident.immediate_action&&<div style={{padding:14,borderRadius:14,background:isDark?'rgba(16,185,129,0.08)':'#ecfdf5',border:'1px solid rgba(16,185,129,0.15)'}}><p style={{fontSize:10,fontWeight:700,textTransform:'uppercase',color:'#10b981',marginBottom:6}}>Immediate Action</p><p style={{fontSize:13,color:dk.text,lineHeight:1.6}}>{viewIncident.immediate_action}</p></div>}
              <button onClick={()=>setViewIncident(null)} style={{width:'100%',padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
            </div>
          </div>)
        })()}
      </Modal>
    </div>
  )
}