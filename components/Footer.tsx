import Link from 'next/link';
import Image from 'next/image';
import { MapPin } from 'lucide-react';
import FooterServiceAreas from './FooterServiceAreas';

export default function Footer({ showCredits }: { showCredits?: boolean } = {}) {
  return (
    <footer style={{ background: 'var(--bg-elevated)', borderTop: '1px solid var(--border)', paddingTop: 80 }}>
      <div className="container">
        <div className="footer-grid">
          <div className="footer-col" style={{ display: 'flex', flexDirection: 'column' }}>
            <Link href="/" className="footer-logo" style={{ display: 'flex', alignItems: 'center', gap: 10, fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 20 }}>
              <Image src="/images/logo.jpg" alt="Zarpit" width={38} height={38} style={{ borderRadius: 'var(--radius-md)' }} />
              Zarpit
            </Link>
            <p className="footer-desc" style={{ color: 'var(--text-tertiary)', fontSize: 14, lineHeight: 1.7, maxWidth: 280, marginBottom: 24 }}>
              Premium home services delivered by verified professionals in Greater Noida & Greater Noida West. From cleaning to care — we&apos;ve got you covered.<br /><br />
              <a href="mailto:zarpittechservices@gmail.com" style={{ color: 'var(--accent)', fontWeight: 600 }}>zarpittechservices@gmail.com</a>
            </p>
            <div className="footer-socials" style={{ display: 'flex', gap: 10 }}>
              <a href="https://www.instagram.com/zarpitnow" target="_blank" aria-label="Instagram" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.25s ease' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="2" y="2" width="20" height="20" rx="5" ry="5"></rect><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"></path><line x1="17.5" y1="6.5" x2="17.51" y2="6.5"></line></svg>
              </a>
              <a href="https://youtube.com/@zarpitnow" target="_blank" aria-label="YouTube" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.25s ease' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M22.54 6.42a2.78 2.78 0 0 0-1.94-2C18.88 4 12 4 12 4s-6.88 0-8.6.46a2.78 2.78 0 0 0-1.94 2A29 29 0 0 0 1 11.75a29 29 0 0 0 .46 5.33A2.78 2.78 0 0 0 3.4 19c1.72.46 8.6.46 8.6.46s6.88 0 8.6-.46a2.78 2.78 0 0 0 1.94-2 29 29 0 0 0 .46-5.25 29 29 0 0 0-.46-5.33z"></path><polygon points="9.75 15.02 15.5 11.75 9.75 8.48 9.75 15.02"></polygon></svg>
              </a>
              <a href="https://x.com/Zarpitnow" target="_blank" aria-label="X (formerly Twitter)" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.25s ease' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M4 4l11.733 16h4.267l-11.733 -16z"></path><path d="M4 20l6.768 -6.768m2.46 -2.46l6.772 -6.772"></path></svg>
              </a>
              <a href="https://www.linkedin.com/company/zarpit/" target="_blank" aria-label="LinkedIn" style={{ width: 40, height: 40, display: 'flex', alignItems: 'center', justifyContent: 'center', borderRadius: 'var(--radius-md)', background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', color: 'var(--text-secondary)', transition: 'all 0.25s ease' }}>
                <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"></path><rect x="2" y="9" width="4" height="12"></rect><circle cx="4" cy="4" r="2"></circle></svg>
              </a>
            </div>
          </div>
          <div className="footer-col">
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24 }}>Company</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <Link href="/about" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>About Us</Link>
              <Link href="/careers" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>Careers</Link>
              <Link href="/blog" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>Blog</Link>
              <Link href="/terms" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>Terms & Conditions</Link>
              <Link href="/privacy" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>Privacy Policy</Link>
            </div>
          </div>
          <div className="footer-col">
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24 }}>Companion</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ n: 'Outing Companion' }, { n: 'Shopping Companion' }, { n: 'Event Companion' }, { n: 'Medical Companion' }, { n: 'Movie Companion' }, { n: 'Senior Citizen Companion' }].map(l => <Link key={l.n} href="/services?cat=companion" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>{l.n}</Link>)}
            </div>
          </div>
          <div className="footer-col">
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24 }}>Helping Buddy</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              {[{ n: 'Personal Task Buddy' }, { n: 'Airport & Station Buddy' }, { n: 'Shifting & Moving Buddy' }, { n: 'Home Helper' }, { n: 'Queue & Waiting Buddy' }, { n: 'Custom Task Request' }].map(l => <Link key={l.n} href="/services?cat=helping-buddy" style={{ color: 'var(--text-tertiary)', fontSize: 14, transition: 'color 0.15s' }}>{l.n}</Link>)}
            </div>
          </div>
          <div className="footer-col">
            <h4 style={{ fontSize: 12, fontWeight: 600, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text)', marginBottom: 24 }}>Service Areas</h4>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <FooterServiceAreas />
            </div>
          </div>
        </div>
        <div className="footer-bottom-bar" style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '24px 0', borderTop: '1px solid var(--border)', fontSize: 12, color: 'var(--text-muted)', flexWrap: 'wrap', gap: 16, marginTop: 60 }}>
          <p>© 2026 Zarpit. All rights reserved. Serving Greater Noida & Delhi.</p>
          <div className="footer-bottom-links" style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
            {showCredits && (
              <span style={{ color: 'var(--text-muted)' }}>
                Developed by <a href="https://github.com/kartikbhartiya" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Kartik</a> and <a href="https://github.com/xsanchitgupta" target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'underline' }}>Sanchit</a>
              </span>
            )}
            <Link href="/terms" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}>Terms</Link>
            <Link href="/privacy" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}>Privacy</Link>
            <Link href="/about" style={{ color: 'var(--text-muted)', transition: 'color 0.15s' }}>About Us</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}
