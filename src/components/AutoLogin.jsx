import { useEffect, useState, useRef } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { Shield, LogIn, Heart, Loader2 } from 'lucide-react'

const PORTAL_CONFIG = {
  admin: { email: 'demo@demo.com', password: '111111', redirect: '/admin/dashboard', label: 'Admin Portal', icon: Shield, gradient: 'linear-gradient(135deg, #7c3aed, #a855f7)', glow: 'rgba(124,58,237,0.3)' },
  staff: { email: 'staff@demo.com', password: '111111', redirect: '/staff/dashboard', label: 'Staff Portal', icon: LogIn, gradient: 'linear-gradient(135deg, #3b82f6, #60a5fa)', glow: 'rgba(59,130,246,0.3)' },
  family: { email: null, password: null, redirect: '/family/dashboard', label: 'Family Portal', icon: Heart, gradient: 'linear-gradient(135deg, #ec4899, #f472b6)', glow: 'rgba(236,72,153,0.3)' },
}

export default function AutoLogin() {
  const { portal } = useParams()
  const navigate = useNavigate()
  const { user, refreshUser } = useAuth()
  const [error, setError] = useState(null)
  const [status, setStatus] = useState('signing-in') // signing-in | waiting | error
  const config = PORTAL_CONFIG[portal] || PORTAL_CONFIG.admin
  const Icon = config.icon
  const attemptedRef = useRef(false)

  // Step 1: Sign in
  useEffect(() => {
    if (attemptedRef.current) return
    attemptedRef.current = true

    async function login() {
      try {
        if (portal === 'family') {
          navigate(config.redirect, { replace: true })
          return
        }

        // Always sign out first to clear stale sessions
        await supabase.auth.signOut().catch(() => {})
        try { sessionStorage.removeItem('ndis_user') } catch {}

        // Fresh sign in
        const { data, error: signInErr } = await supabase.auth.signInWithPassword({
          email: config.email,
          password: config.password,
        })

        if (signInErr) {
          setError(signInErr.message)
          setStatus('error')
          return
        }

        if (data?.session) {
          // Force AuthContext to pick up the new session
          if (refreshUser) await refreshUser()
          setStatus('waiting')
        } else {
          setError('No session returned')
          setStatus('error')
        }
      } catch (err) {
        setError(err.message || 'Something went wrong')
        setStatus('error')
      }
    }

    login()
  }, [portal])

  // Step 2: Wait for AuthContext user to be set, then navigate
  useEffect(() => {
    if (status !== 'waiting') return

    // If user is already set, navigate immediately
    if (user) {
      navigate(config.redirect, { replace: true })
      return
    }

    // Poll until user appears in AuthContext (max 5 seconds)
    let elapsed = 0
    const interval = setInterval(() => {
      elapsed += 200
      if (elapsed > 5000) {
        clearInterval(interval)
        // Force navigate even without user — ProtectedRoute will catch it
        navigate(config.redirect, { replace: true })
        return
      }
    }, 200)

    return () => clearInterval(interval)
  }, [status, user, navigate, config.redirect])

  // Also watch for user appearing
  useEffect(() => {
    if (status === 'waiting' && user) {
      navigate(config.redirect, { replace: true })
    }
  }, [user, status])

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f9fafb' }}>
      <style>{`
        @keyframes pulse-glow{0%,100%{box-shadow:0 0 20px ${config.glow},0 0 60px transparent}50%{box-shadow:0 0 30px ${config.glow},0 0 80px ${config.glow}}}
        @keyframes float-in{from{opacity:0;transform:translateY(20px) scale(0.95)}to{opacity:1;transform:translateY(0) scale(1)}}
        .float-in{animation:float-in .5s ease-out forwards}
        .pulse-glow{animation:pulse-glow 2s ease-in-out infinite}
      `}</style>
      <div className="float-in text-center p-8">
        <div className="w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 pulse-glow" style={{ background: config.gradient }}>
          <Icon size={36} className="text-white" />
        </div>
        {status !== 'error' ? (
          <>
            <div className="flex items-center justify-center gap-2 mb-3">
              <Loader2 size={16} className="animate-spin" style={{ color: config.glow.replace('0.3', '1') }} />
              <p className="text-sm font-semibold text-gray-600">Entering {config.label}...</p>
            </div>
            <p className="text-xs text-gray-400">Setting up your demo session</p>
          </>
        ) : (
          <>
            <p className="text-sm font-semibold text-gray-800 mb-2">Couldn't enter {config.label}</p>
            <p className="text-xs text-gray-400 mb-6">{error}</p>
            <div className="flex gap-3 justify-center">
              <button onClick={() => { attemptedRef.current = false; setStatus('signing-in'); setError(null); window.location.reload() }} className="px-5 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg" style={{ background: config.gradient }}>Try Again</button>
              <button onClick={() => navigate('/', { replace: true })} className="px-5 py-2.5 rounded-xl text-sm font-semibold border-2 border-gray-200 text-gray-600">Back to Home</button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}