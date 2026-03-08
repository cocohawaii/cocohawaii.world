import { NextRequest, NextResponse } from 'next/server';

const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY || !WIX_API_KEY.startsWith('IST.')) {
    return NextResponse.json({
      error: 'No IST token found',
    }, { status: 400 });
  }

  try {
    const parts = WIX_API_KEY.split('.');
    if (parts.length < 3) {
      return NextResponse.json({
        error: 'Invalid token format - should have 3 parts separated by dots',
        parts: parts.length,
      }, { status: 400 });
    }

    // Decode header
    let header: any = {};
    try {
      const headerDecoded = Buffer.from(parts[0].replace('IST.', ''), 'base64').toString('utf-8');
      header = JSON.parse(headerDecoded);
    } catch (e) {
      // Try without IST prefix
      try {
        const headerDecoded = Buffer.from(parts[0], 'base64').toString('utf-8');
        header = JSON.parse(headerDecoded);
      } catch (e2) {
        header = { error: 'Could not decode header' };
      }
    }

    // Decode payload
    let payload: any = {};
    try {
      const payloadDecoded = Buffer.from(parts[1], 'base64').toString('utf-8');
      payload = JSON.parse(payloadDecoded);
    } catch (e: any) {
      return NextResponse.json({
        error: 'Failed to decode payload',
        message: e.message,
      }, { status: 400 });
    }

    // Full token analysis
    const analysis = {
      tokenFormat: {
        hasISTPrefix: WIX_API_KEY.startsWith('IST.'),
        totalParts: parts.length,
        headerLength: parts[0].length,
        payloadLength: parts[1].length,
        signatureLength: parts[2]?.length || 0,
      },
      header: {
        kid: header.kid,
        alg: header.alg,
        typ: header.typ,
        raw: header,
      },
      payload: {
        full: payload,
        kid: payload.kid,
        alg: payload.alg,
        iat: payload.iat,
        exp: payload.exp,
        data: payload.data,
        // Check different possible structures
        hasDataObject: !!payload.data,
        hasIdentity: !!payload.data?.identity,
        hasTenant: !!payload.data?.tenant,
        identityType: payload.data?.identity?.type,
        identityId: payload.data?.identity?.id,
        tenantType: payload.data?.tenant?.type,
        tenantId: payload.data?.tenant?.id,
        // Also check if data is a string (JSON stringified)
        dataAsString: typeof payload.data === 'string' ? payload.data : null,
      },
      recommendations: [] as string[],
    };

    // Try to parse data if it's a string
    if (analysis.payload.dataAsString) {
      try {
        const parsedData = JSON.parse(analysis.payload.dataAsString);
        analysis.payload.data = parsedData;
        analysis.payload.identityType = parsedData?.identity?.type;
        analysis.payload.identityId = parsedData?.identity?.id;
        analysis.payload.tenantType = parsedData?.tenant?.type;
        analysis.payload.tenantId = parsedData?.tenant?.id;
      } catch (e) {
        // Ignore parse errors
      }
    }

    // Add recommendations
    if (!analysis.payload.tenantId) {
      analysis.recommendations.push('⚠️ Token missing tenant/account ID - this might be why it fails');
    }

    if (!analysis.payload.data) {
      analysis.recommendations.push('⚠️ Token missing data object - token might be invalid');
    }

    if (analysis.payload.tenantId) {
      analysis.recommendations.push(`✅ Token has tenant ID: ${analysis.payload.tenantId}`);
      const expectedAccountId = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';
      if (expectedAccountId && analysis.payload.tenantId !== expectedAccountId) {
        analysis.recommendations.push(`⚠️ Token tenant ID (${analysis.payload.tenantId}) doesn't match expected (${expectedAccountId})`);
      }
    }

    // Test the token
    const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
    const testResults: any = {
      siteId: WIX_SITE_ID,
      tests: [] as any[],
    };

    if (WIX_SITE_ID) {
      // Test 1: Try to get site info
      const siteUrl = `https://www.wixapis.com/sites/v2/sites/${WIX_SITE_ID}`;
      try {
        const response = await fetch(siteUrl, {
          method: 'GET',
          headers: {
            'Authorization': WIX_API_KEY,
            'Content-Type': 'application/json',
            'wix-site-id': WIX_SITE_ID,
          },
        });

        testResults.tests.push({
          test: 'Get Site Info',
          url: siteUrl,
          status: response.status,
          success: response.ok,
          response: response.ok ? 'Success' : await response.text().catch(() => ''),
        });
      } catch (error: any) {
        testResults.tests.push({
          test: 'Get Site Info',
          url: siteUrl,
          status: 'ERROR',
          success: false,
          error: error.message,
        });
      }

      // Test 2: Try to list collections
      const collectionsUrl = 'https://www.wixapis.com/data/v1/collections';
      try {
        const response = await fetch(collectionsUrl, {
          method: 'GET',
          headers: {
            'Authorization': WIX_API_KEY,
            'Content-Type': 'application/json',
            'wix-site-id': WIX_SITE_ID,
          },
        });

        const text = await response.text();
        let data: any = null;
        try {
          data = JSON.parse(text);
        } catch {}

        testResults.tests.push({
          test: 'List Collections',
          url: collectionsUrl,
          status: response.status,
          success: response.ok,
          collectionCount: data?.collections?.length || 0,
          response: data || text.substring(0, 200),
        });
      } catch (error: any) {
        testResults.tests.push({
          test: 'List Collections',
          url: collectionsUrl,
          status: 'ERROR',
          success: false,
          error: error.message,
        });
      }
    }

    return NextResponse.json({
      analysis,
      testResults,
      summary: {
        tokenValid: !!analysis.payload.data,
        hasAccountId: !!analysis.payload.tenantId,
        canAccessSite: testResults.tests.some((t: any) => t.test === 'Get Site Info' && t.success),
        canListCollections: testResults.tests.some((t: any) => t.test === 'List Collections' && t.success),
      },
    });
  } catch (error: any) {
    return NextResponse.json({
      error: 'Failed to analyze token',
      message: error.message,
      stack: error.stack,
    }, { status: 500 });
  }
}

