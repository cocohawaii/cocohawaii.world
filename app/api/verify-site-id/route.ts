import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    siteId: WIX_SITE_ID,
    accountId: WIX_ACCOUNT_ID,
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'Instance Token (IST)' : 'API Key',
    tests: [],
  };

  // Try to verify the Site ID by querying site info
  const siteInfoEndpoints = [
    `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`,
    `https://www.wixapis.com/site/v1/sites/${WIX_SITE_ID}`,
    `https://www.wixapis.com/sites/v1/sites/${WIX_SITE_ID}`,
  ];

  for (const url of siteInfoEndpoints) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': WIX_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText.substring(0, 200) };
      }

      results.tests.push({
        test: 'Verify Site ID',
        url,
        status: response.status,
        success: response.ok,
        response: responseData,
      });

      if (response.ok) {
        results.siteVerified = true;
        results.siteInfo = responseData;
      }
    } catch (error: any) {
      results.tests.push({
        test: 'Verify Site ID',
        url,
        error: error.message,
      });
    }
  }

  // Try querying with account ID instead
  if (WIX_ACCOUNT_ID) {
    try {
      const url = `https://www.wixapis.com/data/v1/collections/CocoHawaiiExoticHats/items?limit=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-account-id': WIX_ACCOUNT_ID, // Try account ID instead of site ID
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      results.tests.push({
        test: 'Query with Account ID instead of Site ID',
        url,
        status: response.status,
        success: response.ok,
        response: responseText.substring(0, 200),
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Query with Account ID',
        error: error.message,
      });
    }
  }

  // Try without Site ID header (some APIs don't need it)
  try {
    const url = `https://www.wixapis.com/data/v1/collections/CocoHawaiiExoticHats/items?limit=1`;
    const response = await fetch(url, {
      headers: {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    results.tests.push({
      test: 'Query without Site ID header',
      url,
      status: response.status,
      success: response.ok,
      response: responseText.substring(0, 200),
    });
  } catch (error: any) {
    results.tests.push({
      test: 'Query without Site ID',
      error: error.message,
    });
  }

  return NextResponse.json(results);
}

