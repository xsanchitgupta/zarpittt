import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Supabase credentials missing! Check your .env file or Vercel environment variables.');
}

// Create a single, stable Supabase client instance.
// IMPORTANT: Do NOT override global fetch with `cache: 'no-store'` — it causes
// request hangs and timeouts on Vercel Edge/Serverless. Next.js 14+ handles
// caching at the route level, not at the fetch level.
export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

export default supabase;
