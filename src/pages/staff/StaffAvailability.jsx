import { useState, useEffect } from 'react'
import { Check, Loader2, Save, Clock, Sun, Moon, Sunrise, Sunset } from 'lucide-react'
import { supabase } from '../../lib/supabase'
import { useStaff } from '../../context/StaffContext'

const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
const DAY_LABELS = { monday: 'Monday', tuesday: 'Tuesday', wednesday: 'Wednesday', thursday: 'Thursday', friday: 'Friday', saturday: 'Saturday', sunday: 'Sunday' }
const SHORT_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }

const TIME_SLOTS = [
  { key: 'morning', label: 'Morning', sub: '6am – 12pm', icon: Sunrise, color: 'from-amber-400 to-orange-400', bg: 'bg-amber-50', border: 'border-amber-200', text: 'text-amber-700' },
  { key: 'afternoon', label: 'Afternoon', sub: '12pm – 6pm', icon: Sun, color: 'from-sky-400 to-blue-400', bg: 'bg-sky-50', border: 'border-sky-200', text: 'text-sky-700' },
  { key: 'evening', label: 'Evening', sub: '6pm – 10pm', icon: Sunset, color: 'from-violet-400 to-purple-400', bg: 'bg-violet-50', border: 'border-violet-200', text: 'text-violet-700' },
  { key: 'night', label: 'Night', sub: '10pm – 6am', icon: Moon, color: 'from-indigo-500 to-gray-600', bg: 'bg-indigo-50', border: 'border-indigo-200', text: 'text-indigo-700' },
]

function defaultAvailability() {
  const avail = {}
  DAYS.forEach(d => {
    avail[d] = { available: false, morning: false, afternoon: false, evening: false, night: false, notes: '' }
  })
  return avail
}

export default function StaffAvailability() {
  const { staffProfile } = useStaff()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [availability, setAvailability] = useState(defaultAvailability())

  useEffect(() => {
    if (!staffProfile?.id) return
    loadAvailability()
  }, [staffProfile?.id])

  const loadAvailability = async () => {
    try {
      const { data, error } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffProfile.id)

      if (error) {
        console.warn('staff_availability query error (table may not exist):', error)
        setLoading(false)
        return
      }

      if (data && data.length > 0) {
        const avail = defaultAvailability()
        data.forEach(row => {
          if (avail[row.day_of_week]) {
            avail[row.day_of_week] = {
              available: true,
              morning: row.morning || false,
              afternoon: row.afternoon || false,
              evening: row.evening || false,
              night: row.night || false,
              notes: row.notes || '',
            }
          }
        })
        setAvailability(avail)
      }
    } catch (err) {
      console.error('Load availability error:', err)
    } finally {
      setLoading(false)
    }
  }

  const toggleDay = (day) => {
    setAvailability(prev => ({
      ...prev,
      [day]: {
        ...prev[day],
        available: !prev[day].available,
        ...(prev[day].available ? { morning: false, afternoon: false, evening: false, night: false } : { morning: true, afternoon: true, evening: true, night: false })
      }
    }))
    setSaved(false)
  }

  const toggleSlot = (day, slot) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], [slot]: !prev[day][slot] }
    }))
    setSaved(false)
  }

  const setNotes = (day, notes) => {
    setAvailability(prev => ({
      ...prev,
      [day]: { ...prev[day], notes }
    }))
    setSaved(false)
  }

  const selectAllDays = () => {
    const newAvail = {}
    DAYS.forEach(d => {
      newAvail[d] = { available: true, morning: true, afternoon: true, evening: true, night: false, notes: availability[d]?.notes || '' }
    })
    setAvailability(newAvail)
    setSaved(false)
  }

  const clearAll = () => {
    setAvailability(defaultAvailability())
    setSaved(false)
  }

  const handleSave = async () => {
    if (!staffProfile?.id) return
    setSaving(true)
    console.log('Saving availability for staff_id:', staffProfile.id)
    try {
      // Delete existing
      const { error: delErr } = await supabase.from('staff_availability').delete().eq('staff_id', staffProfile.id)
      if (delErr) console.error('Delete error:', delErr)

      // Insert available days
      const rows = DAYS.filter(d => availability[d].available).map(d => ({
        staff_id: staffProfile.id,
        day_of_week: d,
        morning: availability[d].morning || false,
        afternoon: availability[d].afternoon || false,
        evening: availability[d].evening || false,
        night: availability[d].night || false,
        notes: availability[d].notes || null,
      }))

      console.log('Inserting rows:', rows)

      if (rows.length > 0) {
        const { data: inserted, error } = await supabase.from('staff_availability').insert(rows).select()
        console.log('Insert result:', inserted, error)
        if (error) throw error
      }

      setSaved(true)
      setTimeout(() => setSaved(false), 3000)
    } catch (err) {
      console.error('Save availability error:', err)
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const availableDays = DAYS.filter(d => availability[d].available).length
  const totalSlots = DAYS.reduce((sum, d) => {
    if (!availability[d].available) return sum
    return sum + (availability[d].morning ? 1 : 0) + (availability[d].afternoon ? 1 : 0) + (availability[d].evening ? 1 : 0) + (availability[d].night ? 1 : 0)
  }, 0)

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-teal-500" /></div>
  }

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-2xl font-black text-gray-900">My Availability</h2>
          <p className="text-gray-500 text-sm">Set the days and times you're available to work</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={selectAllDays} className="px-3 py-2 text-xs font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-xl hover:bg-emerald-100 transition-colors">
            Select Weekdays
          </button>
          <button onClick={clearAll} className="px-3 py-2 text-xs font-bold bg-gray-50 text-gray-500 border border-gray-200 rounded-xl hover:bg-gray-100 transition-colors">
            Clear All
          </button>
        </div>
      </div>

      {/* Summary */}
      <div className="flex gap-3">
        <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
          <p className="text-xs opacity-80 font-medium">Days Available</p>
          <p className="text-2xl font-black">{availableDays} <span className="text-sm font-medium opacity-70">/ 7</span></p>
        </div>
        <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
          <p className="text-xs opacity-80 font-medium">Time Slots</p>
          <p className="text-2xl font-black">{totalSlots}</p>
        </div>
      </div>

      {/* Day cards */}
      <div className="space-y-3">
        {DAYS.map(day => {
          const a = availability[day]
          const isWeekend = day === 'saturday' || day === 'sunday'
          return (
            <div key={day} className={`rounded-2xl border transition-all ${a.available ? 'bg-white border-gray-200 shadow-sm' : 'bg-gray-50/50 border-gray-100'}`}>
              {/* Day header */}
              <button onClick={() => toggleDay(day)}
                className="w-full flex items-center justify-between p-4 text-left">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-sm font-black transition-all ${a.available ? 'bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-lg' : 'bg-gray-200 text-gray-400'}`}>
                    {SHORT_LABELS[day].charAt(0)}
                  </div>
                  <div>
                    <p className={`font-bold text-[15px] ${a.available ? 'text-gray-900' : 'text-gray-400'}`}>{DAY_LABELS[day]}</p>
                    <p className="text-[10px] text-gray-400">
                      {a.available
                        ? [a.morning && 'Morning', a.afternoon && 'Afternoon', a.evening && 'Evening', a.night && 'Night'].filter(Boolean).join(' · ') || 'No time slots selected'
                        : isWeekend ? 'Weekend' : 'Not available'}
                    </p>
                  </div>
                </div>
                <div className={`w-11 h-6 rounded-full transition-colors relative ${a.available ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${a.available ? 'left-[22px]' : 'left-0.5'}`} />
                </div>
              </button>

              {/* Time slots */}
              {a.available && (
                <div className="px-4 pb-4 space-y-3">
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                    {TIME_SLOTS.map(slot => {
                      const Icon = slot.icon
                      const active = a[slot.key]
                      return (
                        <button key={slot.key} onClick={() => toggleSlot(day, slot.key)}
                          className={`p-3 rounded-xl border-2 transition-all text-left ${active ? `${slot.bg} ${slot.border}` : 'bg-gray-50 border-gray-200 hover:border-gray-300'}`}>
                          <div className="flex items-center justify-between mb-1">
                            <Icon size={16} className={active ? slot.text : 'text-gray-300'} />
                            <div className={`w-4 h-4 rounded border-2 flex items-center justify-center ${active ? `${slot.border} ${slot.bg}` : 'border-gray-300'}`}>
                              {active && <Check size={10} className={slot.text} />}
                            </div>
                          </div>
                          <p className={`text-xs font-bold ${active ? 'text-gray-800' : 'text-gray-400'}`}>{slot.label}</p>
                          <p className={`text-[9px] ${active ? 'text-gray-500' : 'text-gray-300'}`}>{slot.sub}</p>
                        </button>
                      )
                    })}
                  </div>
                  <input
                    placeholder="Add notes (e.g. prefer morning shifts, school pickup at 3pm)"
                    value={a.notes}
                    onChange={e => setNotes(day, e.target.value)}
                    className="w-full px-3 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-teal-400/30 focus:border-teal-300 placeholder:text-gray-300"
                  />
                </div>
              )}
            </div>
          )
        })}
      </div>

      {/* Save button */}
      <div className="sticky bottom-4 z-10">
        <button onClick={handleSave} disabled={saving}
          className={`w-full py-3.5 rounded-2xl text-sm font-bold shadow-xl flex items-center justify-center gap-2 transition-all ${saved ? 'bg-emerald-500 text-white' : 'bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-600 hover:to-emerald-600 text-white'} disabled:opacity-50`}>
          {saving ? <><Loader2 size={18} className="animate-spin" /> Saving...</>
            : saved ? <><Check size={18} /> Availability Saved!</>
            : <><Save size={18} /> Save Availability</>}
        </button>
      </div>
    </div>
  )
}