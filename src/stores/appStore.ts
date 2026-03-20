import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Member, Availability, Team, AvailabilityStatus, UserProfile, UserRole } from '@/types';
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
} from '@/lib/supabase/db';
import { SEED_MEMBERS, SEED_AVAILABILITIES, SEED_TEAMS } from '@/lib/seed-data';

interface AppStore {
  /* ── Daten ─────────────────────────────────── */
  members: Member[];
  availabilities: Availability[];
  teams: Team[];
  userProfile: UserProfile | null;

  /* ── Laden ─────────────────────────────────── */
  loadFromSupabase: () => Promise<void>;
  loadUserProfile: () => Promise<void>;

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

  /* ── Rollen ────────────────────────────────── */
  hasMinRole: (role: UserRole) => boolean;
}

export const useAppStore = create<AppStore>()(
  persist(
    (set, get) => ({
      members: [],
      availabilities: [],
      teams: [],
      userProfile: null,

      /* ── Supabase laden ──────────────────────── */
      loadFromSupabase: async () => {
        try {
          const data = await loadAllData();
          if (data) {
            set({
              members: data.members,
              availabilities: data.availabilities,
              teams: data.teams,
            });
          }
        } catch {
          // Supabase nicht verfügbar – App startet mit lokalem Store
        }

        // Demo-Daten laden wenn Store leer ist
        if (get().members.length === 0) {
          set({
            members: SEED_MEMBERS,
            availabilities: SEED_AVAILABILITIES,
            teams: SEED_TEAMS,
          });
        }
      },

      loadUserProfile: async () => {
        // Wird in der Supabase-Integration implementiert
      },

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
        }));
        void dbDeleteMember(id);
      },

      /* ── Verfügbarkeit ─────────────────────────── */
      addAvailability: (data) => {
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

      /* ── Rollen ────────────────────────────────── */
      hasMinRole: (minRole) => {
        const profile = get().userProfile;
        if (!profile) return false;
        const hierarchy: Record<UserRole, number> = { admin: 3, manager: 2, member: 1 };
        return hierarchy[profile.role] >= hierarchy[minRole];
      },
    }),
    {
      name: `team-radar-store-${typeof process !== 'undefined' ? process.env?.NEXT_PUBLIC_DB_SCHEMA ?? 'public' : 'public'}`,
      partialize: (state) => ({
        members: state.members,
        availabilities: state.availabilities,
        teams: state.teams,
      }),
    }
  )
);
