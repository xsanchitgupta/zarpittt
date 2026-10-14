'use client';
import { useState, useEffect } from 'react';

import supabase from '@/lib/supabase';
import { UserPlus, Users, CheckCircle, XCircle, IndianRupee, Briefcase, Eye, EyeOff, Search, X, Loader2, Upload } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import { uploadImageToCloudinary } from '@/app/actions/image';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminWorkers() {
  const [workers, setWorkers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showPass, setShowPass] = useState(false);
  const [search, setSearch] = useState('');
  const [allCategories, setAllCategories] = useState<{id:string,name:string}[]>([]);
  const [selfieFile, setSelfieFile] = useState<File | null>(null);
  const [aadhaarFile, setAadhaarFile] = useState<File | null>(null);

  const [form, setForm] = useState({
    full_name: '', email: '', phone: '', password: '',
    services_offered: [] as string[], salary_amount: '',
  });

  useEffect(() => {
    fetchWorkers();
    adminFetch('/api/admin/categories')
      .then(res => res.json())
      .then(data => {
        if (Array.isArray(data)) setAllCategories(data);
      });
  }, []);

  const fetchWorkers = async () => {
    setLoading(true);
    try {
      const res = await adminFetch('/api/admin/list-workers');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) setWorkers(data);
      }
    } catch (err) {
      console.error('Fetch workers error:', err);
    }
    setLoading(false);
  };

  const toggleService = (id: string) => {
    setForm(prev => ({
      ...prev,
      services_offered: prev.services_offered.includes(id)
        ? prev.services_offered.filter(s => s !== id)
        : [...prev.services_offered, id]
    }));
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.full_name || !form.email || !form.password) {
      toast.error('Missing Fields', 'Name, email and password are required.');
      return;
    }
    if (form.password.length < 6) {
      toast.error('Weak Password', 'Password must be at least 6 characters.');
      return;
    }
    setCreating(true);
    try {
      let finalSelfieUrl = '';
      let finalAadhaarUrl = '';

      if (selfieFile) {
        const formData = new FormData();
        formData.append('file', selfieFile);
        const res = await uploadImageToCloudinary(formData);
        if (res?.url) finalSelfieUrl = res.url;
      }

      if (aadhaarFile) {
        const formData = new FormData();
        formData.append('file', aadhaarFile);
        const res = await uploadImageToCloudinary(formData);
        if (res?.url) finalAadhaarUrl = res.url;
      }

      const { data: { session } } = await supabase.auth.getSession();
      const res = await adminFetch('/api/admin/create-worker', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`,
        },
        body: JSON.stringify({
          ...form,
          salary_amount: parseInt(form.salary_amount) || 0,
          selfie_image: finalSelfieUrl,
          aadhaar_image: finalAadhaarUrl,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      toast.success('Worker Created', `${form.full_name} has been added successfully.`);
      setForm({ full_name: '', email: '', phone: '', password: '', services_offered: [], salary_amount: '' });
      setSelfieFile(null);
      setAadhaarFile(null);
      setShowAddForm(false);
      fetchWorkers();
    } catch (err: any) {
      toast.error('Creation Failed', err.message);
    } finally {
      setCreating(false);
    }
  };

  const toggleStatus = async (userId: string, current: string) => {
    const next = current === 'approved' ? 'suspended' : 'approved';
    try {
      const res = await adminFetch('/api/admin/update-provider', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, verification_status: next })
      });
      if (!res.ok) { const err = await res.json(); toast.error('Failed', err.error); return; }
      setWorkers(prev => prev.map(w => w.user_id === userId ? { ...w, verification_status: next } : w));
      toast.success('Updated', `Worker is now ${next}.`);
    } catch (err: any) { toast.error('Failed', err.message); }
  };

  const filtered = workers.filter(w => {
    if (!search) return true;
    const s = search.toLowerCase();
    return w.profile?.full_name?.toLowerCase().includes(s) || w.profile?.email?.toLowerCase().includes(s);
  });

  return (
    <div style={{ animation: 'fadeIn 0.5s ease-out' }}>
      <ToastContainer />

      {/* Header */}
      <div style={{ marginBottom: 40, display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', flexWrap: 'wrap', gap: 16 }}>
        <div>
          <h1 style={{ fontSize: '2.5rem', fontWeight: 800, letterSpacing: '-0.04em', color: 'var(--admin-text-primary)', marginBottom: 8, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ padding: 12, background: 'var(--admin-accent-soft)', borderRadius: 16, color: 'var(--admin-accent)' }}><Users size={32} /></div>
            Salaried Workers
          </h1>
          <p style={{ color: 'var(--admin-text-secondary)', fontSize: 16, fontWeight: 500 }}>
            Manage employees on fixed salary — no commission or escrow.
          </p>
        </div>
        <button onClick={() => setShowAddForm(true)} className="admin-btn admin-btn-primary" style={{ gap: 10 }}>
          <UserPlus size={18} /> Add Worker
        </button>
      </div>

      {/* Search */}
      <div style={{ marginBottom: 32, maxWidth: 400 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '0 16px', height: 48, background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border)', borderRadius: 14 }}>
          <Search size={18} color="var(--admin-text-tertiary)" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search workers..." className="admin-input" style={{ border: 'none', background: 'transparent', padding: 0, boxShadow: 'none' }} />
        </div>
      </div>

      {/* Add Worker Modal */}
      {showAddForm && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 200, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24 }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(8px)' }} onClick={() => !creating && setShowAddForm(false)} />
          <div className="admin-glass-panel" style={{ position: 'relative', width: '100%', maxWidth: 580, padding: 32, maxHeight: '90vh', overflowY: 'auto' }}>
            <button onClick={() => setShowAddForm(false)} style={{ position: 'absolute', top: 16, right: 16, width: 36, height: 36, borderRadius: '50%', background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--admin-text-secondary)' }}>
              <X size={18} />
            </button>

            <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 32 }}>
              <div style={{ width: 48, height: 48, borderRadius: 14, background: 'var(--admin-accent-soft)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-accent)' }}>
                <UserPlus size={24} />
              </div>
              <div>
                <h2 style={{ fontSize: 20, fontWeight: 800, color: 'var(--admin-text-primary)', letterSpacing: '-0.02em' }}>Add Salaried Worker</h2>
                <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>Account will be immediately active.</p>
              </div>
            </div>

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Full Name *</label>
                  <input className="admin-input" required value={form.full_name} onChange={e => setForm({ ...form, full_name: e.target.value })} placeholder="John Doe" />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Phone</label>
                  <input className="admin-input" value={form.phone} onChange={e => setForm({ ...form, phone: e.target.value })} placeholder="+91 XXXXX" />
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Email Address *</label>
                <input className="admin-input" type="email" required value={form.email} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="worker@example.com" />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Password *</label>
                  <div style={{ position: 'relative' }}>
                    <input className="admin-input" type={showPass ? 'text' : 'password'} required minLength={6} value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} placeholder="Min 6 chars" style={{ paddingRight: 44 }} />
                    <button type="button" onClick={() => setShowPass(!showPass)} style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--admin-text-tertiary)' }}>
                      {showPass ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Monthly Salary (₹)</label>
                  <input className="admin-input" type="number" value={form.salary_amount} onChange={e => setForm({ ...form, salary_amount: e.target.value })} placeholder="e.g. 15000" />
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Worker Photo (Optional)</label>
                  <label className="admin-file-upload">
                    <Upload size={16} />
                    <span>{selfieFile ? selfieFile.name : 'Choose Image'}</span>
                    <input type="file" accept="image/*" onChange={e => { if (e.target.files && e.target.files.length > 0) setSelfieFile(e.target.files[0]); }} style={{ display: 'none' }} />
                  </label>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Aadhaar Card (Optional)</label>
                  <label className="admin-file-upload">
                    <Upload size={16} />
                    <span>{aadhaarFile ? aadhaarFile.name : 'Choose Image'}</span>
                    <input type="file" accept="image/*" onChange={e => { if (e.target.files && e.target.files.length > 0) setAadhaarFile(e.target.files[0]); }} style={{ display: 'none' }} />
                  </label>
                </div>
              </div>

              <div>
                <label style={{ display: 'block', fontSize: 11, fontWeight: 700, color: 'var(--admin-text-tertiary)', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.08em' }}>Service Categories</label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                  {allCategories.map(cat => {
                    const active = form.services_offered.includes(cat.id);
                    return (
                      <button type="button" key={cat.id} onClick={() => toggleService(cat.id)} style={{
                        padding: '6px 14px', borderRadius: 10, fontSize: 12, fontWeight: 600,
                        background: active ? 'var(--admin-accent)' : 'var(--admin-glass-active)',
                        color: active ? '#fff' : 'var(--admin-text-secondary)',
                        border: active ? '1px solid var(--admin-accent)' : '1px solid var(--admin-border)',
                        cursor: 'pointer', transition: 'all 0.2s',
                      }}>{cat.name}</button>
                    );
                  })}
                </div>
              </div>

              <button type="submit" disabled={creating} className="admin-btn admin-btn-primary" style={{ width: '100%', height: 48, marginTop: 8, fontSize: 15, fontWeight: 700 }}>
                {creating ? <Loader2 className="animate-spin" size={20} /> : 'Create Worker Account'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Workers List */}
      {loading ? (
        <div style={{ padding: 100, textAlign: 'center' }}>
          <div style={{ width: 40, height: 40, border: '3px solid var(--admin-accent-soft)', borderTopColor: 'var(--admin-accent)', borderRadius: '50%', animation: 'spin 1s linear infinite', margin: '0 auto 16px' }} />
          <p style={{ color: 'var(--admin-text-tertiary)', fontWeight: 600 }}>Loading workers...</p>
        </div>
      ) : filtered.length === 0 ? (
        <div className="admin-glass-panel" style={{ padding: 80, textAlign: 'center' }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>👷</div>
          <h3 style={{ fontSize: 20, fontWeight: 700, color: 'var(--admin-text-primary)', marginBottom: 8 }}>
            {search ? 'No workers match your search' : 'No Salaried Workers Yet'}
          </h3>
          <p style={{ color: 'var(--admin-text-secondary)', marginBottom: 24 }}>
            {search ? 'Try a different search term.' : 'Add your first salaried worker using the button above.'}
          </p>
          {!search && (
            <button onClick={() => setShowAddForm(true)} className="admin-btn admin-btn-primary"><UserPlus size={16} /> Add First Worker</button>
          )}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(360px, 1fr))', gap: 24 }}>
          {filtered.map(w => (
            <div key={w.id} className="admin-glass-panel" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 18 }}>
              {/* Top */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
                <div style={{ width: 56, height: 56, borderRadius: 16, background: 'var(--admin-accent-soft)', color: 'var(--admin-accent)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 800, fontSize: 22, border: '1px solid var(--admin-border)' }}>
                  {(w.profile?.full_name || 'W')[0].toUpperCase()}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <h3 style={{ fontSize: 17, fontWeight: 700, color: 'var(--admin-text-primary)' }}>{w.profile?.full_name || 'Worker'}</h3>
                    <span style={{ fontSize: 9, fontWeight: 700, padding: '2px 8px', borderRadius: 6, background: 'rgba(139,92,246,0.1)', color: '#8B5CF6', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Salaried</span>
                  </div>
                  <p style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{w.profile?.email}</p>
                </div>
              </div>

              {/* Services */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                {w.services_offered?.slice(0, 3).map((s: string) => {
                  const cat = allCategories.find(c => c.id === s);
                  return (
                    <span key={s} style={{ padding: '3px 10px', background: 'var(--admin-glass-active)', border: '1px solid var(--admin-border-light)', borderRadius: 8, fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                      {cat?.name || s}
                    </span>
                  );
                })}
                {w.services_offered?.length > 3 && (
                  <span style={{ fontSize: 11, color: 'var(--admin-text-tertiary)', fontWeight: 600, padding: '3px 0' }}>+{w.services_offered.length - 3} more</span>
                )}
              </div>

              {/* Stats */}
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
                <div style={{ padding: 12, background: 'var(--admin-bg, var(--admin-glass-active))', borderRadius: 12, border: '1px solid var(--admin-border-light)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Salary</div>
                  <div style={{ fontSize: 17, fontWeight: 800, color: 'var(--admin-text-primary)' }}>₹{(w.salary_amount || 0).toLocaleString()}</div>
                </div>
                <div style={{ padding: 12, background: 'var(--admin-bg, var(--admin-glass-active))', borderRadius: 12, border: '1px solid var(--admin-border-light)' }}>
                  <div style={{ fontSize: 10, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', marginBottom: 4 }}>Status</div>
                  <div style={{ fontSize: 14, fontWeight: 700, color: w.verification_status === 'approved' ? '#22c55e' : '#f59e0b', textTransform: 'capitalize' }}>{w.verification_status}</div>
                </div>
              </div>
              
              {/* Task Availability */}
              <div style={{ padding: '12px 16px', background: 'var(--admin-glass-active)', borderRadius: 12, border: '1px solid var(--admin-border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <span style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Current Schedule</span>
                {w.active_tasks && w.active_tasks.length > 0 ? (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--error)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'var(--error)'}} />
                    Busy until {new Date(Math.max(...w.active_tasks.map((t:any) => new Date(t.estimated_end).getTime()))).toLocaleTimeString('en-US', {hour:'numeric', minute:'2-digit'})}
                  </span>
                ) : (
                  <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--success)', display: 'flex', alignItems: 'center', gap: 6 }}>
                    <div style={{width:8,height:8,borderRadius:'50%',background:'var(--success)'}} /> Free
                  </span>
                )}
              </div>

              {/* Actions */}
              <div style={{ marginTop: 'auto', paddingTop: 14, borderTop: '1px solid var(--admin-divider)', display: 'flex', justifyContent: 'flex-end', gap: 8 }}>
                <button
                  onClick={() => toggleStatus(w.user_id, w.verification_status)}
                  className="admin-btn"
                  style={{
                    padding: '8px 14px', fontSize: 12,
                    background: w.verification_status === 'approved' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                    color: w.verification_status === 'approved' ? '#ef4444' : '#22c55e',
                    border: '1px solid currentColor',
                  }}
                >
                  {w.verification_status === 'approved' ? <><XCircle size={14} /> Suspend</> : <><CheckCircle size={14} /> Activate</>}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
