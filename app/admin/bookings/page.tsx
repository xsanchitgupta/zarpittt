'use client';
import { useState, useEffect } from 'react';
import { useRealtimeAllBookings } from '@/lib/realtime';
import { formatPrice } from '@/lib/utils';
import Modal from '@/components/Modal';

import type { BookingStatus } from '@/lib/database.types';
import { User, Phone, Mail, MapPin, Briefcase, Calendar, Info, ShieldAlert, XCircle, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import { adminFetch } from "@/lib/admin-fetch";

const statusColors: Record<string, string> = {
  pending: 'var(--warning)',
  scheduled: '#0ea5e9',
  confirmed: 'var(--accent)',
  en_route: '#8b5cf6',
  started: '#f59e0b',
  in_progress: '#3b82f6',
  completed: 'var(--success)',
  cancelled: 'var(--error)',
};

export default function AdminBookings() {
  const { bookings, loading, refetch } = useRealtimeAllBookings();
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortOrder, setSortOrder] = useState('newest');
  const [selectedBooking, setSelectedBooking] = useState<string | null>(null);
  const [visibleCount, setVisibleCount] = useState(30);
  const [itemSlide, setItemSlide] = useState(0);
  
  const [salariedWorkers, setSalariedWorkers] = useState<{id: string, name: string, phone: string}[]>([]);
  const [assigningId, setAssigningId] = useState<string>('');
  const [globalBuffer, setGlobalBuffer] = useState<number>(30);

  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await adminFetch('/api/admin/settings');
        if (res.ok) {
          const d = await res.json();
          const buf = d.system_settings?.find((s: any) => s.key === 'order_buffer_minutes');
          if (buf?.value) setGlobalBuffer(parseInt(buf.value, 10));
        }
      } catch (err) { console.warn('Settings fetch error:', err); }
    };
    fetchSettings();

    adminFetch('/api/admin/list-workers')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) {
          setSalariedWorkers(data.map(w => ({
            id: w.user_id,
            name: w.profile?.full_name || 'Worker',
            phone: w.profile?.phone || ''
          })));
        }
      });
  }, []);

  let filtered = bookings.filter(b => {
    if (statusFilter !== 'all' && b.status !== statusFilter) return false;
    if (search) {
      const q = search.toLowerCase();
      const profile = (b as any).profile;
      return b.booking_number.toLowerCase().includes(q) ||
        (profile?.full_name || '').toLowerCase().includes(q) ||
        (profile?.email || '').toLowerCase().includes(q) ||
        (profile?.phone || '').toLowerCase().includes(q);
    }
    return true;
  });

  filtered.sort((a, b) => {
    if (sortOrder === 'nearest') {
      const getTime = (bk: any) => {
        if (!bk.scheduled_date) return Infinity;
        const combined = new Date(`${bk.scheduled_date} ${bk.scheduled_time || '12:00 PM'}`).getTime();
        return isNaN(combined) ? Infinity : combined;
      };
      return getTime(a) - getTime(b);
    }
    if (sortOrder === 'order_time' || sortOrder === 'newest') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
    if (sortOrder === 'oldest') return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
    if (sortOrder === 'highest') return b.total - a.total;
    if (sortOrder === 'lowest') return a.total - b.total;
    return 0;
  });

  const updateStatus = async (bookingId: string, newStatus: BookingStatus) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    await adminFetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, status: newStatus })
    });

    // Create notification via API
    await adminFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        table: 'notifications',
        data: {
          user_id: booking.user_id,
          title: `Booking ${newStatus === 'completed' ? 'Completed ✅' : newStatus === 'cancelled' ? 'Cancelled ❌' : 'Updated 📋'}`,
          message: `Your booking #${booking.booking_number} status changed to ${newStatus}.`,
          type: 'booking',
          metadata: { booking_id: bookingId },
        }
      })
    });

    refetch();
  };

  const assignWorker = async (bookingId: string, workerId: string) => {
    if (!workerId) return;
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    await adminFetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, status: 'confirmed', professionalId: workerId })
    });

    refetch();
    setAssigningId('');
  };

  const unassignWorker = async (bookingId: string) => {
    const booking = bookings.find(b => b.id === bookingId);
    if (!booking) return;

    await adminFetch('/api/orders', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: bookingId, status: 'pending', professionalId: null })
    });
    refetch();
  };

  const deleteBooking = async (bookingId: string) => {
    if (!confirm('CRITICAL WARNING: Are you sure you want to PERMANENTLY DELETE this booking? This will delete all its items, payments, and logs. This action CANNOT be undone.')) {
      return;
    }

    try {
      const res = await adminFetch(`/api/orders?id=${bookingId}`, {
        method: 'DELETE'
      });
      if (res.ok) {
        setSelectedBooking(null);
        refetch();
      } else {
        const errData = await res.json();
        alert(`Error deleting booking: ${errData.error || 'Unknown error'}`);
      }
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    }
  };

  const detail = selectedBooking ? bookings.find(b => b.id === selectedBooking) : null;
  const detailProfile = detail ? (detail as any).profile : null;
  const detailWorker = detail ? salariedWorkers.find(w => w.id === String(detail.professional_id)) : null;

  return (
    <div>
      <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:32}}>
        <div>
          <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.8rem',fontWeight:700,marginBottom:4}}>Bookings</h1>
          <p style={{color:'var(--text-secondary)',fontSize:14}}>Manage and inspect all customer bookings.</p>
        </div>
        <div style={{display:'flex',gap:12,alignItems:'center'}}>
          <span style={{fontSize:13,color:'var(--text-muted)'}}>{filtered.length} bookings</span>
        </div>
      </div>

      {/* Filters */}
      <div style={{display:'flex',gap:12,marginBottom:24,flexWrap:'wrap'}}>
        <input className="admin-input" placeholder="Search by booking #, name, phone, email..." value={search} onChange={e => setSearch(e.target.value)} style={{maxWidth:320,padding:'10px 16px',fontSize:13}} />
        <select className="admin-input" value={statusFilter} onChange={e => setStatusFilter(e.target.value)} style={{width:'auto',padding:'10px 16px',fontSize:13}}>
          <option value="all">All Statuses</option>
          <option value="pending">Pending</option>
          <option value="scheduled">Scheduled</option>
          <option value="confirmed">Confirmed</option>
          <option value="en_route">En Route</option>
          <option value="started">Started</option>
          <option value="in_progress">In Progress</option>
          <option value="completed">Completed</option>
          <option value="cancelled">Cancelled</option>
        </select>
        <select className="admin-input" value={sortOrder} onChange={e => setSortOrder(e.target.value)} style={{width:'auto',padding:'10px 16px',fontSize:13}}>
          <option value="nearest">Nearest Time</option>
          <option value="order_time">Order Time (Booked)</option>
          <option value="newest">Newest First</option>
          <option value="oldest">Oldest First</option>
          <option value="highest">Highest Total</option>
          <option value="lowest">Lowest Total</option>
        </select>
      </div>

      {/* Table */}
      <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',overflow:'hidden',backdropFilter:'blur(20px)'}}>
        {loading ? (
          <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading bookings...</div>
        ) : filtered.length === 0 ? (
          <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>No bookings found</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead>
                <tr style={{borderBottom:'1px solid var(--border)'}}>
                  {['Booking #','Customer','Items','Total','Status','Date','Actions'].map(h => (
                    <th key={h} style={{padding:'14px 20px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.slice(0, visibleCount).map(b => {
                  const profile = (b as any).profile;
                  const assignedWorker = salariedWorkers.find(w => w.id === String(b.professional_id));
                  return (
                    <tr key={b.id} style={{borderBottom:'1px solid var(--border-light)',transition:'background 0.15s',cursor:'pointer'}}
                      onMouseEnter={e => { e.currentTarget.style.background = 'var(--glass-bg-hover)'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = ''; }}
                      onClick={() => setSelectedBooking(b.id)}
                    >
                      <td style={{padding:'14px 20px',fontWeight:600,color:'var(--accent)'}}>
                        #{b.booking_number}
                        {b.group_id && (
                          <div title={`Group ID: ${b.group_id}`} style={{display: 'inline-flex', alignItems: 'center', gap: 4, marginLeft: 8, padding: '2px 8px', background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', borderRadius: 99, fontSize: 10, fontWeight: 700, letterSpacing: '0.05em', verticalAlign: 'middle'}}>
                            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"></path><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"></path></svg>
                            {b.group_id.split('-')[0].toUpperCase()}
                          </div>
                        )}
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{fontWeight:500}}>{profile?.full_name || 'Unknown'}</div>
                        <div style={{fontSize:12,color:'var(--text-muted)'}}>{profile?.phone || profile?.email || ''}</div>
                      </td>
                      <td style={{padding:'14px 20px',color:'var(--text-secondary)'}}>
                        {b.booking_items?.length || 0} items
                      </td>
                      <td style={{padding:'14px 20px',fontWeight:600}}>{formatPrice(b.total)}</td>
                      <td style={{padding:'14px 20px'}}>
                        <div style={{
                          display: 'inline-flex', alignItems: 'center', gap: 6,
                          padding: '4px 10px', fontSize: 12, fontWeight: 700, borderRadius: 'var(--radius-sm)',
                          background: `color-mix(in srgb, ${statusColors[b.status] || '#888'} 15%, transparent)`,
                          color: statusColors[b.status] || '#888'
                        }}>
                          {b.status.replace('_', ' ').toUpperCase()}
                        </div>
                        {assignedWorker && <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4,fontWeight:600}}>Assigned: {assignedWorker.name}</div>}
                      </td>
                      <td style={{padding:'14px 20px',fontSize:13,color:'var(--text-muted)'}}>
                        {new Date(b.created_at).toLocaleDateString('en-IN')}
                      </td>
                      <td style={{padding:'14px 20px'}}>
                        <button onClick={(e) => { e.stopPropagation(); setSelectedBooking(b.id); setItemSlide(0); }} style={{fontSize:13,color:'var(--accent)',background:'var(--bg-input)',border:'1px solid var(--border-light)',padding:'6px 14px',borderRadius:'var(--radius-sm)',cursor:'pointer',fontWeight:600}}>Inspect</button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {visibleCount < filtered.length && (
              <div style={{padding: '20px', textAlign: 'center', borderTop: '1px solid var(--border-light)'}}>
                <button onClick={() => setVisibleCount(v => v + 30)} className="btn btn-secondary btn-sm">Load More</button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Booking Inspector Modal */}
      <Modal isOpen={!!detail} onClose={() => setSelectedBooking(null)} title={`Booking Inspector - #${detail?.booking_number || ''}`} width={750}>
        {detail && (
          <div style={{display:'flex',flexDirection:'column',gap:24,marginTop:10}}>
            
            {/* Top Stats */}
            <div className="admin-stats-card-group" style={{padding:'16px 20px',background:'var(--bg-input)',borderRadius:'var(--radius-lg)',border:'1px solid var(--border-light)', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))'}}>
              <div><label style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:4}}>Status</label><span style={{fontWeight:700,color:statusColors[detail.status],textTransform:'uppercase',fontSize:13}}>{detail.status.replace('_', ' ')}</span></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:4}}>Date Booked</label><span style={{fontSize:14,fontWeight:600}}>{new Date(detail.created_at).toLocaleDateString('en-IN')}</span></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:4}}>Schedule</label><span style={{fontSize:14,fontWeight:600}}>{detail.scheduled_date} @ {detail.scheduled_time}</span></div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:4}}>Total Time</label>
                <div style={{fontSize:14,fontWeight:600}}>{(detail.estimated_duration_minutes || 60) + globalBuffer}m</div>
                <div style={{fontSize:11,color:'var(--text-tertiary)',fontWeight:500}}>{detail.estimated_duration_minutes || 60}m + {globalBuffer}m buffer</div>
              </div>
              <div><label style={{fontSize:11,color:'var(--text-muted)',textTransform:'uppercase',fontWeight:700,display:'block',marginBottom:4}}>Total Amount</label><span style={{fontSize:16,fontWeight:800,color:'var(--accent)'}}>{formatPrice(detail.total)}</span></div>
            </div>

            <div className="admin-grid-2">
              {/* Customer Details */}
              <div>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><User size={16} style={{color:'var(--accent)'}}/> Customer Info</h3>
                <div style={{padding:'16px',background:'var(--surface)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',display:'flex',flexDirection:'column',gap:12}}>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <User size={14} style={{color:'var(--text-muted)'}}/><span style={{fontSize:14,fontWeight:600}}>{detailProfile?.full_name || 'N/A'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <Phone size={14} style={{color:'var(--text-muted)'}}/><span style={{fontSize:14,fontWeight:600}}>{detailProfile?.phone || 'N/A'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'center',gap:12}}>
                    <Mail size={14} style={{color:'var(--text-muted)'}}/><span style={{fontSize:14,color:'var(--text-secondary)'}}>{detailProfile?.email || 'N/A'}</span>
                  </div>
                  <div style={{display:'flex',alignItems:'flex-start',gap:12,borderTop:'1px solid var(--border-light)',paddingTop:12,marginTop:4}}>
                    <MapPin size={14} style={{color:'var(--text-muted)',flexShrink:0,marginTop:2}}/><span style={{fontSize:13,lineHeight:1.5,color:'var(--text-secondary)'}}>{detail.address}</span>
                  </div>
                </div>
              </div>

              {/* Assignment Details */}
              <div>
                <h3 style={{fontSize:15,fontWeight:700,marginBottom:12,display:'flex',alignItems:'center',gap:8}}><Briefcase size={16} style={{color:'var(--accent)'}}/> Worker Assignment</h3>
                <div style={{padding:'16px',background:'var(--surface)',borderRadius:'var(--radius-md)',border:'1px solid var(--border-light)',height:'calc(100% - 31px)',display:'flex',flexDirection:'column',justifyContent:'center'}}>
                  {detailWorker ? (
                    <div style={{display:'flex',flexDirection:'column',alignItems:'center',textAlign:'center',gap:8}}>
                      <div style={{width:48,height:48,borderRadius:'50%',background:'var(--accent-light)',color:'var(--accent)',display:'grid',placeItems:'center',marginBottom:4}}><Briefcase size={20}/></div>
                      <div style={{fontSize:16,fontWeight:700}}>{detailWorker.name}</div>
                      <div style={{fontSize:13,color:'var(--text-muted)',marginBottom:12}}><Phone size={12} style={{display:'inline',marginRight:4}}/>{detailWorker.phone || 'No phone'}</div>
                      <button onClick={() => unassignWorker(detail.id)} className="btn btn-secondary btn-sm" style={{width:'100%',color:'var(--error)',borderColor:'var(--error)'}}>Unassign Worker</button>
                    </div>
                  ) : (
                    <div style={{display:'flex',flexDirection:'column',gap:12}}>
                      <div style={{fontSize:13,color:'var(--text-muted)',textAlign:'center',marginBottom:4}}><Info size={16} style={{display:'inline',marginRight:6,verticalAlign:'middle'}}/>No worker assigned yet.</div>
                      <select className="admin-input" value={assigningId} onChange={e => setAssigningId(e.target.value)} style={{fontSize:13}}>
                        <option value="">-- Select Salaried Worker --</option>
                        {salariedWorkers.map(w => (
                          <option key={w.id} value={w.id}>{w.name}</option>
                        ))}
                      </select>
                      <button onClick={() => assignWorker(detail.id, assigningId)} disabled={!assigningId} className="btn btn-primary btn-sm" style={{width:'100%'}}>Assign to Selected Worker</button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Service Items — Detailed */}
            <div>
              <h3 style={{fontSize:15,fontWeight:700,marginBottom:12}}>Service Items ({detail.booking_items?.length || 0})</h3>
              <div style={{display:'flex',flexDirection:'column',gap:12}}>
                {(() => {
                  const groupedItems = detail.booking_items?.reduce((acc: any, item: any) => {
                    const existing = acc.find((i: any) => i.service_name === item.service_name);
                    if (existing) {
                      existing.quantity += item.quantity || 1;
                      existing.total_price = (existing.total_price || (existing.unit_price * existing.quantity)) + (item.unit_price * (item.quantity || 1));
                    } else {
                      acc.push({ ...item, quantity: item.quantity || 1, total_price: item.unit_price * (item.quantity || 1) });
                    }
                    return acc;
                  }, []) || [];

                  if (groupedItems.length === 0) return <div style={{fontSize:13,color:'var(--text-muted)'}}>No items found.</div>;

                  const currentIdx = Math.min(itemSlide, Math.max(0, groupedItems.length - 1));
                  const item = groupedItems[currentIdx];

                  return (
                    <div style={{border:'1px solid var(--border-light)',borderRadius:'var(--radius-lg)',overflow:'hidden'}}>
                      {/* Item Header */}
                      <div style={{display:'flex',justifyContent:'space-between',alignItems:'center',padding:'14px 16px',background:'var(--surface)',borderBottom:'1px solid var(--border-light)'}}>
                        <div style={{flex:1}}>
                          <div style={{fontSize:15,fontWeight:700,marginBottom:2}}>{item.service_name}</div>
                          <div style={{display:'flex',gap:12,fontSize:12,color:'var(--text-muted)'}}>
                            {item.service?.categories?.name && <span>📁 {item.service.categories.name}</span>}
                            <span>⏱ {item.service?.duration || '1 hr'}</span>
                            <span>× {item.quantity}</span>
                          </div>
                        </div>
                        <span style={{fontWeight:700,fontSize:15}}>{formatPrice(item.total_price)}</span>
                      </div>

                      {/* Item Details — Do's (Included) & Don'ts (Not Included) */}
                      {((item.service?.included && item.service.included.length > 0) || 
                        (item.service?.not_included && item.service.not_included.length > 0)) && (
                        <div className="admin-items-grid" style={{padding:'12px 16px'}}>
                          {/* Do's (Included) */}
                          {item.service?.included && item.service.included.length > 0 && (
                            <div>
                              <div style={{fontSize:11,fontWeight:700,color:'var(--success)',textTransform:'uppercase',marginBottom:6,letterSpacing:'0.04em'}}>✓ Do&apos;s (Included)</div>
                              {item.service.included.map((s: string, i: number) => (
                                <div key={i} style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,display:'flex',gap:6}}>
                                  <span style={{color:'var(--success)',flexShrink:0}}>•</span>{s}
                                </div>
                              ))}
                            </div>
                          )}
                          {/* Don'ts (Not Included) */}
                          {item.service?.not_included && item.service.not_included.length > 0 && (
                            <div>
                              <div style={{fontSize:11,fontWeight:700,color:'var(--error)',textTransform:'uppercase',marginBottom:6,letterSpacing:'0.04em'}}>✕ Don&apos;ts (Not Included)</div>
                              {item.service.not_included.map((s: string, i: number) => (
                                <div key={i} style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.6,display:'flex',gap:6}}>
                                  <span style={{color:'var(--error)',flexShrink:0}}>•</span>{s}
                                </div>
                              ))}
                            </div>
                          )}
                        </div>
                      )}

                      {/* Carousel Controls */}
                      {groupedItems.length > 1 && (
                        <div style={{display:'flex', alignItems:'center', justifyContent:'space-between', padding:'12px 16px', borderTop:'1px solid var(--border-light)', background:'var(--bg-input)'}}>
                          <button 
                            onClick={() => setItemSlide(s => Math.max(0, s - 1))} 
                            disabled={currentIdx === 0} 
                            className="btn btn-ghost btn-sm" 
                            style={{padding:'6px 12px', opacity: currentIdx === 0 ? 0.4 : 1}}
                          >
                            <ChevronLeft size={18} />
                          </button>
                          
                          <div style={{display:'flex', alignItems:'center', gap:6}}>
                            {groupedItems.map((_: any, i: number) => (
                              <div key={i} style={{width: i === currentIdx ? 16 : 6, height: 6, borderRadius:999, background: i === currentIdx ? 'var(--accent)' : 'var(--border)', transition: 'all 0.2s'}} />
                            ))}
                          </div>
                          
                          <button 
                            onClick={() => setItemSlide(s => Math.min(groupedItems.length - 1, s + 1))} 
                            disabled={currentIdx === groupedItems.length - 1} 
                            className="btn btn-ghost btn-sm" 
                            style={{padding:'6px 12px', opacity: currentIdx === groupedItems.length - 1 ? 0.4 : 1}}
                          >
                            <ChevronRight size={18} />
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>
            </div>
            
            {detail.special_instructions && (
              <div style={{padding:'12px 16px',background:'var(--warning-bg)',borderRadius:'var(--radius-md)',border:'1px solid rgba(245, 158, 11, 0.2)',display:'flex',gap:12,alignItems:'flex-start'}}>
                <ShieldAlert size={16} style={{color:'var(--warning)',marginTop:2}}/>
                <div>
                  <div style={{fontSize:12,fontWeight:700,color:'var(--warning)',textTransform:'uppercase',marginBottom:4}}>Special Instructions</div>
                  <div style={{fontSize:13,color:'var(--text-secondary)'}}>{detail.special_instructions}</div>
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="admin-actions-group" style={{display:'flex',flexDirection:'column',gap:12}}>
              <div style={{display:'flex',gap:8, flexWrap: 'wrap', width: '100%'}}>
                {(['confirmed', 'started', 'completed'] as BookingStatus[]).filter(s => s !== detail.status).map(s => (
                  <button key={s} className="admin-btn" style={{flex: 1, minWidth: '120px', textTransform:'capitalize',fontSize:13,padding:'8px 16px', background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border)', color: 'var(--admin-text-primary)'}} onClick={() => { updateStatus(detail.id, s); }}>
                    Mark {s}
                  </button>
                ))}
              </div>
              
              <div style={{display:'flex',gap:8,width:'100%'}}>
                {detail.status !== 'cancelled' && detail.status !== 'completed' && (
                  <button className="admin-btn" style={{background:'var(--error-bg)',color:'var(--error)',border:'1px solid rgba(239, 68, 68, 0.2)',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6,flex:1}} onClick={() => { if(confirm('Are you sure you want to cancel this booking?')) { updateStatus(detail.id, 'cancelled'); } }}>
                    <XCircle size={16}/> Cancel Booking
                  </button>
                )}
                
                <button className="admin-btn" style={{background:'rgba(239, 68, 68, 0.05)',color:'var(--error)',border:'1px solid rgba(239, 68, 68, 0.3)',fontSize:13,fontWeight:700,display:'flex',alignItems:'center',justifyContent:'center',gap:6,flex:1}} onClick={() => deleteBooking(detail.id)}>
                  <Trash2 size={16}/> Delete Booking
                </button>
              </div>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}

