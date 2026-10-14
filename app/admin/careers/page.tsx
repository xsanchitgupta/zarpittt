'use client';

import { useState, useEffect } from 'react';
import { getAllCareers, createCareer, updateCareer, deleteCareer } from '@/app/actions/careers';
import { Plus, Trash2, Loader2, Save, Users } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import Modal from '@/components/Modal';
import Link from 'next/link';

export default function AdminCareers() {
  const [careers, setCareers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [saving, setSaving] = useState(false);

  // Inspector State
  const [selectedCareerId, setSelectedCareerId] = useState<string | null>(null);
  
  // Forms
  const [formData, setFormData] = useState({
    title: '', category: '', type: '', location: '', description: '', is_active: true
  });
  const [editData, setEditData] = useState({
    title: '', category: '', type: '', location: '', description: '', is_active: true
  });

  useEffect(() => {
    fetchCareers();
  }, []);

  const fetchCareers = async () => {
    try {
      const data = await getAllCareers();
      setCareers(data || []);
    } catch (err) {
      console.error('Fetch careers error:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    const fd = new FormData();
    fd.append('title', formData.title);
    fd.append('category', formData.category);
    fd.append('type', formData.type);
    fd.append('location', formData.location);
    fd.append('description', formData.description);
    fd.append('is_active', formData.is_active.toString());

    const res = await createCareer(fd);
    
    if (res.success) {
      setIsAdding(false);
      setFormData({ title: '', category: '', type: '', location: '', description: '', is_active: true });
      fetchCareers();
      toast.success('Success', 'Career added successfully');
    } else {
      toast.error('Error', 'Error creating career: ' + res.error);
    }
    setSaving(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this career? This will also delete all applications.')) return;
    
    const res = await deleteCareer(id);
    if (res.success) {
      toast.success('Deleted', 'Career removed successfully');
      setSelectedCareerId(null);
      fetchCareers();
    } else {
      toast.error('Error', 'Could not delete career: ' + res.error);
    }
  };

  const openInspector = (career: any) => {
    setSelectedCareerId(career.id);
    setEditData({
      title: career.title,
      category: career.category,
      type: career.type,
      location: career.location,
      description: career.description,
      is_active: career.is_active
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedCareerId) return;
    setSaving(true);
    
    const fd = new FormData();
    fd.append('title', editData.title);
    fd.append('category', editData.category);
    fd.append('type', editData.type);
    fd.append('location', editData.location);
    fd.append('description', editData.description);
    fd.append('is_active', editData.is_active.toString());

    const res = await updateCareer(selectedCareerId, fd);
    
    if (res.success) {
      toast.success('Updated', 'Career updated successfully');
      fetchCareers();
      setSelectedCareerId(null);
    } else {
      toast.error('Error', 'Could not update career: ' + res.error);
    }
    setSaving(false);
  };

  const selectedCareer = careers.find(c => c.id === selectedCareerId);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Careers
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> Add Career</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="admin-glass-panel" style={{ padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 8 }}>New Career Opening</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input required placeholder="Job Title (e.g. Full Stack Developer)" value={formData.title} onChange={e => setFormData({ ...formData, title: e.target.value })} className="admin-input" />
            <input required placeholder="Category (e.g. Engineering)" value={formData.category} onChange={e => setFormData({ ...formData, category: e.target.value })} className="admin-input" />
            <input required placeholder="Type (e.g. Full-time)" value={formData.type} onChange={e => setFormData({ ...formData, type: e.target.value })} className="admin-input" />
            <input required placeholder="Location (e.g. Remote)" value={formData.location} onChange={e => setFormData({ ...formData, location: e.target.value })} className="admin-input" />
          </div>
          <div>
            <textarea required placeholder="Job Description" value={formData.description} onChange={e => setFormData({ ...formData, description: e.target.value })} className="admin-input" style={{ minHeight: 120, resize: 'vertical' }} />
          </div>
          <div>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
              <input type="checkbox" checked={formData.is_active} onChange={e => setFormData({ ...formData, is_active: e.target.checked })} />
              <span style={{ fontSize: 14, color: 'var(--admin-text-primary)' }}>Active (Visible on website)</span>
            </label>
          </div>
          <button type="submit" disabled={saving} className="admin-btn admin-btn-primary">
            {saving ? <Loader2 className="animate-spin" size={20} /> : 'Save Career'}
          </button>
        </form>
      )}

      <div className="admin-glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : careers.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No careers found. Create your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {careers.map(career => (
              <div 
                key={career.id} 
                style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--admin-divider)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ flex: 1, cursor: 'pointer' }} onClick={() => openInspector(career)}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {career.title}
                    {!career.is_active && <span style={{fontSize: 10, padding: '2px 8px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)'}}>Inactive</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)', display: 'flex', gap: 12, marginTop: 4 }}>
                    <span>{career.category}</span>
                    <span>•</span>
                    <span>{career.type}</span>
                    <span>•</span>
                    <span>{career.location}</span>
                  </div>
                </div>
                <div>
                  <Link href={`/admin/careers/${career.id}`} className="admin-btn" style={{ fontSize: 13, padding: '6px 12px' }}>
                    <Users size={14} /> View Applications
                  </Link>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <Modal isOpen={!!selectedCareerId} onClose={() => setSelectedCareerId(null)} title="Edit Career" width={600}>
        {selectedCareer && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
              <div>
                <label className="admin-label">Job Title</label>
                <input className="admin-input" value={editData.title} onChange={e => setEditData({ ...editData, title: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Category</label>
                <input className="admin-input" value={editData.category} onChange={e => setEditData({ ...editData, category: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Type</label>
                <input className="admin-input" value={editData.type} onChange={e => setEditData({ ...editData, type: e.target.value })} />
              </div>
              <div>
                <label className="admin-label">Location</label>
                <input className="admin-input" value={editData.location} onChange={e => setEditData({ ...editData, location: e.target.value })} />
              </div>
            </div>
            <div>
              <label className="admin-label">Description</label>
              <textarea className="admin-input" value={editData.description} onChange={e => setEditData({ ...editData, description: e.target.value })} style={{ minHeight: 120 }} />
            </div>
            <div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer' }}>
                <input type="checkbox" checked={editData.is_active} onChange={e => setEditData({ ...editData, is_active: e.target.checked })} />
                <span style={{ fontSize: 14, color: 'var(--admin-text-primary)' }}>Active (Visible on website)</span>
              </label>
            </div>
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--admin-divider)' }}>
              <button onClick={() => handleDelete(selectedCareer.id)} className="admin-btn" style={{ flex: 1, background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}>
                <Trash2 size={16} /> Delete
              </button>
              <button onClick={handleSaveEdit} disabled={saving} className="admin-btn admin-btn-primary" style={{ flex: 2 }}>
                {saving ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
