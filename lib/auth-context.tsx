'use client';

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from 'react';
import supabase from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';
import type { User, Session } from '@supabase/supabase-js';
import { authFetch } from '@/lib/auth-fetch';
import { fetchOrCreateProfile } from '@/app/actions/profile';

const PROFILE_CACHE_KEY = 'zarpit_profile_cache';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  profile: Profile | null;
  isAdmin: boolean;
  isProfessional: boolean;
  loading: boolean;
  signOut: () => Promise<void>;
  refreshProfile: () => Promise<void>;
  refreshSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  session: null,
  profile: null,
  isAdmin: false,
  isProfessional: false,
  loading: true,
  signOut: async () => { },
  refreshProfile: async () => { },
  refreshSession: async () => { },
});

// ============================================
// SessionStorage helpers for instant hydration
// ============================================
function getCachedProfile(): Profile | null {
  if (typeof window === 'undefined') return null;
  try {
    const cached = sessionStorage.getItem(PROFILE_CACHE_KEY);
    if (cached) return JSON.parse(cached) as Profile;
  } catch { /* ignore */ }
  return null;
}

function setCachedProfile(profile: Profile | null) {
  if (typeof window === 'undefined') return;
  try {
    if (profile) {
      sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
    } else {
      sessionStorage.removeItem(PROFILE_CACHE_KEY);
    }
  } catch { /* ignore */ }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  // Hydrate profile from cache immediately for instant avatar/role display
  const [profile, setProfile] = useState<Profile | null>(() => getCachedProfile());
  const [loading, setLoading] = useState(true);
  const initRef = useRef(false);

  const fetchProfile = useCallback(async (userId: string): Promise<Profile | null> => {
    try {
      const p = await fetchOrCreateProfile(userId);
      if (p) {
        setCachedProfile(p as Profile);
        return p as Profile;
      }
    } catch (err: any) {
      console.warn('[Auth] Profile fetch exception:', err?.message || err);
    }
    return null;
  }, []);

  const refreshProfile = useCallback(async () => {
    if (user) {
      const p = await fetchProfile(user.id);
      if (p) {
        setProfile(p);
        setCachedProfile(p);
      }
    }
  }, [user, fetchProfile]);

  const syncAuthCookies = useCallback((s: any) => {
    if (typeof window === 'undefined') return;
    if (s?.access_token) {
      document.cookie = `sb-access-token=${s.access_token}; path=/; max-age=604800; SameSite=Lax; Secure`;
      
      const composite = {
        access_token: s.access_token,
        refresh_token: s.refresh_token,
        user: s.user
      };
      document.cookie = `sb-lujkfcjxswcpystqbpif-auth-token=${encodeURIComponent(JSON.stringify(composite))}; path=/; max-age=604800; SameSite=Lax; Secure`;
    } else {
      document.cookie = 'sb-access-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      document.cookie = 'sb-lujkfcjxswcpystqbpif-auth-token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
  }, []);

  useEffect(() => {
    let mounted = true;

    // Hard safety net: if loading is still true after 6s, force it off
    const safetyTimeout = setTimeout(() => {
      if (mounted && loading) {
        console.warn('[Auth] Safety timeout — forcing loading=false after 6s');
        setLoading(false);
      }
    }, 6000);

    // Get initial session
    supabase.auth.getSession().then(({ data: { session: s } }) => {
      if (!mounted) return;
      syncAuthCookies(s);
      setSession(s);
      setUser(s?.user ?? null);
      if (s?.user) {
        // Hydrate from cache if available
        const cached = getCachedProfile();
        if (cached && cached.id === s.user.id) {
          setProfile(cached);
        }
        // ALWAYS unblock UI immediately — profile loads in background
        setLoading(false);
        // Background fetch to get fresh profile data
        fetchProfile(s.user.id).then(p => {
          if (mounted && p) setProfile(p);
        });
      } else {
        setCachedProfile(null);
        setProfile(null);
        setLoading(false);
      }
    }).catch(() => {
      if (mounted) setLoading(false);
    });

    // Listen for auth changes — NEVER block UI on profile fetch
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, s) => {
        if (!mounted) return;
        syncAuthCookies(s);
        setSession(s);
        setUser(s?.user ?? null);
        // Unblock UI immediately
        setLoading(false);

        if (s?.user) {
          // Hydrate from cache instantly, then refresh in background
          const cached = getCachedProfile();
          if (cached && cached.id === s.user.id) {
            setProfile(cached);
          }
          fetchProfile(s.user.id).then(p => {
            if (mounted && p) {
              setProfile(p);
              setCachedProfile(p);
            }
          });
        } else {
          setProfile(null);
          setCachedProfile(null);
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(safetyTimeout);
      subscription.unsubscribe();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [syncAuthCookies]);

  const signOut = async () => {
    syncAuthCookies(null);
    await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    setProfile(null);
    setCachedProfile(null);
  };

  const refreshSession = useCallback(async () => {
    const { data: { session: s } } = await supabase.auth.getSession();
    syncAuthCookies(s);
    setSession(s);
    setUser(s?.user ?? null);
  }, [syncAuthCookies]);

  const isAdmin = profile?.role === 'admin';
  const isProfessional = profile?.role === 'professional';

  return (
    <AuthContext.Provider value={{ user, session, profile, isAdmin, isProfessional, loading, signOut, refreshProfile, refreshSession }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export default AuthContext;
