// api/notify.js — Vercel Serverless Function
// Receives page view events and sends formatted email notifications via Gmail SMTP

import nodemailer from 'nodemailer'

export default async function handler(req, res) {
  // CORS
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') return res.status(200).end()
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' })

  try {
    const { type, data } = req.body

    if (type !== 'page_view' || !data) {
      return res.status(400).json({ error: 'Invalid payload' })
    }

    const {
      page, timestamp, deviceType, browser, os,
      screenWidth, screenHeight, windowWidth, windowHeight,
      language, timezone,
      ip, city, region, country, countryCode, postal, latitude, longitude, isp,
      visitorId, isReturning, visitCount, firstVisit, sessionId,
      referrer, referrerType, referrerSource,
      utmSource, utmMedium, utmCampaign,
      sessionDuration, pagesThisSession,
    } = data

    // Page labels
    const pageLabels = {
      '/': 'Landing Page',
      '/login/admin': 'Admin Login',
      '/login/staff': 'Staff Login',
    }
    const pageLabel = pageLabels[page] || page

    // Visitor type
    const visitorType = isReturning ? '🔄 Returning Visitor' : '✨ New Visitor'
    const visitorEmoji = isReturning ? '🔄' : '✨'

    // Format timestamp to Melbourne time
    const visitTime = new Date(timestamp).toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      dateStyle: 'medium',
      timeStyle: 'medium',
    })

    // UTM info
    const hasUtm = utmSource || utmMedium || utmCampaign
    const utmBlock = hasUtm ? `
      <tr><td style="padding:6px 12px;color:#666;font-size:13px;">UTM Source:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${utmSource || '—'}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;font-size:13px;">UTM Medium:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${utmMedium || '—'}</td></tr>
      <tr><td style="padding:6px 12px;color:#666;font-size:13px;">UTM Campaign:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${utmCampaign || '—'}</td></tr>` : ''

    // First visit formatted
    const firstVisitFormatted = firstVisit ? new Date(firstVisit).toLocaleString('en-AU', {
      timeZone: 'Australia/Melbourne',
      dateStyle: 'medium',
      timeStyle: 'medium',
    }) : 'Unknown'

    const emailHtml = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;max-width:600px;margin:0 auto;background:#1a1a2e;border-radius:16px;overflow:hidden;">
      
      <!-- Header -->
      <div style="background:linear-gradient(135deg,#667eea,#764ba2);padding:24px 28px;">
        <h1 style="margin:0;color:white;font-size:22px;">${visitorEmoji} ${isReturning ? 'Returning' : 'New'} Visitor 👁️</h1>
        <p style="margin:4px 0 0;color:rgba(255,255,255,0.7);font-size:14px;">${pageLabel}</p>
      </div>

      <div style="padding:20px 28px;">

        <!-- Visitor Profile -->
        <h3 style="color:#4fc3f7;font-size:14px;margin:16px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">👤 Visitor Profile</h3>
        <table style="width:100%;border-collapse:collapse;color:#e0e0e0;">
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Visitor Type:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${visitorType}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Total Visits:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${visitCount}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">First Visit:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${firstVisitFormatted}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Visitor ID:</td><td style="padding:6px 12px;font-weight:400;font-size:11px;color:#888;">${visitorId}</td></tr>
        </table>

        <!-- Traffic Source -->
        <h3 style="color:#f06292;font-size:14px;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">📱 Traffic Source</h3>
        <table style="width:100%;border-collapse:collapse;color:#e0e0e0;">
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Source:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${referrerSource}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Type:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${referrerType}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Full Referrer:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${referrer}</td></tr>
          ${utmBlock}
        </table>

        <!-- Session Journey -->
        <h3 style="color:#81c784;font-size:14px;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">🗺️ Session Journey</h3>
        <table style="width:100%;border-collapse:collapse;color:#e0e0e0;">
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Page Viewed:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${pageLabel}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Session Duration:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${sessionDuration}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Pages This Session:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${pagesThisSession}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Time:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${visitTime}</td></tr>
        </table>

        <!-- Location -->
        <h3 style="color:#e57373;font-size:14px;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">📍 Location</h3>
        <table style="width:100%;border-collapse:collapse;color:#e0e0e0;">
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">City:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${city}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Region:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${region}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Country:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${country} (${countryCode})</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Postal Code:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${postal}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">IP Address:</td><td style="padding:6px 12px;font-weight:400;font-size:11px;color:#888;">${ip}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">ISP:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${isp}</td></tr>
        </table>

        <!-- Device -->
        <h3 style="color:#ffb74d;font-size:14px;margin:20px 0 8px;border-bottom:1px solid #333;padding-bottom:6px;">💻 Device</h3>
        <table style="width:100%;border-collapse:collapse;color:#e0e0e0;">
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Device:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${deviceType}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Browser:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${browser}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">OS:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${os}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Screen:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${screenWidth}×${screenHeight}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Window:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${windowWidth}×${windowHeight}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Language:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${language}</td></tr>
          <tr><td style="padding:6px 12px;color:#666;font-size:13px;">Timezone:</td><td style="padding:6px 12px;font-weight:600;font-size:13px;">${timezone}</td></tr>
        </table>

        <!-- Footer -->
        <p style="text-align:center;color:#555;font-size:11px;margin-top:24px;padding-top:12px;border-top:1px solid #333;">
          NDIS CRM Demo Tracker — Veleria
        </p>
      </div>
    </div>`

    // Send via Gmail SMTP
    const transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.GMAIL_USER,
        pass: process.env.GMAIL_APP_PASSWORD,
      },
    })

    await transporter.sendMail({
      from: `"NDIS CRM Tracker" <${process.env.GMAIL_USER}>`,
      to: 'will.veleria@gmail.com',
      subject: `${visitorEmoji} ${isReturning ? 'Returning' : 'New'} Visitor — ${pageLabel} | ${city}, ${region}`,
      html: emailHtml,
    })

    return res.status(200).json({ success: true })
  } catch (error) {
    console.error('Notify error:', error)
    return res.status(500).json({ error: 'Internal server error' })
  }
}