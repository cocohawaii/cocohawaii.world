/**
 * Supabase server client for Server Components and Route Handlers.
 * Uses anon key with cookie-based session handling.
 */
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { supabaseCookieOptions } from '@/lib/supabase/cookie-options';

export async function createClient() {
  const cookieStore = await cookies();

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase env vars: NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY'
    );
  }

  return createServerClient(supabaseUrl, supabaseAnonKey, {
    cookieOptions: supabaseCookieOptions,
    cookies: {
      getAll() {
        return cookieStore.getAll();
      },
      setAll(cookiesToSet) {
        try {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, { ...options, ...supabaseCookieOptions })
          );
        } catch {
          // Called from Server Component - ignore
        }
      },
    },
  });
}
