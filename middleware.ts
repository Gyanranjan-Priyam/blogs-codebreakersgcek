import { NextRequest, NextResponse } from 'next/server';

export async function middleware(request: NextRequest) {
  // Handle image optimization requests with better error handling
  if (request.nextUrl.pathname.startsWith('/_next/image')) {
    try {
      // Set cache headers for better performance
      const response = NextResponse.next();
      response.headers.set('Cache-Control', 'public, max-age=3600, s-maxage=3600, stale-while-revalidate=86400');
      
      return response;
    } catch (error) {
      console.error('Image middleware error:', error);
      // Return a proper error response instead of hanging
      return new NextResponse('Image processing error', { 
        status: 500,
        headers: {
          'Content-Type': 'text/plain',
        }
      });
    }
  }

  // Note: Auth checking is handled at the page level instead of middleware
  // to avoid Edge Runtime compatibility issues with Better Auth.
  // Pages use server-side protection through:
  // - auth.api.getSession() in server components
  // - Admin layout protection
  // - Callback route checks
  // - Onboarding page guards

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Only match image optimization requests
    '/_next/image',
  ],
};