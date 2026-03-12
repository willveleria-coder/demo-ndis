import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { ArrowLeft, Shield, FileText, Upload, AlertCircle, Phone, Mail, Calendar, Clock, Loader2, MapPin, Check, CheckCircle, XCircle, AlertTriangle, Pencil, X, Save, Trash2, ExternalLink, Plus, ChevronRight } from 'lucide-react'
import { getStaffMember, updateStaffMember } from '../services/staffService'
import { getShifts } from '../services/shiftService'
import { supabase } from '../lib/supabase'
import Modal from '../components/ui/Modal'

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

const EditField = ({ label, value, onChange, type = 'text', options }) => (
  <div className="p-3 rounded-xl bg-white border-2 border-teal-200">
    <p className="text-xs text-teal-600 font-semibold mb-1">{label}</p>
    {options ? (
      <select value={value || ''} onChange={e => onChange(e.target.value)} className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none">
        <option value="">Select...</option>
        {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
      </select>
    ) : (
      <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none" />
    )}
  </div>
)

function docStatus(doc) {
  if (doc.status === 'pending') return 'blue'
  if (doc.status === 'expired' || doc.status === 'rejected') return 'red'
  if (!doc.expiry_date) return 'green'
  const days = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'red'
  if (days < 30) return 'amber'
  return 'green'
}

function docLabel(doc) {
  if (doc.status === 'pending') return 'Pending Review'
  if (doc.status === 'rejected') return 'Rejected'
  if (!doc.expiry_date) return 'Valid'
  const days = Math.ceil((new Date(doc.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days < 30) return 'Expiring Soon'
  return 'Valid'
}

function formatType(type) {
  if (!type) return '—'
  return type.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

const EMPLOYMENT_TYPES = [
  { value: 'full_time', label: 'Full Time' },
  { value: 'part_time', label: 'Part Time' },
  { value: 'casual', label: 'Casual' },
  { value: 'contract', label: 'Contract' },
]

const ROLES = [
  { value: 'support_worker', label: 'Support Worker' },
  { value: 'team_leader', label: 'Team Leader' },
  { value: 'coordinator', label: 'Coordinator' },
  { value: 'admin', label: 'Admin' },
]

const GENDERS = [
  { value: 'male', label: 'Male' },
  { value: 'female', label: 'Female' },
  { value: 'non_binary', label: 'Non-Binary' },
  { value: 'prefer_not_to_say', label: 'Prefer Not to Say' },
]

const STATUSES = [
  { value: 'active', label: 'Active' },
  { value: 'on_leave', label: 'On Leave' },
  { value: 'inactive', label: 'Inactive' },
  { value: 'terminated', label: 'Terminated' },
]

const QUAL_DOC_TYPES = [
  { value: 'ndis_screening', label: 'NDIS Worker Screening' },
  { value: 'wwcc', label: 'Working With Children Check' },
  { value: 'first_aid', label: 'First Aid Certificate' },
  { value: 'cpr', label: 'CPR Certificate' },
  { value: 'police_check', label: 'Police Check' },
  { value: 'insurance', label: 'Insurance' },
  { value: 'infection_control', label: 'Infection Control' },
  { value: 'other', label: 'Other' },
]

const GENERAL_DOC_TYPES = [
  { value: 'contract', label: 'Employment Contract' },
  { value: 'resume', label: 'Resume / CV' },
  { value: 'training', label: 'Training Certificate' },
  { value: 'reference', label: 'Reference Letter' },
  { value: 'other', label: 'Other' },
]

const QUAL_TYPE_KEYS = QUAL_DOC_TYPES.map(t => t.value)

export default function StaffDetail() {
  const { id } = useParams()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [s, setS] = useState(null)
  const [shifts, setShifts] = useState([])
  const [editing, setEditing] = useState(false)
  const [saving, setSaving] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [staffAvailability, setStaffAvailability] = useState([])
  const [availLoaded, setAvailLoaded] = useState(false)

  const loadAvailability = async (staffId) => {
    try {
      const { data: avail, error: availErr } = await supabase
        .from('staff_availability')
        .select('*')
        .eq('staff_id', staffId)
      console.log('Availability query for', staffId, ':', avail, availErr)
      if (!availErr && avail) {
        setStaffAvailability(avail)
      }
      setAvailLoaded(true)
    } catch (e) {
      console.warn('staff_availability not loaded:', e)
      setAvailLoaded(true)
    }
  }

  // Document detail state
  const [viewDoc, setViewDoc] = useState(null)

  // Upload state
  const [showUpload, setShowUpload] = useState(false)
  const [uploadType, setUploadType] = useState('qualification') // 'qualification' or 'general'
  const [selectedFile, setSelectedFile] = useState(null)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', document_type: '', expiry_date: '', document_number: '' })

  useEffect(() => {
    async function load() {
      try {
        const [staff, allShifts] = await Promise.all([
          getStaffMember(id),
          getShifts().catch(() => []),
        ])
        setS(staff)
        setShifts(allShifts.filter(sh => sh.staff_id === id))
        loadAvailability(id)
      } catch (err) {
        console.error('Failed to load staff member:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const startEditing = () => {
    setEditForm({
      first_name: s.first_name || '',
      last_name: s.last_name || '',
      phone: s.phone || '',
      email: s.email || '',
      date_of_birth: s.date_of_birth || '',
      gender: s.gender || '',
      address: s.address || '',
      employment_type: s.employment_type || '',
      role: s.role || '',
      start_date: s.start_date || '',
      status: s.status || 'active',
      emergency_contact_name: s.emergency_contact_name || '',
      emergency_contact_phone: s.emergency_contact_phone || '',
      emergency_contact_relationship: s.emergency_contact_relationship || '',
      notes: s.notes || '',
    })
    setEditing(true)
  }

  const cancelEditing = () => {
    setEditing(false)
    setEditForm({})
  }

  const handleSave = async () => {
    if (!editForm.first_name || !editForm.last_name) {
      alert('First name and last name are required')
      return
    }
    setSaving(true)
    try {
      const updated = await updateStaffMember(id, editForm)
      setS(prev => ({ ...prev, ...updated }))
      setEditing(false)
      setEditForm({})
    } catch (err) {
      console.error('Failed to update staff:', err)
      alert('Failed to save: ' + err.message)
    } finally {
      setSaving(false)
    }
  }

  const updateField = (field, value) => {
    setEditForm(prev => ({ ...prev, [field]: value }))
  }

  const openUploadModal = (type) => {
    setUploadType(type)
    setUploadForm({ name: '', document_type: type === 'qualification' ? 'ndis_screening' : 'contract', expiry_date: '', document_number: '' })
    setSelectedFile(null)
    setShowUpload(true)
  }

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    if (!uploadForm.document_type) { alert('Please select a document type'); return }

    setUploading(true)
    try {
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `staff/${id}/${Date.now()}.${fileExt}`
      const { error: fileError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile)
      if (fileError) throw fileError

      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          staff_id: id,
          name: uploadForm.document_type === 'other' && uploadForm.custom_type ? uploadForm.custom_type : (uploadForm.name || selectedFile.name),
          document_type: uploadForm.document_type,
          file_url: publicUrl,
          file_name: selectedFile.name,
          expiry_date: uploadForm.expiry_date || null,
          document_number: uploadForm.document_number || null,
          status: 'valid',
        })
      if (dbError) throw dbError

      // Refresh staff data
      const updated = await getStaffMember(id)
      setS(updated)
      setShowUpload(false)
      setSelectedFile(null)
      setUploadForm({ name: '', document_type: '', expiry_date: '', document_number: '' })
      alert('Document uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDoc = async (docId) => {
    if (!confirm('Are you sure you want to delete this document?')) return
    try {
      const { error } = await supabase.from('documents').delete().eq('id', docId)
      if (error) throw error
      const updated = await getStaffMember(id)
      setS(updated)
    } catch (err) {
      console.error('Delete failed:', err)
      alert('Failed to delete document')
    }
  }

  const handleDocStatus = async (docId, newStatus) => {
    try {
      const { error } = await supabase.from('documents').update({ status: newStatus }).eq('id', docId)
      if (error) throw error
      const updated = await getStaffMember(id)
      setS(updated)
      setViewDoc(prev => prev ? { ...prev, status: newStatus } : null)
    } catch (err) {
      console.error('Status update failed:', err)
      alert('Failed to update document status')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-teal-500" />
      </div>
    )
  }

  if (!s) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Staff member not found</p>
        <Link to="/admin/staff" className="text-teal-500 hover:underline">Back to staff</Link>
      </div>
    )
  }

  const tabs = ['profile', 'qualifications', 'documents', 'shifts', 'availability']

  const docs = s.documents || []
  const qualDocs = docs.filter(d => QUAL_TYPE_KEYS.includes(d.document_type))
  const otherDocs = docs.filter(d => !QUAL_TYPE_KEYS.includes(d.document_type))

  const expiringCount = docs.filter(d => docStatus(d) === 'amber').length
  const expiredCount = docs.filter(d => docStatus(d) === 'red').length
  const pendingCount = docs.filter(d => d.status === 'pending').length

  const DocCard = ({ d, onDelete }) => (
    <div onClick={() => setViewDoc(d)} className="p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all group cursor-pointer">
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3 flex-1 min-w-0">
          <div className={`p-2 rounded-lg shrink-0 ${docStatus(d) === 'green' ? 'bg-emerald-100' : docStatus(d) === 'amber' ? 'bg-amber-100' : docStatus(d) === 'blue' ? 'bg-cyan-100' : 'bg-red-100'}`}>
            {QUAL_TYPE_KEYS.includes(d.document_type) 
              ? <Shield size={20} className={docStatus(d) === 'green' ? 'text-emerald-600' : docStatus(d) === 'amber' ? 'text-amber-600' : docStatus(d) === 'blue' ? 'text-cyan-600' : 'text-red-600'} />
              : <FileText size={20} className={docStatus(d) === 'green' ? 'text-emerald-600' : docStatus(d) === 'amber' ? 'text-amber-600' : docStatus(d) === 'blue' ? 'text-cyan-600' : 'text-red-600'} />
            }
          </div>
          <div className="min-w-0">
            <p className="font-semibold text-gray-800 text-sm truncate">{d.name || formatType(d.document_type)}</p>
            <p className="text-xs text-gray-400">
              {d.status === 'pending' ? 'Uploaded by staff · ' : ''}
              {d.document_number && `#${d.document_number} · `}
              {d.expiry_date ? `Expires: ${new Date(d.expiry_date).toLocaleDateString('en-AU')}` : 'No expiry'}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <Badge color={docStatus(d)}>{docLabel(d)}</Badge>
          <ChevronRight size={16} className="text-gray-300 group-hover:text-gray-400 transition-colors" />
        </div>
      </div>
    </div>
  )

  return (
    <div className="space-y-6">
      <Link to="/admin/staff" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={20} /> Back to Staff
      </Link>

      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {s.first_name[0]}{s.last_name[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-800">{s.first_name} {s.last_name}</h3>
            <p className="text-gray-500 text-sm">{formatType(s.role) || 'Support Worker'} · {formatType(s.employment_type) || 'Not set'}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              <Badge color={s.status === 'active' ? 'green' : s.status === 'on_leave' ? 'amber' : 'red'}>{formatType(s.status) || 'Active'}</Badge>
              {expiredCount > 0 && <Badge color="red">{expiredCount} Expired</Badge>}
              {expiringCount > 0 && <Badge color="amber">{expiringCount} Expiring</Badge>}
              {pendingCount > 0 && <Badge color="blue">{pendingCount} Pending Review</Badge>}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => { setTab(t); if (t === 'availability') loadAvailability(id) }} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-gradient-to-r from-teal-500 to-cyan-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {/* PROFILE TAB */}
        {tab === 'profile' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-700 text-sm">Personal Details</h4>
              {!editing ? (
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-all">
                  <Pencil size={13} /> Edit
                </button>
              ) : (
                <div className="flex gap-2">
                  <button onClick={cancelEditing} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200 transition-all">
                    <X size={13} /> Cancel
                  </button>
                  <button onClick={handleSave} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md hover:shadow-lg transition-all disabled:opacity-50">
                    {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}
                    {saving ? 'Saving...' : 'Save'}
                  </button>
                </div>
              )}
            </div>

            {editing && (
              <div className="p-3 rounded-xl bg-teal-50 border border-teal-200 text-xs text-teal-700 font-medium flex items-center gap-2">
                <Pencil size={14} /> Editing mode — make your changes and click Save
              </div>
            )}

            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {editing ? (
                <>
                  <EditField label="First Name" value={editForm.first_name} onChange={v => updateField('first_name', v)} />
                  <EditField label="Last Name" value={editForm.last_name} onChange={v => updateField('last_name', v)} />
                  <EditField label="Phone" value={editForm.phone} onChange={v => updateField('phone', v)} type="tel" />
                  <EditField label="Email" value={editForm.email} onChange={v => updateField('email', v)} type="email" />
                  <EditField label="Date of Birth" value={editForm.date_of_birth} onChange={v => updateField('date_of_birth', v)} type="date" />
                  <EditField label="Gender" value={editForm.gender} onChange={v => updateField('gender', v)} options={GENDERS} />
                  <div className="col-span-2 md:col-span-3">
                    <EditField label="Address" value={editForm.address} onChange={v => updateField('address', v)} />
                  </div>
                  <EditField label="Employment Type" value={editForm.employment_type} onChange={v => updateField('employment_type', v)} options={EMPLOYMENT_TYPES} />
                  <EditField label="Role" value={editForm.role} onChange={v => updateField('role', v)} options={ROLES} />
                  <EditField label="Status" value={editForm.status} onChange={v => updateField('status', v)} options={STATUSES} />
                  <EditField label="Start Date" value={editForm.start_date} onChange={v => updateField('start_date', v)} type="date" />
                </>
              ) : (
                <>
                  <InfoField label="First Name" value={s.first_name} />
                  <InfoField label="Last Name" value={s.last_name} />
                  <InfoField label="Phone" value={s.phone} />
                  <InfoField label="Email" value={s.email} />
                  <InfoField label="Date of Birth" value={s.date_of_birth ? new Date(s.date_of_birth).toLocaleDateString('en-AU') : null} />
                  <InfoField label="Gender" value={formatType(s.gender)} />
                  <InfoField label="Address" value={s.address} />
                  <InfoField label="Employment Type" value={formatType(s.employment_type)} />
                  <InfoField label="Role" value={formatType(s.role)} />
                  <InfoField label="Status" value={formatType(s.status)} />
                  <InfoField label="Start Date" value={s.start_date ? new Date(s.start_date).toLocaleDateString('en-AU') : null} />
                </>
              )}
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Emergency Contact
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {editing ? (
                  <>
                    <EditField label="Name" value={editForm.emergency_contact_name} onChange={v => updateField('emergency_contact_name', v)} />
                    <EditField label="Phone" value={editForm.emergency_contact_phone} onChange={v => updateField('emergency_contact_phone', v)} type="tel" />
                    <EditField label="Relationship" value={editForm.emergency_contact_relationship} onChange={v => updateField('emergency_contact_relationship', v)} />
                  </>
                ) : (
                  <>
                    <InfoField label="Name" value={s.emergency_contact_name} />
                    <InfoField label="Phone" value={s.emergency_contact_phone} />
                    <InfoField label="Relationship" value={s.emergency_contact_relationship} />
                  </>
                )}
              </div>
            </div>

            <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
              <h4 className="text-sm font-bold text-gray-800 mb-2">Notes</h4>
              {editing ? (
                <textarea value={editForm.notes} onChange={e => updateField('notes', e.target.value)} className="w-full text-sm text-gray-600 bg-white border-2 border-teal-200 rounded-xl p-3 outline-none resize-none" rows={3} placeholder="Add notes about this staff member..." />
              ) : (
                <p className="text-sm text-gray-600">{s.notes || 'No notes'}</p>
              )}
            </div>

            {!editing && (
              <div className="flex gap-3">
                {s.phone && (
                  <a href={`tel:${s.phone}`} className="flex items-center gap-2 px-4 py-2.5 bg-teal-50 border border-teal-200 rounded-xl text-teal-700 text-sm font-semibold hover:bg-teal-100 transition-all">
                    <Phone size={16} /> Call
                  </a>
                )}
                {s.email && (
                  <a href={`mailto:${s.email}`} className="flex items-center gap-2 px-4 py-2.5 bg-cyan-50 border border-cyan-200 rounded-xl text-cyan-700 text-sm font-semibold hover:bg-cyan-100 transition-all">
                    <Mail size={16} /> Email
                  </a>
                )}
              </div>
            )}
          </div>
        )}

        {/* QUALIFICATIONS TAB */}
        {tab === 'qualifications' && (
          <div className="space-y-4">
            {(expiredCount > 0 || expiringCount > 0) && (
              <div className={`p-4 rounded-xl ${expiredCount > 0 ? 'bg-red-50 border border-red-200' : 'bg-amber-50 border border-amber-200'}`}>
                <div className="flex items-center gap-3">
                  <AlertTriangle size={20} className={expiredCount > 0 ? 'text-red-500' : 'text-amber-500'} />
                  <div>
                    <p className="font-bold text-gray-800 text-sm">Compliance Alert</p>
                    <p className="text-xs text-gray-600">
                      {expiredCount > 0 && `${expiredCount} expired document(s). `}
                      {expiringCount > 0 && `${expiringCount} expiring soon.`}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-700 text-sm">Mandatory Checks & Qualifications</h4>
              <button onClick={() => openUploadModal('qualification')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-all">
                <Plus size={13} /> Upload
              </button>
            </div>

            {qualDocs.length > 0 ? (
              <div className="space-y-2">
                {qualDocs.map(d => <DocCard key={d.id} d={d} onDelete={handleDeleteDoc} />)}
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <Shield size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">No qualification documents uploaded yet</p>
                <button onClick={() => openUploadModal('qualification')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-lg flex items-center gap-2 mx-auto">
                  <Upload size={16} /> Upload Qualification
                </button>
              </div>
            )}
          </div>
        )}

        {/* DOCUMENTS TAB */}
        {tab === 'documents' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-gray-700 text-sm">General Documents</h4>
              <button onClick={() => openUploadModal('general')} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100 transition-all">
                <Plus size={13} /> Upload
              </button>
            </div>

            {otherDocs.length > 0 ? (
              <div className="space-y-2">
                {otherDocs.map(d => <DocCard key={d.id} d={d} onDelete={handleDeleteDoc} />)}
              </div>
            ) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400 mb-3">No general documents uploaded yet</p>
                <button onClick={() => openUploadModal('general')} className="px-4 py-2 rounded-xl bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-sm font-semibold shadow-lg flex items-center gap-2 mx-auto">
                  <Upload size={16} /> Upload Document
                </button>
              </div>
            )}
          </div>
        )}

        {/* SHIFTS TAB */}
        {tab === 'shifts' && (
          <div className="space-y-3">
            {shifts.length > 0 ? shifts.map(sh => (
              <Link key={sh.id} to={`/admin/roster/shift/${sh.id}`} className="block p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{sh.title || sh.service_type || 'Shift'}</p>
                    <p className="text-xs text-gray-500">
                      {sh.participants ? `${sh.participants.first_name} ${sh.participants.last_name}` : 'Unassigned'} · {new Date(sh.shift_date || sh.start_time).toLocaleDateString('en-AU')}
                    </p>
                  </div>
                  <Badge color={sh.status === 'completed' ? 'green' : sh.status === 'in_progress' ? 'teal' : 'blue'}>{formatType(sh.status || 'scheduled')}</Badge>
                </div>
              </Link>
            )) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <Calendar size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No shifts assigned yet</p>
              </div>
            )}
          </div>
        )}

        {/* AVAILABILITY TAB */}
        {tab === 'availability' && (() => {
          const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
          const DAY_LABELS = { monday: 'Mon', tuesday: 'Tue', wednesday: 'Wed', thursday: 'Thu', friday: 'Fri', saturday: 'Sat', sunday: 'Sun' }
          const SLOTS = [
            { key: 'morning', label: 'Morning', sub: '6am–12pm', color: 'bg-amber-100 text-amber-700 border-amber-200' },
            { key: 'afternoon', label: 'Afternoon', sub: '12pm–6pm', color: 'bg-sky-100 text-sky-700 border-sky-200' },
            { key: 'evening', label: 'Evening', sub: '6pm–10pm', color: 'bg-violet-100 text-violet-700 border-violet-200' },
            { key: 'night', label: 'Night', sub: '10pm–6am', color: 'bg-indigo-100 text-indigo-700 border-indigo-200' },
          ]
          const availMap = {}
          staffAvailability.forEach(r => { availMap[r.day_of_week] = r })
          const availDays = DAYS.filter(d => availMap[d])
          const totalSlots = staffAvailability.reduce((sum, r) => sum + (r.morning?1:0) + (r.afternoon?1:0) + (r.evening?1:0) + (r.night?1:0), 0)

          return (
            <div className="space-y-4">
              {/* Summary */}
              <div className="flex gap-3">
                <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-teal-500 to-emerald-500 text-white">
                  <p className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Days Available</p>
                  <p className="text-2xl font-black">{availDays.length} <span className="text-sm font-medium opacity-70">/ 7</span></p>
                </div>
                <div className="flex-1 p-3 rounded-xl bg-gradient-to-br from-amber-500 to-orange-500 text-white">
                  <p className="text-[10px] opacity-80 font-medium uppercase tracking-wider">Time Slots</p>
                  <p className="text-2xl font-black">{totalSlots}</p>
                </div>
              </div>

              {staffAvailability.length > 0 ? (
                <div className="space-y-2">
                  {DAYS.map(day => {
                    const row = availMap[day]
                    if (!row) return (
                      <div key={day} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                        <div className="w-9 h-9 rounded-lg bg-gray-200 flex items-center justify-center text-xs font-black text-gray-400">{DAY_LABELS[day]}</div>
                        <p className="text-sm text-gray-300 font-medium">Not available</p>
                      </div>
                    )
                    const activeSlots = SLOTS.filter(sl => row[sl.key])
                    return (
                      <div key={day} className="p-4 rounded-xl bg-white border border-gray-200">
                        <div className="flex items-center gap-3 mb-2">
                          <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-xs font-black text-white shadow">{DAY_LABELS[day]}</div>
                          <div className="flex-1">
                            <p className="font-bold text-gray-800 text-sm">{day.charAt(0).toUpperCase() + day.slice(1)}</p>
                            {row.notes && <p className="text-[10px] text-gray-400 mt-0.5">{row.notes}</p>}
                          </div>
                          <Check size={16} className="text-emerald-500" />
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {activeSlots.length > 0 ? activeSlots.map(sl => (
                            <span key={sl.key} className={`px-2 py-1 rounded-lg text-[10px] font-bold border ${sl.color}`}>
                              {sl.label} <span className="opacity-60 font-medium">{sl.sub}</span>
                            </span>
                          )) : (
                            <span className="text-xs text-gray-300">No specific slots</span>
                          )}
                        </div>
                      </div>
                    )
                  })}
                </div>
              ) : (
                <div className="p-12 rounded-xl bg-gray-50 text-center">
                  <Clock size={48} className="text-gray-200 mx-auto mb-3" />
                  <p className="font-semibold text-gray-500">No availability set</p>
                  <p className="text-sm text-gray-400 mt-1">This staff member hasn't set their availability yet</p>
                </div>
              )}
            </div>
          )
        })()}
      </div>

      {/* UPLOAD MODAL */}
      <Modal isOpen={showUpload} onClose={() => setShowUpload(false)} title={uploadType === 'qualification' ? 'Upload Qualification Document' : 'Upload Document'} wide>
        <div className="space-y-4">
          <div className="p-3 rounded-xl bg-teal-50 border border-teal-100 text-xs text-teal-700 font-medium">
            {uploadType === 'qualification'
              ? 'Upload mandatory compliance documents. Set expiry dates to get automatic alerts.'
              : 'Upload general documents such as contracts, training certificates, or references.'
            }
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Document Type *</p>
              <select
                value={uploadForm.document_type}
                onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              >
                <option value="">Select type...</option>
                {(uploadType === 'qualification' ? QUAL_DOC_TYPES : GENERAL_DOC_TYPES).map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
              {uploadForm.document_type === 'other' && (
                <input
                  placeholder="Specify qualification type..."
                  value={uploadForm.custom_type || ''}
                  onChange={e => setUploadForm({ ...uploadForm, custom_type: e.target.value })}
                  className="w-full mt-2 px-3 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-400 placeholder:text-gray-400"
                />
              )}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Document Name</p>
              <input
                placeholder="e.g. First Aid - St John"
                value={uploadForm.name}
                onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
            {uploadType === 'qualification' && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">Document / Certificate Number</p>
                <input
                  placeholder="e.g. NSW-12345"
                  value={uploadForm.document_number}
                  onChange={e => setUploadForm({ ...uploadForm, document_number: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
              </div>
            )}
            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Expiry Date</p>
              <input
                type="date"
                value={uploadForm.expiry_date}
                onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-bold text-gray-600 mb-1.5">File *</p>
            <label className="block w-full p-6 rounded-xl border-2 border-dashed border-gray-300 hover:border-teal-400 cursor-pointer text-center transition-all">
              <input type="file" className="hidden" onChange={e => setSelectedFile(e.target.files[0])} accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" />
              {selectedFile ? (
                <div className="flex items-center justify-center gap-2">
                  <FileText size={20} className="text-teal-500" />
                  <span className="text-sm font-semibold text-gray-700">{selectedFile.name}</span>
                  <span className="text-xs text-gray-400">({(selectedFile.size / 1024).toFixed(0)} KB)</span>
                </div>
              ) : (
                <div>
                  <Upload size={28} className="text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500 font-medium">Click to select file</p>
                  <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
                </div>
              )}
            </label>
          </div>

          <div className="flex gap-2.5 pt-2">
            <button onClick={() => setShowUpload(false)} className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-700 text-sm font-semibold transition-colors">
              Cancel
            </button>
            <button onClick={handleUpload} disabled={uploading} className="flex-1 py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
              {uploading ? <><Loader2 size={16} className="animate-spin" /> Uploading...</> : <><Upload size={16} /> Upload</>}
            </button>
          </div>
        </div>
      </Modal>

      {/* DOCUMENT DETAIL MODAL */}
      <Modal isOpen={!!viewDoc} onClose={() => setViewDoc(null)} title="Document Details" wide>
        {viewDoc && (
          <div className="space-y-4">
            {/* Status banner */}
            <div className={`p-4 rounded-xl flex items-center gap-3 ${
              docStatus(viewDoc) === 'red' ? 'bg-red-50 border border-red-200' :
              docStatus(viewDoc) === 'amber' ? 'bg-amber-50 border border-amber-200' :
              docStatus(viewDoc) === 'blue' ? 'bg-cyan-50 border border-cyan-200' :
              'bg-emerald-50 border border-emerald-200'
            }`}>
              <div className={`p-2.5 rounded-xl ${
                docStatus(viewDoc) === 'red' ? 'bg-red-100' :
                docStatus(viewDoc) === 'amber' ? 'bg-amber-100' :
                docStatus(viewDoc) === 'blue' ? 'bg-cyan-100' :
                'bg-emerald-100'
              }`}>
                {QUAL_TYPE_KEYS.includes(viewDoc.document_type)
                  ? <Shield size={24} className={docStatus(viewDoc) === 'red' ? 'text-red-600' : docStatus(viewDoc) === 'amber' ? 'text-amber-600' : docStatus(viewDoc) === 'blue' ? 'text-cyan-600' : 'text-emerald-600'} />
                  : <FileText size={24} className={docStatus(viewDoc) === 'red' ? 'text-red-600' : docStatus(viewDoc) === 'amber' ? 'text-amber-600' : docStatus(viewDoc) === 'blue' ? 'text-cyan-600' : 'text-emerald-600'} />
                }
              </div>
              <div className="flex-1">
                <p className="font-bold text-gray-800">{viewDoc.name || formatType(viewDoc.document_type)}</p>
                <p className="text-xs text-gray-500 mt-0.5">
                  {viewDoc.status === 'pending' ? 'Uploaded by staff member · Awaiting review' : QUAL_TYPE_KEYS.includes(viewDoc.document_type) ? 'Qualification Document' : 'General Document'}
                </p>
              </div>
              <Badge color={docStatus(viewDoc)}>{docLabel(viewDoc)}</Badge>
            </div>

            {/* Pending review banner */}
            {viewDoc.status === 'pending' && (
              <div className="p-3 rounded-xl bg-cyan-50 border border-cyan-200 text-xs text-cyan-700 font-medium flex items-center gap-2">
                <Clock size={14} />
                This document was uploaded by the staff member and needs your review. Approve or reject below.
              </div>
            )}

            {/* Details grid */}
            <div className="grid grid-cols-2 gap-3">
              <InfoField label="Document Type" value={formatType(viewDoc.document_type)} />
              <InfoField label="Status" value={docLabel(viewDoc)} />
              {viewDoc.document_number && <InfoField label="Document / Certificate Number" value={viewDoc.document_number} />}
              <InfoField label="Expiry Date" value={viewDoc.expiry_date ? new Date(viewDoc.expiry_date).toLocaleDateString('en-AU') : 'No expiry set'} />
              {viewDoc.file_name && <InfoField label="File Name" value={viewDoc.file_name} />}
              <InfoField label="Uploaded" value={viewDoc.uploaded_at ? new Date(viewDoc.uploaded_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short', year: 'numeric' }) : '—'} />
            </div>

            {/* Expiry warning */}
            {docStatus(viewDoc) === 'red' && viewDoc.status !== 'pending' && viewDoc.status !== 'rejected' && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-xs text-red-700 font-medium flex items-center gap-2">
                <AlertTriangle size={14} />
                This document has expired. Please upload a renewed version to maintain compliance.
              </div>
            )}
            {docStatus(viewDoc) === 'amber' && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-xs text-amber-700 font-medium flex items-center gap-2">
                <AlertTriangle size={14} />
                This document is expiring soon. Arrange renewal before the expiry date.
              </div>
            )}

            {/* Action buttons */}
            <div className="flex gap-2.5 pt-2 flex-wrap">
              {viewDoc.status === 'pending' && (
                <>
                  <button
                    onClick={async () => {
                      await handleDocStatus(viewDoc.id, 'valid')
                      setViewDoc(null)
                    }}
                    className="flex-1 py-3 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all"
                  >
                    <CheckCircle size={16} /> Approve
                  </button>
                  <button
                    onClick={async () => {
                      await handleDocStatus(viewDoc.id, 'rejected')
                      setViewDoc(null)
                    }}
                    className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2 transition-all"
                  >
                    <XCircle size={16} /> Reject
                  </button>
                </>
              )}
              {viewDoc.file_url ? (
                <a href={viewDoc.file_url} target="_blank" rel="noopener noreferrer" className={`${viewDoc.status === 'pending' ? 'px-6' : 'flex-1'} py-3 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center justify-center gap-2 hover:shadow-xl transition-all`}>
                  <ExternalLink size={16} /> View / Download
                </a>
              ) : (
                <div className={`${viewDoc.status === 'pending' ? 'px-6' : 'flex-1'} py-3 bg-gray-100 rounded-xl text-gray-400 text-sm font-semibold flex items-center justify-center gap-2 cursor-not-allowed`}>
                  <ExternalLink size={16} /> No File Attached
                </div>
              )}
              <button
                onClick={async () => {
                  await handleDeleteDoc(viewDoc.id)
                  setViewDoc(null)
                }}
                className="px-6 py-3 bg-red-50 hover:bg-red-100 border border-red-200 rounded-xl text-red-600 text-sm font-semibold flex items-center gap-2 transition-all"
              >
                <Trash2 size={16} /> Delete
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}