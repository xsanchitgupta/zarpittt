'use client';
import { useState, useEffect } from 'react';
import { adminFetch } from '@/lib/admin-fetch';
import { Calendar, Clock, MapPin, User as UserIcon, AlertCircle, CheckCircle2, XCircle } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import { formatServiceNames } from '@/lib/utils';

export default function AdminAssignments() {
  const [assignments, setAssignments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchAssignments = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/assignments');
      if (res.ok) {
        const data = await res.json();
        setAssignments(data || []);
      } else {
        toast.error('Error', 'Failed to fetch assignments');
      }
    } catch (err) {
      toast.error('Error', 'Failed to fetch assignments');
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchAssignments();
  }, []);

  const handleCancel = async (id: string, booking_id: string) => {
    if (!confirm('Are you sure you want to cancel this assignment? The booking will revert to pending status.')) return;

    try {
      const res = await adminFetch(`/api/admin/assignments?id=${id}&booking_id=${booking_id}`, { method: 'DELETE' });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.error);
      }
      toast.success('Cancelled', 'Assignment cancelled successfully');
      fetchAssignments();
    } catch (err: any) {
      toast.error('Error', err.message);
    }
  };

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'assigned': return 'var(--accent)';
      case 'in_progress': return '#3b82f6';
      case 'completed': return 'var(--success)';
      case 'cancelled': return 'var(--error)';
      default: return 'var(--text-secondary)';
    }
  };

  return (
    <div style={{ maxWidth: 1200, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Task Assignments
        </h1>
        <button onClick={fetchAssignments} className="btn btn-secondary btn-sm" disabled={loading}>
          {loading ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      <div className="admin-glass-panel" style={{ padding: 24 }}>
        {loading && assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-secondary)' }}>Loading...</div>
        ) : assignments.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 40, color: 'var(--admin-text-secondary)' }}>
            <AlertCircle size={48} style={{ opacity: 0.5, margin: '0 auto 16px' }} />
            No task assignments found
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {assignments.map(a => {
              const start = new Date(a.estimated_start);
              const end = new Date(a.estimated_end);
              return (
                <div key={a.id} style={{ display: 'flex', flexDirection: 'column', gap: 16, padding: 20, background: 'var(--admin-surface)', border: '1px solid var(--admin-divider)', borderRadius: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 8 }}>
                        <span style={{ fontSize: 13, fontWeight: 700, color: 'var(--admin-text-primary)', padding: '4px 10px', background: 'var(--admin-divider)', borderRadius: 6 }}>
                          {a.booking?.booking_number}
                        </span>
                        <span style={{ fontSize: 13, fontWeight: 600, color: getStatusColor(a.status), display: 'flex', alignItems: 'center', gap: 6 }}>
                          {a.status === 'completed' ? <CheckCircle2 size={14} /> : a.status === 'cancelled' ? <XCircle size={14} /> : <div style={{width:8,height:8,borderRadius:'50%',background:getStatusColor(a.status)}} />}
                          {a.status.toUpperCase().replace('_', ' ')}
                        </span>
                      </div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                        <UserIcon size={18} color="var(--accent)" /> {a.worker?.full_name} 
                        <span style={{ fontSize: 12, fontWeight: 500, padding: '2px 8px', borderRadius: 12, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)' }}>{a.worker_type}</span>
                      </div>
                    </div>
                    
                    {a.status === 'assigned' && (
                      <button onClick={() => handleCancel(a.id, a.booking?.id)} style={{ padding: '6px 12px', fontSize: 13, background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 6, cursor: 'pointer', fontWeight: 600 }}>
                        Cancel Assignment
                      </button>
                    )}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 16, padding: '16px 0', borderTop: '1px solid var(--admin-divider)' }}>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Calendar size={18} color="var(--admin-text-tertiary)" style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Scheduled For</div>
                        <div style={{ fontSize: 14, color: 'var(--admin-text-primary)', fontWeight: 500 }}>
                          {start.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <Clock size={18} color="var(--admin-text-tertiary)" style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Time Window</div>
                        <div style={{ fontSize: 14, color: 'var(--admin-text-primary)', fontWeight: 500 }}>
                          {start.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })} — {end.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' })}
                        </div>
                      </div>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'flex-start', gap: 10 }}>
                      <MapPin size={18} color="var(--admin-text-tertiary)" style={{ marginTop: 2 }} />
                      <div>
                        <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', marginBottom: 4 }}>Location</div>
                        <div style={{ fontSize: 13, color: 'var(--admin-text-primary)', lineHeight: 1.4 }}>
                          {a.booking?.address || 'N/A'}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', background: 'var(--admin-divider)', padding: '8px 12px', borderRadius: 8, display: 'inline-flex', gap: 8, flexWrap: 'wrap' }}>
                    <strong>Services:</strong> 
                    {formatServiceNames(a.booking?.booking_items)}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
