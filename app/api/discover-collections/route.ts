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
    discoveredCollections: [],
    testedNames: [],
  };

  // First, try to list all collections
  try {
    const listUrl = `https://www.wixapis.com/data/v1/collections`;
    const listResponse = await fetch(listUrl, {
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      cache: 'no-store',
    });

    const listResponseText = await listResponse.text();
    let listData;
    try {
      listData = JSON.parse(listResponseText);
    } catch {
      listData = { raw: listResponseText };
    }

    results.listCollectionsResponse = {
      status: listResponse.status,
      success: listResponse.ok,
      data: listData,
    };

    // Try to extract collection names from the response
    if (listResponse.ok) {
      let collections: any[] = [];
      if (Array.isArray(listData)) {
        collections = listData;
      } else if (listData.collections && Array.isArray(listData.collections)) {
        collections = listData.collections;
      } else if (listData.data && Array.isArray(listData.data)) {
        collections = listData.data;
      } else if (listData.items && Array.isArray(listData.items)) {
        collections = listData.items;
      }

      results.discoveredCollections = collections.map((col: any) => ({
        name: col.name || col.displayName || col._id,
        id: col._id || col.id,
        slug: col.slug,
      }));
    }
  } catch (error: any) {
    results.listError = error.message;
  }

  // Now test various collection name variations
  const collectionNamesToTest = [
    'cocohawaiiexotichats',
    'CocoHawaiiExoticHats',
    'CocoHawaiiExoticHats List',
    'CocoHawaiiExoticHatsList',
    'Coco Hawaii Exotic Hats',
    'coco-hawaii-exotic-hats',
    'CocoHawaiiExoticHats_List',
    'CocoHawaiiExoticHats-List',
  ];

  for (const collectionName of collectionNamesToTest) {
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

      results.testedNames.push({
        name: collectionName,
        encoded: encodedName,
        status: response.status,
        success: response.ok,
        hasItems: response.ok && responseData.items && responseData.items.length > 0,
        itemCount: responseData.items?.length || 0,
        response: response.ok ? (responseData.items ? responseData : { items: responseData.items }) : responseData,
      });
    } catch (error: any) {
      results.testedNames.push({
        name: collectionName,
        error: error.message,
      });
    }
  }

  // Find which collection name worked
  const workingCollection = results.testedNames.find((test: any) => test.success && test.hasItems);
  if (workingCollection) {
    results.workingCollectionName = workingCollection.name;
    results.recommendation = `Use collection name: "${workingCollection.name}"`;
  }

  return NextResponse.json(results);
}

