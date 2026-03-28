import { createBrowserClient } from '@supabase/ssr';

export function createClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const schema = process.env.NEXT_PUBLIC_DB_SCHEMA || 'public';
  if (!url || !key) {
    throw new Error('Supabase ist nicht konfiguriert. Bitte NEXT_PUBLIC_SUPABASE_URL und NEXT_PUBLIC_SUPABASE_ANON_KEY in .env.local setzen.');
  }
  // In Top-Level-Fenstern (E-Mail Klick) nutzen wir 'lax' (Standard).
  // In Iframes (Integration in TeamRadar) MÜSSEN wir 'none' + 'secure' nutzen.
  const isIframe = typeof window !== 'undefined' && window.self !== window.top;

  return createBrowserClient(url, key, { 
    db: { schema },
    cookieOptions: {
      sameSite: isIframe ? 'none' : 'lax',
      secure: true,
    }
  });
}
