import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Calendar, FileText, Clock, AlertTriangle, Play, Square, MapPin,
  ChevronLeft, ChevronRight, Timer, Zap, Activity, Coffee, Briefcase, ChevronRight as ChevronR
} from 'lucide-react'
import { useStaff } from '../../context/StaffContext'

/* ─── helpers ─── */
function formatTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}
function formatDate(iso) {
  if (!iso) return '—'
  const d = new Date(iso), today = new Date()
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
  const h = Math.floor(diff / 3600000), m = Math.floor((diff % 3600000) / 60000), s = Math.floor((diff % 60000) / 1000)
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
  const now = new Date(), startOfWeek = new Date(now)
  startOfWeek.setDate(now.getDate() - now.getDay() + 1); startOfWeek.setHours(0, 0, 0, 0)
  return shifts.filter(s => s.status === 'completed' && new Date(s.shift_date) >= startOfWeek)
    .reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
}

const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700', orange: 'bg-orange-50 text-orange-700', teal: 'bg-teal-50 text-teal-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

function LiveClock({ clockInTime }) {
  const [time, setTime] = useState(getLiveTimer(clockInTime))
  useEffect(() => { const i = setInterval(() => setTime(getLiveTimer(clockInTime)), 1000); return () => clearInterval(i) }, [clockInTime])
  return <span className="font-mono text-3xl font-black tracking-tight">{time}</span>
}

function CompletionRing({ completed, total, size = 64 }) {
  const pct = total === 0 ? 100 : Math.round((completed / total) * 100)
  const r = (size - 8) / 2, circ = 2 * Math.PI * r, offset = circ - (pct / 100) * circ
  const color = pct === 100 ? '#10b981' : pct >= 50 ? '#f59e0b' : '#ef4444'
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="#f1f5f9" strokeWidth="6" />
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color} strokeWidth="6" strokeDasharray={circ} strokeDashoffset={offset} strokeLinecap="round" style={{ transition: 'stroke-dashoffset 1s ease' }} />
      </svg>
      <div className="absolute inset-0 flex items-center justify-center"><span className="text-sm font-black text-gray-800">{pct}%</span></div>
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
        <div className="h-full rounded-full transition-all duration-1000 ease-out" style={{ width: `${pct}%`, background: pct >= 100 ? 'linear-gradient(90deg, #10b981, #059669)' : pct >= 70 ? 'linear-gradient(90deg, #22c55e, #16a34a)' : 'linear-gradient(90deg, #f59e0b, #f97316)' }} />
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
          <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-700 truncate">{e.text}</p><p className="text-[10px] text-gray-400">{formatDate(e.time)} · {formatTime(e.time)}</p></div>
        </div>
      ))}
    </div>
  )
}

function MiniCalendar({ shifts, selectedDate, onSelectDate }) {
  const [viewDate, setViewDate] = useState(new Date())
  const year = viewDate.getFullYear(), month = viewDate.getMonth()
  const firstDay = new Date(year, month, 1).getDay(), daysInMonth = new Date(year, month + 1, 0).getDate()
  const today = new Date(), adjustedFirst = firstDay === 0 ? 6 : firstDay - 1
  const shiftDates = {}
  shifts.forEach(s => { if (!shiftDates[s.shift_date]) shiftDates[s.shift_date] = []; shiftDates[s.shift_date].push(s) })
  const cells = []; for (let i = 0; i < adjustedFirst; i++) cells.push(null); for (let d = 1; d <= daysInMonth; d++) cells.push(d)
  return (
    <div>
      <div className="flex items-center justify-between mb-3">
        <button onClick={() => setViewDate(new Date(year, month - 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} className="text-gray-400" /></button>
        <p className="text-sm font-bold text-gray-800">{viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}</p>
        <button onClick={() => setViewDate(new Date(year, month + 1, 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} className="text-gray-400" /></button>
      </div>
      <div className="grid grid-cols-7 gap-0.5 mb-1">{['M','T','W','T','F','S','S'].map((d,i) => <div key={i} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>)}</div>
      <div className="grid grid-cols-7 gap-0.5">
        {cells.map((day, i) => {
          if (!day) return <div key={`e-${i}`} />
          const dateStr = `${year}-${String(month+1).padStart(2,'0')}-${String(day).padStart(2,'0')}`
          const hasShifts = shiftDates[dateStr], isToday = today.getDate() === day && today.getMonth() === month && today.getFullYear() === year, isSelected = selectedDate === dateStr
          return (
            <button key={day} onClick={() => onSelectDate(dateStr)}
              className={`relative h-9 rounded-lg text-xs font-semibold transition-all ${isSelected ? 'bg-gradient-to-br from-emerald-500 to-green-600 text-white shadow-md shadow-emerald-200' : isToday ? 'bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200' : hasShifts ? 'bg-white hover:bg-gray-50 text-gray-800' : 'text-gray-400 hover:bg-gray-50'}`}>
              {day}
              {hasShifts && !isSelected && <div className="absolute bottom-1 left-1/2 -translate-x-1/2 flex gap-0.5">{hasShifts.slice(0,3).map((s,j) => <div key={j} className={`w-1 h-1 rounded-full ${s.status === 'completed' ? 'bg-emerald-400' : s.status === 'in_progress' ? 'bg-orange-400' : 'bg-green-400'}`} />)}</div>}
            </button>
          )
        })}
      </div>
    </div>
  )
}

export default function StaffDashboard() {
  const navigate = useNavigate()
  const { staffProfile, myShifts, inProgressShift, upcomingShifts, completedShifts, pendingNotes, handleClockIn, handleClockOut } = useStaff()
  const [showNote, setShowNote] = useState(null)
  const [selectedCalDate, setSelectedCalDate] = useState(null)

  const greeting = getGreeting()
  const streak = getStreak(myShifts)
  const totalHours = completedShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
  const weekHours = getWeekHours(myShifts)
  const notesCompleted = completedShifts.length - pendingNotes.length
  const selectedDayShifts = selectedCalDate ? myShifts.filter(s => s.shift_date === selectedCalDate) : []

  return (
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
                  <button onClick={() => navigate('/staff/notes')} className="px-5 py-2.5 bg-white/20 hover:bg-white/30 backdrop-blur-sm rounded-xl text-white text-sm font-bold flex items-center gap-2 transition-all border border-white/20"><FileText size={16} /> Add Note</button>
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
                  {pendingNotes.length > 0 && <button onClick={() => navigate('/staff/notes')} className="text-xs text-amber-600 font-bold mt-1 hover:text-amber-700">{pendingNotes.length} pending →</button>}
                </div>
              </div>
            </div>
          </div>

          <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Recent Activity</p>
            <ActivityFeed shifts={myShifts} />
          </div>

          {/* Upcoming Shifts */}
          <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-3">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Upcoming Shifts</p>
              <button onClick={() => navigate('/staff/shifts')} className="text-xs text-emerald-600 font-bold hover:text-emerald-700">View all →</button>
            </div>
            {upcomingShifts.length > 0 ? (
              <div className="space-y-2">
                {upcomingShifts.slice(0, 5).map(s => {
                  const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                  const isToday = s.shift_date === new Date().toISOString().split('T')[0]
                  return (
                    <div key={s.id} className={`p-3 rounded-xl border flex items-center gap-3 ${isToday ? 'bg-emerald-50 border-emerald-200' : 'border-gray-100 hover:bg-gray-50'} transition-all`}>
                      <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${isToday ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow shadow-emerald-200' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
                        <Calendar size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-800 text-sm">{pName}</p>
                        <p className="text-xs text-gray-500">{formatDate(s.shift_date)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                        <p className="text-[10px] text-gray-400">{s.service_type || s.title || 'Support'}{s.location ? ` · ${s.location}` : ''}</p>
                      </div>
                      <Badge color={isToday ? 'green' : 'blue'}>{isToday ? 'Today' : formatDate(s.shift_date)}</Badge>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="text-center py-6"><Calendar size={24} className="text-gray-200 mx-auto mb-2" /><p className="text-xs text-gray-400">No upcoming shifts</p></div>
            )}
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
                    <div className="flex-1 min-w-0"><p className="text-xs font-semibold text-gray-800 truncate">{s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'}</p><p className="text-[10px] text-gray-400">{formatTime(s.start_time)} – {formatTime(s.end_time)}</p></div>
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
                  <button onClick={() => navigate('/staff/notes')} className="mt-2 px-3 py-1.5 bg-white/20 rounded-lg text-white text-xs font-bold hover:bg-white/30 transition-all">Submit now →</button>
                </div>
              </div>
            </div>
          )}

          <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-bold text-gray-500 uppercase tracking-wider mb-3">Quick Actions</p>
            <div className="space-y-1.5">
              {[
                { label: 'View All Shifts', icon: Calendar, bg: 'bg-emerald-50', text: 'text-emerald-600', action: () => navigate('/staff/shifts') },
                { label: 'Submit a Form', icon: Briefcase, bg: 'bg-violet-50', text: 'text-violet-600', action: () => navigate('/staff/forms') },
                { label: 'Request Time Off', icon: Clock, bg: 'bg-orange-50', text: 'text-orange-600', action: () => navigate('/staff/timeoff') },
              ].map(item => (
                <button key={item.label} onClick={item.action} className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/80 hover:shadow transition-all text-left">
                  <div className={`w-8 h-8 rounded-lg ${item.bg} flex items-center justify-center`}><item.icon size={16} className={item.text} /></div>
                  <span className="text-sm font-semibold text-gray-700">{item.label}</span><ChevronR size={16} className="text-gray-300 ml-auto" />
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}