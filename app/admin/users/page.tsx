'use client';
import { useState, useEffect } from 'react';
import supabase from '@/lib/supabase';
import type { Profile } from '@/lib/database.types';
import { X, User, Phone, Mail, Calendar, ShieldAlert, Trash2, ClipboardList, AlertCircle, RefreshCw } from 'lucide-react';
import ToastContainer, { toast } from '@/components/Toast';
import { adminFetch } from "@/lib/admin-fetch";

export default function AdminUsers() {
  const [users, setUsers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Inspector State
  const [inspectorUser, setInspectorUser] = useState<Profile | null>(null);
  const [userBookings, setUserBookings] = useState<any[]>([]);
  const [loadingBookings, setLoadingBookings] = useState(false);
  const [banReason, setBanReason] = useState('');
  const [deleting, setDeleting] = useState(false);

  const fetchUsers = async () => {
    try {
      const res = await adminFetch('/api/admin/list-users');
      if (res.ok) {
        const data = await res.json();
        setUsers(data as Profile[]);
      }
    } catch (err) {
      console.error('Fetch users error:', err);
    }
    setLoading(false);
  };

  useEffect(() => { fetchUsers(); }, []);

  const openInspector = async (user: Profile) => {
    setInspectorUser(user);
    setBanReason((user as any).ban_reason || '');
    setLoadingBookings(true);
    
    // Fetch bookings via secure API
    try {
      const url = user.role === 'professional' 
        ? `/api/orders?professionalId=${user.id}` 
        : `/api/orders?userId=${user.id}`;
        
      const res = await fetch(url);
      if (res.ok) {
        const data = await res.json();
        setUserBookings(data || []);
      }
    } catch (err) {
      console.error('Fetch user bookings error:', err);
    }
    setLoadingBookings(false);
  };

  const closeInspector = () => {
    setInspectorUser(null);
    setUserBookings([]);
    setBanReason('');
  };

  const filtered = users.filter(u => {
    if (!search) return true;
    const q = search.toLowerCase();
    return (u.full_name || '').toLowerCase().includes(q) || (u.email || '').toLowerCase().includes(q) || (u.phone || '').includes(q);
  });

  const updateRole = async (userId: string, role: string) => {
    await adminFetch('/api/admin/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userId, role })
    });
    toast.success('Role Updated', 'User role successfully changed.');
    fetchUsers();
    if (inspectorUser?.id === userId) setInspectorUser(prev => prev ? {...prev, role: role as Profile['role']} : prev);
  };

  const toggleBan = async (user: Profile) => {
    const newActiveState = !user.is_active;
    if (!newActiveState && !banReason.trim()) {
      toast.error('Reason Required', 'Please provide a reason for suspending this user.');
      return;
    }

    await adminFetch('/api/admin/update-profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ 
        userId: user.id,
        is_active: newActiveState,
        ban_reason: newActiveState ? null : banReason 
      })
    });
    
    toast.success('Status Updated', newActiveState ? 'User has been reactivated.' : 'User has been suspended.');
    fetchUsers();
    if (inspectorUser?.id === user.id) {
      setInspectorUser(prev => prev ? {...prev, is_active: newActiveState, ban_reason: newActiveState ? null : banReason} : prev);
    }
  };

  const deleteUserAccount = async (userId: string) => {
    const confirm = window.confirm("Are you absolutely sure? This will permanently delete the user and all their data.");
    if (!confirm) return;

    setDeleting(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await adminFetch('/api/admin/delete-user', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token}`
        },
        body: JSON.stringify({ targetUserId: userId })
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      toast.success('User Deleted', 'The account has been permanently removed.');
      closeInspector();
      fetchUsers();
    } catch (err: any) {
      toast.error('Deletion Failed', err.message);
    } finally {
      setDeleting(false);
    }
  };

  const activeOrders = userBookings.filter(b => ['pending', 'confirmed', 'en_route', 'in_progress'].includes(b.status));
  const pastOrders = userBookings.filter(b => ['completed', 'cancelled'].includes(b.status));

  return (
    <div style={{animation: 'fadeIn 0.5s ease-out', position: 'relative'}}>
      <ToastContainer />
      <div style={{marginBottom:32}}>
        <h1 style={{fontFamily:'var(--font-heading)',fontSize:'1.8rem',fontWeight:700,marginBottom:4}}>Users & Access</h1>
        <p style={{color:'var(--text-secondary)',fontSize:14}}>Manage registered users, professional access, and account suspensions.</p>
      </div>

      <div style={{display:'flex',gap:12,marginBottom:24}}>
        <input className="input" placeholder="Search by name, email, phone..." value={search} onChange={e => setSearch(e.target.value)} style={{maxWidth:360,padding:'10px 16px',fontSize:13}} />
        <span style={{display:'flex',alignItems:'center',fontSize:13,color:'var(--text-muted)'}}>{filtered.length} users</span>
      </div>

      <div style={{background:'var(--glass-bg)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',overflow:'hidden'}}>
        {loading ? (
          <div style={{padding:60,textAlign:'center',color:'var(--text-muted)'}}>Loading...</div>
        ) : (
          <div style={{overflowX:'auto'}}>
            <table style={{width:'100%',borderCollapse:'collapse',fontSize:14}}>
              <thead><tr style={{borderBottom:'1px solid var(--border)'}}>
                {['User','Contact','Role','Status','Joined',''].map(h => (
                  <th key={h} style={{padding:'14px 18px',textAlign:'left',fontSize:12,fontWeight:600,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em'}}>{h}</th>
                ))}
              </tr></thead>
              <tbody>
                {filtered.map(u => (
                  <tr key={u.id} 
                      onClick={() => openInspector(u)}
                      style={{borderBottom:'1px solid var(--border-light)', cursor: 'pointer', transition: 'background 0.2s'}}
                      onMouseEnter={e => e.currentTarget.style.background = 'var(--glass-bg-strong)'}
                      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{padding:'12px 18px'}}>
                      <div style={{display:'flex',alignItems:'center',gap:12}}>
                        <div style={{width:36,height:36,borderRadius:'var(--radius-full)',background:'var(--accent-light)',display:'flex',alignItems:'center',justifyContent:'center',fontSize:14,fontWeight:700,border:'1px solid var(--accent-border)',color:'var(--accent)'}}>
                          {(u.full_name || 'U')[0].toUpperCase()}
                        </div>
                        <span style={{fontWeight:600}}>{u.full_name || 'Unnamed'}</span>
                      </div>
                    </td>
                    <td style={{padding:'12px 18px',color:'var(--text-secondary)'}}>
                      <div style={{fontSize: 13}}>{u.email || '—'}</div>
                      <div style={{fontSize: 12, opacity: 0.7}}>{u.phone || '—'}</div>
                    </td>
                    <td style={{padding:'12px 18px'}} onClick={e => e.stopPropagation()}>
                      <select value={u.role} onChange={e => updateRole(u.id, e.target.value)} style={{
                        padding:'4px 10px',fontSize:12,fontWeight:600,borderRadius:'var(--radius-full)',cursor:'pointer',
                        background: u.role === 'admin' ? 'var(--accent-light)' : u.role === 'professional' ? 'rgba(59,130,246,0.1)' : 'var(--glass-bg)',
                        color: u.role === 'admin' ? 'var(--accent)' : u.role === 'professional' ? '#3b82f6' : 'var(--text-secondary)',
                        border: `1px solid ${u.role === 'admin' ? 'var(--accent-border)' : 'var(--border)'}`,
                      }}>
                        <option value="user">User</option>
                        <option value="admin">Admin</option>
                        <option value="professional">Professional</option>
                      </select>
                    </td>
                    <td style={{padding:'12px 18px'}}>
                      <div style={{
                        display: 'inline-flex', padding: '4px 10px', borderRadius: 20, fontSize: 11, fontWeight: 700, textTransform: 'uppercase',
                        background: u.is_active ? 'rgba(34,197,94,0.1)' : 'rgba(239,68,68,0.1)',
                        color: u.is_active ? '#22c55e' : '#ef4444',
                        border: `1px solid ${u.is_active ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
                      }}>
                        {u.is_active ? 'Active' : 'Suspended'}
                      </div>
                    </td>
                    <td style={{padding:'12px 18px',fontSize:13,color:'var(--text-muted)'}}>{new Date(u.created_at).toLocaleDateString('en-IN')}</td>
                    <td style={{padding:'12px 18px', textAlign: 'right', color: 'var(--text-muted)'}}>
                      <span style={{fontSize: 12, fontWeight: 600}}>Inspect ›</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* User Inspector Modal */}
      {inspectorUser && (
        <>
          <div onClick={closeInspector} style={{position:'fixed',inset:0,background:'rgba(0,0,0,0.6)',zIndex:99,backdropFilter:'blur(4px)'}} />
          <div style={{
            position:'fixed',top:0,right:0,bottom:0,width:'100%',maxWidth:540,background:'var(--bg)',zIndex:100,
            borderLeft:'1px solid var(--border)',boxShadow:'-10px 0 30px rgba(0,0,0,0.3)',display:'flex',flexDirection:'column',
            animation: 'slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1)'
          }}>
            {/* Header */}
            <div style={{padding: '24px 32px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background: 'var(--bg-card)'}}>
              <div style={{display: 'flex', alignItems: 'center', gap: 16}}>
                <div style={{width: 56, height: 56, borderRadius: 'var(--radius-full)', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 24, fontWeight: 800, color: 'var(--accent)', border: '1px solid var(--accent-border)'}}>
                  {(inspectorUser.full_name || 'U')[0].toUpperCase()}
                </div>
                <div>
                  <h2 style={{fontSize: 20, fontWeight: 700, marginBottom: 4}}>{inspectorUser.full_name || 'Anonymous User'}</h2>
                  <div style={{display: 'flex', gap: 8, alignItems: 'center'}}>
                    <span style={{fontSize: 12, fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em'}}>{inspectorUser.role}</span>
                    <span style={{width: 4, height: 4, borderRadius: '50%', background: 'var(--text-muted)'}} />
                    <span style={{fontSize: 12, color: inspectorUser.is_active ? 'var(--success)' : 'var(--error)', fontWeight: 600}}>
                      {inspectorUser.is_active ? 'Active Account' : 'Suspended Account'}
                    </span>
                  </div>
                </div>
              </div>
              <button onClick={closeInspector} className="admin-btn-icon" style={{background: 'var(--glass-bg)', border: '1px solid var(--border)'}}><X size={20} /></button>
            </div>

            <div style={{flex: 1, overflowY: 'auto', padding: 32}}>
              {/* Contact Info */}
              <div style={{marginBottom: 32}}>
                <h3 style={{fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12}}>Contact & Details</h3>
                <div style={{background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 16, padding: 16, display: 'grid', gap: 16}}>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)'}}><Mail size={16} /> {inspectorUser.email || 'No email'}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)'}}><Phone size={16} /> {inspectorUser.phone || 'No phone'}</div>
                  <div style={{display: 'flex', alignItems: 'center', gap: 12, fontSize: 14, color: 'var(--text-secondary)'}}><Calendar size={16} /> Joined {new Date(inspectorUser.created_at).toLocaleDateString('en-IN', {dateStyle: 'long'})}</div>
                </div>
              </div>

              {/* Order History */}
              <div style={{marginBottom: 32}}>
                <h3 style={{fontSize: 12, fontWeight: 700, color: 'var(--text-tertiary)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12}}>
                  {inspectorUser.role === 'professional' ? 'Assigned Orders' : 'Order History'}
                </h3>
                {loadingBookings ? (
                  <div style={{padding: 20, textAlign: 'center', color: 'var(--text-muted)'}}><RefreshCw className="animate-spin" size={20} /></div>
                ) : userBookings.length === 0 ? (
                  <div style={{background: 'var(--glass-bg)', border: '1px dashed var(--border)', borderRadius: 16, padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 14}}>
                    No bookings found for this {inspectorUser.role}.
                  </div>
                ) : (
                  <div style={{display: 'flex', flexDirection: 'column', gap: 12, maxHeight: 400, overflowY: 'auto', paddingRight: 4}}>
                    {userBookings.map(b => (
                      <div key={b.id} style={{background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 12, padding: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center'}}>
                        <div>
                          <div style={{fontWeight: 600, fontSize: 14, marginBottom: 4}}>Order #{b.booking_number}</div>
                          <div style={{fontSize: 12, color: 'var(--text-secondary)'}}>{new Date(b.created_at).toLocaleDateString('en-IN')}</div>
                        </div>
                        <div style={{textAlign: 'right'}}>
                          <div style={{fontWeight: 700, fontSize: 15, marginBottom: 4}}>₹{b.total}</div>
                          <div style={{fontSize: 11, fontWeight: 700, textTransform: 'uppercase', color: ['completed'].includes(b.status) ? 'var(--success)' : ['cancelled'].includes(b.status) ? 'var(--error)' : 'var(--warning)'}}>{b.status}</div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Danger Zone */}
              <div>
                <h3 style={{fontSize: 12, fontWeight: 700, color: 'var(--error)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6}}><ShieldAlert size={14} /> Danger Zone</h3>
                <div style={{background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 16, padding: 20}}>
                  
                  {/* Ban Section */}
                  <div style={{marginBottom: 24}}>
                    <label style={{fontSize: 13, fontWeight: 600, color: 'var(--text)', marginBottom: 8, display: 'block'}}>
                      {inspectorUser.is_active ? 'Suspend Account' : 'Reactivate Account'}
                    </label>
                    {inspectorUser.is_active ? (
                      <>
                        <textarea 
                          className="input" 
                          placeholder="Reason for suspension..." 
                          value={banReason} 
                          onChange={e => setBanReason(e.target.value)}
                          style={{width: '100%', height: 80, resize: 'none', marginBottom: 12, background: 'var(--bg-card-solid)'}}
                        />
                        <button onClick={() => toggleBan(inspectorUser)} className="btn" style={{background: 'var(--error)', color: '#fff', border: 'none', width: '100%', padding: 12}}>
                          Suspend User
                        </button>
                      </>
                    ) : (
                      <>
                        <div style={{background: 'var(--bg-card-solid)', padding: 12, borderRadius: 8, fontSize: 13, color: 'var(--text-secondary)', marginBottom: 12, border: '1px solid var(--border)'}}>
                          <strong style={{color: 'var(--error)'}}>Suspended For:</strong> {(inspectorUser as any).ban_reason || 'No reason provided.'}
                        </div>
                        <button onClick={() => toggleBan(inspectorUser)} className="btn" style={{background: 'var(--success)', color: '#fff', border: 'none', width: '100%', padding: 12}}>
                          Remove Suspension
                        </button>
                      </>
                    )}
                  </div>

                  <hr style={{border: 0, borderTop: '1px solid rgba(239, 68, 68, 0.2)', margin: '0 -20px 24px -20px'}} />

                  {/* Delete Section */}
                  <div>
                    <label style={{fontSize: 13, fontWeight: 600, color: 'var(--error)', marginBottom: 8, display: 'block'}}>Permanently Delete</label>
                    <p style={{fontSize: 12, color: 'var(--text-secondary)', marginBottom: 16}}>This action cannot be undone. All user data, bookings, and profile info will be destroyed.</p>
                    <button 
                      onClick={() => deleteUserAccount(inspectorUser.id)} 
                      disabled={deleting}
                      className="btn" 
                      style={{background: 'transparent', color: 'var(--error)', border: '1px solid var(--error)', width: '100%', padding: 12, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8}}
                    >
                      {deleting ? <RefreshCw className="animate-spin" size={16} /> : <Trash2 size={16} />} 
                      {deleting ? 'Deleting...' : 'Delete Account'}
                    </button>
                  </div>

                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideInRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
      `}</style>
    </div>
  );
}
