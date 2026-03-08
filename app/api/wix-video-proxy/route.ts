import { NextRequest, NextResponse } from 'next/server';

export const revalidate = 0;

// Wix credentials from environment
// Try METASITE_ID first (from dashboard URL), fallback to SITE_ID
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_METASITE_ID || process.env.NEXT_PUBLIC_WIX_SITE_ID || 'e2051e40-d8bd-4f0b-b7e4-f04012108b4e';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

console.log('🔑 Wix Proxy Config:', {
  siteId: WIX_SITE_ID,
  hasApiKey: !!WIX_API_KEY,
  apiKeyPreview: WIX_API_KEY ? `${WIX_API_KEY.substring(0, 20)}...` : 'MISSING'
});

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    let videoUrl = searchParams.get('url');

    if (!videoUrl) {
      return NextResponse.json(
        { error: 'Video URL is required' },
        { status: 400 }
      );
    }

    // Decode the URL - handle multiple levels of encoding
    let decodedUrl: string = videoUrl;
    try {
      if (videoUrl.includes('%')) {
        let previousUrl = '';
        while (decodedUrl !== previousUrl && decodedUrl.includes('%')) {
          previousUrl = decodedUrl;
          decodedUrl = decodeURIComponent(decodedUrl);
        }
        // Fix any remaining %25XX patterns (double-encoded)
        decodedUrl = decodedUrl.replace(/%25([0-9A-F]{2})/gi, '%$1');
      }
    } catch (e) {
      console.warn('⚠️ URL decode warning:', e);
      decodedUrl = videoUrl;
    }

    console.log('🎥 Proxy fetching video:', decodedUrl);

    // Get Range header from request (for video streaming)
    const range = request.headers.get('range') || '';

    // For video.wixstatic.com URLs, Wix blocks server-side requests
    // We need to make it look like a browser request
    const headerSets: Record<string, string>[] = [];
    
    // Try OAuth token first (most reliable for authenticated content)
    try {
      const { getOAuthAccessToken } = await import('@/lib/wix-oauth-token');
      const oauthToken = await getOAuthAccessToken();
      if (oauthToken) {
        headerSets.push({
          'Authorization': `Bearer ${oauthToken}`,
          'wix-site-id': WIX_SITE_ID,
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Referer': 'https://www.wix.com/',
          'Origin': 'https://www.wix.com/',
          'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'identity',
          ...(range && { 'Range': range }),
        });
      }
    } catch (e) {
      console.log('⚠️ OAuth token not available');
    }
    
    // Add API key authentication if available
    if (WIX_API_KEY) {
      headerSets.push({
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Referer': 'https://www.wix.com/',
        'Origin': 'https://www.wix.com/',
        'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'identity',
        ...(range && { 'Range': range }),
      });
    }
    
    // Add browser-like headers (sometimes works for public videos)
    headerSets.push({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      'Referer': 'https://www.wix.com/',
      'Origin': 'https://www.wix.com/',
      'Accept': 'video/mp4,video/*;q=0.9,*/*;q=0.8',
      'Accept-Language': 'en-US,en;q=0.9',
      'Accept-Encoding': 'identity',
      ...(range && { 'Range': range }),
    });
    
    // Minimal headers as last resort
    headerSets.push({
      'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
      ...(range && { 'Range': range }),
    });

    let videoResponse: Response | null = null;
    let lastError: any = null;
    let successfulHeaderSet = -1;

    // Try each header set until one works
    for (let i = 0; i < headerSets.length; i++) {
      try {
        console.log(`🔄 Trying header set ${i + 1}/${headerSets.length}...`);
        videoResponse = await fetch(decodedUrl, {
          headers: headerSets[i],
        });

        if (videoResponse.ok) {
          console.log(`✅ Success with header set ${i + 1}!`);
          successfulHeaderSet = i + 1;
          break;
        } else {
          console.log(`❌ Header set ${i + 1} failed: ${videoResponse.status} ${videoResponse.statusText}`);
          if (i === headerSets.length - 1) {
            lastError = {
              status: videoResponse.status,
              statusText: videoResponse.statusText,
            };
          }
        }
      } catch (err) {
        console.error(`❌ Header set ${i + 1} error:`, err);
        if (i === headerSets.length - 1) {
          lastError = err;
        }
      }
    }

    if (!videoResponse || !videoResponse.ok) {
      console.error('❌ All header sets failed. Last error:', lastError);
      console.error('❌ Requested URL:', decodedUrl);
      console.error('❌ API Key present:', !!WIX_API_KEY);
      console.error('❌ Site ID:', WIX_SITE_ID);
      
      // Try to get error details from last response
      let errorText = 'Unknown error';
      if (videoResponse) {
        try {
          errorText = await videoResponse.text().catch(() => 'Could not read error');
        } catch {}
      }
      
      console.error('❌ Error details:', errorText.substring(0, 500));
      
      // For video.wixstatic.com URLs, 403 means Wix is blocking the request
      if (decodedUrl.includes('video.wixstatic.com') && videoResponse?.status === 403) {
        console.log('⚠️ Video is blocked by Wix (403 Forbidden)');
        console.log('💡 Possible reasons:');
        console.log('   1. Video is private/restricted in Wix Media Manager');
        console.log('   2. Wix is blocking server-side requests');
        console.log('   3. Video needs to be re-uploaded as public');
        console.log('💡 Solution: Make video public in Wix Media Manager or use a different video hosting service');
      }
      
      return NextResponse.json(
        { 
          error: 'Failed to fetch video from Wix',
          status: videoResponse?.status || 500,
          statusText: videoResponse?.statusText || 'Unknown error',
          url: decodedUrl,
          details: errorText.substring(0, 200),
          triedHeaderSets: headerSets.length,
          hasApiKey: !!WIX_API_KEY,
          siteId: WIX_SITE_ID,
          suggestion: decodedUrl.includes('video.wixstatic.com') && videoResponse?.status === 403
            ? 'Video might be private. Check Wix Media Manager settings and ensure video is set to Public.'
            : undefined
        },
        { status: videoResponse?.status || 500 }
      );
    }

    // Get the video content type and other headers
    const contentType = videoResponse.headers.get('content-type') || 'video/mp4';
    const contentLength = videoResponse.headers.get('content-length');
    const acceptRanges = videoResponse.headers.get('accept-ranges') || 'bytes';
    const contentRange = videoResponse.headers.get('content-range');

    console.log('✅ Video fetch successful:', {
      contentType,
      contentLength,
      status: videoResponse.status,
      hasRange: !!range,
      headerSet: successfulHeaderSet
    });

    // Get the video data
    const videoBuffer = await videoResponse.arrayBuffer();

    // Return response with proper headers for video streaming
    return new NextResponse(videoBuffer, {
      status: videoResponse.status, // Use original status (206 for partial content)
      headers: {
        'Content-Type': contentType,
        ...(contentLength && { 'Content-Length': contentLength }),
        ...(contentRange && { 'Content-Range': contentRange }),
        'Accept-Ranges': acceptRanges,
        'Cache-Control': 'public, max-age=3600', // Cache for 1 hour
        'Access-Control-Allow-Origin': '*', // Allow CORS
        'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
        'Access-Control-Allow-Headers': 'Range',
        'Access-Control-Expose-Headers': 'Content-Length, Content-Range, Accept-Ranges',
      },
    });
  } catch (error: any) {
    console.error('❌ Error proxying Wix video:', error);
    return NextResponse.json(
      { 
        error: 'Failed to proxy video',
        message: error.message,
        stack: process.env.NODE_ENV === 'development' ? error.stack : undefined
      },
      { status: 500 }
    );
  }
}

// Handle OPTIONS for CORS preflight
export async function OPTIONS(request: NextRequest) {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': 'Range',
      'Access-Control-Max-Age': '86400',
    },
  });
}
