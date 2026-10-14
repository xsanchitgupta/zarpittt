'use client';
import { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { getCartCount } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';
import { useRealtimeNotifications } from '@/lib/realtime';
import { markAsRead, markAllAsRead } from '@/lib/notifications';
import { User, ClipboardList, Tag, Shield, LogOut, Lock, Home, FolderOpen, ShoppingCart, MapPin, ChevronDown } from 'lucide-react';
import s from './Navbar.module.css';

export default function Navbar() {
  const { user, profile, isAdmin, signOut, loading: authLoading } = useAuth();
  const { notifications, unreadCount, refetch: refetchNotifs } = useRealtimeNotifications(user?.id ?? null);
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [profileOpen, setProfileOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const [cartCount, setCartCount] = useState(0);
  const [theme, setTheme] = useState<'light' | 'dark'>('dark');
  const [locationArea, setLocationArea] = useState('Greater Noida & GN West');
  const notifRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const [mounted, setMounted] = useState(false);
  const [mobileSearchOpen, setMobileSearchOpen] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {

    setMounted(true);
    const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null;
    if (savedTheme) {
      setTheme(savedTheme);
      document.documentElement.setAttribute('data-theme', savedTheme);
    }

    // Read stored location
    const readLocation = () => {
      try {
        const stored = localStorage.getItem('zarpit_location');
        if (stored) {
          const loc = JSON.parse(stored);
          if (loc.address) {
            // Show full address, truncate if very long for UI safety
            const addr = loc.address.length > 35 ? loc.address.substring(0, 32) + '...' : loc.address;
            setLocationArea(addr);
          } else if (loc.area) {
            setLocationArea(loc.area);
          } else if (loc.status === 'not_serviceable') {
            setLocationArea('Outside Service Area');
          }
        }
      } catch { /* ignore */ }
    };
    readLocation();
    window.addEventListener('storage', readLocation);
    window.addEventListener('zarpit_location_updated', readLocation);
    window.addEventListener('focus', readLocation);
    return () => {
      window.removeEventListener('storage', readLocation);
      window.removeEventListener('zarpit_location_updated', readLocation);
      window.removeEventListener('focus', readLocation);
    };
  }, []);

  const toggleTheme = () => {
    const newTheme = theme === 'dark' ? 'light' : 'dark';
    setTheme(newTheme);
    document.documentElement.setAttribute('data-theme', newTheme);
    localStorage.setItem('theme', newTheme);
  };

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 50);
    const onCart = () => setCartCount(getCartCount());
    window.addEventListener('scroll', onScroll);
    window.addEventListener('cartUpdate', onCart);
    onScroll();
    onCart();
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('cartUpdate', onCart);
    };
  }, []);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) setNotifOpen(false);
      if (profileRef.current && !profileRef.current.contains(e.target as Node)) setProfileOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSignOut = async () => {
    setProfileOpen(false);
    await signOut();
    window.location.href = '/';
  };

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Account';

  return (
    <>
      <nav className={`${s.navbar} ${scrolled ? s.scrolled : ''}`}>
        <div className={s.inner}>
          <div className={s.navLeft}>
            <Link href="/" className={s.logo}>
              <Image src="/images/logo.jpg" alt="Zarpit" width={42} height={42} className={s.logoImg} style={{borderRadius:'var(--radius-md)'}} />
              <span>Zarpit</span>
            </Link>

            <button
              className={s.locationSelector}
              onClick={() => {
                localStorage.removeItem('zarpit_location_done');
                localStorage.removeItem('zarpit_location');
                window.dispatchEvent(new Event('zarpit_reopen_location'));
              }}
              title="Change Location"
            >
              <div className={s.locationPin}>
                <MapPin size={16} strokeWidth={2.5} />
              </div>
              <div className={s.locationText}>
                <span>{locationArea}</span>
              </div>
              <ChevronDown size={14} className={s.locationChevron} />
            </button>
          </div>

          <div className={s.search}>
            <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            <input className={s.searchInput} type="text" placeholder="Search for services..." onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`; }} />
          </div>

          <div className={s.actions}>
            {/* Mobile Search Toggle */}
            <button 
              className={`${s.searchToggle} mobile-only`} 
              onClick={() => {
                setMobileSearchOpen(true);
                setTimeout(() => searchInputRef.current?.focus(), 100);
              }}
              aria-label="Search"
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
            </button>

            {/* Expanding Mobile Search Bar Overlay */}
            <div className={`${s.mobileSearchOverlay} ${mobileSearchOpen ? s.mobileSearchVisible : ''}`}>
              <div className={s.mobileSearchInner}>
                <svg className={s.searchIcon} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input 
                  ref={searchInputRef}
                  className={s.searchInput} 
                  type="text" 
                  placeholder="What are you looking for?" 
                  onKeyDown={(e) => { if (e.key === 'Enter') window.location.href = `/search?q=${encodeURIComponent((e.target as HTMLInputElement).value)}`; }} 
                />
                <button className={s.closeSearch} onClick={() => setMobileSearchOpen(false)}>✕</button>
              </div>
            </div>
            <button className={s.themeToggle} onClick={toggleTheme} aria-label="Toggle Theme">
              {theme === 'dark' ? (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="12" cy="12" r="5"/><line x1="12" y1="1" x2="12" y2="3"/><line x1="12" y1="21" x2="12" y2="23"/><line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/><line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/><line x1="1" y1="12" x2="3" y2="12"/><line x1="21" y1="12" x2="23" y2="12"/><line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/><line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/></svg>
              ) : (
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
              )}
            </button>

            <Link href="/services" className="btn btn-ghost btn-sm hide-mobile" style={{fontSize:13}}>Services</Link>

            <Link href="/profile?tab=payments" className={s.cartBtn} title="Payment History">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>
            </Link>

            {/* Notification Bell */}
            {user && (
              <div ref={notifRef} style={{position:'relative'}}>
                <button className={s.cartBtn} onClick={() => setNotifOpen(!notifOpen)} aria-label="Notifications">
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>
                  {unreadCount > 0 && <span className={s.cartBadge}>{unreadCount}</span>}
                </button>
                {notifOpen && (
                  <div style={{position:'absolute',top:'calc(100% + 8px)',right:0,width:340,maxHeight:400,overflowY:'auto',background:'var(--bg-card-solid)',border:'1px solid var(--glass-border)',borderRadius:'var(--radius-xl)',boxShadow:'var(--shadow-xl)',zIndex:1000,backdropFilter:'blur(24px)',animation:'fadeInUp 0.2s ease'}}>
                    <div style={{padding:'16px 20px',borderBottom:'1px solid var(--border)',display:'flex',justifyContent:'space-between',alignItems:'center'}}>
                      <span style={{fontFamily:'var(--font-heading)',fontWeight:600,fontSize:15}}>Notifications</span>
                      {unreadCount > 0 && (
                        <button onClick={async () => { await markAllAsRead(user.id); refetchNotifs(); }} style={{fontSize:12,color:'var(--accent)',cursor:'pointer',background:'none',border:'none',fontWeight:500}}>Mark all read</button>
                      )}
                    </div>
                    {notifications.length === 0 ? (
                      <div style={{padding:32,textAlign:'center',color:'var(--text-muted)',fontSize:14}}>No notifications yet</div>
                    ) : (
                      notifications.slice(0, 10).map(n => (
                        <div key={n.id} onClick={async () => { await markAsRead(n.id); refetchNotifs(); }} style={{padding:'14px 20px',borderBottom:'1px solid var(--border-light)',cursor:'pointer',background: n.is_read ? 'transparent' : 'var(--accent-light)',transition:'background 0.15s'}}>
                          <div style={{fontSize:14,fontWeight:n.is_read ? 400 : 600,marginBottom:4}}>{n.title}</div>
                          <div style={{fontSize:12,color:'var(--text-secondary)',lineHeight:1.5}}>{n.message}</div>
                          <div style={{fontSize:11,color:'var(--text-muted)',marginTop:4}}>{new Date(n.created_at).toLocaleString('en-IN')}</div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            )}

            <Link href="/cart" className={s.cartBtn}>
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>
              {cartCount > 0 && <span className={s.cartBadge}>{cartCount}</span>}
            </Link>

            <div ref={profileRef} className="hide-mobile" style={{position:'relative'}}>
              <button className={s.profileBtn} onClick={(e) => { e.stopPropagation(); setProfileOpen(!profileOpen); }}>
                <div className={s.profileAvatar} style={{ overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  {mounted && user ? (
                    (() => {
                      const avatarUrl = profile?.avatar_url || user?.user_metadata?.avatar_url || user?.user_metadata?.picture;
                      if (avatarUrl) {
                        return <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />;
                      }
                      return <span style={{fontSize:14,fontWeight:600}}>{(profile?.full_name || user?.user_metadata?.full_name || user?.email || 'U')[0].toUpperCase()}</span>;
                    })()
                  ) : (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                  )}
                </div>
                <span className="hide-mobile">{mounted && user ? displayName : 'Account'}</span>
              </button>
              <div className={`${s.dropdown} ${profileOpen ? s.dropdownOpen : ''}`} onClick={() => setProfileOpen(false)}>
                {mounted && user ? (
                  <>
                    <div style={{padding:'12px 16px',borderBottom:'1px solid var(--border-light)'}}>
                      <div style={{fontWeight:600,fontSize:14}}>{displayName}</div>
                      <div style={{fontSize:12,color:'var(--text-muted)' }}>{user.email}</div>
                    </div>
                    <Link href="/profile" className={s.dropdownItem}><User size={16} style={{marginRight:8}} /> My Profile</Link>
                    <Link href="/profile?tab=bookings" className={s.dropdownItem}><ClipboardList size={16} style={{marginRight:8}} /> My Bookings</Link>
                    <Link href="/services" className={s.dropdownItem}><FolderOpen size={16} style={{marginRight:8}} /> All Services</Link>
                    {isAdmin && (
                      <>
                        <div className={s.dropdownDivider}></div>
                        <Link href="/admin" className={s.dropdownItem} style={{color:'var(--accent)',fontWeight:600}}><Shield size={16} style={{marginRight:8}} /> Admin Panel</Link>
                      </>
                    )}
                    <div className={s.dropdownDivider}></div>
                    <button onClick={handleSignOut} className={s.dropdownItem} style={{width:'100%',textAlign:'left',color:'var(--error)'}}><LogOut size={16} style={{marginRight:8}} /> Logout</button>
                  </>
                ) : (
                  <>
                    <Link href="/auth" className={s.dropdownItem}><Lock size={16} style={{marginRight:8}} /> Login / Sign Up</Link>
                    <Link href="/services" className={s.dropdownItem}><FolderOpen size={16} style={{marginRight:8}} /> All Services</Link>
                  </>
                )}
              </div>
            </div>

            <button className={s.mobileToggle} onClick={() => setMenuOpen(!menuOpen)}>
              <div className={`${s.hamburger} ${menuOpen ? s.hamOpen : ''}`}>
                <span></span><span></span><span></span>
              </div>
            </button>
          </div>
        </div>
      </nav>

      <div className={`${s.mobileNav} ${menuOpen ? s.mobileNavOpen : ''}`} onClick={() => setMenuOpen(false)}>
        <Link href="/" className={s.mobileNavItem}><Home size={18} style={{marginRight:12}} /> Home</Link>
        <Link href="/services" className={s.mobileNavItem}><FolderOpen size={18} style={{marginRight:12}} /> Services</Link>

        <Link href="/profile" className={s.mobileNavItem}><User size={18} style={{marginRight:12}} /> Profile</Link>
        <Link href="/cart" className={s.mobileNavItem}><ShoppingCart size={18} style={{marginRight:12}} /> Cart</Link>
        {mounted && isAdmin && <Link href="/admin" className={s.mobileNavItem}><Shield size={18} style={{marginRight:12}} /> Admin Panel</Link>}
        {mounted && user ? (
          <button onClick={handleSignOut} className={s.mobileNavItem} style={{width:'100%',textAlign:'left',background:'none',border:'none',cursor:'pointer',color:'var(--error)'}}><LogOut size={18} style={{marginRight:12}} /> Logout</button>
        ) : (
          <Link href="/auth" className={s.mobileNavItem}><Lock size={18} style={{marginRight:12}} /> Login / Sign Up</Link>
        )}
      </div>
    </>
  );
}
