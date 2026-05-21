import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * Middleware zur Session-Aktualisierung.
 *
 * Supabase Access-Tokens laufen nach 1 Stunde ab. Ohne diese Middleware
 * würde der Browser-Client zwar einen neuen Token holen, aber der alte
 * (ungültige) Refresh-Token liegt noch im Cookie. Beim nächsten Server-Action-
 * Aufruf schlägt dann auth.getUser() mit "Invalid Refresh Token Not Found" fehl
 * und alle optimistischen Store-Updates werden zurückgerollt.
 *
 * Diese Middleware liest die Request-Cookies, refresht bei Bedarf die Session
 * und schreibt die neuen Tokens sowohl in den Request (für Server Actions)
 * als auch in die Response (für den Browser).
 */
export async function middleware(request: NextRequest) {
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
          // Tokens in den Request schreiben → für Server Actions im gleichen Request
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          // Neue Response mit aktualisierten Cookies erstellen
          supabaseResponse = NextResponse.next({ request });
          // Tokens in die Response schreiben → Browser speichert neue Tokens
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options as Record<string, unknown>)
          );
        },
      },
    }
  );

  // WICHTIG: Keine Logik zwischen createServerClient und getUser().
  // getUser() refresht den Access-Token wenn nötig und schreibt neue Cookies.
  await supabase.auth.getUser();

  return supabaseResponse;
}

export const config = {
  matcher: [
    // Alle Routen außer statische Assets und Bilder
    '/((?!_next/static|_next/image|favicon\\.(?:ico|svg|png)|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};
