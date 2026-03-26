import { useState, useEffect, useRef } from 'react'
import {
  FileText, Plus, Search, X, DollarSign, Download, Eye, Loader2, Calendar,
  CheckCircle, Clock, Send, Printer, Users, TrendingUp, AlertTriangle, Trash2, Edit2, Save
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'

function Glass({children,glow,style={},hover=false,dark=false,onClick,...p}){return<div onClick={onClick} style={{background:dark?'rgba(30,41,59,0.6)':'rgba(255,255,255,0.55)',backdropFilter:'blur(20px)',WebkitBackdropFilter:'blur(20px)',border:`1px solid ${dark?'rgba(51,65,85,0.4)':'rgba(255,255,255,0.7)'}`,borderRadius:'1.25rem',boxShadow:glow?`0 8px 32px -8px ${glow}`:'0 4px 24px -4px rgba(0,0,0,0.06)',transition:hover?'all .3s':undefined,cursor:hover||onClick?'pointer':undefined,...style}} onMouseEnter={hover?e=>{e.currentTarget.style.transform='translateY(-2px)'}:undefined} onMouseLeave={hover?e=>{e.currentTarget.style.transform='translateY(0)'}:undefined} {...p}>{children}</div>}
function Orb({color,size=200,top,left,right,bottom,delay=0}){return<div style={{position:'absolute',width:size,height:size,top,left,right,bottom,background:`radial-gradient(circle,${color} 0%,transparent 70%)`,opacity:0.12,borderRadius:'50%',animation:`orbFloat ${6+delay}s ease-in-out ${delay}s infinite`,pointerEvents:'none',zIndex:0}}/>}
function AnimNum({value,duration=1200,prefix='',suffix=''}){const[display,setDisplay]=useState(0);const frameRef=useRef();useEffect(()=>{const num=typeof value==='number'?value:parseFloat(value)||0;const start=performance.now();function tick(now){const p=Math.min((now-start)/duration,1);setDisplay(num*(1-Math.pow(1-p,3)));if(p<1)frameRef.current=requestAnimationFrame(tick)}frameRef.current=requestAnimationFrame(tick);return()=>cancelAnimationFrame(frameRef.current)},[value]);return<>{prefix}{Math.round(display).toLocaleString()}{suffix}</>}
function Badge({children,color='gray',isDark}){const palettes={gray:isDark?{bg:'rgba(100,116,139,0.2)',text:'#94a3b8',border:'rgba(100,116,139,0.3)'}:{bg:'#f1f5f9',text:'#64748b',border:'#e2e8f0'},green:isDark?{bg:'rgba(16,185,129,0.15)',text:'#34d399',border:'rgba(16,185,129,0.3)'}:{bg:'#ecfdf5',text:'#059669',border:'#a7f3d0'},amber:isDark?{bg:'rgba(245,158,11,0.15)',text:'#fbbf24',border:'rgba(245,158,11,0.3)'}:{bg:'#fffbeb',text:'#d97706',border:'#fde68a'},red:isDark?{bg:'rgba(239,68,68,0.15)',text:'#f87171',border:'rgba(239,68,68,0.3)'}:{bg:'#fef2f2',text:'#dc2626',border:'#fecaca'},blue:isDark?{bg:'rgba(59,130,246,0.15)',text:'#60a5fa',border:'rgba(59,130,246,0.3)'}:{bg:'#eff6ff',text:'#2563eb',border:'#bfdbfe'},purple:isDark?{bg:'rgba(139,92,246,0.15)',text:'#a78bfa',border:'rgba(139,92,246,0.3)'}:{bg:'#f5f3ff',text:'#7c3aed',border:'#ddd6fe'}};const pl=palettes[color]||palettes.gray;return<span style={{display:'inline-flex',alignItems:'center',padding:'3px 10px',fontSize:10,fontWeight:700,borderRadius:999,background:pl.bg,color:pl.text,border:`1px solid ${pl.border}`,whiteSpace:'nowrap'}}>{children}</span>}

const STATUS_MAP={draft:'amber',sent:'blue',paid:'green',overdue:'red'}
const NDIS_SERVICES=[{name:'Daily Personal Activities',code:'01_011',rate:57.10},{name:'Community Access',code:'04_049',rate:65.09},{name:'Behaviour Support',code:'11_022',rate:214.41},{name:'Assistive Technology',code:'05_060',rate:500.00},{name:'Therapeutic Supports',code:'15_037',rate:193.99},{name:'Transport',code:'02_051',rate:36.67},{name:'Plan Management',code:'14_033',rate:42.41}]

export default function Invoicing(){
  const{user}=useAuth();const c=useBrandColors();const{isDark}=useTheme()
  const[loaded,setLoaded]=useState(false);const[loading,setLoading]=useState(true)
  const[invoices,setInvoices]=useState([]);const[participants,setParticipants]=useState([])
  const[statusFilter,setStatusFilter]=useState('all');const[searchQuery,setSearchQuery]=useState('')
  const[showCreate,setShowCreate]=useState(false);const[showPreview,setShowPreview]=useState(null)
  const[saving,setSaving]=useState(false);const[generating,setGenerating]=useState(false)
  const[newInv,setNewInv]=useState({participant_id:'',date_from:'',date_to:'',notes:'',lines:[{description:'Daily Personal Activities',date:'',hours:'',rate:57.10}]})

  useEffect(()=>{const t=setTimeout(()=>setLoaded(true),80);return()=>clearTimeout(t)},[])
  const dk={text:isDark?'#e2e8f0':'#1f2937',textMuted:isDark?'#94a3b8':'#6b7280',textFaint:isDark?'#64748b':'#9ca3af',subtleBg:isDark?'rgba(255,255,255,0.04)':'rgba(0,0,0,0.02)',subtleBg2:isDark?'rgba(255,255,255,0.06)':'rgba(0,0,0,0.04)',inputBg:isDark?'rgba(30,41,59,0.8)':'white',inputBorder:isDark?'rgba(51,65,85,0.5)':'#e5e7eb',divider:isDark?'rgba(51,65,85,0.3)':'rgba(0,0,0,0.05)'}
  const stg=(i)=>({transitionDelay:`${i*50}ms`,opacity:loaded?1:0,transform:loaded?'translateY(0)':'translateY(14px)',transition:'all .6s cubic-bezier(.16,1,.3,1)'})
  const inputStyle={width:'100%',padding:'10px 12px',background:dk.inputBg,border:`1.5px solid ${dk.inputBorder}`,borderRadius:10,fontSize:13,fontWeight:600,color:dk.text,outline:'none'}

  useEffect(()=>{async function load(){try{const[invRes,partRes]=await Promise.all([supabase.from('invoices').select('*,participants(id,first_name,last_name,ndis_number)').order('created_at',{ascending:false}),supabase.from('participants').select('id,first_name,last_name,ndis_number').eq('status','active').order('first_name')]);setInvoices(invRes.data||[]);setParticipants(partRes.data||[])}catch(err){console.error(err)}finally{setLoading(false)}}load()},[])

  const addLine=()=>setNewInv({...newInv,lines:[...newInv.lines,{description:'Daily Personal Activities',date:'',hours:'',rate:57.10}]})
  const removeLine=(i)=>setNewInv({...newInv,lines:newInv.lines.filter((_,j)=>j!==i)})
  const updateLine=(i,field,val)=>{const lines=[...newInv.lines];lines[i]={...lines[i],[field]:val};if(field==='description'){const svc=NDIS_SERVICES.find(s=>s.name===val);if(svc)lines[i].rate=svc.rate};setNewInv({...newInv,lines})}
  const lineTotal=(l)=>(parseFloat(l.hours)||0)*(parseFloat(l.rate)||0)
  const newSubtotal=newInv.lines.reduce((a,l)=>a+lineTotal(l),0)

  const handleCreate=async()=>{if(!newInv.participant_id||!newInv.date_from||!newInv.date_to||newInv.lines.length===0){alert('Fill in participant, dates, and at least one line item');return}
    setSaving(true);try{
    const invCount=invoices.length;const invNum=`INV-${new Date().getFullYear()}${String(invCount+1).padStart(3,'0')}`
    const lineItems=newInv.lines.map(l=>({description:l.description,date:l.date,hours:parseFloat(l.hours)||0,rate:parseFloat(l.rate)||0,amount:lineTotal(l)}))
    const subtotal=lineItems.reduce((a,l)=>a+l.amount,0)
    const{data,error}=await supabase.from('invoices').insert({invoice_number:invNum,participant_id:newInv.participant_id,date_from:newInv.date_from,date_to:newInv.date_to,line_items:lineItems,subtotal,gst:0,total:subtotal,status:'draft',due_date:new Date(Date.now()+30*864e5).toISOString().split('T')[0],notes:newInv.notes||null,org_id:'3a387ce3-bd6c-4778-86b2-b7731c6057a7'}).select('*,participants(id,first_name,last_name,ndis_number)').single()
    if(error)throw error;setInvoices([data,...invoices]);setShowCreate(false);setNewInv({participant_id:'',date_from:'',date_to:'',notes:'',lines:[{description:'Daily Personal Activities',date:'',hours:'',rate:57.10}]})
    }catch(err){alert('Failed: '+err.message)}finally{setSaving(false)}}

  const updateStatus=async(inv,newStatus)=>{try{const updates={status:newStatus};if(newStatus==='paid')updates.paid_at=new Date().toISOString();const{error}=await supabase.from('invoices').update(updates).eq('id',inv.id);if(error)throw error;setInvoices(invoices.map(i=>i.id===inv.id?{...i,...updates}:i))}catch(err){alert(err.message)}}

  const deleteInvoice=async(inv)=>{if(!confirm(`Delete ${inv.invoice_number}?`))return;try{await supabase.from('invoices').delete().eq('id',inv.id);setInvoices(invoices.filter(i=>i.id!==inv.id))}catch(err){alert(err.message)}}

  const generatePDF=(inv)=>{setGenerating(true);const p=inv.participants||{};const items=(inv.line_items||[]).map(l=>`<tr><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px">${l.description}</td><td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${l.date?new Date(l.date).toLocaleDateString('en-AU'):'—'}</td><td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;text-align:center">${l.hours}h</td><td style="padding:10px;border-bottom:1px solid #eee;font-size:13px;text-align:right">$${(l.rate||0).toFixed(2)}</td><td style="padding:10px 14px;border-bottom:1px solid #eee;font-size:13px;text-align:right;font-weight:700">$${(l.amount||0).toFixed(2)}</td></tr>`).join('')
    const html=`<!DOCTYPE html><html><head><meta charset="utf-8"><title>${inv.invoice_number}</title><style>*{margin:0;padding:0;box-sizing:border-box}body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;color:#1f2937}@media print{body{print-color-adjust:exact;-webkit-print-color-adjust:exact}}</style></head><body><div style="max-width:800px;margin:0 auto;padding:40px">
    <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:40px"><div><div style="width:56px;height:56px;border-radius:14px;background:linear-gradient(135deg,#7c3aed,#a855f7);display:flex;align-items:center;justify-content:center;margin-bottom:10px"><svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" stroke-width="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg></div><h2 style="font-size:20px;font-weight:900;color:#7c3aed">Sunrise Disability Services</h2><p style="font-size:11px;color:#6b7280;margin-top:3px">ABN: 12 345 678 901 · NDIS Provider #4050012345</p><p style="font-size:11px;color:#6b7280">123 Care Street, Melbourne VIC 3000</p><p style="font-size:11px;color:#6b7280">accounts@sunriseds.com.au · 03 9123 4567</p></div>
    <div style="text-align:right"><h1 style="font-size:32px;font-weight:900;color:#7c3aed">TAX INVOICE</h1><p style="font-size:13px;font-weight:700;margin-top:6px">${inv.invoice_number}</p><p style="font-size:11px;color:#6b7280;margin-top:3px">Issued: ${new Date(inv.created_at).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</p><p style="font-size:11px;color:#6b7280">Due: ${inv.due_date?new Date(inv.due_date).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'}):'30 days'}</p><div style="margin-top:8px;display:inline-block;padding:3px 12px;border-radius:999px;font-size:10px;font-weight:700;background:${inv.status==='paid'?'#ecfdf5':inv.status==='sent'?'#eff6ff':'#fffbeb'};color:${inv.status==='paid'?'#059669':inv.status==='sent'?'#2563eb':'#d97706'}">${(inv.status||'draft').toUpperCase()}</div></div></div>
    <div style="display:flex;gap:24px;margin-bottom:28px"><div style="flex:1;padding:16px;background:#f8fafc;border-radius:10px"><p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:6px">Bill To / Participant</p><p style="font-size:14px;font-weight:700">${p.first_name||''} ${p.last_name||''}</p><p style="font-size:11px;color:#6b7280;margin-top:3px">NDIS: ${p.ndis_number||'—'}</p></div><div style="flex:1;padding:16px;background:#f8fafc;border-radius:10px"><p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.08em;color:#94a3b8;margin-bottom:6px">Service Period</p><p style="font-size:14px;font-weight:700">${inv.date_from?new Date(inv.date_from).toLocaleDateString('en-AU',{day:'numeric',month:'short'}):''} — ${inv.date_to?new Date(inv.date_to).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):''}</p><p style="font-size:11px;color:#6b7280;margin-top:3px">${(inv.line_items||[]).length} service line${(inv.line_items||[]).length!==1?'s':''}</p></div></div>
    <table style="width:100%;border-collapse:collapse;margin-bottom:20px"><thead><tr style="background:#f8fafc"><th style="padding:10px 14px;text-align:left;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;border-bottom:2px solid #e5e7eb">Support Item</th><th style="padding:10px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;border-bottom:2px solid #e5e7eb">Date</th><th style="padding:10px;text-align:center;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;border-bottom:2px solid #e5e7eb">Hours</th><th style="padding:10px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;border-bottom:2px solid #e5e7eb">Rate</th><th style="padding:10px 14px;text-align:right;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;border-bottom:2px solid #e5e7eb">Amount</th></tr></thead><tbody>${items}</tbody></table>
    <div style="display:flex;justify-content:flex-end"><div style="width:260px"><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#6b7280"><span>Subtotal</span><span style="font-weight:600;color:#1f2937">$${(inv.subtotal||0).toFixed(2)}</span></div><div style="display:flex;justify-content:space-between;padding:6px 0;font-size:12px;color:#6b7280;border-bottom:1px solid #e5e7eb"><span>GST (NDIS Exempt)</span><span style="font-weight:600;color:#1f2937">$0.00</span></div><div style="display:flex;justify-content:space-between;padding:10px 0;font-size:17px;font-weight:900;color:#7c3aed"><span>Total Due</span><span>$${(inv.total||0).toFixed(2)}</span></div></div></div>
    <div style="margin-top:32px;padding:16px;background:#f8fafc;border-radius:10px;border-left:4px solid #7c3aed"><p style="font-size:9px;font-weight:700;text-transform:uppercase;letter-spacing:0.06em;color:#94a3b8;margin-bottom:4px">Payment Details</p><p style="font-size:11px;color:#374151;line-height:1.7">Bank: Commonwealth Bank of Australia · BSB: 063-123 · Account: 1234 5678<br>Reference: ${inv.invoice_number}<br>Terms: 30 days. NDIS services are GST-free.</p></div>
    ${inv.notes?`<div style="margin-top:16px;padding:14px;background:#fffbeb;border-radius:10px;border-left:4px solid #f59e0b"><p style="font-size:9px;font-weight:700;text-transform:uppercase;color:#d97706;margin-bottom:4px">Notes</p><p style="font-size:11px;color:#374151">${inv.notes}</p></div>`:''}
    <div style="margin-top:24px;text-align:center;padding-top:16px;border-top:1px solid #e5e7eb"><p style="font-size:10px;color:#94a3b8">Sunrise Disability Services — Registered NDIS Provider</p><p style="font-size:9px;color:#cbd5e1;margin-top:2px">Powered by VelCare · veleria.com.au</p></div></div></body></html>`
    const w=window.open('','_blank');w.document.write(html);w.document.close();setTimeout(()=>{w.print();setGenerating(false)},500)}

  const totalInvoiced=invoices.reduce((a,i)=>a+(i.total||0),0);const totalPaid=invoices.filter(i=>i.status==='paid').reduce((a,i)=>a+(i.total||0),0);const totalOutstanding=invoices.filter(i=>i.status!=='paid').reduce((a,i)=>a+(i.total||0),0)
  const paidCount=invoices.filter(i=>i.status==='paid').length
  const filtered=invoices.filter(i=>{if(statusFilter!=='all'&&i.status!==statusFilter)return false;if(searchQuery.trim()){const q=searchQuery.toLowerCase();const pn=i.participants?`${i.participants.first_name} ${i.participants.last_name}`.toLowerCase():'';return pn.includes(q)||(i.invoice_number||'').toLowerCase().includes(q)};return true})

  if(loading)return<div style={{display:'flex',flexDirection:'column',alignItems:'center',justifyContent:'center',height:'60vh',gap:16}}><div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`}}><FileText size={22} style={{color:'white'}}/></div><p style={{fontSize:13,fontWeight:600,color:dk.textMuted}}>Loading invoices...</p></div>

  return(
    <div style={{position:'relative',minHeight:'100vh',overflow:'hidden'}}>
      <style>{`@keyframes orbFloat{0%,100%{transform:translateY(0) scale(1)}50%{transform:translateY(-15px) scale(1.03)}}@keyframes pulse-dot{0%,100%{opacity:1}50%{opacity:0.4}}@keyframes spin{to{transform:rotate(360deg)}}`}</style>
      <Orb color={c.primary} size={280} top="-80px" right="-60px" delay={0}/><Orb color="#10b981" size={200} bottom="10%" left="-40px" delay={2}/><Orb color="#f59e0b" size={160} top="40%" right="15%" delay={4}/>
      <div style={{position:'relative',zIndex:1,padding:'0 0 40px'}}>
        {/* HERO */}
        <div style={{...stg(0),background:`linear-gradient(135deg,${c.primary} 0%,${c.adminHover} 40%,#3b82f6 70%,#06b6d4 100%)`,borderRadius:20,padding:'28px 24px',marginBottom:24,position:'relative',overflow:'hidden'}}>
          <div style={{position:'absolute',top:-40,right:-40,width:180,height:180,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',bottom:-50,left:-30,width:150,height:150,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/>
          <div style={{position:'absolute',inset:0,opacity:0.15,backgroundImage:'radial-gradient(rgba(255,255,255,0.5) 1px,transparent 1px)',backgroundSize:'16px 16px'}}/>
          <div style={{position:'relative',zIndex:2}}>
            <span style={{display:'inline-flex',alignItems:'center',gap:6,padding:'4px 12px',borderRadius:999,background:'rgba(255,255,255,0.2)',fontSize:11,fontWeight:700,color:'white',marginBottom:14}}><FileText size={12}/> NDIS INVOICING</span>
            <h1 style={{fontSize:26,fontWeight:900,color:'white',lineHeight:1.2,marginBottom:4}}>Invoice Manager</h1>
            <p style={{fontSize:13,color:'rgba(255,255,255,0.75)',marginBottom:16}}>Create, manage, and print professional NDIS invoices</p>
            <div style={{display:'flex',gap:8,flexWrap:'wrap',marginBottom:16}}>
              {[{label:'Total',value:`$${Math.round(totalInvoiced).toLocaleString()}`,icon:DollarSign},{label:'Paid',value:`$${Math.round(totalPaid).toLocaleString()}`,icon:CheckCircle},{label:'Outstanding',value:`$${Math.round(totalOutstanding).toLocaleString()}`,icon:Clock},{label:'Invoices',value:invoices.length,icon:FileText}].map((pill,i)=>(<div key={i} style={{display:'inline-flex',alignItems:'center',gap:6,padding:'6px 14px',borderRadius:999,background:'rgba(255,255,255,0.15)',border:'1px solid rgba(255,255,255,0.15)'}}><pill.icon size={12} style={{color:'rgba(255,255,255,0.7)'}}/><span style={{fontSize:12,fontWeight:800,color:'white'}}>{pill.value}</span><span style={{fontSize:10,color:'rgba(255,255,255,0.6)'}}>{pill.label}</span></div>))}
            </div>
            <button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:8,padding:'10px 20px',borderRadius:12,background:'rgba(255,255,255,0.2)',border:'1px solid rgba(255,255,255,0.25)',color:'white',fontSize:13,fontWeight:700,cursor:'pointer'}}><Plus size={16}/> Create Invoice</button>
          </div>
        </div>

        {/* STATS */}
        <div style={{...stg(1),display:'grid',gridTemplateColumns:'repeat(auto-fit,minmax(140px,1fr))',gap:14,marginBottom:24}}>
          {[{icon:DollarSign,label:'Total Invoiced',value:totalInvoiced,prefix:'$',gradient:`linear-gradient(135deg,${c.primary},${c.adminHover})`,glow:`${c.primary}40`},{icon:CheckCircle,label:'Paid',value:totalPaid,prefix:'$',gradient:'linear-gradient(135deg,#10b981,#059669)',glow:'rgba(16,185,129,0.3)'},{icon:Clock,label:'Outstanding',value:totalOutstanding,prefix:'$',gradient:'linear-gradient(135deg,#f59e0b,#d97706)',glow:'rgba(245,158,11,0.3)',alert:totalOutstanding>0},{icon:FileText,label:'Invoices',value:invoices.length,gradient:'linear-gradient(135deg,#3b82f6,#2563eb)',glow:'rgba(59,130,246,0.3)'}].map((stat,i)=>(
            <Glass key={i} dark={isDark} hover glow={stat.glow} style={{padding:'18px 16px'}}><div style={{display:'flex',alignItems:'flex-start',justifyContent:'space-between',marginBottom:10}}><div style={{width:38,height:38,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',background:stat.gradient}}><stat.icon size={18} style={{color:'white'}}/></div>{stat.alert&&<span style={{width:8,height:8,borderRadius:4,background:'#f59e0b',animation:'pulse-dot 1.5s infinite'}}/>}</div><p style={{fontSize:22,fontWeight:900,color:dk.text,lineHeight:1}}><AnimNum value={stat.value} prefix={stat.prefix||''} suffix={stat.suffix||''}/></p><p style={{fontSize:11,fontWeight:600,color:dk.textFaint,marginTop:4}}>{stat.label}</p></Glass>
          ))}
        </div>

        {/* FILTERS */}
        <div style={{...stg(2),display:'flex',flexWrap:'wrap',gap:12,marginBottom:20}}>
          <Glass dark={isDark} style={{padding:6,display:'flex',gap:4,flexWrap:'wrap'}}>
            {[{id:'all',label:'All',count:invoices.length},{id:'draft',label:'Draft',count:invoices.filter(i=>i.status==='draft').length},{id:'sent',label:'Sent',count:invoices.filter(i=>i.status==='sent').length},{id:'paid',label:'Paid',count:paidCount}].map(f=>(
              <button key={f.id} onClick={()=>setStatusFilter(f.id)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:12,border:'none',cursor:'pointer',fontSize:12,fontWeight:700,background:statusFilter===f.id?`linear-gradient(135deg,${c.primary},${c.adminHover})`:'transparent',color:statusFilter===f.id?'white':dk.textMuted}}>{f.label}<span style={{padding:'1px 7px',borderRadius:999,fontSize:9,fontWeight:800,background:statusFilter===f.id?'rgba(255,255,255,0.25)':dk.subtleBg2,color:statusFilter===f.id?'white':dk.textFaint}}>{f.count}</span></button>
            ))}
          </Glass>
          <Glass dark={isDark} style={{padding:'4px 14px',display:'flex',alignItems:'center',gap:8,flex:'1 1 200px'}}><Search size={16} style={{color:dk.textFaint}}/><input type="text" placeholder="Search..." value={searchQuery} onChange={e=>setSearchQuery(e.target.value)} style={{flex:1,padding:'8px 0',background:'transparent',border:'none',outline:'none',fontSize:13,fontWeight:600,color:dk.text}}/></Glass>
        </div>

        {/* INVOICE LIST */}
        <div style={stg(3)}>
          {filtered.length>0?<div style={{display:'flex',flexDirection:'column',gap:10}}>
            {filtered.map(inv=>{const p=inv.participants||{};const sc=STATUS_MAP[inv.status]||'gray';const items=inv.line_items||[]
              return(<Glass key={inv.id} dark={isDark} hover style={{padding:0,overflow:'hidden'}}>
                <div style={{padding:'18px 20px'}}>
                  <div style={{display:'flex',alignItems:'flex-start',gap:14}}>
                    <div style={{width:48,height:48,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,flexShrink:0}}><FileText size={20} style={{color:'white'}}/></div>
                    <div style={{flex:1,minWidth:0}}>
                      <div style={{display:'flex',alignItems:'center',gap:6,flexWrap:'wrap',marginBottom:4}}><p style={{fontSize:15,fontWeight:800,color:dk.text}}>{inv.invoice_number}</p><Badge color={sc} isDark={isDark}>{(inv.status||'draft').toUpperCase()}</Badge></div>
                      <p style={{fontSize:13,color:dk.textMuted}}>{p.first_name} {p.last_name} · NDIS: {p.ndis_number||'—'}</p>
                      <p style={{fontSize:11,color:dk.textFaint,marginTop:4}}>{items.length} item{items.length!==1?'s':''} · {inv.date_from?new Date(inv.date_from).toLocaleDateString('en-AU',{day:'numeric',month:'short'}):'—'} — {inv.date_to?new Date(inv.date_to).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):'—'}</p>
                    </div>
                    <div style={{textAlign:'right',flexShrink:0}}><p style={{fontSize:22,fontWeight:900,color:c.primary}}>${(inv.total||0).toFixed(2)}</p><p style={{fontSize:10,color:dk.textFaint}}>Due {inv.due_date?new Date(inv.due_date).toLocaleDateString('en-AU',{day:'numeric',month:'short'}):''}</p></div>
                  </div>
                  <div style={{display:'flex',gap:8,marginTop:14,paddingTop:14,borderTop:`1px solid ${dk.divider}`,flexWrap:'wrap'}}>
                    <button onClick={()=>generatePDF(inv)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:11,fontWeight:700}}><Printer size={13}/> Print PDF</button>
                    <button onClick={()=>setShowPreview(inv)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:`1px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:11,fontWeight:600,cursor:'pointer'}}><Eye size={13}/> Preview</button>
                    {inv.status==='draft'&&<button onClick={()=>updateStatus(inv,'sent')} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#3b82f6,#2563eb)',color:'white',fontSize:11,fontWeight:700}}><Send size={13}/> Mark Sent</button>}
                    {inv.status==='sent'&&<button onClick={()=>updateStatus(inv,'paid')} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:'none',cursor:'pointer',background:'linear-gradient(135deg,#10b981,#059669)',color:'white',fontSize:11,fontWeight:700}}><CheckCircle size={13}/> Mark Paid</button>}
                    <button onClick={()=>deleteInvoice(inv)} style={{display:'flex',alignItems:'center',gap:6,padding:'8px 14px',borderRadius:10,border:`1px solid rgba(239,68,68,0.2)`,background:'transparent',color:'#ef4444',fontSize:11,fontWeight:600,cursor:'pointer',marginLeft:'auto'}}><Trash2 size={13}/></button>
                  </div>
                </div>
              </Glass>)
            })}
          </div>:(<Glass dark={isDark} style={{padding:'50px 24px',textAlign:'center'}}><FileText size={48} style={{color:dk.textFaint,margin:'0 auto 12px'}}/><p style={{fontSize:15,fontWeight:800,color:dk.text}}>No invoices</p><button onClick={()=>setShowCreate(true)} style={{display:'inline-flex',alignItems:'center',gap:6,marginTop:14,padding:'10px 20px',borderRadius:12,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:13,fontWeight:700}}><Plus size={14}/> Create Invoice</button></Glass>)}
        </div>
      </div>


      {/* CREATE INVOICE — LIVE INVOICE PREVIEW STYLE */}
      {showCreate&&<div style={{position:'fixed',inset:0,zIndex:50,background:'rgba(0,0,0,0.7)',backdropFilter:'blur(12px)',display:'flex',alignItems:'flex-start',justifyContent:'center',padding:'30px 16px',overflowY:'auto'}} onClick={()=>setShowCreate(false)}>
        <div onClick={e=>e.stopPropagation()} style={{width:'100%',maxWidth:780,borderRadius:0,overflow:'hidden',background:isDark?'#1a1f2e':'#ffffff',boxShadow:'0 30px 100px -15px rgba(0,0,0,0.5)',border:isDark?'1px solid rgba(255,255,255,0.05)':'1px solid rgba(0,0,0,0.08)'}}>

          {/* ═══ INVOICE HEADER — like the real PDF ═══ */}
          <div style={{padding:'32px 36px 24px',borderBottom:`3px solid ${c.primary}`}}>
            <div style={{display:'flex',justifyContent:'space-between',alignItems:'flex-start'}}>
              <div>
                <div style={{width:52,height:52,borderRadius:14,background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,display:'flex',alignItems:'center',justifyContent:'center',marginBottom:12}}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>
                </div>
                <h2 style={{fontSize:18,fontWeight:900,color:c.primary}}>Sunrise Disability Services</h2>
                <p style={{fontSize:10,color:dk.textFaint,marginTop:3}}>ABN: 12 345 678 901 · NDIS Provider #4050012345</p>
                <p style={{fontSize:10,color:dk.textFaint}}>123 Care Street, Melbourne VIC 3000</p>
                <p style={{fontSize:10,color:dk.textFaint}}>accounts@sunriseds.com.au · 03 9123 4567</p>
              </div>
              <div style={{textAlign:'right'}}>
                <h1 style={{fontSize:28,fontWeight:900,color:c.primary,letterSpacing:'-0.02em'}}>TAX INVOICE</h1>
                <p style={{fontSize:12,fontWeight:700,color:dk.text,marginTop:6}}>INV-{new Date().getFullYear()}{String(invoices.length+1).padStart(3,'0')}</p>
                <p style={{fontSize:10,color:dk.textFaint,marginTop:3}}>Issued: {new Date().toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</p>
                <p style={{fontSize:10,color:dk.textFaint}}>Due: {new Date(Date.now()+30*864e5).toLocaleDateString('en-AU',{day:'numeric',month:'long',year:'numeric'})}</p>
                <div style={{marginTop:8,display:'inline-block',padding:'3px 12px',borderRadius:999,fontSize:10,fontWeight:700,background:isDark?'rgba(245,158,11,0.15)':'#fffbeb',color:'#d97706',border:'1px solid rgba(245,158,11,0.2)'}}>DRAFT</div>
                <button onClick={()=>setShowCreate(false)} style={{display:'block',marginTop:10,marginLeft:'auto',width:30,height:30,borderRadius:8,border:`1px solid ${dk.divider}`,background:'transparent',color:dk.textFaint,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}}><X size={14}/></button>
              </div>
            </div>
          </div>

          {/* ═══ BILL TO + SERVICE PERIOD — editable ═══ */}
          <div style={{padding:'20px 36px',display:'flex',gap:16}}>
            <div style={{flex:1,padding:16,borderRadius:12,background:isDark?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${dk.divider}`}}>
              <p style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:dk.textFaint,marginBottom:8}}>Bill To / Participant</p>
              <select value={newInv.participant_id} onChange={e=>setNewInv({...newInv,participant_id:e.target.value})} style={{width:'100%',padding:'10px 12px',background:isDark?'rgba(30,41,59,0.6)':'white',border:`1.5px solid ${dk.inputBorder}`,borderRadius:8,fontSize:13,fontWeight:700,color:dk.text,outline:'none',cursor:'pointer'}}
                onFocus={e=>{e.currentTarget.style.borderColor=c.primary;e.currentTarget.style.boxShadow=`0 0 0 3px ${c.primary}15`}}
                onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder;e.currentTarget.style.boxShadow='none'}}>
                <option value="">Select participant...</option>
                {participants.map(p=><option key={p.id} value={p.id}>{p.first_name} {p.last_name} — NDIS: {p.ndis_number||'N/A'}</option>)}
              </select>
              {newInv.participant_id&&(()=>{const p=participants.find(x=>x.id===newInv.participant_id);return p?<p style={{fontSize:10,color:dk.textFaint,marginTop:6}}>NDIS: {p.ndis_number||'—'}</p>:null})()}
            </div>
            <div style={{flex:1,padding:16,borderRadius:12,background:isDark?'rgba(255,255,255,0.03)':'#f8fafc',border:`1px solid ${dk.divider}`}}>
              <p style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.1em',color:dk.textFaint,marginBottom:8}}>Service Period</p>
              <div style={{display:'flex',gap:8,alignItems:'center'}}>
                <input type="date" value={newInv.date_from} onChange={e=>setNewInv({...newInv,date_from:e.target.value})} style={{flex:1,padding:'10px 10px',background:isDark?'rgba(30,41,59,0.6)':'white',border:`1.5px solid ${dk.inputBorder}`,borderRadius:8,fontSize:12,fontWeight:600,color:dk.text,outline:'none'}}
                  onFocus={e=>{e.currentTarget.style.borderColor=c.primary}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/>
                <span style={{fontSize:13,fontWeight:800,color:dk.textFaint}}>—</span>
                <input type="date" value={newInv.date_to} onChange={e=>setNewInv({...newInv,date_to:e.target.value})} style={{flex:1,padding:'10px 10px',background:isDark?'rgba(30,41,59,0.6)':'white',border:`1.5px solid ${dk.inputBorder}`,borderRadius:8,fontSize:12,fontWeight:600,color:dk.text,outline:'none'}}
                  onFocus={e=>{e.currentTarget.style.borderColor=c.primary}} onBlur={e=>{e.currentTarget.style.borderColor=dk.inputBorder}}/>
              </div>
            </div>
          </div>

          {/* ═══ LINE ITEMS TABLE — spreadsheet style ═══ */}
          <div style={{padding:'12px 36px 0'}}>
            <table style={{width:'100%',borderCollapse:'collapse'}}>
              <thead>
                <tr style={{background:isDark?'rgba(255,255,255,0.03)':'#f8fafc'}}>
                  <th style={{padding:'10px 14px',textAlign:'left',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`}}>Support Item / Description</th>
                  <th style={{padding:'10px 8px',textAlign:'center',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,width:110}}>Date</th>
                  <th style={{padding:'10px 8px',textAlign:'center',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,width:70}}>Hours</th>
                  <th style={{padding:'10px 8px',textAlign:'right',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,width:90}}>Rate</th>
                  <th style={{padding:'10px 14px',textAlign:'right',fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,width:100}}>Amount</th>
                  <th style={{borderBottom:`2px solid ${isDark?'rgba(255,255,255,0.08)':'#e5e7eb'}`,width:36}}/>
                </tr>
              </thead>
              <tbody>
                {newInv.lines.map((line,i)=>(
                  <tr key={i} style={{borderBottom:`1px solid ${dk.divider}`}}>
                    <td style={{padding:'8px 6px 8px 14px'}}><select value={line.description} onChange={e=>updateLine(i,'description',e.target.value)} style={{width:'100%',padding:'8px 8px',background:isDark?'rgba(30,41,59,0.4)':'rgba(0,0,0,0.02)',border:`1px solid ${dk.divider}`,borderRadius:6,fontSize:12,fontWeight:600,color:dk.text,outline:'none',cursor:'pointer'}}>{NDIS_SERVICES.map(s=><option key={s.name} value={s.name}>{s.name}</option>)}</select></td>
                    <td style={{padding:'8px 4px'}}><input type="date" value={line.date} onChange={e=>updateLine(i,'date',e.target.value)} style={{width:'100%',padding:'8px 6px',background:isDark?'rgba(30,41,59,0.4)':'rgba(0,0,0,0.02)',border:`1px solid ${dk.divider}`,borderRadius:6,fontSize:11,color:dk.text,outline:'none'}}/></td>
                    <td style={{padding:'8px 4px'}}><input type="number" value={line.hours} onChange={e=>updateLine(i,'hours',e.target.value)} placeholder="0" style={{width:'100%',padding:'8px 6px',background:isDark?'rgba(30,41,59,0.4)':'rgba(0,0,0,0.02)',border:`1px solid ${dk.divider}`,borderRadius:6,fontSize:13,fontWeight:700,color:dk.text,outline:'none',textAlign:'center'}}/></td>
                    <td style={{padding:'8px 4px'}}><div style={{display:'flex',alignItems:'center',gap:2}}><span style={{fontSize:12,color:dk.textFaint}}>$</span><input type="number" value={line.rate} onChange={e=>updateLine(i,'rate',e.target.value)} style={{width:'100%',padding:'8px 6px',background:isDark?'rgba(30,41,59,0.4)':'rgba(0,0,0,0.02)',border:`1px solid ${dk.divider}`,borderRadius:6,fontSize:13,fontWeight:700,color:dk.text,outline:'none',textAlign:'right'}}/></div></td>
                    <td style={{padding:'8px 14px 8px 8px',textAlign:'right'}}><p style={{fontSize:14,fontWeight:900,color:lineTotal(line)>0?c.primary:dk.textFaint}}>${lineTotal(line).toFixed(2)}</p></td>
                    <td style={{padding:'8px 4px'}}>{newInv.lines.length>1&&<button onClick={()=>removeLine(i)} style={{width:28,height:28,borderRadius:6,border:'none',background:'transparent',color:dk.textFaint,cursor:'pointer',display:'flex',alignItems:'center',justifyContent:'center'}} onMouseEnter={e=>{e.currentTarget.style.color='#ef4444';e.currentTarget.style.background=isDark?'rgba(239,68,68,0.1)':'rgba(239,68,68,0.05)'}} onMouseLeave={e=>{e.currentTarget.style.color=dk.textFaint;e.currentTarget.style.background='transparent'}}><Trash2 size={13}/></button>}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            <button onClick={addLine} style={{display:'flex',alignItems:'center',gap:5,padding:'8px 14px',marginTop:8,borderRadius:8,border:`1.5px dashed ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:11,fontWeight:700,cursor:'pointer',width:'100%',justifyContent:'center'}}
              onMouseEnter={e=>{e.currentTarget.style.borderColor=c.primary;e.currentTarget.style.color=c.primary;e.currentTarget.style.background=isDark?`${c.primary}08`:`${c.primary}04`}}
              onMouseLeave={e=>{e.currentTarget.style.borderColor=dk.divider;e.currentTarget.style.color=dk.textMuted;e.currentTarget.style.background='transparent'}}>
              <Plus size={13}/> Add Line Item
            </button>
          </div>

          {/* ═══ TOTALS — right aligned like real invoice ═══ */}
          <div style={{padding:'16px 36px',display:'flex',justifyContent:'flex-end'}}>
            <div style={{width:280}}>
              <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',fontSize:12,color:dk.textMuted}}><span>Subtotal</span><span style={{fontWeight:700,color:dk.text}}>${newSubtotal.toFixed(2)}</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'7px 0',fontSize:12,color:dk.textMuted,borderBottom:`1px solid ${dk.divider}`}}><span>GST (NDIS Exempt)</span><span style={{fontWeight:700,color:dk.text}}>$0.00</span></div>
              <div style={{display:'flex',justifyContent:'space-between',padding:'12px 0',fontSize:20,fontWeight:900,color:c.primary}}><span>Total Due</span><span>${newSubtotal.toFixed(2)}</span></div>
            </div>
          </div>

          {/* ═══ PAYMENT DETAILS — like the real invoice ═══ */}
          <div style={{margin:'0 36px',padding:'14px 18px',borderRadius:10,background:isDark?'rgba(255,255,255,0.03)':'#f8fafc',borderLeft:`4px solid ${c.primary}`,marginBottom:16}}>
            <p style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,marginBottom:4}}>Payment Details</p>
            <p style={{fontSize:11,color:dk.textMuted,lineHeight:1.7}}>Bank: Commonwealth Bank of Australia · BSB: 063-123 · Account: 1234 5678<br/>Terms: 30 days from invoice date. NDIS services are GST-free.</p>
          </div>

          {/* ═══ NOTES ═══ */}
          <div style={{padding:'0 36px 16px'}}>
            <p style={{fontSize:9,fontWeight:800,textTransform:'uppercase',letterSpacing:'0.08em',color:dk.textFaint,marginBottom:6}}>Notes / Special Instructions</p>
            <textarea value={newInv.notes} onChange={e=>setNewInv({...newInv,notes:e.target.value})} rows={2} placeholder="Additional payment terms, service details, or notes for the recipient..." style={{width:'100%',padding:'10px 12px',background:isDark?'rgba(30,41,59,0.4)':'rgba(0,0,0,0.02)',border:`1px solid ${dk.divider}`,borderRadius:8,fontSize:12,fontWeight:500,color:dk.text,outline:'none',resize:'vertical',minHeight:50}}
              onFocus={e=>{e.currentTarget.style.borderColor=c.primary}} onBlur={e=>{e.currentTarget.style.borderColor=dk.divider}}/>
          </div>

          {/* ═══ FOOTER + ACTIONS ═══ */}
          <div style={{padding:'16px 36px 24px',borderTop:`1px solid ${dk.divider}`,display:'flex',alignItems:'center',justifyContent:'space-between'}}>
            <div>
              <p style={{fontSize:10,color:dk.textFaint}}>Sunrise Disability Services — Registered NDIS Provider</p>
              <p style={{fontSize:9,color:isDark?'rgba(100,116,139,0.5)':'#cbd5e1'}}>Powered by <span style={{color:c.primary,fontWeight:700}}>VelCare</span> · veleria.com.au</p>
            </div>
            <div style={{display:'flex',gap:10}}>
              <button onClick={()=>setShowCreate(false)} style={{padding:'12px 24px',borderRadius:12,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.textMuted,fontSize:13,fontWeight:600,cursor:'pointer'}}
                onMouseEnter={e=>e.currentTarget.style.background=dk.subtleBg} onMouseLeave={e=>e.currentTarget.style.background='transparent'}>
                Cancel
              </button>
              <button onClick={handleCreate} disabled={saving||newSubtotal===0} style={{display:'flex',alignItems:'center',gap:8,padding:'12px 28px',borderRadius:12,border:'none',cursor:(saving||newSubtotal===0)?'default':'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:13,fontWeight:800,opacity:(saving||newSubtotal===0)?0.4:1,boxShadow:`0 6px 24px -6px ${c.primary}60`}}>
                {saving?<><Loader2 size={16} style={{animation:'spin 1s linear infinite'}}/> Creating...</>:<><Save size={16}/> Create Invoice — ${newSubtotal.toFixed(2)}</>}
              </button>
            </div>
          </div>
        </div>
      </div>}

      {/* PREVIEW MODAL */}
      <Modal isOpen={!!showPreview} onClose={()=>setShowPreview(null)} title="" wide>
        {showPreview&&(()=>{const p=showPreview.participants||{};const items=showPreview.line_items||[];return(
          <div>
            <div style={{margin:'-24px -24px 0'}}><div style={{background:`linear-gradient(135deg,${c.primary},${c.adminHover},#3b82f6)`,padding:'24px',position:'relative',overflow:'hidden'}}><div style={{position:'absolute',top:-20,right:-20,width:100,height:100,borderRadius:'50%',background:'rgba(255,255,255,0.1)'}}/><div style={{position:'relative',zIndex:2,display:'flex',alignItems:'center',justifyContent:'space-between'}}><div style={{display:'flex',alignItems:'center',gap:12}}><div style={{width:44,height:44,borderRadius:14,display:'flex',alignItems:'center',justifyContent:'center',background:'rgba(255,255,255,0.2)'}}><FileText size={20} style={{color:'white'}}/></div><div><h3 style={{fontSize:18,fontWeight:900,color:'white'}}>{showPreview.invoice_number}</h3><p style={{fontSize:12,color:'rgba(255,255,255,0.8)',marginTop:2}}>{p.first_name} {p.last_name}</p></div></div><p style={{fontSize:24,fontWeight:900,color:'white'}}>${(showPreview.total||0).toFixed(2)}</p></div></div></div>
            <div style={{padding:'20px 0 0'}}>
              <div style={{display:'grid',gridTemplateColumns:'1fr 1fr',gap:10,marginBottom:16}}>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,color:dk.textFaint,textTransform:'uppercase'}}>NDIS Number</p><p style={{fontSize:14,fontWeight:700,color:dk.text,marginTop:4}}>{p.ndis_number||'—'}</p></div>
                <div style={{padding:14,borderRadius:14,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><p style={{fontSize:10,fontWeight:700,color:dk.textFaint,textTransform:'uppercase'}}>Period</p><p style={{fontSize:14,fontWeight:700,color:dk.text,marginTop:4}}>{showPreview.date_from?new Date(showPreview.date_from).toLocaleDateString('en-AU',{day:'numeric',month:'short'}):''} — {showPreview.date_to?new Date(showPreview.date_to).toLocaleDateString('en-AU',{day:'numeric',month:'short',year:'numeric'}):''}</p></div>
              </div>
              <p style={{fontSize:12,fontWeight:700,color:dk.text,marginBottom:8}}>Line Items ({items.length})</p>
              <div style={{display:'flex',flexDirection:'column',gap:6,marginBottom:16}}>
                {items.map((l,i)=>(<div key={i} style={{display:'flex',alignItems:'center',gap:10,padding:'10px 14px',borderRadius:12,background:dk.subtleBg,border:`1px solid ${dk.divider}`}}><div style={{flex:1}}><p style={{fontSize:12,fontWeight:600,color:dk.text}}>{l.description}</p><p style={{fontSize:10,color:dk.textFaint}}>{l.date?new Date(l.date).toLocaleDateString('en-AU'):'—'} · {l.hours}h × ${(l.rate||0).toFixed(2)}</p></div><p style={{fontSize:14,fontWeight:800,color:dk.text}}>${(l.amount||0).toFixed(2)}</p></div>))}
              </div>
              <div style={{padding:14,borderRadius:14,background:isDark?`${c.primary}10`:`${c.primary}05`,border:`1px solid ${c.primary}20`}}>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}><span style={{fontSize:12,color:dk.textMuted}}>Subtotal</span><span style={{fontSize:13,fontWeight:700,color:dk.text}}>${(showPreview.subtotal||0).toFixed(2)}</span></div>
                <div style={{display:'flex',justifyContent:'space-between',marginBottom:8}}><span style={{fontSize:12,color:dk.textMuted}}>GST (NDIS Exempt)</span><span style={{fontSize:13,fontWeight:700,color:dk.text}}>$0.00</span></div>
                <div style={{display:'flex',justifyContent:'space-between',paddingTop:8,borderTop:`1px solid ${dk.divider}`}}><span style={{fontSize:16,fontWeight:900,color:c.primary}}>Total</span><span style={{fontSize:18,fontWeight:900,color:c.primary}}>${(showPreview.total||0).toFixed(2)}</span></div>
              </div>
              <div style={{display:'flex',gap:10,marginTop:16}}>
                <button onClick={()=>setShowPreview(null)} style={{flex:1,padding:'14px 20px',borderRadius:14,border:`1.5px solid ${dk.divider}`,background:'transparent',color:dk.text,fontSize:13,fontWeight:600,cursor:'pointer'}}>Close</button>
                <button onClick={()=>{generatePDF(showPreview);setShowPreview(null)}} style={{flex:2,display:'flex',alignItems:'center',justifyContent:'center',gap:8,padding:'14px 20px',borderRadius:14,border:'none',cursor:'pointer',background:`linear-gradient(135deg,${c.primary},${c.adminHover})`,color:'white',fontSize:13,fontWeight:800}}><Printer size={16}/> Print PDF</button>
              </div>
            </div>
          </div>
        )})()}
      </Modal>
    </div>
  )
}