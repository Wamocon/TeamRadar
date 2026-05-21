/**
 * Deutsche gesetzliche Feiertage – Bundesland-spezifisch.
 * Berechnung erfolgt rein client-seitig, kein API-Aufruf nötig.
 */

export const BUNDESLAENDER = {
  ALL: 'Deutschlandweit',
  BW:  'Baden-Württemberg',
  BY:  'Bayern',
  BE:  'Berlin',
  BB:  'Brandenburg',
  HB:  'Bremen',
  HH:  'Hamburg',
  HE:  'Hessen',
  MV:  'Mecklenburg-Vorpommern',
  NI:  'Niedersachsen',
  NW:  'Nordrhein-Westfalen',
  RP:  'Rheinland-Pfalz',
  SL:  'Saarland',
  SN:  'Sachsen',
  ST:  'Sachsen-Anhalt',
  SH:  'Schleswig-Holstein',
  TH:  'Thüringen',
} as const;

export type Bundesland = keyof typeof BUNDESLAENDER;

export interface Holiday {
  date: string;       // 'YYYY-MM-DD'
  name: string;
  nationwide: boolean;
  states?: Bundesland[];   // nur wenn !nationwide
}

// ── Ostersonntag (Gausssche Formel) ─────────────────────────
function easterSunday(year: number): Date {
  const a = year % 19;
  const b = Math.floor(year / 100);
  const c = year % 100;
  const d = Math.floor(b / 4);
  const e = b % 4;
  const f = Math.floor((b + 8) / 25);
  const g = Math.floor((b - f + 1) / 3);
  const h = (19 * a + b - d - g + 15) % 30;
  const i = Math.floor(c / 4);
  const k = c % 4;
  const l = (32 + 2 * e + 2 * i - h - k) % 7;
  const m = Math.floor((a + 11 * h + 22 * l) / 451);
  const month = Math.floor((h + l - 7 * m + 114) / 31);
  const day   = ((h + l - 7 * m + 114) % 31) + 1;
  return new Date(year, month - 1, day);
}

function addDays(d: Date, n: number): Date {
  const r = new Date(d);
  r.setDate(r.getDate() + n);
  return r;
}

function fmt(d: Date): string {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
}

/**
 * Gibt alle Feiertage für ein Jahr und ein Bundesland zurück.
 * Bei Bundesland = 'ALL' werden ALLE bundeslandspezifischen Feiertage
 * mit angezeigt (inkl. Kürzel-Anzeige im UI).
 */
export function getHolidays(year: number, bundesland: Bundesland): Map<string, Holiday> {
  const easter = easterSunday(year);
  const list: Holiday[] = [];

  const nat = (date: Date, name: string) => {
    list.push({ date: fmt(date), name, nationwide: true });
  };
  const reg = (date: Date, name: string, states: Bundesland[]) => {
    if (bundesland === 'ALL' || states.includes(bundesland)) {
      list.push({ date: fmt(date), name, nationwide: false, states });
    }
  };

  // ── Bundesweit ───────────────────────────────────────
  nat(new Date(year, 0, 1),          'Neujahr');
  nat(addDays(easter, -2),           'Karfreitag');
  nat(addDays(easter,  1),           'Ostermontag');
  nat(new Date(year, 4, 1),          'Tag der Arbeit');
  nat(addDays(easter, 39),           'Christi Himmelfahrt');
  nat(addDays(easter, 50),           'Pfingstmontag');
  nat(new Date(year, 9, 3),          'Tag der Deutschen Einheit');
  nat(new Date(year, 11, 25),        '1. Weihnachtstag');
  nat(new Date(year, 11, 26),        '2. Weihnachtstag');

  // ── Bundesland-spezifisch ────────────────────────────
  reg(new Date(year, 0, 6), 'Heilige Drei Könige',
    ['BW', 'BY', 'ST']);
  reg(new Date(year, 2, 8), 'Internationaler Frauentag',
    ['BE', 'MV']);
  reg(easter, 'Ostersonntag',
    ['BB']);
  reg(addDays(easter, 49), 'Pfingstsonntag',
    ['BB']);
  reg(addDays(easter, 60), 'Fronleichnam',
    ['BW', 'BY', 'HE', 'NW', 'RP', 'SL']);
  reg(new Date(year, 7, 15), 'Mariä Himmelfahrt',
    ['BY', 'SL']);
  reg(new Date(year, 8, 20), 'Weltkindertag',
    ['TH']);
  reg(new Date(year, 9, 31), 'Reformationstag',
    ['BB', 'HB', 'HH', 'MV', 'NI', 'SH', 'SN', 'ST', 'TH']);
  reg(new Date(year, 10, 1), 'Allerheiligen',
    ['BW', 'BY', 'NW', 'RP', 'SL']);

  // Buß- und Bettag: Mittwoch vor dem 23. November (nur SN)
  const nov23 = new Date(year, 10, 23);
  const nov23dow = nov23.getDay(); // 0=So, 3=Mi
  const daysToWed = nov23dow === 3 ? 0 : nov23dow > 3 ? nov23dow - 3 : nov23dow + 4;
  reg(addDays(nov23, -daysToWed), 'Buß- und Bettag', ['SN']);

  // Map: date-string → Holiday (letzter Eintrag gewinnt bei Kollision)
  const map = new Map<string, Holiday>();
  for (const h of list) {
    map.set(h.date, h);
  }
  return map;
}

/** Zeigt an welche Bundesland-Kürzel an einem Datum Feiertag haben (nur wenn !nationwide) */
export function getHolidayStatesLabel(holiday: Holiday): string {
  if (holiday.nationwide || !holiday.states) return '';
  return holiday.states.join('/');
}
