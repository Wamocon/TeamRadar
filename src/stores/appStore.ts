import { create } from 'zustand';
import type { Member, Availability, Team, Project, AvailabilityStatus, UserProfile, UserRole, Allocation, Alert, ProjectType } from '@/types';
import {
  loadAllData,
  dbAddMember,
  dbUpdateMember,
  dbDeleteMember,
  dbAddAvailability,
  dbUpdateAvailability,
  dbDeleteAvailability,
  dbAddTeam,
  dbUpdateTeam,
  dbDeleteTeam,
  dbAddProject,
  dbUpdateProject,
  dbDeleteProject,
  dbAddAllocation,
  dbUpdateAllocation,
  dbDeleteAllocation,
  dbGetUserProfile,
} from '@/lib/supabase/db';

interface AppStore {
  /* ── Daten ─────────────────────────────────── */
  members: Member[];
  availabilities: Availability[];
  teams: Team[];
  projects: Project[];
  allocations: Allocation[];
  userProfile: UserProfile | null;
  systemSettings: {
    orgName: string;
    orgLogoUrl?: string;
    supportEmail: string;
    maintenanceMode: boolean;
  } | null;

  /* ── Lade-Zustand ──────────────────────────── */
  isLoading: boolean;
  dbError: string | null;

  /* ── Laden ─────────────────────────────────── */
  loadFromSupabase: () => Promise<void>;
  loadUserProfile: () => Promise<void>;
  setUserProfile: (profile: UserProfile | null) => void;
  loadSystemSettings: () => Promise<void>;
  updateSystemSettings: (data: any) => void;

  /* ── Mitarbeiter ───────────────────────────── */
  addMember: (member: Omit<Member, 'id' | 'createdAt'>) => Member;
  updateMember: (id: string, data: Partial<Member>) => void;
  deleteMember: (id: string) => void;

  /* ── Verfügbarkeit ─────────────────────────── */
  addAvailability: (entry: Omit<Availability, 'id'>) => Availability;
  updateAvailability: (id: string, data: Partial<Availability>) => void;
  deleteAvailability: (id: string) => void;
  getMemberStatus: (memberId: string, date?: string) => AvailabilityStatus;

  /* ── Teams ─────────────────────────────────── */
  addTeam: (team: Omit<Team, 'id'>) => Team;
  updateTeam: (id: string, data: Partial<Team>) => void;
  deleteTeam: (id: string) => void;

  /* ── Projekte ────────────────────────────── */
  addProject: (project: Omit<Project, 'id' | 'createdAt'>) => Project;
  updateProject: (id: string, data: Partial<Project>) => void;
  deleteProject: (id: string) => void;
  getMemberProjects: (memberId: string) => Project[];

  /* ── Allocations (Zuweisungen) ─────────────── */
  addAllocation: (alloc: Omit<Allocation, 'id'>) => Allocation;
  updateAllocation: (id: string, data: Partial<Allocation>) => void;
  deleteAllocation: (id: string) => void;
  getMemberUtilization: (memberId: string, date?: string, projectType?: ProjectType) => number;
  getMemberAllocations: (memberId: string, date?: string, projectType?: ProjectType) => Allocation[];
  getProjectAllocations: (projectId: string) => Allocation[];

  /* ── Alerts ────────────────────────────────── */
  getAlerts: () => Alert[];

  /* ── Rollen ────────────────────────────────── */
  hasMinRole: (role: UserRole) => boolean;
}

export const useAppStore = create<AppStore>()(
  (set, get) => ({
    members: [],
    availabilities: [],
    teams: [],
    projects: [],
    allocations: [],
    userProfile: process.env.NODE_ENV !== 'production' 
      ? { 
          id: 'mock-1', 
          email: 'admin@dev.local', 
          displayName: 'Dev Admin', 
          role: 'admin',
          avatarUrl: 'https://images.unsplash.com/photo-1510915361894-db8b60106cb1?auto=format&fit=crop&q=80&w=150',
          statusMessage: 'Building TeamRadar 🚀',
          phone: '+49 123 456789',
          preferences: { theme: 'system' as const, notifications: true }
        } 
      : null,
    systemSettings: process.env.NODE_ENV !== 'production'
      ? {
          orgName: 'Wamocon TeamRadar',
          supportEmail: 'support@wamocon.de',
          maintenanceMode: false
        }
      : null,
    isLoading: false,
    dbError: null,

    /* ── Supabase laden ──────────────────────── */
    loadFromSupabase: async () => {
      set({ isLoading: true, dbError: null });
      try {
        // Zuerst Profil laden für RBAC
        await get().loadUserProfile();
        
        const data = await loadAllData();
        if (data) {
          set({
            members: data.members,
            availabilities: data.availabilities,
            teams: data.teams,
            projects: data.projects,
            allocations: data.allocations,
            isLoading: false,
          });
        } else {
          // Kein User eingeloggt oder Supabase nicht konfiguriert
          set({ isLoading: false });
        }
      } catch (err: any) {
        console.error('loadFromSupabase error:', err);
        const message = err?.message || (typeof err === 'string' ? err : 'Datenbankfehler');
        set({ isLoading: false, dbError: message });
      }
    },

    loadUserProfile: async () => {
      const profile = await dbGetUserProfile();
      if (profile) {
        set({ userProfile: profile as UserProfile });
      }
    },

    setUserProfile: (profile) => set({ userProfile: profile }),

    loadSystemSettings: async () => {
      const { getSystemSettingsAction } = await import('@/lib/actions/settingsActions');
      const result = await getSystemSettingsAction();
      if (result.data) {
        set({
          systemSettings: {
            orgName: result.data.org_name,
            orgLogoUrl: result.data.org_logo_url,
            supportEmail: result.data.support_email,
            maintenanceMode: result.data.maintenance_mode
          }
        });
      }
    },

    updateSystemSettings: (data) => set((state) => ({
      systemSettings: state.systemSettings ? { ...state.systemSettings, ...data } : data
    })),

    /* ── Mitarbeiter ─────────────────────────── */
    addMember: (data) => {
      const member: Member = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ members: [...state.members, member] }));
      void dbAddMember(member);
      return member;
    },

    updateMember: (id, data) => {
      set((state) => ({
        members: state.members.map((m) => (m.id === id ? { ...m, ...data } : m)),
      }));
      const updated = get().members.find((m) => m.id === id);
      if (updated) void dbUpdateMember(updated);
    },

    deleteMember: (id) => {
      set((state) => ({
        members: state.members.filter((m) => m.id !== id),
        availabilities: state.availabilities.filter((a) => a.memberId !== id),
        teams: state.teams.map((t) => ({
          ...t,
          memberIds: t.memberIds.filter((mid) => mid !== id),
        })),
        projects: state.projects.map((p) => ({
          ...p,
          memberIds: p.memberIds.filter((mid) => mid !== id),
        })),
      }));
      void dbDeleteMember(id);
    },

    /* ── Verfügbarkeit ─────────────────────────── */
    addAvailability: (data) => {
      // Prüfen, ob für diesen Tag und diesen Member bereits ein Eintrag existiert (Ganztagesstatus)
      const existing = get().availabilities.find(
        (a) => a.memberId === data.memberId && a.date === data.date && !a.startTime && !a.endTime
      );

      if (existing) {
        get().updateAvailability(existing.id, { status: data.status });
        return { ...existing, status: data.status };
      }

      const entry: Availability = { ...data, id: crypto.randomUUID() };
      set((state) => ({ availabilities: [...state.availabilities, entry] }));
      void dbAddAvailability(entry);
      return entry;
    },

    updateAvailability: (id, data) => {
      set((state) => ({
        availabilities: state.availabilities.map((a) =>
          a.id === id ? { ...a, ...data } : a
        ),
      }));
      const updated = get().availabilities.find((a) => a.id === id);
      if (updated) void dbUpdateAvailability(updated);
    },

    deleteAvailability: (id) => {
      set((state) => ({
        availabilities: state.availabilities.filter((a) => a.id !== id),
      }));
      void dbDeleteAvailability(id);
    },

    getMemberStatus: (memberId, date) => {
      const today = date ?? new Date().toISOString().slice(0, 10);
      const entries = get().availabilities.filter(
        (a) => a.memberId === memberId && a.date === today
      );
      if (entries.length === 0) return 'offline';

      // Aktuellster Eintrag hat Priorität
      const now = new Date().toTimeString().slice(0, 5);
      const current = entries.find(
        (a) => (!a.startTime || a.startTime <= now) && (!a.endTime || a.endTime >= now)
      );
      return current?.status ?? entries[entries.length - 1].status;
    },

    /* ── Teams ───────────────────────────────── */
    addTeam: (data) => {
      const team: Team = { ...data, id: crypto.randomUUID() };
      set((state) => ({ teams: [...state.teams, team] }));
      void dbAddTeam(team);
      return team;
    },

    updateTeam: (id, data) => {
      set((state) => ({
        teams: state.teams.map((t) => (t.id === id ? { ...t, ...data } : t)),
      }));
      const updated = get().teams.find((t) => t.id === id);
      if (updated) void dbUpdateTeam(updated);
    },

    deleteTeam: (id) => {
      set((state) => ({ teams: state.teams.filter((t) => t.id !== id) }));
      void dbDeleteTeam(id);
    },

    /* ── Projekte ──────────────────────────── */
    addProject: (data) => {
      const project: Project = {
        ...data,
        id: crypto.randomUUID(),
        createdAt: new Date().toISOString(),
      };
      set((state) => ({ projects: [...state.projects, project] }));
      void dbAddProject(project);
      return project;
    },

    updateProject: (id, data) => {
      set((state) => ({
        projects: state.projects.map((p) => (p.id === id ? { ...p, ...data } : p)),
      }));
      const updated = get().projects.find((p) => p.id === id);
      if (updated) void dbUpdateProject(updated);
    },

    deleteProject: (id) => {
      set((state) => ({ projects: state.projects.filter((p) => p.id !== id) }));
      void dbDeleteProject(id);
    },

    getMemberProjects: (memberId) => {
      return get().projects.filter((p) => p.memberIds.includes(memberId) && p.status !== 'completed');
    },

    /* ── Allocations ─────────────────────────── */
    addAllocation: (data) => {
      const alloc: Allocation = { ...data, id: crypto.randomUUID() };
      set((state) => ({ allocations: [...state.allocations, alloc] }));
      void dbAddAllocation(alloc);
      return alloc;
    },

    updateAllocation: (id, data) => {
      set((state) => ({
        allocations: state.allocations.map((a) => (a.id === id ? { ...a, ...data } : a)),
      }));
      const updated = get().allocations.find((a) => a.id === id);
      if (updated) void dbUpdateAllocation(updated);
    },

    deleteAllocation: (id) => {
      set((state) => ({ allocations: state.allocations.filter((a) => a.id !== id) }));
      void dbDeleteAllocation(id);
    },

    getMemberUtilization: (memberId, date, projectType) => {
      const d = date ?? new Date().toISOString().slice(0, 10);
      let allocs = get().allocations.filter(
        (a) => a.memberId === memberId && a.startDate <= d && a.endDate >= d
      );
      if (projectType) {
        const projectIds = new Set(get().projects.filter((p) => p.type === projectType).map((p) => p.id));
        allocs = allocs.filter((a) => projectIds.has(a.projectId));
      }
      return allocs.reduce((sum, a) => sum + a.percentage, 0);
    },

    getMemberAllocations: (memberId, date, projectType) => {
      const d = date ?? new Date().toISOString().slice(0, 10);
      let allocs = get().allocations.filter(
        (a) => a.memberId === memberId && a.startDate <= d && a.endDate >= d
      );
      if (projectType) {
        const projectIds = new Set(get().projects.filter((p) => p.type === projectType).map((p) => p.id));
        allocs = allocs.filter((a) => projectIds.has(a.projectId));
      }
      return allocs;
    },

    getProjectAllocations: (projectId) => {
      return get().allocations.filter((a) => a.projectId === projectId);
    },

    /* ── Alerts ────────────────────────────────── */
    getAlerts: () => {
      const today = new Date().toISOString().slice(0, 10);
      const alerts: Alert[] = [];
      const { members, allocations, availabilities, projects } = get();

      members.forEach((member) => {
        // Überbuchung prüfen (>100%)
        const activeAllocs = allocations.filter(
          (a) => a.memberId === member.id && a.startDate <= today && a.endDate >= today
        );
        const totalUtil = activeAllocs.reduce((s, a) => s + a.percentage, 0);
        if (totalUtil > 100) {
          const projNames = activeAllocs
            .map((a) => projects.find((p) => p.id === a.projectId)?.name)
            .filter(Boolean);
          alerts.push({
            id: `overbooking-${member.id}`,
            type: 'overbooking',
            memberId: member.id,
            message: `${member.name} ist zu ${totalUtil}% ausgelastet (${projNames.join(', ')})`,
            projectIds: activeAllocs.map((a) => a.projectId),
            severity: 'error',
          });
        }

        // Urlaubs-Konflikt: Hat Allocation während Urlaub/Krank
        const absences = availabilities.filter(
          (av) => av.memberId === member.id && ['vacation', 'sick'].includes(av.status) && av.date >= today
        );
        absences.forEach((absence) => {
          const conflicting = allocations.filter(
            (a) => a.memberId === member.id && a.startDate <= absence.date && a.endDate >= absence.date && a.percentage > 0
          );
          if (conflicting.length > 0) {
            const projNames = conflicting
              .map((a) => projects.find((p) => p.id === a.projectId)?.name)
              .filter(Boolean);
            alerts.push({
              id: `vacation-${member.id}-${absence.date}`,
              type: 'vacation_conflict',
              memberId: member.id,
              message: `${member.name} ist am ${absence.date} als ${absence.status === 'vacation' ? 'Urlaub' : 'Krank'} gemeldet, aber Projekten zugewiesen (${projNames.join(', ')})`,
              projectIds: conflicting.map((a) => a.projectId),
              date: absence.date,
              severity: 'warning',
            });
          }
        });

        // Keine Zuweisung
        if (activeAllocs.length === 0 && !['vacation', 'sick', 'offline'].includes(get().getMemberStatus(member.id, today))) {
          alerts.push({
            id: `no-alloc-${member.id}`,
            type: 'no_allocation',
            memberId: member.id,
            message: `${member.name} hat keine aktive Projektzuweisung`,
            severity: 'warning',
          });
        }
      });

      return alerts;
    },

    /* ── Rollen ────────────────────────────────── */
    hasMinRole: (minRole) => {
      const profile = get().userProfile;
      if (!profile) return false;
      const hierarchy: Record<UserRole, number> = { admin: 4, cio: 3, department_lead: 2, employee: 1 };
      return hierarchy[profile.role] >= hierarchy[minRole];
    },
  })
);
