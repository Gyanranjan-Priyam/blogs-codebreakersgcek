// Utility to check if S3 URLs are accessible and provide fallback strategies

export const checkImageHealth = async (imageUrl: string): Promise<boolean> => {
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 5000); // 5 second timeout
    
    const response = await fetch(imageUrl, {
      method: 'HEAD',
      signal: controller.signal,
      cache: 'no-store'
    });
    
    clearTimeout(timeoutId);
    return response.ok;
  } catch (error) {
    console.warn('Image health check failed for:', imageUrl, error);
    return false;
  }
};

export const getOptimizedImageUrl = (originalUrl: string, options?: {
  width?: number;
  quality?: number;
  format?: 'webp' | 'avif' | 'auto';
}): string => {
  if (!originalUrl) return '';
  
  // If it's already optimized or in development, return as is
  if (process.env.NODE_ENV === 'development') {
    return originalUrl;
  }
  
  const { width = 1920, quality = 75, format = 'auto' } = options || {};
  
  try {
    const url = new URL('/_next/image', window.location.origin);
    url.searchParams.set('url', encodeURIComponent(originalUrl));
    url.searchParams.set('w', width.toString());
    url.searchParams.set('q', quality.toString());
    
    if (format !== 'auto') {
      url.searchParams.set('f', format);
    }
    
    return url.toString();
  } catch (error) {
    console.warn('Failed to create optimized image URL:', error);
    return originalUrl;
  }
};

export const createImageFallbackChain = (imageKey: string): string[] => {
  if (!imageKey) return [];
  
  const baseUrls = [
    'https://blogs.t3.storage.dev',
    'https://blogs.s3.amazonaws.com'
  ];
  
  return baseUrls.map(baseUrl => {
    if (imageKey.startsWith('http')) return imageKey;
    return `${baseUrl}/${imageKey}`;
  });
};

export const preloadCriticalImages = (imageUrls: string[]) => {
  if (typeof window === 'undefined') return;
  
  imageUrls.forEach(url => {
    if (!url) return;
    
    const link = document.createElement('link');
    link.rel = 'preload';
    link.as = 'image';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
  });
};