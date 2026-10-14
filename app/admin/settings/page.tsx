'use client';
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import type { Testimonial, ServiceArea, SiteSetting } from '@/lib/database.types';
import Modal from '@/components/Modal';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminSettings() {
  const [tab, setTab] = useState('general');
  const [settings, setSettings] = useState<SiteSetting[]>([]);
  const [systemSettings, setSystemSettings] = useState<{key:string,value:string}[]>([]);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [maintenanceReason, setMaintenanceReason] = useState('We are currently updating our systems to serve you better.');
  const [maintenanceEta, setMaintenanceEta] = useState('');
  const [areas, setAreas] = useState<ServiceArea[]>([]);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showAddTestimonial, setShowAddTestimonial] = useState(false);
  const [newTestData, setNewTestData] = useState({ user_name: '', location: '', text: '', rating: 5, avatar: '👤' });
  const [editingTestimonialId, setEditingTestimonialId] = useState<number | null>(null);
  const [newSoldoutDate, setNewSoldoutDate] = useState('');

  const fetchData = async () => {
    try {
      const res = await adminFetch('/api/admin/settings');
      if (res.ok) {
        const data = await res.json();
        setSettings(data.site_settings);
        setAreas(data.service_areas);
        setTestimonials(data.testimonials);
        setSystemSettings(data.system_settings);
      }
    } catch (err) {
      console.error('Fetch settings error:', err);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const saveSetting = async (key: string, value: string) => {
    setSaving(true);
    await adminFetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'site_settings', key, updates: { value } })
    });
    setSaving(false);
  };

  const toggleMaintenance = async () => {
    const isMaintenance = systemSettings.find(s => s.key === 'maintenance_mode')?.value === 'true';
    if (!isMaintenance) {
      setShowMaintenanceModal(true);
    } else {
      await adminFetch('/api/admin/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          table: 'system_settings', 
          data: [{ key: 'maintenance_mode', value: 'false' }] 
        })
      });
      fetchData();
    }
  };

  const confirmMaintenance = async () => {
    await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        table: 'system_settings', 
        data: [
          { key: 'maintenance_mode', value: 'true' },
          { key: 'maintenance_reason', value: maintenanceReason },
          { key: 'maintenance_eta', value: maintenanceEta || '' }
        ] 
      })
    });
    fetchData();
    setShowMaintenanceModal(false);
  };

  const toggleArea = async (id: number, active: boolean) => {
    await adminFetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'service_areas', id, updates: { is_active: !active } })
    });
    fetchData();
  };

  const addArea = async () => {
    const name = prompt('Area name:');
    const city = prompt('City:', 'Greater Noida');
    if (!name) return;
    await adminFetch('/api/admin/settings', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'service_areas', data: { name, city: city || '' } })
    });
    fetchData();
  };

  const deleteArea = async (id: number) => {
    await adminFetch(`/api/admin/settings?table=service_areas&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const toggleTestimonial = async (id: number, field: string, value: boolean) => {
    await adminFetch('/api/admin/settings', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ table: 'testimonials', id, updates: { [field]: !value } })
    });
    fetchData();
  };

  const deleteTestimonial = async (id: number) => {
    await adminFetch(`/api/admin/settings?table=testimonials&id=${id}`, { method: 'DELETE' });
    fetchData();
  };

  const addTestimonial = async () => {
    if (!newTestData.user_name || !newTestData.text) return;
    
    if (editingTestimonialId) {
      await adminFetch('/api/admin/settings', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          table: 'testimonials',
          id: editingTestimonialId,
          updates: newTestData
        })
      });
    } else {
      await adminFetch('/api/admin/settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ table: 'testimonials', data: { ...newTestData, is_approved: true } })
      });
    }
    
    fetchData();
    setShowAddTestimonial(false);
    setEditingTestimonialId(null);
    setNewTestData({ user_name: '', location: '', text: '', rating: 5, avatar: '👤' });
  };

  const startEditTestimonial = (t: Testimonial) => {
    setEditingTestimonialId(t.id);
    setNewTestData({
      user_name: t.user_name,
      location: t.location || '',
      text: t.text,
      rating: t.rating || 5,
      avatar: t.avatar || '👤'
    });
    setShowAddTestimonial(true);
  };

  // Soldout Dates Management
  const getSoldoutDates = (): string[] => {
    const setting = systemSettings.find(s => s.key === 'soldout_dates');
    if (!setting || !setting.value) return [];
    try {
      const parsed = JSON.parse(setting.value);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return setting.value.split(',').map((d: string) => d.trim()).filter(Boolean);
    }
  };

  const addSoldoutDate = async () => {
    if (!newSoldoutDate) return;
    const current = getSoldoutDates();
    if (current.includes(newSoldoutDate)) {
      alert('This date is already marked as sold out.');
      return;
    }
    const updated = [...current, newSoldoutDate].sort();
    
    setSaving(true);
    await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        table: 'system_settings', 
        data: [{ key: 'soldout_dates', value: JSON.stringify(updated) }] 
      })
    });
    setSaving(false);
    setNewSoldoutDate('');
    fetchData();
  };

  const removeSoldoutDate = async (dateStr: string) => {
    const current = getSoldoutDates();
    const updated = current.filter(d => d !== dateStr);
    
    setSaving(true);
    await adminFetch('/api/admin/settings', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        table: 'system_settings', 
        data: [{ key: 'soldout_dates', value: JSON.stringify(updated) }] 
      })
    });
    setSaving(false);
    fetchData();
  };

  const tabs = [
    { id: 'general', icon: '⚙️', label: 'General' },
    { id: 'areas', icon: '📍', label: 'Service Areas' },
    { id: 'soldout', icon: '📅', label: 'Worker Leaves' },
    { id: 'testimonials', icon: '⭐', label: 'Testimonials' },
  ];

  if (loading) return <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading settings...</div>;

  return (
    <div>
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.8rem',fontWeight:700,marginBottom:4}}>Settings</h1>
        <p style={{color:'var(--text-secondary)',fontSize:14}}>Configure site-wide settings.</p>
      </div>

      {/* Tabs */}
      <div className="admin-tabs-container" style={{ maxWidth: '600px' }}>
        {tabs.map(t => (
          <button key={t.id} onClick={() => setTab(t.id)} style={{flexShrink: 0, padding:'10px 16px',textAlign:'center',fontSize:13,fontWeight:500,borderRadius:'var(--radius-md)',transition:'all 0.25s',background: tab === t.id ? 'var(--bg-card-solid)' : 'transparent',color: tab === t.id ? 'var(--text)' : 'var(--text-secondary)',boxShadow: tab === t.id ? 'var(--shadow-sm)' : 'none',border:'none',cursor:'pointer'}}>
            {t.icon} {t.label}
          </button>
        ))}
      </div>

      {tab === 'general' && (
        <div style={{display:'flex',flexDirection:'column',gap:24}}>
          {/* Maintenance Mode */}
        <div className="admin-settings-card">
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600,marginBottom:8, color: 'var(--error)'}}>System Maintenance</h3>
            <p style={{fontSize: 13, color: 'var(--text-secondary)', marginBottom: 20}}>
              Toggle maintenance mode to lock out all non-admin users and display a maintenance page.
            </p>
            <div className="admin-maintenance-row">
              <div>
                <div style={{fontWeight:600,fontSize:14}}>Maintenance Mode</div>
                <div style={{fontSize:12,color:systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true'?'var(--error)':'var(--success)',fontWeight:700,marginTop:4}}>
                  {systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true' ? 'Currently Active' : 'Currently Disabled'}
                </div>
              </div>
              <button onClick={toggleMaintenance} style={{
                padding:'8px 16px',borderRadius:20,border:'none',fontSize:13,fontWeight:700,cursor:'pointer',
                background:systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true'?'var(--glass-bg-strong)':'var(--error)',
                color:systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true'?'var(--text)':'#fff'
              }}>
                {systemSettings.find(s=>s.key==='maintenance_mode')?.value==='true' ? 'Disable Maintenance' : 'Enable Maintenance'}
              </button>
            </div>
          </div>

          <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',padding:28,maxWidth:600}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600,marginBottom:24}}>Site Configuration</h3>
            <div style={{display:'flex',flexDirection:'column',gap:20}}>
              {settings.map(s => (
                <div key={s.id}>
                  <label style={{fontSize:13,fontWeight:500,marginBottom:6,display:'block',color:'var(--text-secondary)'}}>{s.label}</label>
                  <div style={{display:'flex',gap:8}}>
                    <input className="admin-input" defaultValue={s.value} onBlur={e => saveSetting(s.key, e.target.value)} style={{fontSize:14}} />
                  </div>
                </div>
              ))}
            </div>
            {saving && <p style={{fontSize:12,color:'var(--accent)',marginTop:12}}>Saving...</p>}
          </div>
        </div>
      )}

      {tab === 'areas' && (
        <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',padding:28}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600}}>Service Areas</h3>
            <button className="admin-btn admin-btn-primary" onClick={addArea} style={{ padding: '8px 16px', fontSize: 13 }}>+ Add Area</button>
          </div>
          <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:12}}>
            {areas.map(a => (
              <div key={a.id} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',opacity: a.is_active ? 1 : 0.5}}>
                <div>
                  <div style={{fontWeight:500,fontSize:14}}>{a.name}</div>
                  <div style={{fontSize:12,color:'var(--text-muted)'}}>{a.city}</div>
                </div>
                <div style={{display:'flex',gap:8}}>
                  <button onClick={() => toggleArea(a.id, a.is_active)} style={{fontSize:12,color: a.is_active ? 'var(--success)' : 'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>
                    {a.is_active ? '✓' : '○'}
                  </button>
                  <button onClick={() => deleteArea(a.id)} style={{fontSize:12,color:'var(--error)',background:'none',border:'none',cursor:'pointer'}}>×</button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'soldout' && (
        <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',padding:28}}>
          <div style={{marginBottom:24}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.15rem',fontWeight:600,marginBottom:6}}>Manage Worker Leaves & Soldout Dates</h3>
            <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.5}}>
              Block bookings on specific dates when workers are on leave or slots are sold out. 
              Customers will see these dates marked as <strong>SOLD OUT</strong> on the checkout page and will not be able to book them.
            </p>
          </div>

          <div style={{display:'flex',gap:16,alignItems:'flex-end',background:'var(--bg-card-solid)',padding:20,borderRadius:'var(--radius-lg)',border:'1px solid var(--border)',maxWidth:550,marginBottom:28}}>
            <div style={{flex:1}}>
              <label style={{display:'block',fontSize:12,fontWeight:600,color:'var(--text-secondary)',marginBottom:6}}>Select Leave/Soldout Date</label>
              <input 
                type="date" 
                className="admin-input" 
                value={newSoldoutDate} 
                onChange={e => setNewSoldoutDate(e.target.value)} 
                style={{width:'100%',fontSize:13}} 
              />
            </div>
            <button 
              className="admin-btn admin-btn-primary" 
              onClick={addSoldoutDate}
              disabled={saving || !newSoldoutDate}
              style={{height:40, fontSize:13}}
            >
              {saving ? 'Adding...' : '+ Set Leave / Soldout'}
            </button>
          </div>

          <div>
            <h4 style={{fontSize:13,fontWeight:600,color:'var(--text-secondary)',marginBottom:14}}>Active Leave / Soldout Dates ({getSoldoutDates().length})</h4>
            <div style={{display:'grid',gridTemplateColumns:'repeat(auto-fill, minmax(260px, 1fr))',gap:12}}>
              {getSoldoutDates().length === 0 ? (
                <div style={{gridColumn:'1/-1',padding:28,textAlign:'center',color:'var(--text-muted)',border:'1px dashed var(--border)',borderRadius:'var(--radius-lg)'}}>
                  📅 No dates are currently marked as sold out.
                </div>
              ) : (
                getSoldoutDates().map(d => {
                  const formattedDate = new Date(d).toLocaleDateString('en-US', {
                    weekday: 'long',
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  });
                  return (
                    <div key={d} style={{display:'flex',alignItems:'center',justifyContent:'space-between',padding:'14px 18px',border:'1px solid var(--border)',borderRadius:'var(--radius-lg)',background:'var(--bg-card-solid)'}}>
                      <div>
                        <div style={{fontWeight:600,fontSize:14,color:'var(--text)'}}>{d}</div>
                        <div style={{fontSize:11,color:'var(--text-muted)',marginTop:2}}>{formattedDate}</div>
                      </div>
                      <button 
                        onClick={() => removeSoldoutDate(d)} 
                        disabled={saving}
                        style={{
                          fontSize:12,fontWeight:700,color:'var(--error)',background:'rgba(239,68,68,0.06)',
                          border:'1px solid rgba(239,68,68,0.2)',padding:'6px 12px',borderRadius:20,cursor:'pointer',
                          transition:'all 0.2s'
                        }}
                        onMouseEnter={e => {e.currentTarget.style.background='rgba(239,68,68,0.12)';}}
                        onMouseLeave={e => {e.currentTarget.style.background='rgba(239,68,68,0.06)';}}
                      >
                        × Remove
                      </button>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {tab === 'testimonials' && (
        <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',padding:28}}>
          <div style={{display:'flex',alignItems:'center',justifyContent:'space-between',marginBottom:20}}>
            <h3 style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:600}}>Manage Testimonials</h3>
            <button className="admin-btn admin-btn-primary" onClick={() => {
              setEditingTestimonialId(null);
              setNewTestData({ user_name: '', location: '', text: '', rating: 5, avatar: '👤' });
              setShowAddTestimonial(true);
            }} style={{ padding: '8px 16px', fontSize: 13 }}>+ Add Testimonial</button>
          </div>
          <div style={{display:'flex',flexDirection:'column',gap:12}}>
            {testimonials.length === 0 && <div style={{padding:20,textAlign:'center',color:'var(--text-muted)'}}>No testimonials found. Add your first one!</div>}
            {testimonials.map(t => (
              <div key={t.id} style={{display:'flex',gap:16,padding:20,border:'1px solid var(--border-light)',borderRadius:'var(--radius-lg)',opacity: t.is_approved ? 1 : 0.5}}>
                <div style={{width:44,height:44,borderRadius:'var(--radius-full)',background:'var(--glass-bg-strong)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:20,flexShrink:0}}>{t.avatar}</div>
                <div style={{flex:1}}>
                  <div style={{display:'flex',justifyContent:'space-between',marginBottom:4}}>
                    <span style={{fontWeight:600,fontSize:14}}>{t.user_name} — {t.location}</span>
                    <span style={{fontSize:12,color:'var(--text-muted)'}}>⭐ {t.rating}</span>
                  </div>
                  <p style={{fontSize:13,color:'var(--text-secondary)',lineHeight:1.6,marginBottom:10}}>"{t.text}"</p>
                  <div style={{display:'flex',gap:10,fontSize:12}}>
                    <button onClick={() => toggleTestimonial(t.id, 'is_approved', t.is_approved)} style={{color: t.is_approved ? 'var(--success)' : 'var(--warning)',background:'none',border:'none',cursor:'pointer'}}>
                      {t.is_approved ? '✅ Approved' : '⏳ Pending'}
                    </button>
                    <button onClick={() => toggleTestimonial(t.id, 'is_featured', t.is_featured)} style={{color: t.is_featured ? 'var(--accent)' : 'var(--text-muted)',background:'none',border:'none',cursor:'pointer'}}>
                      {t.is_featured ? '⭐ Featured' : '○ Not Featured'}
                    </button>
                    <button onClick={() => startEditTestimonial(t)} style={{color:'var(--accent)',background:'none',border:'none',cursor:'pointer'}}>Edit</button>
                    <button onClick={() => deleteTestimonial(t.id)} style={{color:'var(--error)',background:'none',border:'none',cursor:'pointer'}}>Delete</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Modal isOpen={showMaintenanceModal} onClose={() => setShowMaintenanceModal(false)} title="Enable Maintenance Mode" width={480}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Maintenance Reason</label>
            <textarea 
              className="admin-input" 
              value={maintenanceReason} 
              onChange={e => setMaintenanceReason(e.target.value)}
              placeholder="e.g. We are upgrading the servers."
              style={{ minHeight: 80, resize: 'vertical' }}
            />
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Estimated Live Time (Optional)</label>
            <input 
              className="admin-input" 
              value={maintenanceEta} 
              onChange={e => setMaintenanceEta(e.target.value)}
              placeholder="e.g. 2 Hours, 6:00 PM"
            />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => setShowMaintenanceModal(false)} className="admin-btn" style={{ flex: 1, background: 'var(--admin-glass-active)', color: 'var(--admin-text-primary)' }}>Cancel</button>
            <button onClick={confirmMaintenance} className="admin-btn" style={{ flex: 1, background: 'var(--error)', color: '#fff', border: 'none' }}>Enable Maintenance</button>
          </div>
        </div>
      </Modal>
      
      <Modal isOpen={showAddTestimonial} onClose={() => { setShowAddTestimonial(false); setEditingTestimonialId(null); }} title={editingTestimonialId ? "Edit Testimonial" : "Add New Testimonial"} width={500}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>User Name</label>
              <input className="admin-input" value={newTestData.user_name} onChange={e => setNewTestData({ ...newTestData, user_name: e.target.value })} placeholder="e.g. Anjali Rai" />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Location</label>
              <input className="admin-input" value={newTestData.location} onChange={e => setNewTestData({ ...newTestData, location: e.target.value })} placeholder="e.g. Noida Extension" />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Rating (1-5)</label>
              <input type="number" min="1" max="5" className="admin-input" value={newTestData.rating} onChange={e => setNewTestData({ ...newTestData, rating: parseInt(e.target.value) })} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Avatar Emoji</label>
              <input className="admin-input" value={newTestData.avatar} onChange={e => setNewTestData({ ...newTestData, avatar: e.target.value })} placeholder="e.g. 👩" />
            </div>
          </div>
          <div>
            <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: 'var(--text-secondary)', marginBottom: 6 }}>Testimonial Text</label>
            <textarea className="admin-input" value={newTestData.text} onChange={e => setNewTestData({ ...newTestData, text: e.target.value })} placeholder="What did they say?" style={{ minHeight: 100, resize: 'vertical' }} />
          </div>
          <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
            <button onClick={() => { setShowAddTestimonial(false); setEditingTestimonialId(null); }} className="admin-btn" style={{ flex: 1, background: 'var(--admin-glass-active)', color: 'var(--admin-text-primary)' }}>Cancel</button>
            <button onClick={addTestimonial} className="admin-btn admin-btn-primary" style={{ flex: 1 }}>
              {editingTestimonialId ? "Save Changes" : "Add Testimonial"}
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
