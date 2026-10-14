'use client';
import { useEffect, useState } from 'react';
import { useAuth } from '@/lib/auth-context';
import { AlertTriangle, LogOut } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function BannedPage() {
  const { profile, signOut, loading, user } = useAuth();
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect away if they shouldn't be here
  useEffect(() => {
    if (mounted && !loading && (!user || (profile && profile.is_active))) {
      router.push('/');
    }
  }, [mounted, loading, user, profile, router]);

  if (!mounted || loading) {
    return <div style={{height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center'}}>Loading...</div>;
  }

  if (!user || (profile && profile.is_active)) {
    return null;
  }

  const handleSignOut = async () => {
    await signOut();
    router.push('/');
  };

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: 20,
      background: 'var(--bg)',
    }}>
      <div style={{
        maxWidth: 480,
        width: '100%',
        background: 'var(--bg-card-solid)',
        border: '1px solid var(--error)',
        borderRadius: 'var(--radius-xl)',
        padding: 40,
        textAlign: 'center',
        boxShadow: '0 20px 40px rgba(239, 68, 68, 0.1)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Warning Background Glow */}
        <div style={{
          position: 'absolute', top: -50, left: '50%', transform: 'translateX(-50%)',
          width: 200, height: 100, background: 'var(--error)', filter: 'blur(80px)', opacity: 0.2, borderRadius: '50%'
        }} />

        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: 'rgba(239, 68, 68, 0.1)', color: 'var(--error)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px', border: '1px solid rgba(239, 68, 68, 0.2)'
        }}>
          <AlertTriangle size={40} />
        </div>

        <h1 style={{fontSize: 28, fontWeight: 800, color: 'var(--error)', marginBottom: 12}}>Account Suspended</h1>
        <p style={{fontSize: 16, color: 'var(--text-secondary)', marginBottom: 32, lineHeight: 1.6}}>
          Your access to Zarpit has been suspended. Please review the reason below or contact support if you believe this is a mistake.
        </p>

        <div style={{
          background: 'rgba(239, 68, 68, 0.05)', border: '1px solid rgba(239, 68, 68, 0.2)', borderRadius: 12, padding: 20, marginBottom: 32, textAlign: 'left'
        }}>
          <span style={{fontSize: 12, fontWeight: 700, textTransform: 'uppercase', color: 'var(--error)', letterSpacing: '0.05em'}}>Reason for Suspension</span>
          <p style={{fontSize: 15, fontWeight: 600, color: 'var(--text)', marginTop: 8, lineHeight: 1.5}}>
            {(profile as any)?.ban_reason || 'Violation of terms of service or ongoing investigation.'}
          </p>
        </div>

        <button onClick={handleSignOut} className="btn" style={{
          width: '100%', padding: '16px', background: 'var(--error)', color: '#fff', border: 'none', borderRadius: 12, fontSize: 16, fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 10
        }}>
          <LogOut size={18} /> Sign Out
        </button>
      </div>
    </div>
  );
}
