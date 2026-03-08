// Wix Headless CMS Integration
// Using Wix SDK and Data API for Headless CMS

import { wixClient } from './wix-client';

const WIX_SITE_ID = process.env.NEXT_PUBLIC_WIX_SITE_ID || '';
const WIX_METASITE_ID = process.env.NEXT_PUBLIC_WIX_METASITE_ID || '';
const WIX_API_KEY = process.env.NEXT_PUBLIC_WIX_API_KEY || '';

// Wix Data API base URL (fallback for direct API calls)
// Try different base URLs if one doesn't work
const WIX_API_BASE = `https://www.wixapis.com/data/v1`;
const WIX_API_BASE_ALTERNATIVES = [
  `https://www.wixapis.com/site-data/v1`,
  `https://www.wixapis.com/cms/v1`,
  `https://www.wixapis.com/wix-data/v1`,
];

// Wix "Date and Time" fields can be returned as { "$date": "ISO string" }. Normalize to string for correct parsing.
function normalizeWixDate(value: unknown): string | number | undefined {
  if (value == null) return undefined;
  if (typeof value === 'string' || typeof value === 'number') return value;
  if (typeof value === 'object' && value !== null && '$date' in value) {
    const d = (value as { $date?: string }).$date;
    return typeof d === 'string' ? d : undefined;
  }
  return undefined;
}

// Helper function to generate URL-friendly slug from title
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .trim()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Replace multiple hyphens with single hyphen
    .replace(/^-+|-+$/g, ''); // Remove leading/trailing hyphens
}

// Helper function to convert Wix video URLs to proper HTTP URLs
export function convertWixVideoUrl(wixUrl: string | undefined): string | undefined {
  if (!wixUrl) return undefined;
  
  // If it's already a proper HTTP/HTTPS URL, fix double encoding
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // Fix double encoding: %2520 -> %20, %2528 -> %28, etc.
    let fixed = wixUrl;
    // Replace all double-encoded sequences
    fixed = fixed.replace(/%25([0-9A-F]{2})/gi, '%$1');
    
    // Handle video.wixstatic.com URLs specifically
    if (fixed.includes('video.wixstatic.com')) {
      try {
        const url = new URL(fixed);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Remove 'video' from pathParts if it exists (it's part of the domain path, not the file path)
        // The path should be: /video/{fileId}/{filename}
        // After split: ['video', '{fileId}', '{filename}']
        // We want: {fileId} and {filename}
        const cleanPathParts = pathParts.filter(part => part !== 'video');
        
        if (cleanPathParts.length >= 1) {
          const fileId = cleanPathParts[0];
          
          // Transform to the working format: /1080p/mp4/file.mp4
          // This format works while the original filename format returns 403 Forbidden
          const properUrl = `https://video.wixstatic.com/video/${fileId}/1080p/mp4/file.mp4`;
          console.log(`🎥 Fixed video URL: ${wixUrl.substring(0, 80)}... -> ${properUrl}`);
          return properUrl;
        }
        
        return fixed;
      } catch (e) {
        console.error('Error processing video.wixstatic.com URL:', e);
        return fixed;
      }
    }
    
    // For other HTTP/HTTPS URLs, just fix double encoding
    return fixed;
  }
  
  // Handle wix:video:// format
  if (wixUrl.startsWith('wix:video://')) {
    const videoMatch = wixUrl.match(/wix:video:\/\/v1\/([^#]+)/);
    if (videoMatch && videoMatch[1]) {
      const videoPath = videoMatch[1];
      const pathSegments = videoPath.split('/');
      
      if (pathSegments.length >= 1) {
        const fileId = pathSegments[0];
        // Use the working format: /1080p/mp4/file.mp4
        const convertedUrl = `https://video.wixstatic.com/video/${fileId}/1080p/mp4/file.mp4`;
        console.log(`🎥 Converted Wix video: ${wixUrl.substring(0, 60)}... -> ${convertedUrl}`);
        return convertedUrl;
      }
    }
  }
  
  // If URL already contains video.wixstatic.com, clean it up
  if (wixUrl.includes('video.wixstatic.com')) {
    try {
      // Fix double encoding
      let fixed = wixUrl.replace(/%25([0-9A-F]{2})/gi, '%$1');
      const urlObj = new URL(fixed);
      const pathParts = urlObj.pathname.split('/').filter(Boolean);
      
      // Remove duplicate 'video' segments - should be /video/{fileId}/{filename}
      const cleanPathParts: string[] = [];
      let foundVideo = false;
      for (const part of pathParts) {
        if (part === 'video' && !foundVideo) {
          foundVideo = true;
          continue; // Skip the first 'video' segment (it's part of the path structure)
        }
        cleanPathParts.push(part);
      }
      
      // Reconstruct: /video/{fileId}/1080p/mp4/file.mp4 (working format)
      if (cleanPathParts.length >= 1) {
        const fileId = cleanPathParts[0];
        const properUrl = `https://video.wixstatic.com/video/${fileId}/1080p/mp4/file.mp4`;
        console.log(`🎥 Cleaned video URL: ${wixUrl.substring(0, 80)}... -> ${properUrl}`);
        return properUrl;
      }
      
      return fixed;
    } catch (e) {
      console.error('Error cleaning video.wixstatic.com URL:', e);
      return wixUrl;
    }
  }
  
  return wixUrl;
}

// Helper function to convert Wix image URLs to proper HTTP URLs
function convertWixImageUrl(wixUrl: string | undefined): string | undefined {
  if (!wixUrl) return undefined;
  
  // If it's already a proper HTTP/HTTPS URL, return as-is (but clean up if needed)
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // Clean up malformed URLs that might have double paths
    // Example: https://static.wixstatic.com/media/path.png/filename.png -> https://static.wixstatic.com/media/path.png
    if (wixUrl.includes('static.wixstatic.com')) {
      // Pattern to match URLs with an extra filename after the extension
      // Matches: https://static.wixstatic.com/media/filename.ext/extra -> https://static.wixstatic.com/media/filename.ext
      const cleanUrlMatch = wixUrl.match(/^(https:\/\/static\.wixstatic\.com\/media\/[^/]+\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff|ico))(?:\/[^?]*)?/i);
      if (cleanUrlMatch && cleanUrlMatch[1] && cleanUrlMatch[1] !== wixUrl) {
        const cleanUrl = cleanUrlMatch[1];
        // Only log if URL was actually changed
        if (cleanUrl !== wixUrl) {
          console.log(`🧹 Cleaned Wix image URL: ${wixUrl.substring(0, 100)}... -> ${cleanUrl}`);
        }
        return cleanUrl;
      }
      
      // Alternative pattern: match everything up to the first extension followed by slash and more characters
      const altMatch = wixUrl.match(/^(https:\/\/static\.wixstatic\.com\/media\/.+?\.(png|jpg|jpeg|webp|gif|svg|bmp|tiff|ico))(?:\/[^/]+)/i);
      if (altMatch && altMatch[1]) {
        console.log(`🧹 Cleaned Wix image URL (alt): ${wixUrl.substring(0, 100)}... -> ${altMatch[1]}`);
        return altMatch[1];
      }
    }
    return wixUrl;
  }
  
  // Convert wix:image:// format to proper URL
  // Format: wix:image://v1/1510fb_bedb8c59e47e42c7962407606df12416~mv2.png/image00002-cutout-Topv2.png#originWidth=3024&originHeight=3024
  if (wixUrl.startsWith('wix:image://')) {
    // Extract the image path from wix:image://v1/... (everything before # or end of string)
    const match = wixUrl.match(/wix:image:\/\/v1\/([^#]+)/);
    if (match && match[1]) {
      let imagePath = match[1];
      
      // If path contains a slash after a file extension, take only the first part (the actual file)
      // Example: "1510fb_xxx~mv2.png/filename.png" -> "1510fb_xxx~mv2.png"
      if (imagePath.includes('/') && imagePath.match(/\.(png|jpg|jpeg|webp|gif)\//i)) {
        const firstPart = imagePath.split('/')[0];
        // Only use first part if it looks like a valid filename (has extension)
        if (firstPart.match(/\.(png|jpg|jpeg|webp|gif)/i)) {
          imagePath = firstPart;
        }
      }
      
      // Convert to Wix CDN URL - only encode the filename, not the entire path
      // Pattern: https://static.wixstatic.com/media/{path}
      return `https://static.wixstatic.com/media/${imagePath}`;
    }
    
    // Fallback: try to extract any path after v1/
    const fallbackMatch = wixUrl.match(/wix:image:\/\/v1\/(.+)/);
    if (fallbackMatch && fallbackMatch[1]) {
      let imagePath = fallbackMatch[1].split('#')[0]; // Remove hash if present
      
      // Clean up path if it has double filename
      if (imagePath.includes('/') && imagePath.match(/\.(png|jpg|jpeg|webp|gif)\//i)) {
        const firstPart = imagePath.split('/')[0];
        if (firstPart.match(/\.(png|jpg|jpeg|webp|gif)/i)) {
          imagePath = firstPart;
        }
      }
      
      return `https://static.wixstatic.com/media/${imagePath}`;
    }
  }
  
  // If we can't convert it, return as-is (might cause errors but better than crashing)
  console.warn(`⚠️ Could not convert Wix image URL: ${wixUrl}`);
  return wixUrl;
}

// Types matching your Wix CMS fields
export interface Hat {
  _id: string;
  title: string;
  hatSubtitle?: string;
  hatDescription?: string;
  price: number;
  discountedPrice?: number;
  mainHatImage?: string;
  topVideoEyes?: string;
  makingOfProductPage?: string;
  gallery?: Array<{ src: string; alt?: string }>;
  hatSize?: string;
  collection?: string;
  slug?: string;
  isActive?: boolean;
}

export interface Collection {
  _id: string;
  name: string;
  description?: string;
  image?: string;
  slug?: string;
}

export interface HatOrder {
  hatorderName: string;
  hatorderEmail: string;
  hatorderMobile: string;
  hatorderCustomAsk?: string;
  hatOrderPrice: number;
  hatOrderSubtitle?: string;
  hatOrdertitle: string;
  hatOrderCreatedOn: Date;
  hatOrderID: string;
  shippingCost?: number;
  totalFinalCost?: number;
  orderAddress?: string;
}

// Helper function to fetch from Wix Data API using REST (for server-side)
// Now uses OAuth access tokens instead of API Keys/IST tokens
export async function fetchWixData(collection: string, options?: {
  filter?: Record<string, any>;
  sort?: Array<{ fieldName: string; order: 'ASC' | 'DESC' }>;
  limit?: number;
  accessToken?: string; // OAuth access token
}) {
  // Try to get OAuth access token first
  let accessToken = options?.accessToken;
  
  if (!accessToken) {
    try {
      const { getOAuthAccessToken } = await import('./wix-oauth-token');
      accessToken = await getOAuthAccessToken() || undefined;
    } catch (error) {
      // If we can't get token (e.g., in middleware), continue with fallback
    }
  }

  // If no access token and no API key, return empty data
  if (!accessToken && (!WIX_API_KEY || !WIX_SITE_ID || WIX_API_KEY === 'your_wix_api_key_here' || WIX_SITE_ID === 'your_wix_site_id_here')) {
    console.log(`⚠️ Wix API not configured - returning empty data for ${collection}`);
    console.log(`   OAuth Token: ${accessToken ? 'Set' : 'Missing'}`);
    console.log(`   WIX_API_KEY: ${WIX_API_KEY ? 'Set (fallback)' : 'Missing'}`);
    console.log(`   WIX_SITE_ID: ${WIX_SITE_ID ? 'Set' : 'Missing'}`);
    
    // If no OAuth token, suggest user needs to authenticate
    if (!accessToken) {
      console.log(`   💡 User needs to authenticate: Visit /api/wix/login`);
    }
    
    return { items: [] };
  }

  try {
    const queryParams = new URLSearchParams();
    
    if (options?.filter) {
      queryParams.append('filter', JSON.stringify(options.filter));
    }
    if (options?.sort) {
      queryParams.append('sort', JSON.stringify(options.sort));
    }
    if (options?.limit) {
      queryParams.append('limit', options.limit.toString());
    }

    // Try the main base URL first, then alternatives if it fails
    const baseUrls = [WIX_API_BASE, ...WIX_API_BASE_ALTERNATIVES];
    let lastError: any = null;

    for (const baseUrl of baseUrls) {
      // Try both with and without URL encoding for collection name
    const encodedCollection = encodeURIComponent(collection);
    const url = `${baseUrl}/collections/${encodedCollection}/items${queryParams.toString() ? `?${queryParams.toString()}` : ''}`;
      
      // Add timeout to prevent hanging
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 5000);
      
      // Use OAuth access token if available, otherwise fallback to API Key/IST token
      let authHeader: string;
      if (accessToken) {
        // OAuth access token uses Bearer authentication
        authHeader = `Bearer ${accessToken}`;
      } else if (WIX_API_KEY) {
        // Fallback: API Keys use Bearer, IST tokens use direct token
        const isApiKey = !WIX_API_KEY.startsWith('IST.');
        authHeader = isApiKey ? `Bearer ${WIX_API_KEY}` : WIX_API_KEY;
      } else {
        // No authentication available
        continue;
      }
      
      const WIX_ACCOUNT_ID = process.env.NEXT_PUBLIC_WIX_ACCOUNT_ID || '';
      
      // Headers for API request
      const headers: Record<string, string> = {
        'Authorization': authHeader,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      };
      
      // Try both Site ID and Metasite ID
      const siteIdsToTry = [WIX_SITE_ID, WIX_METASITE_ID].filter(Boolean);
      
      for (const siteId of siteIdsToTry) {
        const testHeaders = { ...headers };
        if (siteId) {
          testHeaders['wix-site-id'] = siteId;
        }
        
        // Add Account ID (often required with API Keys)
        if (WIX_ACCOUNT_ID) {
          testHeaders['wix-account-id'] = WIX_ACCOUNT_ID;
        }
        
        try {
          const response = await fetch(url, {
            headers: testHeaders,
            cache: 'no-store',
            signal: controller.signal,
          });

          clearTimeout(timeoutId);

          if (response.ok) {
            const data = await response.json();
            const itemCount = data.items?.length || 0;
            console.log(`✅ Successfully fetched ${itemCount} items from "${collection}" using ${baseUrl} with Site ID: ${siteId}`);
            return data;
          } else if (response.status !== 404) {
            // If it's not a 404, this might be the right endpoint but with wrong auth
            const errorText = await response.text();
            let errorData;
            try {
              errorData = JSON.parse(errorText);
            } catch {
              errorData = { raw: errorText };
            }
            lastError = { baseUrl, siteId, status: response.status, error: errorData };
            // Continue to next site ID
            continue;
          }
          // If 404, try next site ID
        } catch (fetchError: any) {
          clearTimeout(timeoutId);
          if (fetchError.name !== 'AbortError') {
            lastError = { baseUrl, siteId, error: fetchError.message };
          }
          // Continue to next site ID
          continue;
        }
      }
      
      // If we tried all site IDs and still failed, try next base URL
      // (continue is implicit in the for loop)
    }

    // If we get here, all base URLs failed
    if (lastError) {
      console.error(`❌ Wix API error for collection "${collection}":`);
      console.error(`   Tried base URLs: ${baseUrls.join(', ')}`);
      console.error(`   Last error:`, lastError);
    } else {
      console.error(`❌ All API endpoints returned 404 for collection "${collection}"`);
      console.error(`   This suggests the collection name or API structure is incorrect`);
    }
    
    return { items: [], error: lastError || { message: 'All endpoints returned 404' } };
  } catch (error: any) {
    if (error.name === 'AbortError') {
      console.error(`Wix API timeout for ${collection}`);
    } else {
      console.error(`Error fetching ${collection}:`, error);
    }
    // Return empty data structure so page still loads
    return { items: [] };
  }
}

// Fetch all hats - Phase 5: uses Supabase (replaces Wix CocoHawaiiExoticHats)
export async function getHats(collectionId?: string, options?: { rawVideoUrls?: boolean }): Promise<Hat[]> {
  const { getHatsFromSupabase } = await import('@/lib/supabase-hats');
  return getHatsFromSupabase(collectionId, { rawVideoUrls: options?.rawVideoUrls, activeOnly: false });
}

// Fetch a single hat by ID or slug - Phase 5: uses Supabase
export async function getHat(idOrSlug: string): Promise<Hat | null> {
  const { getHatFromSupabase } = await import('@/lib/supabase-hats');
  return getHatFromSupabase(idOrSlug, { rawVideoUrls: false });
}

// Fetch all collections
export async function getCollections(): Promise<Collection[]> {
  try {
    // Try SDK approach first
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      
      // Note: listDataCollections requires elevated permissions
      // For now, return empty array or use REST API fallback
      // If you need to list collections, you may need to use REST API
      console.log('⚠️ listDataCollections requires elevated permissions, using REST API fallback');
      
      // Return empty array as fallback since we can't list collections via SDK
      return [];
    } catch (sdkError: any) {
      console.log(`SDK approach failed for collections, trying REST API: ${sdkError.message}`);
    }
    
    // Fallback to REST API
    const data = await fetchWixData('collections');
    return data.items || [];
  } catch (error) {
    console.error('Error fetching collections:', error);
    return [];
  }
}

// Fetch a single collection by ID or slug
export async function getCollection(idOrSlug: string): Promise<Collection | null> {
  try {
    const data = await fetchWixData('collections', { 
      filter: { _id: idOrSlug },
      limit: 1 
    });
    return data.items?.[0] || null;
  } catch (error) {
    console.error('Error fetching collection:', error);
    return null;
  }
}

// Fetch hats in a collection
export async function getHatsByCollection(collectionId: string): Promise<Hat[]> {
  return getHats(collectionId);
}

// Interface for PageVideos collection
export interface PageVideo {
  _id: string;
  tagPages?: string | string[]; // Tag field - can be string or array
  pageVideo?: string | { // Video field - can be string URL or object
    url?: string;
    fileUrl?: string;
    fileName?: string;
    width?: number;
    height?: number;
    [key: string]: any; // Allow other properties
  };
}

// Fetch page video by tag
export async function getPageVideoByTag(tag: string): Promise<PageVideo | null> {
  try {
    console.log(`🎬 Fetching PageVideos with tag: "${tag}"`);
    const collectionName = 'PageVideos';
    
    // Try SDK approach first (preferred method)
    // Note: Tag fields in Wix are often better queried by fetching all and filtering client-side
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      
      // Fetch all PageVideos items (tag fields work better this way)
      console.log(`📋 Fetching all PageVideos items from SDK...`);
      const allResult = await wixClient.items.query(collectionName).limit(100).find();
      
      console.log(`📊 Found ${allResult.items?.length || 0} PageVideos items`);
      
      if (allResult.items && allResult.items.length > 0) {
        // Log all items for debugging
        allResult.items.forEach((item: any, index: number) => {
          const itemData = item.data || item;
          console.log(`  Item ${index + 1}:`, {
            _id: item._id || itemData._id,
            tagPages: itemData.tagPages,
            tagPagesType: typeof itemData.tagPages,
            hasPageVideo: !!itemData.pageVideo,
            pageVideoType: typeof itemData.pageVideo,
            allFields: Object.keys(itemData),
          });
        });
        
        // Find the item that matches the tag
        const found = allResult.items.find((item: any) => {
          const itemData = item.data || item;
          if (!itemData.tagPages) {
            console.log(`  ⚠️ Item ${item._id} has no tagPages field`);
            return false;
          }
          
          // Handle different tag field formats
          let tags: string[] = [];
          if (Array.isArray(itemData.tagPages)) {
            tags = itemData.tagPages.map((t: any) => String(t).toLowerCase().trim());
          } else if (typeof itemData.tagPages === 'string') {
            // If it's a string, it might be comma-separated or single value
            tags = itemData.tagPages.split(',').map((t: string) => t.toLowerCase().trim());
          } else {
            tags = [String(itemData.tagPages).toLowerCase().trim()];
          }
          
          const normalizedTag = tag.toLowerCase().trim();
          const matches = tags.some((t: string) => t === normalizedTag);
          
          if (matches) {
            console.log(`  ✅ Found match! Item ${item._id} has tags:`, tags, `matches "${normalizedTag}"`);
          }
          
          return matches;
        });
        
        if (found) {
          const itemData = found.data || found;
          
          // Extract video URL - handle both string and object formats
          let rawVideoUrl: string | undefined;
          if (typeof itemData.pageVideo === 'string') {
            rawVideoUrl = itemData.pageVideo;
          } else if (itemData.pageVideo && typeof itemData.pageVideo === 'object') {
            // Wix video objects have url, fileUrl, or direct properties
            rawVideoUrl = itemData.pageVideo.url || itemData.pageVideo.fileUrl || itemData.pageVideo.src;
            console.log(`📹 Video field is an object:`, {
              hasUrl: !!itemData.pageVideo.url,
              hasFileUrl: !!itemData.pageVideo.fileUrl,
              hasSrc: !!itemData.pageVideo.src,
              allKeys: Object.keys(itemData.pageVideo),
            });
          }
          
          const videoUrl = convertWixVideoUrl(rawVideoUrl);
          console.log(`✅ Found PageVideo with tag "${tag}" using SDK`);
          console.log(`   Video field type: ${typeof itemData.pageVideo}`);
          console.log(`   Video URL (raw): ${rawVideoUrl ? rawVideoUrl.substring(0, 100) : 'null'}...`);
          console.log(`   Video URL (converted): ${videoUrl ? videoUrl.substring(0, 100) : 'null'}...`);
          
          return {
            _id: found._id || itemData._id,
            tagPages: itemData.tagPages,
            pageVideo: videoUrl, // Convert video URL
          };
        } else {
          console.log(`❌ No PageVideo found with tag "${tag}" after checking ${allResult.items.length} items`);
        }
      } else {
        console.log(`⚠️ PageVideos collection is empty or not accessible`);
      }
    } catch (sdkError: any) {
      console.error(`❌ SDK approach failed: ${sdkError.message}`);
      console.error(`   Stack: ${sdkError.stack}`);
      console.log(`   Trying REST API fallback...`);
    }
    
    // Fallback to REST API
    const data = await fetchWixData(collectionName, {
      filter: {
        tagPages: tag // Direct match if it's a string field
      },
      limit: 100
    });
    
    if (data.items && data.items.length > 0) {
      // Find the item that matches the tag (in case tagPages is an array)
      const found = data.items.find((item: PageVideo) => {
        if (!item.tagPages) return false;
        const tags = Array.isArray(item.tagPages) ? item.tagPages : [item.tagPages].filter(Boolean);
        return tags.some(t => String(t).toLowerCase() === tag.toLowerCase());
      });
      
      if (found) {
        // Extract video URL - handle both string and object formats
        let rawVideoUrl: string | undefined;
        if (typeof found.pageVideo === 'string') {
          rawVideoUrl = found.pageVideo;
        } else if (found.pageVideo && typeof found.pageVideo === 'object') {
          rawVideoUrl = found.pageVideo.url || found.pageVideo.fileUrl || found.pageVideo.src;
          console.log(`📹 Video field is an object (REST API):`, Object.keys(found.pageVideo));
        }
        
        const videoUrl = convertWixVideoUrl(rawVideoUrl);
        console.log(`✅ Found PageVideo with tag "${tag}" using REST API`);
        return {
          ...found,
          pageVideo: videoUrl, // Convert video URL
        };
      }
    }
    
    // If no results, try fetching all and filtering client-side
    console.log(`⚠️ No direct REST match found, fetching all PageVideos...`);
    const dataArray = await fetchWixData(collectionName, {
      limit: 100 // Get all and filter client-side
    });
    
    if (dataArray.items && dataArray.items.length > 0) {
      const found = dataArray.items.find((item: PageVideo) => {
        if (!item.tagPages) return false;
        const tags = Array.isArray(item.tagPages) ? item.tagPages : [item.tagPages].filter(Boolean);
        return tags.some(t => String(t).toLowerCase() === tag.toLowerCase());
      });
      
      if (found) {
        // Extract video URL - handle both string and object formats
        let rawVideoUrl: string | undefined;
        if (typeof found.pageVideo === 'string') {
          rawVideoUrl = found.pageVideo;
        } else if (found.pageVideo && typeof found.pageVideo === 'object') {
          rawVideoUrl = found.pageVideo.url || found.pageVideo.fileUrl || found.pageVideo.src;
        }
        
        const videoUrl = convertWixVideoUrl(rawVideoUrl);
        console.log(`✅ Found PageVideo with tag "${tag}" (REST client-side filter)`);
        return {
          ...found,
          pageVideo: videoUrl, // Convert video URL
        };
      }
    }
    
    console.log(`❌ No PageVideo found with tag "${tag}"`);
    return null;
  } catch (error) {
    console.error('❌ Error fetching page video:', error);
    return null;
  }
}

// Create a new order
export async function createOrder(order: Omit<HatOrder, '_id'>): Promise<string> {
  try {
    const url = `${WIX_API_BASE}/collections/hatOrders/items`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataItem: order }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create order: ${errorText}`);
      throw new Error(`Failed to create order: ${response.statusText}`);
    }

    const result = await response.json();
    return result.dataItem?._id || result._id;
  } catch (error) {
    console.error('Error creating order:', error);
    throw error;
  }
}

// Update an order
export async function updateOrder(orderId: string, updates: Partial<HatOrder>): Promise<void> {
  try {
    const url = `${WIX_API_BASE}/collections/hatOrders/items/${orderId}`;
    const response = await fetch(url, {
      method: 'PATCH',
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataItem: updates }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to update order: ${errorText}`);
      throw new Error(`Failed to update order: ${response.statusText}`);
    }
  } catch (error) {
    console.error('Error updating order:', error);
    throw error;
  }
}

// Generate next order ID
export async function getNextOrderId(): Promise<string> {
  try {
    const data = await fetchWixData('hatOrders', {
      sort: [{ fieldName: 'hatOrderID', order: 'DESC' }],
      limit: 1
    });
    if (data.items && data.items.length > 0) {
      const lastOrderId = data.items[0].hatOrderID?.replace('CHhatOrder', '') || '0';
      const nextNumber = parseInt(lastOrderId) + 1;
      return `CHhatOrder${nextNumber}`;
    }
    return 'CHhatOrder1';
  } catch (error) {
    console.error('Error getting next order ID:', error);
    return 'CHhatOrder1';
  }
}

// ============================================================
// AUCTION BIDDING FUNCTIONS
// ============================================================

// Import auction types
import type { ArtCreationBidding, ArtAllBidsMade, Member, Raffle, RaffleEntry } from './wix-types';

// Fetch all active auction items
export async function getAuctionItems(): Promise<ArtCreationBidding[]> {
  try {
    // Try "Copy of ArtCreationBidding" first (where you likely set Feb/Mar dates); fallback to ArtCreationBidding
    const collectionCandidates = ['Copy of ArtCreationBidding', 'ArtCreationBidding'];

    // Helper to fetch from a single collection using SDK, then REST
    const fetchFromCollection = async (collectionName: string): Promise<ArtCreationBidding[]> => {
      // Try SDK approach first
      try {
        const { getWixClient } = await import('@/app/hooks/useWixClientServer');
        const wixClient = await getWixClient();
        
        const query = wixClient.items.query(collectionName);
        query.eq('activeBidItem', true);
        query.ascending('launchBidItemDate');
        
        const result = await query.limit(1000).find();
        
        if (result.items && result.items.length > 0) {
          console.log(`✅ Found ${result.items.length} auction items from "${collectionName}" using Wix SDK`);
          return result.items.map((item: any) => {
            const data = item.data || item;
            return {
              _id: item._id,
              ...data,
              imageBidItem: convertWixImageUrl(data.imageBidItem) || data.imageBidItem,
              // Wix Date and Time fields can be { $date: "ISO" }; normalize so frontend parses correctly
              launchBidItemDate: normalizeWixDate(data.launchBidItemDate) ?? data.launchBidItemDate,
              auctionItemEndDate: normalizeWixDate(data.auctionItemEndDate) ?? data.auctionItemEndDate,
              auctionItemVisibleDate: normalizeWixDate(data.auctionItemVisibleDate) ?? data.auctionItemVisibleDate,
            };
          }) as ArtCreationBidding[];
        }
      } catch (sdkError: any) {
        console.error(`❌ SDK approach failed for auction items in "${collectionName}": ${sdkError.message}`);
      }
      
      // Fallback to REST API (wrap in try/catch so a bad collection name doesn't break trying the next candidate)
      try {
        const data = await fetchWixData(collectionName, {
          filter: { activeBidItem: true },
          sort: [{ fieldName: 'launchBidItemDate', order: 'ASC' }],
          limit: 1000
        });
        
        if (data.items && data.items.length > 0) {
          console.log(`✅ Found ${data.items.length} auction items from "${collectionName}" using REST API`);
          return (data.items as any[]).map((row) => ({
            ...row,
            imageBidItem: convertWixImageUrl(row.imageBidItem) || row.imageBidItem,
            launchBidItemDate: normalizeWixDate(row.launchBidItemDate) ?? row.launchBidItemDate,
            auctionItemEndDate: normalizeWixDate(row.auctionItemEndDate) ?? row.auctionItemEndDate,
            auctionItemVisibleDate: normalizeWixDate(row.auctionItemVisibleDate) ?? row.auctionItemVisibleDate,
          })) as ArtCreationBidding[];
        }
      } catch (restError: any) {
        console.error(`❌ REST fallback failed for "${collectionName}": ${restError?.message || restError}`);
      }

      return [];
    };

    // Try each candidate collection until we find items
    for (const collectionName of collectionCandidates) {
      const items = await fetchFromCollection(collectionName);
      if (items.length > 0) {
        return items;
      }
    }
    
    console.warn('⚠️ No auction items found in any ArtCreationBidding collection candidate');
    return [];
  } catch (error: any) {
    console.error('❌ Error fetching auction items:', error);
    return [];
  }
}

// Fetch a single auction item by ID. Use same collection order as getAuctionItems so list _id resolves.
export async function getAuctionItem(itemId: string): Promise<ArtCreationBidding | null> {
  try {
    const collectionCandidates = ['Copy of ArtCreationBidding', 'ArtCreationBidding'];
    
    // Helper to fetch a single item from a specific collection
    const fetchOne = async (collectionName: string): Promise<ArtCreationBidding | null> => {
      // Try SDK approach first
      try {
        const { getWixClient } = await import('@/app/hooks/useWixClientServer');
        const wixClient = await getWixClient();
        
        const item = await (wixClient.items as any).get(collectionName, itemId);
        if (item) {
          const data = item.data || item;
          return {
            _id: item._id,
            ...data,
            imageBidItem: convertWixImageUrl(data.imageBidItem) || data.imageBidItem,
            launchBidItemDate: normalizeWixDate(data.launchBidItemDate) ?? data.launchBidItemDate,
            auctionItemEndDate: normalizeWixDate(data.auctionItemEndDate) ?? data.auctionItemEndDate,
            auctionItemVisibleDate: normalizeWixDate(data.auctionItemVisibleDate) ?? data.auctionItemVisibleDate,
          } as ArtCreationBidding;
        }
      } catch (sdkError: any) {
        console.error(`❌ SDK approach failed for single auction item in "${collectionName}": ${sdkError.message}`);
      }
      
      // Fallback to REST API
      const data = await fetchWixData(collectionName, {
        filter: { _id: itemId },
        limit: 1
      });
      
      if (data.items?.[0]) {
        const row: any = data.items[0];
        return {
          ...row,
          imageBidItem: convertWixImageUrl(row.imageBidItem) || row.imageBidItem,
          launchBidItemDate: normalizeWixDate(row.launchBidItemDate) ?? row.launchBidItemDate,
          auctionItemEndDate: normalizeWixDate(row.auctionItemEndDate) ?? row.auctionItemEndDate,
          auctionItemVisibleDate: normalizeWixDate(row.auctionItemVisibleDate) ?? row.auctionItemVisibleDate,
        } as ArtCreationBidding;
      }
      return null;
    };

    for (const collectionName of collectionCandidates) {
      const item = await fetchOne(collectionName);
      if (item) {
        return item;
      }
    }
    
    return null;
  } catch (error: any) {
    console.error('❌ Error fetching auction item:', error);
    return null;
  }
}

// Update an auction item
export async function updateAuctionItem(itemId: string, updates: Partial<ArtCreationBidding>): Promise<void> {
  const collectionCandidates = ['Copy of ArtCreationBidding', 'ArtCreationBidding', 'Art Creation Bidding'];
  let lastError: any = null;

  // Try SDK first (same pattern as getAuctionItem/createBid)
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    const items = wixClient.items as any;

    if (items?.update) {
      for (const collectionName of collectionCandidates) {
        try {
          const existing = await (wixClient.items as any).get(collectionName, itemId);
          if (existing) {
            const data = existing.data || existing;
            const merged = { ...data, ...updates, _id: itemId };
            await items.update(collectionName, merged);
            return;
          }
        } catch {
          continue;
        }
      }
    }
    if (items?.patch) {
      for (const collectionName of collectionCandidates) {
        try {
          let patch = items.patch(collectionName, itemId);
          for (const [key, value] of Object.entries(updates)) {
            if (value !== undefined && typeof patch?.setField === 'function') {
              patch = patch.setField(key, value);
            }
          }
          if (typeof patch?.run === 'function') {
            await patch.run();
            return;
          }
        } catch {
          continue;
        }
      }
    }
  } catch (sdkErr: any) {
    console.error('updateAuctionItem SDK failed, trying REST:', sdkErr?.message);
  }

  // REST fallback
  for (const collectionName of collectionCandidates) {
    try {
      const url = `${WIX_API_BASE}/collections/${encodeURIComponent(collectionName)}/items/${encodeURIComponent(itemId)}`;
      const response = await fetch(url, {
        method: 'PATCH',
        headers: {
          'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
          'wix-site-id': WIX_SITE_ID,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ dataItem: updates }),
      });

      if (response.ok) return;

      const errorText = await response.text();
      if (response.status !== 404) {
        console.error(`Failed to update auction item in "${collectionName}": ${errorText}`);
      }
      lastError = new Error(`Failed to update auction item: Not Found`);
    } catch (err: any) {
      lastError = err;
    }
  }

  throw lastError || new Error('Failed to update auction item: Not Found');
}

// Create a bid record. Use SDK first (same as getMember) so we use the API that works for your site.
export async function createBid(bid: Omit<ArtAllBidsMade, '_id'>): Promise<string> {
  const toInsert = { ...bid, bidDate: bid.bidDate instanceof Date ? bid.bidDate.toISOString() : bid.bidDate };
  const collectionCandidates = ['ArtAllBids', 'Art All Bids'];

  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    const items = wixClient.items as any;
    if (items?.insert) {
      for (const name of collectionCandidates) {
        try {
          const inserted = await items.insert(name, toInsert);
          const id = inserted?._id ?? inserted?.id;
          if (id) return String(id);
        } catch {
          continue;
        }
      }
    }
  } catch (sdkErr: any) {
    console.error('createBid SDK failed, trying REST:', sdkErr?.message);
  }

  for (const collectionName of collectionCandidates) {
    const url = `${WIX_API_BASE}/collections/${encodeURIComponent(collectionName)}/items`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataItem: toInsert }),
    });
    if (response.ok) {
      const result = await response.json();
      return result.dataItem?._id || result._id || '';
    }
    if (response.status !== 404) {
      const errorText = await response.text();
      console.error(`Failed to create bid: ${errorText}`);
      throw new Error(`Failed to create bid: ${response.statusText}`);
    }
  }
  throw new Error('Failed to create bid: Not Found');
}

// Get bids for a specific item
export async function getBidsForItem(itemId: string): Promise<ArtAllBidsMade[]> {
  try {
    const data = await fetchWixData('ArtAllBids', {
      filter: { itemId },
      sort: [{ fieldName: 'bidDate', order: 'DESC' }],
      limit: 1000
    });
    return data.items as ArtAllBidsMade[] || [];
  } catch (error: any) {
    console.error('Error fetching bids:', error);
    return [];
  }
}

// Get bids for a specific member
export async function getBidsForMember(memberId: string): Promise<ArtAllBidsMade[]> {
  try {
    const data = await fetchWixData('ArtAllBids', {
      filter: { memberId },
      sort: [{ fieldName: 'bidDate', order: 'DESC' }],
      limit: 1000
    });
    return data.items as ArtAllBidsMade[] || [];
  } catch (error: any) {
    console.error('Error fetching member bids:', error);
    return [];
  }
}

// Get member by email - uses EXACT same logic as login API (members CMS, starBids, etc.)
export async function getMemberByEmail(email: string): Promise<Member | null> {
  const emailLower = email.toLowerCase().trim();
  if (!emailLower) return null;

  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    const collectionName = 'members';

    let results;
    try {
      const query = wixClient.items.query(collectionName);
      query.eq('memberemail', emailLower);
      results = await query.find();
    } catch {
      const query = wixClient.items.query(collectionName);
      query.eq('memberEmail', email);
      results = await query.find();
    }

    if (!results?.items?.length) return null;

    const memberItem = results.items.find((m: any) => {
      const d = m.data || m;
      const em = (d.memberemail || d.memberEmail || '').toLowerCase().trim();
      return em === emailLower;
    });
    if (!memberItem) return null;

    const data = memberItem.data || memberItem;
    return { _id: memberItem._id, ...data } as Member;
  } catch (e: any) {
    console.error('getMemberByEmail SDK failed:', e?.message);
  }

  for (const field of ['memberemail', 'memberEmail']) {
    try {
      const data = await fetchWixData('members', { filter: { [field]: emailLower }, limit: 1 });
      if (data.items?.[0]) return data.items[0] as Member;
    } catch { continue; }
  }
  return null;
}

// Get member by ID or email. Uses same SDK approach as login API (ProfileDropdown).
export async function getMember(memberIdOrEmail: string, byEmail: boolean = false): Promise<Member | null> {
  if (byEmail) return getMemberByEmail(memberIdOrEmail);

  try {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const collectionName = 'members';

      const isUuid = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(memberIdOrEmail);
      if (isUuid) {
        try {
          const item = await (wixClient.items as any).get(collectionName, memberIdOrEmail);
          if (item) {
            const data = item.data || item;
            return { _id: item._id, ...data } as Member;
          }
        } catch {
          /* fall through to query */
        }
      }
      for (const field of ['memberId', 'MemberId', 'memberid']) {
        try {
          const query = wixClient.items.query(collectionName);
          query.eq(field, memberIdOrEmail);
          const results = await query.limit(1).find();
          if (results.items?.[0]) {
            const item = results.items[0];
            const data = item.data || item;
            return { _id: item._id, ...data } as Member;
          }
        } catch {
          continue;
        }
      }
      if (!isUuid) {
        try {
          const item = await (wixClient.items as any).get(collectionName, memberIdOrEmail);
          if (item) {
            const data = item.data || item;
            return { _id: item._id, ...data } as Member;
          }
        } catch {
          /* ignore */
        }
      }
      return null;
    } catch (sdkError: any) {
      console.error('getMember SDK failed, trying REST:', sdkError?.message);
    }

    if (byEmail) {
      const emailLower = memberIdOrEmail.toLowerCase().trim();
      for (const field of ['memberemail', 'memberEmail']) {
        const data = await fetchWixData('members', {
          filter: { [field]: emailLower },
          limit: 1
        });
        if (data.items?.[0]) return data.items[0] as Member;
      }
      return null;
    }
    let data = await fetchWixData('members', { filter: { _id: memberIdOrEmail }, limit: 1 });
    if (data.items?.[0]) return data.items[0] as Member;
    for (const field of ['memberId', 'memberid']) {
      data = await fetchWixData('members', { filter: { [field]: memberIdOrEmail }, limit: 1 });
      if (data.items?.[0]) return data.items[0] as Member;
    }
    return null;
  } catch (error: any) {
    console.error('Error fetching member:', error);
    return null;
  }
}

// Update member. Pass the member object when you already have it (e.g. from bid route).
export async function updateMember(memberOrId: Member | string, updates: Partial<Member>): Promise<void> {
  const collectionCandidates = ['members', 'Members', 'Members List'];
  let member: Member | null = typeof memberOrId === 'object' ? memberOrId : null;
  if (!member) member = await getMember(memberOrId as string);
  if (!member) throw new Error('Member not found');
  const itemId = (member as any)._id || (member as any).id;

  if (!itemId) {
    console.error('updateMember: no _id on member object', member);
    throw new Error('Member has no _id');
  }

  // SDK: items.update(collection, item) expects full item; merge so we don't lose fields
  for (const collectionName of collectionCandidates) {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const items = wixClient.items as any;
      if (items?.update) {
        const toUpdate = { ...member, ...updates, _id: itemId };
        await items.update(collectionName, toUpdate);
        return;
      }
      if (items?.patch) {
        let patch = items.patch(collectionName, itemId);
        for (const [key, value] of Object.entries(updates)) {
          if (value !== undefined && typeof patch?.setField === 'function') patch = patch.setField(key, value);
        }
        if (typeof patch?.run === 'function') {
          await patch.run();
          return;
        }
      }
    } catch (sdkErr: any) {
      if (sdkErr?.message?.includes('404') || sdkErr?.message?.toLowerCase().includes('not found')) continue;
      console.error(`updateMember SDK failed for "${collectionName}":`, sdkErr?.message);
    }
  }

  const headers = {
    'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
    'wix-site-id': WIX_SITE_ID,
    'Content-Type': 'application/json',
  };
  const body = JSON.stringify({ dataItem: updates });
  for (const name of collectionCandidates) {
    const url = `${WIX_API_BASE}/collections/${encodeURIComponent(name)}/items/${encodeURIComponent(itemId)}`;
    const response = await fetch(url, { method: 'PATCH', headers, body });
    if (response.ok) return;
    if (response.status !== 404) {
      const errorText = await response.text();
      console.error(`Failed to update member in "${name}": ${errorText}`);
      throw new Error(`Failed to update member: ${response.statusText}`);
    }
  }
  throw new Error('Failed to update member: Not Found');
}

// Get last 5 bids for an item
export async function getLastBidsForItem(itemId: string, limit: number = 5): Promise<ArtAllBidsMade[]> {
  try {
    const data = await fetchWixData('ArtAllBids', {
      filter: { itemId },
      sort: [{ fieldName: 'bidDate', order: 'DESC' }],
      limit
    });
    return data.items as ArtAllBidsMade[] || [];
  } catch (error: any) {
    console.error('Error fetching last bids:', error);
    return [];
  }
}

// ============================================================
// STAR BID PACKS FUNCTIONS
// ============================================================

import type { StarBidPack, StarBidPackPurchase } from './wix-types';

// Fetch all active star bid packs
// Tries: StarBidPacks, BidPacks. Relaxes filters if nothing found.
export async function getStarBidPacks(): Promise<StarBidPack[]> {
  try {
  const collectionCandidates = ['StarBidPacks', 'BidPacks'];

  const tryFetch = async (collectionName: string, filter?: Record<string, any>): Promise<StarBidPack[]> => {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const query = wixClient.items.query(collectionName);
      if (filter?.activeBidPack) query.eq('activeBidPack', true);
      if (filter?.auctionType) query.eq('auctionType', filter.auctionType);
      const result = await query.limit(100).find();
      if (result.items && result.items.length > 0) {
        return result.items.map((item: any) => ({ _id: item._id, ...item.data })) as StarBidPack[];
      }
    } catch {}
    try {
      const opts: { filter?: Record<string, any>; limit: number } = { limit: 100 };
      if (filter && Object.keys(filter).length > 0) opts.filter = filter;
      const data = await fetchWixData(collectionName, opts);
      if (data.items && data.items.length > 0) return data.items as StarBidPack[];
    } catch {}
    return [];
  };

  for (const collectionName of collectionCandidates) {
    // 1. Strict: activeBidPack + auctionType
    let items = await tryFetch(collectionName, { activeBidPack: true, auctionType: 'Auction Bidding' });
    if (items.length > 0) {
      console.log(`✅ Found ${items.length} star bid packs from ${collectionName}`);
      return items;
    }
    // 2. Relaxed: activeBidPack only
    items = await tryFetch(collectionName, { activeBidPack: true });
    if (items.length > 0) {
      console.log(`✅ Found ${items.length} star bid packs from ${collectionName} (active only)`);
      return items;
    }
    // 3. No filter (get all items)
    items = await tryFetch(collectionName, undefined as any);
    if (items.length > 0) {
      const active = items.filter((p: any) => p.activeBidPack !== false);
      if (active.length > 0) {
        console.log(`✅ Found ${active.length} star bid packs from ${collectionName} (unfiltered)`);
        return active;
      }
      console.log(`✅ Found ${items.length} packs from ${collectionName} (all)`);
      return items;
    }
  }
  console.warn('⚠️ No star bid packs found from StarBidPacks or BidPacks');
  return [];
  } catch (error: any) {
    console.error('❌ Error fetching star bid packs:', error);
    return [];
  }
}

// Create a star bid pack purchase
export async function createStarBidPackPurchase(purchase: Omit<StarBidPackPurchase, '_id'>): Promise<string> {
  try {
    const url = `${WIX_API_BASE}/collections/StarBidPackPurchases/items`;
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
        'wix-site-id': WIX_SITE_ID,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ dataItem: purchase }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`Failed to create purchase: ${errorText}`);
      throw new Error(`Failed to create purchase: ${response.statusText}`);
    }

    const result = await response.json();
    return result.dataItem?._id || result._id;
  } catch (error) {
    console.error('Error creating purchase:', error);
    throw error;
  }
}

// Get purchases for a member
export async function getMemberPurchases(memberId: string): Promise<StarBidPackPurchase[]> {
  try {
    const data = await fetchWixData('StarBidPackPurchases', {
      filter: { memberId },
      sort: [{ fieldName: 'orderDate', order: 'DESC' }],
      limit: 100
    });
    return data.items as StarBidPackPurchase[] || [];
  } catch (error: any) {
    console.error('Error fetching member purchases:', error);
    return [];
  }
}

// Get purchases by wallet address
export async function getPurchasesByWallet(wallet: string): Promise<StarBidPackPurchase[]> {
  try {
    const data = await fetchWixData('StarBidPackPurchases', {
      filter: { userWallet: wallet.toLowerCase() },
      sort: [{ fieldName: 'orderDate', order: 'DESC' }],
      limit: 100
    });
    return data.items as StarBidPackPurchase[] || [];
  } catch (error: any) {
    console.error('Error fetching wallet purchases:', error);
    return [];
  }
}

// Get all star bid pack purchases (for admin stats)
export async function getAllStarBidPackPurchases(): Promise<StarBidPackPurchase[]> {
  try {
    const data = await fetchWixData('StarBidPackPurchases', {
      sort: [{ fieldName: 'orderDate', order: 'DESC' }],
      limit: 2000
    });
    return data.items as StarBidPackPurchase[] || [];
  } catch (error: any) {
    console.error('Error fetching all purchases:', error);
    return [];
  }
}

// Raffles
const RAFFLE_COLLECTION_CANDIDATES = ['Raffles', 'RaffleEvents'];

export async function getRaffles(): Promise<Raffle[]> {
  for (const name of RAFFLE_COLLECTION_CANDIDATES) {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const result = await wixClient.items.query(name).limit(500).find();
      const items = (result?.items || []).map((it: any) => {
        const d = it.data || it;
        return { _id: it._id, ...d } as Raffle;
      });
      return items;
    } catch {
      continue;
    }
  }
  try {
    const data = await fetchWixData(RAFFLE_COLLECTION_CANDIDATES[0], { limit: 500 });
    return (data.items || []) as Raffle[];
  } catch {
    return [];
  }
}

export async function createRaffle(raffle: Omit<Raffle, '_id'>): Promise<Raffle> {
  const toInsert = {
    name: raffle.name,
    subtitle: raffle.subtitle || '',
    isActive: raffle.isActive ?? true,
    visibilityDate: typeof raffle.visibilityDate === 'string' ? raffle.visibilityDate : new Date(raffle.visibilityDate).toISOString(),
    startDate: typeof raffle.startDate === 'string' ? raffle.startDate : new Date(raffle.startDate).toISOString(),
    endDate: typeof raffle.endDate === 'string' ? raffle.endDate : new Date(raffle.endDate).toISOString(),
    ticketLimit: Number(raffle.ticketLimit) || 100,
    ticketCostStars: Number(raffle.ticketCostStars) || 5,
    ticketLimitPerUser: Number(raffle.ticketLimitPerUser) || 0,
    valueOfPot: Number(raffle.valueOfPot) || 0,
    hatIds: raffle.hatIds || [],
  };
  for (const name of RAFFLE_COLLECTION_CANDIDATES) {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const inserted = await (wixClient.items as any).insert(name, toInsert);
      const id = inserted?._id ?? inserted?.id;
      if (id) return { _id: id, ...toInsert } as Raffle;
    } catch {
      continue;
    }
  }
  const url = `${WIX_API_BASE}/collections/${encodeURIComponent(RAFFLE_COLLECTION_CANDIDATES[0])}/items`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      'wix-site-id': WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataItem: toInsert }),
  });
  if (response.ok) {
    const result = await response.json();
    const id = result.dataItem?._id || result._id || '';
    return { _id: id, ...toInsert } as Raffle;
  }
  throw new Error('Failed to create raffle. Ensure the Raffles collection exists in Wix CMS.');
}

export async function updateRaffle(raffleId: string, updates: Partial<Raffle>): Promise<Raffle | null> {
  for (const name of RAFFLE_COLLECTION_CANDIDATES) {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const items = wixClient.items as any;
      const existing = await items.get(name, raffleId);
      if (!existing) continue;
      const data = existing.data || existing;
      const merged = { ...data, ...updates };
      if (updates.hatIds) merged.hatIds = updates.hatIds;
      await items.update(name, { _id: raffleId, ...merged });
      return { _id: raffleId, ...merged } as Raffle;
    } catch {
      continue;
    }
  }
  const url = `${WIX_API_BASE}/collections/${encodeURIComponent(RAFFLE_COLLECTION_CANDIDATES[0])}/items/${encodeURIComponent(raffleId)}`;
  const response = await fetch(url, {
    method: 'PATCH',
    headers: {
      'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      'wix-site-id': WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataItem: updates }),
  });
  if (response.ok) {
    const result = await response.json();
    return result.dataItem as Raffle;
  }
  return null;
}

// Claimed prizes (raffle wins)
const CLAIMED_PRIZES_COLLECTION = ['RaffleClaimedPrizes'];

export interface ClaimedPrize {
  _id: string;
  raffleId: string;
  raffleName: string;
  raffleSubtitle?: string;
  memberEmail: string;
  memberId?: string;
  winningTicketNumber: number;
  hatIds?: string[];
  status: 'claimed' | 'pending_shipping' | 'shipped';
  claimedAt: string;
}

export async function createClaimedPrize(data: Omit<ClaimedPrize, '_id' | 'claimedAt'>): Promise<ClaimedPrize | null> {
  const toInsert = {
    raffleId: data.raffleId,
    raffleName: data.raffleName,
    raffleSubtitle: data.raffleSubtitle || '',
    memberEmail: data.memberEmail.toLowerCase().trim(),
    memberId: data.memberId || '',
    winningTicketNumber: data.winningTicketNumber,
    hatIds: data.hatIds || [],
    status: 'claimed',
    claimedAt: new Date().toISOString(),
  };
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    const items = wixClient.items as any;
    for (const name of CLAIMED_PRIZES_COLLECTION) {
      try {
        const inserted = await items.insert(name, toInsert);
        const id = inserted?._id ?? inserted?.id;
        if (id) return { _id: id, ...toInsert } as ClaimedPrize;
      } catch {
        continue;
      }
    }
  } catch {}
  return null;
}

export async function getClaimedPrizesByMember(memberEmail?: string, memberId?: string): Promise<ClaimedPrize[]> {
  if (!memberEmail && !memberId) return [];
  const emailLower = memberEmail ? memberEmail.toLowerCase().trim() : '';
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of CLAIMED_PRIZES_COLLECTION) {
      try {
        let query = wixClient.items.query(name);
        if (emailLower) query = query.eq('memberEmail', emailLower);
        else if (memberId) query = query.eq('memberId', memberId);
        const result = await query.descending('claimedAt').limit(100).find();
        const items = (result?.items || []).map((it: any) => {
          const d = it.data || it;
          return {
            _id: it._id || d._id,
            raffleId: d.raffleId,
            raffleName: d.raffleName,
            raffleSubtitle: d.raffleSubtitle,
            memberEmail: d.memberEmail,
            memberId: d.memberId,
            winningTicketNumber: d.winningTicketNumber,
            hatIds: d.hatIds || [],
            status: d.status || 'claimed',
            claimedAt: d.claimedAt,
          } as ClaimedPrize;
        });
        return items;
      } catch {
        continue;
      }
    }
  } catch {}
  try {
    const data = await fetchWixData(CLAIMED_PRIZES_COLLECTION[0], {
      filter: emailLower ? { memberEmail: emailLower } : { memberId },
      limit: 100,
    });
    return (data.items || []) as ClaimedPrize[];
  } catch {}
  return [];
}

export async function hasClaimedRafflePrize(raffleId: string, memberEmail?: string, memberId?: string): Promise<boolean> {
  const prizes = await getClaimedPrizesByMember(memberEmail, memberId);
  return prizes.some((p) => p.raffleId === raffleId);
}

// Raffle entries (tickets purchased)
const RAFFLE_ENTRIES_COLLECTION = ['RaffleEntries', 'RaffleTickets'];

export async function getRaffleEntriesCount(raffleId: string): Promise<number> {
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of RAFFLE_ENTRIES_COLLECTION) {
      try {
        const result = await wixClient.items.query(name).eq('raffleId', raffleId).find();
        const items = result?.items || [];
        const total = items.reduce((sum: number, it: any) => {
          const d = it.data || it;
          return sum + (parseInt(String(d.ticketCount || 1), 10) || 1);
        }, 0);
        return total;
      } catch {
        continue;
      }
    }
  } catch {}
  try {
    const data = await fetchWixData(RAFFLE_ENTRIES_COLLECTION[0], {
      filter: { raffleId },
      limit: 1000,
    });
    const items = data.items || [];
    return items.reduce((sum: number, it: any) => sum + (parseInt(String(it.ticketCount || 1), 10) || 1), 0);
  } catch {}
  return 0;
}

export async function getRaffleHoldersCount(raffleId: string): Promise<number> {
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of RAFFLE_ENTRIES_COLLECTION) {
      try {
        const result = await wixClient.items.query(name).eq('raffleId', raffleId).find();
        const items = result?.items || [];
        const seen = new Set<string>();
        for (const it of items) {
          const d = it.data || it;
          const key = (d.memberId || d.memberEmail || d._id || '').toString().toLowerCase().trim();
          if (key) seen.add(key);
        }
        return seen.size;
      } catch {
        continue;
      }
    }
  } catch {}
  try {
    const data = await fetchWixData(RAFFLE_ENTRIES_COLLECTION[0], {
      filter: { raffleId },
      limit: 1000,
    });
    const items = (data.items || []) as any[];
    const seen = new Set<string>();
    for (const it of items) {
      const key = (it.memberId || it.memberEmail || it._id || '').toString().toLowerCase().trim();
      if (key) seen.add(key);
    }
    return seen.size;
  } catch {}
  return 0;
}

export interface RaffleEntryWithNumbers {
  _id: string;
  raffleId: string;
  memberId?: string;
  memberEmail?: string;
  ticketCount: number;
  ticketNumbers: number[];
  createdAt?: string;
}

export async function getRaffleEntriesWithNumbers(raffleId: string): Promise<RaffleEntryWithNumbers[]> {
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of RAFFLE_ENTRIES_COLLECTION) {
      try {
        const result = await wixClient.items.query(name).eq('raffleId', raffleId).ascending('createdAt').find();
        const items = (result?.items || []).map((it: any) => it.data || it);
        let nextNum = 1;
        return items.map((d: any) => {
          const count = parseInt(String(d.ticketCount || 1), 10) || 1;
          const numbers = Array.from({ length: count }, (_, i) => nextNum + i);
          nextNum += count;
          return {
            _id: d._id,
            raffleId: d.raffleId,
            memberId: d.memberId,
            memberEmail: d.memberEmail,
            ticketCount: count,
            ticketNumbers: numbers,
            createdAt: d.createdAt,
          };
        });
      } catch {
        continue;
      }
    }
  } catch {}
  try {
    const data = await fetchWixData(RAFFLE_ENTRIES_COLLECTION[0], {
      filter: { raffleId },
      limit: 1000,
      sort: [{ fieldName: 'createdAt', order: 'ASC' }],
    });
    const items = (data.items || []) as any[];
    let nextNum = 1;
    return items.map((d: any) => {
      const count = parseInt(String(d.ticketCount || 1), 10) || 1;
      const numbers = Array.from({ length: count }, (_, i) => nextNum + i);
      nextNum += count;
      return {
        _id: d._id,
        raffleId: d.raffleId,
        memberId: d.memberId,
        memberEmail: d.memberEmail,
        ticketCount: count,
        ticketNumbers: numbers,
        createdAt: d.createdAt,
      };
    });
  } catch {}
  return [];
}

export interface RaffleTicketForRoulette {
  number: number;
  initials: string;
  displayName?: string;
}

export async function getRaffleTicketsForRoulette(raffleId: string): Promise<RaffleTicketForRoulette[]> {
  const entries = await getRaffleEntriesWithNumbers(raffleId);
  const result: RaffleTicketForRoulette[] = [];
  for (const e of entries) {
    const email = String(e.memberEmail || '').trim();
    const beforeAt = email.split('@')[0] || '';
    const initials = beforeAt.length >= 2
      ? (beforeAt[0]! + beforeAt[1]!).toUpperCase()
      : beforeAt.length === 1
      ? beforeAt[0]!.toUpperCase()
      : '?';
    const displayName = beforeAt
      ? beforeAt.charAt(0).toUpperCase() + beforeAt.slice(1).toLowerCase().replace(/[._-]/g, ' ')
      : initials;
    for (const num of e.ticketNumbers) {
      result.push({ number: num, initials, displayName });
    }
  }
  return result;
}

export async function getRaffleWinner(raffleId: string): Promise<{ number: number; initials: string; displayName?: string } | null> {
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of RAFFLE_COLLECTION_CANDIDATES) {
      try {
        const item = await (wixClient.items as any).get(name, raffleId);
        const d = item?.data || item;

        if (d?.winnerNumber != null && d?.winnerInitials != null) {
          return {
            number: Number(d.winnerNumber),
            initials: String(d.winnerInitials),
            displayName: d.winnerDisplayName ? String(d.winnerDisplayName) : undefined,
          };
        }
        return null;
      } catch {
        continue;
      }
    }
  } catch {}
  return null;
}

export async function pickAndStoreRaffleWinner(raffleId: string): Promise<{ number: number; initials: string; displayName?: string } | null> {
  const existing = await getRaffleWinner(raffleId);
  if (existing) return existing;

  const tickets = await getRaffleTicketsForRoulette(raffleId);
  if (tickets.length === 0) return null;

  const winner = tickets[Math.floor(Math.random() * tickets.length)]!;
  try {
    await updateRaffle(raffleId, {
      winnerNumber: winner.number,
      winnerInitials: winner.initials,
      winnerDisplayName: winner.displayName || undefined,
    });
    return winner;
  } catch {
    return null;
  }
}

export async function getRaffleTicketNumbersForMember(
  raffleId: string,
  memberId?: string,
  memberEmail?: string
): Promise<number[]> {
  if (!memberId && !memberEmail) return [];
  const entries = await getRaffleEntriesWithNumbers(raffleId);
  const emailLower = memberEmail ? String(memberEmail).toLowerCase().trim() : '';
  const numbers: number[] = [];
  for (const e of entries) {
    const match =
      (memberId && (e.memberId === memberId || e._id === memberId)) ||
      (emailLower && (String(e.memberEmail || '').toLowerCase().trim() === emailLower));
    if (match) numbers.push(...e.ticketNumbers);
  }
  return numbers.sort((a, b) => a - b);
}

export async function getRaffleEntriesCountForMember(raffleId: string, memberId?: string, memberEmail?: string): Promise<number> {
  if (!memberId && !memberEmail) return 0;
  try {
    const { getWixClient } = await import('@/app/hooks/useWixClientServer');
    const wixClient = await getWixClient();
    for (const name of RAFFLE_ENTRIES_COLLECTION) {
      try {
        const result = await wixClient.items.query(name).eq('raffleId', raffleId).find();
        const items = result?.items || [];
        const emailLower = memberEmail ? String(memberEmail).toLowerCase().trim() : '';
        const total = items.reduce((sum: number, it: any) => {
          const d = it.data || it;
          const match = (memberId && (d.memberId === memberId || d._id === memberId)) ||
            (emailLower && (String(d.memberEmail || '').toLowerCase().trim() === emailLower));
          if (!match) return sum;
          return sum + (parseInt(String(d.ticketCount || 1), 10) || 1);
        }, 0);
        return total;
      } catch {
        continue;
      }
    }
  } catch {}
  try {
    const data = await fetchWixData(RAFFLE_ENTRIES_COLLECTION[0], {
      filter: { raffleId },
      limit: 1000,
    });
    const items = (data.items || []) as any[];
    const emailLower = memberEmail ? String(memberEmail).toLowerCase().trim() : '';
    return items.reduce((sum, it) => {
      const match = (memberId && (it.memberId === memberId || it._id === memberId)) ||
        (emailLower && (String(it.memberEmail || '').toLowerCase().trim() === emailLower));
      if (!match) return sum;
      return sum + (parseInt(String(it.ticketCount || 1), 10) || 1);
    }, 0);
  } catch {}
  return 0;
}

export async function createRaffleEntry(entry: Omit<RaffleEntry, '_id'>): Promise<string> {
  const toInsert = {
    raffleId: entry.raffleId,
    memberId: entry.memberId || '',
    memberEmail: entry.memberEmail || '',
    ticketCount: entry.ticketCount || 1,
    createdAt: new Date().toISOString(),
  };
  for (const name of RAFFLE_ENTRIES_COLLECTION) {
    try {
      const { getWixClient } = await import('@/app/hooks/useWixClientServer');
      const wixClient = await getWixClient();
      const inserted = await (wixClient.items as any).insert(name, toInsert);
      const id = inserted?._id ?? inserted?.id;
      if (id) return String(id);
    } catch {
      continue;
    }
  }
  const url = `${WIX_API_BASE}/collections/${encodeURIComponent(RAFFLE_ENTRIES_COLLECTION[0])}/items`;
  const response = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': WIX_API_KEY.startsWith('IST.') ? WIX_API_KEY : `Bearer ${WIX_API_KEY}`,
      'wix-site-id': WIX_SITE_ID,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ dataItem: toInsert }),
  });
  if (response.ok) {
    const result = await response.json();
    return result.dataItem?._id || result._id || '';
  }
  throw new Error('Failed to create raffle entry.');
}
