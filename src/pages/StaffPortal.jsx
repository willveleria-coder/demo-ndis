import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, Clock, AlertTriangle, User, LogOut,
  Play, Check, MapPin, Square, Plus, ChevronRight, ChevronDown,
  Bell, Briefcase, Coffee, Activity, Zap, Phone, Mail, Timer,
  ArrowUpRight, CheckCircle2, ChevronLeft, X, Menu, Home,
  Pencil, Save, Loader2, Lock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'
import MapleLeaf from '../components/MapleLeaf'

/* ─── helpers ─── */
function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today); tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return { text: 'Good morning', emoji: '☀️' }
  if (h < 17) return { text: 'Good afternoon', emoji: '🌤️' }
  return { text: 'Good evening', emoji: '🌙' }
}
function getLiveTimer(clockInTime) {
  if (!clockInTime) return '0:00:00'
  const diff = Date.now() - new Date(clockInTime).getTime()
  const h = Math.floor(diff / 3600000)
  const m = Math.floor((diff % 3600000) / 60000)
  const s = Math.floor((diff % 60000) / 1000)
  return `${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}
function getStreak(shifts) {
  let streak = 0
  const completed = shifts.filter(s => s.status === 'completed').sort((a, b) => new Date(b.shift_date) - new Date(a.shift_date))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < completed.length; i++) {
    const d = new Date(completed[i].shift_date); d.setHours(0, 0, 0, 0)
    const expected = new Date(today); expected.setDate(expected.getDate() - i)
    if (d.getTime() === expected.getTime()) streak++; else break
  }
  return streak
}
function getWeekHours(shifts) {
  const now = new Date()
  const startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1)
  startOfWeek.setHours(0, 0, 0, 0)
  return shifts.filter(s => s.status === 'completed' && new Date(s.shift_date) >= startOfWeek)
    .reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
}

const Badge = ({ children, color = 'gray' }) => {
  const c = {
    gray: 'bg-gray-100 text-gray-600',
    green: 'bg-emerald-50 text-emerald-700',
    amber: 'bg-amber-50 text-amber-700',
    red: 'bg-red-50 text-red-700',
    blue: 'bg-sky-50 text-sky-700',
    orange: 'bg-orange-50 text-orange-700',
    teal: 'bg-teal-50 text-teal-700',
  }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

function LiveClock({ clockInTime }) {
  const [time, setTime] = useState(getLiveTimer(clockInTime))
  useEffect(() => {
    const i = setInterval(() => setTime(getLiveTimer(clockInTime)), 1000)
    return () => clearInterval(i)
  }, [clockInTime])
  return <span className="font-mono text-3xl font-black tracking-tight">{time}</span>
}

function CompletionRing({ completed, total, size = 80 }) {
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100)
  const r = (size - 8) / 2
  const circ = 2 * Math.PI * r
  const offset = circ - (pct / 100) * circ
  const color = pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6"
          strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round"
          style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center">
        <span className="text-sm font-black text-gray-800">{pct}%</span>
      </div>
    </div>
  )
}

function MiniCalendar({ shifts, onSelectDate, selectedDate }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear()
  const month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay()
  const daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date()
  const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const shiftDates = {}
  shifts.forEach(s => { if (!shiftDates[s.shift_date]) shiftDates[s.shift_date] = []; shiftDates[s.shift_date].push(s) })
  const cells = []
  for (let i = 0; i < adjustedFirst; i++) cells.push(null)
  for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} className="text-gray-400" /></button>
        <p className="text-sm font-bold text-gray-800">{viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} className="text-gray-400" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">
        {['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}
      </div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const hasShifts = shiftDates[dateStr]
          const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
          const isSelected = selectedDate === dateStr
          return (
            <button key={day} onClick={() => onSelectDate(dateStr)}
              className={`relative h-9 rounded-lg text-xs font-semibold transition-all ${
                isSelected ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-200' :
                isToday ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' :
                hasShifts ? 'bg-white hover:bg-gray-50 text-gray-800' : 'text-gray-400 hover:bg-gray-50'
              }`}>
              {day}
              {hasShifts && !isSelected && (
                <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">
                  {hasShifts.slice(0,3).map((s,j) => <div key={j} className={`w-1 h-1 rounded-full ${s.status === 'completed' ? 'bg-emerald-400' : s.status === 'in_progress' ? 'bg-orange-400' : 'bg-green-400'}`} />)}
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}

function WeeklyHoursBar({ hours, target = 38 }) {
  const pct = Math.min((hours / target) * 100, 100)
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">This Week</p>
        <p className="text-xs text-gray-400"><span className="font-bold text-gray-700">{hours.toFixed(1)}h</span> / {target}h</p>
      </div>
      <div className="h-3 bg-gray-100 rounded-full overflow-hidden">
        <div className="h-full rounded-full transition-all duration-1000 ease-out"
          style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 70 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
      </div>
    </div>
  )
}

function ActivityFeed({ shifts }) {
  const events = []
  shifts.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    if (s.clock_in) events.push({ type: 'in', time: s.clock_in, text: `Clocked in — ${pName}`, icon: Play, color: 'text-emerald-500 bg-emerald-50' })
    if (s.clock_out) events.push({ type: 'out', time: s.clock_out, text: `Clocked out — ${pName}`, icon: Square, color: 'text-orange-500 bg-orange-50' })
  })
  events.sort((a, b) => new Date(b.time) - new Date(a.time))
  if (events.length === 0) return <div className="text-center py-6"><Activity size={24} className="text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No recent activity</p></div>
  return (
    <div className="space-y-2">
      {events.slice(0, 5).map((e, i) => (
        <div key={i} className="flex items-center gap-3 py-1.5">
          <div className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 ${e.color}`}><e.icon size={13} /></div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-semibold text-gray-700 truncate">{e.text}</p>
            <p className="text-[10px] text-gray-400">{formatDate(e.time)} · {formatTime(e.time)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

function WeekStrip({ shifts }) {
  const today = new Date()
  const days = []
  for (let i = -1; i < 6; i++) {
    const d = new Date(today); d.setDate(d.getDate() + i)
    const dateStr = d.toISOString().split('T')[0]
    days.push({ date: d, dateStr, shifts: shifts.filter(s => s.shift_date === dateStr), isToday: i === 0 })
  }
  return (
    <div className="flex gap-1.5">
      {days.map(d => (
        <div key={d.dateStr} className={`flex-1 rounded-xl p-2 text-center transition-all ${
          d.isToday ? 'bg-gradient-to-b from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white/60 hover:bg-white/80 border border-gray-100'
        }`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${d.isToday ? 'text-emerald-100' : 'text-gray-400'}`}>{d.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
          <p className={`text-lg font-black ${d.isToday ? 'text-white' : 'text-gray-800'}`}>{d.date.getDate()}</p>
          {d.shifts.length > 0 && <div className="flex justify-center gap-0.5 mt-1">{d.shifts.map((s, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${d.isToday ? 'bg-white' : s.status === 'completed' ? 'bg-emerald-400' : 'bg-green-400'}`} />)}</div>}
        </div>
      ))}
    </div>
  )
}

export default function StaffPortal() {
  const [activeTab, setActiveTab] = useState('dashboard')
  const [loading, setLoading] = useState(true)
  const [staffProfile, setStaffProfile] = useState(null)
  const [myShifts, setMyShifts] = useState([])
  const [showNote, setShowNote] = useState(null)
  const [showAddUnavail, setShowAddUnavail] = useState(false)
  const [newUnavail, setNewUnavail] = useState({ reason: '', start_date: '', end_date: '', notes: '' })
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [showProfileDrop, setShowProfileDrop] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [selectedCalDate, setSelectedCalDate] = useState(null)
  const [expandedShift, setExpandedShift] = useState(null)
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const profileRef = useRef(null)
  const notifRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        if (!user) { navigate('/enter/staff'); return }
        let staff = null
        const { data: s1 } = await supabase.from('staff').select('*').eq('auth_id', user.id).maybeSingle()
        if (s1) staff = s1
        else { const { data: s2 } = await supabase.from('staff').select('*').eq('email', user.email).maybeSingle(); staff = s2 }
        setStaffProfile(staff)
        if (staff) {
          const { data: shifts } = await supabase.from('shifts').select('*, participants(id, first_name, last_name), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)').eq('staff_id', staff.id).order('shift_date', { ascending: true })
          setMyShifts(shifts || [])
          const { data: tor } = await supabase.from('time_off_requests').select('*').eq('staff_id', staff.id).order('created_at', { ascending: false })
          setTimeOffRequests(tor || [])
        }
      } catch (err) { console.error(err) }
      finally { setLoading(false) }
    }
    load()
  }, [navigate])

  useEffect(() => {
    const h = (e) => {
      if (profileRef.current && !profileRef.current.contains(e.target)) setShowProfileDrop(false)
      if (notifRef.current && !notifRef.current.contains(e.target)) setShowNotifications(false)
    }
    document.addEventListener('mousedown', h); return () => document.removeEventListener('mousedown', h)
  }, [])

  const handleLogout = async () => { await supabase.auth.signOut(); navigate('/') }
  const handleClockIn = async (id) => {
    try {
      const { data, error } = await supabase.from('shifts').update({ clock_in: new Date().toISOString(), status: 'in_progress' }).eq('id', id).select().single()
      if (error) throw error
      setMyShifts(myShifts.map(s => s.id === id ? { ...s, ...data, participants: s.participants, shift_notes: s.shift_notes } : s))
    } catch (err) { console.error('Clock in failed:', err); alert('Failed to clock in') }
  }
  const handleClockOut = async (id) => {
    try {
      const { data, error } = await supabase.from('shifts').update({ clock_out: new Date().toISOString(), status: 'completed' }).eq('id', id).select().single()
      if (error) throw error
      setMyShifts(myShifts.map(s => s.id === id ? { ...s, ...data, participants: s.participants, shift_notes: s.shift_notes } : s))
    } catch (err) { console.error('Clock out failed:', err); alert('Failed to clock out') }
  }
  const handleSubmitNote = async () => {
    if (!showNote) return
    try {
      const hasExisting = showNote.shift_notes && showNote.shift_notes.length > 0
      
      // Build payload - try structured fields first, fall back to content
      const payload = { ...noteForm }
      // Also set content as combined text for backwards compatibility
      const contentParts = [
        noteForm.mood && `Mood: ${noteForm.mood}`,
        noteForm.activities && `Activities: ${noteForm.activities}`,
        noteForm.goals_progress && `Goals: ${noteForm.goals_progress}`,
        noteForm.concerns && `Concerns: ${noteForm.concerns}`,
        noteForm.recommendations && `Recommendations: ${noteForm.recommendations}`,
      ].filter(Boolean)
      payload.content = contentParts.join('\n\n')
      
      if (hasExisting) {
        const { error } = await supabase.from('shift_notes').update(payload).eq('id', showNote.shift_notes[0].id)
        if (error) throw error
        alert('Note updated!')
      } else {
        payload.shift_id = showNote.id
        payload.staff_id = staffProfile?.id
        const { data, error } = await supabase.from('shift_notes').insert(payload).select()
        if (error) {
          console.error('Insert error:', error)
          // If structured columns don't exist, try with just content
          if (error.message?.includes('column') || error.code === '42703') {
            const { error: e2 } = await supabase.from('shift_notes').insert({
              shift_id: showNote.id,
              staff_id: staffProfile?.id,
              content: payload.content,
            })
            if (e2) throw e2
          } else {
            throw error
          }
        }
        alert('Shift note submitted!')
      }
      // Refresh shifts to show updated data
      const { data: refreshed } = await supabase.from('shifts').select('*, participants(id, first_name, last_name), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)').eq('staff_id', staffProfile?.id).order('shift_date', { ascending: true })
      if (refreshed) {
        setMyShifts(refreshed)
      }
      setShowNote(null)
      setNoteForm({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
    } catch (err) {
      console.error('Note submit error:', err)
      alert('Failed to save note: ' + (err.message || 'Unknown error'))
    }
  }

  const staffName = staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Staff'

  const startProfileEdit = () => {
    setProfileForm({
      phone: staffProfile.phone || '',
      address: staffProfile.address || '',
      emergency_contact_name: staffProfile.emergency_contact_name || '',
      emergency_contact_phone: staffProfile.emergency_contact_phone || '',
      emergency_contact_relationship: staffProfile.emergency_contact_relationship || '',
    })
    setProfileEditing(true)
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const { data, error } = await supabase
        .from('staff')
        .update(profileForm)
        .eq('id', staffProfile.id)
        .select()
        .single()
      if (error) throw error
      setStaffProfile(prev => ({ ...prev, ...data }))
      setProfileEditing(false)
      alert('Profile updated!')
    } catch (err) {
      console.error('Failed to update profile:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setProfileSaving(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.new || !passwordForm.confirm) {
      alert('Please fill in all password fields')
      return
    }
    if (passwordForm.new !== passwordForm.confirm) {
      alert('New passwords do not match')
      return
    }
    if (passwordForm.new.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 10000))
      const update = supabase.auth.updateUser({ password: passwordForm.new })
      const { error } = await Promise.race([update, timeout])
      if (error) throw error
      setPasswordForm({ current: '', new: '', confirm: '' })
      alert('Password changed successfully!')
    } catch (err) {
      console.error('Password change failed:', err)
      alert('Failed to change password: ' + (err.message || 'Unknown error. Please try logging out and back in.'))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSubmitTimeOff = async () => {
    if (!newUnavail.reason || !newUnavail.start_date || !newUnavail.end_date) {
      alert('Please fill in reason, start date, and end date')
      return
    }
    if (new Date(newUnavail.end_date) < new Date(newUnavail.start_date)) {
      alert('End date must be after start date')
      return
    }
    setSubmittingTimeOff(true)
    try {
      const { data, error } = await supabase.from('time_off_requests').insert({
        staff_id: staffProfile.id,
        reason: newUnavail.reason,
        start_date: newUnavail.start_date,
        end_date: newUnavail.end_date,
        notes: newUnavail.notes || null,
        status: 'pending'
      }).select().single()
      if (error) throw error
      setTimeOffRequests(prev => [data, ...prev])
      setShowAddUnavail(false)
      setNewUnavail({ reason: '', start_date: '', end_date: '', notes: '' })
      alert('Time off request submitted!')
    } catch (err) {
      console.error('Failed to submit time off:', err)
      alert('Failed to submit: ' + err.message)
    } finally {
      setSubmittingTimeOff(false)
    }
  }

  const handleCancelTimeOff = async (id) => {
    if (!confirm('Cancel this time off request?')) return
    try {
      const { error } = await supabase.from('time_off_requests').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
      setTimeOffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } catch (err) {
      alert('Failed to cancel: ' + err.message)
    }
  }

  const initials = staffProfile ? `${staffProfile.first_name?.[0] || ''}${staffProfile.last_name?.[0] || ''}` : '?'
  const inProgressShift = myShifts.find(s => s.status === 'in_progress')
  const upcomingShifts = myShifts.filter(s => s.status === 'scheduled' || s.status === 'upcoming')
  const completedShifts = myShifts.filter(s => s.status === 'completed')
  const pendingNotes = completedShifts.filter(s => !s.shift_notes || s.shift_notes?.length === 0)
  const greeting = getGreeting()
  const streak = getStreak(myShifts)
  const totalHours = completedShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
  const weekHours = getWeekHours(myShifts)
  const notesCompleted = completedShifts.length - pendingNotes.length
  const selectedDayShifts = selectedCalDate ? myShifts.filter(s => s.shift_date === selectedCalDate) : []

  // Build notifications
  const notifications = []
  // Pending notes
  pendingNotes.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `note-${s.id}`, icon: FileText, color: 'bg-amber-100 text-amber-600', title: 'Shift note overdue', desc: `${pName} — ${formatDate(s.shift_date)}`, action: () => { setShowNote(s); setShowNotifications(false) }, urgent: true })
  })
  // Today's upcoming shifts
  const todayStr = new Date().toISOString().split('T')[0]
  const todayShifts = upcomingShifts.filter(s => s.shift_date === todayStr)
  todayShifts.forEach(s => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
    notifications.push({ id: `shift-${s.id}`, icon: Calendar, color: 'bg-emerald-100 text-emerald-600', title: 'Shift today', desc: `${pName} — ${formatTime(s.start_time)} – ${formatTime(s.end_time)}`, action: () => { setActiveTab('shifts'); setShowNotifications(false) } })
  })
  // Active shift reminder
  if (inProgressShift) {
    notifications.push({ id: 'active', icon: Activity, color: 'bg-green-100 text-green-600', title: 'Shift in progress', desc: `Don't forget to clock out when finished`, action: () => { setShowNotifications(false) } })
  }
  // Tomorrow's shifts
  const tomorrowDate = new Date(); tomorrowDate.setDate(tomorrowDate.getDate() + 1)
  const tomorrowStr = tomorrowDate.toISOString().split('T')[0]
  const tomorrowShifts = upcomingShifts.filter(s => s.shift_date === tomorrowStr)
  if (tomorrowShifts.length > 0) {
    notifications.push({ id: 'tomorrow', icon: Clock, color: 'bg-sky-100 text-sky-600', title: `${tomorrowShifts.length} shift${tomorrowShifts.length > 1 ? 's' : ''} tomorrow`, desc: tomorrowShifts.map(s => formatTime(s.start_time)).join(', '), action: () => { setActiveTab('shifts'); setShowNotifications(false) } })
  }
  const notifCount = notifications.filter(n => n.urgent).length || (notifications.length > 0 ? notifications.length : 0)

  const tabs = [
    { id: 'dashboard', label: 'Dashboard', icon: Home },
    { id: 'shifts', label: 'My Shifts', icon: Calendar },
    { id: 'notes', label: 'Notes', icon: FileText, badge: pendingNotes.length },
    { id: 'availability', label: 'Time Off', icon: Clock },
    { id: 'forms', label: 'Forms', icon: Briefcase },
    { id: 'profile', label: 'My Profile', icon: User },
  ]

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gradient-to-br from-emerald-50 via-white to-green-50">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-xl shadow-emerald-200 animate-pulse">
          <MapleLeaf size={32} className="text-white" />
        </div>
        <p className="mt-4 text-sm font-medium text-gray-400 animate-pulse">Loading your portal...</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-white to-green-50">
      {/* Background blobs matching admin style */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-20 left-1/4 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-1/4 w-96 h-96 bg-green-200/30 rounded-full blur-3xl" />
        <div className="absolute top-1/2 right-10 w-64 h-64 bg-teal-200/20 rounded-full blur-3xl" />
      </div>

      {/* ═══ NAVBAR ═══ */}
      <nav className="sticky top-0 z-50 bg-white/95 backdrop-blur-xl border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200">
                <MapleLeaf size={20} className="text-white" />
              </div>
              <div className="hidden sm:block">
                <span className="text-base font-bold text-gray-800">Maple Care</span>
                <p className="text-[10px] text-gray-400">Staff Portal</p>
              </div>
            </div>
            <div className="hidden md:flex items-center gap-1">
              {tabs.map(tab => (
                <button key={tab.id}
                  onClick={() => tab.id === 'forms' ? navigate('/staff/forms') : setActiveTab(tab.id)}
                  className={`relative flex items-center gap-2 px-3.5 py-2 rounded-xl font-medium text-sm transition-all ${
                    activeTab === tab.id
                      ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200'
                      : 'text-gray-600 hover:bg-white/80 hover:shadow'
                  }`}>
                  <tab.icon size={16} /><span>{tab.label}</span>
                  {tab.badge > 0 && (
                    <span className={`absolute -top-1 -right-1 w-5 h-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-sm ${
                      activeTab === tab.id ? 'bg-white text-emerald-600' : 'bg-red-500 text-white'
                    }`}>{tab.badge}</span>
                  )}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              {inProgressShift && (
                <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-emerald-50 border border-emerald-200 rounded-full">
                  <span className="relative flex h-2 w-2"><span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" /><span className="relative h-2 w-2 rounded-full bg-emerald-500" /></span>
                  <span className="text-xs font-bold text-emerald-700">On Shift</span>
                </div>
              )}
              <div className="relative" ref={notifRef}>
                <button onClick={() => setShowNotifications(!showNotifications)} className="relative p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                  <Bell size={20} className="text-gray-600" />
                  {notifCount > 0 && <span className="absolute -top-0.5 -right-0.5 w-5 h-5 bg-red-500 rounded-full text-[10px] flex items-center justify-center text-white font-bold animate-pulse">{notifCount}</span>}
                </button>
                {showNotifications && (
                  <div className="fixed sm:absolute left-3 right-3 sm:left-auto sm:right-0 top-auto sm:top-full mt-2 sm:w-80 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 bg-gray-50 flex items-center justify-between">
                      <p className="font-bold text-gray-800 text-sm">Notifications</p>
                      {notifCount > 0 && <span className="text-xs text-gray-400">{notifCount} new</span>}
                    </div>
                    <div className="max-h-80 overflow-y-auto">
                      {notifications.length > 0 ? notifications.map(n => (
                        <button key={n.id} onClick={n.action} className="w-full flex items-start gap-3 px-4 py-3 hover:bg-gray-50 transition-colors text-left border-b border-gray-50 last:border-0">
                          <div className={`w-8 h-8 rounded-lg flex items-center justify-center shrink-0 mt-0.5 ${n.color}`}>
                            <n.icon size={15} />
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-gray-800">{n.title}</p>
                            <p className="text-xs text-gray-400 mt-0.5 truncate">{n.desc}</p>
                          </div>
                          {n.urgent && <span className="w-2 h-2 bg-red-500 rounded-full shrink-0 mt-2" />}
                        </button>
                      )) : (
                        <div className="p-6 text-center">
                          <Bell size={24} className="text-gray-200 mx-auto mb-2" />
                          <p className="text-sm text-gray-400">All caught up!</p>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>
              <div className="relative" ref={profileRef}>
                <button onClick={() => setShowProfileDrop(!showProfileDrop)} className="flex items-center gap-2.5 p-1.5 rounded-xl hover:bg-gray-100 transition-colors">
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-xs font-bold shadow shadow-emerald-200">{initials}</div>
                  <div className="hidden sm:block text-left">
                    <p className="text-sm font-semibold text-gray-800 leading-none">{staffProfile?.first_name}</p>
                    <p className="text-[10px] text-gray-400">Support Worker</p>
                  </div>
                  <ChevronDown size={14} className="text-gray-400 hidden sm:block" />
                </button>
                {showProfileDrop && (
                  <div className="absolute right-0 top-full mt-2 w-56 bg-white rounded-2xl shadow-2xl border border-gray-200 overflow-hidden z-50">
                    <div className="p-3 border-b border-gray-100 bg-gray-50">
                      <p className="font-bold text-gray-800 text-sm">{staffName}</p>
                      <p className="text-xs text-gray-400">{staffProfile?.email}</p>
                    </div>
                    <div className="p-1.5">
                      <button onClick={() => { setActiveTab('profile'); setShowProfileDrop(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><User size={16} className="text-gray-400" /> My Profile</button>
                      <button onClick={() => navigate('/staff/forms')} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Briefcase size={16} className="text-gray-400" /> Forms</button>
                      <button onClick={() => { setActiveTab('availability'); setShowProfileDrop(false) }} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-gray-700 hover:bg-gray-50"><Clock size={16} className="text-gray-400" /> Time Off</button>
                    </div>
                    <div className="p-1.5 border-t border-gray-100">
                      <button onClick={handleLogout} className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-red-600 hover:bg-red-50"><LogOut size={16} /> Sign Out</button>
                    </div>
                  </div>
                )}
              </div>
              <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="md:hidden p-2 rounded-xl bg-gray-100 hover:bg-gray-200">
                {mobileMenuOpen ? <X size={20} className="text-gray-600" /> : <Menu size={20} className="text-gray-600" />}
              </button>
            </div>
          </div>
          {mobileMenuOpen && (
            <div className="md:hidden pb-3 border-t border-gray-100 mt-1 pt-2 flex flex-col gap-0.5">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => { tab.id === 'forms' ? navigate('/staff/forms') : setActiveTab(tab.id); setMobileMenuOpen(false) }}
                  className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all ${
                    activeTab === tab.id ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200' : 'text-gray-600 hover:bg-white/80 hover:shadow'
                  }`}>
                  <tab.icon size={18} />{tab.label}
                  {tab.badge > 0 && <span className="ml-auto w-5 h-5 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">{tab.badge}</span>}
                </button>
              ))}
            </div>
          )}
        </div>
      </nav>

      {/* ═══ CONTENT ═══ */}
      <main className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-6">

        {/* ─── DASHBOARD ─── */}
        {activeTab === 'dashboard' && (
          <div className="space-y-6">
            <div className="flex flex-col lg:flex-row gap-6">
              <div className="flex-1 space-y-6">
                <div>
                  <h1 className="text-2xl sm:text-3xl font-black text-gray-900 break-words">{greeting.text}, <span className="text-emerald-600">{staffProfile?.first_name}</span> {greeting.emoji}</h1>
                  <p className="text-gray-500 mt-1">{new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</p>
                </div>

                {inProgressShift ? (
                  <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-emerald-500 via-green-500 to-teal-600 p-6 shadow-xl shadow-emerald-200">
                    <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2" />
                    <div className="absolute bottom-0 left-0 w-40 h-40 bg-white/5 rounded-full translate-y-1/2 -translate-x-1/2" />
                    <div className="relative">
                      <div className="flex items-center gap-2 mb-4">
                        <span className="relative flex h-3 w-3"><span className="animate-ping absolute h-full w-full rounded-full bg-white opacity-75" /><span className="relative h-3 w-3 rounded-full bg-white" /></span>
                        <span className="text-sm font-bold text-white/90 uppercase tracking-wider">Active Shift</span>
                      </div>
                      <LiveClock clockInTime={inProgressShift.clock_in} />
                      <p className="text-white/80 text-sm mt-1">{inProgressShift.participants ? `${inProgressShift.participants.first_name} ${inProgressShift.participants.last_name}` : 'Shift'} · {inProgressShift.service_type || inProgressShift.title || 'Support'}</p>
                      <p className="text-white/60 text-xs mt-0.5">Clocked in at {formatTime(inProgressShift.clock_in)}</p>
                      {inProgressShift.location && <p className="text-white/50 text-xs mt-0.5 flex items-center gap-1"><MapPin size={12} />{inProgressShift.location}</p>}
                      <div className="flex gap-2 mt-5">
                        <button onClick={() => handleClockOut(inProgressShift.id)} className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all border border-white/20"><Square size={16} /> Clock Out</button>
                        <button onClick={() => setShowNote(inProgressShift)} className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all border border-white/20"><FileText size={16} /> Add Note</button>
                      </div>
                    </div>
                  </div>
                ) : upcomingShifts.length > 0 ? (
                  <div className="rounded-2xl bg-white/80 border border-gray-200 p-6 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center shadow-lg shadow-emerald-200"><Calendar size={24} className="text-white" /></div>
                        <div>
                          <p className="text-xs font-bold text-emerald-600 uppercase tracking-wider mb-0.5">Next Shift</p>
                          <p className="text-lg font-black text-gray-900">{upcomingShifts[0].participants ? `${upcomingShifts[0].participants.first_name} ${upcomingShifts[0].participants.last_name}` : 'Shift'}</p>
                          <p className="text-sm text-gray-500">{formatDate(upcomingShifts[0].shift_date)} · {formatTime(upcomingShifts[0].start_time)} – {formatTime(upcomingShifts[0].end_time)}</p>
                          {upcomingShifts[0].location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-1"><MapPin size={12} />{upcomingShifts[0].location}</p>}
                        </div>
                      </div>
                      <button onClick={() => handleClockIn(upcomingShifts[0].id)} className="px-5 py-3 bg-gradient-to-r from-emerald-500 to-green-600 hover:from-emerald-600 hover:to-green-700 rounded-xl text-white font-bold shadow-lg shadow-emerald-200 flex items-center gap-2 transition-all"><Play size={18} /> Clock In</button>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-2xl bg-white/80 border border-gray-200 p-8 text-center shadow-sm backdrop-blur-sm">
                    <Coffee size={24} className="text-gray-400 mx-auto mb-3" /><p className="font-bold text-gray-800">No shifts right now</p><p className="text-sm text-gray-400 mt-1">Enjoy your downtime!</p>
                  </div>
                )}

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm"><WeeklyHoursBar hours={weekHours} target={38} /></div>
                  <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                    <div className="flex items-center gap-4">
                      <CompletionRing completed={notesCompleted} total={completedShifts.length} size={64} />
                      <div>
                        <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Note Completion</p>
                        <p className="text-sm text-gray-700 mt-0.5"><span className="font-bold">{notesCompleted}</span> of {completedShifts.length} completed</p>
                        {pendingNotes.length > 0 && <button onClick={() => setActiveTab('notes')} className="text-xs text-amber-600 font-bold mt-1 hover:text-amber-700">{pendingNotes.length} pending →</button>}
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</p>
                  <ActivityFeed shifts={myShifts} />
                </div>
              </div>

              {/* Sidebar */}
              <div className="w-full lg:w-80 space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  {[
                    { icon: Calendar, val: upcomingShifts.length, label: 'Upcoming', color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200' },
                    { icon: FileText, val: pendingNotes.length, label: 'Notes Due', color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200', alert: pendingNotes.length > 0 },
                    { icon: Timer, val: `${totalHours.toFixed(0)}h`, label: 'Total Hours', color: 'from-teal-500 to-cyan-500', shadow: 'shadow-teal-200' },
                    { icon: Zap, val: streak, label: 'Day Streak', color: 'from-orange-500 to-red-500', shadow: 'shadow-orange-200' },
                  ].map((s, i) => (
                    <div key={i} className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                      <div className="flex items-center justify-between mb-2">
                        <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow ${s.shadow}`}><s.icon size={16} className="text-white" /></div>
                        {s.alert && <span className="w-2 h-2 bg-red-500 rounded-full animate-pulse" />}
                      </div>
                      <p className="text-2xl font-black text-gray-900">{s.val}</p>
                      <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                    </div>
                  ))}
                </div>

                <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                  <MiniCalendar shifts={myShifts} selectedDate={selectedCalDate} onSelectDate={d => setSelectedCalDate(d === selectedCalDate ? null : d)} />
                  {selectedCalDate && (
                    <div className="mt-3 pt-3 border-t border-gray-100">
                      {selectedDayShifts.length > 0 ? selectedDayShifts.map(s => (
                        <div key={s.id} className="flex items-center gap-2 py-1.5">
                          <div className={`w-2 h-2 rounded-full shrink-0 ${s.status === 'completed' ? 'bg-emerald-400' : s.status === 'in_progress' ? 'bg-orange-400' : 'bg-green-400'}`} />
                          <div className="flex-1 min-w-0">
                            <p className="text-xs font-semibold text-gray-800 truncate">{s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'}</p>
                            <p className="text-[10px] text-gray-400">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                          </div>
                          <Badge color={s.status === 'completed' ? 'green' : s.status === 'in_progress' ? 'orange' : 'blue'}>{(s.status || 'scheduled').replace('_',' ')}</Badge>
                        </div>
                      )) : <p className="text-xs text-gray-400 text-center py-2">No shifts this day</p>}
                    </div>
                  )}
                </div>

                {pendingNotes.length > 0 && (
                  <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 shadow-lg shadow-amber-200">
                    <div className="flex items-start gap-3">
                      <AlertTriangle size={20} className="text-white shrink-0 mt-0.5" />
                      <div>
                        <p className="font-bold text-white text-sm">{pendingNotes.length} note{pendingNotes.length > 1 ? 's' : ''} overdue</p>
                        <p className="text-white/80 text-xs mt-0.5">Submit within 24 hours for NDIS compliance</p>
                        <button onClick={() => setActiveTab('notes')} className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-bold hover:bg-white/30 transition-all">Submit now →</button>
                      </div>
                    </div>
                  </div>
                )}

                <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
                  <div className="space-y-1.5">
                    {[
                      { label: 'View All Shifts', icon: Calendar, bg: 'bg-emerald-50', text: 'text-emerald-600', action: () => setActiveTab('shifts') },
                      { label: 'Submit a Form', icon: Briefcase, bg: 'bg-violet-50', text: 'text-violet-600', action: () => navigate('/staff/forms') },
                      { label: 'Request Time Off', icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600', action: () => setShowAddUnavail(true) },
                    ].map(item => (
                      <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/80 hover:shadow transition-all text-left">
                        <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}><item.icon size={16} className={item.text} /></div>
                        <span className="text-sm font-semibold text-gray-700">{item.label}</span><ChevronRight size={16} className="text-gray-300 ml-auto" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ─── SHIFTS ─── */}
        {activeTab === 'shifts' && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-black text-gray-900">My Shifts</h2><p className="text-gray-500 text-sm">{myShifts.length} total · {upcomingShifts.length} upcoming</p></div>
            <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm"><WeekStrip shifts={myShifts} /></div>
            <div className="space-y-3">
              {myShifts.length > 0 ? myShifts.map(s => {
                const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
                const isActive = s.status === 'in_progress', isDone = s.status === 'completed', isExp = expandedShift === s.id
                return (
                  <div key={s.id} className={`rounded-xl border transition-all overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm ${isActive ? 'border-emerald-200 shadow-md shadow-emerald-100' : 'border-gray-200 hover:shadow-md'}`}>
                    <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setExpandedShift(isExp ? null : s.id)}>
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${
                        isActive ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-200' : isDone ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-200'
                      }`}>
                        {isActive ? <Activity size={20} /> : isDone ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2"><p className="font-bold text-gray-900">{pName}</p><Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'}>{(s.status || 'scheduled').replace('_',' ')}</Badge></div>
                        <p className="text-sm text-gray-500">{s.service_type || s.title || 'Support'}</p>
                        <div className="flex items-center gap-3 mt-1">
                          <span className="text-xs text-gray-400">{formatDate(s.shift_date)}</span><span className="text-xs text-gray-300">·</span>
                          <span className="text-xs text-gray-400">{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
                          {s.location && <><span className="text-xs text-gray-300">·</span><span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{s.location}</span></>}
                        </div>
                        {s.clock_in && <div className="flex gap-3 mt-1"><span className="text-[11px] text-emerald-600 font-medium">In: {formatTime(s.clock_in)}</span>{s.clock_out && <span className="text-[11px] text-orange-600 font-medium">Out: {formatTime(s.clock_out)}</span>}</div>}
                      </div>
                      <div className="shrink-0 flex items-center gap-2" onClick={e => e.stopPropagation()}>
                        {(s.status === 'scheduled' || s.status === 'upcoming') && <button onClick={() => handleClockIn(s.id)} className="px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2"><Play size={16} /> Clock In</button>}
                        {isActive && <>
                          <button onClick={() => handleClockOut(s.id)} className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white text-sm font-bold shadow flex items-center gap-2"><Square size={14} /> Out</button>
                          <button onClick={() => setShowNote(s)} className="px-4 py-2.5 bg-white border-2 border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold flex items-center gap-2 hover:bg-emerald-50"><FileText size={14} /> Note</button>
                        </>}
                        {isDone && <button onClick={() => setShowNote(s)} className="px-4 py-2.5 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-bold flex items-center gap-2 hover:bg-amber-100"><FileText size={14} /> Note</button>}
                      </div>
                    </div>
                    {isExp && (
                      <div className="px-4 pb-4 border-t border-gray-100 pt-3">
                        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                          {[{ l: 'Date', v: s.shift_date ? new Date(s.shift_date).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' }) : '—' },
                            { l: 'Time', v: `${formatTime(s.start_time)} – ${formatTime(s.end_time)}` },
                            { l: 'Service', v: s.service_type || s.title || '—' },
                            { l: 'Location', v: s.location || '—' }
                          ].map(f => <div key={f.l} className="bg-gray-50 rounded-lg p-3"><p className="text-[10px] text-gray-400 uppercase font-bold">{f.l}</p><p className="text-sm font-semibold text-gray-800">{f.v}</p></div>)}
                        </div>
                      </div>
                    )}
                  </div>
                )
              }) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-16 text-center"><Calendar size={48} className="text-gray-200 mx-auto mb-4" /><p className="font-bold text-gray-800">No shifts yet</p><p className="text-sm text-gray-400 mt-1">Your admin will assign shifts to you</p></div>
              )}
            </div>
          </div>
        )}

        {/* ─── NOTES ─── */}
        {activeTab === 'notes' && (
          <div className="space-y-6">
            <div><h2 className="text-2xl font-black text-gray-900">Shift Notes</h2><p className="text-gray-500 text-sm">Document each shift for NDIS compliance</p></div>
            {pendingNotes.length > 0 && (
              <div className="bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl p-4 shadow-lg shadow-amber-200 flex items-center gap-3">
                <AlertTriangle size={22} className="text-white shrink-0" />
                <div><p className="font-bold text-white">{pendingNotes.length} note{pendingNotes.length > 1 ? 's' : ''} overdue</p><p className="text-white/80 text-xs">Submit within 24 hours</p></div>
              </div>
            )}
            <div className="space-y-3">
              {completedShifts.length > 0 ? completedShifts.map(s => {
                const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
                const hasNote = s.shift_notes && s.shift_notes.length > 0
                return (
                  <div key={s.id} className={`rounded-xl border p-4 flex items-center justify-between bg-white/80 backdrop-blur-sm shadow-sm ${hasNote ? 'border-gray-100' : 'border-amber-200'}`}>
                    <div className="flex items-center gap-4">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${hasNote ? 'bg-emerald-50' : 'bg-amber-100'}`}>
                        {hasNote ? <CheckCircle2 size={20} className="text-emerald-500" /> : <FileText size={20} className="text-amber-600" />}
                      </div>
                      <div><p className="font-bold text-gray-900 text-sm">{pName}</p><p className="text-xs text-gray-500">{formatDate(s.shift_date)} · {s.service_type || s.title}</p></div>
                    </div>
                    {hasNote ? <button onClick={() => { setNoteForm({ mood: s.shift_notes[0]?.mood || '', activities: s.shift_notes[0]?.activities || '', goals_progress: s.shift_notes[0]?.goals_progress || '', concerns: s.shift_notes[0]?.concerns || '', recommendations: s.shift_notes[0]?.recommendations || '' }); setShowNote(s) }} className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5"><CheckCircle2 size={14} /> View / Edit</button> : <button onClick={() => setShowNote(s)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow shadow-amber-200 hover:shadow-md transition-all">Submit</button>}
                  </div>
                )
              }) : (
                <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-16 text-center"><FileText size={48} className="text-gray-200 mx-auto mb-4" /><p className="font-bold text-gray-800">No completed shifts</p></div>
              )}
            </div>
          </div>
        )}

        {/* ─── TIME OFF ─── */}
        {activeTab === 'availability' && (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div><h2 className="text-2xl font-black text-gray-900">Time Off</h2><p className="text-gray-500 text-sm">Request and manage your leave</p></div>
              <button onClick={() => setShowAddUnavail(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2"><Plus size={16} /> Request Time Off</button>
            </div>

            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {[
                { label: 'Pending', count: timeOffRequests.filter(r => r.status === 'pending').length, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200', icon: Clock },
                { label: 'Approved', count: timeOffRequests.filter(r => r.status === 'approved').length, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200', icon: Check },
                { label: 'Declined', count: timeOffRequests.filter(r => r.status === 'declined').length, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-200', icon: X },
                { label: 'Total Requests', count: timeOffRequests.filter(r => r.status !== 'cancelled').length, color: 'from-sky-500 to-blue-500', shadow: 'shadow-sky-200', icon: Calendar },
              ].map(s => (
                <div key={s.label} className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
                  <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow ${s.shadow} mb-2`}>
                    <s.icon size={16} className="text-white" />
                  </div>
                  <p className="text-2xl font-black text-gray-900">{s.count}</p>
                  <p className="text-xs text-gray-400 font-medium">{s.label}</p>
                </div>
              ))}
            </div>

            {/* Upcoming / Active leave */}
            {(() => {
              const today = new Date().toISOString().split('T')[0]
              const upcoming = timeOffRequests.filter(r => r.status === 'approved' && r.end_date >= today)
              if (upcoming.length === 0) return null
              return (
                <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 shadow-lg shadow-emerald-200">
                  <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">Upcoming Approved Leave</p>
                  <div className="space-y-2">
                    {upcoming.map(r => (
                      <div key={r.id} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-3">
                        <Calendar size={16} className="text-white shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-bold text-white">{r.reason}</p>
                          <p className="text-xs text-white/70">{new Date(r.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                        </div>
                        <span className="text-xs text-white/80 font-semibold">
                          {Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1} day{Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1 !== 1 ? 's' : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )
            })()}

            {/* All requests */}
            <div className="bg-white/80 rounded-xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
              <div className="p-4 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Requests</p>
              </div>
              {timeOffRequests.length > 0 ? (
                <div className="divide-y divide-gray-50">
                  {timeOffRequests.map(r => {
                    const days = Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1
                    const isPast = new Date(r.end_date) < new Date()
                    const statusConfig = {
                      pending: { color: 'amber', label: 'Pending Review', icon: Clock },
                      approved: { color: 'green', label: 'Approved', icon: Check },
                      declined: { color: 'red', label: 'Declined', icon: X },
                      cancelled: { color: 'gray', label: 'Cancelled', icon: X },
                    }
                    const sc = statusConfig[r.status] || statusConfig.pending
                    return (
                      <div key={r.id} className={`p-4 flex items-center gap-4 ${isPast && r.status !== 'pending' ? 'opacity-60' : ''}`}>
                        <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${
                          r.status === 'approved' ? 'bg-emerald-50' :
                          r.status === 'declined' ? 'bg-red-50' :
                          r.status === 'cancelled' ? 'bg-gray-100' :
                          'bg-amber-50'
                        }`}>
                          <sc.icon size={18} className={
                            r.status === 'approved' ? 'text-emerald-500' :
                            r.status === 'declined' ? 'text-red-500' :
                            r.status === 'cancelled' ? 'text-gray-400' :
                            'text-amber-500'
                          } />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <p className="font-bold text-gray-900 text-sm">{r.reason}</p>
                            <Badge color={sc.color}>{sc.label}</Badge>
                          </div>
                          <p className="text-xs text-gray-500 mt-0.5">
                            {new Date(r.start_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
                            <span className="text-gray-300 mx-1">·</span>
                            {days} day{days !== 1 ? 's' : ''}
                          </p>
                          {r.notes && <p className="text-xs text-gray-400 mt-1 italic">"{r.notes}"</p>}
                          <p className="text-[10px] text-gray-300 mt-1">Submitted {r.created_at ? new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                        </div>
                        {r.status === 'pending' && (
                          <button onClick={() => handleCancelTimeOff(r.id)} className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-semibold text-gray-500 transition-colors shrink-0">
                            Cancel
                          </button>
                        )}
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <Calendar size={40} className="text-gray-200 mx-auto mb-3" />
                  <p className="font-bold text-gray-800">No time off requests</p>
                  <p className="text-sm text-gray-400 mt-1">Submit a request to get started</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── PROFILE ─── */}
        {activeTab === 'profile' && staffProfile && (
          <div className="space-y-6">
            <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm">
              <div className="p-5 sm:p-6 flex items-center gap-4">
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-200 shrink-0">{initials}</div>
                <div className="min-w-0">
                  <h3 className="text-xl font-black text-gray-900">{staffName}</h3>
                  <p className="text-gray-500 text-sm">{staffProfile.role === 'admin' ? 'Administrator' : 'Support Worker'} · {(staffProfile.employment_type || 'full_time').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
                  <div className="mt-1.5">
                    <Badge color="green">{(staffProfile.status || 'active').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge>
                  </div>
                </div>
              </div>
            </div>

            {/* Contact Info — Editable */}
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</p>
                {!profileEditing ? (
                  <button onClick={startProfileEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all">
                    <Pencil size={13} /> Edit
                  </button>
                ) : (
                  <div className="flex gap-2">
                    <button onClick={() => setProfileEditing(false)} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200">
                      <X size={13} /> Cancel
                    </button>
                    <button onClick={handleProfileSave} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold shadow-md disabled:opacity-50">
                      {profileSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                      {profileSaving ? 'Saving...' : 'Save'}
                    </button>
                  </div>
                )}
              </div>

              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Mail size={16} className="text-emerald-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Email</p>
                    <p className="text-sm font-semibold text-gray-800">{staffProfile.email || '—'}</p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Phone size={16} className="text-emerald-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Phone</p>
                    {profileEditing ? (
                      <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{staffProfile.phone || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><MapPin size={16} className="text-emerald-600" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Address</p>
                    {profileEditing ? (
                      <input type="text" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{staffProfile.address || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Emergency Contact — Editable */}
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <div className="flex items-center justify-between mb-4">
                <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Contact</p>
                {!profileEditing && (
                  <span className="text-[10px] text-gray-400 font-medium">Click Edit above to change</span>
                )}
              </div>
              <div className="space-y-3">
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><User size={16} className="text-red-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Name</p>
                    {profileEditing ? (
                      <input type="text" value={profileForm.emergency_contact_name} onChange={e => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_name || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><Phone size={16} className="text-red-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Phone</p>
                    {profileEditing ? (
                      <input type="tel" value={profileForm.emergency_contact_phone} onChange={e => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_phone || '—'}</p>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><User size={16} className="text-red-500" /></div>
                  <div className="flex-1">
                    <p className="text-xs text-gray-400">Relationship</p>
                    {profileEditing ? (
                      <input type="text" value={profileForm.emergency_contact_relationship} onChange={e => setProfileForm({ ...profileForm, emergency_contact_relationship: e.target.value })}
                        className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" />
                    ) : (
                      <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_relationship || '—'}</p>
                    )}
                  </div>
                </div>
              </div>
            </div>

            {/* Change Password */}
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Change Password</p>
              <div className="space-y-3">
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">New Password</p>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })}
                      placeholder="Enter new password" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300" />
                  </div>
                </div>
                <div>
                  <p className="text-xs text-gray-500 font-semibold mb-1">Confirm New Password</p>
                  <div className="relative">
                    <Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
                    <input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })}
                      placeholder="Confirm new password" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300" />
                  </div>
                </div>
                <button onClick={handleChangePassword} disabled={changingPassword} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2">
                  {changingPassword ? <><Loader2 size={16} className="animate-spin" /> Changing...</> : <><Lock size={16} /> Change Password</>}
                </button>
              </div>
            </div>

            {/* Compliance Status */}
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compliance Status</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                {['NDIS Worker Screening', 'WWCC', 'First Aid', 'CPR Certificate'].map(item => (
                  <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
                    <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /><span className="text-xs font-semibold text-emerald-700">{item}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Performance */}
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Performance</p>
              <div className="grid grid-cols-3 gap-4 text-center">
                <div><p className="text-3xl font-black text-gray-900">{completedShifts.length}</p><p className="text-xs text-gray-400 font-medium">Shifts Done</p></div>
                <div><p className="text-3xl font-black text-gray-900">{totalHours.toFixed(0)}h</p><p className="text-xs text-gray-400 font-medium">Hours Logged</p></div>
                <div><p className="text-3xl font-black text-gray-900">{streak}</p><p className="text-xs text-gray-400 font-medium">Day Streak</p></div>
              </div>
            </div>

            <button onClick={handleLogout} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"><LogOut size={18} /> Sign Out</button>
          </div>
        )}
      </main>

      {/* ═══ MODALS ═══ */}
      <Modal isOpen={!!showNote} onClose={() => setShowNote(null)} title="Shift Note" wide>
        <div className="space-y-4">
          {showNote && (
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3">
              <Calendar size={18} className="text-emerald-500 shrink-0" />
              <div>
                <p className="font-bold text-emerald-800 text-sm">{showNote.participants ? `${showNote.participants.first_name} ${showNote.participants.last_name}` : 'Shift'}</p>
                <p className="text-xs text-emerald-600">{formatDate(showNote.shift_date)} · {showNote.service_type || showNote.title}</p>
              </div>
            </div>
          )}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-700">Complete all sections for NDIS compliance.</div>
          {[
            { key: 'mood', label: "Participant's mood & wellbeing", placeholder: 'Describe mood, energy, emotional state...' },
            { key: 'activities', label: 'Activities completed', placeholder: 'List activities, tasks, engagement...' },
            { key: 'goals_progress', label: 'Progress toward goals', placeholder: 'Note progress toward NDIS plan goals...' },
            { key: 'concerns', label: 'Concerns or incidents', placeholder: 'Document issues, incidents, risks...' },
            { key: 'recommendations', label: 'Recommendations & handover', placeholder: 'Notes for next support worker...' },
          ].map(f => (
            <div key={f.key}>
              <p className="text-xs text-gray-600 font-bold mb-1.5">{f.label}</p>
              <textarea value={noteForm[f.key]} onChange={e => setNoteForm({ ...noteForm, [f.key]: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all resize-none" rows={2} placeholder={f.placeholder} />
            </div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowNote(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700">Cancel</button>
            <button onClick={handleSubmitNote} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all">{showNote?.shift_notes?.length > 0 ? 'Update Note' : 'Submit Note'}</button>
          </div>
        </div>
      </Modal>

      <Modal isOpen={showAddUnavail} onClose={() => setShowAddUnavail(false)} title="Request Time Off">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-700">Your request will be reviewed by your manager. You'll see the status update here once it's been reviewed.</div>
          <div>
            <p className="text-xs text-gray-600 font-bold mb-1.5">Leave Type</p>
            <select value={newUnavail.reason} onChange={e => setNewUnavail({ ...newUnavail, reason: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Select type...</option>
              <option>Annual Leave</option>
              <option>Sick Leave</option>
              <option>Personal Leave</option>
              <option>Carer's Leave</option>
              <option>Compassionate Leave</option>
              <option>Training</option>
              <option>Unpaid Leave</option>
              <option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-600 font-bold mb-1.5">Start Date</p><input type="date" value={newUnavail.start_date} onChange={e => setNewUnavail({ ...newUnavail, start_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" /></div>
            <div><p className="text-xs text-gray-600 font-bold mb-1.5">End Date</p><input type="date" value={newUnavail.end_date} onChange={e => setNewUnavail({ ...newUnavail, end_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" /></div>
          </div>
          {newUnavail.start_date && newUnavail.end_date && new Date(newUnavail.end_date) >= new Date(newUnavail.start_date) && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium text-center">
              {Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1} day{Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1 !== 1 ? 's' : ''} requested
            </div>
          )}
          <div>
            <p className="text-xs text-gray-600 font-bold mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></p>
            <textarea value={newUnavail.notes} onChange={e => setNewUnavail({ ...newUnavail, notes: e.target.value })}
              placeholder="Any additional details for your manager..." rows={2}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAddUnavail(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700">Cancel</button>
            <button onClick={handleSubmitTimeOff} disabled={submittingTimeOff} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submittingTimeOff ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}