import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, ChevronLeft, ChevronRight, Clock, Plus, User, Play, Check, MapPin, Filter, Loader2 } from 'lucide-react'
import { getShifts, createShift } from '../services/shiftService'
import { getStaffMembers } from '../services/staffService'
import { getParticipants } from '../services/participantService'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December']
const HOURS = Array.from({ length: 14 }, (_, i) => i + 6)
const SERVICE_TYPES = ['Community Access', 'Personal Care', 'Cleaning', 'Gardening', 'Respite Care', 'Transport', 'Social Support', 'Other']

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', blue: 'bg-cyan-50 text-cyan-700', orange: 'bg-orange-50 text-orange-700' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${colors[color]}`}>{children}</span>
}

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

const WORKER_COLORS = ['bg-teal-500', 'bg-orange-500', 'bg-purple-500', 'bg-pink-500', 'bg-cyan-500', 'bg-amber-500', 'bg-emerald-500', 'bg-rose-500']

export default function AdminCalendar() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shifts, setShifts] = useState([])
  const [staffList, setStaffList] = useState([])
  const [participants, setParticipants] = useState([])
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDate, setSelectedDate] = useState(null)
  const [selectedShifts, setSelectedShifts] = useState([])
  const [showDayModal, setShowDayModal] = useState(false)
  const [showNewShift, setShowNewShift] = useState(false)
  const [filterWorker, setFilterWorker] = useState('all')
  const [viewMode, setViewMode] = useState('month')
  const [newShift, setNewShift] = useState({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
  const [staffAvailability, setStaffAvailability] = useState([])
  const [mapCoords, setMapCoords] = useState(null)
  const geocodeTimer = useRef(null)

  // Geocode location via Nominatim (free, no API key)
  const geocodeLocation = (address, instant = false) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    if (!address || address.length < 5) { setMapCoords(null); return }
    const doGeocode = async () => {
      try {
        // Format Australian addresses for better Nominatim results
        // e.g. "42 Banksia St Thornbury VIC 3071" → "42 Banksia St, Thornbury, VIC 3071, Australia"
        let formatted = address.trim()
        formatted = formatted.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+/i, ', $1 ')
        // Add comma before postcode if not already there
        formatted = formatted.replace(/,?\s*(\d{4})$/, ', $1')
        // Try structured search first with countrycodes
        const q = encodeURIComponent(formatted + ', Australia')
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=au`, {
          headers: { 'User-Agent': 'MapleCareSupport/1.0' }
        })
        const data = await res.json()
        if (data?.[0]) {
          setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
        } else {
          // Fallback: try just the suburb + state portion
          const parts = address.trim().split(/\s+/)
          const fallback = parts.slice(Math.max(0, parts.length - 4)).join(' ') + ', Australia'
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallback)}&limit=1&countrycodes=au`, {
            headers: { 'User-Agent': 'MapleCareSupport/1.0' }
          })
          const data2 = await res2.json()
          if (data2?.[0]) {
            setMapCoords({ lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon), display: data2[0].display_name })
          } else {
            setMapCoords(null)
          }
        }
      } catch { setMapCoords(null) }
    }
    if (instant) { doGeocode() } else { geocodeTimer.current = setTimeout(doGeocode, 400) }
  }

  useEffect(() => {
    async function load() {
      try {
        const [sh, s, p, av] = await Promise.all([
          getShifts().catch(() => []),
          getStaffMembers().catch(() => []),
          getParticipants().catch(() => []),
          supabase.from('staff_availability').select('*').then(r => r.data || []).catch(() => []),
        ])
        setShifts(sh); setStaffList(s); setParticipants(p); setStaffAvailability(av)
      } catch (err) { console.error('Calendar load error:', err) }
      finally { setLoading(false) }
    }
    load()
  }, [])

  // Availability helper
  const CAL_DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const getStaffAvailForDate = (staffId, dateStr) => {
    if (!dateStr) return { hasData: false }
    const dayName = CAL_DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()]
    const row = staffAvailability.find(a => a.staff_id === staffId && a.day_of_week === dayName)
    const hasAnyAvail = staffAvailability.some(a => a.staff_id === staffId)
    if (!hasAnyAvail) return { hasData: false }
    if (!row) return { hasData: true, available: false, slots: [] }
    const slots = []
    if (row.morning) slots.push('Morning')
    if (row.afternoon) slots.push('Afternoon')
    if (row.evening) slots.push('Evening')
    if (row.night) slots.push('Night')
    return { hasData: true, available: true, slots, notes: row.notes }
  }

  const year = currentDate.getFullYear(), month = currentDate.getMonth()
  const today = new Date()

  const getShiftsForDate = (dateStr) => {
    let filtered = shifts.filter(s => s.shift_date === dateStr)
    if (filterWorker !== 'all') filtered = filtered.filter(s => s.staff_id === filterWorker)
    return filtered
  }

  const getWorkerColorIndex = (staffId) => {
    const idx = staffList.findIndex(s => s.id === staffId)
    return WORKER_COLORS[idx % WORKER_COLORS.length]
  }

  const handleParticipantChange = (pid) => {
    const p = participants.find(x => x.id === pid)
    const loc = p?.address || newShift.location
    setNewShift({ ...newShift, participant_id: pid, location: loc })
    if (loc) geocodeLocation(loc, true)
  }

  const handleCreateShift = async () => {
    const shiftDate = newShift.shift_date || selectedDate || ''
    if (!newShift.staff_id || !shiftDate || !newShift.start_time || !newShift.end_time) {
      alert('Please fill in staff, date, start and end time'); return
    }
    setSaving(true)
    try {
      const created = await createShift({
        org_id: user.org_id, staff_id: newShift.staff_id, participant_id: newShift.participant_id || null,
        shift_date: shiftDate,
        start_time: `${shiftDate}T${newShift.start_time}:00`, end_time: `${shiftDate}T${newShift.end_time}:00`,
        service_type: newShift.service_type || null, location: newShift.location || null, notes: newShift.notes || null, status: 'scheduled',
      })
      setShifts([...shifts, created]); setShowNewShift(false); setMapCoords(null)
      setNewShift({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
    } catch (err) { alert('Failed to create shift: ' + err.message) }
    finally { setSaving(false) }
  }

  // Navigation
  const navPrev = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month - 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() - 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() - 86400000))
  }
  const navNext = () => {
    if (viewMode === 'month') setCurrentDate(new Date(year, month + 1, 1))
    else if (viewMode === 'week') setCurrentDate(new Date(currentDate.getTime() + 7 * 86400000))
    else setCurrentDate(new Date(currentDate.getTime() + 86400000))
  }
  const navLabel = () => {
    if (viewMode === 'month') return `${MONTHS[month]} ${year}`
    if (viewMode === 'day') return currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const start = getWeekStart(currentDate)
    const end = new Date(start.getTime() + 6 * 86400000)
    return `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  function getWeekStart(d) {
    const date = new Date(d); const day = date.getDay(); const diff = day === 0 ? 6 : day - 1
    date.setDate(date.getDate() - diff); date.setHours(0, 0, 0, 0); return date
  }
  function dateStr(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  function isSameDay(d1, d2) { return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

  const todayStr = today.toISOString().split('T')[0]
  const todayShifts = getShiftsForDate(todayStr)

  // ─── MONTH VIEW ───
  const MonthView = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const calendarDays = []
    for (let i = 0; i < firstDay; i++) calendarDays.push(<div key={`empty-${i}`} className="min-h-[80px] md:min-h-[100px] bg-gray-50/50 rounded-lg" />)
    for (let day = 1; day <= daysInMonth; day++) {
      const ds = `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
      const dayShifts = getShiftsForDate(ds)
      const isCurrent = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
      calendarDays.push(
        <button key={day} onClick={() => { setSelectedDate(ds); setSelectedShifts(dayShifts); setShowDayModal(true) }}
          className={`min-h-[80px] md:min-h-[100px] p-1.5 md:p-2 rounded-lg md:rounded-xl border text-left transition-all hover:shadow-md ${isCurrent ? 'bg-gradient-to-br from-orange-50 to-amber-50 border-orange-200 ring-2 ring-orange-400' : 'bg-white/70 border-gray-100 hover:border-orange-200'}`}>
          <div className="flex items-center justify-between mb-1">
            <span className={`text-xs md:text-sm font-bold ${isCurrent ? 'text-orange-600' : 'text-gray-700'}`}>{day}</span>
            {dayShifts.length > 0 && <span className="px-1.5 py-0.5 rounded-full bg-teal-100 text-teal-700 text-[9px] md:text-[10px] font-bold">{dayShifts.length}</span>}
          </div>
          <div className="space-y-0.5">
            {dayShifts.slice(0, 3).map((shift, i) => (
              <div key={i} className={`flex items-center gap-1 px-1 py-0.5 rounded text-[8px] md:text-[10px] truncate ${shift.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' : shift.status === 'completed' ? 'bg-gray-100 text-gray-600' : 'bg-cyan-100 text-cyan-700'}`}>
                <div className={`w-1.5 h-1.5 rounded-full ${getWorkerColorIndex(shift.staff_id)}`} />
                <span className="truncate">{shift.staff ? shift.staff.first_name : '?'}</span>
              </div>
            ))}
            {dayShifts.length > 3 && <p className="text-[8px] md:text-[10px] text-gray-400 pl-1">+{dayShifts.length - 3} more</p>}
          </div>
        </button>
      )
    }
    return (
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg">
        <div className="grid grid-cols-7 gap-1 md:gap-2 mb-2">
          {['Sun','Mon','Tue','Wed','Thu','Fri','Sat'].map(d => <div key={d} className="text-center text-[10px] md:text-xs font-semibold text-gray-400 py-2">{d}</div>)}
        </div>
        <div className="grid grid-cols-7 gap-1 md:gap-2">{calendarDays}</div>
      </div>
    )
  }

  // ─── WEEK VIEW ───
  const WeekView = () => {
    const weekStart = getWeekStart(currentDate)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart.getTime() + i * 86400000); return { date: d, str: dateStr(d) } })
    return (
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {days.map(day => {
            const dayShifts = getShiftsForDate(day.str)
            const isToday = isSameDay(day.date, today)
            return (
              <div key={day.str} className={`min-h-[400px] ${isToday ? 'bg-orange-50/30' : ''}`}>
                <div className={`p-3 text-center border-b border-gray-100 ${isToday ? 'bg-orange-50' : ''}`}>
                  <p className={`text-xs font-bold ${isToday ? 'text-orange-600' : 'text-gray-400'}`}>{day.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-orange-700' : 'text-gray-800'}`}>{day.date.getDate()}</p>
                </div>
                <div className="p-2 space-y-2">
                  {dayShifts.length > 0 ? dayShifts.map(shift => (
                    <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`}
                      className={`block p-2 rounded-lg text-xs border transition-all hover:shadow-md ${shift.status === 'in_progress' ? 'bg-emerald-50 border-emerald-200' : shift.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                      <div className="flex items-center gap-1 mb-1">
                        <div className={`w-2 h-2 rounded-full ${getWorkerColorIndex(shift.staff_id)}`} />
                        <p className="font-bold text-gray-800 truncate">{shift.staff ? shift.staff.first_name : '?'}</p>
                      </div>
                      <p className="text-gray-600 truncate">{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                      <p className="text-gray-500 mt-0.5">{formatTime(shift.start_time)} – {formatTime(shift.end_time)}</p>
                      {shift.location && <p className="text-gray-400 truncate flex items-center gap-1 mt-0.5"><MapPin size={8} />{shift.location}</p>}
                      <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'}>{shift.status.replace('_', ' ')}</Badge>
                    </Link>
                  )) : <p className="text-[10px] text-gray-300 text-center mt-4">No shifts</p>}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── DAY VIEW ───
  const DayView = () => {
    const dStr = dateStr(currentDate)
    const dayShifts = getShiftsForDate(dStr).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    return (
      <div className="p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg overflow-hidden">
        <div className="p-3 border-b border-gray-100">
          <p className="font-bold text-gray-800">{currentDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-sm text-gray-500">{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="divide-y divide-gray-50">
          {dayShifts.length > 0 ? dayShifts.map(shift => (
            <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`}
              className={`flex items-center gap-4 p-4 transition-all hover:bg-gray-50/50 ${shift.status === 'in_progress' ? 'bg-emerald-50/30' : ''}`}>
              <div className="w-16 text-center shrink-0">
                <p className="text-sm font-bold text-gray-800">{formatTime(shift.start_time)}</p>
                <p className="text-[10px] text-gray-400">{formatTime(shift.end_time)}</p>
              </div>
              <div className={`w-1 self-stretch rounded-full ${shift.status === 'in_progress' ? 'bg-emerald-400' : shift.status === 'completed' ? 'bg-gray-300' : 'bg-orange-400'}`} />
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <div className={`w-2.5 h-2.5 rounded-full shrink-0 ${getWorkerColorIndex(shift.staff_id)}`} />
                  <p className="font-bold text-sm text-gray-800 truncate">{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : 'Shift'}</p>
                  <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'}>{shift.status.replace('_', ' ')}</Badge>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  <User size={10} className="inline mr-1" />{shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : '?'} · {shift.service_type || 'Support'}
                </p>
                {shift.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{shift.location}</p>}
              </div>
            </Link>
          )) : (
            <div className="text-center py-12">
              <Calendar size={40} className="text-gray-200 mx-auto mb-2" />
              <p className="text-gray-400 text-sm">No shifts scheduled for this day</p>
            </div>
          )}
        </div>
      </div>
    )
  }

  if (loading) return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-orange-500" /></div>

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Staff Calendar</h2>
          <p className="text-sm text-gray-500">View all shifts and schedules</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex bg-white/80 rounded-xl border border-gray-200 p-1 shadow-sm">
            {['month', 'week', 'day'].map(mode => (
              <button key={mode} onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>
          <button onClick={() => setShowNewShift(true)} className="px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2">
            <Plus size={18} /> New Shift
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-3">
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center shadow mb-2"><Play size={16} className="text-white" /></div>
          <p className="text-xl md:text-2xl font-bold text-gray-800">{todayShifts.filter(s => s.status === 'in_progress').length}</p>
          <p className="text-xs text-gray-500">In Progress</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-500 flex items-center justify-center shadow mb-2"><Clock size={16} className="text-white" /></div>
          <p className="text-xl md:text-2xl font-bold text-gray-800">{todayShifts.filter(s => s.status === 'scheduled').length}</p>
          <p className="text-xs text-gray-500">Upcoming Today</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="w-8 h-8 md:w-9 md:h-9 rounded-lg bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow mb-2"><Check size={16} className="text-white" /></div>
          <p className="text-xl md:text-2xl font-bold text-gray-800">{todayShifts.filter(s => s.status === 'completed').length}</p>
          <p className="text-xs text-gray-500">Completed Today</p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-gray-400" />
          <select value={filterWorker} onChange={(e) => setFilterWorker(e.target.value)} className="px-3 py-2 bg-white border border-gray-200 rounded-xl text-sm">
            <option value="all">All Staff</option>
            {staffList.map(s => <option key={s.id} value={s.id}>{s.first_name} {s.last_name}</option>)}
          </select>
        </div>
        <div className="flex flex-wrap gap-2">
          {staffList.slice(0, 4).map((s, i) => (
            <div key={s.id} className="flex items-center gap-1.5 text-xs text-gray-600">
              <div className={`w-2.5 h-2.5 rounded-full ${WORKER_COLORS[i % WORKER_COLORS.length]}`} />
              <span className="hidden sm:inline">{s.first_name} {s.last_name}</span><span className="sm:hidden">{s.first_name}</span>
            </div>
          ))}
          {staffList.length > 4 && <span className="text-xs text-gray-400">+{staffList.length - 4} more</span>}
        </div>
      </div>

      {/* Navigation bar */}
      <div className="flex items-center justify-between bg-white/80 rounded-xl border border-gray-200 p-3 shadow-sm">
        <button onClick={navPrev} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={20} className="text-gray-600" /></button>
        <h3 className="font-bold text-gray-800 text-base md:text-lg">{navLabel()}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1.5 text-xs font-semibold text-orange-600 bg-orange-50 rounded-lg hover:bg-orange-100">Today</button>
          <button onClick={navNext} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={20} className="text-gray-600" /></button>
        </div>
      </div>

      {viewMode === 'month' && <MonthView />}
      {viewMode === 'week' && <WeekView />}
      {viewMode === 'day' && <DayView />}

      {/* Today's Schedule (month view only) */}
      {viewMode === 'month' && (
        <div className="p-4 md:p-5 rounded-xl md:rounded-2xl glass shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm md:text-base">Today's Schedule</h3>
            <Link to="/admin/roster" className="text-xs text-orange-600 font-semibold">View Roster</Link>
          </div>
          {todayShifts.length > 0 ? (
            <div className="space-y-2">
              {todayShifts.slice(0, 5).map(shift => (
                <Link key={shift.id} to={`/admin/roster/shift/${shift.id}`} className="flex items-center gap-3 p-3 rounded-xl bg-white/80 border border-gray-100 hover:shadow-md transition-all">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow shrink-0 ${shift.status === 'in_progress' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : shift.status === 'completed' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-cyan-500 to-teal-500'}`}>
                    {shift.status === 'in_progress' ? <Play size={16} className="text-white" /> : shift.status === 'completed' ? <Check size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-gray-800 text-sm truncate">{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                      <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'}>{shift.status.replace('_', ' ')}</Badge>
                    </div>
                    <p className="text-xs text-gray-500 truncate"><User size={10} className="inline mr-1" />{shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : 'Unassigned'} · {formatTime(shift.start_time)} - {formatTime(shift.end_time)}</p>
                  </div>
                </Link>
              ))}
            </div>
          ) : <p className="text-sm text-gray-400 text-center py-4">No shifts scheduled for today</p>}
        </div>
      )}

      {/* Day detail modal */}
      <Modal isOpen={showDayModal} onClose={() => setShowDayModal(false)} title={selectedDate ? new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : 'Shifts'} wide>
        <div className="space-y-3">
          {selectedShifts.length > 0 ? selectedShifts.map(shift => (
            <div key={shift.id} className={`p-3 md:p-4 rounded-xl border ${shift.status === 'in_progress' ? 'bg-emerald-50 border-emerald-200' : shift.status === 'completed' ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
              <div className="flex items-start gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center shadow shrink-0 ${shift.status === 'in_progress' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : shift.status === 'completed' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-cyan-500 to-teal-500'}`}>
                  {shift.status === 'in_progress' ? <Play size={16} className="text-white" /> : shift.status === 'completed' ? <Check size={16} className="text-white" /> : <Clock size={16} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2 mb-1">
                    <p className="font-bold text-gray-800 text-sm">{shift.participants ? `${shift.participants.first_name} ${shift.participants.last_name}` : shift.service_type || 'Shift'}</p>
                    <Badge color={shift.status === 'in_progress' ? 'green' : shift.status === 'completed' ? 'orange' : 'blue'}>{shift.status.replace('_', ' ')}</Badge>
                  </div>
                  <div className="grid grid-cols-2 gap-2 mt-2 text-xs">
                    <div className="flex items-center gap-1 text-gray-500"><User size={12} /><span className="truncate">{shift.staff ? `${shift.staff.first_name} ${shift.staff.last_name}` : '?'}</span></div>
                    <div className="flex items-center gap-1 text-gray-500"><Clock size={12} /><span>{formatTime(shift.start_time)} - {formatTime(shift.end_time)}</span></div>
                    {shift.location && <div className="flex items-center gap-1 text-gray-500 col-span-2"><MapPin size={12} /><span className="truncate">{shift.location}</span></div>}
                  </div>
                </div>
              </div>
              <div className="flex gap-2 mt-3">
                <Link to={`/admin/roster/shift/${shift.id}`} className="flex-1 py-2 bg-white border border-gray-200 rounded-lg text-xs font-semibold text-center text-gray-700 hover:bg-gray-50">View Details</Link>
              </div>
            </div>
          )) : (
            <div className="text-center py-8">
              <Calendar size={40} className="text-gray-300 mx-auto mb-2" />
              <p className="text-gray-500 text-sm">No shifts scheduled</p>
              <button onClick={() => { setShowDayModal(false); setShowNewShift(true) }} className="mt-3 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-xs font-semibold">+ Add Shift</button>
            </div>
          )}
        </div>
      </Modal>

      {/* New Shift modal */}
      <Modal isOpen={showNewShift} onClose={() => { setShowNewShift(false); setMapCoords(null) }} title="Create New Shift" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={newShift.participant_id} onChange={e => handleParticipantChange(e.target.value)} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Select Participant</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            <input type="date" value={newShift.shift_date || selectedDate || ''} onChange={e => setNewShift({...newShift, shift_date: e.target.value, staff_id: ''})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <select value={newShift._isOther ? 'Other' : newShift.service_type} onChange={e => {
              if (e.target.value === 'Other') setNewShift({...newShift, service_type: '', _isOther: true})
              else setNewShift({...newShift, service_type: e.target.value, _isOther: false})
            }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Service Type</option>
              {SERVICE_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
            </select>
            {newShift._isOther && (
              <input placeholder="Specify service type..." value={newShift.service_type} onChange={e => setNewShift({...newShift, service_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" autoFocus />
            )}
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="Start" />
              <input type="time" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" placeholder="End" />
            </div>
            <input placeholder="Location" value={newShift.location} onChange={e => { setNewShift({...newShift, location: e.target.value}); geocodeLocation(e.target.value) }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          {/* Staff picker with availability */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Assign Staff *{(newShift.shift_date || selectedDate) && <span className="font-normal text-gray-400 ml-1">— showing availability for {new Date((newShift.shift_date || selectedDate) + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}</span>}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-2 bg-gray-50">
              {staffList.filter(s => s.status === 'active').map(s => {
                const shiftDate = newShift.shift_date || selectedDate || ''
                const avail = getStaffAvailForDate(s.id, shiftDate)
                const isUnavailable = avail.hasData && !avail.available
                const isSelected = newShift.staff_id === s.id
                return (
                  <button key={s.id} type="button"
                    onClick={() => !isUnavailable && setNewShift({...newShift, staff_id: s.id})}
                    disabled={isUnavailable}
                    className={`w-full flex items-center gap-3 p-2.5 rounded-xl text-left transition-all ${
                      isSelected ? 'bg-teal-50 border-2 border-teal-400 shadow-sm' :
                      isUnavailable ? 'bg-red-50/50 border border-red-200 opacity-60 cursor-not-allowed' :
                      'bg-white border border-gray-100 hover:border-teal-300 hover:bg-teal-50/30 cursor-pointer'
                    }`}>
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold text-white ${
                      isUnavailable ? 'bg-gray-300' : isSelected ? 'bg-teal-500' : 'bg-gray-400'
                    }`}>{s.first_name?.[0]}{s.last_name?.[0]}</div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold truncate ${isUnavailable ? 'text-gray-400' : 'text-gray-800'}`}>{s.first_name} {s.last_name}</p>
                      {shiftDate ? (
                        <p className={`text-[10px] font-medium ${
                          isUnavailable ? 'text-red-400' :
                          avail.hasData ? 'text-emerald-500' : 'text-gray-400'
                        }`}>
                          {isUnavailable ? '✕ Not available this day' :
                           avail.hasData && avail.available ? `✓ ${avail.slots.join(' · ')}${avail.notes ? ' — ' + avail.notes : ''}` :
                           'No availability set'}
                        </p>
                      ) : (
                        <p className="text-[10px] text-gray-300">Select a date to see availability</p>
                      )}
                    </div>
                    {isSelected && <Check size={16} className="text-teal-500 shrink-0" />}
                  </button>
                )
              })}
            </div>
          </div>

          <textarea placeholder="Notes..." value={newShift.notes} onChange={e => setNewShift({...newShift, notes: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={2} />
          <div className="flex gap-2">
            <button onClick={() => { setShowNewShift(false); setMapCoords(null) }} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleCreateShift} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Shift'}
            </button>
          </div>
          {mapCoords && (
            <div className="rounded-2xl overflow-hidden border border-orange-100 shadow-sm" style={{ background: '#f8f9fa' }}>
              <div className="relative" style={{ height: '190px', overflow: 'hidden' }}>
                {(() => {
                  const zoom = 15
                  const n = Math.pow(2, zoom)
                  const xtile = ((mapCoords.lon + 180) / 360) * n
                  const ytile = ((1 - Math.log(Math.tan(mapCoords.lat * Math.PI / 180) + 1 / Math.cos(mapCoords.lat * Math.PI / 180)) / Math.PI) / 2) * n
                  const cx = Math.floor(xtile)
                  const cy = Math.floor(ytile)
                  const tiles = []
                  for (let dx = -2; dx <= 2; dx++) {
                    for (let dy = -2; dy <= 2; dy++) {
                      tiles.push({ x: cx + dx, y: cy + dy, dx, dy })
                    }
                  }
                  const offsetX = (xtile - cx) * 256
                  const offsetY = (ytile - cy) * 256
                  return (
                    <>
                      <div style={{ position: 'absolute', left: `calc(50% - ${offsetX}px - 512px)`, top: `calc(50% - ${offsetY}px - 512px)`, width: `${256 * 5}px`, height: `${256 * 5}px` }}>
                        {tiles.map(t => (
                          <img key={`${t.x}-${t.y}`} 
                            src={`https://a.basemaps.cartocdn.com/light_all/${zoom}/${t.x}/${t.y}@2x.png`}
                            alt="" style={{ position: 'absolute', left: `${(t.dx + 2) * 256}px`, top: `${(t.dy + 2) * 256}px`, width: '256px', height: '256px' }} draggable={false} />
                        ))}
                      </div>
                      {/* Pin shadow */}
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -4px)', zIndex: 9 }}>
                        <div style={{ width: '14px', height: '6px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', filter: 'blur(2px)', margin: '0 auto' }} />
                      </div>
                      {/* Orange pin */}
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(249,115,22,0.4))' }}>
                        <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
                          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="url(#pg)" />
                          <circle cx="18" cy="16.5" r="7" fill="white" />
                          <circle cx="18" cy="16.5" r="3.5" fill="url(#pg2)" />
                          <defs>
                            <linearGradient id="pg" x1="4" y1="2" x2="32" y2="44"><stop stopColor="#fb923c" /><stop offset="1" stopColor="#f97316" /></linearGradient>
                            <linearGradient id="pg2" x1="14" y1="13" x2="22" y2="20"><stop stopColor="#fb923c" /><stop offset="1" stopColor="#ea580c" /></linearGradient>
                          </defs>
                        </svg>
                      </div>
                      {/* Edge fade */}
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(248,249,250,0.3) 0%, transparent 15%, transparent 80%, rgba(248,249,250,0.6) 100%)', pointerEvents: 'none' }} />
                    </>
                  )
                })()}
              </div>
              <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #fff7ed, #fffbeb)' }}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-orange-400 to-amber-500 flex items-center justify-center shadow-md shadow-orange-200 shrink-0">
                  <MapPin size={13} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-[11px] font-semibold text-gray-700 truncate">{mapCoords.display?.split(',').slice(0, 3).join(',')}</p>
                  <p className="text-[9px] text-gray-400 truncate">{mapCoords.display?.split(',').slice(3).join(',').trim()}</p>
                </div>
                <div className="flex gap-1.5 shrink-0">
                  <a href={`https://maps.apple.com/?q=${encodeURIComponent(mapCoords.display)}&ll=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] text-white font-bold whitespace-nowrap transition-colors shadow-sm">
                     Apple
                  </a>
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-orange-500 hover:bg-orange-600 text-[10px] text-white font-bold whitespace-nowrap transition-colors shadow-sm">
                    Google
                  </a>
                </div>
              </div>
            </div>
          )}
        </div>
      </Modal>
    </div>
  )
}