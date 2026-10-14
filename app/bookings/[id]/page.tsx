'use client';

import { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import supabase from '@/lib/supabase';
import { useAuth } from '@/lib/auth-context';
import Navbar from '@/components/Navbar';
import DynamicMap from '@/components/DynamicMap';
import ToastContainer, { toast } from '@/components/Toast';
import { formatPrice, formatServiceNames } from '@/lib/utils';
import { haversineDistance, formatDistance, formatETA, estimateETA } from '@/lib/map-utils';
import { authFetch } from '@/lib/auth-fetch';
import Link from 'next/link';
import {
  MapPin, Phone, MessageCircle, ChevronLeft,
  CheckCircle2, Clock, Shield, Activity,
  Star, Navigation, AlertCircle, Copy,
  Calendar, CreditCard, MapPinned,
  ExternalLink, XCircle, HelpCircle, FileText,
  Send, ThumbsUp, X, RotateCcw, ShoppingBag
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';

export default function BookingDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const router = useRouter();
  const { user } = useAuth();
  const [booking, setBooking] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [provider, setProvider] = useState<any>(null);
  const [realtimeStatus, setRealtimeStatus] = useState<string>('');
  const [mounted, setMounted] = useState(false);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);
  const [rating, setRating] = useState(0);
  const [hoverRating, setHoverRating] = useState(0);
  const [reviewText, setReviewText] = useState('');
  const [reviewSubmitted, setReviewSubmitted] = useState(false);
  const [submittingReview, setSubmittingReview] = useState(false);

  const [chatOpen, setChatOpen] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // 1. Initial Data Fetch
  useEffect(() => {
    if (!resolvedParams.id) return;

    const fetchData = async () => {
      try {
        const res = await authFetch(`/api/orders?id=${resolvedParams.id}`);
        if (!res.ok) {
          const err = await res.json();
          throw new Error(err.error || 'Failed to fetch');
        }

        const data = await res.json();
        setBooking(data);
        setRealtimeStatus(data.status);

        if (data.professional) {
          setProvider(data.professional);
        }

        // Check if user already submitted a review
        if (data.status === 'completed' && user) {
          try {
            const reviewRes = await authFetch(`/api/reviews?booking_id=${data.id}`);
            if (reviewRes.ok) {
              const existingReview = await reviewRes.json();
              if (existingReview?.id) {
                setRating(existingReview.rating);
                setReviewText(existingReview.comment || existingReview.review_text || '');
                setReviewSubmitted(true);
              }
            }
          } catch { /* No review yet */ }
        }
      } catch (err: any) {
        console.error('Error fetching booking:', err);
        toast.error('Error', 'Could not find this booking.');
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [resolvedParams.id]);

  // 2. Real-time Subscriptions (Status & Provider Location)
  useEffect(() => {
    if (!resolvedParams.id) return;

    // Listen to booking status changes
    const bookingChannel = supabase.channel(`booking-${resolvedParams.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${resolvedParams.id}`
      }, (payload) => {
        setRealtimeStatus(payload.new.status);
        setBooking((prev: any) => ({ ...prev, ...payload.new }));
      })
      .subscribe();

    // Listen to provider location updates
    let providerChannel: any;
    if (provider?.user_id) {
      providerChannel = supabase.channel(`provider-${provider.user_id}`)
        .on('postgres_changes', {
          event: 'UPDATE',
          schema: 'public',
          table: 'provider_profiles',
          filter: `user_id=eq.${provider.user_id}`
        }, (payload) => {
          setProvider((prev: any) => ({
            ...prev,
            current_lat: payload.new.current_lat,
            current_lng: payload.new.current_lng
          }));
        })
        .subscribe();
    }

    return () => {
      supabase.removeChannel(bookingChannel);
      if (providerChannel) supabase.removeChannel(providerChannel);
    };
  }, [resolvedParams.id, provider?.user_id]);

  // 3. Chat Subscriptions
  // Chat logic removed (handled by ChatModal)

  // Cancel booking handler
  const handleCancel = async () => {
    if (!booking) return;
    setCancelling(true);

    const res = await authFetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: booking.id,
        status: 'cancelled',
        userId: user?.id
      })
    });

    if (!res.ok) {
      toast.error('Error', 'Could not cancel booking. Try again.');
    } else {
      toast.success('Cancelled', 'Your booking has been cancelled.');
      setRealtimeStatus('cancelled');
      setBooking((prev: any) => ({ ...prev, status: 'cancelled' }));
    }
    setCancelling(false);
    setShowCancelModal(false);
  };

  const handleSubmitReview = async () => {
    if (!booking || !user || rating === 0) {
      toast.error('Rating Required', 'Please select a star rating.');
      return;
    }
    setSubmittingReview(true);
    try {
      const res = await authFetch('/api/reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          booking_id: booking.id,
          rating,
          review_text: reviewText.trim() || null,
        }),
      });

      if (!res.ok) {
        const err = await res.json();
        console.warn('Review save error:', err.error);
      }
      setReviewSubmitted(true);
      toast.success('Thank You! 🎉', 'Your review has been submitted.');
    } catch (err) {
      console.warn('Review save error:', err);
    }
    setSubmittingReview(false);
  };

  // Copy booking ID
  const copyBookingId = () => {
    navigator.clipboard.writeText(booking?.booking_number || '');
    toast.success('Copied', 'Booking ID copied to clipboard.');
  };

  if (loading) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 120px)', textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 24px' }} />
        <p style={{ fontWeight: 700, color: 'var(--text-secondary)', fontSize: 15 }}>Syncing tracking data...</p>
      </div>
    </div>
  );

  if (!booking) return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 120px)', textAlign: 'center' }}>
        <div style={{ fontSize: 64, marginBottom: 24 }}>📭</div>
        <h2 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 12, color: 'var(--text)' }}>Booking Not Found</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 32 }}>This booking may have been removed or is inaccessible.</p>
        <button onClick={() => router.push('/profile?tab=bookings')} className="btn btn-primary btn-lg">Back to Bookings</button>
      </div>
    </div>
  );

  const statuses = ['pending', 'confirmed', 'en_route', 'arrived', 'started', 'completed'];
  const statusLabels: Record<string, string> = {
    pending: 'Pending', confirmed: 'Confirmed', en_route: 'Heading There',
    arrived: 'Arrived', started: 'In Progress', completed: 'Completed'
  };
  const currentIndex = statuses.indexOf(realtimeStatus);
  const isActive = ['en_route', 'arrived', 'started'].includes(realtimeStatus);
  const isCompleted = realtimeStatus === 'completed';
  const isCancelled = realtimeStatus === 'cancelled';

  const canCancel = () => {
    // Allow cancellation if not already heading there, arrived, started, completed or cancelled
    if (['en_route', 'arrived', 'started', 'completed', 'cancelled'].includes(realtimeStatus)) return false;
    if (!booking?.scheduled_date || !booking?.scheduled_time) return false;

    try {
      // 0. Grace period: If booking was created in the last 15 mins, always allow cancellation
      const bookedAt = new Date(booking.created_at).getTime();
      if ((Date.now() - bookedAt) < 15 * 60 * 1000) return true;

      // 1. Parse Time
      const timeStr = (booking.scheduled_time || "").toUpperCase().trim();
      const isPM = timeStr.includes('PM');
      const isAM = timeStr.includes('AM');
      const timeMatch = timeStr.match(/(\d+):(\d+)/);

      let h = 0, m = 0;
      if (timeMatch) {
        h = parseInt(timeMatch[1]);
        m = parseInt(timeMatch[2]);
      } else {
        const hourMatch = timeStr.match(/(\d+)/);
        if (hourMatch) h = parseInt(hourMatch[1]);
      }

      if (isPM && h !== 12) h += 12;
      if (isAM && h === 12) h = 0;

      // 2. Parse Date
      const datePart = booking.scheduled_date.split('T')[0];
      const dateMatch = datePart.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (!dateMatch) return true;

      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      const day = parseInt(dateMatch[3]);

      // 3. Future Check: If date is tomorrow or later, always allow
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDay = new Date(year, month - 1, day);
      if (bookingDay > today) return true;

      // 4. Today Check: Must be 45 mins before
      const scheduledDate = new Date(year, month - 1, day, h, m, 0);
      const diffMins = (scheduledDate.getTime() - Date.now()) / (60 * 1000);

      return diffMins > 45;
    } catch (err) {
      console.error('Cancellation check error:', err);
      return true; // Default to allow on error
    }
  };

  // Stats
  const distance = (provider?.current_lat && booking?.lat)
    ? haversineDistance(provider.current_lat, provider.current_lng, booking.lat, booking.lng)
    : null;
  const eta = distance ? estimateETA(distance) : null;

  const providerName = provider?.profiles?.full_name || 'Professional';
  const providerPhone = provider?.phone || provider?.profiles?.phone || '';
  const providerInitial = providerName.charAt(0).toUpperCase();

  // Status badge config
  const statusBadge: Record<string, { color: string; bg: string; icon: any }> = {
    pending: { color: '#eab308', bg: 'rgba(234,179,8,0.1)', icon: <Clock size={14} /> },
    confirmed: { color: '#ff751f', bg: 'rgba(255,117,31,0.1)', icon: <CheckCircle2 size={14} /> },
    en_route: { color: '#3b82f6', bg: 'rgba(59,130,246,0.1)', icon: <Navigation size={14} /> },
    arrived: { color: '#6366f1', bg: 'rgba(99,102,241,0.1)', icon: <MapPin size={14} /> },
    started: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: <Activity size={14} /> },
    completed: { color: '#22c55e', bg: 'rgba(34,197,94,0.1)', icon: <CheckCircle2 size={14} /> },
    cancelled: { color: '#ef4444', bg: 'rgba(239,68,68,0.1)', icon: <XCircle size={14} /> },
  };
  const badge = statusBadge[realtimeStatus] || statusBadge.pending;

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', position: 'relative' }}>
      <Navbar />
      <ToastContainer />

      {/* Premium Chat Modal */}
      {booking && user && (
        <ChatModal
          isOpen={chatOpen}
          onClose={() => setChatOpen(false)}
          bookingId={booking.id}
          userId={user.id}
          professional={{
            name: providerName,
            avatar: provider?.profiles?.avatar_url,
            phone: providerPhone
          }}
        />
      )}

      <div className="modern-tracking-layout">
        {/* Top / Left: Map Area */}
        <div className="tracking-map-container">
          {!isCompleted && !isCancelled ? (
            <DynamicMap
              height="100%"
              status={realtimeStatus}
              customerLocation={{ lat: Number(booking.lat || 28.6139), lng: Number(booking.lng || 77.2090) }}
              providerUserId={provider?.user_id || null}
              providerName={providerName}
              scheduledTime={booking.scheduled_time}
              borderRadius="0"
            />
          ) : isCompleted ? (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #22c55e20, #22c55e10)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#22c55e', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(34,197,94,0.3)' }}>
                <CheckCircle2 size={40} color="#fff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#16a34a' }}>Service Completed</h2>
            </div>
          ) : (
            <div style={{ width: '100%', height: '100%', background: 'linear-gradient(135deg, #ef444420, #ef444410)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column' }}>
              <div style={{ width: 80, height: 80, borderRadius: '50%', background: '#ef4444', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 16, boxShadow: '0 8px 32px rgba(239,68,68,0.3)' }}>
                <XCircle size={40} color="#fff" strokeWidth={2.5} />
              </div>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 900, color: '#dc2626' }}>Booking Cancelled</h2>
            </div>
          )}

          {/* Back button overlay */}
          <button onClick={() => router.back()} style={{ position: 'absolute', top: 'calc(var(--navbar-h) + 16px)', left: 16, width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', cursor: 'pointer', zIndex: 10 }}>
            <ChevronLeft size={24} color="var(--text)" />
          </button>
        </div>

        {/* Bottom / Right: Content Sheet */}
        <div className="tracking-content-sheet">
          <div className="mobile-sheet-handle" />

          {/* Header Info */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 24 }}>
            <div>
              <h1 style={{ fontSize: '1.4rem', fontWeight: 900, color: 'var(--text)', marginBottom: 6, letterSpacing: '-0.02em' }}>
                {isActive ? 'Arriving Soon' : isCompleted ? 'Completed' : isCancelled ? 'Cancelled' : 'Booking Confirmed'}
              </h1>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                <span style={{ color: 'var(--text-secondary)', fontSize: 13, fontWeight: 600 }}>#{booking.booking_number}</span>
                <span style={{ padding: '4px 10px', borderRadius: 99, fontSize: 10, fontWeight: 800, background: badge.bg, color: badge.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                  {statusLabels[realtimeStatus] || realtimeStatus}
                </span>
              </div>
            </div>

            {/* ETA Box */}
            {isActive && eta !== null && (
              <div style={{ padding: '8px 16px', background: 'var(--accent-light)', borderRadius: 16, textAlign: 'center', border: '1px solid rgba(255,117,31,0.2)' }}>
                <div style={{ fontSize: 10, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', marginBottom: 2 }}>ETA</div>
                <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--accent)' }}>{formatETA(eta)}</div>
              </div>
            )}
          </div>

          {/* Professional Card (Extremely Prominent) */}
          {realtimeStatus !== 'cancelled' && (
            <div style={{ padding: 20, background: 'var(--bg)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24, boxShadow: '0 4px 20px rgba(0,0,0,0.03)' }}>
              {provider ? (
                <>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                    <div style={{ width: 60, height: 60, borderRadius: 20, position: 'relative', flexShrink: 0 }}>
                      {provider.profiles?.avatar_url ? (
                        <img src={provider.profiles.avatar_url} alt="" style={{ width: '100%', height: '100%', borderRadius: 20, objectFit: 'cover' }} />
                      ) : (
                        <div style={{ width: '100%', height: '100%', borderRadius: 20, background: 'linear-gradient(135deg, #ff751f, #ff9a56)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 900, color: '#fff' }}>
                          {providerInitial}
                        </div>
                      )}
                      {isActive && (
                        <div style={{ position: 'absolute', bottom: -2, right: -2, width: 16, height: 16, borderRadius: '50%', background: '#22c55e', border: '3px solid var(--bg)' }} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ fontSize: 17, fontWeight: 900, color: 'var(--text)' }}>{providerName}</div>
                      <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontWeight: 600, marginTop: 4 }}>
                        Your verified professional
                      </div>
                    </div>
                    {/* Call Icon Button */}
                    {providerPhone && (
                      <a href={`tel:${providerPhone}`} style={{ width: 44, height: 44, borderRadius: '50%', background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text)', flexShrink: 0 }}>
                        <Phone size={18} />
                      </a>
                    )}
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: 'flex', gap: 10, marginTop: 16 }}>
                    <button onClick={() => setChatOpen(true)} className="btn btn-primary" style={{ flex: 1, height: 48, borderRadius: 16, fontSize: 14, fontWeight: 800, display: 'flex', gap: 8, alignItems: 'center', justifyContent: 'center' }}>
                      <MessageCircle size={18} /> Chat with Pro
                    </button>
                  </div>
                </>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                  <div style={{ width: 60, height: 60, borderRadius: 20, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div className="spinner" style={{ width: 24, height: 24 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Assigning Professional</div>
                    <div style={{ fontSize: 13, color: 'var(--text-secondary)', marginTop: 4 }}>Finding the best professional available..</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Security OTP (Very Important) */}
          {realtimeStatus !== 'cancelled' && realtimeStatus !== 'completed' && booking.completion_otp && (
            <div style={{ padding: 20, background: 'rgba(255, 117, 31, 0.08)', borderRadius: 24, border: '1px dashed var(--accent)', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <div>
                <div style={{ fontSize: 12, fontWeight: 800, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>Service OTP</div>
                <div style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 500 }}>Share after service completion</div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 900, color: 'var(--text)', letterSpacing: '0.1em' }}>{booking.completion_otp}</div>
            </div>
          )}

          {/* Rating Section (If Completed) */}
          {isCompleted && (
            <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <h4 style={{ fontSize: 11, fontWeight: 900, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20, textAlign: 'center' }}>
                {reviewSubmitted ? '✅ Your Review' : 'How Was Your Experience?'}
              </h4>

              {reviewSubmitted ? (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 6, marginBottom: 12 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <Star key={s} size={28} fill={s <= rating ? '#ff751f' : 'transparent'} color={s <= rating ? '#ff751f' : 'var(--border)'} />
                    ))}
                  </div>
                  {reviewText && <p style={{ fontSize: 14, color: 'var(--text-secondary)', fontStyle: 'italic', lineHeight: 1.6 }}>"{reviewText}"</p>}
                </div>
              ) : (
                <div>
                  <div style={{ display: 'flex', justifyContent: 'center', gap: 8, marginBottom: 20 }}>
                    {[1, 2, 3, 4, 5].map(s => (
                      <button
                        key={s}
                        onMouseEnter={() => setHoverRating(s)}
                        onMouseLeave={() => setHoverRating(0)}
                        onClick={() => setRating(s)}
                        style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 4, transition: 'transform 0.2s', transform: (hoverRating || rating) >= s ? 'scale(1.15)' : 'scale(1)' }}
                      >
                        <Star size={32} fill={(hoverRating || rating) >= s ? '#ff751f' : 'transparent'} color={(hoverRating || rating) >= s ? '#ff751f' : 'var(--border)'} strokeWidth={2} />
                      </button>
                    ))}
                  </div>
                  <textarea
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    placeholder="Share your experience... (optional)"
                    style={{ width: '100%', minHeight: 80, padding: '14px 18px', borderRadius: 16, border: '1px solid var(--border)', background: 'var(--bg-card-solid)', fontSize: 14, color: 'var(--text)', outline: 'none' }}
                  />
                  <button
                    onClick={handleSubmitReview}
                    disabled={rating === 0 || submittingReview}
                    className="btn btn-primary"
                    style={{ width: '100%', height: 48, borderRadius: 16, fontSize: 14, fontWeight: 900, marginTop: 16, display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: rating === 0 ? 0.5 : 1 }}
                  >
                    {submittingReview ? 'Submitting...' : 'Submit Review'}
                  </button>
                </div>
              )}
            </div>
          )}

          {/* Timeline / Progress */}
          {!isCancelled && !isCompleted && (
            <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', marginBottom: 20 }}>Order Status</h3>
              <div style={{ display: 'flex', flexDirection: 'column', position: 'relative', paddingLeft: 8 }}>
                <div style={{ position: 'absolute', top: 12, bottom: 12, left: 19, width: 2, background: 'var(--border)', zIndex: 1 }} />
                <div style={{ position: 'absolute', top: 12, height: `${(Math.max(0, currentIndex) / 5) * 100}%`, left: 19, width: 2, background: 'var(--accent)', zIndex: 2, transition: 'height 1s ease-in-out' }} />

                {statuses.map((s, i) => (
                  <div key={s} style={{ display: 'flex', alignItems: 'center', gap: 20, zIndex: 3, position: 'relative', marginBottom: i === statuses.length - 1 ? 0 : 24 }}>
                    <div style={{
                      width: 24, height: 24, borderRadius: '50%', flexShrink: 0,
                      background: i <= currentIndex ? 'var(--accent)' : 'var(--bg-card-solid)',
                      border: `2px solid ${i <= currentIndex ? 'var(--accent)' : 'var(--border)'}`,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      {i < currentIndex ? <CheckCircle2 size={14} color="#fff" strokeWidth={3} /> : i === currentIndex ? <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#fff' }} /> : null}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: i === currentIndex ? 800 : 600, color: i <= currentIndex ? 'var(--text)' : 'var(--text-muted)' }}>
                      {statusLabels[s]}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Service Details & Billing */}
          <div style={{ padding: 24, background: 'var(--bg)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
            <h3 style={{ fontSize: 14, fontWeight: 900, color: 'var(--text)', marginBottom: 16 }}>Bill Details</h3>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {(() => {
                const groupedItems = booking.booking_items?.reduce((acc: any, item: any) => {
                  const existing = acc.find((i: any) => i.service_name === item.service_name);
                  if (existing) {
                    existing.quantity += item.quantity || 1;
                    existing.total_price += item.unit_price * (item.quantity || 1);
                  } else {
                    acc.push({ ...item, quantity: item.quantity || 1, total_price: item.unit_price * (item.quantity || 1) });
                  }
                  return acc;
                }, []) || [];

                return groupedItems.map((item: any, idx: number) => (
                  <div key={item.id || idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div style={{ flex: 1, paddingRight: 16 }}>
                      <div style={{ fontSize: 14, fontWeight: 600, color: 'var(--text-secondary)' }}>{item.service_name}</div>
                      {item.quantity > 1 && <div style={{ fontSize: 12, color: 'var(--text-muted)', marginTop: 2 }}>Qty: {item.quantity}</div>}
                    </div>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>{formatPrice(item.total_price)}</span>
                  </div>
                ));
              })()}
              <div style={{ height: 1, background: 'var(--border)', margin: '8px 0' }} />
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <span style={{ fontSize: 14, fontWeight: 800, color: 'var(--text)' }}>Total Amount</span>
                <span style={{ fontSize: 16, fontWeight: 900, color: '#ff751f' }}>{formatPrice(booking.total)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: 4 }}>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>Payment Method</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)' }}>{booking.payment_method || 'Cash'}</span>
              </div>
            </div>
          </div>

          {/* Cancellation button */}
          {['pending', 'confirmed'].includes(realtimeStatus) && (
            <button onClick={() => setShowCancelModal(true)} style={{ width: '100%', padding: 16, background: 'none', border: '1px solid var(--border)', borderRadius: 16, color: '#ef4444', fontSize: 14, fontWeight: 700, cursor: 'pointer' }}>
              Cancel Booking
            </button>
          )}

        </div>
      </div>

      {/* Cancel Modal */}
      {showCancelModal && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 9999, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ background: 'var(--bg-card-solid)', border: '1px solid var(--border)', borderRadius: 28, padding: 40, maxWidth: 420, width: '100%', textAlign: 'center', animation: 'fadeInUp 0.3s ease' }}>
            <div style={{ width: 72, height: 72, borderRadius: '50%', background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
              <AlertCircle size={36} color="#ef4444" />
            </div>
            <h3 style={{ fontSize: '1.4rem', fontWeight: 900, marginBottom: 10, color: 'var(--text)' }}>Cancel Booking?</h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
              This action cannot be undone. Are you sure you want to cancel this service booking?
            </p>
            <div style={{ padding: '12px', background: 'rgba(239,68,68,0.05)', border: '1px solid rgba(239,68,68,0.1)', borderRadius: 12, marginBottom: 32 }}>
              <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 600 }}>Notice: Cancellations are only allowed up to 45 minutes before the service starts.</p>
            </div>
            <div style={{ display: 'flex', gap: 12 }}>
              <button onClick={() => setShowCancelModal(false)} className="btn btn-secondary" style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800 }}>
                Keep Booking
              </button>
              <button onClick={handleCancel} disabled={cancelling} style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800, fontSize: 14, background: '#ef4444', color: '#fff', border: 'none', cursor: 'pointer', opacity: cancelling ? 0.6 : 1 }}>
                {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
              </button>
            </div>
          </div>
        </div>
      )}

      <style dangerouslySetInnerHTML={{
        __html: `
        html, body { background: var(--bg-card-solid) !important; }
        
        /* Modern Layout Constraints */
        .modern-tracking-layout {
          display: flex;
          flex-direction: column;
          width: 100%;
          min-height: 100vh;
          position: relative;
        }

        .tracking-map-container {
          position: sticky;
          top: 0;
          width: 100%;
          height: 45vh;
          z-index: 1;
        }

        .tracking-content-sheet {
          position: relative;
          z-index: 2;
          background: var(--bg-card-solid);
          border-top-left-radius: 28px;
          border-top-right-radius: 28px;
          margin-top: -24px;
          padding: 32px 24px 60px;
          box-shadow: 0 -8px 24px rgba(0,0,0,0.05);
          min-height: 60vh;
        }

        .mobile-sheet-handle {
          width: 48px;
          height: 5px;
          background: var(--border);
          border-radius: 10px;
          margin: 0 auto 24px;
        }

        @media (min-width: 900px) {
          .modern-tracking-layout {
            flex-direction: row;
            padding-top: calc(var(--navbar-h) + 32px);
            max-width: 1400px;
            margin: 0 auto;
            gap: 48px;
            padding-left: 40px;
            padding-right: 40px;
            padding-bottom: 60px;
            align-items: flex-start;
          }
          
          .tracking-map-container {
            position: sticky;
            top: calc(var(--navbar-h) + 32px);
            height: calc(100vh - var(--navbar-h) - 64px);
            border-radius: 28px;
            overflow: hidden;
            box-shadow: 0 12px 40px rgba(0,0,0,0.15);
            border: 1px solid var(--border);
            flex: 1.2;
          }

          .tracking-content-sheet {
            flex: 1;
            max-width: 520px;
            margin-top: 0;
            padding: 0;
            border-radius: 0;
            box-shadow: none;
            background: transparent;
            min-height: auto;
          }

          .mobile-sheet-handle { display: none; }
        }
      `}} />
    </div>
  );
}
