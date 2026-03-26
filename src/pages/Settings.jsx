import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2, Shield, Users, LogOut, Save, Loader2, Lock, Bell, CheckCircle,
  User, Mail, Phone, Hash, MapPin, FileText, AlertTriangle, Zap, Settings as SettingsIcon,
  ChevronRight, Eye, EyeOff, Database, Download, Key, Activity, Globe, Briefcase
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import DataExport from '../components/DataExport'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM COMPONENTS
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{
      background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${border}`, borderRadius: '1.25rem',
      boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
      transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
      ...style,
    }}
    onMouseEnter={hover ? e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)'
    } : undefined}
    onMouseLeave={hover ? e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)'
    } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{
    position: 'absolute', width: size, height: size, top, left, right, bottom,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: 0.12, borderRadius: '50%',
    animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none', zIndex: 0,
  }} />)
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
  }
  const p = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: p.bg, color: p.text, border: `1px solid ${p.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}


/* ─────────────────────────────────────────────
   TOGGLE SWITCH
   ───────────────────────────────────────────── */

function Toggle({ checked, onChange, color, dark }) {
  return (
    <button onClick={onChange} style={{
      width: 48, height: 26, borderRadius: 999, position: 'relative',
      background: checked ? color : (dark ? 'rgba(51,65,85,0.6)' : '#d1d5db'),
      border: 'none', cursor: 'pointer', transition: 'background .25s ease',
      flexShrink: 0,
      boxShadow: checked ? `0 0 12px ${color}30` : 'none',
    }}>
      <div style={{
        width: 20, height: 20, borderRadius: '50%', background: 'white',
        position: 'absolute', top: 3,
        left: checked ? 25 : 3,
        transition: 'left .25s cubic-bezier(.16,1,.3,1)',
        boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
      }} />
    </button>
  )
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function Settings() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [saving, setSaving] = useState(false)
  const [savingCompliance, setSavingCompliance] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [authUser, setAuthUser] = useState(null)
  const [staffProfile, setStaffProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })
  const [showPass, setShowPass] = useState(false)
  const [org, setOrg] = useState({ company_name: '', abn: '', ndis_provider_number: '', phone: '', email: '', address: '' })
  const [compliance, setCompliance] = useState({ require_shift_notes_24h: true, document_expiry_alerts: true, incident_reporting_mandatory: true, auto_flag_ndis_reportable: true })

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

  const inputStyle = {
    width: '100%', padding: '12px 14px', background: dk.inputBg,
    border: `1.5px solid ${dk.inputBorder}`, borderRadius: 12,
    fontSize: 13, fontWeight: 600, color: dk.text, outline: 'none',
    transition: 'all .2s',
  }


  /* ═══════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED
     ═══════════════════════════════════════════════ */

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setAuthUser(user)
        if (user) {
          const { data: staff } = await supabase.from('staff').select('*').eq('auth_id', user.id).maybeSingle()
          setStaffProfile(staff)
          if (staff) setProfileForm({ first_name: staff.first_name || '', last_name: staff.last_name || '', email: staff.email || '', phone: staff.phone || '' })
        }
        const { data: orgData } = await supabase.from('organizations').select('*').limit(1).maybeSingle()
        if (orgData) {
          setOrg({ company_name: orgData.company_name || '', abn: orgData.abn || '', ndis_provider_number: orgData.ndis_provider_number || '', phone: orgData.phone || '', email: orgData.email || '', address: orgData.address || '' })
          if (orgData.compliance_settings) setCompliance({ ...compliance, ...orgData.compliance_settings })
        }
      } catch (err) { console.error('Failed to load settings:', err) }
      finally { setLoading(false); setTimeout(() => setLoaded(true), 50) }
    }
    load()
  }, [])

  const showSaved = (msg) => { setSavedMsg(msg); setTimeout(() => setSavedMsg(''), 3000) }

  const handleSaveOrg = async () => {
    setSaving(true)
    try {
      const { error } = await supabase.from('organizations').upsert({ id: 1, ...org, compliance_settings: compliance, updated_at: new Date().toISOString() })
      if (error) throw error
      showSaved('Organization settings saved!')
    } catch (err) { alert('Failed to save: ' + (err.message || 'Unknown error')) }
    finally { setSaving(false) }
  }

  const handleToggleCompliance = async (key) => {
    const updated = { ...compliance, [key]: !compliance[key] }
    setCompliance(updated)
    setSavingCompliance(true)
    try {
      const { error } = await supabase.from('organizations').upsert({ id: 1, ...org, compliance_settings: updated, updated_at: new Date().toISOString() })
      if (error) throw error
      showSaved('Compliance setting updated!')
    } catch (err) { console.error('Failed to save compliance:', err) }
    finally { setSavingCompliance(false) }
  }

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) { alert('Please fill in both password fields'); return }
    if (passwords.newPassword !== passwords.confirmPassword) { alert('Passwords do not match'); return }
    if (passwords.newPassword.length < 6) { alert('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPasswords({ newPassword: '', confirmPassword: '' })
      showSaved('Password changed successfully!')
    } catch (err) { alert('Failed to change password: ' + (err.message || 'Unknown error')) }
    finally { setChangingPassword(false) }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      const { error: staffError } = await supabase.from('staff').update({
        first_name: profileForm.first_name, last_name: profileForm.last_name,
        email: profileForm.email, phone: profileForm.phone,
        updated_at: new Date().toISOString(),
      }).eq('id', staffProfile.id)
      if (staffError) throw staffError
      if (profileForm.email !== authUser.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: profileForm.email })
        if (authError) throw authError
      }
      const { data: updated } = await supabase.from('staff').select('*').eq('id', staffProfile.id).maybeSingle()
      if (updated) setStaffProfile(updated)
      showSaved('Profile updated!')
    } catch (err) { alert('Failed to update profile: ' + (err.message || 'Unknown error')) }
    finally { setSavingProfile(false) }
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    await supabase.auth.signOut()
    navigate('/')
  }


  /* ─── Loading ─── */
  if (loading) return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '60vh', gap: 16 }}>
      <div style={{ position: 'relative' }}>
        <div style={{ width: 72, height: 72, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}>
          <SettingsIcon size={32} color="white" />
        </div>
        <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
      </div>
      <p style={{ color: dk.textMuted, fontSize: 14, fontWeight: 600 }}>Loading settings...</p>
    </div>
  )


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes slideIn { from { opacity:0;transform:translateY(-8px) } to { opacity:1;transform:translateY(0) } }
        .saved-toast { animation: slideIn .3s ease-out forwards }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={260} bottom="20%" left="-60px" delay={2} />
      <Orb color="#8b5cf6" size={200} top="40%" right="5%" delay={3.5} />
      <Orb color="#10b981" size={160} bottom="10%" left="35%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════════════════════════════════════
            HERO BANNER
            ══════════════════════════════════════════ */}
        <div style={stg(0)}>
          <div style={{
            borderRadius: 24, padding: '32px 28px', position: 'relative', overflow: 'hidden',
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', width: 100, height: 100, borderRadius: '50%', background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)', top: 30, left: '55%', animation: 'orbFloat 8s ease-in-out infinite' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '22%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '30%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}

            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <SettingsIcon size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Administration</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                  <Shield size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Secure</span>
                </div>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: 16 }}>
                <div>
                  <h1 style={{ fontSize: 32, fontWeight: 900, color: 'white', letterSpacing: '-0.02em', lineHeight: 1.15 }}>Settings</h1>
                  <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 6 }}>Manage your organization, profile, and compliance</p>
                </div>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 22 }}>
                {[
                  { icon: User, text: staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Admin' },
                  { icon: Building2, text: org.company_name || 'Organization' },
                  { icon: Shield, text: 'NDIS Compliant', bg: 'rgba(16,185,129,0.25)' },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Saved toast */}
        {savedMsg && (
          <div className="saved-toast" style={{
            position: 'fixed', top: 24, right: 24, zIndex: 999,
            display: 'flex', alignItems: 'center', gap: 10,
            padding: '14px 22px', borderRadius: 16,
            background: isDark ? 'rgba(16,185,129,0.15)' : '#ecfdf5',
            border: `1px solid ${isDark ? 'rgba(16,185,129,0.3)' : '#a7f3d0'}`,
            backdropFilter: 'blur(20px)',
            boxShadow: '0 12px 40px -8px rgba(16,185,129,0.3)',
          }}>
            <CheckCircle size={18} style={{ color: '#10b981' }} />
            <span style={{ fontSize: 14, fontWeight: 700, color: '#10b981' }}>{savedMsg}</span>
          </div>
        )}


        {/* ══════════════════════════════════════════
            PROFILE SECTION
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow={`${c.staff}12`} style={{ ...stg(1), padding: 0, overflow: 'hidden' }}>
          {/* Section header */}
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px -4px ${c.staff}40`,
            }}>
              <User size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Profile</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Your personal information</p>
            </div>
            <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
              <Badge color="teal" dark={isDark}>{staffProfile?.role || 'Admin'}</Badge>
              <Badge color="green" dark={isDark}>{staffProfile?.status || '—'}</Badge>
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { label: 'First Name', key: 'first_name', icon: User },
                { label: 'Last Name', key: 'last_name', icon: User },
                { label: 'Email', key: 'email', type: 'email', icon: Mail },
                { label: 'Phone', key: 'phone', type: 'tel', icon: Phone },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <f.icon size={11} /> {f.label}
                  </p>
                  <input type={f.type || 'text'} value={profileForm[f.key]}
                    onChange={e => setProfileForm({ ...profileForm, [f.key]: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = c.staff}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                  {f.key === 'email' && profileForm.email !== authUser?.email && (
                    <p style={{ fontSize: 11, fontWeight: 600, color: '#d97706', marginTop: 4, display: 'flex', alignItems: 'center', gap: 4 }}>
                      <AlertTriangle size={11} /> Changing email will require re-verification
                    </p>
                  )}
                </div>
              ))}
            </div>

            <button onClick={handleSaveProfile} disabled={savingProfile} style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${c.staff}, ${c.staffHover})`,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 6px 24px -6px ${c.staff}50`, opacity: savingProfile ? 0.6 : 1,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {savingProfile ? 'Saving...' : 'Save Profile'}
            </button>
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            ORGANIZATION SECTION
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow={`${c.primary}12`} style={{ ...stg(2), padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: `0 4px 14px -4px ${c.primary}40`,
            }}>
              <Building2 size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Organization</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Company and NDIS registration details</p>
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { label: 'Company Name', key: 'company_name', icon: Building2 },
                { label: 'ABN', key: 'abn', icon: Hash },
                { label: 'NDIS Provider Number', key: 'ndis_provider_number', icon: Shield },
                { label: 'Phone', key: 'phone', type: 'tel', icon: Phone },
                { label: 'Email', key: 'email', type: 'email', icon: Mail },
                { label: 'Address', key: 'address', icon: MapPin },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <f.icon size={11} /> {f.label}
                  </p>
                  <input type={f.type || 'text'} value={org[f.key]}
                    onChange={e => setOrg({ ...org, [f.key]: e.target.value })}
                    style={inputStyle}
                    onFocus={e => e.target.style.borderColor = c.primary}
                    onBlur={e => e.target.style.borderColor = dk.inputBorder} />
                </div>
              ))}
            </div>

            <button onClick={handleSaveOrg} disabled={saving} style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 14, border: 'none',
              background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: `0 6px 24px -6px ${c.primary}50`, opacity: saving ? 0.6 : 1,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
              {saving ? 'Saving...' : 'Save Organization'}
            </button>
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            COMPLIANCE SECTION
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow="rgba(245,158,11,0.12)" style={{ ...stg(3), padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #f59e0b, #fbbf24)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px -4px rgba(245,158,11,0.4)',
            }}>
              <Shield size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>NDIS Compliance</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Automated compliance rules and alerts</p>
            </div>
            {savingCompliance && (
              <div style={{ marginLeft: 'auto' }}>
                <Loader2 size={16} className="animate-spin" style={{ color: '#f59e0b' }} />
              </div>
            )}
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 12 }}>
            {[
              { key: 'require_shift_notes_24h', label: 'Require shift notes within 24 hours', desc: 'Staff must submit notes after shift completion', icon: FileText, color: '#3b82f6' },
              { key: 'document_expiry_alerts', label: 'Document expiry alerts', desc: 'Send alerts when staff documents are expiring', icon: Bell, color: '#f59e0b' },
              { key: 'incident_reporting_mandatory', label: 'Incident reporting mandatory', desc: 'All incidents must be logged within 24 hours', icon: AlertTriangle, color: '#ef4444' },
              { key: 'auto_flag_ndis_reportable', label: 'Auto-flag NDIS reportable incidents', desc: 'Automatically identify reportable incidents', icon: Shield, color: '#8b5cf6' },
            ].map(setting => (
              <div key={setting.key} style={{
                padding: '18px 20px', borderRadius: 14,
                background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}`,
                display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14,
                transition: 'all .2s',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
                  <div style={{
                    width: 36, height: 36, borderRadius: 10, flexShrink: 0,
                    background: `${setting.color}15`, border: `1px solid ${setting.color}25`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <setting.icon size={18} style={{ color: setting.color }} />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{setting.label}</p>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>{setting.desc}</p>
                  </div>
                </div>
                <Toggle
                  checked={compliance[setting.key]}
                  onChange={() => handleToggleCompliance(setting.key)}
                  color={setting.color}
                  dark={isDark}
                />
              </div>
            ))}
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            CHANGE PASSWORD
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow="rgba(139,92,246,0.12)" style={{ ...stg(4), padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px -4px rgba(139,92,246,0.4)',
            }}>
              <Key size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Change Password</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Update your account password</p>
            </div>
          </div>

          <div style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 14 }}>
              {[
                { label: 'New Password', key: 'newPassword', placeholder: 'Min 6 characters' },
                { label: 'Confirm Password', key: 'confirmPassword', placeholder: 'Re-enter password' },
              ].map(f => (
                <div key={f.key}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: dk.textMuted, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.04em', display: 'flex', alignItems: 'center', gap: 5 }}>
                    <Lock size={11} /> {f.label}
                  </p>
                  <div style={{ position: 'relative' }}>
                    <input
                      type={showPass ? 'text' : 'password'}
                      value={passwords[f.key]}
                      onChange={e => setPasswords({ ...passwords, [f.key]: e.target.value })}
                      placeholder={f.placeholder}
                      style={{ ...inputStyle, paddingRight: 44 }}
                      onFocus={e => e.target.style.borderColor = '#8b5cf6'}
                      onBlur={e => e.target.style.borderColor = dk.inputBorder}
                    />
                    <button onClick={() => setShowPass(!showPass)} style={{
                      position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)',
                      background: 'none', border: 'none', cursor: 'pointer', color: dk.textFaint, padding: 4,
                    }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <button onClick={handleChangePassword} disabled={changingPassword} style={{
              alignSelf: 'flex-start', display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 24px -6px rgba(139,92,246,0.5)', opacity: changingPassword ? 0.6 : 1,
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
              {changingPassword ? 'Changing...' : 'Change Password'}
            </button>
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            DATA EXPORT
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} glow="rgba(59,130,246,0.12)" style={{ ...stg(5), padding: 0, overflow: 'hidden' }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${dk.divider}`,
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #3b82f6, #60a5fa)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px -4px rgba(59,130,246,0.4)',
            }}>
              <Database size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Data Export</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Download your organization data</p>
            </div>
          </div>
          <div style={{ padding: 24 }}>
            <DataExport />
          </div>
        </Glass>


        {/* ══════════════════════════════════════════
            SIGN OUT / DANGER ZONE
            ══════════════════════════════════════════ */}
        <Glass dark={isDark} style={{
          ...stg(6), padding: 0, overflow: 'hidden',
          borderColor: isDark ? 'rgba(239,68,68,0.2)' : 'rgba(239,68,68,0.25)',
        }}>
          <div style={{
            padding: '20px 24px', display: 'flex', alignItems: 'center', gap: 12,
            borderBottom: `1px solid ${isDark ? 'rgba(239,68,68,0.15)' : 'rgba(239,68,68,0.1)'}`,
            background: isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)',
          }}>
            <div style={{
              width: 40, height: 40, borderRadius: 12,
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 14px -4px rgba(239,68,68,0.4)',
            }}>
              <LogOut size={20} color="white" />
            </div>
            <div>
              <h3 style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Account Actions</h3>
              <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 1 }}>Sign out of your admin account</p>
            </div>
          </div>

          <div style={{ padding: 24 }}>
            <button onClick={handleLogout} style={{
              display: 'flex', alignItems: 'center', gap: 8,
              padding: '13px 24px', borderRadius: 14, border: 'none',
              background: 'linear-gradient(135deg, #ef4444, #f87171)',
              color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer',
              boxShadow: '0 6px 24px -6px rgba(239,68,68,0.5)',
              transition: 'all .2s',
            }}
            onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
            onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
              <LogOut size={16} /> Sign Out
            </button>
          </div>
        </Glass>

      </div>
    </div>
  )
}