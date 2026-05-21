/**
 * Tests für holidays.ts
 * Prüft: Feiertags-Berechnung, bundeslandspezifische Feiertage, Hilfsfunktionen
 */
import { describe, it, expect } from 'vitest';
import { getHolidays, getHolidayStatesLabel, BUNDESLAENDER } from '@/lib/holidays';
import type { Bundesland } from '@/lib/holidays';

describe('Feiertage: Bundesweite Feiertage', () => {
  it('enthält Neujahr (1. Januar)', () => {
    const map = getHolidays(2026, 'NW');
    expect(map.has('2026-01-01')).toBe(true);
    expect(map.get('2026-01-01')!.name).toBe('Neujahr');
    expect(map.get('2026-01-01')!.nationwide).toBe(true);
  });

  it('enthält Tag der Arbeit (1. Mai)', () => {
    const map = getHolidays(2026, 'BY');
    expect(map.has('2026-05-01')).toBe(true);
    expect(map.get('2026-05-01')!.name).toBe('Tag der Arbeit');
  });

  it('enthält Tag der Deutschen Einheit (3. Oktober)', () => {
    const map = getHolidays(2026, 'BE');
    expect(map.has('2026-10-03')).toBe(true);
    expect(map.get('2026-10-03')!.name).toBe('Tag der Deutschen Einheit');
  });

  it('enthält 1. Weihnachtstag (25. Dezember)', () => {
    const map = getHolidays(2026, 'HH');
    expect(map.has('2026-12-25')).toBe(true);
    expect(map.get('2026-12-25')!.name).toBe('1. Weihnachtstag');
  });

  it('enthält 2. Weihnachtstag (26. Dezember)', () => {
    const map = getHolidays(2026, 'HH');
    expect(map.has('2026-12-26')).toBe(true);
    expect(map.get('2026-12-26')!.name).toBe('2. Weihnachtstag');
  });

  it('berechnet Karfreitag korrekt (2 Tage vor Ostersonntag)', () => {
    // Ostern 2026: 5. April → Karfreitag: 3. April
    const map = getHolidays(2026, 'NW');
    expect(map.has('2026-04-03')).toBe(true);
    expect(map.get('2026-04-03')!.name).toBe('Karfreitag');
    expect(map.get('2026-04-03')!.nationwide).toBe(true);
  });

  it('berechnet Ostermontag korrekt (1 Tag nach Ostersonntag)', () => {
    // Ostern 2026: 5. April → Ostermontag: 6. April
    const map = getHolidays(2026, 'NW');
    expect(map.has('2026-04-06')).toBe(true);
    expect(map.get('2026-04-06')!.name).toBe('Ostermontag');
  });

  it('berechnet Christi Himmelfahrt korrekt (39 Tage nach Ostern)', () => {
    // Ostern 2026: 5. April + 39 = 14. Mai
    const map = getHolidays(2026, 'BY');
    expect(map.has('2026-05-14')).toBe(true);
    expect(map.get('2026-05-14')!.name).toBe('Christi Himmelfahrt');
  });

  it('berechnet Pfingstmontag korrekt (50 Tage nach Ostern)', () => {
    // Ostern 2026: 5. April + 50 = 25. Mai
    const map = getHolidays(2026, 'NW');
    expect(map.has('2026-05-25')).toBe(true);
    expect(map.get('2026-05-25')!.name).toBe('Pfingstmontag');
  });

  it('gibt eine Map zurück, keine Liste', () => {
    const map = getHolidays(2025, 'NW');
    expect(map).toBeInstanceOf(Map);
    expect(map.size).toBeGreaterThan(0);
  });
});

describe('Feiertage: Bundesland-spezifische Feiertage', () => {
  it('Heilige Drei Könige (6. Jan) nur in BW, BY, ST', () => {
    const bw = getHolidays(2026, 'BW');
    const nw = getHolidays(2026, 'NW');
    expect(bw.has('2026-01-06')).toBe(true);
    expect(bw.get('2026-01-06')!.name).toBe('Heilige Drei Könige');
    expect(nw.has('2026-01-06')).toBe(false);
  });

  it('Heilige Drei Könige (6. Jan) enthalten in BY', () => {
    const by = getHolidays(2026, 'BY');
    expect(by.has('2026-01-06')).toBe(true);
  });

  it('Heilige Drei Könige (6. Jan) enthalten in ST', () => {
    const st = getHolidays(2026, 'ST');
    expect(st.has('2026-01-06')).toBe(true);
  });

  it('Internationaler Frauentag (8. März) nur in BE und MV', () => {
    const be = getHolidays(2026, 'BE');
    const mv = getHolidays(2026, 'MV');
    const by = getHolidays(2026, 'BY');
    expect(be.has('2026-03-08')).toBe(true);
    expect(mv.has('2026-03-08')).toBe(true);
    expect(by.has('2026-03-08')).toBe(false);
  });

  it('Mariä Himmelfahrt (15. Aug) nur in BY und SL', () => {
    const by = getHolidays(2026, 'BY');
    const sl = getHolidays(2026, 'SL');
    const bw = getHolidays(2026, 'BW');
    expect(by.has('2026-08-15')).toBe(true);
    expect(sl.has('2026-08-15')).toBe(true);
    expect(bw.has('2026-08-15')).toBe(false);
  });

  it('Reformationstag (31. Okt) in BB, HB, HH, MV, NI, SH, SN, ST, TH', () => {
    const bb = getHolidays(2026, 'BB');
    const by = getHolidays(2026, 'BY');
    expect(bb.has('2026-10-31')).toBe(true);
    expect(by.has('2026-10-31')).toBe(false);
  });

  it('Allerheiligen (1. Nov) in BW, BY, NW, RP, SL', () => {
    const bw = getHolidays(2026, 'BW');
    const nw = getHolidays(2026, 'NW');
    const be = getHolidays(2026, 'BE');
    expect(bw.has('2026-11-01')).toBe(true);
    expect(nw.has('2026-11-01')).toBe(true);
    expect(be.has('2026-11-01')).toBe(false);
  });

  it('Buß- und Bettag nur in SN (Mittwoch vor 23. November)', () => {
    const sn = getHolidays(2026, 'SN');
    const bw = getHolidays(2026, 'BW');
    // 2026: 23. Nov ist Montag → Mittwoch davor = 18. Nov
    expect(sn.has('2026-11-18')).toBe(true);
    expect(bw.has('2026-11-18')).toBe(false);
  });

  it('Gründonnerstag ist kein gesetzlicher Feiertag in Deutschland', () => {
    const bw = getHolidays(2026, 'BW');
    const all = getHolidays(2026, 'ALL');
    // Gründonnerstag = 2. April 2026, nur stiller Tag in BW, kein Feiertag
    expect(bw.has('2026-04-02')).toBe(false);
    expect(all.has('2026-04-02')).toBe(false);
  });

  it('Ostersonntag nur in BB (Brandenburg)', () => {
    const bb = getHolidays(2026, 'BB');
    const nw = getHolidays(2026, 'NW');
    // Ostern 2026: 5. April
    expect(bb.has('2026-04-05')).toBe(true);
    expect(bb.get('2026-04-05')!.name).toBe('Ostersonntag');
    expect(nw.has('2026-04-05')).toBe(false);
  });

  it('Pfingstsonntag nur in BB (Brandenburg)', () => {
    const bb = getHolidays(2026, 'BB');
    const nw = getHolidays(2026, 'NW');
    // Pfingstsonntag 2026: 24. Mai (Ostern + 49 Tage)
    expect(bb.has('2026-05-24')).toBe(true);
    expect(bb.get('2026-05-24')!.name).toBe('Pfingstsonntag');
    expect(nw.has('2026-05-24')).toBe(false);
  });

  it('Weltkindertag (20. Sep) nur in TH', () => {
    const th = getHolidays(2026, 'TH');
    const nw = getHolidays(2026, 'NW');
    expect(th.has('2026-09-20')).toBe(true);
    expect(nw.has('2026-09-20')).toBe(false);
  });
});

describe('Feiertage: ALL-Modus', () => {
  it('ALL enthält bundeslandspezifische Feiertage aller Länder', () => {
    const all = getHolidays(2026, 'ALL');
    // Heilige Drei Könige (nur BW, BY, ST) sollte auch in ALL erscheinen
    expect(all.has('2026-01-06')).toBe(true);
    // Buß- und Bettag (nur SN)
    expect(all.has('2026-11-18')).toBe(true);
  });

  it('ALL enthält mehr Einträge als ein einzelnes Bundesland', () => {
    const all = getHolidays(2026, 'ALL');
    const nw = getHolidays(2026, 'NW'); // NW hat vergleichsweise viele Feiertage
    expect(all.size).toBeGreaterThanOrEqual(nw.size);
  });
});

describe('Feiertage: verschiedene Jahreszahlen', () => {
  it('berechnet Ostern 2025 korrekt (20. April)', () => {
    const map = getHolidays(2025, 'NW');
    // Ostern 2025: 20. April → Karfreitag 18. April, Montag 21. April
    expect(map.has('2025-04-18')).toBe(true);
    expect(map.get('2025-04-18')!.name).toBe('Karfreitag');
    expect(map.has('2025-04-21')).toBe(true);
    expect(map.get('2025-04-21')!.name).toBe('Ostermontag');
  });

  it('berechnet Ostern 2024 korrekt (31. März)', () => {
    const map = getHolidays(2024, 'NW');
    // Karfreitag: 29. März, Ostermontag: 1. April
    expect(map.has('2024-03-29')).toBe(true);
    expect(map.get('2024-03-29')!.name).toBe('Karfreitag');
    expect(map.has('2024-04-01')).toBe(true);
  });
});

describe('Feiertage: BUNDESLAENDER-Konstante', () => {
  it('enthält ALL und alle 16 Bundesländer', () => {
    const keys = Object.keys(BUNDESLAENDER);
    expect(keys).toContain('ALL');
    expect(keys).toHaveLength(17); // ALL + 16 Bundesländer
  });

  it('Bundesland-Kürzel sind korrekt', () => {
    expect(BUNDESLAENDER.NW).toBe('Nordrhein-Westfalen');
    expect(BUNDESLAENDER.BY).toBe('Bayern');
    expect(BUNDESLAENDER.BE).toBe('Berlin');
  });
});

describe('getHolidayStatesLabel', () => {
  it('gibt leeren String für bundesweite Feiertage', () => {
    const map = getHolidays(2026, 'NW');
    const neujahr = map.get('2026-01-01')!;
    expect(getHolidayStatesLabel(neujahr)).toBe('');
  });

  it('gibt leeren String wenn states undefined', () => {
    expect(getHolidayStatesLabel({ date: '2026-01-01', name: 'Test', nationwide: true })).toBe('');
  });

  it('gibt Bundesland-Kürzel für regionale Feiertage zurück', () => {
    const all = getHolidays(2026, 'ALL');
    const dreikoenige = all.get('2026-01-06')!;
    expect(dreikoenige.nationwide).toBe(false);
    const label = getHolidayStatesLabel(dreikoenige);
    expect(label).toContain('BW');
    expect(label).toContain('BY');
    expect(label).toContain('ST');
  });

  it('gibt Kürzel als Slash-getrennte Liste zurück', () => {
    const all = getHolidays(2026, 'ALL');
    const mariaeHimmelfahrt = all.get('2026-08-15')!;
    const label = getHolidayStatesLabel(mariaeHimmelfahrt);
    expect(label).toBe('BY/SL');
  });
});
