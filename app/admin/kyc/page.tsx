'use client';
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import { Shield, CheckCircle, XCircle, AlertCircle, FileText, Camera, CreditCard, ExternalLink, User, Phone, Mail, Calendar } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import type { ProviderProfile, Profile } from '@/lib/database.types';

export default function AdminKYC() {
  const [kycs, setKycs] = useState<(ProviderProfile & { profile: Profile | null })[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchKYC = async () => {
    setLoading(true);
    // Fetch provider profiles
    const { data: providers, error: providersErr } = await supabase
      .from('provider_profiles')
      .select('*')
      .order('updated_at', { ascending: false });

    if (providersErr || !providers) {
      toast.error('Error fetching KYC data', providersErr?.message || '');
      setLoading(false);
      return;
    }

    // Fetch corresponding profiles
    const userIds = providers.map(p => p.user_id).filter(Boolean);
    const { data: profilesData } = await supabase
      .from('profiles')
      .select('*')
      .in('id', userIds);

    const profileMap = new Map();
    if (profilesData) {
      profilesData.forEach(p => profileMap.set(p.id, p));
    }

    const merged = providers.map(p => ({
      ...p,
      profile: profileMap.get(p.user_id) || null
    }));

    setKycs(merged as any);
    setLoading(false);
  };

  useEffect(() => {
    fetchKYC();
  }, []);

  const updateStatus = async (userId: string, newStatus: string) => {
    try {
      const { error } = await supabase
        .from('provider_profiles')
        .update({ verification_status: newStatus })
        .eq('user_id', userId);
      
      if (error) throw error;
      
      setKycs(prev => prev.map(k => k.user_id === userId ? { ...k, verification_status: newStatus as any } : k));
      toast.success('Status Updated', `KYC status changed to ${newStatus}`);
    } catch (err: any) {
      toast.error('Error updating status', err.message);
    }
  };

  return (
    <div style={{animation: 'fadeIn 0.5s ease-out'}}>
      <ToastContainer />
      
      <div style={{marginBottom: 40}}>
        <h1 style={{fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--admin-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16}}>
          <div style={{padding: 12, background: 'var(--admin-accent-soft)', borderRadius: 16, color: 'var(--admin-accent)'}}>
            <Shield size={32} />
          </div>
          KYC Approvals
        </h1>
        <p style={{color: 'var(--admin-text-secondary)', fontSize: 16, fontWeight: 500}}>
          Verify identity and professional credentials of service providers.
        </p>
      </div>

      {loading ? (
        <div style={{padding: 100, textAlign: 'center'}}>
          <div className="spinner" style={{margin: '0 auto 16px', width: 40, height: 40, border: '3px solid var(--admin-accent-soft)', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite'}} />
          <p style={{color: 'var(--admin-text-tertiary)', fontWeight: 600}}>Loading submissions...</p>
        </div>
      ) : kycs.length === 0 ? (
        <div className="admin-glass-panel" style={{padding: 80, textAlign: 'center'}}>
          <div style={{fontSize: 48, marginBottom: 16}}>📋</div>
          <h3 style={{fontSize: 20, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 8}}>All Clear!</h3>
          <p style={{color: 'var(--admin-text-secondary)'}}>No pending KYC applications at the moment.</p>
        </div>
      ) : (
        <div className="admin-kyc-grid">
          {kycs.map(k => (
            <div key={k.id} className="admin-glass-panel" style={{display: 'flex', flexDirection: 'column', overflow: 'hidden'}}>
              {/* Header */}
              <div style={{padding: 24, borderBottom: '1px solid var(--admin-divider)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.02)'}}>
                <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                  <div style={{width: 48, height: 48, borderRadius: 14, background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 18, border: '1px solid var(--admin-border)'}}>
                    {(k.profile?.full_name || 'U')[0].toUpperCase()}
                  </div>
                  <div>
                    <h3 style={{fontSize: 16, fontWeight: 700, color: 'var(--admin-text-primary)'}}>{k.profile?.full_name || 'Anonymous User'}</h3>
                    <div style={{display: 'flex', alignItems: 'center', gap: 12, marginTop: 4, color: 'var(--admin-text-tertiary)', fontSize: 13, fontWeight: 500}}>
                      <span style={{display: 'flex', alignItems: 'center', gap: 4}}><Phone size={12} /> {k.profile?.phone || 'No phone'}</span>
                    </div>
                  </div>
                </div>
                
                <div style={{
                  padding: '6px 14px', 
                  borderRadius: 20, 
                  fontSize: 11, 
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  letterSpacing: '0.05em',
                  background: k.verification_status === 'approved' ? 'rgba(34, 197, 94, 0.1)' : k.verification_status === 'rejected' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(245, 158, 11, 0.1)',
                  color: k.verification_status === 'approved' ? '#22c55e' : k.verification_status === 'rejected' ? '#ef4444' : '#f59e0b',
                  border: '1px solid currentColor'
                }}>
                  {k.verification_status}
                </div>
              </div>

              {/* Body */}
              <div style={{padding: 24, flex: 1}}>
                {/* Documents Grid */}
                <div className="admin-doc-grid">
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                    <label style={{fontSize: 11, fontWeight: 800, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8}}>
                      <Camera size={14} /> Live Selfie
                    </label>
                    <div style={{aspectRatio: '1', borderRadius: 16, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', overflow: 'hidden', position: 'relative'}}>
                      {k.selfie_image ? (
                        <a href={k.selfie_image} target="_blank" rel="noreferrer" className="admin-doc-link">
                          <img src={k.selfie_image} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Selfie" />
                          <div className="admin-overlay" style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s'}}>
                            <ExternalLink color="#fff" size={24} />
                          </div>
                        </a>
                      ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13, fontWeight: 500}}>No Image</div>
                      )}
                    </div>
                  </div>
                  <div style={{display: 'flex', flexDirection: 'column', gap: 10}}>
                    <label style={{fontSize: 11, fontWeight: 800, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', display: 'flex', alignItems: 'center', gap: 8}}>
                      <CreditCard size={14} /> Aadhaar Card
                    </label>
                    <div style={{aspectRatio: '1', borderRadius: 16, background: 'var(--admin-bg)', border: '1px solid var(--admin-border)', overflow: 'hidden', position: 'relative'}}>
                      {k.aadhaar_image ? (
                        <a href={k.aadhaar_image} target="_blank" rel="noreferrer" className="admin-doc-link">
                          <img src={k.aadhaar_image} style={{width: '100%', height: '100%', objectFit: 'cover'}} alt="Aadhaar" />
                          <div className="admin-overlay" style={{position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.4)', opacity: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'opacity 0.2s'}}>
                            <ExternalLink color="#fff" size={24} />
                          </div>
                        </a>
                      ) : (
                        <div style={{width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)', fontSize: 13, fontWeight: 500}}>No Image</div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Details List */}
                <div style={{display: 'grid', gap: 12, padding: 16, background: 'var(--admin-glass-active)', borderRadius: 16, border: '1px solid var(--admin-border-light)'}}>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14}}>
                    <span style={{color: 'var(--admin-text-secondary)', fontWeight: 500}}>Aadhaar Number</span>
                    <span style={{fontWeight: 700, color: 'var(--admin-text-primary)'}}>{k.aadhaar_number || 'Not provided'}</span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14}}>
                    <span style={{color: 'var(--admin-text-secondary)', fontWeight: 500}}>Vehicle Details</span>
                    <span style={{fontWeight: 700, color: 'var(--admin-text-primary)'}}>
                      {k.has_vehicle ? `${k.vehicle_type || 'Vehicle'} (${k.vehicle_number || 'No plate'})` : 'No Vehicle'}
                    </span>
                  </div>
                  <div style={{display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: 14}}>
                    <span style={{color: 'var(--admin-text-secondary)', fontWeight: 500}}>Submission Date</span>
                    <span style={{fontWeight: 700, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 6}}>
                      <Calendar size={14} /> {new Date(k.updated_at).toLocaleDateString('en-IN', {day:'numeric', month:'short', year:'numeric'})}
                    </span>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="admin-actions-group">
                <button 
                  onClick={() => updateStatus(k.user_id, 'approved')}
                  disabled={k.verification_status === 'approved'}
                  className="admin-btn"
                  style={{
                    flex: 1, 
                    background: k.verification_status === 'approved' ? 'var(--admin-glass-active)' : '#22c55e',
                    color: k.verification_status === 'approved' ? 'var(--admin-text-tertiary)' : '#fff',
                    opacity: k.verification_status === 'approved' ? 0.7 : 1,
                    cursor: k.verification_status === 'approved' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <CheckCircle size={18} /> Approve KYC
                </button>
                <button 
                  onClick={() => updateStatus(k.user_id, 'rejected')}
                  disabled={k.verification_status === 'rejected'}
                  className="admin-btn"
                  style={{
                    flex: 1, 
                    background: k.verification_status === 'rejected' ? 'var(--admin-glass-active)' : '#ef4444',
                    color: k.verification_status === 'rejected' ? 'var(--admin-text-tertiary)' : '#fff',
                    opacity: k.verification_status === 'rejected' ? 0.7 : 1,
                    cursor: k.verification_status === 'rejected' ? 'not-allowed' : 'pointer'
                  }}
                >
                  <XCircle size={18} /> Reject
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        .admin-doc-link:hover .admin-overlay { opacity: 1 !important; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
