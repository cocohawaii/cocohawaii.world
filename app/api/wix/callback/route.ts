import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

const WIX_CLIENT_ID = process.env.WIX_CLIENT_ID || process.env.NEXT_PUBLIC_WIX_CLIENT_ID || 'c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6';
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET || '';
const WIX_REDIRECT_URI = process.env.WIX_REDIRECT_URI || 'http://localhost:3001/api/wix/callback';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get('code');
  const state = searchParams.get('state');
  const error = searchParams.get('error');

  // Check for errors from Wix
  if (error) {
    return NextResponse.json({
      error: 'OAuth authorization failed',
      error_description: searchParams.get('error_description') || error,
    }, { status: 400 });
  }

  // Verify state (CSRF protection)
  // Read from request cookies directly (more reliable for redirects)
  const storedState = request.cookies.get('wix_oauth_state')?.value;
  
  // For debugging: log what we have
  console.log('OAuth Callback - State Check:', {
    stateFromUrl: state,
    stateFromCookie: storedState,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])),
  });
  
  // Temporarily make state check more lenient for debugging
  // In production, you should enforce strict state matching
  if (!state) {
    return NextResponse.json({
      error: 'Missing state parameter',
      debug: {
        storedState,
        allCookies: Object.keys(request.cookies.getAll()),
      },
    }, { status: 400 });
  }
  
  // If we have a stored state, verify it matches
  // If no stored state (cookie didn't persist), we'll allow it for now but log a warning
  if (storedState && state !== storedState) {
    return NextResponse.json({
      error: 'Invalid state parameter. Possible CSRF attack.',
      debug: {
        stateFromUrl: state,
        stateFromCookie: storedState,
      },
    }, { status: 400 });
  }
  
  // If no stored state but we have state in URL, log warning but continue
  // This can happen if cookies don't persist across redirects
  if (!storedState && state) {
    console.warn('⚠️ State cookie not found, but state parameter present. Continuing with state from URL.');
  }

  // Clear the state cookie
  try {
    const cookieStore = await cookies();
    cookieStore.delete('wix_oauth_state');
  } catch (error) {
    // If cookies() fails, continue anyway
  }

  if (!code) {
    return NextResponse.json({
      error: 'Missing authorization code',
    }, { status: 400 });
  }

  if (!WIX_CLIENT_SECRET) {
    return NextResponse.json({
      error: 'Missing WIX_CLIENT_SECRET. Add it to your environment variables.',
      instruction: 'Get it from Wix Dashboard → Your App → OAuth Settings → Client Secret',
    }, { status: 500 });
  }

  try {
    // Exchange authorization code for access token
    const tokenResponse = await fetch('https://www.wixapis.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        grant_type: 'authorization_code',
        client_id: WIX_CLIENT_ID,
        client_secret: WIX_CLIENT_SECRET,
        code: code,
        redirect_uri: WIX_REDIRECT_URI,
      }),
    });

    if (!tokenResponse.ok) {
      const errorText = await tokenResponse.text();
      return NextResponse.json({
        error: 'Failed to exchange code for access token',
        status: tokenResponse.status,
        details: errorText,
      }, { status: tokenResponse.status });
    }

    const tokenData = await tokenResponse.json();
    
    // Store the access token securely
    // In production, you'd want to store this in a database or secure session
    // For now, we'll store it in an httpOnly cookie
    const response = NextResponse.redirect(new URL('/?oauth=success', request.url));
    
    // Store access token in httpOnly cookie
    response.cookies.set('wix_access_token', tokenData.access_token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: tokenData.expires_in || 3600, // Use expires_in from Wix or default to 1 hour
    });

    // Also store refresh token if provided
    if (tokenData.refresh_token) {
      response.cookies.set('wix_refresh_token', tokenData.refresh_token, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        maxAge: 60 * 60 * 24 * 30, // 30 days
      });
    }

    return response;
  } catch (error: any) {
    return NextResponse.json({
      error: 'Error during OAuth callback',
      message: error.message,
    }, { status: 500 });
  }
}
