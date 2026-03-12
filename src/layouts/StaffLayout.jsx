import { useState, useEffect, useRef } from 'react'
import { Outlet, NavLink, useLocation, useNavigate } from 'react-router-dom'
import { Home, Calendar, FileText, Clock, User, Bell, Menu, X, LogOut, Briefcase, CheckCircle, Activity, Loader2 } from 'lucide-react'
import { useStaff } from '../context/StaffContext'
import BrandLogo, { BrandHeader } from '../components/BrandLogo'
import { brand } from '../config/branding'

const navItems = [
  { id: 'dashboard', path: '/staff/dashboard', label: 'Dashboard', icon: Home },
  { id: 'shifts', path: '/staff/shifts', label: 'My Shifts', icon: Calendar },
  { id: 'notes', path: '/staff/notes', label: 'Notes', icon: FileText },
  { id: 'participant-docs', path: '/staff/participant-docs', label: 'Participant Docs', icon: Briefcase },
  { id: 'availability', path: '/staff/availability', label: 'Availability', icon: Clock },
  { id: 'timeoff', path: '/staff/time-off', label: 'Time Off', icon: Clock },
  { id: 'calendar', path: '/staff/calendar', label: 'Calendar', icon: Calendar },
  { id: 'forms', path: '/staff/forms', label: 'Forms', icon: CheckCircle },
  { id: 'profile', path: '/staff/profile', label: 'My Profile', icon: User },
]

const StaffLayout = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [notifOpen, setNotifOpen] = useState(false)
  const notifRef = useRef(null)
  const location = useLocation()
  const navigate = useNavigate()
  const { loading, staffProfile, staffName, initials, handleLogout, pendingNotes, inProgressShift, upcomingShifts } = useStaff()
  const c = brand.colors

  useEffect(() => {
    function handleClickOutside(e) { if (notifRef.current && !notifRef.current.contains(e.target)) setNotifOpen(false) }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const notifications = []
  pendingNotes.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `note-${s.id}`, icon: FileText, color: 'text-amber-500', bg: 'bg-amber-50', title: 'Shift note overdue', desc: pName, link: '/staff/notes', urgent: true })
  })
  const todayStr = new Date().toISOString().split('T')[0]
  upcomingShifts.filter(s => s.shift_date === todayStr).forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `shift-${s.id}`, icon: Calendar, color: 'text-emerald-500', bg: 'bg-emerald-50', title: 'Shift today', desc: pName, link: '/staff/shifts' })
  })
  if (inProgressShift) notifications.push({ id: 'active', icon: Activity, color: 'text-green-500', bg: 'bg-green-50', title: 'Shift in progress', desc: "Don't forget to clock out", link: '/staff/shifts' })
  const notifCount = notifications.filter(n => n.urgent).length || notifications.length

  const pageTitles = { '/staff/dashboard': 'Dashboard', '/staff/shifts': 'My Shifts', '/staff/notes': 'Shift Notes', '/staff/participant-docs': 'Participant Documents', '/staff/availability': 'Availability', '/staff/time-off': 'Time Off', '/staff/calendar': 'Calendar', '/staff/forms': 'Forms', '/staff/profile': 'My Profile' }
  const pageTitle = pageTitles[location.pathname] || 'Staff Portal'

  if (loading) return (
    <div className="min-h-screen flex flex-col items-center justify-center" style={{ background: `linear-gradient(to bottom right, ${c.staffBg}, white, ${c.staffBg})` }}>
      <BrandLogo variant="staff" size={64} className="animate-pulse" />
      <p className="mt-4 text-sm font-medium text-gray-400 animate-pulse">Loading your portal...</p>
    </div>
  )

  return (
    <div className="min-h-screen" style={{ background: `linear-gradient(to bottom right, ${c.staffBg}, white, ${c.staffBg})` }}>
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: c.staff, opacity: 0.08 }} />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: c.staffHover, opacity: 0.08 }} />
      </div>
      {sidebarOpen && <div className="fixed inset-0 bg-black/50 z-30 md:hidden" onClick={() => setSidebarOpen(false)} />}

      <aside className={`fixed top-0 left-0 h-full w-64 bg-white/95 backdrop-blur-xl border-r border-gray-200 z-40 transform transition-transform duration-300 ${sidebarOpen ? 'translate-x-0' : '-translate-x-full'} md:translate-x-0`}>
        <div className="p-4 border-b border-gray-100">
          <BrandHeader variant="staff" logoSize={40} subtitle="Staff Portal" />
        </div>
        {inProgressShift && (
          <div className="mx-3 mt-3 p-2.5 rounded-xl shadow-lg" style={{ background: `linear-gradient(to right, ${c.staff}, ${c.staffHover})`, boxShadow: `0 4px 14px -3px ${c.staff}40` }}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" /><span className="relative h-2 w-2 rounded-full bg-white" /></span>
              <span className="text-xs font-bold text-white">On Shift</span>
            </div>
          </div>
        )}
        <nav className="p-3 space-y-1 mt-2">
          {navItems.map(item => (
            <NavLink key={item.id} to={item.path} onClick={() => setSidebarOpen(false)}
              className={({ isActive }) => `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${isActive ? 'text-white shadow-lg' : 'text-gray-600 hover:bg-gray-50'}`}
              style={({ isActive }) => isActive ? { background: `linear-gradient(to right, ${c.staff}, ${c.staffHover})`, boxShadow: `0 4px 14px -3px ${c.staff}40` } : {}}>
              <item.icon size={18} /><span>{item.label}</span>
              {item.id === 'notes' && pendingNotes.length > 0 && <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{pendingNotes.length}</span>}
            </NavLink>
          ))}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 p-3 border-t border-gray-100">
          <div className="flex items-center gap-3 p-2">
            <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow" style={{ background: `linear-gradient(to bottom right, ${c.staff}, ${c.staffHover})`, boxShadow: `0 2px 8px -2px ${c.staff}40` }}>{initials}</div>
            <div className="flex-1 min-w-0"><p className="text-sm font-semibold text-gray-800 truncate">{staffName}</p><p className="text-[10px] text-gray-400 truncate">{staffProfile?.email}</p></div>
          </div>
          <button onClick={handleLogout} className="w-full mt-2 flex items-center gap-2 px-3 py-2 rounded-xl text-sm text-red-600 hover:bg-red-50 transition-colors font-medium"><LogOut size={16} /> Sign Out</button>
        </div>
      </aside>

      <div className="md:ml-64">
        <header className="sticky top-0 z-20 bg-white/90 backdrop-blur-xl border-b border-gray-200 shadow-sm">
          <div className="flex items-center justify-between px-4 sm:px-6 h-16">
            <div className="flex items-center gap-3">
              <button onClick={() => setSidebarOpen(true)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 md:hidden"><Menu size={20} className="text-gray-600" /></button>
              <h2 className="text-lg font-bold text-gray-800">{pageTitle}</h2>
            </div>
            <div className="flex items-center gap-3">
              {inProgressShift && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: c.staffBg, border: `1px solid ${c.staffRing}` }}>
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full opacity-75" style={{ backgroundColor: c.staff }} /><span className="relative h-2 w-2 rounded-full" style={{ backgroundColor: c.staff }} /></span>
                  <span className="text-xs font-bold" style={{ color: c.staffText }}>On Shift</span>
                </div>
              )}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setNotifOpen(!notifOpen)} className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 relative">
                  <Bell size={20} className="text-gray-600" />
                  {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">{notifCount > 9 ? '9+' : notifCount}</span>}
                </button>
                {notifOpen && (
                  <div className="fixed right-2 top-14 sm:absolute sm:right-0 sm:top-12 w-[calc(100vw-1rem)] sm:w-96 bg-white rounded-2xl shadow-2xl border border-gray-200 z-[100] overflow-hidden">
                    <div className="p-3 border-b border-gray-100 flex items-center justify-between"><h3 className="font-bold text-gray-800 text-sm">Notifications</h3><span className="text-[10px] text-gray-400">{notifCount} active</span></div>
                    <div className="max-h-96 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <button key={n.id} onClick={() => { setNotifOpen(false); navigate(n.link) }} className="w-full p-3 flex items-start gap-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                          <div className={`p-1.5 rounded-lg ${n.bg} shrink-0 mt-0.5`}><n.icon size={14} className={n.color} /></div>
                          <div className="flex-1 min-w-0"><p className="font-semibold text-gray-800 text-xs">{n.title}</p><p className="text-[11px] text-gray-500 truncate">{n.desc}</p></div>
                          {n.urgent && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-2" />}
                        </button>
                      )) : (<div className="p-8 text-center"><CheckCircle size={28} className="text-emerald-400 mx-auto mb-2" /><p className="text-sm text-gray-500 font-medium">All caught up!</p></div>)}
                    </div>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-xs font-bold shadow" style={{ background: `linear-gradient(to bottom right, ${c.staff}, ${c.staffHover})` }}>{initials}</div>
                <div className="hidden sm:block text-left"><p className="text-sm font-semibold text-gray-800 leading-none">{staffProfile?.first_name}</p><p className="text-[10px] text-gray-400">{staffProfile?.role === 'admin' ? 'Administrator' : 'Support Worker'}</p></div>
              </div>
            </div>
          </div>
        </header>
        <main className="relative z-10 p-4 sm:p-6"><Outlet /></main>
      </div>
    </div>
  )
}

export default StaffLayout