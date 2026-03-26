import { useState, useEffect } from 'react'
import {
  Bot, Sparkles, Zap, Shield, FileText, Users, Brain,
  MessageSquare, BarChart3, Clock, Bell, ArrowRight,
  CheckCircle, Cpu, Lock, Star
} from 'lucide-react'
import { useBrandColors } from '../hooks/useBrandColors'
import { useTheme } from '../context/ThemeContext'

/* ─── Shared Components ─── */
function Glass({ children, className = '', dark = false, glow, hover = false, style = {}, ...p }) {
  return (
    <div
      className={`rounded-2xl border ${hover ? 'transition-all duration-300 hover:-translate-y-1' : ''} ${className}`}
      style={{
        background: dark ? 'rgba(30,41,59,0.6)' : 'rgba(255,255,255,0.55)',
        backdropFilter: 'blur(20px)', WebkitBackdropFilter: 'blur(20px)',
        borderColor: dark ? 'rgba(51,65,85,0.4)' : 'rgba(255,255,255,0.7)',
        boxShadow: glow ? `0 8px 32px -8px ${glow}` : '0 4px 16px -4px rgba(0,0,0,0.06)',
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
    <div className="absolute rounded-full pointer-events-none" style={{
      width: size, height: size,
      background: `radial-gradient(circle, ${color} 0%, transparent 70%)`,
      top, left, right, bottom, opacity: 0.12,
      animation: `orbFloat ${6 + delay}s ease-in-out infinite`, animationDelay: `${delay}s`,
    }} />
  )
}

/* ─── Config ─── */
const FEATURES = [
  {
    icon: Shield, label: 'Compliance Checks',
    desc: 'Instantly check staff qualifications, expiring documents, and training gaps across your entire team',
    color: 'from-red-500 to-rose-500', glow: 'rgba(239,68,68,0.15)',
  },
  {
    icon: FileText, label: 'Incident Drafting',
    desc: 'AI-assisted incident report writing with NDIS Practice Standards guidelines built right in',
    color: 'from-orange-500 to-amber-500', glow: 'rgba(245,158,11,0.15)',
  },
  {
    icon: Users, label: 'Staff Insights',
    desc: 'Get instant summaries of staff hours, availability patterns, performance trends, and leave balances',
    color: 'from-teal-500 to-cyan-500', glow: 'rgba(6,182,212,0.15)',
  },
  {
    icon: Zap, label: 'NDIS Guidance',
    desc: 'Instant answers on Practice Standards, pricing arrangements, compliance requirements, and audit prep',
    color: 'from-violet-500 to-purple-500', glow: 'rgba(139,92,246,0.15)',
  },
  {
    icon: BarChart3, label: 'Smart Reporting',
    desc: 'Generate audit-ready reports, billing summaries, and participant progress updates with a single prompt',
    color: 'from-blue-500 to-indigo-500', glow: 'rgba(59,130,246,0.15)',
  },
  {
    icon: MessageSquare, label: 'Natural Language',
    desc: 'Just ask questions in plain English — no training needed. "Who has expired first aid?" Just works.',
    color: 'from-pink-500 to-rose-500', glow: 'rgba(236,72,153,0.15)',
  },
]

const CAPABILITIES = [
  { icon: Brain, text: 'Understands your NDIS data' },
  { icon: Lock, text: 'Secure & private — your data never leaves' },
  { icon: Cpu, text: 'Powered by advanced AI models' },
  { icon: Clock, text: 'Answers in seconds, not hours' },
  { icon: CheckCircle, text: 'Built for NDIS compliance' },
  { icon: Star, text: 'Included free with your plan' },
]

const CHAT_MESSAGES = [
  { role: 'user', text: 'Which staff have expired first aid certificates?' },
  { role: 'ai', text: 'I found 3 staff members with expired First Aid certificates: Sarah Chen (expired 12 Mar), James Wilson (expired 28 Feb), and Priya Patel (expired 15 Jan). Would you like me to send them renewal reminders?' },
  { role: 'user', text: 'Yes, send reminders to all three' },
  { role: 'ai', text: 'Done! I\'ve sent renewal reminders via email to Sarah, James, and Priya. I\'ve also flagged their profiles and added a 7-day follow-up task to your dashboard.' },
]

export default function AIAssistant() {
  const c = useBrandColors()
  const { isDark } = useTheme()
  const [loaded, setLoaded] = useState(false)
  const [visibleMessages, setVisibleMessages] = useState(0)
  const [typingIdx, setTypingIdx] = useState(-1)

  useEffect(() => {
    requestAnimationFrame(() => setLoaded(true))
  }, [])

  // Animate chat messages one by one
  useEffect(() => {
    if (visibleMessages < CHAT_MESSAGES.length) {
      const delay = CHAT_MESSAGES[visibleMessages].role === 'ai' ? 1200 : 600
      const showTyping = setTimeout(() => {
        if (CHAT_MESSAGES[visibleMessages].role === 'ai') setTypingIdx(visibleMessages)
      }, 300)
      const timer = setTimeout(() => {
        setTypingIdx(-1)
        setVisibleMessages(prev => prev + 1)
      }, delay)
      return () => { clearTimeout(timer); clearTimeout(showTyping) }
    }
  }, [visibleMessages, loaded])

  // Restart animation loop
  useEffect(() => {
    if (visibleMessages >= CHAT_MESSAGES.length) {
      const reset = setTimeout(() => { setVisibleMessages(0) }, 4000)
      return () => clearTimeout(reset)
    }
  }, [visibleMessages])

  const dk = {
    text: isDark ? '#e2e8f0' : '#1f2937',
    textSoft: isDark ? '#cbd5e1' : '#374151',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    subtleBg: isDark ? 'rgba(255,255,255,0.04)' : 'rgba(0,0,0,0.02)',
    subtleBg2: isDark ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.04)',
  }

  const stg = (i) => ({
    transitionDelay: `${i * 60}ms`,
    opacity: loaded ? 1 : 0,
    transform: loaded ? 'translateY(0)' : 'translateY(20px)',
    transition: 'all .7s cubic-bezier(.16,1,.3,1)',
  })

  return (
    <div className="space-y-6 relative">
      <style>{`
        @keyframes orbFloat { 0%,100% { transform:translateY(0) scale(1) } 50% { transform:translateY(-18px) scale(1.04) } }
        @keyframes pulseGlow { 0%,100% { box-shadow: 0 0 30px rgba(124,58,237,0.15), 0 0 60px transparent } 50% { box-shadow: 0 0 50px rgba(124,58,237,0.3), 0 0 100px rgba(124,58,237,0.08) } }
        @keyframes gradientShift { 0% { background-position: 0% 50% } 50% { background-position: 100% 50% } 100% { background-position: 0% 50% } }
        @keyframes typewriter { from { width: 0 } to { width: 100% } }
        @keyframes blink { 0%,100% { opacity: 1 } 50% { opacity: 0 } }
        .typing-dots span { display:inline-block; width:6px; height:6px; border-radius:50%; background:currentColor; opacity:0.4; animation: blink 1.4s infinite both }
        .typing-dots span:nth-child(2) { animation-delay: 0.2s }
        .typing-dots span:nth-child(3) { animation-delay: 0.4s }
      `}</style>

      <Orb color={c.primary} size="400px" top="-120px" right="-100px" delay={0} />
      <Orb color="#3b82f6" size="300px" bottom="100px" left="-100px" delay={2} />
      <Orb color="#ec4899" size="250px" top="350px" right="5%" delay={3} />
      <Orb color="#10b981" size="200px" bottom="300px" right="-60px" delay={5} />

      {/* ═══════ HERO BANNER ═══════ */}
      <div style={stg(0)}>
        <div className="p-8 md:p-12 rounded-3xl relative overflow-hidden text-center" style={{
          background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover}, #3b82f6, #8b5cf6)`,
          backgroundSize: '300% 300%',
          animation: 'gradientShift 8s ease-in-out infinite',
        }}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/10 rounded-full -translate-y-1/3 translate-x-1/4" />
          <div className="absolute bottom-0 left-0 w-56 h-56 bg-white/5 rounded-full translate-y-1/3 -translate-x-1/4" />
          <div className="absolute top-12 right-24 w-4 h-4 rounded-full bg-white/20" style={{ animation: 'orbFloat 4s ease-in-out infinite' }} />
          <div className="absolute bottom-12 left-20 w-3 h-3 rounded-full bg-white/15" style={{ animation: 'orbFloat 5s ease-in-out infinite 1s' }} />
          <div className="absolute top-1/2 right-1/4 w-2 h-2 rounded-full bg-white/10" style={{ animation: 'orbFloat 6s ease-in-out infinite 2s' }} />

          <div className="relative z-10">
            <div
              className="w-24 h-24 md:w-28 md:h-28 rounded-3xl flex items-center justify-center shadow-2xl mx-auto mb-6"
              style={{ background: 'rgba(255,255,255,0.15)', backdropFilter: 'blur(12px)', animation: 'pulseGlow 3s ease-in-out infinite' }}
            >
              <Bot size={48} className="text-white" />
            </div>

            <div className="flex items-center justify-center gap-2 mb-4">
              <span className="px-4 py-1.5 rounded-full text-xs font-bold text-white bg-white/15 backdrop-blur-sm flex items-center gap-1.5">
                <Sparkles size={13} /> COMING SOON
              </span>
            </div>

            <h1 className="text-3xl md:text-4xl font-black text-white tracking-tight mb-3">
              AI Assistant
            </h1>
            <p className="text-white/60 text-sm md:text-base max-w-lg mx-auto leading-relaxed">
              Your intelligent NDIS compliance and operations assistant. Ask anything about your organisation — powered by advanced AI with full access to your data.
            </p>

            {/* Floating badges */}
            <div className="flex flex-wrap justify-center gap-2 mt-6">
              {['Ask Questions', 'Generate Reports', 'Check Compliance', 'Draft Documents'].map((t, i) => (
                <div
                  key={t}
                  className="px-3.5 py-2 rounded-xl text-xs font-bold text-white backdrop-blur-sm transition-all hover:scale-105"
                  style={{
                    background: 'rgba(255,255,255,0.1)',
                    animation: `orbFloat ${5 + i * 0.5}s ease-in-out infinite`,
                    animationDelay: `${i * 0.3}s`,
                  }}
                >
                  {t}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* ═══════ LIVE CHAT PREVIEW ═══════ */}
      <div style={stg(1)}>
        <Glass dark={isDark} className="p-5 md:p-6" glow={`${c.primary}12`}>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>
              <MessageSquare size={14} className="text-white" />
            </div>
            <div>
              <p className="text-xs font-bold" style={{ color: dk.text }}>Live Preview</p>
              <p className="text-[10px]" style={{ color: dk.textFaint }}>See how it will work</p>
            </div>
          </div>

          <div className="space-y-3 min-h-[200px]">
            {CHAT_MESSAGES.slice(0, visibleMessages).map((msg, i) => (
              <div
                key={i}
                className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                style={{ animation: 'countUp .4s cubic-bezier(.16,1,.3,1) forwards' }}
              >
                {msg.role === 'ai' && (
                  <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>
                    <Bot size={13} className="text-white" />
                  </div>
                )}
                <div
                  className="max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed"
                  style={msg.role === 'user'
                    ? { background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, color: 'white', borderBottomRightRadius: '6px' }
                    : { background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.04)', color: dk.text, borderBottomLeftRadius: '6px' }
                  }
                >
                  {msg.text}
                </div>
              </div>
            ))}

            {/* Typing indicator */}
            {typingIdx >= 0 && (
              <div className="flex justify-start">
                <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 mr-2 mt-0.5" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>
                  <Bot size={13} className="text-white" />
                </div>
                <div className="px-4 py-3 rounded-2xl" style={{ background: isDark ? 'rgba(51,65,85,0.5)' : 'rgba(0,0,0,0.04)', borderBottomLeftRadius: '6px' }}>
                  <div className="typing-dots flex gap-1" style={{ color: c.primary }}>
                    <span /><span /><span />
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Fake input */}
          <div className="mt-4 flex items-center gap-2 p-2.5 rounded-xl" style={{ background: dk.subtleBg2, border: `1px solid ${isDark ? 'rgba(51,65,85,0.3)' : 'rgba(0,0,0,0.06)'}` }}>
            <div className="flex-1 text-sm" style={{ color: dk.textFaint }}>Ask me anything about your organisation...</div>
            <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})`, opacity: 0.5 }}>
              <ArrowRight size={14} className="text-white" />
            </div>
          </div>
        </Glass>
      </div>

      {/* ═══════ FEATURES GRID ═══════ */}
      <div>
        <p className="text-xs font-bold uppercase tracking-wider mb-4 text-center" style={{ ...stg(2), color: dk.textFaint }}>
          What it will do
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {FEATURES.map((f, i) => (
            <Glass
              key={i}
              dark={isDark}
              hover
              glow={f.glow}
              className="p-5 group"
              style={stg(i + 3)}
            >
              <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg mb-4 group-hover:scale-110 transition-transform`}>
                <f.icon size={22} className="text-white" />
              </div>
              <p className="font-black text-sm mb-1.5" style={{ color: dk.text }}>{f.label}</p>
              <p className="text-xs leading-relaxed" style={{ color: dk.textMuted }}>{f.desc}</p>
            </Glass>
          ))}
        </div>
      </div>

      {/* ═══════ CAPABILITIES ROW ═══════ */}
      <div style={stg(9)}>
        <Glass dark={isDark} className="p-5" glow={`${c.primary}08`}>
          <p className="text-xs font-bold uppercase tracking-wider mb-4 text-center" style={{ color: dk.textFaint }}>Built for you</p>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {CAPABILITIES.map((cap, i) => (
              <div
                key={i}
                className="flex items-center gap-3 p-3 rounded-xl transition-all hover:-translate-y-0.5"
                style={{ background: dk.subtleBg }}
              >
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${c.primary}12` }}>
                  <cap.icon size={16} style={{ color: c.primary }} />
                </div>
                <p className="text-xs font-semibold" style={{ color: dk.textSoft }}>{cap.text}</p>
              </div>
            ))}
          </div>
        </Glass>
      </div>

      {/* ═══════ DEVELOPMENT STATUS ═══════ */}
      <div style={stg(10)}>
        <Glass dark={isDark} className="p-6 md:p-8" glow={`${c.primary}10`}>
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Progress */}
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-3">
                <Sparkles size={16} style={{ color: c.primary }} />
                <p className="text-sm font-black" style={{ color: dk.text }}>Development Progress</p>
              </div>

              {/* Progress bar */}
              <div className="h-3 rounded-full overflow-hidden mb-2" style={{ background: dk.subtleBg2 }}>
                <div
                  className="h-full rounded-full transition-all duration-1000"
                  style={{
                    width: loaded ? '65%' : '0%',
                    background: `linear-gradient(90deg, ${c.primary}, ${c.adminHover}, #3b82f6)`,
                    backgroundSize: '200% 100%',
                    animation: 'gradientShift 3s ease infinite',
                  }}
                />
              </div>
              <p className="text-[10px] font-semibold" style={{ color: dk.textFaint }}>65% complete — Core AI engine operational</p>

              {/* Milestones */}
              <div className="flex flex-wrap gap-2 mt-4">
                {[
                  { text: 'AI Engine', done: true },
                  { text: 'Data Integration', done: true },
                  { text: 'Chat Interface', done: false },
                  { text: 'NDIS Knowledge Base', done: false },
                  { text: 'Beta Testing', done: false },
                ].map((m, i) => (
                  <div
                    key={i}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[10px] font-bold"
                    style={{
                      background: m.done ? (isDark ? 'rgba(16,185,129,0.12)' : '#ecfdf5') : dk.subtleBg2,
                      color: m.done ? '#10b981' : dk.textFaint,
                      border: `1px solid ${m.done ? (isDark ? 'rgba(16,185,129,0.2)' : '#a7f3d0') : 'transparent'}`,
                    }}
                  >
                    {m.done ? <CheckCircle size={11} /> : <Clock size={11} />}
                    {m.text}
                  </div>
                ))}
              </div>
            </div>

            {/* CTA */}
            <div className="text-center md:text-right shrink-0">
              <div
                className="inline-block p-6 rounded-2xl"
                style={{
                  background: isDark ? `${c.primary}10` : `linear-gradient(135deg, ${c.primary}06, ${c.adminHover}06)`,
                  border: `1px solid ${isDark ? `${c.primary}20` : `${c.primary}15`}`,
                }}
              >
                <Bell size={24} style={{ color: c.primary }} className="mx-auto mb-2" />
                <p className="text-sm font-bold" style={{ color: dk.text }}>No extra charge</p>
                <p className="text-[10px] mt-1" style={{ color: dk.textMuted }}>
                  You'll be notified<br />when it's ready
                </p>
              </div>
            </div>
          </div>
        </Glass>
      </div>
    </div>
  )
}