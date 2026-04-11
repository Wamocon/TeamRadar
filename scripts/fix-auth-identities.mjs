/**
 * Repariert fehlende Auth-Identities für alle Supabase-User.
 * Ohne Identity funktioniert kein Email/Password-Login.
 *
 * Ausführen: node scripts/fix-auth-identities.mjs
 */

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://sumizzyukytgjllgwjqo.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SERVICE_KEY) {
  console.error('❌  SUPABASE_SERVICE_ROLE_KEY fehlt. Führe aus:');
  console.error('   $env:SUPABASE_SERVICE_ROLE_KEY="<key>"; node scripts/fix-auth-identities.mjs');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SERVICE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false },
});

// Standard-Passwort das nach dem Fix geändert werden sollte
const TEMP_PASSWORD = 'TeamRadar2026!';

async function fixIdentities() {
  console.log('🔍  Lade alle Auth-User...');
  const { data, error } = await supabase.auth.admin.listUsers();
  if (error) { console.error('❌  listUsers:', error.message); process.exit(1); }

  const broken = data.users.filter(u => !u.identities || u.identities.length === 0);
  console.log(`⚠️   ${broken.length} User ohne Identity gefunden (von ${data.users.length} gesamt)\n`);

  if (broken.length === 0) {
    console.log('✅  Alle User haben bereits Identities – nichts zu tun.');
    return;
  }

  let ok = 0, fail = 0;

  for (const user of broken) {
    const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
      password: TEMP_PASSWORD,
      email_confirm: true,
    });

    if (updateError) {
      console.error(`❌  ${user.email}: ${updateError.message}`);
      fail++;
    } else {
      console.log(`✅  ${user.email}`);
      ok++;
    }
  }

  console.log(`\n📊  Ergebnis: ${ok} repariert, ${fail} fehlgeschlagen`);
  if (ok > 0) {
    console.log(`\n🔑  Temporäres Passwort für alle reparierten User: "${TEMP_PASSWORD}"`);
    console.log('   Bitte nach dem ersten Login in den Settings ändern!');
  }
}

fixIdentities().catch(console.error);
