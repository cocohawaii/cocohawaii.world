import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '54942d63-ccfb-4be3-9a63-9cdf74dca14a';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '1510fbf9-5839-46ae-a724-04b3460c1057';

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const oAuthAppId = searchParams.get('id');

  const results: any = {
    hasApiKey: !!WIX_API_KEY,
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token (wrong!)' : WIX_API_KEY ? 'API Key (good!)' : 'Missing',
    siteId: WIX_SITE_ID,
    accountId: WIX_ACCOUNT_ID,
    oAuthAppId: oAuthAppId,
    oauthApp: null,
    error: null,
  };

  if (!oAuthAppId) {
    return NextResponse.json({
      ...results,
      error: 'Missing oAuthAppId parameter. Use ?id=YOUR_OAUTH_APP_ID',
    }, { status: 400 });
  }

  if (!WIX_API_KEY) {
    return NextResponse.json({
      ...results,
      error: 'Missing API Key. You need to add your API Key (not IST token) to Vercel as NEXT_PUBLIC_WIX_API_KEY',
    }, { status: 400 });
  }

  if (WIX_API_KEY.startsWith('IST.')) {
    return NextResponse.json({
      ...results,
      error: 'You are using an IST token. You need to use an API Key from your Wix dashboard (API Keys section). IST tokens cannot get OAuth apps.',
      instruction: 'Go to Wix dashboard → API Keys → Copy one of your API Key tokens → Add to Vercel as NEXT_PUBLIC_WIX_API_KEY',
    }, { status: 400 });
  }

  try {
    // Get OAuth app by ID
    const getUrl = `https://www.wixapis.com/oauth-app/v1/oauth-apps/${oAuthAppId}`;
    
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

    const response = await fetch(getUrl, {
      method: 'GET',
      headers,
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
      results.message = 'OAuth app retrieved successfully';
    } else {
      results.error = {
        status: response.status,
        statusText: response.statusText,
        data: data,
      };
      results.message = 'Failed to get OAuth app';
    }
  } catch (error: any) {
    results.error = {
      message: error.message,
      name: error.name,
    };
  }

  return NextResponse.json(results);
}
