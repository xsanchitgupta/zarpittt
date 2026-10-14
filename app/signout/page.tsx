'use client';
import { useEffect } from 'react';
import { useAuth } from '@/lib/auth-context';
import { useRouter } from 'next/navigation';

export default function SignOutPage() {
  const { signOut } = useAuth();
  const router = useRouter();

  useEffect(() => {
    const performSignOut = async () => {
      try {
        await signOut();
        // Clear any other local data
        localStorage.removeItem('zarpit_cart');
        sessionStorage.clear();
        
        // Redirect to home
        window.location.href = '/';
      } catch (err) {
        console.error('Sign out error:', err);
        window.location.href = '/';
      }
    };
    performSignOut();
  }, [signOut]);

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)', color: 'var(--text)' }}>
      <div style={{ textAlign: 'center' }}>
        <div className="spinner" style={{ margin: '0 auto 24px' }} />
        <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Signing you out...</h2>
        <p style={{ color: 'var(--text-secondary)', marginTop: 8 }}>Please wait a moment.</p>
      </div>
    </div>
  );
}
