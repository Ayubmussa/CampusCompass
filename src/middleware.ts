import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function middleware(request: NextRequest) {
  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    console.error('Missing Supabase environment variables');
    // Return error response for API routes, redirect for pages
    if (request.nextUrl.pathname.startsWith('/api')) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }
    return NextResponse.redirect(new URL('/login?error=config', request.url));
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(
    supabaseUrl,
    supabaseAnonKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => {
            request.cookies.set(name, value);
            response.cookies.set(name, value, options);
          });
        },
      },
    }
  );

  // Refresh session if expired - required for Server Components
  const { data: { session } } = await supabase.auth.getSession();

  // Get the pathname
  const pathname = request.nextUrl.pathname;

  // Allow access to landing page, login page and public assets
  const isLandingPage = pathname === '/landing';
  const isLoginPage = pathname === '/login';
  const isPublicAsset = pathname.startsWith('/_next') || 
                        pathname.match(/\.(ico|png|jpg|jpeg|svg|gif|webp)$/);
  
  // Note: API routes are excluded from authentication check
  // Individual API routes should implement their own auth checks
  const isApiRoute = pathname.startsWith('/api');

  // Redirect unauthenticated users to landing page (except for landing, login, API routes, and public assets)
  if (!session && !isLandingPage && !isLoginPage && !isPublicAsset && !isApiRoute) {
    return NextResponse.redirect(new URL('/landing', request.url));
  }

  // Redirect authenticated users away from landing/login pages to home
  if (session && (isLandingPage || isLoginPage)) {
    return NextResponse.redirect(new URL('/', request.url));
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * Feel free to modify this pattern to include more paths.
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

