import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

const isBrowser = typeof window !== 'undefined';

// Custom lock implementation that doesn't use navigator.locks
const noopLock = (name, acquireTimeout, fn) => fn();

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    storageKey: 'ndis-crm-auth',
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});