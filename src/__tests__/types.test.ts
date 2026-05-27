/**
 * Tests für TypeScript-Typen und STATUS_CONFIG
 */
import { describe, it, expect } from 'vitest';
import {
  STATUS_CONFIG,
  USER_ROLE_HIERARCHY,
  SKILL_LEVEL_CONFIG,
  SKILL_CATEGORIES,
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  ALERT_TYPE_CONFIG,
  CONSULTANT_TYPE_CONFIG,
  type AvailabilityStatus,
  type UserRole,
  type Member,
  type Availability,
  type Team,
  type UserProfile,
  type Skill,
  type Allocation,
  type Alert,
  type Project,
} from '@/types';

describe('STATUS_CONFIG', () => {
  const ALL_STATUSES: AvailabilityStatus[] = [
    'available', 'busy', 'meeting', 'vacation', 'sick', 'remote', 'offline',
    'extern-onsite', 'extern-remote',
    'home-extern', 'berufsschule', 'buero-berufsschule', 'buero-uni', 'uni',
  ];

  it('enthält alle 14 Status-Typen', () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(14);
    ALL_STATUSES.forEach((status) => {
      expect(STATUS_CONFIG[status]).toBeDefined();
    });
  });

  it('jeder Status hat label, color und bgClass', () => {
    ALL_STATUSES.forEach((status) => {
      const config = STATUS_CONFIG[status];
      expect(config.label).toBeTruthy();
      expect(config.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(config.bgClass).toMatch(/^bg-/);
    });
  });

  it('alle Labels sind auf Deutsch', () => {
    expect(STATUS_CONFIG.available.label).toBe('Verfügbar');
    expect(STATUS_CONFIG.busy.label).toBe('Büro intern');
    expect(STATUS_CONFIG.meeting.label).toBe('Im Meeting');
    expect(STATUS_CONFIG.vacation.label).toBe('Urlaub');
    expect(STATUS_CONFIG.sick.label).toBe('Krank');
    expect(STATUS_CONFIG.remote.label).toBe('Homeoffice intern');
    expect(STATUS_CONFIG.offline.label).toBe('Kein Status');
  });

  it('alle Farben sind einzigartig', () => {
    const colors = Object.values(STATUS_CONFIG).map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('USER_ROLE_HIERARCHY', () => {
  it('enthält alle 5 Rollen', () => {
    expect(Object.keys(USER_ROLE_HIERARCHY)).toHaveLength(5);
  });

  it('admin > cio > department_lead > employee', () => {
    expect(USER_ROLE_HIERARCHY.admin).toBeGreaterThan(USER_ROLE_HIERARCHY.cio);
    expect(USER_ROLE_HIERARCHY.cio).toBeGreaterThan(USER_ROLE_HIERARCHY.department_lead);
    expect(USER_ROLE_HIERARCHY.department_lead).toBeGreaterThan(USER_ROLE_HIERARCHY.employee);
  });
});

describe('Type-Safety: Interface-Shapes', () => {
  it('Member hat alle erforderlichen Felder', () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'test@test.de',
      role: 'Dev', department: 'Eng', createdAt: '2025-01-01',
    };
    expect(member.id).toBe('1');
    expect(member.avatarUrl).toBeUndefined();
    expect(member.phone).toBeUndefined();
  });

  it('Availability hat alle erforderlichen Felder', () => {
    const avail: Availability = {
      id: '1', memberId: 'm1', status: 'available', date: '2025-01-01',
    };
    expect(avail.startTime).toBeUndefined();
    expect(avail.endTime).toBeUndefined();
    expect(avail.note).toBeUndefined();
  });

  it('Team hat alle erforderlichen Felder', () => {
    const team: Team = { id: '1', name: 'Test', memberIds: [] };
    expect(team.description).toBeUndefined();
    expect(team.memberIds).toEqual([]);
  });

  it('UserProfile hat alle erforderlichen Felder', () => {
    const profile: UserProfile = {
      id: '1', email: 'a@b.de', displayName: 'Test', role: 'employee',
    };
    expect(profile.role).toBe('employee');
  });

  it('Member kann optionale Skills haben', () => {
    const member: Member = {
      id: '1', name: 'Test', email: 'test@test.de',
      role: 'Dev', department: 'Eng', createdAt: '2025-01-01',
      skills: [{ name: 'React', category: 'Frontend', level: 'expert' }],
    };
    expect(member.skills).toHaveLength(1);
    expect(member.skills![0].name).toBe('React');
    expect(member.skills![0].category).toBe('Frontend');
    expect(member.skills![0].level).toBe('expert');
  });

  it('Allocation hat alle erforderlichen Felder', () => {
    const alloc: Allocation = {
      id: '1', memberId: 'm1', projectId: 'p1',
      percentage: 80, startDate: '2026-01-01', endDate: '2026-06-30',
    };
    expect(alloc.percentage).toBe(80);
    expect(alloc.note).toBeUndefined();
  });

  it('Alert hat alle erforderlichen Felder', () => {
    const alert: Alert = {
      id: '1', type: 'overbooking', memberId: 'm1',
      message: 'Test', severity: 'error',
    };
    expect(alert.severity).toBe('error');
    expect(alert.projectIds).toBeUndefined();
    expect(alert.date).toBeUndefined();
  });

  it('Project kann optionale budgetHours haben', () => {
    const project: Project = {
      id: '1', name: 'Test', type: 'internal', status: 'active',
      memberIds: [], createdAt: '2025-01-01', budgetHours: 500,
    };
    expect(project.budgetHours).toBe(500);
  });
});

describe('SKILL_LEVEL_CONFIG', () => {
  it('enthält alle 4 Skill-Level', () => {
    expect(Object.keys(SKILL_LEVEL_CONFIG)).toHaveLength(4);
  });

  it('jedes Level hat label, color und aufsteigenden value', () => {
    const levels = Object.values(SKILL_LEVEL_CONFIG);
    levels.forEach((l) => {
      expect(l.label).toBeTruthy();
      expect(l.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(l.value).toBeGreaterThan(0);
    });
    // Werte aufsteigend
    expect(SKILL_LEVEL_CONFIG.beginner.value).toBeLessThan(SKILL_LEVEL_CONFIG.intermediate.value);
    expect(SKILL_LEVEL_CONFIG.intermediate.value).toBeLessThan(SKILL_LEVEL_CONFIG.advanced.value);
    expect(SKILL_LEVEL_CONFIG.advanced.value).toBeLessThan(SKILL_LEVEL_CONFIG.expert.value);
  });
});

describe('SKILL_CATEGORIES', () => {
  it('enthält mindestens 8 Kategorien', () => {
    expect(SKILL_CATEGORIES.length).toBeGreaterThanOrEqual(8);
  });

  it('enthält gängige Kategorien', () => {
    expect(SKILL_CATEGORIES).toContain('Frontend');
    expect(SKILL_CATEGORIES).toContain('Backend');
    expect(SKILL_CATEGORIES).toContain('Cloud');
    expect(SKILL_CATEGORIES).toContain('Mobile');
    expect(SKILL_CATEGORIES).toContain('Security');
  });
});

describe('ALERT_TYPE_CONFIG', () => {
  it('enthält alle 4 Alert-Typen', () => {
    expect(Object.keys(ALERT_TYPE_CONFIG)).toHaveLength(4);
  });

  it('jeder Alert-Typ hat label, icon und color', () => {
    Object.values(ALERT_TYPE_CONFIG).forEach((conf) => {
      expect(conf.label).toBeTruthy();
      expect(conf.icon).toBeTruthy();
      expect(conf.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('PROJECT_TYPE_CONFIG', () => {
  it('enthält internal und external', () => {
    expect(Object.keys(PROJECT_TYPE_CONFIG)).toHaveLength(2);
    expect(PROJECT_TYPE_CONFIG.internal).toBeDefined();
    expect(PROJECT_TYPE_CONFIG.external).toBeDefined();
  });

  it('jeder Typ hat label, color und bgClass', () => {
    Object.values(PROJECT_TYPE_CONFIG).forEach((conf) => {
      expect(conf.label).toBeTruthy();
      expect(conf.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(conf.bgClass).toMatch(/^bg-/);
    });
  });

  it('intern ist auf Deutsch, extern auch', () => {
    expect(PROJECT_TYPE_CONFIG.internal.label).toBe('Intern');
    expect(PROJECT_TYPE_CONFIG.external.label).toBe('Extern');
  });

  it('Farben sind unterschiedlich', () => {
    expect(PROJECT_TYPE_CONFIG.internal.color).not.toBe(PROJECT_TYPE_CONFIG.external.color);
  });
});

describe('PROJECT_STATUS_CONFIG', () => {
  it('enthält alle 3 Status', () => {
    expect(Object.keys(PROJECT_STATUS_CONFIG)).toHaveLength(3);
    expect(PROJECT_STATUS_CONFIG.planned).toBeDefined();
    expect(PROJECT_STATUS_CONFIG.active).toBeDefined();
    expect(PROJECT_STATUS_CONFIG.completed).toBeDefined();
  });

  it('jeder Status hat label und color', () => {
    Object.values(PROJECT_STATUS_CONFIG).forEach((conf) => {
      expect(conf.label).toBeTruthy();
      expect(conf.color).toMatch(/^#[0-9a-f]{6}$/i);
    });
  });
});

describe('Neue Status-Typen (v1.2): HeP / BS / BBS / BU / U', () => {
  it('home-extern ist konfiguriert mit Label Homeoffice ext. Projekt', () => {
    expect(STATUS_CONFIG['home-extern'].label).toBe('Homeoffice ext. Projekt');
    expect(STATUS_CONFIG['home-extern'].color).toMatch(/^#[0-9a-f]{6}$/i);
    expect(STATUS_CONFIG['home-extern'].bgClass).toContain('cyan');
  });

  it('berufsschule (BS) ist konfiguriert', () => {
    expect(STATUS_CONFIG['berufsschule'].label).toBe('Berufschule');
    expect(STATUS_CONFIG['berufsschule'].bgClass).toContain('yellow');
  });

  it('buero-berufsschule (BBS) ist konfiguriert', () => {
    expect(STATUS_CONFIG['buero-berufsschule'].label).toBe('Büro Berufschule');
    expect(STATUS_CONFIG['buero-berufsschule'].bgClass).toContain('yellow');
  });

  it('buero-uni (BU) ist konfiguriert', () => {
    expect(STATUS_CONFIG['buero-uni'].label).toBe('Büro Universität');
    expect(STATUS_CONFIG['buero-uni'].bgClass).toContain('blue');
  });

  it('uni (U) ist konfiguriert', () => {
    expect(STATUS_CONFIG['uni'].label).toBe('Universität');
    expect(STATUS_CONFIG['uni'].bgClass).toContain('violet');
  });

  it('remote ist auf Homeoffice intern umbenannt', () => {
    expect(STATUS_CONFIG['remote'].label).toBe('Homeoffice intern');
  });

  it('alle neuen Statuses haben distinkte Farben zu ihren Nachbarn', () => {
    const cyan500 = STATUS_CONFIG['remote'].color;
    const cyan600 = STATUS_CONFIG['home-extern'].color;
    expect(cyan500).not.toBe(cyan600);

    const yellow600 = STATUS_CONFIG['berufsschule'].color;
    const yellow700 = STATUS_CONFIG['buero-berufsschule'].color;
    expect(yellow600).not.toBe(yellow700);

    const blue700 = STATUS_CONFIG['buero-uni'].color;
    const violet700 = STATUS_CONFIG['uni'].color;
    expect(blue700).not.toBe(violet700);
  });
});

describe('CONSULTANT_TYPE_CONFIG', () => {
  it('enthält die 3 Berater-Typen', () => {
    expect(Object.keys(CONSULTANT_TYPE_CONFIG)).toHaveLength(3);
    expect(CONSULTANT_TYPE_CONFIG.consultant).toBeDefined();
    expect(CONSULTANT_TYPE_CONFIG.senior_consultant).toBeDefined();
    expect(CONSULTANT_TYPE_CONFIG.apprentice).toBeDefined();
  });

  it('jeder Typ hat label, short, color und capacityComponents', () => {
    Object.values(CONSULTANT_TYPE_CONFIG).forEach((conf) => {
      expect(conf.label).toBeTruthy();
      expect(conf.short).toBeTruthy();
      expect(conf.color).toMatch(/^#[0-9a-f]{6}$/i);
      expect(Array.isArray(conf.capacityComponents)).toBe(true);
      expect(conf.capacityComponents.length).toBeGreaterThan(0);
    });
  });

  it('Kürzel sind korrekt (B, SB, Az)', () => {
    expect(CONSULTANT_TYPE_CONFIG.consultant.short).toBe('B');
    expect(CONSULTANT_TYPE_CONFIG.senior_consultant.short).toBe('SB');
    expect(CONSULTANT_TYPE_CONFIG.apprentice.short).toBe('Az');
  });

  it('Auszubildender enthält vocational_school in capacityComponents', () => {
    expect(CONSULTANT_TYPE_CONFIG.apprentice.capacityComponents).toContain('vocational_school');
  });

  it('Berater enthält university in capacityComponents', () => {
    expect(CONSULTANT_TYPE_CONFIG.consultant.capacityComponents).toContain('university');
  });

  it('alle Farben sind unterschiedlich', () => {
    const colors = Object.values(CONSULTANT_TYPE_CONFIG).map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});
