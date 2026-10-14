import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

const SERVICEABLE_AREAS = [
  { name: 'Delhi', city: 'Delhi', is_active: true },
  { name: 'Noida', city: 'Noida', is_active: true },
  { name: 'Greater Noida', city: 'Greater Noida', is_active: true },
  { name: 'Ghaziabad', city: 'Ghaziabad', is_active: true },
  { name: 'Greater Noida West', city: 'Greater Noida West', is_active: true },
];

async function seed() {
  console.log('Seeding service areas...');
  const { error } = await supabaseAdmin.from('service_areas').upsert(SERVICEABLE_AREAS, { onConflict: 'name' });
  if (error) {
    console.error('Seed failed:', error);
  } else {
    console.log('Successfully seeded service areas!');
  }
}

seed();
