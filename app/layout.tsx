import type { Metadata, Viewport } from 'next';
import './globals.css';
import { AuthProvider } from '@/lib/auth-context';
import AppShell from '@/components/AppShell';
import ScrollToTop from '@/components/ScrollToTop';
import AiAssistant from '@/components/AiAssistant';
import { headers } from 'next/headers';
import { checkIsAdminServer } from '@/lib/admin-check-server';
import MaintenanceView from '@/components/MaintenanceView';
import Script from 'next/script';

const SITE_URL = 'https://zarpit.com';
const SITE_NAME = 'Zarpit';
const SITE_TITLE = 'Zarpit | Companion & Helping Buddy Services in Greater Noida';
const SITE_DESCRIPTION = 'Book verified Companions for outings, events, movies & hospital visits, or a Helping Buddy for errands, shifting, queues & everyday tasks in Greater Noida & Greater Noida West. Transparent pricing, 100% satisfaction guaranteed.';

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: '(prefers-color-scheme: light)', color: '#ffffff' },
    { media: '(prefers-color-scheme: dark)', color: '#0a0a0a' },
  ],
};

export const metadata: Metadata = {
  // ===== Core =====
  title: {
    default: SITE_TITLE,
    template: '%s | Zarpit',
  },
  description: SITE_DESCRIPTION,
  applicationName: SITE_NAME,
  generator: 'Next.js',
  referrer: 'origin-when-cross-origin',

  // ===== Keywords =====
  keywords: [
    'companion service', 'helping buddy', 'Greater Noida', 'Greater Noida West',
    'outing companion', 'shopping companion', 'movie companion', 'medical companion',
    'senior citizen companion', 'temple companion', 'event companion',
    'personal task buddy', 'airport buddy', 'shifting help', 'home helper',
    'queue waiting service', 'errand service', 'verified professionals', 'Zarpit',
    'book companion online', 'Noida companion services',
  ],

  // ===== Authors & Creator =====
  authors: [{ name: 'Zarpit', url: SITE_URL }],
  creator: 'Zarpit Technologies',
  publisher: 'Zarpit Technologies',

  // ===== Icons =====
  icons: {
    icon: [
      { url: '/images/logo.jpg', sizes: '32x32', type: 'image/jpeg' },
      { url: '/images/logo.jpg', sizes: '192x192', type: 'image/jpeg' },
    ],
    apple: [
      { url: '/images/logo.jpg', sizes: '180x180', type: 'image/jpeg' },
    ],
    shortcut: '/images/logo.jpg',
  },

  // ===== Manifest (PWA) =====
  manifest: '/manifest.json',

  // ===== Open Graph (Facebook, LinkedIn, WhatsApp) =====
  openGraph: {
    type: 'website',
    locale: 'en_IN',
    url: SITE_URL,
    siteName: SITE_NAME,
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [
      {
        url: `${SITE_URL}/images/logo.jpg`,
        width: 1200,
        height: 630,
        alt: 'Zarpit — Premium Home Services',
        type: 'image/jpeg',
      },
    ],
  },

  // ===== Twitter / X =====
  twitter: {
    card: 'summary_large_image',
    title: SITE_TITLE,
    description: SITE_DESCRIPTION,
    images: [`${SITE_URL}/images/logo.jpg`],
    creator: '@zarpit',
    site: '@zarpit',
  },

  // ===== Robots =====
  robots: {
    index: true,
    follow: true,
    nocache: false,
    googleBot: {
      index: true,
      follow: true,
      noimageindex: false,
      'max-video-preview': -1,
      'max-image-preview': 'large',
      'max-snippet': -1,
    },
  },

  // ===== Verification (add your actual IDs when ready) =====
  // verification: {
  //   google: 'YOUR_GOOGLE_SITE_VERIFICATION',
  //   yandex: 'YOUR_YANDEX_VERIFICATION',
  // },

  // ===== Canonical & Alternates =====
  metadataBase: new URL(SITE_URL),
  alternates: {
    canonical: '/',
    languages: {
      'en-IN': '/',
    },
  },

  // ===== Category =====
  category: 'Home Services',
};

// ===== JSON-LD Structured Data =====
const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'LocalBusiness',
  name: 'Zarpit',
  description: SITE_DESCRIPTION,
  url: SITE_URL,
  logo: `${SITE_URL}/images/logo.jpg`,
  image: `${SITE_URL}/images/logo.jpg`,
  email: 'zarpittechservices@gmail.com',
  address: {
    '@type': 'PostalAddress',
    addressLocality: 'Greater Noida',
    addressRegion: 'Uttar Pradesh',
    addressCountry: 'IN',
    postalCode: '201310',
  },
  geo: {
    '@type': 'GeoCoordinates',
    latitude: 28.4744,
    longitude: 77.5040,
  },
  areaServed: [
    {
      '@type': 'City',
      name: 'Greater Noida',
    },
    {
      '@type': 'City',
      name: 'Greater Noida West',
    },
  ],
  serviceType: [
    'Outing Companion', 'Shopping Companion', 'Event Companion',
    'Medical Companion', 'Senior Citizen Companion', 'Movie Companion',
    'Waiting Companion', 'Temple Companion', 'Walking & Fitness Companion',
    'Personal Task Buddy', 'Airport & Station Buddy', 'Shifting & Moving Buddy',
    'Home Helper', 'Queue & Waiting Buddy', 'Event Assistance',
  ],
  priceRange: '₹149 - ₹5000',
  openingHours: 'Mo-Su 06:00-22:00',
  sameAs: [
    // Add your social media URLs here
    // 'https://www.instagram.com/zarpit',
    // 'https://www.facebook.com/zarpit',
  ],
};

const websiteJsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebSite',
  name: SITE_NAME,
  url: SITE_URL,
  potentialAction: {
    '@type': 'SearchAction',
    target: {
      '@type': 'EntryPoint',
      urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
    },
    'query-input': 'required name=search_term_string',
  },
};

async function checkMaintenanceMode() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) return false;

  try {
    const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${supabaseAnonKey}`,
      },
      next: { revalidate: 5 } // 5-second in-memory server cache is extremely efficient
    });

    if (!res.ok) throw new Error('Failed to fetch settings');
    const data = await res.json();
    return data.find((s: any) => s.key === 'maintenance_mode')?.value === 'true';
  } catch (err) {
    console.error('[RootLayout] Maintenance check error:', err);
    return false;
  }
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const headerList = await headers();
  const pathname = headerList.get('x-pathname') || '';

  // 1. Determine bypass states
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isMaintenancePage = pathname === '/maintenance';
  const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/api/auth');
  const isBypassed = isAdminPath || isMaintenancePage || isAuthPath;

  let showMaintenance = false;

  if (!isBypassed) {
    const isMaintenance = await checkMaintenanceMode();
    if (isMaintenance) {
      const isAdmin = await checkIsAdminServer();
      if (!isAdmin) {
        showMaintenance = true;
      }
    }
  }

  return (
    <html lang="en" dir="ltr" suppressHydrationWarning>
      <head>
        {/* Theme Script — must run before paint to avoid FOUC */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {

                  var theme = localStorage.getItem('theme');
                  if (theme === 'dark') {
                    document.documentElement.setAttribute('data-theme', 'dark');
                  } else {
                    document.documentElement.setAttribute('data-theme', 'light');
                  }
                } catch (e) {}
              })();
            `
          }}
        />

        {/* JSON-LD Structured Data */}
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
        />

        {/* Preconnect to external origins for faster loading */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />

        {/* Google Analytics */}
        <Script src="https://www.googletagmanager.com/gtag/js?id=G-2DPW8C6T2H" strategy="afterInteractive" />
        <Script id="google-analytics" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());

            gtag('config', 'G-2DPW8C6T2H');
          `}
        </Script>

        {/* PWA Service Worker Registration */}
        <Script id="pwa-sw-register" strategy="afterInteractive">
          {`
            if ('serviceWorker' in navigator) {
              window.addEventListener('load', function() {
                navigator.serviceWorker.register('/sw.js').then(function(registration) {
                  console.log('ServiceWorker registration successful with scope: ', registration.scope);
                }, function(err) {
                  console.log('ServiceWorker registration failed: ', err);
                });
              });
            }
          `}
        </Script>
      </head>
      <body>
        <style>{`
          body, html {
            overflow-x: hidden;
            width: 100%;
            position: relative;
          }
        `}</style>
        {showMaintenance ? (
          <MaintenanceView />
        ) : (
          <AuthProvider>
            <AppShell>
              {children}
              <ScrollToTop />
              <AiAssistant />
            </AppShell>
          </AuthProvider>
        )}
      </body>
    </html>
  );
}
