'use client';

import { useEffect } from 'react';
import Link from 'next/link';
import { AlertTriangle, RefreshCcw, Home } from 'lucide-react';

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log the error to an error reporting service
    console.error('Unhandled application error:', error);
  }, [error]);

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '20px',
      background: 'var(--bg)',
      color: 'var(--text)'
    }}>
      <div style={{
        maxWidth: '480px',
        width: '100%',
        background: 'var(--bg-elevated)',
        borderRadius: '24px',
        padding: '40px 32px',
        textAlign: 'center',
        border: '1px solid var(--border)',
        boxShadow: '0 20px 40px rgba(0,0,0,0.1)'
      }}>
        <div style={{
          width: '72px',
          height: '72px',
          borderRadius: '20px',
          background: 'rgba(239, 68, 68, 0.1)',
          color: '#ef4444',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 24px'
        }}>
          <AlertTriangle size={36} />
        </div>
        
        <h1 style={{ fontSize: '1.5rem', fontWeight: 800, marginBottom: '12px' }}>
          Oops! Something went wrong
        </h1>
        
        <p style={{ color: 'var(--text-secondary)', fontSize: '15px', lineHeight: 1.6, marginBottom: '32px' }}>
          We encountered an unexpected error while loading this page. Our team has been notified.
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          <button 
            onClick={() => reset()} 
            className="btn btn-primary"
            style={{ width: '100%', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}
          >
            <RefreshCcw size={18} /> Try Again
          </button>
          
          <Link 
            href="/" 
            className="btn btn-secondary"
            style={{ width: '100%', height: '52px', borderRadius: '16px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', fontSize: '15px', fontWeight: 700 }}
            onClick={() => {
              // Force a hard reload to clear any bad state when going home
              setTimeout(() => window.location.href = '/', 100);
            }}
          >
            <Home size={18} /> Return Home
          </Link>
        </div>
        
        {process.env.NODE_ENV === 'development' && (
          <div style={{ marginTop: '32px', padding: '16px', background: 'var(--bg)', borderRadius: '12px', textAlign: 'left', overflowX: 'auto' }}>
            <p style={{ fontSize: '12px', color: 'var(--error)', fontFamily: 'monospace', fontWeight: 600 }}>
              {error.message}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
