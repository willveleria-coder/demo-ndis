import { useState, useEffect } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, AlertTriangle, Shield, Clock, User, FileText, Loader2, MapPin, Calendar, Trash2, Pencil } from 'lucide-react'
import { getIncident, updateIncident } from '../services/incidentService'
import { supabase } from '../lib/supabase'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700', teal: 'bg-teal-50 text-teal-700', blue: 'bg-cyan-50 text-cyan-700' }
  return <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${colors[color]}`}>{children}</span>
}

const InfoField = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    <p className="text-gray-800 font-semibold text-sm">{value || '—'}</p>
  </div>
)

function formatDate(iso) {
  if (!iso) return '—'
  return new Date(iso).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })
}

function formatType(t) {
  if (!t) return '—'
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function priorityColor(p) {
  if (p === 'high' || p === 'High') return 'red'
  if (p === 'medium' || p === 'Medium') return 'amber'
  return 'green'
}

function statusColor(s) {
  if (!s) return 'gray'
  const lower = s.toLowerCase()
  if (lower.includes('resolved') || lower.includes('closed')) return 'green'
  if (lower.includes('review') || lower.includes('progress')) return 'amber'
  if (lower.includes('action') || lower.includes('open')) return 'red'
  return 'blue'
}

export default function IncidentDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [incident, setIncident] = useState(null)
  const [updating, setUpdating] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this incident?')) return
    try {
      const { error } = await supabase.from('incidents').delete().eq('id', id)
      if (error) throw error
      navigate('/admin/incidents')
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const data = await getIncident(id)
        setIncident(data)
      } catch (err) {
        console.error('Failed to load incident:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleStatusUpdate = async (newStatus) => {
    setUpdating(true)
    try {
      const updated = await updateIncident(id, { status: newStatus })
      setIncident(prev => ({ ...prev, ...updated }))
    } catch (err) {
      console.error('Failed to update status:', err)
      alert('Failed to update status')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (!incident) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Incident not found</p>
        <Link to="/admin/incidents" className="text-orange-500 hover:underline">Back to incidents</Link>
      </div>
    )
  }

  const i = incident
  const participant = i.participants
  const reporter = i.staff

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex items-start gap-3 md:gap-4">
        <Link to="/admin/incidents" className="p-2 rounded-xl bg-gray-100 hover:bg-gray-200 shrink-0 mt-1">
          <ArrowLeft size={18} className="text-gray-600" />
        </Link>
        <div className="flex-1 min-w-0">
          <div className="flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-3">
            <div className={`w-12 h-12 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center text-white shadow-lg shrink-0 ${i.is_reportable ? 'bg-gradient-to-br from-red-500 to-orange-500' : 'bg-gradient-to-br from-amber-500 to-orange-500'}`}>
              <AlertTriangle size={24} />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl md:text-2xl font-bold text-gray-800 truncate">{formatType(i.incident_type || i.type) || 'Incident'}</h2>
              <div className="flex flex-wrap items-center gap-1.5 mt-1">
                <Badge color={priorityColor(i.priority || i.severity)}>{i.priority || i.severity || 'Medium'}</Badge>
                <Badge color={statusColor(i.status)}>{i.status || 'Open'}</Badge>
                {(i.is_reportable || i.ndis_reportable) && <Badge color="red">NDIS Reportable</Badge>}
              </div>
            </div>
          </div>
        </div>
        <button onClick={handleDelete} className="p-2.5 rounded-xl bg-red-50 hover:bg-red-100 text-red-500 shrink-0 mt-1" title="Delete incident">
          <Trash2 size={18} />
        </button>
      </div>

      {/* Reportable Alert */}
      {(i.is_reportable || i.ndis_reportable) && (
        <div className="p-3 md:p-4 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 shadow-lg">
          <div className="flex items-center gap-3">
            <Shield size={20} className="text-white shrink-0" />
            <div>
              <p className="font-bold text-white text-sm">NDIS Reportable Incident</p>
              <p className="text-xs text-white/80">
                Must be reported to the NDIS Commission within {i.reporting_timeframe || '24 hours'}.
                {i.reporting_deadline && ` Deadline: ${formatDate(i.reporting_deadline)}`}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Incident Info */}
      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg space-y-4">
        <h3 className="font-bold text-gray-800 text-base">Incident Details</h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <InfoField label="Date" value={formatDate(i.incident_date)} />
          <InfoField label="Time" value={i.incident_time || '—'} />
          <InfoField label="Location" value={i.location} />
          <InfoField label="Type" value={formatType(i.incident_type || i.type)} />
          <InfoField label="Priority" value={i.priority || i.severity} />
          <InfoField label="Status" value={i.status} />
        </div>

        {/* Description */}
        <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
          <h4 className="text-sm font-bold text-gray-800 mb-2">Description</h4>
          <p className="text-sm text-gray-600">{i.description || 'No description provided.'}</p>
        </div>

        {/* People Involved */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <User size={16} className="text-orange-500" /> Participant Involved
            </h4>
            {participant ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shadow">
                  {participant.first_name?.[0]}{participant.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{participant.first_name} {participant.last_name}</p>
                  <Link to={`/admin/participants/${participant.id}`} className="text-xs text-teal-600 font-semibold">View Profile</Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not specified</p>
            )}
          </div>

          <div className="p-4 rounded-xl bg-teal-50 border border-teal-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
              <FileText size={16} className="text-teal-500" /> Reported By
            </h4>
            {reporter ? (
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-sm shadow">
                  {reporter.first_name?.[0]}{reporter.last_name?.[0]}
                </div>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{reporter.first_name} {reporter.last_name}</p>
                  <Link to={`/admin/staff/${reporter.id}`} className="text-xs text-teal-600 font-semibold">View Profile</Link>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-400">Not specified</p>
            )}
          </div>
        </div>

        {/* Action Plan */}
        {(i.action_taken || i.resolution || i.follow_up) && (
          <div className="p-4 rounded-xl bg-blue-50 border border-blue-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Action Plan</h4>
            {i.action_taken && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 font-medium">Action Taken</p>
                <p className="text-sm text-gray-600">{i.action_taken}</p>
              </div>
            )}
            {i.resolution && (
              <div className="mb-2">
                <p className="text-xs text-gray-400 font-medium">Resolution</p>
                <p className="text-sm text-gray-600">{i.resolution}</p>
              </div>
            )}
            {i.follow_up && (
              <div>
                <p className="text-xs text-gray-400 font-medium">Follow Up</p>
                <p className="text-sm text-gray-600">{i.follow_up}</p>
              </div>
            )}
          </div>
        )}

        {/* Management Notes */}
        {i.management_notes && (
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
            <h4 className="text-sm font-bold text-gray-800 mb-2">Management Notes</h4>
            <p className="text-sm text-gray-600">{i.management_notes}</p>
          </div>
        )}
      </div>

      {/* Status Actions */}
      {i.status !== 'resolved' && i.status !== 'closed' && (
        <div className="flex gap-3">
          {i.status !== 'under_review' && (
            <button onClick={() => handleStatusUpdate('under_review')} disabled={updating} className="flex-1 py-3 bg-amber-100 hover:bg-amber-200 rounded-xl text-amber-700 text-sm font-semibold transition-all disabled:opacity-50">
              Mark Under Review
            </button>
          )}
          <button onClick={() => handleStatusUpdate('resolved')} disabled={updating} className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-teal-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50">
            {updating ? 'Updating...' : 'Mark Resolved'}
          </button>
        </div>
      )}
    </div>
  )
}