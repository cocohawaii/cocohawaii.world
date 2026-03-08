import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_METASITE_ID = process.env.NEXT_PUBLIC_WIX_METASITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    siteId: WIX_SITE_ID,
    metasiteId: WIX_METASITE_ID,
    accountId: WIX_ACCOUNT_ID,
    tests: [],
  };

  // Test 1: Try with Metasite ID instead of Site ID
  const siteIdsToTry = [WIX_METASITE_ID, WIX_SITE_ID].filter(Boolean);
  const collectionName = 'CocoHawaiiExoticHats';

  for (const siteId of siteIdsToTry) {
    // Test listing all collections first
    const listUrl = 'https://www.wixapis.com/data/v1/collections';
    
    const headers: Record<string, string> = {
      'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      'Content-Type': 'application/json',
    };

    if (siteId) {
      headers['wix-site-id'] = siteId;
    }

    if (WIX_ACCOUNT_ID) {
      headers['wix-account-id'] = WIX_ACCOUNT_ID;
    }

    try {
      // Try to list collections
      const listResponse = await fetch(listUrl, {
        headers,
        cache: 'no-store',
      });

      const listText = await listResponse.text();
      let listData: any;
      try {
        listData = JSON.parse(listText);
      } catch {
        listData = { raw: listText };
      }

      results.tests.push({
        test: `List Collections with Site ID: ${siteId}`,
        siteId,
        status: listResponse.status,
        success: listResponse.ok,
        data: listResponse.ok ? listData : { error: listData },
      });

      // If listing works, try the specific collection
      if (listResponse.ok) {
        const collectionUrl = `https://www.wixapis.com/data/v1/collections/${encodeURIComponent(collectionName)}/items?limit=5`;
        
        const collectionResponse = await fetch(collectionUrl, {
          headers,
          cache: 'no-store',
        });

        const collectionText = await collectionResponse.text();
        let collectionData: any;
        try {
          collectionData = JSON.parse(collectionText);
        } catch {
          collectionData = { raw: collectionText };
        }

        results.tests.push({
          test: `Query Collection "${collectionName}" with Site ID: ${siteId}`,
          siteId,
          status: collectionResponse.status,
          success: collectionResponse.ok,
          hasItems: collectionResponse.ok && collectionData.items && collectionData.items.length > 0,
          itemCount: collectionData.items?.length || 0,
          data: collectionResponse.ok ? collectionData : { error: collectionData },
        });

        if (collectionResponse.ok && collectionData.items && collectionData.items.length > 0) {
          results.workingConfig = {
            siteId,
            collectionName,
            itemCount: collectionData.items.length,
          };
        }
      }
    } catch (error: any) {
      results.tests.push({
        test: `Error with Site ID: ${siteId}`,
        siteId,
        error: error.message,
      });
    }
  }

  // Test 2: Try different API endpoints
  const apiEndpoints = [
    'https://www.wixapis.com/sites/v2/sites',
    'https://www.wixapis.com/sites/v2/sites/' + WIX_SITE_ID,
    'https://www.wixapis.com/sites/v2/sites/' + WIX_METASITE_ID,
  ];

  for (const endpoint of apiEndpoints) {
    try {
      const headers: Record<string, string> = {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'Content-Type': 'application/json',
      };

      if (WIX_ACCOUNT_ID) {
        headers['wix-account-id'] = WIX_ACCOUNT_ID;
      }

      const response = await fetch(endpoint, {
        headers,
        cache: 'no-store',
      });

      const text = await response.text();
      let data: any;
      try {
        data = JSON.parse(text);
      } catch {
        data = { raw: text.substring(0, 200) };
      }

      results.tests.push({
        test: `Test endpoint: ${endpoint}`,
        status: response.status,
        success: response.ok,
        data: response.ok ? data : { error: data },
      });
    } catch (error: any) {
      results.tests.push({
        test: `Error with endpoint: ${endpoint}`,
        error: error.message,
      });
    }
  }

  // Final diagnosis
  if (!results.workingConfig) {
    results.diagnosis = {
      issue: 'IST token returns 404 for all REST API endpoints',
      possibleCauses: [
        'IST token from Wix Dev is NOT for REST APIs (it\'s for internal Wix flows)',
        'IST token may not have Data Collections permissions',
        'IST token may be for a different site',
        'Collection name may be incorrect in Wix CMS',
      ],
      solutions: [
        'Check Wix Dashboard → Settings → Advanced → API Keys for a "REST API Token" (not IST)',
        'Create a new IST token with explicit "Data Collections" permissions',
        'Verify the collection "CocoHawaiiExoticHats" exists in Wix Content Manager',
        'Consider using OAuth instead of IST token (see OAUTH_SETUP_GUIDE.md)',
      ],
    };
  }

  return NextResponse.json(results);
}
