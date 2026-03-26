import { useState, useCallback, useEffect, useRef } from 'react'
import { Link } from 'react-router-dom'
import {
  Upload, FileText, Users, Shield, AlertTriangle, CheckCircle2,
  ArrowLeft, Download, X, ChevronRight, Loader2, UserPlus,
  ClipboardList, RefreshCw, Info, ArrowRight, Check, XCircle,
  Calendar, Pill, Target, FileSignature, DollarSign, Sparkles,
  Layers, Hash, Activity, Zap, ChevronDown, Eye, Clock
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div style={{
      background: base, backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
      border: `1px solid ${border}`, borderRadius: '1.25rem',
      boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)',
      transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
      ...style,
    }}
    onMouseEnter={hover ? e => {
      e.currentTarget.style.transform = 'translateY(-2px)'
      e.currentTarget.style.boxShadow = glow ? `0 16px 48px -8px ${glow}` : '0 12px 40px -8px rgba(0,0,0,0.12)'
    } : undefined}
    onMouseLeave={hover ? e => {
      e.currentTarget.style.transform = 'translateY(0)'
      e.currentTarget.style.boxShadow = glow ? `0 8px 32px -8px ${glow}` : '0 4px 24px -4px rgba(0,0,0,0.06)'
    } : undefined}
    {...p}>{children}</div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (<div style={{
    position: 'absolute', width: size, height: size, top, left, right, bottom,
    background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
    opacity: 0.12, borderRadius: '50%',
    animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
    pointerEvents: 'none', zIndex: 0,
  }} />)
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' } : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' } : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' } : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' } : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' } : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' } : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
    teal: dark ? { bg: 'rgba(20,184,166,0.15)', text: '#2dd4bf', border: 'rgba(20,184,166,0.3)' } : { bg: '#f0fdfa', text: '#0d9488', border: '#99f6e4' },
    orange: dark ? { bg: 'rgba(249,115,22,0.15)', text: '#fb923c', border: 'rgba(249,115,22,0.3)' } : { bg: '#fff7ed', text: '#ea580c', border: '#fed7aa' },
  }
  const pl = palettes[color] || palettes.gray
  return (<span style={{
    display: 'inline-flex', alignItems: 'center', gap: 4,
    padding: '4px 10px', borderRadius: 999, fontSize: 11, fontWeight: 700,
    background: pl.bg, color: pl.text, border: `1px solid ${pl.border}`,
    whiteSpace: 'nowrap',
  }}>{children}</span>)
}


/* ═══════════════════════════════════════════════════
   CSV PARSER — 100% PRESERVED
   ═══════════════════════════════════════════════════ */
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
  const result = []; let current = ''; let inQuotes = false
  for (let i = 0; i < line.length; i++) {
    const ch = line[i]
    if (ch === '"') { if (inQuotes && line[i + 1] === '"') { current += '"'; i++; continue }; inQuotes = !inQuotes; continue }
    if (ch === ',' && !inQuotes) { result.push(current); current = ''; continue }
    current += ch
  }
  result.push(current); return result
}

function parseDate(val) {
  if (!val) return null
  const slashMatch = val.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/)
  if (slashMatch) {
    const [, a, b, y] = slashMatch
    let day, month
    if (+a > 12) { day = +a; month = +b } else if (+b > 12) { day = +b; month = +a } else { day = +a; month = +b }
    const date = new Date(y, month - 1, day)
    if (!isNaN(date)) return date.toISOString().split('T')[0]
  }
  const isoMatch = val.match(/^\d{4}-\d{2}-\d{2}/)
  if (isoMatch) return isoMatch[0]
  const d = new Date(val)
  if (!isNaN(d)) return d.toISOString().split('T')[0]
  return null
}

function parseDateTime(val) {
  if (!val) return null
  const d = new Date(val)
  if (!isNaN(d)) return d.toISOString()
  const dateStr = parseDate(val)
  if (dateStr) return dateStr + 'T00:00:00'
  return null
}


/* ═══ Normalizers — 100% PRESERVED ═══ */
function normalizeStatus(val) { if (!val) return null; const lower = val.toLowerCase().trim(); if (['active', 'open', 'current'].includes(lower)) return 'active'; if (['inactive', 'closed', 'archived', 'disabled'].includes(lower)) return 'inactive'; if (['on leave', 'on_leave', 'leave'].includes(lower)) return 'on_leave'; if (['resolved', 'complete', 'completed'].includes(lower)) return 'resolved'; if (['in progress', 'in_progress', 'pending'].includes(lower)) return 'in_progress'; if (['scheduled', 'upcoming'].includes(lower)) return 'scheduled'; if (['draft'].includes(lower)) return 'draft'; return lower.replace(/\s+/g, '_') }
function normalizeSeverity(val) { if (!val) return 'medium'; const lower = val.toLowerCase().trim(); if (['low', 'minor'].includes(lower)) return 'low'; if (['medium', 'moderate', 'normal'].includes(lower)) return 'medium'; if (['high', 'major', 'serious'].includes(lower)) return 'high'; if (['critical', 'urgent', 'extreme', 'severe'].includes(lower)) return 'critical'; return 'medium' }
function normalizeIncidentType(val) { if (!val) return 'other'; const lower = val.toLowerCase().trim().replace(/\s+/g, '_'); const validTypes = ['injury', 'medication_error', 'behaviour_of_concern', 'property_damage', 'abuse_neglect', 'unauthorized_restrictive_practice', 'death', 'sexual_misconduct', 'near_miss', 'hazard', 'concern', 'other']; if (validTypes.includes(lower)) return lower; if (lower.includes('medic')) return 'medication_error'; if (lower.includes('injur') || lower.includes('fall') || lower.includes('hurt')) return 'injury'; if (lower.includes('behav') || lower.includes('verbal') || lower.includes('aggress')) return 'behaviour_of_concern'; if (lower.includes('property') || lower.includes('damage')) return 'property_damage'; if (lower.includes('abuse') || lower.includes('neglect') || lower.includes('safeguard')) return 'abuse_neglect'; if (lower.includes('restrict')) return 'unauthorized_restrictive_practice'; if (lower.includes('sexual')) return 'sexual_misconduct'; if (lower.includes('near') || lower.includes('miss')) return 'near_miss'; if (lower.includes('hazard')) return 'hazard'; return 'other' }
function normalizeRole(val) { if (!val) return 'staff'; const lower = val.toLowerCase().trim(); if (lower.includes('admin') || lower.includes('manager') || lower.includes('coordinator')) return 'admin'; return 'staff' }
function normalizeEmployment(val) { if (!val) return null; const lower = val.toLowerCase().trim(); if (lower.includes('full')) return 'full_time'; if (lower.includes('part')) return 'part_time'; if (lower.includes('casual')) return 'casual'; if (lower.includes('contract')) return 'contract'; return lower.replace(/\s+/g, '_') }
function normalizeRoute(val) { if (!val) return 'Oral'; const lower = val.toLowerCase().trim(); if (lower.includes('oral') || lower.includes('mouth')) return 'Oral'; if (lower.includes('topical') || lower.includes('skin') || lower.includes('cream')) return 'Topical'; if (lower.includes('inhal') || lower.includes('puff')) return 'Inhaled'; if (lower.includes('inject') || lower.includes('subcut') || lower.includes('intramuscul')) return 'Injection'; if (lower.includes('sublingual') || lower.includes('under tongue')) return 'Sublingual'; if (lower.includes('eye') || lower.includes('ophthal')) return 'Eye drops'; if (lower.includes('ear') || lower.includes('otic')) return 'Ear drops'; if (lower.includes('nasal') || lower.includes('nose')) return 'Nasal'; if (lower.includes('patch') || lower.includes('transdermal')) return 'Transdermal'; return 'Oral' }


/* ═══════════════════════════════════════════════════
   IMPORT_TYPES CONFIG — 100% PRESERVED
   (all column maps, required fields, defaults, postProcess functions)
   ═══════════════════════════════════════════════════ */
const IMPORT_TYPES = {
  participants: {
    label: 'Participants (Clients)', icon: Users, color: '#f97316', grad: 'linear-gradient(135deg, #f97316, #f59e0b)', glow: 'rgba(249,115,22,0.15)',
    description: 'Import participants from ShiftCare, SupportAbility, or any CSV with client data.',
    compatibleWith: ['ShiftCare', 'SupportAbility', 'Lumary', 'Generic CSV'],
    table: 'participants',
    columnMap: { 'First Name': 'first_name', 'Last Name': 'last_name', 'first_name': 'first_name', 'last_name': 'last_name', 'FirstName': 'first_name', 'LastName': 'last_name', 'name': '_full_name', 'Name': '_full_name', 'Full Name': '_full_name', 'Client Name': '_full_name', 'Participant Name': '_full_name', 'Email': 'email', 'email': 'email', 'Email Address': 'email', 'Phone': 'phone', 'phone': 'phone', 'Mobile': 'phone', 'mobile': 'phone', 'Phone Number': 'phone', 'Mobile Phone': 'phone', 'Contact Number': 'phone', 'Home Phone': 'phone', 'Address': 'address', 'address': 'address', 'Street Address': 'address', 'Home Address': 'address', 'Residential Address': 'address', 'Date of Birth': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'DOB': 'date_of_birth', 'dob': 'date_of_birth', 'Date Of Birth': 'date_of_birth', 'Birth Date': 'date_of_birth', 'NDIS Number': 'ndis_number', 'ndis_number': 'ndis_number', 'NDIA Number': 'ndis_number', 'NDIS number': 'ndis_number', 'NDIS': 'ndis_number', 'ndia': 'ndis_number', 'NDIA': 'ndis_number', 'reference_number': 'ndis_number', 'Participant Number': 'ndis_number', 'Client Number': 'ndis_number', 'Client ID': 'ndis_number', 'Gender': 'gender', 'gender': 'gender', 'Sex': 'gender', 'Emergency Contact Name': 'emergency_contact_name', 'emergency_contact_name': 'emergency_contact_name', 'Emergency Contact': 'emergency_contact_name', 'carer': 'emergency_contact_name', 'Carer': 'emergency_contact_name', 'Next of Kin': 'emergency_contact_name', 'NOK Name': 'emergency_contact_name', 'Emergency Contact Phone': 'emergency_contact_phone', 'emergency_contact_phone': 'emergency_contact_phone', 'NOK Phone': 'emergency_contact_phone', 'Next of Kin Phone': 'emergency_contact_phone', 'Emergency Contact Relationship': 'emergency_contact_relationship', 'relation': 'emergency_contact_relationship', 'Relation': 'emergency_contact_relationship', 'Relationship': 'emergency_contact_relationship', 'NOK Relationship': 'emergency_contact_relationship', 'Notes': 'notes', 'notes': 'notes', 'Comments': 'notes', 'Additional Notes': 'notes', 'Status': 'status', 'status': 'status', 'Suburb': '_suburb', 'suburb': '_suburb', 'City': '_suburb', 'Town': '_suburb', 'State': '_state', 'state': '_state', 'Postcode': '_postcode', 'postcode': '_postcode', 'Post Code': '_postcode', 'Zip': '_postcode', 'Funding Type': 'funding_type', 'funding_type': 'funding_type', 'Plan Type': 'funding_type', 'NDIS Plan Type': 'funding_type', 'Plan Managed': 'funding_type', 'Plan Start Date': 'plan_start_date', 'plan_start_date': 'plan_start_date', 'Plan Start': 'plan_start_date', 'Plan End Date': 'plan_end_date', 'plan_end_date': 'plan_end_date', 'Plan End': 'plan_end_date', 'Plan Expiry': 'plan_end_date', 'plan_expiry_date': 'plan_end_date', 'Plan Budget': 'plan_budget', 'plan_budget': 'plan_budget', 'Budget': 'plan_budget', 'Total Budget': 'plan_budget', 'Support Coordinator': 'support_coordinator', 'support_coordinator': 'support_coordinator', 'Coordinator': 'support_coordinator', 'Plan Manager': 'plan_manager_name', 'plan_manager_name': 'plan_manager_name', 'Plan Manager Name': 'plan_manager_name', 'salutation': '_skip', 'client_types': '_skip', 'client_id': '_skip', 'area': '_skip' },
    required: ['first_name', 'last_name'], defaults: { status: 'active' },
  },
  staff: {
    label: 'Staff Members', icon: Shield, color: '#14b8a6', grad: 'linear-gradient(135deg, #14b8a6, #06b6d4)', glow: 'rgba(20,184,166,0.15)',
    description: 'Import staff from ShiftCare, SupportAbility, or any CSV with employee data.',
    compatibleWith: ['ShiftCare', 'SupportAbility', 'Lumary', 'Generic CSV'],
    table: 'staff',
    columnMap: { 'First Name': 'first_name', 'Last Name': 'last_name', 'first_name': 'first_name', 'last_name': 'last_name', 'FirstName': 'first_name', 'LastName': 'last_name', 'name': '_full_name', 'Name': '_full_name', 'Full Name': '_full_name', 'Staff Name': '_full_name', 'Employee Name': '_full_name', 'Worker Name': '_full_name', 'Email': 'email', 'email': 'email', 'Email Address': 'email', 'Work Email': 'email', 'Phone': 'phone', 'phone': 'phone', 'Mobile': 'phone', 'mobile': 'phone', 'Phone Number': 'phone', 'Mobile Phone': 'phone', 'Contact Number': 'phone', 'Work Phone': 'phone', 'Address': 'address', 'address': 'address', 'Street Address': 'address', 'Home Address': 'address', 'Date of Birth': 'date_of_birth', 'date_of_birth': 'date_of_birth', 'DOB': 'date_of_birth', 'dob': 'date_of_birth', 'Date Of Birth': 'date_of_birth', 'Gender': 'gender', 'gender': 'gender', 'Role': 'role', 'role': 'role', 'Position': 'role', 'Job Title': 'role', 'Title': 'role', 'Employment Type': 'employment_type', 'employment_type': 'employment_type', 'EmploymentType': 'employment_type', 'Contract Type': 'employment_type', 'Emergency Contact Name': 'emergency_contact_name', 'emergency_contact_name': 'emergency_contact_name', 'Emergency Contact': 'emergency_contact_name', 'Emergency Contact Phone': 'emergency_contact_phone', 'emergency_contact_phone': 'emergency_contact_phone', 'Notes': 'notes', 'notes': 'notes', 'Comments': 'notes', 'Status': 'status', 'status': 'status', 'Start Date': 'start_date', 'start_date': 'start_date', 'Hire Date': 'start_date', 'Commenced': 'start_date', 'Suburb': '_suburb', 'State': '_state', 'Postcode': '_postcode', 'salutation': '_skip', 'user_id': '_skip', 'invited_by': '_skip', 'last_login': '_skip', 'area': '_skip' },
    required: ['first_name', 'last_name', 'email'], defaults: { status: 'active', role: 'staff' },
  },
  shifts: {
    label: 'Shifts / Bookings', icon: Calendar, color: '#3b82f6', grad: 'linear-gradient(135deg, #3b82f6, #6366f1)', glow: 'rgba(59,130,246,0.15)',
    description: 'Import shifts and bookings from ShiftCare or any rostering CSV export.',
    compatibleWith: ['ShiftCare', 'SupportAbility', 'Generic CSV'],
    table: 'shifts',
    columnMap: { 'Date': 'shift_date', 'date': 'shift_date', 'Shift Date': 'shift_date', 'shift_date': 'shift_date', 'Booking Date': 'shift_date', 'Service Date': 'shift_date', 'Start': 'start_time', 'Start Time': 'start_time', 'start_time': 'start_time', 'From': 'start_time', 'Start DateTime': 'start_time', 'End': 'end_time', 'End Time': 'end_time', 'end_time': 'end_time', 'To': 'end_time', 'Finish': 'end_time', 'End DateTime': 'end_time', 'Finish Time': 'end_time', 'Staff': '_staff_name', 'Staff Name': '_staff_name', 'Worker': '_staff_name', 'Worker Name': '_staff_name', 'Carer': '_staff_name', 'Employee': '_staff_name', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name', 'Participant Name': '_participant_name', 'Service Type': 'service_type', 'service_type': 'service_type', 'Service': 'service_type', 'Type': 'service_type', 'Support Type': 'service_type', 'Category': 'service_type', 'Location': 'location', 'location': 'location', 'Address': 'location', 'Venue': 'location', 'Notes': 'notes', 'notes': 'notes', 'Comments': 'notes', 'Booking Notes': 'notes', 'Shift Notes': 'notes', 'Status': 'status', 'status': 'status', 'Title': 'title', 'title': 'title', 'Subject': 'title', 'Description': 'title', 'Clock In': 'clock_in', 'clock_in': 'clock_in', 'Actual Start': 'clock_in', 'Clock Out': 'clock_out', 'clock_out': 'clock_out', 'Actual End': 'clock_out', 'Actual Finish': 'clock_out', 'Duration': '_duration', 'Hours': '_duration', 'Total Hours': '_duration' },
    required: ['shift_date'], defaults: { status: 'scheduled' },
    postProcess: async (rows) => { const { data: staff } = await supabase.from('staff').select('id, first_name, last_name'); const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const staffMap = {}; (staff || []).forEach(s => { staffMap[`${s.first_name} ${s.last_name}`.toLowerCase()] = s.id }); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); return rows.map(row => { if (row._staff_name) { const match = staffMap[row._staff_name.toLowerCase()]; if (match) row.staff_id = match; delete row._staff_name }; if (row._participant_name) { const match = partMap[row._participant_name.toLowerCase()]; if (match) row.participant_id = match; delete row._participant_name }; if (row._duration) delete row._duration; if (row.shift_date) row.shift_date = parseDate(row.shift_date); if (row.start_time) row.start_time = parseDateTime(row.start_time); if (row.end_time) row.end_time = parseDateTime(row.end_time); if (row.clock_in) row.clock_in = parseDateTime(row.clock_in); if (row.clock_out) row.clock_out = parseDateTime(row.clock_out); if (row.status) row.status = normalizeStatus(row.status); return row }) },
  },
  incidents: {
    label: 'Incidents', icon: AlertTriangle, color: '#ef4444', grad: 'linear-gradient(135deg, #ef4444, #f43f5e)', glow: 'rgba(239,68,68,0.15)',
    description: 'Import incident records from ShiftCare or any incident reporting CSV.',
    compatibleWith: ['ShiftCare', 'SupportAbility', 'Generic CSV'],
    table: 'incidents',
    columnMap: { 'Ticket Name': 'description', 'title': 'description', 'Title': 'description', 'Name': 'description', 'Ticket Description': 'description', 'Description': 'description', 'description': 'description', 'Details': 'description', 'Incident Description': 'description', 'Category': 'incident_type', 'category': 'incident_type', 'Type': 'incident_type', 'type': 'incident_type', 'Incident Type': 'incident_type', 'Incident Category': 'incident_type', 'Status': 'status', 'status': 'status', 'Priority': 'severity', 'priority': 'severity', 'Severity': 'severity', 'severity': 'severity', 'Risk Level': 'severity', 'Date': 'incident_date', 'date': 'incident_date', 'Date Occurred': 'incident_date', 'Incident Date': 'incident_date', 'Created At': 'incident_date', 'created_at': 'incident_date', 'Due on': 'incident_date', 'Occurred On': 'incident_date', 'Time': 'incident_time', 'time': 'incident_time', 'Incident Time': 'incident_time', 'Time Occurred': 'incident_time', 'Location': 'location', 'location': 'location', 'Place': 'location', 'Immediate Action': 'immediate_action', 'immediate_action': 'immediate_action', 'Action Taken': 'immediate_action', 'Response': 'immediate_action', 'Follow Up': 'follow_up_notes', 'follow_up_notes': 'follow_up_notes', 'Follow Up Notes': 'follow_up_notes', 'Notes': 'follow_up_notes', 'notes': 'follow_up_notes', 'Comments': 'follow_up_notes', 'NDIS Reportable': 'ndis_reportable', 'Reportable': 'ndis_reportable', 'ndis_reportable': 'ndis_reportable', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name', 'Participant Name': '_participant_name', 'Reported By': '_reporter_name', 'Reporter': '_reporter_name', 'Staff': '_reporter_name' },
    required: ['description'], defaults: { status: 'open', severity: 'medium', incident_type: 'other' },
    postProcess: async (rows) => { const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const { data: staff } = await supabase.from('staff').select('id, first_name, last_name'); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); const staffMap = {}; (staff || []).forEach(s => { staffMap[`${s.first_name} ${s.last_name}`.toLowerCase()] = s.id }); return rows.map(row => { if (row._participant_name) { const m = partMap[row._participant_name.toLowerCase()]; if (m) row.participant_id = m; delete row._participant_name }; if (row._reporter_name) { const m = staffMap[row._reporter_name.toLowerCase()]; if (m) row.reported_by = m; delete row._reporter_name }; if (row.incident_date) row.incident_date = parseDateTime(row.incident_date) || new Date().toISOString(); if (row.severity) row.severity = normalizeSeverity(row.severity); if (row.incident_type) row.incident_type = normalizeIncidentType(row.incident_type); if (row.status) row.status = normalizeStatus(row.status); if (row.ndis_reportable) row.ndis_reportable = ['yes', 'true', '1', 'y'].includes(String(row.ndis_reportable).toLowerCase()); return row }) },
  },
  medications: {
    label: 'Medications', icon: Pill, color: '#8b5cf6', grad: 'linear-gradient(135deg, #8b5cf6, #6366f1)', glow: 'rgba(139,92,246,0.15)',
    description: 'Import medication records from any CSV with medication data.',
    compatibleWith: ['Generic CSV', 'SupportAbility'],
    table: 'medications',
    columnMap: { 'Medication': 'medication_name', 'Medication Name': 'medication_name', 'medication_name': 'medication_name', 'Drug': 'medication_name', 'Drug Name': 'medication_name', 'Medicine': 'medication_name', 'Dosage': 'dosage', 'dosage': 'dosage', 'Dose': 'dosage', 'Amount': 'dosage', 'Strength': 'dosage', 'Frequency': 'frequency', 'frequency': 'frequency', 'How Often': 'frequency', 'Schedule': 'frequency', 'Timing': 'frequency', 'Route': 'route', 'route': 'route', 'Administration Route': 'route', 'Method': 'route', 'Prescriber': 'prescriber', 'prescriber': 'prescriber', 'Doctor': 'prescriber', 'Prescribed By': 'prescriber', 'GP': 'prescriber', 'Physician': 'prescriber', 'Pharmacy': 'pharmacy', 'pharmacy': 'pharmacy', 'Dispensed By': 'pharmacy', 'Chemist': 'pharmacy', 'Start Date': 'start_date', 'start_date': 'start_date', 'Commenced': 'start_date', 'Date Started': 'start_date', 'End Date': 'expiry_date', 'end_date': 'expiry_date', 'Expiry': 'expiry_date', 'Expiry Date': 'expiry_date', 'Cease Date': 'expiry_date', 'Instructions': 'instructions', 'instructions': 'instructions', 'Directions': 'instructions', 'Special Instructions': 'instructions', 'Notes': 'instructions', 'PRN': 'is_prn', 'is_prn': 'is_prn', 'As Needed': 'is_prn', 'Witness Required': 'requires_witness', 'requires_witness': 'requires_witness', 'Witness': 'requires_witness', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name', 'Participant Name': '_participant_name', 'Patient': '_participant_name' },
    required: ['medication_name', 'dosage'], defaults: { status: 'active', route: 'Oral' },
    postProcess: async (rows) => { const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); return rows.map(row => { if (row._participant_name) { const m = partMap[row._participant_name.toLowerCase()]; if (m) row.participant_id = m; delete row._participant_name }; if (row.start_date) row.start_date = parseDate(row.start_date); if (row.expiry_date) row.expiry_date = parseDate(row.expiry_date); if (row.route) row.route = normalizeRoute(row.route); if (row.is_prn) row.is_prn = ['yes', 'true', '1', 'y', 'prn'].includes(String(row.is_prn).toLowerCase()); if (row.requires_witness) row.requires_witness = ['yes', 'true', '1', 'y'].includes(String(row.requires_witness).toLowerCase()); return row }) },
  },
  goals: {
    label: 'Goals', icon: Target, color: '#10b981', grad: 'linear-gradient(135deg, #10b981, #34d399)', glow: 'rgba(16,185,129,0.15)',
    description: 'Import NDIS goals from any CSV with goal/outcome data.',
    compatibleWith: ['Generic CSV', 'SupportAbility'],
    table: 'goals',
    columnMap: { 'Title': 'title', 'title': 'title', 'Goal': 'title', 'Goal Title': 'title', 'Outcome': 'title', 'Goal Name': 'title', 'Description': 'description', 'description': 'description', 'Details': 'description', 'Goal Description': 'description', 'Notes': 'description', 'Target Date': 'target_date', 'target_date': 'target_date', 'Due Date': 'target_date', 'Review Date': 'target_date', 'End Date': 'target_date', 'Status': 'status', 'status': 'status', 'Progress': 'progress', 'progress': 'progress', 'Completion': 'progress', '% Complete': 'progress', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name', 'Participant Name': '_participant_name' },
    required: ['title'], defaults: { status: 'active', progress: 0 },
    postProcess: async (rows) => { const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); return rows.map(row => { if (row._participant_name) { const m = partMap[row._participant_name.toLowerCase()]; if (m) row.participant_id = m; delete row._participant_name }; if (row.target_date) row.target_date = parseDate(row.target_date); if (row.progress) row.progress = parseInt(row.progress) || 0; if (row.status) row.status = normalizeStatus(row.status); return row }) },
  },
  service_agreements: {
    label: 'Service Agreements', icon: FileSignature, color: '#06b6d4', grad: 'linear-gradient(135deg, #06b6d4, #3b82f6)', glow: 'rgba(6,182,212,0.15)',
    description: 'Import service agreements from any CSV.',
    compatibleWith: ['Generic CSV'],
    table: 'service_agreements',
    columnMap: { 'Service Type': 'service_type', 'service_type': 'service_type', 'Service': 'service_type', 'Support Category': 'service_type', 'Category': 'service_type', 'Start Date': 'start_date', 'start_date': 'start_date', 'From': 'start_date', 'Commencement': 'start_date', 'End Date': 'end_date', 'end_date': 'end_date', 'To': 'end_date', 'Expiry': 'end_date', 'Hourly Rate': 'hourly_rate', 'hourly_rate': 'hourly_rate', 'Rate': 'hourly_rate', 'Unit Price': 'hourly_rate', 'Weekly Hours': 'weekly_hours', 'weekly_hours': 'weekly_hours', 'Hours Per Week': 'weekly_hours', 'Total Budget': 'total_budget', 'total_budget': 'total_budget', 'Budget': 'total_budget', 'Total': 'total_budget', 'Amount': 'total_budget', 'Status': 'status', 'status': 'status', 'Notes': 'notes', 'notes': 'notes', 'Comments': 'notes', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name', 'Participant Name': '_participant_name' },
    required: ['service_type', 'start_date'], defaults: { status: 'active' },
    postProcess: async (rows) => { const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); return rows.map(row => { if (row._participant_name) { const m = partMap[row._participant_name.toLowerCase()]; if (m) row.participant_id = m; delete row._participant_name }; if (row.start_date) row.start_date = parseDate(row.start_date); if (row.end_date) row.end_date = parseDate(row.end_date); if (row.hourly_rate) row.hourly_rate = parseFloat(String(row.hourly_rate).replace(/[$,]/g, '')) || null; if (row.weekly_hours) row.weekly_hours = parseFloat(row.weekly_hours) || null; if (row.total_budget) row.total_budget = parseFloat(String(row.total_budget).replace(/[$,]/g, '')) || null; if (row.status) row.status = normalizeStatus(row.status); return row }) },
  },
  documents: {
    label: 'Documents', icon: FileText, color: '#64748b', grad: 'linear-gradient(135deg, #64748b, #475569)', glow: 'rgba(100,116,139,0.12)',
    description: 'Import a register of documents (names, types, expiry dates).',
    compatibleWith: ['Generic CSV'],
    table: 'documents',
    columnMap: { 'Name': 'name', 'name': 'name', 'Document Name': 'name', 'Title': 'name', 'Document': 'name', 'File Name': 'name', 'Type': 'document_type', 'type': 'document_type', 'Document Type': 'document_type', 'Category': 'document_type', 'document_type': 'document_type', 'Expiry Date': 'expiry_date', 'expiry_date': 'expiry_date', 'Expiry': 'expiry_date', 'Expires': 'expiry_date', 'Due Date': 'expiry_date', 'Document Number': 'document_number', 'document_number': 'document_number', 'Number': 'document_number', 'Reference': 'document_number', 'Cert Number': 'document_number', 'Notes': 'notes', 'notes': 'notes', 'Comments': 'notes', 'Staff': '_staff_name', 'Staff Name': '_staff_name', 'Employee': '_staff_name', 'Client': '_participant_name', 'Client Name': '_participant_name', 'Participant': '_participant_name' },
    required: ['name'], defaults: { status: 'valid', document_type: 'other' },
    postProcess: async (rows) => { const { data: staff } = await supabase.from('staff').select('id, first_name, last_name'); const { data: participants } = await supabase.from('participants').select('id, first_name, last_name'); const staffMap = {}; (staff || []).forEach(s => { staffMap[`${s.first_name} ${s.last_name}`.toLowerCase()] = s.id }); const partMap = {}; (participants || []).forEach(p => { partMap[`${p.first_name} ${p.last_name}`.toLowerCase()] = p.id }); return rows.map(row => { if (row._staff_name) { const m = staffMap[row._staff_name.toLowerCase()]; if (m) row.staff_id = m; delete row._staff_name }; if (row._participant_name) { const m = partMap[row._participant_name.toLowerCase()]; if (m) row.participant_id = m; delete row._participant_name }; if (row.expiry_date) row.expiry_date = parseDate(row.expiry_date); if (row.document_type) row.document_type = row.document_type.toLowerCase().replace(/\s+/g, '_'); return row }) },
  },
}


/* ═══════════════════════════════════════
   COMPONENT
   ═══════════════════════════════════════ */
export default function Import() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [step, setStep] = useState('select')
  const [importType, setImportType] = useState(null)
  const [rawData, setRawData] = useState([])
  const [mappedData, setMappedData] = useState([])
  const [detectedColumns, setDetectedColumns] = useState([])
  const [unmappedColumns, setUnmappedColumns] = useState([])
  const [fileName, setFileName] = useState('')
  const [importing, setImporting] = useState(false)
  const [results, setResults] = useState({ success: 0, errors: [], skipped: 0 })
  const [dragOver, setDragOver] = useState(false)

  useEffect(() => { setTimeout(() => setLoaded(true), 50) }, [])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937', textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280', textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }

  const config = importType ? IMPORT_TYPES[importType] : null

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`, opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })


  /* ═══ ALL HANDLER LOGIC — 100% PRESERVED ═══ */
  const handleFile = useCallback((file) => {
    if (!file || !config) return
    setFileName(file.name)
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const text = e.target.result; const rows = parseCSVRows(text)
        if (rows.length === 0) { alert('No data found in file'); return }
        const headers = Object.keys(rows[0]); setDetectedColumns(headers)
        const unmapped = []; headers.forEach(h => { if (!config.columnMap[h]) unmapped.push(h) }); setUnmappedColumns(unmapped)
        const mapped = rows.map(row => {
          const obj = { ...config.defaults }
          headers.forEach(h => {
            const target = config.columnMap[h]
            if (target && target !== '_skip' && row[h]) {
              let val = row[h]
              if (target.includes('date') || target === 'date_of_birth') val = parseDate(val) || val
              if (target === 'status') val = normalizeStatus(val)
              if (target === 'role') val = normalizeRole(val)
              if (target === 'employment_type') val = normalizeEmployment(val)
              if (target === 'severity') val = normalizeSeverity(val)
              if (target === 'incident_type') val = normalizeIncidentType(val)
              obj[target] = val
            }
          })
          if (obj._suburb || obj._state || obj._postcode) { const parts = [obj.address, obj._suburb, obj._state, obj._postcode].filter(Boolean); obj.address = parts.join(', '); delete obj._suburb; delete obj._state; delete obj._postcode }
          if (obj._full_name && (!obj.first_name || !obj.last_name)) { const parts = obj._full_name.trim().split(/\s+/); if (!obj.first_name) obj.first_name = parts[0] || ''; if (!obj.last_name) obj.last_name = parts.slice(1).join(' ') || parts[0] || '' }
          Object.keys(obj).forEach(k => { if (k.startsWith('_')) delete obj[k]; if (obj[k] === '') delete obj[k] })
          return obj
        })
        setRawData(rows); setMappedData(mapped); setStep('preview')
      } catch (err) { console.error('Parse error:', err); alert('Failed to parse file: ' + err.message) }
    }
    reader.readAsText(file)
  }, [config])

  const handleDrop = useCallback((e) => { e.preventDefault(); setDragOver(false); const file = e.dataTransfer.files[0]; if (file) handleFile(file) }, [handleFile])

  const handleImport = async () => {
    if (!config || mappedData.length === 0) return
    setImporting(true); setStep('importing')
    const res = { success: 0, errors: [], skipped: 0 }
    let processedRows = mappedData.filter((row, idx) => { const missing = config.required.filter(f => !row[f]); if (missing.length > 0) { res.skipped++; res.errors.push({ row: idx + 2, reason: `Missing: ${missing.join(', ')}` }); return false }; return true })
    if (config.postProcess) { try { processedRows = await config.postProcess(processedRows) } catch (err) { console.error('PostProcess error:', err) } }
    const chunkSize = 50
    const NON_DB_KEYS = ['_full_name', '_staff_name', '_participant_name', '_reporter_name', '_suburb', '_state', '_postcode', '_skip', '_duration', '_salutation', '_plan_expiry', '_client_types', '_external_id', '_area', '_invited_by', '_last_login']
    for (let i = 0; i < processedRows.length; i += chunkSize) {
      const chunk = processedRows.slice(i, i + chunkSize)
      try {
        const cleaned = chunk.map(row => { const obj = {}; Object.entries(row).forEach(([k, v]) => { if (!k.startsWith('_') && !NON_DB_KEYS.includes(k)) obj[k] = v === '' ? null : v }); return obj })
        const { data, error } = await supabase.from(config.table).insert(cleaned).select()
        if (error) throw error; res.success += (data?.length || chunk.length)
      } catch (err) {
        for (let j = 0; j < chunk.length; j++) {
          try { const cleaned = {}; Object.entries(chunk[j]).forEach(([k, v]) => { if (!k.startsWith('_') && !NON_DB_KEYS.includes(k)) cleaned[k] = v === '' ? null : v }); const { error: singleErr } = await supabase.from(config.table).insert(cleaned); if (singleErr) res.errors.push({ row: i + j + 2, reason: singleErr.message }); else res.success++ } catch (e2) { res.errors.push({ row: i + j + 2, reason: e2.message }) }
        }
      }
    }
    setResults(res); setImporting(false); setStep('done')
  }

  const reset = () => { setStep('select'); setImportType(null); setRawData([]); setMappedData([]); setDetectedColumns([]); setUnmappedColumns([]); setFileName(''); setResults({ success: 0, errors: [], skipped: 0 }) }
  const viewPath = { participants: '/admin/participants', staff: '/admin/staff', incidents: '/admin/incidents', shifts: '/admin/roster', medications: '/admin/medications', goals: '/admin/participants', service_agreements: '/admin/service-agreements', documents: '/admin/participants' }


  /* ─────────────────────────────────────────────
     RENDER
     ───────────────────────────────────────────── */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>

      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes ping { 75%,100% { transform:scale(1.8);opacity:0 } }
        @keyframes pulse-dot { 0%,100% { opacity:1 } 50% { opacity:0.4 } }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
      `}</style>

      <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
      <Orb color="#3b82f6" size={280} bottom="15%" left="-60px" delay={2} />
      <Orb color="#10b981" size={200} top="45%" right="8%" delay={3.5} />
      <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>


        {/* ══════════ HERO HEADER ══════════ */}
        <div style={stg(0)}>
          <div style={{ borderRadius: 24, padding: '28px 24px', position: 'relative', overflow: 'hidden', background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)` }}>
            <div style={{ position: 'absolute', width: 300, height: 300, borderRadius: '50%', background: 'rgba(255,255,255,0.08)', top: -80, right: -40 }} />
            <div style={{ position: 'absolute', width: 180, height: 180, borderRadius: '50%', background: 'rgba(255,255,255,0.05)', bottom: -50, left: '25%' }} />
            <div style={{ position: 'absolute', inset: 0, backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '24px 24px', opacity: 0.5 }} />
            {[{ top: '15%', right: '20%', s: 4, d: 0 }, { top: '60%', right: '10%', s: 3, d: 1.5 }, { bottom: '25%', left: '35%', s: 5, d: 3 }].map((dot, i) => (
              <div key={i} style={{ position: 'absolute', borderRadius: '50%', background: 'rgba(255,255,255,0.2)', width: dot.s * 2, height: dot.s * 2, top: dot.top, right: dot.right, bottom: dot.bottom, left: dot.left, animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s` }} />
            ))}
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                  <Link to="/admin/dashboard" style={{ textDecoration: 'none', width: 42, height: 42, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'rgba(255,255,255,0.12)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.15)', flexShrink: 0 }}>
                    <ArrowLeft size={18} color="white" />
                  </Link>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                        <Upload size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Data Migration</span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '5px 12px', borderRadius: 999, background: 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)' }}>
                        <Sparkles size={13} style={{ color: 'rgba(255,255,255,0.7)' }} />
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'rgba(255,255,255,0.7)' }}>Auto-detect</span>
                      </div>
                    </div>
                    <h1 style={{ fontSize: 28, fontWeight: 900, color: 'white', letterSpacing: '-0.02em' }}>Import Data</h1>
                    <p style={{ fontSize: 14, color: 'rgba(255,255,255,0.5)', marginTop: 4 }}>Migrate from ShiftCare, SupportAbility, Lumary, or any CSV</p>
                  </div>
                </div>
                {step !== 'select' && step !== 'importing' && (
                  <button onClick={reset} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 18px', borderRadius: 14, border: 'none', background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)', color: 'white', fontSize: 13, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.25)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'rgba(255,255,255,0.15)'}>
                    <RefreshCw size={16} /> Start Over
                  </button>
                )}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 10, marginTop: 20 }}>
                {[
                  { icon: Layers, text: `${Object.keys(IMPORT_TYPES).length} data types` },
                  { icon: Sparkles, text: 'Auto column mapping' },
                  { icon: Shield, text: 'ShiftCare compatible', bg: 'rgba(16,185,129,0.25)' },
                  { icon: Zap, text: 'Bulk insert' },
                ].map((pill, i) => (
                  <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '7px 14px', borderRadius: 12, background: pill.bg || 'rgba(255,255,255,0.1)', backdropFilter: 'blur(8px)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <pill.icon size={14} style={{ color: 'rgba(255,255,255,0.8)' }} />
                    <span style={{ fontSize: 12, fontWeight: 600, color: 'white' }}>{pill.text}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>


        {/* ══════════ STEP INDICATOR ══════════ */}
        <Glass dark={isDark} style={{ padding: '14px 18px', ...stg(1) }}>
      <div className="no-scrollbar" style={{ display: 'flex', alignItems: 'center', gap: 6, overflowX: 'auto', WebkitOverflowScrolling: 'touch' }}>
            {['Select Type', 'Upload File', 'Preview', 'Import'].map((label, idx) => {
              const steps = ['select', 'upload', 'preview', 'done']
              const stepIdx = steps.indexOf(step === 'importing' ? 'done' : step)
              const isActive = idx === stepIdx
              const isDone = idx < stepIdx
              return (
                <div key={label} style={{ display: 'flex', alignItems: 'center', gap: 8, flex: 1 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 12,
                    flex: 1, fontSize: 12, fontWeight: 700, transition: 'all .3s',
                    background: isActive ? `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` : isDone ? (isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5') : dk.subtleBg2,
                    color: isActive ? 'white' : isDone ? '#059669' : dk.textFaint,
                    border: isDone ? `1px solid ${isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0'}` : isActive ? 'none' : 'none',
                    boxShadow: isActive ? `0 4px 16px -4px ${c.primary}50` : 'none',
                  }}>
                    {isDone ? <Check size={14} /> : <span style={{ width: 20, height: 20, borderRadius: 6, background: isActive ? 'rgba(255,255,255,0.2)' : dk.subtleBg2, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 10, fontWeight: 800 }}>{idx + 1}</span>}
                    <span style={{ display: 'none', '@media (min-width: 640px)': { display: 'inline' } }}>{label}</span>
                    <span className="hidden sm:inline">{label}</span>
                    <span className="sm:hidden">{label.split(' ')[0]}</span>
                  </div>
                  {idx < 3 && <ChevronRight size={14} style={{ color: dk.textFaint, flexShrink: 0 }} />}
                </div>
              )
            })}
          </div>
        </Glass>


        {/* ══════════ STEP 1: SELECT TYPE ══════════ */}
        {step === 'select' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(2) }}>

            {/* Migration info */}
            <Glass dark={isDark} glow="rgba(59,130,246,0.1)" style={{ padding: '18px 22px', borderColor: isDark ? 'rgba(59,130,246,0.15)' : 'rgba(59,130,246,0.2)' }}>
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 14 }}>
                <div style={{ width: 44, height: 44, borderRadius: 12, flexShrink: 0, background: 'linear-gradient(135deg, #3b82f6, #06b6d4)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 6px 20px -4px rgba(59,130,246,0.4)' }}>
                  <Info size={22} color="white" />
                </div>
                <div>
                  <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>Migrating from another platform?</p>
                  <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 4, lineHeight: 1.5 }}>We support imports from <strong>ShiftCare</strong>, <strong>SupportAbility</strong>, <strong>Lumary</strong>, and any generic CSV. Export your data from your current system and upload it here — we'll automatically map the columns.</p>
                </div>
              </div>
            </Glass>

            {/* Type grid */}
            <Glass dark={isDark} glow={`${c.primary}08`} style={{ padding: '22px' }}>
              <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 16 }}>What are you importing?</p>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: 12 }}>
                {Object.entries(IMPORT_TYPES).map(([key, type]) => (
                  <Glass key={key} dark={isDark} hover glow={type.glow} style={{ padding: '20px', cursor: 'pointer' }}
                    onClick={() => { setImportType(key); setStep('upload') }}>
                    <div style={{ width: 48, height: 48, borderRadius: 14, background: type.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${type.color}40`, marginBottom: 14 }}>
                      <type.icon size={22} color="white" />
                    </div>
                    <p style={{ fontWeight: 700, color: dk.text, fontSize: 14 }}>{type.label}</p>
                    <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 4 }}>{type.compatibleWith.join(' · ')}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 10, fontSize: 12, fontWeight: 700, color: c.primary, opacity: 0 }}>Select <ArrowRight size={12} /></div>
                  </Glass>
                ))}
              </div>
            </Glass>

            {/* Templates */}
            <Glass dark={isDark} style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14 }}>
                <Download size={16} style={{ color: dk.textMuted }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>Download Blank Templates</p>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                {Object.entries(IMPORT_TYPES).map(([key, type]) => {
                  const cols = [...new Set(Object.values(type.columnMap).filter(v => !v.startsWith('_')))].join(',')
                  return (
                    <button key={key} onClick={() => { const blob = new Blob([cols + '\n'], { type: 'text/csv' }); const url = URL.createObjectURL(blob); const a = document.createElement('a'); a.href = url; a.download = `${key}_template.csv`; a.click(); URL.revokeObjectURL(url) }}
                      style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 14px', borderRadius: 10, background: dk.subtleBg2, border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 12, fontWeight: 700, cursor: 'pointer', transition: 'all .2s' }}
                      onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                      onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                      <Download size={12} /> {type.label}
                    </button>
                  )
                })}
              </div>
            </Glass>
          </div>
        )}


        {/* ══════════ STEP 2: UPLOAD ══════════ */}
        {step === 'upload' && config && (
          <Glass dark={isDark} glow={config.glow} style={{ ...stg(2), padding: '28px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 24 }}>
              <div style={{ width: 52, height: 52, borderRadius: 16, background: config.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${config.color}40`, flexShrink: 0 }}>
                <config.icon size={24} color="white" />
              </div>
              <div>
                <p style={{ fontWeight: 700, color: dk.text, fontSize: 16 }}>Import {config.label}</p>
                <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>{config.description}</p>
                <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                  {config.compatibleWith.map(p => (
                    <Badge key={p} color="gray" dark={isDark}>{p}</Badge>
                  ))}
                </div>
              </div>
            </div>

            {/* Drop zone */}
            <div onDragOver={(e) => { e.preventDefault(); setDragOver(true) }} onDragLeave={() => setDragOver(false)} onDrop={handleDrop}
              onClick={() => document.getElementById('csv-input').click()}
              style={{
                border: `2px dashed ${dragOver ? c.primary : dk.inputBorder}`,
                borderRadius: 20, padding: '56px 24px', textAlign: 'center', cursor: 'pointer',
                background: dragOver ? `${c.primary}08` : 'transparent', transition: 'all .3s',
              }}
              onMouseEnter={e => { if (!dragOver) e.currentTarget.style.borderColor = c.primary }}
              onMouseLeave={e => { if (!dragOver) e.currentTarget.style.borderColor = dk.inputBorder }}>
              <input id="csv-input" type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={(e) => { if (e.target.files[0]) handleFile(e.target.files[0]) }} />
              <div style={{ width: 64, height: 64, borderRadius: 18, background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`, border: `1px solid ${c.primary}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px' }}>
                <Upload size={28} style={{ color: dragOver ? c.primary : dk.textFaint }} />
              </div>
              <p style={{ fontWeight: 700, fontSize: 18, color: dk.text }}>Drop your CSV file here</p>
              <p style={{ fontSize: 14, color: dk.textMuted, marginTop: 6 }}>or click to browse</p>
              <p style={{ fontSize: 12, color: dk.textFaint, marginTop: 12 }}>Works with exports from ShiftCare, SupportAbility, Lumary, and standard CSV</p>
            </div>

            {/* Export instructions */}
            <Glass dark={isDark} glow="rgba(245,158,11,0.08)" style={{ marginTop: 20, padding: '18px 22px', borderColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.25)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 12 }}>
                <AlertTriangle size={14} style={{ color: '#f59e0b' }} />
                <p style={{ fontSize: 13, fontWeight: 700, color: isDark ? '#fbbf24' : '#92400e' }}>How to export from your current system:</p>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
                {[
                  { name: 'ShiftCare', desc: 'Integrations → CSV Import → Download Template' },
                  { name: 'SupportAbility', desc: 'Reports → Export → Select data type → CSV' },
                  { name: 'Lumary', desc: 'Admin → Data Export → Select module → Download' },
                  { name: 'Generic CSV', desc: 'Any spreadsheet saved as .csv — we auto-detect columns' },
                ].map(item => (
                  <div key={item.name} style={{ padding: '12px 14px', borderRadius: 12, background: dk.subtleBg, border: `1px solid ${dk.subtleBg2}` }}>
                    <p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>{item.name}</p>
                    <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 3 }}>{item.desc}</p>
                  </div>
                ))}
              </div>
            </Glass>
          </Glass>
        )}


        {/* ══════════ STEP 3: PREVIEW ══════════ */}
        {step === 'preview' && config && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(2) }}>

            {/* File info + column status */}
            <Glass dark={isDark} glow={config.glow} style={{ padding: '22px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 18 }}>
                <div style={{ width: 48, height: 48, borderRadius: 14, background: config.grad, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 6px 20px -4px ${config.color}40`, flexShrink: 0 }}>
                  <config.icon size={22} color="white" />
                </div>
                <div>
                  <p style={{ fontWeight: 700, color: dk.text, fontSize: 15 }}>{fileName}</p>
                  <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 2 }}>{mappedData.length} records · {detectedColumns.length} columns detected</p>
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 14, marginBottom: 16 }}>
                <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: '16px 18px', borderColor: isDark ? 'rgba(16,185,129,0.15)' : 'rgba(16,185,129,0.25)' }}>
                  <p style={{ fontSize: 11, fontWeight: 700, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Mapped ({detectedColumns.length - unmappedColumns.length})</p>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {detectedColumns.filter(h => config.columnMap[h] && config.columnMap[h] !== '_skip').map(h => (
                      <span key={h} style={{ display: 'flex', alignItems: 'center', gap: 4, padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', color: '#059669', border: `1px solid ${isDark ? 'rgba(16,185,129,0.15)' : '#a7f3d0'}` }}>
                        <Check size={10} /> {h}
                      </span>
                    ))}
                  </div>
                </Glass>
                {unmappedColumns.length > 0 && (
                  <Glass dark={isDark} glow="rgba(245,158,11,0.08)" style={{ padding: '16px 18px', borderColor: isDark ? 'rgba(245,158,11,0.15)' : 'rgba(245,158,11,0.25)' }}>
                    <p style={{ fontSize: 11, fontWeight: 700, color: '#d97706', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 8 }}>Skipped ({unmappedColumns.length})</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                      {unmappedColumns.map(h => (
                        <span key={h} style={{ padding: '4px 10px', borderRadius: 8, fontSize: 11, fontWeight: 600, background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', color: '#d97706', border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#fde68a'}` }}>{h}</span>
                      ))}
                    </div>
                  </Glass>
                )}
              </div>

              {/* Validation */}
              {(() => {
                const invalid = mappedData.filter(row => config.required.some(f => !row[f]))
                return invalid.length === 0 ? (
                  <div style={{ padding: '14px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(16,185,129,0.08)' : '#ecfdf5', border: `1px solid ${isDark ? 'rgba(16,185,129,0.15)' : '#a7f3d0'}`, color: '#059669', fontSize: 13, fontWeight: 700 }}>
                    <CheckCircle2 size={18} /> All {mappedData.length} records valid and ready to import
                  </div>
                ) : (
                  <div style={{ padding: '14px 18px', borderRadius: 14, display: 'flex', alignItems: 'center', gap: 8, background: isDark ? 'rgba(245,158,11,0.08)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(245,158,11,0.15)' : '#fde68a'}`, color: '#d97706', fontSize: 13, fontWeight: 700 }}>
                    <AlertTriangle size={18} /> {invalid.length} records missing required fields — will be skipped
                  </div>
                )
              })()}
            </Glass>

            {/* Data table */}
            <Glass dark={isDark} style={{ padding: 0, overflow: 'hidden', maxWidth: '100vw' }}>
              <div style={{ padding: '14px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: `1px solid ${dk.divider}` }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>Preview (first 10)</p>
                <p style={{ fontSize: 12, color: dk.textFaint }}>{mappedData.length} total rows</p>
              </div>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: dk.subtleBg2 }}>
                      <th style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${dk.divider}` }}>#</th>
                      {[...new Set(Object.values(config.columnMap).filter(v => !v.startsWith('_')))].slice(0, 8).map(col => (
                        <th key={col} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', whiteSpace: 'nowrap', borderBottom: `1px solid ${dk.divider}` }}>
                          {col.replace(/_/g, ' ')}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {mappedData.slice(0, 10).map((row, i) => {
                      const valid = !config.required.some(f => !row[f])
                      return (
                        <tr key={i} style={{ borderTop: i > 0 ? `1px solid ${dk.divider}` : 'none', background: !valid ? (isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)') : 'transparent' }}
                          onMouseEnter={e => e.currentTarget.style.background = dk.subtleBg}
                          onMouseLeave={e => e.currentTarget.style.background = !valid ? (isDark ? 'rgba(239,68,68,0.04)' : 'rgba(239,68,68,0.02)') : 'transparent'}>
                          <td style={{ padding: '10px 14px', color: dk.textFaint, whiteSpace: 'nowrap' }}>
                            {valid ? <Check size={12} style={{ color: '#10b981', display: 'inline' }} /> : <XCircle size={12} style={{ color: '#ef4444', display: 'inline' }} />} {i + 1}
                          </td>
                          {[...new Set(Object.values(config.columnMap).filter(v => !v.startsWith('_')))].slice(0, 8).map(col => (
                            <td key={col} style={{ padding: '10px 14px', color: dk.textSoft, whiteSpace: 'nowrap', maxWidth: 180, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {row[col] || <span style={{ color: dk.textFaint }}>—</span>}
                            </td>
                          ))}
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </Glass>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setStep('upload')} style={{ padding: '16px 24px', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>Back</button>
              <button onClick={handleImport} style={{ flex: 1, padding: '16px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px -6px ${c.primary}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8, transition: 'all .2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-1px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}>
                <Upload size={18} /> Import {mappedData.filter(row => !config.required.some(f => !row[f])).length} Records
              </button>
            </div>
          </div>
        )}


        {/* ══════════ IMPORTING ══════════ */}
        {step === 'importing' && (
          <Glass dark={isDark} glow={`${c.primary}15`} style={{ ...stg(2), padding: '56px 24px', textAlign: 'center' }}>
            <div style={{ position: 'relative', width: 80, height: 80, margin: '0 auto 20px' }}>
              <div style={{ width: 80, height: 80, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: `0 0 40px ${c.primary}40` }}>
                <Upload size={32} color="white" />
              </div>
              <div style={{ position: 'absolute', inset: 0, borderRadius: 22, background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite', opacity: 0.3 }} />
            </div>
            <p style={{ fontSize: 22, fontWeight: 900, color: dk.text }}>Importing data...</p>
            <p style={{ fontSize: 14, color: dk.textMuted, marginTop: 6 }}>Please don't close this page</p>
            <div style={{ width: 200, height: 4, borderRadius: 999, margin: '24px auto 0', overflow: 'hidden', background: dk.subtleBg2 }}>
              <div style={{ width: '40%', height: '100%', borderRadius: 999, background: `linear-gradient(90deg, transparent, ${c.primary}, transparent)`, backgroundSize: '200% 100%', animation: 'shimmer 1.5s linear infinite' }} />
            </div>
          </Glass>
        )}


        {/* ══════════ DONE ══════════ */}
        {step === 'done' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16, ...stg(2) }}>
            <Glass dark={isDark} glow={results.success > 0 ? 'rgba(16,185,129,0.15)' : 'rgba(239,68,68,0.15)'} style={{ padding: '40px 24px', textAlign: 'center' }}>
              {results.success > 0 ? (<>
                <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: 'linear-gradient(135deg, #10b981, #34d399)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px -8px rgba(16,185,129,0.5)' }}><CheckCircle2 size={36} color="white" /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dk.text }}>Import Complete!</h2>
                <p style={{ fontSize: 14, color: dk.textMuted, marginTop: 6 }}>{results.success} records imported successfully</p>
              </>) : (<>
                <div style={{ width: 80, height: 80, borderRadius: 22, margin: '0 auto 20px', background: 'linear-gradient(135deg, #ef4444, #f87171)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 8px 32px -8px rgba(239,68,68,0.5)' }}><XCircle size={36} color="white" /></div>
                <h2 style={{ fontSize: 24, fontWeight: 900, color: dk.text }}>Import Failed</h2>
              </>)}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 16, marginTop: 24 }}>
                <Glass dark={isDark} glow="rgba(16,185,129,0.1)" style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#059669' }}>{results.success}</p>
                  <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 2 }}>Imported</p>
                </Glass>
                {results.skipped > 0 && <Glass dark={isDark} glow="rgba(245,158,11,0.1)" style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#d97706' }}>{results.skipped}</p>
                  <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 2 }}>Skipped</p>
                </Glass>}
                {results.errors.length > 0 && <Glass dark={isDark} glow="rgba(239,68,68,0.1)" style={{ padding: '16px 24px', textAlign: 'center' }}>
                  <p style={{ fontSize: 28, fontWeight: 900, color: '#ef4444' }}>{results.errors.length}</p>
                  <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 2 }}>Errors</p>
                </Glass>}
              </div>
            </Glass>

            {/* Error details */}
            {results.errors.length > 0 && (
              <Glass dark={isDark} glow="rgba(239,68,68,0.08)" style={{ padding: '22px' }}>
                <p style={{ fontSize: 11, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: 12 }}>Errors</p>
                <div style={{ maxHeight: 240, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 6 }}>
                  {results.errors.slice(0, 50).map((err, i) => (
                    <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 10, background: isDark ? 'rgba(239,68,68,0.06)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(239,68,68,0.12)' : '#fecaca'}`, fontSize: 12 }}>
                      <XCircle size={14} style={{ color: '#ef4444', flexShrink: 0 }} />
                      <span style={{ fontWeight: 700, color: '#ef4444' }}>Row {err.row}:</span>
                      <span style={{ color: isDark ? '#fca5a5' : '#b91c1c', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{err.reason}</span>
                    </div>
                  ))}
                </div>
              </Glass>
            )}

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={reset} style={{ flex: 1, padding: '16px 0', borderRadius: 14, border: 'none', background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', fontSize: 14, fontWeight: 700, cursor: 'pointer', boxShadow: `0 6px 24px -6px ${c.primary}50`, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Upload size={16} /> Import More
              </button>
              <Link to={viewPath[importType] || '/admin/dashboard'} style={{ textDecoration: 'none', flex: 1, padding: '16px 0', borderRadius: 14, background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9', border: `1px solid ${dk.inputBorder}`, color: dk.textMuted, fontSize: 14, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                View Data <ArrowRight size={16} />
              </Link>
            </div>
          </div>
        )}

      </div>
    </div>
  )
}