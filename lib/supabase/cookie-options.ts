/**
 * Cookie options for Supabase auth.
 * In development (localhost over HTTP), we must set secure: false
 * so the browser accepts session cookies.
 */
const isDev = process.env.NODE_ENV === 'development';

export const supabaseCookieOptions = isDev
  ? { secure: false, sameSite: 'lax' as const, path: '/' }
  : { sameSite: 'lax' as const, path: '/' };
