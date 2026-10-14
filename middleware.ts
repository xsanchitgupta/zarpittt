import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

let cachedMaintenance: { isMaintenance: boolean; expiry: number } | null = null;
let cachedAdmins: Record<string, { isAdmin: boolean; expiry: number }> = {};

async function checkIsAdmin(request: NextRequest, supabaseUrl: string, supabaseAnonKey: string): Promise<boolean> {
  // 1. Get access token from cookies
  let token = request.cookies.get('sb-access-token')?.value;
  if (!token) {
    for (const cookie of request.cookies.getAll()) {
      if (cookie.name.includes('auth-token') && cookie.value) {
        try {
          const rawValue = cookie.value.startsWith('%') ? decodeURIComponent(cookie.value) : cookie.value;
          const parsed = JSON.parse(rawValue);
          if (parsed?.access_token) {
            token = parsed.access_token;
            break;
          }
        } catch {
          try {
            const decoded = decodeURIComponent(cookie.value);
            const parsed = JSON.parse(decoded);
            if (parsed?.access_token) {
              token = parsed.access_token;
              break;
            }
          } catch {}
        }
      }
    }
  }

  if (!token) return false;

  // 2. Check in-memory admin cache
  const cached = cachedAdmins[token];
  if (cached && Date.now() < cached.expiry) {
    return cached.isAdmin;
  }

  // 3. Verify token and query user profile role
  try {
    // A. Verify token by calling Supabase Auth API
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'apikey': supabaseAnonKey,
        'Authorization': `Bearer ${token}`
      }
    });

    if (!userRes.ok) return false;
    const user = await userRes.json();
    if (!user?.id) return false;

    // B. Fetch role from profiles table (use Service Role Key to guarantee access)
    const supabaseServiceRole = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!supabaseServiceRole) return false;

    const profileRes = await fetch(`${supabaseUrl}/rest/v1/profiles?id=eq.${user.id}&select=role`, {
      headers: {
        'apikey': supabaseServiceRole,
        'Authorization': `Bearer ${supabaseServiceRole}`
      }
    });

    if (!profileRes.ok) return false;
    const profiles = await profileRes.json();
    const profile = profiles?.[0];
    const isAdmin = profile?.role === 'admin';

    // C. Cache result for 60 seconds
    cachedAdmins[token] = {
      isAdmin,
      expiry: Date.now() + 60000 // 1 minute
    };

    return isAdmin;
  } catch (err) {
    console.error('[Middleware] Admin check error:', err);
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // 1. Skip static assets, Next.js internals, and files with extensions
  if (
    pathname.includes('.') ||
    pathname.startsWith('/_next') ||
    pathname === '/favicon.ico'
  ) {
    return NextResponse.next();
  }

  // Inject standard custom header so Server Components can inspect the route pathname on the server
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set('x-pathname', pathname);

  // 2. Bypass rules for Admin section, Auth flow, Maintenance page, and public APIs
  const isAdminPath = pathname.startsWith('/admin') || pathname.startsWith('/api/admin');
  const isMaintenancePage = pathname === '/maintenance';
  const isMaintenanceApi = pathname === '/api/maintenance';
  const isAuthPath = pathname.startsWith('/auth') || pathname.startsWith('/api/auth');

  if (isAdminPath || isMaintenancePage || isMaintenanceApi || isAuthPath) {
    return NextResponse.next({
      request: {
        headers: requestHeaders,
      }
    });
  }

  let isMaintenance = false;

  // 3. Read from in-memory cache or fetch from Supabase
  if (cachedMaintenance && Date.now() < cachedMaintenance.expiry) {
    isMaintenance = cachedMaintenance.isMaintenance;
  } else {
    try {
      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

      if (supabaseUrl && supabaseAnonKey) {
        // Query the database securely via REST API
        const res = await fetch(`${supabaseUrl}/rest/v1/system_settings?select=*`, {
          headers: {
            'apikey': supabaseAnonKey,
            'Authorization': `Bearer ${supabaseAnonKey}`,
          },
          // Cache/revalidate controls
          next: { revalidate: 5 }
        });

        if (res.ok) {
          const data = await res.json();
          const modeSetting = data.find((s: any) => s.key === 'maintenance_mode');
          isMaintenance = modeSetting?.value === 'true';
          
          // Update local middleware cache
          cachedMaintenance = {
            isMaintenance,
            expiry: Date.now() + 5000, // 5 seconds
          };
        }
      }
    } catch (err) {
      console.error('[Middleware] Maintenance check failed:', err);
    }
  }

  // 4. Enforce Maintenance mode server-side (only for non-admins)
  if (isMaintenance) {
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    
    let isAdmin = false;
    if (supabaseUrl && supabaseAnonKey) {
      isAdmin = await checkIsAdmin(request, supabaseUrl, supabaseAnonKey);
    }

    if (!isAdmin) {
      // If it's an API request, return a secure JSON response
      if (pathname.startsWith('/api')) {
        return new NextResponse(
          JSON.stringify({ error: 'System is under maintenance. Please try again later.' }),
          {
            status: 503,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }
      // If it's a page request, redirect securely to the /maintenance screen
      return NextResponse.redirect(new URL('/maintenance', request.url));
    }
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    }
  });
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for standard static files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?|ico|css|js)).*)',
  ],
};
