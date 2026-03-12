import { useState } from 'react'
import { Calendar, FileText, AlertTriangle, CheckCircle2 } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

function formatDate(iso) {
  if (!iso) return '—'; const d = new Date(iso), today = new Date(), tomorrow = new Date(today), yesterday = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1); yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'; if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'; if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })
}

export default function StaffNotes() {
  const { completedShifts, pendingNotes, staffProfile, refreshShifts } = useStaff()
  const [showNote, setShowNote] = useState(null)
  const [noteForm, setNoteForm] = useState({ mood: '', activities: '', goals_progress: '', concerns: '', recommendations: '' })

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

  return (
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
              {hasNote ? (
                <button onClick={() => { setNoteForm({ mood: s.shift_notes[0]?.mood || '', activities: s.shift_notes[0]?.activities || '', goals_progress: s.shift_notes[0]?.goals_progress || '', concerns: s.shift_notes[0]?.concerns || '', recommendations: s.shift_notes[0]?.recommendations || '' }); setShowNote(s) }}
                  className="px-4 py-2 bg-emerald-50 border border-emerald-200 text-emerald-700 rounded-xl text-sm font-bold hover:bg-emerald-100 transition-all flex items-center gap-1.5"><CheckCircle2 size={14} /> View / Edit</button>
              ) : (
                <button onClick={() => setShowNote(s)} className="px-4 py-2 bg-gradient-to-r from-amber-500 to-orange-500 text-white rounded-xl text-sm font-bold shadow shadow-amber-200 hover:shadow-md transition-all">Submit</button>
              )}
            </div>
          )
        }) : (
          <div className="rounded-xl border border-dashed border-gray-300 bg-white/80 p-16 text-center"><FileText size={48} className="text-gray-200 mx-auto mb-4" /><p className="font-bold text-gray-800">No completed shifts</p></div>
        )}
      </div>

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