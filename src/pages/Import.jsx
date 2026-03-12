import { useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, Users, Shield, AlertTriangle, CheckCircle2,
  ArrowLeft, Download, X, ChevronRight, Loader2, UserPlus,
  ClipboardList, RefreshCw, Info, ArrowRight, Check, XCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'

/* ─── CSV Parser ─── */
function parseCSVRows(text) {
  const rows = text.split(/\r?\n/)
  if (rows.length === 0) return []
  const headers = parseRow(rows[0])
  const result = []
  for (let i = 1; i < rows.length; i++) {
    if (!rows[i].trim()) continue
    const vals = parseRow(rows[i])
    const obj = {}
    headers.forEach((h, idx) => { obj[h.trim()] = (vals[idx] || '').trim() })
    result.push(obj)
  }
  return result
}

function parseRow(line) {
  const result = []
  let current = ''
  let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }
      inQuotes = !inQuotes; continue
    }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current)
  return result
}

/* ─── Column mapping configs ─── */
const IMPORT_TYPES = {
  participants: {
    label: 'Participants (Clients)',
    icon: Users,
    color: 'from-orange-500 to-amber-500',
    shadow: 'shadow-orange-200',
    description: 'Import your clients/participants from ShiftCare. Go to Integrations > CSV Import > Download Client Update Template.',
    table: 'participants',
    columnMap: {
      'First Name': 'first_name',
      'Last Name': 'last_name',
      'first_name': 'first_name',
      'last_name': 'last_name',
      'FirstName': 'first_name',
      'LastName': 'last_name',
      'name': '_full_name',
      'Name': '_full_name',
      'Full Name': '_full_name',
      'Client Name': '_full_name',
      'Email': 'email',
      'email': 'email',
      'Phone': 'phone',
      'phone': 'phone',
      'Mobile': 'phone',
      'mobile': 'phone',
      'Phone Number': 'phone',
      'Mobile Phone': 'phone',
      'Address': 'address',
      'address': 'address',
      'Street Address': 'address',
      'Date of Birth': 'date_of_birth',
      'date_of_birth': 'date_of_birth',
      'DOB': 'date_of_birth',
      'dob': 'date_of_birth',
      'Date Of Birth': 'date_of_birth',
      'NDIS Number': 'ndis_number',
      'ndis_number': 'ndis_number',
      'NDIA Number': 'ndis_number',
      'NDIS number': 'ndis_number',
      'NDIS': 'ndis_number',
      'ndia': 'ndis_number',
      'NDIA': 'ndis_number',
      'reference_number': 'ndis_number',
      'Gender': 'gender',
      'gender': 'gender',
      'Emergency Contact Name': 'emergency_contact_name',
      'emergency_contact_name': 'emergency_contact_name',
      'Emergency Contact': 'emergency_contact_name',
      'carer': 'emergency_contact_name',
      'Carer': 'emergency_contact_name',
      'Emergency Contact Phone': 'emergency_contact_phone',
      'emergency_contact_phone': 'emergency_contact_phone',
      'relation': 'emergency_contact_relationship',
      'Relation': 'emergency_contact_relationship',
      'Notes': 'notes',
      'notes': 'notes',
      'Status': 'status',
      'status': 'status',
      'Suburb': 'suburb',
      'suburb': 'suburb',
      'State': 'state',
      'state': 'state',
      'Postcode': 'postcode',
      'postcode': 'postcode',
      'Post Code': 'postcode',
      'salutation': '_salutation',
      'plan_expiry_date': '_plan_expiry',
      'client_types': '_client_types',
      'client_id': '_external_id',
      'area': '_area',
    },
    required: ['first_name', 'last_name'],
    defaults: { status: 'active' },
  },
  staff: {
    label: 'Staff Members',
    icon: Shield,
    color: 'from-teal-500 to-cyan-500',
    shadow: 'shadow-teal-200',
    description: 'Import your staff/carers from ShiftCare. Go to Integrations > CSV Import > Download Staff Update Template.',
    table: 'staff',
    columnMap: {
      'First Name': 'first_name',
      'Last Name': 'last_name',
      'first_name': 'first_name',
      'last_name': 'last_name',
      'FirstName': 'first_name',
      'LastName': 'last_name',
      'name': '_full_name',
      'Name': '_full_name',
      'Full Name': '_full_name',
      'Staff Name': '_full_name',
      'Email': 'email',
      'email': 'email',
      'Phone': 'phone',
      'phone': 'phone',
      'Mobile': 'phone',
      'mobile': 'phone',
      'Phone Number': 'phone',
      'Mobile Phone': 'phone',
      'Address': 'address',
      'address': 'address',
      'Street Address': 'address',
      'Date of Birth': 'date_of_birth',
      'date_of_birth': 'date_of_birth',
      'DOB': 'date_of_birth',
      'dob': 'date_of_birth',
      'Date Of Birth': 'date_of_birth',
      'Gender': 'gender',
      'gender': 'gender',
      'Role': 'role',
      'role': 'role',
      'Employment Type': 'employment_type',
      'employment_type': 'employment_type',
      'EmploymentType': 'employment_type',
      'Emergency Contact Name': 'emergency_contact_name',
      'emergency_contact_name': 'emergency_contact_name',
      'Emergency Contact': 'emergency_contact_name',
      'Emergency Contact Phone': 'emergency_contact_phone',
      'emergency_contact_phone': 'emergency_contact_phone',
      'Notes': 'notes',
      'notes': 'notes',
      'Status': 'status',
      'status': 'status',
      'Start Date': 'start_date',
      'start_date': 'start_date',
      'salutation': '_salutation',
      'user_id': '_external_id',
      'invited_by': '_invited_by',
      'last_login': '_last_login',
      'area': '_area',
    },
    required: ['first_name', 'last_name', 'email'],
    defaults: { status: 'active', role: 'staff' },
  },
  incidents: {
    label: 'Incidents',
    icon: AlertTriangle,
    color: 'from-red-500 to-rose-500',
    shadow: 'shadow-red-200',
    description: 'Import incident records from ShiftCare. Go to Incidents > Tickets > Bulk Export as CSV.',
    table: 'incidents',
    columnMap: {
      'Ticket Name': 'description',
      'title': 'description',
      'Title': 'description',
      'Name': 'description',
      'Ticket Description': 'description',
      'Description': 'description',
      'description': 'description',
      'Category': 'incident_type',
      'category': 'incident_type',
      'Type': 'incident_type',
      'type': 'incident_type',
      'Incident Type': 'incident_type',
      'Status': 'status',
      'status': 'status',
      'Priority': 'severity',
      'priority': 'severity',
      'Severity': 'severity',
      'severity': 'severity',
      'Date': 'incident_date',
      'date': 'incident_date',
      'Date Occurred': 'incident_date',
      'Incident Date': 'incident_date',
      'Created At': 'incident_date',
      'created_at': 'incident_date',
      'Due on': 'incident_date',
      'Location': 'location',
      'location': 'location',
      'Immediate Action': 'immediate_action',
      'immediate_action': 'immediate_action',
      'Follow Up': 'follow_up_notes',
      'follow_up_notes': 'follow_up_notes',
      'Notes': 'follow_up_notes',
      'notes': 'follow_up_notes',
    },
    required: ['description'],
    defaults: { status: 'open', severity: 'medium', incident_type: 'other' },
  },
}

/* ─── Date parser for AU formats ─── */
function parseDate(val) {
  if (!val) return null
  // Try DD/MM/YYYY (AU format — day ≤ 12 is ambiguous, but prefer AU)
  const slashMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slashMatch) {
    const [, a, b, y] = slashMatch
    // If first number > 12, it must be day (DD/MM/YYYY)
    // If second number > 12, it must be day so format is MM/DD/YYYY
    // Otherwise default to DD/MM/YYYY (AU standard)
    let day, month
    if (+a > 12) { day = +a; month = +b }
    else if (+b > 12) { day = +b; month = +a }
    else { day = +a; month = +b } // Default DD/MM/YYYY
    const date = new Date(y, month - 1, day)
    if (!isNaN(date)) return date.toISOString().split('T')[0]
  }
  // Try YYYY-MM-DD
  const isoMatch = val.match(/^\d{4}-\d{2}-\d{2}/)
  if (isoMatch) return isoMatch[0]
  // Try generic parse
  const d = new Date(val)
  if (!isNaN(d)) return d.toISOString().split('T')[0]
  return null
}

function normalizeStatus(val) {
  if (!val) return null
  const lower = val.toLowerCase().trim()
  if (['active', 'open', 'current'].includes(lower)) return 'active'
  if (['inactive', 'closed', 'archived', 'disabled'].includes(lower)) return 'inactive'
  if (['on leave', 'on_leave', 'leave'].includes(lower)) return 'on_leave'
  if (['resolved', 'complete', 'completed'].includes(lower)) return 'resolved'
  if (['in progress', 'in_progress', 'pending'].includes(lower)) return 'in_progress'
  return lower.replace(/\s+/g, '_')
}

function normalizeSeverity(val) {
  if (!val) return 'medium'
  const lower = val.toLowerCase().trim()
  if (['low', 'minor'].includes(lower)) return 'low'
  if (['medium', 'moderate', 'normal'].includes(lower)) return 'medium'
  if (['high', 'major', 'serious'].includes(lower)) return 'high'
  if (['critical', 'urgent', 'extreme', 'severe'].includes(lower)) return 'critical'
  return 'medium'
}

function normalizeIncidentType(val) {
  if (!val) return 'other'
  const lower = val.toLowerCase().trim().replace(/\s+/g, '_')
  const validTypes = ['injury', 'medication_error', 'behaviour_of_concern', 'property_damage', 'abuse_neglect', 'unauthorized_restrictive_practice', 'death', 'sexual_misconduct', 'other']
  if (validTypes.includes(lower)) return lower
  if (lower.includes('medic')) return 'medication_error'
  if (lower.includes('injur') || lower.includes('fall') || lower.includes('hurt')) return 'injury'
  if (lower.includes('behav') || lower.includes('verbal') || lower.includes('aggress')) return 'behaviour_of_concern'
  if (lower.includes('property') || lower.includes('damage')) return 'property_damage'
  if (lower.includes('abuse') || lower.includes('neglect') || lower.includes('safeguard')) return 'abuse_neglect'
  if (lower.includes('restrict')) return 'unauthorized_restrictive_practice'
  if (lower.includes('sexual')) return 'sexual_misconduct'
  if (lower.includes('death')) return 'death'
  return 'other'
}

function normalizeRole(val) {
  if (!val) return 'staff'
  const lower = val.toLowerCase().trim()
  if (lower.includes('admin') || lower.includes('manager') || lower.includes('coordinator')) return 'admin'
  return 'staff'
}

function normalizeEmployment(val) {
  if (!val) return null
  const lower = val.toLowerCase().trim()
  if (lower.includes('full')) return 'full_time'
  if (lower.includes('part')) return 'part_time'
  if (lower.includes('casual')) return 'casual'
  if (lower.includes('contract')) return 'contract'
  return lower.replace(/\s+/g, '_')
}

/* ─── Component ─── */
export default function Import() {
  const [step, setStep] = useState('select') // select | upload | preview | importing | done
  const [importType, setImportType] = useState(null)
  const [rawData, setRawData] = useState([])
  const [mappedData, setMappedData] = useState([])
  const [detectedColumns, setDetectedColumns] = useState([])
  const [unmappedColumns, setUnmappedColumns] = useState([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState({ success: 0, errors: [], skipped: 0 })
  const [dragOver, setDragOver] = useState(false)

  const config = importType ? IMPORT_TYPES[importType] : null

  const handleFile = useCallback((file) => {
    if (!file || !config) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result
        const rows = parseCSVRows(text)
        if (rows.length === 0) { alert('No data found in file'); return }

        const headers = Object.keys(rows[0])
        setDetectedColumns(headers)

        // Map columns
        const mapped = []
        const unmapped = []
        headers.forEach(h => {
          if (!config.columnMap[h]) unmapped.push(h)
        })
        setUnmappedColumns(unmapped)

        rows.forEach(row => {
          const obj = { ...config.defaults }
          headers.forEach(h => {
            const target = config.columnMap[h]
            if (target && row[h]) {
              let val = row[h]
              // Normalize dates
              if (target.includes('date') || target === 'date_of_birth') {
                val = parseDate(val) || val
              }
              // Normalize status
              if (target === 'status') val = normalizeStatus(val)
              // Normalize role
              if (target === 'role') val = normalizeRole(val)
              // Normalize employment type
              if (target === 'employment_type') val = normalizeEmployment(val)
              // Normalize severity
              if (target === 'severity') val = normalizeSeverity(val)
              // Normalize incident type
              if (target === 'incident_type') val = normalizeIncidentType(val)
              obj[target] = val
            }
          })
          // Combine address fields if separate
          if (row['Suburb'] || row['suburb']) {
            const parts = [obj.address, row['Suburb'] || row['suburb'], row['State'] || row['state'], row['Postcode'] || row['postcode'] || row['Post Code']].filter(Boolean)
            obj.address = parts.join(', ')
          }
          // Split full name into first_name / last_name
          if (obj._full_name && (!obj.first_name || !obj.last_name)) {
            const nameParts = obj._full_name.trim().split(/\s+/)
            if (!obj.first_name) obj.first_name = nameParts[0] || ''
            if (!obj.last_name) obj.last_name = nameParts.slice(1).join(' ') || nameParts[0] || ''
          }
          delete obj._full_name
          delete obj._salutation
          delete obj._plan_expiry
          delete obj._client_types
          delete obj._external_id
          delete obj._area
          // Use mobile as phone if phone is empty
          if (!obj.phone && row['mobile']) obj.phone = row['mobile']
          if (!obj.phone && row['Mobile']) obj.phone = row['Mobile']
          // Clean up: remove empty strings
          Object.keys(obj).forEach(k => { if (obj[k] === '') delete obj[k] })
          mapped.push(obj)
        })

        setRawData(rows)
        setMappedData(mapped)
        setStep('preview')
      } catch (err) {
        console.error('Parse error:', err)
        alert('Failed to parse file: ' + err.message)
      }
    }
    reader.readAsText(file)
  }, [config])

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragOver(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }, [handleFile])

  const handleImport = async () => {
    if (!config || mappedData.length === 0) return
    setImporting(true)
    setStep('importing')
    const res = { success: 0, errors: [], skipped: 0 }

    // Filter valid rows
    const validRows = mappedData.filter((row, idx) => {
      const missing = config.required.filter(f => !row[f])
      if (missing.length > 0) {
        res.skipped++
        res.errors.push({ row: idx + 2, reason: `Missing required: ${missing.join(', ')}` })
        return false
      }
      return true
    })

    // Batch insert in chunks of 50
    const chunkSize = 50
    for (let i = 0; i < validRows.length; i += chunkSize) {
      const chunk = validRows.slice(i, i + chunkSize)
      try {
        // Clean up empty strings to null and remove non-DB columns
        const NON_DB_KEYS = ['suburb', 'state', 'postcode', '_full_name', '_salutation', '_plan_expiry', '_client_types', '_external_id', '_area']
        const cleaned = chunk.map(row => {
          const obj = {}
          Object.entries(row).forEach(([k, v]) => {
            if (k.startsWith('_') || NON_DB_KEYS.includes(k)) return
            obj[k] = v === '' ? null : v
          })
          return obj
        })
        const { data, error } = await supabase.from(config.table).insert(cleaned).select()
        if (error) throw error
        res.success += (data?.length || chunk.length)
      } catch (err) {
        console.error('Insert error:', err)
        // Try individual inserts for this chunk
        for (let j = 0; j < chunk.length; j++) {
          try {
            const cleaned = {}
            Object.entries(chunk[j]).forEach(([k, v]) => {
              if (k.startsWith('_') || NON_DB_KEYS.includes(k)) return
              cleaned[k] = v === '' ? null : v
            })
            const { error: singleErr } = await supabase.from(config.table).insert(cleaned)
            if (singleErr) {
              res.errors.push({ row: i + j + 2, reason: singleErr.message })
            } else {
              res.success++
            }
          } catch (e2) {
            res.errors.push({ row: i + j + 2, reason: e2.message })
          }
        }
      }
    }

    setResults(res)
    setImporting(false)
    setStep('done')
  }

  const reset = () => {
    setStep('select')
    setImportType(null)
    setRawData([])
    setMappedData([])
    setDetectedColumns([])
    setUnmappedColumns([])
    setFileName('')
    setResults({ success: 0, errors: [], skipped: 0 })
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link to="/admin/settings" className="p-2 rounded-xl bg-white/80 hover:bg-white shadow-sm border border-gray-200 text-gray-600 hover:text-gray-800 transition-all">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h1 className="text-2xl font-black text-gray-900">Import Data</h1>
            <p className="text-sm text-gray-500">Migrate from ShiftCare or import from CSV</p>
          </div>
        </div>
        {step !== 'select' && step !== 'importing' && (
          <button onClick={reset} className="flex items-center gap-2 px-4 py-2 bg-white/80 border border-gray-200 rounded-xl text-sm font-semibold text-gray-600 hover:bg-gray-50 transition-all">
            <RefreshCw size={16} /> Start Over
          </button>
        )}
      </div>

      {/* Step indicator */}
      <div className="flex items-center gap-2">
        {['Select Type', 'Upload File', 'Preview & Map', 'Import'].map((label, i) => {
          const steps = ['select', 'upload', 'preview', 'done']
          const stepIdx = steps.indexOf(step === 'importing' ? 'done' : step)
          const isActive = i === stepIdx
          const isDone = i < stepIdx
          return (
            <div key={label} className="flex items-center gap-2 flex-1">
              <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 ${
                isActive ? 'bg-gradient-to-r from-orange-500 to-amber-500 text-white shadow-lg shadow-orange-200' :
                isDone ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                'bg-gray-100 text-gray-400'
              }`}>
                {isDone ? <Check size={14} /> : <span>{i + 1}</span>}
                <span className="hidden sm:inline">{label}</span>
              </div>
              {i < 3 && <ChevronRight size={14} className="text-gray-300 shrink-0" />}
            </div>
          )
        })}
      </div>

      {/* ─── STEP 1: SELECT TYPE ─── */}
      {step === 'select' && (
        <div className="space-y-4">
          <div className="bg-white/80 rounded-2xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-start gap-3 p-4 rounded-xl bg-sky-50 border border-sky-200 mb-5">
              <Info size={18} className="text-sky-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-bold text-sky-800">Migrating from ShiftCare?</p>
                <p className="text-xs text-sky-600 mt-1">Export your data from ShiftCare first: go to <strong>Integrations → CSV Import</strong> and download your Client and Staff templates. For incidents, go to <strong>Incidents → Tickets → Bulk Export as CSV</strong>. Then upload the CSVs here.</p>
              </div>
            </div>

            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-4">What are you importing?</p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {Object.entries(IMPORT_TYPES).map(([key, type]) => (
                <button key={key} onClick={() => { setImportType(key); setStep('upload') }}
                  className="group p-5 rounded-2xl border-2 border-gray-200 hover:border-orange-300 bg-white hover:shadow-lg transition-all text-left">
                  <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${type.color} flex items-center justify-center shadow-lg ${type.shadow} mb-4`}>
                    <type.icon size={22} className="text-white" />
                  </div>
                  <p className="font-bold text-gray-900 text-lg">{type.label}</p>
                  <p className="text-sm text-gray-500 mt-1">{type.description.split('.')[0]}.</p>
                  <div className="flex items-center gap-1 mt-3 text-orange-500 text-sm font-semibold opacity-0 group-hover:opacity-100 transition-opacity">
                    Select <ArrowRight size={14} />
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Download sample templates */}
          <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
            <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Don't have a CSV? Download a template</p>
            <div className="flex flex-wrap gap-2">
              {Object.entries(IMPORT_TYPES).map(([key, type]) => (
                <button key={key} onClick={() => {
                  const headers = [...new Set(Object.values(type.columnMap))].join(',')
                  const blob = new Blob([headers + '\n'], { type: 'text/csv' })
                  const url = URL.createObjectURL(blob)
                  const a = document.createElement('a'); a.href = url; a.download = `${key}_import_template.csv`; a.click()
                  URL.revokeObjectURL(url)
                }}
                  className="flex items-center gap-2 px-4 py-2 bg-gray-50 hover:bg-gray-100 border border-gray-200 rounded-xl text-sm font-semibold text-gray-700 transition-all">
                  <Download size={14} /> {type.label} Template
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 2: UPLOAD ─── */}
      {step === 'upload' && config && (
        <div className="space-y-4">
          <div className="bg-white/80 rounded-2xl border border-gray-200 p-6 shadow-sm backdrop-blur-sm">
            <div className="flex items-center gap-3 mb-5">
              <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${config.shadow}`}>
                <config.icon size={20} className="text-white" />
              </div>
              <div>
                <p className="font-bold text-gray-900">Import {config.label}</p>
                <p className="text-xs text-gray-500">{config.description}</p>
              </div>
            </div>

            {/* Drop zone */}
            <div
              onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
              onDragLeave={() => setDragOver(false)}
              onDrop={handleDrop}
              className={`relative border-2 border-dashed rounded-2xl p-12 text-center transition-all cursor-pointer ${
                dragOver ? 'border-orange-400 bg-orange-50' : 'border-gray-300 hover:border-orange-300 hover:bg-orange-50/30'
              }`}
              onClick={() => document.getElementById('csv-input').click()}
            >
              <input id="csv-input" type="file" accept=".csv,.txt,.xlsx" className="hidden"
                onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]) }} />
              <Upload size={40} className={`mx-auto mb-4 ${dragOver ? 'text-orange-500' : 'text-gray-300'}`} />
              <p className="font-bold text-gray-800 text-lg">Drop your CSV file here</p>
              <p className="text-sm text-gray-400 mt-1">or click to browse</p>
              <p className="text-xs text-gray-300 mt-3">Accepts .csv files exported from ShiftCare</p>
            </div>

            <div className="mt-5 p-4 rounded-xl bg-amber-50 border border-amber-200">
              <p className="text-xs font-bold text-amber-800 mb-2">How to export from ShiftCare:</p>
              <ol className="text-xs text-amber-700 space-y-1">
                {importType === 'participants' && <>
                  <li>1. Go to <strong>Integrations → CSV Import</strong></li>
                  <li>2. Click <strong>Import/Update Client</strong></li>
                  <li>3. Click <strong>Download Client Update Template</strong></li>
                  <li>4. Upload that file here</li>
                </>}
                {importType === 'staff' && <>
                  <li>1. Go to <strong>Integrations → CSV Import</strong></li>
                  <li>2. Click <strong>Import/Update Staff</strong></li>
                  <li>3. Click <strong>Download Staff Update Template</strong></li>
                  <li>4. Upload that file here</li>
                </>}
                {importType === 'incidents' && <>
                  <li>1. Go to <strong>Incidents → Tickets</strong></li>
                  <li>2. Click the <strong>three dots</strong> icon (top right)</li>
                  <li>3. Select <strong>Bulk Export as CSV</strong></li>
                  <li>4. Download from <strong>Reports → Download Center</strong></li>
                  <li>5. Upload that file here</li>
                </>}
              </ol>
            </div>
          </div>
        </div>
      )}

      {/* ─── STEP 3: PREVIEW ─── */}
      {step === 'preview' && config && (
        <div className="space-y-4">
          {/* Summary */}
          <div className="bg-white/80 rounded-2xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${config.color} flex items-center justify-center shadow-lg ${config.shadow}`}>
                  <config.icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-bold text-gray-900">{fileName}</p>
                  <p className="text-sm text-gray-500">{mappedData.length} records found · {detectedColumns.length} columns detected</p>
                </div>
              </div>
            </div>

            {/* Column mapping report */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                <p className="text-xs font-bold text-emerald-700 uppercase tracking-wider mb-2">Mapped Columns ({detectedColumns.length - unmappedColumns.length})</p>
                <div className="flex flex-wrap gap-1.5">
                  {detectedColumns.filter(h => config.columnMap[h]).map(h => (
                    <span key={h} className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-emerald-700 border border-emerald-200 flex items-center gap-1">
                      <Check size={10} /> {h} → {config.columnMap[h]}
                    </span>
                  ))}
                </div>
              </div>
              {unmappedColumns.length > 0 && (
                <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                  <p className="text-xs font-bold text-amber-700 uppercase tracking-wider mb-2">Skipped Columns ({unmappedColumns.length})</p>
                  <div className="flex flex-wrap gap-1.5">
                    {unmappedColumns.map(h => (
                      <span key={h} className="px-2 py-1 bg-white rounded-lg text-xs font-medium text-amber-700 border border-amber-200">
                        {h}
                      </span>
                    ))}
                  </div>
                  <p className="text-[10px] text-amber-600 mt-2">These columns don't map to any field and will be ignored.</p>
                </div>
              )}
            </div>

            {/* Validation */}
            {(() => {
              const invalid = mappedData.filter(row => config.required.some(f => !row[f]))
              if (invalid.length === 0) return (
                <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200 flex items-center gap-2 text-sm text-emerald-700 font-semibold">
                  <CheckCircle2 size={16} /> All {mappedData.length} records pass validation
                </div>
              )
              return (
                <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 flex items-center gap-2 text-sm text-amber-700 font-semibold">
                  <AlertTriangle size={16} /> {invalid.length} record{invalid.length !== 1 ? 's' : ''} missing required fields ({config.required.join(', ')}) — these will be skipped
                </div>
              )
            })()}
          </div>

          {/* Data preview table */}
          <div className="bg-white/80 rounded-xl border border-gray-200 shadow-sm backdrop-blur-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Preview (first 10 rows)</p>
              <p className="text-xs text-gray-400">{mappedData.length} total records</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50">
                    <th className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase">#</th>
                    {[...new Set(Object.values(config.columnMap))].slice(0, 8).map(col => (
                      <th key={col} className="px-4 py-2.5 text-left text-xs font-bold text-gray-500 uppercase whitespace-nowrap">
                        {col.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {mappedData.slice(0, 10).map((row, i) => {
                    const isValid = !config.required.some(f => !row[f])
                    return (
                      <tr key={i} className={`border-t border-gray-50 ${!isValid ? 'bg-red-50/50' : 'hover:bg-gray-50'}`}>
                        <td className="px-4 py-2.5 text-xs text-gray-400">
                          <div className="flex items-center gap-1.5">
                            {isValid ? <Check size={12} className="text-emerald-500" /> : <XCircle size={12} className="text-red-500" />}
                            {i + 1}
                          </div>
                        </td>
                        {[...new Set(Object.values(config.columnMap))].slice(0, 8).map(col => (
                          <td key={col} className="px-4 py-2.5 text-xs text-gray-700 max-w-40 truncate">
                            {row[col] || <span className="text-gray-300">—</span>}
                          </td>
                        ))}
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Import button */}
          <div className="flex gap-3">
            <button onClick={() => setStep('upload')} className="px-6 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all">
              Back
            </button>
            <button onClick={handleImport}
              className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2">
              <Upload size={18} /> Import {mappedData.filter(row => !config.required.some(f => !row[f])).length} Records
            </button>
          </div>
        </div>
      )}

      {/* ─── STEP 3.5: IMPORTING ─── */}
      {step === 'importing' && (
        <div className="bg-white/80 rounded-2xl border border-gray-200 p-12 shadow-sm backdrop-blur-sm text-center">
          <Loader2 size={48} className="text-orange-500 mx-auto mb-4 animate-spin" />
          <p className="text-xl font-black text-gray-900">Importing data...</p>
          <p className="text-gray-500 mt-2">Please don't close this page</p>
        </div>
      )}

      {/* ─── STEP 4: RESULTS ─── */}
      {step === 'done' && (
        <div className="space-y-4">
          <div className="bg-white/80 rounded-2xl border border-gray-200 p-8 shadow-sm backdrop-blur-sm text-center">
            {results.success > 0 ? (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-emerald-500 to-green-600 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-emerald-200">
                  <CheckCircle2 size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Import Complete!</h2>
                <p className="text-gray-500 mt-2">{results.success} {config?.label.toLowerCase()} imported successfully</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-red-500 to-rose-500 flex items-center justify-center mx-auto mb-4 shadow-xl shadow-red-200">
                  <XCircle size={32} className="text-white" />
                </div>
                <h2 className="text-2xl font-black text-gray-900">Import Failed</h2>
                <p className="text-gray-500 mt-2">No records were imported</p>
              </>
            )}

            <div className="flex justify-center gap-4 mt-6">
              <div className="px-5 py-3 bg-emerald-50 border border-emerald-200 rounded-xl">
                <p className="text-2xl font-black text-emerald-700">{results.success}</p>
                <p className="text-xs text-emerald-600 font-medium">Imported</p>
              </div>
              {results.skipped > 0 && (
                <div className="px-5 py-3 bg-amber-50 border border-amber-200 rounded-xl">
                  <p className="text-2xl font-black text-amber-700">{results.skipped}</p>
                  <p className="text-xs text-amber-600 font-medium">Skipped</p>
                </div>
              )}
              {results.errors.length > 0 && (
                <div className="px-5 py-3 bg-red-50 border border-red-200 rounded-xl">
                  <p className="text-2xl font-black text-red-700">{results.errors.length}</p>
                  <p className="text-xs text-red-600 font-medium">Errors</p>
                </div>
              )}
            </div>
          </div>

          {/* Error details */}
          {results.errors.length > 0 && (
            <div className="bg-white/80 rounded-xl border border-gray-200 p-5 shadow-sm backdrop-blur-sm">
              <p className="text-xs font-bold text-gray-400 uppercase tracking-wider mb-3">Error Details</p>
              <div className="space-y-1.5 max-h-60 overflow-y-auto">
                {results.errors.slice(0, 50).map((err, i) => (
                  <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-50 border border-red-100 text-xs">
                    <XCircle size={12} className="text-red-500 shrink-0" />
                    <span className="font-semibold text-red-700">Row {err.row}:</span>
                    <span className="text-red-600 truncate">{err.reason}</span>
                  </div>
                ))}
                {results.errors.length > 50 && (
                  <p className="text-xs text-gray-400 text-center py-2">...and {results.errors.length - 50} more</p>
                )}
              </div>
            </div>
          )}

          {/* Next steps */}
          <div className="flex gap-3">
            <button onClick={reset} className="flex-1 py-3 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg shadow-orange-200 hover:shadow-xl transition-all flex items-center justify-center gap-2">
              <Upload size={16} /> Import More Data
            </button>
            <Link to={importType === 'staff' ? '/admin/staff' : importType === 'incidents' ? '/admin/incidents' : '/admin/participants'}
              className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 rounded-xl text-sm font-bold text-gray-700 transition-all flex items-center justify-center gap-2">
              View {config?.label} <ArrowRight size={16} />
            </Link>
          </div>
        </div>
      )}
    </div>
  )
}