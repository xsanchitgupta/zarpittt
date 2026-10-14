'use client';
import { useState, useEffect } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import CmsText from '@/components/CmsText';
import { CONTENT_KEYS } from '@/lib/content';
import { fetchContentRaw } from '@/lib/content-client';

export default function PrivacyPage() {
  // Admin-edited text (Admin → Website Content) overrides the built-in copy below
  const [cmsText, setCmsText] = useState<string | null>(null);

  useEffect(() => {
    fetchContentRaw(CONTENT_KEYS.privacy).then(v => { if (v && v.trim()) setCmsText(v); }).catch(() => { /* keep static */ });
  }, []);

  return (
    <>
      <Navbar />
      <div style={{ paddingTop: 'calc(var(--navbar-h) + 32px)', minHeight: '100vh', background: 'var(--bg)' }}>

        {/* Header */}
        <section style={{ padding: '60px 0 40px', borderBottom: '1px solid var(--border)' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            <h1 style={{ fontFamily: 'var(--font-heading)', fontSize: 'clamp(2rem, 4vw, 2.5rem)', fontWeight: 800, letterSpacing: '-0.02em', marginBottom: 16 }}>
              Privacy Policy
            </h1>
            <p style={{ fontSize: '1.05rem', color: 'var(--text-secondary)' }}>
              Last updated: April 2026
            </p>
          </div>
        </section>

        {/* Content */}
        <section style={{ padding: '40px 0 80px' }}>
          <div className="container" style={{ maxWidth: 800 }}>
            {cmsText ? <CmsText text={cmsText} /> : (
            <div style={{
              fontSize: 15,
              color: 'var(--text-secondary)',
              lineHeight: 1.8,
              display: 'flex',
              flexDirection: 'column',
              gap: 24
            }}>

              <p>This Privacy Policy explains how ZARPIT and its affiliates ("we," "us," or "our") collect, use, and share your personal information when you use our website [www.zarpit.com] and the ZARPIT mobile app (collectively, the "Platform"), and the services provided through them.</p>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>1. INFORMATION WE COLLECT</h2>
              <div>
                <p>We collect information you provide directly to us, such as when you create or modify your account, request services, contact customer support, or otherwise communicate with us. This information may include: name, email address, phone number, postal address, profile picture, payment information, and other information you choose to provide.</p>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>2. HOW WE USE YOUR INFORMATION</h2>
              <div>
                <p>We use the information we collect to provide, maintain, and improve our services, including to:</p>
                <ul style={{ paddingLeft: 24, margin: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 8, listStyleType: 'circle' }}>
                  <li>Facilitate the arrangement and scheduling of home-based services with independent third-party service providers ("Helpers").</li>
                  <li>Process or facilitate payments for those services.</li>
                  <li>Send you receipts, invoices, and updates about your account and the services.</li>
                  <li>Personalize and improve the Platform and our services, including providing or recommending features, content, social connections, referrals, and advertisements.</li>
                  <li>Perform internal operations, such as preventing fraud, troubleshooting software bugs, and conducting data analysis, testing, and research.</li>
                </ul>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>3. SHARING OF INFORMATION</h2>
              <div>
                <p>We may share the information we collect about you as described in this Privacy Policy or as described at the time of collection or sharing, including as follows:</p>
                <ul style={{ paddingLeft: 24, margin: '12px 0 20px', display: 'flex', flexDirection: 'column', gap: 8, listStyleType: 'circle' }}>
                  <li>With Helpers to enable them to provide the services you request.</li>
                  <li>With third parties to provide you a service you requested through a partnership or promotional offering made by a third party or us.</li>
                  <li>With the general public if you submit content in a public forum, such as blog comments, social media posts, or other features of our services that are viewable by the general public.</li>
                  <li>With our subsidiaries and affiliated entities that provide services or conduct data processing on our behalf.</li>
                  <li>In response to a request for information by a competent authority if we believe disclosure is in accordance with, or is otherwise required by, any applicable law, regulation, or legal process.</li>
                </ul>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>4. DATA SECURITY</h2>
              <div>
                <p>We take reasonable measures to help protect your personal information from loss, theft, misuse, and unauthorized access, disclosure, alteration, and destruction. However, no data transmission over the internet or any wireless network can be guaranteed to be perfectly secure.</p>
              </div>

              <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '1.4rem', fontWeight: 700, color: 'var(--text)', marginTop: 16 }}>5. YOUR CHOICES</h2>
              <div>
                <p>You may correct your account information at any time by logging into your online or in-app account. If you wish to cancel your account, please contact us. Please note that in some cases we may retain certain information about you as required by law, or for legitimate business purposes to the extent permitted by law.</p>
              </div>

              <div style={{ marginTop: 40, paddingTop: 40, borderTop: '1px solid var(--border)', textAlign: 'center' }}>
                <p style={{ fontWeight: 600, color: 'var(--text)', marginBottom: 8 }}>Questions regarding this Privacy Policy?</p>
                <a href="mailto:zarpittechservices@gmail.com" style={{ color: 'var(--accent)', textDecoration: 'underline' }}>Contact our legal team at zarpittechservices@gmail.com</a>
              </div>

            </div>
            )}
          </div>
        </section>

      </div>
      <Footer />
    </>
  );
}
