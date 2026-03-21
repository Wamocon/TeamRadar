/* ── Verfügbarkeits-Status ───────────────────────────────── */
export type AvailabilityStatus =
  | 'available'
  | 'busy'
  | 'meeting'
  | 'vacation'
  | 'sick'
  | 'remote'
  | 'offline';

export const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; bgClass: string }> = {
  available: { label: 'Verfügbar',  color: '#22c55e', bgClass: 'bg-green-500' },
  busy:      { label: 'Beschäftigt', color: '#ef4444', bgClass: 'bg-red-500' },
  meeting:   { label: 'Im Meeting',  color: '#f59e0b', bgClass: 'bg-amber-500' },
  vacation:  { label: 'Urlaub',      color: '#8b5cf6', bgClass: 'bg-violet-500' },
  sick:      { label: 'Krank',       color: '#ec4899', bgClass: 'bg-pink-500' },
  remote:    { label: 'Remote',      color: '#3b82f6', bgClass: 'bg-blue-500' },
  offline:   { label: 'Offline',     color: '#6b7280', bgClass: 'bg-gray-500' },
};

/* ── Benutzerrollen ─────────────────────────────────────── */
export type UserRole = 'admin' | 'manager' | 'member';

export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  admin: 3,
  manager: 2,
  member: 1,
};

/* ── Team-Mitglied ──────────────────────────────────────── */
export interface Member {
  id: string;
  name: string;
  email: string;
  role: string;           // Jobtitel/Position
  department: string;
  avatarUrl?: string;
  phone?: string;
  createdAt: string;
}

/* ── Verfügbarkeits-Eintrag ─────────────────────────────── */
export interface Availability {
  id: string;
  memberId: string;
  status: AvailabilityStatus;
  date: string;           // ISO-Datum YYYY-MM-DD
  startTime?: string;     // HH:mm
  endTime?: string;       // HH:mm
  note?: string;
}

/* ── Team/Abteilung ─────────────────────────────────────── */
export interface Team {
  id: string;
  name: string;
  description?: string;
  memberIds: string[];
}

/* ── Projekt-Typ (Beratungshaus: intern vs. extern) ─────── */
export type ProjectType = 'internal' | 'external';
export type ProjectStatus = 'planned' | 'active' | 'completed';

export const PROJECT_TYPE_CONFIG: Record<ProjectType, { label: string; color: string; bgClass: string }> = {
  internal: { label: 'Intern',  color: '#6366f1', bgClass: 'bg-indigo-500' },
  external: { label: 'Extern', color: '#f97316', bgClass: 'bg-orange-500' },
};

export const PROJECT_STATUS_CONFIG: Record<ProjectStatus, { label: string; color: string }> = {
  planned:   { label: 'Geplant',      color: '#a3a3a3' },
  active:    { label: 'Aktiv',        color: '#22c55e' },
  completed: { label: 'Abgeschlossen', color: '#6b7280' },
};

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  client?: string;          // Kundenname (v.a. bei externen Projekten)
  description?: string;
  memberIds: string[];
  startDate?: string;       // ISO-Datum YYYY-MM-DD
  endDate?: string;         // ISO-Datum YYYY-MM-DD
  createdAt: string;
}

/* ── Benutzerprofil ─────────────────────────────────────── */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}
