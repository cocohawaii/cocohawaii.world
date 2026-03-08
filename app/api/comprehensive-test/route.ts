import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    credentials: {
      siteId: WIX_SITE_ID,
      accountId: WIX_ACCOUNT_ID,
      hasApiKey: !!WIX_API_KEY,
      apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token' : 'API Key',
      apiKeyPreview: WIX_API_KEY ? `${WIX_API_KEY.substring(0, 20)}...` : 'None',
    },
    tests: [],
    recommendations: [],
  };

  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({
      ...results,
      error: 'Missing WIX_API_KEY or WIX_SITE_ID',
    }, { status: 400 });
  }

  const collectionName = 'CocoHawaiiExoticHats';
  const isIST = WIX_API_KEY.startsWith('IST.');

  // Test 1: Try to get site info (most basic test)
  const siteInfoTests = [
    {
      name: 'Sites API v2',
      url: `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`,
    },
    {
      name: 'Sites API v1',
      url: `https://www.wixapis.com/sites/v1/sites/${WIX_SITE_ID}`,
    },
  ];

  for (const test of siteInfoTests) {
    const authHeaders = [
      isIST ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      WIX_API_KEY,
      `Bearer ${WIX_API_KEY}`,
    ];

    for (const authHeader of authHeaders) {
      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'wix-site-id': WIX_SITE_ID,
      };

      if (WIX_ACCOUNT_ID) {
        headers['wix-account-id'] = WIX_ACCOUNT_ID;
      }

      try {
        const response = await fetch(test.url, {
          method: 'GET',
          headers,
        });

        const status = response.status;
        const text = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {}

        results.tests.push({
          test: `Site Info: ${test.name}`,
          authMethod: authHeader.substring(0, 30) + '...',
          url: test.url,
          status,
          success: status === 200,
          hasData: !!data,
          response: data || text.substring(0, 200),
        });

        if (status === 200) {
          results.recommendations.push(`✅ Site info accessible with: ${test.name} using ${authHeader.substring(0, 20)}...`);
        }
      } catch (error: any) {
        results.tests.push({
          test: `Site Info: ${test.name}`,
          authMethod: authHeader.substring(0, 30) + '...',
          url: test.url,
          status: 'ERROR',
          success: false,
          error: error.message,
        });
      }
    }
  }

  // Test 2: Try to list collections
  const listCollectionsTests = [
    'https://www.wixapis.com/data/v1/collections',
    'https://www.wixapis.com/site-data/v1/collections',
    'https://www.wixapis.com/cms/v1/collections',
  ];

  for (const url of listCollectionsTests) {
    const authHeader = isIST ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`;
    const headers: Record<string, string> = {
      'Authorization': authHeader,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_SITE_ID,
    };

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    try {
      const response = await fetch(url, {
        method: 'GET',
        headers,
      });

      const status = response.status;
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      results.tests.push({
        test: 'List Collections',
        url,
        status,
        success: status === 200,
        hasData: !!data,
        collectionCount: data?.collections?.length || data?.items?.length || 0,
        response: data || text.substring(0, 200),
      });

      if (status === 200 && (data?.collections?.length > 0 || data?.items?.length > 0)) {
        results.recommendations.push(`✅ Collections found via: ${url}`);
        if (data.collections) {
          results.recommendations.push(`   Collections: ${data.collections.map((c: any) => c.name || c._id).join(', ')}`);
        }
      }
    } catch (error: any) {
      results.tests.push({
        test: 'List Collections',
        url,
        status: 'ERROR',
        success: false,
        error: error.message,
      });
    }
  }

  // Test 3: Try to query the specific collection
  const collectionTests = [
    {
      name: 'Data API v1',
      baseUrl: 'https://www.wixapis.com/data/v1',
    },
    {
      name: 'Site Data API',
      baseUrl: 'https://www.wixapis.com/site-data/v1',
    },
    {
      name: 'CMS API',
      baseUrl: 'https://www.wixapis.com/cms/v1',
    },
  ];

  for (const test of collectionTests) {
    const url = `${test.baseUrl}/collections/${encodeURIComponent(collectionName)}/items?limit=1`;
    const authHeaders = [
      isIST ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      WIX_API_KEY,
      `Bearer ${WIX_API_KEY}`,
    ];

    for (const authHeader of authHeaders) {
      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'wix-site-id': WIX_SITE_ID,
      };

      if (WIX_ACCOUNT_ID) {
        headers['wix-account-id'] = WIX_ACCOUNT_ID;
      }

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        const status = response.status;
        const text = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {}

        results.tests.push({
          test: `Query Collection: ${test.name}`,
          authMethod: authHeader.substring(0, 30) + '...',
          url,
          status,
          success: status === 200,
          hasData: !!data,
          itemCount: data?.items?.length || data?.data?.length || 0,
          response: data || text.substring(0, 200),
        });

        if (status === 200) {
          results.recommendations.push(`✅ Collection accessible via: ${test.name} using ${authHeader.substring(0, 20)}...`);
        }
      } catch (error: any) {
        results.tests.push({
          test: `Query Collection: ${test.name}`,
          authMethod: authHeader.substring(0, 30) + '...',
          url,
          status: 'ERROR',
          success: false,
          error: error.message,
        });
      }
    }
  }

  // Summary
  const successful = results.tests.filter((t: any) => t.success).length;
  const total = results.tests.length;
  results.summary = {
    totalTests: total,
    successful,
    failed: total - successful,
    successRate: `${Math.round((successful / total) * 100)}%`,
  };

  if (successful === 0) {
    results.recommendations.push('❌ ALL TESTS FAILED');
    results.recommendations.push('The IST token appears to be invalid or for the wrong site.');
    results.recommendations.push('Please try one of the following:');
    results.recommendations.push('1. Create a NEW IST token in Wix Dashboard → Settings → Advanced → API Keys');
    results.recommendations.push('2. Make sure the token is created for Site ID: ' + WIX_SITE_ID);
    results.recommendations.push('3. Enable "Data Collections" permission');
    results.recommendations.push('4. If you have an API Key (starts with letters/numbers, not IST.), try using that instead');
  }

  return NextResponse.json(results);
}

