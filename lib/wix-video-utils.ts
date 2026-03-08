// Client-safe utility functions for Wix video URL conversion
// This file can be safely imported in client components
// It contains NO server-only imports (no next/headers, no cookies, etc.)

/** Extract video URL string from Wix media field (can be string or object) */
export function extractVideoUrl(val: unknown): string {
  if (!val) return '';
  if (typeof val === 'string') return val.trim();
  if (typeof val === 'object' && val !== null) {
    const o = val as Record<string, unknown>;
    if (typeof o.url === 'string') return o.url.trim();
    if (o.file && typeof (o.file as Record<string, unknown>).url === 'string') return ((o.file as Record<string, unknown>).url as string).trim();
  }
  return '';
}

/** Normalize video URL for storage. Pass-through for wix:video://, https, Supabase. Skips data URLs. */
export function toWixVideoRef(url: string | undefined): string {
  if (!url || !url.trim()) return '';
  // Data URLs can't be stored - return empty to skip overwriting
  if (url.startsWith('data:')) return '';
  if (url.startsWith('wix:video://')) return url.trim();
  try {
    if (url.includes('video.wixstatic.com')) {
      const u = new URL(url);
      const parts = u.pathname.split('/').filter(Boolean);
      const videoIdx = parts.indexOf('video');
      const fileId = videoIdx >= 0 && parts[videoIdx + 1] ? parts[videoIdx + 1] : parts[0];
      if (fileId) return `wix:video://v1/${fileId}/file.mp4`;
    }
  } catch (_) {}
  return url.trim();
}

// Helper function to convert Wix video URLs to proper HTTP URLs
export function convertWixVideoUrl(wixUrl: string | undefined): string | undefined {
  if (!wixUrl) return undefined;
  
  // If it's already a proper HTTP/HTTPS URL
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // Handle video.wixstatic.com URLs specifically
    if (wixUrl.includes('video.wixstatic.com')) {
      // Wix videos often work better with the original URL format
      // Try the original URL first (with double encoding as Wix provides it)
      // This is what Wix expects and serves
      console.log(`🎥 Using original Wix video URL: ${wixUrl}`);
      return wixUrl;
    }
    
    // For other HTTP/HTTPS URLs, return as-is
    return wixUrl;
  }
  
  // Handle wix:video:// format
  if (wixUrl.startsWith('wix:video://')) {
    const videoMatch = wixUrl.match(/wix:video:\/\/v1\/([^#]+)/);
    if (videoMatch && videoMatch[1]) {
      const videoPath = videoMatch[1];
      const pathSegments = videoPath.split('/');
      
      if (pathSegments.length >= 2) {
        const fileId = pathSegments[0];
        const filename = pathSegments.slice(1).join('/');
        const encodedFilename = encodeURIComponent(filename);
        const convertedUrl = `https://video.wixstatic.com/video/${fileId}/${encodedFilename}`;
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
      
      // Reconstruct: /video/{fileId}/{filename}
      if (cleanPathParts.length >= 2) {
        const fileId = cleanPathParts[0];
        const filename = cleanPathParts.slice(1).join('/');
        
        try {
          const decoded = decodeURIComponent(filename);
          const encoded = encodeURIComponent(decoded);
          const properUrl = `https://video.wixstatic.com/video/${fileId}/${encoded}`;
          console.log(`🎥 Cleaned video URL: ${wixUrl.substring(0, 80)}... -> ${properUrl}`);
          return properUrl;
        } catch {
          // If decode fails, just encode as-is
          return `https://video.wixstatic.com/video/${fileId}/${encodeURIComponent(filename)}`;
        }
      }
      
      return fixed;
    } catch (e) {
      console.error('Error cleaning video.wixstatic.com URL:', e);
      return wixUrl;
    }
  }
  
  return wixUrl;
}
