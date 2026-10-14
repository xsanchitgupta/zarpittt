'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { MapPin, Clock, ArrowRight, Briefcase, Users, Heart, Zap, Loader2, UploadCloud } from 'lucide-react';
import { getAllCareers, submitJobApplication } from '@/app/actions/careers';
import { uploadFileToCloudinary } from '@/app/actions/file';
import Modal from '@/components/Modal';
import ToastContainer, { toast } from '@/components/Toast';

const perks = [
  { icon: Heart, title: 'Purpose-driven Work', desc: 'Build something that empowers millions of workers and serves real families.' },
  { icon: Zap, title: 'Fast Growth', desc: 'Join early and grow with us. Early team members get outsized responsibility and learning.' },
  { icon: Users, title: 'Inclusive Culture', desc: 'We treat every team member — from engineering to helpers — with equal respect.' },
  { icon: Briefcase, title: 'Fair Compensation', desc: 'Competitive pay, transparent policies, and genuine appreciation for great work.' },
];

export default function CareersPage() {
  const [openings, setOpenings] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  // Application Form State
  const [formData, setFormData] = useState({
    fullName: '', email: '', phone: '', experience: '', resume: null as File | null
  });
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      const data = await getAllCareers();
      setOpenings(data?.filter(c => c.is_active) || []);
    } catch (err) {
      console.error('Failed to load careers', err);
    }
    setLoading(false);
  };

  const handleApply = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.resume) {
      toast.error('Error', 'Please upload a resume (PDF/DOC)');
      return;
    }

    // Vercel serverless function body size limit is 4.5MB. We restrict to 4MB.
    if (formData.resume.size > 4 * 1024 * 1024) {
      toast.error('Error', 'File is too large. Please upload a resume smaller than 4MB.');
      return;
    }

    setSubmitting(true);

    try {
      // 1. Upload Resume
      const fileData = new FormData();
      fileData.append('file', formData.resume);
      const uploadRes = await uploadFileToCloudinary(fileData);
      
      if (!uploadRes.success || !uploadRes.url) {
        toast.error('Error', 'Failed to upload resume. Try again.');
        setSubmitting(false);
        return;
      }

      // 2. Submit Application
      const appData = new FormData();
      appData.append('career_id', selectedJob.id);
      appData.append('full_name', formData.fullName);
      appData.append('email', formData.email);
      appData.append('phone', formData.phone);
      appData.append('experience', formData.experience);
      appData.append('resume_url', uploadRes.url);

      const res = await submitJobApplication(appData);

      if (res.success) {
        toast.success('Success', 'Application submitted successfully! We will get back to you soon.');
        setSelectedJob(null);
        setFormData({ fullName: '', email: '', phone: '', experience: '', resume: null });
      } else {
        toast.error('Error', res.error || 'Failed to submit application');
      }
    } catch (error) {
      console.error(error);
      toast.error('Error', 'An unexpected error occurred');
    }

    setSubmitting(false);
  };

  return (
    <>
      <Navbar />
      <ToastContainer />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{ position: 'relative', padding: '80px 0 60px', overflow: 'hidden' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,117,31,0.06), transparent 50%)', pointerEvents: 'none' }} />
          <div className="container" style={{ position: 'relative', maxWidth: 800, textAlign: 'center' }}>
            <span className="section-label">Careers at Zarpit</span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 16, lineHeight: 1.15 }}>
              Build Something That<br />
              <span style={{ color: 'var(--accent)' }}>Actually Matters</span>
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 580, margin: '0 auto' }}>
              Join us in creating India&apos;s most trusted service platform. We are looking for passionate people who want to empower millions.
            </p>
          </div>
        </section>

        {/* Perks */}
        <section style={{ padding: '60px 0', background: 'var(--bg-elevated)' }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.3rem', fontWeight: 700, textAlign: 'center', marginBottom: 40 }}>Why Join Zarpit?</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 20 }}>
              {perks.map((p, i) => {
                const Icon = p.icon;
                return (
                  <div key={i} style={{ padding: 24, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(20px)' }}>
                    <Icon size={22} style={{ color: 'var(--accent)', marginBottom: 12 }} />
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '0.95rem', fontWeight: 600, marginBottom: 6 }}>{p.title}</h3>
                    <p style={{ fontSize: 13, color: 'var(--text-secondary)', lineHeight: 1.6 }}>{p.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Openings */}
        <section style={{ padding: '80px 0' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="section-label">Open Positions</span>
              <h2 className="section-title">Current Openings</h2>
            </div>
            {loading ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                  {[1, 2, 3].map(i => (
                    <div key={i} style={{ padding: '28px 32px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-xl)', display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20 }}>
                      <div style={{ flex: 1, minWidth: 250 }}>
                        <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 8 }} />
                        <div className="skeleton" style={{ width: 200, height: 20, marginBottom: 12 }} />
                        <div className="skeleton" style={{ width: '80%', height: 16, marginBottom: 6 }} />
                        <div className="skeleton" style={{ width: '60%', height: 16, marginBottom: 16 }} />
                        <div style={{ display: 'flex', gap: 16 }}>
                          <div className="skeleton" style={{ width: 80, height: 14 }} />
                          <div className="skeleton" style={{ width: 100, height: 14 }} />
                        </div>
                      </div>
                      <div className="skeleton" style={{ width: 90, height: 36, borderRadius: 'var(--radius-md)' }} />
                    </div>
                  ))}
                </div>
              ) : openings.length === 0 ? (
              <div style={{ textAlign: 'center', padding: 40, color: 'var(--text-secondary)' }}>No open positions at the moment. Check back later!</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {openings.map((job) => (
                  <div key={job.id} style={{
                    padding: '28px 32px', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(20px)', transition: 'all 0.3s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; }}
                  >
                    <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 20, flexWrap: 'wrap' }}>
                      <div style={{ flex: 1, minWidth: 250 }}>
                        <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--accent)', textTransform: 'uppercase', letterSpacing: '0.08em' }}>{job.category}</span>
                        <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 700, marginTop: 4, marginBottom: 8 }}>{job.title}</h3>
                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7, marginBottom: 12 }}>{job.description}</p>
                        <div style={{ display: 'flex', gap: 16, fontSize: 13, color: 'var(--text-muted)' }}>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={14} /> {job.type}</span>
                          <span style={{ display: 'flex', alignItems: 'center', gap: 4 }}><MapPin size={14} /> {job.location}</span>
                        </div>
                      </div>
                      <button className="btn btn-primary btn-sm" style={{ whiteSpace: 'nowrap', display: 'flex', alignItems: 'center', gap: 6 }} onClick={() => setSelectedJob(job)}>
                        Apply <ArrowRight size={14} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>

        {/* CTA */}
        <section style={{ padding: '60px 0', background: 'var(--bg-elevated)', textAlign: 'center' }}>
          <div className="container" style={{ maxWidth: 500 }}>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 20 }}>
              Don&apos;t see a role that fits? Reach out anyway — we are always looking for great people.
            </p>
            <a href="mailto:zarpittechservices@gmail.com" className="btn btn-secondary">Send Your Resume</a>
          </div>
        </section>
      </div>

      <Footer />

      {/* Application Modal */}
      <Modal isOpen={!!selectedJob} onClose={() => setSelectedJob(null)} title={`Apply for ${selectedJob?.title}`} width={500}>
        {selectedJob && (
          <form onSubmit={handleApply} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Full Name</label>
              <input required type="text" className="input" value={formData.fullName} onChange={e => setFormData({ ...formData, fullName: e.target.value })} placeholder="John Doe" />
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Email</label>
                <input required type="email" className="input" value={formData.email} onChange={e => setFormData({ ...formData, email: e.target.value })} placeholder="john@example.com" />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Phone</label>
                <input required type="tel" className="input" value={formData.phone} onChange={e => setFormData({ ...formData, phone: e.target.value })} placeholder="+91 9876543210" />
              </div>
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Experience (Years/Summary)</label>
              <input required type="text" className="input" value={formData.experience} onChange={e => setFormData({ ...formData, experience: e.target.value })} placeholder="e.g. 3 Years in Frontend Dev" />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 6, fontSize: 13, fontWeight: 500 }}>Upload Resume (PDF/DOC)</label>
              <div style={{ position: 'relative', border: '1px dashed var(--glass-border)', padding: 16, borderRadius: 'var(--radius-md)', textAlign: 'center', background: 'var(--glass-bg)' }}>
                <input 
                  required 
                  type="file" 
                  accept=".pdf,.doc,.docx" 
                  onChange={e => setFormData({ ...formData, resume: e.target.files?.[0] || null })} 
                  style={{ opacity: 0, position: 'absolute', inset: 0, width: '100%', cursor: 'pointer' }} 
                />
                <UploadCloud size={24} style={{ color: 'var(--accent)', margin: '0 auto 8px' }} />
                <div style={{ fontSize: 14, color: formData.resume ? 'var(--text-primary)' : 'var(--text-secondary)', fontWeight: 500 }}>
                  {formData.resume ? formData.resume.name : 'Click or drag file to upload'}
                </div>
              </div>
            </div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: 8 }} disabled={submitting}>
              {submitting ? <Loader2 className="animate-spin" size={18} /> : 'Submit Application'}
            </button>
          </form>
        )}
      </Modal>
    </>
  );
}
