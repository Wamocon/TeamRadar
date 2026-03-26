import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!url || !key) {
  console.error('Missing env vars');
  process.exit(1);
}

// Check public schema
const clientPublic = createClient(url, key, { db: { schema: 'public' } });
clientPublic.from('members').select('*').limit(1).then(res => {
  console.log('PUBLIC SCHEMA:', res);
});

// Check test schema
const clientTest = createClient(url, key, { db: { schema: 'test' } });
clientTest.from('members').select('*').limit(1).then(res => {
  console.log('TEST SCHEMA:', res);
});
