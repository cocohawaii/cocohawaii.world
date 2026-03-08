import { NextRequest, NextResponse } from 'next/server';

// Test the API Keys you've generated
// These should be REST API keys (not IST tokens)
// Format: They don't start with "IST."

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '54942d63-ccfb-4be3-9a63-9cdf74dca14a';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '1510fbf9-5839-46ae-a724-04b3460c1057';

export async function GET(request: NextRequest) {
  const results: any = {
    currentApiKey: WIX_API_KEY ? `${WIX_API_KEY.substring(0, 20)}...` : 'NOT SET',
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'IST Token (wrong!)' : WIX_API_KEY ? 'API Key (good!)' : 'Missing',
    siteId: WIX_SITE_ID,
    accountId: WIX_ACCOUNT_ID,
    tests: [],
  };

  if (!WIX_API_KEY) {
    return NextResponse.json({
      ...results,
      error: 'No API Key found in environment variables',
      instruction: 'Copy one of your API Keys from the dashboard and add it to Vercel as NEXT_PUBLIC_WIX_API_KEY',
    });
  }

  const collectionName = 'CocoHawaiiExoticHats';
  const baseUrl = 'https://www.wixapis.com/data/v1';
  
  // Test 1: List all collections
  try {
    const listUrl = `${baseUrl}/collections`;
    const response = await fetch(listUrl, {
      headers: {
        'Authorization': `Bearer ${WIX_API_KEY}`, // API Keys use Bearer
        'wix-site-id': WIX_SITE_ID,
        'wix-account-id': WIX_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const text = await response.text();
    let data: any;
    try {
      data = JSON.parse(text);
    } catch {
      data = { raw: text.substring(0, 500) };
    }

    results.tests.push({
      test: 'List Collections',
      url: listUrl,
      status: response.status,
      success: response.ok,
      hasCollections: response.ok && data.collections && Array.isArray(data.collections),
      collectionCount: data.collections?.length || 0,
      collections: data.collections || [],
      data: response.ok ? data : { error: data },
    });
  } catch (error: any) {
    results.tests.push({
      test: 'List Collections',
      error: error.message,
    });
  }

  // Test 2: Query the specific collection
  try {
    const queryUrl = `${baseUrl}/collections/${encodeURIComponent(collectionName)}/items?limit=10`;
    
    // Try different authentication headers
    const authMethods = [
      { name: 'Bearer Token', header: `Bearer ${WIX_API_KEY}` },
      { name: 'Direct Token', header: WIX_API_KEY },
    ];

    for (const method of authMethods) {
      try {
        const response = await fetch(queryUrl, {
          headers: {
            'Authorization': method.header,
            'wix-site-id': WIX_SITE_ID,
            'wix-account-id': WIX_ACCOUNT_ID,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
        });

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          data = { raw: text.substring(0, 500) };
        }

        const hasItems = response.ok && data.items && Array.isArray(data.items) && data.items.length > 0;

        results.tests.push({
          test: `Query Collection "${collectionName}" (${method.name})`,
          url: queryUrl,
          status: response.status,
          success: response.ok,
          hasItems,
          itemCount: data.items?.length || 0,
          sampleItem: hasItems ? data.items[0] : null,
          data: response.ok ? (hasItems ? { items: data.items, total: data.totalCount } : data) : { error: data },
        });

        if (hasItems) {
          results.workingMethod = method.name;
          results.workingHeader = method.header;
          break;
        }
      } catch (error: any) {
        results.tests.push({
          test: `Query Collection "${collectionName}" (${method.name})`,
          error: error.message,
        });
      }
    }
  } catch (error: any) {
    results.tests.push({
      test: 'Query Collection',
      error: error.message,
    });
  }

  // Diagnosis
  if (!results.workingMethod) {
    results.diagnosis = {
      issue: 'API Key still returns 404',
      possibleCauses: [
        'API Key might not have Data Collections permissions',
        'API Key might be for a different site',
        'Site ID might be incorrect',
        'Collection name might be different in database',
      ],
      nextSteps: [
        'Check API Key permissions in dashboard - ensure "Data Collections" → "Read" is enabled',
        'Verify Site ID matches the site where collection exists',
        'Try using the full API Key token (copy from "Coco Hawaii", "Manage CH Website", or "Coco Hawaii Site")',
      ],
    };
  }

  return NextResponse.json(results);
}
