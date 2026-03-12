import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { AlertTriangle, Plus, Loader2, Search, Filter, X, Shield } from 'lucide-react'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', blue: 'bg-cyan-50 text-cyan-700', orange: 'bg-orange-50 text-orange-700', teal: 'bg-teal-50 text-teal-700' }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
}

function formatType(str) {
  if (!str) return '—'
  return str.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function severityColor(s) {
  if (s === 'critical' || s === 'high') return 'red'
  if (s === 'medium') return 'amber'
  return 'green'
}

function statusColor(s) {
  if (s === 'resolved' || s === 'closed') return 'green'
  if (s === 'under_review' || s === 'investigating') return 'amber'
  return 'red'
}

export default function Incidents() {
  const [loading, setLoading] = useState(true)
  const [incidents, setIncidents] = useState([])
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')
  const [showNew, setShowNew] = useState(false)
  const [saving, setSaving] = useState(false)
  const [newIncident, setNewIncident] = useState({
    incident_type: '', severity: 'medium', description: '', participant_id: '', location: '', ndis_reportable: false, incident_time: ''
  })
  const [participants, setParticipants] = useState([])

  useEffect(() => {
    async function load() {
      try {
        const [incRes, partRes] = await Promise.all([
          supabase.from('incidents')
            .select('*, participants(id, first_name, last_name), staff:reported_by(id, first_name, last_name)')
            .order('created_at', { ascending: false }),
          supabase.from('participants').select('id, first_name, last_name'),
        ])
        setIncidents(incRes.data || [])
        setParticipants(partRes.data || [])
      } catch (err) {
        console.error('Failed to load incidents:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const handleCreate = async () => {
    if (!newIncident.incident_type || !newIncident.description) {
      alert('Please fill in incident type and description')
      return
    }
    setSaving(true)
    try {
      const payload = {
        incident_type: newIncident.incident_type,
        severity: newIncident.severity,
        priority: newIncident.severity,
        description: newIncident.description,
        location: newIncident.location || null,
        ndis_reportable: newIncident.ndis_reportable,
        status: 'open',
        incident_date: new Date().toISOString(),
        incident_time: newIncident.incident_time || new Date().toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }),
      }
      if (newIncident.participant_id) payload.participant_id = newIncident.participant_id

      const { data, error } = await supabase.from('incidents').insert(payload).select('*, participants(id, first_name, last_name)').maybeSingle()
      if (error) throw error

      setIncidents([data || payload, ...incidents])
      setShowNew(false)
      setNewIncident({ incident_type: '', severity: 'medium', description: '', participant_id: '', location: '', ndis_reportable: false, incident_time: '' })
    } catch (err) {
      console.error('Create incident failed:', err)
      alert('Failed to create incident: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const filtered = incidents.filter(i => {
    if (filterStatus !== 'all' && i.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      const pName = i.participants ? `${i.participants.first_name} ${i.participants.last_name}`.toLowerCase() : ''
      return (i.incident_type || '').toLowerCase().includes(q) || (i.description || '').toLowerCase().includes(q) || pName.includes(q)
    }
    return true
  })

  const openCount = incidents.filter(i => i.status === 'open' || !i.status).length
  const reportableCount = incidents.filter(i => i.ndis_reportable).length

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
          <h1 className="text-xl md:text-2xl font-bold text-gray-800">Incidents</h1>
          <p className="text-sm text-gray-500">{incidents.length} total · {openCount} open{reportableCount > 0 ? ` · ${reportableCount} NDIS reportable` : ''}</p>
        </div>
        <button onClick={() => setShowNew(true)} className="flex items-center gap-2 px-4 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white text-sm font-semibold shadow-lg hover:shadow-xl transition-all">
          <Plus size={18} /> Log Incident
        </button>
      </div>

      {/* NDIS Reportable Alert */}
      {reportableCount > 0 && (
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-red-500 to-rose-500 shadow-lg">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-white shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">{reportableCount} NDIS Reportable Incident{reportableCount > 1 ? 's' : ''}</p>
              <p className="text-xs text-white/80">Must be reported to NDIS Commission within required timeframes</p>
            </div>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-4 gap-2 md:gap-3">
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg text-center">
          <p className="text-2xl font-bold text-gray-800">{incidents.length}</p>
          <p className="text-xs text-gray-500">Total</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg text-center">
          <p className="text-2xl font-bold text-red-600">{openCount}</p>
          <p className="text-xs text-gray-500">Open</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg text-center">
          <p className="text-2xl font-bold text-amber-600">{incidents.filter(i => i.status === 'under_review').length}</p>
          <p className="text-xs text-gray-500">Reviewing</p>
        </div>
        <div className="p-3 md:p-4 rounded-xl glass shadow-lg text-center">
          <p className="text-2xl font-bold text-emerald-600">{incidents.filter(i => i.status === 'resolved').length}</p>
          <p className="text-xs text-gray-500">Resolved</p>
        </div>
      </div>

      {/* Search & Filter */}
      <div className="flex flex-col sm:flex-row gap-2 md:gap-3">
        <div className="relative flex-1">
          <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search incidents..." className="w-full pl-9 pr-3 py-2.5 bg-white border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500" />
        </div>
        <div className="flex gap-2">
          {['all', 'open', 'under_review', 'resolved'].map(s => (
            <button key={s} onClick={() => setFilterStatus(s)} className={`px-3 py-2 rounded-xl text-xs font-semibold transition-all ${filterStatus === s ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {s === 'all' ? 'All' : formatType(s)}
            </button>
          ))}
        </div>
      </div>

      {/* Incidents List */}
      <div className="space-y-2 md:space-y-3">
        {filtered.length > 0 ? filtered.map(i => {
          const pName = i.participants ? `${i.participants.first_name} ${i.participants.last_name}` : null
          const reporter = i.staff ? `${i.staff.first_name} ${i.staff.last_name}` : null
          return (
            <Link key={i.id} to={`/admin/incidents/${i.id}`} className="block p-4 rounded-xl bg-white border border-gray-100 hover:shadow-lg hover:border-gray-200 transition-all">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-start gap-3">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${i.ndis_reportable ? 'bg-gradient-to-br from-red-500 to-rose-500' : i.severity === 'critical' || i.severity === 'high' ? 'bg-gradient-to-br from-red-500 to-orange-500' : i.severity === 'medium' ? 'bg-gradient-to-br from-amber-500 to-orange-500' : 'bg-gradient-to-br from-cyan-500 to-teal-500'}`}>
                    <AlertTriangle size={18} className="text-white" />
                  </div>
                  <div>
                    <p className="font-bold text-gray-800 text-sm">{formatType(i.incident_type)}</p>
                    <p className="text-xs text-gray-500 mt-0.5 line-clamp-2">{i.description}</p>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1.5">
                      {pName && <span className="text-[10px] text-gray-400">Participant: {pName}</span>}
                      {reporter && <span className="text-[10px] text-gray-400">· Reported by: {reporter}</span>}
                    </div>
                    <p className="text-[10px] text-gray-400 mt-1">{new Date(i.incident_date || i.created_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' })}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1.5 shrink-0">
                  <Badge color={statusColor(i.status)}>{formatType(i.status || 'open')}</Badge>
                  <Badge color={severityColor(i.severity)}>{formatType(i.severity)}</Badge>
                  {i.ndis_reportable && <Badge color="red">NDIS Reportable</Badge>}
                </div>
              </div>
            </Link>
          )
        }) : (
          <div className="p-12 rounded-xl bg-gray-50 text-center">
            <AlertTriangle size={48} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 font-medium">{search || filterStatus !== 'all' ? 'No matching incidents' : 'No incidents recorded'}</p>
          </div>
        )}
      </div>

      {/* New Incident Modal */}
      <Modal isOpen={showNew} onClose={() => setShowNew(false)} title="Log Incident" wide>
        <div className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Incident Type *</p>
              <select value={newIncident.incident_type} onChange={e => setNewIncident({...newIncident, incident_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="">Select type...</option>
                <option value="incident">Incident</option>
                <option value="hazard">Hazard</option>
                <option value="near_miss">Near Miss</option>
                <option value="concern">Concern</option>
                <option value="property_damage">Property Damage</option>
                <option value="medication_error">Medication Error</option>
                <option value="injury">Injury</option>
                <option value="behavioural">Behavioural</option>
                <option value="abuse_neglect">Abuse / Neglect</option>
                <option value="unauthorized_restrictive_practice">Unauthorized Restrictive Practice</option>
              </select>
            </div>
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Severity</p>
              <select value={newIncident.severity} onChange={e => setNewIncident({...newIncident, severity: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="low">Low</option>
                <option value="medium">Medium</option>
                <option value="high">High</option>
                <option value="critical">Critical</option>
              </select>
            </div>
            <select value={newIncident.participant_id} onChange={e => setNewIncident({...newIncident, participant_id: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Participant (optional)</option>
              {participants.map(p => <option key={p.id} value={p.id}>{p.first_name} {p.last_name}</option>)}
            </select>
            <input placeholder="Location" value={newIncident.location} onChange={e => setNewIncident({...newIncident, location: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <div>
              <p className="text-xs text-gray-500 font-medium mb-1">Time of Incident</p>
              <input type="time" value={newIncident.incident_time} onChange={e => setNewIncident({...newIncident, incident_time: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>
          </div>

          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Description *</p>
            <textarea value={newIncident.description} onChange={e => setNewIncident({...newIncident, description: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" rows={4} placeholder="Describe what happened..." />
          </div>

          <label className="flex items-center gap-3 p-3 rounded-xl bg-red-50 border border-red-100 cursor-pointer">
            <input type="checkbox" checked={newIncident.ndis_reportable} onChange={e => setNewIncident({...newIncident, ndis_reportable: e.target.checked})} className="w-4 h-4 rounded text-red-500" />
            <div>
              <p className="text-sm font-semibold text-red-700">NDIS Reportable Incident</p>
              <p className="text-xs text-red-500">Must be reported to NDIS Commission within 24 hours or 5 business days</p>
            </div>
          </label>

          <div className="flex gap-2 md:gap-3">
            <button onClick={() => setShowNew(false)} className="flex-1 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleCreate} disabled={saving} className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Log Incident'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}