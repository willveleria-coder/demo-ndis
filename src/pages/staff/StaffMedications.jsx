import { useState, useEffect, useRef } from 'react'
import {
  Pill, Clock, CheckCircle, AlertTriangle, Search, X, Shield, Eye,
  Plus, Loader2, ChevronRight, Calendar, Activity, Users
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

export default function StaffMedications(){
  const{staffProfile}=useStaff()
  const c=useBrandColors()
  const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false)
  const[loading,setLoading]=useState(true)
  const[medications,setMedications]=useState([])
  const[searchQuery,setSearchQuery]=useState('')
  const[participantFilter,setParticipantFilter]=useState('all')
  const[showAdminister,setShowAdminister]=useState(null)
  const[adminNotes,setAdminNotes]=useState('')
  const[refused,setRefused]=useState(false)
  const[refusedReason,setRefusedReason]=useState('')
  const[saving,setSaving]=useState(false)
  const[recentAdmin,setRecentAdmin]=useState([])
  const[viewMed,setViewMed]=useState(null)

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none',transition:'all .2s'}

  useEffect(()=>{async function load(){try{const[medRes,adminRes]=await Promise.all([
    supabase.from('medications').select('*,participants(id,first_name,last_name)').eq('status','active').order('medication_name'),
    supabase.from('medication_administrations').select('*,medications(medication_name),participants(first_name,last_name)').eq('administered_by',staffProfile?.id).order('administered_at',{ascending:false}).limit(20)
  ]);setMedications(medRes.data||[]);setRecentAdmin(adminRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}if(staffProfile?.id)load()},[staffProfile?.id])

  const handleAdminister=async()=>{if(!showAdminister)return;setSaving(true);try{
    const payload={medication_id:showAdminister.id,participant_id:showAdminister.participant_id,administered_by:staffProfile.id,administered_at:new Date().toISOString(),refused,refused_reason:refused?refusedReason:null,notes:adminNotes||null}
    if(showAdminister.requires_witness)payload.witnessed_by=null
    const{data,error}=await supabase.from('medication_administrations').insert(payload).select('*,medications(medication_name),participants(first_name,last_name)').single()
    if(error)throw error;setRecentAdmin([data,...recentAdmin]);setShowAdminister(null);setAdminNotes('');setRefused(false);setRefusedReason('');alert(refused?'Refusal documented':'Medication administered!')}catch(err){alert('Failed: '+(err.message||'Unknown error'))}finally{setSaving(false)}}

  const participants=[...new Map(medications.map(m=>[m.participant_id,m.participants]).filter(([_,p])=>p)).values()]
  const totalMeds=medications.length;const witnessReq=medications.filter(m=>m.requires_witness).length;const prnMeds=medications.filter(m=>m.is_prn).length;const todayAdmin=recentAdmin.filter(a=>{const d=new Date(a.administered_at);return d.toDateString()===new Date().toDateString()}).length
  const filtered=medications.filter(m=>{if(participantFilter!=='all'&&m.participant_id!==participantFilter)return false;if(searchQuery.trim()){const q=searchQuery.toLowerCase();const pName=m.participants?`${m.participants.first_name} ${m.participants.last_name}`.toLowerCase():'';return m.medication_name.toLowerCase().includes(q)||pName.includes(q)||(m.dosage||'').toLowerCase().includes(q)}return true})
  const grouped=filtered.reduce((acc,m)=>{const pId=m.participant_id;if(!acc[pId])acc[pId]={participant:m.participants,meds:[]};acc[pId].meds.push(m);return acc},{})

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}><Pill size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading medications...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#8b5cf6" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#06b6d4" size={160} top="40%" right="15%" delay={4}/>

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* HERO */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',backdropFilter:'blur(8px)',fontSize:11,fontWeight:700,color:'white'}}><Pill size={12}/> MEDICATIONS</span>
              {witnessReq>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(245,158,11,0.3)',fontSize:10,fontWeight:700,color:'#fde68a'}}><Shield size={10}/> {witnessReq} WITNESS REQ</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Medication Administration</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>View medications and record administration</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{label:'Active Meds',value:totalMeds,icon:Pill},{label:'Witness Req',value:witnessReq,icon:Shield},{label:'PRN',value:prnMeds,icon:AlertTriangle},{label:'Given Today',value:todayAdmin,icon:CheckCircle}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',backdropFilter:'blur(8px)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* STAT CARDS */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[{icon:Pill,label:'Active Medications',value:totalMeds,gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40`},{icon:Shield,label:'Witness Required',value:witnessReq,gradient:'linear-gradient(135deg,#f59e0b,#d97706)',glow:'rgba(245,158,11,0.3)',alert:witnessReq>0},{icon:AlertTriangle,label:'PRN (As Needed)',value:prnMeds,gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)',glow:'rgba(139,92,246,0.3)'},{icon:CheckCircle,label:'Administered Today',value:todayAdmin,gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'}].map((stat,i)=>(
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}>
              <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}>
                <div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient}}><stat.icon size={18} style={{color:'white'}}/></div>
                {stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#f59e0b',animation:'pulse-dot 1.5s infinite'}}/>}
              </div>
              <p style={{fontSize:26,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value}/></p>
              <p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
            </Glass>
          ))}
        </div>

        {/* SEARCH + FILTER */}
        <div style={{...stg(2),display:'flex',flexWrap:'wrap',gap:10,marginBottom:20,alignItems:'stretch'}}>
          <Glass isDark={isDark} style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flex:'1 1 200px',minWidth:0}}>
            <Search size={16} style={{color:dk.textFaint}}/><input type="text" placeholder="Search medications..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{flex:1,padding:'8px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text}}/>
            {searchQuery&&<button onClick={()=>setSearchQuery('')} style={{padding:4,borderRadius:6,border:'none',cursor:'pointer',background:dk.subtleBg2,color:dk.textFaint}}><X size={12}/></button>}
          </Glass>
         <Glass isDark={isDark} style={{padding:'4px 10px',display:'flex',alignItems:'center',gap:6,flexShrink:0}}>
            <Users size={14} style={{color:dk.textFaint,flexShrink:0}}/>
            <select value={participantFilter} onChange={e=>setParticipantFilter(e.target.value)} style={{padding:'8px 4px',background:'transparent',border:'none',outline:'none',fontSize:12,fontWeight:600,color:dk.text,cursor:'pointer',minWidth:0,maxWidth:160,appearance:'auto'}}>
              <option value="all">All Participants</option>
              {participants.map(p=>p&&<option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
          </Glass>
        </div>

        {/* MEDICATIONS BY PARTICIPANT */}
        <div style={stg(3)}>
          {Object.keys(grouped).length>0?Object.entries(grouped).map(([pId,{participant:pt,meds}])=>(
            <div key={pId} style={{marginBottom:20}}>
              <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:10}}>
                <div style={{width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,fontSize:11,fontWeight:800,color:'white'}}>{pt?(pt.first_name?.[0]||'')+(pt.last_name?.[0]||''):'?'}</div>
                <p style={{fontSize:14,fontWeight:800,color:dk.text}}>{pt?`${pt.first_name} ${pt.last_name}`:'Unknown'}</p>
                <Badge color="blue" isDark={isDark}>{meds.length} med{meds.length!==1?'s':''}</Badge>
              </div>
              <div style={{display:'flex',flexDirection:'column',gap:8}}>
                {meds.map(m=>{const isWitness=m.requires_witness;const isPrn=m.is_prn;return(
                  <Glass key={m.id} isDark={isDark} style={{padding:16,display:'flex',alignItems:'center',gap:14,borderLeft:`4px solid ${isWitness?'#f59e0b':isPrn?'#8b5cf6':c.staff}`}}>
                    <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:isWitness?'linear-gradient(135deg,#f59e0b,#d97706)':isPrn?'linear-gradient(135deg,#8b5cf6,#6366f1)':`linear-gradient(135deg,${c.staff},${c.staffHover})`,flexShrink:0}}><Pill size={18} style={{color:'white'}}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:2}}>
                        <p style={{fontSize:14,fontWeight:700,color:dk.text}}>{m.medication_name}</p>
                        {isPrn&&<Badge color="purple" isDark={isDark}>PRN</Badge>}
                        {isWitness&&<Badge color="amber" isDark={isDark}>Witness Req</Badge>}
                      </div>
                      <p style={{fontSize:12,color:dk.textMuted}}>{m.dosage}{m.frequency?` · ${m.frequency.replace(/_/g,' ')}`:''}{m.route?` · ${m.route}`:''}</p>
                      {m.instructions&&<p style={{fontSize:11,color:dk.textFaint,marginTop:4,lineHeight:1.5}}>{m.instructions}</p>}
                      {m.prescriber&&<p style={{fontSize:10,color:dk.textFaint,marginTop:2}}>Prescriber: {m.prescriber}</p>}
                    </div>
                    <button onClick={()=>{setShowAdminister(m);setRefused(false);setRefusedReason('');setAdminNotes('')}} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:12,fontWeight:700,flexShrink:0,boxShadow:`0 4px 12px -2px ${c.staff}40`}}>
                      <CheckCircle size={14}/> Administer
                    </button>
                  </Glass>
                )})}
              </div>
            </div>
          )):(
            <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <Pill size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No medications found</p><p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Active medications for your participants will appear here</p>
            </Glass>
          )}
        </div>

        {/* RECENT ADMINISTRATIONS */}
        {recentAdmin.length>0&&(
          <div style={{...stg(4),marginTop:24}}>
            <p style={{fontSize:14,fontWeight:800,color:dk.text,marginBottom:12}}>Recent Administrations</p>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {recentAdmin.slice(0,10).map(a=>(
                <Glass key={a.id} isDark={isDark} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:a.refused?'linear-gradient(135deg,#ef4444,#dc2626)':'linear-gradient(135deg,#10b981,#059669)',flexShrink:0}}>{a.refused?<X size={14} style={{color:'white'}}/>:<CheckCircle size={14} style={{color:'white'}}/>}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:dk.text}}>{a.medications?.medication_name||'Medication'}</p>
                    <p style={{fontSize:11,color:dk.textMuted}}>{a.participants?`${a.participants.first_name} ${a.participants.last_name}`:'—'} · {a.administered_at?new Date(a.administered_at).toLocaleString('en-AU',{day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):''}</p>
                  </div>
                  <Badge color={a.refused?'red':'green'} isDark={isDark}>{a.refused?'Refused':'Given'}</Badge>
                </Glass>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ADMINISTER MODAL */}
      <Modal isOpen={!!showAdminister} onClose={()=>setShowAdminister(null)} title="" wide>
        {showAdminister&&(
          <div>
           <div style={{margin:'-20px -20px 0'}}>
              <div style={{background:`linear-gradient(135deg,${c.staff},${c.staffHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}>
                <div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
                <div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)'}}><Pill size={20} style={{color:'white'}}/></div>
                  <div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Administer Medication</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{showAdminister.medication_name} — {showAdminister.dosage}</p></div>
                </div>
              </div>
            </div>
            <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
              <div style={{padding:14,borderRadius:14,background:isDark?'rgba(59,130,246,0.08)':'#eff6ff',border:'1px solid rgba(59,130,246,0.15)'}}>
                <p style={{fontSize:12,color:isDark?'#93c5fd':'#1d4ed8',lineHeight:1.6}}>
                  <strong>Instructions:</strong> {showAdminister.instructions||'No special instructions'}
                  {showAdminister.requires_witness&&<><br/><span style={{color:'#f59e0b',fontWeight:700}}>⚠️ Witness required for this medication</span></>}
                </p>
              </div>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,color:dk.textFaint,textTransform:'uppercase'}}>Medication</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{showAdminister.medication_name}</p></div>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,color:dk.textFaint,textTransform:'uppercase'}}>Dosage</p><p style={{fontSize:13,fontWeight:700,color:dk.text,marginTop:4}}>{showAdminister.dosage} · {(showAdminister.frequency||'').replace(/_/g,' ')}</p></div>
              </div>
              <label style={{display:'flex',alignItems:'center',gap:10,padding:'12px 14px',borderRadius:12,background:isDark?'rgba(239,68,68,0.08)':'rgba(239,68,68,0.04)',border:'1px solid rgba(239,68,68,0.15)',cursor:'pointer'}}>
                <input type="checkbox" checked={refused} onChange={e=>setRefused(e.target.checked)} style={{width:18,height:18,accentColor:'#ef4444'}}/>
                <div><p style={{fontSize:13,fontWeight:700,color:'#ef4444'}}>Participant Refused</p><p style={{fontSize:11,color:dk.textFaint}}>Document if participant refused this medication</p></div>
              </label>
              {refused&&<div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Reason for Refusal</p><textarea value={refusedReason} onChange={e=>setRefusedReason(e.target.value)} rows={2} placeholder="Why did the participant refuse?" style={{...inputStyle,resize:'vertical',minHeight:60}} onFocus={e=>{e.currentTarget.style.borderColor=c.staff}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/></div>}
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Notes <span style={{fontWeight:500,color:dk.textFaint}}>(optional)</span></p><textarea value={adminNotes} onChange={e=>setAdminNotes(e.target.value)} rows={2} placeholder="Any observations or notes..." style={{...inputStyle,resize:'vertical',minHeight:60}} onFocus={e=>{e.currentTarget.style.borderColor=c.staff}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/></div>
              <div style={{display:'flex',gap:10}}>
                <button onClick={()=>setShowAdminister(null)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
                <button onClick={handleAdminister} disabled={saving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:saving?'default':'pointer',background:refused?'linear-gradient(135deg,#ef4444,#dc2626)':`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:saving?0.6:1}}>
                  {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Recording...</>:refused?<><AlertTriangle size={16}/> Record Refusal</>:<><CheckCircle size={16}/> Confirm Administration</>}
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}