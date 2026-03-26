import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const TRACKED_PAGES = ['/', '/login/admin', '/login/staff', '/login/family']

function getDeviceType() {
  const w = window.innerWidth
  if (w < 768) return 'mobile'
  if (w < 1024) return 'tablet'
  return 'desktop'
}

function getBrowser() {
  const ua = navigator.userAgent
  if (ua.includes('Chrome') && !ua.includes('Edg')) return 'Chrome'
  if (ua.includes('Safari') && !ua.includes('Chrome')) return 'Safari'
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('Edg')) return 'Edge'
  return 'Other'
}

function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Linux')) return 'Linux'
  return 'Other'
}

function getVisitorId() {
  let id = localStorage.getItem('visitor_id')
  const count = parseInt(localStorage.getItem('visit_count') || '0') + 1
  const isReturning = !!id
  if (!id) {
    id = 'v_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    localStorage.setItem('visitor_id', id)
    localStorage.setItem('first_visit', new Date().toISOString())
  }
  localStorage.setItem('visit_count', count.toString())
  return { visitorId: id, isReturning, visitCount: count, firstVisit: localStorage.getItem('first_visit') }
}

function getSessionId() {
  let id = sessionStorage.getItem('session_id')
  if (!id) {
    id = 's_' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8)
    sessionStorage.setItem('session_id', id)
    sessionStorage.setItem('session_start', Date.now().toString())
    sessionStorage.setItem('session_pages', '0')
  }
  const count = parseInt(sessionStorage.getItem('session_pages') || '0') + 1
  sessionStorage.setItem('session_pages', count.toString())
  return { sessionId: id, pageCount: count }
}

function getSessionDuration() {
  const start = parseInt(sessionStorage.getItem('session_start') || Date.now().toString())
  return Math.round((Date.now() - start) / 1000)
}

function getReferrerInfo() {
  const ref = document.referrer
  if (!ref) return { referrer: 'Direct', referrerType: 'direct', referrerSource: 'Direct' }
  try {
    const url = new URL(ref)
    const host = url.hostname
    if (host.includes('google')) return { referrer: ref, referrerType: 'search', referrerSource: 'Google' }
    if (host.includes('facebook') || host.includes('fb.com')) return { referrer: ref, referrerType: 'social', referrerSource: 'Facebook' }
    if (host.includes('instagram')) return { referrer: ref, referrerType: 'social', referrerSource: 'Instagram' }
    if (host.includes('linkedin')) return { referrer: ref, referrerType: 'social', referrerSource: 'LinkedIn' }
    return { referrer: ref, referrerType: 'referral', referrerSource: host }
  } catch { return { referrer: ref, referrerType: 'other', referrerSource: ref } }
}

function getUtmParams() {
  const params = new URLSearchParams(window.location.search)
  return {
    utmSource: params.get('utm_source') || '',
    utmMedium: params.get('utm_medium') || '',
    utmCampaign: params.get('utm_campaign') || '',
  }
}

async function getLocation() {
  try {
    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), 3000)
    const res = await fetch('https://ipapi.co/json/', { signal: controller.signal })
    clearTimeout(timeout)
    const d = await res.json()
    return { ip: d.ip || '', city: d.city || '', region: d.region || '', country: d.country_name || '', countryCode: d.country_code || '', postal: d.postal || '', latitude: d.latitude || '', longitude: d.longitude || '', isp: d.org || '' }
  } catch {
    return { ip: '', city: 'Unknown', region: 'Unknown', country: 'Unknown', countryCode: '', postal: '', latitude: '', longitude: '', isp: '' }
  }
}

export default function PageViewTracker() {
  const location = useLocation()
  const lastPath = useRef(null)

  useEffect(() => {
    if (lastPath.current === location.pathname) return
    lastPath.current = location.pathname

    const track = async () => {
      try {
        const visitor = getVisitorId()
        const { sessionId, pageCount } = getSessionId()
        const referrer = getReferrerInfo()
        const utm = getUtmParams()

        const data = {
          page: location.pathname,
          url: window.location.href,
          timestamp: new Date().toISOString(),
          deviceType: getDeviceType(),
          browser: getBrowser(),
          os: getOS(),
          screenWidth: window.screen.width,
          screenHeight: window.screen.height,
          windowWidth: window.innerWidth,
          windowHeight: window.innerHeight,
          language: navigator.language,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          ...visitor,
          sessionId,
          sessionDuration: getSessionDuration(),
          pagesThisSession: pageCount,
          ...referrer,
          ...utm,
        }

        // Save to Supabase (always)
        supabase.from('audit_logs').insert({
          user_id: null,
          action: 'page_view',
          entity_type: 'page',
          description: `Viewed ${location.pathname}`,
          metadata: data,
        }).then(() => {}).catch(() => {})

        // Send email notification (only tracked pages, non-blocking)
        if (TRACKED_PAGES.includes(location.pathname)) {
          // Get location then send
          getLocation().then(loc => {
            fetch('/api/notify', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({ type: 'page_view', data: { ...data, ...loc } }),
            }).catch(() => {})
          }).catch(() => {})
        }
      } catch (e) {}
    }

    track()
  }, [location.pathname])

  return null
}