import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Search, Plus, UserCog, Check, AlertCircle, XCircle, Loader2, Copy, Pencil, Trash2 } from 'lucide-react'
import { getStaffMembers } from '../services/staffService'
import { createStaffInvite } from '../services/authService'
import { useAuth } from '../context/AuthContext'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

const Badge = ({ children, color = 'gray' }) => {
  const colors = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700', amber: 'bg-amber-50 text-amber-700', red: 'bg-red-50 text-red-700', teal: 'bg-teal-50 text-teal-700', blue: 'bg-cyan-50 text-cyan-700' }
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

export default function Staff() {
  const { user } = useAuth()
  const [search, setSearch] = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [showEdit, setShowEdit] = useState(false)
  const [showDelete, setShowDelete] = useState(false)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [deleting, setDeleting] = useState(false)
  const [allStaff, setAllStaff] = useState([])
  const [inviteCode, setInviteCode] = useState(null)
  const [editStaff, setEditStaff] = useState(null)
  const [deleteTarget, setDeleteTarget] = useState(null)
  const [newStaff, setNewStaff] = useState({
    firstName: '', lastName: '', phone: '', email: '', position: '', employment_type: ''
  })

  useEffect(() => {
    loadStaff()
  }, [])

  async function loadStaff() {
    try {
      const data = await getStaffMembers()
setAllStaff(data.filter(s => s.role !== 'admin'))
    } catch (err) {
      console.error('Failed to load staff:', err)
    } finally {
      setLoading(false)
    }
  }

  const filtered = allStaff.filter(s => {
    const name = `${s.first_name} ${s.last_name}`.toLowerCase()
    return name.includes(search.toLowerCase())
  })

  const activeStaff = allStaff.filter(s => s.status === 'active')
  const pendingStaff = allStaff.filter(s => s.status === 'pending')
  const expDocs = allStaff.reduce((a, s) => {
    if (!s.documents) return a
    return a + s.documents.filter(d => d.status === 'expiring_soon').length
  }, 0)
  const expiredDocs = allStaff.reduce((a, s) => {
    if (!s.documents) return a
    return a + s.documents.filter(d => d.status === 'expired').length
  }, 0)

  const handleAddStaff = async () => {
    if (!newStaff.firstName || !newStaff.lastName || !newStaff.email) {
      alert('Please fill in First Name, Last Name, and Email')
      return
    }
    setSaving(true)
    try {
      const result = await createStaffInvite({
        orgId: user.org_id,
        firstName: newStaff.firstName,
        lastName: newStaff.lastName,
        email: newStaff.email,
        phone: newStaff.phone || null,
        position: newStaff.position || 'Support Worker',
        employmentType: newStaff.employment_type || 'casual',
      })
      setInviteCode(result.inviteCode)
      await loadStaff()
    } catch (err) {
      console.error('Failed to create staff:', err)
      alert('Failed to add staff: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const handleCloseModal = () => {
    setShowAdd(false)
    setInviteCode(null)
    setNewStaff({ firstName: '', lastName: '', phone: '', email: '', position: '', employment_type: '' })
  }

  const copyCode = () => {
    navigator.clipboard.writeText(inviteCode)
    alert('Code copied!')
  }

  // Edit staff
  const openEdit = (e, staff) => {
    e.preventDefault()
    e.stopPropagation()
    setEditStaff({
      id: staff.id,
      first_name: staff.first_name || '',
      last_name: staff.last_name || '',
      email: staff.email || '',
      phone: staff.phone || '',
      position: staff.position || '',
      employment_type: staff.employment_type || 'casual',
      status: staff.status || 'active',
    })
    setShowEdit(true)
  }

  const handleSaveEdit = async () => {
    if (!editStaff.first_name || !editStaff.last_name) {
      alert('First and last name are required')
      return
    }
    setSaving(true)
    try {
      const { error } = await supabase
        .from('staff')
        .update({
          first_name: editStaff.first_name,
          last_name: editStaff.last_name,
          email: editStaff.email,
          phone: editStaff.phone,
          position: editStaff.position,
          employment_type: editStaff.employment_type,
          status: editStaff.status,
          updated_at: new Date().toISOString(),
        })
        .eq('id', editStaff.id)
      if (error) throw error
      await loadStaff()
      setShowEdit(false)
      setEditStaff(null)
    } catch (err) {
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  // Delete staff
  const openDelete = (e, staff) => {
    e.preventDefault()
    e.stopPropagation()
    setDeleteTarget(staff)
    setShowDelete(true)
  }

  const handleDelete = async () => {
    if (!deleteTarget) return
    setDeleting(true)
    try {
      const { error } = await supabase
        .from('staff')
        .delete()
        .eq('id', deleteTarget.id)
      if (error) throw error
      await loadStaff()
      setShowDelete(false)
      setDeleteTarget(null)
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    } finally {
      setDeleting(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  return (
    <div className="space-y-4 md:space-y-6">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Staff</h2>
          <p className="text-sm text-gray-500">{allStaff.length} team member{allStaff.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setShowAdd(true)} className="w-full sm:w-auto px-4 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2">
          <Plus size={18} /> Add Staff
        </button>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
        <StatCard icon={UserCog} label="Total Staff" value={allStaff.length} color="from-teal-500 to-cyan-500" />
        <StatCard icon={Check} label="Active" value={activeStaff.length} color="from-emerald-500 to-teal-500" />
        <StatCard icon={AlertCircle} label="Docs Expiring" value={expDocs} color="from-amber-500 to-orange-500" alert={expDocs > 0} />
        <StatCard icon={XCircle} label="Docs Expired" value={expiredDocs} color="from-red-500 to-orange-500" alert={expiredDocs > 0} />
      </div>

      <div className="relative">
        <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
        <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search staff..." className="w-full pl-10 pr-4 py-2.5 md:py-3 glass rounded-xl border border-gray-200 text-sm" />
      </div>

      {filtered.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 md:gap-4">
          {filtered.map(s => (
            <Link key={s.id} to={`/admin/staff/${s.id}`} className="p-3 md:p-4 rounded-xl border bg-white/70 hover:shadow-lg transition-all relative group">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 md:w-10 md:h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white font-bold text-xs md:text-sm shadow shrink-0">
                  {s.first_name[0]}{s.last_name[0]}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-gray-800 text-sm truncate">{s.first_name} {s.last_name}</p>
                  <p className="text-xs text-gray-500 truncate">{s.position || 'Support Worker'}</p>
                </div>
                <div className="flex items-center gap-1">
                  <Badge color={s.status === 'active' ? 'green' : s.status === 'pending' ? 'amber' : 'gray'}>{s.status}</Badge>
                  <button onClick={(e) => openEdit(e, s)} className="p-1.5 rounded-lg hover:bg-teal-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Edit">
                    <Pencil size={14} className="text-teal-600" />
                  </button>
                  <button onClick={(e) => openDelete(e, s)} className="p-1.5 rounded-lg hover:bg-red-50 opacity-0 group-hover:opacity-100 transition-opacity" title="Delete">
                    <Trash2 size={14} className="text-red-500" />
                  </button>
                </div>
              </div>
              <div className="flex gap-1 mt-2 flex-wrap">
                {s.employment_type && <Badge color="teal">{s.employment_type.replace('_', ' ')}</Badge>}
                {s.role === 'admin' && <Badge color="blue">Admin</Badge>}
                {s.documents && s.documents.filter(d => d.status === 'expiring_soon').length > 0 && (
                  <Badge color="amber">{s.documents.filter(d => d.status === 'expiring_soon').length} expiring</Badge>
                )}
              </div>
            </Link>
          ))}
        </div>
      ) : (
        <div className="h-48 md:h-64 flex items-center justify-center rounded-xl md:rounded-2xl bg-white/50 border border-gray-100">
          <div className="text-center">
            <UserCog size={40} className="text-gray-300 mx-auto mb-3" />
            <p className="text-gray-400 text-sm">{search ? 'No staff found' : 'No staff yet. Add your first team member!'}</p>
          </div>
        </div>
      )}

      {/* Add Staff Modal */}
      <Modal isOpen={showAdd} onClose={handleCloseModal} title={inviteCode ? 'Staff Invite Created' : 'Add New Staff Member'} wide>
        {inviteCode ? (
          <div className="space-y-4 text-center">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto shadow-lg">
              <Check size={32} className="text-white" />
            </div>
            <p className="text-gray-600 text-sm">Give this code to <strong>{newStaff.firstName} {newStaff.lastName}</strong> so they can set up their account:</p>
            <div className="flex items-center justify-center gap-3">
              <span className="text-3xl font-mono font-bold tracking-widest text-teal-600 bg-teal-50 px-6 py-3 rounded-xl border-2 border-teal-200">{inviteCode}</span>
              <button onClick={copyCode} className="p-3 rounded-xl bg-gray-100 hover:bg-gray-200">
                <Copy size={20} className="text-gray-600" />
              </button>
            </div>
            <p className="text-xs text-gray-400">This code expires in 48 hours</p>
            <p className="text-xs text-gray-500">They should go to <strong>/setup/staff</strong> and enter this code to set their password.</p>
            <button onClick={handleCloseModal} className="w-full py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white font-semibold shadow-lg">Done</button>
          </div>
        ) : (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm">Personal Details</h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
              <input placeholder="First Name *" value={newStaff.firstName} onChange={e => setNewStaff({...newStaff, firstName: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Last Name *" value={newStaff.lastName} onChange={e => setNewStaff({...newStaff, lastName: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Phone" value={newStaff.phone} onChange={e => setNewStaff({...newStaff, phone: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Email *" type="email" value={newStaff.email} onChange={e => setNewStaff({...newStaff, email: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <input placeholder="Job Title" value={newStaff.position} onChange={e => setNewStaff({...newStaff, position: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              <select value={newStaff.employment_type} onChange={e => setNewStaff({...newStaff, employment_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                <option value="">Employment Type</option>
                <option value="full_time">Full Time</option>
                <option value="part_time">Part Time</option>
                <option value="casual">Casual</option>
                <option value="contractor">Contractor</option>
              </select>
            </div>
            <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs md:text-sm text-teal-700">
              An invite code will be generated. Give it to the staff member so they can set up their own login.
            </div>
            <div className="flex gap-2 md:gap-3 pt-2">
              <button onClick={handleCloseModal} className="flex-1 py-2.5 md:py-3 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleAddStaff} disabled={saving} className="flex-1 py-2.5 md:py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Creating...</> : 'Add & Generate Code'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Edit Staff Modal */}
      <Modal isOpen={showEdit} onClose={() => { setShowEdit(false); setEditStaff(null) }} title="Edit Staff Member" wide>
        {editStaff && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">First Name *</label>
                <input value={editStaff.first_name} onChange={e => setEditStaff({...editStaff, first_name: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Last Name *</label>
                <input value={editStaff.last_name} onChange={e => setEditStaff({...editStaff, last_name: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
                <input type="email" value={editStaff.email} onChange={e => setEditStaff({...editStaff, email: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Phone</label>
                <input value={editStaff.phone} onChange={e => setEditStaff({...editStaff, phone: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Position</label>
                <input value={editStaff.position} onChange={e => setEditStaff({...editStaff, position: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Employment Type</label>
                <select value={editStaff.employment_type} onChange={e => setEditStaff({...editStaff, employment_type: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="full_time">Full Time</option>
                  <option value="part_time">Part Time</option>
                  <option value="casual">Casual</option>
                  <option value="contractor">Contractor</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-gray-500 font-medium mb-1 block">Status</label>
                <select value={editStaff.status} onChange={e => setEditStaff({...editStaff, status: e.target.value})} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="active">Active</option>
                  <option value="pending">Pending</option>
                  <option value="inactive">Inactive</option>
                </select>
              </div>
            </div>
            <div className="flex gap-2 pt-2">
              <button onClick={() => { setShowEdit(false); setEditStaff(null) }} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleSaveEdit} disabled={saving} className="flex-1 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {saving ? <><Loader2 size={16} className="animate-spin" /> Saving...</> : 'Save Changes'}
              </button>
            </div>
          </div>
        )}
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal isOpen={showDelete} onClose={() => { setShowDelete(false); setDeleteTarget(null) }} title="Delete Staff Member">
        {deleteTarget && (
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-red-50 border border-red-200 text-center">
              <Trash2 size={32} className="text-red-500 mx-auto mb-2" />
              <p className="font-semibold text-gray-800">Are you sure?</p>
              <p className="text-sm text-gray-600 mt-1">
                This will permanently delete <strong>{deleteTarget.first_name} {deleteTarget.last_name}</strong> from the system. This action cannot be undone.
              </p>
            </div>
            <div className="flex gap-2">
              <button onClick={() => { setShowDelete(false); setDeleteTarget(null) }} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleDelete} disabled={deleting} className="flex-1 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-2">
                {deleting ? <><Loader2 size={16} className="animate-spin" /> Deleting...</> : 'Delete'}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}