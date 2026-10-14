'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import supabase from '@/lib/supabase';
import { type LatLng, isIdle as checkIdle } from '@/lib/map-utils';

// ─── Types ───────────────────────────────────────

export interface ProviderTrackingState {
  /** Current position (interpolated or raw) */
  position: LatLng | null;
  /** Raw heading in degrees (0-360, 0=North) */
  heading: number | null;
  /** Speed in m/s */
  speed: number | null;
  /** Whether the last update is stale (> STALE_THRESHOLD_MS ago) */
  isStale: boolean;
  /** Whether the professional appears idle (speed < threshold) */
  isIdle: boolean;
  /** Timestamp of the last received update */
  lastUpdate: Date | null;
  /** Whether we're currently subscribed and receiving updates */
  isConnected: boolean;
}

interface UseProviderTrackingOptions {
  /** The provider's user_id to track */
  providerUserId: string | null;
  /** Whether tracking should be active (e.g., only during en_route/arrived/started) */
  enabled: boolean;
}

// ─── Constants ───────────────────────────────────

/** If no update received for this long, mark as stale */
const STALE_THRESHOLD_MS = 15_000;

/** Check stale status this often */
const STALE_CHECK_INTERVAL_MS = 5_000;

// ─── Hook ────────────────────────────────────────

export function useProviderTracking({ providerUserId, enabled }: UseProviderTrackingOptions): ProviderTrackingState {
  const [position, setPosition] = useState<LatLng | null>(null);
  const [heading, setHeading] = useState<number | null>(null);
  const [speed, setSpeed] = useState<number | null>(null);
  const [isStale, setIsStale] = useState(false);
  const [idle, setIdle] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  const lastUpdateRef = useRef<number>(0);

  // ── Stale detector ──
  useEffect(() => {
    if (!enabled) return;

    const interval = setInterval(() => {
      if (lastUpdateRef.current > 0) {
        const elapsed = Date.now() - lastUpdateRef.current;
        setIsStale(elapsed > STALE_THRESHOLD_MS);
      }
    }, STALE_CHECK_INTERVAL_MS);

    return () => clearInterval(interval);
  }, [enabled]);

  // ── Initial fetch + Realtime subscription ──
  useEffect(() => {
    if (!providerUserId || !enabled) {
      setIsConnected(false);
      return;
    }

    // 1. Fetch current position immediately
    const fetchCurrent = async () => {
      const { data } = await supabase
        .from('provider_profiles')
        .select('current_lat, current_lng, heading, speed')
        .eq('user_id', providerUserId)
        .maybeSingle();

      if (data?.current_lat && data?.current_lng) {
        const now = Date.now();
        lastUpdateRef.current = now;
        setPosition({ lat: Number(data.current_lat), lng: Number(data.current_lng) });
        setHeading(data.heading != null ? Number(data.heading) : null);
        setSpeed(data.speed != null ? Number(data.speed) : null);
        setIdle(checkIdle(data.speed != null ? Number(data.speed) : null));
        setLastUpdate(new Date(now));
        setIsStale(false);
      }
    };

    fetchCurrent();

    // 2. Subscribe to realtime changes
    const channel = supabase
      .channel(`tracking-${providerUserId}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'provider_profiles',
        filter: `user_id=eq.${providerUserId}`,
      }, (payload) => {
        const { current_lat, current_lng, heading: h, speed: s } = payload.new as any;

        if (current_lat != null && current_lng != null) {
          const now = Date.now();
          lastUpdateRef.current = now;

          setPosition({ lat: Number(current_lat), lng: Number(current_lng) });
          setHeading(h != null ? Number(h) : null);
          setSpeed(s != null ? Number(s) : null);
          setIdle(checkIdle(s != null ? Number(s) : null));
          setLastUpdate(new Date(now));
          setIsStale(false);
        }
      })
      .subscribe((status) => {
        setIsConnected(status === 'SUBSCRIBED');
      });

    return () => {
      supabase.removeChannel(channel);
      setIsConnected(false);
    };
  }, [providerUserId, enabled]);

  // ── Cleanup on disable ──
  useEffect(() => {
    if (!enabled) {
      setPosition(null);
      setHeading(null);
      setSpeed(null);
      setIsStale(false);
      setIdle(false);
      setLastUpdate(null);
      lastUpdateRef.current = 0;
    }
  }, [enabled]);

  return {
    position,
    heading,
    speed,
    isStale,
    isIdle: idle,
    lastUpdate,
    isConnected,
  };
}
