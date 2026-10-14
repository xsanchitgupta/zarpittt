'use client';
import { useState, useEffect, useCallback, useRef } from 'react';
import Link from 'next/link';
import StatsCard from '@/components/StatsCard';
import { useRealtimeAllBookings } from '@/lib/realtime';
import { formatPrice } from '@/lib/utils';
import Modal from '@/components/Modal';
import { IndianRupee, ClipboardList, Users, FolderOpen, Clock, RefreshCw, CheckCircle2, XCircle, Ticket, Activity, UserPlus, Bell } from 'lucide-react';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminDashboard() {
  const [notifications, setNotifications] = useState<{id: string, title: string, body: string, time: Date}[]>([]);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Handle New Booking Event
  const handleNewBooking = useCallback((booking: any) => {
    // 1. Play Sound
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }

    // 2. Add to Toasts
    const newNotif = {
      id: Math.random().toString(36).substr(2, 9),
      title: 'New Booking Received!',
      body: `Order #${booking.booking_number} for ₹${booking.total}`,
      time: new Date()
    };
    
    setNotifications(prev => [newNotif, ...prev].slice(0, 5));

    // 3. Remove toast after 5s
    setTimeout(() => {
      setNotifications(prev => prev.filter(n => n.id !== newNotif.id));
    }, 5000);
  }, []);

  const { bookings, loading } = useRealtimeAllBookings(handleNewBooking);
  const [userCount, setUserCount] = useState(0);
  const [serviceCount, setServiceCount] = useState(0);
  const [systemSettings, setSystemSettings] = useState<{key:string,value:string}[]>([]);
  const [revenueStats, setRevenueStats] = useState({
    totalRevenue: 0,
    todayRevenue: 0,
    todayBookings: 0,
    pending: 0,
    active: 0,
    completed: 0,
    totalStatsBookings: 0,
    revenueTrend: '0.0%',
    revenueTrendUp: true,
    bookingsTrend: '0.0%',
    bookingsTrendUp: true,
    usersTrend: '0.0%',
    usersTrendUp: true,
    todayRevenueTrend: 'No orders',
    todayRevenueTrendUp: false
  });
  
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('We are currently updating our systems to serve you better.');
  const [maintenanceEta, setMaintenanceEta] = useState('');

  useEffect(() => {
    // Create audio element for notifications
    audioRef.current = new Audio('https://assets.mixkit.co/active_storage/sfx/2869/2869-preview.mp3');
    
    let mounted = true;
    async function loadStats() {
      try {
        const res = await adminFetch('/api/admin/stats');
        if (res.ok) {
          const data = await res.json();
          if (mounted) {
            setUserCount(data.userCount);
            setServiceCount(data.serviceCount);
            setSystemSettings(data.settings);
            setRevenueStats(data.revenueStats);
          }
        }
      } catch (err) {
        console.error('Stats load error:', err);
      }
    }
    loadStats();
    return () => { mounted = false; };
  }, []);

  // Update stats when bookings change
  useEffect(() => {
    // In a real production app, we'd calculate these from the 'bookings' array 
    // to avoid extra API calls, or have a more granular stats API.
    // For now, we'll just refetch stats when bookings change.
    adminFetch('/api/admin/stats').then(r => r.json()).then(data => {
      setUserCount(data.userCount);
      setServiceCount(data.serviceCount);
      setRevenueStats(data.revenueStats);
    }).catch(() => {});
  }, [bookings.length]);

  const toggleMaintenance = async () => {
    const isMaintenance = systemSettings.find(s => s.key === 'maintenance_mode')?.value === 'true';
    if (!isMaintenance) {
      setShowMaintenanceModal(true);
    } else {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'system_settings', data: [{ key: 'maintenance_mode', value: 'false' }] })
      });
      const res = await adminFetch('/api/admin/settings');
      if (res.ok) { const d = await res.json(); if (d.system_settings) setSystemSettings(d.system_settings); }
    }
  };

  const confirmMaintenance = async () => {
    await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'system_settings',
        data: [
          { key: 'maintenance_mode', value: 'true' },
          { key: 'maintenance_reason', value: maintenanceReason },
          { key: 'maintenance_eta', value: maintenanceEta || '' }
        ]
      })
    });
    const res = await adminFetch('/api/admin/settings');
    if (res.ok) { const d = await res.json(); if (d.system_settings) setSystemSettings(d.system_settings); }
    setShowMaintenanceModal(false);
  };

  const {
    totalRevenue,
    todayRevenue,
    todayBookings,
    pending: pendingBookings,
    active: activeBookings,
    completed: completedBookings,
    totalStatsBookings,
    revenueTrend,
    revenueTrendUp,
    bookingsTrend,
    bookingsTrendUp,
    usersTrend,
    usersTrendUp,
    todayRevenueTrend,
    todayRevenueTrendUp
  } = revenueStats;

  return (
    <div style={{ position: 'relative', zIndex: 1 }}>
      {/* Toast Notifications */}
      <div className="admin-toast-container" style={{ position: 'fixed', top: 24, right: 24, zIndex: 9999, display: 'flex', flexDirection: 'column', gap: 12 }}>
        {notifications.map(n => (
          <div key={n.id} className="admin-glass-panel admin-toast" style={{ 
            width: 320, padding: '16px 20px', borderLeft: '4px solid var(--admin-accent)', 
            animation: 'toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1)',
            display: 'flex', gap: 16, alignItems: 'center', boxShadow: '0 12px 40px rgba(0,0,0,0.4)'
          }}>
            <div style={{ width: 40, height: 40, borderRadius: '50%', background: 'var(--admin-glass-active)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
              <Bell size={20} />
            </div>
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 700, fontSize: 14, color: 'var(--admin-text-primary)' }}>{n.title}</div>
              <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 2 }}>{n.body}</div>
            </div>
          </div>
        ))}
      </div>
 
      {/* Header */}
      <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 16, marginBottom: 40}}>
        <div>
          <button 
            onClick={toggleMaintenance}
            style={{ 
              display: 'inline-flex', alignItems: 'center', gap: 6, 
              background: systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true' ? 'rgba(239, 68, 68, 0.1)' : 'var(--admin-glass-active)', 
              padding: '6px 12px', borderRadius: 20, 
              color: systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true' ? '#ef4444' : 'var(--admin-text-primary)', 
              fontSize: 12, fontWeight: 600, marginBottom: 12, border: 'none', cursor: 'pointer', transition: 'all 0.2s' 
            }}
          >
            {systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true' ? (
              <><XCircle size={14} color="#ef4444" /> <span style={{letterSpacing: '-0.01em'}}>Site on Maintenance</span></>
            ) : (
              <><Activity size={14} color="#34c759" /> <span style={{letterSpacing: '-0.01em'}}>System Online</span></>
            )}
          </button>
          <h1 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'clamp(1.8rem, 5vw, 2.4rem)',fontWeight:800,letterSpacing:'-0.03em',lineHeight: 1, marginBottom:6, color: 'var(--admin-text-primary)'}}>Overview</h1>
          <p style={{color:'var(--admin-text-secondary)',fontSize:14, fontWeight: 500}}>Real-time metrics and administration.</p>
        </div>
      </div>
 
      {/* Stats Grid */}
      <div className="admin-stats-grid">
        <StatsCard icon={IndianRupee} label="Total Revenue" value={formatPrice(totalRevenue)} trend={revenueTrend} trendUp={revenueTrendUp} />
        <StatsCard icon={ClipboardList} label="Total Bookings" value={totalStatsBookings} trend={bookingsTrend} trendUp={bookingsTrendUp} />
        <StatsCard icon={Users} label="Total Users" value={userCount} trend={usersTrend} trendUp={usersTrendUp} />
        <StatsCard icon={FolderOpen} label="Active Services" value={serviceCount} />
        <StatsCard icon={IndianRupee} label="Today's Revenue" value={formatPrice(todayRevenue)} trend={todayRevenueTrend} trendUp={todayRevenueTrendUp} />
        <StatsCard icon={Clock} label="Pending" value={pendingBookings} />
        <StatsCard icon={RefreshCw} label="Active" value={activeBookings} />
        <StatsCard icon={CheckCircle2} label="Completed" value={completedBookings} />
      </div>
 
      {/* Main Content Area */}
      <div className="admin-dashboard-main-grid">
        
        {/* Recent Bookings */}
        <div className="admin-glass-panel" style={{overflow:'hidden', display: 'flex', flexDirection: 'column'}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'20px 24px',borderBottom:'1px solid var(--admin-divider)'}}>
            <h3 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'1.1rem',fontWeight:700, color: 'var(--admin-text-primary)'}}>Live Bookings</h3>
            <Link href="/admin/bookings" style={{fontSize:13,color:'var(--admin-accent)',fontWeight:700, padding: '6px 14px', background: 'var(--admin-glass-active)', borderRadius: 12, textDecoration: 'none', transition: 'all 0.2s'}}>View All</Link>
          </div>

          {loading ? (
            <div style={{padding:60,textAlign:'center',color:'var(--admin-text-secondary)'}}>
              <RefreshCw size={24} className="animate-spin" style={{margin: '0 auto 16px'}} />
              Syncing data...
            </div>
          ) : bookings.length === 0 ? (
            <div style={{padding:60,textAlign:'center',color:'var(--admin-text-secondary)'}}>No active bookings.</div>
          ) : (
            <div style={{maxHeight:600,overflow:'auto', padding: '12px 16px'}}>
              {bookings.slice(0, 10).map(b => (
                <div key={b.id} style={{display:'flex',alignItems:'center',gap:16,padding:'16px',borderRadius: 16, marginBottom: 8, transition:'all 0.2s ease', cursor: 'pointer'}}
                  onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-glass-active)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{
                    width:44,height:44,borderRadius:12,display:'flex',alignItems:'center',justifyContent:'center',flexShrink:0,
                    background: 'var(--admin-surface)',
                    color: b.status === 'pending' ? '#ff9500' : b.status === 'confirmed' ? 'var(--admin-accent)' : b.status === 'completed' ? '#34c759' : b.status === 'cancelled' ? '#ff3b30' : '#007aff',
                    border: `1px solid var(--admin-border)`
                  }}>
                    {b.status === 'pending' ? <Clock size={20} /> : b.status === 'confirmed' ? <CheckCircle2 size={20} /> : b.status === 'completed' ? <CheckCircle2 size={20} /> : b.status === 'cancelled' ? <XCircle size={20} /> : <RefreshCw size={20} />}
                  </div>
                  <div style={{flex:1,minWidth:0}}>
                    <div style={{fontSize:15,fontWeight:600, color: 'var(--admin-text-primary)', overflow:'hidden',textOverflow:'ellipsis',whiteSpace:'nowrap', marginBottom: 4}}>
                      #{b.booking_number}
                    </div>
                    <div style={{fontSize:13,color:'var(--admin-text-secondary)', display: 'flex', gap: 6, alignItems: 'center'}}>
                      <span>{(b as any).profile?.full_name || 'Customer'}</span>
                      <span style={{width: 3, height: 3, borderRadius: '50%', background: 'var(--admin-text-tertiary)'}}></span>
                      <span>{new Date(b.created_at).toLocaleString('en-IN', { dateStyle: 'short', timeStyle: 'short' })}</span>
                    </div>
                  </div>
                  <div style={{textAlign:'right'}}>
                    <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontWeight:700,fontSize:16, color: 'var(--admin-text-primary)'}}>{formatPrice(b.total)}</div>
                    <span style={{
                      fontSize:12,fontWeight:500,textTransform:'capitalize',
                      color: 'var(--admin-text-secondary)'
                    }}>{b.status}</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right Sidebar Tools */}
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          
          {/* Quick Actions */}
          <div className="admin-glass-panel" style={{padding:24}}>
            <h3 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'1.1rem',fontWeight:600,marginBottom:20, color: 'var(--admin-text-primary)'}}>Command Center</h3>
            <div style={{display:'flex',flexDirection:'column',gap:8}}>
              {[
                { icon: ClipboardList, label: 'Manage Bookings', href: '/admin/bookings' },
                { icon: FolderOpen, label: 'Add New Service', href: '/admin/services' },
                { icon: UserPlus, label: 'Manage Workers', href: '/admin/workers' },
                { icon: Ticket, label: 'Create Promo Offer', href: '/admin/offers' },
                { icon: Users, label: 'Manage User Roles', href: '/admin/users' },
              ].map(a => {
                const Icon = a.icon;
                return (
                <Link key={a.href} href={a.href} style={{
                  display:'flex',alignItems:'center',gap:16,padding:'14px 16px',
                  background: 'transparent', borderRadius:16,
                  transition:'all 0.2s',textDecoration:'none',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-glass-active)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; }}
                >
                  <div style={{width:36,height:36,borderRadius:10,background:'var(--admin-surface)',color:'var(--admin-text-primary)',display:'flex',alignItems:'center',justifyContent:'center', border: `1px solid var(--admin-border)`, boxShadow: 'var(--admin-shadow-sm)'}}><Icon size={18} /></div>
                  <span style={{fontSize:14,fontWeight:500, color: 'var(--admin-text-primary)'}}>{a.label}</span>
                  <span style={{marginLeft:'auto',color:'var(--admin-text-tertiary)',fontSize:16}}>›</span>
                </Link>
                )
              })}
            </div>
          </div>

          {/* Core Status */}
          <div className="admin-glass-panel" style={{padding:24}}>
            <h3 style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'1.1rem',fontWeight:600,marginBottom:20, color: 'var(--admin-text-primary)'}}>Operational Status</h3>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              {[
                { label: 'Completed', count: completedBookings, total: totalStatsBookings, color: '#34c759' },
                { label: 'Active', count: activeBookings, total: totalStatsBookings, color: '#007aff' },
                { label: 'Pending', count: pendingBookings, total: totalStatsBookings, color: '#ff9500' },
              ].map(s => (
                <div key={s.label}>
                  <div style={{display:'flex',justifyContent:'space-between',fontSize:13,marginBottom:8, fontWeight: 500}}>
                    <span style={{color:'var(--admin-text-secondary)'}}>{s.label}</span>
                    <span style={{color: 'var(--admin-text-primary)', fontWeight: 600}}>{s.count}</span>
                  </div>
                  <div style={{height:6,background:'var(--admin-glass-active)',borderRadius:3,overflow:'hidden'}}>
                    <div style={{height:'100%',width:`${s.total ? (s.count / s.total * 100) : 0}%`,background:s.color,borderRadius:3,transition:'width 1s cubic-bezier(0.2, 0.8, 0.2, 1)'}} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Enable Maintenance Mode" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Maintenance Reason</label>
            <textarea 
              className="admin-input" 
              value={maintenanceReason} 
              onChange={e => setMaintenanceReason(e.target.value)}
              placeholder="e.g. We are upgrading the servers."
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Estimated Live Time (Optional)</label>
            <input 
              className="admin-input" 
              value={maintenanceEta} 
              onChange={e => setMaintenanceEta(e.target.value)}
              placeholder="e.g. 2 Hours, 6:00 PM"
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowMaintenanceModal(false)} className="admin-btn" style={{ flex: 1, background: 'var(--admin-glass-active)', color: 'var(--admin-text-primary)' }}>Cancel</button>
            <button onClick={confirmMaintenance} className="admin-btn" style={{ flex: 1, background: 'var(--error)', color: '#fff', border: 'none' }}>Enable Maintenance</button>
          </div>
        </div>
      </Modal>

      <style jsx global>{`
        @keyframes toastIn {
          from { transform: translateX(100%) scale(0.9); opacity: 0; }
          to { transform: translateX(0) scale(1); opacity: 1; }
        }
        .animate-spin {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
