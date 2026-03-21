/**
 * Tests für Seed-Daten: Konsistenz, Referenzielle Integrität
 */
import { describe, it, expect } from 'vitest';
import { SEED_MEMBERS, SEED_AVAILABILITIES, SEED_TEAMS, SEED_PROJECTS, SEED_ALLOCATIONS } from '@/lib/seed-data';
import {
  STATUS_CONFIG,
  SKILL_LEVEL_CONFIG,
  SKILL_CATEGORIES,
  type AvailabilityStatus,
  type ProjectType,
  type ProjectStatus,
  type SkillLevel,
  type SkillCategory,
} from '@/types';

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

describe('SEED_PROJECTS', () => {
  const memberIds = new Set(SEED_MEMBERS.map((m) => m.id));
  const validTypes: ProjectType[] = ['internal', 'external'];
  const validStatuses: ProjectStatus[] = ['planned', 'active', 'completed'];

  it('enthält mindestens 8 Projekte', () => {
    expect(SEED_PROJECTS.length).toBeGreaterThanOrEqual(8);
  });

  it('alle IDs sind einzigartig', () => {
    const ids = SEED_PROJECTS.map((p) => p.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alle Projektnamen sind einzigartig', () => {
    const names = SEED_PROJECTS.map((p) => p.name);
    expect(new Set(names).size).toBe(names.length);
  });

  it('alle Projekt-Typen sind gültig', () => {
    SEED_PROJECTS.forEach((p) => {
      expect(validTypes).toContain(p.type);
    });
  });

  it('alle Projekt-Status sind gültig', () => {
    SEED_PROJECTS.forEach((p) => {
      expect(validStatuses).toContain(p.status);
    });
  });

  it('enthält sowohl interne als auch externe Projekte', () => {
    const types = new Set(SEED_PROJECTS.map((p) => p.type));
    expect(types.has('internal')).toBe(true);
    expect(types.has('external')).toBe(true);
  });

  it('externe Projekte haben einen Kundennamen', () => {
    SEED_PROJECTS.filter((p) => p.type === 'external').forEach((p) => {
      expect(p.client).toBeTruthy();
      expect(p.client!.trim().length).toBeGreaterThan(0);
    });
  });

  it('Projektverteilung: mindestens 3 interne und 3 externe', () => {
    const internalCount = SEED_PROJECTS.filter((p) => p.type === 'internal').length;
    const externalCount = SEED_PROJECTS.filter((p) => p.type === 'external').length;
    expect(internalCount).toBeGreaterThanOrEqual(3);
    expect(externalCount).toBeGreaterThanOrEqual(3);
  });

  it('alle memberIds verweisen auf existierende Mitarbeiter', () => {
    SEED_PROJECTS.forEach((p) => {
      p.memberIds.forEach((mid) => {
        expect(memberIds.has(mid)).toBe(true);
      });
    });
  });

  it('jedes Projekt hat einen createdAt-Timestamp', () => {
    SEED_PROJECTS.forEach((p) => {
      expect(new Date(p.createdAt).getTime()).not.toBeNaN();
    });
  });

  it('Datumsangaben haben ISO-Format wenn vorhanden', () => {
    SEED_PROJECTS.forEach((p) => {
      if (p.startDate) expect(p.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      if (p.endDate) expect(p.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });
});

/* ═══════════════════════════════════════════════════
   SKILLS
   ═══════════════════════════════════════════════════ */

describe('SEED_MEMBERS: Skills', () => {
  it('die meisten Mitarbeiter haben Skills', () => {
    const withSkills = SEED_MEMBERS.filter((m) => m.skills && m.skills.length > 0);
    expect(withSkills.length).toBeGreaterThanOrEqual(15);
  });

  it('alle Skill-Level sind gültig', () => {
    const validLevels = Object.keys(SKILL_LEVEL_CONFIG) as SkillLevel[];
    SEED_MEMBERS.forEach((m) => {
      (m.skills ?? []).forEach((s) => {
        expect(validLevels).toContain(s.level);
      });
    });
  });

  it('alle Skill-Kategorien sind gültig', () => {
    SEED_MEMBERS.forEach((m) => {
      (m.skills ?? []).forEach((s) => {
        expect(SKILL_CATEGORIES as readonly string[]).toContain(s.category);
      });
    });
  });

  it('alle Skill-Namen sind nicht-leer', () => {
    SEED_MEMBERS.forEach((m) => {
      (m.skills ?? []).forEach((s) => {
        expect(s.name.trim().length).toBeGreaterThan(0);
      });
    });
  });

  it('kein Mitarbeiter hat doppelte Skill-Namen', () => {
    SEED_MEMBERS.forEach((m) => {
      const names = (m.skills ?? []).map((s) => s.name.toLowerCase());
      expect(new Set(names).size).toBe(names.length);
    });
  });

  it('enthält verschiedene Skill-Kategorien quer über alle Mitarbeiter', () => {
    const allCategories = new Set<string>();
    SEED_MEMBERS.forEach((m) => {
      (m.skills ?? []).forEach((s) => allCategories.add(s.category));
    });
    expect(allCategories.size).toBeGreaterThanOrEqual(6);
  });
});

/* ═══════════════════════════════════════════════════
   ALLOCATIONS
   ═══════════════════════════════════════════════════ */

describe('SEED_ALLOCATIONS', () => {
  const memberIds = new Set(SEED_MEMBERS.map((m) => m.id));
  const projectIds = new Set(SEED_PROJECTS.map((p) => p.id));

  it('enthält mindestens 20 Zuweisungen', () => {
    expect(SEED_ALLOCATIONS.length).toBeGreaterThanOrEqual(20);
  });

  it('alle IDs sind einzigartig', () => {
    const ids = SEED_ALLOCATIONS.map((a) => a.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it('alle memberIds verweisen auf existierende Mitarbeiter', () => {
    SEED_ALLOCATIONS.forEach((a) => {
      expect(memberIds.has(a.memberId)).toBe(true);
    });
  });

  it('alle projectIds verweisen auf existierende Projekte', () => {
    SEED_ALLOCATIONS.forEach((a) => {
      expect(projectIds.has(a.projectId)).toBe(true);
    });
  });

  it('alle Prozentsätze sind zwischen 1 und 100', () => {
    SEED_ALLOCATIONS.forEach((a) => {
      expect(a.percentage).toBeGreaterThanOrEqual(1);
      expect(a.percentage).toBeLessThanOrEqual(100);
    });
  });

  it('alle Datumsangaben haben ISO-Format', () => {
    SEED_ALLOCATIONS.forEach((a) => {
      expect(a.startDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(a.endDate).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    });
  });

  it('endDate ist nach startDate', () => {
    SEED_ALLOCATIONS.forEach((a) => {
      expect(a.endDate >= a.startDate).toBe(true);
    });
  });

  it('verschiedene Projekte sind abgedeckt', () => {
    const coveredProjects = new Set(SEED_ALLOCATIONS.map((a) => a.projectId));
    expect(coveredProjects.size).toBeGreaterThanOrEqual(5);
  });

  it('Zuweisungen decken interne und externe Projekte ab', () => {
    const allocationProjectIds = new Set(SEED_ALLOCATIONS.map((a) => a.projectId));
    const coveredProjects = SEED_PROJECTS.filter((p) => allocationProjectIds.has(p.id));
    const hasInternal = coveredProjects.some((p) => p.type === 'internal');
    const hasExternal = coveredProjects.some((p) => p.type === 'external');
    expect(hasInternal).toBe(true);
    expect(hasExternal).toBe(true);
  });

  it('einige Mitarbeiter haben Überbuchung (> 100%)', () => {
    // Prüfen dass es realistische Testdaten gibt
    const today = new Date().toISOString().slice(0, 10);
    const memberUtils = new Map<string, number>();
    SEED_ALLOCATIONS
      .filter((a) => a.startDate <= today && a.endDate >= today)
      .forEach((a) => {
        memberUtils.set(a.memberId, (memberUtils.get(a.memberId) || 0) + a.percentage);
      });
    const overbooked = [...memberUtils.values()].filter((v) => v > 100);
    expect(overbooked.length).toBeGreaterThanOrEqual(1);
  });
});
