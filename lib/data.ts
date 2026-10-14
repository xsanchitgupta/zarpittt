import { createServerSupabaseClient } from '@/lib/supabase-server';

// Server-side Supabase client — bypasses RLS for read-only data fetching
const supabase = createServerSupabaseClient();
import type { Category, Service, Professional, Testimonial, Offer, ServiceArea } from '@/lib/database.types';



// ============================================
// Re-export types for backward compatibility
// ============================================
export type { Category, Service, Professional, Testimonial, Offer, ServiceArea };

const formatCategory = (cat: any): Category => ({
  ...cat,
  image: cat.icon || '',
  icon: '' // Remove the raw text URL from icon so it doesn't break UI text nodes
});

const formatService = (svc: any): Service => {
  const duration_minutes = svc.duration_minutes ?? 60;
  let dynamicDuration = svc.duration || '1-2 hrs';
  
  // If the database has the placeholder '1-2 hrs' or something generic, make it dynamic based on minutes
  if (dynamicDuration === '1-2 hrs' || !svc.duration) {
    if (duration_minutes >= 60) {
      const hrs = Math.floor(duration_minutes / 60);
      const mins = duration_minutes % 60;
      dynamicDuration = `${hrs} hr${hrs > 1 ? 's' : ''}${mins > 0 ? ` ${mins} min` : ''}`;
    } else {
      dynamicDuration = `${duration_minutes} mins`;
    }
  }
  const idHash = svc.id ? String(svc.id).split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) : Math.floor(Math.random() * 100);
  const genReviews = svc.reviews ? svc.reviews : (20 + (idHash % 11)); // 20 to 30 reviews
  const genRating = (svc.rating && svc.rating < 5) ? svc.rating : Number((4.5 + ((idHash % 5) / 10)).toFixed(1)); // 4.5 to 4.9

  return {
    ...svc,
    image: svc.image_url || '',
    category: svc.categories ? formatCategory(svc.categories) : undefined,
    reviews: genReviews, 
    rating: genRating, 
    original_price: svc.original_price || svc.price,
    discount: svc.discount || 0,
    included: svc.included || [],
    not_included: svc.not_included || [],
    variants: svc.variants || [],
    buffer_time: svc.buffer_time ?? 0.5,
    duration_minutes: duration_minutes,
    duration: dynamicDuration,
    variant_durations: svc.variant_durations || {},
  };
};

// Helper for resilient fetching — optimized for speed
async function resilientFetch(queryFn: () => any, timeoutMs = 8000, maxAttempts = 2) {
  const VERSION = 'v1.0.5';
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    try {
      console.log(`[data.ts][${VERSION}] resilientFetch attempt ${attempt + 1}...`);
      const result = await Promise.race([
        queryFn(),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeoutMs))
      ]);
      if (result.error) {
        console.error(`[data.ts] Supabase query error:`, JSON.stringify(result.error));
        throw result.error;
      }
      console.log(`[data.ts] resilientFetch success, got ${Array.isArray(result.data) ? result.data.length : '1'} items`);
      return result.data;
    } catch (err: any) {
      console.warn(`[data.ts] resilientFetch attempt ${attempt + 1} failed:`, err?.message || err, err?.code || '', err?.details || '');
      if (attempt === maxAttempts - 1) throw err;
      await new Promise(r => setTimeout(r, 1000));
    }
  }
}

// ============================================
// SITE CONTENT (CMS) — stored in system_settings
// ============================================
export async function getContentValue(key: string): Promise<string | null> {
  try {
    const { data, error } = await supabase
      .from('system_settings')
      .select('value')
      .eq('key', key)
      .maybeSingle();
    if (error) throw error;
    return data?.value ?? null;
  } catch (err) {
    console.warn(`[data.ts] getContentValue(${key}) failed, using defaults`);
    return null;
  }
}

// ============================================
// CATEGORIES
// ============================================
// Internal fetcher without cache for categories
async function _fetchCategories(): Promise<Category[]> {
  const VERSION = 'v1.0.5';
  console.log(`[DEBUG][${VERSION}] _fetchCategories called`);
  try {
    const [catData, independentServices] = await Promise.all([
      resilientFetch(() => supabase.from('categories').select('*').order('is_coming_soon', { ascending: true }).order('created_at', { ascending: true })),
      resilientFetch(() => supabase.from('services').select('*').eq('is_independent', true).order('is_coming_soon', { ascending: true }).order('sort_order', { ascending: true }))
    ]);

    const formattedCategories = (catData || []).map(formatCategory);
    const virtualCategories = (independentServices || []).map((s: any) => ({
      id: `service-${s.id}`,
      name: s.name,
      slug: `service-${s.id}`, // Custom slug to identify it's a direct service link
      image: s.image_url,
      icon: '',
      is_coming_soon: s.is_coming_soon,
      is_independent_service: true,
      service_id: s.id
    }));

    const combined = [...formattedCategories, ...virtualCategories];
    
    // Sort combined list: Active first, then Coming Soon
    combined.sort((a, b) => {
      if (!!a.is_coming_soon !== !!b.is_coming_soon) {
        return a.is_coming_soon ? 1 : -1;
      }
      // Within same group, maintain order or use name
      return 0; 
    });

    return combined;
  } catch (err) {
    console.error(`[DEBUG][${VERSION}] _fetchCategories total failure:`, err);
  }

  console.log(`[DEBUG][${VERSION}] Returning fallbackCategories`);
  return fallbackCategories.map(c => ({
    ...c,
    created_at: new Date().toISOString(),
  })) as Category[];
}

// Fetch categories directly — no cache layer to avoid stale empty results
export async function getCategories(): Promise<Category[]> {
  return _fetchCategories();
}

export async function getCategoryBySlug(slug: string): Promise<Category | null> {
  try {
    const data = await resilientFetch(() => 
      supabase.from('categories').select('*').eq('slug', slug).single()
    );
    return data ? formatCategory(data) : null;
  } catch (err) {
    return null;
  }
}

// ============================================
// SERVICES
// ============================================
// Internal fetcher without cache for services
async function _fetchServices(page = 1, limit = 20): Promise<Service[]> {
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  try {
    const data = await resilientFetch(() => 
      supabase.from('services').select('*, categories(*)').order('is_coming_soon', { ascending: true }).order('sort_order', { ascending: true }).range(from, to)
    );
    if (data) return data.map(formatService);
  } catch (err) {
    console.error('[DEBUG] _fetchServices total failure:', err);
  }
  return [];
}

// Fetch services directly — no cache layer to avoid stale empty results
export async function getServices(page = 1, limit = 20): Promise<Service[]> {
  return _fetchServices(page, limit);
}

export async function getServiceById(id: number | string): Promise<Service | null> {
  const { data, error } = await supabase
    .from('services')
    .select('*, categories(*)')
    .eq('id', id)
    .single();

  if (error) return null;
  return data ? formatService(data) : null;
}

export async function getServiceBySlug(slug: string): Promise<Service | null> {
  return null;
}

export async function getServicesByCategory(categoryId: string): Promise<Service[]> {
  const { data: cat } = await supabase.from('categories').select('id').eq('slug', categoryId).single();
  const catId = cat ? cat.id : categoryId;

  const { data } = await supabase.from('services').select('*, categories(*)').eq('category_id', catId);
  return (data || []).map(formatService);
}

export async function searchServices(query: string): Promise<Service[]> {
  const { data } = await supabase
    .from('services')
    .select('*, categories(*)')
    .or(`name.ilike.%${query}%,description.ilike.%${query}%`);
  
  const results = (data || []).map(formatService);
  
  // Sort by relevance (exact match > title match > description match)
  const q = query.toLowerCase();
  results.sort((a, b) => {
    const aNameMatch = a.name.toLowerCase().includes(q) ? 1 : 0;
    const bNameMatch = b.name.toLowerCase().includes(q) ? 1 : 0;
    if (aNameMatch !== bNameMatch) return bNameMatch - aNameMatch;
    
    // Fallback to ID/Sort order if both are just description matches
    return a.id - b.id;
  });
  
  return results;
}

// ============================================
// UNUSED STUBS
// ============================================
export async function getProfessionals(): Promise<Professional[]> { return []; }

export async function getTestimonials(): Promise<Testimonial[]> {
  try {
    const data = await resilientFetch(() => 
      supabase.from('testimonials').select('*').eq('is_approved', true).order('is_featured', { ascending: false }).order('id', { ascending: true })
    );
    if (data && data.length > 0) return data as Testimonial[];
  } catch (err) {
    console.warn('[data.ts] Failed to fetch testimonials, using fallbacks');
  }
  return fallbackTestimonials as Testimonial[];
}

export async function getOffers(): Promise<Offer[]> { return []; }

export async function validateCoupon(code: string, total: number) {
  const { data, error } = await supabase
    .from('offers')
    .select('*')
    .eq('code', code.toUpperCase())
    .eq('is_active', true)
    .gte('valid_till', new Date().toISOString())
    .single();

  if (error || !data) return null;

  const offer = data as Offer;
  if (offer.usage_limit && offer.used_count >= offer.usage_limit) return null;

  let discount: number;
  if (offer.discount_type === 'percent') {
    discount = Math.floor(total * offer.discount_value / 100);
    if (offer.max_discount) discount = Math.min(discount, offer.max_discount);
  } else {
    discount = offer.discount_value;
  }

  return { ...offer, discount };
}

// ============================================
// SERVICE AREAS
// ============================================

export const SERVICEABLE_AREAS = [
  { name: 'Delhi', lat: 28.7041, lng: 77.1025, radiusKm: 30 },
  { name: 'Noida', lat: 28.5355, lng: 77.3910, radiusKm: 25 },
  { name: 'Greater Noida', lat: 28.4744, lng: 77.5040, radiusKm: 20 },
  { name: 'Ghaziabad', lat: 28.6692, lng: 77.4538, radiusKm: 20 },
  { name: 'Greater Noida West', lat: 28.5693, lng: 77.4538, radiusKm: 15 },
];

function getDistanceKm(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
    Math.sin(dLon / 2) * Math.sin(dLon / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export async function getServiceAreas(): Promise<ServiceArea[]> {
  try {
    const { data, error } = await supabase.from('service_areas').select('*').eq('is_active', true).order('name');
    if (error) throw error;
    if (data && data.length > 0) return data as ServiceArea[];
  } catch (err) {
    console.warn('[data.ts] Failed to fetch service areas, using fallbacks');
  }
  
  // Fallback to hardcoded list if DB is empty or fails
  return SERVICEABLE_AREAS.map((a, i) => ({
    id: i + 1,
    name: a.name,
    city: a.name,
    is_active: true,
    latitude: a.lat,
    longitude: a.lng,
    radius_km: a.radiusKm
  })) as any[];
}

export function isLocationServiceable(lat: number, lng: number, activeAreas?: any[]): { serviceable: boolean; area: string | null } {
  const areasToCheck = activeAreas || SERVICEABLE_AREAS.map(a => ({ name: a.name, latitude: a.lat, longitude: a.lng, radius_km: a.radiusKm }));
  
  for (const area of areasToCheck) {
    const areaLat = area.latitude || area.lat;
    const areaLng = area.longitude || area.lng;
    const radius = area.radius_km || area.radiusKm || 20;

    if (!areaLat || !areaLng) continue;

    const distance = getDistanceKm(lat, lng, areaLat, areaLng);
    if (distance <= radius) {
      return { serviceable: true, area: area.name };
    }
  }
  return { serviceable: false, area: null };
}



// ============================================
// Static fallback data for SSR / loading states
// ============================================
export const fallbackCategories: Partial<Category>[] = [
  { id: "cleaning", name: "Cleaning", slug: "cleaning", image: "/images/cleaning.png" },
  { id: "laundry", name: "Laundry", slug: "laundry", image: "/images/laundry.png" },
  { id: "pandit", name: "Pandit ji", slug: "pandit", image: "/images/pandit.png" },
  { id: "cooking", name: "Cook", slug: "cooking", image: "/images/cooking.png" },
  { id: "safety-person", name: "Safety Person", slug: "safety-person", image: "/images/Safety%20Person.png" },
  { id: "baby-care", name: "Baby Care Helper", slug: "baby-care", image: "/images/baby-care.png" },
  { id: "pregnancy-care", name: "Pregnancy Care", slug: "pregnancy-care", image: "/images/Pregnancy%20Care.png" },
  { id: "old-parents-care", name: "Old Parents Care", slug: "old-parents-care", image: "/images/elder-care.png" },
  { id: "pet-walker", name: "Pet Walker", slug: "pet-walker", image: "/images/pet-care.png" },
  { id: "doctor", name: "Doctor at home", slug: "doctor", image: "/images/doctor.png" },
  { id: "luggage-shifter", name: "Luggage Shifter", slug: "luggage-shifter", image: "/images/luggage-shifter.png" },
  { id: "mechanic", name: "Bike Mechanic", slug: "mechanic", image: "/images/mechanic.png" },
  { id: "haircut", name: "Haircut", slug: "haircut", image: "/images/salon.png" },
];

export const fallbackTestimonials: Partial<Testimonial>[] = [
  { id: 1, user_name: "Anita Sharma", location: "Greater Noida", text: "Zarpit has completely changed how I manage my home. The cooks are professional and the service is seamless. Highly recommended!", rating: 5, avatar: "👩", is_approved: true, is_featured: true },
  { id: 2, user_name: "Rahul Verma", location: "Noida Sector 62", text: "I used the deep cleaning service last week. The team was punctual and did an amazing job. Worth every rupee.", rating: 5, avatar: "👨", is_approved: true, is_featured: true },
  { id: 3, user_name: "Priya Gupta", location: "Delhi", text: "The salon at home service is a lifesaver for busy moms like me. Great quality and very convenient.", rating: 5, avatar: "👩", is_approved: true, is_featured: false },
  { id: 4, user_name: "Sanjay Singh", location: "Ghaziabad", text: "Reliable and trustworthy. I've used their safety person service for events multiple times now.", rating: 4, avatar: "👨", is_approved: true, is_featured: false },
];
