'use server';
/**
 * Server Actions für alle DB-Schreiboperationen.
 *
 * Warum Server Actions statt Browser-Client?
 * - Browser-Client unterliegt RLS-Policies, die in teamradar-prod/-test
 *   Writes je nach Konfiguration blockieren können.
 * - Server Actions mit Admin-Client umgehen RLS und sind serverseitig
 *   abgesichert (eigene App-Level-Berechtigungsprüfung).
 *
 * Sicherheitsmodell:
 * - Jede Action prüft zuerst auth.getUser() → kein anonymer Zugriff.
 * - Privilegierte Operationen (Mitarbeiter/Projekte/Teams/Allocations)
 *   erfordern Rolle ≥ department_lead.
 * - Availability-Writes: eigene Daten (user_id match) ODER privilegierte Rolle.
 */

import { createClient, createAdminClient } from '@/lib/supabase/server';
import type { SupabaseClient } from '@supabase/supabase-js';

const PRIVILEGED_ROLES = ['super_admin', 'admin', 'cio', 'department_lead'] as const;

async function getAuthContext() {
  const supabase = await createClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  if (error || !user) throw new Error('Nicht eingeloggt.');

  const { data: profile } = await supabase
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .maybeSingle();

  const role = (profile?.role as string) ?? 'employee';
  const isPrivileged = PRIVILEGED_ROLES.includes(role as typeof PRIVILEGED_ROLES[number]);

  // Admin-Client immer verwenden wenn Service-Role-Key gesetzt ist.
  // Supabase hat das Key-Format auf 'sb_secret_*' umgestellt – der alte
  // startsWith('eyJ') Check schloss neue Keys fälschlicherweise aus.
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  let admin: SupabaseClient;
  if (serviceKey) {
    try {
      admin = await createAdminClient();
    } catch {
      admin = supabase as unknown as SupabaseClient;
    }
  } else {
    admin = supabase as unknown as SupabaseClient;
  }

  return { userId: user.id, role, isPrivileged, admin };
}

/* ── Availabilities ─────────────────────────────────────── */

export async function upsertAvailabilityAction(entry: {
  id: string;
  memberId: string;
  userId: string;
  status: string;
  date: string;
  startTime?: string | null;
  endTime?: string | null;
  note?: string | null;
}) {
  const { userId, isPrivileged, admin } = await getAuthContext();

  // Eigene Einträge ODER privilegierte Rolle
  if (entry.userId !== userId && !isPrivileged) {
    // Fallback: prüfen ob der Member dem eingeloggten User gehört
    const { data: member } = await admin
      .from('members')
      .select('user_id')
      .eq('id', entry.memberId)
      .maybeSingle();
    if (!member || member.user_id !== userId) {
      throw new Error('Keine Berechtigung für diesen Mitarbeiter.');
    }
  }

  const row = {
    id: entry.id,
    user_id: entry.userId,
    member_id: entry.memberId,
    status: entry.status,
    date: entry.date,
    start_time: entry.startTime ?? null,
    end_time: entry.endTime ?? null,
    note: entry.note ?? null,
  };

  const { error } = await admin.from('availabilities').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Availability konnte nicht gespeichert werden: ${error.message}`);
}

export async function deleteAvailabilityAction(id: string) {
  const { userId, isPrivileged, admin } = await getAuthContext();

  if (!isPrivileged) {
    // Prüfen ob dieser Eintrag dem User gehört
    const { data: entry } = await admin
      .from('availabilities')
      .select('user_id')
      .eq('id', id)
      .maybeSingle();
    if (!entry || entry.user_id !== userId) {
      throw new Error('Keine Berechtigung für diesen Eintrag.');
    }
  }

  const { error } = await admin.from('availabilities').delete().eq('id', id);
  if (error) throw new Error(`Availability konnte nicht gelöscht werden: ${error.message}`);
}

/* ── Members ─────────────────────────────────────────────── */

export async function upsertMemberAction(row: {
  id: string;
  user_id: string;
  name: string;
  email: string;
  role: string;
  department: string;
  organization_id?: string | null;
  avatar_url?: string | null;
  phone?: string | null;
}) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Anlegen/Ändern von Mitarbeitern.');

  const { error } = await admin.from('members').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Mitarbeiter konnte nicht gespeichert werden: ${error.message}`);

  // Rolle auch in der profiles-Tabelle synchronisieren (wird für RLS-Policies verwendet)
  if (row.user_id) {
    await admin.from('profiles').update({ role: row.role }).eq('id', row.user_id);
  }
}

export async function deleteMemberAction(id: string) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Löschen von Mitarbeitern.');

  // FK-sichere Reihenfolge
  await admin.from('availabilities').delete().eq('member_id', id);
  await admin.from('allocations').delete().eq('member_id', id);
  const { error } = await admin.from('members').delete().eq('id', id);
  if (error) throw new Error(`Mitarbeiter konnte nicht gelöscht werden: ${error.message}`);
}

/* ── Teams ───────────────────────────────────────────────── */

export async function upsertTeamAction(row: {
  id: string;
  user_id: string;
  name: string;
  description?: string | null;
  member_ids: string[];
}) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Anlegen/Ändern von Teams.');

  const { error } = await admin.from('teams').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Team konnte nicht gespeichert werden: ${error.message}`);
}

export async function deleteTeamAction(id: string) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Löschen von Teams.');

  const { error } = await admin.from('teams').delete().eq('id', id);
  if (error) throw new Error(`Team konnte nicht gelöscht werden: ${error.message}`);
}

/* ── Projects ────────────────────────────────────────────── */

export async function upsertProjectAction(row: {
  id: string;
  user_id: string;
  name: string;
  type: string;
  status: string;
  client?: string | null;
  description?: string | null;
  member_ids: string[];
  start_date?: string | null;
  end_date?: string | null;
  max_days?: number | null;
}) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Anlegen/Ändern von Projekten.');

  const { error } = await admin.from('projects').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Projekt konnte nicht gespeichert werden: ${error.message}`);
}

export async function deleteProjectAction(id: string) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Löschen von Projekten.');

  await admin.from('allocations').delete().eq('project_id', id);
  const { error } = await admin.from('projects').delete().eq('id', id);
  if (error) throw new Error(`Projekt konnte nicht gelöscht werden: ${error.message}`);
}

/* ── Allocations ─────────────────────────────────────────── */

export async function upsertAllocationAction(row: {
  id: string;
  user_id: string;
  member_id: string;
  project_id: string;
  percentage: number;
  start_date: string;
  end_date: string;
}) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Anlegen/Ändern von Zuweisungen.');

  const { error } = await admin.from('allocations').upsert(row, { onConflict: 'id' });
  if (error) throw new Error(`Zuweisung konnte nicht gespeichert werden: ${error.message}`);
}

export async function deleteAllocationAction(id: string) {
  const { isPrivileged, admin } = await getAuthContext();
  if (!isPrivileged) throw new Error('Keine Berechtigung zum Löschen von Zuweisungen.');

  const { error } = await admin.from('allocations').delete().eq('id', id);
  if (error) throw new Error(`Zuweisung konnte nicht gelöscht werden: ${error.message}`);
}
