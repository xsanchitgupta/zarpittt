'use client';

import { useState, useEffect } from 'react';
import { getCareerById, getApplicationsForCareer, updateApplicationStatus } from '@/app/actions/careers';
import { ArrowLeft, Loader2, Download, CheckCircle, XCircle, Clock } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import Link from 'next/link';
import { useParams } from 'next/navigation';

export default function CareerApplications() {
  const { id } = useParams();
  const [career, setCareer] = useState<any>(null);
  const [applications, setApplications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, [id]);

  const fetchData = async () => {
    try {
      const careerData = await getCareerById(id as string);
      setCareer(careerData);
      const appsData = await getApplicationsForCareer(id as string);
      setApplications(appsData || []);
    } catch (err) {
      console.error('Fetch error:', err);
    }
    setLoading(false);
  };

  const handleUpdateStatus = async (appId: string, status: string) => {
    const res = await updateApplicationStatus(appId, status);
    if (res.success) {
      toast.success('Updated', `Application status set to ${status}`);
      fetchData();
    } else {
      toast.error('Error', 'Failed to update status');
    }
  };

  if (loading) {
    return <div style={{ padding: 40, textAlign: 'center' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>;
  }

  if (!career) {
    return <div style={{ padding: 40, textAlign: 'center' }}>Career not found</div>;
  }

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ marginBottom: 32 }}>
        <Link href="/admin/careers" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--admin-text-secondary)', marginBottom: 16, textDecoration: 'none' }}>
          <ArrowLeft size={16} /> Back to Careers
        </Link>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Applications for: {career.title}
        </h1>
        <div style={{ color: 'var(--admin-text-secondary)', marginTop: 8 }}>
          {applications.length} total applications
        </div>
      </div>

      <div className="admin-glass-panel" style={{ overflow: 'hidden' }}>
        {applications.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No applications yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {applications.map(app => (
              <div 
                key={app.id} 
                style={{ display: 'flex', alignItems: 'center', padding: '20px 24px', borderBottom: '1px solid var(--admin-divider)' }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {app.full_name}
                    {app.status === 'pending' && <span style={{fontSize: 10, padding: '2px 8px', background: 'var(--admin-glass-active)', color: 'var(--admin-text-secondary)', borderRadius: 12}}><Clock size={10} style={{display:'inline',marginRight:2}}/> Pending</span>}
                    {app.status === 'accepted' && <span style={{fontSize: 10, padding: '2px 8px', background: 'rgba(52, 199, 89, 0.1)', color: '#34c759', borderRadius: 12}}><CheckCircle size={10} style={{display:'inline',marginRight:2}}/> Accepted</span>}
                    {app.status === 'rejected' && <span style={{fontSize: 10, padding: '2px 8px', background: 'rgba(255, 59, 48, 0.1)', color: '#ff3b30', borderRadius: 12}}><XCircle size={10} style={{display:'inline',marginRight:2}}/> Rejected</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', marginTop: 4 }}>
                    <a href={`mailto:${app.email}`} style={{ color: 'inherit' }}>{app.email}</a> • <a href={`tel:${app.phone}`} style={{ color: 'inherit' }}>{app.phone}</a>
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-primary)', marginTop: 8 }}>
                    <strong>Experience:</strong> {app.experience}
                  </div>
                  <div style={{ fontSize: 12, color: 'var(--admin-text-secondary)', marginTop: 8 }}>
                    Applied on: {new Date(app.created_at).toLocaleDateString()}
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
                  <a href={app.resume_url} target="_blank" rel="noreferrer" className="admin-btn" style={{ fontSize: 12, padding: '6px 12px', textDecoration: 'none' }}>
                    <Download size={14} /> View Resume
                  </a>
                  {app.status === 'pending' && (
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleUpdateStatus(app.id, 'accepted')} className="admin-btn" style={{ fontSize: 12, padding: '6px 12px', color: '#34c759', borderColor: '#34c759' }}>
                        Accept
                      </button>
                      <button onClick={() => handleUpdateStatus(app.id, 'rejected')} className="admin-btn" style={{ fontSize: 12, padding: '6px 12px', color: '#ff3b30', borderColor: '#ff3b30' }}>
                        Reject
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
