import { useState, useEffect, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Users, UserCog, AlertTriangle, Calendar, Clock, FileText,
  TrendingUp, CheckCircle, ChevronLeft, ChevronRight,
  Activity, Shield, Loader2, ArrowUpRight, DollarSign, BarChart3,
  Zap, Sparkles, ArrowRight, Plus, Heart, GraduationCap, Target,
  Pill, ClipboardList, MapPin, ArrowLeftRight, Crown, Medal, Award,
  Flame, X, Phone, Navigation, Car
} from 'lucide-react'
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, AreaChart, Area, CartesianGrid
} from 'recharts'
import { supabase } from '../lib/supabase'
import { useAuth } from '../context/AuthContext'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'
import Modal from '../components/ui/Modal'
import { formatLabel } from '../utils/formatLabel'


/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

function formatType(t) {
  return t
    ? t.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase())
    : '—'
}

function timeAgo(d) {
  if (!d) return ''
  const s = (new Date() - new Date(d)) / 1000
  if (s < 60) return 'Just now'
  if (s < 3600) return `${Math.floor(s / 60)}m ago`
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`
  return `${Math.floor(s / 86400)}d ago`
}

const COLORS = [
  '#7c3aed', '#3b82f6', '#ec4899', '#10b981',
  '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4',
]


/* ═══════════════════════════════════════════════
   DESIGN SYSTEM COMPONENTS
   ═══════════════════════════════════════════════ */

function AnimNum({ value, duration = 800 }) {
  const [display, setDisplay] = useState(0)
  const isStr = typeof value === 'string'

  useEffect(() => {
    if (isStr) return
    const num = Number(value) || 0
    const startTime = Date.now()
    const step = () => {
      const elapsed = Date.now() - startTime
      const progress = Math.min(elapsed / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * num))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  if (isStr) return <span>{value}</span>
  return <span>{display}</span>
}


function LiveClock({ dk }) {
  const [t, setT] = useState(new Date())

  useEffect(() => {
    const i = setInterval(() => setT(new Date()), 1000)
    return () => clearInterval(i)
  }, [])

  return (
    <div style={{ textAlign: 'right' }}>
      <p style={{
        fontSize: 22,
        fontWeight: 800,
        color: 'rgba(255,255,255,0.9)',
        fontVariantNumeric: 'tabular-nums',
        letterSpacing: '-0.02em',
      }}>
        {t.toLocaleTimeString('en-AU', {
          hour: '2-digit',
          minute: '2-digit',
          hour12: true,
        })}
      </p>
      <p style={{
        fontSize: 11,
        color: 'rgba(255,255,255,0.4)',
        fontWeight: 500,
      }}>
        {t.toLocaleDateString('en-AU', {
          weekday: 'long',
          day: 'numeric',
          month: 'short',
        })}
      </p>
    </div>
  )
}


function Glass({ children, className = '', glow, style = {}, hover = false, dark = false, ...p }) {
  return (
    <div
      className={`rounded-2xl border ${hover ? 'transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}
      style={{
        background: dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        borderColor: dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)',
        boxShadow: glow
          ? `0 8px 32px -8px ${glow}`
          : '0 4px 16px -4px rgba(0,0,0,0.06)',
        ...style,
      }}
      {...p}
    >
      {children}
    </div>
  )
}


function Orb({ color, size, top, left, right, bottom, delay = 0 }) {
  return (
    <div
      className="absolute rounded-full pointer-events-none"
      style={{
        width: size,
        height: size,
        background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
        top, left, right, bottom,
        opacity: 0.12,
        animation: `orbFloat ${6 + delay}s ease-in-out infinite`,
        animationDelay: `${delay}s`,
      }}
    />
  )
}


function Ring({ score, size = 140, dark = false }) {
  const r = (size - 16) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ
  const col = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ef4444'

  return (
    <div className="relative" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={dark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)'}
          strokeWidth="12"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 8px ${col}40)`,
          }}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <p className="text-3xl font-black" style={{ color: col }}>
          {score}
        </p>
        <p className="text-[10px] font-semibold" style={{ color: dark ? '#64748b' : '#9ca3af' }}>
          / 100
        </p>
      </div>
    </div>
  )
}


function Sparkline({ data, color, height = 32 }) {
  if (!data || data.length < 2) return null
  const max = Math.max(...data)
  const min = Math.min(...data)
  const range = max - min || 1
  const w = 80
  const h = height
  const pts = data
    .map((v, i) => `${(i / (data.length - 1)) * w},${h - ((v - min) / range) * h}`)
    .join(' ')

  return (
    <svg width={w} height={h} className="opacity-40">
      <polyline
        points={pts}
        fill="none"
        stroke={color}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  )
}


/* ── Typing effect for hero subtitle ── */
function TypeWriter({ texts }) {
  const [idx, setIdx] = useState(0)
  const [charIdx, setCharIdx] = useState(0)
  const [deleting, setDeleting] = useState(false)

  useEffect(() => {
    const text = texts[idx]
    if (!deleting && charIdx < text.length) {
      const t = setTimeout(() => setCharIdx(c => c + 1), 40 + Math.random() * 30)
      return () => clearTimeout(t)
    }
    if (!deleting && charIdx === text.length) {
      const t = setTimeout(() => setDeleting(true), 2500)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx > 0) {
      const t = setTimeout(() => setCharIdx(c => c - 1), 20)
      return () => clearTimeout(t)
    }
    if (deleting && charIdx === 0) {
      setDeleting(false)
      setIdx(i => (i + 1) % texts.length)
    }
  }, [charIdx, deleting, idx, texts])

  return (
    <span>
      {texts[idx].slice(0, charIdx)}
      <span style={{
        display: 'inline-block',
        width: 2,
        height: 16,
        background: 'rgba(255,255,255,0.6)',
        marginLeft: 2,
        verticalAlign: 'middle',
        animation: 'blink 1s step-end infinite',
      }} />
    </span>
  )
}


/* ═══════════════════════════════════════════════
   DEMO STAFF MAP DATA
   ═══════════════════════════════════════════════ */

const DEMO_STAFF_MAP = [
  {
    id: 1, name: 'Sarah Johnson', role: 'Support Worker',
    lat: -37.6797, lng: 145.0145, status: 'on_shift',
    participant: 'James Williams', phone: '0412 345 678',
    avatar: 'SJ', color: '#10b981', address: '12 High St, Thornbury',
  },
  {
    id: 2, name: 'Mike Chen', role: 'Support Worker',
    lat: -37.7658, lng: 145.0432, status: 'on_shift',
    participant: 'Emily Brown', phone: '0423 456 789',
    avatar: 'MC', color: '#3b82f6', address: '45 Station Rd, Ivanhoe',
  },
  {
    id: 3, name: 'Lisa Patel', role: 'Team Leader',
    lat: -37.7030, lng: 145.1063, status: 'travelling',
    participant: 'David Wilson', phone: '0434 567 890',
    avatar: 'LP', color: '#f59e0b', address: '78 Diamond Creek Rd, Greensborough',
  },
  {
    id: 4, name: 'Tom Nguyen', role: 'Support Worker',
    lat: -37.7163, lng: 145.0590, status: 'on_shift',
    participant: 'Sophie Clark', phone: '0445 678 901',
    avatar: 'TN', color: '#8b5cf6', address: '23 Plenty Rd, Bundoora',
  },
  {
    id: 5, name: 'Emma Davis', role: 'Coordinator',
    lat: -37.7329, lng: 145.1479, status: 'available',
    participant: null, phone: '0456 789 012',
    avatar: 'ED', color: '#ec4899', address: '91 Main Rd, Eltham',
  },
  {
    id: 6, name: 'Jack Robinson', role: 'Support Worker',
    lat: -37.7443, lng: 145.0157, status: 'on_shift',
    participant: 'Oliver Martin', phone: '0467 890 123',
    avatar: 'JR', color: '#06b6d4', address: '56 Bell St, Preston',
  },
  {
    id: 7, name: 'Priya Sharma', role: 'Support Worker',
    lat: -37.7144, lng: 145.1198, status: 'travelling',
    participant: 'Charlotte Harris', phone: '0478 901 234',
    avatar: 'PS', color: '#ef4444', address: '34 Were St, Montmorency',
  },
  {
    id: 8, name: 'Daniel Kim', role: 'Team Leader',
    lat: -37.7568, lng: 145.0668, status: 'on_shift',
    participant: 'Liam Taylor', phone: '0489 012 345',
    avatar: 'DK', color: '#7c3aed', address: '67 Burgundy St, Heidelberg',
  },
]


/* ═══════════════════════════════════════════════
   INTERACTIVE STAFF MAP — Leaflet + Carto Voyager
   ═══════════════════════════════════════════════ */

function StaffMap({ isDark, dk, c }) {
  const mapRef = useRef(null)

  useEffect(() => {
    if (!mapRef.current) return
    const container = mapRef.current

    const tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}@2x.png'

    const bgDark = isDark ? '#0f172a' : '#fff'
    const textMain = isDark ? '#e2e8f0' : '#1f2937'
    const textMuted = isDark ? '#94a3b8' : '#6b7280'
    const textFaint = isDark ? '#64748b' : '#9ca3af'
    const cardBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.98)'
    const borderCol = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.06)'
    const ringCol = isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)'
    const dotBorder = isDark ? '#0f172a' : '#ffffff'
    const subtleBg = isDark ? 'rgba(51,65,85,0.2)' : 'rgba(0,0,0,0.02)'
    const btnBg2 = isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9'
    const zoomBg = isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)'
    const zoomCol = isDark ? '#94a3b8' : '#475569'
    const zoomHov = isDark ? 'rgba(30,41,59,0.95)' : 'rgba(243,244,246,1)'
    const popBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.98)'
    const popShadow = isDark ? '0.4' : '0.12'
    const closeBg = isDark ? 'rgba(51,65,85,0.4)' : '#f1f5f9'
    const closeCol = isDark ? '#64748b' : '#94a3b8'

    /* Build marker HTML for each staff member using simple string concat */
    function markerHtml(s) {
      var pulse = ''
      if (s.status === 'on_shift') {
        pulse = '<div style="position:absolute;inset:-6px;border-radius:50%;border:2px solid ' + s.sc + ';animation:pulse 2s ease-out infinite;"></div>'
      }
      if (s.status === 'travelling') {
        pulse = '<div style="position:absolute;inset:-4px;border-radius:50%;border:2px dashed ' + s.sc + ';animation:spin 3s linear infinite;"></div>'
      }
      return '<div class="staff-marker" style="position:relative;width:44px;height:44px;">' +
        pulse +
        '<div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,' + s.color + ',' + s.color + 'cc);display:flex;align-items:center;justify-content:center;color:white;font-size:13px;font-weight:800;font-family:system-ui,-apple-system,sans-serif;box-shadow:0 4px 16px -2px ' + s.color + '50,0 0 0 3px ' + ringCol + ';position:relative;">' +
        s.avatar +
        '<div style="position:absolute;bottom:-1px;right:-1px;width:13px;height:13px;border-radius:50%;background:' + s.sc + ';border:2.5px solid ' + dotBorder + ';"></div>' +
        '</div>' +
        '<div style="position:absolute;bottom:-5px;left:50%;transform:translateX(-50%);width:22px;height:6px;border-radius:50%;background:rgba(0,0,0,0.12);filter:blur(3px);"></div>' +
        '</div>'
    }

    function popupHtml(s) {
      var partLine = s.participant
        ? '<span style="font-size:10px;color:' + textFaint + ';">with ' + s.participant + '</span>'
        : ''
      return '<div style="padding:16px 18px;font-family:system-ui,-apple-system,sans-serif;">' +
        '<div style="display:flex;align-items:center;gap:12px;">' +
        '<div style="width:46px;height:46px;border-radius:14px;background:linear-gradient(135deg,' + s.color + ',' + s.color + 'cc);display:flex;align-items:center;justify-content:center;color:white;font-size:16px;font-weight:800;flex-shrink:0;box-shadow:0 4px 14px -2px ' + s.color + '50;">' + s.avatar + '</div>' +
        '<div style="flex:1;min-width:0;">' +
        '<div style="font-size:14px;font-weight:700;color:' + textMain + ';">' + s.name + '</div>' +
        '<div style="font-size:11px;color:' + textMuted + ';margin-top:1px;">' + s.role + '</div>' +
        '<div style="display:flex;align-items:center;gap:6px;margin-top:5px;flex-wrap:wrap;">' +
        '<span style="font-size:10px;font-weight:700;padding:3px 9px;border-radius:7px;background:' + s.sc + '18;color:' + s.sc + ';">' + s.sl + '</span>' +
        partLine +
        '</div></div></div>' +
        '<div style="display:flex;align-items:center;gap:5px;margin-top:10px;font-size:11px;color:' + textFaint + ';padding:7px 11px;border-radius:9px;background:' + subtleBg + ';">' +
        '<span style="font-size:13px;">📍</span> ' + s.address +
        '</div>' +
        '<div style="display:flex;gap:6px;margin-top:10px;">' +
        '<a href="tel:' + s.phone + '" style="flex:1;padding:9px 0;border-radius:10px;background:linear-gradient(135deg,' + c.primary + ',' + c.adminHover + ');color:white;font-size:11px;font-weight:700;text-align:center;text-decoration:none;box-shadow:0 3px 10px -3px ' + c.primary + '50;">📞 Call</a>' +
        '<div style="flex:1;padding:9px 0;border-radius:10px;background:' + btnBg2 + ';color:' + textMuted + ';font-size:11px;font-weight:700;text-align:center;cursor:default;">👤 Profile</div>' +
        '</div></div>'
    }

    var staffData = DEMO_STAFF_MAP.map(function(s) {
      return {
        lat: s.lat, lng: s.lng, name: s.name, role: s.role,
        avatar: s.avatar, color: s.color, status: s.status,
        participant: s.participant, phone: s.phone, address: s.address,
        sc: s.status === 'on_shift' ? '#10b981' : s.status === 'travelling' ? '#f59e0b' : '#3b82f6',
        sl: s.status === 'on_shift' ? 'On Shift' : s.status === 'travelling' ? 'Travelling' : 'Available',
      }
    })

    var htmlParts = [
      '<!DOCTYPE html><html><head>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
      '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
      '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><' + '/script>',
      '<style>',
      '*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden}#map{width:100%;height:100vh}',
      '.leaflet-control-attribution{display:none!important}',
      '.leaflet-control-zoom{border:none!important;box-shadow:0 2px 12px -2px rgba(0,0,0,0.15)!important;border-radius:12px!important;overflow:hidden}',
      '.leaflet-control-zoom a{width:34px!important;height:34px!important;line-height:34px!important;font-size:16px!important;color:' + zoomCol + '!important;background:' + zoomBg + '!important;border:none!important}',
      '.leaflet-control-zoom a:hover{background:' + zoomHov + '!important}',
      '.staff-marker{transition:transform 0.3s cubic-bezier(0.16,1,0.3,1);cursor:pointer}',
      '.staff-marker:hover{transform:scale(1.25);z-index:9999!important}',
      '@keyframes pulse{0%{transform:scale(1);opacity:0.6}100%{transform:scale(2.8);opacity:0}}',
      '@keyframes spin{to{transform:rotate(360deg)}}',
      '.leaflet-popup-content-wrapper{border-radius:18px!important;box-shadow:0 16px 48px -8px rgba(0,0,0,' + popShadow + ')!important;background:' + popBg + '!important;border:1px solid ' + borderCol + '!important;padding:0!important}',
      '.leaflet-popup-content{margin:0!important;min-width:260px}',
      '.leaflet-popup-tip{background:' + popBg + '!important;box-shadow:none!important;border:1px solid ' + borderCol + '!important}',
      '.leaflet-popup-close-button{top:12px!important;right:12px!important;width:26px!important;height:26px!important;font-size:16px!important;color:' + closeCol + '!important;border-radius:8px;background:' + closeBg + '!important;text-align:center;line-height:26px!important}',
      '</style></head><body><div id="map"></div>',
      '<script>',
      'var map=L.map("map",{center:[-37.725,145.06],zoom:13,zoomControl:true,scrollWheelZoom:true,attributionControl:false});',
      'L.tileLayer("' + tileUrl + '",{maxZoom:18,subdomains:"abcd"}).addTo(map);',
    ]

    staffData.forEach(function(s) {
      var mHtml = markerHtml(s).replace(/"/g, "'").replace(/\n/g, '')
      var pHtml = popupHtml(s).replace(/"/g, "'").replace(/\n/g, '')
      htmlParts.push(
        'L.marker([' + s.lat + ',' + s.lng + '],{icon:L.divIcon({html:"' + mHtml + '",className:"",iconSize:[44,44],iconAnchor:[22,22],popupAnchor:[0,-28]})}).addTo(map).bindPopup("' + pHtml + '",{maxWidth:320,closeButton:true});'
      )
    })

    htmlParts.push(
      'map.fitBounds([[-37.78,144.98],[-37.67,145.17]],{padding:[40,40]});',
      '<' + '/script></body></html>'
    )

    var fullHtml = htmlParts.join('\n')
    var blob = new Blob([fullHtml], { type: 'text/html' })
    var blobUrl = URL.createObjectURL(blob)

    var iframe = document.createElement('iframe')
    iframe.src = blobUrl
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:18px;'
    iframe.title = 'Staff Location Map'

    container.innerHTML = ''
    container.appendChild(iframe)

    return function() {
      URL.revokeObjectURL(blobUrl)
    }
  }, [isDark, c.primary, c.adminHover])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: 420,
        minHeight: 300,
        borderRadius: 18,
        overflow: 'hidden',
        border: '1px solid ' + (isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.06)'),
        background: isDark
          ? 'linear-gradient(135deg, #0c1929, #162033)'
          : 'linear-gradient(135deg, #f0f7ff, #e8f1fb)',
      }}
    />
  )
}


/* ═══════════════════════════════════════════════
   MAIN DASHBOARD COMPONENT
   ═══════════════════════════════════════════════ */

export default function Dashboard() {
  const { user } = useAuth()
  const c = useBrandColors()
  const { isDark } = useTheme()

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    bg: isDark ? '#0f172a' : '#f5f3ff',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    gridStroke: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
    tickFill: isDark ? '#64748b' : '#94a3b8',
  }

  /* ── State ── */
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [chartsReady, setChartsReady] = useState(false)
  const [stats, setStats] = useState({})
  const [staffHours, setStaffHours] = useState([])
  const [recentIncidents, setRecentIncidents] = useState([])
  const [todayShifts, setTodayShifts] = useState([])
  const [expiringDocs, setExpiringDocs] = useState([])
  const [calMonth, setCalMonth] = useState(new Date())
  const [shiftDates, setShiftDates] = useState({})
  const [adminName, setAdminName] = useState('')
  const [formSubmissions, setFormSubmissions] = useState([])
  const [weeklyShiftData, setWeeklyShiftData] = useState([])
  const [incidentBreakdown, setIncidentBreakdown] = useState([])
  const [hoursOverTime, setHoursOverTime] = useState([])
  const [activityFeed, setActivityFeed] = useState([])
  const [billingStats, setBillingStats] = useState({ draft: 0, submitted: 0, paid: 0 })
  const [compScore, setCompScore] = useState(0)
  const [staffComp, setStaffComp] = useState({ total: 0, compliant: 0, expiring: 0, expired: 0 })
  const [shiftComp, setShiftComp] = useState({ completed: 0, total: 1 })
  const [goalStats, setGoalStats] = useState({ active: 0, avgProgress: 0 })
  const [sparkData, setSparkData] = useState({ shifts: [], hours: [], incidents: [] })
  const [calModal, setCalModal] = useState(null)

  /* ── Effects ── */
  useEffect(() => { load() }, [])
  useEffect(() => { loadCal() }, [calMonth])
  useEffect(() => {
    if (!loading) {
      setTimeout(() => setLoaded(true), 50)
      setTimeout(() => setChartsReady(true), 600)
    }
  }, [loading])

  /* ═══════════════════════════════════════════
     DATA LOADING — ALL SUPABASE QUERIES 100% PRESERVED
     ═══════════════════════════════════════════ */

  const load = async () => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const weekAgo = new Date(Date.now() - 7 * 864e5).toISOString().split('T')[0]
      const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]

      const [sR, pR, iR, shR, dR, tR, aR, aiR, cR, auR, gR, mR, trR] = await Promise.all([
        supabase.from('staff').select('id,first_name,last_name,status,role'),
        supabase.from('participants').select('id,status'),
        supabase.from('incidents')
          .select('id,incident_type,severity,status,created_at,description')
          .order('created_at', { ascending: false })
          .limit(5),
        supabase.from('shifts')
          .select('id,staff_id,staff:staff(first_name,last_name),start_time,end_time,clock_in,clock_out,status,shift_date'),
        supabase.from('documents')
          .select('id,name,document_type,expiry_date,staff_id,staff:staff(first_name,last_name)'),
        supabase.from('shifts')
          .select('id,staff:staff(first_name,last_name),participant:participants(first_name,last_name),start_time,end_time,status,title,shift_date')
          .eq('shift_date', today)
          .order('start_time'),
        supabase.from('staff')
          .select('first_name,last_name')
          .eq('role', 'admin')
          .limit(1),
        supabase.from('incidents')
          .select('id,incident_type,severity,status,created_at')
          .gte('created_at', thirtyAgo + 'T00:00:00'),
        supabase.from('ndis_claims')
          .select('id,total_amount,status')
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase.from('audit_logs')
          .select('id,action,entity_type,description,user_id,created_at,staff:user_id(first_name,last_name)')
          .order('created_at', { ascending: false })
          .limit(10)
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase.from('goals')
          .select('id,status,progress')
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase.from('medications')
          .select('id,status')
          .then(r => r)
          .catch(() => ({ data: [] })),
        supabase.from('staff_training')
          .select('id,status,expiry_date,staff_id')
          .then(r => r)
          .catch(() => ({ data: [] })),
      ])

      const staff = sR.data || []
      const parts = pR.data || []
      const incs = iR.data || []
      const shifts = shR.data || []
      const docs = dR.data || []
      const allInc = aiR.data || []
      const claims = cR.data || []
      const audits = auR.data || []
      const goals = gR.data || []
      const meds = mR.data || []
      const training = trR.data || []

      if (aR.data?.[0]) setAdminName(aR.data[0].first_name)

      /* Compute stats */
      const aStaff = staff.filter(s => s.status === 'active').length
      const aParts = parts.filter(p => p.status === 'active').length
      const oInc = incs.filter(i => i.status === 'open' || i.status === 'investigating').length
      const cWeek = shifts.filter(s => s.status === 'completed' && s.shift_date >= weekAgo).length
      const tWeek = shifts.filter(s => s.shift_date >= weekAgo).length
      const sToday = (tR.data || []).length
      const wH = shifts
        .filter(s => s.status === 'completed' && s.shift_date >= weekAgo && s.clock_in && s.clock_out)
        .reduce((a, s) => a + (new Date(s.clock_out) - new Date(s.clock_in)) / 36e5, 0)
      const aMeds = meds.filter(m => m.status === 'active').length

      setStats({
        activeStaff: aStaff,
        activeParticipants: aParts,
        openIncidents: oInc,
        completedShiftsWeek: cWeek,
        scheduledToday: sToday,
        totalStaff: staff.length,
        weekHours: wH,
        activeMeds: aMeds,
      })

      setRecentIncidents(incs.slice(0, 5))
      setTodayShifts(tR.data || [])
      setShiftComp({ completed: cWeek, total: tWeek || 1 })

      /* Goals */
      const aGoals = goals.filter(g => g.status === 'active')
      const avgP = aGoals.length
        ? Math.round(aGoals.reduce((a, g) => a + (g.progress || 0), 0) / aGoals.length)
        : 0
      setGoalStats({ active: aGoals.length, avgProgress: avgP })

      /* Expiring docs */
      const now = new Date()
      const exp = docs
        .filter(d => {
          if (!d.expiry_date) return false
          const diff = Math.ceil((new Date(d.expiry_date) - now) / 864e5)
          return diff <= 30 && diff >= -30
        })
        .sort((a, b) => new Date(a.expiry_date) - new Date(b.expiry_date))
        .slice(0, 5)
      setExpiringDocs(exp)

      /* Compliance score */
      const eDocs = docs.filter(d => d.expiry_date && new Date(d.expiry_date) < now).length
      const eTrain = training.filter(t => t.expiry_date && new Date(t.expiry_date) < now).length
      const dScore = Math.max(0, 100 - (eDocs / (docs.length || 1)) * 100)
      const tScore = Math.max(0, 100 - (eTrain / (training.length || 1)) * 100)
      setCompScore(
        Math.round(Math.max(0, Math.min(100, (dScore * .4 + tScore * .4 + 100 * .2) - Math.min(oInc * 5, 20))))
      )

      /* Staff compliance */
      const sIds = new Set(staff.filter(s => s.status === 'active').map(s => s.id))
      const sExp = new Set()
      const sExpiring = new Set()
      docs.forEach(d => {
        if (!d.expiry_date || !d.staff_id) return
        const diff = Math.ceil((new Date(d.expiry_date) - now) / 864e5)
        if (diff < 0) sExp.add(d.staff_id)
        else if (diff <= 30) sExpiring.add(d.staff_id)
      })
      setStaffComp({
        total: sIds.size,
        compliant: sIds.size - sExp.size - sExpiring.size,
        expiring: sExpiring.size,
        expired: sExp.size,
      })

      /* Staff hours leaderboard */
      const hByS = {}
      shifts.forEach(s => {
        if (s.status === 'completed' && s.clock_in && s.clock_out) {
          const n = s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Unknown'
          const h = (new Date(s.clock_out) - new Date(s.clock_in)) / 36e5
          if (!hByS[n]) hByS[n] = { name: n, hours: 0, shifts: 0, id: s.staff_id }
          hByS[n].hours += h
          hByS[n].shifts += 1
        }
      })
      setStaffHours(Object.values(hByS).sort((a, b) => b.hours - a.hours))

      /* Weekly shift data + sparklines */
      const wD = []
      const shiftSpark = []
      const hoursSpark = []
      const incSpark = []
      for (let i = 6; i >= 0; i--) {
        const d = new Date(Date.now() - i * 864e5)
        const ds = d.toISOString().split('T')[0]
        const comp = shifts.filter(s => s.shift_date === ds && s.status === 'completed').length
        const sched = shifts.filter(s => s.shift_date === ds && s.status === 'scheduled').length
        const dayH = shifts
          .filter(s => s.shift_date === ds && s.status === 'completed' && s.clock_in && s.clock_out)
          .reduce((a, s) => a + (new Date(s.clock_out) - new Date(s.clock_in)) / 36e5, 0)
        const dayInc = allInc.filter(inc => inc.created_at && inc.created_at.startsWith(ds)).length
        wD.push({
          day: d.toLocaleDateString('en-AU', { weekday: 'short' }),
          completed: comp,
          scheduled: sched,
        })
        shiftSpark.push(comp + sched)
        hoursSpark.push(Math.round(dayH * 10) / 10)
        incSpark.push(dayInc)
      }
      setWeeklyShiftData(wD)
      setSparkData({ shifts: shiftSpark, hours: hoursSpark, incidents: incSpark })

      /* Incident breakdown */
      const iT = {}
      allInc.forEach(i => {
        const t = formatType(i.incident_type || 'other')
        iT[t] = (iT[t] || 0) + 1
      })
      setIncidentBreakdown(
        Object.entries(iT)
          .map(([n, v]) => ({ name: n, value: v }))
          .sort((a, b) => b.value - a.value)
      )

      /* Hours over time */
      const wkD = []
      for (let w = 3; w >= 0; w--) {
        const ws = new Date(Date.now() - (w * 7 + 6) * 864e5).toISOString().split('T')[0]
        const we = new Date(Date.now() - w * 7 * 864e5).toISOString().split('T')[0]
        const h = shifts
          .filter(s => s.status === 'completed' && s.shift_date >= ws && s.shift_date <= we && s.clock_in && s.clock_out)
          .reduce((a, s) => a + (new Date(s.clock_out) - new Date(s.clock_in)) / 36e5, 0)
        wkD.push({
          week: `Week ${4 - w}`,
          hours: Math.round(h * 10) / 10,
          shifts: shifts.filter(s => s.shift_date >= ws && s.shift_date <= we).length,
        })
      }
      setHoursOverTime(wkD)

      /* Billing stats */
      const bill = { draft: 0, submitted: 0, paid: 0 }
      claims.forEach(cl => {
        const a = parseFloat(cl.total_amount) || 0
        if (cl.status === 'draft' || cl.status === 'ready') bill.draft += a
        else if (cl.status === 'submitted') bill.submitted += a
        else if (cl.status === 'paid') bill.paid += a
      })
      setBillingStats(bill)

      /* Activity feed */
      const ic = {
        login: '🔑', create: '➕', update: '✏️', delete: '🗑️',
        clock_in: '⏰', clock_out: '⏱️', upload: '📤', export: '📥', approve: '✅',
      }
      setActivityFeed(
        (audits || []).map(a => ({
          id: a.id,
          icon: ic[a.action] || '📋',
          text: `${a.staff ? `${a.staff.first_name} ${a.staff.last_name}` : 'System'} ${a.description || a.action}`,
          time: a.created_at,
        }))
      )

      /* Form submissions */
      try {
        const { data: fs } = await supabase
          .from('form_submissions')
          .select('*,staff:staff(first_name,last_name)')
          .order('submitted_at', { ascending: false })
          .limit(5)
        if (fs) setFormSubmissions(fs)
      } catch {}

    } catch (e) {
      console.error('Dashboard:', e)
    } finally {
      setLoading(false)
    }
  }

  /* ── Calendar data loader ── */
  const loadCal = async () => {
    const y = calMonth.getFullYear()
    const m = calMonth.getMonth()
    const s = new Date(y, m, 1).toISOString().split('T')[0]
    const e = new Date(y, m + 1, 0).toISOString().split('T')[0]
    const { data } = await supabase.from('shifts')
      .select('shift_date,status')
      .gte('shift_date', s)
      .lte('shift_date', e)
    const d = {};
    (data || []).forEach(s => {
      if (!d[s.shift_date]) d[s.shift_date] = { total: 0, completed: 0 }
      d[s.shift_date].total++
      if (s.status === 'completed') d[s.shift_date].completed++
    })
    setShiftDates(d)
  }

  /* ── Calendar helpers ── */
  const calDays = () => {
    const y = calMonth.getFullYear()
    const m = calMonth.getMonth()
    const f = new Date(y, m, 1).getDay()
    const dim = new Date(y, m + 1, 0).getDate()
    const o = f === 0 ? 6 : f - 1
    const d = []
    for (let i = 0; i < o; i++) d.push(null)
    for (let i = 1; i <= dim; i++) d.push(i)
    return d
  }

  const isToday = d => {
    if (!d) return false
    const n = new Date()
    return d === n.getDate() && calMonth.getMonth() === n.getMonth() && calMonth.getFullYear() === n.getFullYear()
  }

  const getDS = d =>
    `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  /* ── Stagger animation ── */
  const stg = i => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })

  /* ── Custom glass tooltip for all charts ── */
  const CT = ({ active, payload, label }) => {
    if (!active || !payload?.length) return null
    return (
      <div style={{
        background: isDark ? 'rgba(15,23,42,0.95)' : 'rgba(255,255,255,0.96)',
        backdropFilter: 'blur(20px)',
        WebkitBackdropFilter: 'blur(20px)',
        border: `1px solid ${isDark ? 'rgba(51,65,85,0.6)' : 'rgba(0,0,0,0.08)'}`,
        borderRadius: 16,
        padding: '14px 18px',
        boxShadow: isDark
          ? '0 16px 40px -8px rgba(0,0,0,0.5)'
          : '0 16px 40px -8px rgba(0,0,0,0.12)',
        minWidth: 140,
      }}>
        <p style={{
          fontWeight: 800,
          fontSize: 13,
          color: dk.text,
          marginBottom: 8,
          paddingBottom: 6,
          borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.06)'}`,
        }}>
          {label}
        </p>
        {payload.map((p, i) => (
          <div
            key={i}
            style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: 16,
              marginTop: i > 0 ? 6 : 0,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
              <div style={{
                width: 8,
                height: 8,
                borderRadius: 3,
                background: p.color,
                boxShadow: `0 0 6px ${p.color}40`,
              }} />
              <span style={{ fontSize: 12, color: dk.textMuted, fontWeight: 500 }}>
                {p.name}
              </span>
            </div>
            <span style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>
              {p.value}
            </span>
          </div>
        ))}
      </div>
    )
  }

  /* ── Calendar click handler ── */
  const handleCalClick = (day) => {
    if (!day) return
    const ds = getDS(day)
    const data = shiftDates[ds]
    if (data) {
      setCalModal({ day, dateStr: ds, ...data })
    }
  }


  /* ═══════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════ */

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center h-80 gap-4">
        <div className="relative">
          <div
            className="w-20 h-20 rounded-3xl flex items-center justify-center"
            style={{
              background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
              boxShadow: `0 0 40px ${c.primary}40`,
            }}
          >
            <Sparkles size={32} className="text-white" />
          </div>
          <div
            className="absolute inset-0 rounded-3xl"
            style={{
              background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
              animation: 'ping 1.5s cubic-bezier(0,0,0.2,1) infinite',
              opacity: 0.3,
            }}
          />
        </div>
        <p className="text-sm font-medium" style={{ color: dk.textMuted }}>
          Loading dashboard...
        </p>
      </div>
    )
  }


  /* ═══════════════════════════════════════════
     COMPUTED VALUES
     ═══════════════════════════════════════════ */

  const cPct = Math.round((shiftComp.completed / shiftComp.total) * 100)
  const totalRevenue = billingStats.paid + billingStats.submitted + billingStats.draft
  const heroTexts = [
    "Here's what's happening across your organisation today",
    `${stats.scheduledToday || 0} shifts scheduled for today`,
    `${stats.activeStaff || 0} staff members currently active`,
    `Compliance score: ${compScore}/100`,
  ]
  const leaderMedals = [Crown, Medal, Award]


  /* ═══════════════════════════════════════════
     RENDER
     ═══════════════════════════════════════════ */

  return (
    <div className="space-y-4 md:space-y-5 relative">

      {/* ── Keyframes ── */}
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-15px) scale(1.03) } }
        @keyframes countUp { from { opacity:0; transform:translateY(10px) scale(0.95) } to { opacity:1; transform:translateY(0) scale(1) } }
        @keyframes shimmer { 0% { background-position:200% 0 } 100% { background-position:-200% 0 } }
        @keyframes ping { 75%,100% { transform:scale(1.8); opacity:0 } }
        @keyframes blink { 0%,100% { opacity:1 } 50% { opacity:0 } }
        @keyframes pulse-glow { 0%,100% { box-shadow:0 0 0 0 rgba(16,185,129,0.4) } 50% { box-shadow:0 0 20px 4px rgba(16,185,129,0.1) } }
        @keyframes map-pulse { 0% { transform:scale(1);opacity:0.4 } 100% { transform:scale(2.5);opacity:0 } }
        @keyframes map-spin { to { transform:rotate(360deg) } }
        @keyframes slideUp { from { opacity:0;transform:translateY(12px) } to { opacity:1;transform:translateY(0) } }
        @keyframes chart-grow { from { opacity:0 } to { opacity:1 } }
        .count-up { animation:countUp .7s cubic-bezier(.16,1,.3,1) forwards }
        .no-scrollbar::-webkit-scrollbar { display:none }
        .no-scrollbar { -ms-overflow-style:none; scrollbar-width:none }
        .stat-card:hover .stat-icon { transform:scale(1.15) rotate(-5deg) }
        .stat-card:hover .stat-spark { opacity:0.7 }
        .stat-card .stat-spark { opacity:0.3; transition:opacity 0.3s }
        .stat-card .stat-icon { transition:transform 0.3s cubic-bezier(.16,1,.3,1) }
        .recharts-wrapper { cursor:default !important }
        .recharts-surface { overflow:visible !important }
      `}</style>

      {/* ── Background orbs ── */}
      <Orb color={c.primary} size="400px" top="-120px" right="-100px" delay={0} />
      <Orb color="#3b82f6" size="320px" top="600px" left="-120px" delay={2} />
      <Orb color="#ec4899" size="260px" bottom="400px" right="5%" delay={4} />
      <Orb color="#10b981" size="200px" bottom="150px" left="25%" delay={3} />
      <Orb color="#f59e0b" size="180px" top="300px" left="60%" delay={5} />


      {/* ═══════ HERO BANNER — circles always white ═══════ */}
      <div data-tour="tour-hero" style={stg(0)}>
  <div
    className="p-4 sm:p-6 md:p-8 rounded-2xl sm:rounded-3xl relative overflow-hidden"
          style={{
            background: `linear-gradient(135deg, ${c.primary} 0%, ${c.adminHover} 40%, #3b82f6 70%, #06b6d4 100%)`,
          }}
        >
          {/* Decorative circles — ALWAYS white regardless of dark mode */}
          <div
            className="absolute top-0 right-0 w-96 h-96 rounded-full -translate-y-1/3 translate-x-1/4"
            style={{ background: 'rgba(255,255,255,0.1)' }}
          />
          <div
            className="absolute bottom-0 left-0 w-64 h-64 rounded-full translate-y-1/3 -translate-x-1/4"
            style={{ background: 'rgba(255,255,255,0.05)' }}
          />
          <div
            className="absolute rounded-full"
            style={{
              top: '25%', right: '25%', width: 128, height: 128,
              background: 'radial-gradient(circle, rgba(255,255,255,0.08), transparent)',
              animation: 'orbFloat 8s ease-in-out infinite',
            }}
          />

          {/* Dot grid overlay */}
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: 'radial-gradient(rgba(255,255,255,0.1) 1px, transparent 1px)',
              backgroundSize: '28px 28px',
              opacity: 0.4,
            }}
          />

          {/* Floating dots — ALWAYS white */}
          {[
            { t: '12%', r: '18%', s: 4, d: 0 },
            { t: '60%', r: '8%', s: 3, d: 1.5 },
            { b: '20%', l: '30%', s: 5, d: 3 },
            { t: '30%', l: '15%', s: 2, d: 2 },
          ].map((dot, i) => (
            <div
              key={i}
              className="absolute rounded-full"
              style={{
                top: dot.t, right: dot.r, bottom: dot.b, left: dot.l,
                width: dot.s * 2, height: dot.s * 2,
                background: 'rgba(255,255,255,0.2)',
                animation: `orbFloat ${4 + dot.d}s ease-in-out infinite ${dot.d}s`,
              }}
            />
          ))}

          {/* Hero content */}
          <div className="relative z-10 flex flex-col md:flex-row md:items-start md:justify-between gap-6">
            <div className="flex-1">
              {/* Badge row */}
              <div className="flex items-center gap-2 mb-2 flex-wrap">
                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <Sparkles size={12} style={{ color: 'rgba(255,255,255,0.7)' }} />
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    {getGreeting()}
                  </span>
                </div>

                <div
                  className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm"
                  style={{ background: 'rgba(255,255,255,0.1)' }}
                >
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  <span
                    className="text-[11px] font-semibold"
                    style={{ color: 'rgba(255,255,255,0.7)' }}
                  >
                    System Online
                  </span>
                </div>

                {compScore >= 80 && (
                  <div
                    className="flex items-center gap-1.5 px-3 py-1 rounded-full backdrop-blur-sm"
                    style={{
                      background: 'rgba(16,185,129,0.25)',
                      border: '1px solid rgba(16,185,129,0.3)',
                    }}
                  >
                    <Shield size={12} style={{ color: '#34d399' }} />
                    <span className="text-[11px] font-semibold" style={{ color: '#6ee7b7' }}>
                      Audit Ready
                    </span>
                  </div>
                )}
              </div>

              <h1 className="text-2xl sm:text-3xl md:text-5xl font-black text-white tracking-tight leading-tight">
                Welcome back, {adminName || 'Admin'}
              </h1>

              <p className="text-sm mt-2 h-5" style={{ color: 'rgba(255,255,255,0.4)' }}>
                <TypeWriter texts={heroTexts} />
              </p>

              {/* Hero stat pills */}
              <div className="flex flex-wrap gap-2 mt-5">
                {[
                  { icon: Activity, text: `${stats.scheduledToday} shifts today`, color: 'rgba(255,255,255,.15)' },
                  { icon: Clock, text: `${stats.weekHours?.toFixed(0) || 0}h this week`, color: 'rgba(255,255,255,.12)' },
                  { icon: Users, text: `${stats.activeStaff} staff active`, color: 'rgba(255,255,255,.12)' },
                  { icon: Heart, text: `${stats.activeParticipants} participants`, color: 'rgba(255,255,255,.10)' },
                  ...(stats.openIncidents > 0
                    ? [{ icon: AlertTriangle, text: `${stats.openIncidents} open incidents`, color: 'rgba(239,68,68,.4)' }]
                    : []),
                ].map((p, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white backdrop-blur-sm transition-all hover:scale-105 cursor-default"
                    style={{ background: p.color }}
                  >
                    <p.icon size={13} /> {p.text}
                  </div>
                ))}
              </div>
            </div>

            {/* Right side: clock + quick actions */}
            <div className="flex flex-col items-end gap-3 shrink-0">
              <LiveClock dk={dk} />
              <div className="flex gap-2">
                {[
                  { icon: Plus, label: 'New Shift', to: '/admin/roster' },
                  { icon: BarChart3, label: 'Reports', to: '/admin/reports' },
                  { icon: Shield, label: 'Audit', to: '/admin/audit-report' },
                ].map((a, i) => (
                  <Link
                    key={i}
                    to={a.to}
                    className="flex flex-col items-center gap-1 px-3.5 py-2.5 rounded-2xl text-white transition-all hover:scale-110 active:scale-95"
                    style={{
                      background: 'rgba(255,255,255,.12)',
                      backdropFilter: 'blur(8px)',
                    }}
                  >
                    <a.icon size={16} />
                    <span className="text-[9px] font-bold">{a.label}</span>
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>


      {/* ═══════ STAT CARDS ═══════ */}
     <div data-tour="tour-stats" className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2 md:gap-3">
        {[
          { to: '/admin/participants', icon: Users, label: 'Participants', value: stats.activeParticipants, grad: 'linear-gradient(135deg,#3b82f6,#60a5fa)', glow: 'rgba(59,130,246,.2)', spark: sparkData.shifts, sparkCol: '#3b82f6' },
          { to: '/admin/staff', icon: UserCog, label: 'Active Staff', value: stats.activeStaff, grad: `linear-gradient(135deg,${c.primary},${c.adminHover})`, glow: `${c.primary}35`, spark: sparkData.hours, sparkCol: c.primary },
          { to: '/admin/incidents', icon: AlertTriangle, label: 'Incidents', value: stats.openIncidents, grad: 'linear-gradient(135deg,#ef4444,#f87171)', glow: 'rgba(239,68,68,.2)', spark: sparkData.incidents, sparkCol: '#ef4444' },
          { to: '/admin/roster', icon: CheckCircle, label: 'Shifts/Wk', value: stats.completedShiftsWeek, grad: 'linear-gradient(135deg,#10b981,#34d399)', glow: 'rgba(16,185,129,.2)', spark: sparkData.shifts, sparkCol: '#10b981' },
          { to: '/admin/billing', icon: DollarSign, label: 'Revenue', value: `$${((billingStats.paid + billingStats.submitted) / 1000).toFixed(0)}k`, grad: 'linear-gradient(135deg,#8b5cf6,#a78bfa)', glow: 'rgba(139,92,246,.2)' },
          { to: '/admin/medications', icon: Pill, label: 'Active Meds', value: stats.activeMeds || 0, grad: 'linear-gradient(135deg,#ec4899,#f472b6)', glow: 'rgba(236,72,153,.2)' },
          { to: '/admin/training', icon: GraduationCap, label: 'Training', value: `${staffComp.compliant}/${staffComp.total}`, grad: 'linear-gradient(135deg,#f59e0b,#fbbf24)', glow: 'rgba(245,158,11,.2)' },
          { to: '/admin/budget', icon: Target, label: 'Goals', value: goalStats.active, grad: 'linear-gradient(135deg,#06b6d4,#22d3ee)', glow: 'rgba(6,182,212,.2)' },
        ].map((cd, i) => (
          <Link key={cd.to} to={cd.to} style={stg(i + 1)}>
            <Glass dark={isDark} hover glow={cd.glow} className="p-3.5 group stat-card cursor-pointer relative overflow-hidden">
              <div className="absolute bottom-0 right-0 stat-spark">
                <Sparkline data={cd.spark} color={cd.sparkCol} height={28} />
              </div>
              <div
                className="w-10 h-10 rounded-xl flex items-center justify-center shadow-lg mb-2.5 stat-icon"
                style={{ background: cd.grad }}
              >
                <cd.icon size={18} className="text-white" />
              </div>
              <p className="text-xl font-extrabold count-up relative z-10" style={{ color: dk.text }}>
                <AnimNum value={cd.value} />
              </p>
              <p className="text-[10px] font-medium mt-0.5 relative z-10" style={{ color: dk.textFaint }}>
                {cd.label}
              </p>
            </Glass>
          </Link>
        ))}
      </div>


      {/* ═══════ COMPLIANCE + PROGRESS + BILLING ═══════ */}
  <div data-tour="tour-score" className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Compliance Ring */}
        <div style={stg(10)}>
          <Glass dark={isDark} className="p-6 h-full flex flex-col items-center" glow="rgba(16,185,129,.12)">
            <h3 className="font-bold flex items-center gap-2 mb-5 self-start" style={{ color: dk.text }}>
              <Shield size={18} className="text-emerald-500" /> Compliance Score
            </h3>
            <Ring score={compScore} dark={isDark} size={150} />
            <p className="text-base font-bold mt-4" style={{
              color: compScore >= 80 ? '#10b981' : compScore >= 60 ? '#f59e0b' : '#ef4444',
            }}>
              {compScore >= 80 ? 'Audit Ready' : compScore >= 60 ? 'Needs Attention' : 'At Risk'}
            </p>
            <p className="text-[10px] mt-1 text-center" style={{ color: dk.textFaint }}>
              Based on docs, training & incidents
            </p>
            <div className="flex gap-2 mt-4 w-full" style={{ flexWrap: 'wrap' }}>
              <Link
                to="/admin/audit-report"
                className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl text-white transition-all hover:opacity-80"
                style={{
                  background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                  boxShadow: `0 4px 12px -4px ${c.primary}50`,
                }}
              >
                Full Report
              </Link>
              <Link
                to="/admin/training"
                className="flex-1 text-center text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-80"
                style={{
                  background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                  color: dk.textMuted,
                }}
              >
                Training
              </Link>
            </div>
          </Glass>
        </div>

        {/* Weekly Progress */}
        <div style={stg(11)}>
          <Glass dark={isDark} className="p-6 h-full" glow="rgba(59,130,246,.1)">
            <h3 className="font-bold flex items-center gap-2 mb-5" style={{ color: dk.text }}>
              <TrendingUp size={18} className="text-blue-500" /> Weekly Progress
            </h3>
            <div className="space-y-5">
              {[
                { label: 'Shift Completion', pct: cPct, color: '#3b82f6', sub: `${shiftComp.completed} of ${shiftComp.total} shifts` },
                { label: 'Goal Progress', pct: goalStats.avgProgress, color: '#8b5cf6', sub: `${goalStats.active} active goals` },
                { label: 'Staff Compliance', pct: staffComp.total ? Math.round(staffComp.compliant / staffComp.total * 100) : 100, color: '#10b981', sub: `${staffComp.compliant} compliant${staffComp.expired > 0 ? ` · ${staffComp.expired} expired` : ''}` },
              ].map((b, i) => (
                <div key={i}>
                  <div className="flex justify-between mb-2">
                    <span className="text-xs font-semibold" style={{ color: dk.textSoft }}>{b.label}</span>
                    <span className="text-sm font-black" style={{ color: b.color }}>{b.pct}%</span>
                  </div>
                  <div className="h-3.5 rounded-full overflow-hidden" style={{ background: dk.subtleBg2 }}>
                    <div
                      className="h-full rounded-full transition-all duration-1000 relative"
                      style={{ width: `${b.pct}%`, background: `linear-gradient(90deg, ${b.color}, ${b.color}cc)` }}
                    >
                      <div className="absolute inset-0 rounded-full" style={{
                        background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                        backgroundSize: '200% 100%',
                        animation: 'shimmer 2s infinite',
                      }} />
                    </div>
                  </div>
                  <p className="text-[10px] mt-1.5" style={{ color: dk.textFaint }}>{b.sub}</p>
                </div>
              ))}
            </div>
          </Glass>
        </div>

        {/* Revenue Pipeline */}
        <div style={stg(12)}>
          <Glass dark={isDark} className="p-6 h-full" glow="rgba(139,92,246,.1)">
            <h3 className="font-bold flex items-center gap-2 mb-2" style={{ color: dk.text }}>
              <DollarSign size={18} className="text-violet-500" /> Revenue Pipeline
            </h3>
            <p className="text-3xl font-black mb-4" style={{ color: dk.text }}>
              ${totalRevenue > 0 ? (totalRevenue / 1000).toFixed(1) + 'k' : '0'}
            </p>
            <div className="space-y-3">
              {[
                { l: 'Draft Claims', v: billingStats.draft, color: '#6b7280', pct: totalRevenue ? billingStats.draft / totalRevenue * 100 : 0 },
                { l: 'Submitted', v: billingStats.submitted, color: '#f59e0b', pct: totalRevenue ? billingStats.submitted / totalRevenue * 100 : 0 },
                { l: 'Paid', v: billingStats.paid, color: '#10b981', pct: totalRevenue ? billingStats.paid / totalRevenue * 100 : 0 },
              ].map((it, i) => (
                <div key={i}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] uppercase font-bold tracking-wider" style={{ color: it.color }}>{it.l}</span>
                    <span className="text-sm font-extrabold" style={{ color: it.color }}>
                      ${it.v.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                    </span>
                  </div>
                  <div className="h-2 rounded-full overflow-hidden" style={{ background: dk.subtleBg2 }}>
                    <div className="h-full rounded-full" style={{ width: `${it.pct}%`, background: it.color, transition: 'width 1s' }} />
                  </div>
                </div>
              ))}
            </div>
            <Link
              to="/admin/billing"
              className="flex items-center justify-center gap-1.5 mt-4 text-xs font-bold py-2.5 rounded-xl transition-all hover:opacity-80 text-white"
              style={{
                background: 'linear-gradient(135deg, #8b5cf6, #a78bfa)',
                boxShadow: '0 4px 12px -4px rgba(139,92,246,0.4)',
              }}
            >
              View Billing <ArrowRight size={12} />
            </Link>
          </Glass>
        </div>
      </div>

{/* ═══════ STAFF MAP ═══════ */}
  <div data-tour="tour-map" style={stg(9)}>
        <Glass dark={isDark} className="p-5" glow={`${c.primary}10`}>
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
              <MapPin size={18} style={{ color: c.primary }} /> Staff Locations
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </h3>
            <Link
              to="/admin/roster"
              className="text-xs font-semibold hover:underline flex items-center gap-1"
              style={{ color: c.primary }}
            >
              View Roster <ArrowUpRight size={12} />
            </Link>
          </div>
          <StaffMap isDark={isDark} dk={dk} c={c} />
        </Glass>
      </div>

      {/* ═══════ ANIMATED CHARTS ═══════ */}
<div data-tour="tour-charts" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Shifts This Week — animated bars */}
        <div className="lg:col-span-2" style={stg(13)}>
          <Glass dark={isDark} className="p-5" glow={`${c.primary}12`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
                <BarChart3 size={18} style={{ color: c.primary }} /> Shifts This Week
              </h3>
              <Link to="/admin/roster" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: c.primary }}>
                View Roster <ArrowUpRight size={12} />
              </Link>
            </div>
            <div
              style={{
                height: 224,
                opacity: loaded ? 1 : 0,
                transform: loaded ? 'translateY(0)' : 'translateY(10px)',
                transition: 'all 0.8s cubic-bezier(.16,1,.3,1) 0.3s',
              }}
            >
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={weeklyShiftData} barGap={4}>
                  <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={dk.gridStroke} />
                  <XAxis dataKey="day" tick={{ fontSize: 11, fill: dk.tickFill }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 11, fill: dk.tickFill }} axisLine={false} tickLine={false} allowDecimals={false} width={30} />
                  <Tooltip
                    content={<CT />}
                    cursor={{
                      fill: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.03)',
                      radius: 8,
                    }}
                  />
                  <Bar
                    dataKey="completed"
                    name="Completed"
                    fill={c.primary}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1400}
                    animationBegin={300}
                    animationEasing="ease-out"
                  />
                  <Bar
                    dataKey="scheduled"
                    name="Scheduled"
                    fill={isDark ? '#334155' : '#e2e8f0'}
                    radius={[8, 8, 0, 0]}
                    animationDuration={1400}
                    animationBegin={500}
                    animationEasing="ease-out"
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </Glass>
        </div>

        {/* Incidents — animated pie */}
        <div style={stg(14)}>
          <Glass dark={isDark} className="p-5 h-full" glow="rgba(239,68,68,.08)">
            <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: dk.text }}>
              <AlertTriangle size={18} className="text-red-500" /> Incidents (30d)
            </h3>
            {incidentBreakdown.length > 0 ? (
              <>
                <div
                  className="h-44 flex items-center justify-center"
                  style={{
                    opacity: loaded ? 1 : 0,
                    transform: loaded ? 'scale(1)' : 'scale(0.85)',
                    transition: 'all 0.8s cubic-bezier(.16,1,.3,1) 0.4s',
                  }}
                >
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={incidentBreakdown}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={70}
                        paddingAngle={4}
                        dataKey="value"
                        stroke="none"
                        animationDuration={1800}
                        animationBegin={400}
                        animationEasing="ease-out"
                      >
                        {incidentBreakdown.map((_, i) => (
                          <Cell key={i} fill={COLORS[i % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip content={<CT />} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="space-y-2 mt-2">
                  {incidentBreakdown.slice(0, 5).map((it, i) => (
                    <div key={i} className="flex items-center justify-between text-xs">
                      <div className="flex items-center gap-2">
                        <span className="w-3 h-3 rounded-md" style={{ background: COLORS[i % COLORS.length] }} />
                        <span style={{ color: dk.textMuted }}>{it.name}</span>
                      </div>
                      <span className="font-bold" style={{ color: dk.text }}>{it.value}</span>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="h-44 flex flex-col items-center justify-center">
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center mb-3"
                  style={{
                    background: 'rgba(16,185,129,0.1)',
                    animation: 'pulse-glow 3s ease-in-out infinite',
                  }}
                >
                  <CheckCircle size={28} className="text-emerald-400" />
                </div>
                <p className="text-sm font-semibold" style={{ color: dk.textMuted }}>Zero incidents</p>
                <p className="text-[10px]" style={{ color: dk.textFaint }}>Great job! 🎉</p>
              </div>
            )}
          </Glass>
        </div>
      </div>


      {/* ═══════ ANIMATED SERVICE HOURS TREND ═══════ */}
      <div style={stg(15)}>
        <Glass dark={isDark} className="p-5" glow="rgba(59,130,246,.08)">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
              <TrendingUp size={18} className="text-blue-500" /> Service Hours Trend
            </h3>
            <span
              className="text-[10px] px-3 py-1 rounded-full font-semibold"
              style={{
                background: isDark ? 'rgba(59,130,246,.12)' : 'rgba(59,130,246,.06)',
                color: '#3b82f6',
              }}
            >
              4 week view
            </span>
          </div>
          <div
            style={{
              height: 192,
              opacity: loaded ? 1 : 0,
              transform: loaded ? 'translateY(0)' : 'translateY(10px)',
              transition: 'all 0.8s cubic-bezier(.16,1,.3,1) 0.5s',
            }}
          >
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={hoursOverTime}>
                <defs>
                  <linearGradient id="hG" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={isDark ? .4 : .3} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid vertical={false} strokeDasharray="3 3" stroke={dk.gridStroke} />
                <XAxis dataKey="week" tick={{ fontSize: 11, fill: dk.tickFill }} axisLine={false} tickLine={false} />
                <YAxis tick={{ fontSize: 11, fill: dk.tickFill }} axisLine={false} tickLine={false} width={30} />
                <Tooltip
                  content={<CT />}
                  cursor={{
                    stroke: isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.06)',
                    strokeWidth: 1,
                    strokeDasharray: '4 4',
                  }}
                />
                <Area
                  type="monotone"
                  dataKey="hours"
                  name="Hours"
                  stroke="#3b82f6"
                  fill="url(#hG)"
                  strokeWidth={3}
                  animationDuration={2000}
                  animationBegin={500}
                  animationEasing="ease-out"
                  dot={{ r: 4, fill: '#3b82f6', stroke: isDark ? '#1e293b' : '#fff', strokeWidth: 2 }}
                  activeDot={{ r: 6, fill: '#3b82f6', stroke: isDark ? '#1e293b' : '#fff', strokeWidth: 3 }}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </Glass>
      </div>


      {/* ═══════ TODAY'S SHIFTS + LIVE ACTIVITY ═══════ */}
<div data-tour="tour-activity" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Today's Shifts */}
        <div className="lg:col-span-2" style={stg(16)}>
          <Glass dark={isDark} className="p-5" glow={`${c.primary}0d`}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
                <Calendar size={18} style={{ color: c.primary }} /> Today's Shifts
                <span
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full ml-1"
                  style={{ background: `${c.primary}15`, color: c.primary }}
                >
                  {todayShifts.length}
                </span>
              </h3>
              <Link to="/admin/roster" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: c.primary }}>
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            {todayShifts.length > 0 ? (
              <div className="space-y-2">
                {todayShifts.map((s, i) => (
                  <Link
                    key={s.id}
                    to={`/admin/roster/shift/${s.id}`}
                    className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{
                      background: i % 2 === 0
                        ? (isDark ? 'rgba(255,255,255,0.03)' : `${c.primary}04`)
                        : dk.subtleBg,
                    }}
                    onMouseEnter={e => { e.currentTarget.style.boxShadow = `0 4px 20px -4px ${c.primary}15` }}
                    onMouseLeave={e => { e.currentTarget.style.boxShadow = 'none' }}
                  >
                    <div className="flex items-center gap-3">
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold ${
                        s.status === 'completed' ? 'bg-emerald-500'
                        : s.status === 'in_progress' ? 'bg-blue-500'
                        : 'bg-gray-300'
                      }`}>
                        {s.staff?.first_name?.[0]}{s.staff?.last_name?.[0]}
                      </div>
                      <div>
                        <p className="text-sm font-semibold" style={{ color: dk.text }}>
                          {s.staff?.first_name} {s.staff?.last_name}
                        </p>
                        <p className="text-xs" style={{ color: dk.textMuted }}>
                          {s.participant
                            ? `${s.participant.first_name} ${s.participant.last_name}`
                            : s.title || 'Unassigned'}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold tabular-nums" style={{ color: dk.textSoft }}>
                        {s.start_time?.slice(0, 5)} – {s.end_time?.slice(0, 5)}
                      </p>
                      <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                        s.status === 'completed'
                          ? isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                          : s.status === 'in_progress'
                            ? isDark ? 'bg-blue-500/20 text-blue-400' : 'bg-blue-50 text-blue-700'
                            : isDark ? 'bg-slate-700 text-slate-300' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {s.status === 'in_progress' ? '● Live' : formatType(s.status || 'scheduled')}
                      </span>
                    </div>
                  </Link>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Calendar size={44} style={{ color: isDark ? '#334155' : '#e5e7eb' }} className="mx-auto mb-3" />
                <p className="text-sm font-medium" style={{ color: dk.textMuted }}>No shifts scheduled today</p>
              </div>
            )}
          </Glass>
        </div>

        {/* Live Activity */}
        <div style={stg(17)}>
          <Glass dark={isDark} className="p-5 h-full" glow="rgba(245,158,11,.08)">
            <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: dk.text }}>
              <Zap size={18} className="text-amber-500" /> Live Activity
              <span className="relative flex h-2 w-2 ml-1">
                <span className="animate-ping absolute h-full w-full rounded-full bg-emerald-400 opacity-75" />
                <span className="relative h-2 w-2 rounded-full bg-emerald-500" />
              </span>
            </h3>
            {activityFeed.length > 0 ? (
              <div className="space-y-2 max-h-[420px] overflow-y-auto no-scrollbar">
                {activityFeed.map((a, i) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-2.5 p-3 rounded-xl transition-all"
                    style={{ background: dk.subtleBg }}
                  >
                    <span className="text-base shrink-0">{a.icon}</span>
                    <div className="flex-1 min-w-0">
                      <p className="text-xs leading-relaxed" style={{ color: dk.textSoft }}>{a.text}</p>
                      <p className="text-[10px] mt-0.5" style={{ color: dk.textFaint }}>{timeAgo(a.time)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-12 text-center">
                <Activity size={36} style={{ color: isDark ? '#334155' : '#e5e7eb' }} className="mx-auto mb-3" />
                <p className="text-xs" style={{ color: dk.textMuted }}>Activity appears as staff use the system</p>
              </div>
            )}
          </Glass>
        </div>
      </div>


      {/* ═══════ LEADERBOARD + EXPIRING DOCS + CLICKABLE CALENDAR ═══════ */}
<div data-tour="tour-list" className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Staff Leaderboard with medals */}
        <div style={stg(18)}>
          <Glass dark={isDark} className="p-5 h-full" glow="rgba(59,130,246,.08)">
            <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: dk.text }}>
              <Flame size={18} className="text-orange-500" /> Staff Leaderboard
            </h3>
            {staffHours.length > 0 ? (
              <div className="space-y-3">
                {staffHours.slice(0, 7).map((s, i) => {
                  const mx = staffHours[0]?.hours || 1
                  const cols = ['#f59e0b', '#94a3b8', '#cd7f32', '#7c3aed', '#3b82f6', '#06b6d4', '#8b5cf6']
                  const MedalIcon = i < 3 ? leaderMedals[i] : null
                  return (
                    <div key={i} className="flex items-center gap-3">
                      <div
                        className="w-8 h-8 rounded-lg flex items-center justify-center text-[9px] font-bold shrink-0"
                        style={{
                          background: i < 3
                            ? `linear-gradient(135deg, ${cols[i]}, ${cols[i]}cc)`
                            : isDark ? 'rgba(51,65,85,0.4)' : '#f1f5f9',
                          color: i < 3 ? 'white' : dk.textFaint,
                          boxShadow: i < 3 ? `0 3px 10px -3px ${cols[i]}50` : 'none',
                        }}
                      >
                        {MedalIcon ? <MedalIcon size={14} /> : i + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center mb-1">
                          <p className="text-xs font-semibold truncate" style={{ color: dk.textSoft }}>{s.name}</p>
                          <p className="text-xs font-bold" style={{ color: i < 3 ? cols[i] : dk.textMuted }}>
                            {s.hours.toFixed(1)}h
                          </p>
                        </div>
                        <div className="h-1.5 rounded-full overflow-hidden" style={{ background: dk.subtleBg2 }}>
                          <div
                            className="h-full rounded-full"
                            style={{
                              width: `${Math.min(s.hours / mx * 100, 100)}%`,
                              background: i < 3 ? cols[i] : dk.textFaint,
                              transition: 'width 0.8s',
                            }}
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <Clock size={28} style={{ color: isDark ? '#334155' : '#e5e7eb' }} className="mx-auto mb-2" />
                <p className="text-xs" style={{ color: dk.textMuted }}>No clock data yet</p>
              </div>
            )}
          </Glass>
        </div>

        {/* Expiring Documents */}
        <div style={stg(19)}>
          <Glass dark={isDark} className="p-5 h-full" glow="rgba(239,68,68,.06)">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
                <Shield size={18} className="text-red-500" /> Expiring Docs
              </h3>
              <Link to="/admin/participants" className="text-xs font-semibold hover:underline" style={{ color: c.primary }}>
                View All
              </Link>
            </div>
            {expiringDocs.length > 0 ? (
              <div className="space-y-2">
                {expiringDocs.map((d, i) => {
                  const dy = Math.ceil((new Date(d.expiry_date) - new Date()) / 864e5)
                  const ex = dy < 0
                  return (
                    <div
                      key={i}
                      className="p-3 rounded-xl transition-all hover:-translate-y-0.5"
                      style={{
                        background: ex
                          ? (isDark ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.04)')
                          : (isDark ? 'rgba(245,158,11,.1)' : 'rgba(245,158,11,.04)'),
                        border: `1px solid ${ex
                          ? (isDark ? 'rgba(239,68,68,.2)' : 'rgba(239,68,68,.1)')
                          : (isDark ? 'rgba(245,158,11,.2)' : 'rgba(245,158,11,.1)')
                        }`,
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-xs font-semibold" style={{ color: dk.text }}>
                            {d.name || formatType(d.document_type)}
                          </p>
                          <p className="text-[10px]" style={{ color: dk.textMuted }}>
                            {d.staff?.first_name} {d.staff?.last_name}
                          </p>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                          ex ? 'bg-red-500/15 text-red-500' : 'bg-amber-500/15 text-amber-500'
                        }`}>
                          {ex ? `${Math.abs(dy)}d overdue` : `${dy}d left`}
                        </span>
                      </div>
                    </div>
                  )
                })}
              </div>
            ) : (
              <div className="p-8 text-center">
                <div className="w-14 h-14 rounded-full bg-emerald-500/10 flex items-center justify-center mx-auto mb-3">
                  <CheckCircle size={24} className="text-emerald-400" />
                </div>
                <p className="text-xs font-medium" style={{ color: dk.textMuted }}>All documents current</p>
              </div>
            )}
          </Glass>
        </div>

        {/* Clickable Calendar */}
        <div style={stg(20)}>
          <Glass dark={isDark} className="p-5 h-full" glow={`${c.primary}0a`}>
            <div className="flex items-center justify-between mb-3">
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                className="p-1.5 rounded-lg hover:opacity-70"
              >
                <ChevronLeft size={16} style={{ color: dk.textFaint }} />
              </button>
              <p className="font-bold text-sm" style={{ color: dk.text }}>
                {calMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
              </p>
              <button
                onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                className="p-1.5 rounded-lg hover:opacity-70"
              >
                <ChevronRight size={16} style={{ color: dk.textFaint }} />
              </button>
            </div>

            {/* Day headers */}
            <div className="grid grid-cols-7 gap-1 text-center mb-1">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                <span key={i} className="text-[10px] font-bold" style={{ color: dk.textFaint }}>
                  {d}
                </span>
              ))}
            </div>

            {/* Day grid */}
            <div className="grid grid-cols-7 gap-1">
              {calDays().map((day, i) => {
                const ds = day ? getDS(day) : null
                const hs = ds && shiftDates[ds]
                return (
                  <div key={i}>
                    <div
                      onClick={() => handleCalClick(day)}
                      className={`aspect-square flex flex-col items-center justify-center rounded-lg text-xs transition-all ${
                        isToday(day) ? 'text-white font-bold shadow-lg' : ''
                      } ${hs ? 'cursor-pointer hover:ring-2' : 'cursor-default'}`}
                      style={{
                        ...(isToday(day)
                          ? { background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }
                          : { color: day ? dk.textSoft : 'transparent' }),
                        ...(hs && !isToday(day) ? { ringColor: `${c.primary}40` } : {}),
                      }}
                      onMouseEnter={e => {
                        if (day && !isToday(day)) {
                          e.currentTarget.style.background = isDark
                            ? 'rgba(255,255,255,0.05)'
                            : `${c.primary}08`
                        }
                      }}
                      onMouseLeave={e => {
                        if (day && !isToday(day)) {
                          e.currentTarget.style.background = ''
                        }
                      }}
                    >
                      {day || ''}
                      {hs && (
                        <div
                          className="w-1.5 h-1.5 rounded-full mt-0.5"
                          style={{ background: isToday(day) ? '#fff' : c.primary }}
                        />
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            <p className="text-[10px] mt-3 text-center" style={{ color: dk.textFaint }}>
              Click dates with dots to view shift details
            </p>
          </Glass>
        </div>
      </div>


      {/* ═══════ RECENT INCIDENTS ═══════ */}
      {recentIncidents.length > 0 && (
        <div style={stg(21)}>
          <Glass dark={isDark} className="p-5" glow="rgba(239,68,68,.06)">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold flex items-center gap-2" style={{ color: dk.text }}>
                <AlertTriangle size={18} style={{ color: c.primary }} /> Recent Incidents
              </h3>
              <Link to="/admin/incidents" className="text-xs font-semibold hover:underline flex items-center gap-1" style={{ color: c.primary }}>
                View All <ArrowUpRight size={12} />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {recentIncidents.map(inc => (
                <Link
                  key={inc.id}
                  to={`/admin/incidents/${inc.id}`}
                  className="flex items-center justify-between p-3.5 rounded-xl transition-all hover:-translate-y-0.5 hover:shadow-md"
                  style={{ background: dk.subtleBg }}
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${
                      inc.severity === 'critical' ? 'bg-red-500 animate-pulse'
                      : inc.severity === 'high' ? 'bg-orange-500'
                      : inc.severity === 'medium' ? 'bg-amber-500'
                      : 'bg-gray-400'
                    }`} />
                    <div>
                      <p className="text-sm font-semibold" style={{ color: dk.text }}>
                        {formatType(inc.incident_type)}
                      </p>
                      <p className="text-[10px]" style={{ color: dk.textMuted }}>
                        {new Date(inc.created_at).toLocaleDateString('en-AU')}
                      </p>
                    </div>
                  </div>
                  <span className={`text-[10px] font-bold px-2.5 py-1 rounded-full ${
                    inc.status === 'open'
                      ? isDark ? 'bg-red-500/20 text-red-400' : 'bg-red-50 text-red-700'
                      : inc.status === 'investigating'
                        ? isDark ? 'bg-amber-500/20 text-amber-400' : 'bg-amber-50 text-amber-700'
                        : isDark ? 'bg-emerald-500/20 text-emerald-400' : 'bg-emerald-50 text-emerald-700'
                  }`}>
                    {formatType(inc.status)}
                  </span>
                </Link>
              ))}
            </div>
          </Glass>
        </div>
      )}


      {/* ═══════ RECENT FORMS ═══════ */}
      {formSubmissions.length > 0 && (
        <div style={stg(22)}>
          <Glass dark={isDark} className="p-5" glow="rgba(59,130,246,.06)">
            <h3 className="font-bold flex items-center gap-2 mb-4" style={{ color: dk.text }}>
              <ClipboardList size={18} className="text-blue-500" /> Recent Forms
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {formSubmissions.map(sub => {
                const lb = {
                  medication_chart: 'Medication Chart',
                  medication_incident: 'Medication Incident',
                  incident_report: 'Incident Report',
                  cash_reconciliation: 'Cash Reconciliation',
                }
                const bg = {
                  medication_chart: isDark ? 'rgba(59,130,246,.1)' : 'rgba(59,130,246,.04)',
                  medication_incident: isDark ? 'rgba(239,68,68,.1)' : 'rgba(239,68,68,.04)',
                  incident_report: isDark ? 'rgba(245,158,11,.1)' : 'rgba(245,158,11,.04)',
                  cash_reconciliation: isDark ? 'rgba(16,185,129,.1)' : 'rgba(16,185,129,.04)',
                }
                const ic = {
                  medication_chart: '💊',
                  medication_incident: '🚨',
                  incident_report: '⚠️',
                  cash_reconciliation: '💵',
                }
                return (
                  <div
                    key={sub.id}
                    className="p-3 rounded-xl transition-all hover:-translate-y-0.5"
                    style={{ background: bg[sub.form_type] || dk.subtleBg }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <span className="text-lg">{ic[sub.form_type] || '📋'}</span>
                        <div>
                          <p className="text-sm font-semibold" style={{ color: dk.text }}>
                            {lb[sub.form_type] || formatType(sub.form_type)}
                          </p>
                          <p className="text-[10px]" style={{ color: dk.textMuted }}>
                            {sub.staff ? `${sub.staff.first_name} ${sub.staff.last_name}` : 'Unknown'}
                          </p>
                        </div>
                      </div>
                      <p className="text-[10px]" style={{ color: dk.textFaint }}>
                        {sub.submitted_at
                          ? new Date(sub.submitted_at).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })
                          : '—'}
                      </p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Glass>
        </div>
      )}


      {/* ═══════ CALENDAR DETAIL MODAL ═══════ */}
      <Modal
        isOpen={!!calModal}
        onClose={() => setCalModal(null)}
        title={calModal
          ? `Shifts on ${new Date(calModal.dateStr).toLocaleDateString('en-AU', { weekday: 'long', day: 'numeric', month: 'long' })}`
          : ''
        }
      >
        {calModal && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Stat boxes */}
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <div style={{
                padding: '18px 20px',
                borderRadius: 14,
                background: `linear-gradient(135deg, ${c.primary}15, ${c.primary}05)`,
                border: `1px solid ${c.primary}20`,
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: c.primary }}>
                  {calModal.total}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: dk.textMuted, marginTop: 2 }}>
                  Total Shifts
                </p>
              </div>
              <div style={{
                padding: '18px 20px',
                borderRadius: 14,
                background: 'linear-gradient(135deg, rgba(16,185,129,0.1), rgba(16,185,129,0.03))',
                border: '1px solid rgba(16,185,129,0.2)',
                textAlign: 'center',
              }}>
                <p style={{ fontSize: 28, fontWeight: 800, color: '#10b981' }}>
                  {calModal.completed}
                </p>
                <p style={{ fontSize: 11, fontWeight: 600, color: dk.textMuted, marginTop: 2 }}>
                  Completed
                </p>
              </div>
            </div>

            {/* Progress bar */}
            {calModal.total > 0 && (
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 12, fontWeight: 600, color: dk.textSoft }}>
                    Completion Rate
                  </span>
                  <span style={{
                    fontSize: 13,
                    fontWeight: 800,
                    color: calModal.completed === calModal.total ? '#10b981' : c.primary,
                  }}>
                    {Math.round(calModal.completed / calModal.total * 100)}%
                  </span>
                </div>
                <div style={{
                  height: 10,
                  borderRadius: 999,
                  overflow: 'hidden',
                  background: dk.subtleBg2,
                }}>
                  <div style={{
                    height: '100%',
                    borderRadius: 999,
                    width: `${calModal.completed / calModal.total * 100}%`,
                    background: `linear-gradient(90deg, ${c.primary}, #10b981)`,
                    transition: 'width 0.8s',
                  }} />
                </div>
              </div>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: 8 }}>
              <Link
                to="/admin/roster"
                onClick={() => setCalModal(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`,
                  color: 'white',
                  fontSize: 13,
                  fontWeight: 700,
                  textAlign: 'center',
                  textDecoration: 'none',
                  boxShadow: `0 4px 14px -4px ${c.primary}50`,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 6,
                }}
              >
                <Calendar size={14} /> View Roster
              </Link>
              <button
                onClick={() => setCalModal(null)}
                style={{
                  flex: 1,
                  padding: '12px 0',
                  borderRadius: 12,
                  background: isDark ? 'rgba(51,65,85,0.5)' : '#f1f5f9',
                  border: `1px solid ${dk.subtleBg2}`,
                  color: dk.textMuted,
                  fontSize: 13,
                  fontWeight: 700,
                  cursor: 'pointer',
                }}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  )
}