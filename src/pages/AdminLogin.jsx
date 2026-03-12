import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowLeft, Loader2, Shield, Users, FileText, BarChart3 } from 'lucide-react'
import { adminLogin } from '../services/authService'
import BrandLogo from '../components/BrandLogo'
import { brand } from '../config/branding'

export default function AdminLogin() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()
  const c = brand.colors

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      await adminLogin({ email, password })
      navigate('/admin/dashboard')
    } catch (err) {
      setError(err.message || 'Invalid email or password')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex">
      {/* Left panel — brand info */}
      <div className="hidden lg:flex lg:w-[45%] xl:w-[40%] flex-col justify-between p-10 xl:p-14 relative overflow-hidden" style={{ background: `linear-gradient(160deg, ${c.primary}, ${c.adminHover})` }}>
        <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 30% 80%, rgba(255,255,255,0.06) 0%, transparent 50%), radial-gradient(circle at 70% 20%, rgba(255,255,255,0.04) 0%, transparent 40%)' }} />
        <div className="absolute top-0 right-0 w-96 h-96 rounded-full blur-3xl" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }} />
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg bg-white/15 backdrop-blur-sm flex items-center justify-center">
              <Shield size={22} className="text-white" />
            </div>
            <div>
              <h1 className="text-white font-bold text-lg leading-none">{brand.appName}</h1>
              <p className="text-white/50 text-[10px] font-medium tracking-wide uppercase">Administration</p>
            </div>
          </div>
        </div>

        <div className="relative z-10 space-y-6">
          <h2 className="text-3xl xl:text-4xl font-extrabold text-white leading-tight tracking-tight">
            Manage your<br />NDIS operations<br />with confidence.
          </h2>
          <div className="space-y-3">
            {[
              { icon: Users, text: 'Participant plans, goals & documents' },
              { icon: FileText, text: 'Digital shift notes & custom forms' },
              { icon: BarChart3, text: 'Compliance tracking & alerts' },
            ].map((item, i) => (
              <div key={i} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-white/10 flex items-center justify-center shrink-0">
                  <item.icon size={16} className="text-white/80" />
                </div>
                <span className="text-sm text-white/70">{item.text}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="relative z-10">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-400" />
            <span className="text-xs text-white/40">System operational • AES-256 encrypted</span>
          </div>
        </div>
      </div>

      {/* Right panel — login form */}
      <div className="flex-1 flex flex-col">
        <div className="p-4 sm:p-6 flex items-center justify-between border-b border-gray-100">
          <Link to="/" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-gray-600 transition-colors">
            <ArrowLeft size={16} /> Back
          </Link>
          <div className="flex items-center gap-2 lg:hidden">
            <BrandLogo variant="admin" size={28} />
            <span className="font-bold text-gray-800 text-sm">{brand.appName}</span>
          </div>
          <Link to="/login/staff" className="text-sm font-medium transition-colors" style={{ color: c.staff }}>
            Staff Login →
          </Link>
        </div>

        <div className="flex-1 flex items-center justify-center p-6 sm:p-10">
          <div className="w-full max-w-sm">
            <div className="mb-8">
              <div className="w-12 h-12 rounded-xl flex items-center justify-center mb-5" style={{ backgroundColor: c.adminBg }}>
                <Shield size={24} style={{ color: c.primary }} />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 tracking-tight">Admin Sign In</h2>
              <p className="text-sm text-gray-400 mt-1">Enter your credentials to access the admin dashboard.</p>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              {error && (
                <div className="p-3 rounded-lg bg-red-50 border border-red-100 text-red-600 text-sm font-medium">{error}</div>
              )}

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Email address</label>
                <div className="relative">
                  <Mail size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="email" value={email} onChange={e => setEmail(e.target.value)} placeholder="admin@yourorg.com.au" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors" style={{ focusRingColor: c.primary }} required />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-gray-700 mb-1.5">Password</label>
                <div className="relative">
                  <Lock size={18} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-300" />
                  <input type="password" value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" className="w-full pl-11 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:bg-white transition-colors" required />
                </div>
              </div>

              <button type="submit" disabled={loading} className="w-full py-3 rounded-lg text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all disabled:opacity-50 flex items-center justify-center gap-2" style={{ backgroundColor: c.primary, boxShadow: `0 8px 24px -4px ${c.primary}40` }}>
                {loading ? <><Loader2 size={18} className="animate-spin" /> Signing in...</> : 'Sign In'}
              </button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}