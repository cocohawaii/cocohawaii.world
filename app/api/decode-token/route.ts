import { NextRequest, NextResponse } from 'next/server';

const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    tokenType: WIX_API_KEY.startsWith('IST.') ? 'IST Token' : 'API Key',
    decoded: null,
    expectedSiteId: WIX_SITE_ID,
  };

  if (WIX_API_KEY.startsWith('IST.')) {
    try {
      const parts = WIX_API_KEY.split('.');
      if (parts.length >= 2) {
        // Decode the payload (second part)
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        results.decoded = payload;
        
        // Extract site/account info
        if (payload.data) {
          results.tokenInfo = {
            tokenId: payload.data.id,
            identityType: payload.data.identity?.type,
            identityId: payload.data.identity?.id,
            tenantType: payload.data.tenant?.type,
            tenantId: payload.data.tenant?.id, // This should be the Account ID
            issuedAt: new Date(payload.iat * 1000).toISOString(),
          };
          
          // Check if tenant ID matches account ID
          results.matchesAccount = payload.data.tenant?.id === process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID;
        }
      }
    } catch (e: any) {
      results.decodeError = e.message;
    }
  }

  // Test if token can access the site
  try {
    const siteUrl = `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`;
    const response = await fetch(siteUrl, {
      headers: {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    results.siteAccessTest = {
      status: response.status,
      success: response.ok,
      response: responseText.substring(0, 200),
    };
  } catch (error: any) {
    results.siteAccessTest = {
      error: error.message,
    };
  }

  return NextResponse.json(results);
}

