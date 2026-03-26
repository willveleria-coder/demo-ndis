import { Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider } from './context/AuthContext'
import { ThemeProvider } from './context/ThemeContext'
import { useGlobalLoadingReset } from './hooks/useNavigationReset'
import ProtectedRoute from './components/ProtectedRoute'
import AutoLogin from './components/AutoLogin.jsx'
import Goals from './pages/Goals.jsx'
import MainLayout from './layouts/MainLayout.jsx'
import StaffLayout from './layouts/StaffLayout.jsx'
import { StaffProvider } from './context/StaffContext.jsx'
import Landing from './pages/Landing.jsx'
import StaffForms from './pages/staff/StaffForms.jsx'
import Dashboard from './pages/Dashboard.jsx'
import AdminCalendar from './pages/AdminCalendar.jsx'
import Participants from './pages/Participants.jsx'
import BudgetUtilisation from './pages/BudgetUtilisation.jsx'
import ProgressNotes from './pages/ProgressNotes.jsx'
import SatisfactionSurveys from './pages/SatisfactionSurveys.jsx'
import ParticipantDetail from './pages/ParticipantDetail.jsx'
import ComplianceDashboard from './pages/ComplianceDashboard.jsx'
import Staff from './pages/Staff.jsx'
import StaffDetail from './pages/StaffDetail.jsx'
import Roster from './pages/Roster.jsx'
import Invoicing from './pages/Invoicing.jsx'
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
import StaffSwaps from './pages/staff/StaffSwaps.jsx'
import StaffBroadcasts from './pages/staff/StaffBroadcasts.jsx'
import StaffTrainingView from './pages/staff/StaffTrainingView.jsx'
import StaffParticipantDocs from './pages/staff/StaffParticipantDocs.jsx'
import StaffAvailability from './pages/staff/StaffAvailability.jsx'
import FamilyDashboard from './pages/FamilyDashboard.jsx'
import Medications from './pages/Medications.jsx'
import ServiceAgreements from './pages/ServiceAgreements.jsx'
import RestrictivePractices from './pages/RestrictivePractices.jsx'
import StaffTraining from './pages/StaffTraining.jsx'
import Billing from './pages/Billing.jsx'
import BudgetTracker from './pages/BudgetTracker.jsx'
import ShiftSwaps from './pages/ShiftSwaps.jsx'
import Broadcasts from './pages/Broadcasts.jsx'
import AuditLog from './pages/AuditLog.jsx'
import ReportBuilder from './pages/ReportBuilder.jsx'
import Integrations from './pages/Integrations.jsx'
import AuditReport from './pages/AuditReport.jsx'
import DemoTour from './components/DemoTour.jsx'
import StaffLeaderboard from './pages/staff/StaffLeaderboard.jsx'
import StaffIncidents from './pages/staff/StaffIncidents.jsx'
import StaffMedications from './pages/staff/StaffMedications.jsx'
import StaffHandover from './pages/staff/StaffHandover.jsx'
import StaffTasks from './pages/staff/StaffTasks.jsx'
import StaffMileage from './pages/staff/StaffMileage.jsx'
import StaffExpenses from './pages/staff/StaffExpenses.jsx'
import StaffSafety from './pages/staff/StaffSafety.jsx'
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
  useGlobalLoadingReset()

  return (
    <ThemeProvider>
      <ErrorBoundary>
        <AuthProvider>
 {/* <PageViewTracker /> */}
          <DemoTour />
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/enter/family" element={<Navigate to="/family/dashboard" replace />} />
            <Route path="/enter/admin" element={<Navigate to="/admin/dashboard" replace />} />
<Route path="/enter/staff" element={<Navigate to="/staff/dashboard" replace />} />
            <Route path="/enter/:portal" element={<AutoLogin />} />
            <Route path="/login/admin" element={<Navigate to="/enter/admin" replace />} />
            <Route path="/login/staff" element={<Navigate to="/enter/staff" replace />} />
            <Route path="/login/family" element={<Navigate to="/enter/family" replace />} />
            <Route path="/signup/admin" element={<Navigate to="/enter/admin" replace />} />
            <Route path="/setup/staff" element={<Navigate to="/enter/staff" replace />} />
            <Route path="/family/dashboard" element={<FamilyDashboard />} />

            {/* Staff routes */}
<Route path="/staff" element={
  <StaffProvider>
    <StaffLayout />
  </StaffProvider>
}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<StaffDashboard />} />
              <Route path="shifts" element={<StaffShifts />} />
              <Route path="notes" element={<StaffNotes />} />
              <Route path="leaderboard" element={<StaffLeaderboard />} />
              <Route path="incidents" element={<StaffIncidents />} />
              <Route path="medications" element={<StaffMedications />} />
              <Route path="handover" element={<StaffHandover />} />
              <Route path="tasks" element={<StaffTasks />} />
              <Route path="swaps" element={<StaffSwaps />} />
              <Route path="broadcasts" element={<StaffBroadcasts />} />
              <Route path="training" element={<StaffTrainingView />} />
              <Route path="time-off" element={<StaffTimeOff />} />
              <Route path="mileage" element={<StaffMileage />} />
              <Route path="expenses" element={<StaffExpenses />} />
              <Route path="safety" element={<StaffSafety />} />
              <Route path="calendar" element={<StaffCalendar />} />
              <Route path="forms" element={<StaffForms />} />
              <Route path="participant-docs" element={<StaffParticipantDocs />} />
              <Route path="availability" element={<StaffAvailability />} />
              <Route path="profile" element={<StaffProfile />} />
            </Route>

            {/* Admin routes */}
<Route path="/admin" element={
  <MainLayout />
}>
              <Route index element={<Navigate to="dashboard" replace />} />
              <Route path="dashboard" element={<Dashboard />} />
              <Route path="calendar" element={<AdminCalendar />} />
              <Route path="participants" element={<Participants />} />
              <Route path="participants/:id" element={<ParticipantDetail />} />
              <Route path="invoicing" element={<Invoicing />} />
              <Route path="staff" element={<Staff />} />
              <Route path="staff/:id" element={<StaffDetail />} />
              <Route path="roster" element={<Roster />} />
              <Route path="roster/shift/:id" element={<ShiftDetail />} />
              <Route path="budget-utilisation" element={<BudgetUtilisation />} />
              <Route path="progress-notes" element={<ProgressNotes />} />
              <Route path="satisfaction" element={<SatisfactionSurveys />} />
              <Route path="incidents" element={<Incidents />} />
              <Route path="incidents/:id" element={<IncidentDetail />} />
              <Route path="feedback" element={<Feedback />} />
              <Route path="notes" element={<Notes />} />
              <Route path="ai" element={<AIAssistant />} />
              <Route path="settings" element={<Settings />} />
              <Route path="import" element={<Import />} />
              <Route path="availability" element={<Availability />} />
              <Route path="goals" element={<Goals />} />
              <Route path="forms" element={<AdminForms />} />
              <Route path="medications" element={<Medications />} />
              <Route path="service-agreements" element={<ServiceAgreements />} />
              <Route path="restrictive-practices" element={<RestrictivePractices />} />
              <Route path="training" element={<StaffTraining />} />
              <Route path="budget" element={<BudgetTracker />} />
              <Route path="shift-swaps" element={<ShiftSwaps />} />
              <Route path="broadcasts" element={<Broadcasts />} />
              <Route path="audit-log" element={<AuditLog />} />
              <Route path="billing" element={<Billing />} />
              <Route path="reports" element={<ReportBuilder />} />
              <Route path="integrations" element={<Integrations />} />
              <Route path="audit-report" element={<AuditReport />} />
              <Route path="compliance" element={<ComplianceDashboard />} />
            </Route>
          </Routes>
        </AuthProvider>
      </ErrorBoundary>
    </ThemeProvider>
  )
}

export default App