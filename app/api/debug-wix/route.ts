import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const debugInfo: any = {
    env: {
      hasClientId: !!WIX_CLIENT_ID,
      hasAccountId: !!WIX_ACCOUNT_ID,
      hasSiteId: !!WIX_SITE_ID,
      hasApiKey: !!WIX_API_KEY,
      siteId: WIX_SITE_ID || 'NOT SET - See GET_SITE_ID.md for instructions',
      apiKey: WIX_API_KEY ? `${WIX_API_KEY.substring(0, 20)}...` : 'NOT SET',
      clientId: WIX_CLIENT_ID || 'NOT SET',
      accountId: WIX_ACCOUNT_ID || 'NOT SET',
    },
    apiResponse: null,
  };

  // If no credentials, return early
  if (!WIX_API_KEY || !WIX_SITE_ID) {
    return NextResponse.json({
      ...debugInfo,
      apiResponse: {
        success: false,
        error: 'Missing WIX_API_KEY or WIX_SITE_ID environment variables',
      },
    });
  }

  try {
    // Try different collection name variations
    // The collection might be named "CocoHawaiiExoticHats List" or have different casing
    const collectionNamesToTry = [
      'cocohawaiiexotichats',  // Based on Wix URL pattern
      'CocoHawaiiExoticHats',
      'CocoHawaiiExoticHats List',
      'CocoHawaiiExoticHatsList',
      'Coco Hawaii Exotic Hats',
      'coco-hawaii-exotic-hats',
    ];

    let lastError: any = null;
    let successfulResponse: any = null;

    for (const collectionName of collectionNamesToTry) {
      try {
        const encodedName = encodeURIComponent(collectionName);
        const url = `https://www.wixapis.com/data/v1/collections/${encodedName}/items?limit=10`;
        
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

        if (response.ok && responseData.items && responseData.items.length > 0) {
          // Found working collection name!
          successfulResponse = {
            collectionName: collectionName,
            statusCode: response.status,
            statusText: response.statusText,
            data: responseData,
          };
          break;
        } else if (response.ok) {
          // Collection exists but empty
          lastError = {
            collectionName: collectionName,
            statusCode: response.status,
            message: 'Collection found but empty',
            data: responseData,
          };
        } else {
          // Collection not found with this name
          lastError = {
            collectionName: collectionName,
            statusCode: response.status,
            statusText: response.statusText,
            body: responseData,
          };
        }
      } catch (err: any) {
        lastError = {
          collectionName: collectionName,
          error: err.message,
        };
      }
    }

    if (successfulResponse) {
      debugInfo.apiResponse = {
        success: true,
        ...successfulResponse,
      };
    } else {
      // Try one more time with the original name to get full error details
      const url = `https://www.wixapis.com/data/v1/collections/CocoHawaiiExoticHats/items?limit=10`;
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

      debugInfo.apiResponse = {
        success: response.ok,
        statusCode: response.status,
        statusText: response.statusText,
        data: response.ok ? responseData : null,
        error: !response.ok ? {
          status: response.status,
          statusText: response.statusText,
          body: responseData,
          triedCollectionNames: collectionNamesToTry,
          lastError: lastError,
        } : null,
        triedCollectionNames: collectionNamesToTry,
      };
    }

    return NextResponse.json(debugInfo);
  } catch (error: any) {
    debugInfo.apiResponse = {
      success: false,
      error: {
        message: error.message,
        name: error.name,
        stack: error.stack?.split('\n').slice(0, 5),
      },
    };

    return NextResponse.json(debugInfo);
  }
}
