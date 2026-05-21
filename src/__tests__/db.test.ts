/**
 * Tests für die Supabase DB-Schicht
 * Prüft: Mapping-Funktionen, Guard-Checks, API-Aufrufe
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// vi.hoisted stellt sicher, dass diese Variablen auch in vi.mock-Factories verfügbar sind
const { mockInsert, mockUpdate, mockDelete, mockFrom, mockGetUser, mockUpsert, mockLoadAllDataAction,
  mockUpsertMemberAction, mockDeleteMemberAction,
  mockUpsertAvailabilityAction, mockDeleteAvailabilityAction,
  mockUpsertTeamAction, mockDeleteTeamAction,
  mockUpsertProjectAction, mockDeleteProjectAction,
  mockUpsertAllocationAction, mockDeleteAllocationAction,
} = vi.hoisted(() => {
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
  const mockUpsertMemberAction     = vi.fn().mockResolvedValue(undefined);
  const mockDeleteMemberAction     = vi.fn().mockResolvedValue(undefined);
  const mockUpsertAvailabilityAction = vi.fn().mockResolvedValue(undefined);
  const mockDeleteAvailabilityAction = vi.fn().mockResolvedValue(undefined);
  const mockUpsertTeamAction       = vi.fn().mockResolvedValue(undefined);
  const mockDeleteTeamAction       = vi.fn().mockResolvedValue(undefined);
  const mockUpsertProjectAction    = vi.fn().mockResolvedValue(undefined);
  const mockDeleteProjectAction    = vi.fn().mockResolvedValue(undefined);
  const mockUpsertAllocationAction = vi.fn().mockResolvedValue(undefined);
  const mockDeleteAllocationAction = vi.fn().mockResolvedValue(undefined);
  return { mockInsert, mockUpdate, mockDelete, mockFrom, mockGetUser, mockUpsert, mockLoadAllDataAction,
    mockUpsertMemberAction, mockDeleteMemberAction,
    mockUpsertAvailabilityAction, mockDeleteAvailabilityAction,
    mockUpsertTeamAction, mockDeleteTeamAction,
    mockUpsertProjectAction, mockDeleteProjectAction,
    mockUpsertAllocationAction, mockDeleteAllocationAction,
  };
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
}));

vi.mock('@/lib/actions/writeActions', () => ({
  upsertMemberAction:       mockUpsertMemberAction,
  deleteMemberAction:       mockDeleteMemberAction,
  upsertAvailabilityAction: mockUpsertAvailabilityAction,
  deleteAvailabilityAction: mockDeleteAvailabilityAction,
  upsertTeamAction:         mockUpsertTeamAction,
  deleteTeamAction:         mockDeleteTeamAction,
  upsertProjectAction:      mockUpsertProjectAction,
  deleteProjectAction:      mockDeleteProjectAction,
  upsertAllocationAction:   mockUpsertAllocationAction,
  deleteAllocationAction:   mockDeleteAllocationAction,
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

  it('dbGetUserProfile gibt null ohne Supabase-Config', async () => {
    const result = await dbGetUserProfile();
    expect(result).toBeNull();
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
      memberRows: [], availabilityRows: [], teamRows: [], projectRows: [], allocationRows: [], organizationRows: [],
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('getUserId gibt User-ID zurück', async () => {
    const id = await getUserId();
    expect(id).toBe('user-123');
  });

  it('dbAddMember ruft upsertMemberAction auf', async () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbAddMember(member);

    expect(mockUpsertMemberAction).toHaveBeenCalledOnce();
    const row = mockUpsertMemberAction.mock.calls[0][0];
    expect(row.id).toBe('1');
    expect(row.user_id).toBe('user-123');
    expect(row.name).toBe('Test');
    expect(row.email).toBe('a@b.de');
  });

  it('dbUpdateMember ruft upsertMemberAction auf', async () => {
    const member: Member = {
      id: '1', name: 'Updated', email: 'a@b.de', role: 'Dev',
      department: 'Eng', createdAt: '2025-01-01',
    };
    await dbUpdateMember(member);

    expect(mockUpsertMemberAction).toHaveBeenCalledOnce();
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

  it('dbDeleteMember ruft deleteMemberAction auf', async () => {
    await dbDeleteMember('m1');
    expect(mockDeleteMemberAction).toHaveBeenCalledWith('m1');
  });

  it('dbAddAvailability ruft from().upsert() auf (Browser-Client)', async () => {
    const entry: Availability = {
      id: 'a1', memberId: 'm1', status: 'available', date: '2026-03-20',
      startTime: '09:00', endTime: '17:00',
    };
    await dbAddAvailability(entry);
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockUpsert).toHaveBeenCalledOnce();
    const row = mockUpsert.mock.calls[0][0];
    expect(row.id).toBe('a1');
    expect(row.member_id).toBe('m1');
    expect(row.status).toBe('available');
  });

  it('dbAddTeam ruft upsertTeamAction auf', async () => {
    const team: Team = { id: 't1', name: 'Frontend', memberIds: ['m1', 'm2'] };
    await dbAddTeam(team);
    expect(mockUpsertTeamAction).toHaveBeenCalledOnce();
    const row = mockUpsertTeamAction.mock.calls[0][0];
    expect(row.name).toBe('Frontend');
    expect(row.member_ids).toEqual(['m1', 'm2']);
  });

  it('dbDeleteAvailability ruft from().delete() auf (Browser-Client)', async () => {
    await dbDeleteAvailability('a1');
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockDelete).toHaveBeenCalledOnce();
  });

  it('dbUpdateTeam ruft upsertTeamAction auf', async () => {
    const team: Team = { id: 't1', name: 'Updated', memberIds: ['m3'] };
    await dbUpdateTeam(team);
    expect(mockUpsertTeamAction).toHaveBeenCalledOnce();
  });

  it('dbDeleteTeam ruft deleteTeamAction auf', async () => {
    await dbDeleteTeam('t1');
    expect(mockDeleteTeamAction).toHaveBeenCalledWith('t1');
  });

  it('dbUpdateAvailability ruft from().upsert() auf (Browser-Client)', async () => {
    const entry: Availability = {
      id: 'a1', memberId: 'm1', status: 'meeting', date: '2026-03-20',
      startTime: '10:00', endTime: '11:00', note: 'Daily',
    };
    await dbUpdateAvailability(entry);
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockUpsert).toHaveBeenCalledOnce();
  });

  it('dbAddProject ruft upsertProjectAction auf', async () => {
    const project: Project = {
      id: 'p1', name: 'Cloud-Migration', type: 'external', status: 'active',
      client: 'BMW AG', memberIds: ['m1'], startDate: '2026-01-01',
      endDate: '2026-06-30', createdAt: '2026-01-01',
    };
    await dbAddProject(project);
    expect(mockUpsertProjectAction).toHaveBeenCalledOnce();
    const row = mockUpsertProjectAction.mock.calls[0][0];
    expect(row.name).toBe('Cloud-Migration');
    expect(row.type).toBe('external');
    expect(row.client).toBe('BMW AG');
    expect(row.member_ids).toEqual(['m1']);
  });

  it('dbUpdateProject ruft upsertProjectAction auf', async () => {
    const project: Project = {
      id: 'p1', name: 'Updated', type: 'internal', status: 'completed',
      memberIds: ['m2'], createdAt: '2026-01-01',
    };
    await dbUpdateProject(project);
    expect(mockUpsertProjectAction).toHaveBeenCalledOnce();
  });

  it('dbDeleteProject ruft deleteProjectAction auf', async () => {
    await dbDeleteProject('p1');
    expect(mockDeleteProjectAction).toHaveBeenCalledWith('p1');
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
      organizationRows: [{
        id: 'org1', name: 'WAMOCON GmbH', slug: 'wamocon-gmbh', created_at: '2026-01-01',
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

    // Organization-Mapping
    const org = data!.organizations[0];
    expect(org.id).toBe('org1');
    expect(org.name).toBe('WAMOCON GmbH');
    expect(org.slug).toBe('wamocon-gmbh');
  });

  it('loadAllData: leere member_ids werden als [] gemappt', async () => {
    mockLoadAllDataAction.mockResolvedValueOnce({
      memberRows: [],
      availabilityRows: [],
      teamRows: [{ id: 't1', name: 'Leer', description: null, member_ids: null }],
      projectRows: [{ id: 'p1', name: 'X', type: 'internal', status: 'active', client: null, description: null, member_ids: null, start_date: null, end_date: null, max_days: null, created_at: '2026-01-01' }],
      allocationRows: [],
      organizationRows: [],
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
    expect(mockUpsertMemberAction).not.toHaveBeenCalled();
  });

  it('dbDeleteMember tut nichts ohne Supabase-Config', async () => {
    await dbDeleteMember('m1');
    expect(mockDeleteMemberAction).not.toHaveBeenCalled();
  });

  it('dbUpdateAvailability tut nichts ohne Supabase-Config', async () => {
    const entry: Availability = {
      id: '1', memberId: 'm1', status: 'available', date: '2025-01-01',
    };
    await dbUpdateAvailability(entry);
    expect(mockUpsertAvailabilityAction).not.toHaveBeenCalled();
  });

  it('dbDeleteAvailability tut nichts ohne Supabase-Config', async () => {
    await dbDeleteAvailability('a1');
    expect(mockDeleteAvailabilityAction).not.toHaveBeenCalled();
  });

  it('dbUpdateTeam tut nichts ohne Supabase-Config', async () => {
    const team: Team = { id: '1', name: 'Test', memberIds: [] };
    await dbUpdateTeam(team);
    expect(mockUpsertTeamAction).not.toHaveBeenCalled();
  });

  it('dbDeleteTeam tut nichts ohne Supabase-Config', async () => {
    await dbDeleteTeam('t1');
    expect(mockDeleteTeamAction).not.toHaveBeenCalled();
  });

  it('dbUpdateProject tut nichts ohne Supabase-Config', async () => {
    const project: Project = {
      id: '1', name: 'Test', type: 'internal', status: 'active',
      memberIds: [], createdAt: '2026-01-01',
    };
    await dbUpdateProject(project);
    expect(mockUpsertProjectAction).not.toHaveBeenCalled();
  });

  it('dbDeleteProject tut nichts ohne Supabase-Config', async () => {
    await dbDeleteProject('p1');
    expect(mockDeleteProjectAction).not.toHaveBeenCalled();
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

  it('dbAddAllocation ruft upsertAllocationAction auf', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbAddAllocation(alloc);
    expect(mockUpsertAllocationAction).toHaveBeenCalledOnce();
    const row = mockUpsertAllocationAction.mock.calls[0][0];
    expect(row.member_id).toBe('m1');
    expect(row.project_id).toBe('p1');
    expect(row.percentage).toBe(60);
  });

  it('dbUpdateAllocation ruft upsertAllocationAction auf', async () => {
    const alloc: Allocation = {
      id: 'al1', memberId: 'm1', projectId: 'p1',
      percentage: 80, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    await dbUpdateAllocation(alloc);
    expect(mockUpsertAllocationAction).toHaveBeenCalledOnce();
  });

  it('dbDeleteAllocation ruft deleteAllocationAction auf', async () => {
    await dbDeleteAllocation('al1');
    expect(mockDeleteAllocationAction).toHaveBeenCalledWith('al1');
  });

  it('dbDeleteMember ruft deleteMemberAction auf (inkl. allocations)', async () => {
    await dbDeleteMember('m1');
    expect(mockDeleteMemberAction).toHaveBeenCalledWith('m1');
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
    const row = mockUpsertAllocationAction.mock.calls[0][0];
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
    expect(mockUpsertAllocationAction).not.toHaveBeenCalled();
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

/* ═══════════════════════════════════════════════════════════════
   KEIN EINGELOGGTER USER (Supabase konfiguriert, aber user=null)
   ═══════════════════════════════════════════════════════════════ */
describe('DB: Kein eingeloggter User (Supabase konfiguriert)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: null } });
    mockUpsert.mockReturnValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert, update: mockUpdate, delete: mockDelete,
      select: vi.fn(), upsert: mockUpsert,
    });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('getUserId gibt null zurück wenn kein User eingeloggt', async () => {
    const id = await getUserId();
    expect(id).toBeNull();
  });

  it('dbGetUserProfile gibt null zurück wenn kein User', async () => {
    const result = await dbGetUserProfile();
    expect(result).toBeNull();
  });

  it('dbAddMember wirft Fehler wenn kein User', async () => {
    const member: Member = { id: '1', name: 'Test', email: 'a@b.de', role: 'Dev', department: 'Eng', createdAt: '2025-01-01' };
    await expect(dbAddMember(member)).rejects.toThrow('Nicht eingeloggt.');
    expect(mockUpsertMemberAction).not.toHaveBeenCalled();
  });

  it('dbUpdateMember tut nichts wenn kein User', async () => {
    const member: Member = { id: '1', name: 'Test', email: 'a@b.de', role: 'Dev', department: 'Eng', createdAt: '2025-01-01' };
    await dbUpdateMember(member);
    expect(mockUpsertMemberAction).not.toHaveBeenCalled();
  });

  it('dbAddAvailability tut nichts wenn kein User', async () => {
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'available', date: '2026-01-01' };
    await dbAddAvailability(entry);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('dbUpdateAvailability tut nichts wenn kein User', async () => {
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'available', date: '2026-01-01' };
    await dbUpdateAvailability(entry);
    expect(mockUpsert).not.toHaveBeenCalled();
  });

  it('dbAddTeam tut nichts wenn kein User', async () => {
    const team: Team = { id: 't1', name: 'Test', memberIds: [] };
    await dbAddTeam(team);
    expect(mockUpsertTeamAction).not.toHaveBeenCalled();
  });

  it('dbUpdateTeam tut nichts wenn kein User', async () => {
    const team: Team = { id: 't1', name: 'Test', memberIds: [] };
    await dbUpdateTeam(team);
    expect(mockUpsertTeamAction).not.toHaveBeenCalled();
  });

  it('dbAddProject wirft Fehler wenn kein User', async () => {
    const project: Project = { id: 'p1', name: 'Test', type: 'internal', status: 'active', memberIds: [], createdAt: '2026-01-01' };
    await expect(dbAddProject(project)).rejects.toThrow();
    expect(mockUpsertProjectAction).not.toHaveBeenCalled();
  });

  it('dbUpdateProject wirft Fehler wenn kein User', async () => {
    const project: Project = { id: 'p1', name: 'Test', type: 'internal', status: 'active', memberIds: [], createdAt: '2026-01-01' };
    await expect(dbUpdateProject(project)).rejects.toThrow();
    expect(mockUpsertProjectAction).not.toHaveBeenCalled();
  });

  it('dbAddAllocation tut nichts wenn kein User', async () => {
    const alloc: Allocation = { id: 'al1', memberId: 'm1', projectId: 'p1', percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30' };
    await dbAddAllocation(alloc);
    expect(mockUpsertAllocationAction).not.toHaveBeenCalled();
  });

  it('dbUpdateAllocation tut nichts wenn kein User', async () => {
    const alloc: Allocation = { id: 'al1', memberId: 'm1', projectId: 'p1', percentage: 60, startDate: '2026-01-01', endDate: '2026-06-30' };
    await dbUpdateAllocation(alloc);
    expect(mockUpsertAllocationAction).not.toHaveBeenCalled();
  });
});

/* ═══════════════════════════════════════════════════════════════
   FEHLER-PFADE (Supabase gibt Fehler zurück)
   ═══════════════════════════════════════════════════════════════ */
describe('DB: Fehler-Pfade Availability (upsert/delete Fehler)', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('dbAddAvailability wirft bei upsert-Fehler', async () => {
    mockFrom.mockReturnValueOnce({ upsert: vi.fn().mockReturnValue({ error: { message: 'upsert failed' } }) });
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'available', date: '2026-01-01' };
    await expect(dbAddAvailability(entry)).rejects.toThrow('upsert failed');
  });

  it('dbUpdateAvailability wirft bei upsert-Fehler', async () => {
    mockFrom.mockReturnValueOnce({ upsert: vi.fn().mockReturnValue({ error: { message: 'update failed' } }) });
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'meeting', date: '2026-01-01' };
    await expect(dbUpdateAvailability(entry)).rejects.toThrow('update failed');
  });

  it('dbDeleteAvailability wirft bei delete-Fehler', async () => {
    const mockEqFn = vi.fn().mockReturnValue({ error: { message: 'delete failed' } });
    mockFrom.mockReturnValueOnce({ delete: vi.fn().mockReturnValue({ eq: mockEqFn }) });
    await expect(dbDeleteAvailability('a1')).rejects.toThrow('delete failed');
  });
});

/* ═══════════════════════════════════════════════════════════════
   OPTIONALE FELDER (??-null-Pfade)
   ═══════════════════════════════════════════════════════════════ */
describe('DB: Optionale Felder werden als null gespeichert', () => {
  beforeEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = 'https://test.supabase.co';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = 'test-key';
    vi.clearAllMocks();
    mockGetUser.mockResolvedValue({ data: { user: { id: 'user-123' } } });
    mockUpsert.mockReturnValue({ error: null });
    mockFrom.mockReturnValue({
      insert: mockInsert, update: mockUpdate, delete: mockDelete,
      select: vi.fn(), upsert: mockUpsert,
    });
    mockUpsertProjectAction.mockResolvedValue(undefined);
    mockUpsertAllocationAction.mockResolvedValue(undefined);
  });

  afterEach(() => {
    process.env.NEXT_PUBLIC_SUPABASE_URL = '';
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY = '';
  });

  it('dbAddAvailability: optionale Felder (startTime, endTime, note) → null', async () => {
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'available', date: '2026-01-01' };
    await dbAddAvailability(entry);
    const row = mockUpsert.mock.calls[0][0];
    expect(row.start_time).toBeNull();
    expect(row.end_time).toBeNull();
    expect(row.note).toBeNull();
  });

  it('dbUpdateAvailability: optionale Felder (startTime, endTime, note) → null', async () => {
    const entry: Availability = { id: 'a1', memberId: 'm1', status: 'meeting', date: '2026-01-01' };
    await dbUpdateAvailability(entry);
    const row = mockUpsert.mock.calls[0][0];
    expect(row.start_time).toBeNull();
    expect(row.end_time).toBeNull();
    expect(row.note).toBeNull();
  });

  it('dbAddProject: optionale Felder (client, description, startDate, endDate, maxDays) → null', async () => {
    const project: Project = { id: 'p1', name: 'Test', type: 'internal', status: 'active', memberIds: [], createdAt: '2026-01-01' };
    await dbAddProject(project);
    const row = mockUpsertProjectAction.mock.calls[0][0];
    expect(row.client).toBeNull();
    expect(row.description).toBeNull();
    expect(row.start_date).toBeNull();
    expect(row.end_date).toBeNull();
    expect(row.max_days).toBeNull();
  });

  it('dbUpdateProject: optionale Felder → null', async () => {
    const project: Project = { id: 'p1', name: 'Test', type: 'internal', status: 'active', memberIds: [], createdAt: '2026-01-01' };
    await dbUpdateProject(project);
    const row = mockUpsertProjectAction.mock.calls[0][0];
    expect(row.client).toBeNull();
    expect(row.description).toBeNull();
    expect(row.start_date).toBeNull();
    expect(row.end_date).toBeNull();
    expect(row.max_days).toBeNull();
  });
});
