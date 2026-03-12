import { Link } from 'react-router-dom'

export const Badge = ({ children, color = 'gray' }) => {
  const colors = {
    gray: 'bg-gray-100 text-gray-600 border-gray-200',
    green: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    amber: 'bg-amber-50 text-amber-700 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    blue: 'bg-cyan-50 text-cyan-700 border-cyan-200',
    orange: 'bg-orange-50 text-orange-700 border-orange-200',
    teal: 'bg-teal-50 text-teal-700 border-teal-200',
    purple: 'bg-purple-50 text-purple-700 border-purple-200',
  }
  return (
    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold border ${colors[color] || colors.gray}`}>
      {children}
    </span>
  )
}

export const StatCard = ({ icon: Icon, label, value, trend, color, alert, onClick, to }) => {
  const content = (
    <div className={`relative p-4 rounded-2xl glass shadow-lg shadow-gray-200/50 hover:shadow-xl hover:bg-white/80 transition-all cursor-pointer ${alert ? 'ring-2 ring-red-400' : ''}`}>
      {alert && (
        <span className="absolute -top-2 -right-2 w-5 h-5 bg-red-500 rounded-full pulse-slow text-xs flex items-center justify-center text-white font-bold">!</span>
      )}
      <div className="flex items-start justify-between">
        <div className={`p-2.5 rounded-xl bg-gradient-to-br ${color} shadow-lg`}>
          <Icon size={20} className="text-white" />
        </div>
        {trend && (
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full">
            +{trend}%
          </span>
        )}
      </div>
      <p className="mt-3 text-2xl font-bold text-gray-800">{value}</p>
      <p className="text-sm text-gray-500">{label}</p>
    </div>
  )

  if (to) {
    return <Link to={to}>{content}</Link>
  }
  
  return onClick ? <div onClick={onClick}>{content}</div> : content
}

export const InfoField = ({ label, value }) => (
  <div className="p-3 rounded-xl bg-gray-50 border border-gray-100">
    <p className="text-xs text-gray-400 font-medium">{label}</p>
    <p className="text-gray-800 font-semibold text-sm">{value || '—'}</p>
  </div>
)

export const SectionTitle = ({ children, action }) => (
  <div className="flex justify-between items-center mb-3">
    <h4 className="text-sm font-bold text-gray-600">{children}</h4>
    {action}
  </div>
)

export const PageHeader = ({ title, subtitle, action }) => (
  <div className="flex justify-between items-center mb-6">
    <div>
      <h2 className="text-2xl font-bold text-gray-800">{title}</h2>
      {subtitle && <p className="text-gray-500">{subtitle}</p>}
    </div>
    {action}
  </div>
)

export const Card = ({ children, className = '' }) => (
  <div className={`p-5 rounded-2xl glass shadow-lg ${className}`}>
    {children}
  </div>
)

export const AlertBanner = ({ icon: Icon, title, message, color = 'red' }) => {
  const colors = {
    red: 'from-red-500 to-orange-500 shadow-red-200',
    amber: 'from-amber-500 to-orange-500 shadow-amber-200',
    teal: 'from-teal-500 to-cyan-500 shadow-teal-200',
  }
  return (
    <div className={`p-4 rounded-2xl bg-gradient-to-r ${colors[color]} shadow-lg`}>
      <div className="flex items-center gap-3">
        <div className="p-2 bg-white/20 rounded-xl">
          <Icon size={24} className="text-white" />
        </div>
        <div>
          <p className="font-bold text-white">{title}</p>
          <p className="text-sm text-white/80">{message}</p>
        </div>
      </div>
    </div>
  )
}

export const EmptyState = ({ icon: Icon, message }) => (
  <div className="h-96 flex items-center justify-center rounded-2xl bg-white/50 border border-gray-100">
    <div className="text-center">
      <Icon size={64} className="text-gray-300 mx-auto mb-4" />
      <p className="text-gray-400">{message}</p>
    </div>
  </div>
)

export const getStatusColor = (status) => {
  if (status === 'Valid' || status === 'Completed' || status === 'Resolved' || status === 'Acknowledged') return 'green'
  if (status === 'Expiring Soon' || status === 'Pending' || status === 'Under Review') return 'amber'
  if (status === 'Expired' || status === 'Action Required') return 'red'
  if (status === 'In Progress' || status === 'On Shift') return 'teal'
  if (status === 'Upcoming' || status === 'Available' || status === 'Scheduled') return 'blue'
  return 'gray'
}

export const getQualStatus = (qual) => {
  if (!qual?.status) return 'gray'
  if (qual.status === 'Valid') return 'green'
  if (qual.status === 'Expiring Soon') return 'amber'
  return 'red'
}
