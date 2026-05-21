import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Auth-, API- und öffentliche Routen durchlassen
  if (
    pathname.startsWith('/auth/') ||
    pathname.startsWith('/api/') ||
    pathname.startsWith('/impressum') ||
    pathname.startsWith('/datenschutz') ||
    pathname.startsWith('/agb')
  ) {
    return NextResponse.next({ request });
  }

  // Ohne Supabase-Konfiguration: alles durchlassen (lokaler Modus)
  if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
    return NextResponse.next({ request });
  }

  // Server Actions (POST mit Next-Action-Header) NIEMALS redirecten.
  // Sie werden als POST-Request gesendet; ein Redirect zu /auth/login
  // würde die Action-Response durch HTML ersetzen → Client-Fehler → Rollback.
  // Server Actions haben ihre eigene Auth-Prüfung in getAuthContext().
  const isServerAction = request.method === 'POST' && request.headers.has('next-action');

  let supabaseResponse = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, {
              ...options,
              secure: process.env.NODE_ENV === 'production',
            })
          );
        },
      },
    }
  );

  // Session auffrischen – aktualisiert Cookies für den nachfolgenden Request
  const { data: { user } } = await supabase.auth.getUser();

  // Nicht eingeloggt → zum Login, AUSSER bei Server Actions
  if (!user && !isServerAction) {
    return NextResponse.redirect(new URL('/auth/login', request.url));
  }

  return supabaseResponse;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|auth|api).*)'],
};
