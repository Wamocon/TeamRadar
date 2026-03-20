/**
 * Supabase-Datenbankschicht für den appStore.
 * Alle Funktionen spiegeln die Store-Aktionen, persistieren aber in Supabase.
 */
import { createClient } from '@/lib/supabase/client';
import type { Member, Availability, Team } from '@/types';

/* ── Hilfsfunktionen: DB-Rows ↔ App-Typen ──────────────── */

function memberToRow(member: Member, userId: string) {
  return {
    id: member.id,
    user_id: userId,
    name: member.name,
    email: member.email,
    role: member.role,
    department: member.department,
    avatar_url: member.avatarUrl ?? null,
    phone: member.phone ?? null,
  };
}

function rowToMember(row: Record<string, unknown>): Member {
  return {
    id: row.id as string,
    name: row.name as string,
    email: row.email as string,
    role: row.role as string,
    department: row.department as string,
    avatarUrl: row.avatar_url as string | undefined,
    phone: row.phone as string | undefined,
    createdAt: row.created_at as string,
  };
}

function availabilityToRow(entry: Availability, userId: string) {
  return {
    id: entry.id,
    user_id: userId,
    member_id: entry.memberId,
    status: entry.status,
    date: entry.date,
    start_time: entry.startTime ?? null,
    end_time: entry.endTime ?? null,
    note: entry.note ?? null,
  };
}

function rowToAvailability(row: Record<string, unknown>): Availability {
  return {
    id: row.id as string,
    memberId: row.member_id as string,
    status: row.status as Availability['status'],
    date: row.date as string,
    startTime: row.start_time as string | undefined,
    endTime: row.end_time as string | undefined,
    note: row.note as string | undefined,
  };
}

function teamToRow(team: Team, userId: string) {
  return {
    id: team.id,
    user_id: userId,
    name: team.name,
    description: team.description ?? null,
    member_ids: team.memberIds,
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

export async function loadAllData() {
  if (!isSupabaseConfigured()) return null;
  const supabase = createClient();
  const userId = await getUserId();
  if (!userId) return null;

  const [
    { data: memberRows },
    { data: availabilityRows },
    { data: teamRows },
  ] = await Promise.all([
    supabase.from('members').select('*').eq('user_id', userId).order('created_at', { ascending: true }),
    supabase.from('availabilities').select('*').eq('user_id', userId).order('date', { ascending: true }),
    supabase.from('teams').select('*').eq('user_id', userId).order('name', { ascending: true }),
  ]);

  const members = (memberRows ?? []).map(rowToMember);
  const availabilities = (availabilityRows ?? []).map(rowToAvailability);
  const teams = (teamRows ?? []).map(rowToTeam);

  return { members, availabilities, teams };
}

/* ── Members ──────────────────────────────────────────────── */

export async function dbAddMember(member: Member) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('members').insert(memberToRow(member, userId));
}

export async function dbUpdateMember(member: Member) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('members').update(memberToRow(member, userId)).eq('id', member.id);
}

export async function dbDeleteMember(id: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('availabilities').delete().eq('member_id', id);
  await supabase.from('members').delete().eq('id', id);
}

/* ── Availabilities ───────────────────────────────────────── */

export async function dbAddAvailability(entry: Availability) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('availabilities').insert(availabilityToRow(entry, userId));
}

export async function dbUpdateAvailability(entry: Availability) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('availabilities').update(availabilityToRow(entry, userId)).eq('id', entry.id);
}

export async function dbDeleteAvailability(id: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('availabilities').delete().eq('id', id);
}

/* ── Teams ────────────────────────────────────────────────── */

export async function dbAddTeam(team: Team) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('teams').insert(teamToRow(team, userId));
}

export async function dbUpdateTeam(team: Team) {
  if (!isSupabaseConfigured()) return;
  const userId = await getUserId();
  if (!userId) return;
  const supabase = createClient();
  await supabase.from('teams').update(teamToRow(team, userId)).eq('id', team.id);
}

export async function dbDeleteTeam(id: string) {
  if (!isSupabaseConfigured()) return;
  const supabase = createClient();
  await supabase.from('teams').delete().eq('id', id);
}
