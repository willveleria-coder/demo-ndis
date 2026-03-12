import { useState, useEffect, useRef } from 'react'
import { useParams, Link, useNavigate } from 'react-router-dom'
import { ArrowLeft, FileText, Upload, AlertCircle, Phone, DollarSign, Shield, Loader2, X, Download, Trash2, Pencil, Save, ClipboardList, Eye, Users, CheckCircle } from 'lucide-react'
import { getParticipant } from '../services/participantService'
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

const EditField = ({ label, value, onChange, type = 'text' }) => (
  <div className="p-3 rounded-xl bg-white border-2 border-teal-200">
    <p className="text-xs text-teal-600 font-semibold mb-1">{label}</p>
    <input type={type} value={value || ''} onChange={e => onChange(e.target.value)} className="w-full text-sm font-semibold text-gray-800 bg-transparent outline-none" />
  </div>
)

function docStatusColor(d) {
  if (!d.expiry_date) return 'green'
  const days = Math.ceil((new Date(d.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'red'
  if (days < 30) return 'amber'
  return 'green'
}

function docStatusLabel(d) {
  if (!d.expiry_date) return 'Valid'
  const days = Math.ceil((new Date(d.expiry_date) - new Date()) / (1000 * 60 * 60 * 24))
  if (days < 0) return 'Expired'
  if (days < 30) return 'Expiring Soon'
  return 'Valid'
}

export default function ParticipantDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [tab, setTab] = useState('profile')
  const [loading, setLoading] = useState(true)
  const [p, setP] = useState(null)
  const [shifts, setShifts] = useState([])
  const [shiftNotes, setShiftNotes] = useState([])
  const [showUpload, setShowUpload] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadForm, setUploadForm] = useState({ name: '', document_type: 'service_agreement', expiry_date: '', visible_to_staff: true, requires_signoff: false })
  const [selectedFile, setSelectedFile] = useState(null)
  const fileRef = useRef(null)
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState({})
  const [saving, setSaving] = useState(false)
  const [formSubmissions, setFormSubmissions] = useState([])
  const [viewForm, setViewForm] = useState(null)
  const [docSignoffs, setDocSignoffs] = useState({})
  const [viewSignoffs, setViewSignoffs] = useState(null)
  const [allStaff, setAllStaff] = useState([])
  const [docAccessMap, setDocAccessMap] = useState({})
  const [manageAccessDoc, setManageAccessDoc] = useState(null)
  const [savingAccess, setSavingAccess] = useState(false)

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this participant? This cannot be undone.')) return
    try {
      const { error } = await supabase.from('participants').delete().eq('id', id)
      if (error) throw error
      navigate('/admin/participants')
    } catch (err) {
      alert('Failed to delete: ' + (err.message || 'Unknown error'))
    }
  }

  const startEditing = () => {
    setEditForm({
      first_name: p.first_name || '', last_name: p.last_name || '',
      phone: p.phone || '', email: p.email || '', address: p.address || '',
      ndis_number: p.ndis_number || '', date_of_birth: p.date_of_birth || '',
      gender: p.gender || '', status: p.status || 'active',
      emergency_contact_name: p.emergency_contact_name || '',
      emergency_contact_phone: p.emergency_contact_phone || '',
      funding_type: p.funding_type || '', plan_manager_name: p.plan_manager_name || '',
      support_coordinator: p.support_coordinator || '',
    })
    setEditing(true)
  }

  const handleSaveEdit = async () => {
    if (!editForm.first_name || !editForm.last_name) { alert('Name is required'); return }
    setSaving(true)
    try {
      const { error } = await supabase.from('participants').update(editForm).eq('id', id)
      if (error) throw error
      setP(prev => ({ ...prev, ...editForm }))
      setEditing(false)
    } catch (err) {
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  useEffect(() => {
    async function load() {
      try {
        const [participant, allShifts] = await Promise.all([
          getParticipant(id),
          getShifts().catch(() => []),
        ])
        setP(participant)
        const pShifts = allShifts.filter(s => s.participant_id === id)
        setShifts(pShifts)

        // Also load shift_notes for shifts belonging to this participant
        if (pShifts.length > 0) {
          const shiftIds = pShifts.map(s => s.id)
          const { data: notes } = await supabase
            .from('shift_notes')
            .select('*, staff:staff_id(first_name, last_name)')
            .in('shift_id', shiftIds)
            .order('created_at', { ascending: false })
          setShiftNotes(notes || [])
        }

        // Load form submissions that reference this participant by name
        try {
          const { data: allForms } = await supabase
            .from('form_submissions')
            .select('*, staff:staff_id(first_name, last_name)')
            .order('submitted_at', { ascending: false })
          if (allForms && participant) {
            const pName = `${participant.first_name} ${participant.last_name}`.toLowerCase()
            const pFirst = participant.first_name?.toLowerCase()
            const pLast = participant.last_name?.toLowerCase()
            const matched = allForms.filter(f => {
              const dp = (f.data?.participant_name || '').toLowerCase()
              return dp && (dp.includes(pName) || dp.includes(pFirst) || dp.includes(pLast))
            })
            setFormSubmissions(matched)
          }
        } catch (e) { /* table may not exist */ }
      } catch (err) {
        console.error('Failed to load participant:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [id])

  const handleUpload = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    setUploading(true)
    try {
      // Upload file to Supabase Storage
      const fileExt = selectedFile.name.split('.').pop()
      const fileName = `participants/${id}/${Date.now()}.${fileExt}`
      const { data: fileData, error: fileError } = await supabase.storage
        .from('documents')
        .upload(fileName, selectedFile)
      if (fileError) throw fileError

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('documents')
        .getPublicUrl(fileName)

      // Insert document record
      const { error: dbError } = await supabase
        .from('documents')
        .insert({
          participant_id: id,
          name: uploadForm.name || selectedFile.name,
          document_type: uploadForm.document_type,
          file_url: publicUrl,
          file_name: selectedFile.name,
          expiry_date: uploadForm.expiry_date || null,
          visible_to_staff: uploadForm.visible_to_staff,
          requires_signoff: uploadForm.requires_signoff,
          status: 'valid'
        })
      if (dbError) throw dbError

      // Refresh participant data
      const updated = await getParticipant(id)
      setP(updated)
      setShowUpload(false)
      setSelectedFile(null)
      setUploadForm({ name: '', document_type: 'service_agreement', expiry_date: '', visible_to_staff: true, requires_signoff: false })
      alert('Document uploaded successfully!')
    } catch (err) {
      console.error('Upload failed:', err)
      alert('Upload failed: ' + (err.message || 'Unknown error'))
    } finally {
      setUploading(false)
    }
  }

  const toggleDocField = async (docId, field, currentVal) => {
    try {
      const { error } = await supabase.from('documents').update({ [field]: !currentVal }).eq('id', docId)
      if (error) throw error
      const updated = await getParticipant(id)
      setP(updated)
    } catch (err) {
      console.error('Toggle failed:', err)
      alert('Failed to update: ' + (err.message || 'Unknown error'))
    }
  }

  const loadSignoffs = async (docId) => {
    try {
      const { data, error } = await supabase
        .from('document_signoffs')
        .select('*')
        .eq('document_id', docId)
      
      if (error) {
        console.error('Signoffs query error:', error)
        setDocSignoffs(prev => ({ ...prev, [docId]: [] }))
        setViewSignoffs(docId)
        return
      }

      const signoffList = data || []

      // Fetch staff names for each signoff
      const staffIds = [...new Set(signoffList.map(s => s.staff_id).filter(Boolean))]
      let staffMap = {}
      if (staffIds.length > 0) {
        const { data: staffData } = await supabase
          .from('staff')
          .select('id, first_name, last_name')
          .in('id', staffIds)
        if (staffData) {
          staffData.forEach(s => { staffMap[s.id] = s })
        }
      }

      const enriched = signoffList.map(s => ({ ...s, staff: staffMap[s.staff_id] || null }))
      setDocSignoffs(prev => ({ ...prev, [docId]: enriched }))
      setViewSignoffs(docId)
    } catch (err) {
      console.error('Load signoffs error:', err)
      setDocSignoffs(prev => ({ ...prev, [docId]: [] }))
      setViewSignoffs(docId)
    }
  }

  const openManageAccess = async (doc) => {
    setManageAccessDoc(doc)
    try {
      // Load all staff
      if (allStaff.length === 0) {
        const { data: staffList } = await supabase.from('staff').select('id, first_name, last_name, role, status').order('first_name')
        setAllStaff(staffList || [])
      }
      // Load current access for this doc
      const { data: access } = await supabase.from('document_staff_access').select('staff_id').eq('document_id', doc.id)
      const accessSet = new Set((access || []).map(a => a.staff_id))
      setDocAccessMap(prev => ({ ...prev, [doc.id]: accessSet }))
    } catch (err) {
      console.error('Load access error:', err)
    }
  }

  const toggleStaffAccess = async (docId, staffId, hasAccess) => {
    setSavingAccess(true)
    try {
      if (hasAccess) {
        await supabase.from('document_staff_access').delete().eq('document_id', docId).eq('staff_id', staffId)
      } else {
        await supabase.from('document_staff_access').insert({ document_id: docId, staff_id: staffId })
      }
      setDocAccessMap(prev => {
        const newSet = new Set(prev[docId] || [])
        if (hasAccess) newSet.delete(staffId)
        else newSet.add(staffId)
        return { ...prev, [docId]: newSet }
      })
    } catch (err) {
      console.error('Toggle access error:', err)
      alert('Failed to update access: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingAccess(false)
    }
  }

  const grantAllStaffAccess = async (docId) => {
    setSavingAccess(true)
    try {
      const currentAccess = docAccessMap[docId] || new Set()
      const toInsert = allStaff.filter(s => !currentAccess.has(s.id)).map(s => ({ document_id: docId, staff_id: s.id }))
      if (toInsert.length > 0) {
        await supabase.from('document_staff_access').insert(toInsert)
      }
      setDocAccessMap(prev => ({ ...prev, [docId]: new Set(allStaff.map(s => s.id)) }))
    } catch (err) {
      console.error('Grant all error:', err)
    } finally {
      setSavingAccess(false)
    }
  }

  const revokeAllStaffAccess = async (docId) => {
    setSavingAccess(true)
    try {
      await supabase.from('document_staff_access').delete().eq('document_id', docId)
      setDocAccessMap(prev => ({ ...prev, [docId]: new Set() }))
    } catch (err) {
      console.error('Revoke all error:', err)
    } finally {
      setSavingAccess(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  if (!p) {
    return (
      <div className="p-8 text-center">
        <p className="text-gray-500">Participant not found</p>
        <Link to="/admin/participants" className="text-orange-500 hover:underline">Back to participants</Link>
      </div>
    )
  }

  const tabs = ['profile', 'documents', 'shifts', 'notes', 'forms', 'goals']

  return (
    <div className="space-y-6">
      <Link to="/admin/participants" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700">
        <ArrowLeft size={20} /> Back to Participants
      </Link>

      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg">
        <div className="flex items-center gap-4 mb-6">
          <div className="w-14 h-14 md:w-16 md:h-16 rounded-2xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center text-white text-xl font-bold shadow-lg">
            {p.first_name[0]}{p.last_name[0]}
          </div>
          <div className="flex-1">
            <h3 className="text-lg md:text-xl font-bold text-gray-800">{p.first_name} {p.last_name}</h3>
            <p className="text-gray-500 text-sm">NDIS: {p.ndis_number || 'Not set'}</p>
            <div className="flex gap-2 mt-1 flex-wrap">
              {p.funding_type && <Badge color="orange">{p.funding_type}</Badge>}
              <Badge color={p.status === 'active' ? 'green' : p.status === 'inactive' ? 'red' : 'amber'}>{p.status}</Badge>
            </div>
          </div>
          <div className="flex gap-2 shrink-0">
            {!editing ? (
              <>
                <button onClick={startEditing} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-teal-50 border border-teal-200 text-teal-700 text-xs font-semibold hover:bg-teal-100"><Pencil size={13} /> Edit</button>
                <button onClick={handleDelete} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-50 border border-red-200 text-red-600 text-xs font-semibold hover:bg-red-100"><Trash2 size={13} /> Delete</button>
              </>
            ) : (
              <>
                <button onClick={() => setEditing(false)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200"><X size={13} /> Cancel</button>
                <button onClick={handleSaveEdit} disabled={saving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-500 text-white text-xs font-semibold shadow-md disabled:opacity-50">
                  {saving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />} {saving ? 'Saving...' : 'Save'}
                </button>
              </>
            )}
          </div>
        </div>

        <div className="flex gap-2 mb-6 flex-wrap">
          {tabs.map(t => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all ${tab === t ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}>
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>

        {tab === 'profile' && (
          <div className="space-y-4">
            <h4 className="font-semibold text-gray-700 text-sm">Personal Details</h4>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              {editing ? (
                <>
                  <EditField label="First Name" value={editForm.first_name} onChange={v => setEditForm({...editForm, first_name: v})} />
                  <EditField label="Last Name" value={editForm.last_name} onChange={v => setEditForm({...editForm, last_name: v})} />
                  <EditField label="NDIS Number" value={editForm.ndis_number} onChange={v => setEditForm({...editForm, ndis_number: v})} />
                  <EditField label="Date of Birth" value={editForm.date_of_birth} onChange={v => setEditForm({...editForm, date_of_birth: v})} type="date" />
                  <EditField label="Gender" value={editForm.gender} onChange={v => setEditForm({...editForm, gender: v})} />
                  <EditField label="Phone" value={editForm.phone} onChange={v => setEditForm({...editForm, phone: v})} type="tel" />
                  <EditField label="Email" value={editForm.email} onChange={v => setEditForm({...editForm, email: v})} type="email" />
                  <div className="col-span-2 md:col-span-3">
                    <EditField label="Address" value={editForm.address} onChange={v => setEditForm({...editForm, address: v})} />
                  </div>
                </>
              ) : (
                <>
                  <InfoField label="First Name" value={p.first_name} />
                  <InfoField label="Last Name" value={p.last_name} />
                  <InfoField label="NDIS Number" value={p.ndis_number} />
                  <InfoField label="Date of Birth" value={p.date_of_birth ? new Date(p.date_of_birth).toLocaleDateString('en-AU') : null} />
                  <InfoField label="Gender" value={p.gender} />
                  <InfoField label="Phone" value={p.phone} />
                  <InfoField label="Email" value={p.email} />
                  <InfoField label="Address" value={p.address} />
                </>
              )}
            </div>

            <div className="p-4 rounded-xl bg-red-50 border border-red-100">
              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <AlertCircle size={16} className="text-red-500" /> Emergency Contact
              </h4>
              <div className="grid grid-cols-3 gap-3">
                <InfoField label="Name" value={p.emergency_contact_name} />
                <InfoField label="Phone" value={p.emergency_contact_phone} />
                <InfoField label="Relationship" value={p.emergency_contact_relationship} />
              </div>
            </div>

            <div className="p-4 rounded-xl bg-orange-50 border border-orange-100">
              <h4 className="text-sm font-bold text-gray-800 mb-2 flex items-center gap-2">
                <DollarSign size={16} className="text-orange-500" /> NDIS Plan
              </h4>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                <InfoField label="Funding Type" value={p.funding_type} />
                <InfoField label="Plan Start" value={p.plan_start_date ? new Date(p.plan_start_date).toLocaleDateString('en-AU') : null} />
                <InfoField label="Plan End" value={p.plan_end_date ? new Date(p.plan_end_date).toLocaleDateString('en-AU') : null} />
                <InfoField label="Budget" value={p.plan_budget ? `$${Number(p.plan_budget).toLocaleString()}` : null} />
              </div>
            </div>

            {p.notes && (
              <div className="p-4 rounded-xl bg-gray-50 border border-gray-100">
                <h4 className="text-sm font-bold text-gray-800 mb-2">Notes</h4>
                <p className="text-sm text-gray-600">{p.notes}</p>
              </div>
            )}
          </div>
        )}

        {tab === 'documents' && (
          <div className="space-y-3">
            {p.documents && p.documents.length > 0 ? p.documents.map(d => (
              <div key={d.id} className="p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <div className={`p-2 rounded-lg ${docStatusColor(d) === 'green' ? 'bg-emerald-100' : docStatusColor(d) === 'amber' ? 'bg-amber-100' : 'bg-red-100'}`}>
                      <FileText size={20} className={docStatusColor(d) === 'green' ? 'text-emerald-600' : docStatusColor(d) === 'amber' ? 'text-amber-600' : 'text-red-600'} />
                    </div>
                    <div>
                      <p className="font-semibold text-gray-800 text-sm">{d.name}</p>
                      <p className="text-xs text-gray-400">{d.document_type?.replace(/_/g, ' ')} · {d.expiry_date ? `Expires: ${new Date(d.expiry_date).toLocaleDateString('en-AU')}` : 'No expiry'}</p>
                      <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                        <Badge color={docStatusColor(d)}>{docStatusLabel(d)}</Badge>
                        {d.visible_to_staff && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-blue-50 text-blue-600 uppercase tracking-wider">Staff Visible</span>}
                        {d.requires_signoff && <span className="px-1.5 py-0.5 rounded text-[8px] font-bold bg-amber-50 text-amber-600 uppercase tracking-wider">Sign-off Required</span>}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 shrink-0">
                    <button onClick={() => toggleDocField(d.id, 'visible_to_staff', d.visible_to_staff)}
                      title={d.visible_to_staff ? 'Hide from staff' : 'Show to staff'}
                      className={`p-2 rounded-lg border transition-colors ${d.visible_to_staff ? 'bg-blue-50 border-blue-200 text-blue-600 hover:bg-blue-100' : 'bg-gray-50 border-gray-200 text-gray-400 hover:bg-gray-100'}`}>
                      <Eye size={14} />
                    </button>
                    {d.visible_to_staff && (
                      <button onClick={() => openManageAccess(d)}
                        title="Manage staff access"
                        className="p-2 rounded-lg bg-violet-50 border border-violet-200 text-violet-600 hover:bg-violet-100 transition-colors">
                        <Users size={14} />
                      </button>
                    )}
                    <button onClick={() => loadSignoffs(d.id)}
                      title="View sign-offs"
                      className="p-2 rounded-lg bg-amber-50 border border-amber-200 text-amber-600 hover:bg-amber-100 transition-colors">
                      <CheckCircle size={14} />
                    </button>
                    {d.file_url && (
                      <a href={d.file_url} target="_blank" rel="noopener noreferrer" className="p-2 rounded-lg bg-gray-100 hover:bg-gray-200 transition-colors">
                        <Download size={14} className="text-gray-500" />
                      </a>
                    )}
                  </div>
                </div>
              </div>
            )) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <FileText size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No documents uploaded yet</p>
              </div>
            )}
            <button onClick={() => setShowUpload(true)} className="w-full p-4 rounded-xl border-2 border-dashed border-gray-300 text-gray-500 hover:border-orange-400 hover:text-orange-500 font-semibold flex items-center justify-center gap-2 transition-all">
              <Upload size={20} /> Upload Document
            </button>
          </div>
        )}

        {tab === 'shifts' && (
          <div className="space-y-3">
            {shifts.length > 0 ? shifts.map(s => (
              <Link key={s.id} to={`/admin/roster/shift/${s.id}`} className="block p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{s.title || 'Shift'}</p>
                    <p className="text-xs text-gray-500">
                      {s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unassigned'} · {new Date(s.start_time).toLocaleDateString('en-AU')} {new Date(s.start_time).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true })}
                    </p>
                  </div>
                  <Badge color={s.status === 'completed' ? 'green' : s.status === 'in_progress' ? 'teal' : 'blue'}>{s.status.replace('_', ' ')}</Badge>
                </div>
              </Link>
            )) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <p className="text-gray-400">No shifts for this participant</p>
              </div>
            )}
          </div>
        )}

        {tab === 'notes' && (
          <div className="space-y-3">
            {/* Shift Notes from staff portal */}
            {shiftNotes.length > 0 && (
              <>
                <h4 className="text-sm font-bold text-gray-600">Shift Notes</h4>
                {shiftNotes.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-teal-50 border border-teal-100 hover:shadow-md transition-all">
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold text-gray-800 text-sm">{n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : 'Staff'}</p>
                      <p className="text-xs text-gray-400">{new Date(n.created_at).toLocaleDateString('en-AU')}</p>
                    </div>
                    {n.mood && <div className="mb-2"><p className="text-xs font-bold text-gray-500">Mood & Wellbeing</p><p className="text-sm text-gray-600">{n.mood}</p></div>}
                    {n.activities && <div className="mb-2"><p className="text-xs font-bold text-gray-500">Activities</p><p className="text-sm text-gray-600">{n.activities}</p></div>}
                    {n.goals_progress && <div className="mb-2"><p className="text-xs font-bold text-gray-500">Goals Progress</p><p className="text-sm text-gray-600">{n.goals_progress}</p></div>}
                    {n.concerns && <div className="mb-2"><p className="text-xs font-bold text-gray-500">Concerns</p><p className="text-sm text-gray-600">{n.concerns}</p></div>}
                    {n.recommendations && <div><p className="text-xs font-bold text-gray-500">Recommendations</p><p className="text-sm text-gray-600">{n.recommendations}</p></div>}
                    {n.content && !n.mood && <p className="text-sm text-gray-600">{n.content}</p>}
                  </div>
                ))}
              </>
            )}

            {/* Progress Notes */}
            {p.progress_notes && p.progress_notes.length > 0 && (
              <>
                {shiftNotes.length > 0 && <h4 className="text-sm font-bold text-gray-600 mt-4">Progress Notes</h4>}
                {p.progress_notes.map(n => (
                  <div key={n.id} className="p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all">
                    <div className="flex justify-between mb-2">
                      <p className="font-semibold text-gray-800 text-sm">{n.staff ? `${n.staff.first_name} ${n.staff.last_name}` : 'Unknown'}</p>
                      <Badge color="teal">{n.category}</Badge>
                    </div>
                    <p className="text-xs text-gray-400">{new Date(n.note_date).toLocaleDateString('en-AU')}</p>
                    <p className="text-gray-600 mt-2 text-sm">{n.content}</p>
                  </div>
                ))}
              </>
            )}

            {shiftNotes.length === 0 && (!p.progress_notes || p.progress_notes.length === 0) && (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <p className="text-gray-400">No notes yet</p>
              </div>
            )}
          </div>
        )}

        {tab === 'forms' && (
          <div className="space-y-3">
            {formSubmissions.length > 0 ? formSubmissions.map(sub => {
              const formLabels = { medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation' }
              const formColors = { medication_chart: 'bg-blue-50 border-blue-200', medication_incident: 'bg-red-50 border-red-200', incident_report: 'bg-amber-50 border-amber-200', cash_reconciliation: 'bg-emerald-50 border-emerald-200' }
              const formIcons = { medication_chart: '💊', medication_incident: '🚨', incident_report: '⚠️', cash_reconciliation: '💵' }
              const formBadge = { medication_chart: 'blue', medication_incident: 'red', incident_report: 'amber', cash_reconciliation: 'green' }
              const staffN = sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'
              return (
                <div key={sub.id} className={`p-4 rounded-xl border ${formColors[sub.form_type] || 'bg-gray-50 border-gray-200'} hover:shadow-md transition-all`}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-3">
                      <span className="text-xl">{formIcons[sub.form_type] || '📋'}</span>
                      <div>
                        <p className="font-semibold text-gray-800 text-sm">{formLabels[sub.form_type] || sub.form_type}</p>
                        <p className="text-xs text-gray-500">Submitted by {staffN}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge color={formBadge[sub.form_type] || 'gray'}>{formLabels[sub.form_type] || 'Form'}</Badge>
                      <button onClick={() => setViewForm(sub)} className="p-1.5 rounded-lg bg-white/80 hover:bg-white border border-gray-200 transition-colors">
                        <Eye size={14} className="text-gray-500" />
                      </button>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-xs text-gray-400">
                    <span>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</span>
                    <span>{sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</span>
                  </div>
                  {sub.data && (
                    <div className="mt-3 pt-3 border-t border-gray-100/60 grid grid-cols-2 gap-x-4 gap-y-2">
                      {Object.entries(sub.data).filter(([k, v]) => v && typeof v === 'string' && v.length > 0 && k !== 'participant_name').slice(0, 6).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-gray-400 capitalize font-medium">{k.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-700 line-clamp-2">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            }) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <ClipboardList size={48} className="text-gray-300 mx-auto mb-3" />
                <p className="text-gray-400">No form submissions for this participant</p>
                <p className="text-xs text-gray-300 mt-1">Forms submitted by staff with this participant's name will appear here</p>
              </div>
            )}
          </div>
        )}

        {tab === 'goals' && (
          <div className="space-y-3">
            {p.goals && p.goals.length > 0 ? p.goals.map(g => (
              <div key={g.id} className="p-4 rounded-xl bg-white border border-gray-100 hover:shadow-md transition-all">
                <div className="flex justify-between mb-2">
                  <p className="font-semibold text-gray-800 text-sm">{g.title}</p>
                  <Badge color={g.status === 'achieved' ? 'green' : g.status === 'active' ? 'blue' : 'gray'}>{g.status}</Badge>
                </div>
                {g.description && <p className="text-sm text-gray-500">{g.description}</p>}
                <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                  <div className="bg-gradient-to-r from-orange-500 to-amber-500 h-2 rounded-full" style={{ width: `${g.progress}%` }} />
                </div>
                <p className="text-xs text-gray-400 mt-1">{g.progress}% complete{g.target_date ? ` · Target: ${new Date(g.target_date).toLocaleDateString('en-AU')}` : ''}</p>
              </div>
            )) : (
              <div className="p-12 rounded-xl bg-gray-50 text-center">
                <p className="text-gray-400">No goals set yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      <Modal isOpen={showUpload} onClose={() => { setShowUpload(false); setSelectedFile(null); }} title="Upload Document">

        <div className="space-y-4">
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Document Name</p>
            <input
              value={uploadForm.name}
              onChange={e => setUploadForm({ ...uploadForm, name: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
              placeholder="e.g. NDIS Plan 2026"
            />
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Document Type</p>
            <select
              value={uploadForm.document_type}
              onChange={e => setUploadForm({ ...uploadForm, document_type: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            >
              <option value="service_agreement">Service Agreement</option>
              <option value="ndis_plan">NDIS Plan</option>
              <option value="support_plan">Support Plan</option>
              <option value="risk_assessment">Risk Assessment</option>
              <option value="consent_form">Consent Form</option>
              <option value="medical_report">Medical Report</option>
              <option value="behaviour_support_plan">Behaviour Support Plan</option>
              <option value="other">Other</option>
            </select>
          </div>
          <div>
            <p className="text-xs text-gray-500 font-medium mb-1">Expiry Date (optional)</p>
            <input
              type="date"
              value={uploadForm.expiry_date}
              onChange={e => setUploadForm({ ...uploadForm, expiry_date: e.target.value })}
              className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm"
            />
          </div>

          {/* Staff visibility & sign-off toggles */}
          <div className="p-4 rounded-xl bg-gray-50 border border-gray-200 space-y-3">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-gray-700">Visible to Workers</p>
                <p className="text-[10px] text-gray-400">Staff assigned to this participant can view this document</p>
              </div>
              <button onClick={() => setUploadForm({ ...uploadForm, visible_to_staff: !uploadForm.visible_to_staff })}
                className={`relative w-11 h-6 rounded-full transition-colors ${uploadForm.visible_to_staff ? 'bg-emerald-500' : 'bg-gray-300'}`}>
                <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${uploadForm.visible_to_staff ? 'left-[22px]' : 'left-0.5'}`} />
              </button>
            </div>
            {uploadForm.visible_to_staff && (
              <div className="flex items-center justify-between pt-2 border-t border-gray-200">
                <div>
                  <p className="text-sm font-semibold text-gray-700">Requires Sign-off</p>
                  <p className="text-[10px] text-gray-400">Staff must acknowledge they've read this document</p>
                </div>
                <button onClick={() => setUploadForm({ ...uploadForm, requires_signoff: !uploadForm.requires_signoff })}
                  className={`relative w-11 h-6 rounded-full transition-colors ${uploadForm.requires_signoff ? 'bg-amber-500' : 'bg-gray-300'}`}>
                  <span className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${uploadForm.requires_signoff ? 'left-[22px]' : 'left-0.5'}`} />
                </button>
              </div>
            )}
          </div>
          <div>
            <input type="file" ref={fileRef} className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setSelectedFile(e.target.files[0])} />
            {selectedFile ? (
              <div className="p-4 rounded-xl bg-teal-50 border border-teal-200 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <FileText size={20} className="text-teal-600" />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024 / 1024).toFixed(2)} MB</p>
                  </div>
                </div>
                <button onClick={() => { setSelectedFile(null); fileRef.current.value = '' }} className="p-1.5 rounded-lg hover:bg-teal-100">
                  <X size={16} className="text-gray-400" />
                </button>
              </div>
            ) : (
              <button onClick={() => fileRef.current.click()} className="w-full p-6 border-2 border-dashed border-gray-300 rounded-xl text-center hover:border-orange-400 hover:bg-orange-50/30 transition-all cursor-pointer">
                <Upload size={28} className="text-gray-400 mx-auto mb-2" />
                <p className="text-sm text-gray-600 font-medium">Click to select file</p>
                <p className="text-xs text-gray-400 mt-1">PDF, JPG, PNG, DOC up to 10MB</p>
              </button>
            )}
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setShowUpload(false); setSelectedFile(null); }} className="flex-1 py-2.5 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
            <button onClick={handleUpload} disabled={uploading || !selectedFile} className="flex-1 py-2.5 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-semibold shadow disabled:opacity-50">
              {uploading ? 'Uploading...' : 'Upload'}
            </button>
          </div>
        </div>
      </Modal>

      {/* View Form Submission Modal */}
      <Modal isOpen={!!viewForm} onClose={() => setViewForm(null)} title={viewForm ? ({ medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation' }[viewForm.form_type] || 'Form Submission') : 'Form'} wide>
        {viewForm && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 flex items-center justify-between">
              <div>
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Submitted by</p>
                <p className="text-sm font-bold text-gray-800">{viewForm.staff ? `${viewForm.staff.first_name} ${viewForm.staff.last_name}` : 'Unknown'}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wider">Date</p>
                <p className="text-sm font-semibold text-gray-700">{viewForm.submitted_at ? new Date(viewForm.submitted_at).toLocaleDateString('en-AU', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }) : '—'}</p>
                <p className="text-xs text-gray-400">{viewForm.submitted_at ? new Date(viewForm.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</p>
              </div>
            </div>
            {viewForm.data && Object.entries(viewForm.data).filter(([k, v]) => v).length > 0 ? (
              <div className="space-y-3">
                {Object.entries(viewForm.data).filter(([k, v]) => v).map(([k, v]) => (
                  <div key={k} className="p-3 rounded-xl bg-white border border-gray-100">
                    <p className="text-xs text-gray-400 font-medium capitalize mb-0.5">{k.replace(/_/g, ' ')}</p>
                    <p className="text-sm text-gray-800 whitespace-pre-wrap">{v}</p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-400 text-center py-4">No data recorded</p>
            )}
            <button onClick={() => setViewForm(null)} className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold transition-colors">Close</button>
          </div>
        )}
      </Modal>

      {/* Document Sign-offs Viewer */}
      <Modal isOpen={!!viewSignoffs} onClose={() => setViewSignoffs(null)} title="Document Sign-offs">
        {viewSignoffs && (
          <div className="space-y-4">
            {(() => {
              const doc = p.documents?.find(d => d.id === viewSignoffs)
              return doc ? (
                <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <p className="font-bold text-gray-800 text-sm">{doc.name}</p>
                  <p className="text-xs text-gray-400">{doc.document_type?.replace(/_/g, ' ')}</p>
                </div>
              ) : null
            })()}
            {(docSignoffs[viewSignoffs] || []).length > 0 ? (
              <div className="space-y-3">
                {docSignoffs[viewSignoffs].map(s => (
                  <div key={s.id || s.staff_id} className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-emerald-500 flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {s.staff?.first_name?.[0]}{s.staff?.last_name?.[0]}
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-gray-800">{s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown'}</p>
                        <p className="text-[10px] text-emerald-600">Signed {s.signed_at ? new Date(s.signed_at).toLocaleDateString('en-AU', { day:'numeric', month:'short', year:'numeric', hour:'numeric', minute:'2-digit' }) : ''}</p>
                      </div>
                      <CheckCircle size={18} className="text-emerald-500 shrink-0" />
                    </div>
                    {s.signature_data && (
                      <div className="mt-2 pt-2 border-t border-emerald-200">
                        <p className="text-[9px] text-emerald-500 uppercase tracking-wider font-bold mb-1">Signature</p>
                        <img src={s.signature_data} alt="Signature" className="h-12 bg-white rounded-lg border border-emerald-200 p-1" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Users size={32} className="text-gray-200 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-500">No sign-offs yet</p>
                <p className="text-xs text-gray-400 mt-1">Staff will sign off when they view this document in their portal</p>
              </div>
            )}
          </div>
        )}
      </Modal>

      {/* Manage Staff Access Modal */}
      <Modal isOpen={!!manageAccessDoc} onClose={() => setManageAccessDoc(null)} title="Manage Staff Access">
        {manageAccessDoc && (
          <div className="space-y-4">
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <p className="font-bold text-gray-800 text-sm">{manageAccessDoc.name}</p>
              <p className="text-xs text-gray-400">{manageAccessDoc.document_type?.replace(/_/g, ' ')}</p>
            </div>

            <div className="p-3 rounded-xl bg-violet-50 border border-violet-200">
              <p className="text-xs text-violet-700">
                <strong>How it works:</strong> If no staff are selected below, all staff with shifts for this participant can see the document.
                If you select specific staff, only those staff will have access.
              </p>
            </div>

            <div className="flex items-center justify-between">
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wider">Staff Members</p>
              <div className="flex gap-2">
                <button onClick={() => grantAllStaffAccess(manageAccessDoc.id)} disabled={savingAccess}
                  className="px-2.5 py-1 text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-200 rounded-lg hover:bg-emerald-100 transition-colors">
                  Select All
                </button>
                <button onClick={() => revokeAllStaffAccess(manageAccessDoc.id)} disabled={savingAccess}
                  className="px-2.5 py-1 text-[10px] font-bold bg-gray-50 text-gray-500 border border-gray-200 rounded-lg hover:bg-gray-100 transition-colors">
                  Clear All
                </button>
              </div>
            </div>

            <div className="max-h-[360px] overflow-y-auto space-y-1.5 pr-1">
              {allStaff.filter(s => s.status !== 'terminated').map(s => {
                const hasAccess = (docAccessMap[manageAccessDoc.id] || new Set()).has(s.id)
                return (
                  <button key={s.id} onClick={() => toggleStaffAccess(manageAccessDoc.id, s.id, hasAccess)} disabled={savingAccess}
                    className={`w-full flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${hasAccess ? 'bg-violet-50 border-violet-300' : 'bg-white border-gray-200 hover:bg-gray-50'}`}>
                    <div className={`w-9 h-9 rounded-lg flex items-center justify-center text-xs font-bold shrink-0 ${hasAccess ? 'bg-violet-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                      {s.first_name?.[0]}{s.last_name?.[0]}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${hasAccess ? 'text-gray-900' : 'text-gray-600'}`}>{s.first_name} {s.last_name}</p>
                      <p className="text-[10px] text-gray-400">{s.role || 'Staff'}</p>
                    </div>
                    <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-colors ${hasAccess ? 'bg-violet-500 border-violet-500' : 'border-gray-300'}`}>
                      {hasAccess && <svg width="12" height="12" viewBox="0 0 12 12" fill="none"><path d="M2.5 6L5 8.5L9.5 3.5" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/></svg>}
                    </div>
                  </button>
                )
              })}
              {allStaff.length === 0 && (
                <div className="p-6 text-center">
                  <Loader2 size={20} className="animate-spin text-gray-300 mx-auto mb-2" />
                  <p className="text-xs text-gray-400">Loading staff...</p>
                </div>
              )}
            </div>

            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200">
              <p className="text-xs text-gray-500">
                <strong>{(docAccessMap[manageAccessDoc.id] || new Set()).size}</strong> staff member{(docAccessMap[manageAccessDoc.id] || new Set()).size !== 1 ? 's' : ''} selected
                {(docAccessMap[manageAccessDoc.id] || new Set()).size === 0 && ' — all assigned staff can view'}
              </p>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}