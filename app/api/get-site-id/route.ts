import { NextRequest, NextResponse } from 'next/server';

const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';

export async function GET(request: NextRequest) {
  if (!WIX_API_KEY) {
    return NextResponse.json({
      error: 'WIX_API_KEY is not set',
      instructions: 'Make sure NEXT_PUBLIC_WIX_API_KEY is set in your .env.local file',
    }, { status: 400 });
  }

  const results: any = {
    attempts: [],
    instructions: 'Try these methods to get your Site ID:',
  };

  // Method 1: Try to list sites (might not work with this API key type)
  try {
    const sitesUrl = 'https://www.wixapis.com/sites/v2/sites';
    const response = await fetch(sitesUrl, {
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    results.attempts.push({
      method: 'Sites API',
      status: response.status,
      success: response.ok,
      data: response.ok ? responseData : null,
      error: !response.ok ? responseData : null,
    });
  } catch (error: any) {
    results.attempts.push({
      method: 'Sites API',
      error: error.message,
    });
  }

  // Method 2: Try to query collections endpoint without Site ID to see error
  try {
    const collectionsUrl = 'https://www.wixapis.com/data/v1/collections';
    const response = await fetch(collectionsUrl, {
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'Content-Type': 'application/json',
      },
    });

    const responseText = await response.text();
    let responseData;
    try {
      responseData = JSON.parse(responseText);
    } catch {
      responseData = { raw: responseText };
    }

    results.attempts.push({
      method: 'Collections API (no Site ID)',
      status: response.status,
      success: response.ok,
      data: response.ok ? responseData : null,
      error: !response.ok ? responseData : null,
    });
  } catch (error: any) {
    results.attempts.push({
      method: 'Collections API (no Site ID)',
      error: error.message,
    });
  }

  // Add instructions
  results.instructions = [
    '1. Go to https://www.wix.com/my-account/site-selector',
    '2. Select your site',
    '3. Click Settings (gear icon)',
    '4. Go to Advanced → Developer Tools',
    '5. Copy your Site ID (it looks like: abc123-def456-ghi789)',
    '6. Add it to .env.local as: NEXT_PUBLIC_WIX_SITE_ID=your_site_id_here',
    '7. Restart your dev server',
  ];

  return NextResponse.json(results);
}

