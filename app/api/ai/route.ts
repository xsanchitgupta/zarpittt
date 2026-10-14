import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { askAI, hasConfiguredProvider, type AIMessage } from '@/lib/ai/providers';
import { GENERAL_SAFETY_RULES } from '@/lib/companion';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!,
  { auth: { autoRefreshToken: false, persistSession: false } }
);

// ---------------------------------------------
// Rate limiting — in-memory sliding window.
// Fine for a single Node instance; swap for Redis/Upstash if scaled out.
// ---------------------------------------------
const RATE_LIMIT = 12; // requests
const RATE_WINDOW_MS = 60_000; // per minute
const hits = new Map<string, number[]>();

function isRateLimited(ip: string): boolean {
  const now = Date.now();
  const list = (hits.get(ip) || []).filter(t => now - t < RATE_WINDOW_MS);
  if (list.length >= RATE_LIMIT) {
    hits.set(ip, list);
    return true;
  }
  list.push(now);
  hits.set(ip, list);
  if (hits.size > 5000) hits.clear(); // safety valve against unbounded growth
  return false;
}

// ---------------------------------------------
// Service catalog context — cached 5 minutes
// ---------------------------------------------
interface CatalogService {
  id: string;
  name: string;
  description: string;
  price: number;
  duration: string;
  category: string;
}

let catalogCache: { services: CatalogService[]; areas: string[]; ts: number } | null = null;

async function getCatalog(): Promise<{ services: CatalogService[]; areas: string[] }> {
  if (catalogCache && Date.now() - catalogCache.ts < 5 * 60_000) return catalogCache;
  const [svcRes, areaRes] = await Promise.all([
    supabaseAdmin
      .from('services')
      .select('id, name, description, price, duration, is_coming_soon, categories(name, slug)')
      .order('sort_order', { ascending: true })
      .limit(100),
    supabaseAdmin.from('service_areas').select('name').eq('is_active', true),
  ]);
  if (svcRes.error || !svcRes.data) {
    console.error('[AI] Catalog fetch failed:', svcRes.error?.message);
    return catalogCache || { services: [], areas: [] };
  }
  const services = svcRes.data
    .filter((s: any) => !s.is_coming_soon)
    .map((s: any) => ({
      id: String(s.id),
      name: s.name,
      description: (s.description || '').slice(0, 140),
      price: s.price,
      duration: s.duration || '',
      category: s.categories?.name || '',
    }));
  const areas = (areaRes.data || []).map((a: any) => a.name);
  catalogCache = { services, areas, ts: Date.now() };
  return catalogCache;
}

function buildSystemPrompt(catalog: CatalogService[], areas: string[], page?: string): string {
  const catalogLines = catalog
    .map(s => `- ${s.name} (${s.category}) — ₹${s.price}${/hour/i.test(s.duration) ? '/hour/person' : '/task'} — ${s.description}`)
    .join('\n');
  const areaList = areas.length > 0 ? areas.join(', ') : 'Greater Noida, Greater Noida West, Noida, Delhi, Ghaziabad';

  return `You are "Zarpit Buddy", the friendly assistant for Zarpit — a trusted services platform in ${areaList} (India). You know the entire website and can guide customers anywhere on it.

## WHAT ZARPIT OFFERS
1. **Companion** — verified companions for outings, shopping, events, hospital visits, senior care, movies, waiting, temple visits, walking & fitness. Priced per hour, per person.
2. **Helping Buddy** — an extra pair of hands for errands, airport/station assistance, shifting, home help, queue waiting, event assistance and custom tasks. Priced per task.
3. Coming soon: Pandit Ji (pujas & rituals at home) and Mechanic Anywhere (on-the-spot vehicle help) — not bookable yet.

## FULL SERVICE CATALOG (live prices)
${catalogLines}

## SITE MAP — every page you can send the customer to
- / — home page
- /services — full catalog; /services?cat=companion — Companion list; /services?cat=helping-buddy — Helping Buddy list
- /services/{id} — service details with Do's & Don'ts, reviews, Book Now
- /cart — cart; /checkout — date, time, address & payment; /offers — coupon codes & deals
- /profile?tab=bookings — view, track, cancel or reschedule bookings
- /profile?tab=profile — account details & phone number; /profile?tab=addresses — saved addresses; /profile?tab=payments — payment history
- /profile?tab=help — Help Center (24/7 support via WhatsApp, phone, email)
- /auth — login or create an account
- /about — about Zarpit; /careers — jobs & joining as a Companion/Buddy; /blog — articles
- /terms — Terms & Conditions; /privacy — Privacy Policy
- /search?q=... — search services

## HOW BOOKING WORKS (step by step)
1. Pick a service (from home tiles, /services, or the chips you show).
2. Tap Book Now / Add to Cart → a form asks: hours (1-12) & number of persons (companion only), your gender, pickup/meet point, and a box to describe the need by typing or speaking (mic button, Hinglish works).
3. Cart → Checkout: pick date & time slot, address (search, GPS or map pin), payment method.
4. Payment: Pay Now online (UPI/cards via Razorpay) or Cash After Service.
5. After booking: confirmation + a 4-digit completion OTP; the assigned professional's details appear in /profile?tab=bookings. Admin team also gets your need description instantly.

## POLICIES & FACTS (never contradict these)
- Gender rule: male customers are matched with male companions only. Female customers may choose male or female companions.
- Companions meet in public places only; no dating, romance, private rooms or home visits; no physical contact without consent; nothing illegal.
- Buddies WILL: ${GENERAL_SAFETY_RULES.will.join(' ')}
- Buddies will NOT: ${GENERAL_SAFETY_RULES.willNot.join(' ')}
- Cancellation/reschedule: free up to 2 hours before the scheduled time, from /profile?tab=bookings.
- Coupons: applied in cart or checkout; current offers live at /offers.
- Service areas: ${areaList}. Slots run 9 AM – 8 PM, as early as 1 hour from now.
- Support: Help Center at /profile?tab=help, or email zarpittechservices@gmail.com.
${page ? `\n## CURRENT PAGE\nThe customer is currently on: ${page}` : ''}

## NAVIGATION PROTOCOL
When opening a page would help the customer, end your reply with up to 2 lines in EXACTLY this format (each on its own line, after your normal text):
NAV: /path | Short button label
Example: NAV: /profile?tab=bookings | My Bookings
Only use paths from the site map above. The app turns these lines into tappable buttons — never mention the NAV syntax in your visible text, and never invent paths.

## STYLE
- Warm, concise (2-5 short sentences unless asked for detail). Match the user's language — reply in Hinglish if they write in Hinglish.
- Simple markdown only: **bold**, *italic*, - bullet lists, 1. numbered lists, and [links](/path) to site-map pages. No tables, no code blocks, no headings.
- When recommending a service, mention its exact catalog name so the app shows a booking shortcut.
- Never invent services, prices, pages or policies. If unsure, say so and point to the Help Center.
- Refuse anything unsafe, romantic/sexual, or illegal — politely, citing the safety rules.`;
}

/** Pull "NAV: /path | Label" lines out of the model reply → tappable buttons */
function extractActions(reply: string): { reply: string; actions: { href: string; label: string }[] } {
  const actions: { href: string; label: string }[] = [];
  const cleaned = reply.replace(/^\s*NAV:\s*(\/[^|\n]{0,120})\|(.{1,60})$/gim, (_m, path, label) => {
    const href = String(path).trim();
    // internal, customer-facing paths only
    if (/^\/(?!\/)/.test(href) && !/^\/(admin|provider|api)/.test(href) && actions.length < 2) {
      actions.push({ href, label: String(label).trim() || 'Open' });
    }
    return '';
  }).trim();
  return { reply: cleaned, actions };
}

// Reply used when no provider key is configured or every provider fails —
// the widget keeps working instead of erroring out.
/** Only the live Companion / Helping Buddy lines belong in generic recommendations */
function primaryCatalog(catalog: CatalogService[]): CatalogService[] {
  const filtered = catalog.filter(s => /companion|buddy|helping/i.test(s.category));
  return filtered.length > 0 ? filtered : catalog;
}

function fallbackReply(catalog: CatalogService[]): string {
  const names = primaryCatalog(catalog).slice(0, 8).map(s => s.name).join(', ');
  return `I'm having trouble reaching my AI brain right now 🛠️ — but you can browse everything directly: our Companion services (outings, movies, hospital visits & more) and Helping Buddy services (errands, shifting, queues & tasks). Popular picks: ${names}. Tap a service to see details and book, or reach us via Profile → Help Center.`;
}

function findSuggestions(reply: string, catalog: CatalogService[]) {
  const lower = reply.toLowerCase();
  return catalog
    .filter(s => lower.includes(s.name.toLowerCase()))
    .slice(0, 4)
    .map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration }));
}

export async function POST(req: NextRequest) {
  try {
    const ip = req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 'unknown';
    if (isRateLimited(ip)) {
      return NextResponse.json({ error: 'Too many messages — please wait a minute.' }, { status: 429 });
    }

    const body = await req.json().catch(() => null);
    const rawMessages = body?.messages;
    if (!Array.isArray(rawMessages) || rawMessages.length === 0) {
      return NextResponse.json({ error: 'messages array required' }, { status: 400 });
    }

    // Sanitize: only user/assistant turns, capped count & length
    const messages: AIMessage[] = rawMessages
      .filter((m: any) => m && (m.role === 'user' || m.role === 'assistant') && typeof m.content === 'string')
      .slice(-12)
      .map((m: any) => ({ role: m.role, content: m.content.slice(0, 2000) }));

    if (messages.length === 0 || messages[messages.length - 1].role !== 'user') {
      return NextResponse.json({ error: 'last message must be from user' }, { status: 400 });
    }

    const { services: catalog, areas } = await getCatalog();
    const page = typeof body?.page === 'string' && body.page.startsWith('/') ? body.page.slice(0, 120) : undefined;

    const offlinePayload = () => ({
      reply: fallbackReply(catalog),
      provider: 'offline',
      suggestions: primaryCatalog(catalog).slice(0, 4).map(s => ({ id: s.id, name: s.name, price: s.price, duration: s.duration })),
      actions: [
        { href: '/services?cat=companion', label: 'Browse Companions' },
        { href: '/services?cat=helping-buddy', label: 'Browse Helping Buddies' },
      ],
    });

    if (!hasConfiguredProvider()) {
      return NextResponse.json(offlinePayload());
    }

    try {
      const result = await askAI([{ role: 'system', content: buildSystemPrompt(catalog, areas, page) }, ...messages]);
      const { reply, actions } = extractActions(result.reply);
      return NextResponse.json({
        reply,
        provider: result.provider,
        suggestions: findSuggestions(reply, catalog),
        actions,
      });
    } catch (err: any) {
      console.error('[AI] All providers failed:', err.message);
      return NextResponse.json(offlinePayload());
    }
  } catch (err: any) {
    console.error('[AI] Route error:', err.message);
    return NextResponse.json({ error: 'Something went wrong' }, { status: 500 });
  }
}
