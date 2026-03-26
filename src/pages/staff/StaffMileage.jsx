import { useState, useEffect, useRef } from 'react'
import { Car, Plus, Search, X, MapPin, Clock, DollarSign, Loader2, Calendar } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

function Glass({children,glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

const ATO_RATE=0.88

export default function StaffMileage(){
  const{staffProfile}=useStaff();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[trips,setTrips]=useState([])
  const[showAdd,setShowAdd]=useState(false);const[saving,setSaving]=useState(false)
  const[newTrip,setNewTrip]=useState({date:new Date().toISOString().split('T')[0],from:'',to:'',km:'',purpose:''})
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none'}

  useEffect(()=>{async function load(){if(!staffProfile?.id)return;try{const{data}=await supabase.from('staff_mileage').select('*').eq('staff_id',staffProfile.id).order('trip_date',{ascending:false});setTrips(data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[staffProfile?.id])

  const addTrip=async()=>{if(!newTrip.km||!newTrip.from||!newTrip.to){alert('Fill in from, to, and km');return};setSaving(true);try{const km=parseFloat(newTrip.km);const{data,error}=await supabase.from('staff_mileage').insert({staff_id:staffProfile.id,trip_date:newTrip.date,from_location:newTrip.from,to_location:newTrip.to,km,purpose:newTrip.purpose||null,reimbursement:km*ATO_RATE,status:'pending',org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'}).select().single();if(error)throw error;setTrips([data,...trips]);setShowAdd(false);setNewTrip({date:new Date().toISOString().split('T')[0],from:'',to:'',km:'',purpose:''})}catch(err){alert('Failed: '+err.message)}finally{setSaving(false)}}

  const totalKm=trips.reduce((a,t)=>a+(t.km||0),0);const totalReimburse=trips.reduce((a,t)=>a+(t.reimbursement||0),0);const thisMonth=trips.filter(t=>{const d=new Date(t.trip_date);return d.getMonth()===new Date().getMonth()&&d.getFullYear()===new Date().getFullYear()});const monthKm=thisMonth.reduce((a,t)=>a+(t.km||0),0)

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}><Car size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading mileage...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#06b6d4" size={200} bottom="10%" left="-40px" delay={2}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white',marginBottom:14}}><Car size={12}/> MILEAGE LOG</span>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Travel & Mileage</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Log km for reimbursement at ATO rate (${ATO_RATE}/km)</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[{label:'Total Km',value:`${Math.round(totalKm)}km`,icon:Car},{label:'This Month',value:`${Math.round(monthKm)}km`,icon:Calendar},{label:'Reimbursement',value:`$${totalReimburse.toFixed(2)}`,icon:DollarSign},{label:'Trips',value:trips.length,icon:Car}].map((pill,i)=>(<div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}><pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span></div>))}
            </div>
            <button onClick={()=>setShowAdd(true)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}><Plus size={16}/> Log Trip</button>
          </div>
        </div>

        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[{icon:Car,label:'Total Distance',value:Math.round(totalKm),suffix:'km',gradient:`linear-gradient(135deg,${c.staff},${c.staffHover})`,glow:`${c.staff}40`},{icon:Calendar,label:'This Month',value:Math.round(monthKm),suffix:'km',gradient:'linear-gradient(135deg,#3b82f6,#2563eb)',glow:'rgba(59,130,246,0.3)'},{icon:DollarSign,label:'Reimbursement',value:Math.round(totalReimburse),gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'},{icon:Car,label:'Total Trips',value:trips.length,gradient:'linear-gradient(135deg,#f59e0b,#d97706)',glow:'rgba(245,158,11,0.3)'}].map((stat,i)=>(
            <Glass key={i} isDark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}><div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient,marginBottom:10}}><stat.icon size={18} style={{color:'white'}}/></div><p style={{fontSize:22,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value}/>{stat.suffix||''}</p><p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p></Glass>
          ))}
        </div>

        <div style={stg(2)}>
          {trips.length>0?<div style={{display:'flex',flexDirection:'column',gap:8}}>
            {trips.map(t=>(<Glass key={t.id} isDark={isDark} hover style={{padding:16,display:'flex',alignItems:'center',gap:14}}>
              <div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,flexShrink:0}}><Car size={18} style={{color:'white'}}/></div>
              <div style={{flex:1,minWidth:0,overflow:'hidden'}}>
                <p style={{fontSize:13,fontWeight:700,color:dk.text,overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap'}}>{t.from_location} → {t.to_location}</p>
                <div style={{display:'flex',alignItems:'center',gap:4,marginTop:4,flexWrap:'wrap'}}><Badge color="blue" isDark={isDark}>{t.km}km</Badge><Badge color={t.status==='approved'?'green':'amber'} isDark={isDark}>{t.status}</Badge></div>
                <p style={{fontSize:11,color:dk.textMuted,marginTop:4}}>{t.purpose||''}</p>
                <p style={{fontSize:10,color:dk.textFaint,marginTop:2}}>{new Date(t.trip_date).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short'})}</p>
              </div>
              <div style={{textAlign:'right',flexShrink:0,minWidth:60}}><p style={{fontSize:14,fontWeight:800,color:'#10b981'}}>${(t.reimbursement||0).toFixed(2)}</p><p style={{fontSize:9,color:dk.textFaint}}>claim</p></div>
            </Glass>))}
          </div>:(<Glass isDark={isDark} style={{padding:'50px 24px',textAlign:'center'}}><Car size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No trips logged</p><button onClick={()=>setShowAdd(true)} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:700}}><Plus size={14}/> Log Trip</button></Glass>)}
        </div>
      </div>

      {showAdd&&<div style={{position:'fixed',inset:0,zIndex:9999,background:'rgba(0,0,0,0.5)',backdropFilter:'blur(4px)',WebkitBackdropFilter:'blur(4px)',display:'flex',alignItems:'flex-end',justifyContent:'center'}} onClick={()=>setShowAdd(false)}><div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:480,borderRadius:'20px 20px 0 0',overflow:'hidden',background:isDark?'#1e293b':'white',boxShadow:'0 -8px 40px rgba(0,0,0,0.2)',maxHeight:'90dvh',overflowY:'auto'}}>
        <div style={{background:`linear-gradient(135deg,${c.staff},${c.staffHover},#06b6d4)`,padding:24}}><div style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)'}}><Car size={20} style={{color:'white'}}/></div><div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>Log Trip</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)'}}>ATO rate: ${ATO_RATE}/km</p></div></div></div>
        <div style={{padding:20,display:'flex',flexDirection:'column',gap:12}}>
          <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}><div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Date</p><input type="date" value={newTrip.date} onChange={e=>setNewTrip({...newTrip,date:e.target.value})} style={inputStyle}/></div><div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Distance (km) *</p><input type="number" value={newTrip.km} onChange={e=>setNewTrip({...newTrip,km:e.target.value})} placeholder="0" style={inputStyle}/></div></div>
          <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>From *</p><input type="text" value={newTrip.from} onChange={e=>setNewTrip({...newTrip,from:e.target.value})} placeholder="Start location" style={inputStyle}/></div>
          <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>To *</p><input type="text" value={newTrip.to} onChange={e=>setNewTrip({...newTrip,to:e.target.value})} placeholder="Destination" style={inputStyle}/></div>
          <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Purpose</p><input type="text" value={newTrip.purpose} onChange={e=>setNewTrip({...newTrip,purpose:e.target.value})} placeholder="e.g. Transport to appointment" style={inputStyle}/></div>
          {newTrip.km&&<div style={{padding:12,borderRadius:12,background:isDark?'rgba(16,185,129,0.1)':'#ecfdf5',border:'1px solid rgba(16,185,129,0.2)',textAlign:'center'}}><p style={{fontSize:14,fontWeight:800,color:'#10b981'}}>Reimbursement: ${(parseFloat(newTrip.km||0)*ATO_RATE).toFixed(2)}</p></div>}
          <div style={{display:'flex',gap:10}}><button onClick={()=>setShowAdd(false)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button><button onClick={addTrip} disabled={saving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:saving?'default':'pointer',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`,color:'white',fontSize:13,fontWeight:800,opacity:saving?0.6:1}}>{saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Saving...</>:<><Car size={16}/> Log Trip</>}</button></div>
        </div>
      </div></div>}
    </div>
  )
}