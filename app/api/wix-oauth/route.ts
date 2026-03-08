import { NextRequest, NextResponse } from 'next/server';

const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  // For server-side headless, we can get an access token using client credentials
  // This is different from user OAuth - it's for server-to-server authentication
  
  const results: any = {
    info: 'OAuth setup for server-side headless',
    steps: [],
  };

  // Step 1: Check if we have the required credentials
  if (!WIX_CLIENT_ID || !WIX_SITE_ID) {
    return NextResponse.json({
      error: 'Missing WIX_CLIENT_ID or WIX_SITE_ID',
      steps: [
        '1. Go to Wix Dashboard → Settings → Advanced → Developer Tools',
        '2. Find your OAuth App Client ID',
        '3. Make sure Site ID is correct',
      ],
    }, { status: 400 });
  }

  // For server-side, we might need to use the OAuth client credentials flow
  // But Wix Headless typically uses IST tokens for server-side
  
  results.steps = [
    'For server-side headless, you have two options:',
    '1. Use IST Token (Instance Token) - Recommended for server-side',
    '   - Go to Settings → Advanced → API Keys',
    '   - Create Instance Token with Data Collections permission',
    '   - Use it directly (no OAuth flow needed)',
    '',
    '2. Use OAuth with Client Credentials (if IST doesn\'t work)',
    '   - Requires implementing OAuth flow',
    '   - More complex but might work if IST tokens are having issues',
  ];

  results.currentSetup = {
    hasClientId: !!WIX_CLIENT_ID,
    hasSiteId: !!WIX_SITE_ID,
    clientId: WIX_CLIENT_ID,
    siteId: WIX_SITE_ID,
  };

  results.recommendation = 'Since IST tokens are returning 404, try creating a NEW IST token. If that doesn\'t work, we can implement OAuth client credentials flow.';

  return NextResponse.json(results);
}

