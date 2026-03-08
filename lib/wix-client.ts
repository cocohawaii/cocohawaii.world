// Wix SDK Client Setup
import { createClient, OAuthStrategy } from '@wix/sdk';
import { products } from '@wix/stores';
import { items } from '@wix/data';
import { files } from '@wix/media';

// Get Client ID from environment variables
const WIX_CLIENT_ID = process.env.NEXT_PUBLIC_WIX_CLIENT_ID;

if (!WIX_CLIENT_ID) {
  console.warn('NEXT_PUBLIC_WIX_CLIENT_ID is not set in environment variables');
}

// Additional environment variables (optional)
const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';
const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_METASITE_ID = process.env.NEXT_PUBLIC_WIX_METASITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

// Create Wix client with OAuth strategy for products/store and media
export const wixClient = createClient({
  modules: { 
    products,
    files,
  },
  auth: OAuthStrategy({ 
    clientId: WIX_CLIENT_ID || '',
  }),
});

// Create Wix Data client using OAuth Strategy with @wix/data module
export const wixDataClient = createClient({
  modules: { items },
  auth: OAuthStrategy({ 
    clientId: WIX_CLIENT_ID || '',
  }),
});
