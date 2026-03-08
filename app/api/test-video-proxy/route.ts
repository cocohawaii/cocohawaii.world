import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_METASITE_ID || process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const testUrl = searchParams.get('url') || 'https://video.wixstatic.com/video/1510fb_58c5d2e1c2ed4f328c177e7efa3e6bc0/lightsystem.mp4';

  const results: any = {
    testUrl,
    credentials: {
      siteId: WIX_SITE_ID,
      hasApiKey: !!WIX_API_KEY,
    },
    tests: [],
  };

  // Test different header combinations
  const headerSets = [
    {
      name: 'IST Token + Site ID',
      headers: {
        'Authorization': WIX_API_KEY,
        'wix-site-id': WIX_SITE_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
    {
      name: 'Bearer IST Token + Site ID',
      headers: {
        'Authorization': `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
    {
      name: 'Site ID only',
      headers: {
        'wix-site-id': WIX_SITE_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
    {
      name: 'No auth (public)',
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      },
    },
  ];

  for (const set of headerSets) {
    try {
      const response = await fetch(testUrl, {
        method: 'HEAD', // Just check headers, don't download
        headers: set.headers as HeadersInit,
      });

      results.tests.push({
        name: set.name,
        status: response.status,
        statusText: response.statusText,
        contentType: response.headers.get('content-type'),
        contentLength: response.headers.get('content-length'),
        success: response.ok,
      });
    } catch (error: any) {
      results.tests.push({
        name: set.name,
        error: error.message,
        success: false,
      });
    }
  }

  return NextResponse.json(results);
}
