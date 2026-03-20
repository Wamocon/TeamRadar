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

/* ── Benutzerprofil ─────────────────────────────────────── */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
}
