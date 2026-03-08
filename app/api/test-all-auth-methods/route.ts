import { NextRequest, NextResponse } from 'next/server';

const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  const results: any = {
    timestamp: new Date().toISOString(),
    credentials: {
      clientId: WIX_CLIENT_ID,
      siteId: WIX_SITE_ID,
      accountId: WIX_ACCOUNT_ID,
      hasApiKey: !!WIX_API_KEY,
      apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token' : 'API Key',
      apiKeyPreview: WIX_API_KEY ? `${WIX_API_KEY.substring(0, 30)}...` : 'None',
    },
    tests: [],
    recommendations: [],
  };

  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({
      ...results,
      error: 'Missing required credentials',
    }, { status: 400 });
  }

  const collectionName = 'CocoHawaiiExoticHats';
  const isIST = WIX_API_KEY.startsWith('IST.');

  // Test 1: Try different header formats for IST token
  const authMethods = [
    {
      name: 'IST Token (direct)',
      header: WIX_API_KEY,
      description: 'IST token as-is (standard for IST tokens)',
    },
    {
      name: 'IST Token with Bearer',
      header: `Bearer ${WIX_API_KEY}`,
      description: 'IST token with Bearer prefix (sometimes required)',
    },
    {
      name: 'IST Token with Authorization prefix',
      header: `Authorization: ${WIX_API_KEY}`,
      description: 'IST token with Authorization prefix',
    },
  ];

  // Test basic site access first
  const siteInfoUrl = `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`;
  
  for (const method of authMethods) {
    const headers: Record<string, string> = {
      'Authorization': method.header.includes('Authorization:') 
        ? WIX_API_KEY 
        : method.header,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_SITE_ID,
    };

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    try {
      const response = await fetch(siteInfoUrl, {
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
        test: `Site Info: ${method.name}`,
        description: method.description,
        status,
        success: status === 200,
        hasData: !!data,
        response: data || text.substring(0, 200),
      });

      if (status === 200) {
        results.recommendations.push(`✅ Site accessible with: ${method.name}`);
      }
    } catch (error: any) {
      results.tests.push({
        test: `Site Info: ${method.name}`,
        description: method.description,
        status: 'ERROR',
        success: false,
        error: error.message,
      });
    }
  }

  // Test 2: Try to list collections
  const listCollectionsUrl = 'https://www.wixapis.com/data/v1/collections';
  
  for (const method of authMethods) {
    const headers: Record<string, string> = {
      'Authorization': method.header.includes('Authorization:') 
        ? WIX_API_KEY 
        : method.header,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_SITE_ID,
    };

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    try {
      const response = await fetch(listCollectionsUrl, {
        method: 'GET',
        headers,
      });

      const status = response.status;
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      const collections = data?.collections || data?.items || [];
      
      results.tests.push({
        test: `List Collections: ${method.name}`,
        description: method.description,
        status,
        success: status === 200 && collections.length > 0,
        collectionCount: collections.length,
        collections: collections.map((c: any) => c.name || c._id || 'Unknown'),
        response: data || text.substring(0, 200),
      });

      if (status === 200 && collections.length > 0) {
        results.recommendations.push(`✅ Collections found with: ${method.name}`);
        results.recommendations.push(`   Found ${collections.length} collections: ${collections.map((c: any) => c.name || c._id).join(', ')}`);
      }
    } catch (error: any) {
      results.tests.push({
        test: `List Collections: ${method.name}`,
        description: method.description,
        status: 'ERROR',
        success: false,
        error: error.message,
      });
    }
  }

  // Test 3: Try to query the specific collection
  const collectionUrl = `https://www.wixapis.com/data/v1/collections/${encodeURIComponent(collectionName)}/items?limit=1`;
  
  for (const method of authMethods) {
    const headers: Record<string, string> = {
      'Authorization': method.header.includes('Authorization:') 
        ? WIX_API_KEY 
        : method.header,
      'Content-Type': 'application/json',
      'wix-site-id': WIX_SITE_ID,
    };

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    try {
      const response = await fetch(collectionUrl, {
        method: 'GET',
        headers,
      });

      const status = response.status;
      const text = await response.text();
      let data: any = null;
      try {
        data = JSON.parse(text);
      } catch {}

      const items = data?.items || data?.data || [];
      
      results.tests.push({
        test: `Query Collection "${collectionName}": ${method.name}`,
        description: method.description,
        status,
        success: status === 200,
        itemCount: items.length,
        hasItems: items.length > 0,
        response: data || text.substring(0, 200),
      });

      if (status === 200 && items.length > 0) {
        results.recommendations.push(`✅ Collection "${collectionName}" accessible with: ${method.name}`);
        results.recommendations.push(`   Found ${items.length} items`);
      }
    } catch (error: any) {
      results.tests.push({
        test: `Query Collection "${collectionName}": ${method.name}`,
        description: method.description,
        status: 'ERROR',
        success: false,
        error: error.message,
      });
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
    results.recommendations.push('❌ ALL AUTHENTICATION METHODS FAILED');
    results.recommendations.push('');
    results.recommendations.push('The IST token cannot access any Wix APIs. Possible reasons:');
    results.recommendations.push('1. Token is expired or revoked');
    results.recommendations.push('2. Token was created for a different site');
    results.recommendations.push('3. Token doesn\'t have "Data Collections" permission');
    results.recommendations.push('4. Collection doesn\'t exist in this site');
    results.recommendations.push('');
    results.recommendations.push('SOLUTION:');
    results.recommendations.push('1. Go to Wix Dashboard → Settings → Advanced → API Keys');
    results.recommendations.push('2. Delete the current IST token');
    results.recommendations.push('3. Create a NEW Instance Token');
    results.recommendations.push('4. Make sure to:');
    results.recommendations.push('   - Select site: ' + WIX_SITE_ID);
    results.recommendations.push('   - Enable "Data Collections" → "Read" permission');
    results.recommendations.push('   - Copy the token immediately');
    results.recommendations.push('5. Update .env.local with the new token');
  }

  return NextResponse.json(results);
}

