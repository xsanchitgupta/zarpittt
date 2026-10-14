import { createClient } from '@supabase/supabase-js';

// Server-side supabase client — used in Server Components and Route Handlers
// Uses the service role key to bypass RLS for read-only data fetching
export function createServerSupabaseClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}
