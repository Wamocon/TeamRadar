/**
 * Tests für die Supabase DB-Schicht
 * Prüft: Mapping-Funktionen, Guard-Checks, API-Aufrufe
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted stellt sicher, dass diese Variablen auch in vi.mock-Factories verfügbar sind
const { mockInsert, mockUpdate, mockDelete, mockFrom, mockGetUser, mockUpsert, mockLoadAllDataAction, mockAddAvailabilityAction } = vi.hoisted(() => {
  const mockInsert = vi.fn().mockReturnValue({ error: null });
  const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
  const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
  const mockOrder = vi.fn().mockReturnValue({ data: [], error: null });
  const mockSelect = vi.fn().mockReturnValue({
    order: mockOrder,
    eq: vi.fn().mockReturnValue({ order: mockOrder }),
  });
  const mockUpsert = vi.fn().mockReturnValue({ error: null });
  const mockFrom = vi.fn().mockReturnValue({
    insert: mockInsert,
    update: mockUpdate,
    delete: mockDelete,
    select: mockSelect,
    upsert: mockUpsert,
  });
  const mockGetUser = vi.fn().mockResolvedValue({
    data: { user: { id: 'user-123' } },
  });
  const mockLoadAllDataAction = vi.fn().mockResolvedValue(null);
  const mockAddAvailabilityAction = vi.fn().mockResolvedValue(undefined);
  return { mockInsert, mockUpdate, mockDelete, mockFrom, mockGetUser, mockUpsert, mockLoadAllDataAction, mockAddAvailabilityAction };
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/supabase/server', () => ({
  createClient: vi.fn().mockResolvedValue({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

vi.mock('@/lib/actions/dataActions', () => ({
  loadAllDataAction: mockLoadAllDataAction,
  addAvailabilityAction: mockAddAvailabilityAction,
}));

// Import NACH dem Mock
import {
  getUserId,
  dbGetUserProfile,
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
} from '@/lib/supabase/db';

import type { Member, Availability, Team, Project, Allocation } from '@/types';

describe('DB: Guard-Checks (ohne Supabase)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    vi.clearAllMocks();
  });

  it('getUserId gibt null ohne Supabase-Config', async () => {
    const id = await getUserId();
    expect(id).toBeNull();
  });

  it('loadAllData gibt null ohne Supabase-Config', async () => {
    const data = await loadAllData();
    expect(data).toBeNull();
  });

  it('dbAddMember tut nichts ohne Supabase-Config', async () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbAddMember(member);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbAddAvailability tut nichts ohne Supabase-Config', async () => {
    const entry: Availability = {
      id: '1', memberId: 'm1', status: 'available', date: '2025-01-01',
    };
    await dbAddAvailability(entry);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbAddTeam tut nichts ohne Supabase-Config', async () => {
    const team: Team = { id: '1', name: 'Test', memberIds: [] };
    await dbAddTeam(team);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbAddProject tut nichts ohne Supabase-Config', async () => {
    const project: Project = {
      id: '1', name: 'Test', type: 'internal', status: 'active',
      memberIds: [], createdAt: '2026-01-01',
    };
    await dbAddProject(project);
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('DB: Funktionen mit Supabase konfiguriert', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    vi.clearAllMocks();
    // Defaults nach clearAllMocks wiederherstellen
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockInsert.mockReturnValue({ error: null });
    mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
    mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
    mockUpsert.mockReturnValue({ error: null });
    mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete, select: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ data: [], error: null }), eq: vi.fn().mockReturnValue({ order: vi.fn().mockReturnValue({ data: [], error: null }) }) }), upsert: mockUpsert });
    mockLoadAllDataAction.mockResolvedValue({
      memberRows: [], availabilityRows: [], teamRows: [], projectRows: [], allocationRows: [],
    });
    mockAddAvailabilityAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('getUserId gibt User-ID zurück', async () => {
    const id = await getUserId();
    expect(id).toBe('user-123');
  });

  it('dbAddMember ruft from("members").insert auf', async () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbAddMember(member);

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockInsert).toHaveBeenCalled();
    const row = mockInsert.mock.calls[0][0];
    expect(row.id).toBe('1');
    expect(row.user_id).toBe('user-123');
    expect(row.name).toBe('Test');
    expect(row.email).toBe('a@b.de');
  });

  it('dbUpdateMember ruft from("members").update auf', async () => {
    const member: Member = {
      id: '1', name: 'Updated', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbUpdateMember(member);

    expect(mockFrom).toHaveBeenCalledWith('members');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('dbGetUserProfile mapping: snake_case -> camelCase inkl. neuer Felder', async () => {
    const mockProfile = { 
      id: 'user-123', 
      email: 'test@test.de', 
      display_name: 'Max Mustermann', 
      role: 'admin',
      avatar_url: 'https://example.com/avatar.png',
      status_message: 'Im Homeoffice',
      phone: '+49 123 456',
      preferences: { theme: 'dark', notifications: true }
    };
    // Mock select().eq().maybeSingle()
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: mockProfile, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelectInternal = vi.fn().mockReturnValue({ eq: mockEq });
    
    mockFrom.mockReturnValueOnce({ select: mockSelectInternal });

    const result = await dbGetUserProfile();

    expect(mockFrom).toHaveBeenCalledWith('profiles');
    expect(result).toEqual({
      id: 'user-123',
      email: 'test@test.de',
      displayName: 'Max Mustermann',
      role: 'admin',
      avatarUrl: 'https://example.com/avatar.png',
      statusMessage: 'Im Homeoffice',
      phone: '+49 123 456',
      preferences: { theme: 'dark', notifications: true }
    });
  });

  it('dbDeleteMember ruft delete für availabilities und members auf', async () => {
    await dbDeleteMember('m1');
    // Sollte zweimal from() aufrufen: einmal für availabilities, einmal für members
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockFrom).toHaveBeenCalledWith('members');
  });

  it('dbAddAvailability ruft addAvailabilityAction auf', async () => {
    const entry: Availability = {
      id: 'a1', memberId: 'm1', status: 'available', date: '2026-03-20',
      startTime: '09:00', endTime: '17:00',
    };
    await dbAddAvailability(entry);

    expect(mockAddAvailabilityAction).toHaveBeenCalledWith(entry);
  });

  it('dbAddTeam ruft from("teams").insert auf', async () => {
    const team: Team = { id: 't1', name: 'Frontend', memberIds: ['m1', 'm2'] };
    await dbAddTeam(team);

    expect(mockFrom).toHaveBeenCalledWith('teams');
    expect(mockInsert).toHaveBeenCalled();
    const row = mockInsert.mock.calls[0][0];
    expect(row.name).toBe('Frontend');
    expect(row.member_ids).toEqual(['m1', 'm2']);
  });

  it('dbDeleteAvailability ruft from("availabilities").delete auf', async () => {
    await dbDeleteAvailability('a1');
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('dbUpdateTeam ruft from("teams").update auf', async () => {
    const team: Team = { id: 't1', name: 'Updated', memberIds: ['m3'] };
    await dbUpdateTeam(team);
    expect(mockFrom).toHaveBeenCalledWith('teams');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('dbDeleteTeam ruft from("teams").delete auf', async () => {
    await dbDeleteTeam('t1');
    expect(mockFrom).toHaveBeenCalledWith('teams');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('dbUpdateAvailability ruft from("availabilities").update auf', async () => {
    const entry: Availability = {
      id: 'a1', memberId: 'm1', status: 'meeting', date: '2026-03-20',
      startTime: '10:00', endTime: '11:00', note: 'Daily',
    };
    await dbUpdateAvailability(entry);
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('dbAddProject ruft from("projects").insert auf', async () => {
    const project: Project = {
      id: 'p1', name: 'Cloud-Migration', type: 'external', status: 'active',
      client: 'BMW AG', memberIds: ['m1'], startDate: '2026-01-01',
      endDate: '2026-06-30', createdAt: '2026-01-01',
    };
    await dbAddProject(project);

    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockInsert).toHaveBeenCalled();
    const row = mockInsert.mock.calls[0][0];
    expect(row.name).toBe('Cloud-Migration');
    expect(row.type).toBe('external');
    expect(row.client).toBe('BMW AG');
    expect(row.member_ids).toEqual(['m1']);
  });

  it('dbUpdateProject ruft from("projects").update auf', async () => {
    const project: Project = {
      id: 'p1', name: 'Updated', type: 'internal', status: 'completed',
      memberIds: ['m2'], createdAt: '2026-01-01',
    };
    await dbUpdateProject(project);
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('dbDeleteProject ruft from("projects").delete auf', async () => {
    await dbDeleteProject('p1');
    expect(mockFrom).toHaveBeenCalledWith('projects');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('loadAllData gibt Daten zurück wenn Supabase konfiguriert', async () => {
    const data = await loadAllData();
    expect(data).not.toBeNull();
    expect(data).toHaveProperty('members');
    expect(data).toHaveProperty('availabilities');
    expect(data).toHaveProperty('teams');
    expect(data).toHaveProperty('projects');
    expect(Array.isArray(data!.members)).toBe(true);
  });

  it('loadAllData gibt null wenn kein User eingeloggt', async () => {
    mockLoadAllDataAction.mockResolvedValueOnce(null);
    const data = await loadAllData();
    expect(data).toBeNull();
  });

  it('loadAllData mappt alle Felder korrekt (inkl. optionale Felder)', async () => {
    mockLoadAllDataAction.mockResolvedValueOnce({
      memberRows: [{
        id: 'm1', user_id: 'u1', name: 'Max', email: 'max@a.de',
        role: 'Dev', department: 'Eng',
        avatar_url: 'https://a.com/img.png', phone: '+49 123', created_at: '2026-01-01',
      }],
      availabilityRows: [{
        id: 'av1', member_id: 'm1', status: 'available', date: '2026-03-20',
        start_time: '09:00', end_time: '17:00', note: 'Homeoffice',
      }],
      teamRows: [{
        id: 't1', name: 'Frontend', description: 'Web-Team', member_ids: ['m1'],
      }],
      projectRows: [{
        id: 'p1', name: 'Cloud', type: 'external', status: 'active',
        client: 'BMW', description: 'Projekt A', member_ids: ['m1'],
        start_date: '2026-01-01', end_date: '2026-12-31',
        max_days: 220, created_at: '2026-01-01',
      }],
      allocationRows: [{
        id: 'al1', member_id: 'm1', project_id: 'p1',
        percentage: 80, start_date: '2026-01-01', end_date: '2026-12-31', user_id: 'u1',
      }],
    });

    const data = await loadAllData();
    expect(data).not.toBeNull();

    // Member-Mapping
    const member = data!.members[0];
    expect(member.id).toBe('m1');
    expect(member.userId).toBe('u1');
    expect(member.avatarUrl).toBe('https://a.com/img.png');
    expect(member.phone).toBe('+49 123');

    // Availability-Mapping
    const av = data!.availabilities[0];
    expect(av.memberId).toBe('m1');
    expect(av.startTime).toBe('09:00');
    expect(av.endTime).toBe('17:00');
    expect(av.note).toBe('Homeoffice');

    // Team-Mapping
    const team = data!.teams[0];
    expect(team.description).toBe('Web-Team');
    expect(team.memberIds).toEqual(['m1']);

    // Project-Mapping
    const project = data!.projects[0];
    expect(project.client).toBe('BMW');
    expect(project.description).toBe('Projekt A');
    expect(project.startDate).toBe('2026-01-01');
    expect(project.maxDays).toBe(220);

    // Allocation-Mapping
    const alloc = data!.allocations[0];
    expect(alloc.memberId).toBe('m1');
    expect(alloc.projectId).toBe('p1');
    expect(alloc.percentage).toBe(80);
  });

  it('loadAllData: leere member_ids werden als [] gemappt', async () => {
    mockLoadAllDataAction.mockResolvedValueOnce({
      memberRows: [],
      availabilityRows: [],
      teamRows: [{ id: 't1', name: 'Leer', description: null, member_ids: null }],
      projectRows: [{ id: 'p1', name: 'X', type: 'internal', status: 'active', client: null, description: null, member_ids: null, start_date: null, end_date: null, max_days: null, created_at: '2026-01-01' }],
      allocationRows: [],
    });
    const data = await loadAllData();
    expect(data!.teams[0].memberIds).toEqual([]);
    expect(data!.projects[0].memberIds).toEqual([]);
  });
});

describe('DB: Guard-Checks weitere Funktionen (ohne Supabase)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    vi.clearAllMocks();
  });

  it('dbUpdateMember tut nichts ohne Supabase-Config', async () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbUpdateMember(member);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbDeleteMember tut nichts ohne Supabase-Config', async () => {
    await dbDeleteMember('m1');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbUpdateAvailability tut nichts ohne Supabase-Config', async () => {
    const entry: Availability = {
      id: '1', memberId: 'm1', status: 'available', date: '2025-01-01',
    };
    await dbUpdateAvailability(entry);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbDeleteAvailability tut nichts ohne Supabase-Config', async () => {
    await dbDeleteAvailability('a1');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbUpdateTeam tut nichts ohne Supabase-Config', async () => {
    const team: Team = { id: '1', name: 'Test', memberIds: [] };
    await dbUpdateTeam(team);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbDeleteTeam tut nichts ohne Supabase-Config', async () => {
    await dbDeleteTeam('t1');
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbUpdateProject tut nichts ohne Supabase-Config', async () => {
    const project: Project = {
      id: '1', name: 'Test', type: 'internal', status: 'active',
      memberIds: [], createdAt: '2026-01-01',
    };
    await dbUpdateProject(project);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbDeleteProject tut nichts ohne Supabase-Config', async () => {
    await dbDeleteProject('p1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});

describe('DB: Allocation-Funktionen mit Supabase konfiguriert', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockInsert.mockReturnValue({ error: null });
    mockUpdate.mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
    mockDelete.mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
    mockFrom.mockReturnValue({ insert: mockInsert, update: mockUpdate, delete: mockDelete, select: vi.fn(), upsert: mockUpsert });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('dbAddAllocation ruft from("allocations").insert auf', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbAddAllocation(alloc);
    expect(mockFrom).toHaveBeenCalledWith('allocations');
    expect(mockInsert).toHaveBeenCalled();
    const row = mockInsert.mock.calls[0][0];
    expect(row.member_id).toBe('m1');
    expect(row.project_id).toBe('p1');
    expect(row.percentage).toBe(60);
  });

  it('dbUpdateAllocation ruft from("allocations").update auf', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 80, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbUpdateAllocation(alloc);
    expect(mockFrom).toHaveBeenCalledWith('allocations');
    expect(mockUpdate).toHaveBeenCalled();
  });

  it('dbDeleteAllocation ruft from("allocations").delete auf', async () => {
    await dbDeleteAllocation('al1');
    expect(mockFrom).toHaveBeenCalledWith('allocations');
    expect(mockDelete).toHaveBeenCalled();
  });

  it('dbDeleteMember löscht auch allocations', async () => {
    await dbDeleteMember('m1');
    const calls = mockFrom.mock.calls.map((c: unknown[]) => c[0]);
    expect(calls).toContain('availabilities');
    expect(calls).toContain('allocations');
    expect(calls).toContain('members');
  });

  it('dbGetUserProfile gibt null zurück wenn kein User eingeloggt', async () => {
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });

  it('dbGetUserProfile gibt null zurück bei DB-Fehler', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: { message: 'DB error' } });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelectInternal = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelectInternal });

    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });

  it('dbGetUserProfile gibt null zurück wenn Profil nicht vorhanden', async () => {
    const mockMaybeSingle = vi.fn().mockResolvedValue({ data: null, error: null });
    const mockEq = vi.fn().mockReturnValue({ maybeSingle: mockMaybeSingle });
    const mockSelectInternal = vi.fn().mockReturnValue({ eq: mockEq });
    mockFrom.mockReturnValueOnce({ select: mockSelectInternal });

    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });

  it('rowToAllocation: Felder werden korrekt gemappt (via dbAddAllocation)', async () => {
    const alloc: Allocation = {
      id: 'al2', memberId: 'm2', projectId: 'p2',
      percentage: 100, startDate: '2026-03-01', endDate: '2026-12-31',
    };
    await dbAddAllocation(alloc);
    const row = mockInsert.mock.calls[0][0];
    expect(row.id).toBe('al2');
    expect(row.user_id).toBe('user-123');
    expect(row.start_date).toBe('2026-03-01');
    expect(row.end_date).toBe('2026-12-31');
  });
});

describe('DB: Guard-Checks Allocation (ohne Supabase)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
    vi.clearAllMocks();
  });

  it('dbAddAllocation tut nichts ohne Supabase-Config', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbAddAllocation(alloc);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbUpdateAllocation tut nichts ohne Supabase-Config', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbUpdateAllocation(alloc);
    expect(mockFrom).not.toHaveBeenCalled();
  });

  it('dbDeleteAllocation tut nichts ohne Supabase-Config', async () => {
    await dbDeleteAllocation('al1');
    expect(mockFrom).not.toHaveBeenCalled();
  });
});
