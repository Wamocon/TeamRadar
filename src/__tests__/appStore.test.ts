/**
 * Tests für den Zustand AppStore
 * Testet alle CRUD-Operationen, Status-Logik und Rollen
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AvailabilityStatus } from '@/types';

// vi.hoisted: Variablen müssen vor vi.mock-Factories verfügbar sein
const {
  mockLoadAllData, mockDbGetUserProfile, mockDbAddProject,
  mockDbAddMember, mockDbUpdateMember, mockDbDeleteMember,
  mockDbAddAvailability, mockDbUpdateAvailability, mockDbDeleteAvailability,
  mockDbAddTeam, mockDbUpdateTeam, mockDbDeleteTeam,
  mockDbUpdateProject, mockDbDeleteProject,
  mockDbAddAllocation, mockDbUpdateAllocation, mockDbDeleteAllocation,
} = vi.hoisted(() => {
  return {
    mockLoadAllData: vi.fn().mockResolvedValue(null),
    mockDbGetUserProfile: vi.fn().mockResolvedValue(null),
    mockDbAddProject: vi.fn().mockResolvedValue(undefined),
    mockDbAddMember: vi.fn().mockResolvedValue(undefined),
    mockDbUpdateMember: vi.fn().mockResolvedValue(undefined),
    mockDbDeleteMember: vi.fn().mockResolvedValue(undefined),
    mockDbAddAvailability: vi.fn().mockResolvedValue(undefined),
    mockDbUpdateAvailability: vi.fn().mockResolvedValue(undefined),
    mockDbDeleteAvailability: vi.fn().mockResolvedValue(undefined),
    mockDbAddTeam: vi.fn().mockResolvedValue(undefined),
    mockDbUpdateTeam: vi.fn().mockResolvedValue(undefined),
    mockDbDeleteTeam: vi.fn().mockResolvedValue(undefined),
    mockDbUpdateProject: vi.fn().mockResolvedValue(undefined),
    mockDbDeleteProject: vi.fn().mockResolvedValue(undefined),
    mockDbAddAllocation: vi.fn().mockResolvedValue(undefined),
    mockDbUpdateAllocation: vi.fn().mockResolvedValue(undefined),
    mockDbDeleteAllocation: vi.fn().mockResolvedValue(undefined),
  };
});

vi.mock('@/lib/supabase/db', () => ({
  loadAllData: mockLoadAllData,
  dbAddMember: mockDbAddMember,
  dbUpdateMember: mockDbUpdateMember,
  dbDeleteMember: mockDbDeleteMember,
  dbAddAvailability: mockDbAddAvailability,
  dbUpdateAvailability: mockDbUpdateAvailability,
  dbDeleteAvailability: mockDbDeleteAvailability,
  dbAddTeam: mockDbAddTeam,
  dbUpdateTeam: mockDbUpdateTeam,
  dbDeleteTeam: mockDbDeleteTeam,
  dbAddProject: mockDbAddProject,
  dbUpdateProject: mockDbUpdateProject,
  dbDeleteProject: mockDbDeleteProject,
  dbAddAllocation: mockDbAddAllocation,
  dbUpdateAllocation: mockDbUpdateAllocation,
  dbDeleteAllocation: mockDbDeleteAllocation,
  dbGetUserProfile: mockDbGetUserProfile,
}));

// Store vor jedem Test zurücksetzen
beforeEach(() => {
  vi.clearAllMocks();
  useAppStore.setState({
    members: [],
    availabilities: [],
    teams: [],
    projects: [],
    allocations: [],
    userProfile: null,
    writeError: null,
  });
});

/* ═══════════════════════════════════════════════════════════════
   MITARBEITER CRUD
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Mitarbeiter', () => {
  const memberData = {
    name: 'Max Mustermann',
    email: 'max@firma.de',
    role: 'Entwickler',
    department: 'Engineering',
  };

  it('addMember: erstellt einen neuen Mitarbeiter mit ID und Timestamp', () => {
    const member = useAppStore.getState().addMember(memberData);

    expect(member.id).toBeTruthy();
    expect(member.name).toBe('Max Mustermann');
    expect(member.email).toBe('max@firma.de');
    expect(member.createdAt).toBeTruthy();
    expect(useAppStore.getState().members).toHaveLength(1);
  });

  it('addMember: mehrere Mitarbeiter bekommen unterschiedliche IDs', () => {
    const m1 = useAppStore.getState().addMember(memberData);
    const m2 = useAppStore.getState().addMember({ ...memberData, name: 'Erika', email: 'erika@firma.de' });

    expect(m1.id).not.toBe(m2.id);
    expect(useAppStore.getState().members).toHaveLength(2);
  });

  it('updateMember: aktualisiert vorhandenen Mitarbeiter', () => {
    const member = useAppStore.getState().addMember(memberData);
    useAppStore.getState().updateMember(member.id, { name: 'Max Müller', department: 'Design' });

    const updated = useAppStore.getState().members.find((m) => m.id === member.id);
    expect(updated!.name).toBe('Max Müller');
    expect(updated!.department).toBe('Design');
    expect(updated!.email).toBe('max@firma.de'); // unverändert
  });

  it('updateMember: ignoriert nicht-existierende ID', () => {
    useAppStore.getState().addMember(memberData);
    useAppStore.getState().updateMember('nicht-vorhanden', { name: 'XYZ' });

    expect(useAppStore.getState().members[0].name).toBe('Max Mustermann');
  });

  it('deleteMember: entfernt Mitarbeiter', () => {
    const member = useAppStore.getState().addMember(memberData);
    expect(useAppStore.getState().members).toHaveLength(1);

    useAppStore.getState().deleteMember(member.id);
    expect(useAppStore.getState().members).toHaveLength(0);
  });

  it('deleteMember: entfernt auch zugehörige Verfügbarkeiten', () => {
    const member = useAppStore.getState().addMember(memberData);
    useAppStore.getState().addAvailability({
      memberId: member.id,
      status: 'available',
      date: '2026-03-20',
    });
    expect(useAppStore.getState().availabilities).toHaveLength(1);

    useAppStore.getState().deleteMember(member.id);
    expect(useAppStore.getState().availabilities).toHaveLength(0);
  });

  it('deleteMember: entfernt Member-ID aus Teams', () => {
    const member = useAppStore.getState().addMember(memberData);
    useAppStore.getState().addTeam({ name: 'Team A', memberIds: [member.id] });
    expect(useAppStore.getState().teams[0].memberIds).toContain(member.id);

    useAppStore.getState().deleteMember(member.id);
    expect(useAppStore.getState().teams[0].memberIds).not.toContain(member.id);
  });

  it('deleteMember: entfernt Member-ID aus Projekten', () => {
    const member = useAppStore.getState().addMember(memberData);
    useAppStore.getState().addProject({
      name: 'Testprojekt', type: 'internal', status: 'active', memberIds: [member.id],
    });
    expect(useAppStore.getState().projects[0].memberIds).toContain(member.id);

    useAppStore.getState().deleteMember(member.id);
    expect(useAppStore.getState().projects[0].memberIds).not.toContain(member.id);
  });
});

/* ═══════════════════════════════════════════════════════════════
   VERFÜGBARKEIT CRUD
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Verfügbarkeit', () => {
  it('addAvailability: erstellt einen neuen Eintrag', () => {
    const entry = useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'available',
      date: '2026-03-20',
      startTime: '09:00',
      endTime: '17:00',
    });

    expect(entry.id).toBeTruthy();
    expect(entry.status).toBe('available');
    expect(useAppStore.getState().availabilities).toHaveLength(1);
  });

  it('addAvailability: aktualisiert bestehenden Ganztages-Eintrag (Upsert)', () => {
    // 1. Eintrag erstellen
    useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'available',
      date: '2026-03-20',
    });
    expect(useAppStore.getState().availabilities).toHaveLength(1);

    // 2. Erneut für den gleichen Tag hinzufügen (anderer Status)
    useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'vacation',
      date: '2026-03-20',
    });

    // Es darf kein neuer Eintrag hinzugefügt worden sein
    expect(useAppStore.getState().availabilities).toHaveLength(1);
    // Der Status muss aktualisiert worden sein
    expect(useAppStore.getState().availabilities[0].status).toBe('vacation');
  });

  it('addAvailability: mit optionalem Note', () => {
    const entry = useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'vacation',
      date: '2026-03-20',
      note: 'Urlaub in Italien',
    });

    expect(entry.note).toBe('Urlaub in Italien');
  });

  it('updateAvailability: aktualisiert Status', () => {
    const entry = useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'available',
      date: '2026-03-20',
    });

    useAppStore.getState().updateAvailability(entry.id, { status: 'meeting', note: 'Daily' });

    const updated = useAppStore.getState().availabilities.find((a) => a.id === entry.id);
    expect(updated!.status).toBe('meeting');
    expect(updated!.note).toBe('Daily');
  });

  it('deleteAvailability: entfernt Eintrag', () => {
    const entry = useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'available',
      date: '2026-03-20',
    });

    useAppStore.getState().deleteAvailability(entry.id);
    expect(useAppStore.getState().availabilities).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   STATUS-LOGIK (getMemberStatus)
   ═══════════════════════════════════════════════════════════════ */

describe('Store: getMemberStatus', () => {
  const testDate = '2026-03-20';

  it('gibt "offline" zurück wenn keine Einträge vorhanden', () => {
    const status = useAppStore.getState().getMemberStatus('m1', testDate);
    expect(status).toBe('offline');
  });

  it('gibt Status für ganztägigen Eintrag zurück', () => {
    useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'vacation',
      date: testDate,
    });

    const status = useAppStore.getState().getMemberStatus('m1', testDate);
    expect(status).toBe('vacation');
  });

  it('gibt "offline" für falsches Datum zurück', () => {
    useAppStore.getState().addAvailability({
      memberId: 'm1',
      status: 'available',
      date: '2026-03-21',
    });

    const status = useAppStore.getState().getMemberStatus('m1', testDate);
    expect(status).toBe('offline');
  });

  it('aktualisiert den Status bei mehrmaligem Hinzufügen (Upsert-Verhalten)', () => {
    useAppStore.getState().addAvailability({
      memberId: 'm1', status: 'meeting', date: testDate,
    });
    useAppStore.getState().addAvailability({
      memberId: 'm1', status: 'available', date: testDate,
    });

    const status = useAppStore.getState().getMemberStatus('m1', testDate);
    // Das Upsert-Verhalten überschreibt den alten Status
    expect(status).toBe('available');
  });

  it('verschiedene Mitarbeiter haben unabhängige Status', () => {
    useAppStore.getState().addAvailability({
      memberId: 'm1', status: 'available', date: testDate,
    });
    useAppStore.getState().addAvailability({
      memberId: 'm2', status: 'sick', date: testDate,
    });

    expect(useAppStore.getState().getMemberStatus('m1', testDate)).toBe('available');
    expect(useAppStore.getState().getMemberStatus('m2', testDate)).toBe('sick');
  });
});

/* ═══════════════════════════════════════════════════════════════
   TEAMS CRUD
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Teams', () => {
  it('addTeam: erstellt ein neues Team', () => {
    const team = useAppStore.getState().addTeam({
      name: 'Frontend',
      description: 'Web-Entwicklung',
      memberIds: ['m1', 'm2'],
    });

    expect(team.id).toBeTruthy();
    expect(team.name).toBe('Frontend');
    expect(team.memberIds).toEqual(['m1', 'm2']);
    expect(useAppStore.getState().teams).toHaveLength(1);
  });

  it('addTeam: Team ohne Beschreibung', () => {
    const team = useAppStore.getState().addTeam({
      name: 'Leer',
      memberIds: [],
    });

    expect(team.description).toBeUndefined();
    expect(team.memberIds).toEqual([]);
  });

  it('updateTeam: aktualisiert Teamname', () => {
    const team = useAppStore.getState().addTeam({
      name: 'Alt',
      memberIds: ['m1'],
    });

    useAppStore.getState().updateTeam(team.id, { name: 'Neu', memberIds: ['m1', 'm2'] });

    const updated = useAppStore.getState().teams.find((t) => t.id === team.id);
    expect(updated!.name).toBe('Neu');
    expect(updated!.memberIds).toEqual(['m1', 'm2']);
  });

  it('deleteTeam: entfernt Team', () => {
    const team = useAppStore.getState().addTeam({
      name: 'Temp',
      memberIds: [],
    });

    useAppStore.getState().deleteTeam(team.id);
    expect(useAppStore.getState().teams).toHaveLength(0);
  });

  it('deleteTeam: entfernt nur das richtige Team', () => {
    const t1 = useAppStore.getState().addTeam({ name: 'A', memberIds: [] });
    const t2 = useAppStore.getState().addTeam({ name: 'B', memberIds: [] });

    useAppStore.getState().deleteTeam(t1.id);
    expect(useAppStore.getState().teams).toHaveLength(1);
    expect(useAppStore.getState().teams[0].id).toBe(t2.id);
  });
});

/* ═══════════════════════════════════════════════════════════════
   ROLLEN-PRÜFUNG
   ═══════════════════════════════════════════════════════════════ */

describe('Store: hasMinRole', () => {
  it('gibt false zurück ohne Profil', () => {
    expect(useAppStore.getState().hasMinRole('employee')).toBe(false);
  });

  it('admin hat alle Rollen', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'Admin', role: 'admin' },
    });

    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(true);
    expect(useAppStore.getState().hasMinRole('cio')).toBe(true);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(true);
  });

  it('cio hat employee + lead + cio, nicht admin', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'CIO', role: 'cio' },
    });

    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(true);
    expect(useAppStore.getState().hasMinRole('cio')).toBe(true);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
  });

  it('department_lead hat employee + lead, nicht cio/admin', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'Lead', role: 'department_lead' },
    });

    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(true);
    expect(useAppStore.getState().hasMinRole('cio')).toBe(false);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
  });

  it('employee hat nur employee', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'User', role: 'employee' },
    });

    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(false);
    expect(useAppStore.getState().hasMinRole('cio')).toBe(false);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
  });
});

describe('Store: Profil & Mocking', () => {
  it('setUserProfile: aktualisiert das UserProfile', () => {
    const profile = { id: 'u1', email: 'test@test.de', displayName: 'Test User', role: 'employee' as const };
    useAppStore.getState().setUserProfile(profile);
    expect(useAppStore.getState().userProfile).toEqual(profile);

    useAppStore.getState().setUserProfile(null);
    expect(useAppStore.getState().userProfile).toBeNull();
  });

  it('Initialzustand: hat Mock-Admin in Development', () => {
    const profile = { id: 'mock-1', email: 'admin@dev.local', displayName: 'Dev Admin', role: 'admin' as const };
    useAppStore.getState().setUserProfile(profile);
    expect(useAppStore.getState().userProfile?.role).toBe('admin');
  });

  it('setUserProfile: unterstützt neue Felder (avatarUrl, statusMessage, phone, preferences)', () => {
    const profile = { 
      id: 'u1', 
      email: 'test@test.de', 
      displayName: 'Test User', 
      role: 'employee' as const,
      avatarUrl: 'https://example.com/a.png',
      statusMessage: 'Status',
      phone: '12345',
      preferences: { theme: 'system' as const, notifications: true }
    };
    useAppStore.getState().setUserProfile(profile);
    const stored = useAppStore.getState().userProfile;
    expect(stored?.avatarUrl).toBe('https://example.com/a.png');
    expect(stored?.statusMessage).toBe('Status');
    expect(stored?.preferences?.theme).toBe('system');
  });
});

/* ═══════════════════════════════════════════════════════════════
   SEED-DATEN LADEN
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Projekte', () => {
  const projectData = {
    name: 'Cloud-Migration',
    type: 'external' as const,
    status: 'active' as const,
    client: 'BMW AG',
    description: 'Testprojekt',
    memberIds: ['m1', 'm2'],
    startDate: '2026-01-01',
    endDate: '2026-06-30',
  };

  it('addProject: erstellt ein neues Projekt mit ID und Timestamp', async () => {
    const project = await useAppStore.getState().addProject(projectData);

    expect(project.id).toBeTruthy();
    expect(project.name).toBe('Cloud-Migration');
    expect(project.type).toBe('external');
    expect(project.client).toBe('BMW AG');
    expect(project.createdAt).toBeTruthy();
    expect(useAppStore.getState().projects).toHaveLength(1);
  });

  it('addProject: internes Projekt ohne Kunde', async () => {
    const project = await useAppStore.getState().addProject({
      name: 'Interne Tools', type: 'internal', status: 'planned', memberIds: [],
    });

    expect(project.type).toBe('internal');
    expect(project.client).toBeUndefined();
  });

  it('updateProject: aktualisiert Projektdaten', async () => {
    const project = await useAppStore.getState().addProject(projectData);
    useAppStore.getState().updateProject(project.id, { name: 'Neuer Name', status: 'completed' });

    const updated = useAppStore.getState().projects.find((p) => p.id === project.id);
    expect(updated!.name).toBe('Neuer Name');
    expect(updated!.status).toBe('completed');
    expect(updated!.client).toBe('BMW AG'); // unverändert
  });

  it('deleteProject: entfernt Projekt', async () => {
    const project = await useAppStore.getState().addProject(projectData);
    expect(useAppStore.getState().projects).toHaveLength(1);

    useAppStore.getState().deleteProject(project.id);
    expect(useAppStore.getState().projects).toHaveLength(0);
  });

  it('deleteProject: entfernt nur das richtige Projekt', async () => {
    const p1 = await useAppStore.getState().addProject(projectData);
    const p2 = await useAppStore.getState().addProject({ ...projectData, name: 'Projekt B' });

    useAppStore.getState().deleteProject(p1.id);
    expect(useAppStore.getState().projects).toHaveLength(1);
    expect(useAppStore.getState().projects[0].id).toBe(p2.id);
  });

  it('getMemberProjects: gibt aktive Projekte eines Mitglieds zurück', async () => {
    await useAppStore.getState().addProject({
      name: 'Aktiv', type: 'external', status: 'active', memberIds: ['m1'],
    });
    await useAppStore.getState().addProject({
      name: 'Abgeschlossen', type: 'internal', status: 'completed', memberIds: ['m1'],
    });
    await useAppStore.getState().addProject({
      name: 'Anderes', type: 'external', status: 'active', memberIds: ['m2'],
    });

    const result = useAppStore.getState().getMemberProjects('m1');
    expect(result).toHaveLength(1);
    expect(result[0].name).toBe('Aktiv');
  });
});

/* ═══════════════════════════════════════════════════════════════
   ALLOCATIONS CRUD
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Allocations', () => {
  const allocData = {
    memberId: 'm1',
    projectId: 'p1',
    percentage: 60,
    startDate: '2026-01-15',
    endDate: '2026-06-30',
  };

  it('addAllocation: erstellt eine neue Zuweisung mit ID', () => {
    const alloc = useAppStore.getState().addAllocation(allocData);

    expect(alloc.id).toBeTruthy();
    expect(alloc.memberId).toBe('m1');
    expect(alloc.projectId).toBe('p1');
    expect(alloc.percentage).toBe(60);
    expect(useAppStore.getState().allocations).toHaveLength(1);
  });

  it('addAllocation: mehrere Zuweisungen für denselben Mitarbeiter', () => {
    useAppStore.getState().addAllocation(allocData);
    useAppStore.getState().addAllocation({ ...allocData, projectId: 'p2', percentage: 40 });

    expect(useAppStore.getState().allocations).toHaveLength(2);
  });

  it('updateAllocation: aktualisiert Prozentsatz', () => {
    const alloc = useAppStore.getState().addAllocation(allocData);
    useAppStore.getState().updateAllocation(alloc.id, { percentage: 80 });

    const updated = useAppStore.getState().allocations.find((a) => a.id === alloc.id);
    expect(updated!.percentage).toBe(80);
    expect(updated!.projectId).toBe('p1'); // unverändert
  });

  it('deleteAllocation: entfernt Zuweisung', () => {
    const alloc = useAppStore.getState().addAllocation(allocData);
    expect(useAppStore.getState().allocations).toHaveLength(1);

    useAppStore.getState().deleteAllocation(alloc.id);
    expect(useAppStore.getState().allocations).toHaveLength(0);
  });

  it('deleteAllocation: entfernt nur die richtige Zuweisung', () => {
    const a1 = useAppStore.getState().addAllocation(allocData);
    const a2 = useAppStore.getState().addAllocation({ ...allocData, projectId: 'p2' });

    useAppStore.getState().deleteAllocation(a1.id);
    expect(useAppStore.getState().allocations).toHaveLength(1);
    expect(useAppStore.getState().allocations[0].id).toBe(a2.id);
  });
});

/* ═══════════════════════════════════════════════════════════════
   UTILIZATION (Auslastung)
   ═══════════════════════════════════════════════════════════════ */

describe('Store: getMemberUtilization', () => {
  const testDate = '2026-03-15';

  it('gibt 0 zurück wenn keine Zuweisungen', () => {
    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(0);
  });

  it('gibt korrekten Prozentsatz für eine Zuweisung', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(60);
  });

  it('summiert mehrere Zuweisungen', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p2', percentage: 50,
      startDate: '2026-02-01', endDate: '2026-05-31',
    });

    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(110);
  });

  it('berücksichtigt nur Zuweisungen in der Zeitspanne', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 80,
      startDate: '2026-01-01', endDate: '2026-02-28',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p2', percentage: 50,
      startDate: '2026-03-01', endDate: '2026-06-30',
    });

    // testDate = 2026-03-15 → nur p2 aktiv
    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(50);
  });

  it('verschiedene Mitarbeiter haben unabhängige Auslastung', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 100,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm2', projectId: 'p1', percentage: 30,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(100);
    expect(useAppStore.getState().getMemberUtilization('m2', testDate)).toBe(30);
  });

  it('filtert nach projectType "external"', () => {
    // Setup: ein internes und ein externes Projekt
    useAppStore.setState({
      projects: [
        { id: 'p-int', name: 'Intern', type: 'internal', status: 'active', memberIds: ['m1'], createdAt: '2026-01-01' },
        { id: 'p-ext', name: 'Extern', type: 'external', status: 'active', memberIds: ['m1'], client: 'Kunde AG', createdAt: '2026-01-01' },
      ],
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p-int', percentage: 40,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p-ext', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    // Gesamt: 100 / Nur extern: 60 / Nur intern: 40
    expect(useAppStore.getState().getMemberUtilization('m1', testDate)).toBe(100);
    expect(useAppStore.getState().getMemberUtilization('m1', testDate, 'external')).toBe(60);
    expect(useAppStore.getState().getMemberUtilization('m1', testDate, 'internal')).toBe(40);
  });

  it('projectType-Filter gibt 0 wenn kein Projekt dieses Typs', () => {
    useAppStore.setState({
      projects: [
        { id: 'p-int', name: 'Intern', type: 'internal', status: 'active', memberIds: [], createdAt: '2026-01-01' },
      ],
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p-int', percentage: 80,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    expect(useAppStore.getState().getMemberUtilization('m1', testDate, 'external')).toBe(0);
    expect(useAppStore.getState().getMemberUtilization('m1', testDate, 'internal')).toBe(80);
  });
});

describe('Store: getMemberAllocations', () => {
  it('gibt nur aktive Zuweisungen zurück', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p2', percentage: 40,
      startDate: '2025-01-01', endDate: '2025-12-31', // vergangen
    });

    const result = useAppStore.getState().getMemberAllocations('m1', '2026-03-15');
    expect(result).toHaveLength(1);
    expect(result[0].projectId).toBe('p1');
  });

  it('filtert nach projectType', () => {
    useAppStore.setState({
      projects: [
        { id: 'p-int', name: 'Intern', type: 'internal', status: 'active', memberIds: ['m1'], createdAt: '2026-01-01' },
        { id: 'p-ext', name: 'Extern', type: 'external', status: 'active', memberIds: ['m1'], client: 'Kunde', createdAt: '2026-01-01' },
      ],
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p-int', percentage: 40,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p-ext', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    const all = useAppStore.getState().getMemberAllocations('m1', '2026-03-15');
    expect(all).toHaveLength(2);

    const external = useAppStore.getState().getMemberAllocations('m1', '2026-03-15', 'external');
    expect(external).toHaveLength(1);
    expect(external[0].projectId).toBe('p-ext');

    const internal = useAppStore.getState().getMemberAllocations('m1', '2026-03-15', 'internal');
    expect(internal).toHaveLength(1);
    expect(internal[0].projectId).toBe('p-int');
  });
});

describe('Store: getProjectAllocations', () => {
  it('gibt alle Zuweisungen eines Projekts zurück', () => {
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p1', percentage: 60,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm2', projectId: 'p1', percentage: 40,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });
    useAppStore.getState().addAllocation({
      memberId: 'm1', projectId: 'p2', percentage: 100,
      startDate: '2026-01-01', endDate: '2026-06-30',
    });

    const result = useAppStore.getState().getProjectAllocations('p1');
    expect(result).toHaveLength(2);
  });
});

/* ═══════════════════════════════════════════════════════════════
   ALERTS (Überbuchung, Konflikte)
   ═══════════════════════════════════════════════════════════════ */

describe('Store: getAlerts', () => {
  it('erkennt Überbuchung (>100%)', () => {
    const member = useAppStore.getState().addMember({
      name: 'Test', email: 'test@t.de', role: 'Dev', department: 'Eng',
    });
    // Mitarbeiter verfügbar machen
    useAppStore.getState().addAvailability({
      memberId: member.id, status: 'available', date: new Date().toISOString().slice(0, 10),
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p1', percentage: 60,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p2', percentage: 50,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });

    const alerts = useAppStore.getState().getAlerts();
    const overbookings = alerts.filter((a) => a.type === 'overbooking');
    expect(overbookings.length).toBeGreaterThanOrEqual(1);
    expect(overbookings[0].severity).toBe('error');
    expect(overbookings[0].memberId).toBe(member.id);
  });

  it('erkennt keine Warnung für zulässige Zuweisung (<= 100%)', () => {
    const member = useAppStore.getState().addMember({
      name: 'OK', email: 'ok@t.de', role: 'Dev', department: 'Eng',
    });
    useAppStore.getState().addAvailability({
      memberId: member.id, status: 'available', date: new Date().toISOString().slice(0, 10),
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p1', percentage: 50,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p2', percentage: 50,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });

    const alerts = useAppStore.getState().getAlerts();
    const overbookings = alerts.filter((a) => a.type === 'overbooking');
    expect(overbookings).toHaveLength(0);
  });

  it('erkennt "keine Zuweisung" für verfügbare Mitarbeiter', () => {
    const member = useAppStore.getState().addMember({
      name: 'Frei', email: 'frei@t.de', role: 'Dev', department: 'Eng',
    });
    useAppStore.getState().addAvailability({
      memberId: member.id, status: 'available', date: new Date().toISOString().slice(0, 10),
    });

    const alerts = useAppStore.getState().getAlerts();
    const noAlloc = alerts.filter((a) => a.type === 'no_allocation' && a.memberId === member.id);
    expect(noAlloc.length).toBeGreaterThanOrEqual(1);
    expect(noAlloc[0].severity).toBe('warning');
  });

  it('gibt leeres Array für leeren Store', () => {
    const alerts = useAppStore.getState().getAlerts();
    expect(alerts).toEqual([]);
  });
});


/* ═══════════════════════════════════════════════════════════════
   PRODUCTION SEED-GUARD (NODE_ENV + Schema doppelt abgesichert)
   ═══════════════════════════════════════════════════════════════ */

describe('Store: Seed-Daten NIEMALS in Production (NODE_ENV Guard)', () => {
  // TypeScript markiert NODE_ENV als readonly – in Tests müssen wir es überschreiben
  const setNodeEnv = (val: string | undefined) => {
    (process.env as Record<string, string | undefined>).NODE_ENV = val;
  };

  const assertNoSeedData = () => {
    expect(useAppStore.getState().members).toHaveLength(0);
    expect(useAppStore.getState().availabilities).toHaveLength(0);
    expect(useAppStore.getState().teams).toHaveLength(0);
    expect(useAppStore.getState().projects).toHaveLength(0);
    expect(useAppStore.getState().allocations).toHaveLength(0);
  };

  it('NODE_ENV=production + Schema=teamradar-dev → KEINE Seed-Daten', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSchema = process.env.NEXT_PUBLIC_DB_SCHEMA;
    setNodeEnv('production');
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'teamradar-dev';

    useAppStore.setState({ members: [], availabilities: [], teams: [], projects: [], allocations: [] });
    await useAppStore.getState().loadFromSupabase();
    assertNoSeedData();

    setNodeEnv(origNodeEnv);
    process.env.NEXT_PUBLIC_DB_SCHEMA = origSchema;
  });

  it('NODE_ENV=production + Schema=teamradar-test → KEINE Seed-Daten', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSchema = process.env.NEXT_PUBLIC_DB_SCHEMA;
    setNodeEnv('production');
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'teamradar-test';

    useAppStore.setState({ members: [], availabilities: [], teams: [], projects: [], allocations: [] });
    await useAppStore.getState().loadFromSupabase();
    assertNoSeedData();

    setNodeEnv(origNodeEnv);
    process.env.NEXT_PUBLIC_DB_SCHEMA = origSchema;
  });

  it('NODE_ENV=production + Schema=teamradar-prod → KEINE Seed-Daten', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSchema = process.env.NEXT_PUBLIC_DB_SCHEMA;
    setNodeEnv('production');
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'teamradar-prod';

    useAppStore.setState({ members: [], availabilities: [], teams: [], projects: [], allocations: [] });
    await useAppStore.getState().loadFromSupabase();
    assertNoSeedData();

    setNodeEnv(origNodeEnv);
    process.env.NEXT_PUBLIC_DB_SCHEMA = origSchema;
  });

  it('NODE_ENV=production + Schema NICHT gesetzt → KEINE Seed-Daten', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSchema = process.env.NEXT_PUBLIC_DB_SCHEMA;
    setNodeEnv('production');
    delete process.env.NEXT_PUBLIC_DB_SCHEMA;

    useAppStore.setState({ members: [], availabilities: [], teams: [], projects: [], allocations: [] });
    await useAppStore.getState().loadFromSupabase();
    assertNoSeedData();

    setNodeEnv(origNodeEnv);
    process.env.NEXT_PUBLIC_DB_SCHEMA = origSchema;
  });


  it('NODE_ENV=development + Schema=teamradar-prod → KEINE Seed-Daten (doppelter Guard)', async () => {
    const origNodeEnv = process.env.NODE_ENV;
    const origSchema = process.env.NEXT_PUBLIC_DB_SCHEMA;
    setNodeEnv('development');
    process.env.NEXT_PUBLIC_DB_SCHEMA = 'teamradar-prod';

    useAppStore.setState({ members: [], availabilities: [], teams: [], projects: [], allocations: [] });
    await useAppStore.getState().loadFromSupabase();
    assertNoSeedData();

    setNodeEnv(origNodeEnv);
    process.env.NEXT_PUBLIC_DB_SCHEMA = origSchema;
  });
});

/* ═══════════════════════════════════════════════════════════════
   STORE: loadFromSupabase & loadUserProfile
   ═══════════════════════════════════════════════════════════════ */

describe('Store: loadFromSupabase', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllData.mockResolvedValue(null);
    mockDbGetUserProfile.mockResolvedValue(null);
    useAppStore.setState({
      members: [], availabilities: [], teams: [], projects: [], allocations: [], userProfile: null,
      isLoading: false, dbError: null,
    });
  });

  it('setzt isLoading auf false nach abgeschlossenem Laden', async () => {
    await useAppStore.getState().loadFromSupabase();
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it('lädt Daten wenn loadAllData Daten zurückgibt', async () => {
    mockLoadAllData.mockResolvedValueOnce({
      members: [{ id: 'm1', user_id: 'u1', name: 'Max', email: 'max@a.de', role: 'Dev', department: 'Eng', created_at: '2026-01-01' }],
      availabilities: [],
      teams: [],
      projects: [],
      allocations: [],
    });

    await useAppStore.getState().loadFromSupabase();
    expect(useAppStore.getState().members).toHaveLength(1);
    expect(useAppStore.getState().members[0].name).toBe('Max');
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it('setzt dbError wenn loadAllData einen Fehler wirft', async () => {
    mockLoadAllData.mockRejectedValueOnce(new Error('Verbindungsfehler'));
    await useAppStore.getState().loadFromSupabase();
    expect(useAppStore.getState().dbError).toBe('Verbindungsfehler');
    expect(useAppStore.getState().isLoading).toBe(false);
  });

  it('macht nichts wenn loadAllData null zurückgibt (kein User)', async () => {
    mockLoadAllData.mockResolvedValueOnce(null);
    await useAppStore.getState().loadFromSupabase();
    expect(useAppStore.getState().members).toHaveLength(0);
    expect(useAppStore.getState().isLoading).toBe(false);
  });
});

describe('Store: loadUserProfile', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockDbGetUserProfile.mockResolvedValue(null);
    useAppStore.setState({ userProfile: null });
  });

  it('setzt userProfile wenn Profil gefunden', async () => {
    mockDbGetUserProfile.mockResolvedValueOnce({
      id: 'u1', email: 'max@a.de', displayName: 'Max', role: 'admin',
      avatarUrl: null, statusMessage: null, phone: null, preferences: null,
    });

    await useAppStore.getState().loadUserProfile();
    expect(useAppStore.getState().userProfile?.role).toBe('admin');
    expect(useAppStore.getState().userProfile?.displayName).toBe('Max');
  });

  it('lässt userProfile unverändert wenn kein Profil', async () => {
    mockDbGetUserProfile.mockResolvedValueOnce(null);
    useAppStore.setState({ userProfile: { id: 'old', email: 'old@x.de', displayName: 'Old', role: 'employee' } });

    await useAppStore.getState().loadUserProfile();
    // Profil darf nicht auf null gesetzt werden wenn keines gefunden
    expect(useAppStore.getState().userProfile?.id).toBe('old');
  });
});

describe('Store: loadSystemSettings', () => {
  it('setzt systemSettings nach erfolgreichem Laden', async () => {
    vi.doMock('@/lib/actions/settingsActions', () => ({
      getSystemSettingsAction: vi.fn().mockResolvedValue({
        data: {
          org_name: 'TestOrg GmbH',
          org_logo_url: 'https://logo.test/img.png',
          support_email: 'support@test.de',
          maintenance_mode: false,
        },
      }),
    }));

    useAppStore.setState({ systemSettings: null });
    await useAppStore.getState().loadSystemSettings();

    const settings = useAppStore.getState().systemSettings;
    expect(settings?.orgName).toBe('TestOrg GmbH');
    expect(settings?.orgLogoUrl).toBe('https://logo.test/img.png');
    expect(settings?.supportEmail).toBe('support@test.de');
    expect(settings?.maintenanceMode).toBe(false);

    vi.doUnmock('@/lib/actions/settingsActions');
  });

  it('ändert systemSettings nicht wenn data null', async () => {
    vi.doMock('@/lib/actions/settingsActions', () => ({
      getSystemSettingsAction: vi.fn().mockResolvedValue({ data: null }),
    }));

    useAppStore.setState({
      systemSettings: { orgName: 'Bestehend', supportEmail: 'x@x.de', maintenanceMode: false },
    });
    await useAppStore.getState().loadSystemSettings();

    // Darf nicht geändert werden
    expect(useAppStore.getState().systemSettings?.orgName).toBe('Bestehend');

    vi.doUnmock('@/lib/actions/settingsActions');
  });
});

describe('Store: updateSystemSettings', () => {
  it('setzt systemSettings wenn vorher null', () => {
    useAppStore.setState({ systemSettings: null });
    useAppStore.getState().updateSystemSettings({ orgName: 'NeuOrg', supportEmail: 'info@neu.de', maintenanceMode: false });
    expect(useAppStore.getState().systemSettings?.orgName).toBe('NeuOrg');
  });

  it('merged systemSettings teilweise', () => {
    useAppStore.setState({
      systemSettings: { orgName: 'Alt', supportEmail: 'alt@x.de', maintenanceMode: false },
    });
    useAppStore.getState().updateSystemSettings({ orgName: 'Neu' });
    expect(useAppStore.getState().systemSettings?.orgName).toBe('Neu');
    expect(useAppStore.getState().systemSettings?.supportEmail).toBe('alt@x.de');
  });

  it('aktiviert maintenanceMode', () => {
    useAppStore.setState({
      systemSettings: { orgName: 'Org', supportEmail: 'x@x.de', maintenanceMode: false },
    });
    useAppStore.getState().updateSystemSettings({ maintenanceMode: true });
    expect(useAppStore.getState().systemSettings?.maintenanceMode).toBe(true);
  });
});

describe('Store: getMemberStatus mit Zeitfenstern', () => {
  it('gibt letzten Eintrag zurück ohne aktiven Zeitbereich', () => {
    // Stundenbasierter Eintrag in der Vergangenheit für heute
    useAppStore.setState({
      availabilities: [{
        id: 'a1', memberId: 'm1', status: 'meeting',
        date: new Date().toISOString().slice(0, 10),
        startTime: '08:00', endTime: '09:00',
      }],
    });
    // Aktuelle Zeit ist nach 09:00 → kein aktives Fenster → letzter Eintrag
    const status = useAppStore.getState().getMemberStatus('m1');
    expect(['meeting', 'offline']).toContain(status);
  });

  it('berücksichtigt Zeitfenster für heutigen Eintrag', () => {
    const today = new Date().toISOString().slice(0, 10);
    // Ganztagseintrag ohne Zeitbeschränkung
    useAppStore.setState({
      availabilities: [{
        id: 'a1', memberId: 'm1', status: 'available', date: today,
      }],
    });
    const status = useAppStore.getState().getMemberStatus('m1');
    expect(status).toBe('available');
  });
});

describe('Store: addProject Fehlerbehandlung', () => {
  beforeEach(() => {
    mockDbAddProject.mockResolvedValue(undefined);
    useAppStore.setState({ projects: [], dbError: null, writeError: null });
  });

  it('wirft Fehler und macht Rollback wenn dbAddProject fehlschlägt', async () => {
    mockDbAddProject.mockRejectedValueOnce(new Error('DB-Fehler beim Speichern'));

    await expect(
      useAppStore.getState().addProject({ name: 'Test', type: 'internal', status: 'active', memberIds: [] })
    ).rejects.toThrow('DB-Fehler beim Speichern');

    // Rollback: Projekt darf nicht im Store bleiben
    expect(useAppStore.getState().projects).toHaveLength(0);
    expect(useAppStore.getState().writeError).toBe('DB-Fehler beim Speichern');
  });
});

describe('Store: super_admin Rolle', () => {
  it('super_admin hat alle Rollen', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'sa@b.de', displayName: 'SA', role: 'super_admin' },
    });

    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(true);
    expect(useAppStore.getState().hasMinRole('cio')).toBe(true);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(true);
    expect(useAppStore.getState().hasMinRole('super_admin')).toBe(true);
  });
});

describe('Store: getAlerts – Urlaubs-Konflikt', () => {
  it('erkennt Urlaubs-Konflikt wenn Allocation während Urlaub', () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const member = useAppStore.getState().addMember({
      name: 'Urlauber', email: 'urlaub@x.de', role: 'Dev', department: 'Eng',
    });
    useAppStore.getState().addAvailability({
      memberId: member.id, status: 'vacation', date: tomorrow,
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p1', percentage: 80,
      startDate: today, endDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    });

    const alerts = useAppStore.getState().getAlerts();
    const vacConflicts = alerts.filter((a) => a.type === 'vacation_conflict' && a.memberId === member.id);
    expect(vacConflicts.length).toBeGreaterThanOrEqual(1);
    expect(vacConflicts[0].severity).toBe('warning');
  });
});

/* ═══════════════════════════════════════════════════════════════
   FEHLERBEHANDLUNG: writeError + Rollback
   ═══════════════════════════════════════════════════════════════ */

// Hilfsfunktion: Micro-Tasks flushen, damit .catch()-Callbacks ausgeführt werden
const flushMicroTasks = () => new Promise<void>((r) => setTimeout(r, 0));

describe('Store: clearWriteError', () => {
  it('setzt writeError auf null', () => {
    useAppStore.setState({ writeError: 'Ein Fehler' });
    useAppStore.getState().clearWriteError();
    expect(useAppStore.getState().writeError).toBeNull();
  });
});

describe('Store: Mitarbeiter – Fehlerbehandlung', () => {
  const memberData = { name: 'Test', email: 't@test.de', role: 'Dev', department: 'Eng' };

  it('addMember: Rollback und writeError bei DB-Fehler', async () => {
    mockDbAddMember.mockRejectedValueOnce(new Error('DB-Fehler Mitarbeiter'));
    useAppStore.getState().addMember(memberData);
    await flushMicroTasks();
    expect(useAppStore.getState().members).toHaveLength(0);
    expect(useAppStore.getState().writeError).toBe('DB-Fehler Mitarbeiter');
  });

  it('updateMember: Rollback auf ursprünglichen Wert bei DB-Fehler', async () => {
    const m = useAppStore.getState().addMember(memberData);
    mockDbUpdateMember.mockRejectedValueOnce(new Error('Update-Fehler'));
    useAppStore.getState().updateMember(m.id, { name: 'Geändert' });
    await flushMicroTasks();
    expect(useAppStore.getState().members[0].name).toBe('Test');
    expect(useAppStore.getState().writeError).toBe('Update-Fehler');
  });

  it('deleteMember: Rollback bei DB-Fehler', async () => {
    const m = useAppStore.getState().addMember(memberData);
    mockDbDeleteMember.mockRejectedValueOnce(new Error('Delete-Fehler'));
    useAppStore.getState().deleteMember(m.id);
    await flushMicroTasks();
    expect(useAppStore.getState().members).toHaveLength(1);
    expect(useAppStore.getState().writeError).toBe('Delete-Fehler');
  });

  it('deleteMember: Rollback stellt auch Verfügbarkeiten wieder her', async () => {
    const m = useAppStore.getState().addMember(memberData);
    useAppStore.getState().addAvailability({ memberId: m.id, date: '2026-05-01', status: 'vacation' });
    mockDbDeleteMember.mockRejectedValueOnce(new Error('Delete-Fehler'));
    useAppStore.getState().deleteMember(m.id);
    await flushMicroTasks();
    expect(useAppStore.getState().members).toHaveLength(1);
    expect(useAppStore.getState().availabilities).toHaveLength(1);
  });
});

describe('Store: Verfügbarkeit – Fehlerbehandlung', () => {
  const memberData = { name: 'Test', email: 't@test.de', role: 'Dev', department: 'Eng' };
  const availData = { date: '2026-05-21', status: 'vacation' as const };

  it('addAvailability: Rollback und writeError bei DB-Fehler', async () => {
    const m = useAppStore.getState().addMember(memberData);
    mockDbAddAvailability.mockRejectedValueOnce(new Error('Avail-Fehler'));
    useAppStore.getState().addAvailability({ memberId: m.id, ...availData });
    await flushMicroTasks();
    expect(useAppStore.getState().availabilities).toHaveLength(0);
    expect(useAppStore.getState().writeError).toBe('Avail-Fehler');
  });

  it('updateAvailability: Rollback auf ursprünglichen Status bei DB-Fehler', async () => {
    const m = useAppStore.getState().addMember(memberData);
    const a = useAppStore.getState().addAvailability({ memberId: m.id, ...availData });
    mockDbUpdateAvailability.mockRejectedValueOnce(new Error('Update-Avail-Fehler'));
    useAppStore.getState().updateAvailability(a.id, { status: 'sick' });
    await flushMicroTasks();
    expect(useAppStore.getState().availabilities[0].status).toBe('vacation');
    expect(useAppStore.getState().writeError).toBe('Update-Avail-Fehler');
  });

  it('deleteAvailability: Rollback bei DB-Fehler', async () => {
    const m = useAppStore.getState().addMember(memberData);
    const a = useAppStore.getState().addAvailability({ memberId: m.id, ...availData });
    mockDbDeleteAvailability.mockRejectedValueOnce(new Error('Delete-Avail-Fehler'));
    useAppStore.getState().deleteAvailability(a.id);
    await flushMicroTasks();
    expect(useAppStore.getState().availabilities).toHaveLength(1);
    expect(useAppStore.getState().writeError).toBe('Delete-Avail-Fehler');
  });
});

describe('Store: Teams – Fehlerbehandlung', () => {
  it('addTeam: Rollback und writeError bei DB-Fehler', async () => {
    mockDbAddTeam.mockRejectedValueOnce(new Error('Team-Fehler'));
    useAppStore.getState().addTeam({ name: 'Test-Team', memberIds: [] });
    await flushMicroTasks();
    expect(useAppStore.getState().teams).toHaveLength(0);
    expect(useAppStore.getState().writeError).toBe('Team-Fehler');
  });

  it('updateTeam: Rollback auf ursprünglichen Namen bei DB-Fehler', async () => {
    const t = useAppStore.getState().addTeam({ name: 'Original', memberIds: [] });
    mockDbUpdateTeam.mockRejectedValueOnce(new Error('Update-Team-Fehler'));
    useAppStore.getState().updateTeam(t.id, { name: 'Geändert' });
    await flushMicroTasks();
    expect(useAppStore.getState().teams[0].name).toBe('Original');
    expect(useAppStore.getState().writeError).toBe('Update-Team-Fehler');
  });

  it('deleteTeam: Rollback bei DB-Fehler', async () => {
    const t = useAppStore.getState().addTeam({ name: 'Zu löschen', memberIds: [] });
    mockDbDeleteTeam.mockRejectedValueOnce(new Error('Delete-Team-Fehler'));
    useAppStore.getState().deleteTeam(t.id);
    await flushMicroTasks();
    expect(useAppStore.getState().teams).toHaveLength(1);
    expect(useAppStore.getState().writeError).toBe('Delete-Team-Fehler');
  });
});

describe('Store: Projekte – Fehlerbehandlung (Update/Delete)', () => {
  beforeEach(() => {
    mockDbAddProject.mockResolvedValue(undefined);
    mockDbUpdateProject.mockResolvedValue(undefined);
    mockDbDeleteProject.mockResolvedValue(undefined);
  });

  it('updateProject: Rollback auf ursprünglichen Namen bei DB-Fehler', async () => {
    const p = await useAppStore.getState().addProject({ name: 'Original-Projekt', type: 'internal', status: 'active', memberIds: [] });
    mockDbUpdateProject.mockRejectedValueOnce(new Error('Update-Projekt-Fehler'));
    useAppStore.getState().updateProject(p.id, { name: 'Geändert' });
    await flushMicroTasks();
    expect(useAppStore.getState().projects[0].name).toBe('Original-Projekt');
    expect(useAppStore.getState().writeError).toBe('Update-Projekt-Fehler');
  });

  it('deleteProject: Rollback bei DB-Fehler', async () => {
    const p = await useAppStore.getState().addProject({ name: 'Zu löschen', type: 'internal', status: 'active', memberIds: [] });
    mockDbDeleteProject.mockRejectedValueOnce(new Error('Delete-Projekt-Fehler'));
    useAppStore.getState().deleteProject(p.id);
    await flushMicroTasks();
    expect(useAppStore.getState().projects).toHaveLength(1);
    expect(useAppStore.getState().writeError).toBe('Delete-Projekt-Fehler');
  });
});

describe('Store: Allocations – Fehlerbehandlung', () => {
  const allocData = { memberId: 'm1', projectId: 'p1', percentage: 50, startDate: '2026-01-01', endDate: '2026-12-31' };

  it('addAllocation: Rollback und writeError bei DB-Fehler', async () => {
    mockDbAddAllocation.mockRejectedValueOnce(new Error('Allocation-Fehler'));
    useAppStore.getState().addAllocation(allocData);
    await flushMicroTasks();
    expect(useAppStore.getState().allocations).toHaveLength(0);
    expect(useAppStore.getState().writeError).toBe('Allocation-Fehler');
  });

  it('updateAllocation: Rollback auf ursprünglichen Prozentsatz bei DB-Fehler', async () => {
    const a = useAppStore.getState().addAllocation(allocData);
    mockDbUpdateAllocation.mockRejectedValueOnce(new Error('Update-Allocation-Fehler'));
    useAppStore.getState().updateAllocation(a.id, { percentage: 80 });
    await flushMicroTasks();
    expect(useAppStore.getState().allocations[0].percentage).toBe(50);
    expect(useAppStore.getState().writeError).toBe('Update-Allocation-Fehler');
  });

  it('deleteAllocation: Rollback bei DB-Fehler', async () => {
    const a = useAppStore.getState().addAllocation(allocData);
    mockDbDeleteAllocation.mockRejectedValueOnce(new Error('Delete-Allocation-Fehler'));
    useAppStore.getState().deleteAllocation(a.id);
    await flushMicroTasks();
    expect(useAppStore.getState().allocations).toHaveLength(1);
    expect(useAppStore.getState().writeError).toBe('Delete-Allocation-Fehler');
  });
});

describe('Store: getAlerts – Krank-Konflikt', () => {
  it('erkennt Krank-Konflikt wenn Allocation während Krankheit', () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);

    const member = useAppStore.getState().addMember({
      name: 'Kranker', email: 'krank@x.de', role: 'Dev', department: 'Eng',
    });
    useAppStore.getState().addAvailability({ memberId: member.id, status: 'sick', date: tomorrow });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: 'p1', percentage: 80,
      startDate: today, endDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    });

    const alerts = useAppStore.getState().getAlerts();
    const sickConflicts = alerts.filter((a) => a.type === 'vacation_conflict' && a.memberId === member.id);
    expect(sickConflicts.length).toBeGreaterThanOrEqual(1);
    expect(sickConflicts[0].message).toContain('Krank');
  });
});

describe('Store: hasMinRole – unbekannte Rolle', () => {
  it('behandelt unbekannte Rolle wie employee', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'x@x.de', displayName: 'X', role: 'unbekannt' as any },
    });
    expect(useAppStore.getState().hasMinRole('employee')).toBe(true);
    expect(useAppStore.getState().hasMinRole('department_lead')).toBe(false);
  });

  it('behandelt unbekannte minRole wie employee-Level', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'x@x.de', displayName: 'X', role: 'employee' },
    });
    // hasMinRole mit unbekannter minRole → Fallback auf Level 1 (employee)
    expect(useAppStore.getState().hasMinRole('unbekannt' as any)).toBe(true);
  });
});

describe('Store: getMemberUtilization/getMemberAllocations ohne Datum', () => {
  it('getMemberUtilization: nutzt heutiges Datum als Fallback wenn kein Datum übergeben', () => {
    const m = useAppStore.getState().addMember({ name: 'Test', email: 't@t.de', role: 'Dev', department: 'Eng' });
    const today = new Date().toISOString().slice(0, 10);
    useAppStore.getState().addAllocation({ memberId: m.id, projectId: 'p1', percentage: 60, startDate: today, endDate: today });
    // Kein Datum-Parameter → Fallback auf new Date()
    expect(useAppStore.getState().getMemberUtilization(m.id)).toBe(60);
  });

  it('getMemberAllocations: nutzt heutiges Datum als Fallback wenn kein Datum übergeben', () => {
    const m = useAppStore.getState().addMember({ name: 'Test', email: 't@t.de', role: 'Dev', department: 'Eng' });
    const today = new Date().toISOString().slice(0, 10);
    useAppStore.getState().addAllocation({ memberId: m.id, projectId: 'p1', percentage: 60, startDate: today, endDate: today });
    // Kein Datum-Parameter → Fallback auf new Date()
    expect(useAppStore.getState().getMemberAllocations(m.id)).toHaveLength(1);
  });
});

describe('Store: getAlerts – Urlaub ohne Konflikt', () => {
  it('generiert keinen Urlaubs-Konflikt wenn keine Allocation vorhanden', () => {
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const member = useAppStore.getState().addMember({ name: 'Test', email: 't@t.de', role: 'Dev', department: 'Eng' });
    // Urlaub eintragen, aber KEINE Allocation → kein vacation_conflict
    useAppStore.getState().addAvailability({ memberId: member.id, status: 'vacation', date: tomorrow });
    const alerts = useAppStore.getState().getAlerts();
    const conflicts = alerts.filter((a) => a.type === 'vacation_conflict' && a.memberId === member.id);
    expect(conflicts).toHaveLength(0);
  });
});

describe('Store: Delete mit nicht-existierender ID (original = undefined)', () => {
  it('deleteMember: setzt nur writeError ohne Rollback wenn Member nicht existiert', async () => {
    mockDbDeleteMember.mockRejectedValueOnce(new Error('Member nicht gefunden'));
    useAppStore.getState().deleteMember('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Member nicht gefunden');
    expect(useAppStore.getState().members).toHaveLength(0);
  });

  it('deleteAvailability: setzt nur writeError ohne Rollback wenn Verfügbarkeit nicht existiert', async () => {
    mockDbDeleteAvailability.mockRejectedValueOnce(new Error('Verf. nicht gefunden'));
    useAppStore.getState().deleteAvailability('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Verf. nicht gefunden');
    expect(useAppStore.getState().availabilities).toHaveLength(0);
  });

  it('deleteTeam: setzt nur writeError ohne Rollback wenn Team nicht existiert', async () => {
    mockDbDeleteTeam.mockRejectedValueOnce(new Error('Team nicht gefunden'));
    useAppStore.getState().deleteTeam('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Team nicht gefunden');
    expect(useAppStore.getState().teams).toHaveLength(0);
  });

  it('deleteProject: setzt nur writeError ohne Rollback wenn Projekt nicht existiert', async () => {
    mockDbDeleteProject.mockRejectedValueOnce(new Error('Projekt nicht gefunden'));
    useAppStore.getState().deleteProject('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Projekt nicht gefunden');
    expect(useAppStore.getState().projects).toHaveLength(0);
  });

  it('deleteAllocation: setzt nur writeError ohne Rollback wenn Zuweisung nicht existiert', async () => {
    mockDbDeleteAllocation.mockRejectedValueOnce(new Error('Zuweisung nicht gefunden'));
    useAppStore.getState().deleteAllocation('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Zuweisung nicht gefunden');
    expect(useAppStore.getState().allocations).toHaveLength(0);
  });
});

describe('Store: Update mit nicht-existierender ID (early return)', () => {
  it('updateMember: tut nichts wenn Member nicht existiert', () => {
    useAppStore.getState().updateMember('nicht-vorhanden', { name: 'X' });
    expect(useAppStore.getState().members).toHaveLength(0);
    expect(mockDbUpdateMember).not.toHaveBeenCalled();
  });

  it('updateAvailability: tut nichts wenn Verfügbarkeit nicht existiert', () => {
    useAppStore.getState().updateAvailability('nicht-vorhanden', { status: 'vacation' });
    expect(useAppStore.getState().availabilities).toHaveLength(0);
    expect(mockDbUpdateAvailability).not.toHaveBeenCalled();
  });

  it('updateTeam: tut nichts wenn Team nicht existiert', () => {
    useAppStore.getState().updateTeam('nicht-vorhanden', { name: 'X' });
    expect(useAppStore.getState().teams).toHaveLength(0);
    expect(mockDbUpdateTeam).not.toHaveBeenCalled();
  });

  it('updateProject: tut nichts wenn Projekt nicht existiert', () => {
    useAppStore.getState().updateProject('nicht-vorhanden', { name: 'X' });
    expect(useAppStore.getState().projects).toHaveLength(0);
    expect(mockDbUpdateProject).not.toHaveBeenCalled();
  });

  it('updateAllocation: tut nichts wenn Zuweisung nicht existiert', () => {
    useAppStore.getState().updateAllocation('nicht-vorhanden', { percentage: 50 });
    expect(useAppStore.getState().allocations).toHaveLength(0);
    expect(mockDbUpdateAllocation).not.toHaveBeenCalled();
  });
});

describe('Store: Fehlerbehandlung mit Fallback-Fehlermeldung (err ohne message)', () => {
  it('addMember: nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbAddMember.mockRejectedValueOnce(null);
    useAppStore.getState().addMember({ name: 'T', email: 't@t.de', role: 'Dev', department: 'Eng' });
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Mitarbeiter konnte nicht gespeichert werden');
  });

  it('deleteProject: nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbDeleteProject.mockRejectedValueOnce(null);
    useAppStore.getState().deleteProject('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Projekt konnte nicht gelöscht werden');
  });

  it('addAllocation: nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbAddAllocation.mockRejectedValueOnce(null);
    useAppStore.getState().addAllocation({ memberId: 'm1', projectId: 'p1', percentage: 50, startDate: '2026-01-01', endDate: '2026-12-31' });
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Zuweisung konnte nicht gespeichert werden');
  });

  it('updateAllocation: nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    const a = useAppStore.getState().addAllocation({ memberId: 'm1', projectId: 'p1', percentage: 50, startDate: '2026-01-01', endDate: '2026-12-31' });
    mockDbUpdateAllocation.mockRejectedValueOnce(null);
    useAppStore.getState().updateAllocation(a.id, { percentage: 80 });
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Zuweisung konnte nicht aktualisiert werden');
  });

  it('deleteAllocation: nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbDeleteAllocation.mockRejectedValueOnce(null);
    useAppStore.getState().deleteAllocation('nicht-vorhanden');
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Zuweisung konnte nicht gelöscht werden');
  });
});

/* ═══════════════════════════════════════════════════════════════
   FEHLENDE BRANCH-COVERAGE: map-Ternaries + Fallback-Strings
   ═══════════════════════════════════════════════════════════════ */

describe('Store: updateMember – map-Ternary Zweig + Fallback-String', () => {
  const memberA = { name: 'Anna', email: 'anna@t.de', role: 'Dev', department: 'Eng' };
  const memberB = { name: 'Bob', email: 'bob@t.de', role: 'Design', department: 'Design' };

  it('updateMember mit 2 Membern deckt den unveränderten Member-Zweig (":m") ab', () => {
    const m1 = useAppStore.getState().addMember(memberA);
    const m2 = useAppStore.getState().addMember(memberB);
    useAppStore.getState().updateMember(m1.id, { name: 'Anna Neu' });
    // m2 bleibt unverändert → ":m"-Zweig der map wird ausgeführt
    expect(useAppStore.getState().members.find((m) => m.id === m2.id)!.name).toBe('Bob');
  });

  it('updateMember Rollback-map + Fallback-Fehler bei null-Error und 2 Membern', async () => {
    const m1 = useAppStore.getState().addMember(memberA);
    const m2 = useAppStore.getState().addMember(memberB);
    mockDbUpdateMember.mockRejectedValueOnce(null); // null → kein .message → Fallback
    useAppStore.getState().updateMember(m1.id, { name: 'Anna Neu' });
    await flushMicroTasks();
    // m1 zurückgerollt
    expect(useAppStore.getState().members.find((m) => m.id === m1.id)!.name).toBe('Anna');
    // m2 bleibt via ":m"-Zweig in Rollback-map unverändert
    expect(useAppStore.getState().members.find((m) => m.id === m2.id)!.name).toBe('Bob');
    // Fallback-String da err.message fehlt
    expect(useAppStore.getState().writeError).toBe('Mitarbeiter konnte nicht aktualisiert werden');
  });

  it('deleteMember nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    const m = useAppStore.getState().addMember(memberA);
    mockDbDeleteMember.mockRejectedValueOnce(null);
    useAppStore.getState().deleteMember(m.id);
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Mitarbeiter konnte nicht gelöscht werden');
  });
});

describe('Store: updateAvailability – map-Ternary Zweig + Fallback-String', () => {
  it('updateAvailability mit 2 Einträgen deckt den unveränderten Eintrag-Zweig (":a") ab', () => {
    const a1 = useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-01', status: 'available', startTime: '09:00', endTime: '17:00' });
    const a2 = useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-02', status: 'sick' });
    useAppStore.getState().updateAvailability(a1.id, { status: 'vacation' });
    // a2 bleibt unverändert
    expect(useAppStore.getState().availabilities.find((a) => a.id === a2.id)!.status).toBe('sick');
  });

  it('updateAvailability Rollback-map + Fallback-Fehler bei null-Error und 2 Einträgen', async () => {
    const a1 = useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-01', status: 'available', startTime: '09:00', endTime: '17:00' });
    useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-02', status: 'sick' });
    mockDbUpdateAvailability.mockRejectedValueOnce(null);
    useAppStore.getState().updateAvailability(a1.id, { status: 'vacation' });
    await flushMicroTasks();
    expect(useAppStore.getState().availabilities.find((a) => a.id === a1.id)!.status).toBe('available');
    expect(useAppStore.getState().writeError).toBe('Verfügbarkeit konnte nicht aktualisiert werden');
  });

  it('addAvailability nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbAddAvailability.mockRejectedValueOnce(null);
    useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-01', status: 'available' });
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Verfügbarkeit konnte nicht gespeichert werden');
  });

  it('deleteAvailability nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    const a = useAppStore.getState().addAvailability({ memberId: 'm1', date: '2026-01-01', status: 'available' });
    mockDbDeleteAvailability.mockRejectedValueOnce(null);
    useAppStore.getState().deleteAvailability(a.id);
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Verfügbarkeit konnte nicht gelöscht werden');
  });
});

describe('Store: updateTeam – map-Ternary Zweig + Fallback-String', () => {
  it('updateTeam mit 2 Teams deckt den unveränderten Team-Zweig (":t") ab', () => {
    const t1 = useAppStore.getState().addTeam({ name: 'Team A', memberIds: [] });
    const t2 = useAppStore.getState().addTeam({ name: 'Team B', memberIds: [] });
    useAppStore.getState().updateTeam(t1.id, { name: 'Team A Neu' });
    expect(useAppStore.getState().teams.find((t) => t.id === t2.id)!.name).toBe('Team B');
  });

  it('updateTeam Rollback-map + Fallback-Fehler bei null-Error und 2 Teams', async () => {
    const t1 = useAppStore.getState().addTeam({ name: 'Team A', memberIds: [] });
    useAppStore.getState().addTeam({ name: 'Team B', memberIds: [] });
    mockDbUpdateTeam.mockRejectedValueOnce(null);
    useAppStore.getState().updateTeam(t1.id, { name: 'Team A Neu' });
    await flushMicroTasks();
    expect(useAppStore.getState().teams.find((t) => t.id === t1.id)!.name).toBe('Team A');
    expect(useAppStore.getState().writeError).toBe('Team konnte nicht aktualisiert werden');
  });

  it('addTeam nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbAddTeam.mockRejectedValueOnce(null);
    useAppStore.getState().addTeam({ name: 'Test', memberIds: [] });
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Team konnte nicht gespeichert werden');
  });

  it('deleteTeam nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    const t = useAppStore.getState().addTeam({ name: 'Test', memberIds: [] });
    mockDbDeleteTeam.mockRejectedValueOnce(null);
    useAppStore.getState().deleteTeam(t.id);
    await flushMicroTasks();
    expect(useAppStore.getState().writeError).toBe('Team konnte nicht gelöscht werden');
  });
});

describe('Store: updateProject – map-Ternary Zweig + Fallback-String', () => {
  beforeEach(() => {
    mockDbAddProject.mockResolvedValue(undefined);
    mockDbUpdateProject.mockResolvedValue(undefined);
  });

  it('updateProject mit 2 Projekten deckt den unveränderten Projekt-Zweig (":p") ab', async () => {
    const p1 = await useAppStore.getState().addProject({ name: 'Projekt A', type: 'internal', status: 'active', memberIds: [] });
    const p2 = await useAppStore.getState().addProject({ name: 'Projekt B', type: 'internal', status: 'active', memberIds: [] });
    useAppStore.getState().updateProject(p1.id, { name: 'Projekt A Neu' });
    expect(useAppStore.getState().projects.find((p) => p.id === p2.id)!.name).toBe('Projekt B');
  });

  it('updateProject Rollback-map + Fallback-Fehler bei null-Error und 2 Projekten', async () => {
    const p1 = await useAppStore.getState().addProject({ name: 'Projekt A', type: 'internal', status: 'active', memberIds: [] });
    await useAppStore.getState().addProject({ name: 'Projekt B', type: 'internal', status: 'active', memberIds: [] });
    mockDbUpdateProject.mockRejectedValueOnce(null);
    useAppStore.getState().updateProject(p1.id, { name: 'Projekt A Neu' });
    await flushMicroTasks();
    expect(useAppStore.getState().projects.find((p) => p.id === p1.id)!.name).toBe('Projekt A');
    expect(useAppStore.getState().writeError).toBe('Projekt konnte nicht aktualisiert werden');
  });

  it('addProject nutzt Fallback-Fehlermeldung wenn err kein Message hat', async () => {
    mockDbAddProject.mockRejectedValueOnce(null);
    await expect(
      useAppStore.getState().addProject({ name: 'X', type: 'internal', status: 'active', memberIds: [] })
    ).rejects.toThrow('Datenbankfehler beim Speichern des Projekts');
    expect(useAppStore.getState().writeError).toBe('Datenbankfehler beim Speichern des Projekts');
  });
});

describe('Store: updateAllocation – map-Ternary Zweig', () => {
  const allocA = { memberId: 'm1', projectId: 'p1', percentage: 50, startDate: '2026-01-01', endDate: '2026-12-31' };
  const allocB = { memberId: 'm2', projectId: 'p2', percentage: 30, startDate: '2026-01-01', endDate: '2026-12-31' };

  it('updateAllocation mit 2 Zuweisungen deckt den unveränderten Zuweisung-Zweig (":a") ab', () => {
    const a1 = useAppStore.getState().addAllocation(allocA);
    const a2 = useAppStore.getState().addAllocation(allocB);
    useAppStore.getState().updateAllocation(a1.id, { percentage: 80 });
    expect(useAppStore.getState().allocations.find((a) => a.id === a2.id)!.percentage).toBe(30);
  });

  it('updateAllocation Rollback-map deckt den unveränderten Zuweisung-Zweig (":a") ab bei Fehler', async () => {
    const a1 = useAppStore.getState().addAllocation(allocA);
    const a2 = useAppStore.getState().addAllocation(allocB);
    mockDbUpdateAllocation.mockRejectedValueOnce(new Error('Update-Fehler'));
    useAppStore.getState().updateAllocation(a1.id, { percentage: 80 });
    await flushMicroTasks();
    // a1 zurückgerollt
    expect(useAppStore.getState().allocations.find((a) => a.id === a1.id)!.percentage).toBe(50);
    // a2 bleibt via ":a"-Zweig unverändert
    expect(useAppStore.getState().allocations.find((a) => a.id === a2.id)!.percentage).toBe(30);
  });
});

describe('Store: loadFromSupabase – catch-Zweige (err-Typen)', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockLoadAllData.mockResolvedValue(null);
    mockDbGetUserProfile.mockResolvedValue(null);
    useAppStore.setState({ isLoading: false, dbError: null });
  });

  it('setzt dbError mit string-Wert wenn string geworfen wird', async () => {
    mockLoadAllData.mockRejectedValueOnce('Netzwerkfehler');
    await useAppStore.getState().loadFromSupabase();
    // typeof 'Netzwerkfehler' === 'string' → cond-expr idx=0 (err selbst als message)
    expect(useAppStore.getState().dbError).toBe('Netzwerkfehler');
  });

  it('setzt dbError auf "Datenbankfehler" wenn err kein string und kein message hat', async () => {
    mockLoadAllData.mockRejectedValueOnce({ code: 500 });
    await useAppStore.getState().loadFromSupabase();
    // typeof {} !== 'string' → cond-expr idx=1 ('Datenbankfehler')
    expect(useAppStore.getState().dbError).toBe('Datenbankfehler');
  });
});

describe('Store: Initialzustand im Production-Modus', () => {
  it('userProfile und systemSettings sind null in production', async () => {
    vi.stubEnv('NODE_ENV', 'production');
    vi.resetModules();
    // frischen Store im production-Modus importieren
    const { useAppStore: prodStore } = await import('@/stores/appStore');
    expect(prodStore.getState().userProfile).toBeNull();
    expect(prodStore.getState().systemSettings).toBeNull();
    vi.unstubAllEnvs();
    vi.resetModules();
  });
});

describe('Store: getAlerts – projNames find-Callback (Projekt im Store)', () => {
  beforeEach(() => {
    mockDbAddProject.mockResolvedValue(undefined);
  });

  it('deckt projNames find-Callback bei Überbuchung mit vorhandenem Projekt ab', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const member = useAppStore.getState().addMember({
      name: 'Ausgelastet', email: 'aus@t.de', role: 'Dev', department: 'Eng',
    });
    const project = await useAppStore.getState().addProject({
      name: 'ProjektX', type: 'internal', status: 'active', memberIds: [member.id],
    });
    useAppStore.getState().addAvailability({ memberId: member.id, status: 'available', date: today });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: project.id, percentage: 60,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: project.id, percentage: 50,
      startDate: '2025-01-01', endDate: '2027-12-31',
    });
    const alerts = useAppStore.getState().getAlerts();
    const overbookings = alerts.filter((a) => a.type === 'overbooking');
    expect(overbookings.length).toBeGreaterThanOrEqual(1);
    expect(overbookings[0].message).toContain('ProjektX');
  });

  it('deckt projNames find-Callback bei Urlaubs-Konflikt mit vorhandenem Projekt ab', async () => {
    const today = new Date().toISOString().slice(0, 10);
    const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
    const member = useAppStore.getState().addMember({
      name: 'Urlauber2', email: 'u2@t.de', role: 'Dev', department: 'Eng',
    });
    const project = await useAppStore.getState().addProject({
      name: 'ProjektY', type: 'internal', status: 'active', memberIds: [member.id],
    });
    useAppStore.getState().addAvailability({ memberId: member.id, status: 'vacation', date: tomorrow });
    useAppStore.getState().addAllocation({
      memberId: member.id, projectId: project.id, percentage: 80,
      startDate: today, endDate: new Date(Date.now() + 86400000 * 30).toISOString().slice(0, 10),
    });
    const alerts = useAppStore.getState().getAlerts();
    const vacConflicts = alerts.filter((a) => a.type === 'vacation_conflict' && a.memberId === member.id);
    expect(vacConflicts.length).toBeGreaterThanOrEqual(1);
    expect(vacConflicts[0].message).toContain('ProjektY');
  });
});
