import { useState, useEffect } from 'react'
import { MessageSquare, AlertCircle, Check, TrendingUp, Plus, Loader2, Trash2, Pencil } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700', blue: 'bg-cyan-50 text-cyan-700' }
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

const InfoField = ({ label, value }) => (
  <div className="p-2.5 md:p-3 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100">
    <p className="text-[10px] md:text-xs text-gray-400 font-medium">{label}</p>
    <p className="text-gray-800 font-semibold text-xs md:text-sm">{value || '—'}</p>
  </div>
)

export default function Feedback() {
  const [loading, setLoading] = useState(true)
  const [showNew, setShowNew] = useState(false)
  const [selFb, setSelFb] = useState(null)
  const [allFeedback, setAllFeedback] = useState([])
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [newFeedback, setNewFeedback] = useState({
    type: '', from_name: '', method: 'verbally', description: '', action_required: '',
    anonymous: false, follow_up_required: false, follow_up_date: ''
  })

  async function loadFeedback() {
    try {
      const { data, error } = await supabase
        .from('feedback')
        .select('*')
        .order('created_at', { ascending: false })
      if (error) throw error
      setAllFeedback(data || [])
    } catch (err) {
      console.error('Failed to load feedback:', err)
      setAllFeedback([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { loadFeedback() }, [])

  const openComplaints = allFeedback.filter(f => f.type === 'complaint' && f.status !== 'resolved').length
  const resolved = allFeedback.filter(f => f.status === 'resolved').length
  const total = allFeedback.length
  const satisfaction = total > 0 ? Math.round(((total - openComplaints) / total) * 100) : 100

  const handleAddFeedback = async () => {
    if (!newFeedback.type || !newFeedback.description) {
      alert('Please fill in required fields (Type, Description)')
      return
    }
    setSubmitting(true)
    try {
      const payload = {
        type: newFeedback.type,
        from_name: newFeedback.anonymous ? 'Anonymous' : (newFeedback.from_name || 'Unknown'),
        anonymous: newFeedback.anonymous,
        method: newFeedback.method,
        description: newFeedback.description,
        action_required: newFeedback.action_required || null,
        follow_up_required: newFeedback.follow_up_required,
        follow_up_date: newFeedback.follow_up_date || null,
      }
      if (editingId) {
        payload.updated_at = new Date().toISOString()
        const { error } = await supabase.from('feedback').update(payload).eq('id', editingId)
        if (error) throw error
      } else {
        payload.status = 'action_required'
        const { error } = await supabase.from('feedback').insert(payload)
        if (error) throw error
      }
      await loadFeedback()
      setShowNew(false)
      setEditingId(null)
      setNewFeedback({ type: '', from_name: '', method: 'verbally', description: '', action_required: '', anonymous: false, follow_up_required: false, follow_up_date: '' })
    } catch (err) {
      alert('Failed to submit: ' + (err.message || 'Unknown error'))
    } finally {
      setSubmitting(false)
    }
  }

  const handleUpdateStatus = async (id, status) => {
    try {
      const { error } = await supabase.from('feedback').update({ status, updated_at: new Date().toISOString() }).eq('id', id)
      if (error) throw error
      await loadFeedback()
      setSelFb(null)
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    }
  }

  const handleDeleteFeedback = async (id) => {
    if (!confirm('Are you sure you want to delete this feedback?')) return
    try {
      const { error } = await supabase.from('feedback').delete().eq('id', id)
      if (error) throw error
      await loadFeedback()
      setSelFb(null)
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    }
  }

  const handleEditFeedback = (fb) => {
    setNewFeedback({
      type: fb.type || '',
      from_name: fb.from_name || '',
      anonymous: fb.anonymous || false,
      description: fb.description || '',
      method: fb.method || 'verbally',
      action_required: fb.action_required || '',
      follow_up_required: fb.follow_up_required || false,
      follow_up_date: fb.follow_up_date || '',
    })
    setSelFb(null)
    setEditingId(fb.id)
    setShowNew(true)
  }

  const statusLabel = (s) => {
    if (s === 'action_required') return 'Action Required'
    if (s === 'acknowledged') return 'Acknowledged'
    if (s === 'in_progress') return 'In Progress'
    if (s === 'resolved') return 'Resolved'
    return s || 'Unknown'
  }

  const statusColor = (s) => {
    if (s === 'action_required') return 'red'
    if (s === 'acknowledged') return 'amber'
    if (s === 'in_progress') return 'blue'
    if (s === 'resolved') return 'green'
    return 'gray'
  }

  const typeLabel = (t) => t === 'complaint' ? 'Complaint' : t === 'feedback' ? 'Feedback' : t || 'Unknown'
  const methodLabel = (m) => {
    if (m === 'verbally') return 'Verbally'
    if (m === 'form') return 'Via Form'
    if (m === 'email') return 'Email'
    if (m === 'phone') return 'Phone'
    return m || '—'
  }

  if (loading) {
    return <div className="flex items-center justify-center h-64"><Loader2 size={32} className="animate-spin text-orange-500" /></div>
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Feedback & Complaints</h2>
          <p className="text-sm text-gray-500">Manage feedback, complaints & follow-ups</p>
        </div>
        <button onClick={() => setShowNew(true)} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2">
          <Plus size={18} /> New Entry
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={MessageSquare} label="Total" value={total} color="from-orange-500 to-amber-500" />
        <StatCard icon={AlertCircle} label="Open Complaints" value={openComplaints} color="from-red-500 to-orange-500" alert={openComplaints > 0} />
        <StatCard icon={Check} label="Resolved" value={resolved} color="from-emerald-500 to-teal-500" />
        <StatCard icon={TrendingUp} label="Satisfaction" value={`${satisfaction}%`} color="from-teal-500 to-cyan-500" />
      </div>

      {/* Feedback List */}
      {allFeedback.length > 0 ? (
        <div className="space-y-2 md:space-y-3">
          {allFeedback.map(f => (
            <div key={f.id} onClick={() => setSelFb(f)} className={`p-3 md:p-4 rounded-xl md:rounded-2xl border cursor-pointer hover:shadow-lg transition-all ${f.type === 'complaint' ? 'bg-orange-50 border-orange-200' : 'bg-white/70 border-gray-100'}`}>
              <div className="flex gap-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-xl flex items-center justify-center shadow shrink-0 ${f.type === 'complaint' ? 'bg-gradient-to-br from-orange-500 to-red-500' : 'bg-gradient-to-br from-teal-500 to-cyan-500'}`}>
                  <MessageSquare size={18} className="text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <p className="font-bold text-gray-800 text-sm md:text-base">{typeLabel(f.type)}</p>
                        <Badge color="gray">{methodLabel(f.method)}</Badge>
                        {f.anonymous && <Badge color="orange">Anon</Badge>}
                      </div>
                      <p className="text-xs md:text-sm text-gray-500">From: {f.from_name || 'Unknown'}</p>
                    </div>
                    <Badge color={statusColor(f.status)}>{statusLabel(f.status)}</Badge>
                  </div>
                  <p className="text-xs md:text-sm text-gray-600 mt-1 line-clamp-2">{f.description}</p>
                  <div className="flex items-center gap-2 mt-2">
                    <p className="text-[10px] md:text-xs text-gray-400">{new Date(f.created_at).toLocaleDateString('en-AU')}</p>
                    {f.follow_up_required && f.follow_up_date && <p className="text-[10px] md:text-xs text-orange-600 font-medium">Follow-up: {new Date(f.follow_up_date).toLocaleDateString('en-AU')}</p>}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="p-12 rounded-xl bg-gray-50 text-center">
          <MessageSquare size={48} className="text-gray-300 mx-auto mb-3" />
          <p className="text-gray-400">No feedback or complaints yet</p>
        </div>
      )}

      {/* Detail Modal */}
      <Modal isOpen={!!selFb} onClose={() => setSelFb(null)} title="Feedback Details" wide>
        {selFb && (
          <div className="space-y-3 md:space-y-4">
            <div className="grid grid-cols-2 gap-2 md:gap-3">
              <InfoField label="Type" value={typeLabel(selFb.type)} />
              <InfoField label="Submitted By" value={selFb.anonymous ? 'Anonymous' : selFb.from_name} />
              <InfoField label="Method" value={methodLabel(selFb.method)} />
              <InfoField label="Date" value={new Date(selFb.created_at).toLocaleDateString('en-AU')} />
              <InfoField label="Status" value={statusLabel(selFb.status)} />
              <InfoField label="Follow-Up" value={selFb.follow_up_required ? `Yes — ${selFb.follow_up_date ? new Date(selFb.follow_up_date).toLocaleDateString('en-AU') : 'No date set'}` : 'Not required'} />
            </div>
            <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-1">Description</h4>
              <p className="text-gray-600 text-xs md:text-sm whitespace-pre-wrap">{selFb.description}</p>
            </div>
            {selFb.action_required && (
              <div className="p-3 md:p-4 rounded-lg md:rounded-xl bg-orange-50 border border-orange-100">
                <h4 className="text-xs md:text-sm font-bold text-gray-800 mb-1">Action Required</h4>
                <p className="text-gray-600 text-xs md:text-sm whitespace-pre-wrap">{selFb.action_required}</p>
              </div>
            )}

            {/* Edit / Delete / Status buttons */}
            <div className="flex flex-wrap gap-2 pt-2">
              <button onClick={() => handleEditFeedback(selFb)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-semibold"><Pencil size={14} /> Edit</button>
              <button onClick={() => handleDeleteFeedback(selFb.id)} className="flex items-center justify-center gap-1.5 px-4 py-2.5 bg-red-50 hover:bg-red-100 rounded-xl text-red-600 text-sm font-semibold"><Trash2 size={14} /> Delete</button>
              {selFb.status !== 'acknowledged' && selFb.status !== 'resolved' && (
                <button onClick={() => handleUpdateStatus(selFb.id, 'acknowledged')} className="flex-1 py-2.5 bg-gradient-to-r from-amber-500 to-orange-500 rounded-xl text-white text-sm font-semibold shadow-lg">Acknowledge</button>
              )}
              {selFb.status !== 'in_progress' && selFb.status !== 'resolved' && (
                <button onClick={() => handleUpdateStatus(selFb.id, 'in_progress')} className="flex-1 py-2.5 bg-gradient-to-r from-cyan-500 to-teal-500 rounded-xl text-white text-sm font-semibold shadow-lg">In Progress</button>
              )}
              {selFb.status !== 'resolved' && (
                <button onClick={() => handleUpdateStatus(selFb.id, 'resolved')} className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-sm font-semibold shadow-lg">Resolve</button>
              )}
            </div>
          </div>
        )}
      </Modal>

      {/* New Feedback Modal */}
      <Modal isOpen={showNew} onClose={() => { setShowNew(false); setEditingId(null) }} title={editingId ? 'Edit Feedback' : 'New Feedback'} wide>
        <div className="space-y-3 md:space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Type *</p>
              <select value={newFeedback.type} onChange={e => setNewFeedback({...newFeedback, type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="">Select type</option>
                <option value="feedback">Feedback</option>
                <option value="complaint">Complaint</option>
              </select>
            </div>
            <div>
              <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Submitted By</p>
              <div className="flex gap-2">
                <input placeholder="Name" value={newFeedback.from_name} onChange={e => setNewFeedback({...newFeedback, from_name: e.target.value})} disabled={newFeedback.anonymous} className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm disabled:opacity-50" />
                <label className="flex items-center gap-1.5 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer shrink-0">
                  <input type="checkbox" checked={newFeedback.anonymous} onChange={e => setNewFeedback({...newFeedback, anonymous: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                  <span className="text-xs text-gray-600">Anon</span>
                </label>
              </div>
            </div>
          </div>

          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Submission Method</p>
            <select value={newFeedback.method} onChange={e => setNewFeedback({...newFeedback, method: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="verbally">Verbally</option>
              <option value="form">Via Form</option>
              <option value="email">Email</option>
              <option value="phone">Phone</option>
            </select>
          </div>

          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Description *</p>
            <textarea placeholder="Describe the feedback or complaint" value={newFeedback.description} onChange={e => setNewFeedback({...newFeedback, description: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={3} />
          </div>

          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Action Required</p>
            <textarea placeholder="What action needs to be taken?" value={newFeedback.action_required} onChange={e => setNewFeedback({...newFeedback, action_required: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={2} />
          </div>

          <div>
            <p className="text-[10px] md:text-xs text-gray-500 font-medium mb-1">Follow-Up Required?</p>
            <div className="flex gap-2">
              <label className="flex items-center gap-2 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl cursor-pointer">
                <input type="checkbox" checked={newFeedback.follow_up_required} onChange={e => setNewFeedback({...newFeedback, follow_up_required: e.target.checked})} className="accent-orange-500 w-4 h-4" />
                <span className="text-xs text-gray-600">Yes</span>
              </label>
              {newFeedback.follow_up_required && (
                <input type="date" value={newFeedback.follow_up_date} onChange={e => setNewFeedback({...newFeedback, follow_up_date: e.target.value})} className="flex-1 px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              )}
            </div>
          </div>

          <div className="flex gap-2 md:gap-3 pt-2">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 md:py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-semibold">Cancel</button>
            <button onClick={handleAddFeedback} disabled={submitting} className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50">
              {submitting ? 'Saving...' : editingId ? 'Save Changes' : 'Submit'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}