/**
 * Supabase-Datenbankschicht für den appStore.
 * Alle Funktionen spiegeln die Store-Aktionen, persistieren aber in Supabase.
 */
import { createClient } from '@/lib/supabase/client';
import type { Member, Availability, Team, Project, Allocation, Organization } from '@/types';
import { normalizeAvailabilityStatus } from '@/lib/status-normalization';
// Statischer Import: Next.js ersetzt Server Actions im Client-Bundle durch RPC-Stubs.
// Dynamischer Import (äawait import(...)ä) scheitert in Turbopack und verursacht Lock-Konflikte.
import { loadAllDataAction } from '@/lib/actions/dataActions';
import {
  upsertMemberAction,
  deleteMemberAction,
  upsertTeamAction,
  deleteTeamAction,
  upsertProjectAction,
  deleteProjectAction,
  upsertAllocationAction,
  deleteAllocationAction,
  upsertAvailabilityAction,
  deleteAvailabilityAction,
  bulkUpsertAvailabilitiesAction,
} from '@/lib/actions/writeActions';

/* ── Hilfsfunktionen: DB-Rows ↔ App-Typen ──────────────── */

function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    userId: row.user_id as string | undefined,
    name: row.name as string,
    email: row.email as string,
    role: row.role as string,
    department: row.department as string,
    organizationId: row.organization_id as string | undefined,
    avatarUrl: row.avatar_url as string | undefined,
    phone: row.phone as string | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToOrganization(row: Record<string, unknown>): Organization {
  return {
    id: row.id as string,
    name: row.name as string,
    slug: row.slug as string,
    createdAt: row.created_at as string,
  };
}

function rowToAvailability(row: Record<string, unknown>): Availability {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    status: normalizeAvailabilityStatus(row.status as string),
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    note: row.note as string | undefined,
  };
}

function rowToTeam(row: Record<string, unknown>): Team {
  return {
    id: row.id as string,
    name: row.name as string,
    description: row.description as string | undefined,
    memberIds: (row.member_ids as string[]) ?? [],
  };
}

function rowToProject(row: Record<string, unknown>): Project {
  return {
    id: row.id as string,
    name: row.name as string,
    type: row.type as Project['type'],
    status: row.status as Project['status'],
    client: row.client as string | undefined,
    description: row.description as string | undefined,
    memberIds: (row.member_ids as string[]) ?? [],
    startDate: row.start_date as string | undefined,
    endDate: row.end_date as string | undefined,
    maxDays: row.max_days as number | undefined,
    createdAt: row.created_at as string,
  };
}

function rowToAllocation(row: Record<string, unknown>): Allocation {
  return {
    id: row.id as string,
    projectId: row.project_id as string,
    memberId: row.member_id as string,
    percentage: row.percentage as number,
    startDate: row.start_date as string,
    endDate: row.end_date as string,
  };
}

/* ── Öffentliche API ──────────────────────────────────────── */

function isSupabaseConfigured(): boolean {
  return !!(process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY);
}

export async function getUserId(): Promise<string | null> {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const { data } = await supabase.auth.getUser();
  return data.user?.id ?? null;
}

export async function dbGetUserProfile() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .maybeSingle();

  if (error) {
    console.warn('dbGetUserProfile error:', error);
    return null;
  }

  if (!data) return null;

  return {
    id: data.id,
    email: data.email,
    displayName: data.display_name,
    role: data.role,
    avatarUrl: data.avatar_url,
    statusMessage: data.status_message,
    phone: data.phone,
    preferences: data.preferences,
    createdAt: data.created_at,
  };
}

export async function loadAllData() {
  if (!isSupabaseConfigured()) return null;
  // Kein getUserId()-Aufruf hier! Die Server Action prüft Auth selbst.
  // Doppelter Auth-Aufruf (getUserId hier + getUser in der Action) führt zu
  // Navigator-Lock-Konflikten (‚Lock stolen‘-Fehler in der Konsole).
  const rawData = await loadAllDataAction();
  if (!rawData) return null;

  const { memberRows, availabilityRows, teamRows, projectRows, allocationRows, organizationRows } = rawData;

  return {
    members: memberRows.map(rowToMember),
    availabilities: availabilityRows.map(rowToAvailability),
    teams: teamRows.map(rowToTeam),
    projects: projectRows.map(rowToProject),
    allocations: allocationRows.map(rowToAllocation),
    organizations: organizationRows.map(rowToOrganization),
  };
}

/* ── Members ──────────────────────────────────────────────── */

export async function dbAddMember(member: Member) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) throw new Error('Nicht eingeloggt.');
  await upsertMemberAction({
    id: member.id,
    user_id: userId,
    name: member.name,
    email: member.email,
    role: member.role,
    department: member.department,
    organization_id: member.organizationId ?? null,
    avatar_url: member.avatarUrl ?? null,
    phone: member.phone ?? null,
  });
}

export async function dbUpdateMember(member: Member) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  await upsertMemberAction({
    id: member.id,
    user_id: userId,
    name: member.name,
    email: member.email,
    role: member.role,
    department: member.department,
    organization_id: member.organizationId ?? null,
    avatar_url: member.avatarUrl ?? null,
    phone: member.phone ?? null,
  });
}

export async function dbDeleteMember(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteMemberAction(id);
}

/* ── Availabilities ───────────────────────────────────────── */

export async function dbAddAvailability(entry: Availability) {
  if (!isSupabaseConfigured()) return;
  // Kein getUserId()-Aufruf! Server Action liest userId sicher aus der Server-Session.
  // Browser-seitiges getUserId() führt bei Bulk-Writes zu navigator.locks Konflikten
  // und gibt silent null zurück → DB-Write wird ohne Fehler übersprungen.
  await upsertAvailabilityAction({
    id: entry.id,
    memberId: entry.memberId,
    status: entry.status,
    date: entry.date,
    startTime: entry.startTime ?? null,
    endTime: entry.endTime ?? null,
    note: entry.note ?? null,
  });
}

export async function dbUpdateAvailability(entry: Availability) {
  if (!isSupabaseConfigured()) return;
  await upsertAvailabilityAction({
    id: entry.id,
    memberId: entry.memberId,
    status: entry.status,
    date: entry.date,
    startTime: entry.startTime ?? null,
    endTime: entry.endTime ?? null,
    note: entry.note ?? null,
  });
}

export async function dbDeleteAvailability(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteAvailabilityAction(id);
}

/**
 * Bulk-Write für Availability-Einträge – ein einziger Server-Action-Call statt N parallele.
 * Vermeidet navigator.locks Browser-Lock-Konflikte bei Monat-Füllen und Mehrfachauswahl.
 */
export async function dbBulkAddAvailabilities(entries: Array<{ id: string; memberId: string; status: string; date: string }>) {
  if (!isSupabaseConfigured()) return;
  if (entries.length === 0) return;
  await bulkUpsertAvailabilitiesAction(entries);
}

/* ── Teams ────────────────────────────────────────────────── */

export async function dbAddTeam(team: Team) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  await upsertTeamAction({
    id: team.id,
    user_id: userId,
    name: team.name,
    description: team.description ?? null,
    member_ids: team.memberIds,
  });
}

export async function dbUpdateTeam(team: Team) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  await upsertTeamAction({
    id: team.id,
    user_id: userId,
    name: team.name,
    description: team.description ?? null,
    member_ids: team.memberIds,
  });
}

export async function dbDeleteTeam(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteTeamAction(id);
}

/* ── Projects ─────────────────────────────────────────────── */

export async function dbAddProject(project: Project) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) throw new Error('Nicht eingeloggt – bitte neu anmelden.');
  await upsertProjectAction({
    id: project.id,
    user_id: userId,
    name: project.name,
    type: project.type,
    status: project.status,
    client: project.client ?? null,
    description: project.description ?? null,
    member_ids: project.memberIds,
    start_date: project.startDate ?? null,
    end_date: project.endDate ?? null,
    max_days: project.maxDays ?? null,
  });
}

export async function dbUpdateProject(project: Project) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) throw new Error('Nicht eingeloggt.');
  await upsertProjectAction({
    id: project.id,
    user_id: userId,
    name: project.name,
    type: project.type,
    status: project.status,
    client: project.client ?? null,
    description: project.description ?? null,
    member_ids: project.memberIds,
    start_date: project.startDate ?? null,
    end_date: project.endDate ?? null,
    max_days: project.maxDays ?? null,
  });
}

export async function dbDeleteProject(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteProjectAction(id);
}

/* ── Allocations ──────────────────────────────────────────── */

export async function dbAddAllocation(alloc: Allocation) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  await upsertAllocationAction({
    id: alloc.id,
    user_id: userId,
    member_id: alloc.memberId,
    project_id: alloc.projectId,
    percentage: alloc.percentage,
    start_date: alloc.startDate,
    end_date: alloc.endDate,
  });
}

export async function dbUpdateAllocation(alloc: Allocation) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  await upsertAllocationAction({
    id: alloc.id,
    user_id: userId,
    member_id: alloc.memberId,
    project_id: alloc.projectId,
    percentage: alloc.percentage,
    start_date: alloc.startDate,
    end_date: alloc.endDate,
  });
}

export async function dbDeleteAllocation(id: string) {
  if (!isSupabaseConfigured()) return;
  await deleteAllocationAction(id);
}
