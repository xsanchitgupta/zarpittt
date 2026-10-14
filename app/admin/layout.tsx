'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import AdminSidebar from '@/components/AdminSidebar';
import { Menu } from 'lucide-react';
import './admin.css';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, isAdmin, loading } = useAuth();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    if (!loading && (!user || !isAdmin)) {
      window.location.href = '/';
    }
  }, [user, isAdmin, loading]);

  if (loading) {
    return (
      <div className="admin-theme" style={{minHeight:'100vh',display:'flex',alignItems:'center',justifyContent:'center'}}>
        <div style={{textAlign:'center'}}>
          <div style={{fontSize:48,marginBottom:16,animation:'float 2s ease-in-out infinite'}}>⚡</div>
          <p style={{color:'var(--admin-text-secondary)'}}>Initializing secure environment...</p>
        </div>
      </div>
    );
  }

  if (!user || !isAdmin) return null;

  return (
    <div className="admin-theme" style={{display:'flex',minHeight:'100vh', flexDirection: 'column', position: 'relative', overflow: 'hidden'}}>
      {/* Background ambient glows for a premium feel */}
      <div className="admin-ambient-glow" style={{ top: '-10%', left: '-5%' }} />
      <div className="admin-ambient-glow" style={{ bottom: '-10%', right: '-5%', animationDelay: '2s' }} />

      {/* Mobile Header */}
      <header className="admin-mobile-header" style={{
        display: 'none', padding: '0 20px', borderBottom: '1px solid var(--admin-divider)',
        alignItems: 'center', justifyContent: 'space-between',
        background: 'var(--admin-glass-bg)', position: 'sticky', top: 0, zIndex: 100,
        backdropFilter: 'blur(20px) saturate(180%)', height: 64, width: '100%'
      }}>
        <div style={{display:'flex', alignItems:'center', gap:10}}>
          <div style={{borderRadius: 8, overflow: 'hidden', width: 32, height: 32}}>
            <img src="/images/logo.jpg" alt="Logo" style={{width:'100%', height:'100%', objectFit:'cover'}} />
          </div>
          <div style={{fontFamily:'inherit',fontSize:'1.05rem',fontWeight:700, color:'var(--admin-text-primary)', letterSpacing: '-0.02em'}}>
            Zarpit Admin
          </div>
        </div>
        <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{
          background:'var(--admin-glass-active)', border:'none', color:'var(--admin-text-primary)', 
          cursor:'pointer', width: 40, height: 40, borderRadius: 12, display: 'flex', alignItems: 'center', justifyContent: 'center'
        }}>
          <Menu size={22} />
        </button>
      </header>

      <div style={{display:'flex', flex:1, position: 'relative', overflow: 'hidden'}}>
        <AdminSidebar mobileOpen={mobileMenuOpen} setMobileOpen={setMobileMenuOpen} />
        <main style={{flex:1, overflowY:'auto', position:'relative', width: '100%', background: 'transparent'}}>
          <div className="admin-content-container" style={{maxWidth:1400, margin:'0 auto', padding: '40px 48px'}}>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
