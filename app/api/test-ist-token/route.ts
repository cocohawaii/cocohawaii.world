import { NextRequest, NextResponse } from 'next/server';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  const results: any = {
    tokenInfo: {
      type: WIX_API_KEY.startsWith('IST.') ? 'Instance Token (IST)' : 'API Key',
      prefix: WIX_API_KEY.substring(0, 30),
      length: WIX_API_KEY.length,
    },
    siteId: WIX_SITE_ID,
    tests: [],
  };

  // Decode the IST token to see what's inside (just the payload, not the signature)
  if (WIX_API_KEY.startsWith('IST.')) {
    try {
      const parts = WIX_API_KEY.split('.');
      if (parts.length >= 2) {
        // Decode the payload (second part)
        const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString());
        results.tokenInfo.decodedPayload = payload;
      }
    } catch (e) {
      results.tokenInfo.decodeError = 'Could not decode token';
    }
  }

  // Test 1: Try to get site information (this should work if token is valid)
  const siteInfoUrls = [
    `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`,
    `https://www.wixapis.com/site/v1/sites/${WIX_SITE_ID}`,
  ];

  for (const url of siteInfoUrls) {
    try {
      const response = await fetch(url, {
        headers: {
          'Authorization': WIX_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText.substring(0, 300) };
      }

      results.tests.push({
        test: 'Get Site Info',
        url,
        status: response.status,
        success: response.ok,
        response: responseData,
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Get Site Info',
        url,
        error: error.message,
      });
    }
  }

  // Test 2: Try the exact collection with different header combinations
  const collectionName = 'CocoHawaiiExoticHats';
  const headerVariations = [
    {
      name: 'IST Token + Site ID',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'IST Token + Account ID',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-account-id': WIX_ACCOUNT_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'Bearer IST Token + Site ID',
      headers: {
        'Authorization': `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
    },
    {
      name: 'IST Token only (no site/account ID)',
      headers: {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      },
    },
  ];

  for (const variation of headerVariations) {
    try {
      const url = `https://www.wixapis.com/data/v1/collections/${collectionName}/items?limit=1`;
      // Ensure all header values are strings (not undefined)
      const headers: Record<string, string> = {};
      Object.entries(variation.headers).forEach(([key, value]) => {
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
        responseData = { raw: responseText.substring(0, 300) };
      }

      results.tests.push({
        test: `Query Collection: ${variation.name}`,
        url,
        status: response.status,
        success: response.ok,
        hasItems: response.ok && responseData.items && responseData.items.length > 0,
        response: responseData,
      });

      if (response.ok && responseData.items && responseData.items.length > 0) {
        results.workingMethod = variation.name;
        results.workingHeaders = variation.headers;
      }
    } catch (error: any) {
      results.tests.push({
        test: `Query Collection: ${variation.name}`,
        error: error.message,
      });
    }
  }

  // Test 3: Try using the account ID in the URL
  if (WIX_ACCOUNT_ID) {
    try {
      const url = `https://www.wixapis.com/data/v1/accounts/${WIX_ACCOUNT_ID}/collections/${collectionName}/items?limit=1`;
      const response = await fetch(url, {
        headers: {
          'Authorization': WIX_API_KEY,
          'Content-Type': 'application/json',
        },
      });

      const responseText = await response.text();
      let responseData;
      try {
        responseData = JSON.parse(responseText);
      } catch {
        responseData = { raw: responseText.substring(0, 300) };
      }

      results.tests.push({
        test: 'Query with Account ID in URL',
        url,
        status: response.status,
        success: response.ok,
        response: responseData,
      });
    } catch (error: any) {
      results.tests.push({
        test: 'Query with Account ID in URL',
        error: error.message,
      });
    }
  }

  return NextResponse.json(results);
}

