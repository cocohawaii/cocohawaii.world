/**
 * Supabase browser client.
 * Use in Client Components only.
 * Uses anon key - safe to expose.
 * Cookie options ensure session works on localhost (HTTP).
 */
import { createBrowserClient } from '@supabase/ssr';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';

export function createClient() {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createBrowserClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: supabaseCookieOptions,
  });
}
