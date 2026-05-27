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
  | 'extern-remote'
  | 'home-extern'        // HeP: Homeoffice externes Projekt
  | 'berufsschule'       // BS:  Berufschule
  | 'buero-berufsschule' // BBS: Büro Berufschule
  | 'buero-uni'          // BU:  Büro Universität
  | 'uni';               // U:   Universität

export const STATUS_CONFIG: Record<AvailabilityStatus, { label: string; color: string; bgClass: string }> = {
  available:           { label: 'Verfügbar',              color: '#22c55e', bgClass: 'bg-green-500' },
  busy:                { label: 'Büro intern',            color: '#6366f1', bgClass: 'bg-indigo-500' },
  meeting:             { label: 'Im Meeting',             color: '#f59e0b', bgClass: 'bg-amber-500' },
  vacation:            { label: 'Urlaub',                 color: '#8b5cf6', bgClass: 'bg-violet-500' },
  sick:                { label: 'Krank',                  color: '#ec4899', bgClass: 'bg-pink-500' },
  remote:              { label: 'Homeoffice intern',      color: '#06b6d4', bgClass: 'bg-cyan-500' },
  offline:             { label: 'Kein Status',            color: '#6b7280', bgClass: 'bg-gray-500' },
  'extern-onsite':     { label: 'Ext. Projekt',           color: '#f97316', bgClass: 'bg-orange-500' },
  'extern-remote':     { label: 'Büro ext. Projekt',      color: '#fb923c', bgClass: 'bg-orange-400' },
  'home-extern':       { label: 'Homeoffice ext. Projekt',color: '#0891b2', bgClass: 'bg-cyan-600' },
  'berufsschule':      { label: 'Berufschule',            color: '#ca8a04', bgClass: 'bg-yellow-600' },
  'buero-berufsschule':{ label: 'Büro Berufschule',       color: '#a16207', bgClass: 'bg-yellow-700' },
  'buero-uni':         { label: 'Büro Universität',       color: '#1d4ed8', bgClass: 'bg-blue-700' },
  'uni':               { label: 'Universität',            color: '#7c3aed', bgClass: 'bg-violet-700' },
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

/* ── Berater-Typ (unabhängig von der App-Rolle) ─────────────── */
export type ConsultantType = 'consultant' | 'senior_consultant' | 'apprentice';

export const CONSULTANT_TYPE_CONFIG: Record<ConsultantType, { label: string; short: string; color: string; capacityComponents: string[] }> = {
  consultant:        { label: 'Berater',          short: 'B',  color: '#6366f1', capacityComponents: ['ext_project', 'int_project', 'university'] },
  senior_consultant: { label: 'Senior Berater',   short: 'SB', color: '#f97316', capacityComponents: ['ext_project', 'int_project'] },
  apprentice:        { label: 'Auszubildender',   short: 'Az', color: '#22c55e', capacityComponents: ['int_project', 'vocational_school'] },
};

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
  consultantType?: ConsultantType;   // Berater / Senior / Auszubildender
  // Erweiterte Profilinformationen
  bio?: string;
  location?: string;
  linkedIn?: string;
  website?: string;
  jobTitle?: string;
  startDate?: string;       // Eintrittsdatum
  birthDate?: string;
  emergencyContact?: string;
  languages?: string[];
  certifications?: string[];
  education?: string;
  travelWillingness?: 'none' | 'occasional' | 'regular' | 'frequent';
  hoursPerWeek?: number;
  homeOfficePercentage?: number;
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

/* ── Projekt-Zuweisung Rolle ──────────────────────────────── */
export type ProjectMemberRole = 'operative' | 'supporting' | 'informed';

export const PROJECT_MEMBER_ROLE_CONFIG: Record<ProjectMemberRole, { label: string; short: string; color: string }> = {
  operative:  { label: 'Operativ',     short: 'Op', color: '#6366f1' },
  supporting: { label: 'Unterstützend', short: 'Un', color: '#f59e0b' },
  informed:   { label: 'Informierend', short: 'In', color: '#6b7280' },
};

export interface ProjectMember {
  memberId: string;
  role: ProjectMemberRole;
}

export interface Project {
  id: string;
  name: string;
  type: ProjectType;
  status: ProjectStatus;
  client?: string;          // Kundenname (v.a. bei externen Projekten)
  clientContact?: string;   // Ansprechpartner beim Kunden
  clientEmail?: string;
  clientPhone?: string;
  description?: string;
  objectives?: string;      // Projektziele
  keyDeliverables?: string; // Wichtige Liefergegenstände
  risks?: string;           // Risikohinweise
  notes?: string;           // Interne Notizen / How-Tos
  tags?: string[];          // Schlagwörter
  memberIds: string[];
  projectMembers?: ProjectMember[]; // Mitglieder mit Rollen
  startDate?: string;       // ISO-Datum YYYY-MM-DD
  endDate?: string;         // ISO-Datum YYYY-MM-DD
  plannedEndDate?: string;  // Geplanter Abschluss
  budgetHours?: number;     // Geplantes Stundenkontingent
  budgetAmount?: number;    // Budget in Euro
  maxDays?: number;         // Max. Beauftragungstage pro Jahr (nur externe Projekte)
  priority?: 'low' | 'medium' | 'high' | 'critical';
  projectNumber?: string;   // Projektnummer / Auftragsnummer
  location?: string;        // Projektstandort
  remotePercentage?: number; // Home-Office-Anteil in %
  technologies?: string[];  // Eingesetzte Technologien
  framework?: string;       // Projektrahmenwerk (Scrum, Kanban, ...)
  reportingCycle?: string;  // Berichtsrhythmus
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

/* ── Ausbildungs-Kurs / Schulung ────────────────────────── */
export type TrainingType = 'university' | 'vocational_school' | 'seminar' | 'certification' | 'workshop';

export const TRAINING_TYPE_CONFIG: Record<TrainingType, { label: string; color: string; icon: string }> = {
  university:       { label: 'Universität / FH', color: '#6366f1', icon: '🎓' },
  vocational_school:{ label: 'Berufsschule',     color: '#f59e0b', icon: '🏫' },
  seminar:          { label: 'Seminar',           color: '#22c55e', icon: '📚' },
  certification:    { label: 'Zertifizierung',    color: '#f97316', icon: '🏆' },
  workshop:         { label: 'Workshop',          color: '#06b6d4', icon: '🔧' },
};

export type TrainingStatus = 'planned' | 'active' | 'completed';

export interface TrainingCourse {
  id: string;
  name: string;
  type: TrainingType;
  status: TrainingStatus;
  provider?: string;         // Anbieter (Uni, Schule, Institut)
  providerContact?: string;
  description?: string;
  objectives?: string;
  location?: string;
  remotePercentage?: number;
  startDate?: string;
  endDate?: string;
  hoursPerWeek?: number;
  memberIds: string[];       // Zugewiesene Berater
  projectMembers?: ProjectMember[]; // Mit Rollen
  notes?: string;
  certificationEarned?: string;
  tags?: string[];
  createdAt: string;
}

/* ── Organisations-Einstellungen ────────────────────────── */
export interface OrgSettings {
  // Allgemein
  orgName: string;
  orgLogoUrl?: string;
  supportEmail: string;
  maintenanceMode: boolean;
  // Arbeitszeiten
  standardWorkHoursPerDay: number;     // Standard: 8
  standardWorkDaysPerWeek: number;     // Standard: 5
  weekStartDay: 0 | 1;                 // 0=Sonntag, 1=Montag
  // Feiertage
  defaultBundesland: string;           // Standard-Bundesland für Feiertage
  additionalHolidays?: { date: string; name: string }[];
  // Kapazitätsregeln
  extConsultantWeeklyHours: number;    // Standard: 39 (Außen-Berater)
  maxVacationDaysPerYear: number;
  // Urlaubsregeln
  vacationCarryoverMonths: number;     // Monate bis Übertrag verfällt
  // Benachrichtigungen
  alertOverbookingThreshold: number;   // %, ab dem Warnung erscheint (Standard: 100)
}

