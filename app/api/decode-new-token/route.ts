import { NextRequest, NextResponse } from 'next/server';

const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY || !WIX_API_KEY.startsWith('IST.')) {
    return NextResponse.json({
      error: 'No IST token found',
    }, { status: 400 });
  }

  try {
    // Decode the token
    const parts = WIX_API_KEY.split('.');
    if (parts.length < 2) {
      return NextResponse.json({
        error: 'Invalid token format',
      }, { status: 400 });
    }

    // Decode the payload (second part)
    let payload: any;
    try {
      const decoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      payload = JSON.parse(decoded);
    } catch (parseError: any) {
      return NextResponse.json({
        error: 'Failed to parse token payload',
        message: parseError.message,
        rawPayload: parts[1].substring(0, 100),
      }, { status: 400 });
    }

    // Safely parse the issued at time
    let issuedAt = 'Unknown';
    if (payload.iat) {
      try {
        const timestamp = typeof payload.iat === 'number' ? payload.iat * 1000 : Date.parse(payload.iat);
        if (!isNaN(timestamp)) {
          issuedAt = new Date(timestamp).toISOString();
        }
      } catch (dateError) {
        // Ignore date parsing errors
      }
    }

    const tokenInfo = {
      kid: payload.kid || 'Unknown',
      alg: payload.alg || 'Unknown',
      iat: payload.iat || null,
      issuedAt,
      data: payload.data || {},
      tokenId: payload.data?.id,
      identityType: payload.data?.identity?.type,
      identityId: payload.data?.identity?.id,
      tenantType: payload.data?.tenant?.type,
      tenantId: payload.data?.tenant?.id, // This is the Account ID
    };

    // Test the token with site info
    const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
    const siteInfoTests: any[] = [];

    if (WIX_SITE_ID) {
      // Try to get site info
      const headers = {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
        'wix-site-id': WIX_SITE_ID,
      };

      const siteUrls = [
        `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`,
        `https://www.wixapis.com/sites/v1/sites/${WIX_SITE_ID}`,
      ];

      for (const url of siteUrls) {
        try {
          const response = await fetch(url, {
            method: 'GET',
            headers,
          });

          const status = response.status;
          const text = await response.text();
          let data: any = null;
          try {
            data = JSON.parse(text);
          } catch {}

          siteInfoTests.push({
            url,
            status,
            success: status === 200,
            response: data || text.substring(0, 200),
          });
        } catch (error: any) {
          siteInfoTests.push({
            url,
            status: 'ERROR',
            success: false,
            error: error.message,
          });
        }
      }
    }

    // Try to list collections
    const collectionTests: any[] = [];
    const collectionUrls = [
      'https://www.wixapis.com/data/v1/collections',
      'https://www.wixapis.com/site-data/v1/collections',
    ];

    for (const url of collectionUrls) {
      const headers: Record<string, string> = {
        'Authorization': WIX_API_KEY,
        'Content-Type': 'application/json',
      };

      if (WIX_SITE_ID) {
        headers['wix-site-id'] = WIX_SITE_ID;
      }

      try {
        const response = await fetch(url, {
          method: 'GET',
          headers,
        });

        const status = response.status;
        const text = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {}

        const collections = data?.collections || data?.items || [];

        collectionTests.push({
          url,
          status,
          success: status === 200,
          collectionCount: collections.length,
          collections: collections.map((c: any) => ({
            name: c.name,
            id: c._id || c.id,
            displayName: c.displayName,
          })),
          response: data || text.substring(0, 200),
        });
      } catch (error: any) {
        collectionTests.push({
          url,
          status: 'ERROR',
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      tokenInfo,
      siteInfoTests,
      collectionTests,
      recommendations: [
        `Token Account ID: ${tokenInfo.tenantId}`,
        `Expected Account ID: ${process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || 'Not set'}`,
        `Current Site ID: ${WIX_SITE_ID}`,
        '',
        ...(collectionTests.some((t: any) => t.success && t.collectionCount > 0)
          ? [
              '✅ Collections found! Check the collectionTests array for names.',
              'Make sure the collection name matches exactly (case-sensitive).',
            ]
          : [
              '❌ No collections found. Possible issues:',
              '1. Collection doesn\'t exist in this site',
              '2. Token doesn\'t have Data Collections permission',
              '3. Site ID is incorrect',
            ]),
      ],
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to decode token',
      message: error.message,
    }, { status: 500 });
  }
}

