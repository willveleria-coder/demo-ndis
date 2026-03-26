import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useState, useEffect } from 'react'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()
  const [waited, setWaited] = useState(false)

  // Give AuthContext 2 seconds to pick up the session before redirecting
  useEffect(() => {
    if (!loading && !user) {
      const t = setTimeout(() => setWaited(true), 2000)
      return () => clearTimeout(t)
    }
  }, [loading, user])

  if (loading || (!user && !waited)) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={requiredRole === 'admin' ? '/enter/admin' : '/enter/staff'} replace />
  }

  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/staff/dashboard" replace />
  }

  if (requiredRole === 'staff' && user.role !== 'admin' && user.role !== 'staff') {
    return <Navigate to="/" replace />
  }

  return children
}