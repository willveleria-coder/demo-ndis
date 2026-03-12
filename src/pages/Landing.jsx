import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Shield, Users, Clock, LogIn, UserPlus, ArrowRight, Activity, FileText, BarChart3, Bell, Zap, CheckCircle, ChevronRight, Globe } from 'lucide-react'
import BrandLogo from '../components/BrandLogo'
import { brand } from '../config/branding'

function LiveClock() {
  const [time, setTime] = useState(new Date())
  useEffect(() => { const t = setInterval(() => setTime(new Date()), 1000); return () => clearInterval(t) }, [])
  const opts = { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' }
  return (
    <div className="text-right">
      <p className="text-sm font-semibold text-gray-800 tabular-nums">
        {time.toLocaleTimeString('en-AU', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true })}
      </p>
      <p className="text-[11px] text-gray-400">{time.toLocaleDateString('en-AU', opts)}</p>
    </div>
  )
}

function getGreeting() {
  const h = new Date().getHours()
  if (h < 12) return 'Good morning'
  if (h < 17) return 'Good afternoon'
  return 'Good evening'
}

export default function Landing() {
  const [loaded, setLoaded] = useState(false)
  useEffect(() => { requestAnimationFrame(() => setLoaded(true)) }, [])
  const c = brand.colors

  const features = [
    { icon: Users, title: 'Participant Management', desc: 'NDIS plans, goals, notes & documents in one place' },
    { icon: Clock, title: 'Smart Rostering', desc: 'Drag-and-drop shift scheduling with conflict detection' },
    { icon: FileText, title: 'Shift Notes & Forms', desc: 'Digital progress notes, custom forms & submissions' },
    { icon: Activity, title: 'Incident Tracking', desc: 'Log, escalate & report NDIS-reportable incidents' },
    { icon: BarChart3, title: 'Compliance Dashboard', desc: 'Document expiry alerts, worker screening & audits' },
    { icon: Bell, title: 'Real-time Notifications', desc: 'Alerts for incidents, feedback, expiring docs & more' },
    { icon: Zap, title: 'AI Assistant', desc: 'Smart insights, report generation & natural language queries' },
    { icon: Globe, title: 'Multi-Tenant', desc: 'Isolated data per organisation with full RLS security' },
  ]

  const stagger = (i) => ({ transitionDelay: `${100 + i * 60}ms` })

  return (
    <div className="min-h-screen bg-white flex flex-col">
      <style>{`
        .fade-up { opacity: 0; transform: translateY(20px); transition: opacity 0.5s cubic-bezier(0.16,1,0.3,1), transform 0.5s cubic-bezier(0.16,1,0.3,1); }
        .fade-up.show { opacity: 1; transform: translateY(0); }
        .grid-bg { background-image: radial-gradient(circle, rgba(0,0,0,0.03) 1px, transparent 1px); background-size: 24px 24px; }
      `}</style>

      {/* Top bar */}
      <div className="border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-10 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1.5">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              <span className="text-[11px] text-gray-400 font-medium">System Online</span>
            </div>
            <div className="w-px h-4 bg-gray-200" />
            <span className="text-[11px] text-gray-400 font-medium">NDIS Registered Provider</span>
          </div>
          <div className="hidden sm:flex items-center gap-4">
            <span className="text-[11px] text-gray-400">Melbourne, VIC</span>
          </div>
        </div>
      </div>

      {/* Header */}
      <header className={`border-b border-gray-100 bg-white sticky top-0 z-50 fade-up ${loaded ? 'show' : ''}`}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BrandLogo variant="admin" size={40} />
            <div>
              <h1 className="text-lg font-bold tracking-tight text-gray-900 leading-none">{brand.appName}</h1>
              <p className="text-[10px] text-gray-400 font-medium tracking-wide uppercase">Care Management Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <div className="hidden md:block"><LiveClock /></div>
            <div className="h-8 w-px bg-gray-200 hidden md:block" />
            <Link to="/login/admin" className="text-sm font-semibold text-gray-600 hover:text-gray-900 transition-colors hidden sm:block">Sign In</Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 grid-bg" />
        <div className="absolute top-0 right-0 w-1/2 h-full" style={{ background: `linear-gradient(135deg, ${c.adminBg}40, ${c.staffBg}60)` }} />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 lg:py-32">
          <div className="max-w-2xl">
            <div className={`fade-up ${loaded ? 'show' : ''}`} style={stagger(0)}>
              <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gray-200 bg-white mb-6">
                <div className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: c.primary }} />
                <span className="text-xs font-semibold text-gray-600">{getGreeting()}</span>
              </div>
            </div>

            <h2 className={`text-4xl md:text-5xl lg:text-6xl font-extrabold text-gray-900 tracking-tight leading-[1.1] fade-up ${loaded ? 'show' : ''}`} style={stagger(1)}>
              NDIS Support,{' '}
              <span style={{ color: c.primary }}>simplified.</span>
            </h2>

            <p className={`mt-5 text-lg text-gray-500 leading-relaxed max-w-lg fade-up ${loaded ? 'show' : ''}`} style={stagger(2)}>
              Participant management, rostering, compliance tracking, and incident reporting — all in one secure platform built for NDIS providers.
            </p>

            <div className={`mt-8 flex flex-col sm:flex-row gap-3 fade-up ${loaded ? 'show' : ''}`} style={stagger(3)}>
              <Link to="/login/admin" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg text-white font-semibold text-sm shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all" style={{ backgroundColor: c.primary, boxShadow: `0 8px 24px -4px ${c.primary}40` }}>
                <Shield size={18} />
                Admin Portal
                <ArrowRight size={16} />
              </Link>
              <Link to="/login/staff" className="inline-flex items-center justify-center gap-2 px-6 py-3.5 rounded-lg font-semibold text-sm border-2 transition-all hover:-translate-y-0.5" style={{ borderColor: c.staff, color: c.staff }}>
                <LogIn size={18} />
                Staff Portal
              </Link>
            </div>

            <div className={`mt-6 fade-up ${loaded ? 'show' : ''}`} style={stagger(4)}>
              <Link to="/setup/staff" className="inline-flex items-center gap-1.5 text-sm text-gray-400 hover:text-gray-600 transition-colors">
                <UserPlus size={14} />
                Got an invite code? <span className="underline underline-offset-2">Set up your account</span>
                <ChevronRight size={14} />
              </Link>
            </div>
          </div>

          {/* Stats strip */}
          <div className={`mt-16 grid grid-cols-2 md:grid-cols-4 gap-4 max-w-2xl fade-up ${loaded ? 'show' : ''}`} style={stagger(5)}>
            {[
              { value: 'AES-256', label: 'Encryption' },
              { value: 'RLS', label: 'Row-Level Security' },
              { value: '99.9%', label: 'Uptime SLA' },
              { value: '24/7', label: 'Cloud Hosted' },
            ].map((s, i) => (
              <div key={i} className="p-3 rounded-lg bg-white border border-gray-100">
                <p className="text-lg font-bold text-gray-900">{s.value}</p>
                <p className="text-[11px] text-gray-400 font-medium">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="border-t border-gray-100 bg-gray-50/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-20">
          <div className={`text-center mb-12 fade-up ${loaded ? 'show' : ''}`} style={stagger(6)}>
            <p className="text-xs font-bold uppercase tracking-widest mb-2" style={{ color: c.primary }}>Platform Capabilities</p>
            <h3 className="text-2xl md:text-3xl font-bold text-gray-900">Everything you need to run your NDIS business</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {features.map((f, i) => (
              <div key={i} className={`group p-5 rounded-xl bg-white border border-gray-100 hover:border-gray-200 hover:shadow-lg transition-all duration-300 fade-up ${loaded ? 'show' : ''}`} style={stagger(7 + i)}>
                <div className="w-10 h-10 rounded-lg flex items-center justify-center mb-3" style={{ backgroundColor: i % 2 === 0 ? c.adminBg : c.staffBg }}>
                  <f.icon size={20} style={{ color: i % 2 === 0 ? c.primary : c.staff }} />
                </div>
                <h4 className="font-bold text-gray-800 text-sm mb-1">{f.title}</h4>
                <p className="text-xs text-gray-400 leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA bar */}
      <section className="border-t border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className={`flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl fade-up ${loaded ? 'show' : ''}`} style={{ ...stagger(15), background: `linear-gradient(135deg, ${c.primary}, ${c.adminHover})` }}>
            <div>
              <h3 className="text-xl md:text-2xl font-bold text-white">Ready to get started?</h3>
              <p className="text-white/70 text-sm mt-1">Sign in to your portal or contact us for a demo.</p>
            </div>
            <div className="flex gap-3">
              <Link to="/login/admin" className="px-5 py-2.5 bg-white rounded-lg font-semibold text-sm transition-all hover:shadow-lg" style={{ color: c.primary }}>
                Admin Login
              </Link>
              <Link to="/login/staff" className="px-5 py-2.5 bg-white/15 border border-white/30 rounded-lg font-semibold text-sm text-white transition-all hover:bg-white/25">
                Staff Login
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-gray-100 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <BrandLogo variant="admin" size={24} />
              <span className="text-sm font-semibold text-gray-800">{brand.appName}</span>
              <div className="w-px h-4 bg-gray-200" />
              <span className="text-xs text-gray-400">© {new Date().getFullYear()}</span>
            </div>
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-1.5">
                <CheckCircle size={12} className="text-emerald-500" />
                <span className="text-[11px] text-gray-400 font-medium">NDIS Registered</span>
              </div>
              <div className="w-px h-3 bg-gray-200" />
              <span className="text-[11px] text-gray-400">Melbourne, Victoria</span>
              <div className="w-px h-3 bg-gray-200" />
              <span className="text-[11px] text-gray-400">Powered by Supabase</span>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}