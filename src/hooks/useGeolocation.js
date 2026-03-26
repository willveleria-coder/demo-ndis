import { useState, useEffect, useCallback } from 'react'

/**
 * useGeolocation - Get and watch the user's current GPS position
 * 
 * @param {Object} options
 * @param {boolean} options.watch - Continuously watch position (default: false)
 * @param {boolean} options.highAccuracy - Use high accuracy mode (default: true)
 * @param {number} options.timeout - Timeout in ms (default: 10000)
 * @returns {Object} { position, error, loading, refreshPosition }
 */
export default function useGeolocation({ watch = false, highAccuracy = true, timeout = 10000 } = {}) {
  const [position, setPosition] = useState(null)
  const [error, setError] = useState(null)
  const [loading, setLoading] = useState(false)

  const geoOptions = {
    enableHighAccuracy: highAccuracy,
    timeout,
    maximumAge: 30000, // Cache for 30 seconds
  }

  const handleSuccess = useCallback((pos) => {
    setPosition({
      lat: pos.coords.latitude,
      lng: pos.coords.longitude,
      accuracy: pos.coords.accuracy,
      timestamp: pos.timestamp,
    })
    setError(null)
    setLoading(false)
  }, [])

  const handleError = useCallback((err) => {
    let message = 'Unable to get location'
    switch (err.code) {
      case 1: message = 'Location permission denied. Please enable location access in your browser settings.'; break
      case 2: message = 'Location unavailable. Please check your GPS is enabled.'; break
      case 3: message = 'Location request timed out. Please try again.'; break
    }
    setError({ code: err.code, message })
    setLoading(false)
  }, [])

  const refreshPosition = useCallback(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported by this browser' })
      return
    }
    setLoading(true)
    setError(null)
    navigator.geolocation.getCurrentPosition(handleSuccess, handleError, geoOptions)
  }, [handleSuccess, handleError])

  useEffect(() => {
    if (!navigator.geolocation) {
      setError({ code: 0, message: 'Geolocation is not supported by this browser' })
      return
    }

    if (watch) {
      setLoading(true)
      const watchId = navigator.geolocation.watchPosition(handleSuccess, handleError, geoOptions)
      return () => navigator.geolocation.clearWatch(watchId)
    }
  }, [watch, handleSuccess, handleError])

  return { position, error, loading, refreshPosition }
}

/**
 * Calculate distance between two coordinates using Haversine formula
 * @param {number} lat1 - Latitude of point 1
 * @param {number} lng1 - Longitude of point 1
 * @param {number} lat2 - Latitude of point 2
 * @param {number} lng2 - Longitude of point 2
 * @returns {number} Distance in meters
 */
export function getDistanceMeters(lat1, lng1, lat2, lng2) {
  const R = 6371000 // Earth's radius in meters
  const dLat = toRad(lat2 - lat1)
  const dLng = toRad(lng2 - lng1)
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))
  return R * c
}

function toRad(deg) {
  return deg * (Math.PI / 180)
}

/**
 * Format distance for display
 * @param {number} meters - Distance in meters
 * @returns {string} Formatted distance string
 */
export function formatDistance(meters) {
  if (meters < 1000) return `${Math.round(meters)}m`
  return `${(meters / 1000).toFixed(1)}km`
}