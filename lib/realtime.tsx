'use client';

import { useEffect, useState, useCallback, useRef } from 'react';
import supabase from '@/lib/supabase';
import { authFetch } from '@/lib/auth-fetch';
import { adminFetch } from '@/lib/admin-fetch';
import type { Booking, Notification as NotifType, CartItemDB } from '@/lib/database.types';

// ============================================
// Robust Fetch Utility with Exponential Backoff
// ============================================
async function fetchWithRetry(queryPromiseFn: () => Promise<any>, maxAttempts = 4, timeoutMs = 12000) {
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      const result: any = await Promise.race([
        queryPromiseFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
      ]);
      
      if (!result.error) return result;
      if (result.error) console.warn(`Fetch attempt ${attempt + 1} failed:`, result.error.message);
    } catch (err: any) {
      console.warn(`Fetch attempt ${attempt + 1}:`, err?.message || err);
    }
    if (attempt < maxAttempts - 1) {
      const delay = 500 * Math.pow(2, attempt);
      await new Promise(r => setTimeout(r, delay));
    }
  }
  return { error: new Error('Max retries reached'), data: null };
}



// ============================================
// Realtime Bookings Hook
// ============================================
export function useRealtimeBookings(userId: string | null) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const fetchBookings = useCallback(async () => {
    if (!userId) { setBookings([]); setLoading(false); return; }
    
    const result = await fetchWithRetry(async () => {
      const res = await authFetch(`/api/orders?userId=${userId}`);
      if (!res.ok) {
        const err = await res.json();
        return { error: err, data: null };
      }
      const data = await res.json();
      return { data, error: null };
    });

    if (result.data) {
      setBookings(result.data as any[]);
    } else {
      setBookings([]);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchBookings();

    if (!userId) return;

    // Clean up any existing channel first
    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`bookings-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchBookings();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchBookings]);

  return { bookings, loading, refetch: fetchBookings };
}

// ============================================
// Realtime Admin Bookings Hook (all bookings)
// ============================================
export function useRealtimeAllBookings(onNewBooking?: (booking: Booking) => void) {
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const fetchBookings = useCallback(async () => {
    const result = await fetchWithRetry(async () => {
      const res = await adminFetch('/api/orders?all=true');
      if (!res.ok) {
        const err = await res.json();
        return { error: err, data: null };
      }
      const data = await res.json();
      return { data, error: null };
    });

    if (result.data) {
      setBookings(result.data as Booking[]);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchBookings();

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`admin-bookings-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'bookings',
      }, (payload) => {
        if (payload.eventType === 'INSERT' && onNewBooking) {
          onNewBooking(payload.new as Booking);
        }
        fetchBookings();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [fetchBookings, onNewBooking]);

  return { bookings, loading, refetch: fetchBookings };
}

// ============================================
// Realtime Notifications Hook
// ============================================
export function useRealtimeNotifications(userId: string | null) {
  const [notifications, setNotifications] = useState<NotifType[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const channelRef = useRef<any>(null);

  const fetchNotifications = useCallback(async () => {
    if (!userId) { setNotifications([]); setUnreadCount(0); return; }
    try {
      const result: any = await Promise.race([
        supabase
          .from('notifications')
          .select('*')
          .eq('user_id', userId)
          .order('created_at', { ascending: false })
          .limit(50),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      const data = result.data;
      const error = result.error;

      if (!error && data) {
        setNotifications(data as NotifType[]);
        setUnreadCount((data as NotifType[]).filter(n => !n.is_read).length);
      }
    } catch (err: any) {
      console.warn('Notifications fetch failed:', err?.message || err);
    }
  }, [userId]);

  useEffect(() => {
    fetchNotifications();

    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`notifications-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'notifications',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchNotifications();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchNotifications]);

  return { notifications, unreadCount, refetch: fetchNotifications };
}

// ============================================
// Realtime Cart Hook
// ============================================
export function useRealtimeCart(userId: string | null) {
  const [cartItems, setCartItems] = useState<CartItemDB[]>([]);
  const [loading, setLoading] = useState(true);
  const channelRef = useRef<any>(null);

  const fetchCart = useCallback(async () => {
    if (!userId) { setCartItems([]); setLoading(false); return; }
    try {
      const result: any = await Promise.race([
        supabase
          .from('cart_items')
          .select('*, service:services(*)')
          .eq('user_id', userId),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
      ]);
      const data = result.data;
      const error = result.error;

      if (!error && data) setCartItems(data as CartItemDB[]);
    } catch (err: any) {
      console.warn('Cart fetch failed:', err?.message || err);
    }
    setLoading(false);
  }, [userId]);

  useEffect(() => {
    fetchCart();

    if (!userId) return;

    if (channelRef.current) {
      supabase.removeChannel(channelRef.current);
    }

    const channel = supabase
      .channel(`cart-${userId}-${Date.now()}`)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'cart_items',
        filter: `user_id=eq.${userId}`,
      }, () => {
        fetchCart();
      })
      .subscribe();

    channelRef.current = channel;

    return () => {
      supabase.removeChannel(channel);
      channelRef.current = null;
    };
  }, [userId, fetchCart]);

  return { cartItems, loading, refetch: fetchCart };
}
