import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import ProtectedRoute from './components/ProtectedRoute'
import MainLayout from './layouts/MainLayout.jsx'
import StaffLayout from './layouts/StaffLayout.jsx'
import { StaffProvider } from './context/StaffContext.jsx'
import Landing from './pages/Landing.jsx'
import AdminLogin from './pages/AdminLogin.jsx'
import AdminSignup from './pages/AdminSignup.jsx'
import StaffLogin from './pages/StaffLogin.jsx'
import StaffSetup from './pages/StaffSetup.jsx'
import StaffForms from './pages/staff/StaffForms.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminCalendar from './pages/AdminCalendar.jsx'
import Participants from './pages/Participants.jsx'
import ParticipantDetail from './pages/ParticipantDetail.jsx'
import Staff from './pages/Staff.jsx'
import StaffDetail from './pages/StaffDetail.jsx'
import Roster from './pages/Roster.jsx'
import ShiftDetail from './pages/ShiftDetail.jsx'
import Incidents from './pages/Incidents.jsx'
import IncidentDetail from './pages/IncidentDetail.jsx'
import Feedback from './pages/Feedback.jsx'
import Notes from './pages/Notes.jsx'
import AIAssistant from './pages/AIAssistant.jsx'
import Settings from './pages/Settings.jsx'
import Import from './pages/Import'
import AdminForms from './pages/AdminForms.jsx'
import Availability from './pages/Availability.jsx'
import StaffDashboard from './pages/staff/StaffDashboard.jsx'
import StaffShifts from './pages/staff/StaffShifts.jsx'
import StaffNotes from './pages/staff/StaffNotes.jsx'
import StaffCalendar from './pages/staff/StaffCalendar.jsx'
import StaffTimeOff from './pages/staff/StaffTimeOff.jsx'
import StaffProfile from './pages/staff/StaffProfile.jsx'
import StaffParticipantDocs from './pages/staff/StaffParticipantDocs.jsx'
import StaffAvailability from './pages/staff/StaffAvailability.jsx'


import { Component } from 'react'

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null } }
  static getDerivedStateFromError(error) { return { hasError: true, error } }
  componentDidCatch(error, info) { console.error('App crash:', error, info) }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'system-ui', background: '#f9fafb' }}>
          <div style={{ textAlign: 'center', padding: '2rem' }}>
            <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#1f2937', marginBottom: '0.5rem' }}>Something went wrong</h2>
            <p style={{ color: '#6b7280', marginBottom: '1rem', fontSize: '0.875rem' }}>{this.state.error?.message || 'An unexpected error occurred'}</p>
            <button onClick={() => { sessionStorage.clear(); window.location.href = '/' }} style={{ padding: '0.75rem 1.5rem', background: '#0d9488', color: 'white', border: 'none', borderRadius: '0.75rem', fontWeight: '600', cursor: 'pointer' }}>
              Return to Home
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}

function App() {
  return (
    <ErrorBoundary>
    <Routes>
      {/* Public routes - NO AuthProvider */}
      <Route path="/" element={<Landing />} />
      <Route path="/login/admin" element={<AdminLogin />} />
      <Route path="/login/staff" element={<StaffLogin />} />
      <Route path="/signup/admin" element={<AdminSignup />} />
      <Route path="/setup/staff" element={<StaffSetup />} />

      {/* Staff routes - with StaffLayout sidebar */}
      <Route path="/staff" element={
        <AuthProvider>
          <ProtectedRoute requiredRole="staff">
            <StaffProvider>
              <StaffLayout />
            </StaffProvider>
          </ProtectedRoute>
        </AuthProvider>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<StaffDashboard />} />
        <Route path="shifts" element={<StaffShifts />} />
        <Route path="notes" element={<StaffNotes />} />
        <Route path="time-off" element={<StaffTimeOff />} />
        <Route path="calendar" element={<StaffCalendar />} />
        <Route path="forms" element={<StaffForms />} />
        <Route path="participant-docs" element={<StaffParticipantDocs />} />
        <Route path="availability" element={<StaffAvailability />} />
        <Route path="profile" element={<StaffProfile />} />
      </Route>

      {/* Admin routes - with MainLayout sidebar */}
      <Route path="/admin" element={
        <AuthProvider>
          <ProtectedRoute requiredRole="admin">
            <MainLayout />
          </ProtectedRoute>
        </AuthProvider>
      }>
        <Route index element={<Navigate to="dashboard" replace />} />
        <Route path="dashboard" element={<Dashboard />} />
        <Route path="calendar" element={<AdminCalendar />} />
        <Route path="participants" element={<Participants />} />
        <Route path="participants/:id" element={<ParticipantDetail />} />
        <Route path="staff" element={<Staff />} />
        <Route path="staff/:id" element={<StaffDetail />} />
        <Route path="roster" element={<Roster />} />
        <Route path="roster/shift/:id" element={<ShiftDetail />} />
        <Route path="incidents" element={<Incidents />} />
        <Route path="incidents/:id" element={<IncidentDetail />} />
        <Route path="feedback" element={<Feedback />} />
        <Route path="notes" element={<Notes />} />
        <Route path="ai" element={<AIAssistant />} />
        <Route path="settings" element={<Settings />} />
        <Route path="import" element={<Import />} />
        <Route path="availability" element={<Availability />} />
        <Route path="forms" element={<AdminForms />} />
      </Route>
    </Routes>
    </ErrorBoundary>
  )
}

export default App