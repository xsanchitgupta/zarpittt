'use client';

import { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/image';
import { Plus, Trash2, Image as ImageIcon, Loader2, Save } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminCategories() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [formData, setFormData] = useState({ name: '', slug: '', iconFile: null as File | null, iconUrl: '' });

  // Inspector State
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [editData, setEditData] = useState({
    name: '', slug: '', iconFile: null as File | null, is_coming_soon: false
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await adminFetch('/api/admin/categories');
      if (res.ok) {
        const data = await res.json();
        setCategories(data);
      }
    } catch (err) {
      console.error('Fetch categories error:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploading(true);

    let finalIconUrl = formData.iconUrl;

    if (formData.iconFile) {
      const data = new FormData();
      data.append('file', formData.iconFile);
      const res = await uploadImageToCloudinary(data);
      if (res.success && res.url) {
        finalIconUrl = res.url;
      } else {
        alert('Image upload failed');
        setUploading(false);
        return;
      }
    }

    const res = await adminFetch('/api/admin/categories', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: formData.name, 
        slug: formData.slug || formData.name.toLowerCase().replace(/\s+/g, '-'),
        icon: finalIconUrl 
      })
    });
    
    if (res.ok) {
      setIsAdding(false);
      setFormData({ name: '', slug: '', iconFile: null, iconUrl: '' });
      fetchCategories();
      toast.success('Success', 'Category added successfully');
    } else {
      const err = await res.json();
      toast.error('Error', 'Error creating category: ' + (err.error || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleDelete = async (id: string) => {
    // Check service count via API
    let count = 0;
    try {
      const countRes = await adminFetch(`/api/admin/services?category_id=${id}`);
      if (countRes.ok) {
        const services = await countRes.json();
        count = Array.isArray(services) ? services.length : 0;
      }
    } catch { /* proceed with 0 count */ }
    const warningMsg = count > 0 
      ? `WARNING: This will also delete ${count} associated service(s). Are you sure?`
      : 'Are you sure you want to delete this category?';
      
    if (!confirm(warningMsg)) return;
    
    const res = await adminFetch(`/api/admin/categories?id=${id}`, { method: 'DELETE' });
    if (res.ok) {
      toast.success('Deleted', 'Category removed successfully');
      setSelectedCategoryId(null);
      fetchCategories();
    } else {
      const err = await res.json();
      toast.error('Error', 'Could not delete category: ' + (err.error || 'Unknown error'));
    }
  };

  const openInspector = (cat: any) => {
    setSelectedCategoryId(cat.id);
    setEditData({
      name: cat.name,
      slug: cat.slug,
      iconFile: null,
      is_coming_soon: cat.is_coming_soon || false
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedCategoryId) return;
    setSavingEdit(true);
    let finalIconUrl = categories.find(c => c.id === selectedCategoryId)?.icon;

    if (editData.iconFile) {
      const data = new FormData();
      data.append('file', editData.iconFile);
      const res = await uploadImageToCloudinary(data);
      if (res.success && res.url) {
        finalIconUrl = res.url;
      } else {
        toast.error('Error', 'Image upload failed');
        setSavingEdit(false);
        return;
      }
    }

    const res = await adminFetch('/api/admin/categories', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedCategoryId,
        name: editData.name,
        slug: editData.slug || editData.name.toLowerCase().replace(/\s+/g, '-'),
        icon: finalIconUrl,
        is_coming_soon: editData.is_coming_soon
      })
    });
    
    if (res.ok) {
      toast.success('Updated', 'Category updated successfully');
      fetchCategories();
      setSelectedCategoryId(null);
    } else {
      const err = await res.json();
      toast.error('Error', 'Could not update category: ' + (err.error || 'Unknown error'));
    }
    setSavingEdit(false);
  };

  const selectedCategory = categories.find(c => c.id === selectedCategoryId);

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Categories
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> Add Category</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="admin-glass-panel" style={{ padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 8 }}>New Category</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
            <input 
              required
              placeholder="Category Name (e.g. Electrician)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)' }}
            />
            <input 
              placeholder="Slug (optional, auto-generated)"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)' }}
            />
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--admin-text-secondary)' }}>Category Icon Image</label>
            <input 
              type="file" 
              accept="image/*"
              onChange={e => setFormData({ ...formData, iconFile: e.target.files?.[0] || null })}
              style={{ display: 'block', width: '100%', padding: 12, borderRadius: 8, border: '1px dashed var(--admin-border)', color: 'var(--admin-text-primary)' }}
            />
          </div>

          <button type="submit" disabled={uploading} style={{ padding: '12px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Save Category'}
          </button>
        </form>
      )}

      <div className="admin-glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : categories.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No categories found. Create your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {categories.map(cat => (
              <div 
                key={cat.id} 
                onClick={() => openInspector(cat)}
                style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--admin-divider)', cursor: 'pointer', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                <div style={{ width: 48, height: 48, borderRadius: 12, background: 'var(--admin-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 16 }}>
                  {cat.icon ? <img src={cat.icon} alt={cat.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon color="var(--admin-text-tertiary)" />}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                    {cat.name}
                    {cat.is_coming_soon && <span style={{fontSize: 10, padding: '2px 8px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)'}}>Coming Soon</span>}
                  </div>
                  <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>/{cat.slug}</div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Category Inspector Modal */}
      <Modal isOpen={!!selectedCategoryId} onClose={() => setSelectedCategoryId(null)} title="Category Inspector" width={500}>
        {selectedCategory && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header / Current Image */}
            <div style={{ display: 'flex', gap: 20 }}>
              <div style={{ width: 100, height: 100, borderRadius: 16, overflow: 'hidden', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {selectedCategory.icon ? (
                  <img src={selectedCategory.icon} alt={selectedCategory.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <ImageIcon color="var(--admin-text-tertiary)" />
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Replace Icon</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setEditData({ ...editData, iconFile: e.target.files?.[0] || null })}
                  style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px dashed var(--admin-border)', color: 'var(--admin-text-primary)', background: 'var(--admin-glass-active)' }}
                />
              </div>
            </div>

            {/* Editing Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Category Name</label>
                <input 
                  className="admin-input"
                  value={editData.name}
                  onChange={e => setEditData({ ...editData, name: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Slug</label>
                <input 
                  className="admin-input"
                  value={editData.slug}
                  onChange={e => setEditData({ ...editData, slug: e.target.value })}
                />
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Status</label>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', padding: '10px 16px', background: editData.is_coming_soon ? 'var(--warning-bg)' : 'var(--admin-glass-active)', border: '1px solid', borderColor: editData.is_coming_soon ? 'rgba(245, 158, 11, 0.3)' : 'var(--admin-border)', borderRadius: 12, transition: 'all 0.2s' }}>
                  <input 
                    type="checkbox" 
                    checked={editData.is_coming_soon}
                    onChange={e => setEditData({ ...editData, is_coming_soon: e.target.checked })}
                    style={{ width: 16, height: 16, accentColor: 'var(--warning)' }}
                  />
                  <span style={{ fontSize: 14, fontWeight: 600, color: editData.is_coming_soon ? 'var(--warning)' : 'var(--admin-text-primary)' }}>Coming Soon</span>
                </label>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--admin-divider)' }}>
              <button 
                onClick={() => handleDelete(selectedCategory.id)} 
                className="admin-btn"
                style={{ flex: 1, background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}
              >
                <Trash2 size={16} /> Delete
              </button>
              <button 
                onClick={handleSaveEdit} 
                disabled={savingEdit}
                className="admin-btn admin-btn-primary"
                style={{ flex: 2 }}
              >
                {savingEdit ? <Loader2 className="animate-spin" size={16} /> : <><Save size={16} /> Save Changes</>}
              </button>
            </div>
          </div>
        )}
      </Modal>
    </div>
  );
}
