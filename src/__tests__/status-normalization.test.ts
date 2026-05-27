import { normalizeAvailabilityStatus } from '@/lib/status-normalization';

describe('Status-Normalisierung', () => {
  it('mappt Legacy-Status korrekt auf gültige Status', () => {
    expect(normalizeAvailabilityStatus('homeoffice')).toBe('remote');
    expect(normalizeAvailabilityStatus('urlaub')).toBe('vacation');
    expect(normalizeAvailabilityStatus('krank')).toBe('sick');
    expect(normalizeAvailabilityStatus('vacation_day')).toBe('vacation');
    expect(normalizeAvailabilityStatus('office')).toBe('busy');
  });

  it('lässt gültige Status unverändert', () => {
    expect(normalizeAvailabilityStatus('available')).toBe('available');
    expect(normalizeAvailabilityStatus('extern-onsite')).toBe('extern-onsite');
    expect(normalizeAvailabilityStatus('buero-uni')).toBe('buero-uni');
  });

  it('fällt bei unbekannten Statuswerten auf offline zurück', () => {
    expect(normalizeAvailabilityStatus('foo-bar')).toBe('offline');
    expect(normalizeAvailabilityStatus('')).toBe('offline');
  });
});
