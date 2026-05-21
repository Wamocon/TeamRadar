/**
 * Importiert die Jahresübersicht 2026 aus der Excel-Vorlage in die Datenbank.
 * Ausführen: npx ts-node --project tsconfig.json scripts/import-year-2026.ts
 *
 * Mapping Excel → App:
 *  BEP → extern-remote  (Beim Externen Projekt, HomeOffice)
 *  EP  → extern-onsite  (Externer Projekt, Vor-Ort)
 *  B   → busy           (Büro intern)
 *  U/u → vacation       (Urlaub)
 *  K/k → sick           (Krank)
 *  HO  → remote         (Homeoffice intern)
 */

import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const SCHEMA = process.env.NEXT_PUBLIC_DB_SCHEMA ?? 'teamradar-prod';
const URL    = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const KEY    = process.env.SUPABASE_SERVICE_ROLE_KEY!;

if (!URL || !KEY) { console.error('NEXT_PUBLIC_SUPABASE_URL oder SUPABASE_SERVICE_ROLE_KEY fehlt.'); process.exit(1); }

const db = createClient(URL, KEY, { db: { schema: SCHEMA } });

// ── Typen ─────────────────────────────────────────────────────────────────────
type S = 'extern-remote'|'extern-onsite'|'busy'|'vacation'|'sick'|'remote';
const BEP: S = 'extern-remote';
const EP:  S = 'extern-onsite';
const B:   S = 'busy';
const U:   S = 'vacation';
const K:   S = 'sick';
const HO:  S = 'remote';

// ── Rohdaten: [Tag, Status] pro Monat pro Mitarbeiter ─────────────────────────
// Nur Werktage (Feiertage/Wochenenden werden nicht eingetragen).
// Deutsche Feiertage 2026 sind bereits ausgespart.
type Entry = [number, S];
type MonthEntries = Record<string, Entry[]>;

const DATA: Record<string, MonthEntries> = {

  // ══════════════════════════════════════════════════════════════════════
  // JANUAR (01) – 1=Do Feiertag; Werktage: 2,5-9,12-16,19-23,26-30
  // ══════════════════════════════════════════════════════════════════════
  '01': {
    'Erwin Moretz':   [[2,U],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[12,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Daniel Moretz':  [[2,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[12,U],[13,U],[14,U],[15,U],[16,U],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Nikolaj Schefner':[[2,U],[5,U],[6,U],[7,U],[8,U],[9,U],[12,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,EP],[21,BEP],[22,BEP],[23,BEP],[26,U],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Nurzhan Kukeyev':[[2,U],[5,B],[6,B],[7,B],[8,B],[9,B],[12,B],[13,B],[14,B],[15,B],[16,B],[19,B],[20,B],[21,B],[22,B],[23,B],[26,B],[27,B],[28,B],[29,B],[30,U]],
    'Yash Bhesaniya': [[2,U],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[12,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,BEP],[21,K],[22,BEP],[23,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Maanik Garg':    [[2,B],[5,B],[6,B],[7,B],[8,B],[9,B],[12,B],[13,B],[14,B],[15,B],[16,B],[19,B],[20,B],[21,B],[22,B],[23,B],[26,B],[27,B],[28,B],[29,B],[30,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // FEBRUAR (02) – 1=So; Werktage: 2-6,9-13,16-20,23-27
  // ══════════════════════════════════════════════════════════════════════
  '02': {
    'Erwin Moretz':   [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,K],[18,K],[19,K],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP]],
    'Daniel Moretz':  [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP]],
    'Nikolaj Schefner':[[2,EP],[3,EP],[4,EP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,EP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP]],
    'Nurzhan Kukeyev':[[2,B],[3,U],[4,B],[5,B],[6,B],[9,B],[10,B],[11,U],[12,B],[13,B],[16,B],[17,B],[18,B],[19,B],[20,B],[23,B],[24,B],[25,B],[26,B],[27,B]],
    'Yash Bhesaniya': [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,U],[20,U],[23,U],[24,U],[25,BEP],[26,BEP],[27,BEP]],
    'Maanik Garg':    [[2,B],[3,B],[4,B],[5,B],[6,B],[9,B],[10,B],[11,B],[12,B],[13,B],[16,B],[17,B],[18,B],[19,B],[20,B],[23,B],[24,B],[25,U],[26,U],[27,HO]],
    'Waleri Moretz':  [[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // MÄRZ (03) – 1=So; Werktage: 2-6,9-13,16-20,23-27,30-31
  // ══════════════════════════════════════════════════════════════════════
  '03': {
    'Erwin Moretz':   [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,EP],[18,EP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP],[31,BEP]],
    'Daniel Moretz':  [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,EP],[17,EP],[18,EP],[19,BEP],[20,B],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP],[31,BEP]],
    'Nikolaj Schefner':[[2,BEP],[3,EP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,EP],[17,EP],[18,EP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,EP],[30,BEP],[31,EP]],
    'Nurzhan Kukeyev':[[2,B],[3,B],[4,U],[5,B],[6,B],[9,B],[10,B],[11,B],[12,B],[13,B],[16,B],[17,B],[18,B],[19,B],[20,B],[23,B],[24,B],[25,B],[26,B],[27,B],[30,B],[31,B]],
    'Yash Bhesaniya': [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP],[31,BEP]],
    'Maanik Garg':    [[2,HO],[3,HO],[4,HO],[5,HO],[6,HO],[9,HO],[10,HO],[11,HO],[12,HO],[13,HO],[16,HO],[17,HO],[18,HO],[19,HO],[20,HO],[23,HO],[24,HO],[25,HO],[26,HO],[27,HO],[30,HO],[31,HO]],
    'Waleri Moretz':  [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP],[31,BEP]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // APRIL (04) – Feiertage: 3=Fr Karfreitag, 6=Mo Ostermontag
  //              Werktage: 1-2, 7-10, 13-17, 20-24, 27-30
  // ══════════════════════════════════════════════════════════════════════
  '04': {
    'Erwin Moretz':   [[1,BEP],[2,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,U],[28,U],[29,U],[30,U]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,BEP],[29,BEP],[30,B]],
    'Nikolaj Schefner':[[1,BEP],[2,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,EP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,EP],[29,BEP],[30,BEP]],
    'Nurzhan Kukeyev':[[1,U],[2,U],[7,B],[8,B],[9,B],[10,B],[13,B],[14,B],[15,B],[16,B],[17,B],[20,B],[21,B],[22,B],[23,B],[24,B],[27,B],[28,B],[29,B],[30,B]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,U],[29,U],[30,U]],
    'Maanik Garg':    [[1,HO],[2,HO],[7,HO],[8,HO],[9,U],[10,U],[13,B],[14,B],[15,B],[16,B],[17,B],[20,B],[21,B],[22,B],[23,B],[24,B],[27,B],[28,B],[29,B],[30,B]],
    'Waleri Moretz':  [[1,BEP],[2,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,BEP],[29,BEP]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // MAI (05) – Feiertage: 1=Fr Tag der Arbeit, 14=Do Himmelfahrt, 25=Mo Pfingstmontag
  //            Werktage: 4-8, 11-13, 15, 18-22, 26-30
  // ══════════════════════════════════════════════════════════════════════
  '05': {
    'Erwin Moretz':   [[4,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[22,B],[26,BEP],[27,BEP],[28,BEP],[29,B]],
    'Daniel Moretz':  [[4,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[26,U],[27,U],[28,BEP],[29,BEP]],
    'Nikolaj Schefner':[[4,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[11,BEP],[12,EP],[13,BEP],[15,U],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[26,EP],[27,BEP],[28,BEP],[29,BEP]],
    'Nurzhan Kukeyev':[[4,B],[5,B],[6,B],[7,B],[8,B],[11,B],[12,B],[13,B],[15,B],[18,B],[19,B],[20,B],[21,B],[22,B],[26,B],[27,B],[28,B],[29,B]],
    'Yash Bhesaniya': [[4,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP]],
    'Maanik Garg':    [[4,B],[5,B],[6,B],[7,B],[8,B],[11,B],[12,B],[13,B],[15,B],[18,B],[19,B],[20,B],[21,B],[22,B],[26,B],[27,B],[28,B],[29,B]],
    'Waleri Moretz':  [[4,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // JUNI (06) – 4=Do Feiertag (Fronleichnam, regional); Werktage: 1-3,5-13,15-20,22-27,29-30
  //             Hinweis: Fronleichnam ist je nach Bundesland Feiertag
  //             Screenshot zeigt rote Spalte bei Tag 4 → als Feiertag behandelt
  // ══════════════════════════════════════════════════════════════════════
  '06': {
    'Erwin Moretz':   [[1,BEP],[2,BEP],[3,BEP],[5,BEP],[6,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,B],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[22,U],[23,U],[24,U],[25,U],[26,U],[29,BEP],[30,BEP]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[3,BEP],[5,BEP],[6,EP],[7,EP],[8,EP],[9,BEP],[10,BEP],[12,BEP],[13,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[29,BEP],[30,BEP]],
    'Nikolaj Schefner':[[1,BEP],[2,BEP],[3,BEP],[5,BEP],[6,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,B],[15,EP],[16,BEP],[17,BEP],[18,BEP],[19,B],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[26,B],[29,BEP],[30,BEP]],
    'Nurzhan Kukeyev':[[1,B],[2,B],[3,BEP],[5,BEP],[6,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[29,BEP],[30,BEP]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[3,BEP],[5,BEP],[6,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[29,BEP],[30,BEP]],
    'Maanik Garg':    [[1,B],[2,B],[3,B],[5,B],[6,B],[8,B],[9,B],[10,B],[11,B],[12,B],[13,B],[15,B],[16,B],[17,B],[18,B],[19,B],[22,B],[23,B],[24,B],[25,B],[26,U],[29,B],[30,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // JULI (07) – Keine Feiertage; Werktage: 1-4,6-11,13-18,20-25,27-31
  // ══════════════════════════════════════════════════════════════════════
  '07': {
    'Erwin Moretz':   [[1,BEP],[2,BEP],[3,B],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[10,B],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,B],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,B],[27,BEP],[28,BEP],[29,BEP],[30,BEP],[31,B]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[3,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,U],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Nikolaj Schefner':[[1,BEP],[2,BEP],[3,B],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[10,B],[13,U],[14,U],[15,U],[16,U],[17,U],[20,U],[21,U],[22,U],[23,U],[24,U],[27,BEP],[28,BEP],[29,BEP],[30,BEP],[31,B]],
    'Nurzhan Kukeyev':[[1,BEP],[2,BEP],[3,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[3,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Maanik Garg':    [[1,B],[2,B],[3,B],[6,B],[7,B],[8,B],[9,B],[10,B],[13,B],[14,B],[15,B],[16,B],[17,B],[20,B],[21,B],[22,B],[23,B],[24,B],[27,B],[28,B],[29,B],[30,B],[31,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // AUGUST (08) – Keine Feiertage; Werktage: 3-7,10-14,17-21,24-28,31
  // ══════════════════════════════════════════════════════════════════════
  '08': {
    'Erwin Moretz':   [[3,BEP],[4,BEP],[5,BEP],[6,BEP],[7,B],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[14,B],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[21,B],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[28,B],[31,BEP]],
    'Daniel Moretz':  [[3,B],[4,BEP],[5,BEP],[6,BEP],[7,BEP],[10,B],[11,BEP],[12,BEP],[13,BEP],[14,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[28,BEP],[31,BEP]],
    'Nikolaj Schefner':[[3,BEP],[4,EP],[5,BEP],[6,BEP],[7,B],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[14,B],[17,U],[18,U],[19,U],[20,U],[21,U],[24,U],[25,U],[26,U],[27,U],[28,U],[31,U]],
    'Nurzhan Kukeyev':[[3,BEP],[4,BEP],[5,BEP],[6,BEP],[7,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[14,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[28,BEP]],
    'Yash Bhesaniya': [[3,BEP],[4,BEP],[5,BEP],[6,BEP],[7,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[14,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[21,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[28,BEP],[31,BEP]],
    'Maanik Garg':    [[3,B],[4,B],[5,B],[6,B],[7,B],[10,B],[11,B],[12,B],[13,B],[14,B],[17,B],[18,B],[19,B],[20,B],[21,B],[24,B],[25,B],[26,B],[27,B],[28,B],[31,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // SEPTEMBER (09) – Keine Feiertage; Werktage: 1-5,7-12,14-18,21-25,28-30
  // ══════════════════════════════════════════════════════════════════════
  '09': {
    'Erwin Moretz':   [[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,B],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[18,B],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[25,B],[28,BEP],[29,BEP],[30,BEP]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,B],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[14,B],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[21,B],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[28,B],[29,BEP],[30,BEP]],
    'Nikolaj Schefner':[[1,U],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,B],[14,EP],[15,EP],[16,EP],[17,BEP],[18,B],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[25,B],[28,BEP],[29,EP],[30,BEP]],
    'Nurzhan Kukeyev':[[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,U],[11,BEP],[14,U],[15,U],[16,U],[17,U],[18,U],[21,U],[22,U],[23,U],[24,U],[25,U],[28,U],[29,U],[30,U]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[25,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Maanik Garg':    [[1,B],[2,B],[3,B],[4,B],[7,B],[8,B],[9,B],[10,B],[11,B],[14,B],[15,B],[16,B],[17,B],[18,B],[21,B],[22,B],[23,B],[24,B],[25,B],[28,B],[29,B],[30,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // OKTOBER (10) – 3=Sa Einheit (Sa=bereits Wochenende); Werktage: 1-2,5-9,12-16,19-23,26-30
  // ══════════════════════════════════════════════════════════════════════
  '10': {
    'Erwin Moretz':   [[1,BEP],[2,B],[5,U],[6,U],[7,U],[8,U],[9,U],[12,U],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,B],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,B]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[5,BEP],[6,BEP],[7,BEP],[8,U],[9,U],[12,U],[13,U],[14,U],[15,U],[16,U],[19,U],[20,U],[21,U],[22,U],[23,U],[26,B],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Nikolaj Schefner':[[1,BEP],[2,B],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,B],[12,BEP],[13,EP],[14,BEP],[15,BEP],[16,B],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,B],[26,BEP],[27,EP],[28,BEP],[29,BEP],[30,B]],
    'Nurzhan Kukeyev':[[1,U],[2,U],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[12,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[5,BEP],[6,BEP],[7,BEP],[8,BEP],[9,BEP],[12,BEP],[13,BEP],[14,BEP],[15,BEP],[16,BEP],[19,BEP],[20,BEP],[21,BEP],[22,BEP],[23,BEP],[26,BEP],[27,BEP],[28,BEP],[29,BEP],[30,BEP]],
    'Maanik Garg':    [[1,B],[2,B],[5,B],[6,B],[7,B],[8,B],[9,B],[12,B],[13,B],[14,B],[15,B],[16,B],[19,B],[20,B],[21,B],[22,B],[23,B],[26,B],[27,B],[28,B],[29,B],[30,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // NOVEMBER (11) – 1=So; Werktage: 2-6,9-13,16-20,23-27,30
  // ══════════════════════════════════════════════════════════════════════
  '11': {
    'Erwin Moretz':   [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,B],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,B],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,B],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,B],[30,BEP]],
    'Daniel Moretz':  [[2,B],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,B],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,B],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,B],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,B]],
    'Nikolaj Schefner':[[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,B],[9,BEP],[10,EP],[11,BEP],[12,BEP],[13,B],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,B],[23,BEP],[24,EP],[25,BEP],[26,BEP],[27,B],[30,BEP]],
    'Nurzhan Kukeyev':[[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP]],
    'Yash Bhesaniya': [[2,BEP],[3,BEP],[4,BEP],[5,BEP],[6,BEP],[9,BEP],[10,BEP],[11,BEP],[12,BEP],[13,BEP],[16,BEP],[17,BEP],[18,BEP],[19,BEP],[20,BEP],[23,BEP],[24,BEP],[25,BEP],[26,BEP],[27,BEP],[30,BEP]],
    'Maanik Garg':    [[2,B],[3,B],[4,B],[5,B],[6,B],[9,B],[10,B],[11,B],[12,B],[13,B],[16,B],[17,B],[18,B],[19,B],[20,B],[23,B],[24,B],[25,B],[26,B],[27,B],[30,B]],
  },

  // ══════════════════════════════════════════════════════════════════════
  // DEZEMBER (12) – Feiertage: 25=Fr,26=Sa; Werktage: 1-4,7-11,14-18,21-24,28-31
  // ══════════════════════════════════════════════════════════════════════
  '12': {
    'Erwin Moretz':   [[1,BEP],[2,BEP],[3,BEP],[4,B],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,B],[14,BEP],[15,U],[16,U],[17,U],[18,U],[21,U],[22,U],[23,U],[24,U],[28,U],[29,U],[30,U],[31,U]],
    'Daniel Moretz':  [[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,B],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[14,BEP],[15,U],[16,U],[17,U],[18,U],[21,B],[22,B],[23,B],[24,B],[28,B],[29,B],[30,B],[31,B]],
    'Nikolaj Schefner':[[1,BEP],[2,BEP],[3,BEP],[4,B],[7,BEP],[8,EP],[9,BEP],[10,BEP],[11,B],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[18,B],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Nurzhan Kukeyev':[[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Yash Bhesaniya': [[1,BEP],[2,BEP],[3,BEP],[4,BEP],[7,BEP],[8,BEP],[9,BEP],[10,BEP],[11,BEP],[14,BEP],[15,BEP],[16,BEP],[17,BEP],[18,BEP],[21,BEP],[22,BEP],[23,BEP],[24,BEP],[28,BEP],[29,BEP],[30,BEP],[31,BEP]],
    'Maanik Garg':    [[1,B],[2,B],[3,B],[4,B],[7,B],[8,B],[9,B],[10,B],[11,B],[14,B],[15,B],[16,B],[17,B],[18,B],[21,B],[22,B],[23,B],[24,B],[28,B],[29,B],[30,B],[31,B]],
  },
};

// ── Hauptlogik ────────────────────────────────────────────────────────────────
async function main() {
  console.log(`Schema: ${SCHEMA}`);

  // 1. Mitglieder aus DB laden (Name → ID)
  const { data: members, error: membersErr } = await db.from('members').select('id, name');
  if (membersErr) { console.error('Fehler beim Laden der Mitglieder:', membersErr.message); process.exit(1); }

  const memberMap = new Map<string, string>(members!.map((m: any) => [m.name as string, m.id as string]));
  console.log(`${memberMap.size} Mitglieder gefunden:`, [...memberMap.keys()].join(', '));

  // 2. Einträge aufbauen
  const rows: Array<{ id: string; member_id: string; status: string; date: string }> = [];

  for (const [month, memberData] of Object.entries(DATA)) {
    for (const [name, entries] of Object.entries(memberData)) {
      const memberId = memberMap.get(name);
      if (!memberId) {
        console.warn(`  ⚠  Mitglied nicht gefunden: "${name}" – Einträge werden übersprungen.`);
        continue;
      }
      for (const [day, status] of entries) {
        const date = `2026-${month}-${String(day).padStart(2, '0')}`;
        rows.push({ id: `import-2026-${memberId}-${date}`, member_id: memberId, status, date });
      }
    }
  }

  console.log(`${rows.length} Einträge werden eingespielt...`);

  // 3. In Batches von 200 upserten
  const BATCH = 200;
  let inserted = 0;
  for (let i = 0; i < rows.length; i += BATCH) {
    const batch = rows.slice(i, i + BATCH);
    const { error } = await db.from('availabilities').upsert(batch, { onConflict: 'id' });
    if (error) { console.error(`Fehler bei Batch ${i / BATCH + 1}:`, error.message); process.exit(1); }
    inserted += batch.length;
    console.log(`  ✓ ${inserted}/${rows.length}`);
  }

  console.log('✅ Import abgeschlossen.');
}

main().catch((e) => { console.error(e); process.exit(1); });
