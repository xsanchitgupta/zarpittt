'use client';

import { useState, useEffect, Suspense } from 'react';
import Navbar from '@/components/Navbar';
import ToastContainer, { toast } from '@/components/Toast';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeBookings } from '@/lib/realtime';
import supabase from '@/lib/supabase';
import { formatPrice, formatServiceNames, parseAddress, addToCart, updateQuantity, getCart } from '@/lib/utils';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { authFetch } from '@/lib/auth-fetch';
import { updateProfile } from '@/app/actions/profile';
import type { Address } from '@/lib/database.types';
import { fallbackCategories } from '@/lib/data';
import Skeleton from '@/components/Skeleton';
import {
  User, ClipboardList, MapPin, CreditCard, HelpCircle,
  XCircle, Package, Activity, Clock, Shield,
  ChevronRight, AlertCircle, Phone, Search,
  Home, Building2, MapPinned, Plus, CreditCard as CardIcon,
  CheckCircle2, Star, ArrowRight, TrendingUp, Zap, MessageCircle, Award, Gift,
  LogOut, LayoutGrid
} from 'lucide-react';

function DashboardServiceCard({ s, i }: { s: any, i: number }) {
  const [cartQty, setCartQty] = useState(0);

  useEffect(() => {
    const checkCart = () => {
      const cart = getCart();
      const item = cart.find((item: any) => item.id === s.id && !item.variantName);
      setCartQty(item ? item.quantity : 0);
    };
    checkCart();
    window.addEventListener('cartUpdate', checkCart);
    return () => window.removeEventListener('cartUpdate', checkCart);
  }, [s.id]);

  const handleAddToCart = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: s.id,
      name: s.name,
      price: s.price,
      originalPrice: s.original_price ?? s.price,
      duration: s.duration || '',
      category: s.categories?.name || 'Category',
      image: s.image_url,
      variantName: undefined
    });
  };

  const handleUpdateQty = (e: React.MouseEvent, newQty: number) => {
    e.preventDefault();
    e.stopPropagation();
    updateQuantity(s.id, undefined, newQty);
  };

  return (
    <Link 
      href={`/services/${s.id}`} 
      style={{ 
        display: 'flex',
        flexDirection: 'column',
        background: 'var(--bg-card-solid)', 
        borderRadius: 24, 
        border: '1px solid var(--border)', 
        overflow: 'hidden', 
        textDecoration: 'none', 
        color: 'inherit',
        position: 'relative'
      }} 
      className="popular-service-card"
    >
      {/* Card Image with elegant gradient overlay */}
      <div style={{ position: 'relative', height: 140, overflow: 'hidden' }}>
        <div 
          style={{ 
            height: '100%', 
            background: s.image_url ? `url(${s.image_url}) center/cover` : 'linear-gradient(135deg, var(--accent-light) 0%, var(--accent) 100%)',
            transition: 'transform 0.5s ease'
          }} 
          className="card-image"
        />
        <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(to bottom, transparent 30%, rgba(0,0,0,0.5) 100%)' }} />
        
        {/* Category Badge */}
        {s.categories?.name && (
          <span style={{ 
            position: 'absolute', 
            top: 12, 
            left: 12, 
            padding: '5px 10px', 
            background: 'rgba(0, 0, 0, 0.75)', 
            backdropFilter: 'blur(8px)',
            color: '#fff', 
            fontSize: 10, 
            fontWeight: 800, 
            borderRadius: 10, 
            textTransform: 'uppercase',
            letterSpacing: '0.05em'
          }}>
            {s.categories.name}
          </span>
        )}
      </div>

      {/* Content Section */}
      <div style={{ padding: '20px 18px', flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'space-between', minHeight: 140 }}>
        <div>
          <h4 style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 6, lineHeight: '1.4' }}>
            {s.name}
          </h4>
          {s.description && (
            <p style={{ fontSize: 12, color: 'var(--text-secondary)', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden', marginBottom: 16, lineHeight: '1.4' }}>
              {s.description}
            </p>
          )}
        </div>
        
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 'auto' }}>
          <div>
            <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', display: 'block', marginBottom: 2 }}>From</span>
            <span style={{ fontSize: 17, color: 'var(--accent)', fontWeight: 800 }}>{formatPrice(s.price)}</span>
          </div>
          
          {/* Cart Actions */}
          <div onClick={e => e.stopPropagation()} style={{ zIndex: 2 }}>
            {cartQty > 0 ? (
              <div style={{ 
                display: 'flex', 
                alignItems: 'center', 
                background: 'var(--accent-light)', 
                borderRadius: 20, 
                border: '1px solid var(--accent)',
                overflow: 'hidden'
              }}>
                <button
                  onClick={(e) => handleUpdateQty(e, cartQty - 1)}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700
                  }}
                >−</button>
                <span style={{ minWidth: 20, textAlign: 'center', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                  {cartQty}
                </span>
                <button
                  onClick={(e) => {
                    if (cartQty >= 5) return;
                    handleUpdateQty(e, cartQty + 1);
                  }}
                  style={{
                    width: 32,
                    height: 32,
                    display: 'grid',
                    placeItems: 'center',
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    cursor: 'pointer',
                    fontSize: 15,
                    fontWeight: 700
                  }}
                >+</button>
              </div>
            ) : (
              <button 
                onClick={handleAddToCart}
                style={{ 
                  padding: '8px 16px', 
                  borderRadius: 20, 
                  background: 'var(--accent)', 
                  color: '#000',
                  border: 'none',
                  fontSize: 12,
                  fontWeight: 800,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: 6,
                  transition: 'all 0.2s ease',
                  boxShadow: '0 4px 12px rgba(255, 117, 31, 0.2)'
                }}
                className="add-to-cart-btn"
                onMouseEnter={e => {
                  e.currentTarget.style.transform = 'scale(1.05)';
                  e.currentTarget.style.boxShadow = '0 6px 16px rgba(255, 117, 31, 0.35)';
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.transform = 'none';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(255, 117, 31, 0.2)';
                }}
              >
                Book Now
              </button>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}

function ProfileContent() {
  const searchParams = useSearchParams();
  const [activeSection, setActiveSection] = useState<'main' | 'profile' | 'addresses' | 'payments' | 'help' | 'bookings'>(() => {
    if (typeof window !== 'undefined') {
      const tab = searchParams.get('tab');
      if (tab && ['main', 'profile', 'addresses', 'payments', 'help', 'bookings'].includes(tab)) {
        return tab as any;
      }
    }
    return 'main';
  });

  // Sync section with query param
  useEffect(() => {
    const tab = searchParams.get('tab');
    if (tab && ['main', 'profile', 'addresses', 'payments', 'help', 'bookings'].includes(tab)) {
      setActiveSection(tab as any);
    }
  }, [searchParams]);

  const { user, profile, loading: authLoading, refreshProfile, signOut } = useAuth();
  const { bookings, loading: bookingsLoading, refetch: refetchBookings } = useRealtimeBookings(user?.id ?? null);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [popularServices, setPopularServices] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [addressToDelete, setAddressToDelete] = useState<string | null>(null);
  const [deletingAddr, setDeletingAddr] = useState<string | null>(null);
  const [selectedHelpCategory, setSelectedHelpCategory] = useState<string | null>(null);
  const [expandedFaqIndex, setExpandedFaqIndex] = useState<number | null>(null);
  const [helpSearchQuery, setHelpSearchQuery] = useState('');

  const handleAddAddress = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    const f = e.target as HTMLFormElement;
    const d = new FormData(f);
    setSaving(true);
    
    try {
      const res = await authFetch('/api/profile/addresses', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          userId: user.id,
          label: d.get('label'),
          address: d.get('address'),
          city: d.get('city'),
          pincode: d.get('pincode'),
          isDefault: addresses.length === 0
        })
      });

      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to add address');
      }

      const newAddress = await res.json();
      const parsedAddress = parseAddress(newAddress);
      setAddresses(prev => [parsedAddress as Address, ...prev]);
      setShowAddressModal(false);
      toast.success('Success', 'Address added successfully');
    } catch (err: any) {
      console.error('[Profile] Add address error:', err);
      toast.error('Error', err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAddress = (id: string) => {
    setAddressToDelete(id);
    setShowDeleteConfirm(true);
  };

  const confirmDelete = async () => {
    if (!addressToDelete || !user) return;
    const id = addressToDelete;
    setDeletingAddr(id);
    
    try {
      const res = await authFetch(`/api/profile/addresses?id=${id}&userId=${user.id}`, {
        method: 'DELETE'
      });
      
      if (!res.ok) {
        const errData = await res.json();
        throw new Error(errData.error || 'Failed to delete');
      }

      setAddresses(prev => prev.filter(a => a.id !== id));
      toast.success('Deleted', 'Address removed successfully');
    } catch (err: any) {
      console.error('[Profile] Delete error:', err);
      toast.error('Error', err.message);
    } finally {
      setDeletingAddr(null);
      setShowDeleteConfirm(false);
      setAddressToDelete(null);
    }
  };

  useEffect(() => { setMounted(true); }, []);

  // Fetch addresses
  useEffect(() => {
    if (!user) return;
    const fetchAddresses = async () => {
      try {
        const res = await authFetch(`/api/profile/addresses?userId=${user.id}`);
        if (!res.ok) throw new Error('Failed to fetch');
        const data = await res.json();
        if (data) {
          const parsedData = data.map(parseAddress);
          setAddresses(parsedData as Address[]);
        }
      } catch (err) {
        console.error('[Profile] Fetch error:', err);
      }
    };
    fetchAddresses();
  }, [user]);

  // Fetch popular services
  useEffect(() => {
    const fetchPopular = async () => {
      try {
        const { data } = await Promise.race([
          supabase.from('services').select('*, categories(name, slug, icon)').order('sort_order', { ascending: true }).limit(6),
          new Promise<never>((_, reject) => setTimeout(() => reject(new Error('timeout')), 5000))
        ]);
        if (data) setPopularServices(data);
      } catch { /* timeout or error — ignore, non-critical */ }
    };
    fetchPopular();
  }, []);

  if (!mounted) return null;
  
  if (authLoading && !profile) return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', paddingTop: 'calc(var(--navbar-h) + 20px)', paddingBottom: 80 }}>
      <div className="container" style={{ paddingTop: 32 }}>
        <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40 }}>
          {/* Sidebar Skeleton */}
          <aside className="profile-sidebar" style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
            <div style={{ padding: 24, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)', display: 'flex', gap: 16 }}>
              <Skeleton width={56} height={56} borderRadius="50%" />
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8, flex: 1, justifyContent: 'center' }}>
                <Skeleton width="80%" height={16} />
                <Skeleton width="50%" height={12} />
              </div>
            </div>
            <Skeleton width="100%" height={48} borderRadius={16} />
            <Skeleton width="100%" height={48} borderRadius={16} />
            <Skeleton width="100%" height={48} borderRadius={16} />
          </aside>
          {/* Main Content Skeleton */}
          <main className="profile-content" style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
            <Skeleton width="30%" height={32} />
            <div style={{ background: 'var(--bg-card-solid)', padding: 32, borderRadius: 28, border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 24 }}>
              <Skeleton width="100%" height={56} borderRadius={16} />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
                <Skeleton width="100%" height={56} borderRadius={16} />
                <Skeleton width="100%" height={56} borderRadius={16} />
              </div>
            </div>
          </main>
        </div>
      </div>
    </div>
  );

  if (!user) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', flexDirection: 'column', color: 'var(--text)', textAlign: 'center', padding: 24 }}>
        <div style={{ width: 80, height: 80, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 24 }}>
          <User size={36} style={{ color: 'var(--accent)' }} />
        </div>
        <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: 8 }}>Sign in to continue</h2>
        <p style={{ color: 'var(--text-secondary)', marginBottom: 24, fontSize: 16 }}>Access your bookings, addresses and more.</p>
        <Link href="/auth" className="btn btn-primary btn-lg">Sign In</Link>
      </div>
    );
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    const f = e.target as HTMLFormElement;
    const d = new FormData(f);
    setSaving(true);
    
    try {
      await updateProfile(user.id, {
        full_name: d.get('name') as string,
        phone: d.get('phone') as string,
        email: user.email,
      });
      await refreshProfile();
      toast.success('Success', 'Profile updated successfully.');
    } catch (err: any) {
      toast.error('Error', err.message || 'Failed to update profile.');
    } finally {
      setSaving(false);
    }
  };

  const statusConfig: any = {
    scheduled: { label: 'Scheduled', color: 'var(--accent)', bg: 'rgba(255, 117, 31, 0.1)' },
    pending: { label: 'Pending', color: 'var(--warning)', bg: 'rgba(234, 179, 8, 0.1)' },
    confirmed: { label: 'Confirmed', color: 'var(--accent)', bg: 'var(--accent-light)' },
    en_route: { label: 'En Route', color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.1)' },
    arrived: { label: 'Arrived', color: '#6366f1', bg: 'rgba(99, 102, 241, 0.1)' },
    started: { label: 'In Service', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    completed: { label: 'Completed', color: 'var(--success)', bg: 'rgba(34, 197, 94, 0.1)' },
    cancelled: { label: 'Cancelled', color: 'var(--error)', bg: 'rgba(239, 68, 68, 0.1)' },
  };

  const activeBookings = bookings.filter(b => !['completed', 'cancelled'].includes(b.status));
  const pastBookings = bookings.filter(b => ['completed', 'cancelled'].includes(b.status));
  const firstName = profile?.full_name?.split(' ')[0] || 'there';

  // Filter categories by search
  const filteredCategories = searchQuery
    ? fallbackCategories.filter(c => c.name?.toLowerCase().includes(searchQuery.toLowerCase()))
    : fallbackCategories;
  const accountTabs = [
    { id: 'bookings', label: 'My Bookings', icon: <ClipboardList size={20} />, desc: 'View active and past bookings' },
    { id: 'profile', label: 'Account Settings', icon: <User size={20} />, desc: 'Manage your profile and contact details' },
    { id: 'addresses', label: 'Saved Addresses', icon: <MapPin size={20} />, desc: 'Add or remove delivery addresses' },
    { id: 'payments', label: 'Payment History', icon: <CreditCard size={20} />, desc: 'Manage your payment methods' },
    { id: 'help', label: 'Help & Support', icon: <HelpCircle size={20} />, desc: 'FAQs, chat and call support' },
  ];

  const handleSignOut = async () => {
    await signOut();
    window.location.href = '/';
  };

  const activeSectionContent = () => {
    switch (activeSection) {
      case 'addresses':
        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
              <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>Saved Addresses</h2>
              <button
                onClick={() => setShowAddressModal(true)}
                className="btn btn-secondary"
                style={{ padding: '0 20px', height: 44, borderRadius: 14, fontSize: 14, fontWeight: 700 }}
              >
                <Plus size={18} /> Add New
              </button>
            </div>

            {showAddressModal && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.4)', zIndex: 1000,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20,
                backdropFilter: 'blur(4px)'
              }}>
                <div style={{
                  background: 'var(--bg-card-solid)', padding: 32, borderRadius: 28,
                  width: '100%', maxWidth: 500, border: '1px solid var(--border)',
                  boxShadow: '0 20px 50px rgba(0,0,0,0.2)'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
                    <h3 style={{ fontSize: 20, fontWeight: 800 }}>Add New Address</h3>
                    <button onClick={() => setShowAddressModal(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><XCircle size={24} /></button>
                  </div>
                  <form onSubmit={handleAddAddress} style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Label (Home, Office, etc.)</label>
                      <input className="input" name="label" required placeholder="e.g. Home" style={{ height: 52, borderRadius: 14 }} />
                    </div>
                    <div>
                      <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Full Address</label>
                      <textarea className="input" name="address" required placeholder="Flat no, Building, Area" style={{ height: 100, borderRadius: 14, padding: '12px 16px', resize: 'none' }} />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>City</label>
                        <input className="input" name="city" defaultValue="Greater Noida" style={{ height: 52, borderRadius: 14 }} />
                      </div>
                      <div>
                        <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 8, display: 'block', textTransform: 'uppercase' }}>Pincode</label>
                        <input className="input" name="pincode" required placeholder="201301" style={{ height: 52, borderRadius: 14 }} />
                      </div>
                    </div>
                    <button type="submit" className="btn btn-primary" style={{ height: 56, borderRadius: 16, fontSize: 16, fontWeight: 800, marginTop: 10 }} disabled={saving}>
                      {saving ? 'Adding...' : 'Add Address'}
                    </button>
                  </form>
                </div>
              </div>
            )}
            
            {showDeleteConfirm && (
              <div style={{
                position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                background: 'rgba(0,0,0,0.6)', zIndex: 1100,
                display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 24,
                backdropFilter: 'blur(8px)'
              }}>
                <div style={{
                  background: 'var(--bg-card-solid)', padding: '40px 32px', borderRadius: 32,
                  width: '100%', maxWidth: 400, border: '1px solid var(--border)',
                  boxShadow: '0 30px 60px rgba(0,0,0,0.4)', textAlign: 'center'
                }}>
                  <div style={{
                    width: 64, height: 64, borderRadius: 24, background: 'rgba(239,68,68,0.1)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    color: 'var(--error)', margin: '0 auto 24px'
                  }}>
                    <XCircle size={32} />
                  </div>
                  <h3 style={{ fontSize: 22, fontWeight: 900, marginBottom: 12 }}>Delete Address?</h3>
                  <p style={{ color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6, fontSize: 15 }}>
                    Are you sure you want to remove this address from your profile? This action cannot be undone.
                  </p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <button 
                      onClick={() => { setShowDeleteConfirm(false); setAddressToDelete(null); }} 
                      className="btn btn-secondary" 
                      style={{ height: 52, borderRadius: 16, fontWeight: 700 }}
                      disabled={!!deletingAddr}
                    >
                      Cancel
                    </button>
                    <button 
                      onClick={confirmDelete} 
                      className="btn" 
                      style={{ height: 52, borderRadius: 16, background: 'var(--error)', color: '#fff', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}
                      disabled={!!deletingAddr}
                    >
                      {deletingAddr ? <div className="spinner-sm" style={{width:16,height:16,borderWidth:2}} /> : 'Delete'}
                    </button>
                  </div>
                </div>
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {addresses.length === 0 ? (
                <div style={{ padding: 80, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', background: 'var(--bg-card-solid)', borderRadius: 28, border: '1px solid var(--border)' }}>
                  <MapPinned size={56} style={{ color: 'var(--text-muted)', marginBottom: 20, opacity: 0.2 }} />
                  <p style={{ color: 'var(--text-muted)', fontWeight: 700, fontSize: 16 }}>No addresses saved yet.</p>
                  <p style={{ color: 'var(--text-secondary)', fontSize: 13, marginTop: 4 }}>Add an address to speed up your checkout process.</p>
                </div>
              ) : (
                addresses.map(addr => (
                  <div key={addr.id} style={{ display: 'flex', alignItems: 'center', gap: 20, padding: '24px', borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', transition: 'all 0.3s ease' }}>
                    <div style={{ width: 48, height: 48, borderRadius: 16, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-secondary)', flexShrink: 0 }}>
                      {addr.label === 'Home' ? <Home size={22} /> : addr.label === 'Office' ? <Building2 size={22} /> : <MapPin size={22} />}
                    </div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
                        <h4 style={{ fontSize: 16, fontWeight: 800 }}>{addr.label}</h4>
                        {addr.is_default && <span style={{ fontSize: 10, fontWeight: 800, background: 'var(--accent-light)', color: 'var(--accent)', padding: '2px 8px', borderRadius: 99, textTransform: 'uppercase' }}>Default</span>}
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                        {(addr.house_no || addr.building_name) && (
                          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)' }}>
                            {addr.house_no}{addr.house_no && addr.building_name ? ', ' : ''}{addr.building_name}
                          </div>
                        )}
                        <p style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 500, lineHeight: 1.5 }}>{addr.full_address}</p>
                        <p style={{ fontSize: 13, color: 'var(--text-secondary)', fontWeight: 600 }}>{addr.city} - {addr.pincode}</p>
                        {addr.landmark && <p style={{ fontSize: 12, color: 'var(--accent)', fontWeight: 700, marginTop: 4 }}>Landmark: {addr.landmark}</p>}
                      </div>
                    </div>
                    <button
                      onClick={() => handleDeleteAddress(addr.id)}
                      disabled={deletingAddr === addr.id}
                      style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--error)', padding: 8, opacity: deletingAddr === addr.id ? 0.5 : 1 }}
                    >
                      <XCircle size={20} />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        );
      case 'profile':
        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 24 }}>Account Settings</h2>
            <div style={{ background: 'var(--bg-card-solid)', padding: 32, borderRadius: 28, border: '1px solid var(--border)' }}>
              <form key={profile?.id || 'loading'} onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
                <div>
                  <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>Full Name</label>
                  <input className="input" name="name" defaultValue={profile?.full_name || ''} required style={{ height: 56, borderRadius: 16, fontSize: 15 }} placeholder="Enter your full name" />
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }} className="form-grid">
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>Phone Number</label>
                    <input className="input" name="phone" defaultValue={profile?.phone || ''} required style={{ height: 56, borderRadius: 16, fontSize: 15 }} placeholder="+91 XXXXX XXXXX" />
                  </div>
                  <div>
                    <label style={{ fontSize: 12, fontWeight: 800, color: 'var(--text-muted)', marginBottom: 10, display: 'block', textTransform: 'uppercase' }}>Email Address</label>
                    <input className="input" defaultValue={user.email || ''} style={{ height: 56, borderRadius: 16, fontSize: 15, background: 'var(--bg)', opacity: 0.7 }} readOnly />
                  </div>
                </div>
                <div style={{ marginTop: 12, display: 'flex', justifyContent: 'flex-end' }}>
                  <button type="submit" className="btn btn-primary" style={{ padding: '0 40px', height: 56, borderRadius: 18, fontSize: 16, fontWeight: 800 }} disabled={saving}>
                    {saving ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        );
      case 'payments':
        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 24 }}>Payment History</h2>
            {bookings.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                {bookings.map(b => (
                  <div key={b.id} style={{
                    padding: 24, background: 'var(--glass-bg)', borderRadius: 20,
                    border: '1px solid var(--glass-border)', display: 'flex', justifyContent: 'space-between',
                    alignItems: 'center', flexWrap: 'wrap', gap: 16, backdropFilter: 'blur(10px)'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
                      <div style={{
                        width: 48, height: 48, borderRadius: 12, background: b.status === 'cancelled' ? 'rgba(239,68,68,0.1)' : 'rgba(34,197,94,0.1)',
                        color: b.status === 'cancelled' ? 'var(--error)' : 'var(--success)', display: 'flex', alignItems: 'center', justifyContent: 'center'
                      }}>
                        <CreditCard size={24} />
                      </div>
                      <div>
                        <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>Booking #{b.booking_number}</div>
                        <div style={{ fontSize: 13, color: 'var(--text-secondary)' }}>
                          {new Date(b.created_at).toLocaleDateString('en-IN', { year: 'numeric', month: 'long', day: 'numeric' })}
                          &nbsp;&bull;&nbsp; {b.payment_method || 'Pay After Service'}
                        </div>
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ fontSize: 18, fontWeight: 900, color: 'var(--text)' }}>{formatPrice(b.total)}</div>
                      <div style={{ fontSize: 12, fontWeight: 700, color: b.status === 'cancelled' ? 'var(--error)' : (b.payment_method === 'Pay After Service' && b.status !== 'completed' ? 'var(--warning)' : 'var(--success)'), textTransform: 'uppercase', letterSpacing: '0.05em', marginTop: 4 }}>
                        {b.status === 'cancelled' ? 'Refunded / Cancelled' : (b.payment_method === 'Pay After Service' && b.status !== 'completed' ? 'Pending' : 'Successful')}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{
                padding: 60, textAlign: 'center', background: 'var(--bg-card-solid)', borderRadius: 28,
                border: '1px solid var(--border)', display: 'flex', flexDirection: 'column',
                alignItems: 'center', justifyContent: 'center'
              }}>
                <CreditCard size={56} style={{ color: 'var(--text-muted)', marginBottom: 24, opacity: 0.3 }} />
                <h3 style={{ fontSize: 20, fontWeight: 800, marginBottom: 12 }}>No payments made yet</h3>
              </div>
            )}
          </div>
        );
      case 'help': {
        const FAQS: Record<string, { q: string, a: string }[]> = {
          'Booking Help': [
            { q: 'How do I reschedule a booking?', a: 'You can reschedule any booking up to 2 hours before the scheduled time free of charge. Go to "My Bookings" in your dashboard, select the booking, click "Reschedule", and select your new preferred date and time.' },
            { q: 'What is your cancellation policy?', a: 'Cancellations made more than 4 hours in advance of the scheduled service are 100% free with a full refund to your original payment method. Cancellations within 4 hours are subject to a ₹99 convenience fee to compensate the assigned provider for their travel and preparation.' },
            { q: 'How do I track my service professional?', a: 'Once a service provider is assigned (typically 1 hour before the slot), you will receive an SMS and a push notification with a tracking link. You can also view the live tracking and provider contact number directly under "My Bookings".' },
            { q: 'Can I choose a specific professional?', a: 'Yes! If you enjoyed a previous professional\'s service, you can request them during the booking process or view their profile under "My Bookings" -> "Previous Bookings" and book them again directly.' }
          ],
          'Payment Issues': [
            { q: 'Which payment methods do you accept?', a: 'We accept all major credit/debit cards, UPI (Google Pay, PhonePe, Paytm), Netbanking, and Wallets. Cash on Delivery (COD) is also available for select home services.' },
            { q: 'My payment failed, but money was debited.', a: 'Don\'t worry! If money was debited for a failed transaction, it is held securely by your bank and will be automatically refunded within 3-5 business days. Please contact our support team with the transaction reference ID if the refund is delayed.' },
            { q: 'How do I apply a promo code/coupon?', a: 'During checkout, before confirming your order, type or select your coupon from the list in the "Apply Coupon" field. The discount will be applied instantly to your booking total!' },
            { q: 'Is online payment secure on Zarpit?', a: 'Absolutely. We use industry-standard, fully encrypted payment gateways (Razorpay, Stripe) with robust 3D-Secure authentication to protect your sensitive billing information.' }
          ],
          'Zarpit Plus': [
            { q: 'What is Zarpit Plus?', a: 'Zarpit Plus is our premium membership plan designed for frequent users. For a small monthly fee, members get free service delivery, up to 15% discount on all bookings, priority customer support, and early access to promotional events.' },
            { q: 'How do I join Zarpit Plus?', a: 'You can subscribe to Zarpit Plus directly from your dashboard under the membership tab. The membership cost is automatically debited monthly, and you can cancel it anytime without penalty.' },
            { q: 'Can I share my Zarpit Plus membership?', a: 'Currently, a Zarpit Plus membership is linked to a single registered account and address. We are working on a "Family Share" feature, which will let you share benefits with up to 3 family members soon!' },
            { q: 'What are the benefits of Zarpit loyalty points?', a: 'As a Zarpit Plus member, you earn double loyalty points on every rupee spent. Points can be redeemed for cash discounts, exclusive brand vouchers, or free service upgrades.' }
          ],
          'Account Privacy': [
            { q: 'How is my personal data secured?', a: 'We use advanced AES-256 encryption standards to protect your personal details, and your database records are protected by strict Row-Level Security (RLS) policies. We never share your contact number or address with third parties without your explicit consent.' },
            { q: 'How do I update my profile details?', a: 'Navigate to "Account Settings" in your sidebar. From there, you can update your profile avatar, full name, registered phone number, and password. Make sure to click "Save Changes" to apply the updates.' },
            { q: 'Can I request data deletion?', a: 'Yes, you have the right to be forgotten. If you wish to delete your Zarpit account and purge all personal history from our servers, go to "Account Settings" -> "Privacy" and click "Request Account Deletion" or contact our support team.' },
            { q: 'How do you verify service providers?', a: 'Every service provider on Zarpit undergoes a rigorous multi-step vetting process, including mandatory background checks, criminal record verification, and professional skill assessments. Your safety is our absolute priority.' }
          ]
        };

        const activeCat = selectedHelpCategory;
        const currentFaqs = activeCat ? FAQS[activeCat] || [] : [];
        const filteredFaqs = currentFaqs.filter(
          faq => faq.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) || 
                 faq.a.toLowerCase().includes(helpSearchQuery.toLowerCase())
        );

        return (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            {activeCat ? (
              // Category Deep Dive View
              <div>
                <button 
                  onClick={() => {
                    setSelectedHelpCategory(null);
                    setExpandedFaqIndex(null);
                    setHelpSearchQuery('');
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 8,
                    background: 'transparent',
                    border: 'none',
                    color: 'var(--accent)',
                    fontWeight: 700,
                    fontSize: 14,
                    cursor: 'pointer',
                    padding: 0,
                    marginBottom: 24,
                    transition: 'transform 0.2s ease'
                  }}
                  onMouseEnter={e => e.currentTarget.style.transform = 'translateX(-4px)'}
                  onMouseLeave={e => e.currentTarget.style.transform = 'none'}
                >
                  <ArrowRight size={16} style={{ transform: 'rotate(180deg)', marginRight: 4 }} /> Back to Help Center
                </button>

                <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 28 }}>
                  <div style={{
                    width: 56,
                    height: 56,
                    borderRadius: 16,
                    background: activeCat === 'Booking Help' ? '#3b82f615' : activeCat === 'Payment Issues' ? '#8b5cf615' : activeCat === 'Zarpit Plus' ? '#f59e0b15' : '#10b98115',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: activeCat === 'Booking Help' ? '#3b82f6' : activeCat === 'Payment Issues' ? '#8b5cf6' : activeCat === 'Zarpit Plus' ? '#f59e0b' : '#10b981'
                  }}>
                    {activeCat === 'Booking Help' ? <ClipboardList size={26} /> : activeCat === 'Payment Issues' ? <CreditCard size={26} /> : activeCat === 'Zarpit Plus' ? <Zap size={26} /> : <Shield size={26} />}
                  </div>
                  <div>
                    <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }}>{activeCat} Solutions</h2>
                    <p style={{ color: 'var(--text-muted)', fontSize: 14, fontWeight: 500 }}>Browse standard answers or type in search below.</p>
                  </div>
                </div>



                <div style={{ display: 'flex', flexDirection: 'column', gap: 16, marginBottom: 40 }}>
                  {filteredFaqs.length > 0 ? (
                    filteredFaqs.map((faq, index) => {
                      const isExpanded = expandedFaqIndex === index;
                      return (
                        <div 
                          key={index} 
                          style={{ 
                            background: 'var(--bg-card-solid)', 
                            borderRadius: 24, 
                            border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`, 
                            overflow: 'hidden', 
                            transition: 'all 0.3s ease'
                          }}
                        >
                          <button
                            onClick={() => setExpandedFaqIndex(isExpanded ? null : index)}
                            style={{
                              width: '100%',
                              padding: '24px 28px',
                              background: 'transparent',
                              border: 'none',
                              textAlign: 'left',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'space-between',
                              cursor: 'pointer',
                              color: 'inherit',
                              outline: 'none'
                            }}
                          >
                            <span style={{ fontSize: 16, fontWeight: 800, paddingRight: 16 }}>{faq.q}</span>
                            <ChevronRight 
                              size={20} 
                              style={{ 
                                color: isExpanded ? 'var(--accent)' : 'var(--text-muted)',
                                transform: isExpanded ? 'rotate(90deg)' : 'none',
                                transition: 'transform 0.25s ease'
                              }} 
                            />
                          </button>

                          <div style={{ 
                            maxHeight: isExpanded ? 500 : 0, 
                            overflow: 'hidden', 
                            transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                          }}>
                            <div style={{ padding: '0 28px 28px', borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
                              <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                                {faq.a}
                              </p>
                              <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                                <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Was this response helpful?</span>
                                <button 
                                  onClick={() => toast.success('Thank you for your feedback!')}
                                  style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  Yes
                                </button>
                                <button 
                                  onClick={() => toast.info("We've reported this. You can contact support directly below.")}
                                  style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--bg-input)', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                >
                                  No
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })
                  ) : (
                    <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                      <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
                      <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>No matching answers found</h4>
                      <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try refining your search terms or view alternative questions.</p>
                    </div>
                  )}
                </div>
              </div>
            ) : (
              // Main Grid View
              <div>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 24 }}>Help Center</h2>
                <div style={{ position: 'relative', marginBottom: 32 }}>
                  <Search size={20} style={{ position: 'absolute', left: 24, top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', zIndex: 5 }} />
                  <input 
                    className="input" 
                    placeholder="Type to search overall FAQs..." 
                    value={helpSearchQuery}
                    onChange={e => {
                      setHelpSearchQuery(e.target.value);
                    }}
                    style={{ height: 64, borderRadius: 20, paddingLeft: 60, fontSize: 16, fontWeight: 600 }} 
                  />
                </div>

                {helpSearchQuery ? (
                  // Global Search Results View
                  <div style={{ marginBottom: 40 }}>
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 20 }}>
                      <h3 style={{ fontSize: 16, fontWeight: 800, color: 'var(--text-muted)' }}>Global Search Results</h3>
                      <button onClick={() => setHelpSearchQuery('')} style={{ background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 700, fontSize: 13, cursor: 'pointer' }}>Reset Search</button>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                      {Object.entries(FAQS).flatMap(([catName, list]) => 
                        list.filter(faq => faq.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) || faq.a.toLowerCase().includes(helpSearchQuery.toLowerCase()))
                            .map((faq, idx) => ({ ...faq, catName, idx }))
                      ).length > 0 ? (
                        Object.entries(FAQS).flatMap(([catName, list]) => 
                          list.filter(faq => faq.q.toLowerCase().includes(helpSearchQuery.toLowerCase()) || faq.a.toLowerCase().includes(helpSearchQuery.toLowerCase()))
                              .map((faq, idx) => {
                                const globalKey = `${catName}-${idx}`;
                                const isExpanded = expandedFaqIndex === idx;
                                return (
                                  <div 
                                    key={globalKey} 
                                    style={{ 
                                      background: 'var(--bg-card-solid)', 
                                      borderRadius: 24, 
                                      border: `1px solid ${isExpanded ? 'var(--accent)' : 'var(--border)'}`, 
                                      overflow: 'hidden', 
                                      transition: 'all 0.3s ease'
                                    }}
                                  >
                                    <button
                                      onClick={() => setExpandedFaqIndex(isExpanded ? null : idx)}
                                      style={{
                                        width: '100%',
                                        padding: '24px 28px',
                                        background: 'transparent',
                                        border: 'none',
                                        textAlign: 'left',
                                        display: 'flex',
                                        alignItems: 'center',
                                        justifyContent: 'space-between',
                                        cursor: 'pointer',
                                        color: 'inherit',
                                        outline: 'none'
                                      }}
                                    >
                                      <div>
                                        <span style={{ fontSize: 10, color: 'var(--accent)', fontWeight: 800, textTransform: 'uppercase', display: 'block', marginBottom: 4 }}>{catName}</span>
                                        <span style={{ fontSize: 16, fontWeight: 800 }}>{faq.q}</span>
                                      </div>
                                      <ChevronRight 
                                        size={20} 
                                        style={{ 
                                          color: isExpanded ? 'var(--accent)' : 'var(--text-muted)',
                                          transform: isExpanded ? 'rotate(90deg)' : 'none',
                                          transition: 'transform 0.25s ease'
                                        }} 
                                      />
                                    </button>

                                    <div style={{ 
                                      maxHeight: isExpanded ? 500 : 0, 
                                      overflow: 'hidden', 
                                      transition: 'max-height 0.3s cubic-bezier(0.4, 0, 0.2, 1)'
                                    }}>
                                      <div style={{ padding: '0 28px 28px', borderTop: '1px solid var(--border-light)', paddingTop: 20 }}>
                                        <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: 20 }}>
                                          {faq.a}
                                        </p>
                                        <div style={{ display: 'flex', alignItems: 'center', gap: 12, borderTop: '1px solid var(--border-light)', paddingTop: 16 }}>
                                          <span style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600 }}>Was this response helpful?</span>
                                          <button 
                                            onClick={() => toast.success('Thank you for your feedback!')}
                                            style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--accent-light)', border: 'none', color: 'var(--accent)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            Yes
                                          </button>
                                          <button 
                                            onClick={() => toast.info("We've reported this. You can contact support directly below.")}
                                            style={{ padding: '6px 14px', borderRadius: 10, background: 'var(--bg-input)', border: 'none', color: 'var(--text-muted)', fontSize: 12, fontWeight: 700, cursor: 'pointer' }}
                                          >
                                            No
                                          </button>
                                        </div>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                        )
                      ) : (
                        <div style={{ padding: '40px 20px', textAlign: 'center', background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                          <HelpCircle size={48} style={{ color: 'var(--text-muted)', marginBottom: 16, opacity: 0.4 }} />
                          <h4 style={{ fontSize: 16, fontWeight: 800, marginBottom: 4 }}>No matching answers found</h4>
                          <p style={{ fontSize: 13, color: 'var(--text-muted)' }}>Try typing other keywords like "refund", "reschedule", "verify", etc.</p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Category Grid
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 20, marginBottom: 40 }}>
                    {[
                      { title: 'Booking Help', icon: <ClipboardList size={24} />, color: '#3b82f6' },
                      { title: 'Payment Issues', icon: <CreditCard size={24} />, color: '#8b5cf6' },
                      { title: 'Zarpit Plus', icon: <Zap size={24} />, color: '#f59e0b' },
                      { title: 'Account Privacy', icon: <Shield size={24} />, color: '#10b981' },
                    ].map((cat, i) => (
                      <div 
                        key={i} 
                        onClick={() => setSelectedHelpCategory(cat.title)}
                        style={{ padding: 28, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)', cursor: 'pointer', transition: 'all 0.3s ease' }} 
                        className="help-card-v2"
                      >
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: `${cat.color}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: cat.color, marginBottom: 20 }}>
                          {cat.icon}
                        </div>
                        <h4 style={{ fontSize: 17, fontWeight: 800, marginBottom: 8 }}>{cat.title}</h4>
                        <p style={{ fontSize: 13, color: 'var(--text-muted)', lineHeight: 1.5 }}>Find solutions for {cat.title.toLowerCase()} quickly.</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Need Instant Support Banner */}
            <div style={{ padding: 40, background: '#ff751f', borderRadius: 28, color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 24, flexWrap: 'wrap' }}>
              <div>
                <h3 style={{ fontSize: 24, fontWeight: 900, marginBottom: 8 }}>Need instant support?</h3>
                <p style={{ fontSize: 15, opacity: 0.9 }}>Our team is online and ready to help you.</p>
              </div>
              <div style={{ display: 'flex', gap: 12 }}>
                <a href="tel:+917524889871" className="btn" style={{ height: 52, padding: '0 24px', borderRadius: 16, background: '#fff', color: '#ff751f', fontWeight: 800 }}>Call Support</a>
                <a href="https://wa.me/917524889871" target="_blank" rel="noopener noreferrer" className="btn" style={{ height: 52, padding: '0 24px', borderRadius: 16, background: '#25D366', color: '#fff', border: 'none', fontWeight: 800, display: 'flex', alignItems: 'center', gap: 8 }}>
                  <MessageCircle size={20} /> WhatsApp
                </a>
              </div>
            </div>
          </div>
        );
      }
      case 'bookings':
        return (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 40 }}>
            <h2 style={{ fontSize: '1.8rem', fontWeight: 900 }}>My Bookings</h2>

            {activeBookings.length > 0 && (
              <section>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                  <Zap size={20} color="var(--accent)" />
                  <h3 style={{ fontSize: 20, fontWeight: 900 }}>Active Bookings</h3>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {activeBookings.map(b => {
                    const config = statusConfig[b.status] || statusConfig.pending;
                    return (
                      <Link key={b.id} href={`/bookings/${b.id}`} style={{
                        display: 'flex', alignItems: 'center', gap: 16, padding: '20px', borderRadius: 20,
                        background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
                        textDecoration: 'none', transition: 'all 0.3s ease',
                      }}>
                        <div style={{ width: 52, height: 52, borderRadius: 16, background: config.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                          <Activity size={24} color={config.color} />
                        </div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                            {formatServiceNames(b.booking_items || [])}
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 2 }}>
                            <span>
                              Placed: {mounted ? new Date(b.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', hour: 'numeric', minute: '2-digit', hour12: true }) : '---'}
                            </span>
                            <span style={{ color: 'var(--accent)' }}>
                              For: {mounted ? new Date(b.scheduled_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short' }) : '---'} at {b.scheduled_time}
                            </span>
                          </div>
                          <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4 }}>
                            {formatPrice(b.total)}
                          </div>
                        </div>
                        <span style={{ padding: '6px 14px', borderRadius: 99, fontSize: 11, fontWeight: 800, background: config.bg, color: config.color, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                          {config.label}
                        </span>
                      </Link>
                    );
                  })}
                </div>
              </section>
            )}

            <section>
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 20 }}>
                <ClipboardList size={20} color="var(--text-muted)" />
                <h3 style={{ fontSize: 20, fontWeight: 900 }}>Booking History</h3>
              </div>
              {pastBookings.length === 0 ? (
                <div style={{ padding: 48, textAlign: 'center', background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                  <p style={{ color: 'var(--text-muted)', fontSize: 15, fontWeight: 600 }}>No completed bookings yet.</p>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  {pastBookings.map(b => (
                    <Link key={b.id} href={`/bookings/${b.id}`} style={{
                      display: 'flex', alignItems: 'center', gap: 16, padding: '18px 24px', borderRadius: 20,
                      background: 'var(--bg-card-solid)', border: '1px solid var(--border)',
                      textDecoration: 'none', transition: 'all 0.3s ease',
                    }}>
                      <div style={{ flex: 1 }}>
                        <div style={{ fontSize: 15, fontWeight: 800, color: 'var(--text)', marginBottom: 4 }}>
                          {formatServiceNames(b.booking_items || [])}
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 600, display: 'flex', flexDirection: 'column', gap: 2 }}>
                          <span>
                            Placed: {mounted ? new Date(b.created_at).toLocaleString('en-US', { day: 'numeric', month: 'short', year: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : '---'}
                          </span>
                          <span style={{ color: 'var(--text-secondary)' }}>
                            For: {mounted ? new Date(b.scheduled_date).toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric' }) : '---'} at {b.scheduled_time}
                          </span>
                        </div>
                        <div style={{ fontSize: 13, color: 'var(--text-muted)', fontWeight: 700, marginTop: 4 }}>
                          {formatPrice(b.total)}
                        </div>
                      </div>
                      <ChevronRight size={18} color="var(--text-muted)" />
                    </Link>
                  ))}
                </div>
              )}
            </section>

            <div style={{ padding: 32, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)', textAlign: 'center' }}>
              <p style={{ fontSize: 16, fontWeight: 700, color: 'var(--text-secondary)', marginBottom: 12 }}>Booked wrong slot? No worries!</p>
              <Link href="/services" className="btn btn-primary" style={{ display: 'inline-flex', padding: '0 32px', height: 52, borderRadius: 14, fontSize: 15, fontWeight: 800 }}>
                Reorder Service
              </Link>
            </div>
          </div>
        );
      default:
        return (
          <div style={{ animation: 'fadeIn 0.3s ease', display: 'flex', flexDirection: 'column', gap: 32 }}>
            <div style={{ padding: '40px', background: 'linear-gradient(135deg, #ff751f 0%, #ff9d5c 100%)', borderRadius: 32, color: '#fff', position: 'relative', overflow: 'hidden' }}>
              <div style={{ position: 'absolute', top: -20, right: -20, width: 120, height: 120, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />
              <div style={{ position: 'relative', zIndex: 1 }}>
                <h2 style={{ fontSize: 28, fontWeight: 900, marginBottom: 8 }}>Refer & Earn</h2>
                <p style={{ fontSize: 16, opacity: 0.9, marginBottom: 24, maxWidth: 300 }}>Invite your friends to Zarpit and get upto ₹100 for each referral.</p>
                <button style={{ padding: '0 24px', height: 48, borderRadius: 14, background: '#fff', color: '#ff751f', border: 'none', fontWeight: 800, fontSize: 15 }}>Invite Friends</button>
              </div>
              <img src="/images/logo.jpg" alt="Background Logo" style={{ position: 'absolute', right: 20, bottom: -20, height: 160, opacity: 0.15, transform: 'rotate(-15deg)', mixBlendMode: 'screen', pointerEvents: 'none' }} />
            </div>

            <div className="desktop-only-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 20 }}>
              <div style={{ padding: 24, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                <div style={{ color: 'var(--accent)', marginBottom: 12 }}><ClipboardList size={32} /></div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{bookings.length}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Total Bookings</div>
              </div>
              <div style={{ padding: 24, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                <div style={{ color: '#10b981', marginBottom: 12 }}><MapPin size={32} /></div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>{addresses.length}</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Saved Addresses</div>
              </div>
              <div style={{ padding: 24, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)' }}>
                <div style={{ color: '#f59e0b', marginBottom: 12 }}><Zap size={32} /></div>
                <div style={{ fontSize: 24, fontWeight: 900 }}>0</div>
                <div style={{ fontSize: 14, color: 'var(--text-muted)', fontWeight: 600 }}>Loyalty Points</div>
              </div>
            </div>

            <section style={{ marginTop: 12 }}>
              <style dangerouslySetInnerHTML={{ __html: `
                .popular-service-card {
                  transition: all 0.35s cubic-bezier(0.4, 0, 0.2, 1) !important;
                }
                .popular-service-card:hover {
                  transform: translateY(-8px) !important;
                  border-color: var(--accent) !important;
                  box-shadow: 0 16px 36px rgba(0, 0, 0, 0.1) !important;
                }
                .popular-service-card:hover .card-image {
                  transform: scale(1.08) !important;
                }
                .popular-service-card:hover .arrow-btn {
                  background: var(--accent) !important;
                  color: #000 !important;
                  transform: translateX(4px) !important;
                }
              `}} />
              
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 24 }}>
                <h3 style={{ fontSize: 22, fontWeight: 900, letterSpacing: '-0.02em', display: 'flex', alignItems: 'center', gap: 10 }}>
                  <TrendingUp size={22} style={{ color: 'var(--accent)' }} /> 
                  Popular Services
                </h3>
                <Link href="/" style={{ fontSize: 13, fontWeight: 700, color: 'var(--accent)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 4 }}>
                  View All <ChevronRight size={14} />
                </Link>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 24 }}>
                {popularServices.map((s, i) => (
                  <DashboardServiceCard s={s} i={i} key={i} />
                ))}
              </div>
            </section>
          </div>
        );
    }
  };

  return (
    <div style={{ background: 'var(--bg)', minHeight: '100vh', color: 'var(--text)', paddingTop: 'calc(var(--navbar-h) + 20px)', paddingBottom: 80 }}>
      {/* ================================================================
           MOBILE HEADER (Ref: Screenshot 3)
           ================================================================ */}
      <div className="mobile-header" style={{
        background: '#ff751f',
        padding: '60px 24px 40px',
        color: '#fff',
        display: 'none',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Subtle decorative circle */}
        <div style={{ position: 'absolute', top: -40, right: -40, width: 140, height: 140, borderRadius: '50%', background: 'rgba(255,255,255,0.1)' }} />

        <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
          <div style={{ position: 'relative', marginBottom: 16 }}>
            <div style={{
              width: 100, height: 100, borderRadius: '50%',
              background: 'rgba(255,255,255,0.2)', border: '4px solid rgba(255,255,255,0.3)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: 36, fontWeight: 800, color: '#fff', overflow: 'hidden'
            }}>
              {(() => {
                const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                if (avatarUrl) {
                  return <img src={avatarUrl} alt={profile?.full_name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                }
                return (profile?.full_name || 'U')[0].toUpperCase();
              })()}
            </div>
          </div>
          <h1 style={{ fontSize: '1.8rem', fontWeight: 900, marginBottom: 4 }}>{profile?.full_name || 'User'}</h1>
          <p style={{ fontSize: 15, opacity: 0.9, fontWeight: 500, marginBottom: 12 }}>{profile?.phone || 'Add phone number'}</p>
          <button
            onClick={() => setActiveSection('profile')}
            style={{ fontSize: 13, fontWeight: 700, color: '#fff', display: 'flex', alignItems: 'center', gap: 6, background: 'none', border: 'none', cursor: 'pointer' }}
          >
            Edit profile <ChevronRight size={14} />
          </button>
        </div>
      </div>

      <div className="container" style={{ paddingTop: 32 }}>
        <div className="profile-layout" style={{ display: 'grid', gridTemplateColumns: '280px 1fr', gap: 40 }}>

          {/* ================================================================
               SIDEBAR (Desktop) / TOP MENU (Mobile)
               ================================================================ */}
          <aside className="profile-sidebar" style={{ position: 'sticky', top: 100, height: 'fit-content' }}>
            <div className="desktop-user-card" style={{ padding: 24, background: 'var(--bg-card-solid)', borderRadius: 24, border: '1px solid var(--border)', marginBottom: 24 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 20 }}>
                <div style={{ width: 56, height: 56, borderRadius: '50%', background: 'var(--accent-light)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: 20, fontWeight: 800, color: 'var(--accent)', overflow: 'hidden', flexShrink: 0 }}>
                  {(() => {
                    const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                    if (avatarUrl) {
                      return <img src={avatarUrl} alt={profile?.full_name || 'User'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                    }
                    return (profile?.full_name || 'U')[0].toUpperCase();
                  })()}
                </div>
                               <div style={{ flex: 1, minWidth: 0 }}>
                  <h2 style={{ fontSize: 16, fontWeight: 800, marginBottom: 2, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{profile?.full_name || 'User'}</h2>
                  <p style={{ fontSize: 12, color: 'var(--text-muted)', fontWeight: 600, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.email}</p>
                </div>
              </div>
              <button onClick={handleSignOut} style={{ width: '100%', padding: '12px', borderRadius: 14, background: 'rgba(239,68,68,0.08)', border: 'none', color: 'var(--error)', fontSize: 14, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
                <LogOut size={16} /> Logout
              </button>
            </div>

            <nav style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              <button
                onClick={() => setActiveSection('main')}
                className={`nav-item ${activeSection === 'main' ? 'active' : ''}`}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16,
                  border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s',
                  fontSize: 15, fontWeight: 700, textAlign: 'left',
                  background: activeSection === 'main' ? 'var(--accent-light)' : 'transparent',
                  color: activeSection === 'main' ? 'var(--accent)' : 'var(--text-secondary)'
                }}
              >
                <LayoutGrid size={20} /> Dashboard
              </button>
              {accountTabs.map(tab => (
                <button
                  key={tab.id}
                  onClick={() => setActiveSection(tab.id as any)}
                  className={`nav-item ${activeSection === tab.id ? 'active' : ''}`}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '14px 20px', borderRadius: 16,
                    border: '1px solid transparent', cursor: 'pointer', transition: 'all 0.2s',
                    fontSize: 15, fontWeight: 700, textAlign: 'left',
                    background: activeSection === tab.id ? 'var(--accent-light)' : 'transparent',
                    color: activeSection === tab.id ? 'var(--accent)' : 'var(--text-secondary)'
                  }}
                >
                  {tab.icon} {tab.label}
                </button>
              ))}
            </nav>

            <div style={{ marginTop: 24, paddingTop: 24, borderTop: '1px solid var(--border)' }}>
              <p style={{ fontSize: 11, fontWeight: 800, color: 'var(--text-muted)', paddingLeft: 20, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Others</p>
              <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
                <Link href="/about" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 12, background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }} className="nav-item">
                  <AlertCircle size={18} /> About us
                </Link>
                <Link href="/terms" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 12, background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }} className="nav-item">
                  <ClipboardList size={18} /> Terms & Conditions
                </Link>
                <Link href="/privacy" style={{ display: 'flex', alignItems: 'center', gap: 12, padding: '10px 20px', borderRadius: 12, background: 'transparent', color: 'var(--text-muted)', fontSize: 14, fontWeight: 600, textDecoration: 'none', transition: 'all 0.2s' }} className="nav-item">
                  <Shield size={18} /> Privacy Policy
                </Link>
              </div>
            </div>
          </aside>

          {/* ================================================================
               MAIN CONTENT AREA
               ================================================================ */}
          <main className="profile-content">
            {/* Mobile Grid Menu (Visible only on mobile, active only when section is main) */}
            {activeSection === 'main' && (
              <div className="mobile-only-grid" style={{ display: 'none', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 32 }}>
                <button onClick={() => setActiveSection('bookings')} style={{ padding: 24, borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(59,130,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#3b82f6' }}><ClipboardList size={22} /></div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>My bookings</span>
                </button>
                <button onClick={() => setActiveSection('profile')} style={{ padding: 24, borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(16,185,129,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#10b981' }}><User size={22} /></div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Account</span>
                </button>
                <button onClick={() => setActiveSection('addresses')} style={{ padding: 24, borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(245,158,11,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#f59e0b' }}><MapPin size={22} /></div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Addresses</span>
                </button>
                <button onClick={() => setActiveSection('payments')} style={{ padding: 24, borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(139,92,246,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b5cf6' }}><CreditCard size={22} /></div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Payment History</span>
                </button>
                <button onClick={() => setActiveSection('help')} style={{ padding: 24, borderRadius: 24, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'flex-start', cursor: 'pointer', boxShadow: 'var(--shadow-sm)' }}>
                  <div style={{ width: 44, height: 44, borderRadius: 14, background: 'rgba(99,102,241,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1' }}><HelpCircle size={22} /></div>
                  <span style={{ fontSize: 16, fontWeight: 800, color: 'var(--text)' }}>Help</span>
                </button>

                {/* Refer & Earn (Static placeholder like screenshot) */}
                <div style={{ gridColumn: '1 / -1', padding: '16px 20px', borderRadius: 20, background: 'var(--bg-card-solid)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 32, height: 32, borderRadius: 8, background: '#fef3c7', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#d97706' }}><Gift size={18} /></div>
                    <span style={{ fontSize: 15, fontWeight: 700, color: 'var(--text)' }}>Refer & earn</span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <span style={{ fontSize: 11, fontWeight: 800, background: '#fef3c7', color: '#d97706', padding: '4px 8px', borderRadius: 99 }}>Upto ₹100</span>
                    <ChevronRight size={16} color="var(--text-muted)" />
                  </div>
                </div>
              </div>
            )}

            {activeSection !== 'main' && (
              <button 
                className="mobile-back-btn" 
                onClick={() => setActiveSection('main')}
                style={{ display: 'none', alignItems: 'center', gap: 8, background: 'transparent', border: 'none', color: 'var(--accent)', fontWeight: 800, fontSize: 16, marginBottom: 24, cursor: 'pointer', padding: 0 }}
              >
                <ChevronRight size={18} style={{ transform: 'rotate(180deg)' }} /> Back to Menu
              </button>
            )}

            {activeSectionContent()}

            {/* Mobile Footer Links (Ref: Screenshot 3) */}
            <div className="mobile-footer-links" style={{ display: 'none', flexDirection: 'column', gap: 1, background: 'var(--border)', borderRadius: 24, overflow: 'hidden', marginTop: 32, border: '1px solid var(--border)' }}>
              <Link href="/about" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-card-solid)', width: '100%', textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><AlertCircle size={18} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: 'var(--text)' }}>About us</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>
              <Link href="/terms" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-card-solid)', borderTop: '1px solid var(--border-light)', width: '100%', textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><ClipboardList size={18} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: 'var(--text)' }}>Terms of services</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>
              <Link href="/privacy" style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-card-solid)', borderTop: '1px solid var(--border-light)', width: '100%', textDecoration: 'none' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><Shield size={18} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: 'var(--text)' }}>Privacy policy</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </Link>
              <button onClick={() => toast.info('Request Received', 'Account deletion request has been sent to our team.')} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-card-solid)', border: 'none', borderTop: '1px solid var(--border-light)', width: '100%', textAlign: 'left', cursor: 'pointer' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)' }}><XCircle size={18} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1, color: 'var(--text)' }}>Request account deletion</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
              <button onClick={handleSignOut} style={{ display: 'flex', alignItems: 'center', gap: 16, padding: '18px 20px', background: 'var(--bg-card-solid)', border: 'none', width: '100%', textAlign: 'left', cursor: 'pointer', color: 'var(--error)' }}>
                <div style={{ width: 32, height: 32, borderRadius: 8, background: 'rgba(239,68,68,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><LogOut size={18} /></div>
                <span style={{ fontSize: 15, fontWeight: 700, flex: 1 }}>Log out</span>
                <ChevronRight size={16} color="var(--text-muted)" />
              </button>
            </div>
          </main>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{
        __html: `
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        .nav-item:hover { background: var(--bg-elevated) !important; color: var(--accent) !important; }
        .help-card-v2:hover { transform: translateY(-4px); border-color: var(--accent) !important; box-shadow: var(--shadow-md); }
        
        @media (max-width: 900px) {
          html, body { overflow-x: hidden !important; width: 100% !important; position: relative !important; }
          .profile-layout { grid-template-columns: 1fr !important; gap: 20px !important; width: 100% !important; margin: 0 !important; }
          .profile-sidebar { display: none !important; }
          .mobile-header { display: block !important; margin-top: -20px !important; width: 100% !important; }
          .mobile-only-grid { display: grid !important; gap: 12px !important; width: 100% !important; }
          .mobile-only-grid button { padding: 16px !important; width: 100% !important; }
          .mobile-footer-links { display: flex !important; width: 100% !important; }
          .container { max-width: 100% !important; width: 100% !important; padding: 12px !important; margin: 0 !important; overflow-x: hidden !important; }
          .profile-content { padding-top: 0 !important; width: 100% !important; overflow-x: hidden !important; }
          .form-grid { grid-template-columns: 1fr !important; gap: 16px !important; }
          .desktop-only-grid { display: none !important; }
          .mobile-back-btn { display: flex !important; }
        }
        
        @media (min-width: 901px) {
          .mobile-header { display: none !important; }
        }
      `}} />
    </div>
  );
}

export default function ProfilePage() {
  return (
    <>
      <Navbar />
      <ToastContainer />
      <Suspense fallback={<div style={{ minHeight: '100vh', background: 'var(--bg)' }} />}>
        <ProfileContent />
      </Suspense>
    </>
  );
}
