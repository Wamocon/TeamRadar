'use server';
/**
 * Server Actions für Datenbankzugriffe.
 *
 * loadAllDataAction nutzt den Service-Role-Key um RLS zu umgehen,
 * damit alle authentifizierten Teammitglieder alle Daten sehen können.
 *
 * Wenn SUPABASE_SERVICE_ROLE_KEY nicht gesetzt ist (lokale Entwicklung),
 * wird der normale Client als Fallback genutzt.
 *
 * Für Produktion: SUPABASE_SERVICE_ROLE_KEY in Umgebungsvariablen setzen
 * UND Migration 20260413_fix_rls_employee_visibility.sql ausführen.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

async function getReadClient(): Promise<SupabaseClient> {
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  // Admin-Client immer verwenden wenn Service-Role-Key gesetzt ist.
  // Supabase hat das Key-Format auf 'sb_secret_*' umgestellt – der alte
  // startsWith('eyJ') Check schloss neue Keys fälschlicherweise aus.
  if (serviceKey) {
    try {
      return await createAdminClient();
    } catch (e) {
      console.warn('createAdminClient fehlgeschlagen, Fallback auf anon client:', e);
    }
  }
  // Fallback: normaler Auth-Client
  return await createClient();
}

export async function loadAllDataAction(): Promise<{
  memberRows: Record<string, unknown>[];
  availabilityRows: Record<string, unknown>[];
  teamRows: Record<string, unknown>[];
  projectRows: Record<string, unknown>[];
  allocationRows: Record<string, unknown>[];
  organizationRows: Record<string, unknown>[];
} | null> {
  // 1. Authentifizierung prüfen
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) return null;

  // 2. Read-Client wählen (Admin > Fallback auf anon)
  const client = await getReadClient();

  const [
    { data: memberRows, error: mErr },
    { data: availabilityRows, error: aErr },
    { data: teamRows, error: tErr },
    { data: projectRows, error: pErr },
    { data: allocationRows, error: alErr },
    { data: organizationRows },
  ] = await Promise.all([
    client.from('members').select('*').order('created_at', { ascending: true }),
    client.from('availabilities').select('*').order('date', { ascending: true }).limit(50000),
    client.from('teams').select('*').order('name', { ascending: true }),
    client.from('projects').select('*').order('name', { ascending: true }),
    client.from('allocations').select('*'),
    client.from('organizations').select('id, name, slug, created_at').order('name', { ascending: true }),
  ]);

  if (mErr) { console.error('loadAllDataAction members:', mErr); throw new Error(mErr.message); }
  if (aErr) { console.error('loadAllDataAction availabilities:', aErr); throw new Error(aErr.message); }
  if (tErr) { console.error('loadAllDataAction teams:', tErr); throw new Error(tErr.message); }
  if (pErr) { console.error('loadAllDataAction projects:', pErr); throw new Error(pErr.message); }
  if (alErr) { console.error('loadAllDataAction allocations:', alErr); throw new Error(alErr.message); }
  // organizations-Fehler sind nicht kritisch – App funktioniert ohne Org-Zuweisung

  return {
    memberRows: (memberRows ?? []) as Record<string, unknown>[],
    availabilityRows: (availabilityRows ?? []) as Record<string, unknown>[],
    teamRows: (teamRows ?? []) as Record<string, unknown>[],
    projectRows: (projectRows ?? []) as Record<string, unknown>[],
    allocationRows: (allocationRows ?? []) as Record<string, unknown>[],
    organizationRows: (organizationRows ?? []) as Record<string, unknown>[],
  };
}

/**
 * Availability hinzufügen – zuerst normaler Client, Fallback Admin-Client.
 */
export async function addAvailabilityAction(entry: {
  id: string;
  memberId: string;
  status: string;
  date: string;
  startTime?: string;
  endTime?: string;
  note?: string;
}) {
  const supabase = await createClient();
  const { data: { user }, error: authErr } = await supabase.auth.getUser();
  if (authErr || !user) throw new Error('Nicht eingeloggt.');

  const row = {
    id: entry.id,
    user_id: user.id,
    member_id: entry.memberId,
    status: entry.status,
    date: entry.date,
    start_time: entry.startTime ?? null,
    end_time: entry.endTime ?? null,
    note: entry.note ?? null,
  };

  // Versuche mit normalem Client
  const { error } = await supabase.from('availabilities').upsert(row, { onConflict: 'id' });
  if (!error) return;

  // Fallback: Admin-Client (wenn Service-Role-Key vorhanden)
  if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
    throw new Error(`Verfügbarkeit konnte nicht gespeichert werden: ${error.message}`);
  }

  // Berechtigungsprüfung: ist dieser Member dem User zugeordnet?
  const adminClient = await createAdminClient();
  const { data: profileData } = await supabase
    .from('profiles').select('role, email').eq('id', user.id).maybeSingle();

  const role = profileData?.role as string | undefined;
  const isPrivileged = ['super_admin', 'admin', 'cio', 'department_lead'].includes(role ?? '');

  if (!isPrivileged) {
    const { data: memberData } = await adminClient
      .from('members').select('user_id, email').eq('id', entry.memberId).maybeSingle();
    if (!memberData) throw new Error('Mitarbeiter nicht gefunden.');

    const ownByUserId = memberData.user_id === user.id;
    const ownByEmail = profileData?.email && memberData.email
      ? memberData.email.toLowerCase() === profileData.email.toLowerCase()
      : false;

    if (!ownByUserId && !ownByEmail) {
      throw new Error('Keine Berechtigung für diesen Mitarbeiter.');
    }
  }

  const { error: adminErr } = await adminClient.from('availabilities').upsert(row, { onConflict: 'id' });
  if (adminErr) throw new Error(adminErr.message);
}
