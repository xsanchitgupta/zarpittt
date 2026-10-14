'use client';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import Image from 'next/image';
import { Target, Heart, Users, Shield, Zap, Globe } from 'lucide-react';

const values = [
  { icon: Heart, title: 'Dignity First', desc: 'We believe basic daily-life skills are not "small work" — they are the backbone of society. Every helper earns with pride.' },
  { icon: Shield, title: 'Trust & Safety', desc: 'Every professional is background verified with Aadhar and police clearance. Your safety is non-negotiable.' },
  { icon: Users, title: 'Empowerment', desc: 'Through Zarpit, lakhs of workers gain stable income, respect, and fair opportunities using skills they already have.' },
  { icon: Zap, title: 'Connecting Needs with Opportunities', desc: 'From cleaning to cooking, baby care to doctor visits — access 13+ essential services through a single platform.' },
  { icon: Globe, title: 'Technology Meets Care', desc: 'We combine modern tech with human compassion to deliver reliable, verified help for every household.' },
  { icon: Target, title: 'Fair Pricing', desc: 'Transparent pricing with no hidden fees. What you see is what you pay. Helpers receive fair compensation for their work.' },
];

const team = [
  { name: 'Shubh Agrawal', role: 'Founder & CEO', linkedin: 'https://www.linkedin.com/in/shubh-agrawal-385831396' },
];

export default function AboutPage() {
  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', minHeight: '100vh' }}>

        {/* Hero */}
        <section style={{ position: 'relative', overflow: 'hidden', padding: '80px 0 60px' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, rgba(255,117,31,0.08), transparent 60%)', pointerEvents: 'none' }} />
          <div className="container" style={{ position: 'relative', maxWidth: 900, textAlign: 'center' }}>
            <span className="section-label">About Zarpit</span>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 5vw, 3.2rem)', fontWeight: 800, letterSpacing: '-0.03em', marginBottom: 20, lineHeight: 1.15 }}>
              India&apos;s Most Trusted<br />
              <span style={{ color: 'var(--accent)' }}>Connecting Needs with Opportunities</span> Platform
            </h1>
            <p style={{ fontSize: '1.1rem', color: 'var(--text-secondary)', lineHeight: 1.8, maxWidth: 680, margin: '0 auto 40px' }}>
              ZARPIT connects households with verified, reliable help for everyday essential needs — while empowering skilled workers with stable income, dignity, and fair opportunities.
            </p>

          </div>
        </section>

        {/* Vision */}
        <section style={{ padding: '80px 0' }}>
          <div className="container" style={{ maxWidth: 900 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 48, alignItems: 'center' }}>
              <div>
                <span className="section-label">Our Vision</span>
                <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(1.5rem, 3vw, 2rem)', fontWeight: 700, marginBottom: 20, letterSpacing: '-0.02em' }}>
                  Bridging the Gap with Trust, Dignity & Opportunity
                </h2>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8, marginBottom: 16 }}>
                  India runs not just on technology, but on the hardworking hands of millions who clean our homes, cook our food, care for our children, support our elders, and help us in everyday life.
                </p>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  Yet the very people who make our lives easier often struggle for stable income, respect, and recognition. ZARPIT is born to bridge this gap — building the Amazon of essential services where every household can access verified, reliable help.
                </p>
              </div>
              <div style={{ padding: 40, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-2xl)', backdropFilter: 'blur(20px)' }}>
                <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.1rem', fontWeight: 600, marginBottom: 16, color: 'var(--accent)' }}>Our Mission</h3>
                <p style={{ fontSize: 15, color: 'var(--text-secondary)', lineHeight: 1.8 }}>
                  To make everyday essential services easily available to everyone while creating stable, respectful earning opportunities for skilled workers across India.
                </p>
                <div style={{ marginTop: 24, padding: '16px 20px', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', borderRadius: 'var(--radius-lg)' }}>
                  <p style={{ fontSize: 14, color: 'var(--accent)', fontWeight: 500, fontStyle: 'italic' }}>
                    &quot;At ZARPIT, technology meets care, convenience meets trust, and every service creates value for both people and hardworking hands.&quot;
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Values */}
        <section style={{ padding: '80px 0', background: 'var(--bg-elevated)' }}>
          <div className="container" style={{ maxWidth: 1000 }}>
            <div style={{ textAlign: 'center', marginBottom: 48 }}>
              <span className="section-label">What Drives Us</span>
              <h2 className="section-title">Our Core Values</h2>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 24 }}>
              {values.map((v, i) => {
                const Icon = v.icon;
                return (
                  <div key={i} style={{
                    padding: 28, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)',
                    borderRadius: 'var(--radius-xl)', backdropFilter: 'blur(20px)', transition: 'all 0.3s ease',
                  }}
                    onMouseEnter={e => { e.currentTarget.style.borderColor = 'var(--accent-border)'; e.currentTarget.style.transform = 'translateY(-4px)'; }}
                    onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--glass-border)'; e.currentTarget.style.transform = 'none'; }}
                  >
                    <div style={{ width: 48, height: 48, borderRadius: 'var(--radius-lg)', background: 'var(--accent-light)', border: '1px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--accent)', marginBottom: 16 }}>
                      <Icon size={22} />
                    </div>
                    <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1rem', fontWeight: 600, marginBottom: 8 }}>{v.title}</h3>
                    <p style={{ fontSize: 14, color: 'var(--text-secondary)', lineHeight: 1.7 }}>{v.desc}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>

        {/* Leadership */}
        <section style={{ padding: '80px 0' }}>
          <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
            <span className="section-label">Leadership</span>
            <h2 className="section-title">Meet the Founder</h2>
            <div style={{ marginTop: 40 }}>
              {team.map((t, i) => (
                <div key={i} style={{ padding: 32, background: 'var(--glass-bg)', border: '1px solid var(--glass-border)', borderRadius: 'var(--radius-2xl)', backdropFilter: 'blur(20px)' }}>
                  <div style={{ width: 80, height: 80, borderRadius: 'var(--radius-full)', background: 'var(--accent-light)', border: '2px solid var(--accent-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', color: 'var(--accent)', fontFamily: 'var(--font-heading)', fontSize: '2rem', fontWeight: 700 }}>
                    {t.name.charAt(0)}
                  </div>
                  <h3 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.2rem', fontWeight: 700, marginBottom: 4 }}>{t.name}</h3>
                  <p style={{ fontSize: 14, color: 'var(--accent)', marginBottom: 12 }}>{t.role}</p>
                  <a href={t.linkedin} target="_blank" rel="noopener" style={{ fontSize: 13, color: 'var(--text-secondary)', textDecoration: 'underline' }}>LinkedIn Profile</a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Contact CTA */}
        <section style={{ padding: '80px 0', background: 'var(--bg-elevated)' }}>
          <div className="container" style={{ maxWidth: 600, textAlign: 'center' }}>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.5rem', fontWeight: 700, marginBottom: 12 }}>Get in Touch</h2>
            <p style={{ fontSize: 15, color: 'var(--text-secondary)', marginBottom: 24 }}>
              Have questions, partnership ideas, or feedback? We would love to hear from you.
            </p>
            <a href="mailto:zarpittechservices@gmail.com" className="btn btn-primary btn-lg">Email Us</a>
          </div>
        </section>
      </div>
      <Footer showCredits={true} />
    </>
  );
}
