'use client';

import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import type { Testimonial, Service } from '@/lib/database.types';
import ToastContainer, { toast } from '@/components/Toast';
import { Plus, Edit2, Trash2, CheckCircle2, XCircle, Search, RefreshCw, Star } from 'lucide-react';

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingReview, setEditingReview] = useState<Testimonial | null>(null);
  const [services, setServices] = useState<Service[]>([]);

  // Form states
  const [formData, setFormData] = useState({
    user_name: '',
    location: '',
    avatar: '',
    rating: 5,
    text: '',
    service_name: '',
    service_id: null as number | null,
    is_featured: false,
    is_approved: true
  });

  const fetchReviews = async () => {
    setLoading(true);
    const { data, error } = await supabase.from('testimonials').select('*').order('created_at', { ascending: false });
    if (error) {
      toast.error('Error fetching reviews', error.message);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  };

  const fetchServices = async () => {
    const { data } = await supabase.from('services').select('id, name');
    if (data) setServices(data as Service[]);
  };

  useEffect(() => {
    fetchReviews();
    fetchServices();
  }, []);

  const handleOpenModal = (review: Testimonial | null = null) => {
    if (review) {
      setEditingReview(review);
      setFormData({
        user_name: review.user_name,
        location: review.location,
        avatar: review.avatar,
        rating: review.rating,
        text: review.text,
        service_name: review.service_name,
        service_id: review.service_id || null,
        is_featured: review.is_featured,
        is_approved: review.is_approved
      });
    } else {
      setEditingReview(null);
      setFormData({
        user_name: '', location: 'Noida', avatar: 'U', rating: 5, text: '', service_name: '', service_id: null, is_featured: false, is_approved: true
      });
    }
    setIsModalOpen(true);
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (editingReview) {
      const { error } = await supabase.from('testimonials').update(formData).eq('id', editingReview.id);
      if (error) toast.error('Error', error.message);
      else { toast.success('Saved', 'Review updated successfully'); fetchReviews(); setIsModalOpen(false); }
    } else {
      const { error } = await supabase.from('testimonials').insert([formData]);
      if (error) toast.error('Error', error.message);
      else { toast.success('Saved', 'Review added successfully'); fetchReviews(); setIsModalOpen(false); }
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this review?')) return;
    const { error } = await supabase.from('testimonials').delete().eq('id', id);
    if (error) toast.error('Error', error.message);
    else { toast.success('Deleted', 'Review removed'); fetchReviews(); }
  };

  const generateFakeReview = () => {
    const fakeReviews = [
      { name: 'Amit Kumar', text: 'Bohot badhiya service thi. The professional came on time and did a fantastic job.', loc: 'Greater Noida' },
      { name: 'Neha Sharma', text: 'Highly recommend Zarpit! Fast, clean, and perfectly executed. Ekdum top class.', loc: 'Noida Ext.' },
      { name: 'Rahul Verma', text: 'Pricing is reasonable and service is outstanding. Pura kaam efficiently hua.', loc: 'Gaur City' },
      { name: 'Priya S.', text: 'Absolutely love the premium feel of the service. Worth every penny!', loc: 'Sector 62' }
    ];
    const services = ['Sofa Cleaning', 'Bathroom Deep Clean', 'AC Servicing', 'Pest Control', 'Plumbing Repair'];
    
    const randReview = fakeReviews[Math.floor(Math.random() * fakeReviews.length)];
    const randService = services[Math.floor(Math.random() * services.length)];
    
    setFormData({
      user_name: randReview.name,
      location: randReview.loc,
      avatar: randReview.name.charAt(0),
      rating: 5,
      text: randReview.text,
      service_name: randService,
      service_id: null,
      is_featured: false,
      is_approved: true
    });
  };

  const filtered = reviews.filter(r => r.service_name.toLowerCase().includes(searchQuery.toLowerCase()) || r.text.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div style={{ padding: 24, animation: 'fadeIn 0.3s ease' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 800 }}>Reviews Management</h1>
          <p style={{ color: 'var(--text-secondary)' }}>Manage customer testimonials & auto-generated reviews.</p>
        </div>
        <button onClick={() => handleOpenModal()} className="btn btn-primary" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <Plus size={18} /> Add Review
        </button>
      </div>

      <div className="admin-glass-panel" style={{ padding: 24, marginBottom: 24 }}>
        <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
          <div style={{ position: 'relative', flex: 1 }}>
            <Search size={18} style={{ position: 'absolute', left: 16, top: 16, color: 'var(--text-muted)' }} />
            <input type="text" className="input" placeholder="Search by service or text..." value={searchQuery} onChange={e => setSearchQuery(e.target.value)} style={{ paddingLeft: 44, width: '100%', maxWidth: 400 }} />
          </div>
          <button onClick={fetchReviews} className="btn btn-secondary" style={{ padding: '0 16px' }} title="Refresh">
            <RefreshCw size={18} className={loading ? 'spin' : ''} />
          </button>
        </div>
      </div>

      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 40 }}><div className="spinner" /></div>
      ) : (
        <div className="admin-glass-panel" style={{ overflow: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--admin-divider)' }}>
                <th style={{ padding: 16, color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 13 }}>Customer</th>
                <th style={{ padding: 16, color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 13 }}>Service</th>
                <th style={{ padding: 16, color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 13 }}>Rating</th>
                <th style={{ padding: 16, color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 13 }}>Review</th>
                <th style={{ padding: 16, color: 'var(--admin-text-secondary)', fontWeight: 600, fontSize: 13 }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(r => (
                <tr key={r.id} style={{ borderBottom: '1px solid var(--admin-divider)' }}>
                  <td style={{ padding: 16 }}>
                    <div style={{ fontWeight: 600 }}>{r.user_name}</div>
                    <div style={{ fontSize: 12, color: 'var(--text-muted)' }}>{r.location}</div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <span style={{ padding: '4px 8px', background: 'var(--admin-glass-active)', borderRadius: 6, fontSize: 12 }}>{r.service_name}</span>
                  </td>
                  <td style={{ padding: 16, color: '#FAAF00', fontWeight: 700, fontSize: 14 }}>
                    {r.rating} ★
                  </td>
                  <td style={{ padding: 16, maxWidth: 300 }}>
                    <div style={{ fontSize: 13, lineHeight: 1.5, display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>{r.text}</div>
                  </td>
                  <td style={{ padding: 16 }}>
                    <div style={{ display: 'flex', gap: 8 }}>
                      <button onClick={() => handleOpenModal(r)} className="btn btn-ghost btn-sm" style={{ color: '#3b82f6' }}><Edit2 size={16} /></button>
                      <button onClick={() => handleDelete(r.id)} className="btn btn-ghost btn-sm" style={{ color: 'var(--error)' }}><Trash2 size={16} /></button>
                    </div>
                  </td>
                </tr>
              ))}
              {filtered.length === 0 && (
                <tr>
                  <td colSpan={5} style={{ padding: 40, textAlign: 'center', color: 'var(--text-muted)' }}>No reviews found.</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      {isModalOpen && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000, padding: 24 }}>
          <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 24, padding: 32, width: '100%', maxWidth: 500, boxShadow: 'var(--shadow-xl)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{editingReview ? 'Edit Review' : 'Add Review'}</h2>
              <button onClick={() => setIsModalOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer' }}><XCircle size={24} /></button>
            </div>

            {!editingReview && (
              <button onClick={generateFakeReview} type="button" className="btn btn-secondary" style={{ width: '100%', marginBottom: 24, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <Star size={16} /> Generate AI Fake Review (Eng/Hinglish)
              </button>
            )}

            <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>User Name</label>
                  <input className="input" required value={formData.user_name} onChange={e => setFormData({...formData, user_name: e.target.value})} />
                </div>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Location</label>
                  <input className="input" required value={formData.location} onChange={e => setFormData({...formData, location: e.target.value})} />
                </div>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Target Service (Optional)</label>
                <select className="input" value={formData.service_id || ''} onChange={e => setFormData({...formData, service_id: e.target.value ? parseInt(e.target.value) : null, service_name: e.target.value ? services.find(s => s.id === parseInt(e.target.value))?.name || formData.service_name : formData.service_name})}>
                  <option value="">Global Review (No specific service)</option>
                  {services.map(s => (
                    <option key={s.id} value={s.id}>{s.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Service Name Tag (Displayed text)</label>
                <input className="input" required placeholder="e.g. Sofa Cleaning" value={formData.service_name} onChange={e => setFormData({...formData, service_name: e.target.value})} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Rating (1-5)</label>
                <input className="input" type="number" min="1" max="5" required value={formData.rating} onChange={e => setFormData({...formData, rating: parseInt(e.target.value)})} />
              </div>

              <div>
                <label style={{ fontSize: 12, fontWeight: 700, color: 'var(--text-muted)', marginBottom: 8, display: 'block' }}>Review Text</label>
                <textarea className="input" required style={{ height: 100, resize: 'none' }} value={formData.text} onChange={e => setFormData({...formData, text: e.target.value})} />
              </div>

              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                <button type="button" onClick={() => setIsModalOpen(false)} className="btn btn-secondary" style={{ flex: 1 }}>Cancel</button>
                <button type="submit" className="btn btn-primary" style={{ flex: 1 }}>Save Review</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
