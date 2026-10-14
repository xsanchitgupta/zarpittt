/**
 * Seed: Companion & Helping Buddy categories + services
 * Mirrors supabase_companion_buddy.sql, but runs through the Supabase REST API
 * using SUPABASE_SERVICE_ROLE_KEY from .env (no DATABASE_URL needed).
 *
 * Usage: node seed_companion_buddy.js
 * Safe to re-run: existing categories/services are skipped, never overwritten.
 */
const fs = require('fs');
const { createClient } = require('@supabase/supabase-js');

// Load .env manually (no dotenv dependency assumptions)
const env = fs.readFileSync('.env', 'utf8');
const getEnv = (key) => {
  const m = env.match(new RegExp(`^${key}="?([^"\\r\\n]+)"?`, 'm'));
  return m ? m[1].trim() : null;
};

const url = getEnv('NEXT_PUBLIC_SUPABASE_URL');
const key = getEnv('SUPABASE_SERVICE_ROLE_KEY');
if (!url || !key) {
  console.error('Missing NEXT_PUBLIC_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY in .env');
  process.exit(1);
}
const supabase = createClient(url, key);

const CATEGORIES = [
  { name: 'Companion', slug: 'companion' },
  { name: 'Helping Buddy', slug: 'helping-buddy' },
];

// Companion services: price is per hour, per person
const COMPANION_SERVICES = [
  {
    name: 'Outing Companion', price: 199, sort_order: 1,
    description: 'A friendly, verified companion for casual outings — conversations, activities, navigation and planning, always in public places.',
    dos_and_donts: {
      dos: ['Meet only at public places.', 'Enjoy casual conversations and activities.', 'Help with navigation or planning.', "Respect each other's personal space."],
      donts: ['No dating or romantic expectations.', 'No private room or home visits.', 'No physical contact without consent.', 'No illegal activities.'],
    },
  },
  {
    name: 'Shopping Companion', price: 199, sort_order: 2,
    description: 'Company for your shopping trips — comparing products and prices, carrying bags, store navigation and honest opinions.',
    dos_and_donts: {
      dos: ['Help compare products and prices.', 'Carry shopping bags if requested.', 'Assist with store navigation.', 'Give honest opinions when asked.'],
      donts: ["Don't make purchases using your own money.", "Don't pressure anyone to buy products.", "Don't accept expensive gifts.", 'No personal financial transactions.'],
    },
  },
  {
    name: 'Event Companion', price: 249, sort_order: 3,
    description: 'A respectful companion to attend public events with you — help with seating, navigation and coordination.',
    dos_and_donts: {
      dos: ['Attend public events together.', 'Maintain professional and respectful behavior.', 'Help with seating, navigation or coordination.', 'Follow event rules.'],
      donts: ['No inappropriate behavior.', 'No alcohol or drug abuse.', "Don't misrepresent your relationship.", "Don't leave the client without informing them."],
    },
  },
  {
    name: 'Medical Companion', price: 249, sort_order: 4,
    description: 'Home-to-hospital travel assistance and support at hospitals or clinics — registration, queues, medicines and reports.',
    dos_and_donts: {
      dos: ['Home to hospital travel assistance.', 'Accompany clients to hospitals or clinics.', 'Assist with registration and queues.', 'Help collect medicines or reports.', 'Stay calm and supportive.'],
      donts: ["Don't give medical advice.", "Don't administer medicines or injections.", "Don't make medical decisions.", "Don't access confidential records without permission."],
    },
  },
  {
    name: 'Senior Citizen Companion', price: 199, sort_order: 5,
    description: 'Friendly conversation, emotional support and daily-outing assistance for senior citizens, with patience and respect.',
    dos_and_donts: {
      dos: ['Offer friendly conversation and emotional support.', 'Assist with walking and daily outings.', 'Help with simple non-medical tasks.', 'Be patient and respectful.'],
      donts: ["Don't handle money without permission.", "Don't influence legal or financial decisions.", "Don't leave the senior unattended if responsible.", "Don't misuse personal information."],
    },
  },
  {
    name: 'Movie Companion', price: 199, sort_order: 6,
    description: 'Someone to watch a movie with — meet at the theatre, enjoy the film and friendly conversation.',
    dos_and_donts: {
      dos: ['Meet at the theatre.', 'Watch the movie respectfully.', 'Maintain friendly conversation.', 'Respect personal boundaries.'],
      donts: ['No romantic expectations.', 'No inappropriate physical contact.', "Don't force post-movie plans.", 'No harassment.'],
    },
  },
  {
    name: 'Waiting Companion', price: 149, sort_order: 7,
    description: 'Waits at your assigned location on your behalf and keeps you updated throughout.',
    dos_and_donts: {
      dos: ['Wait at the assigned location.', 'Keep the client updated.', 'Follow instructions carefully.', 'Respect scheduled timings.'],
      donts: ["Don't leave without informing the client.", "Don't misuse documents or belongings.", "Don't impersonate the client.", "Don't violate venue rules."],
    },
  },
  {
    name: 'Temple Companion', price: 199, sort_order: 8,
    description: 'Respectful company for temple visits — assistance for elderly or disabled visitors while honouring religious customs.',
    dos_and_donts: {
      dos: ['Respect religious customs.', 'Help elderly or disabled visitors.', 'Maintain silence where required.', 'Dress appropriately.'],
      donts: ["Don't disrespect religious beliefs.", "Don't argue about religion.", "Don't accept donations on behalf of others.", "Don't break temple rules."],
    },
  },
  {
    name: 'Walking & Fitness Companion', price: 149, sort_order: 9,
    description: 'A motivating walk and fitness partner — comfortable pace, healthy habits, safe public areas.',
    dos_and_donts: {
      dos: ['Walk at a comfortable pace.', 'Encourage healthy habits.', 'Stay in safe public areas.', "Respect the client's fitness level."],
      donts: ["Don't provide medical or fitness treatment.", "Don't force difficult exercises.", "Don't leave the client midway.", "Don't ignore safety concerns."],
    },
  },
].map(s => ({ ...s, duration: 'Per Hour', duration_minutes: 60 }));

// Helping Buddy services: price is per task
const BUDDY_SERVICES = [
  {
    name: 'Personal Task Buddy', price: 149, sort_order: 1, duration_minutes: 60,
    description: 'Need help with small everyday errands? A Personal Task Buddy can pick up items, get documents printed or collected, deliver small items within the city, submit forms and run urgent local errands. Standard service available within 5–7 km; additional distance charges may apply beyond the service radius.',
    included: ['Picking up items from a specific shop or food stall', 'Getting documents printed, photocopied, or collected', 'Delivering or picking up small items within the city', 'Submitting or collecting forms', 'Running urgent local errands'],
    dos_and_donts: {
      dos: ['Clearly explain the task before booking.', 'Share accurate pickup and drop details.', 'Keep required documents ready.', 'Use the service only for legal and safe tasks.'],
      donts: ['No transportation of illegal, restricted, or hazardous items.', 'No handling of large valuables, cash, gold, or confidential items without approval.', 'No personal banking transactions.', "Buddies will not use their own money unless agreed through platform guidelines."],
    },
  },
  {
    name: 'Airport & Station Buddy', price: 299, sort_order: 2, duration_minutes: 120,
    description: 'Traveling with heavy luggage or need assistance getting to the airport or station? A Buddy accompanies you from home, helps with luggage, guides you through entry points and helps coordinate pickups and drop-offs.',
    included: ['Accompany you from home to the airport/station', 'Assist with luggage handling', 'Help senior citizens, families, and first-time travelers', 'Guide you through entry points and waiting areas', 'Help coordinate pickups and drop-offs'],
    dos_and_donts: {
      dos: ['Keep tickets and ID documents with yourself.', 'Inform the Buddy about luggage requirements in advance.', 'Reach on time for smooth travel assistance.', 'Follow airport and railway rules.'],
      donts: ['Buddies do not carry or transport prohibited items.', 'Buddies do not check in using your ID.', 'Buddies do not take responsibility for lost valuables.', 'Buddies are assistants, not licensed porters or travel agents.'],
    },
  },
  {
    name: 'Shifting & Moving Buddy', price: 349, sort_order: 3, duration_minutes: 180,
    description: 'Perfect for students, hostel residents, PG tenants, and families who need an extra helping hand while moving — packing, loading, unloading and arranging.',
    included: ['Help organize and pack belongings', 'Assist in moving items from one room or location to another', 'Help load and unload household items', 'Support with arranging furniture and boxes', 'Make shifting easier and more organized'],
    dos_and_donts: {
      dos: ['Inform us about the type and quantity of items.', 'Book multiple Buddies if heavy assistance is required.', 'Keep fragile items clearly marked.', 'Supervise valuable belongings during shifting.'],
      donts: ['Buddies do not provide transportation vehicles.', 'Buddies do not bring packing materials unless specifically arranged.', 'Buddies are not responsible for improperly packed fragile items.', 'No movement of illegal, dangerous, or restricted goods.'],
    },
  },
  {
    name: 'Home Helper', price: 199, sort_order: 4, duration_minutes: 120,
    description: 'Sometimes you just need an extra pair of hands — curtains, festival decorations, organizing rooms, moving furniture within the house, receiving deliveries and general household assistance.',
    included: ['Hanging curtains', 'Festival decorations and lighting setup', 'Organizing rooms and cupboards', 'Moving furniture within the house', 'Receiving deliveries', 'General household assistance', 'Simple non-technical support tasks'],
    dos_and_donts: {
      dos: ['Clearly explain the work required.', 'Ensure a safe working environment.', 'Provide necessary tools if the task requires them.', 'Treat Buddies with respect.'],
      donts: ['No electrical, plumbing, or technical repair work unless booked under the relevant category.', 'No unsafe rooftop or high-risk work.', 'No handling of confidential documents or valuables.', 'No tasks involving illegal activities.'],
    },
  },
  {
    name: 'Queue & Waiting Buddy', price: 149, sort_order: 5, duration_minutes: 120,
    description: "Don't have time to wait? A Queue & Waiting Buddy can stand in queues, wait at assigned locations, collect tokens where permitted, receive deliveries, or wait for someone on your behalf — keeping you updated throughout.",
    included: ['Stand in queues on your behalf', 'Wait at assigned locations', 'Collect tokens where permitted', 'Receive deliveries', 'Wait for someone on your behalf'],
    dos_and_donts: {
      dos: ['Clearly mention the waiting location and purpose.', 'Share all required details before the task starts.', 'Stay reachable in case the Buddy needs your confirmation.', 'Inform the Buddy immediately if your plan changes.'],
      donts: ["Don't book for places where proxy waiting is not allowed.", "Don't ask the Buddy to misuse IDs, tickets, or official documents.", "Don't request illegal or fraudulent activities.", "Don't ask the Buddy to leave the queue without your confirmation."],
    },
  },
  {
    name: 'Event Assistance', price: 299, sort_order: 6, duration_minutes: 240,
    description: 'Need an extra helping hand at an event? An Event Assistance Buddy can help with guest coordination, registrations, seating arrangements, basic setup, backstage support and other non-technical event tasks for weddings, parties, corporate events, exhibitions, and private functions.',
    included: ['Guest coordination', 'Registrations', 'Seating arrangements', 'Basic setup', 'Backstage support', 'Other non-technical event tasks'],
    dos_and_donts: {
      dos: ["Clearly explain the Buddy's responsibilities before the event.", 'Share event timing, venue, and dress code (if any).', 'Assign only safe and legal tasks.', 'Treat the Buddy with respect and professionalism.'],
      donts: ["Don't assign security or licensed professional duties.", "Don't ask the Buddy to handle large amounts of cash or valuables.", "Don't request unsafe or inappropriate tasks.", "Don't force the Buddy to work beyond the booked duration without extending the booking."],
    },
  },
  {
    name: 'Custom Task Request', price: 199, sort_order: 7, duration_minutes: 60,
    description: "Can't find the service you need? Create a Custom Task Request by describing your requirement. If it's safe, legal, and within the Buddy's capabilities, we'll match you with the right person to help.",
    included: ['Describe your task clearly with complete details', 'Mention the location, expected duration, and special requirements', 'We match you with the right Buddy for the job'],
    dos_and_donts: {
      dos: ['Describe your task clearly with complete details.', 'Mention the location, expected duration, and special requirements.', 'Book only legal, safe, and reasonable tasks.', 'Be available for clarification if required.'],
      donts: ["Don't request illegal, unethical, or unsafe activities.", "Don't request licensed professional work (medical, legal, electrical, plumbing, etc.) under this category.", "Don't ask the Buddy to spend personal money unless pre-approved through the platform.", "Don't request transportation of illegal, hazardous, or high-value items."],
    },
  },
].map(s => ({ duration: 'Per Task', ...s }));

async function ensureCategory({ name, slug }) {
  const { data: existing, error: selErr } = await supabase.from('categories').select('id, name').eq('slug', slug).maybeSingle();
  if (selErr) throw new Error(`categories select failed: ${selErr.message}`);
  if (existing) {
    console.log(`✓ Category exists: ${name} (${existing.id})`);
    return existing.id;
  }
  const { data, error } = await supabase.from('categories').insert({ name, slug }).select('id').single();
  if (error) throw new Error(`categories insert failed for ${name}: ${error.message}`);
  console.log(`+ Category created: ${name} (${data.id})`);
  return data.id;
}

/**
 * The live DB has no dos_and_donts column, so Do's are stored in `included`
 * and Don'ts in `not_included` — the detail page labels them "Do's / Don'ts"
 * for Companion & Helping Buddy services.
 */
function toRow(categoryId, svc) {
  return {
    category_id: categoryId,
    name: svc.name,
    description: svc.description,
    price: svc.price,
    duration: svc.duration,
    duration_minutes: svc.duration_minutes,
    sort_order: svc.sort_order,
    included: svc.dos_and_donts.dos,
    not_included: svc.dos_and_donts.donts,
  };
}

async function ensureService(categoryId, svc) {
  const { data: existing, error: selErr } = await supabase.from('services').select('id').eq('category_id', categoryId).eq('name', svc.name).maybeSingle();
  if (selErr) throw new Error(`services select failed: ${selErr.message}`);
  const row = toRow(categoryId, svc);
  if (existing) {
    const { error } = await supabase.from('services').update(row).eq('id', existing.id);
    if (error) throw new Error(`services update failed for ${svc.name}: ${error.message}`);
    console.log(`  ✓ Service updated: ${svc.name}`);
    return;
  }
  const { error } = await supabase.from('services').insert(row);
  if (error) throw new Error(`services insert failed for ${svc.name}: ${error.message}`);
  console.log(`  + Service created: ${svc.name}`);
}

(async () => {
  try {
    const companionId = await ensureCategory(CATEGORIES[0]);
    for (const svc of COMPANION_SERVICES) await ensureService(companionId, svc);

    const buddyId = await ensureCategory(CATEGORIES[1]);
    for (const svc of BUDDY_SERVICES) await ensureService(buddyId, svc);

    console.log('\nDone. Verify at /services?cat=companion and /services?cat=helping-buddy');
  } catch (err) {
    console.error('\nSeed failed:', err.message);
    process.exit(1);
  }
})();
