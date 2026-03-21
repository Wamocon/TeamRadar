/**
 * Seed-Skript für TeamRadar.
 * Erstellt Beispiel-Mitarbeiter und -Verfügbarkeiten in Supabase.
 *
 * Verwendung:
 *   npx tsx scripts/seed-supabase.ts
 *
 * Voraussetzungen:
 *   - .env.local mit NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY und SEED_USER_ID
 */
import { config } from 'dotenv';
config({ path: '.env.local' });
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const userId = process.env.SEED_USER_ID!;
const schema = (process.env.NEXT_PUBLIC_DB_SCHEMA ?? 'test') as 'test' | 'prod' | 'public';

if (!url || !key || !userId) {
  console.error('Fehlende Umgebungsvariablen. Bitte .env.local prüfen.');
  process.exit(1);
}

if (schema === 'prod') {
  console.error('❌ Seed in das prod-Schema ist nicht erlaubt! Abbruch.');
  process.exit(1);
}

const supabase = createClient(url, key, { db: { schema } });

const today = new Date().toISOString().slice(0, 10);

const members = [
  { id: '11111111-1111-1111-1111-111111111111', name: 'Anna Schmidt', email: 'anna@firma.de', role: 'Frontend-Entwicklerin', department: 'Engineering' },
  { id: '22222222-2222-2222-2222-222222222222', name: 'Ben Müller', email: 'ben@firma.de', role: 'Backend-Entwickler', department: 'Engineering' },
  { id: '33333333-3333-3333-3333-333333333333', name: 'Clara Fischer', email: 'clara@firma.de', role: 'UX-Designerin', department: 'Design' },
  { id: '44444444-4444-4444-4444-444444444444', name: 'David Weber', email: 'david@firma.de', role: 'Projektmanager', department: 'Management' },
  { id: '55555555-5555-5555-5555-555555555555', name: 'Elena Braun', email: 'elena@firma.de', role: 'DevOps-Ingenieurin', department: 'Engineering' },
  { id: '66666666-6666-6666-6666-666666666666', name: 'Felix Hartmann', email: 'felix@firma.de', role: 'QA-Engineer', department: 'Engineering' },
];

const availabilities = [
  { member_id: members[0].id, status: 'available', date: today, start_time: '09:00', end_time: '17:00' },
  { member_id: members[1].id, status: 'remote', date: today, start_time: '08:00', end_time: '16:00', note: 'Arbeitet von Zuhause' },
  { member_id: members[2].id, status: 'meeting', date: today, start_time: '10:00', end_time: '12:00', note: 'Design-Review' },
  { member_id: members[3].id, status: 'busy', date: today, start_time: '09:00', end_time: '18:00', note: 'Sprint Planning' },
  { member_id: members[4].id, status: 'vacation', date: today, note: 'Urlaub bis 28.03.' },
  { member_id: members[5].id, status: 'available', date: today, start_time: '09:00', end_time: '17:00' },
];

const teams = [
  { name: 'Frontend-Team', description: 'Web-Entwicklung', member_ids: [members[0].id, members[2].id] },
  { name: 'Backend-Team', description: 'API & Infrastruktur', member_ids: [members[1].id, members[4].id, members[5].id] },
];

async function seed() {
  console.log(`🌱 Seeding TeamRadar (Schema: ${schema})...\n`);

  // Members
  const { error: mErr } = await supabase.from('members').upsert(
    members.map((m) => ({ ...m, user_id: userId })),
    { onConflict: 'id' }
  );
  if (mErr) console.error('Members:', mErr.message);
  else console.log(`✅ ${members.length} Mitarbeiter angelegt`);

  // Availabilities
  const { error: aErr } = await supabase.from('availabilities').insert(
    availabilities.map((a) => ({ ...a, user_id: userId }))
  );
  if (aErr) console.error('Availabilities:', aErr.message);
  else console.log(`✅ ${availabilities.length} Verfügbarkeiten eingetragen`);

  // Teams
  const { error: tErr } = await supabase.from('teams').insert(
    teams.map((t) => ({ ...t, user_id: userId }))
  );
  if (tErr) console.error('Teams:', tErr.message);
  else console.log(`✅ ${teams.length} Teams erstellt`);

  console.log('\n🎉 Seed abgeschlossen!');
}

seed();
