import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Lock, KeyRound, ArrowLeft, Loader2, Check, Mail, UserPlus } from 'lucide-react'
import { supabase } from '../lib/supabase'
import BrandLogo from '../components/BrandLogo'
import { brand } from '../config/branding'

export default function StaffSetup() {
  const [step, setStep] = useState(1)
  const [inviteCode, setInviteCode] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [validating, setValidating] = useState(false)
  const [success, setSuccess] = useState(false)
  const [staffRecord, setStaffRecord] = useState(null)
  const navigate = useNavigate()
  const c = brand.colors

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (inviteCode.trim().length < 4) { setError('Please enter a valid invite code'); return }
    setValidating(true)
    try {
      const { data: staff, error: lookupError } = await supabase.from('staff').select('*').eq('invite_code', inviteCode.trim().toUpperCase()).eq('status', 'pending').maybeSingle()
      if (lookupError) throw lookupError
      if (!staff) { setError('Invalid or expired invite code. Please check with your admin.'); return }
      if (staff.invite_expires_at && new Date(staff.invite_expires_at) < new Date()) { setError('This invite code has expired. Contact your admin for a new one.'); return }
      setStaffRecord(staff); setStep(2)
    } catch (err) { setError(err.message || 'Failed to validate code') } finally { setValidating(false) }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (password !== confirmPassword) { setError('Passwords do not match'); return }
    if (password.length < 6) { setError('Password must be at least 6 characters'); return }
    setLoading(true)
    try {
      const { data: authData, error: authError } = await supabase.auth.signUp({ email: staffRecord.email, password, options: { data: { role: 'staff', staff_id: staffRecord.id } } })
      if (authError) throw authError
      const { error: updateError } = await supabase.from('staff').update({ auth_id: authData.user.id, status: 'active', invite_code: null, invite_expires_at: null, updated_at: new Date().toISOString() }).eq('id', staffRecord.id)
      if (updateError) throw updateError
      const { error: signInError } = await supabase.auth.signInWithPassword({ email: staffRecord.email, password })
      setSuccess(true)
      setTimeout(() => navigate(signInError ? '/login/staff' : '/staff/dashboard'), 1500)
    } catch (err) {
      console.error('Setup error:', err)
      setError(err.message?.includes('already registered') ? 'This email already has an account. Try logging in instead.' : err.message || 'Something went wrong')
    } finally { setLoading(false) }
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 p-6">
        <div className="w-full max-w-sm text-center">
          <div className="p-8 rounded-2xl bg-white border border-gray-100 shadow-sm">
            <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-5 shadow-lg" style={{ backgroundColor: c.staff }}>
              <Check size={28} className="text-white" />
            </div>
            <h2 className="text-xl font-bold text-gray-900 mb-2">Account Ready</h2>
            <p className="text-sm text-gray-500">Welcome, {staffRecord?.first_name}. Redirecting to your dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden bg-gray-900">
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 20% 70%, rgba(255,255,255,0.03) 0%, transparent 50%)' }} />
        <div className="absolute top-0 right-0 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: c.staff, opacity: 0.08 }} />
        <div className="absolute bottom-0 left-0 w-80 h-80 rounded-full blur-3xl" style={{ backgroundColor: c.primary, opacity: 0.06 }} />

        <div className="relative z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-white/10 backdrop-blur-sm flex items-center justify-center">
              <UserPlus size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">{brand.appName}</h1>
              <p className="text-white/40 text-[10px] font-medium tracking-wide uppercase">Account Setup</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Welcome to<br />the team.
          </h2>
          <p className="text-white/50 text-sm leading-relaxed max-w-xs">
            Your admin has invited you to join. Enter your invite code and create a password to get started.
          </p>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step >= 1 ? c.staff : 'rgba(255,255,255,0.1)', color: 'white' }}>1</div>
              <span className="text-sm text-white/60">Verify Code</span>
            </div>
            <div className="w-8 h-px bg-white/20" />
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step >= 2 ? c.staff : 'rgba(255,255,255,0.1)', color: step >= 2 ? 'white' : 'rgba(255,255,255,0.3)' }}>2</div>
              <span className={`text-sm ${step >= 2 ? 'text-white/60' : 'text-white/30'}`}>Set Password</span>
            </div>
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-white/30">Secure connection • Data encrypted</span>
          </div>
        </div>
      </div>

      {/* Right panel */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo variant="staff" size={28} />
            <span className="font-bold text-gray-800 text-sm">{brand.appName}</span>
          </div>
          <Link to="/login/staff" className="text-sm font-medium transition-colors" style={{ color: c.staff }}>
            Already set up? Sign in →
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            {/* Mobile step indicator */}
            <div className="flex items-center gap-3 mb-8 lg:hidden">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white" style={{ backgroundColor: c.staff }}>1</div>
                <span className="text-xs font-medium text-gray-600">Code</span>
              </div>
              <div className="flex-1 h-px bg-gray-200" />
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold" style={{ backgroundColor: step >= 2 ? c.staff : '#e5e7eb', color: step >= 2 ? 'white' : '#9ca3af' }}>2</div>
                <span className="text-xs font-medium" style={{ color: step >= 2 ? '#374151' : '#9ca3af' }}>Password</span>
              </div>
            </div>

            {step === 1 && (
              <>
                <div className="mb-8">
                  <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center mb-5">
                    <KeyRound size={24} className="text-gray-600" />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Enter Invite Code</h2>
                  <p className="text-sm text-gray-400 mt-1">Your admin should have given you a 6-character code.</p>
                </div>

                <form onSubmit={handleCodeSubmit} className="space-y-4">
                  {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Invite Code</label>
                    <input type="text" value={inviteCode} onChange={e => setInviteCode(e.target.value.toUpperCase())} placeholder="ABC123" className="w-full px-4 py-3.5 bg-gray-50 border border-gray-200 rounded-lg text-center text-xl tracking-[0.3em] font-mono uppercase focus:outline-none focus:ring-2 focus:bg-white transition-colors" maxLength={12} required />
                  </div>
                  <button type="submit" disabled={validating} className="w-full py-3 rounded-lg text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: c.staff, boxShadow: `0 8px 24px -4px ${c.staff}40` }}>
                    {validating ? <><Loader2 size={18} className="animate-spin" /> Validating...</> : 'Continue'}
                  </button>
                </form>
              </>
            )}

            {step === 2 && (
              <>
                <div className="mb-6">
                  <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: c.staffBg }}>
                    <Lock size={24} style={{ color: c.staff }} />
                  </div>
                  <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Create Password</h2>
                  <p className="text-sm text-gray-400 mt-1">Almost there — set a password for your account.</p>
                </div>

                {/* Staff info card */}
                <div className="p-4 rounded-xl border border-gray-100 bg-gray-50 mb-6">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm" style={{ backgroundColor: c.staff }}>
                      {staffRecord?.first_name?.[0]}{staffRecord?.last_name?.[0]}
                    </div>
                    <div>
                      <p className="font-bold text-gray-800 text-sm">{staffRecord?.first_name} {staffRecord?.last_name}</p>
                      <p className="text-xs text-gray-400 flex items-center gap-1"><Mail size={11} /> {staffRecord?.email}</p>
                    </div>
                  </div>
                </div>

                <form onSubmit={handlePasswordSubmit} className="space-y-4">
                  {error && <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>}
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="Min 6 characters" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors" required />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-1.5">Confirm Password</label>
                    <div className="relative">
                      <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                      <input type="password" value={confirmPassword} onChange={e => setConfirmPassword(e.target.value)} placeholder="Repeat password" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors" required />
                    </div>
                  </div>
                  <div className="flex gap-3">
                    <button type="button" onClick={() => { setStep(1); setError(''); setStaffRecord(null) }} className="px-5 py-3 bg-gray-100 rounded-lg text-gray-600 font-semibold text-sm hover:bg-gray-200 transition-colors">Back</button>
                    <button type="submit" disabled={loading} className="flex-1 py-3 rounded-lg text-white font-semibold text-sm shadow-lg disabled:opacity-50 flex items-center justify-center gap-2 hover:-translate-y-0.5 transition-all" style={{ backgroundColor: c.staff, boxShadow: `0 8px 24px -4px ${c.staff}40` }}>
                      {loading ? <><Loader2 size={18} className="animate-spin" /> Creating...</> : 'Create Account'}
                    </button>
                  </div>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}