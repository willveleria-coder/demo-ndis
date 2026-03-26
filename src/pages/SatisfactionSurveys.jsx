import { useState, useEffect, useRef } from 'react'
import { SmilePlus, Star, TrendingUp, Users, BarChart3, Loader2, MessageSquare, ThumbsUp } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function Glass({children,glow,style={},hover=false,dark=false,...p}){return<div style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(num*(1-Math.pow(1-p,3)));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value]);const isInt=Number.isInteger(value);return<>{isInt?Math.round(display):display.toFixed(1)}{suffix}</>}
function CT({active,payload,label,isDark}){if(!active||!payload?.length)return null;return<div style={{background:isDark?'rgba(30,41,59,0.95)':'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',border:`1px solid ${isDark?'rgba(51,65,85,0.5)':'rgba(0,0,0,0.08)'}`,borderRadius:12,padding:'10px 14px'}}>{label&&<p style={{fontSize:11,fontWeight:700,color:isDark?'#e2e8f0':'#1f2937',marginBottom:4}}>{label}</p>}{payload.map((p,i)=><p key={i} style={{fontSize:11,color:isDark?'#94a3b8':'#6b7280'}}>{p.name}: <span style={{fontWeight:700}}>{p.value}</span></p>)}</div>}

export default function SatisfactionSurveys(){
  const{user}=useAuth();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true);const[feedback,setFeedback]=useState([])
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  useEffect(()=>{async function load(){try{const{data}=await supabase.from('feedback').select('*').order('created_at',{ascending:false});setFeedback(data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[])

  const compliments=feedback.filter(f=>f.type==='compliment').length;const complaints=feedback.filter(f=>f.type==='complaint').length;const suggestions=feedback.filter(f=>f.type==='suggestion').length;const general=feedback.filter(f=>f.type==='feedback').length
  const avgSatisfaction=4.2 // demo value
  const typeData=[{name:'Compliments',value:compliments,color:'#10b981'},{name:'Complaints',value:complaints,color:'#ef4444'},{name:'Suggestions',value:suggestions,color:'#3b82f6'},{name:'Feedback',value:general,color:'#f59e0b'}].filter(d=>d.value>0)
  const faces=['😟','😕','😊','😄','🤩'];const faceLabels=['Poor','Fair','Good','Great','Amazing'];const faceColors=['#ef4444','#f59e0b','#3b82f6','#10b981','#8b5cf6']
  const satisfactionDist=[{name:'Poor',value:1,color:'#ef4444'},{name:'Fair',value:2,color:'#f59e0b'},{name:'Good',value:8,color:'#3b82f6'},{name:'Great',value:15,color:'#10b981'},{name:'Amazing',value:6,color:'#8b5cf6'}]

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><SmilePlus size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading surveys...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.primary} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.primary} 0%,${c.adminHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white',marginBottom:14}}><SmilePlus size={12}/> SATISFACTION</span>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Satisfaction Surveys</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Monitor participant and family satisfaction</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{label:'Avg Score',value:`${avgSatisfaction}/5`,icon:Star},{label:'Responses',value:feedback.length,icon:MessageSquare},{label:'Compliments',value:compliments,icon:ThumbsUp}].map((pill,i)=>(<div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}><pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span></div>))}
            </div>
          </div>
        </div>

        {/* Big satisfaction score */}
        <Glass dark={isDark} style={{...stg(1),padding:24,textAlign:'center',marginBottom:24}}>
          <p style={{fontSize:48}}>{faces[Math.round(avgSatisfaction)-1]}</p>
          <p style={{fontSize:32,fontWeight:900,color:faceColors[Math.round(avgSatisfaction)-1],marginTop:8}}><AnimNum value={avgSatisfaction} suffix="/5"/></p>
          <p style={{fontSize:13,fontWeight:700,color:dk.textMuted,marginTop:4}}>Overall Satisfaction — {faceLabels[Math.round(avgSatisfaction)-1]}</p>
          <div style={{display:'flex',justifyContent:'center',gap:16,marginTop:16}}>
            {faces.map((f,i)=>(<div key={i} style={{textAlign:'center'}}><span style={{fontSize:24,filter:i===Math.round(avgSatisfaction)-1?'none':'grayscale(0.6) opacity(0.5)'}}>{f}</span><p style={{fontSize:9,color:dk.textFaint,marginTop:2}}>{faceLabels[i]}</p></div>))}
          </div>
        </Glass>

        <div style={{...stg(2),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:24}}>
          {typeData.length>0&&<Glass dark={isDark} style={{padding:20}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><BarChart3 size={13} style={{color:'white'}}/></div><p style={{fontSize:14,fontWeight:800,color:dk.text}}>Feedback Types</p></div><div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={typeData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">{typeData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CT isDark={isDark}/>}/></PieChart></ResponsiveContainer></div><div style={{display:'flex',justifyContent:'center',gap:12,marginTop:8,flexWrap:'wrap'}}>{typeData.map((d,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:4,background:d.color}}/><span style={{fontSize:10,color:dk.textMuted}}>{d.name}: {d.value}</span></div>)}</div></Glass>}
          <Glass dark={isDark} style={{padding:20}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#10b981,#059669)'}}><TrendingUp size={13} style={{color:'white'}}/></div><p style={{fontSize:14,fontWeight:800,color:dk.text}}>Rating Distribution</p></div><div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><BarChart data={satisfactionDist}><XAxis dataKey="name" tick={{fontSize:10,fill:dk.textFaint}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:dk.textFaint}} axisLine={false} tickLine={false}/><Tooltip content={<CT isDark={isDark}/>}/><Bar dataKey="value" name="Responses" radius={[6,6,0,0]}>{satisfactionDist.map((d,i)=><Cell key={i} fill={d.color}/>)}</Bar></BarChart></ResponsiveContainer></div></Glass>
        </div>

        {/* Recent feedback */}
        <div style={stg(3)}>
          <p style={{fontSize:16,fontWeight:900,color:dk.text,marginBottom:14}}>Recent Feedback</p>
          {feedback.length>0?<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {feedback.slice(0,10).map(f=>{const typeCol=f.type==='compliment'?'#10b981':f.type==='complaint'?'#ef4444':f.type==='suggestion'?'#3b82f6':'#f59e0b';return(
              <Glass key={f.id} dark={isDark} hover style={{padding:16,borderLeft:`4px solid ${typeCol}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:36,height:36,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:`${typeCol}15`,flexShrink:0}}><MessageSquare size={16} style={{color:typeCol}}/></div>
                  <div style={{flex:1}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,marginBottom:4}}><p style={{fontSize:13,fontWeight:700,color:dk.text}}>{f.from_name||'Anonymous'}</p><span style={{padding:'2px 8px',borderRadius:999,fontSize:9,fontWeight:700,background:`${typeCol}15`,color:typeCol}}>{(f.type||'feedback').replace(/\b\w/g,ch=>ch.toUpperCase())}</span></div>
                    <p style={{fontSize:12,color:dk.textMuted,lineHeight:1.6}}>{f.description}</p>
                    <p style={{fontSize:10,color:dk.textFaint,marginTop:4}}>{f.created_at?new Date(f.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):''}</p>
                  </div>
                </div>
              </Glass>
            )})}
          </div>:(<Glass dark={isDark} style={{padding:'50px 24px',textAlign:'center'}}><SmilePlus size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No feedback yet</p></Glass>)}
        </div>
      </div>
    </div>
  )
}