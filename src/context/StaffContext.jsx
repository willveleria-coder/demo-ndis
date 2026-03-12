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
        .select('*, participants(id, first_name, last_name), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)')
        .eq('staff_id', sid)
        .order('shift_date', { ascending: true })
      setMyShifts(data || [])
    } catch (err) {
      console.error('refreshShifts error:', err)
    }
  }, [staffProfile?.id])

  useEffect(() => {
    let mounted = true

    async function load() {
      try {
        // Step 1: Get auth user
        let authUser = null
        try {
          const { data: { session } } = await supabase.auth.getSession()
          authUser = session?.user || null
        } catch (e) { console.error('getSession failed:', e) }

        if (!authUser) {
          try {
            const { data: { user } } = await supabase.auth.getUser()
            authUser = user
          } catch (e) { console.error('getUser failed:', e) }
        }

        if (!authUser) {
          if (mounted) {
            setLoading(false)
            navigate('/login/staff')
          }
          return
        }

        // Step 2: Get staff profile — try auth_id first, then email
        let staff = null
        try {
          const { data } = await supabase.from('staff').select('*').eq('auth_id', authUser.id).maybeSingle()
          staff = data
        } catch (e) { console.error('staff auth_id lookup:', e) }

        if (!staff) {
          try {
            const { data } = await supabase.from('staff').select('*').eq('email', authUser.email).maybeSingle()
            staff = data
          } catch (e) { console.error('staff email lookup:', e) }
        }

        if (mounted) {
          setStaffProfile(staff)
          setLoading(false) // Don't wait for shifts — show the page now
        }

        if (!staff) return

        // Step 3+4: Load shifts and time off in PARALLEL — don't block page
        const shiftsPromise = supabase.from('shifts')
          .select('*, participants(id, first_name, last_name), shift_notes(id, mood, activities, goals_progress, concerns, recommendations, content)')
          .eq('staff_id', staff.id)
          .order('shift_date', { ascending: true })
          .then(({ data, error }) => {
            if (error) {
              // Fallback: load shifts without joins
              return supabase.from('shifts').select('*').eq('staff_id', staff.id).order('shift_date', { ascending: true })
            }
            return { data }
          })
          .then(({ data }) => { if (mounted) setMyShifts(data || []) })
          .catch(e => console.error('shifts load error:', e))

        const torPromise = supabase.from('time_off_requests')
          .select('*').eq('staff_id', staff.id).order('created_at', { ascending: false })
          .then(({ data }) => { if (mounted) setTimeOffRequests(data || []) })
          .catch(e => console.error('time_off_requests load error:', e))

        await Promise.allSettled([shiftsPromise, torPromise])

      } catch (err) {
        console.error('StaffProvider load error:', err)
      } finally {
        if (mounted) setLoading(false)
      }
    }

    load()

    // Safety net — never stuck loading
    const timeout = setTimeout(() => {
      if (mounted) setLoading(false)
    }, 2000)

    return () => { mounted = false; clearTimeout(timeout) }
  }, [navigate])

  const handleClockIn = async (id) => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase.from('shifts').update({ clock_in: now, status: 'in_progress' }).eq('id', id).select().maybeSingle()
      if (error) throw error
      setMyShifts(prev => prev.map(s => s.id === id ? { ...s, clock_in: now, status: 'in_progress', ...(data || {}) } : s))
    } catch (err) { console.error('Clock in failed:', err); alert('Failed to clock in: ' + (err.message || 'Unknown error')) }
  }

  const handleClockOut = async (id) => {
    try {
      const now = new Date().toISOString()
      const { data, error } = await supabase.from('shifts').update({ clock_out: now, status: 'completed' }).eq('id', id).select().maybeSingle()
      if (error) throw error
      setMyShifts(prev => prev.map(s => s.id === id ? { ...s, clock_out: now, status: 'completed', ...(data || {}) } : s))
    } catch (err) { console.error('Clock out failed:', err); alert('Failed to clock out: ' + (err.message || 'Unknown error')) }
  }

  const handleLogout = async () => {
    sessionStorage.clear()
    // Sign out in background — don't block navigation
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