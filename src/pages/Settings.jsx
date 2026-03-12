import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Building2, Shield, Users, LogOut, Save, Loader2, Lock, Bell, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

export default function Settings() {
  const navigate = useNavigate()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [savingCompliance, setSavingCompliance] = useState(false)
  const [changingPassword, setChangingPassword] = useState(false)
  const [savingProfile, setSavingProfile] = useState(false)
  const [savedMsg, setSavedMsg] = useState('')
  const [authUser, setAuthUser] = useState(null)
  const [staffProfile, setStaffProfile] = useState(null)
  const [profileForm, setProfileForm] = useState({ first_name: '', last_name: '', email: '', phone: '' })
  const [passwords, setPasswords] = useState({ newPassword: '', confirmPassword: '' })

  const [org, setOrg] = useState({
    company_name: '',
    abn: '',
    ndis_provider_number: '',
    phone: '',
    email: '',
    address: '',
  })

  const [compliance, setCompliance] = useState({
    require_shift_notes_24h: true,
    document_expiry_alerts: true,
    incident_reporting_mandatory: true,
    auto_flag_ndis_reportable: true,
  })

  useEffect(() => {
    async function load() {
      try {
        const { data: { user } } = await supabase.auth.getUser()
        setAuthUser(user)

        // Get staff profile
        if (user) {
          const { data: staff } = await supabase
            .from('staff')
            .select('*')
            .eq('auth_id', user.id)
            .maybeSingle()
          setStaffProfile(staff)
          if (staff) {
            setProfileForm({
              first_name: staff.first_name || '',
              last_name: staff.last_name || '',
              email: staff.email || '',
              phone: staff.phone || '',
            })
          }
        }

        // Load org settings
        const { data: orgData } = await supabase
          .from('organizations')
          .select('*')
          .limit(1)
          .maybeSingle()
        if (orgData) {
          setOrg({
            company_name: orgData.company_name || '',
            abn: orgData.abn || '',
            ndis_provider_number: orgData.ndis_provider_number || '',
            phone: orgData.phone || '',
            email: orgData.email || '',
            address: orgData.address || '',
          })
          // Load compliance if stored
          if (orgData.compliance_settings) {
            setCompliance({ ...compliance, ...orgData.compliance_settings })
          }
        }
      } catch (err) {
        console.error('Failed to load settings:', err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  const showSaved = (msg) => {
    setSavedMsg(msg)
    setTimeout(() => setSavedMsg(''), 3000)
  }

  const handleSaveOrg = async () => {
    setSaving(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .upsert({
          id: 1,
          ...org,
          compliance_settings: compliance,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      showSaved('Organization settings saved!')
    } catch (err) {
      console.error('Failed to save:', err)
      alert('Failed to save: ' + (err.message || 'Unknown error'))
    } finally {
      setSaving(false)
    }
  }

  const handleToggleCompliance = async (key) => {
    const updated = { ...compliance, [key]: !compliance[key] }
    setCompliance(updated)
    setSavingCompliance(true)
    try {
      const { error } = await supabase
        .from('organizations')
        .upsert({
          id: 1,
          ...org,
          compliance_settings: updated,
          updated_at: new Date().toISOString(),
        })
      if (error) throw error
      showSaved('Compliance setting updated!')
    } catch (err) {
      console.error('Failed to save compliance:', err)
    } finally {
      setSavingCompliance(false)
    }
  }

  const handleChangePassword = async () => {
    if (!passwords.newPassword || !passwords.confirmPassword) {
      alert('Please fill in both password fields')
      return
    }
    if (passwords.newPassword !== passwords.confirmPassword) {
      alert('Passwords do not match')
      return
    }
    if (passwords.newPassword.length < 6) {
      alert('Password must be at least 6 characters')
      return
    }
    setChangingPassword(true)
    try {
      const { error } = await supabase.auth.updateUser({ password: passwords.newPassword })
      if (error) throw error
      setPasswords({ newPassword: '', confirmPassword: '' })
      showSaved('Password changed successfully!')
    } catch (err) {
      alert('Failed to change password: ' + (err.message || 'Unknown error'))
    } finally {
      setChangingPassword(false)
    }
  }

  const handleSaveProfile = async () => {
    setSavingProfile(true)
    try {
      // Update staff table
      const { error: staffError } = await supabase
        .from('staff')
        .update({
          first_name: profileForm.first_name,
          last_name: profileForm.last_name,
          email: profileForm.email,
          phone: profileForm.phone,
          updated_at: new Date().toISOString(),
        })
        .eq('id', staffProfile.id)
      if (staffError) throw staffError

      // Update auth email if changed
      if (profileForm.email !== authUser.email) {
        const { error: authError } = await supabase.auth.updateUser({ email: profileForm.email })
        if (authError) throw authError
      }

      // Refresh staff profile
      const { data: updated } = await supabase
        .from('staff')
        .select('*')
        .eq('id', staffProfile.id)
        .maybeSingle()
      if (updated) setStaffProfile(updated)

      showSaved('Profile updated!')
    } catch (err) {
      alert('Failed to update profile: ' + (err.message || 'Unknown error'))
    } finally {
      setSavingProfile(false)
    }
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    await supabase.auth.signOut()
    navigate('/')
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
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Settings</h2>
          <p className="text-sm text-gray-500">Manage your organization and account</p>
        </div>
        {savedMsg && (
          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 border border-emerald-200 rounded-xl animate-pulse">
            <CheckCircle size={16} className="text-emerald-500" />
            <span className="text-sm font-semibold text-emerald-700">{savedMsg}</span>
          </div>
        )}
      </div>

      {/* Account / Profile */}
      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Users size={20} className="text-teal-500" /> Profile
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">First Name</label>
            <input value={profileForm.first_name} onChange={e => setProfileForm({ ...profileForm, first_name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="First name" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Last Name</label>
            <input value={profileForm.last_name} onChange={e => setProfileForm({ ...profileForm, last_name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="Last name" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
            <input type="email" value={profileForm.email} onChange={e => setProfileForm({ ...profileForm, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="admin@company.com" />
            {profileForm.email !== authUser?.email && (
              <p className="text-[10px] text-amber-600 mt-1">Changing email will require re-verification</p>
            )}
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Phone</label>
            <input value={profileForm.phone} onChange={e => setProfileForm({ ...profileForm, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="04XX XXX XXX" />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Role</p>
            <p className="text-gray-800 font-semibold text-sm capitalize">{staffProfile?.role || 'Admin'}</p>
          </div>
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-xs text-gray-400 font-medium">Status</p>
            <p className="text-gray-800 font-semibold text-sm capitalize">{staffProfile?.status || '—'}</p>
          </div>
        </div>
        <button onClick={handleSaveProfile} disabled={savingProfile} className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 disabled:opacity-50 hover:shadow-xl transition-all">
          {savingProfile ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {savingProfile ? 'Saving...' : 'Save Profile'}
        </button>
      </div>

      {/* Organization Settings */}
      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Building2 size={20} className="text-orange-500" /> Organization
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Company Name</label>
            <input value={org.company_name} onChange={e => setOrg({ ...org, company_name: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="Maple Care Support" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">ABN</label>
            <input value={org.abn} onChange={e => setOrg({ ...org, abn: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="12 345 678 901" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">NDIS Provider Number</label>
            <input value={org.ndis_provider_number} onChange={e => setOrg({ ...org, ndis_provider_number: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="4050000000" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Phone</label>
            <input value={org.phone} onChange={e => setOrg({ ...org, phone: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="03 9000 0000" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Email</label>
            <input value={org.email} onChange={e => setOrg({ ...org, email: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="admin@company.com.au" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Address</label>
            <input value={org.address} onChange={e => setOrg({ ...org, address: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-teal-500/20 focus:border-teal-300 outline-none transition-all" placeholder="123 Main St, Melbourne VIC 3000" />
          </div>
        </div>
        <button onClick={handleSaveOrg} disabled={saving} className="px-6 py-2.5 bg-gradient-to-r from-teal-500 to-cyan-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 disabled:opacity-50 hover:shadow-xl transition-all">
          {saving ? <Loader2 size={16} className="animate-spin" /> : <Save size={16} />}
          {saving ? 'Saving...' : 'Save Organization'}
        </button>
      </div>

      {/* Compliance Settings */}
      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
            <Shield size={20} className="text-amber-500" /> Compliance
          </h3>
          {savingCompliance && <Loader2 size={14} className="animate-spin text-teal-500" />}
        </div>
        <div className="space-y-3">
          {[
            { key: 'require_shift_notes_24h', label: 'Require shift notes within 24 hours', desc: 'Staff must submit notes after shift completion', icon: '📝' },
            { key: 'document_expiry_alerts', label: 'Document expiry alerts', desc: 'Send alerts when staff documents are expiring', icon: '🔔' },
            { key: 'incident_reporting_mandatory', label: 'Incident reporting mandatory', desc: 'All incidents must be logged within 24 hours', icon: '⚠️' },
            { key: 'auto_flag_ndis_reportable', label: 'Auto-flag NDIS reportable incidents', desc: 'Automatically identify reportable incidents', icon: '🚩' },
          ].map((setting) => (
            <div key={setting.key} className="p-4 rounded-xl bg-gray-50 border border-gray-100 flex items-center justify-between gap-3">
              <div className="flex items-center gap-3 min-w-0">
                <span className="text-lg">{setting.icon}</span>
                <div>
                  <p className="font-semibold text-gray-800 text-sm">{setting.label}</p>
                  <p className="text-xs text-gray-500">{setting.desc}</p>
                </div>
              </div>
              <button
                onClick={() => handleToggleCompliance(setting.key)}
                className={`w-11 h-6 rounded-full relative transition-colors duration-200 shrink-0 ${compliance[setting.key] ? 'bg-teal-500' : 'bg-gray-300'}`}
              >
                <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-200 ${compliance[setting.key] ? 'right-0.5' : 'left-0.5'}`} />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Change Password */}
      <div className="p-4 md:p-6 rounded-2xl glass shadow-lg space-y-4">
        <h3 className="font-bold text-gray-800 text-base flex items-center gap-2">
          <Lock size={20} className="text-purple-500" /> Change Password
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">New Password</label>
            <input type="password" value={passwords.newPassword} onChange={e => setPasswords({ ...passwords, newPassword: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 outline-none transition-all" placeholder="Min 6 characters" />
          </div>
          <div>
            <label className="text-xs text-gray-500 font-medium mb-1 block">Confirm Password</label>
            <input type="password" value={passwords.confirmPassword} onChange={e => setPasswords({ ...passwords, confirmPassword: e.target.value })} className="w-full px-3 py-2.5 bg-gray-50 border border-gray-200 rounded-xl text-sm focus:ring-2 focus:ring-purple-500/20 focus:border-purple-300 outline-none transition-all" placeholder="Repeat password" />
          </div>
        </div>
        <button onClick={handleChangePassword} disabled={changingPassword} className="px-6 py-2.5 bg-gradient-to-r from-purple-500 to-indigo-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 disabled:opacity-50 hover:shadow-xl transition-all">
          {changingPassword ? <Loader2 size={16} className="animate-spin" /> : <Lock size={16} />}
          {changingPassword ? 'Changing...' : 'Change Password'}
        </button>
      </div>

      {/* Danger Zone */}
      <div className="p-4 md:p-6 rounded-2xl border-2 border-red-200 bg-red-50/50 space-y-4">
        <h3 className="font-bold text-gray-800 text-base">Account Actions</h3>
        <p className="text-sm text-gray-500">Sign out of your admin account.</p>
        <button onClick={handleLogout} className="px-6 py-2.5 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl text-white text-sm font-semibold shadow-lg flex items-center gap-2 hover:shadow-xl transition-all">
          <LogOut size={16} /> Sign Out
        </button>
      </div>
    </div>
  )
}