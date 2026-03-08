import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    credentials: {
      siteId: WIX_SITE_ID,
      accountId: WIX_ACCOUNT_ID,
      hasApiKey: !!WIX_API_KEY,
      apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token' : 'API Key',
    },
    tests: [],
  };

  // Test 1: Can we access ANY endpoint?
  const endpoints = [
    {
      name: 'List Collections',
      url: 'https://www.wixapis.com/data/v1/collections',
    },
    {
      name: 'Get Site Info',
      url: `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`,
    },
    {
      name: 'Query Collection',
      url: `https://www.wixapis.com/data/v1/collections/CocoHawaiiExoticHats/items?limit=1`,
    },
  ];

  for (const endpoint of endpoints) {
    // Try with IST token format
    try {
      const response = await fetch(endpoint.url, {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID,
          'wix-account-id': WIX_ACCOUNT_ID,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText.substring(0, 300) };
      }

      results.tests.push({
        endpoint: endpoint.name,
        url: endpoint.url,
        status: response.status,
        success: response.ok,
        hasData: response.ok && responseData,
        response: response.ok ? responseData : { error: responseData },
      });
    } catch (error: any) {
      results.tests.push({
        endpoint: endpoint.name,
        error: error.message,
      });
    }
  }

  // Summary
  const successCount = results.tests.filter((t: any) => t.success).length;
  results.summary = {
    totalTests: results.tests.length,
    successful: successCount,
    allFailed: successCount === 0,
  };

  if (successCount === 0) {
    results.recommendation = 'All API calls failed. The IST token is likely invalid, expired, or for a different site. You may need to use an API Key instead (the one starting with RYo4eOGheJ).';
  }

  return NextResponse.json(results);
}

