import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Shield, AlertTriangle, CheckCircle, Clock, FileText, Users, GraduationCap,
  XCircle, Search, ChevronRight, TrendingUp, Activity, Eye, Loader2, Target
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'

/* ═══════ DESIGN SYSTEM ═══════ */
function Glass({children,glow,style={},hover=false,dark=false,onClick,...p}){return<div onClick={onClick} style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

export default function ComplianceDashboard(){
  const{user}=useAuth();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[staff,setStaff]=useState([]);const[docs,setDocs]=useState([]);const[training,setTraining]=useState([]);const[incidents,setIncidents]=useState([]);const[shifts,setShifts]=useState([]);const[notes,setNotes]=useState([])

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  useEffect(()=>{async function load(){try{const today=new Date().toISOString().split('T')[0];const thirtyAgo=new Date(Date.now()-30*864e5).toISOString().split('T')[0]
    const[staffRes,docsRes,trainRes,incRes,shiftRes,notesRes]=await Promise.all([
      supabase.from('staff').select('id,first_name,last_name,status,role').eq('status','active'),
      supabase.from('documents').select('id,name,document_type,expiry_date,status,staff_id,participant_id,staff(first_name,last_name),participants(first_name,last_name)').not('expiry_date','is',null),
      supabase.from('staff_training').select('id,training_type,staff_id,expiry_date,status,staff(first_name,last_name)'),
      supabase.from('incidents').select('id,incident_type,severity,status,ndis_reportable,follow_up_required,incident_date').in('status',['open','investigating']),
      supabase.from('shifts').select('id,staff_id,participant_id,shift_date,status').eq('status','completed').gte('shift_date',thirtyAgo),
      supabase.from('shift_notes').select('id,shift_id').gte('created_at',thirtyAgo+'T00:00:00')
    ]);setStaff(staffRes.data||[]);setDocs(docsRes.data||[]);setTraining(trainRes.data||[]);setIncidents(incRes.data||[]);setShifts(shiftRes.data||[]);setNotes(notesRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[])

  /* ─── Compliance calculations ─── */
  const today=new Date();const todayStr=today.toISOString().split('T')[0];const in30=new Date(Date.now()+30*864e5).toISOString().split('T')[0]
  const expiredDocs=docs.filter(d=>d.expiry_date&&d.expiry_date<todayStr)
  const expiringSoon=docs.filter(d=>d.expiry_date&&d.expiry_date>=todayStr&&d.expiry_date<=in30)
  const expiredTraining=training.filter(t=>t.expiry_date&&t.expiry_date<todayStr)
  const expiringTraining=training.filter(t=>t.expiry_date&&t.expiry_date>=todayStr&&t.expiry_date<=in30)
  const openIncidents=incidents.filter(i=>i.status==='open'||i.status==='investigating')
  const ndisReportable=incidents.filter(i=>i.ndis_reportable)
  const followUpRequired=incidents.filter(i=>i.follow_up_required)
  const shiftIds=new Set(shifts.map(s=>s.id));const noteShiftIds=new Set(notes.map(n=>n.shift_id))
  const shiftsWithoutNotes=shifts.filter(s=>!noteShiftIds.has(s.id))
  const noteCompliancePct=shifts.length>0?Math.round((noteShiftIds.size/shifts.length)*100):100
  const totalIssues=expiredDocs.length+expiredTraining.length+openIncidents.length+shiftsWithoutNotes.length
  const complianceScore=Math.max(0,100-expiredDocs.length*5-expiredTraining.length*5-openIncidents.length*3-Math.max(0,100-noteCompliancePct))
  const scoreColor=complianceScore>=80?'#10b981':complianceScore>=60?'#f59e0b':'#ef4444'

  const allIssues=[
    ...expiredDocs.map(d=>({type:'expired_doc',severity:'high',title:`Expired: ${d.name}`,detail:d.staff?`${d.staff.first_name} ${d.staff.last_name}`:d.participants?`${d.participants.first_name} ${d.participants.last_name}`:'Unknown',date:d.expiry_date,icon:FileText,color:'#ef4444',link:'/admin/staff'})),
    ...expiringSoon.map(d=>({type:'expiring_doc',severity:'medium',title:`Expiring: ${d.name}`,detail:d.staff?`${d.staff.first_name} ${d.staff.last_name}`:d.participants?`${d.participants.first_name} ${d.participants.last_name}`:'Unknown',date:d.expiry_date,icon:Clock,color:'#f59e0b',link:'/admin/staff'})),
    ...expiredTraining.map(t=>({type:'expired_training',severity:'high',title:`Training Expired: ${t.training_type}`,detail:t.staff?`${t.staff.first_name} ${t.staff.last_name}`:'Unknown',date:t.expiry_date,icon:GraduationCap,color:'#ef4444',link:'/admin/training'})),
    ...expiringTraining.map(t=>({type:'expiring_training',severity:'medium',title:`Training Expiring: ${t.training_type}`,detail:t.staff?`${t.staff.first_name} ${t.staff.last_name}`:'Unknown',date:t.expiry_date,icon:GraduationCap,color:'#f59e0b',link:'/admin/training'})),
    ...openIncidents.map(i=>({type:'open_incident',severity:i.severity==='critical'||i.severity==='high'?'critical':'medium',title:`${(i.incident_type||'Incident').replace(/_/g,' ')} — ${i.severity}`,detail:i.ndis_reportable?'NDIS Reportable':'Requires follow-up',date:i.incident_date,icon:AlertTriangle,color:i.severity==='critical'||i.severity==='high'?'#ef4444':'#f59e0b',link:'/admin/incidents'})),
  ].sort((a,b)=>{const sev={critical:0,high:1,medium:2,low:3};return(sev[a.severity]||3)-(sev[b.severity]||3)})

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><Shield size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Analysing compliance...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.primary} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#ef4444" size={160} top="40%" right="15%" delay={4}/>

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* HERO */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.primary} 0%,${c.adminHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14,flexWrap:'wrap'}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white'}}><Shield size={12}/> NDIS COMPLIANCE</span>
              {totalIssues>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(239,68,68,0.3)',fontSize:10,fontWeight:700,color:'#fca5a5'}}><AlertTriangle size={10}/> {totalIssues} ISSUES</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Compliance Dashboard</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Monitor compliance across documents, training, incidents, and shift notes</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{label:'Score',value:`${complianceScore}%`,icon:Shield},{label:'Issues',value:totalIssues,icon:AlertTriangle},{label:'Expired Docs',value:expiredDocs.length,icon:XCircle},{label:'Open Incidents',value:openIncidents.length,icon:Eye}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* COMPLIANCE SCORE + STATS */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'auto 1fr',gap:20,marginBottom:24,alignItems:'start'}}>
          {/* Score ring */}
          <Glass dark={isDark} style={{padding:24,textAlign:'center'}}>
            <div style={{position:'relative',width:120,height:120,margin:'0 auto'}}>
              <svg width={120} height={120} style={{transform:'rotate(-90deg)'}}>
                <circle cx={60} cy={60} r={50} fill="none" stroke={isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)'} strokeWidth={10}/>
                <circle cx={60} cy={60} r={50} fill="none" stroke={scoreColor} strokeWidth={10} strokeLinecap="round" strokeDasharray={2*Math.PI*50} strokeDashoffset={2*Math.PI*50*(1-complianceScore/100)} style={{transition:'stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)',filter:`drop-shadow(0 0 8px ${scoreColor}40)`}}/>
              </svg>
              <div style={{position:'absolute',inset:0,display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center'}}>
                <p style={{fontSize:32,fontWeight:900,color:scoreColor}}><AnimNum value={complianceScore}/></p>
                <p style={{fontSize:9,fontWeight:700,color:dk.textFaint,textTransform:'uppercase'}}>Score</p>
              </div>
            </div>
            <p style={{fontSize:12,fontWeight:700,color:scoreColor,marginTop:12}}>{complianceScore>=80?'Good Standing':complianceScore>=60?'Needs Attention':'Critical'}</p>
          </Glass>

          {/* Stat cards grid */}
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:12}}>
            {[
              {icon:FileText,label:'Expired Docs',value:expiredDocs.length,gradient:'linear-gradient(135deg,#ef4444,#dc2626)',glow:'rgba(239,68,68,0.3)',alert:expiredDocs.length>0},
              {icon:Clock,label:'Expiring Soon',value:expiringSoon.length,gradient:'linear-gradient(135deg,#f59e0b,#d97706)',glow:'rgba(245,158,11,0.3)',alert:expiringSoon.length>0},
              {icon:GraduationCap,label:'Training Overdue',value:expiredTraining.length,gradient:'linear-gradient(135deg,#8b5cf6,#6366f1)',glow:'rgba(139,92,246,0.3)',alert:expiredTraining.length>0},
              {icon:AlertTriangle,label:'Open Incidents',value:openIncidents.length,gradient:'linear-gradient(135deg,#f97316,#ea580c)',glow:'rgba(249,115,22,0.3)',alert:openIncidents.length>0},
              {icon:Shield,label:'NDIS Reportable',value:ndisReportable.length,gradient:'linear-gradient(135deg,#ef4444,#b91c1c)',glow:'rgba(239,68,68,0.3)',alert:ndisReportable.length>0},
              {icon:Activity,label:'Note Compliance',value:noteCompliancePct,suffix:'%',gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'},
            ].map((stat,i)=>(
              <Glass key={i} dark={isDark} hover glow={stat.glow} style={{padding:'16px 14px'}}>
                <div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:8}}>
                  <div style={{width:34,height:34,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient}}><stat.icon size={16} style={{color:'white'}}/></div>
                  {stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s infinite'}}/>}
                </div>
                <p style={{fontSize:22,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value} suffix={stat.suffix||''}/></p>
                <p style={{fontSize:10,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p>
              </Glass>
            ))}
          </div>
        </div>

        {/* ALL ISSUES LIST */}
        <div style={stg(2)}>
          <p style={{fontSize:16,fontWeight:900,color:dk.text,marginBottom:4}}>Compliance Issues</p>
          <p style={{fontSize:12,color:dk.textFaint,marginBottom:14}}>{allIssues.length} item{allIssues.length!==1?'s':''} requiring attention · sorted by severity</p>
          {allIssues.length>0?<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {allIssues.map((issue,i)=>(
              <Link key={i} to={issue.link} style={{textDecoration:'none'}}>
                <Glass dark={isDark} hover style={{padding:'14px 16px',display:'flex',alignItems:'center',gap:14,borderLeft:`4px solid ${issue.color}`}}>
                  <div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:`${issue.color}15`,flexShrink:0}}><issue.icon size={16} style={{color:issue.color}}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <p style={{fontSize:13,fontWeight:700,color:dk.text}}>{issue.title}</p>
                    <p style={{fontSize:11,color:dk.textMuted}}>{issue.detail}{issue.date?` · ${new Date(issue.date).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'})}`:''}</p>
                  </div>
                  <Badge color={issue.severity==='critical'?'red':issue.severity==='high'?'red':'amber'} isDark={isDark}>{issue.severity}</Badge>
                  <ChevronRight size={14} style={{color:dk.textFaint}}/>
                </Glass>
              </Link>
            ))}
          </div>:(
            <Glass dark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <CheckCircle size={48} style={{color:'#10b981',margin:'0 auto 12px'}}/><p style={{fontSize:18,fontWeight:900,color:'#10b981'}}>All Clear!</p><p style={{fontSize:13,color:dk.textFaint,marginTop:4}}>No compliance issues detected. Keep up the great work.</p>
            </Glass>
          )}
        </div>

        {/* SHIFTS WITHOUT NOTES */}
        {shiftsWithoutNotes.length>0&&(
          <div style={{...stg(3),marginTop:24}}>
            <p style={{fontSize:14,fontWeight:800,color:dk.text,marginBottom:10}}>Shifts Missing Notes ({shiftsWithoutNotes.length})</p>
            <Glass dark={isDark} style={{padding:'14px 18px'}}>
              <p style={{fontSize:12,color:dk.textMuted,lineHeight:1.6}}>{shiftsWithoutNotes.length} completed shift{shiftsWithoutNotes.length!==1?'s':''} in the last 30 days are missing shift notes. Note compliance is at <span style={{fontWeight:800,color:noteCompliancePct>=80?'#10b981':noteCompliancePct>=60?'#f59e0b':'#ef4444'}}>{noteCompliancePct}%</span>.</p>
              <Link to="/admin/notes" style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:10,fontSize:12,fontWeight:700,color:c.primary,textDecoration:'none'}}><FileText size={14}/> View Notes Dashboard <ChevronRight size={12}/></Link>
            </Glass>
          </div>
        )}
      </div>
    </div>
  )
}