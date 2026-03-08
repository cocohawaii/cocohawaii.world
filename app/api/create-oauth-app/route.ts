import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '54942d63-ccfb-4be3-9a63-9cdf74dca14a';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '1510fbf9-5839-46ae-a724-04b3460c1057';

export async function POST(request: NextRequest) {
  const results: any = {
    hasApiKey: !!WIX_API_KEY,
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token (wrong!)' : WIX_API_KEY ? 'API Key (good!)' : 'Missing',
    siteId: WIX_SITE_ID,
    accountId: WIX_ACCOUNT_ID,
    oauthApp: null,
    error: null,
  };

  if (!WIX_API_KEY) {
    return NextResponse.json({
      ...results,
      error: 'Missing API Key. You need to add your API Key (not IST token) to Vercel as NEXT_PUBLIC_WIX_API_KEY',
    }, { status: 400 });
  }

  if (WIX_API_KEY.startsWith('IST.')) {
    return NextResponse.json({
      ...results,
      error: 'You are using an IST token. You need to use an API Key from your Wix dashboard (API Keys section). IST tokens cannot create OAuth apps.',
      instruction: 'Go to Wix dashboard → API Keys → Copy one of your API Key tokens → Add to Vercel as NEXT_PUBLIC_WIX_API_KEY',
    }, { status: 400 });
  }

  try {
    // Create OAuth app
    const createUrl = 'https://www.wixapis.com/oauth-app/v1/oauth-apps';
    
    const headers: Record<string, string> = {
      'Authorization': `Bearer ${WIX_API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (WIX_SITE_ID) {
      headers['wix-site-id'] = WIX_SITE_ID;
    }

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    const body = {
      oAuthApp: {
        name: 'Coco Hawaii Website',
        description: 'OAuth app for Coco Hawaii headless website',
        applicationType: 'WEB_APP',
      },
    };

    const response = await fetch(createUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify(body),
      cache: 'no-store',
    });

    const responseText = await response.text();
    let data: any;
    try {
      data = JSON.parse(responseText);
    } catch {
      data = { raw: responseText };
    }

    if (response.ok && data.oAuthApp) {
      results.oauthApp = data.oAuthApp;
      results.success = true;
      results.message = 'OAuth app created successfully!';
      results.nextSteps = [
        'The OAuth app has been created',
        'You may need to configure redirect URIs if needed',
        'Use the Client ID and Client Secret for OAuth authentication',
      ];
    } else {
      results.error = {
        status: response.status,
        statusText: response.statusText,
        data: data,
      };
      results.message = 'Failed to create OAuth app';
    }
  } catch (error: any) {
    results.error = {
      message: error.message,
      name: error.name,
    };
  }

  return NextResponse.json(results);
}

export async function GET(request: NextRequest) {
  return NextResponse.json({
    info: 'Use POST to create an OAuth app',
    method: 'POST',
    endpoint: '/api/create-oauth-app',
    body: {
      note: 'No body needed - uses environment variables',
    },
    requirements: [
      'NEXT_PUBLIC_WIX_API_KEY must be set (API Key, not IST token)',
      'NEXT_PUBLIC_WIX_SITE_ID must be set',
    ],
  });
}
