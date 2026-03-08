import { NextRequest, NextResponse } from 'next/server';
import { getOAuthAccessToken } from '@/lib/wix-oauth-token';

const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';
const WIX_CLIENT_SECRET = process.env.WIX_CLIENT_SECRET || '';

export async function GET(request: NextRequest) {
  const results: any = {
    hasClientId: !!WIX_CLIENT_ID,
    hasClientSecret: !!WIX_CLIENT_SECRET,
    clientId: WIX_CLIENT_ID || 'NOT SET',
    clientSecret: WIX_CLIENT_SECRET ? '***SET***' : 'NOT SET',
    oauthTest: null,
  };

  if (!WIX_CLIENT_ID || !WIX_CLIENT_SECRET) {
    return NextResponse.json({
      ...results,
      error: 'Missing WIX_CLIENT_ID or WIX_CLIENT_SECRET. You need to get your App Secret Key from Wix Dev Center.',
      instructions: [
        '1. Go to https://dev.wix.com/',
        '2. Find your app (Client ID: ' + WIX_CLIENT_ID + ')',
        '3. Go to App Settings → Secrets',
        '4. Copy your App Secret Key (Client Secret)',
        '5. Add it to Vercel as WIX_CLIENT_SECRET (NOT NEXT_PUBLIC)',
      ],
    });
  }

  try {
    // Try to get OAuth token
    const accessToken = await getOAuthAccessToken();

    if (accessToken) {
      results.oauthTest = {
        success: true,
        tokenPrefix: accessToken.substring(0, 20) + '...',
        tokenLength: accessToken.length,
      };

      // Try to use the token to fetch data
      const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
      const testUrl = `https://www.wixapis.com/data/v1/collections/CocoHawaiiExoticHats/items?limit=1`;

      try {
        const dataResponse = await fetch(testUrl, {
          headers: {
            'Authorization': `Bearer ${accessToken}`,
            'wix-site-id': WIX_SITE_ID,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        const dataText = await dataResponse.text();
        let data: any;
        try {
          data = JSON.parse(dataText);
        } catch {
          data = { raw: dataText };
        }

        results.dataTest = {
          status: dataResponse.status,
          success: dataResponse.ok,
          hasItems: dataResponse.ok && data.items && data.items.length > 0,
          data: dataResponse.ok ? data : { error: data },
        };
      } catch (error: any) {
        results.dataTest = {
          error: error.message,
        };
      }
    } else {
      results.oauthTest = {
        success: false,
        error: 'Failed to obtain OAuth access token',
      };
    }
  } catch (error: any) {
    results.oauthTest = {
      success: false,
      error: error.message,
    };
  }

  return NextResponse.json(results);
}
