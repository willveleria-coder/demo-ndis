import { useState, useEffect, useRef } from 'react'
import {
  FileText, Download, Loader2, CheckCircle, AlertTriangle, Shield, Users,
  Clock, Pill, Calendar, Activity, Sparkles, BarChart3, ArrowRight,
  Printer, RefreshCw, XCircle, AlertOctagon, Layers, Target, Zap,
  DollarSign, TrendingUp, Eye, Hash
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import { brand } from '../config/branding'


/* ─────────────────────────────────────────────
   DESIGN SYSTEM
   ───────────────────────────────────────────── */

function Glass({ children, dark, glow, hover, style, ...p }) {
  const base = dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)'
  const border = dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)'
  return (
    <div
      style={{
        background: base,
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${border}`,
        borderRadius: '1.25rem',
        boxShadow: glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 24px -4px rgba(0,0,0,0.06)',
        transition: hover ? 'all .3s cubic-bezier(.16,1,.3,1)' : undefined,
        ...style,
      }}
      onMouseEnter={
        hover
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = glow
                ? `0 16px 48px -8px ${glow}`
                : '0 12px 40px -8px rgba(0,0,0,0.12)'
            }
          : undefined
      }
      onMouseLeave={
        hover
          ? (e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = glow
                ? `0 8px 32px -8px ${glow}`
                : '0 4px 24px -4px rgba(0,0,0,0.06)'
            }
          : undefined
      }
      {...p}
    >
      {children}
    </div>
  )
}

function Orb({ color, size = 200, top, left, right, bottom, delay = 0 }) {
  return (
    <div
      style={{
        position: 'absolute',
        width: size,
        height: size,
        top,
        left,
        right,
        bottom,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        opacity: 0.12,
        borderRadius: '50%',
        animation: `orbFloat ${6 + delay}s ease-in-out ${delay}s infinite`,
        pointerEvents: 'none',
        zIndex: 0,
      }}
    />
  )
}

function Badge({ children, color = 'gray', dark }) {
  const palettes = {
    gray: dark
      ? { bg: 'rgba(100,116,139,0.2)', text: '#94a3b8', border: 'rgba(100,116,139,0.3)' }
      : { bg: '#f1f5f9', text: '#64748b', border: '#e2e8f0' },
    green: dark
      ? { bg: 'rgba(16,185,129,0.15)', text: '#34d399', border: 'rgba(16,185,129,0.3)' }
      : { bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
    amber: dark
      ? { bg: 'rgba(245,158,11,0.15)', text: '#fbbf24', border: 'rgba(245,158,11,0.3)' }
      : { bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
    red: dark
      ? { bg: 'rgba(239,68,68,0.15)', text: '#f87171', border: 'rgba(239,68,68,0.3)' }
      : { bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
    blue: dark
      ? { bg: 'rgba(59,130,246,0.15)', text: '#60a5fa', border: 'rgba(59,130,246,0.3)' }
      : { bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
    purple: dark
      ? { bg: 'rgba(139,92,246,0.15)', text: '#a78bfa', border: 'rgba(139,92,246,0.3)' }
      : { bg: '#f5f3ff', text: '#7c3aed', border: '#ddd6fe' },
  }
  const pl = palettes[color] || palettes.gray
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 4,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 11,
        fontWeight: 700,
        background: pl.bg,
        color: pl.text,
        border: `1px solid ${pl.border}`,
        whiteSpace: 'nowrap',
      }}
    >
      {children}
    </span>
  )
}


/* ─────────────────────────────────────────────
   COMPLIANCE SCORE RING SVG
   100% preserved from original
   ───────────────────────────────────────────── */

function ScoreRing({ score, size = 140, stroke = 12 }) {
  const radius = (size - stroke) / 2
  const circumference = 2 * Math.PI * radius
  const progress = (score / 100) * circumference
  const color = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'
  const label = score >= 80 ? 'Compliant' : score >= 60 ? 'Needs Attention' : 'Non-Compliant'

  return (
    <div style={{ textAlign: 'center' }}>
      <svg
        width={size}
        height={size}
        style={{
          display: 'block',
          margin: '0 auto',
          filter: `drop-shadow(0 0 12px ${color}40)`,
        }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="rgba(0,0,0,0.06)"
          strokeWidth={stroke}
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke={color}
          strokeWidth={stroke}
          strokeDasharray={circumference}
          strokeDashoffset={circumference - progress}
          strokeLinecap="round"
          transform={`rotate(-90 ${size / 2} ${size / 2})`}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(.16,1,.3,1)',
          }}
        />
        <text
          x="50%"
          y="46%"
          textAnchor="middle"
          fill={color}
          fontSize="32"
          fontWeight="900"
        >
          {score}
        </text>
        <text
          x="50%"
          y="62%"
          textAnchor="middle"
          fill="#9ca3af"
          fontSize="11"
          fontWeight="600"
        >
          / 100
        </text>
      </svg>
      <p style={{ marginTop: 8, fontSize: 16, fontWeight: 900, color }}>
        {label}
      </p>
    </div>
  )
}


/* ─────────────────────────────────────────────
   MAIN COMPONENT
   ───────────────────────────────────────────── */

export default function AuditReport() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [generating, setGenerating] = useState(false)
  const [reportData, setReportData] = useState(null)
  const [loaded, setLoaded] = useState(false)
  const [genStep, setGenStep] = useState(0)

  useEffect(() => {
    setTimeout(() => setLoaded(true), 50)
  }, [])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    inputBg: isDark ? 'rgba(30,41,59,0.8)' : 'white',
    inputBorder: isDark ? 'rgba(51,65,85,0.5)' : '#e5e7eb',
    divider: isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.05)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  const GEN_STEPS = [
    'Loading staff data...',
    'Checking documents...',
    'Analysing incidents...',
    'Computing compliance...',
    'Building report...',
  ]


  /* ═══════════════════════════════════════════════════════
     ALL BACKEND — 100% PRESERVED — NOT SHORTENED
     ═══════════════════════════════════════════════════════ */

  const generateReport = async () => {
    setGenerating(true)
    setGenStep(0)

    // Animate loading steps
    const stepInterval = setInterval(() => {
      setGenStep((prev) => Math.min(prev + 1, GEN_STEPS.length - 1))
    }, 600)

    try {
      const [
        staffRes,
        partRes,
        incRes,
        shiftRes,
        docRes,
        trainingRes,
        medRes,
        claimRes,
        restrictiveRes,
      ] = await Promise.all([
        supabase
          .from('staff')
          .select('id, first_name, last_name, status, role, email'),
        supabase
          .from('participants')
          .select(
            'id, first_name, last_name, status, ndis_number, plan_end_date, plan_budget'
          ),
        supabase
          .from('incidents')
          .select(
            'id, incident_type, severity, status, ndis_reportable, created_at, description'
          ),
        supabase
          .from('shifts')
          .select('id, status, shift_date, clock_in, clock_out'),
        supabase
          .from('documents')
          .select(
            'id, name, document_type, expiry_date, staff_id, staff:staff(first_name, last_name)'
          ),
        supabase
          .from('staff_training')
          .select(
            'id, staff_id, training_type, expiry_date, staff:staff_id(first_name, last_name)'
          )
          .then((r) => r)
          .catch(() => ({ data: [] })),
        supabase
          .from('medications')
          .select(
            'id, medication_name, participant_id, status, requires_witness'
          )
          .then((r) => r)
          .catch(() => ({ data: [] })),
        supabase
          .from('ndis_claims')
          .select('id, total_amount, status')
          .then((r) => r)
          .catch(() => ({ data: [] })),
        supabase
          .from('restrictive_practices')
          .select('id, practice_type, authorisation_status')
          .then((r) => r)
          .catch(() => ({ data: [] })),
      ])

      const staff = staffRes.data || []
      const participants = partRes.data || []
      const incidents = incRes.data || []
      const shifts = shiftRes.data || []
      const docs = docRes.data || []
      const training = trainingRes.data || []
      const meds = medRes.data || []
      const claims = claimRes.data || []
      const restrictive = restrictiveRes.data || []
      const now = new Date()

      // Expired documents
      const expiredDocs = docs.filter(
        (d) => d.expiry_date && new Date(d.expiry_date) < now
      )

      // Documents expiring within 30 days
      const expiringDocs = docs.filter((d) => {
        if (!d.expiry_date) return false
        const days = Math.ceil(
          (new Date(d.expiry_date) - now) / 86400000
        )
        return days >= 0 && days <= 30
      })

      // Expired training
      const expiredTraining = training.filter(
        (t) => t.expiry_date && new Date(t.expiry_date) < now
      )

      // Training expiring within 30 days
      const expiringTraining = training.filter((t) => {
        if (!t.expiry_date) return false
        const days = Math.ceil(
          (new Date(t.expiry_date) - now) / 86400000
        )
        return days >= 0 && days <= 30
      })

      // Completed shifts and total hours
      const completedShifts = shifts.filter(
        (s) => s.status === 'completed'
      )
      const totalHours = completedShifts
        .filter((s) => s.clock_in && s.clock_out)
        .reduce(
          (sum, s) =>
            sum +
            (new Date(s.clock_out) - new Date(s.clock_in)) / 3600000,
          0
        )

      // Open incidents
      const openIncidents = incidents.filter(
        (i) => i.status === 'open' || i.status === 'investigating'
      )

      // NDIS reportable incidents
      const ndisReportable = incidents.filter((i) => i.ndis_reportable)

      // Incidents grouped by type
      const incidentsByType = {}
      incidents.forEach((i) => {
        const t = (i.incident_type || 'other').replace(/_/g, ' ')
        incidentsByType[t] = (incidentsByType[t] || 0) + 1
      })

      // Expiring NDIS plans (within 60 days)
      const expiringPlans = participants.filter((p) => {
        if (!p.plan_end_date) return false
        const days = Math.ceil(
          (new Date(p.plan_end_date) - now) / 86400000
        )
        return days >= 0 && days <= 60
      })

      // Billing totals
      const totalBilled = claims.reduce(
        (s, cl) => s + (parseFloat(cl.total_amount) || 0),
        0
      )
      const paidClaims = claims.filter((cl) => cl.status === 'paid')
      const totalPaid = paidClaims.reduce(
        (s, cl) => s + (parseFloat(cl.total_amount) || 0),
        0
      )

      // Pending restrictive practice authorisations
      const pendingAuth = restrictive.filter(
        (r) => r.authorisation_status === 'pending_authorisation'
      )

      // Calculate compliance score
      let score = 100
      if (expiredDocs.length > 0) score -= expiredDocs.length * 5
      if (expiredTraining.length > 0) score -= expiredTraining.length * 5
      if (openIncidents.length > 0) score -= openIncidents.length * 3
      if (ndisReportable.length > 0) score -= ndisReportable.length * 5
      if (pendingAuth.length > 0) score -= pendingAuth.length * 5
      score = Math.max(0, Math.min(100, score))

      setReportData({
        generatedAt: now.toISOString(),
        staff,
        participants,
        incidents,
        shifts,
        docs,
        training,
        meds,
        claims,
        restrictive,
        expiredDocs,
        expiringDocs,
        expiredTraining,
        expiringTraining,
        completedShifts,
        totalHours,
        openIncidents,
        ndisReportable,
        incidentsByType,
        expiringPlans,
        totalBilled,
        totalPaid,
        pendingAuth,
        score,
      })
    } catch (err) {
      console.error('Report generation error:', err)
      alert(
        'Failed to generate report: ' + (err.message || 'Unknown error')
      )
    } finally {
      clearInterval(stepInterval)
      setGenerating(false)
    }
  }

  const printReport = () => {
    window.print()
  }

  const scoreColor = (s) =>
    s >= 80 ? '#10b981' : s >= 60 ? '#f59e0b' : '#ef4444'


  /* ═══════════════════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════════════════ */

  return (
    <div style={{ position: 'relative', minHeight: '100vh' }}>
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translateY(0) scale(1); }
          50% { transform: translateY(-15px) scale(1.03); }
        }
        @keyframes ping {
          75%, 100% { transform: scale(1.8); opacity: 0; }
        }
        @keyframes pulse-dot {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.4; }
        }
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        @keyframes pulseRing {
          0% { transform: scale(1); opacity: 0.4; }
          100% { transform: scale(2); opacity: 0; }
        }
        @media print {
          body {
            -webkit-print-color-adjust: exact;
            print-color-adjust: exact;
          }
          .no-print {
            display: none !important;
          }
          #audit-report {
            box-shadow: none !important;
            border: none !important;
            border-radius: 0 !important;
            page-break-inside: auto;
          }
          #audit-report > div {
            page-break-inside: avoid;
          }
        }
      `}</style>

      {/* ═══════════════════════════════════════════
           PRE-GENERATION UI (hidden in print)
           ═══════════════════════════════════════════ */}
      <div className="no-print" style={{ position: 'relative' }}>

        <Orb color={c.primary} size={380} top="-100px" right="-80px" delay={0} />
        <Orb color="#3b82f6" size={280} bottom="100px" left="-60px" delay={2} />
        <Orb color="#10b981" size={200} top="200px" right="10%" delay={3.5} />
        <Orb color="#8b5cf6" size={160} bottom="30%" left="40%" delay={5} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: 20 }}>

          {/* ── Header Bar ── */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              flexWrap: 'wrap',
              gap: 16,
              ...stg(0),
            }}
          >
            <div>
              <h1
                style={{
                  fontSize: 28,
                  fontWeight: 900,
                  color: dk.text,
                  letterSpacing: '-0.02em',
                }}
              >
                Audit Report
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: dk.textMuted,
                  marginTop: 4,
                }}
              >
                Generate a comprehensive NDIS compliance audit report
              </p>
            </div>
            <div style={{ display: 'flex', gap: 10, flexShrink: 0 }}>
              {reportData && (
                <button
                  onClick={printReport}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    padding: '12px 18px',
                    borderRadius: 14,
                    fontSize: 13,
                    fontWeight: 700,
                    cursor: 'pointer',
                    color: dk.text,
                    background: isDark
                      ? 'rgba(51,65,85,0.5)'
                      : 'rgba(255,255,255,0.6)',
                    backdropFilter: 'blur(12px)',
                    border: `1px solid ${
                      isDark
                        ? 'rgba(51,65,85,0.4)'
                        : 'rgba(255,255,255,0.7)'
                    }`,
                    transition: 'all .2s',
                  }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.transform = 'translateY(-1px)')
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.transform = 'translateY(0)')
                  }
                >
                  <Printer size={16} /> Print / Save PDF
                </button>
              )}
              <button
                onClick={generateReport}
                disabled={generating}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '12px 22px',
                  borderRadius: 14,
                  border: 'none',
                  fontSize: 14,
                  fontWeight: 700,
                  cursor: 'pointer',
                  color: 'white',
                  background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                  boxShadow: `0 6px 24px -6px ${c.primary}50`,
                  opacity: generating ? 0.6 : 1,
                  transition: 'all .2s',
                }}
                onMouseEnter={(e) => {
                  if (!generating)
                    e.currentTarget.style.transform = 'translateY(-1px)'
                }}
                onMouseLeave={(e) =>
                  (e.currentTarget.style.transform = 'translateY(0)')
                }
              >
                {generating ? (
                  <>
                    <Loader2
                      size={16}
                      className="animate-spin"
                    />{' '}
                    Generating...
                  </>
                ) : (
                  <>
                    <FileText size={16} /> Generate Report
                  </>
                )}
              </button>
            </div>
          </div>

          {/* ═══ EMPTY STATE ═══ */}
          {!reportData && !generating && (
            <div style={stg(1)}>
              <div
                style={{
                  borderRadius: 24,
                  padding: '40px 28px',
                  position: 'relative',
                  overflow: 'hidden',
                  background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
                  backgroundSize: '200% 200%',
                  animation: 'gradientShift 8s ease-in-out infinite',
                }}
              >
                {/* Decorative circles */}
                <div
                  style={{
                    position: 'absolute',
                    width: 300,
                    height: 300,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.08)',
                    top: -80,
                    right: -40,
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 180,
                    height: 180,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.05)',
                    bottom: -50,
                    left: '25%',
                  }}
                />
                <div
                  style={{
                    position: 'absolute',
                    width: 100,
                    height: 100,
                    borderRadius: '50%',
                    background:
                      'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
                    top: 30,
                    left: '55%',
                    animation: 'orbFloat 8s ease-in-out infinite',
                  }}
                />
                {/* Dot grid */}
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    backgroundImage:
                      'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                    backgroundSize: '24px 24px',
                    opacity: 0.5,
                  }}
                />
                {/* Floating dots */}
                {[
                  { top: '15%', right: '20%', s: 4, d: 0 },
                  { top: '60%', right: '10%', s: 3, d: 1.5 },
                  { bottom: '25%', left: '35%', s: 5, d: 3 },
                ].map((dot, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'absolute',
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.2)',
                      width: dot.s * 2,
                      height: dot.s * 2,
                      top: dot.top,
                      right: dot.right,
                      bottom: dot.bottom,
                      left: dot.left,
                      animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s`,
                    }}
                  />
                ))}

                <div
                  style={{
                    position: 'relative',
                    zIndex: 1,
                    textAlign: 'center',
                    maxWidth: 520,
                    margin: '0 auto',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 24,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 24px',
                      background: 'rgba(255,255,255,0.15)',
                      backdropFilter: 'blur(12px)',
                      border: '1px solid rgba(255,255,255,0.2)',
                      boxShadow: '0 8px 32px -4px rgba(0,0,0,0.15)',
                    }}
                  >
                    <Shield size={40} color="white" />
                  </div>
                  <h2
                    style={{
                      fontSize: 28,
                      fontWeight: 900,
                      color: 'white',
                      letterSpacing: '-0.02em',
                      lineHeight: 1.15,
                    }}
                  >
                    NDIS Compliance Audit Report
                  </h2>
                  <p
                    style={{
                      fontSize: 14,
                      color: 'rgba(255,255,255,0.5)',
                      marginTop: 12,
                      lineHeight: 1.6,
                    }}
                  >
                    Generate a comprehensive report covering staff
                    compliance, incident tracking, document expiry, training
                    status, billing summary, and restrictive practices.
                    Ready for NDIS audits.
                  </p>

                  <div
                    style={{
                      display: 'flex',
                      flexWrap: 'wrap',
                      justifyContent: 'center',
                      gap: 8,
                      marginTop: 24,
                    }}
                  >
                    {[
                      'Documents',
                      'Training',
                      'Incidents',
                      'Billing',
                      'Medications',
                      'Restrictive Practices',
                    ].map((t, i) => (
                      <div
                        key={t}
                        style={{
                          padding: '7px 14px',
                          borderRadius: 12,
                          fontSize: 12,
                          fontWeight: 700,
                          color: 'rgba(255,255,255,0.8)',
                          background: 'rgba(255,255,255,0.1)',
                          backdropFilter: 'blur(8px)',
                          border: '1px solid rgba(255,255,255,0.1)',
                        }}
                      >
                        {t}
                      </div>
                    ))}
                  </div>

                  <button
                    onClick={generateReport}
                    style={{
                      marginTop: 32,
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: 8,
                      padding: '16px 32px',
                      borderRadius: 16,
                      border: 'none',
                      fontSize: 14,
                      fontWeight: 800,
                      color: 'white',
                      background: 'rgba(255,255,255,0.2)',
                      backdropFilter: 'blur(8px)',
                      cursor: 'pointer',
                      boxShadow: '0 8px 32px -4px rgba(0,0,0,0.15)',
                      transition: 'all .2s',
                    }}
                    onMouseEnter={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.3)')
                    }
                    onMouseLeave={(e) =>
                      (e.currentTarget.style.background =
                        'rgba(255,255,255,0.2)')
                    }
                  >
                    <Sparkles size={16} /> Generate Report
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ═══ GENERATING STATE ═══ */}
          {generating && (
            <div style={stg(1)}>
              <Glass
                dark={isDark}
                glow={`${c.primary}15`}
                style={{
                  padding: '48px 32px',
                  textAlign: 'center',
                }}
              >
                <div
                  style={{
                    position: 'relative',
                    width: 80,
                    height: 80,
                    margin: '0 auto 24px',
                  }}
                >
                  <div
                    style={{
                      width: 80,
                      height: 80,
                      borderRadius: 22,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                      boxShadow: `0 0 40px ${c.primary}40`,
                    }}
                  >
                    <Shield size={36} color="white" />
                  </div>
                  <div
                    style={{
                      position: 'absolute',
                      inset: 0,
                      borderRadius: 22,
                      background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                      animation:
                        'pulseRing 1.5s cubic-bezier(0,0,0.2,1) infinite',
                      opacity: 0.3,
                    }}
                  />
                </div>

                <p
                  style={{
                    fontSize: 20,
                    fontWeight: 900,
                    color: dk.text,
                  }}
                >
                  Generating audit report...
                </p>
                <p
                  style={{
                    fontSize: 14,
                    color: dk.textMuted,
                    marginTop: 4,
                  }}
                >
                  Compiling data across all modules
                </p>

                {/* Progress steps */}
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'flex-start',
                    gap: 10,
                    maxWidth: 280,
                    margin: '32px auto 0',
                  }}
                >
                  {GEN_STEPS.map((step, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                        width: '100%',
                      }}
                    >
                      <div
                        style={{
                          width: 28,
                          height: 28,
                          borderRadius: '50%',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          flexShrink: 0,
                          background:
                            i < genStep
                              ? '#10b981'
                              : i === genStep
                              ? c.primary
                              : dk.subtleBg2,
                          transition: 'all .3s',
                          boxShadow:
                            i === genStep
                              ? `0 0 12px ${c.primary}40`
                              : 'none',
                        }}
                      >
                        {i < genStep ? (
                          <CheckCircle size={14} color="white" />
                        ) : i === genStep ? (
                          <Loader2
                            size={14}
                            color="white"
                            className="animate-spin"
                          />
                        ) : (
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: dk.textFaint,
                            }}
                          />
                        )}
                      </div>
                      <p
                        style={{
                          fontSize: 13,
                          fontWeight: 600,
                          color:
                            i <= genStep ? dk.text : dk.textFaint,
                          transition: 'color .3s',
                        }}
                      >
                        {step}
                      </p>
                    </div>
                  ))}
                </div>
              </Glass>
            </div>
          )}
        </div>
      </div>


      {/* ═══════════════════════════════════════════════════════
           PRINTABLE REPORT — Always light mode for print
           ═══════════════════════════════════════════════════════ */}
      {reportData && (
        <div
          id="audit-report"
          style={{
            background: 'white',
            borderRadius: 20,
            border: '1px solid #f1f5f9',
            boxShadow: '0 4px 24px -4px rgba(0,0,0,0.06)',
            overflow: 'hidden',
          }}
        >

          {/* ── Report Header ── */}
          <div
            style={{
              padding: '40px 32px',
              textAlign: 'center',
              background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                position: 'absolute',
                width: 300,
                height: 300,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.08)',
                top: -80,
                right: -40,
              }}
            />
            <div
              style={{
                position: 'absolute',
                width: 180,
                height: 180,
                borderRadius: '50%',
                background: 'rgba(255,255,255,0.05)',
                bottom: -50,
                left: '25%',
              }}
            />
            <div
              style={{
                position: 'absolute',
                inset: 0,
                backgroundImage:
                  'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
                backgroundSize: '24px 24px',
                opacity: 0.4,
              }}
            />
            <div style={{ position: 'relative', zIndex: 1 }}>
              <h1
                style={{
                  fontSize: 36,
                  fontWeight: 900,
                  color: 'white',
                  letterSpacing: '-0.02em',
                }}
              >
                {brand.appName}
              </h1>
              <p
                style={{
                  fontSize: 14,
                  color: 'rgba(255,255,255,0.7)',
                  fontWeight: 600,
                  marginTop: 6,
                }}
              >
                NDIS Compliance Audit Report
              </p>
              <p
                style={{
                  fontSize: 12,
                  color: 'rgba(255,255,255,0.4)',
                  marginTop: 12,
                }}
              >
                Generated:{' '}
                {new Date(reportData.generatedAt).toLocaleDateString(
                  'en-AU',
                  {
                    weekday: 'long',
                    day: 'numeric',
                    month: 'long',
                    year: 'numeric',
                    hour: 'numeric',
                    minute: '2-digit',
                  }
                )}
              </p>
            </div>
          </div>

          {/* ── Compliance Score ── */}
          <div
            style={{
              padding: '40px 32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <div
              style={{
                display: 'flex',
                flexDirection: 'row',
                flexWrap: 'wrap',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 40,
              }}
            >
              <ScoreRing
                score={reportData.score}
                size={150}
                stroke={14}
              />
              <div
                style={{
                  textAlign: 'left',
                  maxWidth: 380,
                }}
              >
                <p
                  style={{
                    fontSize: 13,
                    color: '#6b7280',
                    lineHeight: 1.7,
                  }}
                >
                  This score is calculated based on expired documents,
                  training compliance, open incidents, NDIS reportable
                  events, and pending restrictive practice authorisations.
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 6,
                    marginTop: 12,
                  }}
                >
                  {reportData.expiredDocs.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      −{reportData.expiredDocs.length * 5} pts:{' '}
                      {reportData.expiredDocs.length} expired documents
                    </p>
                  )}
                  {reportData.expiredTraining.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      −{reportData.expiredTraining.length * 5} pts:{' '}
                      {reportData.expiredTraining.length} expired training
                    </p>
                  )}
                  {reportData.openIncidents.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#d97706',
                      }}
                    >
                      −{reportData.openIncidents.length * 3} pts:{' '}
                      {reportData.openIncidents.length} open incidents
                    </p>
                  )}
                  {reportData.ndisReportable.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      −{reportData.ndisReportable.length * 5} pts:{' '}
                      {reportData.ndisReportable.length} NDIS reportable
                    </p>
                  )}
                  {reportData.pendingAuth.length > 0 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#dc2626',
                      }}
                    >
                      −{reportData.pendingAuth.length * 5} pts:{' '}
                      {reportData.pendingAuth.length} pending
                      authorisations
                    </p>
                  )}
                  {reportData.score === 100 && (
                    <p
                      style={{
                        fontSize: 12,
                        fontWeight: 700,
                        color: '#059669',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 6,
                      }}
                    >
                      <CheckCircle size={14} /> No compliance issues
                      detected
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* ── Organisation Overview ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 20,
              }}
            >
              Organisation Overview
            </h2>
            <div
              style={{
              display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  icon: Users,
                  value: reportData.participants.filter(
                    (p) => p.status === 'active'
                  ).length,
                  label: 'Active Participants',
                  color: '#8b5cf6',
                },
                {
                  icon: Shield,
                  value: reportData.staff.filter(
                    (s) => s.status === 'active'
                  ).length,
                  label: 'Active Staff',
                  color: '#3b82f6',
                },
                {
                  icon: Calendar,
                  value: reportData.completedShifts.length,
                  label: 'Completed Shifts',
                  color: '#10b981',
                },
                {
                  icon: Clock,
                  value: `${reportData.totalHours.toFixed(0)}h`,
                  label: 'Service Hours',
                  color: '#f59e0b',
                },
              ].map((s, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 16px',
                    borderRadius: 14,
                    background: '#f8fafc',
                    border: '1px solid #f1f5f9',
                    textAlign: 'center',
                  }}
                >
                  <div
                    style={{
                      width: 44,
                      height: 44,
                      borderRadius: 12,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      margin: '0 auto 10px',
                      background: `${s.color}12`,
                    }}
                  >
                    <s.icon size={20} style={{ color: s.color }} />
                  </div>
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: '#1f2937',
                    }}
                  >
                    {s.value}
                  </p>
                  <p
                    style={{
                      fontSize: 10,
                      fontWeight: 600,
                      color: '#9ca3af',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                      marginTop: 4,
                    }}
                  >
                    {s.label}
                  </p>
                </div>
              ))}
            </div>
          </div>


          {/* ── Document Compliance ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 4,
              }}
            >
              Document Compliance
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 20,
              }}
            >
              {reportData.docs.length} documents tracked ·{' '}
              {reportData.expiredDocs.length} expired ·{' '}
              {reportData.expiringDocs.length} expiring within 30 days
            </p>

            {/* Expired Documents Table */}
            {reportData.expiredDocs.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#dc2626',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <XCircle size={16} /> Expired Documents
                </p>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid #fecaca',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#fef2f2' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Document
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Type
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Staff
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Expired
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expiredDocs.map((d) => (
                        <tr
                          key={d.id}
                          style={{
                            borderTop: '1px solid #fecaca',
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#1f2937',
                              fontWeight: 600,
                            }}
                          >
                            {d.name}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#6b7280',
                            }}
                          >
                            {(d.document_type || '').replace(/_/g, ' ')}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#6b7280',
                            }}
                          >
                            {d.staff
                              ? `${d.staff.first_name} ${d.staff.last_name}`
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#dc2626',
                              fontWeight: 700,
                            }}
                          >
                            {new Date(
                              d.expiry_date
                            ).toLocaleDateString('en-AU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Expiring Documents Table */}
            {reportData.expiringDocs.length > 0 && (
              <div>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#d97706',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <AlertTriangle size={16} /> Expiring Within 30 Days
                </p>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid #fde68a',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#fffbeb' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#92400e',
                            fontSize: 11,
                          }}
                        >
                          Document
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#92400e',
                            fontSize: 11,
                          }}
                        >
                          Staff
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#92400e',
                            fontSize: 11,
                          }}
                        >
                          Expires
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#92400e',
                            fontSize: 11,
                          }}
                        >
                          Days Left
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expiringDocs.map((d) => {
                        const days = Math.ceil(
                          (new Date(d.expiry_date) - new Date()) /
                            86400000
                        )
                        return (
                          <tr
                            key={d.id}
                            style={{
                              borderTop: '1px solid #fde68a',
                            }}
                          >
                            <td
                              style={{
                                padding: '12px 16px',
                                color: '#1f2937',
                                fontWeight: 600,
                              }}
                            >
                              {d.name}
                            </td>
                            <td
                              style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                              }}
                            >
                              {d.staff
                                ? `${d.staff.first_name} ${d.staff.last_name}`
                                : '—'}
                            </td>
                            <td
                              style={{
                                padding: '12px 16px',
                                color: '#6b7280',
                              }}
                            >
                              {new Date(
                                d.expiry_date
                              ).toLocaleDateString('en-AU')}
                            </td>
                            <td
                              style={{
                                padding: '12px 16px',
                                color: '#d97706',
                                fontWeight: 700,
                              }}
                            >
                              {days}d
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* All clear */}
            {reportData.expiredDocs.length === 0 &&
              reportData.expiringDocs.length === 0 && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <CheckCircle
                    size={22}
                    style={{ color: '#10b981', flexShrink: 0 }}
                  />
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    All documents are current and valid
                  </p>
                </div>
              )}
          </div>

          {/* ── Training Compliance ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 4,
              }}
            >
              Staff Training Compliance
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 20,
              }}
            >
              {reportData.training.length} training records ·{' '}
              {reportData.expiredTraining.length} expired ·{' '}
              {reportData.expiringTraining.length} expiring
            </p>

            {reportData.expiredTraining.length > 0 && (
              <div style={{ marginBottom: 20 }}>
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#dc2626',
                    marginBottom: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <XCircle size={16} /> Expired Training
                </p>
                <div
                  style={{
                    borderRadius: 14,
                    border: '1px solid #fecaca',
                    overflow: 'hidden',
                  }}
                >
                  <table
                    style={{
                      width: '100%',
                      borderCollapse: 'collapse',
                      fontSize: 12,
                    }}
                  >
                    <thead>
                      <tr style={{ background: '#fef2f2' }}>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Training
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Staff
                        </th>
                        <th
                          style={{
                            padding: '12px 16px',
                            textAlign: 'left',
                            fontWeight: 700,
                            color: '#991b1b',
                            fontSize: 11,
                          }}
                        >
                          Expired
                        </th>
                      </tr>
                    </thead>
                    <tbody>
                      {reportData.expiredTraining.map((t) => (
                        <tr
                          key={t.id}
                          style={{
                            borderTop: '1px solid #fecaca',
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#1f2937',
                              fontWeight: 600,
                            }}
                          >
                            {t.training_type}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#6b7280',
                            }}
                          >
                            {t.staff
                              ? `${t.staff.first_name} ${t.staff.last_name}`
                              : '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#dc2626',
                              fontWeight: 700,
                            }}
                          >
                            {new Date(
                              t.expiry_date
                            ).toLocaleDateString('en-AU')}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {reportData.expiredTraining.length === 0 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#ecfdf5',
                  border: '1px solid #a7f3d0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <CheckCircle
                  size={22}
                  style={{ color: '#10b981', flexShrink: 0 }}
                />
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: '#059669',
                  }}
                >
                  All staff training is current
                </p>
              </div>
            )}
          </div>


          {/* ── Incident Summary ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 4,
              }}
            >
              Incident Summary
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 20,
              }}
            >
              {reportData.incidents.length} total incidents ·{' '}
              {reportData.openIncidents.length} open ·{' '}
              {reportData.ndisReportable.length} NDIS reportable
            </p>

            {/* NDIS Reportable Alert */}
            {reportData.ndisReportable.length > 0 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#fef2f2',
                  border: '1px solid #fecaca',
                  marginBottom: 20,
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <AlertOctagon
                  size={22}
                  style={{
                    color: '#ef4444',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <div>
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#b91c1c',
                    }}
                  >
                    {reportData.ndisReportable.length} NDIS Reportable
                    Incident
                    {reportData.ndisReportable.length > 1 ? 's' : ''}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: '#dc2626',
                      marginTop: 4,
                    }}
                  >
                    These incidents must be reported to the NDIS Quality
                    and Safeguards Commission within required timeframes.
                  </p>
                </div>
              </div>
            )}

            {/* Incidents by Type */}
            {Object.keys(reportData.incidentsByType).length > 0 && (
              <div
                style={{
           display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                  gap: 12,
                }}
              >
                {Object.entries(reportData.incidentsByType)
                  .sort((a, b) => b[1] - a[1])
                  .map(([type, count]) => (
                    <div
                      key={type}
                      style={{
                        padding: '18px 16px',
                        borderRadius: 14,
                        background: '#f8fafc',
                        border: '1px solid #f1f5f9',
                        textAlign: 'center',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 24,
                          fontWeight: 900,
                          color: '#1f2937',
                        }}
                      >
                        {count}
                      </p>
                      <p
                        style={{
                          fontSize: 10,
                          fontWeight: 600,
                          color: '#9ca3af',
                          textTransform: 'capitalize',
                          marginTop: 4,
                        }}
                      >
                        {type}
                      </p>
                    </div>
                  ))}
              </div>
            )}
          </div>

          {/* ── Restrictive Practices ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 4,
              }}
            >
              Restrictive Practices
            </h2>
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginBottom: 20,
              }}
            >
              {reportData.restrictive.length} recorded ·{' '}
              {reportData.pendingAuth.length} pending authorisation
            </p>

            {reportData.pendingAuth.length > 0 && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 14,
                  background: '#fffbeb',
                  border: '1px solid #fde68a',
                  display: 'flex',
                  alignItems: 'flex-start',
                  gap: 12,
                }}
              >
                <AlertTriangle
                  size={22}
                  style={{
                    color: '#f59e0b',
                    flexShrink: 0,
                    marginTop: 2,
                  }}
                />
                <p
                  style={{
                    fontSize: 13,
                    color: '#92400e',
                    lineHeight: 1.6,
                  }}
                >
                  <strong>{reportData.pendingAuth.length}</strong>{' '}
                  restrictive practice
                  {reportData.pendingAuth.length > 1 ? 's' : ''} awaiting
                  authorisation. All restrictive practices must be
                  authorised and linked to a current Behaviour Support
                  Plan.
                </p>
              </div>
            )}

            {reportData.pendingAuth.length === 0 &&
              reportData.restrictive.length > 0 && (
                <div
                  style={{
                    padding: '16px 20px',
                    borderRadius: 14,
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                  }}
                >
                  <CheckCircle
                    size={22}
                    style={{ color: '#10b981', flexShrink: 0 }}
                  />
                  <p
                    style={{
                      fontSize: 14,
                      fontWeight: 700,
                      color: '#059669',
                    }}
                  >
                    All restrictive practices are authorised
                  </p>
                </div>
              )}
          </div>

          {/* ── Billing Summary ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 20,
              }}
            >
              Billing Summary
            </h2>
            <div
              style={{
          display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  label: 'Total Billed',
                  value: reportData.totalBilled,
                  color: '#64748b',
                  bg: '#f8fafc',
                },
                {
                  label: 'Paid',
                  value: reportData.totalPaid,
                  color: '#10b981',
                  bg: '#ecfdf5',
                },
                {
                  label: 'Outstanding',
                  value:
                    reportData.totalBilled - reportData.totalPaid,
                  color: '#f59e0b',
                  bg: '#fffbeb',
                },
              ].map((b, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 16px',
                    borderRadius: 14,
                    background: b.bg,
                    border: '1px solid #f1f5f9',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: b.color,
                    }}
                  >
                    $
                    {b.value.toLocaleString(undefined, {
                      minimumFractionDigits: 0,
                      maximumFractionDigits: 0,
                    })}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: b.color,
                      marginTop: 4,
                    }}
                  >
                    {b.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── Medication Overview ── */}
          <div
            style={{
              padding: '32px',
              borderBottom: '1px solid #f1f5f9',
            }}
          >
            <h2
              style={{
                fontSize: 18,
                fontWeight: 900,
                color: '#1f2937',
                marginBottom: 20,
              }}
            >
              Medication Overview
            </h2>
            <div
              style={{
 display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))',
                gap: 16,
              }}
            >
              {[
                {
                  label: 'Active Medications',
                  value: reportData.meds.filter(
                    (m) => m.status === 'active'
                  ).length,
                  bg: '#f8fafc',
                  color: '#1f2937',
                },
                {
                  label: 'Require Witness',
                  value: reportData.meds.filter(
                    (m) => m.requires_witness
                  ).length,
                  bg: '#fffbeb',
                  color: '#f59e0b',
                },
                {
                  label: 'Total Records',
                  value: reportData.meds.length,
                  bg: '#f8fafc',
                  color: '#1f2937',
                },
              ].map((m, i) => (
                <div
                  key={i}
                  style={{
                    padding: '18px 16px',
                    borderRadius: 14,
                    background: m.bg,
                    border: '1px solid #f1f5f9',
                    textAlign: 'center',
                  }}
                >
                  <p
                    style={{
                      fontSize: 24,
                      fontWeight: 900,
                      color: m.color,
                    }}
                  >
                    {m.value}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontWeight: 600,
                      color: '#9ca3af',
                      marginTop: 4,
                    }}
                  >
                    {m.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* ── NDIS Plan Expiry Alerts ── */}
          {reportData.expiringPlans.length > 0 && (
            <div
              style={{
                padding: '32px',
                borderBottom: '1px solid #f1f5f9',
              }}
            >
              <h2
                style={{
                  fontSize: 18,
                  fontWeight: 900,
                  color: '#1f2937',
                  marginBottom: 20,
                }}
              >
                NDIS Plan Expiry Alerts
              </h2>
              <div
                style={{
                  borderRadius: 14,
                  border: '1px solid #fde68a',
                  overflow: 'hidden',
                }}
              >
                <table
                  style={{
                    width: '100%',
                    borderCollapse: 'collapse',
                    fontSize: 12,
                  }}
                >
                  <thead>
                    <tr style={{ background: '#fffbeb' }}>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#92400e',
                          fontSize: 11,
                        }}
                      >
                        Participant
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#92400e',
                          fontSize: 11,
                        }}
                      >
                        NDIS Number
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#92400e',
                          fontSize: 11,
                        }}
                      >
                        Plan Ends
                      </th>
                      <th
                        style={{
                          padding: '12px 16px',
                          textAlign: 'left',
                          fontWeight: 700,
                          color: '#92400e',
                          fontSize: 11,
                        }}
                      >
                        Days Left
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {reportData.expiringPlans.map((p) => {
                      const days = Math.ceil(
                        (new Date(p.plan_end_date) - new Date()) /
                          86400000
                      )
                      return (
                        <tr
                          key={p.id}
                          style={{
                            borderTop: '1px solid #fde68a',
                          }}
                        >
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#1f2937',
                              fontWeight: 600,
                            }}
                          >
                            {p.first_name} {p.last_name}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#6b7280',
                            }}
                          >
                            {p.ndis_number || '—'}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#6b7280',
                            }}
                          >
                            {new Date(
                              p.plan_end_date
                            ).toLocaleDateString('en-AU')}
                          </td>
                          <td
                            style={{
                              padding: '12px 16px',
                              color: '#d97706',
                              fontWeight: 700,
                            }}
                          >
                            {days}d
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* ── Footer ── */}
          <div
            style={{
              padding: '24px 32px',
              background: '#f8fafc',
              textAlign: 'center',
            }}
          >
            <p style={{ fontSize: 12, color: '#9ca3af' }}>
              This report was generated by {brand.appName} on{' '}
              {new Date(reportData.generatedAt).toLocaleDateString(
                'en-AU'
              )}
              .
            </p>
            <p
              style={{
                fontSize: 12,
                color: '#9ca3af',
                marginTop: 4,
              }}
            >
              For NDIS audit purposes. Retain for a minimum of 7 years as
              per NDIS Practice Standards.
            </p>
            <p
              style={{
                fontSize: 10,
                color: '#d1d5db',
                marginTop: 10,
              }}
            >
              Powered by{' '}
              <a
                href="https://veleria.com.au"
                style={{ color: '#9ca3af', textDecoration: 'none' }}
              >
                Veleria
              </a>
            </p>
          </div>
        </div>
      )}
    </div>
  )
}