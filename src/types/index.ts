/* ── Verfügbarkeits-Status ───────────────────────────────── */
export type AvailabilityStatus =
  | 'available'
  | 'busy'
  | 'meeting'
  | 'vacation'
  | 'sick'
  | 'remote'
  | 'offline'
  | 'extern-onsite'
  | 'extern-remote';

export const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; bgClass: string }> = {
  available:      { label: 'Verfügbar',    color: '#22c55e', bgClass: 'bg-green-500' },
  busy:           { label: 'Büro intern',  color: '#6366f1', bgClass: 'bg-indigo-500' },
  meeting:        { label: 'Im Meeting',   color: '#f59e0b', bgClass: 'bg-amber-500' },
  vacation:       { label: 'Urlaub',       color: '#8b5cf6', bgClass: 'bg-violet-500' },
  sick:           { label: 'Krank',        color: '#ec4899', bgClass: 'bg-pink-500' },
  remote:         { label: 'Homeoffice',   color: '#06b6d4', bgClass: 'bg-cyan-500' },
  offline:        { label: 'Kein Status',  color: '#6b7280', bgClass: 'bg-gray-500' },
  'extern-onsite':{ label: 'Ext. Projekt', color: '#f97316', bgClass: 'bg-orange-500' },
  'extern-remote':{ label: 'Büro ext.',    color: '#fb923c', bgClass: 'bg-orange-400' },
};

/* ── Benutzerrollen ─────────────────────────────────────── */
export type UserRole = 'super_admin' | 'admin' | 'cio' | 'department_lead' | 'employee';

export const USER_ROLE_HIERARCHY: Record<UserRole, number> = {
  super_admin: 5,
  admin: 4,
  cio: 3,
  department_lead: 2,
  employee: 1,
};

/* ── Organisation ───────────────────────────────────────────── */
export interface Organization {
  id: string;
  name: string;
  slug: string;
  createdAt: string;
}

/* ── Team-Mitglied ──────────────────────────────────────────── */
export interface Member {
  id: string;
  userId?: string;        // Supabase Auth User ID
  name: string;
  email: string;
  role: string;           // Jobtitel/Position
  department: string;
  organizationId?: string; // optional – App nutzbar ohne Org
  avatarUrl?: string;
  phone?: string;
  skills?: Skill[];
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
  budgetHours?: number;     // Geplantes Stundenkontingent
  maxDays?: number;         // Max. Beauftragungstage pro Jahr (nur externe Projekte)
  createdAt: string;
}

/* ── Skill / Kompetenz ──────────────────────────────────── */
export type SkillLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

export const SKILL_LEVEL_CONFIG: Record<SkillLevel, { label: string; color: string; value: number }> = {
  beginner:     { label: 'Grundkenntnisse', color: '#a3a3a3', value: 1 },
  intermediate: { label: 'Fortgeschritten', color: '#3b82f6', value: 2 },
  advanced:     { label: 'Erfahren',        color: '#f59e0b', value: 3 },
  expert:       { label: 'Experte',         color: '#22c55e', value: 4 },
};

export const SKILL_CATEGORIES = [
  'Frontend', 'Backend', 'Cloud', 'Mobile', 'Data', 'Design',
  'DevOps', 'Security', 'Management', 'Sonstiges',
] as const;

export type SkillCategory = typeof SKILL_CATEGORIES[number];

export interface Skill {
  name: string;
  category: SkillCategory;
  level: SkillLevel;
}

/* ── Projekt-Zuweisung / Auslastung ────────────────────── */
export interface Allocation {
  id: string;
  memberId: string;
  projectId: string;
  percentage: number;       // 0-100, z.B. 50 = halbe Stelle
  startDate: string;        // ISO-Datum YYYY-MM-DD
  endDate: string;          // ISO-Datum YYYY-MM-DD
  note?: string;
}

/* ── Alert / Warnung ────────────────────────────────────── */
export type AlertType = 'overbooking' | 'conflict' | 'no_allocation' | 'vacation_conflict';

export interface Alert {
  id: string;
  type: AlertType;
  memberId: string;
  message: string;
  projectIds?: string[];
  date?: string;
  severity: 'warning' | 'error';
}

export const ALERT_TYPE_CONFIG: Record<AlertType, { label: string; icon: string; color: string }> = {
  overbooking:       { label: 'Überbuchung',          icon: '⚠️', color: '#ef4444' },
  conflict:          { label: 'Konflikt',             icon: '🔴', color: '#f97316' },
  no_allocation:     { label: 'Keine Zuweisung',      icon: '📋', color: '#a3a3a3' },
  vacation_conflict: { label: 'Urlaubs-Konflikt',     icon: '🏖️', color: '#8b5cf6' },
};

/* ── Benutzerprofil ─────────────────────────────────────── */
export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  avatarUrl?: string;
  statusMessage?: string;
  phone?: string;
  createdAt?: string;
  preferences?: {
    theme?: 'light' | 'dark' | 'system';
    notifications?: boolean;
  };
}
