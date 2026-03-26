import { useState, useEffect, useRef } from 'react'
import { FileText, Plus, Search, X, Clock, User, Loader2, Send, Calendar, ChevronRight, Filter } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'

function Glass({children,glow,style={},hover=false,dark=false,onClick,...p}){return<div onClick={onClick} style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseInt(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(Math.round(num*(1-Math.pow(1-p,3))));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value,duration]);return<>{display}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

const CATEGORIES=['general','phone_call','meeting','observation','plan_review','referral','family_contact','other']

export default function ProgressNotes(){
  const{user}=useAuth();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[notes,setNotes]=useState([]);const[participants,setParticipants]=useState([]);const[staff,setStaff]=useState([])
  const[searchQuery,setSearchQuery]=useState('');const[catFilter,setCatFilter]=useState('all');const[showCreate,setShowCreate]=useState(false);const[saving,setSaving]=useState(false)
  const[newNote,setNewNote]=useState({participant_id:'',content:'',category:'general'})
  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'12px 14px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:12,fontSize:13,fontWeight:600,color:dk.text,outline:'none'}

  useEffect(()=>{async function load(){try{const[nRes,pRes,sRes]=await Promise.all([supabase.from('progress_notes').select('*,participants(first_name,last_name),staff:staff_id(first_name,last_name)').order('note_date',{ascending:false}).limit(50),supabase.from('participants').select('id,first_name,last_name').eq('status','active').order('first_name'),supabase.from('staff').select('id,first_name,last_name').eq('status','active')]);setNotes(nRes.data||[]);setParticipants(pRes.data||[]);setStaff(sRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[])

  const handleCreate=async()=>{if(!newNote.participant_id||!newNote.content){alert('Select participant and write a note');return};setSaving(true);try{const staffId=user?.id?staff.find(s=>s.id===user.id)?.id||staff[0]?.id:staff[0]?.id;const{data,error}=await supabase.from('progress_notes').insert({...newNote,staff_id:staffId,note_date:new Date().toISOString()}).select('*,participants(first_name,last_name),staff:staff_id(first_name,last_name)').single();if(error)throw error;setNotes([data,...notes]);setShowCreate(false);setNewNote({participant_id:'',content:'',category:'general'})}catch(err){alert('Failed: '+err.message)}finally{setSaving(false)}}

  const filtered=notes.filter(n=>{if(catFilter!=='all'&&n.category!==catFilter)return false;if(searchQuery.trim()){const q=searchQuery.toLowerCase();const pName=n.participants?`${n.participants.first_name} ${n.participants.last_name}`.toLowerCase():'';return pName.includes(q)||(n.content||'').toLowerCase().includes(q)}return true})

  const catColors={general:'#3b82f6',phone_call:'#10b981',meeting:'#8b5cf6',observation:'#f59e0b',plan_review:'#ef4444',referral:'#06b6d4',family_contact:'#ec4899',other:'#64748b'}

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><FileText size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading progress notes...</p></div>

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
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white',marginBottom:14}}><FileText size={12}/> PROGRESS NOTES</span>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Progress Notes</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Non-shift interactions: phone calls, meetings, observations, referrals</p>
            <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}><Plus size={16}/> Add Note</button>
          </div>
        </div>

        <div style={{...stg(1),display:'flex',flexWrap:'wrap',gap:12,marginBottom:20}}>
          <Glass dark={isDark} style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flex:'1 1 200px'}}><Search size={16} style={{color:dk.textFaint}}/><input type="text" placeholder="Search notes..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{flex:1,padding:'8px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text}}/>{searchQuery&&<button onClick={()=>setSearchQuery('')} style={{padding:4,borderRadius:6,border:'none',cursor:'pointer',background:dk.subtleBg2,color:dk.textFaint}}><X size={12}/></button>}</Glass>
          <Glass dark={isDark} style={{padding:'4px 10px'}}><select value={catFilter} onChange={e=>setCatFilter(e.target.value)} style={{padding:'8px 6px',background:'transparent',border:'none',outline:'none',fontSize:12,fontWeight:600,color:dk.text,cursor:'pointer'}}><option value="all">All Categories</option>{CATEGORIES.map(cat=><option key={cat} value={cat}>{cat.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</option>)}</select></Glass>
        </div>

        <div style={stg(2)}>
          {filtered.length>0?<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(n=>{const pName=n.participants?`${n.participants.first_name} ${n.participants.last_name}`:'—';const sName=n.staff?`${n.staff.first_name} ${n.staff.last_name}`:'—';const catCol=catColors[n.category]||'#64748b'
              return(<Glass key={n.id} dark={isDark} hover style={{padding:16,borderLeft:`4px solid ${catCol}`}}>
                <div style={{display:'flex',alignItems:'flex-start',gap:12}}>
                  <div style={{width:40,height:40,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:`${catCol}15`,flexShrink:0}}><FileText size={16} style={{color:catCol}}/></div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}><p style={{fontSize:13,fontWeight:700,color:dk.text}}>{pName}</p><Badge color="blue" isDark={isDark}>{(n.category||'general').replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</Badge></div>
                    <p style={{fontSize:12,color:dk.textMuted,lineHeight:1.6}}>{n.content}</p>
                    <p style={{fontSize:10,color:dk.textFaint,marginTop:6}}>By {sName} · {n.note_date?new Date(n.note_date).toLocaleDateString('en-AU',{weekday:'short',day:'numeric',month:'short',hour:'numeric',minute:'2-digit'}):''}</p>
                  </div>
                </div>
              </Glass>)
            })}
          </div>:(<Glass dark={isDark} style={{padding:'50px 24px',textAlign:'center'}}><FileText size={40} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No progress notes yet</p><button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:13,fontWeight:700}}><Plus size={14}/> Add Note</button></Glass>)}
        </div>
      </div>

      <Modal isOpen={showCreate} onClose={()=>setShowCreate(false)} title="" wide>
        <div>
          <div style={{margin:'-24px -24px 0'}}><div style={{background:`linear-gradient(135deg,${c.primary},${c.adminHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/><div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',gap:12}}><div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)'}}><FileText size={20} style={{color:'white'}}/></div><div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>New Progress Note</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>Record a non-shift interaction</p></div></div></div></div>
          <div style={{padding:'20px 0 0',display:'flex',flexDirection:'column',gap:14}}>
            <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10}}>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Participant *</p><select value={newNote.participant_id} onChange={e=>setNewNote({...newNote,participant_id:e.target.value})} style={inputStyle}><option value="">Select...</option>{participants.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}</select></div>
              <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Category</p><select value={newNote.category} onChange={e=>setNewNote({...newNote,category:e.target.value})} style={inputStyle}>{CATEGORIES.map(cat=><option key={cat} value={cat}>{cat.replace(/_/g,' ').replace(/\b\w/g,ch=>ch.toUpperCase())}</option>)}</select></div>
            </div>
            <div><p style={{fontSize:11,fontWeight:700,color:dk.textMuted,marginBottom:6}}>Note Content *</p><textarea value={newNote.content} onChange={e=>setNewNote({...newNote,content:e.target.value})} rows={5} placeholder="Document the interaction, observation, or update..." style={{...inputStyle,resize:'vertical',minHeight:100}}/></div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowCreate(false)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Cancel</button>
              <button onClick={handleCreate} disabled={saving} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:saving?'default':'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:13,fontWeight:800,opacity:saving?0.6:1}}>{saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Saving...</>:<><Send size={16}/> Save Note</>}</button>
            </div>
          </div>
        </div>
      </Modal>
    </div>
  )
}