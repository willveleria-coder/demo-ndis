// Visitor tracking utilities
// Generates persistent visitor IDs, tracks sessions, and collects device/location data

const VISITOR_ID_KEY = 'ndis_visitor_id'
const VISIT_COUNT_KEY = 'ndis_visit_count'
const FIRST_VISIT_KEY = 'ndis_first_visit'
const SESSION_START_KEY = 'ndis_session_start'
const SESSION_ID_KEY = 'ndis_session_id'

function generateId() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
    const r = (Math.random() * 16) | 0
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16)
  })
}

export function getVisitorData() {
  // Visitor ID (persistent across sessions)
  let visitorId = localStorage.getItem(VISITOR_ID_KEY)
  let isReturning = true
  if (!visitorId) {
    visitorId = generateId()
    localStorage.setItem(VISITOR_ID_KEY, visitorId)
    localStorage.setItem(FIRST_VISIT_KEY, new Date().toISOString())
    localStorage.setItem(VISIT_COUNT_KEY, '0')
    isReturning = false
  }

  // Visit count
  let visitCount = parseInt(localStorage.getItem(VISIT_COUNT_KEY) || '0', 10)

  // Session tracking (new session if >30 min gap)
  let sessionId = sessionStorage.getItem(SESSION_ID_KEY)
  if (!sessionId) {
    sessionId = generateId()
    sessionStorage.setItem(SESSION_ID_KEY, sessionId)
    sessionStorage.setItem(SESSION_START_KEY, Date.now().toString())
    // Increment visit count on new session
    visitCount += 1
    localStorage.setItem(VISIT_COUNT_KEY, visitCount.toString())
  }

  const firstVisit = localStorage.getItem(FIRST_VISIT_KEY) || new Date().toISOString()

  // UTM parameters
  const url = new URL(window.location.href)
  const utm = {
    utmSource: url.searchParams.get('utm_source') || null,
    utmMedium: url.searchParams.get('utm_medium') || null,
    utmCampaign: url.searchParams.get('utm_campaign') || null,
    utmTerm: url.searchParams.get('utm_term') || null,
    utmContent: url.searchParams.get('utm_content') || null,
  }

  // Referrer analysis
  const referrer = document.referrer || ''
  let referrerType = 'Direct'
  let referrerSource = 'Direct / None'
  if (referrer) {
    try {
      const ref = new URL(referrer)
      referrerSource = ref.hostname
      if (ref.hostname.includes('google')) referrerType = 'Organic Search'
      else if (ref.hostname.includes('facebook') || ref.hostname.includes('instagram') || ref.hostname.includes('meta')) referrerType = 'Social'
      else if (ref.hostname.includes('linkedin')) referrerType = 'Social'
      else if (ref.hostname.includes('twitter') || ref.hostname.includes('x.com')) referrerType = 'Social'
      else referrerType = 'Referral'
    } catch { /* invalid URL */ }
  }

  return {
    visitorId,
    isReturning,
    visitCount,
    firstVisit,
    sessionId,
    referrer: referrer || 'None (Direct)',
    referrerType,
    referrerSource,
    ...utm,
  }
}

export function getSessionDuration() {
  const start = sessionStorage.getItem(SESSION_START_KEY)
  if (!start) return 'Just started'
  const seconds = Math.floor((Date.now() - parseInt(start, 10)) / 1000)
  if (seconds < 5) return 'Just started'
  if (seconds < 60) return `${seconds}s`
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ${seconds % 60}s`
  return `${Math.floor(seconds / 3600)}h ${Math.floor((seconds % 3600) / 60)}m`
}

export function getSessionPageCount() {
  const key = 'ndis_session_pages'
  let count = parseInt(sessionStorage.getItem(key) || '0', 10)
  count += 1
  sessionStorage.setItem(key, count.toString())
  return count
}

export async function getLocationData() {
  try {
    const res = await fetch('https://ipapi.co/json/')
    if (res.ok) {
      const data = await res.json()
      return {
        ip: data.ip || 'Unknown',
        city: data.city || 'Unknown',
        region: data.region || 'Unknown',
        country: data.country_name || 'Unknown',
        countryCode: data.country_code || 'Unknown',
        postal: data.postal || 'Unknown',
        latitude: data.latitude || 'Unknown',
        longitude: data.longitude || 'Unknown',
        isp: data.org || 'Unknown',
      }
    }
  } catch (e) {
    console.log('Could not fetch location:', e)
  }
  return {
    ip: 'Unknown', city: 'Unknown', region: 'Unknown', country: 'Unknown',
    countryCode: 'Unknown', postal: 'Unknown', latitude: 'Unknown',
    longitude: 'Unknown', isp: 'Unknown',
  }
}

export function getDeviceType() {
  const ua = navigator.userAgent
  if (/tablet|ipad|playbook|silk/i.test(ua)) return 'Tablet'
  if (/mobile|iphone|ipod|android|blackberry|opera mini|iemobile/i.test(ua)) return 'Mobile'
  return 'Desktop'
}

export function getBrowser() {
  const ua = navigator.userAgent
  if (ua.includes('Firefox')) return 'Firefox'
  if (ua.includes('SamsungBrowser')) return 'Samsung Browser'
  if (ua.includes('Opera') || ua.includes('OPR')) return 'Opera'
  if (ua.includes('Edg')) return 'Edge'
  if (ua.includes('Chrome')) return 'Chrome'
  if (ua.includes('Safari')) return 'Safari'
  return 'Unknown'
}

export function getOS() {
  const ua = navigator.userAgent
  if (ua.includes('Win')) return 'Windows'
  if (ua.includes('Mac')) return 'macOS'
  if (ua.includes('Linux')) return 'Linux'
  if (ua.includes('Android')) return 'Android'
  if (ua.includes('iPhone') || ua.includes('iPad')) return 'iOS'
  return 'Unknown'
}