import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const collectionName = 'CocoHawaiiExoticHats';
  const results: any = { tests: [] };

  // Test different base URLs and endpoint structures
  const baseUrls = [
    'https://www.wixapis.com/data/v1',
    'https://www.wixapis.com/site-data/v1',
    'https://www.wixapis.com/cms/v1',
    'https://www.wixapis.com/wix-data/v1',
    'https://api.wix.com/data/v1',
    'https://api.wix.com/site-data/v1',
  ];

  for (const baseUrl of baseUrls) {
    // Test 1: List collections
    try {
      const listUrl = `${baseUrl}/collections`;
      const listResponse = await fetch(listUrl, {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID,
          'Content-Type': 'application/json',
        },
      });

      const listText = await listResponse.text();
      results.tests.push({
        baseUrl,
        test: 'List Collections',
        url: listUrl,
        status: listResponse.status,
        success: listResponse.ok,
        response: listText.substring(0, 200),
      });
    } catch (error: any) {
      results.tests.push({
        baseUrl,
        test: 'List Collections',
        error: error.message,
      });
    }

    // Test 2: Get specific collection items
    try {
      const itemsUrl = `${baseUrl}/collections/${collectionName}/items?limit=1`;
      const itemsResponse = await fetch(itemsUrl, {
        headers: {
          'Authorization': WIX_API_KEY,
          'wix-site-id': WIX_SITE_ID,
          'Content-Type': 'application/json',
        },
      });

      const itemsText = await itemsResponse.text();
      let itemsData;
      try {
        itemsData = JSON.parse(itemsText);
      } catch {
        itemsData = { raw: itemsText.substring(0, 200) };
      }

      results.tests.push({
        baseUrl,
        test: 'Get Collection Items',
        url: itemsUrl,
        status: itemsResponse.status,
        success: itemsResponse.ok,
        hasItems: itemsResponse.ok && itemsData.items && itemsData.items.length > 0,
        response: itemsData,
      });

      // If this worked, we found it!
      if (itemsResponse.ok && itemsData.items && itemsData.items.length > 0) {
        results.workingEndpoint = {
          baseUrl,
          url: itemsUrl,
          itemCount: itemsData.items.length,
        };
      }
    } catch (error: any) {
      results.tests.push({
        baseUrl,
        test: 'Get Collection Items',
        error: error.message,
      });
    }
  }

  // Also try with different header formats
  const headerVariations = [
    { name: 'IST Token Direct', value: WIX_API_KEY },
    { name: 'Bearer IST Token', value: `Bearer ${WIX_API_KEY}` },
  ];

  for (const headerVar of headerVariations) {
    try {
      const url = `https://www.wixapis.com/data/v1/collections/${collectionName}/items?limit=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': headerVar.value,
          'wix-site-id': WIX_SITE_ID,
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
        test: `Auth Header: ${headerVar.name}`,
        url,
        status: response.status,
        success: response.ok,
        hasItems: response.ok && responseData.items && responseData.items.length > 0,
        response: responseData,
      });
    } catch (error: any) {
      results.tests.push({
        test: `Auth Header: ${headerVar.name}`,
        error: error.message,
      });
    }
  }

  return NextResponse.json(results);
}

