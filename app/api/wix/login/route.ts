import { NextRequest, NextResponse } from 'next/server';

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID || process.env.NEXT_PUBLIC_WIX_CLIENT_ID || 'c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6';
const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'http://localhost:3001/api/wix/callback';
const WIX_SITE_ID = process.env.WIX_SITE_ID || process.env.NEXT_PUBLIC_WIX_SITE_ID || '54942d63-ccfb-4be3-9a63-9cdf74dca14a';

export async function GET(request: NextRequest) {
  // Generate state for CSRF protection
  const state = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Store state in a cookie
  // Use sameSite: 'none' and secure: true for cross-domain redirects
  const response = NextResponse.redirect(getWixOAuthUrl(state));
  response.cookies.set('wix_oauth_state', state, {
    httpOnly: true,
    secure: true, // Always use secure for OAuth (works for both http and https)
    sameSite: 'lax', // 'lax' allows the cookie to be sent on redirects
    maxAge: 600, // 10 minutes
    path: '/', // Ensure cookie is available site-wide
  });

  console.log('OAuth Login - State generated:', state);
  return response;
}

function getWixOAuthUrl(state: string): string {
  const params = new URLSearchParams({
    client_id: WIX_CLIENT_ID,
    redirect_uri: WIX_REDIRECT_URI,
    response_type: 'code',
    scope: 'wix-data.read wix-sites.read', // Permissions needed for CMS access
    state: state,
    ...(WIX_SITE_ID && { site_id: WIX_SITE_ID }),
  });

  return `https://www.wix.com/oauth/authorize?${params.toString()}`;
}
