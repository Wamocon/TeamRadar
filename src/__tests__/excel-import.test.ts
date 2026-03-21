/**
 * Tests für den Excel-Mitarbeiter-Import
 * Prüft: Template-Generierung, Validierung, Parsing, Fehlerbehandlung
 */
import { describe, it, expect } from 'vitest';
import * as XLSX from 'xlsx';
import { generateTemplate, parseExcelFile } from '@/lib/excel-import';

/* ── Hilfsfunktion: Erzeugt eine File-Instanz aus Excel-Daten ── */
function createExcelFile(data: Record<string, unknown>[], sheetName = 'Mitarbeiter'): File {
  const ws = XLSX.utils.json_to_sheet(data);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'test.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

function createEmptyExcelFile(): File {
  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.aoa_to_sheet([]);
  XLSX.utils.book_append_sheet(wb, ws, 'Leer');
  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new File([buf], 'empty.xlsx', {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
}

/* ═══════════════════════════════════════════════════════════════
   TEMPLATE GENERIERUNG
   ═══════════════════════════════════════════════════════════════ */

describe('Excel: Template-Generierung', () => {
  it('generiert einen gültigen Blob', () => {
    const blob = generateTemplate();
    expect(blob).toBeInstanceOf(Blob);
    expect(blob.size).toBeGreaterThan(0);
    expect(blob.type).toBe('application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
  });

  it('Template enthält korrektes Arbeitsblatt "Mitarbeiter"', async () => {
    const blob = generateTemplate();
    const buf = await blob.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    expect(wb.SheetNames).toContain('Mitarbeiter');
  });

  it('Template enthält alle Pflichtspalten', async () => {
    const blob = generateTemplate();
    const buf = await blob.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Mitarbeiter']);
    const headers = Object.keys(rows[0]);

    expect(headers).toContain('Name');
    expect(headers).toContain('E-Mail');
    expect(headers).toContain('Position');
    expect(headers).toContain('Abteilung');
    expect(headers).toContain('Telefon');
  });

  it('Template enthält Beispieldaten', async () => {
    const blob = generateTemplate();
    const buf = await blob.arrayBuffer();
    const wb = XLSX.read(buf, { type: 'array' });
    const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(wb.Sheets['Mitarbeiter']);

    expect(rows.length).toBe(2);
    expect(rows[0]['Name']).toBe('Max Mustermann');
    expect(rows[1]['Name']).toBe('Erika Musterfrau');
  });
});

/* ═══════════════════════════════════════════════════════════════
   ERFOLGREICHES PARSING
   ═══════════════════════════════════════════════════════════════ */

describe('Excel: Erfolgreiches Parsing', () => {
  it('parst gültige Mitarbeiter-Daten korrekt', async () => {
    const file = createExcelFile([
      { Name: 'Anna Schmidt', 'E-Mail': 'anna@firma.de', Position: 'Entwicklerin', Abteilung: 'Engineering', Telefon: '+49 171 1234567' },
      { Name: 'Ben Müller', 'E-Mail': 'ben@firma.de', Position: 'Designer', Abteilung: 'Design', Telefon: '' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(2);
    expect(result.errors).toHaveLength(0);
    expect(result.totalRows).toBe(2);
  });

  it('gibt korrekte Member-Objekte zurück', async () => {
    const file = createExcelFile([
      { Name: 'Anna Schmidt', 'E-Mail': 'anna@firma.de', Position: 'Dev', Abteilung: 'Eng', Telefon: '+49 171 123' },
    ]);

    const result = await parseExcelFile(file);
    const member = result.members[0];

    expect(member.name).toBe('Anna Schmidt');
    expect(member.email).toBe('anna@firma.de');
    expect(member.role).toBe('Dev');
    expect(member.department).toBe('Eng');
    expect(member.phone).toBe('+49 171 123');
  });

  it('setzt optionale Felder auf undefined wenn leer', async () => {
    const file = createExcelFile([
      { Name: 'Test', 'E-Mail': 'test@firma.de', Position: '', Abteilung: '', Telefon: '' },
    ]);

    const result = await parseExcelFile(file);
    const member = result.members[0];

    expect(member.phone).toBeUndefined();
  });

  it('trimmt Whitespace aus allen Feldern', async () => {
    const file = createExcelFile([
      { Name: '  Anna Schmidt  ', 'E-Mail': '  anna@firma.de  ', Position: ' Dev ', Abteilung: ' Eng ', Telefon: '' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members[0].name).toBe('Anna Schmidt');
    expect(result.members[0].email).toBe('anna@firma.de');
    expect(result.members[0].role).toBe('Dev');
  });

  it('normalisiert E-Mail auf Kleinbuchstaben', async () => {
    const file = createExcelFile([
      { Name: 'Test', 'E-Mail': 'Anna@Firma.DE' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members[0].email).toBe('anna@firma.de');
  });

  it('funktioniert nur mit Pflichtspalten (Name, E-Mail)', async () => {
    const file = createExcelFile([
      { Name: 'Test', 'E-Mail': 'test@firma.de' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(1);
    expect(result.errors).toHaveLength(0);
  });

  it('verarbeitet große Importlisten (100 Mitarbeiter)', async () => {
    const data = Array.from({ length: 100 }, (_, i) => ({
      Name: `Mitarbeiter ${i + 1}`,
      'E-Mail': `m${i + 1}@firma.de`,
      Position: 'Dev',
      Abteilung: 'Eng',
    }));

    const result = await parseExcelFile(createExcelFile(data));
    expect(result.members).toHaveLength(100);
    expect(result.errors).toHaveLength(0);
  });
});

/* ═══════════════════════════════════════════════════════════════
   VALIDIERUNG & FEHLERBEHANDLUNG
   ═══════════════════════════════════════════════════════════════ */

describe('Excel: Validierung & Fehlerbehandlung', () => {
  it('erkennt leere Datei (keine Daten)', async () => {
    const file = createEmptyExcelFile();
    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors.length).toBeGreaterThanOrEqual(1);
  });

  it('erkennt fehlende Pflichtspalte "Name"', async () => {
    const file = createExcelFile([
      { 'E-Mail': 'test@firma.de', Position: 'Dev' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors[0].message).toContain('Name');
  });

  it('erkennt fehlende Pflichtspalte "E-Mail"', async () => {
    const file = createExcelFile([
      { Name: 'Test', Position: 'Dev' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors[0].message).toContain('E-Mail');
  });

  it('erkennt leeren Namen in einer Zeile', async () => {
    const file = createExcelFile([
      { Name: '', 'E-Mail': 'test@firma.de' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors[0].field).toBe('Name');
    expect(result.errors[0].row).toBe(2);
  });

  it('erkennt leere E-Mail in einer Zeile', async () => {
    const file = createExcelFile([
      { Name: 'Test', 'E-Mail': '' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors[0].field).toBe('E-Mail');
  });

  it('erkennt ungültige E-Mail-Adresse', async () => {
    const file = createExcelFile([
      { Name: 'Test', 'E-Mail': 'keine-email' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(0);
    expect(result.errors[0].message).toContain('Ungültige E-Mail');
  });

  it('erkennt doppelte E-Mails innerhalb der Datei', async () => {
    const file = createExcelFile([
      { Name: 'Anna', 'E-Mail': 'anna@firma.de' },
      { Name: 'Anna 2', 'E-Mail': 'anna@firma.de' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(1);
    expect(result.errors).toHaveLength(1);
    expect(result.errors[0].message).toContain('Doppelte E-Mail');
  });

  it('importiert gültige Zeilen und meldet ungültige separat', async () => {
    const file = createExcelFile([
      { Name: 'OK', 'E-Mail': 'ok@firma.de' },
      { Name: '', 'E-Mail': 'empty-name@firma.de' },
      { Name: 'Gut', 'E-Mail': 'gut@firma.de' },
      { Name: 'Schlecht', 'E-Mail': 'keine-email' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.members).toHaveLength(2);
    expect(result.errors).toHaveLength(2);
    expect(result.members[0].name).toBe('OK');
    expect(result.members[1].name).toBe('Gut');
  });

  it('gibt korrekte Zeilennummern in Fehlern an (ab Zeile 2)', async () => {
    const file = createExcelFile([
      { Name: 'OK', 'E-Mail': 'ok@firma.de' },
      { Name: '', 'E-Mail': 'bad@firma.de' },
      { Name: 'Auch leer', 'E-Mail': '' },
    ]);

    const result = await parseExcelFile(file);
    expect(result.errors[0].row).toBe(3); // Zeile 3 (Header=1, erste Daten=2)
    expect(result.errors[1].row).toBe(4);
  });
});
