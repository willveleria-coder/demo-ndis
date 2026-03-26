import { useState, useEffect, useRef } from 'react'
import { Shield, MapPin, CheckCircle, AlertTriangle, Radio } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { useBrandColors } from '../../hooks/useBrandColors'
import { useTheme } from '../../context/ThemeContext'
import { supabase } from '../../lib/supabase'

function Glass({children,glow,style={},hover=false,isDark=false,onClick,...p}){const base=isDark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)';const border=isDark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)';return<div onClick={onClick} style={{background:base,backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${border}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}

export default function StaffSafety(){
  const{staffProfile,inProgressShift}=useStaff();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[checkedIn,setCheckedIn]=useState(false);const[checkIns,setCheckIns]=useState([]);const[emergency,setEmergency]=useState(false);const[location,setLocation]=useState(null)
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})

  useEffect(()=>{async function load(){if(!staffProfile?.id)return;try{const{data}=await supabase.from('staff_safety_checkins').select('*').eq('staff_id',staffProfile.id).order('created_at',{ascending:false}).limit(20);setCheckIns(data||[]);const last=data?.[0];if(last&&last.check_type==='check_in'){setCheckedIn(true);if(last.latitude)setLocation({lat:last.latitude,lng:last.longitude})}}catch(err){console.error(err)}finally{setLoading(false)}}load()},[staffProfile?.id])

  const saveCheckIn=async(type,lat,lng,notes)=>{try{const{data}=await supabase.from('staff_safety_checkins').insert({staff_id:staffProfile.id,check_type:type,latitude:lat||null,longitude:lng||null,notes:notes||null,org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'}).select().single();setCheckIns([data,...checkIns]);return data}catch(err){console.error(err);return null}}

  const handleCheckIn=()=>{if(navigator.geolocation){navigator.geolocation.getCurrentPosition(async pos=>{await saveCheckIn('check_in',pos.coords.latitude,pos.coords.longitude,'Checked in with GPS');setCheckedIn(true);setLocation({lat:pos.coords.latitude,lng:pos.coords.longitude})},async()=>{await saveCheckIn('check_in',null,null,'Checked in without GPS');setCheckedIn(true)})}else{saveCheckIn('check_in',null,null,'Checked in');setCheckedIn(true)}}
  const handleCheckOut=async()=>{await saveCheckIn('check_out',location?.lat,location?.lng,'Checked out');setCheckedIn(false)}
  const handleSOS=async()=>{setEmergency(true);if(navigator.geolocation){navigator.geolocation.getCurrentPosition(async pos=>{await saveCheckIn('sos',pos.coords.latitude,pos.coords.longitude,'EMERGENCY SOS ALERT')},async()=>{await saveCheckIn('sos',location?.lat,location?.lng,'EMERGENCY SOS ALERT')})}else{await saveCheckIn('sos',location?.lat,location?.lng,'EMERGENCY SOS ALERT')}setTimeout(()=>setEmergency(false),5000)}

  const todayCheckIns=checkIns.filter(ci=>{const d=new Date(ci.created_at);return d.toDateString()===new Date().toDateString()})

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.staff},${c.staffHover})`}}><Shield size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading safety...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes pulse-ring{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2);opacity:0}}`}</style>
      <Orb color={c.staff} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#ef4444" size={160} top="40%" right="15%" delay={4}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.staff} 0%,${c.staffHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <div style={{display:'flex',alignItems:'center',gap:8,marginBottom:14}}>
              <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white'}}><Shield size={12}/> LONE WORKER</span>
              {checkedIn&&<span style={{display:'inline-flex',alignItems:'center',gap:4,padding:'4px 10px',borderRadius:999,background:'rgba(16,185,129,0.3)',fontSize:10,fontWeight:700,color:'#a7f3d0'}}><span style={{width:6,height:6,borderRadius:3,background:'#34d399',animation:'pulse-dot 1.5s infinite'}}/> CHECKED IN</span>}
            </div>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Lone Worker Safety</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)'}}>Check in, check out, and alert your team when working alone</p>
          </div>
        </div>

        <div style={{...stg(1),display:'grid',gridTemplateColumns:'1fr 1fr',gap:14,marginBottom:24}}>
          <Glass isDark={isDark} hover onClick={checkedIn?handleCheckOut:handleCheckIn} glow={checkedIn?'rgba(16,185,129,0.3)':`${c.staff}30`} style={{padding:'28px 20px',textAlign:'center'}}>
            <div style={{width:56,height:56,borderRadius:18,display:'flex',alignItems:'center',justifyContent:'center',background:checkedIn?'linear-gradient(135deg,#10b981,#059669)':`linear-gradient(135deg,${c.staff},${c.staffHover})`,margin:'0 auto 12px',boxShadow:checkedIn?'0 6px 20px -4px rgba(16,185,129,0.5)':`0 6px 20px -4px ${c.staff}50`}}>{checkedIn?<CheckCircle size={24} style={{color:'white'}}/>:<Radio size={24} style={{color:'white'}}/>}</div>
            <p style={{fontSize:16,fontWeight:900,color:dk.text}}>{checkedIn?'Check Out':'Check In'}</p>
            <p style={{fontSize:11,color:dk.textFaint,marginTop:4}}>{checkedIn?'End your lone worker session':'Start with GPS location'}</p>
          </Glass>
          <Glass isDark={isDark} hover onClick={handleSOS} glow="rgba(239,68,68,0.4)" style={{padding:'28px 20px',textAlign:'center',position:'relative',overflow:'hidden'}}>
            {/* Pulsing rings */}
            <div style={{position:'absolute',inset:0,display:'flex',alignItems:'center',justifyContent:'center',pointerEvents:'none'}}>
              <div style={{width:120,height:120,borderRadius:'50%',border:'2px solid rgba(239,68,68,0.15)',animation:'pulse-ring 2s ease-out infinite'}}/>
              <div style={{position:'absolute',width:90,height:90,borderRadius:'50%',border:'2px solid rgba(239,68,68,0.2)',animation:'pulse-ring 2s ease-out 0.5s infinite'}}/>
              <div style={{position:'absolute',width:60,height:60,borderRadius:'50%',border:'2px solid rgba(239,68,68,0.25)',animation:'pulse-ring 2s ease-out 1s infinite'}}/>
            </div>
            {emergency&&<div style={{position:'absolute',inset:0,borderRadius:'1.25rem',background:'rgba(239,68,68,0.08)',animation:'pulse-dot 0.5s ease-in-out infinite'}}/>}
            <div style={{position:'relative',zIndex:2}}>
              <div style={{width:72,height:72,borderRadius:22,display:'flex',alignItems:'center',justifyContent:'center',background:emergency?'linear-gradient(135deg,#ef4444,#b91c1c)':'linear-gradient(135deg,#ef4444,#dc2626)',margin:'0 auto 14px',boxShadow:emergency?'0 0 40px -4px rgba(239,68,68,0.7), 0 0 80px -8px rgba(239,68,68,0.4)':'0 8px 28px -4px rgba(239,68,68,0.5)',transition:'all 0.3s',transform:emergency?'scale(1.1)':'scale(1)',border:'3px solid rgba(255,255,255,0.2)'}}>
                <AlertTriangle size={30} style={{color:'white',filter:'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'}}/>
              </div>
              <p style={{fontSize:18,fontWeight:900,color:emergency?'#ef4444':dk.text,letterSpacing:emergency?'0.1em':'0'}}>{emergency?'🚨 SOS SENT!':'SOS Alert'}</p>
              <p style={{fontSize:11,color:emergency?'#f87171':dk.textFaint,marginTop:6,fontWeight:emergency?700:400}}>{emergency?'Help is on the way — stay safe':'Tap to send emergency alert to your team'}</p>
            </div>
          </Glass>
        </div>

        {checkedIn&&location&&(
          <Glass isDark={isDark} style={{...stg(2),padding:'16px 20px',marginBottom:20,display:'flex',alignItems:'center',gap:12}}>
            <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:'linear-gradient(135deg,#10b981,#059669)',flexShrink:0}}><MapPin size={18} style={{color:'white'}}/></div>
            <div><p style={{fontSize:13,fontWeight:700,color:dk.text}}>GPS Location Recorded</p><p style={{fontSize:11,color:dk.textMuted}}>Lat: {location.lat.toFixed(4)} · Lng: {location.lng.toFixed(4)}</p></div>
          </Glass>
        )}

        <Glass isDark={isDark} style={{...stg(3),padding:20,marginBottom:20}}>
          <p style={{fontSize:14,fontWeight:800,color:dk.text,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><Shield size={16} style={{color:c.staff}}/> Lone Worker Safety Tips</p>
          <div style={{display:'flex',flexDirection:'column',gap:8}}>
            {['Always check in at the start of a lone shift','Keep your phone charged and accessible','Share your location with your coordinator','Check out when you leave — triggers alert if missed','Use SOS button in any emergency — alerts entire team'].map((tip,i)=>(
              <div key={i} style={{display:'flex',alignItems:'flex-start',gap:10,padding:'8px 12px',borderRadius:10,background:dk.subtleBg}}>
                <CheckCircle size={14} style={{color:'#10b981',flexShrink:0,marginTop:2}}/><p style={{fontSize:12,color:dk.textMuted,lineHeight:1.5}}>{tip}</p>
              </div>
            ))}
          </div>
        </Glass>

        {todayCheckIns.length>0&&(
          <div style={stg(4)}>
            <p style={{fontSize:14,fontWeight:800,color:dk.text,marginBottom:10}}>Today's Activity</p>
            <div style={{display:'flex',flexDirection:'column',gap:6}}>
              {todayCheckIns.map(ci=>(
                <Glass key={ci.id} isDark={isDark} style={{padding:'12px 16px',display:'flex',alignItems:'center',gap:12}}>
                  <div style={{width:32,height:32,borderRadius:10,display:'flex',alignItems:'center',justifyContent:'center',background:ci.check_type==='sos'?'linear-gradient(135deg,#ef4444,#dc2626)':ci.check_type==='check_in'?'linear-gradient(135deg,#10b981,#059669)':'linear-gradient(135deg,#64748b,#475569)',flexShrink:0}}>{ci.check_type==='sos'?<AlertTriangle size={14} style={{color:'white'}}/>:ci.check_type==='check_in'?<Radio size={14} style={{color:'white'}}/>:<CheckCircle size={14} style={{color:'white'}}/>}</div>
                  <div style={{flex:1}}><p style={{fontSize:12,fontWeight:700,color:ci.check_type==='sos'?'#ef4444':dk.text}}>{ci.check_type==='sos'?'SOS Alert Sent':ci.check_type==='check_in'?'Checked In':'Checked Out'}</p><p style={{fontSize:10,color:dk.textFaint}}>{new Date(ci.created_at).toLocaleTimeString('en-AU',{hour:'numeric',minute:'2-digit'})}{ci.latitude?` · GPS: ${Number(ci.latitude).toFixed(4)}, ${Number(ci.longitude).toFixed(4)}`:''}{ci.notes?` · ${ci.notes}`:''}</p></div>
                </Glass>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}