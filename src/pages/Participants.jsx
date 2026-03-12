import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, Users, Loader2 } from 'lucide-react'
import { getParticipants, createParticipant } from '../services/participantService'
import { useAuth } from '../context/AuthContext'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', orange: 'bg-orange-50 text-orange-700' }
  return <span className={`px-2 py-0.5 rounded-full text-[10px] md:text-xs font-semibold ${colors[color]}`}>{children}</span>
}

export default function Participants() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [allParticipants, setAllParticipants] = useState([])
  const [newParticipant, setNewParticipant] = useState({
    first_name: '', last_name: '', ndis_number: '', phone: '', email: '', address: '',
    funding_type: '', date_of_birth: '', gender: '',
    emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
    plan_start_date: '', plan_end_date: '', plan_budget: '', notes: ''
  })

  useEffect(() => {
    loadParticipants()
  }, [])

  async function loadParticipants() {
    try {
      const data = await getParticipants()
      setAllParticipants(data)
    } catch (err) {
      console.error('Failed to load participants:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = allParticipants.filter(p => {
    const name = `${p.first_name} ${p.last_name}`.toLowerCase()
    const q = search.toLowerCase()
    return name.includes(q) || (p.ndis_number && p.ndis_number.includes(search))
  })

  const handleAddParticipant = async () => {
    if (!newParticipant.first_name || !newParticipant.last_name) {
      alert('Please fill in first and last name')
      return
    }

    setSaving(true)
    try {
      const created = await createParticipant({
        org_id: user.org_id,
        first_name: newParticipant.first_name,
        last_name: newParticipant.last_name,
        ndis_number: newParticipant.ndis_number || null,
        phone: newParticipant.phone || null,
        email: newParticipant.email || null,
        address: newParticipant.address || null,
        funding_type: newParticipant.funding_type || null,
        date_of_birth: newParticipant.date_of_birth || null,
        gender: newParticipant.gender || null,
        emergency_contact_name: newParticipant.emergency_contact_name || null,
        emergency_contact_phone: newParticipant.emergency_contact_phone || null,
        emergency_contact_relationship: newParticipant.emergency_contact_relationship || null,
        plan_start_date: newParticipant.plan_start_date || null,
        plan_end_date: newParticipant.plan_end_date || null,
        plan_budget: newParticipant.plan_budget ? parseFloat(newParticipant.plan_budget) : null,
        notes: newParticipant.notes || null,
        status: 'active',
      })
      setAllParticipants([created, ...allParticipants])
      setShowAdd(false)
      setNewParticipant({
        first_name: '', last_name: '', ndis_number: '', phone: '', email: '', address: '',
        funding_type: '', date_of_birth: '', gender: '',
        emergency_contact_name: '', emergency_contact_phone: '', emergency_contact_relationship: '',
        plan_start_date: '', plan_end_date: '', plan_budget: '', notes: ''
      })
    } catch (err) {
      console.error('Failed to create participant:', err)
      alert('Failed to add participant: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleChange = (e) => {
    setNewParticipant({ ...newParticipant, [e.target.name]: e.target.value })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Participants</h2>
          <p className="text-sm text-gray-500">{allParticipants.length} participant{allParticipants.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2">
          <Plus size={18} /> Add Participant
        </button>
      </div>

      {/* Search */}
      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search name or NDIS number..." className="w-full pl-10 pr-4 py-2.5 md:py-3 glass rounded-xl border border-gray-200 text-sm" />
      </div>

      {/* Grid */}
      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(p => (
            <Link key={p.id} to={`/admin/participants/${p.id}`} className="p-3 md:p-4 rounded-xl border bg-white/70 hover:shadow-lg transition-all">
              <div className="flex gap-3">
                <div className="w-10 h-10 md:w-12 md:h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white font-bold text-sm shrink-0">
                  {p.first_name[0]}{p.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm md:text-base truncate">{p.first_name} {p.last_name}</p>
                  <p className="text-xs md:text-sm text-gray-500 truncate">NDIS: {p.ndis_number || 'Not set'}</p>
                  <div className="flex gap-1.5 mt-2 flex-wrap">
                    {p.funding_type && <Badge color="orange">{p.funding_type}</Badge>}
                    <Badge color={p.status === 'active' ? 'green' : p.status === 'inactive' ? 'red' : 'amber'}>{p.status}</Badge>
                  </div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-48 md:h-64 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/50 border border-gray-100">
          <div className="text-center">
            <Users size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No participants found' : 'No participants yet. Add your first one!'}</p>
          </div>
        </div>
      )}

      {/* Add Modal */}
      <Modal isOpen={showAdd} onClose={() => setShowAdd(false)} title="Add New Participant" wide>
        <div className="space-y-4">
          <h4 className="font-semibold text-gray-700 text-sm">Personal Details</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
            <input name="first_name" placeholder="First Name *" value={newParticipant.first_name} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="last_name" placeholder="Last Name *" value={newParticipant.last_name} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="ndis_number" placeholder="NDIS Number" value={newParticipant.ndis_number} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="date_of_birth" type="date" value={newParticipant.date_of_birth} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <select name="gender" value={newParticipant.gender} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Gender</option>
              <option value="Male">Male</option>
              <option value="Female">Female</option>
              <option value="Non-binary">Non-binary</option>
              <option value="Prefer not to say">Prefer not to say</option>
            </select>
            <input name="phone" placeholder="Phone" value={newParticipant.phone} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="email" placeholder="Email" value={newParticipant.email} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="address" placeholder="Address" value={newParticipant.address} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm sm:col-span-2" />
          </div>

          <h4 className="font-semibold text-gray-700 text-sm pt-2">Emergency Contact</h4>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <input name="emergency_contact_name" placeholder="Contact Name" value={newParticipant.emergency_contact_name} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="emergency_contact_phone" placeholder="Contact Phone" value={newParticipant.emergency_contact_phone} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="emergency_contact_relationship" placeholder="Relationship" value={newParticipant.emergency_contact_relationship} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          <h4 className="font-semibold text-gray-700 text-sm pt-2">NDIS Plan</h4>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3">
            <select name="funding_type" value={newParticipant.funding_type} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
              <option value="">Funding Type</option>
              <option value="Self Managed">Self Managed</option>
              <option value="Plan Managed">Plan Managed</option>
              <option value="NDIA Managed">NDIA Managed</option>
            </select>
            <input name="plan_start_date" type="date" placeholder="Plan Start" value={newParticipant.plan_start_date} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="plan_end_date" type="date" placeholder="Plan End" value={newParticipant.plan_end_date} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            <input name="plan_budget" type="number" placeholder="Budget ($)" value={newParticipant.plan_budget} onChange={handleChange} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          <div>
            <h4 className="font-semibold text-gray-700 text-sm mb-2">Notes</h4>
            <textarea name="notes" placeholder="Any additional notes..." value={newParticipant.notes} onChange={handleChange} rows={3} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
          </div>

          <div className="flex gap-2 md:gap-3 pt-2">
            <button onClick={() => setShowAdd(false)} className="flex-1 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleAddParticipant} disabled={saving} className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
              {saving ? <><Loader2 size={16} className="animate-spin" /> Adding...</> : 'Add Participant'}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  )
}