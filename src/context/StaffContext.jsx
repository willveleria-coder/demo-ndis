import { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'

const StaffContext = createContext(null)

export function useStaff() {
  const ctx = useContext(StaffContext)
  if (!ctx) throw new Error('useStaff must be used within StaffProvider')
  return ctx
}

export function StaffProvider({ children }) {
  const [loading, setLoading] = useState(true)
  const [staffProfile, setStaffProfile] = useState(null)
  const [myShifts, setMyShifts] = useState([])
  const [timeOffRequests, setTimeOffRequests] = useState([])
  const navigate = useNavigate()

  const refreshShifts = useCallback(async (staffId) => {
    const sid = staffId || staffProfile?.id
    if (!sid) return
    try {
      const { data } = await supabase.from('shifts')
        .select('*, participants(id, first_name, last_name, lat, lng), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)')
        .eq('staff_id', sid)
        .order('shift_date', { ascending: true })
      setMyShifts(data || [])
    } catch (err) {
      console.error('refreshShifts error:', err)
    }
  }, [staffProfile?.id])

  // Single function that loads everything given an auth user
  const loadStaffData = useCallback(async (authUser, mounted = { current: true }) => {
    if (!authUser) {
      if (mounted.current) setLoading(false)
      return
    }

    try {
      // Get staff profile — try auth_id first, then email
      let staff = null
      
      const { data: d1 } = await supabase.from('staff').select('*').eq('auth_id', authUser.id).maybeSingle()
      staff = d1

      if (!staff) {
        const { data: d2 } = await supabase.from('staff').select('*').eq('email', authUser.email).maybeSingle()
        staff = d2
      }

      if (!mounted.current) return

      setStaffProfile(staff)

      if (!staff) {
        setLoading(false)
        return
      }

      // Load shifts and time off in parallel
      const [shiftsRes, torRes] = await Promise.allSettled([
        supabase.from('shifts')
          .select('*, participants(id, first_name, last_name, lat, lng), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)')
          .eq('staff_id', staff.id)
          .order('shift_date', { ascending: true }),
        supabase.from('time_off_requests')
          .select('*').eq('staff_id', staff.id).order('created_at', { ascending: false }),
      ])

      if (!mounted.current) return

      if (shiftsRes.status === 'fulfilled' && shiftsRes.value?.data) {
        setMyShifts(shiftsRes.value.data)
      } else {
        // Fallback: simpler query without joins
        try {
          const { data } = await supabase.from('shifts').select('*').eq('staff_id', staff.id).order('shift_date', { ascending: true })
          if (mounted.current) setMyShifts(data || [])
        } catch (e) { console.error('shifts fallback error:', e) }
      }

      if (torRes.status === 'fulfilled' && torRes.value?.data) {
        setTimeOffRequests(torRes.value.data)
      }

      if (mounted.current) setLoading(false)
    } catch (err) {
      console.error('StaffProvider load error:', err)
      if (mounted.current) setLoading(false)
    }
  }, [])

  useEffect(() => {
    const mounted = { current: true }
    let retryTimer = null
    let retryCount = 0

    // Attempt to load with current session
    async function init() {
      try {
        const { data: { session } } = await supabase.auth.getSession()
        if (session?.user && mounted.current) {
          await loadStaffData(session.user, mounted)
          return
        }
      } catch (e) {
        console.error('getSession error:', e)
      }

      // No session yet — wait for auth state change (AutoLogin is probably still signing in)
      // Don't set loading=false yet, let the listener handle it
    }

    init()

    // Listen for auth changes — this catches AutoLogin completing
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted.current) return

      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          // Reset state for fresh load
          setLoading(true)
          setStaffProfile(null)
          setMyShifts([])
          setTimeOffRequests([])

          // Retry logic — sometimes first query fails because JWT isn't propagated yet
          const tryLoad = async () => {
            await loadStaffData(session.user, mounted)
            
            // If profile loaded but no shifts, retry once after a delay
            // This handles the race where RLS hasn't picked up the new token
            if (mounted.current && retryCount < 2) {
              retryCount++
              retryTimer = setTimeout(async () => {
                if (mounted.current) {
                  const { data: { session: freshSession } } = await supabase.auth.getSession()
                  if (freshSession?.user) {
                    await loadStaffData(freshSession.user, mounted)
                  }
                }
              }, 1500)
            }
          }

          await tryLoad()
        }
      }

      if (event === 'SIGNED_OUT') {
        if (mounted.current) {
          setStaffProfile(null)
          setMyShifts([])
          setTimeOffRequests([])
          setLoading(false)
        }
      }
    })

    // Safety timeout — never stay loading forever
    const safetyTimeout = setTimeout(() => {
      if (mounted.current && loading) {
        setLoading(false)
      }
    }, 8000)

    return () => {
      mounted.current = false
      clearTimeout(retryTimer)
      clearTimeout(safetyTimeout)
      subscription.unsubscribe()
    }
  }, [loadStaffData])

  const handleClockIn = async (id, gpsData = null) => {
    try {
      const now = new Date().toISOString()
      const updatePayload = { clock_in: now, status: 'in_progress' }
      if (gpsData?.lat != null && gpsData?.lng != null) {
        updatePayload.clock_in_lat = gpsData.lat
        updatePayload.clock_in_lng = gpsData.lng
      }
      const { data, error } = await supabase.from('shifts').update(updatePayload).eq('id', id).select().maybeSingle()
      if (error) throw error
      setMyShifts(prev => prev.map(s => s.id === id ? { ...s, clock_in: now, status: 'in_progress', ...(data || {}) } : s))
    } catch (err) {
      console.error('Clock in failed:', err)
      alert('Failed to clock in: ' + (err.message || 'Unknown error'))
    }
  }

  const handleClockOut = async (id, gpsData = null) => {
    try {
      const now = new Date().toISOString()
      const updatePayload = { clock_out: now, status: 'completed' }
      if (gpsData?.lat != null && gpsData?.lng != null) {
        updatePayload.clock_out_lat = gpsData.lat
        updatePayload.clock_out_lng = gpsData.lng
      }
      const { data, error } = await supabase.from('shifts').update(updatePayload).eq('id', id).select().maybeSingle()
      if (error) throw error
      setMyShifts(prev => prev.map(s => s.id === id ? { ...s, clock_out: now, status: 'completed', ...(data || {}) } : s))
    } catch (err) {
      console.error('Clock out failed:', err)
      alert('Failed to clock out: ' + (err.message || 'Unknown error'))
    }
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    supabase.auth.signOut().catch(() => {})
    navigate('/')
  }

  const inProgressShift = myShifts.find(s => s.status === 'in_progress')
  const upcomingShifts = myShifts.filter(s => s.status === 'scheduled' || s.status === 'upcoming')
  const completedShifts = myShifts.filter(s => s.status === 'completed')
  const pendingNotes = completedShifts.filter(s => !s.shift_notes || s.shift_notes?.length === 0)
  const staffName = staffProfile ? `${staffProfile.first_name} ${staffProfile.last_name}` : 'Staff'
  const initials = staffProfile ? `${staffProfile.first_name?.[0] || ''}${staffProfile.last_name?.[0] || ''}` : '?'

  return (
    <StaffContext.Provider value={{
      loading, staffProfile, setStaffProfile, myShifts, setMyShifts, timeOffRequests, setTimeOffRequests,
      handleClockIn, handleClockOut, handleLogout, refreshShifts,
      inProgressShift, upcomingShifts, completedShifts, pendingNotes, staffName, initials,
    }}>
      {children}
    </StaffContext.Provider>
  )
}