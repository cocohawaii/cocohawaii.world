import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({
      error: 'Missing WIX_API_KEY or WIX_SITE_ID',
    }, { status: 400 });
  }

  const results: any = {
    siteId: WIX_SITE_ID,
    apiKeyType: WIX_API_KEY.startsWith('IST.') ? 'Instance Token (IST)' : 'API Key',
    tests: [],
  };

  const collectionName = 'CocoHawaiiExoticHats';
  const encodedName = encodeURIComponent(collectionName);

  // Test different API endpoint structures
  const endpoints = [
    {
      name: 'Data API v1 - Standard',
      url: `https://www.wixapis.com/data/v1/collections/${encodedName}/items?limit=5`,
    },
    {
      name: 'Data API v1 - With paging',
      url: `https://www.wixapis.com/data/v1/collections/${encodedName}/items?paging.limit=5`,
    },
    {
      name: 'Site Data API',
      url: `https://www.wixapis.com/site-data/v1/collections/${encodedName}/items?limit=5`,
    },
    {
      name: 'CMS API',
      url: `https://www.wixapis.com/cms/v1/collections/${encodedName}/items?limit=5`,
    },
  ];

  // Test different authentication methods
  const authMethods = [
    {
      name: 'IST Token (as-is)',
      header: WIX_API_KEY,
    },
    {
      name: 'IST Token with Bearer',
      header: `Bearer ${WIX_API_KEY}`,
    },
    {
      name: 'IST Token with Authorization',
      header: `Authorization: ${WIX_API_KEY}`,
    },
  ];

  for (const endpoint of endpoints) {
    for (const authMethod of authMethods) {
      try {
        const response = await fetch(endpoint.url, {
          method: 'GET',
          headers: {
            'Authorization': authMethod.header,
            'wix-site-id': WIX_SITE_ID,
            'Content-Type': 'application/json',
            'Accept': 'application/json',
          },
          cache: 'no-store',
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
          endpoint: endpoint.name,
          url: endpoint.url,
          authMethod: authMethod.name,
          status: response.status,
          statusText: response.statusText,
          success: response.ok,
          hasItems,
          itemCount: responseData.items?.length || 0,
          response: hasItems ? {
            items: responseData.items,
            total: responseData.totalItems || responseData.items?.length,
          } : responseData,
          headers: {
            authorization: authMethod.header.substring(0, 30) + '...',
            'wix-site-id': WIX_SITE_ID,
          },
        });

        // If we found a working combination, note it
        if (hasItems) {
          results.workingCombination = {
            endpoint: endpoint.name,
            url: endpoint.url,
            authMethod: authMethod.name,
            itemCount: responseData.items.length,
          };
        }
      } catch (error: any) {
        results.tests.push({
          endpoint: endpoint.name,
          authMethod: authMethod.name,
          error: error.message,
        });
      }
    }
  }

  // Also try to list collections to see the structure
  try {
    const listUrl = `https://www.wixapis.com/data/v1/collections`;
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const listText = await listResponse.text();
    let listData;
    try {
      listData = JSON.parse(listText);
    } catch {
      listData = { raw: listText.substring(0, 500) };
    }

    results.listCollectionsTest = {
      status: listResponse.status,
      success: listResponse.ok,
      data: listData,
    };
  } catch (error: any) {
    results.listCollectionsTest = {
      error: error.message,
    };
  }

  return NextResponse.json(results);
}

