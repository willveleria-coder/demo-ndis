import { useState, useEffect } from 'react'
import { FileText, Clock, Check, AlertTriangle, ChevronRight, Loader2, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-cyan-50 text-cyan-700' }
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

function noteStatus(shift) {
  if (!shift) return 'pending'
  // Check if shift_notes exist for this shift
  if (shift.shift_notes && shift.shift_notes.length > 0) return 'completed'
  if (shift.status === 'completed') {
    const completedAt = new Date(shift.clock_out || shift.end_time)
    const now = new Date()
    const hoursSince = (now - completedAt) / (1000 * 60 * 60)
    if (hoursSince > 24) return 'overdue'
    return 'pending'
  }
  return 'pending'
}

export default function Notes() {
  const [filter, setFilter] = useState('all')
  const [loading, setLoading] = useState(true)
  const [shifts, setShifts] = useState([])
  const [selNote, setSelNote] = useState(null)

  const handleDeleteNote = async (shiftId) => {
    if (!confirm('Delete this shift and its notes?')) return
    try {
      await supabase.from('shift_notes').delete().eq('shift_id', shiftId)
      const { error } = await supabase.from('shifts').delete().eq('id', shiftId)
      if (error) throw error
      setShifts(prev => prev.filter(s => s.id !== shiftId))
      setSelNote(null)
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    }
  }

  const [editingNote, setEditingNote] = useState(null)
  const [editNoteForm, setEditNoteForm] = useState({})
  const [savingNote, setSavingNote] = useState(false)

  const startEditNote = (note) => {
    setEditNoteForm({
      mood: note.mood || '',
      activities: note.activities || '',
      goals_progress: note.goals_progress || '',
      concerns: note.concerns || '',
      recommendations: note.recommendations || '',
      content: note.content || '',
    })
    setEditingNote(note.id)
  }

  const handleSaveNote = async (noteId) => {
    setSavingNote(true)
    try {
      const { error } = await supabase.from('shift_notes').update(editNoteForm).eq('id', noteId)
      if (error) throw error
      // Refresh
      const { data } = await supabase
        .from('shifts')
        .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name), shift_notes(*)')
        .in('status', ['completed', 'in_progress'])
        .order('shift_date', { ascending: false })
      setShifts(data || [])
      // Update selNote
      const updated = (data || []).find(s => s.id === selNote.id)
      if (updated) setSelNote(updated)
      setEditingNote(null)
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingNote(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        // Get all completed and in-progress shifts with their notes
        const { data, error } = await supabase
          .from('shifts')
          .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name), shift_notes(*)')
          .in('status', ['completed', 'in_progress'])
          .order('shift_date', { ascending: false })
        if (error) throw error
        setShifts(data || [])
      } catch (err) {
        console.error('Failed to load notes:', err)
        // Fallback: try without shift_notes join in case table doesn't exist
        try {
          const { data, error } = await supabase
            .from('shifts')
            .select('*, staff(id, first_name, last_name), participants(id, first_name, last_name)')
            .in('status', ['completed', 'in_progress'])
            .order('shift_date', { ascending: false })
          if (!error) setShifts(data || [])
        } catch (e) {
          console.error('Fallback also failed:', e)
        }
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const getStatus = (s) => noteStatus(s)
  const pending = shifts.filter(s => getStatus(s) === 'pending').length
  const completed = shifts.filter(s => getStatus(s) === 'completed').length
  const overdue = shifts.filter(s => getStatus(s) === 'overdue').length

  const filtered = filter === 'all' ? shifts : shifts.filter(s => getStatus(s) === filter)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Notes & Forms</h2>
          <p className="text-sm text-gray-500">Shift notes & compliance tracking</p>
        </div>
      </div>

      {/* Alert Banner */}
      {(pending > 0 || overdue > 0) && (
        <div className="p-3 md:p-4 rounded-xl md:rounded-2xl bg-gradient-to-r from-amber-500 to-orange-500 shadow-lg">
          <div className="flex items-center gap-3">
            <div className="p-1.5 md:p-2 bg-white/20 rounded-lg md:rounded-xl shrink-0">
              <AlertTriangle size={20} className="text-white" />
            </div>
            <div className="min-w-0">
              <p className="font-bold text-white text-sm md:text-base">Notes Require Attention</p>
              <p className="text-xs md:text-sm text-white/80">{pending} pending · {overdue} overdue — Complete within 24hrs of shift</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 md:gap-4">
        <StatCard icon={Clock} label="Pending" value={pending} color="from-amber-500 to-orange-500" alert={pending > 0} />
        <StatCard icon={Check} label="Completed" value={completed} color="from-emerald-500 to-teal-500" />
        <StatCard icon={AlertTriangle} label="Overdue" value={overdue} color="from-red-500 to-orange-500" alert={overdue > 0} />
      </div>

      {/* Filter */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {['all', 'pending', 'completed', 'overdue'].map(f => (
          <button key={f} onClick={() => setFilter(f)} className={`px-3 md:px-4 py-2 rounded-xl text-xs md:text-sm font-semibold whitespace-nowrap transition-all ${filter === f ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600'}`}>
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Notes List */}
      <div className="space-y-2 md:space-y-3">
        {filtered.length > 0 ? filtered.map(s => {
          const status = getStatus(s)
          const staffName = s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'
          const participantName = s.participants ? `${s.participants.first_name} ${s.participants.last_name}` : 'Unassigned'
          const shiftDate = s.shift_date ? new Date(s.shift_date).toLocaleDateString('en-AU') : '—'
          const startTime = s.start_time ? new Date(s.start_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''
          const endTime = s.end_time ? new Date(s.end_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''

          return (
            <div key={s.id} onClick={() => setSelNote(s)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border cursor-pointer hover:shadow-lg transition-all ${status === 'overdue' ? 'bg-red-50 border-red-200' : status === 'pending' ? 'bg-amber-50 border-amber-200' : 'bg-white/70 border-gray-100'}`}>
              <div className="flex gap-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow shrink-0 ${status === 'completed' ? 'bg-gradient-to-br from-emerald-500 to-teal-500' : status === 'overdue' ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'}`}>
                  {status === 'completed' ? <Check size={18} className="text-white" /> : <FileText size={18} className="text-white" />}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <p className="font-bold text-gray-800 text-sm md:text-base truncate">{participantName}</p>
                      <p className="text-xs md:text-sm text-gray-500 truncate">{staffName} · {s.service_type || s.title || 'Shift'}</p>
                    </div>
                    <ChevronRight size={18} className="text-gray-300 shrink-0 hidden sm:block" />
                  </div>
                  <div className="flex items-center justify-between mt-2 gap-2">
                    <p className="text-[10px] md:text-xs text-gray-400">{shiftDate} · {startTime}{endTime ? ` - ${endTime}` : ''}</p>
                    <Badge color={status === 'completed' ? 'green' : status === 'overdue' ? 'red' : 'amber'}>{status.charAt(0).toUpperCase() + status.slice(1)}</Badge>
                  </div>
                </div>
              </div>
            </div>
          )
        }) : (
          <div className="p-12 rounded-xl bg-gray-50 text-center">
            <FileText size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400">No shift notes found</p>
          </div>
        )}
      </div>

      {/* Note Detail Modal */}
      <Modal isOpen={!!selNote} onClose={() => setSelNote(null)} title="Shift Note Details">
        {selNote && (
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50">
                <p className="text-[10px] md:text-xs text-gray-400">Participant</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{selNote.participants ? `${selNote.participants.first_name} ${selNote.participants.last_name}` : '—'}</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50">
                <p className="text-[10px] md:text-xs text-gray-400">Worker</p>
                <p className="font-semibold text-gray-800 text-sm truncate">{selNote.staff ? `${selNote.staff.first_name} ${selNote.staff.last_name}` : '—'}</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50">
                <p className="text-[10px] md:text-xs text-gray-400">Date</p>
                <p className="font-semibold text-gray-800 text-sm">{selNote.shift_date ? new Date(selNote.shift_date).toLocaleDateString('en-AU') : '—'}</p>
              </div>
              <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50">
                <p className="text-[10px] md:text-xs text-gray-400">Status</p>
                <p className="font-semibold text-gray-800 text-sm">{selNote.status?.replace('_', ' ') || '—'}</p>
              </div>
            </div>

            {selNote.shift_notes && selNote.shift_notes.length > 0 ? (
              <div className="space-y-3">
                {selNote.shift_notes.map(note => (
                  <div key={note.id} className="p-3 md:p-4 rounded-lg md:rounded-xl bg-teal-50 border border-teal-100">
                    {editingNote === note.id ? (
                      <div className="space-y-2">
                        <div>
                          <p className="text-xs font-bold text-gray-800 mb-1">Mood & Wellbeing</p>
                          <textarea value={editNoteForm.mood} onChange={e => setEditNoteForm({...editNoteForm, mood: e.target.value})} className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm" rows={2} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 mb-1">Activities Completed</p>
                          <textarea value={editNoteForm.activities} onChange={e => setEditNoteForm({...editNoteForm, activities: e.target.value})} className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm" rows={2} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 mb-1">Progress Toward Goals</p>
                          <textarea value={editNoteForm.goals_progress} onChange={e => setEditNoteForm({...editNoteForm, goals_progress: e.target.value})} className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm" rows={2} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 mb-1">Concerns or Incidents</p>
                          <textarea value={editNoteForm.concerns} onChange={e => setEditNoteForm({...editNoteForm, concerns: e.target.value})} className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm" rows={2} />
                        </div>
                        <div>
                          <p className="text-xs font-bold text-gray-800 mb-1">Recommendations</p>
                          <textarea value={editNoteForm.recommendations} onChange={e => setEditNoteForm({...editNoteForm, recommendations: e.target.value})} className="w-full px-3 py-2 bg-white border border-teal-200 rounded-lg text-sm" rows={2} />
                        </div>
                        <div className="flex gap-2 pt-1">
                          <button onClick={() => setEditingNote(null)} className="flex-1 py-2 bg-gray-100 rounded-lg text-gray-700 text-xs font-semibold">Cancel</button>
                          <button onClick={() => handleSaveNote(note.id)} disabled={savingNote} className="flex-1 py-2 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-lg text-white text-xs font-semibold disabled:opacity-50">
                            {savingNote ? 'Saving...' : 'Save Changes'}
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-end mb-1">
                          <button onClick={() => startEditNote(note)} className="flex items-center gap-1 text-teal-600 hover:text-teal-800 text-xs font-semibold"><Pencil size={12} /> Edit</button>
                        </div>
                        {note.mood && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-gray-800">Mood & Wellbeing</p>
                            <p className="text-xs md:text-sm text-gray-600">{note.mood}</p>
                          </div>
                        )}
                        {note.activities && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-gray-800">Activities Completed</p>
                            <p className="text-xs md:text-sm text-gray-600">{note.activities}</p>
                          </div>
                        )}
                        {note.goals_progress && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-gray-800">Progress Toward Goals</p>
                            <p className="text-xs md:text-sm text-gray-600">{note.goals_progress}</p>
                          </div>
                        )}
                        {note.concerns && (
                          <div className="mb-2">
                            <p className="text-xs font-bold text-gray-800">Concerns or Incidents</p>
                            <p className="text-xs md:text-sm text-gray-600">{note.concerns}</p>
                          </div>
                        )}
                        {note.recommendations && (
                          <div>
                            <p className="text-xs font-bold text-gray-800">Recommendations</p>
                            <p className="text-xs md:text-sm text-gray-600">{note.recommendations}</p>
                          </div>
                        )}
                        {note.content && !note.mood && (
                          <p className="text-xs md:text-sm text-gray-600">{note.content}</p>
                        )}
                      </>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-center">
                <AlertTriangle size={24} className="text-amber-500 mx-auto mb-2" />
                <p className="font-semibold text-gray-800 text-sm">Note Not Submitted</p>
                <p className="text-xs text-gray-500 mt-1">This shift note is {noteStatus(selNote)}</p>
              </div>
            )}

            <div className="flex gap-2">
              <button onClick={() => setSelNote(null)} className="flex-1 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-semibold">Close</button>
              <button onClick={() => handleDeleteNote(selNote.id)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 md:py-3 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 text-sm font-semibold"><Trash2 size={14} /> Delete</button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}