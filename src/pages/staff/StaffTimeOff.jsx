import { useState } from 'react'
import { Calendar, Clock, Plus, Check, X, Loader2 } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { supabase } from '../../lib/supabase'
import Modal from '../../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-sky-50 text-sky-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

export default function StaffTimeOff() {
  const { staffProfile, timeOffRequests, setTimeOffRequests } = useStaff()
  const [showAddUnavail, setShowAddUnavail] = useState(false)
  const [newUnavail, setNewUnavail] = useState({ reason: '', start_date: '', end_date: '', notes: '' })
  const [submittingTimeOff, setSubmittingTimeOff] = useState(false)

  const handleSubmitTimeOff = async () => {
    if (!newUnavail.reason || !newUnavail.start_date || !newUnavail.end_date) { alert('Please fill in reason, start date, and end date'); return }
    if (new Date(newUnavail.end_date) < new Date(newUnavail.start_date)) { alert('End date must be after start date'); return }
    setSubmittingTimeOff(true)
    try {
      const { data, error } = await supabase.from('time_off_requests').insert({ staff_id: staffProfile.id, reason: newUnavail.reason, start_date: newUnavail.start_date, end_date: newUnavail.end_date, notes: newUnavail.notes || null, status: 'pending' }).select().single()
      if (error) throw error
      setTimeOffRequests(prev => [data, ...prev])
      setShowAddUnavail(false); setNewUnavail({ reason: '', start_date: '', end_date: '', notes: '' }); alert('Time off request submitted!')
    } catch (err) { alert('Failed to submit: ' + err.message) }
    finally { setSubmittingTimeOff(false) }
  }

  const handleCancelTimeOff = async (id) => {
    if (!confirm('Cancel this time off request?')) return
    try {
      const { error } = await supabase.from('time_off_requests').update({ status: 'cancelled' }).eq('id', id)
      if (error) throw error
      setTimeOffRequests(prev => prev.map(r => r.id === id ? { ...r, status: 'cancelled' } : r))
    } catch (err) { alert('Failed to cancel: ' + err.message) }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div><h2 className="text-2xl font-black text-gray-900">Time Off</h2><p className="text-gray-500 text-sm">Request and manage your leave</p></div>
        <button onClick={() => setShowAddUnavail(true)} className="px-5 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 flex items-center gap-2"><Plus size={16} /> Request Time Off</button>
      </div>

      {/* Summary cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Pending', count: timeOffRequests.filter(r => r.status === 'pending').length, color: 'from-amber-500 to-orange-500', shadow: 'shadow-amber-200', icon: Clock },
          { label: 'Approved', count: timeOffRequests.filter(r => r.status === 'approved').length, color: 'from-emerald-500 to-green-600', shadow: 'shadow-emerald-200', icon: Check },
          { label: 'Declined', count: timeOffRequests.filter(r => r.status === 'declined').length, color: 'from-red-500 to-rose-500', shadow: 'shadow-red-200', icon: X },
          { label: 'Total Requests', count: timeOffRequests.filter(r => r.status !== 'cancelled').length, color: 'from-sky-500 to-blue-500', shadow: 'shadow-sky-200', icon: Calendar },
        ].map(s => (
          <div key={s.label} className="bg-white/80 rounded-xl border border-gray-200 p-4 shadow-sm backdrop-blur-sm">
            <div className={`w-8 h-8 rounded-lg bg-gradient-to-br ${s.color} flex items-center justify-center shadow ${s.shadow} mb-2`}><s.icon size={16} className="text-white" /></div>
            <p className="text-2xl font-black text-gray-900">{s.count}</p>
            <p className="text-xs text-gray-400 font-medium">{s.label}</p>
          </div>
        ))}
      </div>

      {/* Upcoming approved leave */}
      {(() => {
        const today = new Date().toISOString().split('T')[0]
        const upcoming = timeOffRequests.filter(r => r.status === 'approved' && r.end_date >= today)
        if (upcoming.length === 0) return null
        return (
          <div className="bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl p-4 shadow-lg shadow-emerald-200">
            <p className="text-xs font-bold text-white/80 uppercase tracking-wider mb-3">Upcoming Approved Leave</p>
            <div className="space-y-2">
              {upcoming.map(r => (
                <div key={r.id} className="flex items-center gap-3 bg-white/15 backdrop-blur-sm rounded-lg px-4 py-3">
                  <Calendar size={16} className="text-white shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold text-white">{r.reason}</p>
                    <p className="text-xs text-white/70">{new Date(r.start_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                  <span className="text-xs text-white/80 font-semibold">{Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1} day{Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1 !== 1 ? 's' : ''}</span>
                </div>
              ))}
            </div>
          </div>
        )
      })()}

      {/* All requests */}
      <div className="bg-white/80 rounded-xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
        <div className="p-4 border-b border-gray-100"><p className="text-xs font-bold text-gray-400 uppercase tracking-wider">All Requests</p></div>
        {timeOffRequests.length > 0 ? (
          <div className="divide-y divide-gray-50">
            {timeOffRequests.map(r => {
              const days = Math.ceil((new Date(r.end_date) - new Date(r.start_date)) / 86400000) + 1
              const isPast = new Date(r.end_date) < new Date()
              const statusConfig = { pending: { color: 'amber', label: 'Pending Review', icon: Clock }, approved: { color: 'green', label: 'Approved', icon: Check }, declined: { color: 'red', label: 'Declined', icon: X }, cancelled: { color: 'gray', label: 'Cancelled', icon: X } }
              const sc = statusConfig[r.status] || statusConfig.pending
              return (
                <div key={r.id} className={`p-4 flex items-center gap-4 ${isPast && r.status !== 'pending' ? 'opacity-60' : ''}`}>
                  <div className={`w-11 h-11 rounded-xl flex items-center justify-center shrink-0 ${r.status === 'approved' ? 'bg-emerald-50' : r.status === 'declined' ? 'bg-red-50' : r.status === 'cancelled' ? 'bg-gray-100' : 'bg-amber-50'}`}>
                    <sc.icon size={18} className={r.status === 'approved' ? 'text-emerald-500' : r.status === 'declined' ? 'text-red-500' : r.status === 'cancelled' ? 'text-gray-400' : 'text-amber-500'} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2"><p className="font-bold text-gray-900 text-sm">{r.reason}</p><Badge color={sc.color}>{sc.label}</Badge></div>
                    <p className="text-xs text-gray-500 mt-0.5">{new Date(r.start_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short' })} – {new Date(r.end_date).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}<span className="text-gray-300 mx-1">·</span>{days} day{days !== 1 ? 's' : ''}</p>
                    {r.notes && <p className="text-xs text-gray-400 mt-1 italic">"{r.notes}"</p>}
                    <p className="text-[10px] text-gray-300 mt-1">Submitted {r.created_at ? new Date(r.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                  </div>
                  {r.status === 'pending' && <button onClick={() => handleCancelTimeOff(r.id)} className="px-3 py-1.5 bg-gray-100 hover:bg-red-50 hover:text-red-600 rounded-lg text-xs font-semibold text-gray-500 transition-colors shrink-0">Cancel</button>}
                </div>
              )
            })}
          </div>
        ) : (
          <div className="p-12 text-center"><Calendar size={40} className="text-gray-200 mx-auto mb-3" /><p className="font-bold text-gray-800">No time off requests</p><p className="text-sm text-gray-400 mt-1">Submit a request to get started</p></div>
        )}
      </div>

      <Modal isOpen={showAddUnavail} onClose={() => setShowAddUnavail(false)} title="Request Time Off">
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-sky-50 border border-sky-100 text-xs text-sky-700">Your request will be reviewed by your manager. You'll see the status update here once it's been reviewed.</div>
          <div>
            <p className="text-xs text-gray-600 font-bold mb-1.5">Leave Type</p>
            <select value={newUnavail.reason} onChange={e => setNewUnavail({ ...newUnavail, reason: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30">
              <option value="">Select type...</option>
              <option>Annual Leave</option><option>Sick Leave</option><option>Personal Leave</option><option>Carer's Leave</option><option>Compassionate Leave</option><option>Training</option><option>Unpaid Leave</option><option>Other</option>
            </select>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div><p className="text-xs text-gray-600 font-bold mb-1.5">Start Date</p><input type="date" value={newUnavail.start_date} onChange={e => setNewUnavail({ ...newUnavail, start_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" /></div>
            <div><p className="text-xs text-gray-600 font-bold mb-1.5">End Date</p><input type="date" value={newUnavail.end_date} onChange={e => setNewUnavail({ ...newUnavail, end_date: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30" /></div>
          </div>
          {newUnavail.start_date && newUnavail.end_date && new Date(newUnavail.end_date) >= new Date(newUnavail.start_date) && (
            <div className="p-2.5 rounded-lg bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium text-center">
              {Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1} day{Math.ceil((new Date(newUnavail.end_date) - new Date(newUnavail.start_date)) / 86400000) + 1 !== 1 ? 's' : ''} requested
            </div>
          )}
          <div>
            <p className="text-xs text-gray-600 font-bold mb-1.5">Notes <span className="font-normal text-gray-400">(optional)</span></p>
            <textarea value={newUnavail.notes} onChange={e => setNewUnavail({ ...newUnavail, notes: e.target.value })} placeholder="Any additional details for your manager..." rows={2} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 resize-none" />
          </div>
          <div className="flex gap-2 pt-2">
            <button onClick={() => setShowAddUnavail(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700">Cancel</button>
            <button onClick={handleSubmitTimeOff} disabled={submittingTimeOff} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {submittingTimeOff ? <><Loader2 size={16} className="animate-spin" /> Submitting...</> : 'Submit Request'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}