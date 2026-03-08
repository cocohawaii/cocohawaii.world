// Helper to get OAuth access token from cookies (server-side)
import { cookies } from 'next/headers';

/**
 * Get the OAuth access token from cookies
 * This is called server-side only
 */
export async function getOAuthAccessToken(): Promise<string | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get('wix_access_token')?.value;
    return token || null;
  } catch (error) {
    // If cookies() fails (e.g., in middleware), return null
    return null;
  }
}

/**
 * Check if user has authenticated via OAuth
 */
export async function hasOAuthToken(): Promise<boolean> {
  const token = await getOAuthAccessToken();
  return !!token;
}
