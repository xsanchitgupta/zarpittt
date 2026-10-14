'use client';
import supabase from '@/lib/supabase';
import { parseContent } from '@/lib/content';

/* Client-side CMS content fetch — system_settings has public-read RLS.
   Results are cached per key for the session to avoid repeat queries. */

const cache = new Map<string, string | null>();
const inflight = new Map<string, Promise<string | null>>();

export async function fetchContentRaw(key: string): Promise<string | null> {
  if (cache.has(key)) return cache.get(key)!;
  if (inflight.has(key)) return inflight.get(key)!;

  const promise = (async () => {
    try {
      const { data, error } = await supabase
        .from('system_settings')
        .select('value')
        .eq('key', key)
        .maybeSingle();
      const value = error ? null : (data?.value ?? null);
      cache.set(key, value);
      return value;
    } catch {
      cache.set(key, null);
      return null;
    } finally {
      inflight.delete(key);
    }
  })();

  inflight.set(key, promise);
  return promise;
}

export async function fetchContent<T>(key: string, defaults: T): Promise<T> {
  const raw = await fetchContentRaw(key);
  return parseContent(defaults, raw);
}
