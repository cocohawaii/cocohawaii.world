import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const collectionName = 'CocoHawaiiExoticHats';
  const results: any = {
    siteId: WIX_SITE_ID,
    accountId: WIX_ACCOUNT_ID,
    collectionName,
    tests: [],
  };

  // Test different header combinations
  const headerCombinations = [
    {
      name: 'Site ID only',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Account ID only',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-account-id': WIX_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Both Site ID and Account ID',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'wix-account-id': WIX_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Account ID in URL path',
      headers: {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      },
      urlModifier: (baseUrl: string) => baseUrl.replace('/data/v1/', `/data/v1/accounts/${WIX_ACCOUNT_ID}/`),
    },
  ];

  const baseUrls = [
    'https://www.wixapis.com/data/v1',
    'https://www.wixapis.com/site-data/v1',
  ];

  for (const baseUrl of baseUrls) {
    for (const combo of headerCombinations) {
      try {
        let url = `${baseUrl}/collections/${encodeURIComponent(collectionName)}/items?limit=1`;
        if (combo.urlModifier) {
          url = combo.urlModifier(url);
        }

        // Ensure all header values are strings (not undefined)
        const headers: Record<string, string> = {};
        Object.entries(combo.headers).forEach(([key, value]) => {
          if (value !== undefined) {
            headers[key] = value;
          }
        });
        const response = await fetch(url, {
          headers,
        });

        const responseText = await response.text();
        let responseData;
        try {
          responseData = JSON.parse(responseText);
        } catch {
          responseData = { raw: responseText.substring(0, 200) };
        }

        const hasItems = response.ok && responseData.items && responseData.items.length > 0;

        results.tests.push({
          baseUrl,
          method: combo.name,
          url,
          status: response.status,
          success: response.ok,
          hasItems,
          itemCount: responseData.items?.length || 0,
          response: hasItems ? { items: responseData.items } : responseData,
        });

        if (hasItems) {
          results.workingMethod = {
            baseUrl,
            method: combo.name,
            url,
            itemCount: responseData.items.length,
          };
        }
      } catch (error: any) {
        results.tests.push({
          baseUrl,
          method: combo.name,
          error: error.message,
        });
      }
    }
  }

  return NextResponse.json(results);
}

