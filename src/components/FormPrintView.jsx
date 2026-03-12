import { useRef } from 'react'
import { Printer, Download, X } from 'lucide-react'

const LOGO_URL = 'https://ojobajaedarprixqecxr.supabase.co/storage/v1/object/public/documents/logo.png'

// Field layout definitions for all 6 built-in forms
const FORM_LAYOUTS = {
  hazard_report: {
    title: 'Hazard Form',
    color: '#f59e0b',
    sections: [
      { heading: 'Information', fields: ['persons_name', 'date', 'person_type', 'address', 'home_phone', 'mobile_phone'] },
      { heading: 'Hazard Details', fields: ['hazard_date', 'hazard_time', 'hazard_location', 'reported_to', 'reported_to_position', 'date_reported'] },
      { heading: 'Injury & Description', fields: ['anyone_injured', 'description', 'short_term_actions', 'suggestions'] },
      { heading: 'Signature', fields: ['signature'] },
      { heading: 'Manager to Complete', fields: ['hazard_category_text', 'manager_date', 'hazard_type', 'investigation_notes', 'outcome_evaluation', 'outcome_details', 'risk_score'] },
      { heading: 'Manager Sign-off', fields: ['manager_name', 'manager_signature', 'senior_manager_name', 'senior_manager_signature'] },
    ]
  },
  hazard_form: { alias: 'hazard_report' },
  incident_report: {
    title: 'Incident Report',
    color: '#f97316',
    sections: [
      { heading: 'Incident Details', fields: ['participant_name', 'date_of_incident', 'time_of_incident', 'location', 'incident_type', 'severity'] },
      { heading: 'Description', fields: ['description', 'immediate_actions', 'injuries_sustained', 'witnesses'] },
      { heading: 'Follow Up', fields: ['follow_up_required', 'follow_up_actions', 'reported_to', 'reported_date'] },
      { heading: 'Signature', fields: ['staff_name', 'signature', 'date'] },
    ]
  },
  medication_chart: {
    title: 'Medication Chart',
    color: '#3b82f6',
    sections: [
      { heading: 'Participant Details', fields: ['participant_name', 'date_of_birth', 'ndis_number', 'allergies', 'gp_name', 'gp_phone', 'pharmacy', 'pharmacy_phone'] },
      { heading: 'Medications', fields: ['medications'] },
      { heading: 'Administration Record', fields: ['administration_entries'] },
      { heading: 'Sign-off', fields: ['staff_name', 'signature', 'date'] },
    ]
  },
  medication_incident: {
    title: 'Medication Incident Report',
    color: '#ef4444',
    sections: [
      { heading: 'Incident Details', fields: ['participant_name', 'date_of_incident', 'time_of_incident', 'medication_name', 'prescribed_dose', 'error_type'] },
      { heading: 'Description', fields: ['description', 'actions_taken', 'outcome', 'gp_notified', 'gp_name', 'notification_time'] },
      { heading: 'Follow Up', fields: ['follow_up_actions', 'reported_to', 'reported_date'] },
      { heading: 'Signature', fields: ['staff_name', 'signature', 'date'] },
    ]
  },
  cash_reconciliation: {
    title: 'Cash Reconciliation',
    color: '#10b981',
    sections: [
      { heading: 'Details', fields: ['participant_name', 'date', 'staff_name', 'shift_date', 'location'] },
      { heading: 'Cash Items', fields: ['items', 'opening_balance', 'total_spent', 'closing_balance'] },
      { heading: 'Reconciliation', fields: ['receipts_attached', 'discrepancy', 'discrepancy_explanation', 'notes'] },
      { heading: 'Signature', fields: ['signature'] },
    ]
  },
  complaints_form: {
    title: 'Complaints / Feedback Form',
    color: '#8b5cf6',
    sections: [
      { heading: 'Complainant Details', fields: ['complainant_name', 'date', 'contact_phone', 'contact_email', 'relationship'] },
      { heading: 'Complaint Details', fields: ['complaint_type', 'date_of_incident', 'description', 'desired_outcome'] },
      { heading: 'Actions', fields: ['immediate_actions', 'assigned_to', 'resolution_date'] },
      { heading: 'Resolution', fields: ['resolution_details', 'complainant_satisfied', 'follow_up_required'] },
      { heading: 'Signature', fields: ['staff_name', 'signature', 'date'] },
    ]
  },
  complaints_feedback: { alias: 'complaints_form' },
}

function formatLabel(key) {
  return key.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
}

function formatValue(val) {
  if (val === null || val === undefined || val === '') return '—'
  if (Array.isArray(val)) {
    if (val.length === 0) return '—'
    if (typeof val[0] === 'string') return val.join(', ')
    // Array of objects — render as mini table
    return val
  }
  if (typeof val === 'object') {
    return Object.entries(val).map(([k, v]) => `${formatLabel(k)}: ${v}`).join(' · ')
  }
  return String(val)
}

function isSignature(key, val) {
  return (key.includes('signature') && typeof val === 'string' && val.startsWith('data:image'))
}

function PrintableForm({ data, formType, staffName, submittedAt, onClose, templateFields }) {
  const printRef = useRef(null)
  let layout = FORM_LAYOUTS[formType]
  if (layout?.alias) layout = FORM_LAYOUTS[layout.alias]

  const title = layout?.title || formType?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Form'
  const color = layout?.color || '#6b7280'

  const handlePrint = () => {
    const content = printRef.current
    if (!content) return
    const w = window.open('', '_blank', 'width=900,height=1200')
    w.document.write(`<!DOCTYPE html><html><head><title>${title} - Maple Care Support</title>
<style>
  * { margin:0; padding:0; box-sizing:border-box; }
  body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; color: #1a1a1a; padding: 0; }
  @media print { body { padding: 0; } .no-print { display:none !important; } @page { margin: 15mm; } }
  .page { max-width: 800px; margin: 0 auto; padding: 40px; }
  .header { display:flex; justify-content:space-between; align-items:flex-start; border-bottom:3px solid ${color}; padding-bottom:16px; margin-bottom:24px; }
  .header h1 { font-size:24px; font-weight:900; color:#111; }
  .header p { font-size:13px; color:#6b7280; margin-top:2px; }
  .header img { width:60px; height:60px; object-fit:contain; }
  .meta { display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:24px; padding:12px 16px; background:#f9fafb; border-radius:8px; border:1px solid #e5e7eb; }
  .meta-item label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; font-weight:700; }
  .meta-item p { font-size:13px; font-weight:600; color:#374151; margin-top:2px; }
  .section-heading { background:#111827; color:white; padding:8px 16px; border-radius:6px; font-size:13px; font-weight:700; margin:20px 0 12px; }
  .field-grid { display:grid; grid-template-columns:1fr 1fr; gap:8px 16px; }
  .field { padding:8px 0; border-bottom:1px solid #f3f4f6; }
  .field.full { grid-column: span 2; }
  .field label { font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#9ca3af; font-weight:700; display:block; margin-bottom:3px; }
  .field .value { font-size:13px; color:#1f2937; white-space:pre-wrap; line-height:1.5; }
  .field .value.empty { color:#d1d5db; font-style:italic; }
  .signature-img { height:50px; border:1px solid #e5e7eb; border-radius:6px; background:#fafafa; margin-top:4px; }
  .items-table { width:100%; border-collapse:collapse; margin-top:6px; font-size:12px; }
  .items-table th { background:#f3f4f6; padding:6px 10px; text-align:left; font-weight:700; font-size:10px; text-transform:uppercase; letter-spacing:0.5px; color:#6b7280; border:1px solid #e5e7eb; }
  .items-table td { padding:6px 10px; border:1px solid #e5e7eb; color:#374151; }
  .footer { margin-top:32px; padding-top:12px; border-top:2px solid #e5e7eb; display:flex; justify-content:space-between; font-size:10px; color:#9ca3af; }
</style></head><body>
${content.innerHTML}
</body></html>`)
    w.document.close()
    setTimeout(() => w.print(), 300)
  }

  // Build the sections to render
  const sections = []
  if (layout?.sections) {
    layout.sections.forEach(sec => {
      const fields = []
      sec.fields.forEach(key => {
        if (data[key] !== undefined && data[key] !== null) {
          fields.push({ key, value: data[key] })
        }
      })
      if (fields.length > 0) sections.push({ heading: sec.heading, fields })
    })
    // Also include any data keys NOT in the layout (admin-added fields etc)
    const coveredKeys = new Set(layout.sections.flatMap(s => s.fields))
    const extraFields = Object.entries(data).filter(([k, v]) => !coveredKeys.has(k) && v !== null && v !== undefined && v !== '')
    if (extraFields.length > 0) {
      sections.push({ heading: 'Additional Information', fields: extraFields.map(([key, value]) => ({ key, value })) })
    }
  } else {
    // No layout — render all fields, using templateFields for labels if available
    const fields = Object.entries(data).filter(([k, v]) => v !== null && v !== undefined && v !== '').map(([key, value]) => ({ key, value }))
    if (fields.length > 0) sections.push({ heading: 'Form Data', fields })
  }

  // Build field label map from template fields
  const fLabelMap = {}
  if (templateFields) templateFields.forEach(f => { fLabelMap[f.key] = f.label })

  return (
    <div className="fixed inset-0 z-[10001] bg-black/50 flex items-start justify-center overflow-y-auto py-8" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-[860px] mx-4" onClick={e => e.stopPropagation()}>
        {/* Toolbar */}
        <div className="flex items-center justify-between p-4 border-b border-gray-200 bg-gray-50 rounded-t-2xl no-print">
          <p className="font-bold text-gray-800 text-sm">{title}</p>
          <div className="flex items-center gap-2">
            <button onClick={handlePrint} className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-orange-500 to-amber-500 rounded-xl text-white text-sm font-bold shadow-lg hover:shadow-xl transition-all">
              <Printer size={16} /> Print / Save PDF
            </button>
            <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-200 text-gray-500 transition-colors">
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable content */}
        <div ref={printRef}>
          <div className="page" style={{ padding: '40px' }}>
            {/* Header */}
            <div className="header" style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', borderBottom:`3px solid ${color}`, paddingBottom:'16px', marginBottom:'24px' }}>
              <div>
                <h1 style={{ fontSize:'24px', fontWeight:900, color:'#111' }}>{title}</h1>
                <p style={{ fontSize:'13px', color:'#6b7280', marginTop:'2px' }}>Maple Care Support</p>
              </div>
              <img src={LOGO_URL} alt="MCS" style={{ width:'60px', height:'60px', objectFit:'contain' }} />
            </div>

            {/* Meta info */}
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'12px', marginBottom:'24px', padding:'12px 16px', background:'#f9fafb', borderRadius:'8px', border:'1px solid #e5e7eb' }}>
              <div>
                <label style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#9ca3af', fontWeight:700 }}>Submitted By</label>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginTop:'2px' }}>{staffName || 'Staff Member'}</p>
              </div>
              <div>
                <label style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#9ca3af', fontWeight:700 }}>Date & Time</label>
                <p style={{ fontSize:'13px', fontWeight:600, color:'#374151', marginTop:'2px' }}>
                  {submittedAt ? new Date(submittedAt).toLocaleDateString('en-AU', { weekday:'short', day:'numeric', month:'long', year:'numeric' }) : '—'}
                  {submittedAt && ` · ${new Date(submittedAt).toLocaleTimeString('en-AU', { hour:'numeric', minute:'2-digit', hour12:true })}`}
                </p>
              </div>
            </div>

            {/* Sections */}
            {sections.map((sec, si) => (
              <div key={si}>
                <div style={{ background:'#111827', color:'white', padding:'8px 16px', borderRadius:'6px', fontSize:'13px', fontWeight:700, margin:'20px 0 12px' }}>
                  {sec.heading}
                </div>
                <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'8px 16px' }}>
                  {sec.fields.map(({ key, value }) => {
                    const label = fLabelMap[key] || formatLabel(key)
                    const isSig = isSignature(key, value)
                    const isLong = typeof value === 'string' && value.length > 80
                    const isArr = Array.isArray(value) && typeof value[0] === 'object'
                    const full = isSig || isLong || isArr || key.includes('description') || key.includes('notes') || key.includes('actions') || key.includes('details') || key.includes('suggestions')

                    return (
                      <div key={key} style={{ padding:'8px 0', borderBottom:'1px solid #f3f4f6', gridColumn: full ? 'span 2' : 'auto' }}>
                        <label style={{ fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#9ca3af', fontWeight:700, display:'block', marginBottom:'3px' }}>{label}</label>
                        {isSig ? (
                          <img src={value} alt="Signature" style={{ height:'50px', border:'1px solid #e5e7eb', borderRadius:'6px', background:'#fafafa', marginTop:'4px' }} />
                        ) : isArr ? (
                          <table style={{ width:'100%', borderCollapse:'collapse', marginTop:'6px', fontSize:'12px' }}>
                            <thead>
                              <tr>
                                {Object.keys(value[0]).filter(k => !k.startsWith('data:')).map(k => (
                                  <th key={k} style={{ background:'#f3f4f6', padding:'6px 10px', textAlign:'left', fontWeight:700, fontSize:'10px', textTransform:'uppercase', letterSpacing:'0.5px', color:'#6b7280', border:'1px solid #e5e7eb' }}>{formatLabel(k)}</th>
                                ))}
                              </tr>
                            </thead>
                            <tbody>
                              {value.map((row, ri) => (
                                <tr key={ri}>
                                  {Object.entries(row).filter(([k]) => !k.startsWith('data:')).map(([k, v]) => (
                                    <td key={k} style={{ padding:'6px 10px', border:'1px solid #e5e7eb', color:'#374151' }}>{String(v || '—')}</td>
                                  ))}
                                </tr>
                              ))}
                            </tbody>
                          </table>
                        ) : (
                          <div style={{ fontSize:'13px', color: (formatValue(value) === '—') ? '#d1d5db' : '#1f2937', whiteSpace:'pre-wrap', lineHeight:1.5 }}>
                            {formatValue(value)}
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>
              </div>
            ))}

            {/* Footer */}
            <div style={{ marginTop:'32px', paddingTop:'12px', borderTop:'2px solid #e5e7eb', display:'flex', justifyContent:'space-between', fontSize:'10px', color:'#9ca3af' }}>
              <span>Maple Care Support</span>
              <span>Printed {new Date().toLocaleDateString('en-AU', { day:'numeric', month:'long', year:'numeric' })}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default PrintableForm