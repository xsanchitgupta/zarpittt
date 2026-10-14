import Link from 'next/link';

export default function NotFound() {
  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: 'var(--bg)',
      color: 'var(--text)',
      fontFamily: 'var(--font-body)',
    }}>
      <div style={{ textAlign: 'center', maxWidth: 440, padding: '0 24px' }}>
        <div style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '8rem',
          fontWeight: 900,
          lineHeight: 1,
          background: 'linear-gradient(135deg, var(--accent) 0%, #E8D48B 100%)',
          WebkitBackgroundClip: 'text',
          WebkitTextFillColor: 'transparent',
          marginBottom: 16,
          letterSpacing: '-0.05em',
        }}>404</div>
        <h1 style={{
          fontFamily: 'var(--font-heading)',
          fontSize: '1.5rem',
          fontWeight: 700,
          marginBottom: 12,
        }}>Page Not Found</h1>
        <p style={{
          color: 'var(--text-secondary)',
          fontSize: 15,
          lineHeight: 1.7,
          marginBottom: 32,
        }}>
          The page you&apos;re looking for doesn&apos;t exist or has been moved.
        </p>
        <div style={{ display: 'flex', gap: 14, justifyContent: 'center' }}>
          <Link href="/" className="btn btn-primary">Go Home</Link>
          <Link href="/services" className="btn btn-secondary">Browse Services</Link>
        </div>
      </div>
    </div>
  );
}
