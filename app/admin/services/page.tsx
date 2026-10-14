'use client';

import { useState, useEffect } from 'react';
import { uploadImageToCloudinary } from '@/app/actions/image';
import type { Service, Category } from '@/lib/database.types';
import { Plus, Trash2, Loader2, Image as ImageIcon, Save, CheckCircle2, X, ArrowUp, ArrowDown } from 'lucide-react';
import { formatPrice } from '@/lib/utils';
import ToastContainer, { toast } from '@/components/Toast';
import Modal from '@/components/Modal';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminServices() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [services, setServices] = useState<any[]>([]); // Using any because of joined data
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [uploading, setUploading] = useState(false);
  
  // Selected service for the Inspector
  const [selectedServiceId, setSelectedServiceId] = useState<number | null>(null);
  
  const [formData, setFormData] = useState({ 
    name: '', category_id: '', description: '', price: '', duration: '60 mins', imageFile: null as File | null, imageUrl: '',
    included: [''], not_included: [''],
    variants: [] as {name: string, price: string}[],
    is_independent: false,
    gallery_images: '',
    video_url: ''
  });

  const [editData, setEditData] = useState({
    name: '', description: '', price: '', category_id: '', included: [''], not_included: [''], imageFile: null as File | null, is_coming_soon: false,
    variants: [] as {name: string, price: string, duration: string}[],
    is_independent: false,
    buffer_time: '0.5',
    duration_minutes: '60',
    variant_durations: {} as Record<string, number>,
    gallery_images: '',
    video_url: ''
  });
  const [savingEdit, setSavingEdit] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      const [catRes, serRes] = await Promise.all([
        adminFetch('/api/admin/categories'),
        adminFetch('/api/admin/services')
      ]);
      
      if (catRes.ok) {
        const catData = await catRes.json();
        setCategories(catData);
      }
      
      if (serRes.ok) {
        const serData = await serRes.json();
        setServices(serData);
      }
    } catch (err) {
      console.error('Fetch data error:', err);
    }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.is_independent && !formData.category_id) return alert('Select a category or mark as independent');
    
    setUploading(true);
    let finalImageUrl = formData.imageUrl;

    if (formData.imageFile) {
      const data = new FormData();
      data.append('file', formData.imageFile);
      const res = await uploadImageToCloudinary(data);
      if (res.success && res.url) {
        finalImageUrl = res.url;
      } else {
        alert('Image upload failed');
        setUploading(false);
        return;
      }
    }

    const includedList = formData.included.filter(s => s.trim());
    const notIncludedList = formData.not_included.filter(s => s.trim());
    const variantsList = formData.variants.filter(v => v.name.trim() && v.price.trim()).map(v => ({ name: v.name, price: parseInt(v.price) || 0 }));
    
    // Automatically set the base price to the lowest variant price if variants exist
    const basePrice = variantsList.length > 0 ? Math.min(...variantsList.map(v => v.price)) : (parseInt(formData.price) || 0);

    const maxSortOrder = services.length > 0 ? Math.max(...services.map(s => s.sort_order || 0)) : 0;

    const res = await adminFetch('/api/admin/services', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        name: formData.name, 
        category_id: formData.is_independent ? null : formData.category_id,
        description: formData.description,
        price: basePrice,
        duration: formData.duration,
        image_url: finalImageUrl,
        included: includedList,
        not_included: notIncludedList,
        variants: variantsList,
        sort_order: maxSortOrder + 1,
        is_independent: formData.is_independent,
        gallery_images: formData.gallery_images.split(',').map(s => s.trim()).filter(Boolean),
        video_url: formData.video_url.trim() || null
      })
    });

    if (res.ok) {
      setIsAdding(false);
      setFormData({ name: '', category_id: '', description: '', price: '', duration: '60 mins', imageFile: null, imageUrl: '', included: [''], not_included: [''], variants: [], is_independent: false, gallery_images: '', video_url: '' });
      fetchData();
      toast.success('Success', 'Service added successfully');
    } else {
      const err = await res.json();
      toast.error('Error', 'Error creating service: ' + (err.error || 'Unknown error'));
    }
    setUploading(false);
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this service?')) return;
    try {
      const res = await adminFetch(`/api/admin/services?id=${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Deleted', 'Service removed successfully');
        setSelectedServiceId(null);
        fetchData();
      } else {
        const err = await res.json();
        toast.error('Error', err.error || 'Could not delete service');
      }
    } catch (err) {
      toast.error('Error', 'Connection failed');
    }
  };

  const openInspector = (service: any) => {
    setSelectedServiceId(service.id);
    const vd = service.variant_durations || {};
    setEditData({
      name: service.name,
      description: service.description || '',
      price: String(service.price),
      category_id: service.category_id || '',
      included: service.included && service.included.length > 0 ? service.included : [''],
      not_included: service.not_included && service.not_included.length > 0 ? service.not_included : [''],
      imageFile: null,
      is_coming_soon: service.is_coming_soon || false,
      is_independent: service.is_independent || false,
      variants: service.variants ? service.variants.map((v: any) => ({ name: v.name, price: String(v.price), duration: String(vd[v.name] || '') })) : [],
      buffer_time: String(service.buffer_time ?? 0.5),
      duration_minutes: String(service.duration_minutes ?? 60),
      variant_durations: vd,
      gallery_images: (service.gallery_images || []).join(', '),
      video_url: service.video_url || '',
    });
  };

  const handleSaveEdit = async () => {
    if (!selectedServiceId) return;
    setSavingEdit(true);
    
    // Find the current service to get its image_url if not replaced
    const currentService = services.find(s => String(s.id) === String(selectedServiceId));
    let finalImageUrl = currentService?.image_url;

    if (editData.imageFile) {
      const data = new FormData();
      data.append('file', editData.imageFile);
      const res = await uploadImageToCloudinary(data);
      if (res.success && res.url) {
        finalImageUrl = res.url;
      } else {
        toast.error('Error', 'Image upload failed');
        setSavingEdit(false);
        return;
      }
    }

    const includedList = editData.included.filter(s => s.trim());
    const notIncludedList = editData.not_included.filter(s => s.trim());
    const variantsList = editData.variants.filter(v => v.name.trim() && v.price.trim()).map(v => ({ name: v.name, price: parseInt(v.price) || 0 }));
    
    // Build variant_durations from variant rows
    const variantDurations: Record<string, number> = {};
    editData.variants.filter(v => v.name.trim() && v.duration.trim()).forEach(v => {
      variantDurations[v.name.trim()] = parseInt(v.duration) || 0;
    });

    // Automatically set the base price to the lowest variant price if variants exist
    const basePrice = variantsList.length > 0 ? Math.min(...variantsList.map(v => v.price)) : (parseInt(editData.price) || 0);

    const res = await adminFetch('/api/admin/services', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        id: selectedServiceId,
        name: editData.name,
        category_id: editData.category_id,
        description: editData.description,
        price: basePrice,
        image_url: finalImageUrl,
        is_coming_soon: editData.is_coming_soon,
        is_independent: editData.is_independent,
        included: includedList,
        not_included: notIncludedList,
        variants: variantsList,
        buffer_time: parseFloat(editData.buffer_time) || 0.5,
        duration_minutes: parseInt(editData.duration_minutes) || 60,
        variant_durations: variantDurations,
        gallery_images: editData.gallery_images.split(',').map(s => s.trim()).filter(Boolean),
        video_url: editData.video_url.trim() || null
      })
    });

    if (!res.ok) {
      const err = await res.json();
      toast.error('Update Failed', err.error || 'Server error');
    } else {
      const saved = await res.json().catch(() => ({}));
      if (saved?._warning) {
        toast.info('Saved with a note', saved._warning);
      } else {
        toast.success('Success', 'Service updated successfully');
      }
      await fetchData();
      setSelectedServiceId(null);
    }
    setSavingEdit(false);
  };

  const moveService = async (index: number, direction: 'up' | 'down') => {
    const newServices = [...services];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex < 0 || targetIndex >= newServices.length) return;
    
    // If any services have the same or missing sort_order, re-index them all
    const hasDuplicates = new Set(newServices.map(s => s.sort_order || 0)).size !== newServices.length;
    const hasZeros = newServices.some(s => !s.sort_order);
    
    if (hasDuplicates || hasZeros) {
      console.log('Re-indexing services to ensure unique sort orders...');
      newServices.forEach((s, i) => {
        s.sort_order = i + 1;
      });
    }

    const current = { ...newServices[index] };
    const target = { ...newServices[targetIndex] };
    
    // Swap sort_order
    const tempOrder = current.sort_order;
    current.sort_order = target.sort_order;
    target.sort_order = tempOrder;
    
    // Special case: if orders are still identical (shouldn't happen with re-index above)
    if (current.sort_order === target.sort_order) {
      current.sort_order = index + 1;
      target.sort_order = targetIndex + 1;
    }

    // Update local state immediately for snappy UI
    newServices[index] = target;
    newServices[targetIndex] = current;
    setServices([...newServices]);
    
    // Update database via API for each swapped service
    try {
      const [res1, res2] = await Promise.all([
        adminFetch('/api/admin/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: current.id, sort_order: current.sort_order })
        }),
        adminFetch('/api/admin/services', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ id: target.id, sort_order: target.sort_order })
        })
      ]);
      if (!res1.ok || !res2.ok) {
        toast.error('Persistence Error', 'Could not save new order');
        fetchData();
      }
    } catch (err) {
      toast.error('Persistence Error', 'Could not save new order');
      fetchData();
    }
  };

  const selectedService = services.find(s => String(s.id) === String(selectedServiceId));

  return (
    <div style={{ maxWidth: 1000, margin: '0 auto' }}>
      <ToastContainer />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 32 }}>
        <h1 style={{ fontFamily: '-apple-system, BlinkMacSystemFont, sans-serif', fontSize: '2rem', fontWeight: 700, color: 'var(--admin-text-primary)' }}>
          Services
        </h1>
        <button 
          onClick={() => setIsAdding(!isAdding)}
          style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '10px 16px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 12, border: 'none', fontWeight: 600, cursor: 'pointer' }}
        >
          {isAdding ? 'Cancel' : <><Plus size={18} /> Add Service</>}
        </button>
      </div>

      {isAdding && (
        <form onSubmit={handleSubmit} className="admin-glass-panel" style={{ padding: 24, marginBottom: 32, display: 'flex', flexDirection: 'column', gap: 16 }}>
          <h3 style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--admin-text-primary)', marginBottom: 8 }}>New Service</h3>
          <div className="admin-grid-2">
            <input 
              required
              placeholder="Service Name (e.g. AC Repair)"
              value={formData.name}
              onChange={e => setFormData({ ...formData, name: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)' }}
            />
            <select 
              required={!formData.is_independent}
              value={formData.category_id}
              onChange={e => setFormData({ ...formData, category_id: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)', opacity: formData.is_independent ? 0.5 : 1 }}
              disabled={formData.is_independent}
            >
              <option value="">{formData.is_independent ? 'No Category (Independent)' : 'Select Category'}</option>
              {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          
          <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '10px 16px', background: 'var(--admin-glass-active)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
            <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
              <input 
                type="checkbox" 
                checked={formData.is_independent}
                onChange={e => setFormData({ ...formData, is_independent: e.target.checked, category_id: e.target.checked ? '' : formData.category_id })}
                style={{ width: 18, height: 18, accentColor: 'var(--admin-text-primary)' }}
              />
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)' }}>Independent Service</span>
                <span style={{ fontSize: 11, color: 'var(--admin-text-secondary)' }}>This service doesn't belong to any specific category.</span>
              </div>
            </label>
          </div>
          
          <div className="admin-grid-2">
            <input 
              required={formData.variants.length === 0}
              type="number"
              placeholder={formData.variants.length > 0 ? "Base Price (Auto-calculated)" : "Price (₹)"}
              value={formData.price}
              disabled={formData.variants.length > 0}
              onChange={e => setFormData({ ...formData, price: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: formData.variants.length > 0 ? 'var(--admin-glass-active)' : 'var(--admin-surface)', color: 'var(--admin-text-primary)' }}
            />
            <input 
              required
              placeholder="Duration (e.g. 60 mins)"
              value={formData.duration}
              onChange={e => setFormData({ ...formData, duration: e.target.value })}
              style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)' }}
            />
          </div>

          <div>
            <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
              <span>Subcategories (Variants) & Pricing</span>
              <button type="button" onClick={() => setFormData({ ...formData, variants: [...formData.variants, {name: '', price: ''}] })} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Variant</button>
            </label>
            {formData.variants.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.variants.map((v, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="admin-input" 
                      value={v.name} 
                      placeholder="Variant Name (e.g. 1 BHK)"
                      onChange={e => {
                        const newList = [...formData.variants];
                        newList[i].name = e.target.value;
                        setFormData({ ...formData, variants: newList });
                      }}
                      style={{ flex: 2 }}
                    />
                    <input 
                      type="number"
                      className="admin-input" 
                      value={v.price} 
                      placeholder="Price (₹)"
                      onChange={e => {
                        const newList = [...formData.variants];
                        newList[i].price = e.target.value;
                        setFormData({ ...formData, variants: newList });
                      }}
                      style={{ flex: 1 }}
                    />
                    <button type="button" onClick={() => setFormData({ ...formData, variants: formData.variants.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 10px' }}>
                      <X size={16} />
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary)', padding: '8px 0' }}>No variants added. Service will use the single Base Price.</div>
            )}
          </div>

          <textarea 
            placeholder="Service Description"
            value={formData.description}
            onChange={e => setFormData({ ...formData, description: e.target.value })}
            style={{ padding: 12, borderRadius: 8, border: '1px solid var(--admin-border)', background: 'var(--admin-surface)', color: 'var(--admin-text-primary)', minHeight: 80 }}
          />
          
          <div className="admin-grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>What's Included</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.included.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="admin-input" 
                      value={item} 
                      placeholder="e.g. Free consultation"
                      onChange={e => {
                        const newList = [...formData.included];
                        newList[i] = e.target.value;
                        setFormData({ ...formData, included: newList });
                      }}
                      style={{ flex: 1 }}
                    />
                    {formData.included.length > 1 && (
                      <button type="button" onClick={() => setFormData({ ...formData, included: formData.included.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 10px' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, included: [...formData.included, ''] })} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--admin-border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                  + Add Point
                </button>
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>What's Not Included</label>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {formData.not_included.map((item, i) => (
                  <div key={i} style={{ display: 'flex', gap: 8 }}>
                    <input 
                      className="admin-input" 
                      value={item} 
                      placeholder="e.g. Spare parts"
                      onChange={e => {
                        const newList = [...formData.not_included];
                        newList[i] = e.target.value;
                        setFormData({ ...formData, not_included: newList });
                      }}
                      style={{ flex: 1 }}
                    />
                    {formData.not_included.length > 1 && (
                      <button type="button" onClick={() => setFormData({ ...formData, not_included: formData.not_included.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 10px' }}>
                        <X size={16} />
                      </button>
                    )}
                  </div>
                ))}
                <button type="button" onClick={() => setFormData({ ...formData, not_included: [...formData.not_included, ''] })} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--admin-border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                  + Add Point
                </button>
              </div>
            </div>
          </div>
          
          <div>
            <label style={{ display: 'block', marginBottom: 8, fontSize: 14, color: 'var(--admin-text-secondary)' }}>Service Image</label>
            <input 
              type="file" 
              accept="image/*"
              required
              onChange={e => setFormData({ ...formData, imageFile: e.target.files?.[0] || null })}
              style={{ display: 'block', width: '100%', padding: 12, borderRadius: 8, border: '1px dashed var(--admin-border)', color: 'var(--admin-text-primary)' }}
            />
          </div>

          <div className="admin-grid-2">
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Additional Gallery Images (Comma-separated URLs)</label>
              <textarea 
                className="admin-input" 
                placeholder="https://...1.jpg, https://...2.jpg"
                value={formData.gallery_images}
                onChange={e => setFormData({ ...formData, gallery_images: e.target.value })}
                style={{ minHeight: 60, resize: 'vertical' }}
              />
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: 8, fontSize: 13, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Video URL (Optional)</label>
              <input 
                className="admin-input" 
                placeholder="https://youtube.com/..."
                value={formData.video_url}
                onChange={e => setFormData({ ...formData, video_url: e.target.value })}
              />
            </div>
          </div>

          <button type="submit" disabled={uploading} style={{ padding: '12px', background: 'var(--admin-text-primary)', color: 'var(--admin-surface)', borderRadius: 8, border: 'none', fontWeight: 600, cursor: uploading ? 'not-allowed' : 'pointer', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>
            {uploading ? <Loader2 className="animate-spin" size={20} /> : 'Save Service'}
          </button>
        </form>
      )}

      <div className="admin-glass-panel" style={{ overflow: 'hidden' }}>
        {loading ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}><Loader2 className="animate-spin" style={{ margin: '0 auto' }} /></div>
        ) : services.length === 0 ? (
          <div style={{ padding: 40, textAlign: 'center', color: 'var(--admin-text-secondary)' }}>No services found. Create your first one.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            {services.map((ser, index) => (
              <div 
                key={ser.id} 
                style={{ display: 'flex', alignItems: 'center', padding: '16px 24px', borderBottom: '1px solid var(--admin-divider)', transition: 'background 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.background = 'var(--admin-glass-hover)'}
                onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
              >
                {/* Reorder Controls */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, marginRight: 16 }}>
                  <button 
                    disabled={index === 0}
                    onClick={(e) => { e.stopPropagation(); moveService(index, 'up'); }}
                    style={{ background: 'transparent', border: 'none', color: index === 0 ? 'var(--admin-text-tertiary)' : 'var(--admin-text-secondary)', cursor: index === 0 ? 'default' : 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => index !== 0 && (e.currentTarget.style.background = 'var(--admin-surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ArrowUp size={16} />
                  </button>
                  <button 
                    disabled={index === services.length - 1}
                    onClick={(e) => { e.stopPropagation(); moveService(index, 'down'); }}
                    style={{ background: 'transparent', border: 'none', color: index === services.length - 1 ? 'var(--admin-text-tertiary)' : 'var(--admin-text-secondary)', cursor: index === services.length - 1 ? 'default' : 'pointer', padding: 4, borderRadius: 4, display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                    onMouseEnter={e => index !== services.length - 1 && (e.currentTarget.style.background = 'var(--admin-surface)')}
                    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                  >
                    <ArrowDown size={16} />
                  </button>
                </div>

                <div 
                  onClick={() => openInspector(ser)}
                  style={{ display: 'flex', alignItems: 'center', flex: 1, cursor: 'pointer' }}
                >
                  <div style={{ width: 64, height: 48, borderRadius: 8, background: 'var(--admin-surface)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', marginRight: 16 }}>
                    {ser.image_url ? <img src={ser.image_url} alt={ser.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <ImageIcon color="var(--admin-text-tertiary)" />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 16, fontWeight: 600, color: 'var(--admin-text-primary)', display: 'flex', alignItems: 'center', gap: 8 }}>
                      {ser.name}
                      {ser.is_coming_soon && <span style={{fontSize: 10, padding: '2px 8px', background: 'var(--warning-bg)', color: 'var(--warning)', borderRadius: 12, border: '1px solid rgba(245, 158, 11, 0.2)'}}>Coming Soon</span>}
                    </div>
                    <div style={{ fontSize: 13, color: 'var(--admin-text-secondary)' }}>{ser.is_independent ? ser.name : (ser.categories?.name || 'No Category')} • {ser.duration}</div>
                  </div>
                  <div style={{ marginRight: 24, fontWeight: 600, color: 'var(--admin-text-primary)' }}>
                    {formatPrice(ser.price)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Services Inspector Modal */}
      <Modal isOpen={!!selectedServiceId} onClose={() => setSelectedServiceId(null)} title="Service Inspector" width={600}>
        {selectedService && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            {/* Header / Current Image */}
            <div className="admin-inspector-header">
              <div style={{ width: 120, height: 120, borderRadius: 16, overflow: 'hidden', background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', flexShrink: 0 }}>
                {selectedService.image_url ? (
                  <img src={selectedService.image_url} alt={selectedService.name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--admin-text-tertiary)' }}><ImageIcon /></div>
                )}
              </div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
                <label style={{ fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Replace Image</label>
                <input 
                  type="file" 
                  accept="image/*"
                  onChange={e => setEditData({ ...editData, imageFile: e.target.files?.[0] || null })}
                  style={{ display: 'block', width: '100%', padding: '10px 12px', fontSize: 13, borderRadius: 8, border: '1px dashed var(--admin-border)', color: 'var(--admin-text-primary)', background: 'var(--admin-glass-active)' }}
                />
              </div>
            </div>

            {/* Editing Form */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <div className="admin-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Service Name</label>
                  <input 
                    className="admin-input"
                    value={editData.name}
                    onChange={e => setEditData({ ...editData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Category</label>
                  <select 
                    className="admin-input"
                    value={editData.category_id}
                    required={!editData.is_independent}
                    disabled={editData.is_independent}
                    onChange={e => setEditData({ ...editData, category_id: e.target.value })}
                    style={{ opacity: editData.is_independent ? 0.5 : 1 }}
                  >
                    <option value="">{editData.is_independent ? 'No Category' : 'Select Category'}</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
              </div>
              
              <div style={{ display: 'flex', gap: 16, alignItems: 'center', padding: '12px 16px', background: 'var(--admin-glass-active)', borderRadius: 12, border: '1px solid var(--admin-border)' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: 10, cursor: 'pointer', flex: 1 }}>
                  <input 
                    type="checkbox" 
                    checked={editData.is_independent}
                    onChange={e => setEditData({ ...editData, is_independent: e.target.checked, category_id: e.target.checked ? '' : editData.category_id })}
                    style={{ width: 18, height: 18, accentColor: 'var(--admin-text-primary)' }}
                  />
                  <div style={{ display: 'flex', flexDirection: 'column' }}>
                    <span style={{ fontSize: 14, fontWeight: 700, color: 'var(--admin-text-primary)' }}>Independent Service</span>
                    <span style={{ fontSize: 11, color: 'var(--admin-text-secondary)' }}>Bypasses category requirements.</span>
                  </div>
                </label>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Description</label>
                <textarea 
                  className="admin-input"
                  style={{ minHeight: 80, resize: 'vertical' }}
                  value={editData.description}
                  onChange={e => setEditData({ ...editData, description: e.target.value })}
                />
              </div>
              <div className="admin-grid-2">
                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Included</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editData.included.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input 
                          className="admin-input" 
                          value={item} 
                          placeholder="e.g. Free consultation"
                          onChange={e => {
                            const newList = [...editData.included];
                            newList[i] = e.target.value;
                            setEditData({ ...editData, included: newList });
                          }}
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setEditData({ ...editData, included: editData.included.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 8px' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditData({ ...editData, included: [...editData.included, ''] })} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--admin-border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                      + Add Point
                    </button>
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Not Included</label>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {editData.not_included.map((item, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input 
                          className="admin-input" 
                          value={item} 
                          placeholder="e.g. Spare parts"
                          onChange={e => {
                            const newList = [...editData.not_included];
                            newList[i] = e.target.value;
                            setEditData({ ...editData, not_included: newList });
                          }}
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setEditData({ ...editData, not_included: editData.not_included.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 8px' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                    <button type="button" onClick={() => setEditData({ ...editData, not_included: [...editData.not_included, ''] })} style={{ alignSelf: 'flex-start', background: 'transparent', border: '1px dashed var(--admin-border)', padding: '6px 12px', borderRadius: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', cursor: 'pointer' }}>
                      + Add Point
                    </button>
                  </div>
                </div>
              </div>
              <div className="admin-grid-2">
                <div style={{ flex: 1 }}>
                  <label style={{ display: 'block', fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 6 }}>Price (₹)</label>
                  <input 
                    type="number"
                    className="admin-input"
                    value={editData.price}
                    disabled={editData.variants.length > 0}
                    placeholder={editData.variants.length > 0 ? "Auto-calculated" : "Base Price"}
                    onChange={e => setEditData({ ...editData, price: e.target.value })}
                    style={{ background: editData.variants.length > 0 ? 'var(--admin-glass-active)' : 'var(--admin-surface)' }}
                  />
                </div>
                <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
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

              {/* Scheduling & Buffer */}
              <div style={{ padding: '16px', background: 'rgba(255, 117, 31, 0.04)', borderRadius: 12, border: '1px solid rgba(255, 117, 31, 0.15)' }}>
                <label style={{ display: 'block', fontSize: 12, fontWeight: 700, color: 'var(--admin-text-secondary)', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>⏱ Scheduling & Buffer</label>
                <div className="admin-grid-2">
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 4 }}>Base Duration (mins)</label>
                    <input 
                      type="number"
                      className="admin-input"
                      value={editData.duration_minutes}
                      placeholder="60"
                      onChange={e => setEditData({ ...editData, duration_minutes: e.target.value })}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: 11, fontWeight: 600, color: 'var(--admin-text-secondary)', marginBottom: 4 }}>Buffer Time (hrs)</label>
                    <input 
                      type="number"
                      step="0.1"
                      className="admin-input"
                      value={editData.buffer_time}
                      placeholder="0.5"
                      onChange={e => setEditData({ ...editData, buffer_time: e.target.value })}
                    />
                  </div>
                </div>
              </div>

              <div>
                <label style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>
                  <span>Subcategories (Variants) & Pricing</span>
                  <button type="button" onClick={() => setEditData({ ...editData, variants: [...editData.variants, {name: '', price: '', duration: ''}] })} style={{ background: 'transparent', border: 'none', color: 'var(--admin-text-primary)', cursor: 'pointer', fontSize: 12, fontWeight: 600 }}>+ Add Variant</button>
                </label>
                {editData.variants.length > 0 ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    <div style={{ display: 'flex', gap: 8, fontSize: 10, fontWeight: 700, color: 'var(--admin-text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.05em', paddingLeft: 4 }}>
                      <span style={{ flex: 2 }}>Name</span>
                      <span style={{ flex: 1 }}>Price (₹)</span>
                      <span style={{ flex: 1 }}>Duration (mins)</span>
                      <span style={{ width: 32 }}></span>
                    </div>
                    {editData.variants.map((v, i) => (
                      <div key={i} style={{ display: 'flex', gap: 8 }}>
                        <input 
                          className="admin-input" 
                          value={v.name} 
                          placeholder="e.g. 1 BHK"
                          onChange={e => {
                            const newList = [...editData.variants];
                            newList[i].name = e.target.value;
                            setEditData({ ...editData, variants: newList });
                          }}
                          style={{ flex: 2 }}
                        />
                        <input 
                          type="number"
                          className="admin-input" 
                          value={v.price} 
                          placeholder="₹"
                          onChange={e => {
                            const newList = [...editData.variants];
                            newList[i].price = e.target.value;
                            setEditData({ ...editData, variants: newList });
                          }}
                          style={{ flex: 1 }}
                        />
                        <input 
                          type="number"
                          className="admin-input" 
                          value={v.duration} 
                          placeholder="mins"
                          onChange={e => {
                            const newList = [...editData.variants];
                            newList[i].duration = e.target.value;
                            setEditData({ ...editData, variants: newList });
                          }}
                          style={{ flex: 1 }}
                        />
                        <button type="button" onClick={() => setEditData({ ...editData, variants: editData.variants.filter((_, idx) => idx !== i) })} style={{ background: 'var(--admin-surface)', border: '1px solid var(--admin-border)', borderRadius: 8, color: 'var(--error)', cursor: 'pointer', padding: '0 8px' }}>
                          <X size={16} />
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div style={{ fontSize: 12, color: 'var(--admin-text-tertiary)' }}>No variants added. Service will use the single Base Price and Duration.</div>
                )}
              </div>

              <div className="admin-grid-2">
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Additional Gallery Images (Comma-separated URLs)</label>
                  <textarea 
                    className="admin-input" 
                    placeholder="https://...1.jpg, https://...2.jpg"
                    value={editData.gallery_images}
                    onChange={e => setEditData({ ...editData, gallery_images: e.target.value })}
                    style={{ minHeight: 60, resize: 'vertical' }}
                  />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: 8, fontSize: 12, fontWeight: 600, color: 'var(--admin-text-secondary)' }}>Video URL (Optional)</label>
                  <input 
                    className="admin-input" 
                    placeholder="https://youtube.com/..."
                    value={editData.video_url}
                    onChange={e => setEditData({ ...editData, video_url: e.target.value })}
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: 12, marginTop: 12, paddingTop: 24, borderTop: '1px solid var(--admin-divider)' }}>
              <button 
                onClick={() => handleDelete(selectedService.id)} 
                className="admin-btn"
                style={{ flex: 1, background: 'rgba(255,59,48,0.1)', color: '#ff3b30' }}
              >
                <Trash2 size={16} /> Delete Service
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
