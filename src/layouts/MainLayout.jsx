import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, UserCog, Calendar, FileText, AlertTriangle, MessageSquare, Bot, Settings, Bell, Menu, X, LogOut, Clock, CheckCircle, Upload, ClipboardList, Database, RotateCcw, Eye } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BrandLogo, { BrandHeader } from '../components/BrandLogo'
import { brand } from '../config/branding'

const baseNavItems = [
  { id: 'dashboard', path: '/admin/dashboard', label: 'Dashboard', icon: Home },
  { id: 'calendar', path: '/admin/calendar', label: 'Calendar', icon: Calendar },
  { id: 'participants', path: '/admin/participants', label: 'Participants', icon: Users },
  { id: 'staff', path: '/admin/staff', label: 'Staff', icon: UserCog },
  { id: 'availability', path: '/admin/availability', label: 'Availability', icon: Clock },
  { id: 'roster', path: '/admin/roster', label: 'Roster', icon: Calendar },
  { id: 'notes', path: '/admin/notes', label: 'Notes', icon: FileText },
  { id: 'incidents', path: '/admin/incidents', label: 'Incidents', icon: AlertTriangle },
  { id: 'forms', path: '/admin/forms', label: 'Forms', icon: ClipboardList },
  { id: 'feedback', path: '/admin/feedback', label: 'Feedback', icon: MessageSquare },
  { id: 'ai', path: '/admin/ai', label: 'AI', icon: Bot },
  { id: 'import', path: '/admin/import', label: 'Import Data', icon: Upload },
  { id: 'settings', path: '/admin/settings', label: 'Settings', icon: Settings },
]

// Demo-only nav items — only shown when VITE_BRAND_STYLE=demo
const demoNavItems = [
  { id: 'sample-data', path: '/admin/sample-data', label: 'Sample Data', icon: Database },
  { id: 'reset-demo', path: '/admin/reset-demo', label: 'Reset Demo', icon: RotateCcw },
  { id: 'preview-staff', path: '/login/staff', label: 'Preview Staff View', icon: Eye, external: true },
]

const navItems = brand.style === 'demo'
  ? [...baseNavItems, ...demoNavItems]
  : baseNavItems

const MainLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)
  const notifRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'Admin'
  const displayEmail = user?.email || ''
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'AD'
  const c = brand.colors

  useEffect(() => {
    function handleClickOutside(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    async function loadNotifications() {
      const notifs = []
      try {
        const thirtyDays = new Date(); thirtyDays.setDate(thirtyDays.getDate() + 30)
        const [incRes, fbRes, docRes, staffRes] = await Promise.allSettled([
          supabase.from('incidents').select('id, incident_type, severity, ndis_reportable, created_at').neq('status', 'resolved').order('created_at', { ascending: false }).limit(5),
          supabase.from('feedback').select('id, type, from_name, status, created_at').neq('status', 'resolved').order('created_at', { ascending: false }).limit(5),
          supabase.from('documents').select('id, name, document_type, expiry_date').lte('expiry_date', thirtyDays.toISOString()).gte('expiry_date', new Date().toISOString()).limit(5),
          supabase.from('staff').select('id, first_name, last_name, created_at').eq('status', 'pending').limit(5),
        ])
        const incidents = incRes.status === 'fulfilled' ? incRes.value?.data : null
        const feedback = fbRes.status === 'fulfilled' ? fbRes.value?.data : null
        const docs = docRes.status === 'fulfilled' ? docRes.value?.data : null
        const pendingStaff = staffRes.status === 'fulfilled' ? staffRes.value?.data : null
        if (incidents) incidents.forEach(i => { notifs.push({ id: `inc-${i.id}`, type: 'incident', icon: AlertTriangle, color: i.ndis_reportable || i.severity === 'high' || i.severity === 'critical' ? 'text-red-500' : 'text-amber-500', bg: i.ndis_reportable ? 'bg-red-50' : 'bg-amber-50', title: i.ndis_reportable ? 'NDIS Reportable Incident' : 'Open Incident', desc: i.incident_type.replace(/_/g, ' '), time: i.created_at, link: `/admin/incidents/${i.id}` }) })
        if (feedback) feedback.forEach(f => { notifs.push({ id: `fb-${f.id}`, type: 'feedback', icon: MessageSquare, color: f.type === 'complaint' ? 'text-orange-500' : 'text-teal-500', bg: f.type === 'complaint' ? 'bg-orange-50' : 'bg-teal-50', title: f.type === 'complaint' ? 'Open Complaint' : 'New Feedback', desc: `From: ${f.from_name || 'Anonymous'}`, time: f.created_at, link: '/admin/feedback' }) })
        if (docs) docs.forEach(d => { const daysLeft = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000); notifs.push({ id: `doc-${d.id}`, type: 'document', icon: Clock, color: daysLeft < 7 ? 'text-red-500' : 'text-amber-500', bg: daysLeft < 7 ? 'bg-red-50' : 'bg-amber-50', title: 'Document Expiring', desc: `${d.name} — ${daysLeft} days left`, time: d.expiry_date, link: '/admin/participants' }) })
        if (pendingStaff) pendingStaff.forEach(s => { notifs.push({ id: `staff-${s.id}`, type: 'staff', icon: UserCog, color: 'text-cyan-500', bg: 'bg-cyan-50', title: 'Pending Staff Setup', desc: `${s.first_name} ${s.last_name}`, time: s.created_at, link: '/admin/staff' }) })
      } catch (err) { console.error('Failed to load notifications:', err) }
      notifs.sort((a, b) => new Date(b.time) - new Date(a.time))
      setNotifications(notifs); setLoadingNotifs(false)
    }
    const t = setTimeout(() => loadNotifications(), 200)
    const i = setInterval(loadNotifications, 60000)
    return () => { clearTimeout(t); clearInterval(i) }
  }, [])

  const unreadCount = notifications.length
  const handleLogout = async () => { sessionStorage.clear(); localStorage.clear(); logout(); navigate('/') }
  const handleNotifClick = (link) => { setNotifOpen(false); navigate(link) }
  function timeAgo(dateStr) { const d = (new Date() - new Date(dateStr)) / 1000; if (d < 60) return 'Just now'; if (d < 3600) return `${Math.floor(d/60)}m ago`; if (d < 86400) return `${Math.floor(d/3600)}h ago`; if (d < 604800) return `${Math.floor(d/86400)}d ago`; return new Date(dateStr).toLocaleDateString('en-AU') }

  const NotifBell = ({ className = '' }) => (
    <div className="relative" ref={notifRef}>
      <button onClick={() => setNotifOpen(!notifOpen)} className={`p-2 rounded-xl bg-gray-100 hover:bg-gray-200 relative ${className}`}>
        <Bell size={20} className="text-gray-600" />
        {unreadCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">{unreadCount > 9 ? '9+' : unreadCount}</span>}
      </button>
      {notifOpen && (
        <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-12 w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden">
          <div className="p-3 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800 text-sm">Notifications</h3><span className="text-[10px] text-gray-400">{unreadCount} active</span></div>
          <div className="max-h-96 overflow-y-auto">
            {loadingNotifs ? (<div className="p-6 text-center"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: c.staff, borderTopColor: 'transparent' }} /></div>)
            : notifications.length > 0 ? notifications.slice(0,15).map(n => (
              <button key={n.id} onClick={() => handleNotifClick(n.link)} className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                <div className={`p-1.5 rounded-lg ${n.bg} shrink-0 mt-0.5`}><n.icon size={14} className={n.color} /></div>
                <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-xs">{n.title}</p><p className="text-[11px] text-gray-500 truncate">{n.desc}</p><p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.time)}</p></div>
              </button>
            )) : (<div className="p-8 text-center"><CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" /><p className="text-sm text-gray-500 font-medium">All clear!</p></div>)}
          </div>
          <div className="p-2 border-t border-gray-100"><button onClick={() => { setNotifOpen(false); navigate('/admin/settings') }} className="w-full py-2 text-xs font-semibold rounded-lg transition-colors" style={{ color: c.primary }}>Notification Settings</button></div>
        </div>
      )}
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom right, ${c.adminBg}, white, ${c.staffBg})` }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: c.primary, opacity: 0.08 }} />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: c.staff, opacity: 0.08 }} />
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-40 lg:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 z-50 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} lg:translate-x-0`}>
        <div className="flex flex-col h-full">
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center justify-between">
              <BrandHeader variant="admin" logoSize={36} subtitle="Support Management" />
              <button onClick={() => setSidebarOpen(false)} className="lg:hidden p-1.5 rounded-lg hover:bg-gray-100"><X size={20} className="text-gray-500" /></button>
            </div>
          </div>
          <nav className="flex-1 p-3 overflow-y-auto"><div className="space-y-1">
            {navItems.map(item => {
              const badgeCount = notifications.filter(n => (item.id === 'incidents' && n.type === 'incident') || (item.id === 'feedback' && n.type === 'feedback') || (item.id === 'notes' && n.type === 'note') || (item.id === 'staff' && n.type === 'staff')).length
              return (
                <NavLink key={item.id} to={item.path} onClick={() => setSidebarOpen(false)}
                  className={({ isActive }) => `flex items-center gap-2.5 px-3 py-2.5 rounded-xl font-medium text-sm transition-all ${isActive ? 'text-white shadow-lg' : 'text-gray-600 hover:bg-white/80 hover:shadow'}`}
                  style={({ isActive }) => isActive ? { background: `linear-gradient(to right, ${c.primary}, ${c.adminHover})`, boxShadow: `0 4px 14px -3px ${c.primary}40` } : {}}>
                  <item.icon size={18} /><span className="flex-1">{item.label}</span>
                  {badgeCount > 0 && <span className="px-1.5 py-0.5 rounded-full text-[10px] font-bold bg-red-100 text-red-600">{badgeCount}</span>}
                </NavLink>
              )
            })}
          </div></nav>
          <div className="p-3 border-t border-gray-200">
            <div className="flex items-center justify-between p-2.5 rounded-xl bg-gray-50">
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow shrink-0" style={{ background: `linear-gradient(to bottom right, ${c.staff}, ${c.staffHover})` }}>{initials}</div>
                <div className="min-w-0"><p className="font-semibold text-gray-800 text-sm truncate">{displayName}</p><p className="text-[10px] text-gray-400 truncate">{displayEmail}</p></div>
              </div>
              <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-gray-200 transition-colors shrink-0"><LogOut size={16} className="text-gray-500" /></button>
            </div>
          </div>
        </div>
      </aside>

      <div className="lg:pl-64 min-h-screen flex flex-col relative z-10">
        {brand.style === 'demo' && (
          <div className="bg-indigo-600 text-white text-center py-1.5 text-xs font-semibold tracking-wide z-40 relative">
            DEMO MODE — This instance contains sample data for demonstration purposes
          </div>
        )}
        <header className="lg:hidden fixed top-0 left-0 right-0 z-30 p-3 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm" style={brand.style === 'demo' ? { top: '32px' } : {}}>
          <div className="flex items-center justify-between">
            <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200"><Menu size={20} className="text-gray-600" /></button>
            <div className="flex items-center gap-2"><BrandLogo variant="admin" size={32} /><span className="font-bold text-gray-800 text-sm">{brand.appName}</span></div>
            <NotifBell />
          </div>
        </header>
        <header className="hidden lg:flex fixed top-0 left-64 right-0 z-30 p-4 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm items-center justify-between">
          <h1 className="text-lg font-bold text-gray-800 capitalize">
            {(() => { const p = location.pathname; if (p.includes('/dashboard')) return 'Dashboard'; if (p.includes('/calendar')) return 'Calendar'; if (p.includes('/participants/')) return 'Participant Details'; if (p.includes('/participants')) return 'Participants'; if (p.includes('/staff/')) return 'Staff Details'; if (p.includes('/staff')) return 'Staff'; if (p.includes('/roster/shift/')) return 'Shift Details'; if (p.includes('/roster')) return 'Roster'; if (p.includes('/notes')) return 'Notes'; if (p.includes('/incidents/')) return 'Incident Details'; if (p.includes('/incidents')) return 'Incidents'; if (p.includes('/feedback')) return 'Feedback'; if (p.includes('/ai')) return 'AI Assistant'; if (p.includes('/import')) return 'Import Data'; if (p.includes('/settings')) return 'Settings'; if (p.includes('/sample-data')) return 'Sample Data'; if (p.includes('/reset-demo')) return 'Reset Demo'; return 'Dashboard' })()}
          </h1>
          <div className="flex items-center gap-3"><span className="text-sm text-gray-500">{displayName}</span><NotifBell /></div>
        </header>
        <main className="flex-1 p-3 md:p-4 lg:p-6 pt-[72px] lg:pt-[88px]"><Outlet /></main>
      </div>
    </div>
  )
}

export default MainLayout