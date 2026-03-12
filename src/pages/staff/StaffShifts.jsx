import { useState, useRef } from 'react'
import { Calendar, FileText, Play, Square, MapPin, Activity, CheckCircle2, ChevronLeft, ChevronRight, Clock } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

function formatTime(iso) { if (!iso) return null; return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) }
function formatDate(iso) {
  if (!iso) return '—'; const d = new Date(iso), today = new Date(), tomorrow = new Date(today), yesterday = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'; if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'; if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}
const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700', orange: 'bg-orange-50 text-orange-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

function MapPreview({ location, mapKey }) {
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

  const zoom = 15, n = Math.pow(2, zoom)
  const xtile = ((coords.lon + 180) / 360) * n
  const ytile = ((1 - Math.log(Math.tan(coords.lat * Math.PI / 180) + 1 / Math.cos(coords.lat * Math.PI / 180)) / Math.PI) / 2) * n
  const cx = Math.floor(xtile), cy = Math.floor(ytile), tiles = []
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
            <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="url(#shpg)" />
            <circle cx="18" cy="16.5" r="7" fill="white" />
            <circle cx="18" cy="16.5" r="3.5" fill="url(#shpg2)" />
            <defs>
              <linearGradient id="shpg" x1="4" y1="2" x2="32" y2="44"><stop stopColor="#10b981" /><stop offset="1" stopColor="#059669" /></linearGradient>
              <linearGradient id="shpg2" x1="14" y1="13" x2="22" y2="20"><stop stopColor="#10b981" /><stop offset="1" stopColor="#047857" /></linearGradient>
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
          <a href={`https://maps.apple.com/?q=${encodeURIComponent(coords.display)}&ll=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-gray-900 hover:bg-gray-800 text-[10px] text-white font-bold transition-colors shadow-sm"> Apple</a>
          <a href={`https://www.google.com/maps/search/?api=1&query=${coords.lat},${coords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-emerald-500 hover:bg-emerald-600 text-[10px] text-white font-bold transition-colors shadow-sm">Google</a>
        </div>
      </div>
    </div>
  )
}

function WeekStrip({ shifts }) {
  const today = new Date(), days = []
  for (let i = -1; i < 6; i++) { const d = new Date(today); d.setDate(d.getDate() + i); const dateStr = d.toISOString().split('T')[0]; days.push({ date: d, dateStr, shifts: shifts.filter(s => s.shift_date === dateStr), isToday: i === 0 }) }
  return (
    <div className="flex gap-1.5">
      {days.map(d => (
        <div key={d.dateStr} className={`flex-1 rounded-xl p-2 text-center transition-all ${d.isToday ? 'bg-gradient-to-b from-emerald-500 to-green-600 text-white shadow-lg shadow-emerald-200 scale-105' : 'bg-white/60 hover:bg-white/80 border border-gray-100'}`}>
          <p className={`text-[10px] font-bold uppercase tracking-wider ${d.isToday ? 'text-emerald-100' : 'text-gray-400'}`}>{d.date.toLocaleDateString('en-AU', { weekday: 'short' })}</p>
          <p className={`text-lg font-black ${d.isToday ? 'text-white' : 'text-gray-800'}`}>{d.date.getDate()}</p>
          {d.shifts.length > 0 && <div className="flex justify-center gap-0.5 mt-1">{d.shifts.map((s, i) => <div key={i} className={`w-1.5 h-1.5 rounded-full ${d.isToday ? 'bg-white' : s.status === 'completed' ? 'bg-emerald-400' : 'bg-green-400'}`} />)}</div>}
        </div>
      ))}
    </div>
  )
}

export default function StaffShifts() {
  const { myShifts, upcomingShifts, handleClockIn, handleClockOut, staffProfile, refreshShifts } = useStaff()
  const [expandedShift, setExpandedShift] = useState(null)
  const [showNote, setShowNote] = useState(null)
  const [viewShift, setViewShift] = useState(null)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  const [shiftView, setShiftView] = useState('week')
  const [viewDate, setViewDate] = useState(new Date())

  const handleSubmitNote = async () => {
    if (!showNote) return
    try {
      const hasExisting = showNote.shift_notes && showNote.shift_notes.length > 0
      const payload = { ...noteForm }
      payload.content = [noteForm.mood && `Mood: ${noteForm.mood}`, noteForm.activities && `Activities: ${noteForm.activities}`, noteForm.goals_progress && `Goals: ${noteForm.goals_progress}`, noteForm.concerns && `Concerns: ${noteForm.concerns}`, noteForm.recommendations && `Recommendations: ${noteForm.recommendations}`].filter(Boolean).join('\n\n')
      if (hasExisting) {
        const { error } = await supabase.from('shift_notes').update(payload).eq('id', showNote.shift_notes[0].id)
        if (error) throw error; alert('Note updated!')
      } else {
        payload.shift_id = showNote.id; payload.staff_id = staffProfile?.id
        const { error } = await supabase.from('shift_notes').insert(payload).select()
        if (error) { if (error.message?.includes('column') || error.code === '42703') { await supabase.from('shift_notes').insert({ shift_id: showNote.id, staff_id: staffProfile?.id, content: payload.content }) } else throw error }
        alert('Shift note submitted!')
      }
      await refreshShifts()
      setShowNote(null); setNoteForm({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
    } catch (err) { console.error(err); alert('Failed to save note: ' + (err.message || 'Unknown error')) }
  }

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
              <MapPreview key={s.id} location={s.location} mapKey={s.id} />
            </div>
          )}

          {s.notes && (
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-wider mb-1">Notes</p>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{s.notes}</p>
            </div>
          )}

          <div className="flex gap-2 pt-1">
            {(s.status === 'scheduled' || s.status === 'upcoming') && (
              <button onClick={() => { handleClockIn(s.id); setViewShift(null) }} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center justify-center gap-2">
                <Play size={16} /> Clock In
              </button>
            )}
            {isActive && (
              <>
                <button onClick={() => { handleClockOut(s.id); setViewShift(null) }} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2">
                  <Square size={14} /> Clock Out
                </button>
                <button onClick={() => { setViewShift(null); setShowNote(s) }} className="px-5 py-3 bg-white border-2 border-emerald-200 rounded-xl text-emerald-700 text-sm font-bold flex items-center gap-2 hover:bg-emerald-50">
                  <FileText size={14} /> Note
                </button>
              </>
            )}
            {isDone && (
              <button onClick={() => { setViewShift(null); setShowNote(s) }} className="flex-1 py-3 bg-amber-50 border border-amber-200 rounded-xl text-amber-700 text-sm font-bold flex items-center justify-center gap-2 hover:bg-amber-100">
                <FileText size={14} /> Add Note
              </button>
            )}
            <button onClick={() => setViewShift(null)} className={`${(s.status === 'scheduled' || s.status === 'upcoming' || isActive) ? 'w-auto px-6' : isDone ? 'w-auto px-6' : 'flex-1'} py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors`}>
              Close
            </button>
          </div>
        </div>
      </Modal>
    )
  }

  return (
    <div className="space-y-6">
      <div><h2 className="text-2xl font-black text-gray-900">My Shifts</h2><p className="text-gray-500 text-sm">{myShifts.length} total · {upcomingShifts.length} upcoming</p></div>
      <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm"><WeekStrip shifts={myShifts} /></div>

      {/* Upcoming Shifts — Week/Month View */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Upcoming Shifts</p>
          <div className="flex gap-1 bg-gray-100 rounded-lg p-0.5">
            <button onClick={() => setShiftView('week')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${shiftView === 'week' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Week</button>
            <button onClick={() => setShiftView('month')} className={`px-2.5 py-1 rounded-md text-[10px] font-semibold transition-all ${shiftView === 'month' ? 'bg-white shadow text-gray-800' : 'text-gray-500'}`}>Month</button>
          </div>
        </div>
        {(() => {
          let startDate, endDate, label
          if (shiftView === 'week') {
            startDate = new Date(viewDate); startDate.setDate(startDate.getDate() - startDate.getDay() + 1)
            endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 6)
            label = `${startDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – ${endDate.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}`
          } else {
            startDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), 1)
            endDate = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0)
            label = viewDate.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })
          }
          const startStr = startDate.toISOString().split('T')[0], endStr = endDate.toISOString().split('T')[0]
          const rangeShifts = myShifts.filter(s => s.shift_date >= startStr && s.shift_date <= endStr).sort((a, b) => a.shift_date.localeCompare(b.shift_date) || (a.start_time || '').localeCompare(b.start_time || ''))
          const goPrev = () => { const d = new Date(viewDate); shiftView === 'week' ? d.setDate(d.getDate() - 7) : d.setMonth(d.getMonth() - 1); setViewDate(d) }
          const goNext = () => { const d = new Date(viewDate); shiftView === 'week' ? d.setDate(d.getDate() + 7) : d.setMonth(d.getMonth() + 1); setViewDate(d) }

          return (
            <>
              <div className="flex items-center justify-between mb-3">
                <button onClick={goPrev} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronLeft size={14} /></button>
                <p className="text-sm font-bold text-gray-700">{label}</p>
                <button onClick={goNext} className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200"><ChevronRight size={14} /></button>
              </div>
              {rangeShifts.length > 0 ? (
                <div className="space-y-2">
                  {rangeShifts.map(s => {
                    const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Shift'
                    const isToday = s.shift_date === new Date().toISOString().split('T')[0]
                    return (
                      <button key={s.id} onClick={() => setViewShift(s)} className={`w-full text-left p-3 rounded-xl border flex items-center gap-3 hover:shadow-md transition-all ${isToday ? 'bg-emerald-50 border-emerald-200' : 'border-gray-100 hover:border-gray-200'}`}>
                        <div className={`w-10 h-10 rounded-lg flex items-center justify-center text-white shrink-0 ${s.status === 'completed' ? 'bg-gray-400' : 'bg-gradient-to-br from-emerald-500 to-green-600'}`}>
                          <Calendar size={16} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-gray-800 text-sm">{pName}</p>
                          <p className="text-xs text-gray-500">{formatDate(s.shift_date)} · {formatTime(s.start_time)} – {formatTime(s.end_time)}</p>
                          <p className="text-[10px] text-gray-400">{s.service_type || s.title || 'Support'}{s.location ? ` · ${s.location}` : ''}</p>
                        </div>
                        <Badge color={s.status === 'completed' ? 'gray' : s.status === 'in_progress' ? 'green' : 'blue'}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
                      </button>
                    )
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-400 text-center py-4">No shifts this {shiftView}</p>
              )}
            </>
          )
        })()}
      </div>

      <div><h3 className="text-base font-bold text-gray-800 mb-3">All Shifts</h3></div>
      <div className="space-y-3">
        {myShifts.length > 0 ? myShifts.map(s => {
          const pName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
          const isActive = s.status === 'in_progress', isDone = s.status === 'completed'
          return (
            <div key={s.id} className={`rounded-xl border transition-all overflow-hidden bg-white/80 backdrop-blur-sm shadow-sm ${isActive ? 'border-emerald-200 shadow-md shadow-emerald-100' : 'border-gray-200 hover:shadow-md'}`}>
              <div className="p-4 flex items-center gap-4 cursor-pointer" onClick={() => setViewShift(s)}>
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-white shadow-lg shrink-0 ${isActive ? 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-200' : isDone ? 'bg-gradient-to-br from-gray-400 to-gray-500' : 'bg-gradient-to-br from-emerald-500 to-green-600 shadow-emerald-200'}`}>
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
            </div>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-16 text-center"><Calendar size={48} className="text-gray-200 mx-auto mb-4" /><p className="font-bold text-gray-800">No shifts yet</p><p className="text-sm text-gray-400 mt-1">Your admin will assign shifts to you</p></div>
        )}
      </div>

      {/* Shift Detail Modal */}
      <ShiftDetailModal />

      {/* Note Modal */}
      <Modal isOpen={!!showNote} onClose={() => setShowNote(null)} title="Shift Note" wide>
        <div className="space-y-4">
          {showNote && <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 flex items-center gap-3"><Calendar size={18} className="text-emerald-500 shrink-0" /><div><p className="font-bold text-emerald-800 text-sm">{showNote.participants ? `${showNote.participants.first_name} ${showNote.participants.last_name}` : 'Shift'}</p><p className="text-xs text-emerald-600">{formatDate(showNote.shift_date)} · {showNote.service_type || showNote.title}</p></div></div>}
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-700">Complete all sections for NDIS compliance.</div>
          {[{ key: 'mood', label: "Participant's mood & wellbeing", placeholder: 'Describe mood, energy, emotional state...' },
            { key: 'activities', label: 'Activities completed', placeholder: 'List activities, tasks, engagement...' },
            { key: 'goals_progress', label: 'Progress toward goals', placeholder: 'Note progress toward NDIS plan goals...' },
            { key: 'concerns', label: 'Concerns or incidents', placeholder: 'Document issues, incidents, risks...' },
            { key: 'recommendations', label: 'Recommendations & handover', placeholder: 'Notes for next support worker...' },
          ].map(f => (
            <div key={f.key}><p className="text-xs text-gray-600 font-bold mb-1.5">{f.label}</p><textarea value={noteForm[f.key]} onChange={e => setNoteForm({ ...noteForm, [f.key]: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300 transition-all resize-none" rows={2} placeholder={f.placeholder} /></div>
          ))}
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowNote(null)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700">Cancel</button>
            <button onClick={handleSubmitNote} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all">{showNote?.shift_notes?.length > 0 ? 'Update Note' : 'Submit Note'}</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}