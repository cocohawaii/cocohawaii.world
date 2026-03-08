import { NextRequest, NextResponse } from 'next/server';
import { createClient, OAuthStrategy } from '@wix/sdk';
import { items } from '@wix/data';

const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || 'c3149dad-9001-4e9a-b2e1-57c0b1d6f2d6';

export async function GET(request: NextRequest) {
  const results: any = {
    clientId: WIX_CLIENT_ID,
    hasClientId: !!WIX_CLIENT_ID,
    sdkTest: null,
    error: null,
  };

  if (!WIX_CLIENT_ID) {
    return NextResponse.json({
      ...results,
      error: 'Missing NEXT_PUBLIC_WIX_CLIENT_ID',
    }, { status: 400 });
  }

  try {
    // Create client with OAuth Strategy
    const myWixClient = createClient({
      modules: { items },
      auth: OAuthStrategy({ clientId: WIX_CLIENT_ID }),
    });

    // Try to query a collection
    const collectionName = 'CocoHawaiiExoticHats';
    
    try {
      const dataItemsList = await myWixClient.items.query(collectionName).limit(10).find();

      results.sdkTest = {
        success: true,
        collectionName,
        itemCount: dataItemsList.items?.length || 0,
        items: dataItemsList.items || [],
        total: dataItemsList.totalCount || 0,
      };
    } catch (queryError: any) {
      // If query fails, try listing available collections
      results.sdkTest = {
        success: false,
        collectionName,
        error: queryError.message,
        errorDetails: {
          name: queryError.name,
          stack: queryError.stack?.split('\n').slice(0, 5),
        },
        note: 'Query failed - collection might not exist or authentication issue',
      };

      // Try to get collections list (if SDK supports it)
      try {
        // Note: SDK might not have a direct "list collections" method
        // We might need to know collection IDs/names beforehand
      } catch (listError: any) {
        results.collectionsListError = listError.message;
      }
    }
  } catch (error: any) {
    results.error = {
      message: error.message,
      name: error.name,
      stack: error.stack?.split('\n').slice(0, 10),
    };
  }

  return NextResponse.json(results);
}
