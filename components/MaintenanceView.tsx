import Link from 'next/link';
import { Settings, Clock, RefreshCw } from 'lucide-react';
import { checkIsAdminServer } from '@/lib/admin-check-server';

async function getMaintenanceSettings() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    return {
      reason: 'We are currently updating our systems to serve you better.',
      eta: ''
    };
  }

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      next: { revalidate: 0 } // Force fresh fetch on render
    });

    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    const reason = data.find((s: any) => s.key === 'maintenance_reason')?.value || 'We are currently updating our systems to serve you better.';
    const eta = data.find((s: any) => s.key === 'maintenance_eta')?.value || '';

    return { reason, eta };
  } catch (err) {
    console.error('[MaintenanceView] Fetch settings error:', err);
    return {
      reason: 'We are currently updating our systems to serve you better.',
      eta: ''
    };
  }
}

export default async function MaintenanceView() {
  const { reason, eta } = await getMaintenanceSettings();
  const isAdmin = await checkIsAdminServer();

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg)',
      fontFamily: 'var(--font-sans, system-ui, -apple-system, sans-serif)',
    }}>
      <style dangerouslySetInnerHTML={{ __html: `
        @keyframes spin-slow {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .spin-slow-animation {
          animation: spin-slow 8s linear infinite;
        }
        .maintenance-btn:hover {
          transform: translateY(-2px);
          opacity: 0.95;
        }
        .maintenance-btn:active {
          transform: translateY(0);
        }
      `}} />

      <div style={{
        maxWidth: 520,
        width: '100%',
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--border)',
        borderRadius: 'var(--radius-xl)',
        padding: 48,
        textAlign: 'center',
        boxShadow: 'var(--shadow-xl)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow */}
        <div style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
          width: 250, height: 120, background: 'var(--accent)', filter: 'blur(100px)', opacity: 0.15, borderRadius: '50%'
        }} />

        <div style={{
          width: 88, height: 88, borderRadius: '50%', background: 'var(--accent-light)', color: 'var(--accent)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid var(--accent-border)'
        }}>
          <Settings size={44} className="spin-slow-animation" />
        </div>

        <h1 style={{fontSize: 32, fontWeight: 800, color: 'var(--text)', marginBottom: 16, letterSpacing: '-0.02em'}}>Site Under Maintenance</h1>
        
        <div style={{
          background: 'var(--glass-bg)', border: '1px solid var(--border-light)', borderRadius: 12, padding: 24, marginBottom: 32, textAlign: 'center'
        }}>
          <p style={{fontSize: 16, fontWeight: 500, color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: eta ? 20 : 0}}>
            {reason}
          </p>
          
          {eta && (
            <div style={{display: 'inline-flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: 'var(--accent-light)', borderRadius: 20, color: 'var(--accent)', fontWeight: 600, fontSize: 14}}>
              <Clock size={16} /> Estimated Live Time: {eta}
            </div>
          )}
        </div>

        <p style={{fontSize: 14, color: 'var(--text-muted)', marginBottom: 28}}>
          Thank you for your patience. Please check back later.
        </p>

        <div style={{display: 'flex', flexDirection: 'column', gap: 12, alignItems: 'center', justifyContent: 'center'}}>
          <a href="/" className="maintenance-btn" style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: 8,
            padding: '12px 32px',
            background: 'var(--accent)',
            color: '#fff',
            borderRadius: 'var(--radius-lg)',
            fontWeight: 600,
            textDecoration: 'none',
            fontSize: 15,
            boxShadow: '0 4px 12px rgba(255, 107, 0, 0.2)',
            transition: 'transform 0.2s, opacity 0.2s',
            border: 'none',
            cursor: 'pointer'
          }}>
            <RefreshCw size={16} /> Check Site Status
          </a>

          {isAdmin && (
            <Link href="/admin" className="maintenance-btn" style={{
              marginTop: 12,
              display: 'inline-flex',
              alignItems: 'center',
              padding: '10px 24px',
              background: 'transparent',
              border: '1px solid var(--border)',
              color: 'var(--text)',
              borderRadius: 'var(--radius-lg)',
              fontWeight: 500,
              textDecoration: 'none',
              fontSize: 14,
              transition: 'transform 0.2s, opacity 0.2s',
              cursor: 'pointer'
            }}>
              Admin Access
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
