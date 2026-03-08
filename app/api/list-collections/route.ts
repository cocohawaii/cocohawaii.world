import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({
      error: 'Missing WIX_API_KEY or WIX_SITE_ID',
    }, { status: 400 });
  }

  try {
    // List all collections to see what's available
    // Try different endpoint variations
    const endpoints = [
      `https://www.wixapis.com/data/v1/collections`,
      `https://www.wixapis.com/data/v1/collections?paging.limit=100`,
      `https://www.wixapis.com/site-data/v1/collections`,
    ];

    let lastError: any = null;
    let successfulResponse: any = null;

    for (const url of endpoints) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          headers: {
            'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
            'wix-site-id': WIX_SITE_ID,
            'Content-Type': 'application/json',
          },
          cache: 'no-store',
          signal: controller.signal,
        });

        clearTimeout(timeoutId);

        const responseText = await response.text();
        let responseData;

        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText };
        }

        if (response.ok) {
          successfulResponse = {
            url,
            status: response.status,
            data: responseData,
          };
          break;
        } else {
          lastError = {
            url,
            status: response.status,
            statusText: response.statusText,
            data: responseData,
          };
        }
      } catch (err: any) {
        lastError = {
          url,
          error: err.message,
        };
      }
    }

    if (!successfulResponse) {
      return NextResponse.json({
        success: false,
        statusCode: lastError?.status || 404,
        error: 'All endpoints failed',
        lastError,
        endpointsTried: endpoints,
      }, { status: lastError?.status || 404 });
    }

    const responseData = successfulResponse.data;

    // Wix API might return collections in different structures
    // Try to extract the actual collections array
    let collectionsArray: any[] = [];
    
    if (Array.isArray(responseData)) {
      collectionsArray = responseData;
    } else if (responseData.collections && Array.isArray(responseData.collections)) {
      collectionsArray = responseData.collections;
    } else if (responseData.data && Array.isArray(responseData.data)) {
      collectionsArray = responseData.data;
    } else if (responseData.items && Array.isArray(responseData.items)) {
      collectionsArray = responseData.items;
    }

    return NextResponse.json({
      success: true,
      statusCode: successfulResponse.status,
      url: successfulResponse.url,
      collections: collectionsArray.length > 0 ? collectionsArray : responseData,
      rawResponse: responseData,
      note: collectionsArray.length === 0 ? 'No collections array found in response structure' : `${collectionsArray.length} collections found`,
    });
  } catch (error: any) {
    return NextResponse.json({
      success: false,
      error: error.message,
    }, { status: 500 });
  }
}
