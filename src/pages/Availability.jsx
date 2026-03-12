import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Calendar, Clock, XCircle, Check, Loader2, Sun, Sunrise, Sunset, Moon, ChevronLeft, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
const DAY_FULL = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
const SLOTS = [
  { key: 'morning', label: 'Morning', short: 'AM', time: '6am – 12pm', color: 'bg-amber-100 text-amber-700 border-amber-200', icon: Sunrise, dot: 'bg-amber-400' },
  { key: 'afternoon', label: 'Afternoon', short: 'PM', time: '12pm – 6pm', color: 'bg-sky-100 text-sky-700 border-sky-200', icon: Sun, dot: 'bg-sky-400' },
  { key: 'evening', label: 'Evening', short: 'Eve', time: '6pm – 10pm', color: 'bg-violet-100 text-violet-700 border-violet-200', icon: Sunset, dot: 'bg-violet-400' },
  { key: 'night', label: 'Night', short: 'Night', time: '10pm – 6am', color: 'bg-indigo-100 text-indigo-700 border-indigo-200', icon: Moon, dot: 'bg-indigo-400' },
]

// Get today's day name
function getTodayDay() {
  return ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday'][new Date().getDay()]
}

export default function Availability() {
  const [staff, setStaff] = useState([])
  const [availability, setAvailability] = useState([])
  const [loading, setLoading] = useState(true)
  const [view, setView] = useState('week') // week | day
  const [selectedDay, setSelectedDay] = useState(getTodayDay())
  const [search, setSearch] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      const [staffRes, availRes] = await Promise.all([
        supabase.from('staff').select('id, first_name, last_name, phone, email, status, position').eq('status', 'active').order('first_name'),
        supabase.from('staff_availability').select('*'),
      ])
      setStaff(staffRes.data || [])
      setAvailability(availRes.data || [])
    } catch (err) {
      console.error('Failed to load:', err)
    } finally {
      setLoading(false)
    }
  }

  // Build lookup: staffId -> { day -> row }
  const availMap = {}
  availability.forEach(r => {
    if (!availMap[r.staff_id]) availMap[r.staff_id] = {}
    availMap[r.staff_id][r.day_of_week] = r
  })

  const filtered = staff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  // Stats
  const today = getTodayDay()
  const availableToday = filtered.filter(s => {
    const row = availMap[s.id]?.[today]
    return row && (row.morning || row.afternoon || row.evening || row.night)
  }).length
  const notSetCount = filtered.filter(s => !availMap[s.id] || Object.keys(availMap[s.id]).length === 0).length

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Loader2 className="animate-spin text-teal-500" size={32} />
    </div>
  )

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h2 className="text-xl md:text-2xl font-bold text-gray-800">Staff Availability</h2>
        <p className="text-sm text-gray-500">See who's available and when</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-lg w-fit"><Calendar size={18} className="text-white" /></div>
          <p className="mt-2 text-xl font-bold text-gray-800">{filtered.length}</p>
          <p className="text-xs text-gray-500">Active Staff</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-500 shadow-lg w-fit"><Check size={18} className="text-white" /></div>
          <p className="mt-2 text-xl font-bold text-emerald-700">{availableToday}</p>
          <p className="text-xs text-gray-500">Available Today</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 shadow-lg w-fit"><XCircle size={18} className="text-white" /></div>
          <p className="mt-2 text-xl font-bold text-red-600">{filtered.length - availableToday}</p>
          <p className="text-xs text-gray-500">Unavailable Today</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg">
          <div className="p-2 rounded-lg bg-gradient-to-br from-gray-400 to-gray-500 shadow-lg w-fit"><Clock size={18} className="text-white" /></div>
          <p className="mt-2 text-xl font-bold text-gray-600">{notSetCount}</p>
          <p className="text-xs text-gray-500">Not Set</p>
        </div>
      </div>

      {/* Controls */}
      <div className="flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
        <div className="relative flex-1 max-w-xs">
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="w-full pl-3 pr-4 py-2.5 glass rounded-xl border border-gray-200 text-sm" />
        </div>
        <div className="flex gap-2">
          <button onClick={() => setView('week')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'week' ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Week View
          </button>
          <button onClick={() => setView('day')} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${view === 'day' ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
            Day View
          </button>
        </div>
      </div>

      {/* Day selector for day view */}
      {view === 'day' && (
        <div className="flex items-center gap-2">
          <button onClick={() => { const i = DAYS.indexOf(selectedDay); setSelectedDay(DAYS[(i - 1 + 7) % 7]) }} className="p-2 rounded-lg hover:bg-gray-100"><ChevronLeft size={18} /></button>
          <div className="flex gap-1 flex-1 justify-center">
            {DAYS.map(d => (
              <button key={d} onClick={() => setSelectedDay(d)}
                className={`px-3 py-2 rounded-xl text-xs font-bold transition-all ${d === selectedDay ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow' : d === today ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}>
                {DAY_LABELS[d]}
              </button>
            ))}
          </div>
          <button onClick={() => { const i = DAYS.indexOf(selectedDay); setSelectedDay(DAYS[(i + 1) % 7]) }} className="p-2 rounded-lg hover:bg-gray-100"><ChevronRight size={18} /></button>
        </div>
      )}

      {/* WEEK VIEW */}
      {view === 'week' && (
        <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50">
                  <th className="px-4 py-3 text-left text-xs font-bold text-gray-500 uppercase sticky left-0 bg-gray-50 z-10 min-w-[160px]">Staff Member</th>
                  {DAYS.map(d => (
                    <th key={d} className={`px-3 py-3 text-center text-xs font-bold uppercase min-w-[80px] ${d === today ? 'text-teal-700 bg-teal-50/50' : 'text-gray-500'}`}>
                      {DAY_LABELS[d]}
                      {d === today && <span className="block text-[9px] font-normal text-teal-500 mt-0.5">Today</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(s => {
                  const myAvail = availMap[s.id] || {}
                  const hasAny = Object.keys(myAvail).length > 0

                  return (
                    <tr key={s.id} className="border-t border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="px-4 py-3 sticky left-0 bg-white/90 backdrop-blur-sm z-10">
                        <Link to={`/admin/staff/${s.id}`} className="flex items-center gap-2.5 hover:text-teal-600 transition-colors">
                          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shrink-0 shadow">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </div>
                          <div className="min-w-0">
                            <p className="font-semibold text-gray-800 text-xs truncate">{s.first_name} {s.last_name}</p>
                            <p className="text-[10px] text-gray-400 truncate">{s.position || 'Support Worker'}</p>
                          </div>
                        </Link>
                      </td>
                      {DAYS.map(d => {
                        const row = myAvail[d]
                        const isToday = d === today
                        
                        if (!hasAny) return (
                          <td key={d} className={`px-2 py-3 text-center ${isToday ? 'bg-teal-50/30' : ''}`}>
                            <span className="text-gray-300 text-[10px]">Not set</span>
                          </td>
                        )
                        if (!row) return (
                          <td key={d} className={`px-2 py-3 text-center ${isToday ? 'bg-teal-50/30' : ''}`}>
                            <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                              <XCircle size={12} className="text-red-400" />
                            </div>
                          </td>
                        )
                        const activeSlots = SLOTS.filter(sl => row[sl.key])
                        if (activeSlots.length === 0) return (
                          <td key={d} className={`px-2 py-3 text-center ${isToday ? 'bg-teal-50/30' : ''}`}>
                            <div className="w-7 h-7 rounded-lg bg-red-50 border border-red-200 flex items-center justify-center mx-auto">
                              <XCircle size={12} className="text-red-400" />
                            </div>
                          </td>
                        )
                        return (
                          <td key={d} className={`px-2 py-3 text-center ${isToday ? 'bg-teal-50/30' : ''}`}>
                            <div className="flex flex-wrap gap-0.5 justify-center" title={activeSlots.map(sl => `${sl.label} (${sl.time})`).join(', ') + (row.notes ? '\n' + row.notes : '')}>
                              {activeSlots.map(sl => (
                                <span key={sl.key} className={`px-1.5 py-0.5 rounded text-[9px] font-bold border ${sl.color}`}>{sl.short}</span>
                              ))}
                            </div>
                            {row.notes && <p className="text-[8px] text-gray-400 mt-0.5 truncate max-w-[80px] mx-auto" title={row.notes}>{row.notes}</p>}
                          </td>
                        )
                      })}
                    </tr>
                  )
                })}
                {filtered.length === 0 && (
                  <tr><td colSpan={8} className="text-center py-12 text-gray-400 text-sm">No active staff found</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* DAY VIEW */}
      {view === 'day' && (
        <div className="space-y-3">
          <h3 className="text-lg font-bold text-gray-800">{DAY_FULL[selectedDay]} {selectedDay === today && <span className="text-sm font-normal text-teal-600 ml-1">(Today)</span>}</h3>

          {/* Slot groups */}
          {SLOTS.map(slot => {
            const SlotIcon = slot.icon
            const staffInSlot = filtered.filter(s => {
              const row = availMap[s.id]?.[selectedDay]
              return row && row[slot.key]
            })

            return (
              <div key={slot.key} className="bg-white/80 rounded-xl border border-gray-200 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`w-2 h-2 rounded-full ${slot.dot}`} />
                    <SlotIcon size={16} className="text-gray-500" />
                    <span className="font-bold text-sm text-gray-800">{slot.label}</span>
                    <span className="text-xs text-gray-400">{slot.time}</span>
                  </div>
                  <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${staffInSlot.length > 0 ? 'bg-emerald-50 text-emerald-700' : 'bg-red-50 text-red-600'}`}>
                    {staffInSlot.length} staff
                  </span>
                </div>
                {staffInSlot.length > 0 ? (
                  <div className="p-3 flex flex-wrap gap-2">
                    {staffInSlot.map(s => {
                      const row = availMap[s.id]?.[selectedDay]
                      return (
                        <Link key={s.id} to={`/admin/staff/${s.id}`}
                          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-gray-50 hover:bg-teal-50 border border-gray-100 hover:border-teal-200 transition-all group">
                          <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-[10px] font-bold shadow">
                            {s.first_name?.[0]}{s.last_name?.[0]}
                          </div>
                          <div>
                            <p className="text-xs font-semibold text-gray-800 group-hover:text-teal-700">{s.first_name} {s.last_name}</p>
                            {row?.notes && <p className="text-[10px] text-gray-400 truncate max-w-[150px]">{row.notes}</p>}
                          </div>
                        </Link>
                      )
                    })}
                  </div>
                ) : (
                  <div className="p-4 text-center text-gray-400 text-xs">No staff available for this slot</div>
                )}
              </div>
            )
          })}

          {/* Unavailable staff */}
          {(() => {
            const unavailStaff = filtered.filter(s => {
              const row = availMap[s.id]?.[selectedDay]
              return !row || (!row.morning && !row.afternoon && !row.evening && !row.night)
            })
            if (unavailStaff.length === 0) return null
            return (
              <div className="bg-white/80 rounded-xl border border-red-100 shadow-sm overflow-hidden">
                <div className="px-4 py-3 border-b border-red-50 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <XCircle size={16} className="text-red-400" />
                    <span className="font-bold text-sm text-gray-800">Unavailable / Not Set</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-xs font-bold bg-red-50 text-red-600">{unavailStaff.length} staff</span>
                </div>
                <div className="p-3 flex flex-wrap gap-2">
                  {unavailStaff.map(s => (
                    <Link key={s.id} to={`/admin/staff/${s.id}`}
                      className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50/50 hover:bg-red-50 border border-red-100 transition-all">
                      <div className="w-7 h-7 rounded-lg bg-gray-300 flex items-center justify-center text-white text-[10px] font-bold">
                        {s.first_name?.[0]}{s.last_name?.[0]}
                      </div>
                      <p className="text-xs font-semibold text-gray-600">{s.first_name} {s.last_name}</p>
                    </Link>
                  ))}
                </div>
              </div>
            )
          })()}
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 text-[10px] text-gray-500 px-1">
        {SLOTS.map(sl => (
          <span key={sl.key} className="flex items-center gap-1">
            <span className={`px-1.5 py-0.5 rounded border font-bold ${sl.color}`}>{sl.short}</span> {sl.time}
          </span>
        ))}
        <span className="flex items-center gap-1"><XCircle size={10} className="text-red-400" /> Unavailable</span>
        <span className="text-gray-300">— Not set</span>
      </div>
    </div>
  )
}