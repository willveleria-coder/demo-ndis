import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { 
  Users, UserCog, AlertTriangle, Calendar, Clock, FileText, 
  TrendingUp, CheckCircle, AlertCircle, ChevronLeft, ChevronRight,
  Activity, Shield, Loader2, Bell, ArrowUpRight
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'

const LOGO_URL = 'https://ojobajaedarprixqecxr.supabase.co/storage/v1/object/public/documents/logo.png'

const MapleLeaf = ({ className = '' }) => (
  <img src={LOGO_URL} alt="MCS" className={`object-contain ${className}`} onError={e => { e.target.style.display = 'none' }} />
)

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatType(t) {
  if (!t) return '—'
  return t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

export default function Dashboard() {
  const { user } = useAuth()
  const [loading, setLoading] = useState(true)
  const [stats, setStats] = useState({})
  const [staffHours, setStaffHours] = useState([])
  const [recentIncidents, setRecentIncidents] = useState([])
  const [todayShifts, setTodayShifts] = useState([])
  const [expiringDocs, setExpiringDocs] = useState([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [shiftDates, setShiftDates] = useState({})
  const [adminName, setAdminName] = useState('')
  const [formSubmissions, setFormSubmissions] = useState([])

  useEffect(() => {
    loadDashboard()
  }, [])

  useEffect(() => {
    loadCalendarShifts()
  }, [calMonth])

  const loadDashboard = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 86400000).toISOString().split('T')[0]

      const [staffRes, partRes, incRes, shiftRes, docRes, todayRes, adminRes] = await Promise.all([
        supabase.from('staff').select('id, first_name, last_name, status, role'),
        supabase.from('participants').select('id, status'),
        supabase.from('incidents').select('id, incident_type, severity, status, created_at, description').order('created_at', { ascending: false }).limit(5),
        supabase.from('shifts').select('id, staff_id, staff:staff(first_name, last_name), start_time, end_time, clock_in, clock_out, status, shift_date'),
        supabase.from('documents').select('id, name, document_type, expiry_date, staff_id, staff:staff(first_name, last_name)'),
        supabase.from('shifts').select('id, staff:staff(first_name, last_name), participant:participants(first_name, last_name), start_time, end_time, status, title, shift_date').eq('shift_date', today).order('start_time'),
        supabase.from('staff').select('first_name, last_name').eq('role', 'admin').limit(1),
      ])

      const staff = staffRes.data || []
      const participants = partRes.data || []
      const incidents = incRes.data || []
      const shifts = shiftRes.data || []
      const docs = docRes.data || []

      if (adminRes.data?.[0]) {
        setAdminName(adminRes.data[0].first_name)
      }

      // Stats
      const activeStaff = staff.filter(s => s.status === 'active').length
      const activeParticipants = participants.filter(p => p.status === 'active').length
      const openIncidents = incidents.filter(i => i.status === 'open' || i.status === 'investigating').length
      const completedShiftsWeek = shifts.filter(s => s.status === 'completed' && s.shift_date >= weekAgo).length
      const scheduledToday = (todayRes.data || []).length

      setStats({ activeStaff, activeParticipants, openIncidents, completedShiftsWeek, scheduledToday, totalStaff: staff.length })
      setRecentIncidents(incidents.slice(0, 4))
      setTodayShifts(todayRes.data || [])

      // Expiring docs (next 30 days)
      const now = new Date()
      const expiring = docs.filter(d => {
        if (!d.expiry_date) return false
        const diff = Math.ceil((new Date(d.expiry_date) - now) / 86400000)
        return diff <= 30 && diff >= -30
      }).sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date)).slice(0, 5)
      setExpiringDocs(expiring)

      // Staff hours calculation
      const hoursByStaff = {}
      shifts.forEach(s => {
        if (s.status === 'completed' && s.clock_in && s.clock_out) {
          const staffName = s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown'
          const hours = (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000
          if (!hoursByStaff[staffName]) hoursByStaff[staffName] = { name: staffName, hours: 0, shifts: 0, id: s.staff_id }
          hoursByStaff[staffName].hours += hours
          hoursByStaff[staffName].shifts += 1
        }
      })
      setStaffHours(Object.values(hoursByStaff).sort((a, b) => b.hours - a.hours))

      // Recent form submissions
      try {
        const { data: formSubs } = await supabase
          .from('form_submissions')
          .select('*, staff:staff(first_name, last_name)')
          .order('submitted_at', { ascending: false })
          .limit(8)
        if (formSubs) setFormSubmissions(formSubs)
      } catch (e) { /* table may not exist yet */ }

    } catch (err) {
      console.error('Dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }

  const loadCalendarShifts = async () => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const start = new Date(year, month, 1).toISOString().split('T')[0]
    const end = new Date(year, month + 1, 0).toISOString().split('T')[0]

    const { data } = await supabase
      .from('shifts')
      .select('shift_date, status')
      .gte('shift_date', start)
      .lte('shift_date', end)

    const dates = {}
    ;(data || []).forEach(s => {
      if (!dates[s.shift_date]) dates[s.shift_date] = { total: 0, completed: 0 }
      dates[s.shift_date].total++
      if (s.status === 'completed') dates[s.shift_date].completed++
    })
    setShiftDates(dates)
  }

  // Calendar helpers
  const calDays = () => {
    const year = calMonth.getFullYear()
    const month = calMonth.getMonth()
    const firstDay = new Date(year, month, 1).getDay()
    const daysInMonth = new Date(year, month + 1, 0).getDate()
    const offset = firstDay === 0 ? 6 : firstDay - 1
    const days = []
    for (let i = 0; i < offset; i++) days.push(null)
    for (let i = 1; i <= daysInMonth; i++) days.push(i)
    return days
  }

  const isToday = (day) => {
    if (!day) return false
    const now = new Date()
    return day === now.getDate() && calMonth.getMonth() === now.getMonth() && calMonth.getFullYear() === now.getFullYear()
  }

  const getDateStr = (day) => {
    const y = calMonth.getFullYear()
    const m = String(calMonth.getMonth() + 1).padStart(2, '0')
    const d = String(day).padStart(2, '0')
    return `${y}-${m}-${d}`
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 size={32} className="animate-spin text-orange-500" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Welcome Header */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-400 shadow-xl shadow-orange-200/50 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-40 h-40 opacity-10">
          <MapleLeaf className="w-full h-full text-white" />
        </div>
        <div className="relative z-10">
          <p className="text-white/70 text-sm font-medium">{getGreeting()}</p>
          <h1 className="text-2xl md:text-3xl font-bold text-white mt-1">{adminName || 'Admin'}</h1>
          <p className="text-white/60 text-sm mt-1">
            {new Date().toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}
          </p>
          <div className="flex flex-wrap gap-3 mt-4">
            <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5">
              <Activity size={14} /> {stats.scheduledToday} shifts today
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-white/20 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5">
              <Users size={14} /> {stats.activeStaff} active staff
            </div>
            {stats.openIncidents > 0 && (
              <div className="px-3 py-1.5 rounded-lg bg-red-500/40 backdrop-blur-sm text-white text-xs font-semibold flex items-center gap-1.5">
                <AlertTriangle size={14} /> {stats.openIncidents} open incidents
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        <Link to="/admin/participants" className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-cyan-500 flex items-center justify-center shadow mb-3 group-hover:scale-110 transition-transform">
            <Users size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.activeParticipants}</p>
          <p className="text-xs text-gray-500 mt-0.5">Participants</p>
        </Link>
        <Link to="/admin/staff" className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-amber-500 flex items-center justify-center shadow mb-3 group-hover:scale-110 transition-transform">
            <UserCog size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.activeStaff}</p>
          <p className="text-xs text-gray-500 mt-0.5">Active Staff</p>
        </Link>
        <Link to="/admin/incidents" className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center shadow mb-3 group-hover:scale-110 transition-transform">
            <AlertTriangle size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.openIncidents}</p>
          <p className="text-xs text-gray-500 mt-0.5">Open Incidents</p>
        </Link>
        <Link to="/admin/roster" className="p-4 rounded-2xl bg-white border border-gray-100 shadow-sm hover:shadow-md transition-all group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500 to-green-500 flex items-center justify-center shadow mb-3 group-hover:scale-110 transition-transform">
            <CheckCircle size={20} className="text-white" />
          </div>
          <p className="text-2xl font-bold text-gray-800">{stats.completedShiftsWeek}</p>
          <p className="text-xs text-gray-500 mt-0.5">Shifts This Week</p>
        </Link>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Shifts */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Calendar size={18} className="text-orange-500" /> Today's Shifts</h3>
            <Link to="/admin/roster" className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1">View All <ArrowUpRight size={12} /></Link>
          </div>
          {todayShifts.length > 0 ? (
            <div className="space-y-2">
              {todayShifts.map(s => (
                <Link key={s.id} to={`/admin/roster/shift/${s.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className={`w-2 h-2 rounded-full ${s.status === 'completed' ? 'bg-emerald-500' : s.status === 'in_progress' ? 'bg-blue-500 animate-pulse' : 'bg-gray-300'}`} />
                    <div>
                      <p className="text-sm font-semibold text-gray-800">{s.staff?.first_name} {s.staff?.last_name}</p>
                      <p className="text-xs text-gray-500">{s.participant ? `${s.participant.first_name} ${s.participant.last_name}` : s.title || 'Unassigned'}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-semibold text-gray-600">
                      {s.start_time?.slice(0,5)} – {s.end_time?.slice(0,5)}
                    </p>
                    <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                      s.status === 'completed' ? 'bg-emerald-50 text-emerald-700' : 
                      s.status === 'in_progress' ? 'bg-blue-50 text-blue-700' : 
                      'bg-gray-100 text-gray-600'
                    }`}>{formatType(s.status || 'scheduled')}</span>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Calendar size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No shifts scheduled today</p>
            </div>
          )}
        </div>

        {/* Mini Calendar */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronLeft size={16} /></button>
            <p className="font-bold text-gray-800 text-sm">
              {calMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
            </p>
            <button onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))} className="p-1.5 rounded-lg hover:bg-gray-100"><ChevronRight size={16} /></button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center mb-1">
            {['M','T','W','T','F','S','S'].map((d,i) => (
              <span key={i} className="text-[10px] font-bold text-gray-400">{d}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1">
            {calDays().map((day, i) => {
              const dateStr = day ? getDateStr(day) : null
              const hasShifts = dateStr && shiftDates[dateStr]
              return (
                <div key={i} className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs relative ${
                  isToday(day) ? 'bg-orange-500 text-white font-bold' : 
                  day ? 'text-gray-700 hover:bg-gray-50' : ''
                }`}>
                  {day || ''}
                  {hasShifts && (
                    <div className={`w-1 h-1 rounded-full mt-0.5 ${isToday(day) ? 'bg-white' : 'bg-orange-400'}`} />
                  )}
                </div>
              )
            })}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        {/* Staff Hours */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={18} className="text-teal-500" /> Staff Hours</h3>
            <span className="text-[10px] text-gray-400 font-medium">All completed shifts</span>
          </div>
          {staffHours.length > 0 ? (
            <div className="space-y-3">
              {staffHours.map((s, i) => {
                const maxHours = staffHours[0]?.hours || 1
                return (
                  <div key={i}>
                    <div className="flex justify-between items-center mb-1">
                      <p className="text-sm font-semibold text-gray-700">{s.name}</p>
                      <p className="text-sm font-bold text-gray-800">{s.hours.toFixed(1)}h <span className="text-xs text-gray-400 font-normal">({s.shifts} shifts)</span></p>
                    </div>
                    <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-teal-500 to-cyan-400 rounded-full transition-all" style={{ width: `${Math.min((s.hours / maxHours) * 100, 100)}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <Clock size={36} className="text-gray-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">No completed shifts with clock data yet</p>
            </div>
          )}
        </div>

        {/* Compliance Alerts */}
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><Shield size={18} className="text-red-500" /> Compliance Alerts</h3>
          </div>
          {expiringDocs.length > 0 ? (
            <div className="space-y-2">
              {expiringDocs.map((d, i) => {
                const days = Math.ceil((new Date(d.expiry_date) - new Date()) / 86400000)
                const expired = days < 0
                return (
                  <div key={i} className={`p-3 rounded-xl border ${expired ? 'bg-red-50 border-red-200' : 'bg-amber-50 border-amber-200'}`}>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{d.name || formatType(d.document_type)}</p>
                        <p className="text-xs text-gray-500">{d.staff?.first_name} {d.staff?.last_name}</p>
                      </div>
                      <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${expired ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                        {expired ? `Expired ${Math.abs(days)}d ago` : `${days}d left`}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          ) : (
            <div className="p-8 text-center">
              <CheckCircle size={36} className="text-emerald-200 mx-auto mb-2" />
              <p className="text-sm text-gray-400">All documents are up to date</p>
            </div>
          )}
        </div>
      </div>

      {/* Recent Incidents */}
      {recentIncidents.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><AlertTriangle size={18} className="text-orange-500" /> Recent Incidents</h3>
            <Link to="/admin/incidents" className="text-xs text-orange-500 font-semibold hover:underline flex items-center gap-1">View All <ArrowUpRight size={12} /></Link>
          </div>
          <div className="space-y-2">
            {recentIncidents.map(inc => (
              <Link key={inc.id} to={`/admin/incidents/${inc.id}`} className="flex items-center justify-between p-3 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors">
                <div className="flex items-center gap-3">
                  <div className={`w-2.5 h-2.5 rounded-full ${
                    inc.severity === 'critical' ? 'bg-red-500' : 
                    inc.severity === 'high' ? 'bg-orange-500' : 
                    inc.severity === 'medium' ? 'bg-amber-500' : 'bg-gray-400'
                  }`} />
                  <div>
                    <p className="text-sm font-semibold text-gray-800">{formatType(inc.incident_type)}</p>
                    <p className="text-xs text-gray-500">{new Date(inc.created_at).toLocaleDateString('en-AU')}</p>
                  </div>
                </div>
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                  inc.status === 'open' ? 'bg-red-50 text-red-700' : 
                  inc.status === 'investigating' ? 'bg-amber-50 text-amber-700' : 
                  'bg-emerald-50 text-emerald-700'
                }`}>{formatType(inc.status)}</span>
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* Form Submissions */}
      {formSubmissions.length > 0 && (
        <div className="p-5 rounded-2xl bg-white border border-gray-100 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold text-gray-800 flex items-center gap-2"><FileText size={18} className="text-teal-500" /> Staff Form Submissions</h3>
            <span className="text-xs text-gray-400">{formSubmissions.length} recent</span>
          </div>
          <div className="space-y-2">
            {formSubmissions.map(sub => {
              const formLabels = { medication_chart: 'Medication Chart', medication_incident: 'Medication Incident', incident_report: 'Incident Report', cash_reconciliation: 'Cash Reconciliation' }
              const formColors = { medication_chart: 'bg-blue-50 text-blue-700 border-blue-200', medication_incident: 'bg-red-50 text-red-700 border-red-200', incident_report: 'bg-amber-50 text-amber-700 border-amber-200', cash_reconciliation: 'bg-emerald-50 text-emerald-700 border-emerald-200' }
              const formIcons = { medication_chart: '💊', medication_incident: '🚨', incident_report: '⚠️', cash_reconciliation: '💵' }
              const staffN = sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'
              return (
                <div key={sub.id} className={`p-3 rounded-xl border ${formColors[sub.form_type] || 'bg-gray-50 border-gray-200'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <span className="text-lg">{formIcons[sub.form_type] || '📋'}</span>
                      <div>
                        <p className="text-sm font-semibold text-gray-800">{formLabels[sub.form_type] || formatType(sub.form_type)}</p>
                        <p className="text-xs text-gray-500">{staffN}{sub.data?.participant_name ? ` · ${sub.data.participant_name}` : ''}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] text-gray-400">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }) : '—'}</p>
                      <p className="text-[10px] text-gray-400">{sub.submitted_at ? new Date(sub.submitted_at).toLocaleTimeString('en-AU', { hour: 'numeric', minute: '2-digit', hour12: true }) : ''}</p>
                    </div>
                  </div>
                  {sub.data && (
                    <div className="mt-2 pt-2 border-t border-gray-100/50 grid grid-cols-2 gap-x-4 gap-y-1">
                      {Object.entries(sub.data).filter(([k, v]) => v && k !== 'participant_name' && typeof v === 'string' && v.length < 80).slice(0, 4).map(([k, v]) => (
                        <div key={k}>
                          <p className="text-[10px] text-gray-400 capitalize">{k.replace(/_/g, ' ')}</p>
                          <p className="text-xs text-gray-700 truncate">{v}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}