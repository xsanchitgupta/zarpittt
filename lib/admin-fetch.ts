import supabase from './supabase';

/**
 * A wrapper around native fetch that automatically injects the user's Supabase JWT 
 * as an Authorization header. This is required for accessing secured Admin API routes.
 */
export async function adminFetch(input: RequestInfo | URL, init?: RequestInit): Promise<Response> {
  const { data: { session } } = await supabase.auth.getSession();
  
  const headers = new Headers(init?.headers || {});
  
  if (session?.access_token) {
    headers.set('Authorization', `Bearer ${session.access_token}`);
  } else {
    console.warn('[adminFetch] No active session found. Request will likely fail.');
  }

  return fetch(input, {
    ...init,
    headers,
  });
}
