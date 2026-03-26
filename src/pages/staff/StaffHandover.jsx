import { useState, useEffect, useRef } from 'react'
import { ArrowRight, Plus, Search, X, Clock, CheckCircle, User, Loader2, Send, MessageSquare, ChevronRight, AlertTriangle, FileText } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

function Glass({children,glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s cubic-bezier(.16,1,.3,1)':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

export default function StaffHandover(){
  const{staffProfile,myShifts}=useStaff();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[handovers,setHandovers]=useState([]);const[showCreate,setShowCreate]=useState(false);const[saving,setSaving]=useState(false)
  const[newNote,setNewNote]=useState({participant_id:'',content:'',priority:'normal',concerns:'',tasks_pending:''})
  const[participants,setParticipants]=useState([])

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none',transition:'all .2s'}

  useEffect(()=>{async function load(){try{
    // Use shift_notes recommendations field as handover notes + load recent ones from other staff
    const[notesRes,partRes]=await Promise.all([
      supabase.from('shift_notes').select('*,shifts(shift_date,participant_id,participants(first_name,last_name)),staff:staff_id(first_name,last_name)').not('recommendations','is',null).order('created_at',{ascending:false}).limit(30),
      supabase.from('participants').select('id,first_name,last_name').eq('status','active').order('first_name')
    ]);setHandovers(notesRes.data||[]);setParticipants(partRes.data||[])}catch(err){console.error(err)}}if(staffProfile?.id)load()},[staffProfile?.id])

  const handleCreate=async()=>{if(!newNote.content){alert('Please write a handover note');return}
    setSaving(true);try{
    const activeShift=myShifts.find(s=>s.status==='in_progress')||myShifts.find(s=>s.status==='completed')
    if(!activeShift){alert('No active or recent shift found to attach this handover to');setSaving(false);return}
    const payload={shift_id:activeShift.id,staff_id:staffProfile.id,recommendations:newNote.content+(newNote.concerns?`\n\n⚠️ CONCERNS: ${newNote.concerns}`:'')+(newNote.tasks_pending?`\n\n📋 PENDING TASKS: ${newNote.tasks_pending}`:'')}
    const{error}=await supabase.from('shift_notes').upsert(payload,{onConflict:'shift_id,staff_id'})
    if(error){const{error:err2}=await supabase.from('shift_notes').insert(payload);if(err2)throw err2}
    alert('Handover note saved!');setShowCreate(false);setNewNote({participant_id:'',content:'',priority:'normal',concerns:'',tasks_pending:''})
    const{data}=await supabase.from('shift_notes').select('*,shifts(shift_date,participant_id,participants(first_name,last_name)),staff:staff_id(first_name,last_name)').not('recommendations','is',null).order('created_at',{ascending:false}).limit(30)
    setHandovers(data||[])}catch(err){alert('Failed: '+(err.message||'Unknown error'))}finally{setSaving(false)}}

  const urgentCount=handovers.filter(h=>h.recommendations?.includes('⚠️')).length

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#06b6d4" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#f59e0b" size={160} top="40%" right="15%" delay={4}/>

      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* HERO */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white'}}><ArrowRight size={12}/> HANDOVER</span>
              {urgentCount>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(239,68,68,0.3)',fontSize:10,fontWeight:700,color:'#fca5a5'}}><AlertTriangle size={10}/> {urgentCount} URGENT</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Handover Notes</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Leave notes for the next support worker</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[{label:'Total Notes',value:handovers.length,icon:MessageSquare},{label:'Urgent',value:urgentCount,icon:AlertTriangle}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}>
                  <pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span>
                </div>
              ))}
            </div>
            <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}><Plus size={16}/> Write Handover</button>
          </div>
        </div>

        {/* NOTES LIST */}
        <div style={stg(1)}>
          {handovers.length>0?<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {handovers.map((h,i)=>{const pName=h.shifts?.participants?`${h.shifts.participants.first_name} ${h.shifts.participants.last_name}`:'—';const staffName=h.staff?`${h.staff.first_name} ${h.staff.last_name}`:'—';const isUrgent=h.recommendations?.includes('⚠️');const hasTasks=h.recommendations?.includes('📋')
              return(
                <Glass key={h.id} isDark={isDark} hover style={{padding:16,borderLeft:isUrgent?'4px solid #ef4444':hasTasks?'4px solid #f59e0b':undefined}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                    <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,fontSize:12,fontWeight:800,color:'white',flexShrink:0}}>{staffName.split(' ').map(n=>n[0]).join('')}</div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}>
                        <p style={{fontSize:13,fontWeight:700,color:dk.text}}>{staffName}</p>
                        <Badge color="blue" isDark={isDark}>{pName}</Badge>
                        {isUrgent&&<Badge color="red" isDark={isDark}>Urgent</Badge>}
                        {hasTasks&&<Badge color="amber" isDark={isDark}>Tasks Pending</Badge>}
                      </div>
                      <p style={{fontSize:12,color:dk.textMuted,lineHeight:1.6,whiteSpace:'pre-wrap'}}>{h.recommendations}</p>
                      <p style={{fontSize:10,color:dk.textFaint,marginTop:6}}>{h.shifts?.shift_date?new Date(h.shifts.shift_date).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'}):''}{h.created_at?` · ${new Date(h.created_at).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}`:''}</p>
                    </div>
                  </div>
                </Glass>
              )})}
          </div>:(
            <Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}>
              <MessageSquare size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No handover notes yet</p><p style={{fontSize:12,color:dk.textFaint,marginTop:4}}>Write a handover note for the next support worker</p>
              <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700}}><Plus size={14}/> Write Handover</button>
            </Glass>
          )}
        </div>
      </div>

      {/* CREATE MODAL */}
      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="" wide>
        <div>
          <div style={{margin:'-24px -24px 0'}}><div style={{background:`linear-gradient(135deg,${c.staff},${c.staffHover},#06b6d4)`,padding:'24px',position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/><div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}><div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)'}}><ArrowRight size={20} style={{color:'white'}}/></div><div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Write Handover</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>For the next support worker</p></div></div></div></div>
          <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
            <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Handover Note *</p><textarea value={newNote.content} onChange={e=>setNewNote({...newNote,content:e.target.value})} rows={4} placeholder="What does the next worker need to know? Include mood, routine changes, things to watch for..." style={{...inputStyle,resize:'vertical',minHeight:100}} onFocus={e=>{e.currentTarget.style.borderColor=c.staff}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/></div>
            <div><p style={{fontSize:11,fontWeight:700,color:'#ef4444',marginBottom:6}}>⚠️ Concerns (if any)</p><textarea value={newNote.concerns} onChange={e=>setNewNote({...newNote,concerns:e.target.value})} rows={2} placeholder="Any concerns or risks to flag..." style={{...inputStyle,resize:'vertical',minHeight:60,borderLeft:'3px solid rgba(239,68,68,0.3)'}} onFocus={e=>{e.currentTarget.style.borderColor='#ef4444'}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/></div>
            <div><p style={{fontSize:11,fontWeight:700,color:'#f59e0b',marginBottom:6}}>📋 Pending Tasks (if any)</p><textarea value={newNote.tasks_pending} onChange={e=>setNewNote({...newNote,tasks_pending:e.target.value})} rows={2} placeholder="Tasks that still need to be completed..." style={{...inputStyle,resize:'vertical',minHeight:60,borderLeft:'3px solid rgba(245,158,11,0.3)'}} onFocus={e=>{e.currentTarget.style.borderColor='#f59e0b'}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/></div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:saving?'default':'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:saving?0.6:1}}>
                {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Saving...</>:<><Send size={16}/> Save Handover</>}
              </button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}