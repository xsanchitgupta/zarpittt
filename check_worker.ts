import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config();

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
);

async function checkSalaried() {
  const { data, error } = await supabaseAdmin.from('provider_profiles').select('user_id, worker_type, verification_status, is_online, profiles(email, full_name)');
  console.log(JSON.stringify(data, null, 2));
}

checkSalaried();
