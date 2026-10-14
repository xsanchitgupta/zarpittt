'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuth } from '@/lib/auth-context';
import { LayoutDashboard, Briefcase, Calendar, MessageSquare, CreditCard, Settings, ChevronLeft, ChevronRight, LogOut, CheckCircle2 } from 'lucide-react';

const menuItems = [
  { icon: LayoutDashboard, label: 'Dashboard', href: '/provider' },
  { icon: Briefcase, label: 'My Jobs', href: '/provider/jobs' },
  { icon: Calendar, label: 'Schedule', href: '/provider/schedule' },
  { icon: MessageSquare, label: 'Messages', href: '/provider/messages' },
  { icon: CreditCard, label: 'Earnings', href: '/provider/earnings' },
  { icon: Settings, label: 'Settings', href: '/provider/settings' },
];

export default function ProviderLayout({ children }: { children: React.ReactNode }) {
  const { user, profile, loading } = useAuth();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && (!user || profile?.role !== 'professional')) {
      window.location.href = '/';
    }
  }, [user, profile, loading]);

  if (loading) {
    return (
      <div style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center',background:'var(--bg)'}}>
        <div style={{textAlign:'center'}}>
          <div style={{animation:'float 2s ease-in-out infinite'}}><Briefcase size={48} className="text-accent" /></div>
          <p style={{color:'var(--text-secondary)',marginTop:16}}>Loading Provider Dashboard...</p>
        </div>
      </div>
    );
  }

  if (!user || profile?.role !== 'professional') return null;

  return (
    <div style={{display:'flex',minHeight:'100vh',background:'var(--bg)',color:'var(--text)'}}>
      {/* Sidebar */}
      <aside style={{
        width: collapsed ? 72 : 260,
        minHeight: '100vh',
        background: 'var(--bg-card-solid)',
        borderRight: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s ease',
        position: 'sticky',
        top: 0,
        zIndex: 50,
        flexShrink: 0,
      }}>
        {/* Header */}
        <div style={{
          padding: collapsed ? '20px 16px' : '20px 24px',
          borderBottom: '1px solid var(--border)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          gap: 12,
        }}>
          {!collapsed && (
            <Link href="/provider" style={{display:'flex',alignItems:'center',gap:10}}>
              <Briefcase size={24} className="text-accent" />
              <div style={{display:'flex',flexDirection:'column'}}>
                <span style={{fontFamily:'var(--font-heading)',fontSize:'1.1rem',fontWeight:700,lineHeight:1}}>Zarpit</span>
                <span style={{fontSize:10,color:'var(--text-muted)',textTransform:'uppercase',letterSpacing:'0.05em',fontWeight:600}}>Provider Panel</span>
              </div>
            </Link>
          )}
          <button
            onClick={() => setCollapsed(!collapsed)}
            style={{
              width: 32, height: 32, display: 'flex', alignItems: 'center', justifyContent: 'center',
              background: 'var(--glass-bg)', border: '1px solid var(--border)', borderRadius: 'var(--radius-md)',
              cursor: 'pointer', color: 'var(--text-secondary)', transition: 'all 0.2s',
            }}
          >
            {collapsed ? <ChevronRight size={16} /> : <ChevronLeft size={16} />}
          </button>
        </div>

        {/* Profile Card */}
        {!collapsed && (
          <div style={{padding:'20px 24px',borderBottom:'1px solid var(--border)'}}>
            <div style={{display:'flex',alignItems:'center',gap:12}}>
              <div style={{width:40,height:40,borderRadius:'var(--radius-full)',background:'var(--accent-light)',border:'1px solid var(--accent-border)',display:'flex',alignItems:'center',justifyContent:'center',fontWeight:700,color:'var(--accent)',flexShrink:0}}>
                {(profile?.full_name || 'P')[0].toUpperCase()}
              </div>
              <div style={{overflow:'hidden'}}>
                <div style={{fontSize:14,fontWeight:600,whiteSpace:'nowrap',textOverflow:'ellipsis'}}>{profile?.full_name || 'Provider User'}</div>
                <div style={{fontSize:12,color:'var(--text-secondary)',display:'flex',alignItems:'center',gap:4}}>
                  <CheckCircle2 size={12} className="text-success" /> Active Status
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Navigation */}
        <nav style={{flex:1,padding:'16px 12px',display:'flex',flexDirection:'column',gap:4}}>
          {menuItems.map(item => {
            const active = pathname === item.href || (item.href !== '/provider' && pathname.startsWith(item.href));
            const Icon = item.icon;
            return (
              <Link key={item.href} href={item.href} style={{
                display: 'flex', alignItems: 'center', gap: 12,
                padding: collapsed ? '12px' : '10px 16px',
                borderRadius: 'var(--radius-lg)',
                fontSize: 14, fontWeight: active ? 600 : 400,
                color: active ? 'var(--accent)' : 'var(--text-secondary)',
                background: active ? 'var(--accent-light)' : 'transparent',
                transition: 'all 0.2s ease',
                justifyContent: collapsed ? 'center' : 'flex-start',
                textDecoration: 'none',
              }}
              onMouseEnter={e => { if (!active) { e.currentTarget.style.background = 'var(--glass-bg-hover)'; e.currentTarget.style.color = 'var(--text)'; } }}
              onMouseLeave={e => { if (!active) { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--text-secondary)'; } }}
              >
                <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:24}}><Icon size={18} /></div>
                {!collapsed && <span>{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{padding:'16px 12px',borderTop:'1px solid var(--border)'}}>
          <Link href="/" style={{
            display:'flex',alignItems:'center',gap:12,
            padding: collapsed ? '10px' : '10px 16px',
            borderRadius:'var(--radius-lg)',fontSize:13,color:'var(--text-muted)',
            justifyContent: collapsed ? 'center' : 'flex-start',
            transition:'color 0.2s',textDecoration:'none',
          }}
          onMouseEnter={e => { e.currentTarget.style.color = 'var(--text)'; }}
          onMouseLeave={e => { e.currentTarget.style.color = 'var(--text-muted)'; }}
          >
            <div style={{display:'flex',alignItems:'center',justifyContent:'center',width:24}}><LogOut size={16} /></div>
            {!collapsed && <span>Back to Customer App</span>}
          </Link>
        </div>
      </aside>

      {/* Main Content */}
      <main style={{flex:1,overflow:'auto',position:'relative'}}>
        <div style={{padding:'32px 40px',maxWidth:1400}}>
          {children}
        </div>
      </main>
    </div>
  );
}
