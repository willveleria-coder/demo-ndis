import { useState, useEffect } from 'react'
import { Heart, Plus, Trash2, Copy, CheckCircle, Loader2, Eye, EyeOff, RefreshCw, Users } from 'lucide-react'
import { supabase } from '../lib/supabase'

function generateAccessCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // No I/O/0/1 to avoid confusion
  let code = ''
  for (let i = 0; i < 6; i++) {
    code += chars[Math.floor(Math.random() * chars.length)]
  }
  return code
}

/**
 * FamilyAccessManager - Admin component to manage family portal access for a participant
 * 
 * @param {Object} props
 * @param {string} props.participantId - Participant UUID
 * @param {string} props.participantName - Participant display name
 * @param {boolean} props.portalEnabled - Whether family portal is enabled
 * @param {Function} props.onPortalToggle - Callback when portal is toggled
 * @param {string} props.accentColor - Brand color
 */
export default function FamilyAccessManager({
  participantId,
  participantName,
  portalEnabled = false,
  onPortalToggle,
  accentColor = '#ec4899',
}) {
  const [familyUsers, setFamilyUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [showAdd, setShowAdd] = useState(false)
  const [copied, setCopied] = useState(null)
  const [newUser, setNewUser] = useState({ name: '', email: '', relationship: '' })

  useEffect(() => {
    loadFamilyUsers()
  }, [participantId])

  const loadFamilyUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('family_users')
        .select('*')
        .eq('participant_id', participantId)
        .order('created_at', { ascending: false })

      if (error) throw error
      setFamilyUsers(data || [])
    } catch (err) {
      console.error('Failed to load family users:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleTogglePortal = async () => {
    try {
      const newVal = !portalEnabled
      const { error } = await supabase
        .from('participants')
        .update({ family_portal_enabled: newVal })
        .eq('id', participantId)

      if (error) throw error
      if (onPortalToggle) onPortalToggle(newVal)
    } catch (err) {
      console.error('Failed to toggle portal:', err)
      alert('Failed to update portal setting')
    }
  }

  const handleAddUser = async () => {
    if (!newUser.name.trim()) {
      alert('Please enter a name')
      return
    }
    setSaving(true)
    try {
      const accessCode = generateAccessCode()
      const { data, error } = await supabase.from('family_users').insert({
        participant_id: participantId,
        name: newUser.name.trim(),
        email: newUser.email.trim() || null,
        relationship: newUser.relationship.trim() || null,
        access_code: accessCode,
      }).select().single()

      if (error) throw error
      setFamilyUsers([data, ...familyUsers])
      setNewUser({ name: '', email: '', relationship: '' })
      setShowAdd(false)
    } catch (err) {
      console.error('Failed to add family user:', err)
      if (err.message?.includes('unique')) {
        alert('Failed to generate unique code. Please try again.')
      } else {
        alert('Failed to add family member: ' + (err.message || 'Unknown error'))
      }
    } finally {
      setSaving(false)
    }
  }

  const handleRemoveUser = async (id) => {
    if (!confirm('Remove this family member\'s access?')) return
    try {
      const { error } = await supabase.from('family_users').delete().eq('id', id)
      if (error) throw error
      setFamilyUsers(familyUsers.filter(u => u.id !== id))
    } catch (err) {
      console.error('Failed to remove family user:', err)
      alert('Failed to remove: ' + (err.message || 'Unknown error'))
    }
  }

  const handleRegenerateCode = async (id) => {
    if (!confirm('Generate a new access code? The old code will stop working.')) return
    try {
      const newCode = generateAccessCode()
      const { error } = await supabase
        .from('family_users')
        .update({ access_code: newCode })
        .eq('id', id)

      if (error) throw error
      setFamilyUsers(familyUsers.map(u => u.id === id ? { ...u, access_code: newCode } : u))
    } catch (err) {
      console.error('Failed to regenerate code:', err)
      alert('Failed to regenerate code')
    }
  }

  const copyCode = (code) => {
    navigator.clipboard.writeText(code)
    setCopied(code)
    setTimeout(() => setCopied(null), 2000)
  }

  if (loading) {
    return (
      <div className="p-4 rounded-xl bg-pink-50 border border-pink-100 flex items-center justify-center">
        <Loader2 size={20} className="animate-spin text-pink-400" />
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Portal toggle */}
      <div className="p-4 rounded-xl bg-pink-50 border border-pink-100">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-rose-400 to-pink-500 flex items-center justify-center shadow">
              <Heart size={18} className="text-white" />
            </div>
            <div>
              <p className="font-bold text-gray-800 text-sm">Family Portal</p>
              <p className="text-xs text-gray-500">Allow family members to view shift updates</p>
            </div>
          </div>
          <button
            onClick={handleTogglePortal}
            className={`relative w-12 h-6 rounded-full transition-colors ${portalEnabled ? 'bg-pink-400' : 'bg-gray-300'}`}
          >
            <div className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${portalEnabled ? 'translate-x-6' : 'translate-x-0.5'}`} />
          </button>
        </div>
      </div>

      {portalEnabled && (
        <>
          {/* Family members list */}
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold text-gray-600 flex items-center gap-1.5">
              <Users size={14} /> Family Members ({familyUsers.length})
            </p>
            <button
              onClick={() => setShowAdd(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white shadow"
              style={{ background: accentColor }}
            >
              <Plus size={14} /> Add
            </button>
          </div>

          {/* Add new form */}
          {showAdd && (
            <div className="p-4 rounded-xl bg-white border border-pink-200 space-y-3">
              <p className="text-sm font-bold text-gray-800">Add Family Member</p>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <input
                  value={newUser.name}
                  onChange={e => setNewUser({ ...newUser, name: e.target.value })}
                  placeholder="Name *"
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <input
                  value={newUser.email}
                  onChange={e => setNewUser({ ...newUser, email: e.target.value })}
                  placeholder="Email (optional)"
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                />
                <select
                  value={newUser.relationship}
                  onChange={e => setNewUser({ ...newUser, relationship: e.target.value })}
                  className="px-3 py-2 bg-gray-50 border border-gray-200 rounded-xl text-sm"
                >
                  <option value="">Relationship</option>
                  <option value="parent">Parent</option>
                  <option value="guardian">Guardian</option>
                  <option value="sibling">Sibling</option>
                  <option value="spouse">Spouse / Partner</option>
                  <option value="child">Child</option>
                  <option value="plan_nominee">Plan Nominee</option>
                  <option value="support_coordinator">Support Coordinator</option>
                  <option value="other">Other</option>
                </select>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowAdd(false); setNewUser({ name: '', email: '', relationship: '' }) }}
                  className="flex-1 py-2 bg-gray-100 rounded-xl text-sm font-semibold">Cancel</button>
                <button onClick={handleAddUser} disabled={saving}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-semibold disabled:opacity-50 flex items-center justify-center gap-1.5"
                  style={{ background: accentColor }}>
                  {saving ? <><Loader2 size={14} className="animate-spin" /> Adding...</> : 'Generate Access Code'}
                </button>
              </div>
            </div>
          )}

          {/* Family users list */}
          {familyUsers.length > 0 ? (
            <div className="space-y-2">
              {familyUsers.map(u => (
                <div key={u.id} className="p-3 rounded-xl bg-white border border-gray-100 flex items-center gap-3">
                  <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-rose-300 to-pink-400 flex items-center justify-center text-white text-xs font-bold shadow">
                    {u.name?.[0]?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 text-sm">{u.name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      {u.relationship && <span className="text-[10px] text-gray-400 capitalize">{u.relationship.replace('_', ' ')}</span>}
                      {u.email && <span className="text-[10px] text-gray-400">· {u.email}</span>}
                    </div>
                    {u.last_login && <p className="text-[10px] text-gray-400 mt-0.5">Last login: {new Date(u.last_login).toLocaleDateString('en-AU')}</p>}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {/* Access code */}
                    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 rounded-lg border border-gray-200">
                      <code className="text-xs font-mono font-bold text-gray-700 tracking-wider">{u.access_code}</code>
                      <button onClick={() => copyCode(u.access_code)} className="p-0.5 hover:bg-gray-100 rounded">
                        {copied === u.access_code ? <CheckCircle size={12} className="text-emerald-500" /> : <Copy size={12} className="text-gray-400" />}
                      </button>
                    </div>
                    <button onClick={() => handleRegenerateCode(u.id)} className="p-1.5 rounded-lg hover:bg-gray-100 text-gray-400" title="Regenerate code">
                      <RefreshCw size={14} />
                    </button>
                    <button onClick={() => handleRemoveUser(u.id)} className="p-1.5 rounded-lg hover:bg-red-50 text-red-400" title="Remove access">
                      <Trash2 size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : !showAdd ? (
            <div className="p-6 rounded-xl bg-white border border-dashed border-pink-200 text-center">
              <Heart size={24} className="text-pink-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No family members added yet</p>
              <button onClick={() => setShowAdd(true)} className="text-xs font-bold mt-2" style={{ color: accentColor }}>
                Add the first family member
              </button>
            </div>
          ) : null}

          {/* Portal URL info */}
          <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider mb-1">Family Portal URL</p>
            <p className="text-xs text-gray-600 font-mono">
              {window.location.origin}/login/family
            </p>
            <p className="text-[10px] text-gray-400 mt-1">
              Share this URL along with the access code. Family members can view shift updates, progress notes, and photos.
            </p>
          </div>
        </>
      )}
    </div>
  )
}