import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function listTables() {
  const { data, error } = await supabaseAdmin.rpc('get_tables'); // This might not work if RPC is not defined
  if (error) {
    // Fallback: try to select from a common table
    console.log('Error listing tables via RPC, trying manual check...');
    const tables = ['profiles', 'categories', 'services', 'bookings', 'service_areas', 'site_settings', 'testimonials', 'system_settings'];
    for (const table of tables) {
      const { error: tError } = await supabaseAdmin.from(table).select('count').limit(1);
      console.log(`${table}: ${tError ? 'MISSING (' + tError.message + ')' : 'EXISTS'}`);
    }
  } else {
    console.log(data);
  }
}

listTables();
