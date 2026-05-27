import type { AvailabilityStatus } from '@/types';

const LEGACY_STATUS_MAP: Record<string, AvailabilityStatus> = {
  homeoffice: 'remote',
  vacation_day: 'vacation',
  krank: 'sick',
  urlaub: 'vacation',
  office: 'busy',
};

const VALID_STATUSES = new Set<AvailabilityStatus>([
  'available',
  'busy',
  'meeting',
  'vacation',
  'sick',
  'remote',
  'offline',
  'extern-onsite',
  'extern-remote',
  'home-extern',
  'berufsschule',
  'buero-berufsschule',
  'buero-uni',
  'uni',
]);

export function normalizeAvailabilityStatus(rawStatus: string): AvailabilityStatus {
  const normalized = LEGACY_STATUS_MAP[rawStatus] ?? rawStatus;
  return VALID_STATUSES.has(normalized as AvailabilityStatus)
    ? (normalized as AvailabilityStatus)
    : 'offline';
}
