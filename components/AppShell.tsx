'use client';
import { useState, useEffect, useCallback, useRef, useLayoutEffect } from 'react';
import { usePathname } from 'next/navigation';
import SplashScreen from './SplashScreen';
import LocationPrompt from './LocationPrompt';
import { useAuth } from '@/lib/auth-context';
import supabase from '@/lib/supabase';

type AppPhase = 'splash' | 'location' | 'ready';
const useIsomorphicLayoutEffect = typeof window !== 'undefined' ? useLayoutEffect : useEffect;

export default function AppShell({ children }: { children: React.ReactNode }) {
  const [phase, setPhase] = useState<AppPhase>('splash');
  const [maintenanceCheckDone, setMaintenanceCheckDone] = useState(false);
  const [mounted, setMounted] = useState(false);
  const pathname = usePathname();
  const { profile, loading: authLoading, isAdmin } = useAuth();
  const maintenanceCheckedRef = useRef(false);

  // 1. Initial Sync logic — handles hydration and fast-skip
  useIsomorphicLayoutEffect(() => {
    setMounted(true);
    if (typeof window === 'undefined') return;

    const splashDone = sessionStorage.getItem('zarpit_splash_done');
    const locationDone = localStorage.getItem('zarpit_location_done');

    if (splashDone) {
      setPhase(locationDone ? 'ready' : 'location');
    } else {
      setPhase('splash');
    }
  }, []);

  // 2. Splash Completion
  const handleSplashComplete = useCallback(() => {
    if (typeof window !== 'undefined') {
      sessionStorage.setItem('zarpit_splash_done', 'true');
      const locationDone = localStorage.getItem('zarpit_location_done');
      setPhase(locationDone ? 'ready' : 'location');
    }
  }, []);

  // 3. Location Logic
  const handleLocationResult = useCallback((result: any) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zarpit_location_done', 'true');
      if (result) localStorage.setItem('zarpit_location', JSON.stringify(result));
      window.dispatchEvent(new Event('zarpit_location_updated'));
      setPhase('ready');
    }
  }, []);

  const handleLocationSkip = useCallback(() => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('zarpit_location_done', 'true');
      setPhase('ready');
    }
  }, []);

  // Listen for navbar location button click to re-open prompt
  useEffect(() => {
    const handleReopen = () => setPhase('location');
    window.addEventListener('zarpit_reopen_location', handleReopen);
    return () => window.removeEventListener('zarpit_reopen_location', handleReopen);
  }, []);

  // 4. Maintenance Check (Handled secure server-side by middleware)
  useEffect(() => {
    setMaintenanceCheckDone(true);
  }, []);

  // 5. Global Navigation / Popstate listener to ensure phase is correct
  useEffect(() => {
    const handlePopState = () => {
      const splashDone = sessionStorage.getItem('zarpit_splash_done');
      if (splashDone) {
        const loc = localStorage.getItem('zarpit_location_done');
        setPhase(loc ? 'ready' : 'location');
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // Banned User Redirect Logic
  useEffect(() => {
    if (!authLoading && profile && !profile.is_active && pathname !== '/banned') {
      window.location.href = '/banned';
    }
  }, [profile, authLoading, pathname]);

  // 6. Safety: Force 'ready' if still in splash after 5s
  useEffect(() => {
    if (phase === 'splash') {
      const t = setTimeout(() => {
        console.warn('[AppShell] Splash timeout - forcing ready');
        handleSplashComplete();
      }, 5000);
      return () => clearTimeout(t);
    }
  }, [phase, handleSplashComplete]);

  // Determine visibility
  // We show content if splash is done. If location prompt is active, we blur the background.
  const isSplashActive = phase === 'splash';
  const isLocationActive = phase === 'location';
  const showContent = (phase === 'ready' || phase === 'location') && (maintenanceCheckDone || !isSplashActive);

  return (
    <>
      {isSplashActive && <SplashScreen onComplete={handleSplashComplete} fast={typeof window !== 'undefined' && !!localStorage.getItem('zarpit_location_done')} />}
      
      {isLocationActive && maintenanceCheckDone && <LocationPrompt onResult={handleLocationResult} onSkip={handleLocationSkip} />}

      <div 
        suppressHydrationWarning 
        style={{
          opacity: showContent ? 1 : 0,
          visibility: showContent ? 'visible' : 'hidden',
          transition: 'opacity 0.2s ease, filter 0.3s ease',
          pointerEvents: phase === 'ready' ? 'auto' : 'none',
          filter: isLocationActive ? 'blur(12px) brightness(0.5)' : 'none',
          position: 'relative',
          minHeight: '100vh',
          background: 'var(--bg)'
        }}
      >
        {children}
      </div>
    </>
  );
}
