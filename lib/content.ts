/* =============================================
   Site Content (CMS) — types, defaults, helpers
   Content lives in system_settings as JSON strings
   under the keys below. Anything the admin hasn't
   saved yet falls back to these defaults, so the
   site always renders.
   ============================================= */

export const CONTENT_KEYS = {
  home: 'content_home',
  terms: 'content_terms',
  privacy: 'content_privacy',
  bookingFilters: 'content_booking_filters',
} as const;

/* ---------- Home page ---------- */
export interface HomeTile {
  name: string;
  icon: string;
  /** Optional photo for the tile — shown instead of the emoji icon when set */
  image?: string;
  desc: string;
  tags: string[];
  slug: string;
  comingSoon: boolean;
}

export interface HomeContent {
  heroLine1: string;
  heroLine2: string;
  quickTitle: string;
  tiles: HomeTile[];
  collageImages: string[]; // 4 photos in the hero collage
  whyUs: { label: string; title: string; subtitle: string };
  vision: { title: string; text: string; bullets: { title: string; text: string }[] };
  mission: { title: string; text: string; bullets: { title: string; text: string }[] };
  reliable: { title: string; subtitle: string; cards: { image: string; title: string; desc: string }[] };
  faqs: { q: string; a: string }[];
}

export const DEFAULT_HOME: HomeContent = {
  heroLine1: 'Connecting needs',
  heroLine2: 'with opportunities',
  quickTitle: 'What are you looking for?',
  tiles: [
    {
      name: 'Companion', icon: '🤝',
      desc: 'A verified, friendly companion by your side',
      tags: ['Outings', 'Movies', 'Hospital', 'Events', 'Temple'],
      slug: 'companion', comingSoon: false,
    },
    {
      name: 'Helping Buddy', icon: '🙌',
      desc: 'An extra pair of hands, whenever you need',
      tags: ['Errands', 'Shifting', 'Queues', 'Airport', 'Home help'],
      slug: 'helping-buddy', comingSoon: false,
    },
    {
      name: 'Pandit Ji', icon: '🛕', image: '/images/pandit.png',
      desc: 'Verified pandits for pujas & rituals at home',
      tags: ['Puja', 'Havan', 'Rituals'],
      slug: 'pandit', comingSoon: true,
    },
    {
      name: 'Mechanic Anywhere', icon: '🔧', image: '/images/mechanic.png',
      desc: 'On-the-spot bike & vehicle help, wherever you are',
      tags: ['Bike', 'Breakdown', 'On-site'],
      slug: 'mechanic', comingSoon: true,
    },
  ],
  collageImages: [
    '/images/Baby care.png',
    '/images/Safety Person.png',
    '/images/cooking.png',
    '/images/IMG_20260416_114410.png',
  ],
  whyUs: {
    label: 'Why Us',
    title: 'Bridging the gap with trust and pride',
    subtitle: 'We are not just a service company — we are a livelihood platform with dignity at its core.',
  },
  vision: {
    title: 'Our Vision',
    text: "To build India's most trusted service platform where every household can access verified, reliable help at a single call.",
    bullets: [
      { title: 'Empowering Skills', text: 'Bringing pride and stability to lakhs of hardworking professionals.' },
      { title: 'Dignity at Core', text: 'Ensuring respect and recognition for those who make our lives easier.' },
    ],
  },
  mission: {
    title: 'Our Mission',
    text: 'To make essential home services easily available to everyone while creating respectful earning opportunities across India.',
    bullets: [
      { title: 'Trust & Standards', text: 'Every professional is strictly vetted and trained for your safety.' },
      { title: 'Quality Guaranteed', text: 'Combining technology with care for consistent, high-standard service.' },
    ],
  },
  reliable: {
    title: 'Reliable & Trustworthy',
    subtitle: 'Ensuring integrity through verified standards',
    cards: [
      { image: '/images/IMG_20260416_114350.png', title: 'Verified Professionals You Can Trust', desc: 'Every expert undergoes strict background verification and identity checks.' },
      { image: '/images/IMG_20260416_114410.png', title: 'Well Trained to deliver great service', desc: 'Our professionals are extensively trained in technical skills and customer etiquette.' },
      { image: '/images/IMG_20260416_114433.png', title: 'Safe, reliable, and consistent every single time', desc: 'We guarantee a secure and high-quality experience with every booking.' },
    ],
  },
  faqs: [
    { q: 'What is ZARPIT?', a: 'ZARPIT is a trusted platform offering two services: verified Companions for outings, events, movies and hospital visits, and Helping Buddies for errands, shifting, queues and everyday tasks.' },
    { q: 'How do I book services?', a: 'Choose Companion or Helping Buddy, pick a service, set your hours and preferences, describe your need by text or voice, then select date, time and location at checkout.' },
    { q: 'Can we get multiple tasks done in one booking?', a: 'Yes! You can add multiple services to your cart and book them together. Different Companions or Buddies may be assigned based on the tasks.' },
    { q: 'What payment methods do we accept?', a: 'We accept UPI, Credit/Debit cards, wallets, and Cash After Service (COD).' },
    { q: 'How can I trust Companions and Buddies sent by ZARPIT?', a: 'Every Zarpit Companion and Buddy undergoes strict background verification, identity checks, and training. All companion meetings happen in public places with clear safety rules.' },
    { q: 'How quickly can I get help?', a: 'Depending on availability, we offer slots as early as within 1 hour of booking.' },
    { q: 'Why should I choose your company?', a: 'We guarantee verified people, transparent hourly pricing, clear do’s and don’ts for every service, and comprehensive customer support.' },
    { q: 'What if I need to cancel or reschedule my booking?', a: 'You can cancel or reschedule freely up to 2 hours before the scheduled time via the "My Bookings" section in your Profile.' },
    { q: 'How do I Contact Support?', a: 'Visit our Help Center (Profile → Help) for 24/7 support via WhatsApp, phone, or email.' },
  ],
};

/* ---------- Booking filters (labels & behavior of the booking sheet) ---------- */
export interface BookingFiltersContent {
  companion: {
    hoursLabel: string;
    personsLabel: string;
    genderLabel: string;
    prefLabel: string;
    maleNote: string;
    meetLabel: string;
    meetPlaceholder: string;
    meetHint: string;
    maxHours: number;
    maxPersons: number;
    showMeetPoint: boolean;
  };
  need: {
    label: string;
    placeholder: string;
    hint: string;
    show: boolean;
  };
}

export const DEFAULT_BOOKING_FILTERS: BookingFiltersContent = {
  companion: {
    hoursLabel: 'Hours',
    personsLabel: 'Persons',
    genderLabel: 'Your gender',
    prefLabel: 'Companion preference',
    maleNote: "For everyone's safety, male customers are matched with male companions only.",
    meetLabel: 'Pickup / meet point',
    meetPlaceholder: 'e.g. Gate 2, City Mall, Greater Noida',
    meetHint: "You'll pick the date & time at checkout.",
    maxHours: 12,
    maxPersons: 10,
    showMeetPoint: true,
  },
  need: {
    label: 'Describe your need',
    placeholder: 'Type here, or tap the mic and just speak — Hinglish works too…',
    hint: 'Your message goes straight to our team with the booking.',
    show: true,
  },
};

/* ---------- Helpers ---------- */

/** Deep-merge stored content over defaults. Arrays are replaced wholesale. */
export function mergeContent<T>(defaults: T, stored: any): T {
  if (stored === null || stored === undefined) return defaults;
  if (Array.isArray(defaults)) return (Array.isArray(stored) ? stored : defaults) as T;
  if (typeof defaults === 'object' && defaults !== null) {
    const out: any = { ...defaults };
    if (typeof stored === 'object' && !Array.isArray(stored)) {
      for (const k of Object.keys(defaults as any)) {
        if (k in stored) out[k] = mergeContent((defaults as any)[k], stored[k]);
      }
    }
    return out;
  }
  return (typeof stored === typeof defaults ? stored : defaults) as T;
}

export function parseContent<T>(defaults: T, raw: string | null | undefined): T {
  if (!raw) return defaults;
  try {
    return mergeContent(defaults, JSON.parse(raw));
  } catch {
    return defaults;
  }
}
