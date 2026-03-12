import { useState, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Play, Clock, Plus, MapPin, Check, Loader2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', orange: 'bg-orange-50 text-orange-700', teal: 'bg-teal-50 text-teal-700', blue: 'bg-cyan-50 text-cyan-700' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${colors[color]}`}>{children}</span>
}

const StatCard = ({ icon: Icon, label, value, color, alert }) => (
  <div className={`relative p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg ${alert ? 'ring-2 ring-red-400' : ''}`}>
    {alert && <span className="absolute -top-1.5 -right-1.5 w-4 h-4 bg-red-500 rounded-full text-[9px] flex items-center justify-center text-white font-bold">!</span>}
    <div className={`p-2 md:p-2.5 rounded-lg md:rounded-xl bg-gradient-to-br ${color} shadow-lg w-fit`}>
      <Icon size={16} className="md:hidden text-white" />
      <Icon size={20} className="hidden md:block text-white" />
    </div>
    <p className="mt-2 md:mt-3 text-xl md:text-2xl font-bold text-gray-800">{value}</p>
    <p className="text-xs md:text-sm text-gray-500 truncate">{label}</p>
  </div>
)

function formatTime(t) {
  if (!t) return ''
  // Handle both "HH:MM:SS" and full ISO
  try {
    if (t.includes('T')) return new Date(t).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
    const [h, m] = t.split(':')
    const d = new Date(); d.setHours(+h, +m)
    return d.toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
  } catch { return t }
}

function getDateLabel(dateStr) {
  const today = new Date().toISOString().split('T')[0]
  const tomorrow = new Date(Date.now() + 86400000).toISOString().split('T')[0]
  const yesterday = new Date(Date.now() - 86400000).toISOString().split('T')[0]
  if (dateStr === today) return 'Today'
  if (dateStr === tomorrow) return 'Tomorrow'
  if (dateStr === yesterday) return 'Yesterday'
  return new Date(dateStr).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function Roster() {
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [shifts, setShifts] = useState([])
  const [participants, setParticipants] = useState([])
  const [staffList, setStaffList] = useState([])
  const [staffAvailability, setStaffAvailability] = useState([])
  const [showNewShift, setShowNewShift] = useState(false)
  const [newShift, setNewShift] = useState({
    participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: ''
  })
  const [mapCoords, setMapCoords] = useState(null)
  const geocodeTimer = useRef(null)

  const geocodeLocation = (address, instant = false) => {
    if (geocodeTimer.current) clearTimeout(geocodeTimer.current)
    if (!address || address.length < 5) { setMapCoords(null); return }
    const doGeocode = async () => {
      try {
        let formatted = address.trim()
        formatted = formatted.replace(/\s+(VIC|NSW|QLD|SA|WA|TAS|NT|ACT)\s+/i, ', $1 ')
        formatted = formatted.replace(/,?\s*(\d{4})$/, ', $1')
        const q = encodeURIComponent(formatted + ', Australia')
        const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${q}&limit=1&countrycodes=au`, {
          headers: { 'User-Agent': 'MapleCareSupport/1.0' }
        })
        const data = await res.json()
        if (data?.[0]) setMapCoords({ lat: parseFloat(data[0].lat), lon: parseFloat(data[0].lon), display: data[0].display_name })
        else {
          const parts = address.trim().split(/\s+/)
          const fallback = parts.slice(Math.max(0, parts.length - 4)).join(' ') + ', Australia'
          const res2 = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallback)}&limit=1&countrycodes=au`, {
            headers: { 'User-Agent': 'MapleCareSupport/1.0' }
          })
          const data2 = await res2.json()
          if (data2?.[0]) setMapCoords({ lat: parseFloat(data2[0].lat), lon: parseFloat(data2[0].lon), display: data2[0].display_name })
          else setMapCoords(null)
        }
      } catch { setMapCoords(null) }
    }
    if (instant) { doGeocode() } else { geocodeTimer.current = setTimeout(doGeocode, 400) }
  }

  useEffect(() => {
    async function load() {
      try {
        const [shiftRes, partRes, staffRes, availRes] = await Promise.all([
          supabase.from('shifts').select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)').order('shift_date', { ascending: false }).order('start_time', { ascending: true }),
          supabase.from('participants').select('id, first_name, last_name, status, address'),
          supabase.from('staff').select('id, first_name, last_name, status, role'),
          supabase.from('staff_availability').select('*').then(r => r).catch(() => ({ data: [] })),
        ])
        setShifts(shiftRes.data || [])
        setParticipants((partRes.data || []).filter(p => p.status === 'active'))
        setStaffList(staffRes.data || [])
        setStaffAvailability(availRes.data || [])
      } catch (err) {
        console.error('Roster load error:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const today = new Date().toISOString().split('T')[0]
  const todayShifts = shifts.filter(s => s.shift_date === today)
  const inProgress = shifts.filter(s => s.status === 'in_progress')
  const scheduled = shifts.filter(s => s.status === 'scheduled')

  // Availability helper
  const DAY_NAMES = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
  const getStaffAvailForDate = (staffId, dateStr) => {
    if (!dateStr) return { hasData: false }
    const dayName = DAY_NAMES[new Date(dateStr + 'T00:00:00').getDay()]
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

  // Sort dates: today first, then future, then past
  const groupedShifts = shifts.reduce((acc, s) => {
    const label = getDateLabel(s.shift_date)
    if (!acc[label]) acc[label] = { label, date: s.shift_date, shifts: [] }
    acc[label].shifts.push(s)
    return acc
  }, {})
  const sortedGroups = Object.values(groupedShifts).sort((a, b) => b.date.localeCompare(a.date))

  const handleCreateShift = async () => {
    if (!newShift.staff_id || !newShift.shift_date || !newShift.start_time || !newShift.end_time) {
      alert('Please fill in staff, date, start and end time')
      return
    }

    setSaving(true)
    try {
      const payload = {
        staff_id: newShift.staff_id,
        shift_date: newShift.shift_date,
        start_time: `${newShift.shift_date}T${newShift.start_time}:00`,
        end_time: `${newShift.shift_date}T${newShift.end_time}:00`,
        service_type: newShift.service_type || null,
        location: newShift.location || null,
        notes: newShift.notes || null,
        status: 'scheduled',
      }
      if (newShift.participant_id) payload.participant_id = newShift.participant_id

      const { data: inserted, error: insertErr } = await supabase.from('shifts').insert(payload).select().single()
      if (insertErr) throw insertErr

      // Now fetch with joins separately
      const { data: full } = await supabase.from('shifts')
        .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)')
        .eq('id', inserted.id)
        .maybeSingle()

      setShifts([full || inserted, ...shifts])
      setShowNewShift(false)
      setMapCoords(null)
      setNewShift({ participant_id: '', staff_id: '', shift_date: '', start_time: '', end_time: '', service_type: '', location: '', notes: '' })
    } catch (err) {
      console.error('Failed to create shift:', err)
      alert('Failed to create shift: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Roster</h2>
          <p className="text-sm text-gray-500">{shifts.length} shift{shifts.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowNewShift(true)} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2">
          <Plus size={18} /> New Shift
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={Calendar} label="Today's Shifts" value={todayShifts.length} color="from-orange-500 to-amber-500" />
        <StatCard icon={Play} label="In Progress" value={inProgress.length} color="from-emerald-500 to-teal-500" />
        <StatCard icon={Clock} label="Scheduled" value={scheduled.length} color="from-cyan-500 to-teal-500" />
        <StatCard icon={Check} label="Completed" value={shifts.filter(s => s.status === 'completed').length} color="from-amber-500 to-orange-500" />
      </div>

      {/* Shifts grouped by date */}
      <div className="space-y-4">
        {sortedGroups.length > 0 ? (
          sortedGroups.map(({ label, shifts: dayShifts }) => (
            <div key={label}>
              <h3 className="text-xs md:text-sm font-bold text-gray-600 mb-2">{label}</h3>
              <div className="space-y-2">
                {dayShifts.map(s => (
                  <Link key={s.id} to={`/admin/roster/shift/${s.id}`} className="block p-3 md:p-4 rounded-xl md:rounded-2xl glass shadow-lg hover:shadow-xl transition-all">
                    <div className="flex gap-3">
                      <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow shrink-0 ${s.status === 'in_progress' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : s.status === 'completed' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-cyan-500 to-teal-500'}`}>
                        {s.status === 'in_progress' ? <Play size={18} className="text-white" /> : s.status === 'completed' ? <Check size={18} className="text-white" /> : <Calendar size={18} className="text-white" />}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div className="min-w-0">
                            <p className="font-bold text-gray-800 text-sm md:text-base truncate">
                              {s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : s.title || 'Shift'}
                            </p>
                            <p className="text-xs md:text-sm text-gray-500 truncate">
                              {s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'}
                            </p>
                          </div>
                          <div className="text-right shrink-0">
                            <p className="font-semibold text-gray-700 text-xs md:text-sm">
                              {formatTime(s.start_time)} - {formatTime(s.end_time)}
                            </p>
                            {s.clock_in && <p className="text-[10px] md:text-xs text-emerald-600">In: {formatTime(s.clock_in)}</p>}
                            {s.clock_out && <p className="text-[10px] md:text-xs text-orange-600">Out: {formatTime(s.clock_out)}</p>}
                          </div>
                        </div>
                        {s.location && (
                          <div className="flex items-center gap-1 mt-1">
                            <MapPin size={10} className="text-gray-400 shrink-0" />
                            <p className="text-[10px] md:text-xs text-gray-400 truncate">{s.location}</p>
                          </div>
                        )}
                        <div className="flex gap-1.5 mt-2 flex-wrap">
                          <Badge color={s.status === 'in_progress' ? 'green' : s.status === 'completed' ? 'orange' : s.status === 'scheduled' ? 'blue' : 'gray'}>{(s.status || 'scheduled').replace('_', ' ')}</Badge>
                        </div>
                      </div>
                    </div>
                  </Link>
                ))}
              </div>
            </div>
          ))
        ) : (
          <div className="h-48 flex items-center justify-center rounded-xl bg-white/50 border border-gray-100">
            <div className="text-center">
              <Calendar size={40} className="text-gray-300 mx-auto mb-3" />
              <p className="text-gray-400 text-sm">No shifts yet. Create your first one!</p>
            </div>
          </div>
        )}
      </div>

      {/* New Shift Modal */}
      <Modal isOpen={showNewShift} onClose={() => setShowNewShift(false)} title="Create New Shift" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <select value={newShift.participant_id} onChange={e => {
              const pid = e.target.value
              const p = participants.find(p => p.id === pid)
              const loc = p?.address || newShift.location
              setNewShift({...newShift, participant_id: pid, location: loc })
              if (loc) geocodeLocation(loc, true)
            }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Select Participant</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            <input type="date" value={newShift.shift_date} onChange={e => setNewShift({...newShift, shift_date: e.target.value, staff_id: ''})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <div className="grid grid-cols-2 gap-2">
              <input type="time" value={newShift.start_time} onChange={e => setNewShift({...newShift, start_time: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <input type="time" value={newShift.end_time} onChange={e => setNewShift({...newShift, end_time: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <select value={newShift._isOther ? 'Other' : newShift.service_type} onChange={e => {
              if (e.target.value === 'Other') setNewShift({...newShift, service_type: '', _isOther: true})
              else setNewShift({...newShift, service_type: e.target.value, _isOther: false})
            }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Select Service Type *</option>
              <option value="Community Access">Community Access</option>
              <option value="Personal Care">Personal Care</option>
              <option value="Cleaning">Cleaning</option>
              <option value="Gardening">Gardening</option>
              <option value="Respite Care">Respite Care</option>
              <option value="Transport">Transport</option>
              <option value="Social Support">Social Support</option>
              <option value="Other">Other</option>
            </select>
            {newShift._isOther && (
              <input placeholder="Specify service type..." value={newShift.service_type} onChange={e => setNewShift({...newShift, service_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" autoFocus />
            )}
            <input placeholder="Location" value={newShift.location} onChange={e => { setNewShift({...newShift, location: e.target.value}); geocodeLocation(e.target.value) }} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          {/* Staff picker with availability */}
          <div>
            <p className="text-xs font-bold text-gray-600 mb-2">Assign Staff *{newShift.shift_date && <span className="font-normal text-gray-400 ml-1">— showing availability for {new Date(newShift.shift_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short' })}</span>}</p>
            <div className="space-y-1.5 max-h-48 overflow-y-auto rounded-xl border border-gray-200 p-2 bg-gray-50">
              {staffList.map(s => {
                const avail = getStaffAvailForDate(s.id, newShift.shift_date)
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
                      {newShift.shift_date ? (
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

          <textarea placeholder="Notes..." value={newShift.notes} onChange={e => setNewShift({...newShift, notes: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={3} />
          <div className="flex gap-2 md:gap-3">
            <button onClick={() => { setShowNewShift(false); setMapCoords(null) }} className="flex-1 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleCreateShift} disabled={saving} className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Create Shift'}
            </button>
          </div>
          {mapCoords && (
            <div className="rounded-2xl overflow-hidden border border-teal-100 shadow-sm" style={{ background: '#f8f9fa' }}>
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
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -4px)', zIndex: 9 }}>
                        <div style={{ width: '14px', height: '6px', borderRadius: '50%', background: 'rgba(0,0,0,0.15)', filter: 'blur(2px)', margin: '0 auto' }} />
                      </div>
                      <div style={{ position: 'absolute', left: '50%', top: '50%', transform: 'translate(-50%, -100%)', zIndex: 10, filter: 'drop-shadow(0 2px 4px rgba(20,184,166,0.4))' }}>
                        <svg width="36" height="46" viewBox="0 0 36 46" fill="none">
                          <path d="M18 0C8.06 0 0 8.06 0 18c0 13.5 18 28 18 28s18-14.5 18-28C36 8.06 27.94 0 18 0z" fill="url(#rpg)" />
                          <circle cx="18" cy="16.5" r="7" fill="white" />
                          <circle cx="18" cy="16.5" r="3.5" fill="url(#rpg2)" />
                          <defs>
                            <linearGradient id="rpg" x1="4" y1="2" x2="32" y2="44"><stop stopColor="#14b8a6" /><stop offset="1" stopColor="#06b6d4" /></linearGradient>
                            <linearGradient id="rpg2" x1="14" y1="13" x2="22" y2="20"><stop stopColor="#14b8a6" /><stop offset="1" stopColor="#0d9488" /></linearGradient>
                          </defs>
                        </svg>
                      </div>
                      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, rgba(248,249,250,0.3) 0%, transparent 15%, transparent 80%, rgba(248,249,250,0.6) 100%)', pointerEvents: 'none' }} />
                    </>
                  )
                })()}
              </div>
              <div className="px-4 py-2.5 flex items-center gap-2.5" style={{ background: 'linear-gradient(135deg, #f0fdfa, #ecfeff)' }}>
                <div className="w-7 h-7 rounded-full bg-gradient-to-br from-teal-400 to-cyan-500 flex items-center justify-center shadow-md shadow-teal-200 shrink-0">
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
                  <a href={`https://www.google.com/maps/search/?api=1&query=${mapCoords.lat},${mapCoords.lon}`} target="_blank" rel="noopener noreferrer" className="px-2 py-1 rounded-lg bg-teal-500 hover:bg-teal-600 text-[10px] text-white font-bold whitespace-nowrap transition-colors shadow-sm">
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