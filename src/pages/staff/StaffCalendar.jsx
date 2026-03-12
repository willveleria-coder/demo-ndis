import { useState, useRef } from 'react'
import { ChevronLeft, ChevronRight, Calendar, MapPin, Play, Square, Activity, CheckCircle2, Clock, X, User, FileText } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import Modal from '../../components/ui/Modal'

function formatTime(iso) { if (!iso) return null; return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) }

const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', blue: 'bg-sky-50 text-sky-700', orange: 'bg-orange-50 text-orange-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

function MapPreview({ location }) {
  const [coords, setCoords] = useState(null)
  const [loading, setLoading] = useState(false)
  const fetched = useRef(false)

  if (!location || location.length < 5) return null

  if (!fetched.current) {
    fetched.current = true
    setLoading(true)
    fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(location + ', Australia')}&limit=1`, {
      headers: { 'User-Agent': 'MapleCareSupport/1.0' }
    }).then(r => r.json()).then(data => {
      if (data?.[0]) setCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
    }).catch(() => {}).finally(() => setLoading(false))
  }

  if (loading) return <div className="h-[190px] rounded-2xl bg-gray-50 border border-gray-100 flex items-center justify-center"><div className="w-5 h-5 border-2 border-emerald-300 border-t-transparent rounded-full animate-spin" /></div>
  if (!coords) return null

  const zoom = 15
  const n = Math.pow(2, zoom)
  const xtile = ((coords.lon + 180) / 360) * n
  const ytile = ((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2) * n
  const cx = Math.floor(xtile), cy = Math.floor(ytile)
  const tiles = []
  for (let dx = -2; dx <= 2; dx++) for (let dy = -2; dy <= 2; dy++) tiles.push({ x: cx + dx, y: cy + dy, dx, dy })
  const offsetX = (xtile - cx) * 256, offsetY = (ytile - cy) * 256

  return (
    <div className="rounded-2xl overflow-hidden border border-emerald-100 shadow-sm" style={{ background: '#f8f9fa' }}>
      <div className="relative" style={{ height: '190px', overflow: 'hidden' }}>
        <div style={{ position: 'absolute', left: `calc(50% - ${offsetX}px - 512px)`, top: `calc(50% - ${offsetY}px - 512px)`, width: `${256 * 5}px`, height: `${256 * 5}px` }}>
          {tiles.map(t => (
            <img key={`${t.x}-${t.y}`} src={`https://a.basemaps.cartocdn.com/light_all/${zoom}/${t.x}/${t.y}@2x.png`}
              alt="" style={{ position: 'absolute', left: `${(t.dx + 2) * 256}px`, top: `${(t.dy + 2) * 256}px`, width: '256px', height: '256px' }} draggable={false} />
          ))}
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -4px)', zIndex: 9 }}>
          <div style={{ width: '14px', height: '6px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', filter: 'blur(2px)', margin: '0 auto' }} />
        </div>
        <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(16,185,129,0.4))' }}>
          <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="url(#spg)" />
            <circle cx="18" cy="16.5" r="7" fill="white" />
            <circle cx="18" cy="16.5" r="3.5" fill="url(#spg2)" />
            <defs>
              <linearGradient id="spg" x1="4" y1="2" x2="32" y2="44"><stop stopColor="#10b981" /><stop offset="1" stopColor="#059669" /></linearGradient>
              <linearGradient id="spg2" x1="14" y1="13" x2="22" y2="20"><stop stopColor="#10b981" /><stop offset="1" stopColor="#047857" /></linearGradient>
            </defs>
          </svg>
        </div>
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(248,249,250,0.3) 0%, transparent 15%, transparent 80%, rgba(248,249,250,0.6) 100%)', pointerEvents: 'none' }} />
      </div>
      <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #ecfdf5, #f0fdf4)' }}>
        <div className="w-7 h-7 rounded-full bg-gradient-to-br from-emerald-400 to-green-500 flex items-center justify-center shadow-md shadow-emerald-200 shrink-0">
          <MapPin size={13} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-[11px] font-semibold text-gray-700 truncate">{coords.display?.split(',').slice(0, 3).join(',')}</p>
          <p className="text-[9px] text-gray-400 truncate">{coords.display?.split(',').slice(3).join(',').trim()}</p>
        </div>
        <div className="flex gap-1.5 shrink-0">
          <a href={`https://maps.apple.com/?q=${encodeURIComponent(coords.display)}&ll=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] text-white font-bold transition-colors shadow-sm">
             Apple
          </a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[10px] text-white font-bold transition-colors shadow-sm">
            Google
          </a>
        </div>
      </div>
    </div>
  )
}

export default function StaffCalendar() {
  const { myShifts, handleClockIn, handleClockOut } = useStaff()
  const [viewDate, setViewDate] = useState(new Date())
  const [viewMode, setViewMode] = useState('month')
  const [selectedDate, setSelectedDate] = useState(null)
  const [viewShift, setViewShift] = useState(null)

  const today = new Date()
  const year = viewDate.getFullYear(), month = viewDate.getMonth()

  const shiftsByDate = {}
  myShifts.forEach(s => { if (!shiftsByDate[s.shift_date]) shiftsByDate[s.shift_date] = []; shiftsByDate[s.shift_date].push(s) })

  const navPrev = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month - 1, 1))
    else if (viewMode === 'week') setViewDate(new Date(viewDate.getTime() - 7 * 86400000))
    else setViewDate(new Date(viewDate.getTime() - 86400000))
  }
  const navNext = () => {
    if (viewMode === 'month') setViewDate(new Date(year, month + 1, 1))
    else if (viewMode === 'week') setViewDate(new Date(viewDate.getTime() + 7 * 86400000))
    else setViewDate(new Date(viewDate.getTime() + 86400000))
  }
  const navLabel = () => {
    if (viewMode === 'month') return viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
    if (viewMode === 'day') return viewDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    const start = getWeekStart(viewDate)
    const end = new Date(start.getTime() + 6 * 86400000)
    return `${start.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${end.toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}`
  }

  function getWeekStart(d) { const date = new Date(d); const day = date.getDay(); const diff = day === 0 ? 6 : day - 1; date.setDate(date.getDate() - diff); date.setHours(0, 0, 0, 0); return date }
  function ds(d) { return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}` }
  function isSameDay(d1, d2) { return d1.getDate() === d2.getDate() && d1.getMonth() === d2.getMonth() && d1.getFullYear() === d2.getFullYear() }

  const openShift = (s) => setViewShift(s)

  // ─── SHIFT DETAIL MODAL ───
  const ShiftDetailModal = () => {
    if (!viewShift) return null
    const s = viewShift
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
    const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
    const shiftDate = s.shift_date ? new Date(s.shift_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }) : ''

    return (
      <Modal isOpen={!!viewShift} onClose={() => setViewShift(null)} title="Shift Details" wide>
        <div className="space-y-4">
          {/* Status banner */}
          <div className={`p-4 rounded-xl flex items-center gap-4 ${isActive ? 'bg-emerald-50 border border-emerald-200' : isDone ? 'bg-gray-50 border border-gray-200' : 'bg-green-50 border border-green-200'}`}>
            <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${isActive ? 'bg-gradient-to-br from-emerald-500 to-green-600' : isDone ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
              {isActive ? <Activity size={22} /> : isDone ? <CheckCircle2 size={22} /> : <Calendar size={22} />}
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <p className="font-bold text-gray-900 text-lg">{pName}</p>
                <Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
              </div>
              <p className="text-sm text-gray-500">{s.service_type || s.title || 'Support'}</p>
            </div>
          </div>

          {/* Details grid */}
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Date</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{shiftDate}</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider">Time</p>
              <p className="text-sm font-bold text-gray-800 mt-0.5">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
            </div>
            {s.clock_in && (
              <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
                <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Clocked In</p>
                <p className="text-sm font-bold text-emerald-700 mt-0.5">{formatTime(s.clock_in)}</p>
              </div>
            )}
            {s.clock_out && (
              <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
                <p className="text-[10px] text-orange-600 font-bold uppercase tracking-wider">Clocked Out</p>
                <p className="text-sm font-bold text-orange-700 mt-0.5">{formatTime(s.clock_out)}</p>
              </div>
            )}
          </div>

          {s.location && (
            <div className="space-y-2">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider flex items-center gap-1"><MapPin size={10} /> Location</p>
              <p className="text-sm text-gray-700 font-medium">{s.location}</p>
              <MapPreview key={s.id} location={s.location} />
            </div>
          )}

          {s.notes && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.notes}</p>
            </div>
          )}

          {/* Clock In/Out buttons */}
          <div className="flex gap-2 pt-1">
            {(s.status === 'scheduled' || s.status === 'upcoming') && (
              <button onClick={() => { handleClockIn(s.id); setViewShift(null) }} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                <Play size={16} /> Clock In
              </button>
            )}
            {isActive && (
              <button onClick={() => { handleClockOut(s.id); setViewShift(null) }} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2">
                <Square size={14} /> Clock Out
              </button>
            )}
            <button onClick={() => setViewShift(null)} className={`${(s.status === 'scheduled' || s.status === 'upcoming' || isActive) ? 'w-auto px-6' : 'flex-1'} py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors`}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  // ─── SHIFT CARD (for selected date list) ───
  const ShiftCard = ({ s }) => {
    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
    const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
    return (
      <button onClick={() => openShift(s)} className={`w-full text-left rounded-xl border p-4 bg-white/80 backdrop-blur-sm shadow-sm flex items-center gap-4 hover:shadow-md transition-all ${isActive ? 'border-emerald-200' : 'border-gray-200'}`}>
        <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${isActive ? 'bg-gradient-to-br from-emerald-500 to-green-600' : isDone ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
          {isActive ? <Activity size={20} /> : isDone ? <CheckCircle2 size={20} /> : <Calendar size={20} />}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2"><p className="font-bold text-gray-900">{pName}</p><Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'}>{(s.status || 'scheduled').replace('_', ' ')}</Badge></div>
          <p className="text-sm text-gray-500">{s.service_type || s.title || 'Support'}</p>
          <div className="flex items-center gap-3 mt-1">
            <span className="text-xs text-gray-400">{formatTime(s.start_time)} – {formatTime(s.end_time)}</span>
            {s.location && <span className="text-xs text-gray-400 flex items-center gap-1"><MapPin size={10} />{s.location}</span>}
          </div>
        </div>
        <ChevronRight size={18} className="text-gray-300 shrink-0" />
      </button>
    )
  }

  // ─── MONTH VIEW ───
  const MonthView = () => {
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
    const cells = []
    for (let i = 0; i < adjustedFirst; i++) cells.push(null)
    for (let d = 1; d <= daysInMonth; d++) cells.push(d)
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-7 border-b border-gray-100">
          {['Mon','Tue','Wed','Thu','Fri','Sat','Sun'].map(d => (
            <div key={d} className="py-3 text-center text-xs font-bold text-gray-400 uppercase tracking-wider">{d}</div>
          ))}
        </div>
        <div className="grid grid-cols-7">
          {cells.map((day, i) => {
            if (!day) return <div key={`e-${i}`} className="min-h-[80px] border-b border-r border-gray-50" />
            const dStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
            const dayShifts = shiftsByDate[dStr] || []
            const isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year
            const isSelected = selectedDate === dStr
            return (
              <button key={day} onClick={() => setSelectedDate(dStr === selectedDate ? null : dStr)}
                className={`min-h-[80px] p-2 text-left border-b border-r border-gray-50 transition-all hover:bg-emerald-50/50 ${isSelected ? 'bg-emerald-50 ring-2 ring-emerald-400 ring-inset' : ''}`}>
                <div className="flex items-center justify-between mb-1">
                  <span className={`text-sm font-bold w-7 h-7 flex items-center justify-center rounded-lg ${isToday ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow shadow-emerald-200' : 'text-gray-700'}`}>{day}</span>
                  {dayShifts.length > 0 && <span className="text-[10px] font-bold text-emerald-600 bg-emerald-50 px-1.5 py-0.5 rounded">{dayShifts.length}</span>}
                </div>
                <div className="space-y-0.5">
                  {dayShifts.slice(0, 2).map(s => (
                    <div key={s.id} className={`text-[10px] px-1.5 py-0.5 rounded font-medium truncate ${s.status === 'completed' ? 'bg-gray-100 text-gray-500' : s.status === 'in_progress' ? 'bg-emerald-100 text-emerald-700' : 'bg-green-50 text-green-700'}`}>
                      {formatTime(s.start_time)} {s.participants ? s.participants.first_name : ''}
                    </div>
                  ))}
                  {dayShifts.length > 2 && <p className="text-[10px] text-gray-400 font-medium">+{dayShifts.length - 2} more</p>}
                </div>
              </button>
            )
          })}
        </div>
      </div>
    )
  }

  // ─── WEEK VIEW ───
  const WeekView = () => {
    const weekStart = getWeekStart(viewDate)
    const days = Array.from({ length: 7 }, (_, i) => { const d = new Date(weekStart.getTime() + i * 86400000); return { date: d, str: ds(d) } })
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="grid grid-cols-7 divide-x divide-gray-100">
          {days.map(day => {
            const dayShifts = shiftsByDate[day.str] || []
            const isToday = isSameDay(day.date, today)
            return (
              <div key={day.str} className={`min-h-[400px] ${isToday ? 'bg-emerald-50/30' : ''}`}>
                <div className={`p-3 text-center border-b border-gray-100 ${isToday ? 'bg-emerald-50' : ''}`}>
                  <p className={`text-xs font-bold ${isToday ? 'text-emerald-600' : 'text-gray-400'}`}>{day.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
                  <p className={`text-lg font-bold ${isToday ? 'text-emerald-700' : 'text-gray-800'}`}>{day.date.getDate()}</p>
                </div>
                <div className="p-2 space-y-2">
                  {dayShifts.length > 0 ? dayShifts.map(s => {
                    const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
                    return (
                      <button key={s.id} onClick={() => openShift(s)} className={`w-full text-left p-2 rounded-lg text-xs border hover:shadow-md transition-all ${isActive ? 'bg-emerald-50 border-emerald-200' : isDone ? 'bg-gray-50 border-gray-200' : 'bg-white border-gray-100'}`}>
                        <p className="font-bold text-gray-800 truncate">{s.participants ? s.participants.first_name : 'Shift'}</p>
                        <p className="text-gray-500 mt-0.5">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        <p className="text-gray-400 truncate mt-0.5">{s.service_type || 'Support'}</p>
                        {s.location && <p className="text-gray-400 truncate flex items-center gap-1 mt-0.5"><MapPin size={8} />{s.location}</p>}
                      </button>
                    )
                  }) : <p className="text-[10px] text-gray-300 text-center mt-4">No shifts</p>}
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
    const dStr = ds(viewDate)
    const dayShifts = (shiftsByDate[dStr] || []).sort((a, b) => new Date(a.start_time) - new Date(b.start_time))
    return (
      <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100">
          <p className="font-bold text-gray-800">{viewDate.toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}</p>
          <p className="text-sm text-gray-500">{dayShifts.length} shift{dayShifts.length !== 1 ? 's' : ''}</p>
        </div>
        <div className="divide-y divide-gray-50">
          {dayShifts.length > 0 ? dayShifts.map(s => {
            const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
            const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
            return (
              <button key={s.id} onClick={() => openShift(s)} className={`w-full text-left flex items-center gap-4 p-4 hover:bg-emerald-50/30 transition-all ${isActive ? 'bg-emerald-50/30' : ''}`}>
                <div className="w-16 text-center shrink-0">
                  <p className="text-sm font-bold text-gray-800">{formatTime(s.start_time)}</p>
                  <p className="text-[10px] text-gray-400">{formatTime(s.end_time)}</p>
                </div>
                <div className={`w-1 self-stretch rounded-full ${isActive ? 'bg-emerald-400' : isDone ? 'bg-gray-300' : 'bg-emerald-400'}`} />
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-bold text-sm text-gray-800">{pName}</p>
                    <Badge color={isActive ? 'green' : isDone ? 'gray' : 'blue'}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
                  </div>
                  <p className="text-xs text-gray-500 mt-0.5">{s.service_type || 'Support'}</p>
                  {s.location && <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5"><MapPin size={10} />{s.location}</p>}
                </div>
                <ChevronRight size={18} className="text-gray-300 shrink-0" />
              </button>
            )
          }) : (
            <div className="text-center py-12"><Calendar size={40} className="text-gray-200 mx-auto mb-2" /><p className="text-gray-400 text-sm">No shifts scheduled for this day</p></div>
          )}
        </div>
      </div>
    )
  }

  const selectedShifts = selectedDate ? (shiftsByDate[selectedDate] || []) : []

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
        <div><h2 className="text-2xl font-black text-gray-900">Calendar</h2><p className="text-gray-500 text-sm">View your shift schedule</p></div>
        <div className="flex bg-white/80 rounded-xl border border-gray-200 p-1 shadow-sm">
          {['month', 'week', 'day'].map(mode => (
            <button key={mode} onClick={() => setViewMode(mode)}
              className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all ${viewMode === mode ? 'bg-gradient-to-r from-emerald-500 to-green-600 text-white shadow' : 'text-gray-500 hover:text-gray-700'}`}>
              {mode.charAt(0).toUpperCase() + mode.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <div className="flex items-center justify-between bg-white/80 rounded-xl border border-gray-200 p-3 shadow-sm">
        <button onClick={navPrev} className="p-2 rounded-xl hover:bg-gray-100"><ChevronLeft size={20} className="text-gray-500" /></button>
        <h3 className="text-lg font-bold text-gray-800">{navLabel()}</h3>
        <div className="flex items-center gap-2">
          <button onClick={() => setViewDate(new Date())} className="px-3 py-1.5 text-xs font-semibold text-emerald-600 bg-emerald-50 rounded-lg hover:bg-emerald-100">Today</button>
          <button onClick={navNext} className="p-2 rounded-xl hover:bg-gray-100"><ChevronRight size={20} className="text-gray-500" /></button>
        </div>
      </div>

      {viewMode === 'month' && <MonthView />}
      {viewMode === 'week' && <WeekView />}
      {viewMode === 'day' && <DayView />}

      {viewMode === 'month' && selectedDate && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">{new Date(selectedDate + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</h3>
          {selectedShifts.length > 0 ? selectedShifts.map(s => <ShiftCard key={s.id} s={s} />) : (
            <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-8 text-center"><Calendar size={32} className="text-gray-200 mx-auto mb-2" /><p className="text-sm text-gray-400">No shifts this day</p></div>
          )}
        </div>
      )}

      <ShiftDetailModal />
    </div>
  )
}