import { Navigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

export default function ProtectedRoute({ children, requiredRole }) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!user) {
    return <Navigate to={requiredRole === 'admin' ? '/login/admin' : '/login/staff'} replace />
  }

  // Admin can access admin routes, staff can access staff routes
  if (requiredRole === 'admin' && user.role !== 'admin') {
    return <Navigate to="/staff/dashboard" replace />
  }

  if (requiredRole === 'staff' && user.role === 'admin') {
    return <Navigate to="/admin/dashboard" replace />
  }

  return children
}