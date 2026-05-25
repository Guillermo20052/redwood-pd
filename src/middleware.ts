import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';
import {
  getNextWelcomePath,
  isWelcomeComplete,
  isWelcomeFlowPath,
  isWelcomeGatedPath,
  normalizeWelcomeProfile,
} from '@/lib/welcome-gate';

const PUBLIC_PATHS = ['/login', '/signup', '/auth/callback'];

function isPublicPath(pathname: string): boolean {
  return PUBLIC_PATHS.some((p) => pathname === p || pathname.startsWith(p + '/'));
}

function isProtectedPath(pathname: string): boolean {
  if (pathname === '/') return true;
  return isWelcomeGatedPath(pathname);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  if (
    pathname.startsWith('/_next') ||
    pathname.startsWith('/api') ||
    pathname.includes('.')
  ) {
    return NextResponse.next();
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  // Local mode: no auth gating at all.
  if (!supabaseUrl || !supabaseKey) {
    return NextResponse.next();
  }

  let response = NextResponse.next({ request });
  const supabase = createServerClient(supabaseUrl, supabaseKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
        response = NextResponse.next({ request });
        cookiesToSet.forEach(({ name, value, options }) =>
          response.cookies.set(name, value, options)
        );
      },
    },
  });

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user && isWelcomeFlowPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  // Already authenticated → bounce away from /login and /signup.
  if (user && (pathname === '/login' || pathname === '/signup')) {
    const url = request.nextUrl.clone();
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, welcome_cynthia_read_at, welcome_pope_read_at, welcome_about_read_at')
      .eq('id', user.id)
      .maybeSingle();
    url.pathname = getNextWelcomePath(normalizeWelcomeProfile(profile ?? undefined));
    url.search = '';
    return NextResponse.redirect(url);
  }

  if (user) {
    const { data: profile } = await supabase
      .from('profiles')
      .select('role, welcome_cynthia_read_at, welcome_pope_read_at, welcome_about_read_at')
      .eq('id', user.id)
      .maybeSingle();

    const welcomeProfile = normalizeWelcomeProfile(profile ?? undefined);

    if (!isWelcomeComplete(welcomeProfile)) {
      const nextPath = getNextWelcomePath(welcomeProfile);

      if (isProtectedPath(pathname) || pathname === '/bienvenida') {
        if (pathname !== nextPath) {
          const url = request.nextUrl.clone();
          url.pathname = nextPath;
          url.search = '';
          return NextResponse.redirect(url);
        }
      }

      if (pathname.startsWith('/bienvenida/') && pathname !== nextPath) {
        const url = request.nextUrl.clone();
        url.pathname = nextPath;
        url.search = '';
        return NextResponse.redirect(url);
      }
    }

    if (
      (pathname === '/admin/demo' || pathname.startsWith('/admin/teacher/')) &&
      welcomeProfile.role !== 'admin'
    ) {
      const url = request.nextUrl.clone();
      url.pathname = '/dashboard';
      url.search = '';
      return NextResponse.redirect(url);
    }
  }

  // Unauthenticated → only protected paths are gated. Marketing/public paths
  // (login, signup, auth callback, anything we haven't explicitly listed) fall
  // through.
  if (!user && isProtectedPath(pathname) && !isPublicPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = '/login';
    url.searchParams.set('next', pathname);
    return NextResponse.redirect(url);
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|assets|welcome|prakash-nair).*)'],
};
