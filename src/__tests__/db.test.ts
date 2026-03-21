/**
 * Tests für die Supabase DB-Schicht
 * Prüft: Mapping-Funktionen, Guard-Checks, API-Aufrufe
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';

// Mock des Supabase-Clients
const mockInsert = vi.fn().mockReturnValue({ error: null });
const mockUpdate = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
const mockDelete = vi.fn().mockReturnValue({ eq: vi.fn().mockReturnValue({ error: null }) });
const mockSelect = vi.fn().mockReturnValue({
  eq: vi.fn().mockReturnValue({
    order: vi.fn().mockReturnValue({ data: [], error: null }),
  }),
});

const mockFrom = vi.fn().mockReturnValue({
  insert: mockInsert,
  update: mockUpdate,
  delete: mockDelete,
  select: mockSelect,
});

const mockGetUser = vi.fn().mockResolvedValue({
  data: { user: { id: 'user-123' } },
});

vi.mock('@/lib/supabase/client', () => ({
  createClient: () => ({
    from: mockFrom,
    auth: { getUser: mockGetUser },
  }),
}));

// Import NACH dem Mock
import {
  getUserId,
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
} from '@/lib/supabase/db';

import type { Member, Availability, Team, Project } from '@/types';

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

  it('dbDeleteMember ruft delete für availabilities und members auf', async () => {
    await dbDeleteMember('m1');
    // Sollte zweimal from() aufrufen: einmal für availabilities, einmal für members
    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockFrom).toHaveBeenCalledWith('members');
  });

  it('dbAddAvailability ruft from("availabilities").insert auf', async () => {
    const entry: Availability = {
      id: 'a1', memberId: 'm1', status: 'available', date: '2026-03-20',
      startTime: '09:00', endTime: '17:00',
    };
    await dbAddAvailability(entry);

    expect(mockFrom).toHaveBeenCalledWith('availabilities');
    expect(mockInsert).toHaveBeenCalled();
    const row = mockInsert.mock.calls[0][0];
    expect(row.member_id).toBe('m1');
    expect(row.status).toBe('available');
    expect(row.start_time).toBe('09:00');
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
    mockGetUser.mockResolvedValueOnce({ data: { user: null } });
    const data = await loadAllData();
    expect(data).toBeNull();
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
