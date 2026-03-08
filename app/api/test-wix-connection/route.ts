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
    apiKeyPrefix: WIX_API_KEY.substring(0, 20),
    tests: [],
  };

  // Test 1: List collections endpoint
  try {
    const url = `https://www.wixapis.com/data/v1/collections`;
    const response = await fetch(url, {
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    results.tests.push({
      test: 'List Collections Endpoint',
      url,
      status: response.status,
      statusText: response.statusText,
      success: response.ok,
      response: responseData,
      headers: {
        authorization: WIX_API_KEY.startsWith('IST.') ? 'IST token' : 'Bearer token',
        'wix-site-id': WIX_SITE_ID ? 'Set' : 'Missing',
      },
    });
  } catch (error: any) {
    results.tests.push({
      test: 'List Collections Endpoint',
      error: error.message,
    });
  }

  // Test 2: Try to query a specific collection with different names
  const collectionNames = [
    'cocohawaiiexotichats',  // Based on Wix URL pattern
    'CocoHawaiiExoticHats',
    'CocoHawaiiExoticHats List',
    'CocoHawaiiExoticHatsList',
    'Coco Hawaii Exotic Hats',
    'coco-hawaii-exotic-hats',
  ];

  for (const collectionName of collectionNames) {
    try {
      const encodedName = encodeURIComponent(collectionName);
      const url = `https://www.wixapis.com/data/v1/collections/${encodedName}/items?limit=1`;
      
      const response = await fetch(url, {
        headers: {
          'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
          'wix-site-id': WIX_SITE_ID,
          'Content-Type': 'application/json',
        },
        cache: 'no-store',
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText };
      }

      results.tests.push({
        test: `Query Collection: "${collectionName}"`,
        url,
        status: response.status,
        statusText: response.statusText,
        success: response.ok,
        response: responseData,
      });
    } catch (error: any) {
      results.tests.push({
        test: `Query Collection: "${collectionName}"`,
        error: error.message,
      });
    }
  }

  return NextResponse.json(results);
}

