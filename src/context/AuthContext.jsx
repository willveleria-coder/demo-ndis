import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext(null);

function getCachedUser() {
  try {
    const cached = sessionStorage.getItem('ndis_user');
    return cached ? JSON.parse(cached) : null;
  } catch { return null; }
}

function setCachedUser(user) {
  try {
    if (user) sessionStorage.setItem('ndis_user', JSON.stringify(user));
    else sessionStorage.removeItem('ndis_user');
  } catch {}
}

export function AuthProvider({ children }) {
  const cached = getCachedUser();
  const [user, setUser] = useState(cached);
  const [loading, setLoading] = useState(!cached);
  const initDone = useRef(false);

  const fetchStaffProfile = useCallback(async (authId) => {
    try {
      const { data, error } = await supabase
        .from('staff')
        .select('*')
        .eq('auth_id', authId)
        .maybeSingle();
      if (error) throw error;
      return data || null;
    } catch (err) {
      console.error('Staff profile fetch error:', err);
      return null;
    }
  }, []);

  useEffect(() => {
    if (initDone.current) return;
    initDone.current = true;
    let mounted = true;

    if (cached) {
      setLoading(false);
      supabase.auth.getSession().then(async ({ data: { session } }) => {
        if (!mounted) return;
        if (session?.user) {
          const profile = await fetchStaffProfile(session.user.id);
          if (mounted && profile) { setUser(profile); setCachedUser(profile); }
        } else {
          if (mounted) { setUser(null); setCachedUser(null); }
        }
      }).catch(() => {});
    } else {
      async function init() {
        try {
          const { data: { session } } = await supabase.auth.getSession();
          if (session?.user) {
            const profile = await fetchStaffProfile(session.user.id);
            if (mounted) { setUser(profile); setCachedUser(profile); }
          } else {
            if (mounted) { setUser(null); setCachedUser(null); }
          }
        } catch (err) {
          console.error('Auth init error:', err);
          if (mounted) { setUser(null); setCachedUser(null); }
        }
        if (mounted) setLoading(false);
      }
      init();
      setTimeout(() => { if (mounted) setLoading(false); }, 1500);
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (!mounted) return;
      if (event === 'SIGNED_IN' || event === 'TOKEN_REFRESHED') {
        if (session?.user) {
          const profile = await fetchStaffProfile(session.user.id);
          if (mounted) { setUser(profile); setCachedUser(profile); setLoading(false); }
        }
      } else if (event === 'SIGNED_OUT') {
        if (mounted) { setUser(null); setCachedUser(null); setLoading(false); }
      }
    });

    return () => { mounted = false; subscription.unsubscribe(); };
  }, [fetchStaffProfile]);

  const logout = useCallback(async () => {
    setUser(null);
    setCachedUser(null);
    sessionStorage.clear();
    supabase.auth.signOut().catch(() => {});
  }, []);

  const refreshUser = useCallback(async () => {
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.user) {
        const profile = await fetchStaffProfile(session.user.id);
        setUser(profile);
        setCachedUser(profile);
        return profile;
      }
    } catch (err) {
      console.error('Refresh user error:', err);
    }
    return null;
  }, [fetchStaffProfile]);

  return (
    <AuthContext.Provider value={{ user, loading, logout, refreshUser, isAdmin: user?.role === 'admin' }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}