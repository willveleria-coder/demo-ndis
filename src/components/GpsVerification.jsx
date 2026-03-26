import { useState, useEffect } from 'react'
import { MapPin, Navigation, AlertTriangle, CheckCircle, Loader2, RefreshCw, Shield, XCircle } from 'lucide-react'
import useGeolocation, { getDistanceMeters, formatDistance } from '../hooks/useGeolocation'

/**
 * GpsVerification - Verifies staff location before clock in/out
 * 
 * @param {Object} props
 * @param {Object} props.participant - Participant object with lat/lng
 * @param {string} props.shiftLocation - Shift location string (fallback display)
 * @param {Function} props.onVerified - Callback with {lat, lng, distance, withinRange, overridden}
 * @param {Function} props.onCancel - Cancel callback
 * @param {string} props.action - 'in' or 'out' 
 * @param {number} props.maxDistance - Max allowed distance in meters (default: 200)
 * @param {string} props.accentColor - Brand accent color
 * @param {string} props.accentHover - Brand accent hover color
 * @param {boolean} props.isDark - Dark mode flag
 */
export default function GpsVerification({ 
  participant,
  shiftLocation,
  onVerified, 
  onCancel,
  action = 'in',
  maxDistance = 200,
  accentColor = '#10b981',
  accentHover = '#059669',
  isDark = false,
}) {
  const { position, error, loading, refreshPosition } = useGeolocation()
  const [checking, setChecking] = useState(true)
  const [result, setResult] = useState(null)
  const [overrideReason, setOverrideReason] = useState('')
  const [showOverride, setShowOverride] = useState(false)

  const dk = {
    cardBg: isDark ? '#1e293b' : '#ffffff',
    border: isDark ? '#334155' : '#e5e7eb',
    text: isDark ? '#e2e8f0' : '#1f2937',
    textMuted: isDark ? '#94a3b8' : '#6b7280',
    textFaint: isDark ? '#64748b' : '#9ca3af',
    inputBg: isDark ? '#0f172a' : '#f9fafb',
  }

  // Auto-request location on mount
  useEffect(() => {
    refreshPosition()
  }, [])

  // Check distance when position arrives
  useEffect(() => {
    if (!position) return

    const participantLat = participant?.lat
    const participantLng = participant?.lng

    if (!participantLat || !participantLng) {
      // No participant coordinates — allow clock in but note no geofence
      setResult({
        withinRange: true,
        noGeofence: true,
        distance: null,
        lat: position.lat,
        lng: position.lng,
        accuracy: position.accuracy,
      })
      setChecking(false)
      return
    }

    const distance = getDistanceMeters(position.lat, position.lng, participantLat, participantLng)
    const withinRange = distance <= maxDistance

    setResult({
      withinRange,
      noGeofence: false,
      distance,
      lat: position.lat,
      lng: position.lng,
      accuracy: position.accuracy,
      participantLat,
      participantLng,
    })
    setChecking(false)
  }, [position, participant, maxDistance])

  const handleProceed = () => {
    if (!result) return
    onVerified({
      lat: result.lat,
      lng: result.lng,
      distance: result.distance,
      withinRange: result.withinRange,
      overridden: false,
      accuracy: result.accuracy,
    })
  }

  const handleOverride = () => {
    if (!overrideReason.trim()) {
      alert('Please provide a reason for the location override')
      return
    }
    onVerified({
      lat: result?.lat || null,
      lng: result?.lng || null,
      distance: result?.distance || null,
      withinRange: false,
      overridden: true,
      overrideReason: overrideReason.trim(),
      accuracy: result?.accuracy,
    })
  }

  const actionLabel = action === 'in' ? 'Clock In' : 'Clock Out'

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3 p-3 rounded-xl"
        style={{ background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: `1px solid ${isDark ? '#065f46' : '#d1fae5'}` }}>
        <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shadow"
          style={{ background: `linear-gradient(135deg, ${accentColor}, ${accentHover})` }}>
          <Navigation size={18} />
        </div>
        <div>
          <p className="font-bold text-sm" style={{ color: dk.text }}>Location Verification</p>
          <p className="text-xs" style={{ color: dk.textMuted }}>Verifying your location before {actionLabel.toLowerCase()}</p>
        </div>
      </div>

      {/* Location display */}
      {shiftLocation && (
        <div className="p-3 rounded-xl" style={{ background: dk.inputBg, border: `1px solid ${dk.border}` }}>
          <p className="text-[10px] font-bold uppercase tracking-wider" style={{ color: dk.textFaint }}>Shift Location</p>
          <p className="text-sm font-medium mt-0.5 flex items-center gap-1.5" style={{ color: dk.text }}>
            <MapPin size={14} style={{ color: accentColor }} />
            {shiftLocation}
          </p>
        </div>
      )}

      {/* Loading state */}
      {(loading || checking) && !error && (
        <div className="p-6 rounded-xl text-center" style={{ background: dk.inputBg, border: `1px solid ${dk.border}` }}>
          <Loader2 size={32} className="animate-spin mx-auto mb-3" style={{ color: accentColor }} />
          <p className="font-semibold text-sm" style={{ color: dk.text }}>Getting your location...</p>
          <p className="text-xs mt-1" style={{ color: dk.textFaint }}>Please allow location access if prompted</p>
        </div>
      )}

      {/* Error state */}
      {error && (
        <div className="p-4 rounded-xl" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? '#991b1b' : '#fecaca'}` }}>
          <div className="flex items-start gap-3">
            <XCircle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-700">{error.message}</p>
              <button onClick={refreshPosition} className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600 hover:text-red-700">
                <RefreshCw size={12} /> Try Again
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Result - Within range */}
      {result && result.withinRange && !result.noGeofence && (
        <div className="p-4 rounded-xl" style={{ background: isDark ? 'rgba(16,185,129,0.1)' : '#ecfdf5', border: `1px solid ${isDark ? '#065f46' : '#a7f3d0'}` }}>
          <div className="flex items-center gap-3">
            <CheckCircle size={24} className="text-emerald-500 shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: isDark ? '#6ee7b7' : '#065f46' }}>Location Verified</p>
              <p className="text-xs" style={{ color: isDark ? '#34d399' : '#059669' }}>
                You're {formatDistance(result.distance)} from the shift location (within {formatDistance(maxDistance)})
              </p>
              {result.accuracy > 50 && (
                <p className="text-[10px] mt-1" style={{ color: dk.textFaint }}>GPS accuracy: ±{Math.round(result.accuracy)}m</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Result - No geofence set */}
      {result && result.noGeofence && (
        <div className="p-4 rounded-xl" style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: `1px solid ${isDark ? '#92400e' : '#fde68a'}` }}>
          <div className="flex items-center gap-3">
            <Shield size={20} style={{ color: isDark ? '#fbbf24' : '#d97706' }} className="shrink-0" />
            <div>
              <p className="font-bold text-sm" style={{ color: isDark ? '#fbbf24' : '#92400e' }}>Location Recorded</p>
              <p className="text-xs" style={{ color: isDark ? '#fcd34d' : '#b45309' }}>
                No geofence set for this participant. Your GPS coordinates will be recorded.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Result - Out of range */}
      {result && !result.withinRange && !result.noGeofence && (
        <div className="p-4 rounded-xl" style={{ background: isDark ? 'rgba(239,68,68,0.1)' : '#fef2f2', border: `1px solid ${isDark ? '#991b1b' : '#fecaca'}` }}>
          <div className="flex items-start gap-3">
            <AlertTriangle size={20} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-sm text-red-700">Outside Allowed Range</p>
              <p className="text-xs text-red-600">
                You're {formatDistance(result.distance)} from the shift location. Maximum allowed is {formatDistance(maxDistance)}.
              </p>
              {result.accuracy > 100 && (
                <p className="text-[10px] mt-1 text-red-400">GPS accuracy is low (±{Math.round(result.accuracy)}m). Try moving to an open area.</p>
              )}
              <button onClick={refreshPosition} className="flex items-center gap-1.5 mt-2 text-xs font-bold text-red-600 hover:text-red-700">
                <RefreshCw size={12} /> Refresh Location
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Override section for out of range */}
      {result && !result.withinRange && !result.noGeofence && (
        <div>
          {!showOverride ? (
            <button onClick={() => setShowOverride(true)}
              className="w-full text-xs font-semibold py-2 text-center rounded-lg transition-colors"
              style={{ color: dk.textFaint }}
            >
              Need to override? Tap here
            </button>
          ) : (
            <div className="p-3 rounded-xl space-y-2" style={{ background: isDark ? 'rgba(245,158,11,0.1)' : '#fffbeb', border: `1px solid ${isDark ? '#92400e' : '#fde68a'}` }}>
              <p className="text-xs font-bold" style={{ color: isDark ? '#fbbf24' : '#92400e' }}>Location Override</p>
              <p className="text-[11px]" style={{ color: isDark ? '#fcd34d' : '#b45309' }}>
                This will be logged and flagged for admin review.
              </p>
              <textarea
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                placeholder="Reason for override (e.g. community outing, transport)..."
                className="w-full px-3 py-2 rounded-lg text-sm resize-none focus:outline-none focus:ring-2"
                style={{ background: dk.inputBg, border: `1px solid ${dk.border}`, color: dk.text, '--tw-ring-color': `${accentColor}40` }}
                rows={2}
              />
              <button onClick={handleOverride} disabled={!overrideReason.trim()}
                className="w-full py-2.5 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                style={{ background: 'linear-gradient(to right, #f59e0b, #f97316)' }}>
                Override & {actionLabel}
              </button>
            </div>
          )}
        </div>
      )}

      {/* Action buttons */}
      <div className="flex gap-2 pt-1">
        <button onClick={onCancel}
          className="flex-1 py-3 rounded-xl text-sm font-bold transition-colors"
          style={{ background: isDark ? '#334155' : '#f3f4f6', color: dk.text }}>
          Cancel
        </button>
        {(result?.withinRange || result?.noGeofence) && (
          <button onClick={handleProceed}
            className="flex-1 py-3 rounded-xl text-white text-sm font-bold shadow-lg flex items-center justify-center gap-2"
            style={{ background: `linear-gradient(to right, ${accentColor}, ${accentHover})` }}>
            <MapPin size={16} /> {actionLabel}
          </button>
        )}
      </div>
    </div>
  )
}