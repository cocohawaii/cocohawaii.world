import { NextRequest, NextResponse } from 'next/server';

const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || 'c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6';
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '54942d63-ccfb-4be3-9a63-9cdf74dca14a';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET || ''; // Server-side only

export async function GET(request: NextRequest) {
  const results: any = {
    clientId: WIX_CLIENT_ID,
    siteId: WIX_SITE_ID,
    hasApiKey: !!WIX_API_KEY,
    hasClientSecret: !!WIX_CLIENT_SECRET,
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token (wrong!)' : WIX_API_KEY ? 'API Key (good!)' : 'Missing',
    recommendations: [],
    nextSteps: [],
  };

  // Check what we have
  if (!WIX_API_KEY && !WIX_CLIENT_SECRET) {
    results.error = 'Missing both API Key and Client Secret';
    results.recommendations = [
      'Go to Wix Dashboard → Headless Settings → Click "Coco Hawaii" client',
      'Look for "API Keys" section and generate one',
      'OR look for "Client Secret" or "Secrets" section',
      'Copy the token/secret and add to Vercel',
    ];
    results.nextSteps = [
      '1. Find API Key or Client Secret in Headless Settings',
      '2. Add to Vercel environment variables',
      '3. Redeploy',
    ];
  } else if (WIX_API_KEY.startsWith('IST.')) {
    results.error = 'You are using IST token instead of API Key';
    results.recommendations = [
      'IST tokens are for Wix Apps, not Headless projects',
      'You need to generate an API Key from Headless Settings',
      'Go to: Headless Settings → API Keys → Generate',
    ];
  } else if (WIX_CLIENT_SECRET) {
    results.recommendation = 'You have Client Secret - we can use OAuth Client Credentials flow';
    results.nextSteps = [
      '1. Make sure WIX_CLIENT_SECRET is set in Vercel (server-side only)',
      '2. The code will automatically use OAuth flow',
      '3. Test at /api/test-oauth-token',
    ];
  } else if (WIX_API_KEY) {
    results.recommendation = 'You have API Key - this should work!';
    results.nextSteps = [
      '1. Verify API Key has "Data Collections" permission',
      '2. Test at /api/test-api-keys',
      '3. Check /debug page',
    ];
  }

  return NextResponse.json(results);
}
