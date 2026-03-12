import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Calendar, Clock, MapPin, User, Play, Square, FileText, Car, AlertTriangle, Check, Phone, Navigation, Loader2 } from 'lucide-react'
import { getShift, clockIn, clockOut, updateShift } from '../services/shiftService'
import Modal from '../components/ui/Modal'
import { supabase } from '../lib/supabase'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-cyan-50 text-cyan-700', orange: 'bg-orange-50 text-orange-700' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${colors[color]}`}>{children}</span>
}

const InfoCard = ({ icon: Icon, label, value, color = 'gray', action }) => (
  <div className="p-3 md:p-4 rounded-xl bg-gray-50 border border-gray-100">
    <div className="flex items-center justify-between">
      <div className="flex items-center gap-2 min-w-0 flex-1">
        <Icon size={14} className={`text-${color}-500 shrink-0`} />
        <div className="min-w-0">
          <span className="text-[10px] md:text-xs text-gray-400 block">{label}</span>
          <p className="font-semibold text-gray-800 text-sm truncate">{value || '—'}</p>
        </div>
      </div>
      {action}
    </div>
  </div>
)

function fmtTime(iso) {
  if (!iso) return null
  return new Date(iso).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function fmtDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'short', year: 'numeric' })
}

export default function ShiftDetail() {
  const { id } = useParams()
  const [loading, setLoading] = useState(true)
  const [shift, setShift] = useState(null)
  const [showNote, setShowNote] = useState(false)
  const [showMileage, setShowMileage] = useState(false)
  const [noteSubmitted, setNoteSubmitted] = useState(false)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  const [mileageForm, setMileageForm] = useState({ start: '', end: '', purpose: 'Transport participant' })

  useEffect(() => {
    async function load() {
      try {
        const data = await getShift(id)
        setShift(data)
        // Check if shift_notes already exist for this shift
        const { data: existingNotes } = await supabase
          .from('shift_notes')
          .select('id')
          .eq('shift_id', id)
          .limit(1)
        if (existingNotes && existingNotes.length > 0) {
          setNoteSubmitted(true)
        }
      } catch (err) {
        console.error('Failed to load shift:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleClockIn = async () => {
    try {
      const updated = await clockIn(id)
      setShift(prev => ({ ...prev, ...updated, staff: prev.staff, participants: prev.participants }))
    } catch (err) {
      console.error('Clock in failed:', err)
      alert('Failed to clock in')
    }
  }

  const handleClockOut = async () => {
    try {
      const updated = await clockOut(id)
      setShift(prev => ({ ...prev, ...updated, staff: prev.staff, participants: prev.participants }))
    } catch (err) {
      console.error('Clock out failed:', err)
      alert('Failed to clock out')
    }
  }

  const handleSubmitNote = async () => {
    try {
      await supabase.from('shift_notes').insert({
        shift_id: id,
        staff_id: shift.staff_id,
        ...noteForm
      })
    } catch (err) {
      console.error('Note insert failed (table may not exist):', err)
    }
    setShowNote(false)
    setNoteSubmitted(true)
    setNoteForm({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })
  }

  const handleSaveMileage = async () => {
    try {
      await updateShift(id, {
        mileage_start: Number(mileageForm.start) || null,
        mileage_end: Number(mileageForm.end) || null,
        mileage_purpose: mileageForm.purpose
      })
      setShift(prev => ({
        ...prev,
        mileage_start: Number(mileageForm.start) || null,
        mileage_end: Number(mileageForm.end) || null,
        mileage_purpose: mileageForm.purpose
      }))
    } catch (err) {
      console.error('Mileage save failed:', err)
    }
    setShowMileage(false)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (!shift) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Shift not found</p>
        <Link to="/admin/roster" className="text-teal-500 hover:underline">Back to roster</Link>
      </div>
    )
  }

  const s = shift
  const status = s.status || 'scheduled'
  const participant = s.participants
  const staff = s.staff
  const pName = participant ? `${participant.first_name} ${participant.last_name}` : 'Unassigned'
  const wName = staff ? `${staff.first_name} ${staff.last_name}` : 'Unassigned'
  const mileageTotal = (s.mileage_start && s.mileage_end) ? s.mileage_end - s.mileage_start : null

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <Link to="/admin/roster" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 shrink-0 mt-1">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${status === 'in_progress' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : status === 'completed' ? 'bg-gradient-to-br from-orange-500 to-amber-500' : 'bg-gradient-to-br from-cyan-500 to-teal-500'}`}>
              {status === 'in_progress' ? <Play size={24} /> : status === 'completed' ? <Check size={24} /> : <Calendar size={24} />}
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{pName}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge color="teal">{s.service_type || s.title || 'Shift'}</Badge>
                <Badge color={status === 'in_progress' ? 'green' : status === 'completed' ? 'orange' : 'blue'}>{status.replace('_', ' ')}</Badge>
                {noteSubmitted && <Badge color="green">Notes ✓</Badge>}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      {(status === 'scheduled' || status === 'upcoming') && (
        <button onClick={handleClockIn} className="w-full py-3.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 text-sm md:text-base">
          <Play size={20} /> Clock In
        </button>
      )}

      {status === 'in_progress' && (
        <div className="grid grid-cols-2 gap-3">
          <button onClick={handleClockOut} className="py-3.5 bg-gradient-to-r from-orange-500 to-red-500 rounded-xl text-white font-semibold shadow-lg flex items-center justify-center gap-2 text-sm">
            <Square size={18} /> Clock Out
          </button>
          <button onClick={() => setShowNote(true)} className="py-3.5 bg-white border-2 border-teal-500 rounded-xl text-teal-600 font-semibold flex items-center justify-center gap-2 text-sm">
            <FileText size={18} /> Add Note
          </button>
        </div>
      )}

      {status === 'completed' && !noteSubmitted && (
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <AlertTriangle size={20} className="text-white shrink-0" />
              <div>
                <p className="font-bold text-white text-sm">Shift Note Required</p>
                <p className="text-xs text-white/80">Submit within 24 hours</p>
              </div>
            </div>
            <button onClick={() => setShowNote(true)} className="px-4 py-2 bg-white rounded-lg text-orange-600 font-semibold text-xs shrink-0">Submit</button>
          </div>
        </div>
      )}

      {/* Shift Info */}
      <div className="grid grid-cols-2 gap-2 md:gap-3">
        <InfoCard icon={Calendar} label="Date" value={fmtDate(s.shift_date)} color="orange" />
        <InfoCard icon={Clock} label="Time" value={`${fmtTime(s.start_time) || '—'} - ${fmtTime(s.end_time) || '—'}`} color="teal" />
        <InfoCard
          icon={MapPin}
          label="Location"
          value={s.location}
          color="red"
          action={s.location && (
            <a href={`https://maps.google.com/?q=${encodeURIComponent(s.location)}`} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-blue-100 hover:bg-blue-200 shrink-0">
              <Navigation size={14} className="text-blue-600" />
            </a>
          )}
        />
        <InfoCard icon={User} label="Worker" value={wName} color="cyan" />
      </div>

      {/* Clock Times */}
      {(s.clock_in || s.clock_out) && (
        <div className="p-4 md:p-5 rounded-xl md:rounded-2xl glass shadow-lg">
          <h3 className="font-bold text-gray-800 text-sm md:text-base mb-3">Time Tracking</h3>
          <div className="grid grid-cols-2 gap-3">
            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100">
              <p className="text-[10px] md:text-xs text-gray-500">Clocked In</p>
              <p className="font-bold text-emerald-700 text-lg">{fmtTime(s.clock_in) || '—'}</p>
            </div>
            <div className="p-3 rounded-xl bg-orange-50 border border-orange-100">
              <p className="text-[10px] md:text-xs text-gray-500">Clocked Out</p>
              <p className="font-bold text-orange-700 text-lg">{fmtTime(s.clock_out) || '—'}</p>
            </div>
          </div>
        </div>
      )}

      {/* Shift Instructions */}
      {(s.notes || s.details) && (
        <div className="p-4 md:p-5 rounded-xl md:rounded-2xl glass shadow-lg">
          <h3 className="font-bold text-gray-800 text-sm md:text-base mb-2">Shift Instructions</h3>
          <p className="text-xs md:text-sm text-gray-600">{s.notes || s.details}</p>
        </div>
      )}

      {/* Participant Quick Info */}
      {participant && (
        <div className="p-4 md:p-5 rounded-xl md:rounded-2xl glass shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-sm md:text-base">Participant Info</h3>
            <Link to={`/admin/participants/${participant.id}`} className="text-xs text-teal-600 font-semibold">View Profile</Link>
          </div>
          <div className="flex items-center gap-3 p-3 rounded-xl bg-orange-50 border border-orange-100">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow shrink-0">
              {participant.first_name?.[0]}{participant.last_name?.[0]}
            </div>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-gray-800 text-sm">{pName}</p>
              <p className="text-xs text-gray-500">NDIS: {participant.ndis_number || '—'}</p>
            </div>
            {participant.phone && (
              <a href={`tel:${participant.phone}`} className="p-2 rounded-lg bg-white shadow shrink-0">
                <Phone size={16} className="text-teal-600" />
              </a>
            )}
          </div>
        </div>
      )}

      {/* Mileage Section */}
      <div className="p-4 md:p-5 rounded-xl md:rounded-2xl glass shadow-lg">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-gray-800 text-sm md:text-base">Mileage</h3>
          {status !== 'scheduled' && status !== 'upcoming' && (
            <button onClick={() => { setMileageForm({ start: s.mileage_start || '', end: s.mileage_end || '', purpose: s.mileage_purpose || 'Transport participant' }); setShowMileage(true) }} className="text-xs text-teal-600 font-semibold">
              {mileageTotal ? 'Edit' : 'Add'}
            </button>
          )}
        </div>
        {mileageTotal ? (
          <div className="grid grid-cols-3 gap-2">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">Start</p>
              <p className="font-bold text-gray-800">{s.mileage_start} km</p>
            </div>
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-100 text-center">
              <p className="text-[10px] text-gray-400">End</p>
              <p className="font-bold text-gray-800">{s.mileage_end} km</p>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-center">
              <p className="text-[10px] text-gray-400">Total</p>
              <p className="font-bold text-teal-700">{mileageTotal} km</p>
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-xl bg-gray-50 border border-dashed border-gray-200 text-center">
            <Car size={24} className="text-gray-300 mx-auto mb-1" />
            <p className="text-xs text-gray-400">No mileage recorded</p>
          </div>
        )}
      </div>

      {/* Shift Note Modal */}
      <Modal isOpen={showNote} onClose={() => setShowNote(false)} title="Shift Note" wide>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-blue-50 border border-blue-100 text-xs md:text-sm text-blue-700">
            Complete all sections for NDIS compliance.
          </div>
          {[
            { key: 'mood', label: "How was the participant's mood today?", placeholder: 'Describe mood and wellbeing...' },
            { key: 'activities', label: 'What activities were completed?', placeholder: 'List activities and tasks...' },
            { key: 'goals_progress', label: 'Progress toward goals?', placeholder: 'Note any progress observed...' },
            { key: 'concerns', label: 'Any concerns or incidents?', placeholder: 'Document any issues...' },
            { key: 'recommendations', label: 'Recommendations for next shift?', placeholder: 'Handover notes...' },
          ].map(field => (
            <div key={field.key}>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">{field.label}</p>
              <textarea value={noteForm[field.key]} onChange={e => setNoteForm({ ...noteForm, [field.key]: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={2} placeholder={field.placeholder} />
            </div>
          ))}
          <div className="flex gap-2">
            <button onClick={() => setShowNote(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleSubmitNote} className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow">Submit Note</button>
          </div>
        </div>
      </Modal>

      {/* Mileage Modal */}
      <Modal isOpen={showMileage} onClose={() => setShowMileage(false)} title="Record Mileage">
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Start (km)</p>
              <input type="number" value={mileageForm.start} onChange={e => setMileageForm({ ...mileageForm, start: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">End (km)</p>
              <input type="number" value={mileageForm.end} onChange={e => setMileageForm({ ...mileageForm, end: e.target.value })} placeholder="0" className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>
          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Purpose</p>
            <select value={mileageForm.purpose} onChange={e => setMileageForm({ ...mileageForm, purpose: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option>Transport participant</option>
              <option>Community access</option>
              <option>Shopping/errands</option>
              <option>Other</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button onClick={() => setShowMileage(false)} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleSaveMileage} className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow">Save</button>
          </div>
        </div>
      </Modal>
    </div>
  )
}