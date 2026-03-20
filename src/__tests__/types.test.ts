/**
 * Tests für TypeScript-Typen und STATUS_CONFIG
 */
import { describe, it, expect } from 'vitest';
import {
  STATUS_CONFIG,
  USER_ROLE_HIERARCHY,
  type AvailabilityStatus,
  type UserRole,
  type Member,
  type Availability,
  type Team,
  type UserProfile,
} from '@/types';

describe('STATUS_CONFIG', () => {
  const ALL_STATUSES: AvailabilityStatus[] = [
    'available', 'busy', 'meeting', 'vacation', 'sick', 'remote', 'offline',
  ];

  it('enthält alle 7 Status-Typen', () => {
    expect(Object.keys(STATUS_CONFIG)).toHaveLength(7);
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
    expect(STATUS_CONFIG.busy.label).toBe('Beschäftigt');
    expect(STATUS_CONFIG.meeting.label).toBe('Im Meeting');
    expect(STATUS_CONFIG.vacation.label).toBe('Urlaub');
    expect(STATUS_CONFIG.sick.label).toBe('Krank');
    expect(STATUS_CONFIG.remote.label).toBe('Remote');
    expect(STATUS_CONFIG.offline.label).toBe('Offline');
  });

  it('alle Farben sind einzigartig', () => {
    const colors = Object.values(STATUS_CONFIG).map((c) => c.color);
    expect(new Set(colors).size).toBe(colors.length);
  });
});

describe('USER_ROLE_HIERARCHY', () => {
  it('enthält alle 3 Rollen', () => {
    expect(Object.keys(USER_ROLE_HIERARCHY)).toHaveLength(3);
  });

  it('admin > manager > member', () => {
    expect(USER_ROLE_HIERARCHY.admin).toBeGreaterThan(USER_ROLE_HIERARCHY.manager);
    expect(USER_ROLE_HIERARCHY.manager).toBeGreaterThan(USER_ROLE_HIERARCHY.member);
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
      id: '1', email: 'a@b.de', displayName: 'Test', role: 'member',
    };
    expect(profile.role).toBe('member');
  });
});
