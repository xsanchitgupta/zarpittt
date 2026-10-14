/* =============================================
   Companion & Helping Buddy helpers
   Category detection, icons, booking options
   ============================================= */

export const COMPANION_SLUG = 'companion';
export const BUDDY_SLUG = 'helping-buddy';

export type BookingMode = 'companion' | 'buddy';

export interface BookingOptions {
  hours: number;
  persons: number;
  userGender?: 'male' | 'female';
  genderPreference?: 'male' | 'female';
  meetPoint?: string;
  need?: string;
}

type CategoryLike = { slug?: string | null; name?: string | null } | string | null | undefined;

function catText(cat: CategoryLike): string {
  if (!cat) return '';
  if (typeof cat === 'string') return cat.toLowerCase();
  return `${cat.slug || ''} ${cat.name || ''}`.toLowerCase();
}

export function isCompanionCategory(cat: CategoryLike): boolean {
  return catText(cat).includes('companion');
}

export function isBuddyCategory(cat: CategoryLike): boolean {
  const t = catText(cat);
  return t.includes('buddy') || t.includes('helping');
}

/** Returns which booking-options flow a category needs, or null for regular services */
export function getBookingMode(cat: CategoryLike): BookingMode | null {
  if (isCompanionCategory(cat)) return 'companion';
  if (isBuddyCategory(cat)) return 'buddy';
  return null;
}

/** Emoji icon per sub-service, matched by keywords in the service name */
const SERVICE_ICONS: { match: RegExp; icon: string }[] = [
  { match: /outing/i, icon: '🛍️' },
  { match: /shopping/i, icon: '🛒' },
  { match: /event assist/i, icon: '🎪' },
  { match: /event/i, icon: '🎉' },
  { match: /medical/i, icon: '🏥' },
  { match: /senior|elder/i, icon: '👴' },
  { match: /movie/i, icon: '🎬' },
  { match: /queue/i, icon: '🧾' },
  { match: /waiting/i, icon: '⏳' },
  { match: /temple/i, icon: '🛕' },
  { match: /walk|fitness/i, icon: '🚶' },
  { match: /personal task/i, icon: '👤' },
  { match: /airport|station/i, icon: '✈️' },
  { match: /shift|moving/i, icon: '📦' },
  { match: /home help/i, icon: '🏠' },
  { match: /custom/i, icon: '📝' },
];

export function getServiceIcon(name: string, mode?: BookingMode | null): string {
  const found = SERVICE_ICONS.find(e => e.match.test(name));
  if (found) return found.icon;
  return mode === 'buddy' ? '🙌' : '🤝';
}

export function clampHours(h: number): number {
  return Math.max(1, Math.min(12, Math.round(h) || 1));
}

export function clampPersons(p: number): number {
  return Math.max(1, Math.min(10, Math.round(p) || 1));
}

/**
 * Flat surcharge added for every hour beyond the first.
 * The base price (set per service in Admin) covers the first hour;
 * each additional hour adds this amount. Single source of truth used by
 * both the client display and the server-side secure price recalculation.
 */
export const COMPANION_HOURLY_INCREMENT = 150;

/** Price for one companion for the given hours: base covers hour 1, +₹150 each extra hour */
export function companionUnitPrice(base: number, hours: number): number {
  return base + Math.max(0, clampHours(hours) - 1) * COMPANION_HOURLY_INCREMENT;
}

/** Full companion price: per-person hourly price × number of persons */
export function companionTotal(base: number, hours: number, persons: number): number {
  return companionUnitPrice(base, hours) * clampPersons(persons);
}

/** Stable signature used to tell apart cart lines of the same service with different options */
export function optionsSignature(options?: BookingOptions | null): string {
  if (!options) return '';
  return JSON.stringify({
    h: options.hours, p: options.persons,
    ug: options.userGender || '', gp: options.genderPreference || '',
    mp: options.meetPoint || '', n: options.need || ''
  });
}

/** Short human-readable summary, shown in cart and sent to admin with the order */
export function formatOptionsSummary(options?: BookingOptions | null): string[] {
  if (!options) return [];
  const lines: string[] = [];
  const h = clampHours(options.hours);
  const p = clampPersons(options.persons);
  lines.push(`${h} hour${h > 1 ? 's' : ''} × ${p} person${p > 1 ? 's' : ''}`);
  if (options.userGender) lines.push(`Customer gender: ${options.userGender}`);
  if (options.genderPreference) lines.push(`Companion preference: ${options.genderPreference}`);
  if (options.meetPoint) lines.push(`Pickup/meet point: ${options.meetPoint}`);
  if (options.need) lines.push(`Need: ${options.need}`);
  return lines;
}

/* =============================================
   General Safety & Service Rules (platform-wide)
   ============================================= */
export const GENERAL_SAFETY_RULES = {
  will: [
    'Provide assistance, support, and helping hands.',
    'Complete tasks professionally and respectfully.',
    'Follow customer instructions within reasonable limits.',
    'Maintain privacy and confidentiality.',
    'Arrive on time and communicate clearly.',
  ],
  willNot: [
    'Bring personal vehicles, tools, equipment, or materials unless specifically mentioned in the service.',
    'Handle illegal, hazardous, or restricted items.',
    'Perform licensed professional work (electrician, doctor, lawyer, etc.) unless booked through the appropriate service.',
    'Transport large amounts of cash, gold, jewelry, or highly valuable assets.',
    'Participate in any unsafe or unlawful activity.',
    'Accept off-platform payments or side deals.',
  ],
  note: 'Zarpit Buddies are here to assist and support. They are not replacement workers for specialized professionals and will only perform tasks that are safe, legal, and within the scope of the booked service.',
};
