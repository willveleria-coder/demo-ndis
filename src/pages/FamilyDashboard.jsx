import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Heart, Calendar, Clock, FileText, LogOut, Loader2, User, Activity,
  ChevronRight, Camera, Star, Pill, Shield, TrendingUp, Bot, Sparkles,
  MessageSquare, CheckCircle, Info, Users, Target, Zap, ArrowRight, Bell,
  MapPin, Phone, X, ChevronDown, Award, Flame, AlertTriangle,
  Image, Send, PhoneCall, CalendarDays,
  Flag, ChevronLeft, Printer, ThumbsUp, BookOpen,
  PenTool, TrendingDown, Menu
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useTheme } from '../context/ThemeContext'
import PhotoGallery from '../components/PhotoGallery'
import { formatLabel } from '../utils/formatLabel'


/* ═══════════════════════════════════════════════
   HELPERS
   ═══════════════════════════════════════════════ */

function formatTime(iso) {
  if (!iso) return ''
  return new Date(iso).toLocaleTimeString('en-AU', {
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function formatDate(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const today = new Date()
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (d.toDateString() === today.toDateString()) return 'Today'
  if (d.toDateString() === tomorrow.toDateString()) return 'Tomorrow'
  if (d.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return d.toLocaleDateString('en-AU', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  })
}

function getGreeting() {
  const h = new Date().getHours()
  return h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening'
}

function getTimeEmoji() {
  const h = new Date().getHours()
  return h < 6 ? '🌙' : h < 12 ? '☀️' : h < 17 ? '🌤️' : h < 20 ? '🌅' : '🌙'
}

function calcHours(clockIn, clockOut) {
  if (!clockIn || !clockOut) return null
  return ((new Date(clockOut) - new Date(clockIn)) / 3600000).toFixed(1)
}


/* ═══════════════════════════════════════════════
   ANIMATED NUMBER
   ═══════════════════════════════════════════════ */

function AnimNum({ value, suffix = '', duration = 700 }) {
  const [display, setDisplay] = useState(0)

  useEffect(() => {
    const num = Number(value) || 0
    const startTime = Date.now()
    const step = () => {
      const progress = Math.min((Date.now() - startTime) / duration, 1)
      const eased = 1 - Math.pow(1 - progress, 3)
      setDisplay(Math.round(eased * num))
      if (progress < 1) requestAnimationFrame(step)
    }
    requestAnimationFrame(step)
  }, [value])

  return <span>{display}{suffix}</span>
}


/* ═══════════════════════════════════════════════
   LIVE CLOCK
   ═══════════════════════════════════════════════ */

function LiveClock() {
  const [time, setTime] = useState(new Date())

  useEffect(() => {
    const t = setInterval(() => setTime(new Date()), 1000)
    return () => clearInterval(t)
  }, [])

  return (
    <span>
      {time.toLocaleTimeString('en-AU', {
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true,
      })}
    </span>
  )
}


/* ═══════════════════════════════════════════════
   FAMILY THEME COLORS
   ═══════════════════════════════════════════════ */

function useFM(isDark) {
  return {
    primary: '#ec4899',
    primaryHover: '#db2777',
    secondary: '#a855f7',
    gradient: 'linear-gradient(135deg, #ec4899, #db2777, #a855f7)',
    gradientSoft: isDark
      ? 'linear-gradient(135deg, rgba(236,72,153,0.15), rgba(168,85,247,0.1))'
      : 'linear-gradient(135deg, rgba(236,72,153,0.06), rgba(168,85,247,0.04))',
    glass: isDark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.6)',
    glassBorder: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(236,72,153,0.12)',
    glassGlow: isDark ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.1)',
    pageBg: isDark
      ? '#0f172a'
      : 'linear-gradient(160deg, #fdf2f8, #faf5ff, #fce7f3, #f5f3ff)',
    navBg: isDark ? 'rgba(15,23,42,0.85)' : 'rgba(255,255,255,0.82)',
    navBorder: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(236,72,153,0.08)',
  }
}

const NAV_ITEMS = [
  { id: 'updates', label: 'Updates', icon: Activity },
  { id: 'upcoming', label: 'Upcoming', icon: Calendar },
  { id: 'goals', label: 'Goals', icon: Star },
  { id: 'medications', label: 'Meds', icon: Pill },
  { id: 'team', label: 'Team', icon: Users },
  { id: 'gallery', label: 'Photos', icon: Image },
  { id: 'calendar', label: 'Calendar', icon: CalendarDays },
  { id: 'journal', label: 'Journal', icon: BookOpen },
  { id: 'info', label: 'Info', icon: Info },
]


/* ═══════════════════════════════════════════════
   CARE QUALITY RING
   ═══════════════════════════════════════════════ */

function CareRing({ score, size = 100, isDark }) {
  const r = (size - 12) / 2
  const circ = 2 * Math.PI * r
  const off = circ - (score / 100) * circ
  const col = score >= 80 ? '#10b981' : score >= 60 ? '#f59e0b' : '#ec4899'

  return (
    <div
      style={{
        position: 'relative',
        width: size,
        height: size,
      }}
    >
      <svg
        width={size}
        height={size}
        style={{ transform: 'rotate(-90deg)' }}
      >
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={isDark ? 'rgba(255,255,255,0.06)' : 'rgba(236,72,153,0.06)'}
          strokeWidth="8"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          stroke={col}
          strokeWidth="8"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={off}
          style={{
            transition: 'stroke-dashoffset 1.5s cubic-bezier(0.16,1,0.3,1)',
            filter: `drop-shadow(0 0 6px ${col}40)`,
          }}
        />
      </svg>
      <div
        style={{
          position: 'absolute',
          inset: 0,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        <p style={{ fontSize: 22, fontWeight: 900, color: col, lineHeight: 1 }}>
          {score}
        </p>
        <p
          style={{
            fontSize: 8,
            fontWeight: 700,
            color: isDark ? '#64748b' : '#9ca3af',
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          quality
        </p>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   EMPTY STATE
   ═══════════════════════════════════════════════ */

function EmptyState({ icon: Icon, text, sub, isDark, fm }) {
  return (
    <div
      style={{
        padding: '56px 24px',
        borderRadius: 20,
        textAlign: 'center',
        background: fm.glass,
        border: `1px solid ${fm.glassBorder}`,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
      }}
    >
      <Icon
        size={44}
        style={{
          color: isDark ? 'rgba(236,72,153,0.15)' : 'rgba(236,72,153,0.2)',
          margin: '0 auto 12px',
        }}
      />
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          color: isDark ? '#94a3b8' : '#9ca3af',
        }}
      >
        {text}
      </p>
      {sub && (
        <p
          style={{
            fontSize: 12,
            color: isDark ? '#64748b' : '#d1d5db',
            marginTop: 4,
          }}
        >
          {sub}
        </p>
      )}
    </div>
  )
}


/* ═══════════════════════════════════════════════
   MOOD TREND CHART — sparkline SVG
   ═══════════════════════════════════════════════ */

function MoodTrendChart({ recentShifts, isDark, fm, dk }) {
  const moodMap = {
    happy: 5, content: 4, good: 4, okay: 3, neutral: 3,
    calm: 3, tired: 2, anxious: 2, sad: 1, upset: 1, agitated: 1,
  }

  const points = recentShifts
    .filter(s => s.shift_notes?.[0]?.mood)
    .slice(0, 10)
    .reverse()
    .map((s, i) => {
      const mood = s.shift_notes[0].mood.toLowerCase()
      let score = 3
      Object.entries(moodMap).forEach(([k, v]) => {
        if (mood.includes(k)) score = v
      })
      return { date: s.shift_date, mood: s.shift_notes[0].mood, score, idx: i }
    })

  if (points.length < 2) return null

  const w = 300
  const h = 80
  const px = 20
  const py = 10
  const xStep = (w - px * 2) / (points.length - 1)
  const yScale = (v) => py + (h - py * 2) * (1 - (v - 1) / 4)

  const pathD = points
    .map((p, i) => `${i === 0 ? 'M' : 'L'} ${px + i * xStep} ${yScale(p.score)}`)
    .join(' ')

  const areaD = pathD +
    ` L ${px + (points.length - 1) * xStep} ${h - py}` +
    ` L ${px} ${h - py} Z`

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 18,
        background: fm.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${fm.glassBorder}`,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: dk.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 8,
        }}
      >
        Mood Trend
      </p>
      <svg
        width="100%"
        viewBox={`0 0 ${w} ${h}`}
        style={{ overflow: 'visible' }}
      >
        <defs>
          <linearGradient id="moodGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={fm.primary} stopOpacity="0.2" />
            <stop offset="100%" stopColor={fm.primary} stopOpacity="0" />
          </linearGradient>
        </defs>
        <path d={areaD} fill="url(#moodGrad)" />
        <path
          d={pathD}
          fill="none"
          stroke={fm.primary}
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          style={{ filter: `drop-shadow(0 2px 4px ${fm.primary}40)` }}
        />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={px + i * xStep}
            cy={yScale(p.score)}
            r="4"
            fill={fm.primary}
            stroke={isDark ? '#0f172a' : '#fff'}
            strokeWidth="2"
          />
        ))}
      </svg>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          marginTop: 6,
          fontSize: 9,
          color: dk.textFaint,
        }}
      >
        {points.map((p, i) => (
          <span key={i} style={{ textAlign: 'center', flex: 1 }}>
            {new Date(p.date).toLocaleDateString('en-AU', { day: 'numeric', month: 'short' })}
          </span>
        ))}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   WEEKLY HEATMAP
   ═══════════════════════════════════════════════ */

function WeeklyHeatmap({ recentShifts, isDark, fm, dk }) {
  const days = []
  for (let i = 6; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    const ds = d.toISOString().split('T')[0]
    const count = recentShifts.filter(s => s.shift_date === ds).length
    days.push({
      label: d.toLocaleDateString('en-AU', { weekday: 'narrow' }),
      count,
    })
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        justifyContent: 'space-between',
        padding: '14px 18px',
        borderRadius: 18,
        background: fm.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${fm.glassBorder}`,
      }}
    >
      <div style={{ marginRight: 8 }}>
        <p
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: dk.textFaint,
            textTransform: 'uppercase',
            letterSpacing: '0.06em',
          }}
        >
          This Week
        </p>
      </div>
      {days.map((day, i) => (
        <div
          key={i}
          style={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 4,
            flex: 1,
          }}
        >
          <p style={{ fontSize: 9, fontWeight: 600, color: dk.textFaint }}>
            {day.label}
          </p>
          <div
            style={{
              width: 28,
              height: 28,
              borderRadius: 8,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 10,
              fontWeight: 800,
              transition: 'all 0.3s',
              background: day.count > 0
                ? `${fm.primary}${day.count > 2 ? '30' : '18'}`
                : dk.subtleBg,
              color: day.count > 0 ? fm.primary : dk.textFaint,
              border: day.count > 0
                ? `1px solid ${fm.primary}25`
                : '1px solid transparent',
            }}
          >
            {day.count > 0 ? day.count : '·'}
          </div>
        </div>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════
   SHIFT QUALITY INDICATOR
   ═══════════════════════════════════════════════ */

function ShiftQuality({ notes }) {
  if (!notes) return null
  const fields = ['mood', 'activities', 'goals_progress', 'concerns', 'recommendations']
  const filled = fields.filter(f => notes[f]).length
  const pct = Math.round((filled / fields.length) * 100)
  const col = pct >= 80 ? '#10b981' : pct >= 40 ? '#f59e0b' : '#ef4444'

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 6,
        padding: '4px 10px',
        borderRadius: 999,
        fontSize: 10,
        fontWeight: 700,
        background: `${col}12`,
        color: col,
      }}
    >
      <div
        style={{
          width: 6,
          height: 6,
          borderRadius: '50%',
          background: col,
        }}
      />
      {pct}% complete
    </div>
  )
}


/* ═══════════════════════════════════════════════
   STAR RATING
   ═══════════════════════════════════════════════ */

function StarRating({ rating, onRate, size = 20, interactive = true }) {
  const [hover, setHover] = useState(0)

  return (
    <div style={{ display: 'flex', gap: 2 }}>
      {[1, 2, 3, 4, 5].map(i => (
        <button
          key={i}
          onClick={() => interactive && onRate && onRate(i)}
          onMouseEnter={() => interactive && setHover(i)}
          onMouseLeave={() => interactive && setHover(0)}
          style={{
            background: 'none',
            border: 'none',
            cursor: interactive ? 'pointer' : 'default',
            padding: 0,
            transition: 'transform 0.2s',
            transform: hover === i ? 'scale(1.2)' : 'scale(1)',
          }}
        >
          <Star
            size={size}
            fill={i <= (hover || rating) ? '#fbbf24' : 'none'}
            style={{ color: i <= (hover || rating) ? '#fbbf24' : '#d1d5db' }}
          />
        </button>
      ))}
    </div>
  )
}


/* ═══════════════════════════════════════════════
   SATISFACTION SLIDER
   ═══════════════════════════════════════════════ */

function SatisfactionMeter({ value, onChange, isDark, fm, dk }) {
  const faces = [
    { emoji: '😟', label: 'Poor', color: '#ef4444' },
    { emoji: '😕', label: 'Fair', color: '#f59e0b' },
    { emoji: '😊', label: 'Good', color: '#3b82f6' },
    { emoji: '😄', label: 'Great', color: '#10b981' },
    { emoji: '🤩', label: 'Amazing', color: '#8b5cf6' },
  ]

  return (
    <div
      style={{
        padding: '16px 18px',
        borderRadius: 18,
        background: fm.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${fm.glassBorder}`,
      }}
    >
      <p
        style={{
          fontSize: 10,
          fontWeight: 700,
          color: dk.textFaint,
          textTransform: 'uppercase',
          letterSpacing: '0.06em',
          marginBottom: 10,
        }}
      >
        Overall Satisfaction
      </p>
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          gap: 4,
        }}
      >
        {faces.map((f, i) => (
          <button
            key={i}
            onClick={() => onChange(i + 1)}
            style={{
              flex: 1,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 4,
              padding: '8px 4px',
              borderRadius: 12,
              cursor: 'pointer',
              background: value === i + 1
                ? `${f.color}15`
                : 'transparent',
              border: value === i + 1
                ? `2px solid ${f.color}40`
                : '2px solid transparent',
              transition: 'all 0.2s',
            }}
          >
            <span
              style={{
                fontSize: 24,
                filter: value === i + 1 ? 'none' : 'grayscale(0.6)',
                transition: 'filter 0.2s',
              }}
            >
              {f.emoji}
            </span>
            <span
              style={{
                fontSize: 9,
                fontWeight: 700,
                color: value === i + 1 ? f.color : dk.textFaint,
              }}
            >
              {f.label}
            </span>
          </button>
        ))}
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   WEATHER WIDGET (demo data)
   ═══════════════════════════════════════════════ */

function WeatherWidget({ isDark, fm, dk }) {
  const [weather] = useState({
    temp: 18,
    condition: 'Partly Cloudy',
    icon: '🌤️',
    humidity: 62,
    wind: '12 km/h',
    location: 'Greensborough, VIC',
    tip: 'Great weather for outdoor activities today!',
  })

  return (
    <div
      style={{
        padding: '14px 18px',
        borderRadius: 18,
        background: fm.glass,
        backdropFilter: 'blur(16px)',
        WebkitBackdropFilter: 'blur(16px)',
        border: `1px solid ${fm.glassBorder}`,
        display: 'flex',
        alignItems: 'center',
        gap: 14,
      }}
    >
      <div style={{ fontSize: 36, lineHeight: 1 }}>
        {weather.icon}
      </div>
      <div style={{ flex: 1 }}>
        <div
          style={{
            display: 'flex',
            alignItems: 'baseline',
            gap: 6,
          }}
        >
          <span
            style={{
              fontSize: 24,
              fontWeight: 900,
              color: dk.text,
            }}
          >
            {weather.temp}°
          </span>
          <span
            style={{
              fontSize: 12,
              fontWeight: 600,
              color: dk.textMuted,
            }}
          >
            {weather.condition}
          </span>
        </div>
        <p
          style={{
            fontSize: 10,
            color: dk.textFaint,
            marginTop: 2,
          }}
        >
          💧 {weather.humidity}% · 💨 {weather.wind} · 📍 {weather.location}
        </p>
        <p
          style={{
            fontSize: 11,
            color: '#10b981',
            fontWeight: 600,
            marginTop: 4,
          }}
        >
          {weather.tip}
        </p>
      </div>
    </div>
  )
}


/* ═══════════════════════════════════════════════
   CARE MAP — Leaflet with green on-shift pins
   ═══════════════════════════════════════════════ */

function CareMap({ careTeam, participant, activeShift, isDark, fm }) {
  const mapRef = useRef(null)
  const pLat = -37.7030
  const pLng = 145.1063

  const teamLocs = careTeam.slice(0, 6).map((s, i) => {
    const angle = (i / Math.max(careTeam.length, 1)) * Math.PI * 2
    const dist = 0.006 + (i * 0.003)
    const isOn = activeShift && activeShift.staff &&
      (activeShift.staff.first_name === s.first_name &&
       activeShift.staff.last_name === s.last_name)
    return {
      ...s,
      lat: pLat + Math.cos(angle) * dist,
      lng: pLng + Math.sin(angle) * dist,
      isOnShift: isOn,
    }
  })

  useEffect(() => {
    if (!mapRef.current) return
    var c = mapRef.current

    var tileUrl = isDark
      ? 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}@2x.png'
      : 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager_labels_under/{z}/{x}/{y}@2x.png'

    var popBg = isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.98)'
    var popBorder = isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.06)'
    var textCol = isDark ? '#e2e8f0' : '#1f2937'
    var mutedCol = isDark ? '#94a3b8' : '#6b7280'
    var ringCol = isDark ? 'rgba(15,23,42,0.9)' : 'rgba(255,255,255,0.95)'
    var popShadow = isDark ? '0.4' : '0.12'

    function pinH(init, col, isP, isOn) {
      var sz = isP ? 48 : 40
      var fs = isP ? 16 : 12
      var sh = isP
        ? '0 6px 24px -4px rgba(236,72,153,0.5), 0 0 0 4px ' + ringCol
        : '0 4px 16px -2px ' + col + '50, 0 0 0 3px ' + ringCol
      var glow = ''
      if (isP) {
        glow = '<div style="position:absolute;inset:-8px;border-radius:50%;border:2px solid #ec4899;animation:pulse 2s ease-out infinite;"></div>'
      }
      if (isOn) {
        glow = '<div style="position:absolute;inset:-8px;border-radius:50%;border:3px solid #10b981;animation:pulse 1.5s ease-out infinite;"></div>' +
          '<div style="position:absolute;inset:-14px;border-radius:50%;border:2px solid #10b981;animation:pulse 1.5s ease-out infinite 0.3s;"></div>'
      }
      var dot = isOn
        ? '<div style="position:absolute;top:-2px;right:-2px;width:14px;height:14px;border-radius:50%;background:#10b981;border:2.5px solid ' + ringCol + ';animation:blink 1.5s infinite;"></div>'
        : ''
      return '<div style="position:relative;width:' + sz + 'px;height:' + sz + 'px;cursor:pointer;">' +
        glow +
        '<div style="width:' + sz + 'px;height:' + sz + 'px;border-radius:50%;' +
        'background:linear-gradient(135deg,' + col + ',' + col + 'cc);' +
        'display:flex;align-items:center;justify-content:center;color:white;' +
        'font-size:' + fs + 'px;font-weight:800;font-family:system-ui,sans-serif;' +
        'box-shadow:' + sh + ';position:relative;">' +
        init + dot +
        '</div>' +
        '<div style="position:absolute;bottom:-4px;left:50%;transform:translateX(-50%);' +
        'width:' + (sz * 0.5) + 'px;height:5px;border-radius:50%;' +
        'background:rgba(0,0,0,0.1);filter:blur(2px);"></div></div>'
    }

    var pN = participant
      ? participant.first_name + ' ' + participant.last_name
      : 'Participant'
    var pI = participant
      ? (participant.first_name?.[0] || '') + (participant.last_name?.[0] || '')
      : '?'

    var hp = [
      '<!DOCTYPE html><html><head>',
      '<meta name="viewport" content="width=device-width,initial-scale=1.0">',
      '<link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css"/>',
      '<script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"><' + '/script>',
      '<style>',
      '*{margin:0;padding:0;box-sizing:border-box}body{overflow:hidden}#map{width:100%;height:100vh}',
      '.leaflet-control-attribution{display:none!important}',
      '.leaflet-control-zoom{border:none!important;box-shadow:0 2px 12px -2px rgba(0,0,0,0.15)!important;border-radius:12px!important;overflow:hidden}',
      '.leaflet-control-zoom a{width:30px!important;height:30px!important;line-height:30px!important;font-size:14px!important;color:' + mutedCol + '!important;background:' + popBg + '!important;border:none!important}',
      '@keyframes pulse{0%{transform:scale(1);opacity:0.5}100%{transform:scale(2.5);opacity:0}}',
      '@keyframes blink{0%,100%{opacity:1}50%{opacity:0.3}}',
      '.leaflet-popup-content-wrapper{border-radius:16px!important;box-shadow:0 12px 40px -8px rgba(0,0,0,' + popShadow + ')!important;background:' + popBg + '!important;border:1px solid ' + popBorder + '!important;padding:0!important}',
      '.leaflet-popup-content{margin:0!important;min-width:220px}',
      '.leaflet-popup-tip{background:' + popBg + '!important;border:1px solid ' + popBorder + '!important;box-shadow:none!important}',
      '.leaflet-popup-close-button{display:none!important}',
      '</style></head><body><div id="map"></div><script>',
      'var map=L.map("map",{center:[' + pLat + ',' + pLng + '],zoom:15,zoomControl:true,scrollWheelZoom:false,attributionControl:false});',
      'L.tileLayer("' + tileUrl + '",{maxZoom:18,subdomains:"abcd"}).addTo(map);',
    ]

    /* Participant pin */
    var pH = pinH(pI, '#ec4899', true, false).replace(/"/g, "'")
    var pP = (
      '<div style="padding:14px 16px;font-family:system-ui,sans-serif;text-align:center;">' +
      '<div style="font-size:14px;font-weight:800;color:' + textCol + ';">' + pN + '</div>' +
      '<div style="font-size:10px;color:#ec4899;font-weight:700;margin-top:2px;">Participant</div>' +
      '<div style="font-size:10px;color:' + mutedCol + ';margin-top:6px;">📍 Greensborough, VIC</div>' +
      '</div>'
    ).replace(/"/g, "'")

    hp.push(
      'L.marker([' + pLat + ',' + pLng + '],{icon:L.divIcon({html:"' + pH + '",className:"",iconSize:[48,48],iconAnchor:[24,24],popupAnchor:[0,-28]})}).addTo(map).bindPopup("' + pP + '",{maxWidth:280});'
    )

    /* Team pins */
    var tc = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
    teamLocs.forEach(function(s, i) {
      var init = (s.first_name?.[0] || '') + (s.last_name?.[0] || '')
      var col = s.isOnShift ? '#10b981' : tc[i % tc.length]
      var mH = pinH(init, col, false, s.isOnShift).replace(/"/g, "'")

      var badge = s.isOnShift
        ? '<div style="display:inline-flex;align-items:center;gap:4px;padding:3px 10px;border-radius:999px;background:rgba(16,185,129,0.12);margin-top:6px;"><div style="width:6px;height:6px;border-radius:50%;background:#10b981;animation:blink 1.5s infinite;"></div><span style="font-size:10px;font-weight:700;color:#059669;">On Shift Now</span></div>'
        : '<div style="font-size:10px;color:' + mutedCol + ';margin-top:4px;">' + s.shiftCount + ' shifts completed</div>'

      var phoneBtn = s.phone
        ? '<a href="tel:' + s.phone + '" style="display:flex;align-items:center;justify-content:center;gap:5px;margin-top:8px;padding:8px 0;border-radius:10px;background:linear-gradient(135deg,' + col + ',' + col + 'cc);color:white;font-size:11px;font-weight:700;text-decoration:none;box-shadow:0 3px 10px -3px ' + col + '50;">📞 Call ' + s.first_name + '</a>'
        : ''

      var mP = (
        '<div style="padding:14px 16px;font-family:system-ui,sans-serif;">' +
        '<div style="font-size:14px;font-weight:800;color:' + textCol + ';">' + s.first_name + ' ' + s.last_name + '</div>' +
        '<div style="font-size:10px;color:' + mutedCol + ';">Support Worker</div>' +
        badge + phoneBtn +
        '</div>'
      ).replace(/"/g, "'")

      hp.push(
        'L.marker([' + s.lat + ',' + s.lng + '],{icon:L.divIcon({html:"' + mH + '",className:"",iconSize:[40,40],iconAnchor:[20,20],popupAnchor:[0,-24]})}).addTo(map).bindPopup("' + mP + '",{maxWidth:280});'
      )
    })

    hp.push('<' + '/script></body></html>')
    var blob = new Blob([hp.join('\n')], { type: 'text/html' })
    var blobUrl = URL.createObjectURL(blob)
    var iframe = document.createElement('iframe')
    iframe.src = blobUrl
    iframe.style.cssText = 'width:100%;height:100%;border:none;border-radius:16px;'
    iframe.title = 'Care Team Map'
    c.innerHTML = ''
    c.appendChild(iframe)
    return function() { URL.revokeObjectURL(blobUrl) }
  }, [isDark, careTeam.length])

  return (
    <div
      ref={mapRef}
      style={{
        width: '100%',
        height: 340,
        borderRadius: 16,
        overflow: 'hidden',
        border: '1px solid ' + fm.glassBorder,
        background: isDark
          ? 'linear-gradient(135deg, #0c1929, #162033)'
          : 'linear-gradient(135deg, #fdf2f8, #faf5ff)',
      }}
    />
  )
}

/* ═══════════════════════════════════════════════
   MAIN COMPONENT
   ═══════════════════════════════════════════════ */

export default function FamilyDashboard() {
  const navigate = useNavigate()
  const { isDark } = useTheme()
  const fm = useFM(isDark)
  const isDemo = window.location.hostname.includes('demo') || window.location.hostname === 'localhost' || window.location.hostname.match(/^\d/)

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
  }

  /* ── State ── */
  const [loading, setLoading] = useState(true)
  const [loaded, setLoaded] = useState(false)
  const [familyUser, setFamilyUser] = useState(null)
  const [participant, setParticipant] = useState(null)
  const [recentShifts, setRecentShifts] = useState([])
  const [goals, setGoals] = useState([])
  const [upcomingShifts, setUpcomingShifts] = useState([])
  const [medications, setMedications] = useState([])
  const [careTeam, setCareTeam] = useState([])
  const [expandedShift, setExpandedShift] = useState(null)
  const [tab, setTab] = useState('updates')
  const [familyMenuOpen, setFamilyMenuOpen] = useState(false)
  const [tabFade, setTabFade] = useState(true)
  const [chatMessages, setChatMessages] = useState([])
  const [chatLoading, setChatLoading] = useState(false)
  const chatEndRef = useRef(null)
  const contentRef = useRef(null)

  /* New feature state */
  const [shiftRatings, setShiftRatings] = useState({})
  const [calMonth, setCalMonth] = useState(new Date())
  const [feedbackText, setFeedbackText] = useState('')
  const [feedbackSent, setFeedbackSent] = useState(false)
  const [feedbackType, setFeedbackType] = useState('general')
  const [notifPrefs, setNotifPrefs] = useState({
    shift_notes: true,
    concerns: true,
    meds_changes: true,
    goal_updates: true,
    incidents: true,
  })
  const [showNotifPanel, setShowNotifPanel] = useState(false)
  const [incidents, setIncidents] = useState([])
  const [dismissedIncidents, setDismissedIncidents] = useState([])
  const [satisfaction, setSatisfaction] = useState(4)
  const [journalEntries, setJournalEntries] = useState([
    { id: 1, date: new Date().toISOString().split('T')[0], text: 'Amara seemed really happy after her morning walk today. The new worker Chloe is wonderful.', mood: '😊' },
  ])
  const [newJournalText, setNewJournalText] = useState('')
  const [newJournalMood, setNewJournalMood] = useState('😊')
  const [gratitudeMessages, setGratitudeMessages] = useState([])
  const [newGratitude, setNewGratitude] = useState('')
  const [gratitudeStaff, setGratitudeStaff] = useState(null)
  const [staffNoteText, setStaffNoteText] = useState('')
  const [staffNoteSent, setStaffNoteSent] = useState(false)
  const [pollAnswer, setPollAnswer] = useState(null)
  const [showReplayFor, setShowReplayFor] = useState(null)


  /* ── Session / Auth ── */
  useEffect(() => {
    const stored = sessionStorage.getItem('family_user')
    if (!stored) {
      const demoFamily = {
      name: 'Robert Watson',
      participant_name: 'Emma Watson',
      participant_id: 'b0000001-b000-4000-a000-000000000001',
    }
      sessionStorage.setItem('family_user', JSON.stringify(demoFamily))
      setFamilyUser(demoFamily)
      loadData(demoFamily.participant_id)
      return
    }
    const user = JSON.parse(stored)
    setFamilyUser(user)
    loadData(user.participant_id)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])


  /* ═══════════════════════════════════════════
     DATA LOADING — ALL SUPABASE QUERIES PRESERVED + incidents
     ═══════════════════════════════════════════ */

  const loadData = async (participantId) => {
    try {
      const today = new Date().toISOString().split('T')[0]
      const thirtyAgo = new Date(Date.now() - 30 * 864e5).toISOString().split('T')[0]

      const [partRes, shiftsRes, upcomingRes, goalsRes, medsRes, incRes] = await Promise.all([
        supabase.from('participants')
          .select('*')
          .eq('id', participantId)
          .single(),

        supabase.from('shifts')
          .select('*, staff(id, first_name, last_name, phone, email), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)')
          .eq('participant_id', participantId)
          .eq('status', 'completed')
          .order('shift_date', { ascending: false })
          .limit(20),

        supabase.from('shifts')
          .select('*, staff(first_name, last_name)')
          .eq('participant_id', participantId)
          .in('status', ['scheduled', 'upcoming', 'in_progress'])
          .gte('shift_date', today)
          .order('shift_date', { ascending: true })
          .limit(10),

        supabase.from('goals')
          .select('*')
          .eq('participant_id', participantId)
          .eq('status', 'active')
          .order('created_at', { ascending: false }),

        supabase.from('medications')
          .select('*')
          .eq('participant_id', participantId)
          .eq('status', 'active')
          .order('medication_name')
          .then(r => r)
          .catch(() => ({ data: [] })),

        supabase.from('incidents')
          .select('id,incident_type,severity,status,created_at,description')
          .eq('participant_id', participantId)
          .gte('created_at', thirtyAgo + 'T00:00:00')
          .in('status', ['open', 'investigating'])
          .order('created_at', { ascending: false })
          .limit(5)
          .then(r => r)
          .catch(() => ({ data: [] })),
      ])

      setParticipant(partRes.data)
      setRecentShifts(shiftsRes.data || [])
      setUpcomingShifts(upcomingRes.data || [])
      setGoals(goalsRes.data || [])
      setMedications(medsRes.data || [])
      setIncidents(incRes.data || [])

      /* Build care team from shift staff */
      const staffMap = {}
      ;(shiftsRes.data || []).forEach(s => {
        if (s.staff && !staffMap[s.staff.id]) {
          staffMap[s.staff.id] = { ...s.staff, shiftCount: 0 }
        }
        if (s.staff) staffMap[s.staff.id].shiftCount++
      })
      setCareTeam(
        Object.values(staffMap).sort((a, b) => b.shiftCount - a.shiftCount)
      )
    } catch (err) {
      console.error('Family dashboard load error:', err)
    } finally {
      setLoading(false)
    }
  }


  /* ── Effects ── */
  useEffect(() => {
    if (!loading) requestAnimationFrame(() => setLoaded(true))
  }, [loading])

  const handleLogout = () => {
    sessionStorage.removeItem('family_user')
    navigate('/')
  }

  const switchTab = (newTab) => {
    if (newTab === tab) return
    setTab(newTab)
    setTabFade(false)
    requestAnimationFrame(() => requestAnimationFrame(() => setTabFade(true)))
    if (contentRef.current) {
      contentRef.current.scrollTop = 0
    }
  }

  const stg = (i) => ({
    transitionDelay: `${i * 50}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(14px)',
    transition: 'all .6s cubic-bezier(.16,1,.3,1)',
  })


  /* ═══════════════════════════════════════════
     COMPUTED VALUES
     ═══════════════════════════════════════════ */

  const totalShifts = recentShifts.length
  const totalHours = recentShifts.reduce((a, s) => {
    const h = calcHours(s.clock_in, s.clock_out)
    return h ? a + parseFloat(h) : a
  }, 0)
  const avgGoalProgress = goals.length > 0
    ? Math.round(goals.reduce((a, g) => a + (g.progress || 0), 0) / goals.length)
    : 0
  const activeShift = upcomingShifts.find(s => s.status === 'in_progress')
  const nextShift = upcomingShifts.find(s => s.status !== 'in_progress')
  const shiftsWithNotes = recentShifts.filter(s => s.shift_notes?.length > 0).length
  const latestMood = recentShifts.find(s => s.shift_notes?.[0]?.mood)?.shift_notes?.[0]?.mood
  const pInitials = familyUser?.participant_name?.split(' ').map(n => n[0]).join('') || '?'
  const careScore = Math.min(100, Math.round(
    (shiftsWithNotes / Math.max(totalShifts, 1)) * 40 +
    avgGoalProgress * 0.3 +
    (careTeam.length > 0 ? 15 : 0) +
    (medications.length > 0 ? 15 : 0)
  ))

  /* All photos from shifts */
  const allPhotos = recentShifts.flatMap(s =>
    Array.isArray(s.photos)
      ? s.photos.map(p => ({
          url: typeof p === 'string' ? p : p.url,
          shiftDate: s.shift_date,
          staffName: s.staff ? `${s.staff.first_name} ${s.staff.last_name}` : 'Staff',
        }))
      : []
  )

  /* Daily care summaries */
  const dailySummaries = (() => {
    const byDate = {}
    recentShifts.forEach(s => {
      if (!byDate[s.shift_date]) byDate[s.shift_date] = []
      byDate[s.shift_date].push(s)
    })
    return Object.entries(byDate).slice(0, 7).map(([date, shifts]) => {
      const notes = shifts.flatMap(s => s.shift_notes || [])
      const hours = shifts.reduce((a, s) => {
        const h = calcHours(s.clock_in, s.clock_out)
        return h ? a + parseFloat(h) : a
      }, 0)
      const workers = [...new Set(shifts.map(s => s.staff?.first_name).filter(Boolean))]
      const moods = notes.map(n => n.mood).filter(Boolean)
      const concerns = notes.map(n => n.concerns).filter(Boolean)
      const activities = notes.map(n => n.activities).filter(Boolean)

      let summary = `${familyUser?.participant_name?.split(' ')[0] || 'They'} had ${shifts.length} shift${shifts.length > 1 ? 's' : ''} totalling ${hours.toFixed(1)}h`
      if (workers.length) summary += ` with ${workers.join(' & ')}`
      summary += '.'
      if (moods.length) summary += ` Mood: ${moods[0]}.`
      if (activities.length) summary += ` Activities included ${activities[0].substring(0, 80)}${activities[0].length > 80 ? '...' : ''}.`
      if (concerns.length) summary += ` ⚠️ Concern noted.`

      return { date, shifts: shifts.length, hours, summary, hasConcerns: concerns.length > 0 }
    })
  })()

  /* Active incidents */
  const activeIncidents = incidents.filter(i => !dismissedIncidents.includes(i.id))

  /* Staff changeover */
  const staffChangeover = (() => {
    if (recentShifts.length < 2) return null
    const latest = recentShifts[0]?.staff
    const prev = recentShifts.find((s, i) => i > 0 && s.staff?.id !== latest?.id)?.staff
    if (latest && prev && latest.id !== prev.id) return { from: prev, to: latest }
    return null
  })()

  /* Calendar data */
  const calendarData = (() => {
    const data = {}
    recentShifts.forEach(s => {
      if (!data[s.shift_date]) data[s.shift_date] = { total: 0, hasNotes: false, hasConcerns: false }
      data[s.shift_date].total++
      if (s.shift_notes?.length) data[s.shift_date].hasNotes = true
      if (s.shift_notes?.[0]?.concerns) data[s.shift_date].hasConcerns = true
    })
    upcomingShifts.forEach(s => {
      if (!data[s.shift_date]) data[s.shift_date] = { total: 0, upcoming: true }
      data[s.shift_date].total++
      data[s.shift_date].upcoming = true
    })
    return data
  })()

  /* Care comparison (this week vs last week) */
  const careComparison = (() => {
    const now = new Date()
    const thisWeekStart = new Date(now)
    thisWeekStart.setDate(now.getDate() - 7)
    const lastWeekStart = new Date(now)
    lastWeekStart.setDate(now.getDate() - 14)
    const twISO = thisWeekStart.toISOString().split('T')[0]
    const lwISO = lastWeekStart.toISOString().split('T')[0]
    const todayISO = now.toISOString().split('T')[0]

    const thisWeek = recentShifts.filter(s => s.shift_date >= twISO && s.shift_date <= todayISO)
    const lastWeek = recentShifts.filter(s => s.shift_date >= lwISO && s.shift_date < twISO)

    const twHours = thisWeek.reduce((a, s) => { const h = calcHours(s.clock_in, s.clock_out); return h ? a + parseFloat(h) : a }, 0)
    const lwHours = lastWeek.reduce((a, s) => { const h = calcHours(s.clock_in, s.clock_out); return h ? a + parseFloat(h) : a }, 0)

    const twNotes = thisWeek.filter(s => s.shift_notes?.length).length
    const lwNotes = lastWeek.filter(s => s.shift_notes?.length).length

    return {
      shifts: { current: thisWeek.length, prev: lastWeek.length },
      hours: { current: twHours, prev: lwHours },
      notes: { current: twNotes, prev: lwNotes },
    }
  })()

  /* Milestones */
  const milestones = (() => {
    const items = []
    if (participant?.date_of_birth) {
      const dob = new Date(participant.date_of_birth)
      const thisYear = new Date(new Date().getFullYear(), dob.getMonth(), dob.getDate())
      const diff = Math.ceil((thisYear - new Date()) / 864e5)
      if (diff >= 0 && diff <= 60) {
        items.push({
          icon: '🎂',
          label: 'Birthday',
          date: thisYear.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
          daysAway: diff,
          color: '#ec4899',
        })
      }
    }
    if (participant?.ndis_plan_end_date) {
      const planEnd = new Date(participant.ndis_plan_end_date)
      const diff = Math.ceil((planEnd - new Date()) / 864e5)
      if (diff >= 0 && diff <= 90) {
        items.push({
          icon: '📋',
          label: 'NDIS Plan Review',
          date: planEnd.toLocaleDateString('en-AU', { day: 'numeric', month: 'short' }),
          daysAway: diff,
          color: '#3b82f6',
        })
      }
    }
    return items
  })()

  /* Demo poll */
  const demoPoll = {
    question: 'Are you happy with the current shift schedule?',
    options: ['Yes, it works great', 'Needs some changes', 'Not sure yet'],
  }

  /* Weekly email preview */
  const weeklyEmailPreview = (() => {
    const pName = familyUser?.participant_name?.split(' ')[0] || 'your loved one'
    let email = `Hi ${familyUser?.name?.split(' ')[0] || 'there'},\n\n`
    email += `Here's ${pName}'s weekly care summary:\n\n`
    email += `📊 ${totalShifts} shifts completed (${totalHours.toFixed(0)} hours)\n`
    if (goals.length) email += `🎯 ${goals.length} active goals at ${avgGoalProgress}% avg progress\n`
    if (medications.length) email += `💊 ${medications.length} active medications\n`
    if (careTeam.length) email += `👥 ${careTeam.length} care team members\n`
    if (latestMood) email += `😊 Latest mood: ${latestMood}\n`
    if (nextShift) email += `📅 Next shift: ${formatDate(nextShift.shift_date)}\n`
    email += `\nCare quality score: ${careScore}/100\n`
    email += `\nWith care,\n${familyUser?.participant_name}'s Care Team`
    return email
  })()

  const noteSections = [
    { key: 'mood', label: 'Mood & Wellbeing', color: '#ec4899' },
    { key: 'activities', label: 'Activities', color: '#a855f7' },
    { key: 'goals_progress', label: 'Goal Progress', color: '#f59e0b' },
    { key: 'concerns', label: 'Concerns', color: '#ef4444' },
    { key: 'recommendations', label: 'Recommendations', color: '#3b82f6' },
  ]


  /* ═══════════════════════════════════════════
     AI CHAT — 100% preserved
     ═══════════════════════════════════════════ */

  const getSmartResponse = (text) => {
    const q = text.toLowerCase()
    const pName = familyUser.participant_name?.split(' ')[0] || 'your loved one'
    const primaryCarer = careTeam[0]
      ? `${careTeam[0].first_name} ${careTeam[0].last_name}`
      : null

    if (q.includes('goal') || q.includes('progress')) {
      if (goals.length === 0) return `${pName} doesn't have any active goals set at the moment. 🎯`
      return `${pName} has ${goals.length} active goal${goals.length > 1 ? 's' : ''} with an average progress of ${avgGoalProgress}%:\n\n${goals.map(g => `• ${g.title}: ${g.progress || 0}% complete`).join('\n')}\n\nGreat progress! 🌟`
    }
    if (q.includes('concern') || q.includes('worried') || q.includes('issue')) {
      const lc = recentShifts.find(s => s.shift_notes?.[0]?.concerns)
      if (lc) return `From the most recent shift with concerns (${formatDate(lc.shift_date)}):\n\n"${lc.shift_notes[0].concerns}"\n\nPlease reach out to your care coordinator. 💜`
      return `Great news — no recorded concerns from recent shifts! 😊`
    }
    if (q.includes('next shift') || q.includes('upcoming') || q.includes('schedule') || q.includes('when')) {
      if (activeShift) return `${pName} has support happening right now! 🟢\n\nStarted at ${formatTime(activeShift.start_time)}, ends at ${formatTime(activeShift.end_time)}${activeShift.staff ? ` with ${activeShift.staff.first_name} ${activeShift.staff.last_name}` : ''}.`
      if (nextShift) return `${pName}'s next shift is on ${formatDate(nextShift.shift_date)} from ${formatTime(nextShift.start_time)} to ${formatTime(nextShift.end_time)}${nextShift.staff ? ` with ${nextShift.staff.first_name} ${nextShift.staff.last_name}` : ''}. 📅`
      return `No upcoming shifts scheduled. Contact your provider. 📞`
    }
    if (q.includes('med') || q.includes('medication') || q.includes('drug')) {
      if (medications.length === 0) return `${pName} has no active medications recorded. 💊`
      return `${pName} currently has ${medications.length} active medication${medications.length > 1 ? 's' : ''}:\n\n${medications.map(m => `• ${m.medication_name} — ${m.dosage}${m.frequency ? `, ${m.frequency}` : ''}${m.requires_witness ? ' ⚠️ witness required' : ''}`).join('\n')}\n\nContact the prescriber for changes. 💊`
    }
    if (q.includes('primary') || q.includes('carer') || q.includes('worker') || q.includes('team') || q.includes('who')) {
      if (careTeam.length === 0) return `No care team members recorded yet. 👥`
      return `${pName}'s care team has ${careTeam.length} member${careTeam.length > 1 ? 's' : ''}:\n\n${careTeam.map((s, i) => `• ${s.first_name} ${s.last_name} — ${s.shiftCount} shift${s.shiftCount !== 1 ? 's' : ''}${i === 0 ? ' ⭐ Primary' : ''}`).join('\n')}\n\n${primaryCarer} is their most frequent support worker. 💜`
    }
    if (q.includes('summary') || q.includes('overview') || q.includes('how is') || q.includes('how are') || q.includes('update')) {
      let s = `Overview of ${pName}'s care:\n\n📊 ${totalShifts} shifts (${totalHours.toFixed(0)}h)\n`
      if (goals.length > 0) s += `🎯 ${goals.length} goals at ${avgGoalProgress}% avg\n`
      if (medications.length > 0) s += `💊 ${medications.length} active meds\n`
      if (careTeam.length > 0) s += `👥 ${careTeam.length} workers (primary: ${primaryCarer || 'N/A'})\n`
      if (nextShift) s += `📅 Next: ${formatDate(nextShift.shift_date)}\n`
      s += `\nLooking good! 💜`
      return s
    }
    if (q.includes('last shift') || q.includes('recent') || q.includes('latest')) {
      if (recentShifts.length === 0) return `No completed shifts yet. 📋`
      const last = recentShifts[0]
      const hours = calcHours(last.clock_in, last.clock_out)
      const notes = last.shift_notes?.[0]
      let r = `Most recent shift: ${formatDate(last.shift_date)} with ${last.staff?.first_name || 'a worker'}${hours ? ` for ${hours}h` : ''}.\n`
      if (notes?.mood) r += `\n😊 Mood: ${notes.mood}`
      if (notes?.activities) r += `\n🎨 Activities: ${notes.activities}`
      if (notes?.concerns) r += `\n⚠️ Concerns: ${notes.concerns}`
      return r
    }
    if (q.includes('mood') || q.includes('feeling') || q.includes('happy')) {
      if (latestMood) return `Latest mood for ${pName}: "${latestMood}" 😊`
      return `No mood reports yet. 📝`
    }
    return `I can help with:\n\n• Goal progress 🎯\n• Shift updates 📋\n• Schedules 📅\n• Medications 💊\n• Care team 👥\n• Concerns ⚠️\n• Summary 📊\n\nTry asking! 💜`
  }

  const handleSendChat = (message) => {
    if (!message || chatLoading) return
    setChatMessages(prev => [...prev, { role: 'user', text: message }])
    setChatLoading(true)
    setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 50)
    setTimeout(() => {
      setChatMessages(prev => [...prev, { role: 'assistant', text: getSmartResponse(message) }])
      setChatLoading(false)
      setTimeout(() => chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }), 100)
    }, 800 + Math.random() * 700)
  }

  /* Handlers */
  const handleRateShift = (shiftId, rating) => {
    setShiftRatings(prev => ({ ...prev, [shiftId]: rating }))
  }

  const handleSubmitFeedback = () => {
    if (!feedbackText.trim()) return
    setFeedbackSent(true)
    setTimeout(() => { setFeedbackText(''); setFeedbackSent(false) }, 3000)
  }

  const handleAddJournal = () => {
    if (!newJournalText.trim()) return
    setJournalEntries(prev => [{
      id: Date.now(),
      date: new Date().toISOString().split('T')[0],
      text: newJournalText,
      mood: newJournalMood,
    }, ...prev])
    setNewJournalText('')
  }

  const handleSendGratitude = () => {
    if (!newGratitude.trim() || !gratitudeStaff) return
    setGratitudeMessages(prev => [{
      id: Date.now(),
      staffName: `${gratitudeStaff.first_name} ${gratitudeStaff.last_name}`,
      message: newGratitude,
      date: new Date().toISOString().split('T')[0],
    }, ...prev])
    setNewGratitude('')
    setGratitudeStaff(null)
  }

  const handleSendStaffNote = () => {
    if (!staffNoteText.trim()) return
    setStaffNoteSent(true)
    setTimeout(() => { setStaffNoteText(''); setStaffNoteSent(false) }, 3000)
  }


  /* ═══════════════════════════════════════════
     LOADING STATE
     ═══════════════════════════════════════════ */

  if (loading) {
    return (
      <div
        style={{
          height: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: isDark
            ? '#0f172a'
            : 'linear-gradient(160deg, #fdf2f8, #faf5ff, #fce7f3)',
        }}
      >
        <div style={{ textAlign: 'center' }}>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: 22,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              background: fm.gradient,
              boxShadow: '0 8px 32px -8px rgba(236,72,153,0.4)',
            }}
          >
            <Heart size={32} color="white" />
          </div>
          <Loader2
            size={28}
            className="animate-spin"
            style={{ color: fm.primary, margin: '0 auto' }}
          />
          <p
            style={{
              fontSize: 13,
              color: dk.textMuted,
              marginTop: 16,
            }}
          >
            Loading care updates...
          </p>
        </div>
      </div>
    )
  }

  if (!familyUser) return null

  /* Calendar helpers */
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

  const getDS = d =>
    `${calMonth.getFullYear()}-${String(calMonth.getMonth() + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`

  const isToday = d => {
    if (!d) return false
    const n = new Date()
    return d === n.getDate() &&
      calMonth.getMonth() === n.getMonth() &&
      calMonth.getFullYear() === n.getFullYear()
  }


  /* ═══════════════════════════════════════════
     TAB CONTENT
     ═══════════════════════════════════════════ */

  const renderContent = () => {
    switch (tab) {

      /* ─── UPDATES ─── */
      case 'updates':
        return (
          <div
            style={{
              display: 'flex',
              flexDirection: 'column',
              gap: 0,
              position: 'relative',
            }}
          >
            {/* Daily summaries */}
            {dailySummaries.length > 0 && (
              <div
                style={{
                  marginBottom: 16,
                  padding: '16px 18px',
                  borderRadius: 18,
                  background: fm.glass,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${fm.glassBorder}`,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: fm.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  📋 Daily Care Summaries
                </p>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 8,
                  }}
                >
                  {dailySummaries.slice(0, 3).map((ds, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 14,
                        background: ds.hasConcerns
                          ? (isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)')
                          : dk.subtleBg,
                        border: ds.hasConcerns
                          ? '1px solid rgba(239,68,68,0.12)'
                          : `1px solid ${fm.glassBorder}`,
                      }}
                    >
                      <p
                        style={{
                          fontSize: 11,
                          fontWeight: 800,
                          color: dk.text,
                          marginBottom: 3,
                        }}
                      >
                        {formatDate(ds.date)}
                      </p>
                      <p
                        style={{
                          fontSize: 12,
                          color: dk.textMuted,
                          lineHeight: 1.5,
                        }}
                      >
                        {ds.summary}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Shift cards with timeline */}
            {recentShifts.length > 0 ? recentShifts.map((s, idx) => {
              const hours = calcHours(s.clock_in, s.clock_out)
              const notes = s.shift_notes?.[0]
              const photos = Array.isArray(s.photos) ? s.photos : []
              const isExp = expandedShift === s.id
              const isLast = idx === recentShifts.length - 1
              const rating = shiftRatings[s.id]

              return (
                <div
                  key={s.id}
                  style={{
                    display: 'flex',
                    gap: 0,
                    position: 'relative',
                  }}
                >
                  {/* Timeline dot + line */}
                  <div
                    style={{
                      display: 'flex',
                      flexDirection: 'column',
                      alignItems: 'center',
                      width: 32,
                      flexShrink: 0,
                      paddingTop: 24,
                    }}
                  >
                    <div
                      style={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        background: notes
                          ? fm.gradient
                          : (isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.08)'),
                        border: `2px solid ${isDark ? '#0f172a' : '#fdf2f8'}`,
                        boxShadow: notes ? `0 0 8px ${fm.primary}40` : 'none',
                        flexShrink: 0,
                        zIndex: 2,
                      }}
                    />
                    {!isLast && (
                      <div
                        style={{
                          width: 2,
                          flex: 1,
                          background: isDark
                            ? 'rgba(236,72,153,0.08)'
                            : 'rgba(236,72,153,0.1)',
                          marginTop: 4,
                        }}
                      />
                    )}
                  </div>

                  {/* Card */}
                  <div
                    style={{
                      flex: 1,
                      marginBottom: 12,
                      borderRadius: 20,
                      overflow: 'hidden',
                      background: fm.glass,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: `1px solid ${fm.glassBorder}`,
                      boxShadow: isExp
                        ? `0 8px 32px -8px ${fm.glassGlow}`
                        : '0 2px 8px -4px rgba(0,0,0,0.04)',
                      transition: 'all .3s',
                    }}
                  >
                    {/* Header */}
                    <button
                      onClick={() => setExpandedShift(isExp ? null : s.id)}
                      style={{
                        width: '100%',
                        padding: '16px 20px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 14,
                        textAlign: 'left',
                        border: 'none',
                        cursor: 'pointer',
                        background: 'transparent',
                      }}
                    >
                      <div
                        style={{
                          width: 48,
                          height: 48,
                          borderRadius: 14,
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'white',
                          flexShrink: 0,
                          background: 'linear-gradient(135deg, #a855f7, #ec4899)',
                          boxShadow: '0 4px 16px -4px rgba(168,85,247,0.3)',
                        }}
                      >
                        <User size={20} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                          }}
                        >
                          <p style={{ fontWeight: 900, color: dk.text }}>
                            {formatDate(s.shift_date)}
                          </p>
                          {notes && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 700,
                                background: `${fm.primary}15`,
                                color: fm.primary,
                              }}
                            >
                              Has Notes
                            </span>
                          )}
                          {photos.length > 0 && (
                            <span
                              style={{
                                padding: '2px 8px',
                                borderRadius: 999,
                                fontSize: 10,
                                fontWeight: 700,
                                background: 'rgba(168,85,247,0.1)',
                                color: '#a855f7',
                                display: 'flex',
                                alignItems: 'center',
                                gap: 3,
                              }}
                            >
                              <Camera size={10} /> {photos.length}
                            </span>
                          )}
                          <ShiftQuality notes={notes} />
                          {rating && (
                            <StarRating
                              rating={rating}
                              interactive={false}
                              size={12}
                            />
                          )}
                        </div>
                        <p
                          style={{
                            fontSize: 13,
                            color: dk.textMuted,
                            marginTop: 3,
                          }}
                        >
                          {s.staff
                            ? `${s.staff.first_name} ${s.staff.last_name}`
                            : 'Support worker'}
                          {hours ? ` · ${hours}h` : ''}
                          {s.service_type ? ` · ${formatLabel(s.service_type)}` : ''}
                        </p>
                      </div>
                      <ChevronRight
                        size={18}
                        style={{
                          color: dk.textFaint,
                          transition: 'transform .2s',
                          transform: isExp ? 'rotate(90deg)' : 'rotate(0)',
                        }}
                      />
                    </button>

                    {/* Expanded */}
                    {isExp && (
                      <div
                        style={{
                          padding: '4px 20px 20px',
                          borderTop: `1px solid ${fm.glassBorder}`,
                          display: 'flex',
                          flexDirection: 'column',
                          gap: 10,
                          animation: 'slideUp 0.3s ease-out',
                        }}
                      >
                        {/* Clock in/out */}
                        <div
                          style={{
                            display: 'grid',
                            gridTemplateColumns: '1fr 1fr',
                            gap: 10,
                            marginTop: 8,
                          }}
                        >
                          <div
                            style={{
                              padding: 12,
                              borderRadius: 14,
                              background: 'rgba(16,185,129,0.06)',
                              border: '1px solid rgba(16,185,129,0.15)',
                            }}
                          >
                            <p style={{ fontSize: 10, color: '#059669', fontWeight: 700, textTransform: 'uppercase' }}>
                              Clock In
                            </p>
                            <p style={{ fontSize: 16, fontWeight: 900, color: '#047857' }}>
                              {formatTime(s.clock_in) || 'N/A'}
                            </p>
                          </div>
                          <div
                            style={{
                              padding: 12,
                              borderRadius: 14,
                              background: 'rgba(249,115,22,0.06)',
                              border: '1px solid rgba(249,115,22,0.15)',
                            }}
                          >
                            <p style={{ fontSize: 10, color: '#ea580c', fontWeight: 700, textTransform: 'uppercase' }}>
                              Clock Out
                            </p>
                            <p style={{ fontSize: 16, fontWeight: 900, color: '#c2410c' }}>
                              {formatTime(s.clock_out) || 'N/A'}
                            </p>
                          </div>
                        </div>

                        {/* Shift Replay Timeline */}
                        {notes && s.clock_in && s.clock_out && (
                          <div
                            style={{
                              padding: '12px 16px',
                              borderRadius: 14,
                              background: isDark ? 'rgba(168,85,247,0.06)' : 'rgba(168,85,247,0.03)',
                              border: `1px solid ${isDark ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.08)'}`,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#a855f7',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                                marginBottom: 8,
                              }}
                            >
                              ⏱️ Shift Timeline
                            </p>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                              {[
                                { time: formatTime(s.clock_in), label: 'Clocked in', icon: '🟢' },
                                ...(notes.mood ? [{ time: '', label: `Mood: ${notes.mood}`, icon: '😊' }] : []),
                                ...(notes.activities ? [{ time: '', label: notes.activities.substring(0, 60) + (notes.activities.length > 60 ? '...' : ''), icon: '🎨' }] : []),
                                ...(notes.goals_progress ? [{ time: '', label: 'Goal progress recorded', icon: '🎯' }] : []),
                                ...(notes.concerns ? [{ time: '', label: 'Concern flagged', icon: '⚠️' }] : []),
                                { time: formatTime(s.clock_out), label: 'Clocked out', icon: '🔴' },
                              ].map((step, si) => (
                                <div
                                  key={si}
                                  style={{
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 10,
                                    fontSize: 12,
                                  }}
                                >
                                  <span style={{ fontSize: 14 }}>{step.icon}</span>
                                  <div
                                    style={{
                                      flex: 1,
                                      padding: '6px 10px',
                                      borderRadius: 8,
                                      background: dk.subtleBg,
                                      color: dk.textSoft,
                                    }}
                                  >
                                    {step.time && (
                                      <span
                                        style={{
                                          fontWeight: 700,
                                          color: dk.text,
                                          marginRight: 8,
                                        }}
                                      >
                                        {step.time}
                                      </span>
                                    )}
                                    {step.label}
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        )}

                        {/* Notes */}
                        {notes && (
                          <div
                            style={{
                              display: 'flex',
                              flexDirection: 'column',
                              gap: 8,
                            }}
                          >
                            {noteSections.map(sec =>
                              notes[sec.key] ? (

                                <div
                                  key={sec.key}
                                  style={{
                                    padding: '12px 16px',
                                    borderRadius: 14,
                                    background: `${sec.color}08`,
                                    border: `1px solid ${sec.color}18`,
                                  }}
                                >
                                  <p
                                    style={{
                                      fontSize: 10,
                                      fontWeight: 700,
                                      color: sec.color,
                                      textTransform: 'uppercase',
                                      letterSpacing: '0.05em',
                                      marginBottom: 6,
                                    }}
                                  >
                                    {sec.label}
                                  </p>
                                  <p
                                    style={{
                                      fontSize: 13,
                                      color: dk.textSoft,
                                      lineHeight: 1.6,
                                    }}
                                  >
                                    {notes[sec.key]}
                                  </p>
                                </div>
                              ) : null
                            )}

                            {/* Fallback content field */}
                            {notes.content && !notes.mood && !notes.activities && !notes.goals_progress && !notes.concerns && !notes.recommendations && (
                              <div
                                style={{
                                  padding: '12px 16px',
                                  borderRadius: 14,
                                  background: dk.subtleBg,
                                  border: `1px solid ${fm.glassBorder}`,
                                }}
                              >
                                <p
                                  style={{
                                    fontSize: 10,
                                    fontWeight: 700,
                                    color: dk.textFaint,
                                    textTransform: 'uppercase',
                                    letterSpacing: '0.05em',
                                    marginBottom: 6,
                                  }}
                                >
                                  Notes
                                </p>
                                <p
                                  style={{
                                    fontSize: 13,
                                    color: dk.textSoft,
                                    lineHeight: 1.6,
                                  }}
                                >
                                  {notes.content}
                                </p>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Photo Gallery */}
                        {photos.length > 0 && (
                          <PhotoGallery photos={photos} />
                        )}

                        {/* No notes or photos fallback */}
                        {!notes && photos.length === 0 && (
                          <div
                            style={{
                              padding: '20px 16px',
                              textAlign: 'center',
                              borderRadius: 14,
                              background: dk.subtleBg,
                            }}
                          >
                            <p
                              style={{
                                fontSize: 12,
                                color: dk.textFaint,
                              }}
                            >
                              No notes or photos for this shift
                            </p>
                          </div>
                        )}

                        {/* Shift Rating */}
                        <div
                          style={{
                            padding: '14px 16px',
                            borderRadius: 14,
                            background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.04)',
                            border: '1px solid rgba(251,191,36,0.15)',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                          }}
                        >
                          <div>
                            <p
                              style={{
                                fontSize: 10,
                                fontWeight: 700,
                                color: '#d97706',
                                textTransform: 'uppercase',
                                letterSpacing: '0.05em',
                              }}
                            >
                              Rate This Shift
                            </p>
                            <p
                              style={{
                                fontSize: 11,
                                color: dk.textFaint,
                                marginTop: 2,
                              }}
                            >
                              {rating ? 'Thanks for your feedback!' : 'How was this shift?'}
                            </p>
                          </div>
                          <StarRating
                            rating={rating || 0}
                            onRate={(r) => handleRateShift(s.id, r)}
                            size={22}
                          />
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )
            }) : (
              <EmptyState
                icon={Activity}
                text="No recent shifts"
                sub="Completed shifts will appear here"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── UPCOMING ─── */
      case 'upcoming':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: fm.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: 4,
              }}
            >
              📅 Upcoming & Active Shifts
            </p>

            {upcomingShifts.length > 0 ? upcomingShifts.map((s, i) => {
              const isActive = s.status === 'in_progress'
              return (
                <div
                  key={s.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 20,
                    background: fm.glass,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: isActive
                      ? '1px solid rgba(16,185,129,0.25)'
                      : `1px solid ${fm.glassBorder}`,
                    boxShadow: isActive
                      ? '0 0 24px -8px rgba(16,185,129,0.2)'
                      : '0 2px 8px -4px rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 16,
                    animation: 'slideUp 0.3s ease-out',
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      flexShrink: 0,
                      background: isActive
                        ? 'linear-gradient(135deg, #10b981, #059669)'
                        : 'linear-gradient(135deg, #ec4899, #a855f7)',
                      boxShadow: isActive
                        ? '0 4px 16px -4px rgba(16,185,129,0.35)'
                        : '0 4px 16px -4px rgba(236,72,153,0.25)',
                    }}
                  >
                    {isActive ? <Zap size={20} /> : <Calendar size={20} />}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <p style={{ fontWeight: 900, color: dk.text, fontSize: 14 }}>
                        {formatDate(s.shift_date)}
                      </p>
                      {isActive && (
                        <span
                          style={{
                            padding: '2px 10px',
                            borderRadius: 999,
                            fontSize: 10,
                            fontWeight: 800,
                            background: 'rgba(16,185,129,0.12)',
                            color: '#059669',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 4,
                          }}
                        >
                          <div
                            style={{
                              width: 6,
                              height: 6,
                              borderRadius: '50%',
                              background: '#10b981',
                              animation: 'blink 1.5s infinite',
                            }}
                          />
                          Active Now
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 3 }}>
                      {formatTime(s.start_time)} – {formatTime(s.end_time)}
                      {s.staff ? ` · ${s.staff.first_name} ${s.staff.last_name}` : ''}
                    </p>
                    {s.service_type && (
                      <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>
                        {formatLabel(s.service_type)}
                      </p>
                    )}
                  </div>
                  <ChevronRight size={16} style={{ color: dk.textFaint }} />
                </div>
              )
            }) : (
              <EmptyState
                icon={Calendar}
                text="No upcoming shifts"
                sub="Scheduled shifts will appear here"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── GOALS ─── */
      case 'goals':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Progress Timeline — horizontal bar chart */}
            {goals.length > 0 && (
              <div
                style={{
                  padding: '18px 20px',
                  borderRadius: 20,
                  background: fm.glass,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${fm.glassBorder}`,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: fm.primary,
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 14,
                  }}
                >
                  🎯 Progress Timeline
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  {goals.map((g, i) => {
                    const pct = g.progress || 0
                    const barCol = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct >= 25 ? '#f59e0b' : '#ec4899'
                    return (
                      <div key={g.id}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
                          <p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>
                            {g.title}
                          </p>
                          <p style={{ fontSize: 12, fontWeight: 800, color: barCol }}>
                            {pct}%
                          </p>
                        </div>
                        <div
                          style={{
                            height: 8,
                            borderRadius: 999,
                            background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                            overflow: 'hidden',
                          }}
                        >
                          <div
                            style={{
                              height: '100%',
                              borderRadius: 999,
                              background: `linear-gradient(90deg, ${barCol}, ${barCol}cc)`,
                              width: `${pct}%`,
                              animation: 'barGrow 1.2s cubic-bezier(0.16,1,0.3,1)',
                              boxShadow: `0 0 8px ${barCol}40`,
                            }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </div>
            )}

            {/* Goal cards */}
            {goals.length > 0 ? goals.map((g, i) => {
              const pct = g.progress || 0
              const col = pct >= 80 ? '#10b981' : pct >= 50 ? '#3b82f6' : pct >= 25 ? '#f59e0b' : '#ec4899'
              return (
                <div
                  key={g.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 20,
                    background: fm.glass,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${fm.glassBorder}`,
                    animation: 'slideUp 0.3s ease-out',
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
                    <div
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${col}15`,
                        color: col,
                      }}
                    >
                      <Target size={18} />
                    </div>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontWeight: 900, color: dk.text, fontSize: 14 }}>
                        {g.title}
                      </p>
                      {g.target_date && (
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 2 }}>
                          Target: {formatDate(g.target_date)}
                        </p>
                      )}
                    </div>
                    <span
                      style={{
                        fontSize: 18,
                        fontWeight: 900,
                        color: col,
                      }}
                    >
                      {pct}%
                    </span>
                  </div>

                  {g.description && (
                    <p style={{ fontSize: 12, color: dk.textMuted, lineHeight: 1.5, marginBottom: 12 }}>
                      {g.description}
                    </p>
                  )}

                  {/* Progress bar with shimmer */}
                  <div
                    style={{
                      height: 10,
                      borderRadius: 999,
                      background: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
                      overflow: 'hidden',
                      position: 'relative',
                    }}
                  >
                    <div
                      style={{
                        height: '100%',
                        borderRadius: 999,
                        background: `linear-gradient(90deg, ${col}, ${col}cc)`,
                        width: `${pct}%`,
                        animation: 'barGrow 1.2s cubic-bezier(0.16,1,0.3,1)',
                        position: 'relative',
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          position: 'absolute',
                          inset: 0,
                          background: 'linear-gradient(90deg, transparent, rgba(255,255,255,0.3), transparent)',
                          animation: 'shimmer 2s infinite',
                        }}
                      />
                    </div>
                  </div>
                </div>
              )
            }) : (
              <EmptyState
                icon={Target}
                text="No active goals"
                sub="Goals will appear when set by the care team"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── MEDICATIONS ─── */
      case 'medications':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {/* Blue info banner */}
            <div
              style={{
                padding: '14px 18px',
                borderRadius: 16,
                background: isDark ? 'rgba(59,130,246,0.08)' : 'rgba(59,130,246,0.04)',
                border: '1px solid rgba(59,130,246,0.15)',
                display: 'flex',
                alignItems: 'center',
                gap: 10,
              }}
            >
              <Info size={16} style={{ color: '#3b82f6', flexShrink: 0 }} />
              <p style={{ fontSize: 12, color: isDark ? '#93c5fd' : '#2563eb', lineHeight: 1.5 }}>
                Medication information is read-only. Contact the prescriber or care coordinator for any changes.
              </p>
            </div>

            {medications.length > 0 ? medications.map((m, i) => {
              const isWitness = m.requires_witness
              const gradCol = isWitness ? '#f59e0b' : '#8b5cf6'
              return (
                <div
                  key={m.id}
                  style={{
                    padding: '18px 20px',
                    borderRadius: 20,
                    background: fm.glass,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${fm.glassBorder}`,
                    animation: 'slideUp 0.3s ease-out',
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                    <div
                      style={{
                        width: 44,
                        height: 44,
                        borderRadius: 13,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        color: 'white',
                        background: `linear-gradient(135deg, ${gradCol}, ${gradCol}cc)`,
                        boxShadow: `0 4px 14px -4px ${gradCol}40`,
                        flexShrink: 0,
                      }}
                    >
                      <Pill size={18} />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                        <p style={{ fontWeight: 900, color: dk.text, fontSize: 14 }}>
                          {m.medication_name}
                        </p>
                        {m.is_prn && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 800,
                              background: 'rgba(59,130,246,0.1)',
                              color: '#3b82f6',
                            }}
                          >
                            PRN
                          </span>
                        )}
                        {isWitness && (
                          <span
                            style={{
                              padding: '2px 8px',
                              borderRadius: 999,
                              fontSize: 9,
                              fontWeight: 800,
                              background: 'rgba(245,158,11,0.1)',
                              color: '#d97706',
                              display: 'flex',
                              alignItems: 'center',
                              gap: 3,
                            }}
                          >
                            <Shield size={9} /> Witness Req
                          </span>
                        )}
                      </div>
                      {m.dosage && (
                        <p style={{ fontSize: 13, color: dk.textMuted, marginTop: 3 }}>
                          {m.dosage}
                          {m.frequency ? ` · ${m.frequency}` : ''}
                          {m.route ? ` · ${m.route}` : ''}
                        </p>
                      )}
                      {m.prescriber && (
                        <p style={{ fontSize: 11, color: dk.textFaint, marginTop: 3 }}>
                          Prescriber: {m.prescriber}
                        </p>
                      )}
                      {m.instructions && (
                        <p
                          style={{
                            fontSize: 12,
                            color: dk.textMuted,
                            marginTop: 8,
                            padding: '8px 12px',
                            borderRadius: 10,
                            background: dk.subtleBg,
                            lineHeight: 1.5,
                          }}
                        >
                          {m.instructions}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )
            }) : (
              <EmptyState
                icon={Pill}
                text="No active medications"
                sub="Medications will appear when recorded"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── TEAM ─── */
      case 'team':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Staff Changeover Alert */}
            {staffChangeover && (
              <div
                style={{
                  padding: '14px 18px',
                  borderRadius: 16,
                  background: isDark ? 'rgba(245,158,11,0.08)' : 'rgba(245,158,11,0.04)',
                  border: '1px solid rgba(245,158,11,0.18)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                }}
              >
                <AlertTriangle size={18} style={{ color: '#f59e0b', flexShrink: 0 }} />
                <div>
                  <p style={{ fontSize: 12, fontWeight: 800, color: '#d97706' }}>
                    Staff Changeover
                  </p>
                  <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                    {staffChangeover.from.first_name} → {staffChangeover.to.first_name} on the most recent shift
                  </p>
                </div>
              </div>
            )}

            {/* Care Map */}
            <div>
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: fm.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                📍 Care Team Map
              </p>
              <CareMap
                careTeam={careTeam}
                participant={participant}
                activeShift={activeShift}
                isDark={isDark}
                fm={fm}
              />
            </div>

            {/* Gratitude Wall */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#f59e0b',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                💛 Gratitude Wall
              </p>

              {/* Select worker */}
              <select
                value={gratitudeStaff ? `${gratitudeStaff.first_name} ${gratitudeStaff.last_name}` : ''}
                onChange={(e) => {
                  const found = careTeam.find(s => `${s.first_name} ${s.last_name}` === e.target.value)
                  setGratitudeStaff(found || null)
                }}
                style={{
                  width: '100%',
                  padding: '10px 14px',
                  borderRadius: 12,
                  border: `1px solid ${fm.glassBorder}`,
                  background: dk.subtleBg,
                  color: dk.text,
                  fontSize: 13,
                  marginBottom: 8,
                  outline: 'none',
                  appearance: 'auto',
                }}
              >
                <option value="">Select a worker to thank...</option>
                {careTeam.map(s => (
                  <option key={s.id} value={`${s.first_name} ${s.last_name}`}>
                    {s.first_name} {s.last_name}
                  </option>
                ))}
              </select>

              {/* Message + send */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={newGratitude}
                  onChange={(e) => setNewGratitude(e.target.value)}
                  placeholder="Write a thank you message..."
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: 12,
                    border: `1px solid ${fm.glassBorder}`,
                    background: dk.subtleBg,
                    color: dk.text,
                    fontSize: 13,
                    outline: 'none',
                  }}
                  onKeyDown={(e) => e.key === 'Enter' && handleSendGratitude()}
                />
                <button
                  onClick={handleSendGratitude}
                  style={{
                    padding: '10px 16px',
                    borderRadius: 12,
                    border: 'none',
                    background: fm.gradient,
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 13,
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 6,
                  }}
                >
                  <ThumbsUp size={14} /> Send
                </button>
              </div>

              {/* Message list */}
              {gratitudeMessages.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
                  {gratitudeMessages.map(gm => (
                    <div
                      key={gm.id}
                      style={{
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: isDark ? 'rgba(251,191,36,0.06)' : 'rgba(251,191,36,0.04)',
                        border: '1px solid rgba(251,191,36,0.12)',
                      }}
                    >
                      <p style={{ fontSize: 12, fontWeight: 700, color: '#d97706' }}>
                        To {gm.staffName}
                      </p>
                      <p style={{ fontSize: 13, color: dk.textSoft, marginTop: 4, lineHeight: 1.5 }}>
                        {gm.message}
                      </p>
                      <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 4 }}>
                        {formatDate(gm.date)}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Family Note to Staff */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#a855f7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                ✉️ Note to Next Worker
              </p>
              <textarea
                value={staffNoteText}
                onChange={(e) => setStaffNoteText(e.target.value)}
                placeholder="Leave a note for the next support worker..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${fm.glassBorder}`,
                  background: dk.subtleBg,
                  color: dk.text,
                  fontSize: 13,
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSendStaffNote}
                style={{
                  marginTop: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: staffNoteSent ? 'linear-gradient(135deg, #10b981, #059669)' : fm.gradient,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                }}
              >
                {staffNoteSent ? (
                  <><CheckCircle size={14} /> Sent!</>
                ) : (
                  <><Send size={14} /> Send Note</>
                )}
              </button>
            </div>

            {/* Team member cards */}
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: fm.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
                marginBottom: -4,
              }}
            >
              👥 Care Team Members
            </p>
            {careTeam.length > 0 ? careTeam.map((s, i) => {
              const tc = ['#3b82f6', '#10b981', '#8b5cf6', '#f59e0b', '#06b6d4', '#ef4444']
              const col = tc[i % tc.length]
              const initials = `${s.first_name?.[0] || ''}${s.last_name?.[0] || ''}`
              const isPrimary = i === 0
              return (
                <div
                  key={s.id}
                  style={{
                    padding: '16px 20px',
                    borderRadius: 20,
                    background: fm.glass,
                    backdropFilter: 'blur(16px)',
                    WebkitBackdropFilter: 'blur(16px)',
                    border: `1px solid ${fm.glassBorder}`,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 14,
                    animation: 'slideUp 0.3s ease-out',
                    animationDelay: `${i * 60}ms`,
                    animationFillMode: 'both',
                  }}
                >
                  <div
                    style={{
                      width: 48,
                      height: 48,
                      borderRadius: 14,
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'white',
                      fontSize: 16,
                      fontWeight: 900,
                      background: `linear-gradient(135deg, ${col}, ${col}cc)`,
                      boxShadow: `0 4px 14px -4px ${col}40`,
                      flexShrink: 0,
                    }}
                  >
                    {initials}
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <p style={{ fontWeight: 900, color: dk.text, fontSize: 14 }}>
                        {s.first_name} {s.last_name}
                      </p>
                      {isPrimary && (
                        <span
                          style={{
                            padding: '2px 8px',
                            borderRadius: 999,
                            fontSize: 9,
                            fontWeight: 800,
                            background: 'rgba(251,191,36,0.12)',
                            color: '#d97706',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 3,
                          }}
                        >
                          <Star size={9} fill="#fbbf24" style={{ color: '#fbbf24' }} /> Primary
                        </span>
                      )}
                    </div>
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                      {s.shiftCount} shift{s.shiftCount !== 1 ? 's' : ''} completed
                    </p>
                  </div>
                  {s.phone && (
                    <a
                      href={`tel:${s.phone}`}
                      style={{
                        width: 40,
                        height: 40,
                        borderRadius: 12,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: `${col}12`,
                        color: col,
                        border: `1px solid ${col}20`,
                        textDecoration: 'none',
                        transition: 'all 0.2s',
                      }}
                    >
                      <Phone size={16} />
                    </a>
                  )}
                </div>
              )
            }) : (
              <EmptyState
                icon={Users}
                text="No care team members"
                sub="Workers will appear after shifts"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── GALLERY ─── */
      case 'gallery':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <p
              style={{
                fontSize: 10,
                fontWeight: 700,
                color: fm.primary,
                textTransform: 'uppercase',
                letterSpacing: '0.06em',
              }}
            >
              📸 {allPhotos.length} Photo{allPhotos.length !== 1 ? 's' : ''} from Care Shifts

            </p>
            {allPhotos.length > 0 ? (
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))',
                  gap: 10,
                }}
              >
                {allPhotos.map((p, i) => (
                  <div
                    key={i}
                    style={{
                      position: 'relative',
                      aspectRatio: '1',
                      borderRadius: 16,
                      overflow: 'hidden',
                      border: `1px solid ${fm.glassBorder}`,
                      cursor: 'pointer',
                      animation: 'slideUp 0.3s ease-out',
                      animationDelay: `${i * 40}ms`,
                      animationFillMode: 'both',
                    }}
                  >
                    <img
                      src={p.url}
                      alt="Care photo"
                      style={{
                        width: '100%',
                        height: '100%',
                        objectFit: 'cover',
                      }}
                      loading="lazy"
                    />
                    <div
                      style={{
                        position: 'absolute',
                        bottom: 0,
                        left: 0,
                        right: 0,
                        padding: '20px 10px 8px',
                        background: 'linear-gradient(transparent, rgba(0,0,0,0.6))',
                      }}
                    >
                      <p style={{ fontSize: 10, color: 'white', fontWeight: 600 }}>
                        {formatDate(p.shiftDate)}
                      </p>
                      <p style={{ fontSize: 9, color: 'rgba(255,255,255,0.7)' }}>
                        {p.staffName}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState
                icon={Image}
                text="No photos yet"
                sub="Photos from shifts will appear here"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── CALENDAR ─── */
      case 'calendar':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Care Calendar */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginBottom: 16,
                }}
              >
                <button
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() - 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: `1px solid ${fm.glassBorder}`,
                    background: dk.subtleBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: dk.textMuted,
                  }}
                >
                  <ChevronLeft size={16} />
                </button>
                <p style={{ fontSize: 14, fontWeight: 900, color: dk.text }}>
                  {calMonth.toLocaleDateString('en-AU', { month: 'long', year: 'numeric' })}
                </p>
                <button
                  onClick={() => setCalMonth(new Date(calMonth.getFullYear(), calMonth.getMonth() + 1))}
                  style={{
                    width: 32,
                    height: 32,
                    borderRadius: 10,
                    border: `1px solid ${fm.glassBorder}`,
                    background: dk.subtleBg,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    cursor: 'pointer',
                    color: dk.textMuted,
                  }}
                >
                  <ChevronRight size={16} />
                </button>
              </div>

              {/* Day headers */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 2,
                  marginBottom: 6,
                }}
              >
                {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((d, i) => (
                  <div
                    key={i}
                    style={{
                      textAlign: 'center',
                      fontSize: 10,
                      fontWeight: 700,
                      color: dk.textFaint,
                      padding: '4px 0',
                    }}
                  >
                    {d}
                  </div>
                ))}
              </div>

              {/* Calendar grid */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(7, 1fr)',
                  gap: 2,
                }}
              >
                {calDays().map((d, i) => {
                  if (!d) return <div key={`e-${i}`} />
                  const ds = getDS(d)
                  const cd = calendarData[ds]
                  const today = isToday(d)
                  return (
                    <div
                      key={i}
                      style={{
                        textAlign: 'center',
                        padding: '6px 2px 8px',
                        borderRadius: 10,
                        background: today
                          ? `${fm.primary}15`
                          : 'transparent',
                        border: today
                          ? `1px solid ${fm.primary}30`
                          : '1px solid transparent',
                        position: 'relative',
                      }}
                    >
                      <p
                        style={{
                          fontSize: 12,
                          fontWeight: today ? 900 : 500,
                          color: today ? fm.primary : dk.text,
                        }}
                      >
                        {d}
                      </p>
                      {cd && (
                        <div
                          style={{
                            display: 'flex',
                            gap: 2,
                            justifyContent: 'center',
                            marginTop: 3,
                          }}
                        >
                          {cd.hasNotes && (
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: '#ec4899',
                              }}
                            />
                          )}
                          {cd.hasConcerns && (
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: '#ef4444',
                              }}
                            />
                          )}
                          {cd.upcoming && (
                            <div
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: '#3b82f6',
                              }}
                            />
                          )}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Legend */}
              <div style={{ display: 'flex', gap: 14, marginTop: 10, flexWrap: 'wrap' }}>
                {[
                  { color: '#ec4899', label: 'Has notes' },
                  { color: '#ef4444', label: 'Concern' },
                  { color: '#3b82f6', label: 'Upcoming' },
                ].map(l => (
                  <div key={l.label} style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                    <div style={{ width: 6, height: 6, borderRadius: '50%', background: l.color }} />
                    <span style={{ fontSize: 10, color: dk.textFaint }}>{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Milestones */}
            {milestones.length > 0 && (
              <div
                style={{
                  padding: '16px 18px',
                  borderRadius: 18,
                  background: fm.glass,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${fm.glassBorder}`,
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 700,
                    color: '#f59e0b',
                    textTransform: 'uppercase',
                    letterSpacing: '0.06em',
                    marginBottom: 10,
                  }}
                >
                  🎉 Upcoming Milestones
                </p>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {milestones.map((m, i) => (
                    <div
                      key={i}
                      style={{
                        padding: '12px 14px',
                        borderRadius: 14,
                        background: `${m.color}08`,
                        border: `1px solid ${m.color}18`,
                        display: 'flex',
                        alignItems: 'center',
                        gap: 12,
                      }}
                    >
                      <span style={{ fontSize: 24 }}>{m.icon}</span>
                      <div style={{ flex: 1 }}>
                        <p style={{ fontSize: 13, fontWeight: 800, color: dk.text }}>
                          {m.label}
                        </p>
                        <p style={{ fontSize: 11, color: dk.textMuted }}>
                          {m.date} · {m.daysAway === 0 ? 'Today!' : `${m.daysAway} days away`}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Weekly Email Preview */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#3b82f6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                📧 Weekly Email Preview
              </p>
              <pre
                style={{
                  fontSize: 11,
                  color: dk.textSoft,
                  lineHeight: 1.6,
                  fontFamily: 'ui-monospace, monospace',
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-word',
                  padding: '12px 14px',
                  borderRadius: 12,
                  background: dk.subtleBg,
                  border: `1px solid ${fm.glassBorder}`,
                  margin: 0,
                }}
              >
                {weeklyEmailPreview}
              </pre>
            </div>

            {/* Quick Poll */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: '#8b5cf6',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 8,
                }}
              >
                📊 Quick Poll
              </p>
              <p style={{ fontSize: 13, fontWeight: 700, color: dk.text, marginBottom: 10 }}>
                {demoPoll.question}
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
                {demoPoll.options.map((opt, i) => (
                  <button
                    key={i}
                    onClick={() => setPollAnswer(i)}
                    style={{
                      padding: '10px 14px',
                      borderRadius: 12,
                      border: pollAnswer === i
                        ? '2px solid #8b5cf640'
                        : `1px solid ${fm.glassBorder}`,
                      background: pollAnswer === i
                        ? (isDark ? 'rgba(139,92,246,0.1)' : 'rgba(139,92,246,0.05)')
                        : dk.subtleBg,
                      color: pollAnswer === i ? '#8b5cf6' : dk.textSoft,
                      fontWeight: pollAnswer === i ? 700 : 500,
                      fontSize: 13,
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'all 0.2s',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 8,
                    }}
                  >
                    {pollAnswer === i && <CheckCircle size={14} />}
                    {opt}
                  </button>
                ))}
              </div>
              {pollAnswer !== null && (
                <p
                  style={{
                    fontSize: 12,
                    color: '#10b981',
                    fontWeight: 700,
                    marginTop: 10,
                    display: 'flex',
                    alignItems: 'center',
                    gap: 4,
                  }}
                >
                  <CheckCircle size={14} /> Thanks for your feedback!
                </p>
              )}
            </div>

            {/* Feedback Form */}
            <div
              style={{
                padding: '16px 18px',
                borderRadius: 18,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: fm.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 10,
                }}
              >
                💬 Send Feedback
              </p>

              {/* Type selector */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10, flexWrap: 'wrap' }}>
                {[
                  { key: 'general', label: 'General', icon: MessageSquare },
                  { key: 'concern', label: 'Concern', icon: Flag },
                  { key: 'compliment', label: 'Compliment', icon: ThumbsUp },
                  { key: 'suggestion', label: 'Suggestion', icon: Sparkles },
                ].map(ft => (
                  <button
                    key={ft.key}
                    onClick={() => setFeedbackType(ft.key)}
                    style={{
                      padding: '6px 12px',
                      borderRadius: 10,
                      border: feedbackType === ft.key
                        ? `2px solid ${fm.primary}40`
                        : `1px solid ${fm.glassBorder}`,
                      background: feedbackType === ft.key
                        ? `${fm.primary}10`
                        : 'transparent',
                      color: feedbackType === ft.key ? fm.primary : dk.textMuted,
                      fontWeight: 700,
                      fontSize: 11,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 4,
                      transition: 'all 0.2s',
                    }}
                  >
                    <ft.icon size={12} />
                    {ft.label}
                  </button>
                ))}
              </div>

              <textarea
                value={feedbackText}
                onChange={(e) => setFeedbackText(e.target.value)}
                placeholder="Write your feedback..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${fm.glassBorder}`,
                  background: dk.subtleBg,
                  color: dk.text,
                  fontSize: 13,
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleSubmitFeedback}
                style={{
                  marginTop: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: feedbackSent ? 'linear-gradient(135deg, #10b981, #059669)' : fm.gradient,
                  color: 'white',
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.3s',
                }}
              >
                {feedbackSent ? (
                  <><CheckCircle size={14} /> Sent!</>
                ) : (
                  <><Send size={14} /> Submit Feedback</>
                )}
              </button>
            </div>
          </div>
        )


      /* ─── JOURNAL ─── */
      case 'journal':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* New Entry form */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: fm.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                📝 New Journal Entry
              </p>

              {/* Mood picker */}
              <div style={{ display: 'flex', gap: 6, marginBottom: 10 }}>
                {['😊', '😐', '😢', '😴', '🥰', '😟'].map(emoji => (
                  <button
                    key={emoji}
                    onClick={() => setNewJournalMood(emoji)}
                    style={{
                      width: 40,
                      height: 40,
                      borderRadius: 12,
                      border: newJournalMood === emoji
                        ? `2px solid ${fm.primary}50`
                        : `1px solid ${fm.glassBorder}`,
                      background: newJournalMood === emoji
                        ? `${fm.primary}10`
                        : 'transparent',
                      fontSize: 20,
                      cursor: 'pointer',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      transition: 'all 0.2s',
                      transform: newJournalMood === emoji ? 'scale(1.1)' : 'scale(1)',
                    }}
                  >
                    {emoji}
                  </button>
                ))}
              </div>

              <textarea
                value={newJournalText}
                onChange={(e) => setNewJournalText(e.target.value)}
                placeholder="How is your loved one doing? Write your thoughts..."
                rows={3}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 14,
                  border: `1px solid ${fm.glassBorder}`,
                  background: dk.subtleBg,
                  color: dk.text,
                  fontSize: 13,
                  resize: 'vertical',
                  outline: 'none',
                  lineHeight: 1.5,
                  fontFamily: 'inherit',
                }}
              />
              <button
                onClick={handleAddJournal}
                disabled={!newJournalText.trim()}
                style={{
                  marginTop: 8,
                  padding: '10px 20px',
                  borderRadius: 12,
                  border: 'none',
                  background: newJournalText.trim() ? fm.gradient : (isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.06)'),
                  color: newJournalText.trim() ? 'white' : dk.textFaint,
                  fontWeight: 700,
                  fontSize: 13,
                  cursor: newJournalText.trim() ? 'pointer' : 'default',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                }}
              >
                <PenTool size={14} /> Save Entry
              </button>
            </div>

            {/* Journal entries list */}
            {journalEntries.length > 0 ? journalEntries.map((entry, i) => (
              <div
                key={entry.id}
                style={{
                  padding: '16px 20px',
                  borderRadius: 20,
                  background: fm.glass,
                  backdropFilter: 'blur(16px)',
                  WebkitBackdropFilter: 'blur(16px)',
                  border: `1px solid ${fm.glassBorder}`,
                  animation: 'slideUp 0.3s ease-out',
                  animationDelay: `${i * 50}ms`,
                  animationFillMode: 'both',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                  <span style={{ fontSize: 22 }}>{entry.mood}</span>
                  <p style={{ fontSize: 12, fontWeight: 700, color: dk.text }}>
                    {formatDate(entry.date)}
                  </p>
                </div>
                <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.6 }}>
                  {entry.text}
                </p>
              </div>
            )) : (
              <EmptyState
                icon={BookOpen}
                text="No journal entries yet"
                sub="Start writing to track your thoughts"
                isDark={isDark}
                fm={fm}
              />
            )}
          </div>
        )


      /* ─── INFO ─── */
      case 'info':
        return (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Notification Preferences */}
            <div
              style={{
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
                overflow: 'hidden',
              }}
            >
              <button
                onClick={() => setShowNotifPanel(!showNotifPanel)}
                style={{
                  width: '100%',
                  padding: '16px 20px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  border: 'none',
                  background: 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                }}
              >
                <Bell size={18} style={{ color: fm.primary }} />
                <p style={{ flex: 1, fontWeight: 800, fontSize: 14, color: dk.text }}>
                  Notification Preferences
                </p>
                <ChevronDown
                  size={16}
                  style={{
                    color: dk.textFaint,
                    transition: 'transform 0.2s',
                    transform: showNotifPanel ? 'rotate(180deg)' : 'rotate(0)',
                  }}
                />
              </button>
              {showNotifPanel && (
                <div style={{ padding: '0 20px 16px', display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {[
                    { key: 'shift_notes', label: 'Shift Notes', desc: 'When workers submit notes' },
                    { key: 'concerns', label: 'Concerns', desc: 'When concerns are flagged' },
                    { key: 'meds_changes', label: 'Medication Changes', desc: 'When meds are updated' },
                    { key: 'goal_updates', label: 'Goal Progress', desc: 'When goals are updated' },
                    { key: 'incidents', label: 'Incidents', desc: 'When incidents are reported' },
                  ].map(n => (
                    <div
                      key={n.key}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '10px 14px',
                        borderRadius: 12,
                        background: dk.subtleBg,
                      }}
                    >
                      <div>
                        <p style={{ fontSize: 13, fontWeight: 700, color: dk.text }}>
                          {n.label}
                        </p>
                        <p style={{ fontSize: 11, color: dk.textFaint }}>
                          {n.desc}
                        </p>
                      </div>
                      <button
                        onClick={() => setNotifPrefs(prev => ({ ...prev, [n.key]: !prev[n.key] }))}
                        style={{
                          width: 44,
                          minWidth: 44,
                          maxWidth: 44,
                          height: 24,
                          minHeight: 24,
                          maxHeight: 24,
                          borderRadius: 12,
                          border: 'none',
                          cursor: 'pointer',
                          position: 'relative',
                          flexShrink: 0,
                          padding: 0,
                          boxSizing: 'border-box',
                          background: notifPrefs[n.key]
                            ? fm.gradient
                            : (isDark ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)'),
                          transition: 'background 0.3s',
                        }}
                      >
                        <div
                          style={{
                            width: 18,
                            height: 18,
                            borderRadius: '50%',
                            background: 'white',
                            position: 'absolute',
                            top: 3,
                            left: notifPrefs[n.key] ? 23 : 3,
                            transition: 'left 0.3s',
                            boxShadow: '0 1px 4px rgba(0,0,0,0.15)',
                          }}
                        />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            {/* Participant Details */}
            <div
              style={{
                padding: '18px 20px',
                borderRadius: 20,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p
                style={{
                  fontSize: 10,
                  fontWeight: 700,
                  color: fm.primary,
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                  marginBottom: 12,
                }}
              >
                👤 Participant Details
              </p>
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
                  gap: 8,
                }}
              >
                {[
                  { label: 'Name', value: participant ? `${participant.first_name} ${participant.last_name}` : 'N/A' },
                  { label: 'NDIS Number', value: participant?.ndis_number || 'N/A' },
                  { label: 'Date of Birth', value: participant?.date_of_birth ? new Date(participant.date_of_birth).toLocaleDateString('en-AU') : 'N/A' },
                  { label: 'Phone', value: participant?.phone || 'N/A' },
                  { label: 'Address', value: participant?.address || 'N/A' },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: '12px 14px',
                      borderRadius: 14,
                      background: dk.subtleBg,
                      border: `1px solid ${fm.glassBorder}`,
                    }}
                  >
                    <p style={{ fontSize: 10, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {item.label}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: dk.text, marginTop: 4, wordBreak: 'break-word' }}>
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Emergency Contact */}
            {participant?.emergency_contact_name && (
              <div
                style={{
                  padding: '16px 20px',
                  borderRadius: 20,
                  background: isDark ? 'rgba(239,68,68,0.06)' : 'rgba(239,68,68,0.03)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 10, fontWeight: 700, color: '#ef4444', textTransform: 'uppercase' }}>
                    Emergency Contact
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: dk.text, marginTop: 2 }}>
                    {participant.emergency_contact_name}
                  </p>
                  {participant.emergency_contact_phone && (
                    <p style={{ fontSize: 12, color: dk.textMuted, marginTop: 2 }}>
                      {participant.emergency_contact_phone}
                    </p>
                  )}
                </div>
                {participant.emergency_contact_phone && (
                  <a
                    href={`tel:${participant.emergency_contact_phone}`}
                    style={{
                      padding: '10px 16px',
                      borderRadius: 12,
                      background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                      color: 'white',
                      fontWeight: 700,
                      fontSize: 12,
                      textDecoration: 'none',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 6,
                    }}
                  >
                    <PhoneCall size={14} /> Call
                  </a>
                )}
              </div>
            )}

            {/* Print Care Report */}
            <button
              onClick={() => window.print()}
              style={{
                padding: '14px 20px',
                borderRadius: 16,
                border: `1px solid ${fm.glassBorder}`,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                color: dk.text,
                fontWeight: 700,
                fontSize: 13,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 8,
              }}
            >
              <Printer size={16} style={{ color: fm.primary }} />
              Print Care Report
            </button>

            {/* Read-only footer + Veleria credit */}
            <div style={{ textAlign: 'center', padding: '16px 0' }}>
              <p style={{ fontSize: 11, color: dk.textFaint }}>
                This portal provides read-only access to care information.
              </p>
              <p style={{ fontSize: 10, color: dk.textFaint, marginTop: 6 }}>
                Powered by <span style={{ fontWeight: 700, color: fm.primary }}>Veleria</span> Care Management
              </p>
            </div>
          </div>
        )


      default:
        return null
    }
  }


  /* ═══════════════════════════════════════════
     CARE COMPARISON CARDS — inline component
     ═══════════════════════════════════════════ */

  const CareComparisonCards = ({ comparison, isDark, fm, dk }) => {
    const items = [
      { label: 'Shifts', current: comparison.shifts.current, prev: comparison.shifts.prev, icon: Activity },
      { label: 'Hours', current: Math.round(comparison.hours.current), prev: Math.round(comparison.hours.prev), icon: Clock },
      { label: 'Notes', current: comparison.notes.current, prev: comparison.notes.prev, icon: FileText },
    ]

    return (
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8 }}>
        {items.map((item, i) => {
          const diff = item.current - item.prev
          const isUp = diff > 0
          const isDown = diff < 0
          return (
            <div
              key={i}
              style={{
                padding: '14px 12px',
                borderRadius: 16,
                background: fm.glass,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
                border: `1px solid ${fm.glassBorder}`,
                textAlign: 'center',
              }}
            >
              <item.icon
                size={16}
                style={{ color: fm.primary, marginBottom: 6 }}
              />
              <p style={{ fontSize: 20, fontWeight: 900, color: dk.text }}>
                {item.current}
              </p>
              <p style={{ fontSize: 10, color: dk.textFaint, fontWeight: 600, marginTop: 2 }}>
                {item.label}
              </p>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 3,
                  marginTop: 6,
                  fontSize: 11,
                  fontWeight: 700,
                  color: isUp ? '#10b981' : isDown ? '#ef4444' : dk.textFaint,
                }}
              >
                {isUp && <TrendingUp size={12} />}
                {isDown && <TrendingDown size={12} />}
                {diff === 0 ? 'Same' : `${isUp ? '+' : ''}${diff} vs last week`}
              </div>
            </div>
          )
        })}
      </div>
    )
  }


  /* ═══════════════════════════════════════════
     MAIN RETURN
     ═══════════════════════════════════════════ */

  return (
    <div
      style={{
        minHeight: '100vh',
        background: fm.pageBg,
        color: dk.text,
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Keyframes */}
      <style>{`
        @keyframes orbFloat {
          0%, 100% { transform: translate(0, 0) scale(1); }
          33% { transform: translate(30px, -20px) scale(1.05); }
          66% { transform: translate(-20px, 15px) scale(0.95); }
        }
        @keyframes barGrow {
          from { width: 0%; }
        }
        @keyframes blink {
          0%, 100% { opacity: 1; }
          50% { opacity: 0.3; }
        }
        @keyframes pulse {
          0% { transform: scale(1); opacity: 0.5; }
          100% { transform: scale(2.5); opacity: 0; }
        }
        @keyframes shimmer {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .no-scrollbar::-webkit-scrollbar { display: none; }
        .no-scrollbar { -ms-overflow-style: none; scrollbar-width: none; }
        .stat-hover { transition: transform 0.2s, box-shadow 0.2s; }
        .stat-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 24px -8px rgba(236,72,153,0.15); }
        .stat-icon { transition: transform 0.3s; }
        .stat-hover:hover .stat-icon { transform: scale(1.08); }
        @media (min-width: 1024px) {
          .stat-grid { grid-template-columns: repeat(6, 1fr) !important; }
        }
      `}</style>

    {isDemo && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, zIndex: 60, height: 32,
          background: 'linear-gradient(90deg, #ec4899, #db2777, #a855f7, #7c3aed)',
          backgroundSize: '300% 100%', animation: 'demoShimmer 8s linear infinite',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          padding: '0 14px', gap: 6,
        }}>
          <style>{`
            @keyframes demoShimmer{0%{background-position:0% 50%}50%{background-position:100% 50%}100%{background-position:0% 50%}}
            @keyframes demoPulse{0%,100%{opacity:1}50%{opacity:.5}}
            @media (max-width: 639px) { .family-demo-landing { display: none !important; } }
            @media (min-width: 640px) { .family-demo-sample { display: none !important; } }
          `}</style>
          <div style={{ width: 5, height: 5, borderRadius: '50%', background: '#fbbf24', animation: 'demoPulse 2s ease-in-out infinite', boxShadow: '0 0 8px rgba(251,191,36,0.5)', flexShrink: 0 }} />
          <span style={{ fontSize: 10, fontWeight: 700, color: 'white', letterSpacing: '0.08em' }}>DEMO MODE</span>
          <span className="family-demo-sample" style={{ fontSize: 10, fontWeight: 500, color: 'rgba(255,255,255,0.7)' }}>— Sample data</span>
          <button onClick={() => navigate('/')} className="family-demo-landing" style={{
            marginLeft: 'auto', padding: '3px 10px', borderRadius: 6,
            border: '1px solid rgba(255,255,255,0.25)', background: 'rgba(255,255,255,0.12)',
            color: 'white', fontSize: 9, fontWeight: 700, cursor: 'pointer',
            display: 'flex', alignItems: 'center', gap: 4,
          }}>
            View Landing
          </button>
        </div>
      )}

      {/* ── TOP NAV ── */}
      <nav
        style={{
          position: 'fixed',
         top: isDemo ? 32 : 0,
          left: 0,
          right: 0,
          zIndex: 50,
          background: fm.navBg,
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: `1px solid ${fm.navBorder}`,
          padding: '0 12px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
        }}
      >
        {/* Hamburger — mobile only */}
        <button
          onClick={() => setFamilyMenuOpen(prev => !prev)}
          className="family-hamburger"
          style={{
            width: 36,
            height: 36,
            borderRadius: 10,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: familyMenuOpen
              ? fm.gradient
              : (isDark ? 'rgba(51,65,85,0.4)' : `${fm.primary}0a`),
            color: familyMenuOpen ? '#fff' : fm.primary,
            border: familyMenuOpen ? 'none' : `1px solid ${isDark ? 'rgba(51,65,85,0.4)' : `${fm.primary}15`}`,
            cursor: 'pointer',
            flexShrink: 0,
          }}
        >
          {familyMenuOpen ? <X size={16} /> : <Menu size={16} />}
        </button>

        {/* Mobile brand — hidden on desktop */}
        <div className="family-hamburger" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <Heart size={16} style={{ color: fm.primary }} />
            <span style={{ fontSize: 15, fontWeight: 900, color: dk.text }}>Family Portal</span>
          </div>
        </div>

{/* Desktop brand — far left */}
        <div className="desktop-nav" style={{ display: 'none', alignItems: 'center', gap: 6, flexShrink: 0, marginRight: 16 }}>
          <Heart size={16} style={{ color: fm.primary }} />
          <span style={{ fontSize: 15, fontWeight: 900, color: dk.text }}>Family Portal</span>
        </div>

        {/* Desktop tabs — centred */}
        <div className="desktop-nav" style={{ display: 'none', flex: 1, alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          {NAV_ITEMS.map(n => (
            <button
              key={n.id}
              onClick={() => switchTab(n.id)}
              style={{
                padding: '8px 12px',
                borderRadius: 10,
                border: 'none',
                cursor: 'pointer',
                fontSize: 12,
                fontWeight: tab === n.id ? 800 : 600,
                background: tab === n.id ? `${fm.primary}12` : 'transparent',
                color: tab === n.id ? fm.primary : dk.textMuted,
                display: 'flex',
                alignItems: 'center',
                gap: 5,
                transition: 'all 0.2s',
                whiteSpace: 'nowrap',
              }}
            >
              <n.icon size={14} />
              {n.label}
            </button>
          ))}
        </div>

        {/* Right — logout */}
        <button
          onClick={handleLogout}
          style={{
            padding: '6px 10px',
            borderRadius: 8,
            border: `1px solid ${fm.glassBorder}`,
            background: 'transparent',
            color: dk.textMuted,
            fontSize: 11,
            fontWeight: 600,
            cursor: 'pointer',
            display: 'flex',
            alignItems: 'center',
            gap: 4,
            flexShrink: 0,
          }}
        >
          <LogOut size={12} /> Exit
        </button>
      </nav>
      {/* Desktop nav show + hamburger hide on desktop */}
 <style>{`
        @media (min-width: 1024px) {
          .desktop-nav { display: flex !important; }
          .family-hamburger { display: none !important; }
          .family-mobile-overlay, .family-mobile-menu { display: none !important; }
        }
      `}</style>

      {/* ── MOBILE MENU OVERLAY ── */}
      {familyMenuOpen && <style>{`body { overflow: hidden !important; }`}</style>}
      <div
    className="family-mobile-overlay"
        style={{
          position: 'fixed', inset: 0, zIndex: 55,
          background: isDark ? 'rgba(0,0,0,0.5)' : 'rgba(0,0,0,0.25)',
          backdropFilter: 'blur(6px)', WebkitBackdropFilter: 'blur(6px)',
          opacity: familyMenuOpen ? 1 : 0,
          pointerEvents: familyMenuOpen ? 'auto' : 'none',
          transition: 'opacity .3s cubic-bezier(.16,1,.3,1)',
        }}
        onClick={() => setFamilyMenuOpen(false)}
      />

      {/* ── MOBILE SLIDE-OUT MENU ── */}
      <div
className="family-mobile-menu no-scrollbar"
        style={{
          position: 'fixed', left: 0, top: isDemo ? 32 : 0,
 bottom: 0, zIndex: 56,
          width: 280, overflowY: 'auto',
          background: isDark ? 'rgba(15,23,42,0.97)' : 'rgba(255,255,255,0.97)',
          borderRight: `1px solid ${fm.glassBorder}`,
          boxShadow: familyMenuOpen
            ? (isDark ? '12px 0 60px -12px rgba(0,0,0,0.5)' : `12px 0 60px -12px ${fm.primary}12`)
            : 'none',
          transform: familyMenuOpen ? 'translateX(0)' : 'translateX(-100%)',
          transition: 'transform .35s cubic-bezier(.16,1,.3,1)',
        }}
      >
        {/* Header */}
        <div style={{ padding: '18px 18px 14px', borderBottom: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : fm.glassBorder}`, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 38, height: 38, borderRadius: 12,
              background: fm.gradient,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>
              <Heart size={18} color="white" />
            </div>
            <div>
              <h2 style={{ fontSize: 15, fontWeight: 800, color: dk.text }}>Family Portal</h2>
              <p style={{ fontSize: 10, fontWeight: 600, color: fm.primary }}>{familyUser?.participant_name}</p>
            </div>
          </div>
          <button onClick={() => setFamilyMenuOpen(false)} style={{
            width: 32, height: 32, borderRadius: 10,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            background: isDark ? 'rgba(51,65,85,0.4)' : 'rgba(0,0,0,0.04)',
            color: dk.textMuted, border: 'none', cursor: 'pointer',
          }}>
            <X size={16} />
          </button>
        </div>

        {/* Nav items */}
        <div style={{ padding: '12px 10px' }}>
          {NAV_ITEMS.map((n, i) => {
            const isActive = tab === n.id
            return (
              <button
                key={n.id}
                onClick={() => { switchTab(n.id); setFamilyMenuOpen(false) }}
                style={{
                  width: '100%',
                  padding: '12px 14px',
                  borderRadius: 12,
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 2,
                  background: isActive
                    ? `linear-gradient(135deg, ${fm.primary}15, ${fm.primary}08)`
                    : 'transparent',
                  color: isActive ? fm.primary : dk.textMuted,
                  textAlign: 'left',
                  transition: 'all 0.2s',
                }}
              >
                <div style={{
                  width: 36, height: 36, borderRadius: 10,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: isActive ? `${fm.primary}18` : (isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.03)'),
                }}>
                  <n.icon size={18} />
                </div>
                <span style={{ fontSize: 14, fontWeight: isActive ? 800 : 600 }}>{n.label}</span>
                {isActive && (
                  <div style={{
                    marginLeft: 'auto', width: 6, height: 6, borderRadius: '50%',
                    background: fm.primary,
                  }} />
                )}
              </button>
            )
          })}
        </div>

        {/* Bottom */}
        <div style={{ padding: '16px 18px', borderTop: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : fm.glassBorder}`, marginTop: 'auto' }}>
          <button
            onClick={handleLogout}
            style={{
              width: '100%', padding: '12px 14px', borderRadius: 12,
              border: `1px solid ${fm.glassBorder}`,
              background: 'transparent',
              color: dk.textMuted, fontSize: 13, fontWeight: 600,
              cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
            }}
          >
            <LogOut size={16} /> Back to Demo
          </button>
          <p style={{ fontSize: 10, color: dk.textFaint, textAlign: 'center', marginTop: 12 }}>
            Powered by <span style={{ fontWeight: 700, color: fm.primary }}>Veleria</span>
          </p>
        </div>
      </div>

      {/* ── BODY ── */}
      <div
        style={{
          display: 'flex',
         paddingTop: isDemo ? 88 : 56,
          height: '100vh',
        }}
      >
        {/* Left Panel — scrollable content */}
        <div
          ref={contentRef}
          className="no-scrollbar"
          style={{
            flex: 1,
            overflowY: 'auto',
            position: 'relative',
            paddingBottom: 140,
          }}
        >
          {/* Background orbs */}
          <div
            style={{
              position: 'fixed',
              top: '10%',
              left: '-5%',
              width: 300,
              height: 300,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(236,72,153,0.06), transparent 70%)',
              animation: 'orbFloat 20s ease-in-out infinite',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />
          <div
            style={{
              position: 'fixed',
              bottom: '15%',
              right: '-5%',
              width: 250,
              height: 250,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(168,85,247,0.05), transparent 70%)',
              animation: 'orbFloat 25s ease-in-out infinite reverse',
              pointerEvents: 'none',
              zIndex: 0,
            }}
          />

          {/* Content wrapper */}
          <div
            style={{
              position: 'relative',
              zIndex: 1,
              padding: '20px 16px',
            }}
          >
            {/* Incident Alerts */}
            {activeIncidents.length > 0 && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 16 }}>
                {activeIncidents.map(inc => (
                  <div
                    key={inc.id}
                    style={{
                      padding: '12px 16px',
                      borderRadius: 14,
                      background: isDark ? 'rgba(239,68,68,0.1)' : 'rgba(239,68,68,0.05)',
                      border: '1px solid rgba(239,68,68,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      gap: 10,
                      animation: 'slideUp 0.3s ease-out',
                    }}
                  >
                    <AlertTriangle size={18} style={{ color: '#ef4444', flexShrink: 0 }} />
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 12, fontWeight: 800, color: '#ef4444' }}>
                        {inc.incident_type || 'Incident'} — {inc.severity || 'Open'}
                      </p>
                      {inc.description && (
                        <p style={{ fontSize: 11, color: dk.textMuted, marginTop: 2 }}>
                          {inc.description.substring(0, 100)}{inc.description.length > 100 ? '...' : ''}
                        </p>
                      )}
                    </div>
                    <button
                      onClick={() => setDismissedIncidents(prev => [...prev, inc.id])}
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: 8,
                        border: 'none',
                        background: 'rgba(239,68,68,0.1)',
                        color: '#ef4444',
                        cursor: 'pointer',
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                      }}
                    >
                      <X size={14} />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {tab === 'updates' && (<>

            {/* ── HERO BANNER ── */}
            <div
              style={{
                ...stg(0),
                borderRadius: 24,
                padding: '28px 24px 24px',
                background: fm.gradient,
                position: 'relative',
                overflow: 'hidden',
                marginBottom: 16,
              }}
            >
              {/* Decorative elements — ALWAYS white */}
              <div
                style={{
                  position: 'absolute',
                  top: -40,
                  right: -40,
                  width: 160,
                  height: 160,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              <div
                style={{
                  position: 'absolute',
                  bottom: -20,
                  left: '20%',
                  width: 100,
                  height: 100,
                  borderRadius: '50%',
                  background: 'rgba(255,255,255,0.1)',
                }}
              />
              {/* Dot grid */}
              <div
                style={{
                  position: 'absolute',
                  top: 16,
                  right: 16,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(4, 6px)',
                  gap: 8,
                  opacity: 0.2,
                }}
              >
                {Array.from({ length: 12 }).map((_, i) => (
                  <div
                    key={i}
                    style={{
                      width: 4,
                      height: 4,
                      borderRadius: '50%',
                      background: 'rgba(255,255,255,0.6)',
                    }}
                  />
                ))}
              </div>
              {/* Floating dots */}
              {[
                { top: '20%', left: '70%', size: 6, delay: '0s' },
                { top: '60%', left: '85%', size: 4, delay: '1s' },
                { top: '40%', left: '10%', size: 5, delay: '0.5s' },
              ].map((dot, i) => (
                <div
                  key={i}
                  style={{
                    position: 'absolute',
                    top: dot.top,
                    left: dot.left,
                    width: dot.size,
                    height: dot.size,
                    borderRadius: '50%',
                    background: 'rgba(255,255,255,0.25)',
                    animation: `orbFloat 8s ease-in-out infinite`,
                    animationDelay: dot.delay,
                  }}
                />
              ))}

              {/* Avatar */}
              <div style={{ position: 'relative', zIndex: 2 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div
                    style={{
                      width: 64,
                      height: 64,
                      borderRadius: 20,
                      background: 'rgba(255,255,255,0.2)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: 24,
                      fontWeight: 900,
                      color: 'white',
                      border: '2px solid rgba(255,255,255,0.3)',
                      flexShrink: 0,
                    }}
                  >
                    {pInitials}
                  </div>
                  <div>
                    {/* Greeting badge */}
                    <div
                      style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: 4,
                        padding: '3px 10px',
                        borderRadius: 999,
                        background: 'rgba(255,255,255,0.15)',
                        fontSize: 11,
                        fontWeight: 700,
                        color: 'rgba(255,255,255,0.9)',
                        marginBottom: 6,
                      }}
                    >
                      {getTimeEmoji()} {getGreeting()}
                    </div>

                    {/* Active shift badge */}
                    {activeShift && (
                      <div
                        style={{
                          display: 'inline-flex',
                          alignItems: 'center',
                          gap: 4,
                          padding: '3px 10px',
                          borderRadius: 999,
                          background: 'rgba(16,185,129,0.2)',
                          fontSize: 10,
                          fontWeight: 800,
                          color: '#a7f3d0',
                          marginLeft: 6,
                          marginBottom: 6,
                        }}
                      >
                        <div
                          style={{
                            width: 6,
                            height: 6,
                            borderRadius: '50%',
                            background: '#34d399',
                            animation: 'blink 1.5s infinite',
                          }}
                        />
                        Support Active
                      </div>
                    )}

                    <p style={{ fontSize: 13, color: 'rgba(255,255,255,0.8)', fontWeight: 600 }}>
                      {familyUser.name}
                    </p>
                    <p style={{ fontSize: 18, fontWeight: 900, color: 'white', marginTop: 2 }}>
                      Caring for {familyUser.participant_name}
                    </p>
                  </div>
                </div>

                {/* Live clock + next shift */}
                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 12,
                    marginTop: 14,
                    fontSize: 12,
                    color: 'rgba(255,255,255,0.7)',
                    fontWeight: 600,
                    flexWrap: 'wrap',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <Clock size={13} /> <LiveClock />
                  </span>
                  {nextShift && (
                    <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <Calendar size={13} /> Next: {formatDate(nextShift.shift_date)}
                    </span>
                  )}
                </div>
              </div>
            </div>

            {/* Emergency Quick-Dial */}
            {participant?.emergency_contact_phone && (
              <div
                style={{
                  ...stg(1),
                  padding: '14px 18px',
                  borderRadius: 18,
                  background: isDark ? 'rgba(239,68,68,0.08)' : 'rgba(239,68,68,0.04)',
                  border: '1px solid rgba(239,68,68,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 12,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 40,
                    height: 40,
                    borderRadius: 12,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    flexShrink: 0,
                  }}
                >
                  <Phone size={18} />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 11, fontWeight: 800, color: '#ef4444' }}>
                    Emergency Quick-Dial
                  </p>
                  <p style={{ fontSize: 12, color: dk.textMuted }}>
                    {participant.emergency_contact_name || 'Emergency Contact'}
                  </p>
                </div>
                <a
                  href={`tel:${participant.emergency_contact_phone}`}
                  style={{
                    padding: '8px 16px',
                    borderRadius: 10,
                    background: 'linear-gradient(135deg, #ef4444, #dc2626)',
                    color: 'white',
                    fontWeight: 700,
                    fontSize: 12,
                    textDecoration: 'none',
                    display: 'flex',
                    alignItems: 'center',
                    gap: 5,
                  }}
                >
                  <PhoneCall size={14} /> Call
                </a>
              </div>
            )}

            {/* Stats + Care Ring */}
            <div
              style={{
                ...stg(2),
                display: 'flex',
                gap: 16,
                alignItems: 'flex-start',
                marginBottom: 16,
                flexWrap: 'wrap',
              }}
            >
              <CareRing score={careScore} size={100} isDark={isDark} />
              <div
                className="stat-grid"
                style={{
                  flex: 1,
                  display: 'grid',
                  gridTemplateColumns: 'repeat(3, 1fr)',
                  gap: 8,
                  minWidth: 0,
                }}
              >
                {[
                  { label: 'Shifts', value: totalShifts, icon: Activity, color: '#ec4899' },
                  { label: 'Hours', value: Math.round(totalHours), icon: Clock, color: '#a855f7' },
                  { label: 'Goals', value: `${avgGoalProgress}%`, icon: Target, color: '#f59e0b' },
                  { label: 'Notes', value: shiftsWithNotes, icon: FileText, color: '#3b82f6' },
                  { label: 'Team', value: careTeam.length, icon: Users, color: '#10b981' },
                  { label: 'Meds', value: medications.length, icon: Pill, color: '#8b5cf6' },
                ].map((s, i) => (
                  <div
                    key={i}
                    className="stat-hover"
                    style={{
                      padding: '12px 10px',
                      borderRadius: 16,
                      background: fm.glass,
                      backdropFilter: 'blur(16px)',
                      WebkitBackdropFilter: 'blur(16px)',
                      border: `1px solid ${fm.glassBorder}`,
                      textAlign: 'center',
                    }}
                  >
                    <s.icon
                      size={16}
                      className="stat-icon"
                      style={{ color: s.color, marginBottom: 4 }}
                    />
                    <p style={{ fontSize: 18, fontWeight: 900, color: dk.text }}>
                      {typeof s.value === 'number' ? <AnimNum value={s.value} /> : s.value}
                    </p>
                    <p style={{ fontSize: 9, fontWeight: 700, color: dk.textFaint, textTransform: 'uppercase', letterSpacing: '0.04em' }}>
                      {s.label}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            {/* Weather Widget */}
            <div style={{ ...stg(3), marginBottom: 12 }}>
              <WeatherWidget isDark={isDark} fm={fm} dk={dk} />
            </div>

            {/* Weekly Heatmap */}
            <div style={{ ...stg(4), marginBottom: 12 }}>
              <WeeklyHeatmap recentShifts={recentShifts} isDark={isDark} fm={fm} dk={dk} />
            </div>

            {/* Mood Trend Chart */}
            <div style={{ ...stg(5), marginBottom: 12 }}>
              <MoodTrendChart recentShifts={recentShifts} isDark={isDark} fm={fm} dk={dk} />
            </div>

            {/* Care Comparison Cards */}
            <div style={{ ...stg(6), marginBottom: 12 }}>
              <CareComparisonCards comparison={careComparison} isDark={isDark} fm={fm} dk={dk} />
            </div>

            {/* Satisfaction Meter */}
            <div style={{ ...stg(7), marginBottom: 16 }}>
              <SatisfactionMeter value={satisfaction} onChange={setSatisfaction} isDark={isDark} fm={fm} dk={dk} />
            </div>

            {/* Next Shift Banner */}
            {(activeShift || nextShift) && (
              <div
                style={{
                  ...stg(8),
                  padding: '16px 20px',
                  borderRadius: 18,
                  background: activeShift
                    ? (isDark ? 'rgba(16,185,129,0.08)' : 'rgba(16,185,129,0.04)')
                    : `${fm.primary}08`,
                  border: `1px solid ${activeShift ? 'rgba(16,185,129,0.2)' : `${fm.primary}15`}`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 14,
                  marginBottom: 16,
                }}
              >
                <div
                  style={{
                    width: 44,
                    height: 44,
                    borderRadius: 13,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    background: activeShift
                      ? 'linear-gradient(135deg, #10b981, #059669)'
                      : fm.gradient,
                  }}
                >
                  {activeShift ? <Zap size={18} /> : <Calendar size={18} />}
                </div>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: activeShift ? '#059669' : fm.primary, textTransform: 'uppercase' }}>
                    {activeShift ? '🟢 Active Shift' : '📅 Next Shift'}
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 800, color: dk.text, marginTop: 2 }}>
                    {activeShift
                      ? `${activeShift.staff?.first_name || 'Worker'} — now until ${formatTime(activeShift.end_time)}`
                      : `${formatDate(nextShift.shift_date)} · ${formatTime(nextShift.start_time)} – ${formatTime(nextShift.end_time)}`
                    }
                  </p>
                </div>
              </div>
            )}

            {/* Latest Mood */}
            {latestMood && (
              <div
                style={{
                  ...stg(9),
                  padding: '14px 18px',
                  borderRadius: 18,
                  background: isDark ? 'rgba(236,72,153,0.06)' : 'rgba(236,72,153,0.03)',
                  border: `1px solid ${fm.primary}15`,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 10,
                  marginBottom: 16,
                }}
              >
                <span style={{ fontSize: 24 }}>😊</span>
                <div>
                  <p style={{ fontSize: 10, fontWeight: 700, color: fm.primary, textTransform: 'uppercase' }}>
                    Latest Mood
                  </p>
                  <p style={{ fontSize: 14, fontWeight: 700, color: dk.text }}>
                    {latestMood}
                  </p>
                </div>
              </div>
            )}
            </>)}

            {/* Tab Content */}
            <div
              style={{
                opacity: tabFade ? 1 : 0,
                transition: 'opacity 0.1s ease-out',
              }}
            >
              {renderContent()}
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — AI Sidebar (desktop only) ── */}
        <div
          style={{
            display: 'none',
            width: 360,
            flexShrink: 0,
            borderLeft: `1px solid ${fm.navBorder}`,
            background: fm.navBg,
            backdropFilter: 'blur(20px)',
            WebkitBackdropFilter: 'blur(20px)',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
          className="ai-sidebar"
        >
          <style>{`
            @media (min-width: 1024px) {
              .ai-sidebar { display: flex !important; }
            }
          `}</style>

          {/* Header */}
          <div
            style={{
              padding: '16px 20px',
              borderBottom: `1px solid ${fm.navBorder}`,
              display: 'flex',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <img
              src="/nurse.png"
              alt="Care Assistant"
              style={{
                width: 40,
                height: 40,
                borderRadius: 12,
                objectFit: 'cover',
                background: fm.gradientSoft,
              }}
              onError={(e) => {
                e.target.style.display = 'none'
              }}
            />
            <div>
              <p style={{ fontSize: 14, fontWeight: 800, color: dk.text }}>
                Care Assistant
              </p>
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 800,
                  padding: '2px 8px',
                  borderRadius: 999,
                  background: 'rgba(168,85,247,0.1)',
                  color: '#a855f7',
                  textTransform: 'uppercase',
                  letterSpacing: '0.06em',
                }}
              >
                COMING SOON
              </span>
            </div>
          </div>

          {/* Chat body */}
          <div
            className="no-scrollbar"
            style={{
              flex: 1,
              overflowY: 'auto',
              padding: '16px',
              display: 'flex',
              flexDirection: 'column',
              gap: 12,
            }}
          >
            {/* Initial greeting */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: '4px 16px 16px 16px',
                background: fm.glass,
                border: `1px solid ${fm.glassBorder}`,
                backdropFilter: 'blur(16px)',
                WebkitBackdropFilter: 'blur(16px)',
              }}
            >
              <p style={{ fontSize: 13, color: dk.textSoft, lineHeight: 1.6 }}>
                Hi {familyUser.name?.split(' ')[0]}! 💜 I'm your AI care assistant. Ask me about {familyUser.participant_name?.split(' ')[0]}'s care, goals, medications, or schedule.
              </p>
            </div>

            {/* Quick Summary card */}
            <div
              style={{
                padding: '14px 16px',
                borderRadius: 16,
                background: fm.gradientSoft,
                border: `1px solid ${fm.glassBorder}`,
              }}
            >
              <p style={{ fontSize: 10, fontWeight: 700, color: fm.primary, textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 8 }}>
                Quick Summary
              </p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4, fontSize: 12, color: dk.textSoft }}>
                <span>📊 {totalShifts} shifts · {Math.round(totalHours)}h</span>
                <span>🎯 {goals.length} goals at {avgGoalProgress}%</span>
                <span>💊 {medications.length} active meds</span>
                <span>👥 {careTeam.length} team members</span>
                {nextShift && <span>📅 Next: {formatDate(nextShift.shift_date)}</span>}
                {activeShift && (
                  <span style={{ color: '#10b981', fontWeight: 700 }}>
                    🟢 Support active now
                  </span>
                )}
              </div>
            </div>

            {/* Dynamic chat messages */}
            {chatMessages.map((msg, i) => (
              <div
                key={i}
                style={{
                  padding: '12px 16px',
                  borderRadius: msg.role === 'user'
                    ? '16px 4px 16px 16px'
                    : '4px 16px 16px 16px',
                  background: msg.role === 'user'
                    ? fm.gradient
                    : fm.glass,
                  color: msg.role === 'user' ? 'white' : dk.textSoft,
                  border: msg.role === 'user'
                    ? 'none'
                    : `1px solid ${fm.glassBorder}`,
                  backdropFilter: msg.role === 'user' ? 'none' : 'blur(16px)',
                  WebkitBackdropFilter: msg.role === 'user' ? 'none' : 'blur(16px)',
                  alignSelf: msg.role === 'user' ? 'flex-end' : 'flex-start',
                  maxWidth: '85%',
                  animation: 'slideUp 0.3s ease-out',
                }}
              >
                <p style={{ fontSize: 13, lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                  {msg.text}
                </p>
              </div>
            ))}

            {/* Loading dots */}
            {chatLoading && (
              <div
                style={{
                  display: 'flex',
                  gap: 5,
                  padding: '12px 16px',
                  borderRadius: '4px 16px 16px 16px',
                  background: fm.glass,
                  border: `1px solid ${fm.glassBorder}`,
                  alignSelf: 'flex-start',
                }}
              >
                {[0, 1, 2].map(i => (
                  <div
                    key={i}
                    style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: '#a855f7',
                      animation: `orbFloat 1s ease-in-out infinite`,
                      animationDelay: `${i * 0.15}s`,
                    }}
                  />
                ))}
              </div>
            )}

            <div ref={chatEndRef} />
          </div>

          {/* Suggestion buttons */}
          <div
            style={{
              padding: '12px 16px',
              borderTop: `1px solid ${fm.navBorder}`,
              display: 'flex',
              flexDirection: 'column',
              gap: 6,
            }}
          >
            <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
              {[
                'How is ' + (familyUser.participant_name?.split(' ')[0] || 'they') + '?',
                'Goal progress',
                'Next shift',
                'Medications',
                'Care team',
                'Any concerns?',
              ].map((q, i) => (
                <button
                  key={i}
                  onClick={() => handleSendChat(q)}
                  style={{
                    padding: '6px 12px',
                    borderRadius: 10,
                    border: `1px solid ${fm.glassBorder}`,
                    background: dk.subtleBg,
                    color: dk.textMuted,
                    fontSize: 11,
                    fontWeight: 600,
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                  }}
                >
                  {q}
                </button>
        ))}
            </div>
            <p style={{ fontSize: 10, color: dk.textFaint, textAlign: 'center', marginTop: 4 }}>
              Free-text chat coming soon
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}