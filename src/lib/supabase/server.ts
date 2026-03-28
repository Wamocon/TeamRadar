import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';

export async function createClient() {
  const cookieStore = await cookies();
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: Record<string, unknown> }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch { /* In Server Components ignorieren */ }
        },
      },
      cookieOptions: {
        sameSite: 'lax',
        secure: true,
      },
    }
  );
}

export async function createAdminClient() {
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
      db: { schema },
      cookies: {
        getAll() { return [] },
        setAll() {},
      },
      cookieOptions: {
        sameSite: 'lax',
        secure: true,
      },
    }
  );
}
