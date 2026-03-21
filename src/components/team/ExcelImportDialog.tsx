'use client';
import { useState, useRef } from 'react';
import { Upload, Download, FileSpreadsheet, AlertCircle, CheckCircle2, X } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { parseExcelFile, downloadTemplate, type ImportResult } from '@/lib/excel-import';

export function ExcelImportDialog({ onClose }: { onClose: () => void }) {
  const addMember = useAppStore((s) => s.addMember);
  const existingMembers = useAppStore((s) => s.members);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [importing, setImporting] = useState(false);
  const [imported, setImported] = useState(false);
  const [dragOver, setDragOver] = useState(false);

  const handleFile = async (file: File) => {
    if (!file.name.endsWith('.xlsx') && !file.name.endsWith('.xls')) {
      setResult({
        members: [],
        errors: [{ row: 0, field: '', message: 'Bitte eine Excel-Datei (.xlsx) hochladen.' }],
        totalRows: 0,
      });
      return;
    }
    const parsed = await parseExcelFile(file);

    // Duplikat-Check gegen existierende Mitarbeiter
    const existingEmails = new Set(existingMembers.map((m) => m.email.toLowerCase()));
    const duplicateErrors = parsed.members
      .filter((m) => existingEmails.has(m.email.toLowerCase()))
      .map((m) => ({
        row: 0,
        field: 'E-Mail',
        message: `"${m.email}" existiert bereits im System.`,
      }));

    const filteredMembers = parsed.members.filter(
      (m) => !existingEmails.has(m.email.toLowerCase())
    );

    setResult({
      members: filteredMembers,
      errors: [...parsed.errors, ...duplicateErrors],
      totalRows: parsed.totalRows,
    });
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file) void handleFile(file);
  };

  const handleImport = () => {
    if (!result || result.members.length === 0) return;
    setImporting(true);
    for (const member of result.members) {
      addMember(member);
    }
    setImporting(false);
    setImported(true);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={onClose}>
      <div
        className="relative w-full max-w-xl mx-4 rounded-2xl border dark:border-white/10 border-gray-200 dark:bg-gray-900 bg-white shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-6 pb-0">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-green-500/20 to-emerald-400/20 border border-green-500/20 flex items-center justify-center">
              <FileSpreadsheet size={20} className="text-green-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold dark:text-white text-gray-900">
                Excel-Import
              </h2>
              <p className="text-xs dark:text-white/40 text-gray-500">
                Mitarbeiter per Excel-Datei importieren
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          {/* Schritt 1: Template herunterladen */}
          <div className="rounded-xl border dark:border-white/[0.06] border-gray-100 p-4 space-y-2">
            <h3 className="text-sm font-semibold dark:text-white/70 text-gray-700">
              1. Vorlage herunterladen
            </h3>
            <p className="text-xs dark:text-white/30 text-gray-400">
              Die Excel-Vorlage enthält die Spalten Name, E-Mail, Position, Abteilung und Telefon mit Beispieldaten.
            </p>
            <button
              onClick={downloadTemplate}
              className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-white/10 border-gray-200 text-sm font-medium dark:text-white/70 text-gray-600 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30 transition-all bg-transparent cursor-pointer"
            >
              <Download size={14} />
              Vorlage herunterladen
            </button>
          </div>

          {/* Schritt 2: Datei hochladen */}
          {!imported && (
            <div className="rounded-xl border dark:border-white/[0.06] border-gray-100 p-4 space-y-2">
              <h3 className="text-sm font-semibold dark:text-white/70 text-gray-700">
                2. Ausgefüllte Datei hochladen
              </h3>
              <div
                onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`flex flex-col items-center justify-center py-8 rounded-xl border-2 border-dashed cursor-pointer transition-all ${
                  dragOver
                    ? 'border-green-500 bg-green-500/10'
                    : 'dark:border-white/10 border-gray-200 hover:border-green-500/50 hover:bg-green-500/5'
                }`}
              >
                <Upload size={24} className={`mb-2 ${dragOver ? 'text-green-400' : 'dark:text-white/20 text-gray-300'}`} />
                <p className="text-sm dark:text-white/40 text-gray-500">
                  Excel-Datei hierher ziehen oder <span className="text-green-500 font-medium">klicken</span>
                </p>
                <p className="text-xs dark:text-white/20 text-gray-400 mt-1">.xlsx-Format</p>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept=".xlsx,.xls"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) void handleFile(file);
                  e.target.value = '';
                }}
              />
            </div>
          )}

          {/* Ergebnis-Vorschau */}
          {result && !imported && (
            <div className="rounded-xl border dark:border-white/[0.06] border-gray-100 p-4 space-y-3">
              <h3 className="text-sm font-semibold dark:text-white/70 text-gray-700">
                3. Vorschau & Import
              </h3>

              {/* Zusammenfassung */}
              <div className="flex gap-4 text-xs">
                <span className="dark:text-white/40 text-gray-500">
                  Zeilen gelesen: <strong className="dark:text-white/70 text-gray-700">{result.totalRows}</strong>
                </span>
                <span className="text-green-500">
                  Gültig: <strong>{result.members.length}</strong>
                </span>
                {result.errors.length > 0 && (
                  <span className="text-red-400">
                    Fehler: <strong>{result.errors.length}</strong>
                  </span>
                )}
              </div>

              {/* Fehler */}
              {result.errors.length > 0 && (
                <div className="space-y-1 max-h-32 overflow-auto">
                  {result.errors.map((err, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-red-400 bg-red-500/5 rounded-lg p-2">
                      <AlertCircle size={12} className="shrink-0 mt-0.5" />
                      <span>
                        {err.row > 0 && `Zeile ${err.row}: `}{err.message}
                      </span>
                    </div>
                  ))}
                </div>
              )}

              {/* Vorschau-Tabelle */}
              {result.members.length > 0 && (
                <div className="overflow-auto max-h-48 rounded-lg border dark:border-white/[0.06] border-gray-100">
                  <table className="w-full text-xs">
                    <thead>
                      <tr className="dark:bg-white/[0.03] bg-gray-50">
                        <th className="text-left p-2 font-semibold dark:text-white/50 text-gray-500">Name</th>
                        <th className="text-left p-2 font-semibold dark:text-white/50 text-gray-500">E-Mail</th>
                        <th className="text-left p-2 font-semibold dark:text-white/50 text-gray-500">Position</th>
                        <th className="text-left p-2 font-semibold dark:text-white/50 text-gray-500">Abteilung</th>
                      </tr>
                    </thead>
                    <tbody>
                      {result.members.slice(0, 10).map((m, i) => (
                        <tr key={i} className="border-t dark:border-white/[0.04] border-gray-100">
                          <td className="p-2 dark:text-white/70 text-gray-700">{m.name}</td>
                          <td className="p-2 dark:text-white/50 text-gray-500">{m.email}</td>
                          <td className="p-2 dark:text-white/50 text-gray-500">{m.role}</td>
                          <td className="p-2 dark:text-white/50 text-gray-500">{m.department}</td>
                        </tr>
                      ))}
                      {result.members.length > 10 && (
                        <tr>
                          <td colSpan={4} className="p-2 text-center dark:text-white/30 text-gray-400">
                            ... und {result.members.length - 10} weitere
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}

              {/* Import-Button */}
              {result.members.length > 0 && (
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors disabled:opacity-50 border-none cursor-pointer"
                >
                  <Upload size={14} />
                  {importing ? 'Importiere...' : `${result.members.length} Mitarbeiter importieren`}
                </button>
              )}
            </div>
          )}

          {/* Erfolg */}
          {imported && result && (
            <div className="flex flex-col items-center py-6 text-center space-y-3">
              <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center">
                <CheckCircle2 size={32} className="text-green-500" />
              </div>
              <h3 className="text-lg font-bold dark:text-white text-gray-900">
                Import erfolgreich!
              </h3>
              <p className="text-sm dark:text-white/40 text-gray-500">
                {result.members.length} Mitarbeiter wurden importiert.
              </p>
              <button
                onClick={onClose}
                className="px-6 py-2 rounded-lg bg-green-500 text-white text-sm font-semibold hover:bg-green-600 transition-colors border-none cursor-pointer"
              >
                Schließen
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
