import { NextRequest, NextResponse } from 'next/server';

// Debug endpoint to test cookie setting/reading
export async function GET(request: NextRequest) {
  const testState = 'test-state-' + Date.now();
  
  // Set a test cookie
  const response = NextResponse.json({
    message: 'Test cookie set',
    testState,
    cookies: Object.fromEntries(request.cookies.getAll().map(c => [c.name, c.value])),
  });
  
  response.cookies.set('wix_oauth_state', testState, {
    httpOnly: true,
    secure: true,
    sameSite: 'lax',
    maxAge: 600,
    path: '/',
  });
  
  return response;
}
