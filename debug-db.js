const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function run() {
  const { data, error } = await supabase
    .from('services')
    .select('id, name, sort_order, image_url')
    .order('sort_order', { ascending: true });

  if (error) {
    console.error('Error fetching services:', error.message);
    return;
  }

  console.log('--- Top 10 Services in DB ---');
  data.slice(0, 10).forEach((s, i) => {
    console.log(`${i+1}. ${s.name} (ID: ${s.id}) | Order: ${s.sort_order} | Image: ${s.image_url || 'NULL'}`);
  });
}

run();
