'use client';
import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import Image from 'next/image';
import { 
  LayoutDashboard, Users, Briefcase, FileText, Settings, 
  X, Shield, FolderOpen, Tags, Search, UserPlus, ClipboardList, Ticket, Star, ChevronLeft, ChevronRight, Globe 
} from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/admin' },
  { icon: Shield, label: 'KYC Approvals', href: '/admin/kyc' },
  { icon: ClipboardList, label: 'Bookings', href: '/admin/bookings' },
  { icon: FolderOpen, label: 'Services', href: '/admin/services' },
  { icon: Tags, label: 'Categories', href: '/admin/categories' },
  { icon: Search, label: 'Careers', href: '/admin/careers' },
  { icon: FileText, label: 'Blogs', href: '/admin/blogs' },
  { icon: Users, label: 'Users', href: '/admin/users' },
  { icon: Briefcase, label: 'Professionals', href: '/admin/professionals' },
  { icon: UserPlus, label: 'Workers', href: '/admin/workers' },
  { icon: Star, label: 'Reviews', href: '/admin/reviews' },
  { icon: Ticket, label: 'Offers', href: '/admin/offers' },
  { icon: Globe, label: 'Website Content', href: '/admin/content' },
  { icon: Settings, label: 'Settings', href: '/admin/settings' },
];

interface AdminSidebarProps {
  mobileOpen?: boolean;
  setMobileOpen?: (open: boolean) => void;
}

export default function AdminSidebar({ mobileOpen, setMobileOpen }: AdminSidebarProps) {
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  return (
    <>
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div 
          onClick={() => setMobileOpen?.(false)}
          style={{position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.5)', zIndex: 140}} 
        />
      )}

      {/* Sidebar Wrapper */}
      <div className={`admin-sidebar-wrapper ${mobileOpen ? 'mobile-open' : ''}`} style={{ 
        zIndex: 150, flexShrink: 0, position: 'sticky', top: 0, height: '100vh', display: 'flex' 
      }}>
        <aside className="admin-glass-panel" style={{
          width: collapsed ? 80 : 260,
          height: '100%',
          display: 'flex',
          flexDirection: 'column',
          transition: 'width 0.3s cubic-bezier(0.2, 0.8, 0.2, 1)',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: mobileOpen ? 'var(--admin-shadow-lg)' : 'none'
        }}>
          {/* Header */}
          <div style={{
            padding: collapsed ? '24px 16px' : '24px',
            borderBottom: '1px solid var(--admin-divider)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: collapsed ? 'center' : 'space-between',
          }}>
            {!collapsed && (
              <Link href="/admin" style={{display:'flex',alignItems:'center',gap:12, textDecoration:'none'}}>
                <div style={{
                  borderRadius: 12, overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: 'var(--admin-shadow-sm)'
                }}>
                  <Image src="/images/logo.jpg" alt="Zarpit Logo" width={36} height={36} style={{objectFit: 'cover'}} />
                </div>
                <div style={{fontFamily:'-apple-system, BlinkMacSystemFont, sans-serif',fontSize:'1.1rem',fontWeight:600,letterSpacing:'-0.01em', color:'var(--admin-text-primary)'}}>
                  Zarpit Admin
                </div>
              </Link>
            )}
            <div style={{display:'flex',gap:8}}>
              <button
                className="hide-on-mobile"
                onClick={() => setCollapsed(!collapsed)}
                style={{
                  width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  background: 'transparent', border: 'none', borderRadius: 8,
                  cursor: 'pointer', color: 'var(--admin-text-tertiary)', transition: 'all 0.2s',
                  zIndex: 10,
                }}
                onMouseEnter={e => { e.currentTarget.style.color = 'var(--admin-text-primary)'; e.currentTarget.style.background = 'var(--admin-glass-active)'; }}
                onMouseLeave={e => { e.currentTarget.style.color = 'var(--admin-text-tertiary)'; e.currentTarget.style.background = 'transparent'; }}
              >
                {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
              </button>
              
              {/* Mobile Close Button */}
              {mobileOpen && (
                <button
                  onClick={() => setMobileOpen?.(false)}
                  style={{
                    width: 30, height: 30, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'transparent', border: 'none', borderRadius: 8,
                    cursor: 'pointer', color: 'var(--admin-text-primary)', transition: 'all 0.2s', zIndex: 10
                  }}
                >
                  <X size={20} />
                </button>
              )}
            </div>
          </div>

          {/* Navigation */}
          <nav style={{flex:1,padding:'24px 16px',display:'flex',flexDirection:'column',gap:4, overflowY: 'auto'}}>
            {menuItems.map(item => {
              const active = pathname === item.href || (item.href !== '/admin' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <Link key={item.href} href={item.href} style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: collapsed ? '12px' : '10px 14px',
                  borderRadius: 12,
                  fontSize: 14, fontWeight: 500,
                  color: active ? 'var(--admin-text-primary)' : 'var(--admin-text-secondary)',
                  background: active ? 'var(--admin-glass-active)' : 'transparent',
                  transition: 'all 0.2s ease',
                  justifyContent: collapsed ? 'center' : 'flex-start',
                  textDecoration: 'none',
                }}
                onClick={() => setMobileOpen?.(false)}
                onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--admin-glass-hover)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; } }}
                onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; } }}
                >
                  <div style={{display:'flex',alignItems:'center',justifyContent:'center', color: active ? 'var(--admin-text-primary)' : 'inherit'}}>
                    <Icon size={18} strokeWidth={active ? 2.5 : 2} />
                  </div>
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Footer */}
          <div style={{padding:'16px', borderTop:'1px solid var(--admin-divider)'}}>
            <Link href="/" style={{
              display:'flex',alignItems:'center',gap:12,
              padding: collapsed ? '12px' : '10px 14px',
              borderRadius:12,fontSize:14, fontWeight: 500, color:'var(--admin-text-secondary)',
              justifyContent: collapsed ? 'center' : 'flex-start',
              transition:'all 0.2s ease',textDecoration:'none',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--admin-glass-hover)'; e.currentTarget.style.color = 'var(--admin-text-primary)'; }}
            onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--admin-text-secondary)'; }}
            >
              <div style={{display:'flex',alignItems:'center',justifyContent:'center'}}><Globe size={18} /></div>
              {!collapsed && <span>Exit to Site</span>}
            </Link>
          </div>
        </aside>
      </div>
    </>
  );
}
