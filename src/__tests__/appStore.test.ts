/**
 * Tests für den Zustand AppStore
 * Testet alle CRUD-Operationen, Status-Logik und Rollen
 */
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAppStore } from '@/stores/appStore';
import type { AvailabilityStatus } from '@/types';

// Supabase DB-Funktionen mocken (kein Netzwerk in Tests)
vi.mock('@/lib/supabase/db', () => ({
  loadAllData: vi.fn().mockResolvedValue(null),
  dbAddMember: vi.fn(),
  dbUpdateMember: vi.fn(),
  dbDeleteMember: vi.fn(),
  dbAddAvailability: vi.fn(),
  dbUpdateAvailability: vi.fn(),
  dbDeleteAvailability: vi.fn(),
  dbAddTeam: vi.fn(),
  dbUpdateTeam: vi.fn(),
  dbDeleteTeam: vi.fn(),
}));

// Store vor jedem Test zurücksetzen
beforeEach(() => {
  useAppStore.setState({
    members: [],
    availabilities: [],
    teams: [],
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

  it('gibt ersten passenden Eintrag zurück bei mehreren ohne Zeitfenster', () => {
    useAppStore.getState().addAvailability({
      memberId: 'm1', status: 'meeting', date: testDate,
    });
    useAppStore.getState().addAvailability({
      memberId: 'm1', status: 'available', date: testDate,
    });

    const status = useAppStore.getState().getMemberStatus('m1', testDate);
    // Ohne Zeitfenster matcht .find() den ersten Eintrag
    expect(status).toBe('meeting');
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
    expect(useAppStore.getState().hasMinRole('member')).toBe(false);
  });

  it('admin hat alle Rollen', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'Admin', role: 'admin' },
    });

    expect(useAppStore.getState().hasMinRole('member')).toBe(true);
    expect(useAppStore.getState().hasMinRole('manager')).toBe(true);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(true);
  });

  it('manager hat member + manager, nicht admin', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'Mgr', role: 'manager' },
    });

    expect(useAppStore.getState().hasMinRole('member')).toBe(true);
    expect(useAppStore.getState().hasMinRole('manager')).toBe(true);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
  });

  it('member hat nur member', () => {
    useAppStore.setState({
      userProfile: { id: '1', email: 'a@b.de', displayName: 'User', role: 'member' },
    });

    expect(useAppStore.getState().hasMinRole('member')).toBe(true);
    expect(useAppStore.getState().hasMinRole('manager')).toBe(false);
    expect(useAppStore.getState().hasMinRole('admin')).toBe(false);
  });
});

/* ═══════════════════════════════════════════════════════════════
   SEED-DATEN LADEN
   ═══════════════════════════════════════════════════════════════ */

describe('Store: loadFromSupabase (Seed-Fallback)', () => {
  it('lädt Seed-Daten wenn Store leer ist und Supabase nicht verfügbar', async () => {
    await useAppStore.getState().loadFromSupabase();

    expect(useAppStore.getState().members.length).toBeGreaterThanOrEqual(20);
    expect(useAppStore.getState().availabilities.length).toBeGreaterThanOrEqual(20);
    expect(useAppStore.getState().teams.length).toBeGreaterThanOrEqual(3);
  });
});
