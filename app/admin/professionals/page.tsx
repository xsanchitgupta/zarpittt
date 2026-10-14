'use client';
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { Briefcase, CheckCircle, XCircle, Star, Clock, MapPin, ExternalLink, ShieldCheck, CalendarDays } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import Modal from '@/components/Modal';
import type { ProviderProfile, Profile } from '@/lib/database.types';
import Link from 'next/link';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminProfessionals() {
  const [pros, setPros] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Inspector State
  const [selectedProId, setSelectedProId] = useState<string | null>(null);
  const [scheduleDate, setScheduleDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [scheduleData, setScheduleData] = useState<any>(null);
  const [scheduleLoading, setScheduleLoading] = useState(false);

  const fetchPros = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/list-professionals');
      if (res.ok) {
        const data = await res.json();
        setPros(data);
      }
    } catch (err) {
      console.error('Fetch pros error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPros();
  }, []);

  useEffect(() => {
    if (!selectedProId) return;
    const fetchSchedule = async () => {
      setScheduleLoading(true);
      try {
        const res = await adminFetch(`/api/admin/professional-schedule?worker_id=${selectedProId}&date=${scheduleDate}`);
        if (res.ok) {
          const data = await res.json();
          setScheduleData(data);
        } else {
          setScheduleData(null);
        }
      } catch (e) {
        console.error(e);
        setScheduleData(null);
      }
      setScheduleLoading(false);
    };
    fetchSchedule();
  }, [selectedProId, scheduleDate]);

  const toggleStatus = async (userId: string, currentStatus: string) => {
    const nextStatus = currentStatus === 'approved' ? 'suspended' : 'approved';
    try {
      const res = await adminFetch('/api/admin/update-provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verification_status: nextStatus })
      });
      
      if (res.ok) {
        setPros(prev => prev.map(p => p.user_id === userId ? { ...p, verification_status: nextStatus as any } : p));
        toast.success('Status Updated', `Professional is now ${nextStatus}`);
      } else {
        const err = await res.json();
        toast.error('Failed to update status', err.error);
      }
    } catch (err: any) {
      toast.error('Failed to update status', err.message);
    }
  };

  return (
    <div style={{animation: 'fadeIn 0.5s ease-out'}}>
      <ToastContainer />
      
      <div style={{marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end'}}>
        <div>
          <h1 style={{fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--admin-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16}}>
            <div style={{padding: 12, background: 'var(--admin-accent-soft)', borderRadius: 16, color: 'var(--admin-accent)'}}>
              <Briefcase size={32} />
            </div>
            Professionals
          </h1>
          <p style={{color: 'var(--admin-text-secondary)', fontSize: 16, fontWeight: 500}}>
            Manage and monitor your service provider fleet.
          </p>
        </div>
        <Link href="/admin/kyc" className="admin-btn admin-btn-primary">
          <ShieldCheck size={18} /> Review Pending KYC
        </Link>
      </div>

      {loading ? (
        <div style={{padding: 100, textAlign: 'center'}}>
          <div className="spinner" style={{margin: '0 auto 16px', width: 40, height: 40, border: '3px solid var(--admin-accent-soft)', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
          <p style={{color: 'var(--admin-text-tertiary)', fontWeight: 600}}>Loading professionals...</p>
        </div>
      ) : pros.length === 0 ? (
        <div className="admin-glass-panel" style={{padding: 80, textAlign: 'center'}}>
          <div style={{fontSize: 48, marginBottom: 16}}>👷</div>
          <h3 style={{fontSize: 20, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 8}}>No Professionals Yet</h3>
          <p style={{color: 'var(--admin-text-secondary)'}}>Service providers will appear here once they register.</p>
        </div>
      ) : (
        <div style={{display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(380px, 1fr))', gap: 24}}>
          {pros.map(p => (
            <div key={p.id} className="admin-glass-panel" style={{padding: 24, display: 'flex', flexDirection: 'column', gap: 20}}>
              {/* Top Section */}
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{position: 'relative'}}>
                  <div style={{width: 64, height: 64, borderRadius: 20, background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 24, border: '1px solid var(--admin-border)'}}>
                    {(p.profile?.full_name || 'P')[0].toUpperCase()}
                  </div>
                  <div style={{
                    position: 'absolute', bottom: -4, right: -4, width: 20, height: 20, borderRadius: '50%', 
                    background: p.is_online ? '#22c55e' : 'var(--admin-text-tertiary)',
                    border: '3px solid var(--admin-surface)',
                    boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
                  }} title={p.is_online ? 'Online' : 'Offline'} />
                </div>
                <div style={{flex: 1}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 8}}>
                    <h3 style={{fontSize: 18, fontWeight: 700, color: 'var(--admin-text-primary)'}}>{p.profile?.full_name || 'Anonymous'}</h3>
                    {p.verification_status === 'approved' && <CheckCircle size={16} color="#22c55e" fill="rgba(34, 197, 94, 0.1)" />}
                  </div>
                  <p style={{fontSize: 14, color: 'var(--admin-text-secondary)', fontWeight: 500, display: 'flex', alignItems: 'center', gap: 6}}>
                    <Star size={14} color="#f59e0b" fill="#f59e0b" /> {p.rating && Number(p.rating) > 0 ? Number(p.rating).toFixed(1) : '0.0'} • {p.experience_years} Years Experience
                  </p>
                </div>
              </div>
              
              {/* Services Tags */}
              <div style={{display: 'flex', flexWrap: 'wrap', gap: 8}}>
                {(p.service_names || []).slice(0, 3).map((s: string) => (
                  <span key={s} style={{padding: '4px 10px', background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border-light)', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)'}}>
                    {s}
                  </span>
                ))}
                {(p.service_names || []).length > 3 && (
                  <span style={{fontSize: 12, color: 'var(--admin-text-tertiary)', fontWeight: 600, padding: '4px 0'}}>+{(p.service_names || []).length - 3} more</span>
                )}
              </div>

              {/* Stats Grid */}
              <div style={{display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12}}>
                <div style={{padding: 12, background: 'var(--admin-bg)', borderRadius: 12, border: '1px solid var(--admin-border-light)'}}>
                  <div style={{fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', marginBottom: 4}}>Total Jobs</div>
                  <div style={{fontSize: 18, fontWeight: 800, color: 'var(--admin-text-primary)'}}>{p.stats?.total_jobs || 0}</div>
                </div>
                <div style={{padding: 12, background: 'var(--admin-bg)', borderRadius: 12, border: '1px solid var(--admin-border-light)'}}>
                  <div style={{fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', marginBottom: 4}}>Assigned</div>
                  <div style={{fontSize: 18, fontWeight: 800, color: 'var(--admin-text-primary)'}}>{p.stats?.assigned_jobs || 0}</div>
                </div>
                <div style={{padding: 12, background: 'var(--admin-bg)', borderRadius: 12, border: '1px solid var(--admin-border-light)'}}>
                  <div style={{fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', marginBottom: 4}}>Earnings</div>
                  <div style={{fontSize: 18, fontWeight: 800, color: 'var(--admin-text-primary)'}}>₹{(p.stats?.earnings || 0).toLocaleString()}</div>
                </div>
              </div>

              {/* Footer Actions */}
              <div style={{marginTop: 'auto', paddingTop: 16, borderTop: '1px solid var(--admin-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                <div style={{display: 'flex', flexDirection: 'column', gap: 2}}>
                  <span style={{fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase'}}>Account Status</span>
                  <span style={{fontSize: 13, fontWeight: 700, color: p.verification_status === 'approved' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize'}}>
                    {p.verification_status}
                  </span>
                </div>
                <div style={{display: 'flex', gap: 8}}>
                  <button onClick={() => setSelectedProId(p.user_id)} className="admin-btn" style={{padding: '8px 12px', fontSize: 12, background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border)'}}>
                    <CalendarDays size={14} /> Schedule
                  </button>
                  <Link href={`/admin/kyc?user=${p.user_id}`} className="admin-btn" style={{padding: '8px 12px', fontSize: 12, background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border)'}}>
                    <ShieldCheck size={14} /> Documents
                  </Link>
                  <button 
                    onClick={() => toggleStatus(p.user_id, p.verification_status)}
                    className="admin-btn" 
                    style={{
                      padding: '8px 12px', fontSize: 12, 
                      background: p.verification_status === 'approved' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(34, 197, 94, 0.1)',
                      color: p.verification_status === 'approved' ? '#ef4444' : '#22c55e',
                      border: '1px solid currentColor'
                    }}
                  >
                    {p.verification_status === 'approved' ? <XCircle size={14} /> : <CheckCircle size={14} />}
                    {p.verification_status === 'approved' ? 'Suspend' : 'Activate'}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Professional Inspector Modal */}
      <Modal isOpen={!!selectedProId} onClose={() => { setSelectedProId(null); setScheduleData(null); }} title="Professional Schedule Inspector" width={800}>
        {selectedProId && (
          <div style={{marginTop: 10, display: 'flex', flexDirection: 'column', gap: 20}}>
            {/* Header / Date Picker */}
            <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
              <h3 style={{fontSize: 16, fontWeight: 700}}>
                {pros.find(p => p.user_id === selectedProId)?.profile?.full_name || 'Worker'}
              </h3>
              <input type="date" value={scheduleDate} onChange={e => setScheduleDate(e.target.value)} className="input" style={{width: 'auto', padding: '8px 12px', fontSize: 14}} />
            </div>

            {/* Timeline View */}
            {scheduleLoading ? (
              <div style={{padding: 40, textAlign: 'center', color: 'var(--text-muted)'}}>Loading schedule...</div>
            ) : scheduleData && scheduleData.schedule ? (
              <div style={{background: 'var(--surface)', borderRadius: 'var(--radius-lg)', border: '1px solid var(--border-light)', overflow: 'hidden'}}>
                
                {/* Visual Timeline (9 AM to 8 PM) */}
                <div style={{padding: 20}}>
                  <div style={{position: 'relative', height: 60, background: 'var(--bg-input)', borderRadius: 8, border: '1px solid var(--border-light)'}}>
                    
                    {/* Hour markers */}
                    {Array.from({length: 12}).map((_, i) => {
                      const hour = 9 + i; // 9 to 20
                      return (
                        <div key={i} style={{position: 'absolute', left: `${(i / 11) * 100}%`, top: 0, bottom: 0, borderLeft: '1px dashed var(--border-light)'}}>
                          <span style={{position: 'absolute', top: -20, left: -10, fontSize: 10, color: 'var(--text-muted)'}}>
                            {hour > 12 ? hour - 12 : hour}{hour >= 12 ? 'P' : 'A'}
                          </span>
                        </div>
                      );
                    })}

                    {/* Bookings */}
                    {scheduleData.schedule.map((b: any, idx: number, arr: any[]) => {
                      if (b.start_minutes === -1) return null; // Skip instant bookings on timeline
                      const startHourIdx = (b.start_minutes - 540) / 60; // 540 = 9:00 AM
                      const durationHours = b.duration_minutes / 60;
                      
                      const bufferHours = (b.buffer_minutes ?? scheduleData.buffer_minutes) / 60;

                      if (startHourIdx < 0 || startHourIdx > 11) return null;

                      const leftPct = (startHourIdx / 11) * 100;
                      const widthPct = (durationHours / 11) * 100;
                      const bufferWidthPct = (bufferHours / 11) * 100;

                      const isCompleted = b.status === 'completed';
                      const isGrouped = !!b.group_id;

                      return (
                        <div key={b.id}>
                          {/* Booking Block */}
                          <div title={`#${b.booking_number} (${b.duration_minutes}m)${isGrouped ? ' - Grouped' : ''}`} style={{
                            position: 'absolute', 
                            left: `${leftPct}%`, 
                            width: `${widthPct}%`, 
                            top: 4, bottom: 4, 
                            background: isGrouped ? '#8B5CF6' : (isCompleted ? 'var(--success)' : 'var(--accent)'),
                            borderRadius: 4,
                            opacity: 0.8,
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            color: '#fff',
                            fontSize: 10,
                            fontWeight: 700,
                            overflow: 'hidden',
                            whiteSpace: 'nowrap',
                            zIndex: 2
                          }}>
                            {widthPct > 5 ? 'Job' : ''}
                          </div>
                          {/* Buffer Block */}
                          {bufferHours > 0 && (
                            <div title={`Buffer (${scheduleData.buffer_minutes}m)`} style={{
                              position: 'absolute', 
                              left: `${leftPct + widthPct}%`, 
                              width: `${bufferWidthPct}%`, 
                              top: 14, bottom: 14, 
                              background: 'var(--warning)',
                              borderRadius: 4,
                              opacity: 0.3,
                              zIndex: 1
                            }} />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Legend */}
                <div style={{display: 'flex', gap: 16, padding: '10px 20px', borderTop: '1px solid var(--border-light)', fontSize: 12, background: 'var(--bg-input)'}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, borderRadius: 2, background: 'var(--success)'}}/> Completed</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, borderRadius: 2, background: 'var(--accent)'}}/> Scheduled</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, borderRadius: 2, background: 'var(--warning)', opacity: 0.3}}/> Buffer Time</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 6}}><div style={{width: 12, height: 12, borderRadius: 2, background: 'var(--bg-input)', border: '1px solid var(--border-light)'}}/> Free Time</div>
                </div>

                {/* List View */}
                <div style={{borderTop: '1px solid var(--border-light)', padding: 0}}>
                  <table style={{width: '100%', fontSize: 13, borderCollapse: 'collapse'}}>
                    <thead>
                      <tr style={{background: 'var(--bg-input)', borderBottom: '1px solid var(--border-light)'}}>
                        <th style={{padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)'}}>Time</th>
                        <th style={{padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)'}}>Booking #</th>
                        <th style={{padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)'}}>Status</th>
                        <th style={{padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)'}}>Customer</th>
                        <th style={{padding: '10px 16px', textAlign: 'left', fontWeight: 600, color: 'var(--text-muted)'}}>Duration</th>
                      </tr>
                    </thead>
                    <tbody>
                      {scheduleData.schedule.length === 0 ? (
                        <tr><td colSpan={5} style={{padding: 20, textAlign: 'center', color: 'var(--text-muted)'}}>No bookings for this date. Worker is fully available.</td></tr>
                      ) : (
                        scheduleData.schedule.map((b: any) => (
                          <tr key={b.id} style={{borderBottom: '1px solid var(--border-light)'}}>
                            <td style={{padding: '10px 16px', fontWeight: 600}}>{b.scheduled_time}</td>
                            <td style={{padding: '10px 16px', color: 'var(--accent)', fontWeight: 600}}>#{b.booking_number} {b.group_id && <span style={{marginLeft:4}} title="Grouped Order">⛓</span>}</td>
                            <td style={{padding: '10px 16px', textTransform: 'capitalize'}}>{b.status.replace('_', ' ')}</td>
                            <td style={{padding: '10px 16px'}}>{b.customer_name}</td>
                            <td style={{padding: '10px 16px'}}>{b.duration_minutes}m <span style={{color: 'var(--text-tertiary)'}}>+ {scheduleData.buffer_minutes}m buf</span></td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

              </div>
            ) : (
              <div style={{padding: 40, textAlign: 'center', color: 'var(--error)'}}>Failed to load schedule</div>
            )}
          </div>
        )}
      </Modal>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
