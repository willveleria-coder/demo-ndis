import { useState, useEffect } from 'react'
import { User, Mail, Phone, MapPin, Pencil, Save, X, Lock, Loader2, LogOut, CheckCircle2, Upload, FileText, Trash2 } from 'lucide-react'
import { useStaff } from '../../context/StaffContext'
import { supabase } from '../../lib/supabase'

const Badge = ({ children, color = 'gray' }) => {
  const c = { gray: 'bg-gray-100 text-gray-600', green: 'bg-emerald-50 text-emerald-700' }
  return <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${c[color]}`}>{children}</span>
}

export default function StaffProfile() {
  const { staffProfile, setStaffProfile, staffName, initials, handleLogout, completedShifts, myShifts } = useStaff()
  const [profileEditing, setProfileEditing] = useState(false)
  const [profileSaving, setProfileSaving] = useState(false)
  const [profileForm, setProfileForm] = useState({})
  const [passwordForm, setPasswordForm] = useState({ current: '', new: '', confirm: '' })
  const [changingPassword, setChangingPassword] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [documents, setDocuments] = useState([])
  const [loadingDocs, setLoadingDocs] = useState(true)
  const [showUploadModal, setShowUploadModal] = useState(false)
  const [selectedFile, setSelectedFile] = useState(null)
  const [docForm, setDocForm] = useState({ category: '', name: '', document_type: '', custom_type: '', expiry_date: '' })

  const QUAL_TYPES = [
    { value: 'ndis_screening', label: 'NDIS Worker Screening' },
    { value: 'wwcc', label: 'Working With Children Check' },
    { value: 'first_aid', label: 'First Aid Certificate' },
    { value: 'cpr', label: 'CPR Certificate' },
    { value: 'police_check', label: 'Police Check' },
    { value: 'insurance', label: 'Insurance' },
    { value: 'infection_control', label: 'Infection Control' },
    { value: 'other', label: 'Other' },
  ]

  const QUAL_TYPE_KEYS = QUAL_TYPES.map(t => t.value)

  const GENERAL_TYPES = [
    { value: 'contract', label: 'Employment Contract' },
    { value: 'resume', label: 'Resume / CV' },
    { value: 'training', label: 'Training Certificate' },
    { value: 'reference', label: 'Reference Letter' },
    { value: 'other', label: 'Other' },
  ]

  // Load staff documents
  useEffect(() => {
    if (!staffProfile?.id) return
    ;(async () => {
      try {
        const { data } = await supabase.from('documents').select('*').eq('staff_id', staffProfile.id).order('uploaded_at', { ascending: false })
        if (data) setDocuments(data)
      } catch (e) { /* table may not exist */ }
      setLoadingDocs(false)
    })()
  }, [staffProfile?.id])

  // Compute stats
  const totalHours = completedShifts.reduce((a, s) => s.clock_in && s.clock_out ? a + (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000 : a, 0)
  let streak = 0
  const sorted = completedShifts.sort((a, b) => new Date(b.shift_date) - new Date(a.shift_date))
  const today = new Date(); today.setHours(0, 0, 0, 0)
  for (let i = 0; i < sorted.length; i++) {
    const d = new Date(sorted[i].shift_date); d.setHours(0, 0, 0, 0)
    const expected = new Date(today); expected.setDate(expected.getDate() - i)
    if (d.getTime() === expected.getTime()) streak++; else break
  }

  const startProfileEdit = () => {
    setProfileForm({
      phone: staffProfile.phone || '',
      address: staffProfile.address || '',
      emergency_contact_name: staffProfile.emergency_contact_name || '',
      emergency_contact_phone: staffProfile.emergency_contact_phone || '',
      emergency_contact_relationship: staffProfile.emergency_contact_relationship || '',
    })
    setProfileEditing(true)
  }

  const handleProfileSave = async () => {
    setProfileSaving(true)
    try {
      const { data, error } = await supabase.from('staff').update(profileForm).eq('id', staffProfile.id).select().single()
      if (error) throw error
      setStaffProfile(prev => ({ ...prev, ...data }))
      setProfileEditing(false); alert('Profile updated!')
    } catch (err) { alert('Failed to save: ' + err.message) }
    finally { setProfileSaving(false) }
  }

  const handleChangePassword = async () => {
    if (!passwordForm.new || !passwordForm.confirm) { alert('Please fill in all password fields'); return }
    if (passwordForm.new !== passwordForm.confirm) { alert('New passwords do not match'); return }
    if (passwordForm.new.length < 6) { alert('Password must be at least 6 characters'); return }
    setChangingPassword(true)
    try {
      const timeout = new Promise((_, reject) => setTimeout(() => reject(new Error('Request timed out')), 10000))
      const update = supabase.auth.updateUser({ password: passwordForm.new })
      const { error } = await Promise.race([update, timeout])
      if (error) throw error
      setPasswordForm({ current: '', new: '', confirm: '' }); alert('Password changed successfully!')
    } catch (err) { alert('Failed to change password: ' + (err.message || 'Unknown error. Please try logging out and back in.')) }
    finally { setChangingPassword(false) }
  }

  const handleUploadDocument = async () => {
    if (!selectedFile) { alert('Please select a file'); return }
    if (!docForm.document_type) { alert('Please select a document type'); return }
    if (docForm.document_type === 'other' && !docForm.custom_type) { alert('Please specify the document type'); return }

    setUploading(true)
    try {
      // Upload file to storage
      const safeName = selectedFile.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `staff/${staffProfile.id}/${Date.now()}_${safeName}`
      const { error: uploadErr } = await supabase.storage.from('documents').upload(filePath, selectedFile, { upsert: true })
      if (uploadErr) throw uploadErr
      const { data: { publicUrl } } = supabase.storage.from('documents').getPublicUrl(filePath)

      // Insert DB record
      const isQualification = docForm.category === 'qualification' || QUAL_TYPE_KEYS.includes(docForm.document_type)
      const { data: doc, error: dbErr } = await supabase.from('documents').insert({
        staff_id: staffProfile.id,
        name: docForm.document_type === 'other' && docForm.custom_type ? docForm.custom_type : (docForm.name || selectedFile.name),
        document_type: docForm.document_type,
        file_url: publicUrl,
        file_name: selectedFile.name,
        expiry_date: docForm.expiry_date || null,
        status: isQualification ? 'pending' : 'valid',
      }).select().single()
      if (dbErr) throw dbErr
      if (doc) setDocuments(prev => [doc, ...prev])
      setShowUploadModal(false)
      setSelectedFile(null)
      setDocForm({ category: '', name: '', document_type: '', custom_type: '', expiry_date: '' })
      alert(isQualification ? 'Qualification uploaded! Your admin will review it.' : 'Document uploaded!')
    } catch (err) {
      console.error('Upload error:', err)
      alert('Failed: ' + (err.message || JSON.stringify(err)))
    } finally {
      setUploading(false)
    }
  }

  const handleDeleteDocument = async (doc) => {
    if (!confirm(`Delete "${doc.name || doc.title}"?`)) return
    try {
      if (doc.file_path) await supabase.storage.from('documents').remove([doc.file_path])
      await supabase.from('documents').delete().eq('id', doc.id)
      setDocuments(prev => prev.filter(d => d.id !== doc.id))
    } catch (err) { alert('Failed: ' + err.message) }
  }

  const getDocTypeLabel = (val) => {
    const allTypes = [...QUAL_TYPES, ...GENERAL_TYPES]
    const found = allTypes.find(t => t.value === val)
    return found ? found.label : (val || 'Document').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
  }

  if (!staffProfile) return null

  return (
    <div className="space-y-6">
      {/* Header card */}
      <div className="bg-white/80 rounded-2xl border border-gray-200 shadow-sm backdrop-blur-sm">
        <div className="p-5 sm:p-6 flex items-center gap-4">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center text-white text-2xl font-black shadow-lg shadow-emerald-200 shrink-0">{initials}</div>
          <div className="min-w-0">
            <h3 className="text-xl font-black text-gray-900">{staffName}</h3>
            <p className="text-gray-500 text-sm">{staffProfile.role === 'admin' ? 'Administrator' : 'Support Worker'} · {(staffProfile.employment_type || 'full_time').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</p>
            <div className="mt-1.5"><Badge color="green">{(staffProfile.status || 'active').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}</Badge></div>
          </div>
        </div>
      </div>

      {/* Contact Info — Editable */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Info</p>
          {!profileEditing ? (
            <button onClick={startProfileEdit} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs font-semibold hover:bg-emerald-100 transition-all"><Pencil size={13} /> Edit</button>
          ) : (
            <div className="flex gap-2">
              <button onClick={() => setProfileEditing(false)} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 text-gray-600 text-xs font-semibold hover:bg-gray-200"><X size={13} /> Cancel</button>
              <button onClick={handleProfileSave} disabled={profileSaving} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold shadow-md disabled:opacity-50">
                {profileSaving ? <Loader2 size={13} className="animate-spin" /> : <Save size={13} />}{profileSaving ? 'Saving...' : 'Save'}
              </button>
            </div>
          )}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Mail size={16} className="text-emerald-600" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Email</p><p className="text-sm font-semibold text-gray-800">{staffProfile.email || '—'}</p></div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><Phone size={16} className="text-emerald-600" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Phone</p>
              {profileEditing ? <input type="tel" value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" /> : <p className="text-sm font-semibold text-gray-800">{staffProfile.phone || '—'}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0"><MapPin size={16} className="text-emerald-600" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Address</p>
              {profileEditing ? <input type="text" value={profileForm.address} onChange={e => setProfileForm({ ...profileForm, address: e.target.value })} className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" /> : <p className="text-sm font-semibold text-gray-800">{staffProfile.address || '—'}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Emergency Contact — Editable */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Emergency Contact</p>
          {!profileEditing && <span className="text-[10px] text-gray-400 font-medium">Click Edit above to change</span>}
        </div>
        <div className="space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><User size={16} className="text-red-500" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Name</p>
              {profileEditing ? <input type="text" value={profileForm.emergency_contact_name} onChange={e => setProfileForm({ ...profileForm, emergency_contact_name: e.target.value })} className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" /> : <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_name || '—'}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><Phone size={16} className="text-red-500" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Phone</p>
              {profileEditing ? <input type="tel" value={profileForm.emergency_contact_phone} onChange={e => setProfileForm({ ...profileForm, emergency_contact_phone: e.target.value })} className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" /> : <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_phone || '—'}</p>}
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-red-50 flex items-center justify-center shrink-0"><User size={16} className="text-red-500" /></div>
            <div className="flex-1"><p className="text-xs text-gray-400">Relationship</p>
              {profileEditing ? <input type="text" value={profileForm.emergency_contact_relationship} onChange={e => setProfileForm({ ...profileForm, emergency_contact_relationship: e.target.value })} className="w-full text-sm font-semibold text-gray-800 bg-white border-2 border-emerald-200 rounded-lg px-2 py-1 outline-none focus:border-emerald-400" /> : <p className="text-sm font-semibold text-gray-800">{staffProfile.emergency_contact_relationship || '—'}</p>}
            </div>
          </div>
        </div>
      </div>

      {/* Change Password */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">Change Password</p>
        <div className="space-y-3">
          <div><p className="text-xs text-gray-500 font-semibold mb-1">Current Password</p><div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={passwordForm.current} onChange={e => setPasswordForm({ ...passwordForm, current: e.target.value })} placeholder="Enter current password" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300" /></div></div>
          <div><p className="text-xs text-gray-500 font-semibold mb-1">New Password</p><div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={passwordForm.new} onChange={e => setPasswordForm({ ...passwordForm, new: e.target.value })} placeholder="Enter new password" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300" /></div></div>
          <div><p className="text-xs text-gray-500 font-semibold mb-1">Confirm New Password</p><div className="relative"><Lock size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" /><input type="password" value={passwordForm.confirm} onChange={e => setPasswordForm({ ...passwordForm, confirm: e.target.value })} placeholder="Confirm new password" className="w-full pl-10 pr-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/30 focus:border-emerald-300" /></div></div>
          <button onClick={handleChangePassword} disabled={changingPassword} className="w-full py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg shadow-emerald-200 disabled:opacity-50 flex items-center justify-center gap-2">
            {changingPassword ? <><Loader2 size={16} className="animate-spin" /> Changing...</> : <><Lock size={16} /> Change Password</>}
          </button>
        </div>
      </div>

      {/* Compliance Status */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Compliance Status</p>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {['NDIS Worker Screening', 'WWCC', 'First Aid', 'CPR Certificate', 'Other'].map(item => (
            <div key={item} className="flex items-center gap-2 p-3 rounded-lg bg-emerald-50 border border-emerald-100">
              <CheckCircle2 size={16} className="text-emerald-500 shrink-0" /><span className="text-xs font-semibold text-emerald-700">{item}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Documents / Certificates Upload */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">My Documents & Certificates</p>
          <button onClick={() => { setShowUploadModal(true); setSelectedFile(null); setDocForm({ category: '', name: '', document_type: '', custom_type: '', expiry_date: '' }) }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500 to-green-600 text-white text-xs font-semibold shadow hover:shadow-md">
            <Upload size={13} /> Upload Document
          </button>
        </div>
        <p className="text-[10px] text-gray-400 mb-3">Upload certificates, licences, qualifications, or other documents. Your admin will review uploads.</p>
        {documents.length > 0 ? (
          <div className="space-y-2">
            {documents.map(doc => (
              <div key={doc.id} className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-100">
                <div className="w-9 h-9 rounded-lg bg-blue-50 flex items-center justify-center shrink-0"><FileText size={16} className="text-blue-500" /></div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-gray-800 truncate">{doc.name || doc.file_name}</p>
                  <p className="text-[10px] text-gray-400">{getDocTypeLabel(doc.document_type)} · {new Date(doc.uploaded_at).toLocaleDateString('en-AU')}{doc.expiry_date ? ` · Expires ${new Date(doc.expiry_date).toLocaleDateString('en-AU')}` : ''}</p>
                </div>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold shrink-0 ${doc.status === 'valid' || doc.status === 'approved' ? 'bg-emerald-50 text-emerald-700' : doc.status === 'expired' || doc.status === 'rejected' ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'}`}>
                  {(doc.status || 'pending').replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())}
                </span>
                {doc.file_url && <a href={doc.file_url} target="_blank" rel="noopener noreferrer" className="p-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-500 text-[10px] font-semibold shrink-0">View</a>}
                <button onClick={() => handleDeleteDocument(doc)} className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-500 transition-colors shrink-0"><Trash2 size={13} /></button>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-6 text-center rounded-xl border-2 border-dashed border-gray-200">
            <Upload size={24} className="text-gray-300 mx-auto mb-2" />
            <p className="text-sm text-gray-400">No documents uploaded yet</p>
            <p className="text-[10px] text-gray-300 mt-1">Upload your certificates and qualifications above</p>
          </div>
        )}
      </div>

      {/* Upload Document Modal */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 space-y-4" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-bold text-gray-900">Upload Document</h3>
              <button onClick={() => setShowUploadModal(false)} className="p-1.5 rounded-lg hover:bg-gray-100"><X size={18} className="text-gray-400" /></button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-100 text-xs text-emerald-700 font-medium">
              Upload your certificates, qualifications, or other documents. Your admin will review and approve them.
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Category *</p>
              <div className="grid grid-cols-2 gap-2">
                <button onClick={() => setDocForm({ ...docForm, category: 'qualification', document_type: '' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all ${docForm.category === 'qualification' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  Qualification
                </button>
                <button onClick={() => setDocForm({ ...docForm, category: 'document', document_type: '' })}
                  className={`p-3 rounded-xl border-2 text-sm font-semibold text-center transition-all ${docForm.category === 'document' ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-500 hover:border-gray-300'}`}>
                  General Document
                </button>
              </div>
            </div>

            {docForm.category && (
              <div>
                <p className="text-xs font-bold text-gray-600 mb-1.5">Document Type *</p>
                <select value={docForm.document_type} onChange={e => setDocForm({ ...docForm, document_type: e.target.value })}
                  className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm">
                  <option value="">Select type...</option>
                  {(docForm.category === 'qualification' ? QUAL_TYPES : GENERAL_TYPES).map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
                {docForm.document_type === 'other' && (
                  <input placeholder="Specify document type..." value={docForm.custom_type}
                    onChange={e => setDocForm({ ...docForm, custom_type: e.target.value })}
                    className="w-full mt-2 px-3 py-2.5 bg-white border-2 border-orange-200 rounded-xl text-sm focus:outline-none focus:border-orange-400" />
                )}
              </div>
            )}

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Document Name</p>
              <input placeholder="e.g. First Aid - St John Ambulance" value={docForm.name}
                onChange={e => setDocForm({ ...docForm, name: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">Expiry Date <span className="font-normal text-gray-400">(if applicable)</span></p>
              <input type="date" value={docForm.expiry_date}
                onChange={e => setDocForm({ ...docForm, expiry_date: e.target.value })}
                className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm" />
            </div>

            <div>
              <p className="text-xs font-bold text-gray-600 mb-1.5">File *</p>
              {selectedFile ? (
                <div className="flex items-center gap-3 p-3 rounded-xl bg-gray-50 border border-gray-200">
                  <FileText size={18} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-gray-800 truncate">{selectedFile.name}</p>
                    <p className="text-[10px] text-gray-400">{(selectedFile.size / 1024).toFixed(0)} KB</p>
                  </div>
                  <button onClick={() => setSelectedFile(null)} className="text-xs text-red-500 font-semibold">Remove</button>
                </div>
              ) : (
                <label className="flex flex-col items-center gap-2 p-6 rounded-xl border-2 border-dashed border-gray-200 hover:border-emerald-300 cursor-pointer transition-colors">
                  <Upload size={24} className="text-gray-300" />
                  <p className="text-sm text-gray-500">Click to select a file</p>
                  <p className="text-[10px] text-gray-300">PDF, JPG, PNG, DOC accepted</p>
                  <input type="file" className="hidden" accept=".pdf,.jpg,.jpeg,.png,.doc,.docx" onChange={e => setSelectedFile(e.target.files?.[0] || null)} />
                </label>
              )}
            </div>

            <div className="flex gap-2 pt-2">
              <button onClick={() => setShowUploadModal(false)} className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-semibold">Cancel</button>
              <button onClick={handleUploadDocument} disabled={uploading}
                className="flex-1 py-2.5 bg-gradient-to-r from-emerald-500 to-green-600 rounded-xl text-white text-sm font-bold shadow-lg disabled:opacity-50 flex items-center justify-center gap-2">
                {uploading ? <><Loader2 size={14} className="animate-spin" /> Uploading...</> : <><Upload size={14} /> Upload</>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Performance */}
      <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
        <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Performance</p>
        <div className="grid grid-cols-3 gap-4 text-center">
          <div><p className="text-3xl font-black text-gray-900">{completedShifts.length}</p><p className="text-xs text-gray-400 font-medium">Shifts Done</p></div>
          <div><p className="text-3xl font-black text-gray-900">{totalHours.toFixed(0)}h</p><p className="text-xs text-gray-400 font-medium">Hours Logged</p></div>
          <div><p className="text-3xl font-black text-gray-900">{streak}</p><p className="text-xs text-gray-400 font-medium">Day Streak</p></div>
        </div>
      </div>

      <button onClick={handleLogout} className="w-full py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-gray-600 font-bold text-sm flex items-center justify-center gap-2 transition-colors"><LogOut size={18} /> Sign Out</button>
    </div>
  )
}