import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, Users, UserCog, Calendar, FileText, AlertTriangle, MessageSquare, Bot, Settings, Bell, Menu, X, LogOut, Clock, CheckCircle, Upload, ClipboardList, Database, RotateCcw, Eye, ChevronDown } from 'lucide-react'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'
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
  { id: 'import', path: '/admin/import', label: 'Import', icon: Upload },
  { id: 'settings', path: '/admin/settings', label: 'Settings', icon: Settings },
]

const demoNavItems = [
  { id: 'sample-data', path: '/admin/sample-data', label: 'Samples', icon: Database },
  { id: 'reset-demo', path: '/admin/reset-demo', label: 'Reset', icon: RotateCcw },
  { id: 'preview-staff', path: '/login/staff', label: 'Staff View', icon: Eye },
]

const navItems = brand.style === 'demo'
  ? [...baseNavItems, ...demoNavItems]
  : baseNavItems

const MainLayout = () => {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const [notifications, setNotifications] = useState([])
  const [loadingNotifs, setLoadingNotifs] = useState(true)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const notifRef = useRef(null)
  const userMenuRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { user, logout } = useAuth()

  const displayName = user ? `${user.first_name} ${user.last_name}` : 'Admin'
  const displayEmail = user?.email || ''
  const initials = user ? `${user.first_name?.[0] || ''}${user.last_name?.[0] || ''}` : 'AD'
  const c = brand.colors

  useEffect(() => {
    function handleClickOutside(e) {
      if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false)
      if (userMenuRef.current && !userMenuRef.current.contains(e.target)) setUserMenuOpen(false)
    }
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

  const demoBannerH = brand.style === 'demo' ? 28 : 0
  const topBarH = 56

  return (
    <div className="min-h-screen bg-gray-50">

      {/* ===== FIXED HEADER BLOCK ===== */}
      <div className="fixed top-0 left-0 right-0 z-50">

        {/* Demo banner */}
        {brand.style === 'demo' && (
          <div className="text-white text-center text-[11px] font-semibold tracking-widest uppercase flex items-center justify-center" style={{ height: demoBannerH, background: c.primary }}>
            Demo Mode — Sample data for demonstration
          </div>
        )}

        {/* ===== DESKTOP NAV ===== */}
        <div className="hidden lg:block bg-white border-b border-gray-200 shadow-sm" style={{ height: topBarH }}>
          <div className="h-full px-5 flex items-center">

            {/* Left: Logo */}
            <NavLink to="/admin/dashboard" className="flex items-center gap-2.5 shrink-0 mr-8 hover:opacity-80 transition-opacity">
              <BrandLogo variant="admin" size={30} />
              <span className="font-bold text-gray-800 text-[15px] tracking-tight">{brand.appName}</span>
            </NavLink>

            {/* Center: Nav items with icon + short label */}
            <nav className="flex items-center gap-1 flex-1 overflow-x-auto no-scrollbar">
              {navItems.map(item => {
                const active = location.pathname.startsWith(item.path)
                const badgeCount = notifications.filter(n => (item.id === 'incidents' && n.type === 'incident') || (item.id === 'feedback' && n.type === 'feedback') || (item.id === 'notes' && n.type === 'note') || (item.id === 'staff' && n.type === 'staff')).length
                return (
                  <NavLink key={item.id} to={item.path}
                    className={`relative flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[12px] font-semibold whitespace-nowrap transition-all shrink-0 ${active ? 'text-white shadow-md' : 'text-gray-500 hover:text-gray-800 hover:bg-gray-100'}`}
                    style={active ? { background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, boxShadow: `0 2px 8px -2px ${c.primary}50` } : {}}>
                    <item.icon size={16} strokeWidth={active ? 2.5 : 2} />
                    <span>{item.label}</span>
                    {badgeCount > 0 && <span className={`w-2 h-2 rounded-full ${active ? 'bg-white/70' : 'bg-red-500'}`} />}
                  </NavLink>
                )
              })}
            </nav>

            {/* Right: Notifications + User */}
            <div className="flex items-center gap-1 ml-4 shrink-0">
              {/* Notifications */}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 rounded-lg hover:bg-gray-100 relative transition-colors">
                  <Bell size={19} className="text-gray-500" />
                  {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div className="absolute right-0 top-11 w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden">
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

              {/* Divider */}
              <div className="w-px h-7 bg-gray-200 mx-1" />

              {/* User dropdown */}
              <div className="relative" ref={userMenuRef}>
                <button onClick={() => setUserMenuOpen(!userMenuOpen)} className="flex items-center gap-2 p-1.5 pr-2.5 rounded-lg hover:bg-gray-100 transition-colors">
                  <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-[10px] font-bold" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>{initials}</div>
                  <ChevronDown size={13} className="text-gray-400" />
                </button>
                {userMenuOpen && (
                  <div className="absolute right-0 top-11 w-56 bg-white rounded-xl shadow-xl border border-gray-200 z-[100] overflow-hidden">
                    <div className="p-3 border-b border-gray-100">
                      <p className="font-semibold text-gray-800 text-sm">{displayName}</p>
                      <p className="text-xs text-gray-400 truncate">{displayEmail}</p>
                    </div>
                    <div className="p-1">
                      <button onClick={() => { setUserMenuOpen(false); navigate('/admin/settings') }} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors"><Settings size={15} /> Settings</button>
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 text-sm text-red-600 hover:bg-red-50 rounded-lg transition-colors"><LogOut size={15} /> Sign out</button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ===== MOBILE HEADER ===== */}
        <div className="lg:hidden bg-white border-b border-gray-200 shadow-sm" style={{ height: topBarH }}>
          <div className="h-full px-3 flex items-center justify-between">
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 rounded-lg hover:bg-gray-100">
              {mobileMenuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
            </button>
            <div className="flex items-center gap-2">
              <BrandLogo variant="admin" size={26} />
              <span className="font-bold text-gray-800 text-sm">{brand.appName}</span>
            </div>
            <div className="relative" ref={notifRef}>
              <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 rounded-lg hover:bg-gray-100 relative">
                <Bell size={19} className="text-gray-500" />
                {unreadCount > 0 && <span className="absolute top-0.5 right-0.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">{unreadCount > 9 ? '9+' : unreadCount}</span>}
              </button>
              {notifOpen && (
                <div className="fixed right-2 w-[calc(100vw-1rem)] bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden" style={{ top: demoBannerH + topBarH + 4 }}>
                  <div className="p-3 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800 text-sm">Notifications</h3><span className="text-[10px] text-gray-400">{unreadCount} active</span></div>
                  <div className="max-h-72 overflow-y-auto">
                    {loadingNotifs ? (<div className="p-6 text-center"><div className="w-5 h-5 border-2 border-t-transparent rounded-full animate-spin mx-auto" style={{ borderColor: c.staff, borderTopColor: 'transparent' }} /></div>)
                    : notifications.length > 0 ? notifications.slice(0,10).map(n => (
                      <button key={n.id} onClick={() => handleNotifClick(n.link)} className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                        <div className={`p-1.5 rounded-lg ${n.bg} shrink-0 mt-0.5`}><n.icon size={14} className={n.color} /></div>
                        <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-xs">{n.title}</p><p className="text-[11px] text-gray-500 truncate">{n.desc}</p><p className="text-[10px] text-gray-400 mt-0.5">{timeAgo(n.time)}</p></div>
                      </button>
                    )) : (<div className="p-6 text-center"><CheckCircle size={24} className="text-emerald-400 mx-auto mb-1" /><p className="text-sm text-gray-500">All clear!</p></div>)}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* ===== MOBILE MENU DROPDOWN ===== */}
      {mobileMenuOpen && (
        <>
          <div className="fixed inset-0 bg-black/30 z-40 lg:hidden" onClick={() => setMobileMenuOpen(false)} />
          <div className="fixed left-0 right-0 z-45 bg-white border-b border-gray-200 shadow-xl lg:hidden overflow-y-auto" style={{ top: demoBannerH + topBarH, maxHeight: `calc(100vh - ${demoBannerH + topBarH}px)` }}>
            <nav className="p-2">
              {navItems.map(item => {
                const active = location.pathname.startsWith(item.path)
                return (
                  <NavLink key={item.id} to={item.path} onClick={() => setMobileMenuOpen(false)}
                    className={`flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all ${active ? 'text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                    style={active ? { background: c.primary } : {}}>
                    <item.icon size={18} />
                    {item.label}
                  </NavLink>
                )
              })}
            </nav>
            <div className="p-3 border-t border-gray-100 flex items-center justify-between px-4">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-xs font-bold" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>{initials}</div>
                <div><p className="font-semibold text-gray-800 text-sm">{displayName}</p><p className="text-[10px] text-gray-400">{displayEmail}</p></div>
              </div>
              <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-gray-100"><LogOut size={18} className="text-gray-500" /></button>
            </div>
          </div>
        </>
      )}

      {/* ===== MAIN CONTENT ===== */}
      <main className="px-4 lg:px-8 py-6" style={{ paddingTop: demoBannerH + topBarH + 24 }}>
        <Outlet />
      </main>

      {/* ===== HIDE SCROLLBAR CSS ===== */}
      <style>{`.no-scrollbar::-webkit-scrollbar{display:none}.no-scrollbar{-ms-overflow-style:none;scrollbar-width:none}`}</style>
    </div>
  )
}

export default MainLayout