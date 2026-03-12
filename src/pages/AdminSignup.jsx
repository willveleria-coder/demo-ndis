import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Shield, Mail, Lock, Building2, ArrowLeft, Loader2, Check } from 'lucide-react'
import { adminSignUp } from '../services/authService'

export default function AdminSignup() {
  const [formData, setFormData] = useState({
    orgName: '', firstName: '', lastName: '', email: '', password: '', confirmPassword: '',
  })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const navigate = useNavigate()

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')

    if (formData.password !== formData.confirmPassword) {
      setError('Passwords do not match')
      return
    }
    if (formData.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }

    setLoading(true)
    try {
      await adminSignUp({
        email: formData.email,
        password: formData.password,
        firstName: formData.firstName,
        lastName: formData.lastName,
        orgName: formData.orgName,
      })
      setSuccess(true)
      setTimeout(() => navigate('/admin/dashboard'), 2000)
    } catch (err) {
      setError(err.message || 'Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  if (success) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center p-6">
        <div className="relative z-10 w-full max-w-md text-center">
          <div className="p-8 rounded-3xl glass shadow-xl">
            <div className="w-16 h-16 rounded-full bg-gradient-to-br from-emerald-500 to-teal-500 flex items-center justify-center mx-auto mb-6 shadow-lg">
              <Check size={32} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold text-gray-800 mb-2">Account Created!</h2>
            <p className="text-gray-500 mb-4">Your organisation is ready to go.</p>
            <p className="text-sm text-gray-400">Redirecting to dashboard...</p>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-teal-50 flex items-center justify-center p-6">
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-20 left-20 w-96 h-96 bg-orange-300/20 rounded-full blur-3xl" />
        <div className="absolute bottom-20 right-20 w-96 h-96 bg-teal-300/20 rounded-full blur-3xl" />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <Link to="/" className="inline-flex items-center gap-2 text-gray-500 hover:text-gray-700 mb-8">
          <ArrowLeft size={20} /> Back to Home
        </Link>

        <div className="p-8 rounded-3xl glass shadow-xl">
          <div className="flex items-center gap-3 mb-8">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow-lg">
              <Shield size={28} className="text-white" />
            </div>
            <div>
              <span className="text-xl font-bold text-gray-800">Set Up Organisation</span>
              <p className="text-xs text-gray-400">NDIS CRM by Veleria</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-200 text-red-600 text-sm">{error}</div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Name</label>
              <div className="relative">
                <Building2 size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="text" name="orgName" value={formData.orgName} onChange={handleChange} placeholder="Your Business Name" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">First Name</label>
                <input type="text" name="firstName" value={formData.firstName} onChange={handleChange} placeholder="First" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Last Name</label>
                <input type="text" name="lastName" value={formData.lastName} onChange={handleChange} placeholder="Last" className="w-full px-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <div className="relative">
                <Mail size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="email" name="email" value={formData.email} onChange={handleChange} placeholder="admin@business.com" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="password" value={formData.password} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
              <div className="relative">
                <Lock size={20} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                <input type="password" name="confirmPassword" value={formData.confirmPassword} onChange={handleChange} placeholder="••••••••" className="w-full pl-12 pr-4 py-3 bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-orange-500/50" required />
              </div>
            </div>

            <button type="submit" disabled={loading} className="w-full py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white font-semibold shadow-lg hover:shadow-xl transition-all disabled:opacity-50 flex items-center justify-center gap-2">
              {loading ? <><Loader2 size={20} className="animate-spin" /> Creating...</> : 'Create Organisation'}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-gray-500 text-sm">Already have an account? <Link to="/login/admin" className="text-orange-600 font-medium">Sign in</Link></p>
          </div>
        </div>
      </div>
    </div>
  )
}