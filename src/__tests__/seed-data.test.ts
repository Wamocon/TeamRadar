/**
 * Tests für Seed-Daten: Konsistenz, Referenzielle Integrität
 */
import { describe, it, expect } from 'vitest';
import { SEED_MEMBERS, SEED_AVAILABILITIES, SEED_TEAMS } from '@/lib/seed-data';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';

describe('SEED_MEMBERS', () => {
  it('enthält genau 20 Mitarbeiter', () => {
    expect(SEED_MEMBERS).toHaveLength(20);
  });

  it('alle IDs sind einzigartig', () => {
    const ids = SEED_MEMBERS.map((m) => m.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alle E-Mails sind einzigartig', () => {
    const emails = SEED_MEMBERS.map((m) => m.email);
    expect(new Set(emails).size).toBe(emails.length);
  });

  it('alle E-Mails haben gültiges Format', () => {
    SEED_MEMBERS.forEach((m) => {
      expect(m.email).toMatch(/^[^\s@]+@[^\s@]+\.[^\s@]+$/);
    });
  });

  it('jeder Mitarbeiter hat einen nicht-leeren Namen', () => {
    SEED_MEMBERS.forEach((m) => {
      expect(m.name.trim().length).toBeGreaterThan(0);
    });
  });

  it('jeder Mitarbeiter hat eine Abteilung', () => {
    SEED_MEMBERS.forEach((m) => {
      expect(m.department.trim().length).toBeGreaterThan(0);
    });
  });

  it('jeder Mitarbeiter hat einen createdAt-Timestamp', () => {
    SEED_MEMBERS.forEach((m) => {
      expect(new Date(m.createdAt).getTime()).not.toBeNaN();
    });
  });

  it('enthält verschiedene Abteilungen', () => {
    const departments = [...new Set(SEED_MEMBERS.map((m) => m.department))];
    expect(departments.length).toBeGreaterThanOrEqual(5);
  });
});

describe('SEED_AVAILABILITIES', () => {
  const validStatuses = Object.keys(STATUS_CONFIG) as AvailabilityStatus[];
  const memberIds = new Set(SEED_MEMBERS.map((m) => m.id));

  it('enthält mindestens 20 Einträge', () => {
    expect(SEED_AVAILABILITIES.length).toBeGreaterThanOrEqual(20);
  });

  it('alle IDs sind einzigartig', () => {
    const ids = SEED_AVAILABILITIES.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alle memberIds verweisen auf existierende Mitarbeiter', () => {
    SEED_AVAILABILITIES.forEach((a) => {
      expect(memberIds.has(a.memberId)).toBe(true);
    });
  });

  it('alle Status-Werte sind gültig', () => {
    SEED_AVAILABILITIES.forEach((a) => {
      expect(validStatuses).toContain(a.status);
    });
  });

  it('alle Datumsangaben haben ISO-Format YYYY-MM-DD', () => {
    SEED_AVAILABILITIES.forEach((a) => {
      expect(a.date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(new Date(a.date).getTime()).not.toBeNaN();
    });
  });

  it('Uhrzeiten haben HH:mm-Format wenn vorhanden', () => {
    SEED_AVAILABILITIES.forEach((a) => {
      if (a.startTime) expect(a.startTime).toMatch(/^\d{2}:\d{2}$/);
      if (a.endTime) expect(a.endTime).toMatch(/^\d{2}:\d{2}$/);
    });
  });

  it('endTime ist nach startTime wenn beide vorhanden', () => {
    SEED_AVAILABILITIES.forEach((a) => {
      if (a.startTime && a.endTime) {
        expect(a.endTime > a.startTime).toBe(true);
      }
    });
  });

  it('enthält verschiedene Status-Typen', () => {
    const statuses = new Set(SEED_AVAILABILITIES.map((a) => a.status));
    expect(statuses.size).toBeGreaterThanOrEqual(5);
  });
});

describe('SEED_TEAMS', () => {
  const memberIds = new Set(SEED_MEMBERS.map((m) => m.id));

  it('enthält mindestens 3 Teams', () => {
    expect(SEED_TEAMS.length).toBeGreaterThanOrEqual(3);
  });

  it('alle IDs sind einzigartig', () => {
    const ids = SEED_TEAMS.map((t) => t.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alle Team-Namen sind einzigartig', () => {
    const names = SEED_TEAMS.map((t) => t.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('alle memberIds in Teams verweisen auf existierende Mitarbeiter', () => {
    SEED_TEAMS.forEach((t) => {
      t.memberIds.forEach((mid) => {
        expect(memberIds.has(mid)).toBe(true);
      });
    });
  });

  it('kein Team hat doppelte Mitglieder', () => {
    SEED_TEAMS.forEach((t) => {
      expect(new Set(t.memberIds).size).toBe(t.memberIds.length);
    });
  });

  it('jedes Team hat mindestens ein Mitglied', () => {
    SEED_TEAMS.forEach((t) => {
      expect(t.memberIds.length).toBeGreaterThanOrEqual(1);
    });
  });
});
