// Client-safe Wix utility functions
// These functions don't require server-side features and can be used in client components

// Helper function to convert Wix video reference to URL. Supabase URLs pass through.
export function convertWixVideoUrl(videoRef: string | null | undefined): string {
  if (!videoRef) return '';
  
  // Supabase Storage URLs - use as-is
  if (videoRef.includes('supabase') && videoRef.includes('storage')) return videoRef;
  
  // Already a full URL
  if (videoRef.startsWith('http://') || videoRef.startsWith('https://')) {
    // Fix double encoding if present
    let fixed = videoRef.replace(/%25([0-9A-F]{2})/gi, '%$1');
    
    // Ensure proper URL encoding for video.wixstatic.com URLs
    // Handle spaces and special characters in the filename
    if (fixed.includes('video.wixstatic.com')) {
      try {
        const url = new URL(fixed);
        const pathParts = url.pathname.split('/').filter(Boolean);
        
        // Format should be: /video/{fileId}/{filename}
        // pathParts will be: ['video', '{fileId}', '{filename}'] or ['{fileId}', '{filename}']
        if (pathParts.length >= 2) {
          // Find fileId (first part after 'video' if present, or first part)
          const videoIndex = pathParts.indexOf('video');
          const fileIdIndex = videoIndex >= 0 ? videoIndex + 1 : 0;
          const fileId = pathParts[fileIdIndex];
          const filename = pathParts.slice(fileIdIndex + 1).join('/');
          
          // Decode to get original filename, then encode properly
          let decodedFilename: string;
          try {
            decodedFilename = decodeURIComponent(filename);
          } catch {
            decodedFilename = filename; // If decode fails, use as-is
          }
          
          // Encode the filename properly - spaces become %20, parentheses become %28/%29
          const encodedFilename = encodeURIComponent(decodedFilename);
          
          const properUrl = `https://video.wixstatic.com/video/${fileId}/${encodedFilename}`;
          console.log(`🎥 Fixed video URL: ${fixed.substring(0, 100)}... -> ${properUrl}`);
          return properUrl;
        }
      } catch (e) {
        console.warn('Error processing video URL:', e, 'Using original:', fixed);
      }
    }
    
    return fixed;
  }
  
  // Wix video reference: wix:video://v1/{fileId}/{filename}.mp4 or wix:video://videos/abc123.mp4
  if (videoRef.startsWith('wix:video')) {
    const videoPath = videoRef.replace('wix:video://', '').split('#')[0];
    const pathParts = videoPath.split('/');
    let fileId: string;
    let filename: string;
    if (pathParts[0] === 'v1' && pathParts.length >= 3) {
      fileId = pathParts[1];
      filename = pathParts.slice(2).join('/');
    } else if (pathParts.length >= 2) {
      fileId = pathParts[0];
      filename = pathParts.slice(1).join('/');
    } else {
      return `https://video.wixstatic.com/video/${videoPath}`;
    }
    const encodedFilename = encodeURIComponent(filename);
    return `https://video.wixstatic.com/video/${fileId}/${encodedFilename}`;
  }
  
  return videoRef;
}

// Helper function to convert Wix image URLs to proper HTTP URLs
export function convertWixImageUrl(wixUrl: string | undefined): string | undefined {
  if (!wixUrl) return undefined;
  
  // If it's already a proper HTTP/HTTPS URL, return as-is
  if (wixUrl.startsWith('http://') || wixUrl.startsWith('https://')) {
    // Fix double encoding
    return wixUrl.replace(/%25([0-9A-F]{2})/gi, '%$1');
  }
  
  // If it's a Wix image reference (wix:image://...), convert to CDN URL
  // Format: wix:image://v1/{fileId}/{filename}#params - Wix CDN only accepts /media/{fileId}
  if (wixUrl.startsWith('wix:image://')) {
    const imagePath = wixUrl.replace('wix:image://', '').split('#')[0];
    const parts = imagePath.split('/');
    if (parts[0] === 'v1' && parts.length >= 2) {
      const fileId = parts[1];
      return `https://static.wixstatic.com/media/${fileId}`;
    }
    return `https://static.wixstatic.com/media/${imagePath}`;
  }
  
  // Return as-is if we can't process it
  return wixUrl;
}

/** Wix gallery item format for CMS */
export interface WixGalleryItem {
  description: string;
  fileName: string;
  slug: string;
  alt: string;
  src: string;
  title: string;
  type: 'image';
  settings: { width: number; height: number; focalPoint: [number, number] };
}

/** Parse wix:image://, Supabase, or https://static.wixstatic.com URL into gallery object */
export function parseWixImageToGalleryItem(src: string): WixGalleryItem | null {
  if (!src?.trim()) return null;
  
  // Supabase Storage URL - use as display URL
  if (src.includes('supabase') && src.includes('storage')) {
    const fileName = src.split('/').pop() || 'image';
    return {
      description: '',
      fileName,
      slug: fileName,
      alt: '',
      src,
      title: fileName,
      type: 'image',
      settings: { width: 3024, height: 3024, focalPoint: [0.5, 0.5] },
    };
  }
  
  // Handle wix:image:// format
  if (src.startsWith('wix:image://')) {
    try {
      const noHash = src.split('#')[0];
      const path = noHash.replace('wix:image://v1/', '');
      const parts = path.split('/');
      if (parts.length < 2) return null;
      const slug = parts[0];
      const fileName = parts.slice(1).join('/');
      let width = 0, height = 0;
      const hash = src.includes('#') ? src.split('#')[1] : '';
      if (hash) {
        const params = new URLSearchParams(hash);
        width = parseInt(params.get('originWidth') || '0', 10) || 3024;
        height = parseInt(params.get('originHeight') || '0', 10) || 3024;
      }
      return {
        description: '',
        fileName,
        slug,
        alt: '',
        src: src.trim(),
        title: fileName,
        type: 'image',
        settings: { width: width || 3024, height: height || 3024, focalPoint: [0.5, 0.5] },
      };
    } catch {
      return null;
    }
  }
  
  // Handle https://static.wixstatic.com/media/... format (convert back to wix:image://)
  if (src.includes('static.wixstatic.com/media/')) {
    try {
      const url = new URL(src);
      // Path: /media/v1/{slug}/{fileName} or /media/{slug}/{fileName} or /media/{slug}
      const pathParts = url.pathname.split('/').filter(Boolean);
      const mediaIdx = pathParts.indexOf('media');
      if (mediaIdx < 0) return null;
      const afterMedia = pathParts.slice(mediaIdx + 1);
      // afterMedia could be: ['v1', 'slug', 'fileName'] or ['slug', 'fileName'] or ['slug']
      let slug = '', fileName = '';
      if (afterMedia[0] === 'v1') {
        // Format: /media/v1/slug/fileName
        slug = afterMedia[1] || '';
        fileName = afterMedia.slice(2).join('/') || afterMedia[1] || 'image.png';
      } else {
        // Format: /media/slug/fileName or /media/slug
        slug = afterMedia[0] || '';
        fileName = afterMedia.slice(1).join('/') || afterMedia[0] || 'image.png';
      }
      if (!slug) return null;
      // Convert to wix:image:// format
      const wixSrc = `wix:image://v1/${slug}/${fileName}#originWidth=3024&originHeight=3024`;
      return {
        description: '',
        fileName,
        slug,
        alt: '',
        src: wixSrc,
        title: fileName,
        type: 'image',
        settings: { width: 3024, height: 3024, focalPoint: [0.5, 0.5] },
      };
    } catch {
      return null;
    }
  }
  
  return null;
}

/** Normalize gallery item. Pass-through full objects. Parse wix:image://, Supabase, or https URLs. Skip data URLs. */
export function toWixGalleryItem(item: unknown): WixGalleryItem | null {
  if (!item) return null;
  if (typeof item === 'object' && item !== null) {
    const o = item as Record<string, unknown>;
    const src = typeof o.src === 'string' ? o.src : '';
    if (!src) return null;
    if (src.startsWith('data:')) return null; // Data URLs can't be stored
    // Supabase URL - pass through
    if (src.includes('supabase') && src.includes('storage')) {
      const parsed = parseWixImageToGalleryItem(src);
      if (parsed) return parsed;
    }
    // Full Wix object with wix:image:// src
    if (src.startsWith('wix:image://') && o.fileName && o.slug) {
      return {
        description: (o.description as string) || '',
        fileName: (o.fileName as string) || '',
        slug: (o.slug as string) || '',
        alt: (o.alt as string) || '',
        src,
        title: (o.title as string) || (o.fileName as string) || '',
        type: 'image',
        settings: (o.settings as WixGalleryItem['settings']) || { width: 3024, height: 3024, focalPoint: [0.5, 0.5] },
      };
    }
    // Try to parse the src (handles both wix:image:// and https://static.wixstatic.com)
    const parsed = parseWixImageToGalleryItem(src);
    if (parsed) return parsed;
  }
  if (typeof item === 'string') {
    return parseWixImageToGalleryItem(item);
  }
  return null;
}

/** Get display URL from gallery item for img src */
export function getGalleryItemDisplayUrl(item: unknown): string {
  if (!item) return '';
  if (typeof item === 'string') return convertWixImageUrl(item) || item;
  if (typeof item === 'object' && item !== null && 'src' in item) {
    return convertWixImageUrl((item as { src: string }).src) || (item as { src: string }).src || '';
  }
  return '';
}
