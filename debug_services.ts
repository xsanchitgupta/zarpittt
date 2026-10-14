import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function debug() {
  const { data: services } = await supabaseAdmin.from('services').select('id, name');
  console.log('--- SERVICES IN DB ---');
  console.log(JSON.stringify(services, null, 2));

  const { data: providers } = await supabaseAdmin.from('provider_profiles').select('user_id, services_offered');
  console.log('--- PROVIDER SERVICES ---');
  console.log(JSON.stringify(providers, null, 2));
}

debug();
