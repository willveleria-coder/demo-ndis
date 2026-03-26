import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import {
  ArrowLeft, AlertTriangle, Shield, Clock, User, FileText, Loader2, MapPin, Calendar,
  Trash2, Pencil, Camera, CheckCircle, XCircle, Activity, ChevronRight, Eye,
  Users, Zap, Target, Star, RefreshCw
} from 'lucide-react'
import { getIncident, updateIncident } from '../services/incidentService'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import PhotoGallery from '../components/PhotoGallery'
import PhotoUploader from '../components/PhotoUploader'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{ background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)', border: `1px solid ${border}`, borderRadius: '1.25rem', boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)', transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined, ...style }}
    onMouseEnter={hover ? e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)' } : undefined}
    onMouseLeave={hover ? e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)' } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{ position: 'absolute', width: size, height: size, top, left, right, bottom, background: `radial-gradient(circle, ${color} 0%, transparent 70%)`, opacity: 0.12, borderRadius: '50%', animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`, pointerEvents: 'none', zIndex: 0 }} />)
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700, background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`, whiteSpace: 'nowrap' }}>{children}</span>)
}

function InfoField({ label, value, icon: Icon, color, dk }) {
  return (
    <div style={{ padding: '14px 16px', borderRadius: 14, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 6 }}>
        {Icon && <Icon size={12} style={{ color: color || dk.textFaint }} />}
        <p style={{ fontSize: 10, fontWeight: 600, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{label}</p>
      </div>
      <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>{value || '—'}</p>
    </div>
  )
}


/* ─────────────────────────────────────────────
   HELPERS
   ───────────────────────────────────────────── */

function formatDate(iso) { if (!iso) return '—'; return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) }
function formatType(t) { if (!t) return '—'; return t.replace(/_/g, ' ').replace(/\b\w/g, ch => ch.toUpperCase()) }
function priorityColor(p) { if (p === 'high' || p === 'High' || p === 'critical') return 'red'; if (p === 'medium' || p === 'Medium') return 'amber'; return 'teal' }
function statusColor(s) { if (!s) return 'gray'; const lower = s.toLowerCase(); if (lower.includes('resolved') || lower.includes('closed')) return 'green'; if (lower.includes('review') || lower.includes('progress')) return 'amber'; if (lower.includes('action') || lower.includes('open')) return 'red'; return 'blue' }

const severityConfig = {
  critical: { accent: '#dc2626', grad: 'linear-gradient(135deg, #dc2626, #ef4444)' },
  high:     { accent: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f87171)' },
  medium:   { accent: '#f59e0b', grad: 'linear-gradient(135deg, #f59e0b, #fbbf24)' },
  low:      { accent: '#06b6d4', grad: 'linear-gradient(135deg, #06b6d4, #22d3ee)' },
}
function getSev(s) { return severityConfig[s] || severityConfig.medium }


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function IncidentDetail() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [incident, setIncident] = useState(null)
  const [updating, setUpdating] = useState(false)
  const [showAddPhotos, setShowAddPhotos] = useState(false)
  const [additionalPhotos, setAdditionalPhotos] = useState([])
  const [savingPhotos, setSavingPhotos] = useState(false)

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white', inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })


  /* ═══ ALL BACKEND — 100% PRESERVED ═══ */

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this incident?')) return
    try { const { error } = await supabase.from('incidents').delete().eq('id', id); if (error) throw error; navigate('/admin/incidents') }
    catch (err) { alert('Failed to delete: ' + (err.message || 'Unknown error')) }
  }

  useEffect(() => {
    async function load() {
      try { const data = await getIncident(id); setIncident(data) }
      catch (err) { console.error('Failed to load incident:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [id])

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try { const updated = await updateIncident(id, { status: newStatus }); setIncident(prev => ({ ...prev, ...updated })) }
    catch (err) { alert('Failed to update status') }
    finally { setUpdating(false) }
  }

  const handleSavePhotos = async () => {
    if (additionalPhotos.length === 0) return; setSavingPhotos(true)
    try {
      const existingPhotos = Array.isArray(incident.photos) ? incident.photos : []
      const allPhotos = [...existingPhotos, ...additionalPhotos]
      const { data, error } = await supabase.from('incidents').update({ photos: allPhotos }).eq('id', id).select().single()
      if (error) throw error
      setIncident(prev => ({ ...prev, photos: allPhotos })); setAdditionalPhotos([]); setShowAddPhotos(false)
    } catch (err) { alert('Failed to save photos: ' + (err.message || 'Unknown error')) }
    finally { setSavingPhotos(false) }
  }


  /* ─── Loading / Not found ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}><AlertTriangle size={32} color="white" /></div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading incident...</p>
    </div>
  )

  if (!incident) return (
    <div style={{ padding: 48, textAlign: 'center' }}>
      <div style={{ width: 72, height: 72, borderRadius: 20, margin: '0 auto 16px', background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}><AlertTriangle size={32} style={{ color: c.primary }} /></div>
      <p style={{ color: dk.textMuted, fontWeight: 600, fontSize: 16 }}>Incident not found</p>
      <Link to="/admin/incidents" style={{ color: c.primary, fontSize: 14, fontWeight: 600, marginTop: 8, display: 'inline-block' }}>Back to incidents</Link>
    </div>
  )

  const i = incident
  const participant = i.participants
  const reporter = i.staff
  const photos = Array.isArray(i.photos) ? i.photos : []
  const sev = i.priority || i.severity || 'medium'
  const sc = getSev(sev)
  const isNDIS = i.is_reportable || i.ndis_reportable
  const heroGrad = isNDIS
    ? `linear-gradient(135deg, ${c.primary} 0%, #ef4444 40%, #dc2626 70%, #f59e0b 100%)`
    : `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, ${sc.accent} 70%, ${sc.accent}cc 100%)`


  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#ef4444" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#f59e0b" size={200} top="45%" right="8%" delay={3.5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

        {/* Back */}
        <div style={stg(0)}>
          <Link to="/admin/incidents" style={{ textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: 8 }}>
            <div style={{ width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(255,255,255,0.7)', backdropFilter: 'blur(12px)', border: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.8)'}` }}>
              <ArrowLeft size={18} style={{ color: dk.textMuted }} />
            </div>
            <span style={{ fontSize: 13, fontWeight: 600, color: dk.textMuted }}>Back to Incidents</span>
          </Link>
        </div>

        {/* ══════════ HERO ══════════ */}
        <div style={stg(1)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: heroGrad }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, idx) => (
              <div key={idx} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}><Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} /><span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Incident</span></div>
                <Badge color={priorityColor(sev)} dark>{formatType(sev)}</Badge>
                <Badge color={statusColor(i.status)} dark>{formatType(i.status || 'open')}</Badge>
                {isNDIS && <Badge color="red" dark><Shield size={9} /> NDIS Reportable</Badge>}
                {photos.length > 0 && <Badge color="gray" dark><Camera size={9} /> {photos.length} photo{photos.length !== 1 ? 's' : ''}</Badge>}
              </div>

              <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
                <div style={{ width: 64, height: 64, borderRadius: 18, background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <AlertTriangle size={30} color="white" />
                </div>
                <div style={{ flex: 1 }}>
                  <h1 style={{ fontSize: 26, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>{formatType(i.incident_type || i.type) || 'Incident'}</h1>
                  <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>
                    {formatDate(i.incident_date)}{i.incident_time ? ` at ${i.incident_time}` : ''}{i.location ? ` · ${i.location}` : ''}
                  </p>
                </div>
                <button onClick={handleDelete} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(239,68,68,0.3)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', flexShrink: 0 }}>
                  <Trash2 size={14} /> Delete
                </button>
              </div>

              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  participant && { icon: User, text: `${participant.first_name} ${participant.last_name}` },
                  reporter && { icon: FileText, text: `Reported by ${reporter.first_name} ${reporter.last_name}` },
                  i.location && { icon: MapPin, text: i.location },
                  { icon: Calendar, text: formatDate(i.incident_date) },
                ].filter(Boolean).map((pill, idx) => (
                  <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* ══════════ NDIS ALERT ══════════ */}
        {isNDIS && (
          <Glass dark={isDark} glow="rgba(239,68,68,0.15)" style={{ ...stg(2), padding: 0, overflow: 'hidden', borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)' }}>
            <div style={{ padding: '18px 22px', background: 'linear-gradient(135deg, rgba(239,68,68,0.08), rgba(249,115,22,0.05))', display: 'flex', alignItems: 'center', gap: 14 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, flexShrink: 0, background: 'linear-gradient(135deg, #ef4444, #dc2626)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(239,68,68,0.4)' }}><Shield size={24} color="white" /></div>
              <div>
                <p style={{ fontWeight: 800, color: dk.text, fontSize: 15 }}>NDIS Reportable Incident</p>
                <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 3 }}>
                  Must be reported to the NDIS Commission within {i.reporting_timeframe || '24 hours'}.
                  {i.reporting_deadline && ` Deadline: ${formatDate(i.reporting_deadline)}`}
                </p>
              </div>
            </div>
          </Glass>
        )}

        {/* ══════════ DETAILS ══════════ */}
        <Glass dark={isDark} glow={`${sc.accent}10`} style={{ ...stg(3), padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 10, borderBottom: `1px solid ${dk.divider}` }}>
            <div style={{ width: 34, height: 34, borderRadius: 10, background: `linear-gradient(135deg, ${sc.accent}20, ${sc.accent}08)`, border: `1px solid ${sc.accent}25`, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <FileText size={16} style={{ color: sc.accent }} />
            </div>
            <p style={{ fontSize: 15, fontWeight: 700, color: dk.text }}>Incident Details</p>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
            {/* Info grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
              <InfoField label="Date" value={formatDate(i.incident_date)} icon={Calendar} color="#3b82f6" dk={dk} />
              <InfoField label="Time" value={i.incident_time} icon={Clock} color="#8b5cf6" dk={dk} />
              <InfoField label="Location" value={i.location} icon={MapPin} color="#ef4444" dk={dk} />
              <InfoField label="Type" value={formatType(i.incident_type || i.type)} icon={AlertTriangle} color="#f59e0b" dk={dk} />
              <InfoField label="Priority" value={formatType(sev)} icon={Target} color={sc.accent} dk={dk} />
              <InfoField label="Status" value={formatType(i.status || 'open')} icon={Activity} color="#10b981" dk={dk} />
            </div>

            {/* Description */}
            <Glass dark={isDark} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 }}>
                <FileText size={14} style={{ color: dk.textMuted }} />
                <p style={{ fontSize: 12, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Description</p>
              </div>
              <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.7 }}>{i.description || 'No description provided.'}</p>
            </Glass>

            {/* Photos */}
            {photos.length > 0 && (
              <Glass dark={isDark} style={{ padding: '18px 20px' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                  <Camera size={14} style={{ color: dk.textMuted }} />
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Evidence Photos</p>
                </div>
                <PhotoGallery photos={photos} accentColor={c.primary} />
              </Glass>
            )}

            {/* Add Photos */}
            {!showAddPhotos ? (
              <button onClick={() => setShowAddPhotos(true)} style={{ width: '100%', padding: '18px', borderRadius: 16, border: `2px dashed ${dk.inputBorder}`, background: 'transparent', color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
                onMouseEnter={e => { e.currentTarget.style.borderColor = c.primary; e.currentTarget.style.color = c.primary }}
                onMouseLeave={e => { e.currentTarget.style.borderColor = dk.inputBorder; e.currentTarget.style.color = dk.textMuted }}>
                <Camera size={18} /> {photos.length > 0 ? 'Add More Photos' : 'Add Evidence Photos'}
              </button>
            ) : (
              <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: '20px 22px', borderColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                  <Camera size={16} style={{ color: '#3b82f6' }} />
                  <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Add Photos</p>
                </div>
                <PhotoUploader photos={additionalPhotos} onPhotosChange={setAdditionalPhotos} bucket="incident-photos" folder={`incidents/${id}`} maxPhotos={10} accentColor={c.primary} />
                <div style={{ display: 'flex', gap: 10, marginTop: 14 }}>
                  <button onClick={() => { setShowAddPhotos(false); setAdditionalPhotos([]) }} style={{ flex: 1, padding: '13px 0', borderRadius: 12, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 13, fontWeight: 700, cursor: 'pointer' }}>Cancel</button>
                  <button onClick={handleSavePhotos} disabled={additionalPhotos.length === 0 || savingPhotos} style={{ flex: 2, padding: '13px 0', borderRadius: 12, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', boxShadow: `0 4px 16px -4px ${c.primary}50`, opacity: (additionalPhotos.length === 0 || savingPhotos) ? 0.5 : 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6 }}>
                    {savingPhotos ? <><Loader2 size={14} className="animate-spin" /> Saving...</> : <><Camera size={14} /> Save {additionalPhotos.length} Photo{additionalPhotos.length !== 1 ? 's' : ''}</>}
                  </button>
                </div>
              </Glass>
            )}
          </div>
        </Glass>

        {/* ══════════ PEOPLE INVOLVED ══════════ */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: 16, ...stg(4) }}>
          <Glass dark={isDark} glow="rgba(249,115,22,0.1)" style={{ padding: 0, overflow: 'hidden', borderColor: isDark ? 'rgba(249,115,22,0.15)' : 'rgba(249,115,22,0.2)' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${dk.divider}`, background: isDark ? 'rgba(249,115,22,0.03)' : 'rgba(249,115,22,0.02)' }}>
              <User size={14} style={{ color: '#f97316' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Participant Involved</p>
            </div>
            <div style={{ padding: '18px 20px' }}>
              {participant ? (
                <Link to={`/admin/participants/${participant.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 800, boxShadow: `0 4px 16px -4px ${c.primary}40`, flexShrink: 0 }}>{participant.first_name?.[0]}{participant.last_name?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{participant.first_name} {participant.last_name}</p>
                    <p style={{ fontSize: 12, color: c.primary, fontWeight: 600, marginTop: 2 }}>View Profile →</p>
                  </div>
                  <ChevronRight size={16} style={{ color: dk.textFaint }} />
                </Link>
              ) : <p style={{ fontSize: 13, color: dk.textFaint }}>Not specified</p>}
            </div>
          </Glass>

          <Glass dark={isDark} glow="rgba(20,184,166,0.1)" style={{ padding: 0, overflow: 'hidden', borderColor: isDark ? 'rgba(20,184,166,0.15)' : 'rgba(20,184,166,0.2)' }}>
            <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${dk.divider}`, background: isDark ? 'rgba(20,184,166,0.03)' : 'rgba(20,184,166,0.02)' }}>
              <Users size={14} style={{ color: '#14b8a6' }} />
              <p style={{ fontSize: 12, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Reported By</p>
            </div>
            <div style={{ padding: '18px 20px' }}>
              {reporter ? (
                <Link to={`/admin/staff/${reporter.id}`} style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 14 }}>
                  <div style={{ width: 48, height: 48, borderRadius: 14, background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontSize: 15, fontWeight: 800, boxShadow: `0 4px 16px -4px ${c.staff}40`, flexShrink: 0 }}>{reporter.first_name?.[0]}{reporter.last_name?.[0]}</div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{reporter.first_name} {reporter.last_name}</p>
                    <p style={{ fontSize: 12, color: c.staff, fontWeight: 600, marginTop: 2 }}>View Profile →</p>
                  </div>
                  <ChevronRight size={16} style={{ color: dk.textFaint }} />
                </Link>
              ) : <p style={{ fontSize: 13, color: dk.textFaint }}>Not specified</p>}
            </div>
          </Glass>
        </div>

        {/* ══════════ ACTION PLAN ══════════ */}
        {(i.action_taken || i.resolution || i.follow_up) && (
          <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ ...stg(5), padding: 0, overflow: 'hidden', borderColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)' }}>
            <div style={{ padding: '18px 22px', display: 'flex', alignItems: 'center', gap: 8, borderBottom: `1px solid ${dk.divider}` }}>
              <Target size={16} style={{ color: '#3b82f6' }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Action Plan</p>
            </div>
            <div style={{ padding: 22, display: 'flex', flexDirection: 'column', gap: 16 }}>
              {[
                { key: 'action_taken', label: 'Action Taken', icon: CheckCircle, color: '#10b981' },
                { key: 'resolution', label: 'Resolution', icon: Star, color: '#3b82f6' },
                { key: 'follow_up', label: 'Follow Up', icon: RefreshCw, color: '#8b5cf6' },
              ].filter(f => i[f.key]).map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: f.color, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 4, marginBottom: 6 }}><f.icon size={10} /> {f.label}</p>
                  <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.6 }}>{i[f.key]}</p>
                </div>
              ))}
            </div>
          </Glass>
        )}

        {/* ══════════ MANAGEMENT NOTES ══════════ */}
        {i.management_notes && (
          <Glass dark={isDark} style={{ ...stg(6), padding: '20px 22px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
              <Pencil size={14} style={{ color: dk.textMuted }} />
              <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Management Notes</p>
            </div>
            <p style={{ fontSize: 14, color: dk.textSoft, lineHeight: 1.7 }}>{i.management_notes}</p>
          </Glass>
        )}

        {/* ══════════ STATUS ACTIONS ══════════ */}
        {i.status !== 'resolved' && i.status !== 'closed' && (
          <div style={{ display: 'flex', gap: 12, ...stg(7) }}>
            {i.status !== 'under_review' && (
              <button onClick={() => handleStatusUpdate('under_review')} disabled={updating} style={{ flex: 1, padding: '16px 0', borderRadius: 16, fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', color: '#d97706', border: `1.5px solid ${isDark ? 'rgba(245,158,11,0.2)' : '#fde68a'}`, opacity: updating ? 0.6 : 1, transition: 'all .2s' }}
                onMouseEnter={e => { if (!updating) e.currentTarget.style.transform = 'translateY(-1px)' }}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <Clock size={16} /> Mark Under Review
              </button>
            )}
            <button onClick={() => handleStatusUpdate('resolved')} disabled={updating} style={{ flex: 1, padding: '16px 0', borderRadius: 16, border: 'none', background: 'linear-gradient(135deg, #10b981, #14b8a6)', color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, boxShadow: '0 6px 24px -6px rgba(16,185,129,0.5)', opacity: updating ? 0.6 : 1, transition: 'all .2s' }}
              onMouseEnter={e => { if (!updating) e.currentTarget.style.transform = 'translateY(-1px)' }}
              onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <CheckCircle size={16} /> {updating ? 'Updating...' : 'Mark Resolved'}
            </button>
          </div>
        )}

      </div>
    </div>
  )
}