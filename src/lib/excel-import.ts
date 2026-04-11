/**
 * Excel-Import/-Export für Mitarbeiter-Massenimport.
 * Nutzt @e965/xlsx (SheetJS Community Fork) für .xlsx-Dateien.
 */
import * as XLSX from '@e965/xlsx';
import type { Member } from '@/types';

/* ── Spalten-Mapping: Excel-Header ↔ Member-Felder ─────── */
const COLUMN_MAP: Record<string, keyof Pick<Member, 'name' | 'email' | 'role' | 'department' | 'phone'>> = {
  'Name': 'name',
  'E-Mail': 'email',
  'Position': 'role',
  'Abteilung': 'department',
  'Telefon': 'phone',
};

const REQUIRED_COLUMNS = ['Name', 'E-Mail'];
const ALL_COLUMNS = ['Name', 'E-Mail', 'Position', 'Abteilung', 'Telefon'];

export interface ImportResult {
  members: Omit<Member, 'id' | 'createdAt'>[];
  errors: ImportError[];
  totalRows: number;
}

export interface ImportError {
  row: number;
  field: string;
  message: string;
}

/**
 * Generiert eine Excel-Vorlage (.xlsx) mit korrektem Format und Beispieldaten.
 * Gibt einen Blob zurück, der direkt heruntergeladen werden kann.
 */
export function generateTemplate(): Blob {
  const templateData = [
    { Name: 'Max Mustermann', 'E-Mail': 'max@firma.de', Position: 'Frontend-Entwickler', Abteilung: 'Engineering', Telefon: '+49 171 1234567' },
    { Name: 'Erika Musterfrau', 'E-Mail': 'erika@firma.de', Position: 'UX-Designerin', Abteilung: 'Design', Telefon: '' },
  ];

  const ws = XLSX.utils.json_to_sheet(templateData, { header: ALL_COLUMNS });

  // Spaltenbreiten setzen
  ws['!cols'] = [
    { wch: 25 }, // Name
    { wch: 30 }, // E-Mail
    { wch: 25 }, // Position
    { wch: 20 }, // Abteilung
    { wch: 20 }, // Telefon
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Mitarbeiter');

  const buf = XLSX.write(wb, { type: 'array', bookType: 'xlsx' });
  return new Blob([buf], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' });
}

/**
 * Parst eine hochgeladene Excel-Datei und gibt validierte Mitarbeiter-Daten zurück.
 */
export async function parseExcelFile(file: File): Promise<ImportResult> {
  const buffer = await file.arrayBuffer();
  const wb = XLSX.read(buffer, { type: 'array' });

  const firstSheet = wb.SheetNames[0];
  if (!firstSheet) {
    return { members: [], errors: [{ row: 0, field: '', message: 'Die Excel-Datei enthält keine Arbeitsblätter.' }], totalRows: 0 };
  }

  const ws = wb.Sheets[firstSheet];
  const rows = XLSX.utils.sheet_to_json<Record<string, unknown>>(ws);

  if (rows.length === 0) {
    return { members: [], errors: [{ row: 0, field: '', message: 'Das Arbeitsblatt enthält keine Daten.' }], totalRows: 0 };
  }

  // Header validieren
  const headers = Object.keys(rows[0]);
  const missingRequired = REQUIRED_COLUMNS.filter((col) => !headers.includes(col));
  if (missingRequired.length > 0) {
    return {
      members: [],
      errors: [{ row: 0, field: '', message: `Fehlende Pflichtspalten: ${missingRequired.join(', ')}. Bitte die Vorlage verwenden.` }],
      totalRows: rows.length,
    };
  }

  const members: Omit<Member, 'id' | 'createdAt'>[] = [];
  const errors: ImportError[] = [];
  const seenEmails = new Set<string>();

  for (let i = 0; i < rows.length; i++) {
    const row = rows[i];
    const rowNum = i + 2; // +2: Header=1, 0-basiert
    const name = String(row['Name'] ?? '').trim();
    const email = String(row['E-Mail'] ?? '').trim().toLowerCase();
    const role = String(row['Position'] ?? '').trim();
    const department = String(row['Abteilung'] ?? '').trim();
    const phone = String(row['Telefon'] ?? '').trim();

    // Validierung
    if (!name) {
      errors.push({ row: rowNum, field: 'Name', message: 'Name ist leer.' });
      continue;
    }

    if (!email) {
      errors.push({ row: rowNum, field: 'E-Mail', message: 'E-Mail ist leer.' });
      continue;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      errors.push({ row: rowNum, field: 'E-Mail', message: `Ungültige E-Mail-Adresse: "${email}".` });
      continue;
    }

    if (seenEmails.has(email)) {
      errors.push({ row: rowNum, field: 'E-Mail', message: `Doppelte E-Mail in der Datei: "${email}".` });
      continue;
    }
    seenEmails.add(email);

    members.push({
      name,
      email,
      role,
      department,
      phone: phone || undefined,
    });
  }

  return { members, errors, totalRows: rows.length };
}

/**
 * Startet den Download der Template-Datei.
 */
export function downloadTemplate() {
  const blob = generateTemplate();
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'Mitarbeiter-Import-Vorlage.xlsx';
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
