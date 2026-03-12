export const shiftFormsList = [
  { id: 1, name: 'Incident Report', icon: 'AlertTriangle', color: 'from-red-500 to-rose-600', mandatory: false, category: 'worker' },
  { id: 2, name: 'Cash Reconciliation', icon: 'DollarSign', color: 'from-emerald-500 to-teal-600', mandatory: false, category: 'worker' },
  { id: 3, name: 'Medication Chart', icon: 'Clipboard', color: 'from-cyan-500 to-teal-600', mandatory: false, category: 'worker' },
  { id: 4, name: 'Medication Incident Report', icon: 'AlertCircle', color: 'from-purple-500 to-indigo-600', mandatory: false, category: 'worker' },
  { id: 5, name: 'Hazard Form', icon: 'AlertTriangle', color: 'from-yellow-500 to-amber-600', mandatory: false, category: 'worker' },
  { id: 6, name: 'Vehicle Safety Checklist', icon: 'Car', color: 'from-orange-500 to-amber-500', mandatory: false, category: 'worker' },
  { id: 7, name: 'Participant Survey', icon: 'List', color: 'from-teal-400 to-emerald-500', mandatory: false, category: 'worker' },
  { id: 8, name: 'Feedback Form', icon: 'MessageSquare', color: 'from-teal-500 to-cyan-600', mandatory: false, category: 'worker' },
  { id: 9, name: 'Governance Participant Survey', icon: 'Shield', color: 'from-indigo-500 to-purple-600', mandatory: false, category: 'worker' },
  { id: 10, name: 'Complaints Form', icon: 'AlertCircle', color: 'from-red-400 to-rose-500', mandatory: false, category: 'both' },
  { id: 11, name: 'Shift Notes', icon: 'FileText', color: 'from-orange-500 to-red-500', mandatory: true, category: 'worker' },
]

export const staffFormsList = [
  { id: 1, name: 'Complaints Form', icon: 'AlertCircle', color: 'from-red-400 to-rose-500', category: 'staff' },
  { id: 2, name: 'Staff Survey', icon: 'List', color: 'from-blue-500 to-indigo-500', category: 'staff' },
]

export const getFormIcon = (iconName) => {
  // This will be mapped to actual icons in components
  return iconName
}
