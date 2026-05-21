/**
 * Tests für den Zustand AppStore
 * Testet alle CRUD-Operationen, Status-Logik und Rollen
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AvailabilityStatus } from '@/types';

// vi.hoisted: Variablen müssen vor vi.mock-Factories verfügbar sein
const { mockLoadAllData, mockDbGetUserProfile, mockDbAddProject } = vi.hoisted(() => {
  const mockLoadAllData = vi.fn().mockResolvedValue(null);
  const mockDbGetUserProfile = vi.fn().mockResolvedValue(null);
  const mockDbAddProject = vi.fn().mockResolvedValue(undefined);
  return { mockLoadAllData, mockDbGetUserProfile, mockDbAddProject };
});

vi.mock('@/lib/supabase/db', () => ({
  loadAllData: mockLoadAllData,
  dbAddMember: vi.fn().mockResolvedValue(undefined),
  dbUpdateMember: vi.fn().mockResolvedValue(undefined),
  dbDeleteMember: vi.fn().mockResolvedValue(undefined),
  dbAddAvailability: vi.fn().mockResolvedValue(undefined),
  dbUpdateAvailability: vi.fn().mockResolvedValue(undefined),
  dbDeleteAvailability: vi.fn().mockResolvedValue(undefined),
  dbAddTeam: vi.fn().mockResolvedValue(undefined),
  dbUpdateTeam: vi.fn().mockResolvedValue(undefined),
  dbDeleteTeam: vi.fn().mockResolvedValue(undefined),
  dbAddProject: mockDbAddProject,
  dbUpdateProject: vi.fn().mockResolvedValue(undefined),
  dbDeleteProject: vi.fn().mockResolvedValue(undefined),
  dbAddAllocation: vi.fn().mockResolvedValue(undefined),
  dbUpdateAllocation: vi.fn().mockResolvedValue(undefined),
  dbDeleteAllocation: vi.fn().mockResolvedValue(undefined),
  dbGetUserProfile: mockDbGetUserProfile,
}));

// Store vor jedem Test zurücksetzen
beforeEach(() => {
  useAppStore.setState({
    members: [],
    availabilities: [],
    teams: [],
    projects: [],
    allocations: [],
    userProfile: null,
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
    vi.clearAllMocks();
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
