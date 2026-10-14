'use client';
import { useEffect, useState, Suspense } from 'react';
import { useSearchParams } from 'next/navigation';
import Link from 'next/link';
import Navbar from '@/components/Navbar';
import ToastContainer, { toast } from '@/components/Toast';
import { useAuth } from '@/lib/auth-context';
import { authFetch } from '@/lib/auth-fetch';
import { formatPrice, formatServiceNames } from '@/lib/utils';
import supabase from '@/lib/supabase';
import type { Booking, BookingItem } from '@/lib/database.types';
import { generateInvoicePDF } from '@/lib/invoice';
import {
  Shield,
  MessageCircle,
  XCircle,
  X,
  Download,
  ArrowLeft,
  Clock,
  MapPin,
  Calendar,
  CreditCard,
  ShieldAlert,
  Loader2,
  User,
  Check,
  Star,
  Info,
  Phone,
  Tag,
  Lock
} from 'lucide-react';
import ChatModal from '@/components/ChatModal';

function ConfirmationContent() {
  const searchParams = useSearchParams();
  const bookingNumber = searchParams.get('id');
  const [booking, setBooking] = useState<(Booking & { booking_items: BookingItem[] }) | null>(null);
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);

  const [mounted, setMounted] = useState(false);
  const [chatOpen, setChatOpen] = useState(false);
  const [provider, setProvider] = useState<any>(null);

  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelling, setCancelling] = useState(false);

  const fetchData = async () => {
    if (!bookingNumber) { setLoading(false); return; }

    try {
      const res = await authFetch(`/api/orders?id=${bookingNumber}`);
      if (res.ok) {
        const data = await res.json();
        if (data && !data.error) {
          setBooking(data);
          if (data.professional) {
            setProvider(data.professional);
          }
        }
      }
    } catch (err) {
      console.error('Fetch booking error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    setMounted(true);
    fetchData();
    window.addEventListener('focus', fetchData);
    return () => window.removeEventListener('focus', fetchData);
  }, [bookingNumber]);

  // Subscribe to realtime status updates for this booking
  useEffect(() => {
    if (!booking?.id) return;
    const channel = supabase
      .channel(`booking-sync-${booking.id}`)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'bookings',
        filter: `id=eq.${booking.id}`,
      }, (payload) => {
        console.log('[Realtime] Status change:', payload.new.status);
        setBooking(prev => prev ? { ...prev, ...(payload.new as Booking) } : prev);
      })
      .subscribe((status) => {
        console.log('[Realtime] Channel status:', status);
      });
    return () => { supabase.removeChannel(channel); };
  }, [booking?.id]);

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
      setBooking(prev => prev ? { ...prev, status: 'cancelled' } : prev);
    }
    setCancelling(false);
    setShowCancelModal(false);
  };

  const statusToTimeline = (status: string) => {
    const steps = ['pending', 'confirmed', 'en_route', 'arrived', 'started', 'completed'];
    const idx = steps.indexOf(status);

    if (status === 'cancelled') {
      return [
        { title: 'Order Placed', desc: 'Your order was received', status: 'completed' as const },
        { title: 'Cancelled', desc: 'This booking has been cancelled', status: 'cancelled' as const },
      ];
    }
    return [
      { title: 'Order Placed', desc: 'Your request has been registered securely', status: idx >= 1 ? 'completed' as const : idx === 0 ? 'active' as const : 'pending' as const },
      { title: 'Professional Assigned', desc: 'A verified service provider is scheduled', status: idx >= 2 ? 'completed' as const : idx === 1 ? 'active' as const : 'pending' as const },
      { title: 'On The Way', desc: 'Provider is traveling to your location', status: idx >= 3 ? 'completed' as const : idx === 2 ? 'active' as const : 'pending' as const },
      { title: 'Arrived', desc: 'Provider has arrived at your address', status: idx >= 4 ? 'completed' as const : idx === 3 ? 'active' as const : 'pending' as const },
      { title: 'Service In Progress', desc: 'Service execution is currently underway', status: idx >= 5 ? 'completed' as const : idx === 4 ? 'active' as const : 'pending' as const },
      { title: 'Completed', desc: 'Successfully finished. OTP verified', status: idx >= 5 ? 'completed' as const : 'pending' as const },
    ];
  };

  const handleDownloadInvoice = () => {
    if (booking) {
      generateInvoicePDF(booking);
    }
  };

  if (loading) {
    return (
      <div style={{
        paddingTop: 'calc(var(--navbar-h) + 120px)',
        minHeight: '100vh',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 20,
        background: 'radial-gradient(circle at center, rgba(255,117,31,0.02) 0%, transparent 70%)'
      }}>
        <div style={{ position: 'relative', width: 64, height: 64 }}>
          <div style={{
            position: 'absolute',
            inset: 0,
            borderRadius: '50%',
            border: '3px solid rgba(255,117,31,0.1)',
            borderTopColor: 'var(--accent)',
            animation: 'spin 1s linear infinite'
          }} />
          <Loader2 size={24} color="var(--accent)" className="animate-spin" style={{ position: 'absolute', top: 20, left: 20 }} />
        </div>
        <p style={{ color: 'var(--text-secondary)', fontSize: 15, fontWeight: 600, letterSpacing: '0.02em' }}>Loading booking details...</p>
      </div>
    );
  }

  const timeline = statusToTimeline(booking?.status || 'pending');

  const canCancel = () => {
    if (!booking) return false;
    const blockedStatuses = ['en_route', 'arrived', 'started', 'completed', 'cancelled'];
    if (blockedStatuses.includes(booking.status)) return false;
    if (!booking.scheduled_date || !booking.scheduled_time) return false;

    try {
      const bookedAt = new Date(booking.created_at).getTime();
      if ((Date.now() - bookedAt) < 15 * 60 * 1000) return true;

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

      const datePart = booking.scheduled_date.split('T')[0];
      const dateMatch = datePart.match(/(\d{4})-(\d{1,2})-(\d{1,2})/);
      if (!dateMatch) return true;

      const year = parseInt(dateMatch[1]);
      const month = parseInt(dateMatch[2]);
      const day = parseInt(dateMatch[3]);

      const today = new Date();
      today.setHours(0, 0, 0, 0);
      const bookingDay = new Date(year, month - 1, day);
      if (bookingDay > today) return true;

      const scheduledDate = new Date(year, month - 1, day, h, m, 0);
      const diffMins = (scheduledDate.getTime() - Date.now()) / (60 * 1000);

      return diffMins > 45;
    } catch (err) {
      console.error('Cancellation check error:', err);
      return true;
    }
  };

  return (
    <div className="confirmation-main-div" style={{
      paddingTop: 'calc(var(--navbar-h) + 60px)',
      paddingBottom: 100,
      minHeight: '100vh',
      background: 'radial-gradient(circle at 10% 20%, rgba(255,117,31,0.03) 0%, transparent 40%), radial-gradient(circle at 90% 80%, rgba(255,117,31,0.02) 0%, transparent 50%), var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center'
    }}>
      <style>{`
        .page-layout-sidebar {
          display: grid;
          grid-template-columns: minmax(0, 1.4fr) 1fr;
          gap: 32px;
          align-items: start;
        }
        .confirmation-container {
          max-width: 1100px;
          width: 100%;
          padding-left: 24px;
          padding-right: 24px;
        }
        @media (max-width: 868px) {
          .page-layout-sidebar {
            grid-template-columns: 1fr !important;
            gap: 24px !important;
          }
          .confirmation-container {
            padding-left: 16px !important;
            padding-right: 16px !important;
          }
          .confirmation-main-div {
            padding-top: calc(var(--navbar-h) + 24px) !important;
            padding-bottom: 60px !important;
          }
          .confirmation-hero-header {
            margin-bottom: 28px !important;
            padding: 12px 0 !important;
          }
        }
        @keyframes minimalistZoom {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.03); }
        }
        @keyframes flipkartBounce {
          0% { transform: scale(0); opacity: 0; }
          60% { transform: scale(1.15); opacity: 1; }
          80% { transform: scale(0.95); }
          100% { transform: scale(1); opacity: 1; }
        }
        @keyframes drawCheck {
          0% { stroke-dashoffset: 100; }
          100% { stroke-dashoffset: 0; }
        }
        @keyframes expandRing {
          0% { transform: scale(0.8); opacity: 1; border-width: 10px; }
          100% { transform: scale(1.6); opacity: 0; border-width: 1px; }
        }
      `}</style>
      <ToastContainer />

      <div className="confirmation-container">
        {/* Dynamic Success Glow Header */}
        <div className="confirmation-hero-header" style={{
          textAlign: 'center',
          marginBottom: 50,
          position: 'relative',
          padding: '24px 0'
        }}>
          <div style={{
            width: 120,
            height: 120,
            margin: '0 auto 28px',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}>
            {/* Outer expanding ring (Flipkart burst effect) */}
            {booking?.status !== 'cancelled' && (
              <div style={{
                position: 'absolute', inset: 0, borderRadius: '50%',
                border: '10px solid var(--success)',
                animation: 'expandRing 1s ease-out forwards',
                opacity: 0
              }} />
            )}
            
            {/* Core Checkmark / Cancel Ring */}
            <div style={{
              width: 80, height: 80, borderRadius: '50%',
              background: booking?.status === 'cancelled' ? 'var(--error)' : 'var(--success)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: booking?.status === 'cancelled' ? '0 10px 30px rgba(239,68,68,0.4)' : '0 10px 30px rgba(34,197,94,0.4)',
              animation: 'flipkartBounce 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) forwards',
              zIndex: 2,
              transform: 'scale(0)'
            }}>
              {booking?.status === 'cancelled' ? (
                <X size={44} color="#ffffff" strokeWidth={3} />
              ) : (
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ffffff" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" style={{ strokeDasharray: 100, strokeDashoffset: 100, animation: 'drawCheck 0.4s ease-out 0.3s forwards' }}>
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              )}
            </div>
            
            {/* Ambient Glow */}
            <div style={{
              position: 'absolute', inset: 20, borderRadius: '50%',
              background: booking?.status === 'cancelled' ? 'var(--error)' : 'var(--success)',
              filter: 'blur(30px)', opacity: 0.2, zIndex: 0
            }} />
          </div>

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 6,
            padding: '6px 14px',
            background: 'rgba(255,117,31,0.05)',
            border: '1.5px solid rgba(255,117,31,0.18)',
            borderRadius: 100,
            marginBottom: 16
          }}>
            <Lock size={12} color="var(--accent)" />
            <span style={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.12em', color: 'var(--accent)' }}>
              Booking Confirmed
            </span>
          </div>

          <h1 style={{
            fontFamily: 'var(--font-heading)',
            fontSize: 'clamp(2rem, 5vw, 3rem)',
            fontWeight: 900,
            letterSpacing: '-0.03em',
            color: 'var(--text)',
            lineHeight: 1.1,
            marginBottom: 12
          }}>
            {booking?.status === 'cancelled' ? 'Booking Cancelled' : 'Order Successfully Placed'}
          </h1>
          <p style={{
            color: 'var(--text-secondary)',
            fontSize: 'clamp(14px, 2vw, 16px)',
            maxWidth: 600,
            margin: '0 auto',
            lineHeight: 1.6,
            fontWeight: 500
          }}>
            {booking?.status === 'cancelled'
              ? 'This service request was successfully cancelled. Refund status will be communicated via email.'
              : 'Your booking has been successfully received. We are currently assigning a certified professional.'
            }
          </p>
        </div>

        {/* Double-Column Grid */}
        <div className="page-layout-sidebar">

          {/* LEFT COLUMN: Main Tracking Stepper & Security Trust Card */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Live Status Stepper Card */}
            <div style={{
              background: 'var(--glass-bg)',
              border: '1px solid var(--glass-border)',
              borderRadius: 'var(--radius-2xl)',
              padding: '36px 32px',
              backdropFilter: 'blur(30px)',
              WebkitBackdropFilter: 'blur(30px)',
              boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)'
            }}>
              <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                marginBottom: 32,
                borderBottom: '1px solid rgba(255,255,255,0.06)',
                paddingBottom: 20
              }}>
                <div>
                  <h3 style={{
                    fontFamily: 'var(--font-heading)',
                    fontSize: '1.25rem',
                    fontWeight: 800,
                    letterSpacing: '-0.01em',
                    color: 'var(--text)'
                  }}>Live Progress Tracker</h3>
                  <p style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>Real-time updates via secure synchronization</p>
                </div>
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  padding: '6px 14px',
                  position: 'relative'
                }}>
                  {/* Animated Background Box */}
                  <div style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'rgba(34,197,94,0.08)',
                    border: '1px solid rgba(34,197,94,0.18)',
                    borderRadius: 100,
                    animation: 'minimalistZoom 2s ease-in-out infinite'
                  }} />
                  <div style={{
                    width: 6,
                    height: 6,
                    borderRadius: '50%',
                    background: 'var(--success)',
                    boxShadow: '0 0 10px var(--success)',
                    animation: 'pulseGlow 2s infinite',
                    zIndex: 1
                  }} />
                  <span style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.04em', color: '#000', zIndex: 1, position: 'relative' }}>
                    Live Sync
                  </span>
                </div>
              </div>

              {/* Timeline Steps */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
                {timeline.map((step, i) => {
                  const isCompleted = step.status === 'completed';
                  const isActive = step.status === 'active';
                  const isCancelled = step.status === 'cancelled';

                  return (
                    <div key={i} style={{
                      display: 'flex',
                      gap: 24,
                      position: 'relative',
                      paddingBottom: i < timeline.length - 1 ? 32 : 0
                    }}>
                      {/* Connection Line */}
                      {i < timeline.length - 1 && (
                        <div style={{
                          position: 'absolute',
                          top: 24,
                          left: 11,
                          width: 2,
                          height: 'calc(100% - 16px)',
                          background: isCompleted
                            ? 'linear-gradient(180deg, var(--success) 0%, rgba(34,197,94,0.2) 100%)'
                            : 'rgba(255,255,255,0.05)',
                          backgroundSize: '200% 200%',
                          animation: isCompleted ? 'shimmer 2s infinite linear' : 'none',
                          borderRadius: 2
                        }} />
                      )}

                      {/* Stepper Node Ring */}
                      <div style={{
                        width: 24,
                        height: 24,
                        borderRadius: '50%',
                        flexShrink: 0,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        zIndex: 2,
                        position: 'relative',
                        marginTop: 2,
                        background: isCompleted
                          ? 'var(--success)'
                          : isCancelled
                            ? '#ef4444'
                            : isActive
                              ? 'var(--accent)'
                              : '#121212',
                        border: isCompleted
                          ? 'none'
                          : isCancelled
                            ? 'none'
                            : isActive
                              ? 'none'
                              : '2.5px solid rgba(255,255,255,0.08)',
                        boxShadow: isActive
                          ? '0 0 15px rgba(255,117,31,0.4), inset 0 0 6px rgba(255,255,255,0.3)'
                          : isCompleted
                            ? '0 0 10px rgba(34,197,94,0.2)'
                            : 'none'
                      }}>
                        {isCompleted && <Check size={14} color="#000000" strokeWidth={3} />}
                        {isCancelled && <X size={14} color="#ffffff" strokeWidth={3} />}
                        {isActive && (
                          <div style={{
                            width: 8,
                            height: 8,
                            borderRadius: '50%',
                            background: '#ffffff',
                            boxShadow: '0 0 4px rgba(255,255,255,0.8)'
                          }} />
                        )}
                      </div>

                      {/* Stepper Details */}
                      <div style={{ marginTop: 2 }}>
                        <h4 style={{
                          fontSize: 15,
                          fontWeight: 700,
                          color: isActive
                            ? 'var(--text)'
                            : isCompleted
                              ? 'var(--text-secondary)'
                              : 'var(--text-muted)',
                          transition: 'color 0.3s ease'
                        }}>
                          {step.title}
                        </h4>
                        <p style={{
                          fontSize: 12.5,
                          color: isActive
                            ? 'var(--text-secondary)'
                            : 'var(--text-tertiary)',
                          marginTop: 4,
                          lineHeight: 1.5,
                          transition: 'color 0.3s ease'
                        }}>
                          {step.desc}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Safety & Protocol Shield Card */}
            <div style={{
              background: 'linear-gradient(135deg, rgba(255,117,31,0.03) 0%, rgba(255,117,31,0) 100%), var(--glass-bg)',
              border: '1px solid rgba(255,117,31,0.12)',
              borderRadius: 'var(--radius-xl)',
              padding: 28,
              backdropFilter: 'blur(20px)',
              display: 'flex',
              gap: 20,
              alignItems: 'flex-start',
              boxShadow: '0 10px 30px rgba(0,0,0,0.2)'
            }}>
              <div style={{
                background: 'rgba(255,117,31,0.08)',
                border: '1.5px solid rgba(255,117,31,0.2)',
                borderRadius: 16,
                padding: 12,
                color: 'var(--accent)',
                flexShrink: 0
              }}>
                <Shield size={24} />
              </div>
              <div style={{ flex: 1 }}>
                <h4 style={{
                  fontSize: 14.5,
                  fontWeight: 800,
                  color: 'var(--text)',
                  marginBottom: 6,
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6
                }}>
                  Transparent Pricing Guarantee
                </h4>
                <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                  We guarantee completely transparent rates. All pricing calculations are locked and verified directly against our database to eliminate hidden fees.
                </p>
              </div>
            </div>

          </div>

          {/* RIGHT COLUMN: Summary Card, assigned Provider, Actions Hub */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }}>

            {/* Booking Summary Glass Card */}
            {booking && (
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-2xl)',
                padding: 32,
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 20px 50px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.03)'
              }}>
                <h3 style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '1.15rem',
                  fontWeight: 800,
                  marginBottom: 24,
                  borderBottom: '1px solid rgba(255,255,255,0.06)',
                  paddingBottom: 16,
                  color: 'var(--text)'
                }}>Service Summary</h3>

                {/* Details List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[
                    { icon: <Info size={16} />, label: 'Booking Number', value: `#${booking.booking_number}` },
                    { icon: <Tag size={16} />, label: 'Requested Service', value: formatServiceNames(booking.booking_items) },
                    { icon: <CreditCard size={16} />, label: 'Net Payable', value: formatPrice(booking.total), color: 'var(--accent)', weight: '800' },
                    { icon: <CreditCard size={16} />, label: 'Payment Channel', value: booking.payment_method || 'Pay After Service' },
                    { icon: <Calendar size={16} />, label: 'Scheduled Time', value: `${new Date(booking.scheduled_date).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })} at ${booking.scheduled_time}` },
                    { icon: <MapPin size={16} />, label: 'Service Venue', value: booking.address || '—', block: true }
                  ].map((row, idx) => (
                    <div key={idx} style={{
                      display: 'flex',
                      flexDirection: row.block ? 'column' : 'row',
                      justifyContent: row.block ? 'flex-start' : 'space-between',
                      alignItems: row.block ? 'flex-start' : 'center',
                      gap: row.block ? 8 : 12,
                      fontSize: 13.5
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, color: 'var(--text-tertiary)' }}>
                        {row.icon}
                        <span>{row.label}</span>
                      </div>
                      <span style={{
                        fontWeight: row.weight ? (row.weight as any) : 600,
                        color: row.color || 'var(--text)',
                        textAlign: row.block ? 'left' : 'right',
                        maxWidth: row.block ? '100%' : '60%',
                        lineHeight: 1.4
                      }} className="no-scrollbar">
                        {row.value}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Secure OTP Area */}
                {booking && booking.status !== 'cancelled' && (
                  <div style={{
                    marginTop: 28,
                    padding: '20px 24px',
                    background: 'rgba(255, 117, 31, 0.03)',
                    border: '1.5px dashed var(--border-accent)',
                    borderRadius: 18,
                    display: 'flex',
                    flexDirection: 'column',
                    gap: 12
                  }}>
                    <div style={{ display: 'flex', justifySelf: 'start', gap: 8, alignItems: 'center' }}>
                      <Lock size={16} color="var(--accent)" />
                      <span style={{ fontSize: 11, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--accent)' }}>
                        Handshake PIN
                      </span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: 12.5, color: 'var(--text-secondary)', fontWeight: 500 }}>Completion OTP:</span>
                      <div style={{
                        background: 'linear-gradient(135deg, rgba(255,117,31,0.12) 0%, rgba(255,117,31,0.04) 100%)',
                        border: '1px solid var(--accent-border)',
                        borderRadius: 10,
                        padding: '6px 16px',
                        fontSize: 18,
                        fontWeight: 900,
                        letterSpacing: '0.15em',
                        color: 'var(--accent)',
                        boxShadow: '0 0 15px rgba(255,117,31,0.1)'
                      }}>
                        {booking.completion_otp || '—'}
                      </div>
                    </div>
                    <p style={{ fontSize: 11.5, color: 'var(--text-tertiary)', lineHeight: 1.5, marginTop: 4 }}>
                      <strong style={{ color: 'var(--accent)' }}>Crucial:</strong> Provide this OTP code to the service professional ONLY after the service has been fully completed.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Assigned Provider Profile Widget */}
            {booking && booking.status !== 'cancelled' && (
              <div style={{
                background: 'var(--glass-bg)',
                border: '1px solid var(--glass-border)',
                borderRadius: 'var(--radius-xl)',
                padding: 24,
                backdropFilter: 'blur(30px)',
                WebkitBackdropFilter: 'blur(30px)',
                boxShadow: '0 15px 35px rgba(0,0,0,0.2)'
              }}>
                <h4 style={{
                  fontSize: 13,
                  fontWeight: 800,
                  color: 'var(--text-secondary)',
                  textTransform: 'uppercase',
                  letterSpacing: '0.08em',
                  marginBottom: 18
                }}>Assigned Service Specialist</h4>

                {booking.professional_id ? (
                  <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
                    {/* Specialty avatar slot */}
                    <div style={{
                      width: 52,
                      height: 52,
                      borderRadius: 14,
                      background: 'linear-gradient(135deg, rgba(255,117,31,0.12) 0%, rgba(255,117,31,0.03) 100%)',
                      border: '1.5px solid var(--border-accent)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      color: 'var(--accent)',
                      boxShadow: '0 0 10px rgba(255,117,31,0.08)'
                    }}>
                      {provider?.profiles?.avatar_url ? (
                        <img
                          src={provider.profiles.avatar_url}
                          alt="Specialist Avatar"
                          style={{ width: '100%', height: '100%', borderRadius: 12, objectFit: 'cover' }}
                        />
                      ) : (
                        <User size={22} />
                      )}
                    </div>
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)' }}>
                        {provider?.profiles?.full_name || 'Expert Technician'}
                      </h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginTop: 4 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, color: 'var(--warning)' }}>
                          <Star size={13} fill="currentColor" />
                          <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-secondary)' }}>4.9</span>
                        </div>
                        <div style={{ width: 1.5, height: 10, background: 'rgba(255,255,255,0.08)' }} />
                        <span style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 600 }}>Verified Expert</span>
                      </div>
                    </div>
                    {/* Quick Call */}
                    {(provider?.profiles?.phone || provider?.phone) && (
                      <a
                        href={`tel:${provider.profiles?.phone || provider.phone}`}
                        style={{
                          width: 40,
                          height: 40,
                          borderRadius: 12,
                          background: 'rgba(255,255,255,0.02)',
                          border: '1px solid var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          color: 'var(--text-secondary)',
                          transition: 'all 0.2s ease'
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.color = 'var(--accent)';
                          e.currentTarget.style.borderColor = 'var(--accent)';
                          e.currentTarget.style.background = 'var(--accent-light)';
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.color = 'var(--text-secondary)';
                          e.currentTarget.style.borderColor = 'var(--border)';
                          e.currentTarget.style.background = 'rgba(255,255,255,0.02)';
                        }}
                      >
                        <Phone size={16} />
                      </a>
                    )}
                  </div>
                ) : (
                  <div style={{ display: 'flex', gap: 12, alignItems: 'center', color: 'var(--text-tertiary)' }}>
                    <div style={{
                      width: 8,
                      height: 8,
                      borderRadius: '50%',
                      background: 'var(--accent)',
                      boxShadow: '0 0 10px var(--accent)',
                      animation: 'pulseGlow 2.5s infinite'
                    }} />
                    <p style={{ fontSize: 13, fontWeight: 500 }}>Assigning best professional..</p>
                  </div>
                )}
              </div>
            )}

            {/* Navigation and Execution Hub */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Receipt trigger */}
              {booking && (
                <button
                  className="btn btn-primary"
                  onClick={handleDownloadInvoice}
                  style={{ width: '100%', height: 52, borderRadius: 16, fontSize: 14, fontWeight: 800 }}
                >
                  <Download size={18} />
                  Download Invoice Receipt
                </button>
              )}

              {/* Chat trigger */}
              {booking?.professional_id && booking.status !== 'completed' && booking.status !== 'cancelled' && (
                <button
                  className="btn btn-secondary"
                  onClick={() => setChatOpen(true)}
                  style={{ width: '100%', height: 52, borderRadius: 16, fontSize: 14, fontWeight: 800 }}
                >
                  <MessageCircle size={18} />
                  Chat With Professional
                </button>
              )}

              {/* Cancel execution */}
              {booking && (booking.status === 'pending' || booking.status === 'confirmed') && (
                <button
                  className="btn btn-secondary"
                  onClick={() => {
                    const allowed = canCancel();
                    if (allowed) {
                      setShowCancelModal(true);
                    } else {
                      try {
                        const timeStr = (booking.scheduled_time || "").toUpperCase().trim();
                        const timeMatch = timeStr.match(/(\d+):(\d+)/);
                        let h = timeMatch ? parseInt(timeMatch[1]) : 0;
                        let m = timeMatch ? parseInt(timeMatch[2]) : 0;
                        if (timeStr.includes('PM') && h !== 12) h += 12;
                        if (timeStr.includes('AM') && h === 12) h = 0;
                        const datePart = booking.scheduled_date.split('T')[0];
                        const [y, mon, d] = datePart.split('-').map(Number);
                        const sched = new Date(y, mon - 1, d, h, m, 0);
                        const minsLeft = Math.round((sched.getTime() - Date.now()) / 60000);
                        toast.error('Cannot Cancel', `Policy: 45m min. System sees ${minsLeft}m left. Date: ${datePart} Time: ${h}:${m}`);
                      } catch {
                        toast.error('Cannot Cancel', 'Bookings can only be cancelled up to 45 minutes before the scheduled time.');
                      }
                    }
                  }}
                  style={{
                    width: '100%',
                    height: 52,
                    borderRadius: 16,
                    fontSize: 14,
                    fontWeight: 800,
                    color: '#ef4444',
                    borderColor: 'rgba(239,68,68,0.2)',
                    background: 'rgba(239,68,68,0.02)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.06)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.3)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(239,68,68,0.02)';
                    e.currentTarget.style.borderColor = 'rgba(239,68,68,0.2)';
                  }}
                >
                  Cancel Scheduled Service
                </button>
              )}

              {/* View bookings link */}
              <Link
                href="/profile?tab=bookings"
                className="btn btn-secondary"
                style={{ width: '100%', height: 52, borderRadius: 16, fontSize: 14, fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
              >
                View My Bookings
              </Link>

              {/* Home link */}
              <Link
                href="/"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: 8,
                  fontSize: 13.5,
                  fontWeight: 700,
                  color: 'var(--text-secondary)',
                  marginTop: 12,
                  transition: 'color 0.2s ease'
                }}
                onMouseEnter={(e) => e.currentTarget.style.color = '#ffffff'}
                onMouseLeave={(e) => e.currentTarget.style.color = 'var(--text-secondary)'}
              >
                <ArrowLeft size={16} />
                Return to Home
              </Link>

            </div>

          </div>

        </div>

        {/* Cancel Modal */}
        {showCancelModal && (
          <div style={{
            position: 'fixed',
            inset: 0,
            zIndex: 9999,
            background: 'rgba(0,0,0,0.85)',
            backdropFilter: 'blur(16px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 24,
            textAlign: 'left'
          }}>
            <div style={{
              background: 'var(--bg-card-solid)',
              border: '1px solid rgba(255,255,255,0.06)',
              borderRadius: 28,
              padding: 40,
              maxWidth: 440,
              width: '100%',
              textAlign: 'center',
              boxShadow: '0 25px 60px rgba(0, 0, 0, 0.8)',
              animation: 'fadeInUp 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}>
              <div style={{
                width: 72,
                height: 72,
                borderRadius: '50%',
                background: 'rgba(239,68,68,0.08)',
                border: '1.5px solid rgba(239,68,68,0.2)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 24px',
                boxShadow: '0 0 20px rgba(239,68,68,0.1)'
              }}>
                <ShieldAlert size={36} color="#ef4444" />
              </div>
              <h3 style={{ fontSize: '1.45rem', fontWeight: 900, marginBottom: 12, color: 'var(--text)' }}>Cancel Booking?</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: 14, marginBottom: 20, lineHeight: 1.6 }}>
                This action is permanent and cannot be undone. Are you certain you want to cancel this scheduled service?
              </p>
              <div style={{ padding: '12px 16px', background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.12)', borderRadius: 14, marginBottom: 32 }}>
                <p style={{ fontSize: 12, color: '#ef4444', fontWeight: 700, lineHeight: 1.5 }}>
                  Notice: Cancellations are permitted strictly up to 45 minutes prior to the scheduled start time.
                </p>
              </div>
              <div style={{ display: 'flex', gap: 14 }}>
                <button
                  onClick={() => setShowCancelModal(false)}
                  className="btn btn-secondary"
                  style={{ flex: 1, height: 52, borderRadius: 16, fontWeight: 800, fontSize: 14 }}
                >
                  Keep Booking
                </button>
                <button
                  onClick={handleCancel}
                  disabled={cancelling}
                  style={{
                    flex: 1,
                    height: 52,
                    borderRadius: 16,
                    fontWeight: 800,
                    fontSize: 14,
                    background: '#ef4444',
                    color: '#fff',
                    border: 'none',
                    cursor: 'pointer',
                    opacity: cancelling ? 0.6 : 1,
                    boxShadow: '0 10px 20px rgba(239,68,68,0.2)'
                  }}
                >
                  {cancelling ? 'Cancelling...' : 'Yes, Cancel'}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Chat Modal */}
        {booking && user && (
          <ChatModal
            isOpen={chatOpen}
            onClose={() => setChatOpen(false)}
            bookingId={booking.id}
            userId={user.id}
            professional={{
              name: provider?.profiles?.full_name || 'Professional',
              avatar: provider?.profiles?.avatar_url,
              phone: provider?.profiles?.phone || provider?.phone
            }}
          />
        )}
      </div>
    </div>
  );
}

export default function ConfirmationPage() {
  return (
    <>
      <Navbar />
      <Suspense fallback={<div style={{ minHeight: '100vh', paddingTop: 'var(--navbar-h)' }} />}>
        <ConfirmationContent />
      </Suspense>
    </>
  );
}
