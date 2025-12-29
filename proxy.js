import { NextResponse } from 'next/server';

const isDevelopment = process.env.NODE_ENV === 'development';

export function proxy(request) {
  // Get the pathname of the request
  const path = request.nextUrl.pathname;

  // Check if it's an API request
  if (path.startsWith('/api')) {
    // Create response with CORS headers
    const response = NextResponse.next();

    // Get origin from request
    const origin = request.headers.get('origin') || '';

    // Allowed origins based on environment
    const allowedOrigins = isDevelopment
      ? [
          'https://digicammarket.com',
          'https://www.digicammarket.com',
          'http://localhost:3000',
          'http://localhost:3001',
        ]
      : [
          'https://digicammarket.com',
          'https://www.digicammarket.com',
        ];

    // Check if origin is allowed
    if (allowedOrigins.includes(origin)) {
      response.headers.set('Access-Control-Allow-Origin', origin);
    }

    // Set CORS headers
    response.headers.set('Access-Control-Allow-Credentials', 'true');
    response.headers.set('Access-Control-Allow-Methods', 'GET, POST, PUT, PATCH, DELETE, OPTIONS');
    response.headers.set('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');

    // Security headers
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');

    // Handle preflight requests
    if (request.method === 'OPTIONS') {
      return new NextResponse(null, {
        status: 200,
        headers: response.headers,
      });
    }

    return response;
  }

  return NextResponse.next();
}

// Configure which paths should be handled by proxy
export const config = {
  matcher: '/api/:path*',
};
