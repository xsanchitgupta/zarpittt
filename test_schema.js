import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const supabase = createClient(supabaseUrl, supabaseKey);

async function test() {
  const { data, error } = await supabase.from('bookings').select('*, professional:professionals(*)').limit(1);
  console.log("With professionals:", { data, error });

  const { data: d2, error: e2 } = await supabase.from('bookings').select('*, profile:profiles(*)').limit(1);
  console.log("With profiles:", { d2, e2 });
}
test();
