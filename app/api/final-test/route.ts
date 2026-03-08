import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';
const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    credentials: {
      siteId: WIX_SITE_ID,
      accountId: WIX_ACCOUNT_ID,
      clientId: WIX_CLIENT_ID,
      hasApiKey: !!WIX_API_KEY,
      apiKeyType: WIX_API_KEY?.startsWith('IST.') ? 'IST Token' : 'API Key',
    },
    tests: [],
    recommendation: null,
  };

  const collectionName = 'CocoHawaiiExoticHats';

  // CRITICAL TEST: Try to verify the token works at all by checking site info
  try {
    const siteInfoUrl = `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`;
    const siteResponse = await fetch(siteInfoUrl, {
      headers: {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      },
    });

    const siteResponseText = await siteResponse.text();
    let siteData;
    try {
      siteData = JSON.parse(siteResponseText);
    } catch {
      siteData = { raw: siteResponseText };
    }

    results.tests.push({
      test: 'Verify Site Access',
      url: siteInfoUrl,
      status: siteResponse.status,
      success: siteResponse.ok,
      response: siteResponse.ok ? siteData : { error: siteData },
    });

    if (!siteResponse.ok) {
      results.recommendation = 'IST token cannot access site info. Token may be invalid, expired, or for wrong site. Create a new IST token.';
    }
  } catch (error: any) {
    results.tests.push({
      test: 'Verify Site Access',
      error: error.message,
    });
  }

  // Try the exact API call with all possible combinations
  const testCases: Array<{
    name: string;
    url: string;
    headers: Record<string, string>;
  }> = [
    {
      name: 'Standard Data API',
      url: `https://www.wixapis.com/data/v1/collections/${encodeURIComponent(collectionName)}/items?limit=1`,
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'With Account ID',
      url: `https://www.wixapis.com/data/v1/collections/${encodeURIComponent(collectionName)}/items?limit=1`,
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'wix-account-id': WIX_ACCOUNT_ID || '',
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Bearer token format',
      url: `https://www.wixapis.com/data/v1/collections/${encodeURIComponent(collectionName)}/items?limit=1`,
      headers: {
        'Authorization': `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
    },
  ];

  for (const testCase of testCases) {
    try {
      const response = await fetch(testCase.url, {
        headers: testCase.headers,
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText.substring(0, 500) };
      }

      const hasItems = response.ok && responseData.items && Array.isArray(responseData.items) && responseData.items.length > 0;

      results.tests.push({
        method: testCase.name,
        url: testCase.url,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        hasItems,
        itemCount: responseData.items?.length || 0,
        response: hasItems ? { 
          items: responseData.items,
          total: responseData.totalItems 
        } : responseData,
      });

      if (hasItems) {
        results.workingMethod = testCase.name;
        results.workingUrl = testCase.url;
        results.itemCount = responseData.items.length;
      }

      // If we get a non-404 error, that's progress - it means the endpoint exists
      if (response.status !== 404 && !response.ok) {
        results.recommendation = `Endpoint exists but returned ${response.status}. Check: ${JSON.stringify(responseData)}`;
      }
    } catch (error: any) {
      results.tests.push({
        method: testCase.name,
        error: error.message,
      });
    }
  }

  // Final recommendation
  if (!results.workingMethod) {
    if (results.tests.some((t: any) => t.status === 404)) {
      results.recommendation = results.recommendation || 'All endpoints return 404. Most likely causes: 1) IST token is invalid/expired, 2) IST token was created for different site, 3) IST token lacks Data Collections permissions. SOLUTION: Create a new IST token in Wix Dashboard → Settings → Advanced → API Keys with Data Collections permission for Site ID: ' + WIX_SITE_ID;
    }
  }

  return NextResponse.json(results);
}

