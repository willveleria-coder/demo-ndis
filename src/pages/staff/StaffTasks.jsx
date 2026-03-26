import { useState, useEffect, useRef } from 'react'
import { CheckSquare, Square, Plus, Trash2, Clock, CheckCircle, Target, Star, X } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

function Glass({children,glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

const DEFAULT_TASKS=[
  {task_text:'Review participant care plan',category:'Preparation',priority:'high'},
  {task_text:'Check medication schedule',category:'Preparation',priority:'high'},
  {task_text:'Read previous shift handover notes',category:'Preparation',priority:'medium'},
  {task_text:'Greet participant and check wellbeing',category:'During Shift',priority:'high'},
  {task_text:'Complete planned activities',category:'During Shift',priority:'medium'},
  {task_text:'Administer medications (if applicable)',category:'During Shift',priority:'high'},
  {task_text:'Document any concerns or incidents',category:'During Shift',priority:'high'},
  {task_text:'Support with personal care (if applicable)',category:'During Shift',priority:'medium'},
  {task_text:'Complete shift notes — all 5 sections',category:'End of Shift',priority:'high'},
  {task_text:'Write handover note for next worker',category:'End of Shift',priority:'medium'},
  {task_text:'Clock out with GPS verification',category:'End of Shift',priority:'high'},
  {task_text:'Report any maintenance issues',category:'End of Shift',priority:'low'},
]

export default function StaffTasks(){
  const{staffProfile,inProgressShift}=useStaff();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[tasks,setTasks]=useState([]);const[newTaskText,setNewTaskText]=useState('')
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  const activeShift=inProgressShift
  const pName=activeShift?.participants?`${activeShift.participants.first_name} ${activeShift.participants.last_name}`:null

  useEffect(()=>{async function load(){if(!staffProfile?.id)return;try{
    // Try to load tasks for current shift, or load all recent
    const shiftId=activeShift?.id
    let data=[]
    if(shiftId){const res=await supabase.from('staff_tasks').select('*').eq('shift_id',shiftId).order('created_at');data=res.data||[]}
    if(data.length===0){const res=await supabase.from('staff_tasks').select('*').eq('staff_id',staffProfile.id).order('created_at',{ascending:false}).limit(12);data=res.data||[]}
    if(data.length===0&&activeShift){
      // Auto-create default tasks for this shift
      const inserts=DEFAULT_TASKS.map(t=>({staff_id:staffProfile.id,shift_id:activeShift.id,task_text:t.task_text,category:t.category,priority:t.priority,done:false,org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'}))
      const{data:created}=await supabase.from('staff_tasks').insert(inserts).select();data=created||[]
    }
    if(data.length===0){data=DEFAULT_TASKS.map((t,i)=>({id:`local-${i}`,task_text:t.task_text,category:t.category,priority:t.priority,done:false}))}
    setTasks(data)}catch(err){console.error(err);setTasks(DEFAULT_TASKS.map((t,i)=>({id:`local-${i}`,...t,done:false})))}finally{setLoading(false)}}load()},[staffProfile?.id,activeShift?.id])

  const toggle=async(task)=>{const newDone=!task.done;setTasks(tasks.map(t=>t.id===task.id?{...t,done:newDone}:t));if(!String(task.id).startsWith('local')){await supabase.from('staff_tasks').update({done:newDone,completed_at:newDone?new Date().toISOString():null}).eq('id',task.id)}}
  const remove=async(task)=>{setTasks(tasks.filter(t=>t.id!==task.id));if(!String(task.id).startsWith('local')){await supabase.from('staff_tasks').delete().eq('id',task.id)}}
  const addTask=async()=>{if(!newTaskText.trim())return;const payload={staff_id:staffProfile.id,shift_id:activeShift?.id||null,task_text:newTaskText,category:'Custom',priority:'medium',done:false,org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'};try{const{data}=await supabase.from('staff_tasks').insert(payload).select().single();setTasks([...tasks,data])}catch{setTasks([...tasks,{id:`local-${Date.now()}`,...payload}])}setNewTaskText('')}
  const resetAll=async()=>{if(!activeShift)return;try{await supabase.from('staff_tasks').delete().eq('shift_id',activeShift.id);const inserts=DEFAULT_TASKS.map(t=>({staff_id:staffProfile.id,shift_id:activeShift.id,task_text:t.task_text,category:t.category,priority:t.priority,done:false,org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'}));const{data}=await supabase.from('staff_tasks').insert(inserts).select();setTasks(data||[])}catch(err){console.error(err)}}

  const doneCount=tasks.filter(t=>t.done).length;const totalCount=tasks.length;const pct=totalCount>0?Math.round((doneCount/totalCount)*100):0
  const pctColor=pct===100?'#10b981':pct>=60?'#3b82f6':pct>=30?'#f59e0b':'#ef4444'
  const categories=[...new Set(tasks.map(t=>t.category))]

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}><CheckSquare size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading tasks...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white'}}><CheckSquare size={12}/> SHIFT TASKS</span>
              {activeShift&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(16,185,129,0.3)',fontSize:10,fontWeight:700,color:'#a7f3d0'}}><span style={{width:6,height:6,borderRadius:3,background:'#34d399',animation:'pulse-dot 1.5s infinite'}}/> ON SHIFT</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Shift Checklist</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>{pName?`Current: ${pName}`:'Complete your shift tasks'}</p>
            <div style={{display:'flex',gap:8}}>
              {[{label:'Done',value:`${doneCount}/${totalCount}`,icon:CheckCircle},{label:'Progress',value:`${pct}%`,icon:Target}].map((pill,i)=>(<div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}><pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span></div>))}
            </div>
          </div>
        </div>

        <Glass isDark={isDark} style={{...stg(1),padding:'16px 20px',marginBottom:20}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:8}}>
            <p style={{fontSize:13,fontWeight:800,color:dk.text}}>{doneCount} of {totalCount} tasks complete</p>
            <span style={{fontSize:18,fontWeight:900,color:pctColor}}>{pct}%</span>
          </div>
          <div style={{height:12,borderRadius:999,background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',overflow:'hidden'}}>
            <div style={{height:'100%',borderRadius:999,background:`linear-gradient(90deg,${pctColor},${pctColor}cc)`,width:`${pct}%`,transition:'width .5s',boxShadow:`0 0 12px ${pctColor}40`}}/>
          </div>
          {pct===100&&<p style={{fontSize:12,fontWeight:700,color:'#10b981',marginTop:8,display:'flex',alignItems:'center',gap:6}}><Star size={14} fill="#10b981"/> All tasks complete!</p>}
        </Glass>

        <Glass isDark={isDark} style={{...stg(2),padding:'12px 16px',marginBottom:20,display:'flex',gap:8}}>
          <input type="text" value={newTaskText} onChange={e=>setNewTaskText(e.target.value)} onKeyDown={e=>e.key==='Enter'&&addTask()} placeholder="Add a custom task..." style={{flex:1,padding:'10px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none'}}/>
          <button onClick={addTask} style={{display:'flex',alignItems:'center',gap:6,padding:'10px 16px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:12,fontWeight:700}}><Plus size={14}/> Add</button>
          {activeShift&&<button onClick={resetAll} style={{padding:'10px 14px',borderRadius:12,border:`1px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:11,fontWeight:600,cursor:'pointer'}}>Reset</button>}
        </Glass>

        <div style={stg(3)}>
          {categories.map((cat,ci)=>{const catTasks=tasks.filter(t=>t.category===cat);if(catTasks.length===0)return null;return(
            <div key={cat} style={{marginBottom:16}}>
              <p style={{fontSize:11,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.06em',color:dk.textFaint,marginBottom:8,display:'flex',alignItems:'center',gap:6}}>
                <span style={{width:8,height:8,borderRadius:4,background:cat==='Preparation'?'#3b82f6':cat==='During Shift'?'#10b981':cat==='End of Shift'?'#f59e0b':'#8b5cf6'}}/>{cat}
                <span style={{padding:'1px 6px',borderRadius:999,fontSize:9,background:dk.subtleBg2,color:dk.textFaint}}>{catTasks.filter(t=>t.done).length}/{catTasks.length}</span>
              </p>
              <div style={{display:'flex',flexDirection:'column',gap:6}}>
                {catTasks.map(t=>(
                  <Glass key={t.id} isDark={isDark} onClick={()=>toggle(t)} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12,opacity:t.done?0.6:1,borderLeft:t.priority==='high'?`3px solid ${t.done?'#10b981':'#ef4444'}`:t.priority==='medium'?`3px solid ${t.done?'#10b981':'#f59e0b'}`:undefined}}>
                    <div style={{width:24,height:24,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',border:t.done?'none':`2px solid ${dk.divider}`,background:t.done?'linear-gradient(135deg,#10b981,#059669)':'transparent',flexShrink:0}}>
                      {t.done&&<CheckSquare size={14} style={{color:'white'}}/>}
                    </div>
                    <p style={{flex:1,fontSize:13,fontWeight:t.done?500:600,color:t.done?dk.textFaint:dk.text,textDecoration:t.done?'line-through':'none'}}>{t.task_text}</p>
                    {t.priority==='high'&&!t.done&&<Badge color="red" isDark={isDark}>Important</Badge>}
                    {t.category==='Custom'&&<button onClick={e=>{e.stopPropagation();remove(t)}} style={{width:24,height:24,borderRadius:6,border:'none',background:'transparent',color:dk.textFaint,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><Trash2 size={12}/></button>}
                  </Glass>
                ))}
              </div>
            </div>
          )})}
        </div>
      </div>
    </div>
  )
}