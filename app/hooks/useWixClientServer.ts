// Server-side Wix Client Hook
// This provides a Wix client instance for server-side operations
// Uses visitor tokens for headless CMS (public data access)

import { wixDataClient } from '@/lib/wix-client';

/**
 * Get a Wix client instance for server-side operations
 * This uses visitor tokens for headless CMS access (public data)
 * 
 * For headless CMS with public data, Wix SDK automatically generates visitor tokens
 * when querying collections. The wixDataClient is configured with OAuth strategy
 * and will handle authentication automatically.
 */
export async function getWixClient() {
  try {
    // Return the data client which can query collections
    // The SDK will automatically generate visitor tokens for public data access
    return wixDataClient;
  } catch (error: any) {
    console.error('Error getting Wix client:', error);
    // Return the client anyway - errors will be handled by the calling code
    return wixDataClient;
  }
}
