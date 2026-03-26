import { useState, useEffect, useRef } from 'react'
import { DollarSign, TrendingUp, TrendingDown, AlertTriangle, Users, Target, Clock, PieChart as PieIcon, BarChart3, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts'

function Glass({children,glow,style={},hover=false,dark=false,...p}){return<div style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,prefix='',suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(num*(1-Math.pow(1-p,3)));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value]);return<>{prefix}{Math.round(display).toLocaleString()}{suffix}</>}
function CT({active,payload,label,isDark}){if(!active||!payload?.length)return null;return<div style={{background:isDark?'rgba(30,41,59,0.95)':'rgba(255,255,255,0.95)',backdropFilter:'blur(12px)',border:`1px solid ${isDark?'rgba(51,65,85,0.5)':'rgba(0,0,0,0.08)'}`,borderRadius:12,padding:'10px 14px'}}>{label&&<p style={{fontSize:11,fontWeight:700,color:isDark?'#e2e8f0':'#1f2937',marginBottom:4}}>{label}</p>}{payload.map((p,i)=><p key={i} style={{fontSize:11,color:isDark?'#94a3b8':'#6b7280'}}><span style={{display:'inline-block',width:8,height:8,borderRadius:4,background:p.color||'#3b82f6',marginRight:6}}/>{p.name}: <span style={{fontWeight:700,color:isDark?'#e2e8f0':'#1f2937'}}>${typeof p.value==='number'?p.value.toLocaleString():p.value}</span></p>)}</div>}
const COLORS=['#7c3aed','#3b82f6','#10b981','#f59e0b','#ef4444','#ec4899','#06b6d4','#8b5cf6','#f97316','#14b8a6','#6366f1','#84cc16']

export default function BudgetUtilisation(){
  const{user}=useAuth();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[participants,setParticipants]=useState([]);const[claims,setClaims]=useState([]);const[agreements,setAgreements]=useState([])
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  useEffect(()=>{async function load(){try{const[pRes,cRes,aRes]=await Promise.all([supabase.from('participants').select('id,first_name,last_name,plan_budget,plan_start_date,plan_end_date').eq('status','active'),supabase.from('ndis_claims').select('participant_id,total_amount,status'),supabase.from('service_agreements').select('participant_id,total_budget,status').eq('status','active')]);setParticipants(pRes.data||[]);setClaims(cRes.data||[]);setAgreements(aRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[])

  const budgetData=participants.map(p=>{const pClaims=claims.filter(cl=>cl.participant_id===p.id);const spent=pClaims.filter(cl=>cl.status==='paid').reduce((a,cl)=>a+(cl.total_amount||0),0);const pending=pClaims.filter(cl=>cl.status==='submitted').reduce((a,cl)=>a+(cl.total_amount||0),0);const budget=p.plan_budget||0;const remaining=budget-spent-pending;const pct=budget>0?Math.round((spent/budget)*100):0
    const planDays=p.plan_start_date&&p.plan_end_date?Math.ceil((new Date(p.plan_end_date)-new Date(p.plan_start_date))/864e5):365;const elapsed=p.plan_start_date?Math.ceil((new Date()-new Date(p.plan_start_date))/864e5):0;const expectedPct=planDays>0?Math.min(100,Math.round((elapsed/planDays)*100)):0;const burnRate=elapsed>0?(spent/elapsed)*30:0
    return{...p,name:`${p.first_name} ${p.last_name}`,budget,spent,pending,remaining,pct,expectedPct,burnRate,isOverspent:remaining<0,isAtRisk:pct>expectedPct+15}
  }).sort((a,b)=>b.pct-a.pct)

  const totalBudget=budgetData.reduce((a,p)=>a+p.budget,0);const totalSpent=budgetData.reduce((a,p)=>a+p.spent,0);const totalPending=budgetData.reduce((a,p)=>a+p.pending,0);const totalRemaining=totalBudget-totalSpent-totalPending;const overallPct=totalBudget>0?Math.round((totalSpent/totalBudget)*100):0;const atRiskCount=budgetData.filter(p=>p.isAtRisk).length
  const chartData=budgetData.slice(0,10).map(p=>({name:p.first_name,spent:Math.round(p.spent),remaining:Math.max(0,Math.round(p.remaining)),budget:Math.round(p.budget)}))
  const categoryData=[{name:'Spent',value:Math.round(totalSpent),color:'#7c3aed'},{name:'Pending',value:Math.round(totalPending),color:'#f59e0b'},{name:'Remaining',value:Math.max(0,Math.round(totalRemaining)),color:'#10b981'}].filter(d=>d.value>0)

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><DollarSign size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading budgets...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}`}</style>
      <Orb color={c.primary} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#f59e0b" size={160} top="40%" right="15%" delay={4}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.primary} 0%,${c.adminHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white'}}><DollarSign size={12}/> NDIS BUDGETS</span>{atRiskCount>0&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(239,68,68,0.3)',fontSize:10,fontWeight:700,color:'#fca5a5'}}><AlertTriangle size={10}/> {atRiskCount} AT RISK</span>}</div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Budget Utilisation</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Track NDIS plan funding across all participants</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap'}}>
              {[{label:'Total Budget',value:`$${Math.round(totalBudget/1000)}k`,icon:DollarSign},{label:'Spent',value:`$${Math.round(totalSpent/1000)}k`,icon:TrendingDown},{label:'Remaining',value:`$${Math.round(totalRemaining/1000)}k`,icon:TrendingUp},{label:'Utilisation',value:`${overallPct}%`,icon:Target}].map((pill,i)=>(
                <div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}><pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span></div>
              ))}
            </div>
          </div>
        </div>

        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[{icon:DollarSign,label:'Total Budget',value:totalBudget,prefix:'$',gradient:`linear-gradient(135deg,${c.primary},${c.adminHover})`,glow:`${c.primary}40`},{icon:TrendingDown,label:'Total Spent',value:totalSpent,prefix:'$',gradient:'linear-gradient(135deg,#ef4444,#dc2626)',glow:'rgba(239,68,68,0.3)'},{icon:Clock,label:'Pending',value:totalPending,prefix:'$',gradient:'linear-gradient(135deg,#f59e0b,#d97706)',glow:'rgba(245,158,11,0.3)'},{icon:TrendingUp,label:'Remaining',value:Math.max(0,totalRemaining),prefix:'$',gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'},{icon:Target,label:'Utilisation',value:overallPct,suffix:'%',gradient:'linear-gradient(135deg,#3b82f6,#2563eb)',glow:'rgba(59,130,246,0.3)'},{icon:AlertTriangle,label:'At Risk',value:atRiskCount,gradient:'linear-gradient(135deg,#f97316,#ea580c)',glow:'rgba(249,115,22,0.3)',alert:atRiskCount>0}].map((stat,i)=>(
            <Glass key={i} dark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}><div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient}}><stat.icon size={18} style={{color:'white'}}/></div>{stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#ef4444',animation:'pulse-dot 1.5s infinite'}}/>}</div><p style={{fontSize:22,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value} prefix={stat.prefix||''} suffix={stat.suffix||''}/></p><p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p></Glass>
          ))}
        </div>

        <div style={{...stg(2),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(280px,1fr))',gap:16,marginBottom:24}}>
          {categoryData.length>0&&<Glass dark={isDark} style={{padding:20}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><PieIcon size={13} style={{color:'white'}}/></div><p style={{fontSize:14,fontWeight:800,color:dk.text}}>Budget Breakdown</p></div><div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><PieChart><Pie data={categoryData} cx="50%" cy="50%" innerRadius={50} outerRadius={75} paddingAngle={4} dataKey="value" stroke="none">{categoryData.map((d,i)=><Cell key={i} fill={d.color}/>)}</Pie><Tooltip content={<CT isDark={isDark}/>}/></PieChart></ResponsiveContainer></div><div style={{display:'flex',justifyContent:'center',gap:14,marginTop:8}}>{categoryData.map((d,i)=><div key={i} style={{display:'flex',alignItems:'center',gap:4}}><div style={{width:8,height:8,borderRadius:4,background:d.color}}/><span style={{fontSize:10,color:dk.textMuted}}>{d.name}: ${d.value.toLocaleString()}</span></div>)}</div></Glass>}
          {chartData.length>0&&<Glass dark={isDark} style={{padding:20}}><div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}><div style={{width:28,height:28,borderRadius:8,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#10b981,#059669)'}}><BarChart3 size={13} style={{color:'white'}}/></div><p style={{fontSize:14,fontWeight:800,color:dk.text}}>Spend by Participant</p></div><div style={{height:180}}><ResponsiveContainer width="100%" height="100%"><BarChart data={chartData}><XAxis dataKey="name" tick={{fontSize:10,fill:dk.textFaint}} axisLine={false} tickLine={false}/><YAxis tick={{fontSize:10,fill:dk.textFaint}} axisLine={false} tickLine={false}/><Tooltip content={<CT isDark={isDark}/>}/><Bar dataKey="spent" name="Spent" stackId="a" radius={[0,0,0,0]}>{chartData.map((_,i)=><Cell key={i} fill={COLORS[i%COLORS.length]}/>)}</Bar></BarChart></ResponsiveContainer></div></Glass>}
        </div>

        <div style={stg(3)}>
          <p style={{fontSize:16,fontWeight:900,color:dk.text,marginBottom:14}}>Per-Participant Budget Tracking</p>
          <div style={{display:'flex',flexDirection:'column',gap:10}}>
            {budgetData.map((p,i)=>{const pctColor=p.pct>=90?'#ef4444':p.pct>=70?'#f59e0b':p.pct>=40?'#3b82f6':'#10b981';return(
              <Glass key={p.id} dark={isDark} hover style={{padding:'16px 20px'}}>
                <div style={{display:'flex',alignItems:'center',gap:14,marginBottom:10}}>
                  <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${COLORS[i%COLORS.length]},${COLORS[i%COLORS.length]}cc)`,fontSize:12,fontWeight:800,color:'white',flexShrink:0}}>{p.first_name[0]}{p.last_name[0]}</div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:8}}><p style={{fontSize:14,fontWeight:700,color:dk.text}}>{p.name}</p>{p.isAtRisk&&<span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:999,fontSize:9,fontWeight:700,background:'rgba(239,68,68,0.1)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.2)'}}><AlertTriangle size={9}/> Over pace</span>}{p.isOverspent&&<span style={{display:'inline-flex',alignItems:'center',gap:3,padding:'2px 8px',borderRadius:999,fontSize:9,fontWeight:700,background:'rgba(239,68,68,0.15)',color:'#ef4444',border:'1px solid rgba(239,68,68,0.3)'}}>Overspent</span>}</div>
                    <p style={{fontSize:11,color:dk.textMuted,marginTop:2}}>Budget: ${p.budget.toLocaleString()} · Spent: ${p.spent.toLocaleString()} · Remaining: ${Math.max(0,p.remaining).toLocaleString()}</p>
                  </div>
                  <div style={{textAlign:'right',flexShrink:0}}><p style={{fontSize:22,fontWeight:900,color:pctColor}}>{p.pct}%</p><p style={{fontSize:9,color:dk.textFaint}}>utilised</p></div>
                </div>
                <div style={{display:'flex',alignItems:'center',gap:10}}>
                  <div style={{flex:1,height:10,borderRadius:999,background:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',overflow:'hidden',position:'relative'}}>
                    <div style={{height:'100%',borderRadius:999,background:`linear-gradient(90deg,${pctColor},${pctColor}cc)`,width:`${Math.min(p.pct,100)}%`,transition:'width 1s',boxShadow:`0 0 8px ${pctColor}40`}}/>
                    <div style={{position:'absolute',top:0,height:'100%',width:2,background:isDark?'rgba(255,255,255,0.3)':'rgba(0,0,0,0.2)',left:`${Math.min(p.expectedPct,100)}%`}} title={`Expected: ${p.expectedPct}%`}/>
                  </div>
                  <span style={{fontSize:10,color:dk.textFaint,flexShrink:0}}>exp: {p.expectedPct}%</span>
                </div>
                {p.burnRate>0&&<p style={{fontSize:10,color:dk.textFaint,marginTop:6}}>Burn rate: ${Math.round(p.burnRate).toLocaleString()}/month{p.isAtRisk?' — spending faster than expected':''}</p>}
              </Glass>
            )})}
          </div>
        </div>
      </div>
    </div>
  )
}