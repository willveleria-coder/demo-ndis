import { useState } from 'react'
import { Download, Loader2, CheckCircle, Database, Users, UserCog, Calendar, AlertTriangle, FileText, Pill, DollarSign, Shield, GraduationCap } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'

function toCSV(data) {
  if (!data || data.length === 0) return ''
  const headers = Object.keys(data[0])
  const rows = data.map(row => headers.map(h => {
    let val = row[h]
    if (val === null || val === undefined) return ''
    if (typeof val === 'object') val = JSON.stringify(val)
    return `"${String(val).replace(/"/g, '""')}"`
  }).join(','))
  return [headers.join(','), ...rows].join('\n')
}

function downloadCSV(csv, filename) {
  const blob = new Blob([csv], { type: 'text/csv' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

const EXPORT_TABLES = [
  { id: 'participants', label: 'Participants', icon: Users, table: 'participants', color: 'from-orange-500 to-amber-500' },
  { id: 'staff', label: 'Staff', icon: UserCog, table: 'staff', color: 'from-teal-500 to-cyan-500' },
  { id: 'shifts', label: 'Shifts', icon: Calendar, table: 'shifts', color: 'from-blue-500 to-indigo-500' },
  { id: 'incidents', label: 'Incidents', icon: AlertTriangle, table: 'incidents', color: 'from-red-500 to-rose-500' },
  { id: 'documents', label: 'Documents', icon: FileText, table: 'documents', color: 'from-gray-500 to-slate-500' },
  { id: 'medications', label: 'Medications', icon: Pill, table: 'medications', color: 'from-purple-500 to-indigo-500' },
  { id: 'claims', label: 'NDIS Claims', icon: DollarSign, table: 'ndis_claims', color: 'from-emerald-500 to-green-500' },
  { id: 'training', label: 'Staff Training', icon: GraduationCap, table: 'staff_training', color: 'from-cyan-500 to-blue-500' },
  { id: 'service_agreements', label: 'Service Agreements', icon: FileText, table: 'service_agreements', color: 'from-violet-500 to-purple-500' },
  { id: 'restrictive', label: 'Restrictive Practices', icon: Shield, table: 'restrictive_practices', color: 'from-amber-500 to-orange-500' },
  { id: 'goals', label: 'Goals', icon: CheckCircle, table: 'goals', color: 'from-green-500 to-emerald-500' },
  { id: 'shift_notes', label: 'Shift Notes', icon: FileText, table: 'shift_notes', color: 'from-teal-500 to-emerald-500' },
]

export default function DataExport() {
  const c = useBrandColors()
  const [exporting, setExporting] = useState(null)
  const [exported, setExported] = useState(new Set())
  const [exportingAll, setExportingAll] = useState(false)

  const exportTable = async (tableConfig) => {
    setExporting(tableConfig.id)
    try {
      const { data, error } = await supabase.from(tableConfig.table).select('*')
      if (error) throw error
      if (!data || data.length === 0) {
        alert(`No data found in ${tableConfig.label}`)
        setExporting(null)
        return
      }
      const csv = toCSV(data)
      downloadCSV(csv, `${tableConfig.table}_export_${new Date().toISOString().split('T')[0]}.csv`)
      setExported(prev => new Set([...prev, tableConfig.id]))
    } catch (err) {
      console.error('Export error:', err)
      alert('Export failed: ' + (err.message || 'Unknown error'))
    } finally {
      setExporting(null)
    }
  }

  const exportAll = async () => {
    setExportingAll(true)
    for (const table of EXPORT_TABLES) {
      try {
        const { data } = await supabase.from(table.table).select('*')
        if (data && data.length > 0) {
          const csv = toCSV(data)
          downloadCSV(csv, `${table.table}_export_${new Date().toISOString().split('T')[0]}.csv`)
          setExported(prev => new Set([...prev, table.id]))
        }
      } catch (err) {
        console.error(`Export ${table.label} error:`, err)
      }
      await new Promise(r => setTimeout(r, 300))
    }
    setExportingAll(false)
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Database size={20} style={{ color: c.primary }} />
          <div>
            <h3 className="font-bold text-gray-800">Export Your Data</h3>
            <p className="text-xs text-gray-500">Download all your data as CSV files. Your data belongs to you — no lock-in, ever.</p>
          </div>
        </div>
        <button onClick={exportAll} disabled={exportingAll} className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-white text-sm font-semibold shadow-lg disabled:opacity-50"
          style={{ background: `linear-gradient(to right, ${c.primary}, ${c.adminHover})` }}>
          {exportingAll ? <><Loader2 size={16} className="animate-spin" /> Exporting All...</> : <><Download size={16} /> Export All Data</>}
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        {EXPORT_TABLES.map(table => {
          const isExporting = exporting === table.id
          const isDone = exported.has(table.id)
          return (
            <button key={table.id} onClick={() => exportTable(table)} disabled={isExporting || exportingAll}
              className={`p-4 rounded-xl border text-left transition-all hover:shadow-md disabled:opacity-50 ${isDone ? 'border-emerald-200 bg-emerald-50' : 'border-gray-200 bg-white'}`}>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`w-9 h-9 rounded-lg bg-gradient-to-br ${table.color} flex items-center justify-center text-white shadow`}>
                    <table.icon size={16} />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm">{table.label}</p>
                    <p className="text-[10px] text-gray-400">{table.table}.csv</p>
                  </div>
                </div>
                {isExporting ? <Loader2 size={16} className="animate-spin text-gray-400" /> : isDone ? <CheckCircle size={16} className="text-emerald-500" /> : <Download size={16} className="text-gray-300" />}
              </div>
            </button>
          )
        })}
      </div>

      <p className="text-[10px] text-gray-400 text-center">All exports are in standard CSV format compatible with Excel, Google Sheets, and any other NDIS platform.</p>
    </div>
  )
}