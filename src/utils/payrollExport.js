/**
 * Payroll Export Utility
 * Generates CSV export of completed shifts with pay calculations
 * Includes penalty rates for weekends, public holidays, and overtime
 */

// Australian public holidays (VIC) - update annually
const PUBLIC_HOLIDAYS_2025 = [
  '2025-01-01', '2025-01-27', '2025-03-14', '2025-04-18', '2025-04-19',
  '2025-04-21', '2025-04-25', '2025-06-09', '2025-09-26', '2025-11-04',
  '2025-12-25', '2025-12-26',
]

const PUBLIC_HOLIDAYS_2026 = [
  '2026-01-01', '2026-01-26', '2026-03-09', '2026-04-03', '2026-04-04',
  '2026-04-06', '2026-04-25', '2026-06-08', '2026-09-25', '2026-11-03',
  '2026-12-25', '2026-12-26',
]

const ALL_HOLIDAYS = [...PUBLIC_HOLIDAYS_2025, ...PUBLIC_HOLIDAYS_2026]

function isPublicHoliday(dateStr) {
  return ALL_HOLIDAYS.includes(dateStr)
}

function isWeekend(dateStr) {
  const day = new Date(dateStr + 'T00:00:00').getDay()
  return day === 0 || day === 6 // Sunday = 0, Saturday = 6
}

function isSaturday(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay() === 6
}

function isSunday(dateStr) {
  return new Date(dateStr + 'T00:00:00').getDay() === 0
}

/**
 * Calculate hours between two timestamps
 */
function calcHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return 0
  const diff = (new Date(clockOut) - new Date(clockIn)) / 3600000
  return Math.round(diff * 100) / 100 // 2 decimal places
}

/**
 * Calculate break deduction (30min for shifts > 5hrs, as per Fair Work)
 */
function calcBreakDeduction(totalHours, breakMinutes) {
  if (breakMinutes !== undefined && breakMinutes !== null) {
    return breakMinutes / 60
  }
  // Auto-deduct 30min for shifts over 5 hours if no break recorded
  return totalHours > 5 ? 0.5 : 0
}

/**
 * Calculate penalty multiplier based on day type
 * Based on SCHADS Award (Social, Community, Home Care and Disability Services)
 */
function getPenaltyInfo(dateStr) {
  if (isPublicHoliday(dateStr)) {
    return { multiplier: 2.5, label: 'Public Holiday (250%)' }
  }
  if (isSunday(dateStr)) {
    return { multiplier: 2.0, label: 'Sunday (200%)' }
  }
  if (isSaturday(dateStr)) {
    return { multiplier: 1.5, label: 'Saturday (150%)' }
  }
  return { multiplier: 1.0, label: 'Weekday (100%)' }
}

/**
 * Calculate overtime (hours over 8 in a shift get +50%)
 */
function calcOvertimeHours(netHours) {
  if (netHours <= 8) return { ordinary: netHours, overtime: 0 }
  return {
    ordinary: 8,
    overtime: Math.round((netHours - 8) * 100) / 100,
  }
}

/**
 * Generate payroll data from shifts
 * @param {Array} shifts - Array of shift objects with staff, clock_in, clock_out, shift_date
 * @param {number} baseRate - Base hourly rate (default $35/hr)
 * @returns {Array} Payroll rows
 */
export function generatePayrollData(shifts, baseRate = 35) {
  const completedShifts = shifts.filter(s =>
    s.status === 'completed' && s.clock_in && s.clock_out
  )

  return completedShifts.map(shift => {
    const staffName = shift.staff
      ? `${shift.staff.first_name} ${shift.staff.last_name}`
      : 'Unknown'
    
    const participantName = shift.participants
      ? `${shift.participants.first_name} ${shift.participants.last_name}`
      : shift.title || '—'

    const totalHours = calcHours(shift.clock_in, shift.clock_out)
    const breakDeduction = calcBreakDeduction(totalHours, shift.break_minutes)
    const netHours = Math.max(0, totalHours - breakDeduction)
    
    const { ordinary, overtime } = calcOvertimeHours(netHours)
    const penalty = getPenaltyInfo(shift.shift_date)
    
    const ordinaryPay = ordinary * baseRate * penalty.multiplier
    const overtimePay = overtime * baseRate * penalty.multiplier * 1.5
    const totalPay = Math.round((ordinaryPay + overtimePay) * 100) / 100

    return {
      staff_name: staffName,
      staff_id: shift.staff_id || '',
      participant: participantName,
      date: shift.shift_date,
      day: new Date(shift.shift_date + 'T00:00:00').toLocaleDateString('en-AU', { weekday: 'short' }),
      scheduled_start: shift.start_time ? formatTimeShort(shift.start_time) : '',
      scheduled_end: shift.end_time ? formatTimeShort(shift.end_time) : '',
      clock_in: shift.clock_in ? new Date(shift.clock_in).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      clock_out: shift.clock_out ? new Date(shift.clock_out).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false }) : '',
      total_hours: totalHours.toFixed(2),
      break_hours: breakDeduction.toFixed(2),
      net_hours: netHours.toFixed(2),
      ordinary_hours: ordinary.toFixed(2),
      overtime_hours: overtime.toFixed(2),
      base_rate: `$${baseRate.toFixed(2)}`,
      penalty_type: penalty.label,
      penalty_multiplier: penalty.multiplier.toFixed(1),
      ordinary_pay: `$${ordinaryPay.toFixed(2)}`,
      overtime_pay: `$${overtimePay.toFixed(2)}`,
      total_pay: `$${totalPay.toFixed(2)}`,
      location: shift.location || '',
      service_type: shift.service_type || '',
      notes: shift.notes || '',
    }
  }).sort((a, b) => a.date.localeCompare(b.date) || a.staff_name.localeCompare(b.staff_name))
}

function formatTimeShort(t) {
  if (!t) return ''
  try {
    if (t.includes('T')) {
      return new Date(t).toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', hour12: false })
    }
    return t.slice(0, 5)
  } catch {
    return t
  }
}

/**
 * Generate staff summary from payroll data
 */
export function generateStaffSummary(payrollData) {
  const summary = {}
  
  payrollData.forEach(row => {
    if (!summary[row.staff_name]) {
      summary[row.staff_name] = {
        staff_name: row.staff_name,
        total_shifts: 0,
        total_hours: 0,
        ordinary_hours: 0,
        overtime_hours: 0,
        total_pay: 0,
      }
    }
    const s = summary[row.staff_name]
    s.total_shifts++
    s.total_hours += parseFloat(row.net_hours)
    s.ordinary_hours += parseFloat(row.ordinary_hours)
    s.overtime_hours += parseFloat(row.overtime_hours)
    s.total_pay += parseFloat(row.total_pay.replace('$', ''))
  })

  return Object.values(summary).map(s => ({
    ...s,
    total_hours: s.total_hours.toFixed(2),
    ordinary_hours: s.ordinary_hours.toFixed(2),
    overtime_hours: s.overtime_hours.toFixed(2),
    total_pay: `$${s.total_pay.toFixed(2)}`,
  })).sort((a, b) => a.staff_name.localeCompare(b.staff_name))
}

/**
 * Convert payroll data to CSV string
 */
export function payrollToCSV(payrollData, includeHeaders = true) {
  if (payrollData.length === 0) return ''

  const headers = [
    'Staff Name', 'Participant', 'Date', 'Day',
    'Scheduled Start', 'Scheduled End', 'Clock In', 'Clock Out',
    'Total Hours', 'Break (hrs)', 'Net Hours',
    'Ordinary Hours', 'Overtime Hours',
    'Base Rate', 'Penalty Type', 'Penalty Multiplier',
    'Ordinary Pay', 'Overtime Pay', 'Total Pay',
    'Location', 'Service Type', 'Notes'
  ]

  const rows = payrollData.map(row => [
    row.staff_name, row.participant, row.date, row.day,
    row.scheduled_start, row.scheduled_end, row.clock_in, row.clock_out,
    row.total_hours, row.break_hours, row.net_hours,
    row.ordinary_hours, row.overtime_hours,
    row.base_rate, row.penalty_type, row.penalty_multiplier,
    row.ordinary_pay, row.overtime_pay, row.total_pay,
    row.location, row.service_type, `"${(row.notes || '').replace(/"/g, '""')}"`
  ])

  const csvLines = []
  if (includeHeaders) csvLines.push(headers.join(','))
  rows.forEach(r => csvLines.push(r.join(',')))
  
  return csvLines.join('\n')
}

/**
 * Convert staff summary to CSV string
 */
export function summaryToCSV(summaryData) {
  const headers = ['Staff Name', 'Total Shifts', 'Total Hours', 'Ordinary Hours', 'Overtime Hours', 'Total Pay']
  const rows = summaryData.map(s => [s.staff_name, s.total_shifts, s.total_hours, s.ordinary_hours, s.overtime_hours, s.total_pay])
  return [headers.join(','), ...rows.map(r => r.join(','))].join('\n')
}

/**
 * Download a CSV file
 */
export function downloadCSV(csvContent, filename) {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = filename
  link.click()
  URL.revokeObjectURL(link.href)
}

/**
 * Main export function — generates and downloads payroll CSV
 */
export function exportPayroll(shifts, baseRate = 35) {
  const data = generatePayrollData(shifts, baseRate)
  if (data.length === 0) {
    alert('No completed shifts with clock data to export')
    return
  }
  
  const csv = payrollToCSV(data)
  const today = new Date().toISOString().split('T')[0]
  downloadCSV(csv, `payroll-export-${today}.csv`)
  
  return data
}

/**
 * Export staff summary CSV
 */
export function exportStaffSummary(shifts, baseRate = 35) {
  const data = generatePayrollData(shifts, baseRate)
  const summary = generateStaffSummary(data)
  if (summary.length === 0) {
    alert('No completed shifts with clock data to export')
    return
  }
  
  const csv = summaryToCSV(summary)
  const today = new Date().toISOString().split('T')[0]
  downloadCSV(csv, `staff-summary-${today}.csv`)
  
  return summary
}