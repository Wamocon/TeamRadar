'use client';
import { useState, useMemo, useCallback, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import { FileDown, FileSpreadsheet, Users, Briefcase, BarChart3, CalendarDays, Upload, Download, CheckCircle, AlertCircle } from 'lucide-react';
import { PROJECT_TYPE_CONFIG, type ProjectType } from '@/types';
import { ProjectTypeFilter } from '@/components/ui/ProjectTypeFilter';
import type { Member, Availability, Team, Project, Allocation } from '@/types';

type ReportType = 'utilization' | 'members' | 'projects' | 'availability';
type ExportFormat = 'csv' | 'json';

interface ImportResult {
  imported: { members: number; availabilities: number; teams: number; projects: number; allocations: number };
  total: { members: number; availabilities: number; teams: number; projects: number; allocations: number };
  errors: string[];
}

export default function ReportsPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const allocations = useAppStore((s) => s.allocations);
  const availabilities = useAppStore((s) => s.availabilities);
  const teams = useAppStore((s) => s.teams);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);
  const getMemberAllocations = useAppStore((s) => s.getMemberAllocations);

  const [selectedReport, setSelectedReport] = useState<ReportType>('utilization');
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');
  const [exportFormat, setExportFormat] = useState<ExportFormat>('csv');

  // Export/Import states (wie AppMonitor)
  const [exporting, setExporting] = useState(false);
  const [importing, setImporting] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importResult, setImportResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const activeType = filterType === 'all' ? undefined : filterType;

  const projectTypeCounts = useMemo(() => ({
    internal: projects.filter((p) => p.type === 'internal').length,
    external: projects.filter((p) => p.type === 'external').length,
  }), [projects]);

  const filteredProjects = useMemo(() =>
    filterType === 'all' ? projects : projects.filter((p) => p.type === filterType),
    [projects, filterType]
  );

  const filteredAllocations = useMemo(() => {
    if (filterType === 'all') return allocations;
    const pids = new Set(filteredProjects.map((p) => p.id));
    return allocations.filter((a) => pids.has(a.projectId));
  }, [allocations, filterType, filteredProjects]);

  // ── Datei-Download Helper ──────────────────────────
  const downloadFile = useCallback((filename: string, content: string, mimeType: string) => {
    const blob = new Blob([content], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  // ── CSV Export ─────────────────────────────────────
  const buildCSV = useCallback((headers: string[], rows: string[][]) => {
    const bom = '\uFEFF';
    return bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
  }, []);

  // ── JSON Export (wie AppMonitor: version + exported_at + Daten) ──
  const handleJsonExport = useCallback(() => {
    setExporting(true);
    setMessage(null);
    try {
      const exportData = {
        version: 1,
        exported_at: new Date().toISOString(),
        app: 'TeamRadar',
        members: members.map(({ id, name, email, role, department, phone, skills, avatarUrl, createdAt }) =>
          ({ id, name, email, role, department, phone, skills, avatarUrl, createdAt })),
        availabilities,
        teams,
        projects,
        allocations,
      };
      const json = JSON.stringify(exportData, null, 2);
      downloadFile(`teamradar-export_${today}.json`, json, 'application/json');
      setMessage({ type: 'success', text: 'JSON-Export heruntergeladen!' });
    } catch {
      setMessage({ type: 'error', text: 'Export fehlgeschlagen' });
    } finally {
      setExporting(false);
    }
  }, [members, availabilities, teams, projects, allocations, today, downloadFile]);

  // ── JSON Import (wie AppMonitor: Validierung + Ergebnis) ──
  const handleImport = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    setImportResult(null);
    setMessage(null);

    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.version || data.app !== 'TeamRadar') {
        setMessage({ type: 'error', text: 'Ungültiges Format: Kein gültiger TeamRadar-Export' });
        return;
      }

      const store = useAppStore.getState();
      const result: ImportResult = {
        imported: { members: 0, availabilities: 0, teams: 0, projects: 0, allocations: 0 },
        total: {
          members: data.members?.length ?? 0,
          availabilities: data.availabilities?.length ?? 0,
          teams: data.teams?.length ?? 0,
          projects: data.projects?.length ?? 0,
          allocations: data.allocations?.length ?? 0,
        },
        errors: [],
      };

      // Members importieren (nur neue)
      const existingMemberIds = new Set(store.members.map((m) => m.id));
      if (Array.isArray(data.members)) {
        for (const m of data.members) {
          if (!m.name || !m.email) { result.errors.push(`Übersprungen: Member ohne Name/E-Mail`); continue; }
          if (existingMemberIds.has(m.id)) { result.errors.push(`${m.name}: existiert bereits`); continue; }
          store.addMember({ name: m.name, email: m.email, role: m.role, department: m.department, phone: m.phone, skills: m.skills });
          result.imported.members++;
        }
      }

      // Teams importieren
      const existingTeamIds = new Set(store.teams.map((t) => t.id));
      if (Array.isArray(data.teams)) {
        for (const t of data.teams) {
          if (!t.name) { result.errors.push(`Übersprungen: Team ohne Name`); continue; }
          if (existingTeamIds.has(t.id)) { result.errors.push(`Team "${t.name}": existiert bereits`); continue; }
          store.addTeam({ name: t.name, description: t.description, memberIds: t.memberIds ?? [] });
          result.imported.teams++;
        }
      }

      // Projects importieren
      const existingProjectIds = new Set(store.projects.map((p) => p.id));
      if (Array.isArray(data.projects)) {
        for (const p of data.projects) {
          if (!p.name) { result.errors.push(`Übersprungen: Projekt ohne Name`); continue; }
          if (existingProjectIds.has(p.id)) { result.errors.push(`Projekt "${p.name}": existiert bereits`); continue; }
          store.addProject({
            name: p.name, type: p.type ?? 'internal', status: p.status ?? 'planned',
            memberIds: p.memberIds ?? [], client: p.client, description: p.description,
            startDate: p.startDate, endDate: p.endDate, budgetHours: p.budgetHours,
          });
          result.imported.projects++;
        }
      }

      // Allocations importieren
      const existingAllocIds = new Set(store.allocations.map((a) => a.id));
      if (Array.isArray(data.allocations)) {
        for (const a of data.allocations) {
          if (!a.memberId || !a.projectId) { result.errors.push(`Übersprungen: Allocation ohne Member/Projekt`); continue; }
          if (existingAllocIds.has(a.id)) continue;
          store.addAllocation({
            memberId: a.memberId, projectId: a.projectId, percentage: a.percentage ?? 100,
            startDate: a.startDate, endDate: a.endDate, note: a.note,
          });
          result.imported.allocations++;
        }
      }

      const totalImported = Object.values(result.imported).reduce((s, v) => s + v, 0);
      const totalAll = Object.values(result.total).reduce((s, v) => s + v, 0);
      setImportResult(result);
      setMessage({ type: 'success', text: `${totalImported} von ${totalAll} Einträgen importiert` });
    } catch {
      setMessage({ type: 'error', text: 'Ungültige JSON-Datei' });
    } finally {
      setImporting(false);
      e.target.value = '';
    }
  }, []);

  // ── CSV Export pro Report-Typ ──────────────────────
  const handleCSVExport = useCallback(() => {
    setExporting(true);
    setMessage(null);
    try {
      const dateStr = new Date().toISOString().slice(0, 10);

      switch (selectedReport) {
        case 'utilization': {
          const typeLabel = filterType === 'all' ? '' : `_${filterType}`;
          const headers = ['Name', 'Rolle', 'Abteilung', 'Auslastung %', 'Projekte', 'Projekt-Details'];
          const rows = members.map((m) => {
            const util = getMemberUtilization(m.id, today, activeType);
            const allocs = getMemberAllocations(m.id, today, activeType);
            const projDetails = allocs.map((a) => {
              const proj = projects.find((p) => p.id === a.projectId);
              return `${proj?.name ?? 'Unbekannt'} (${a.percentage}%)`;
            }).join(' | ');
            return [m.name, m.role, m.department, String(util), String(allocs.length), projDetails];
          });
          downloadFile(`auslastung${typeLabel}_${dateStr}.csv`, buildCSV(headers, rows), 'text/csv;charset=utf-8;');
          break;
        }
        case 'members': {
          const headers = ['Name', 'E-Mail', 'Rolle', 'Abteilung', 'Telefon', 'Skills'];
          const rows = members.map((m) => [
            m.name, m.email, m.role, m.department, m.phone ?? '',
            (m.skills ?? []).map((s) => `${s.name} (${s.level})`).join(' | '),
          ]);
          downloadFile(`mitarbeiter_${dateStr}.csv`, buildCSV(headers, rows), 'text/csv;charset=utf-8;');
          break;
        }
        case 'projects': {
          const typeLabel = filterType === 'all' ? '' : `_${filterType}`;
          const headers = ['Projekt', 'Typ', 'Status', 'Kunde', 'Start', 'Ende', 'Mitarbeiter', 'Gesamtauslastung %'];
          const rows = filteredProjects.map((p) => {
            const projAllocs = filteredAllocations.filter((a) => a.projectId === p.id);
            const totalPercent = projAllocs.reduce((s, a) => s + a.percentage, 0);
            return [
              p.name, PROJECT_TYPE_CONFIG[p.type].label, p.status, p.client ?? '', p.startDate ?? '', p.endDate ?? '',
              String(p.memberIds.length), String(totalPercent),
            ];
          });
          downloadFile(`projekte${typeLabel}_${dateStr}.csv`, buildCSV(headers, rows), 'text/csv;charset=utf-8;');
          break;
        }
        case 'availability': {
          const headers = ['Mitarbeiter', 'Datum', 'Status', 'Von', 'Bis', 'Notiz'];
          const rows = [...availabilities]
            .sort((a, b) => a.date.localeCompare(b.date))
            .map((a) => {
              const member = members.find((m) => m.id === a.memberId);
              return [
                member?.name ?? 'Unbekannt', a.date, a.status,
                a.startTime ?? '', a.endTime ?? '', a.note ?? '',
              ];
            });
          downloadFile(`verfuegbarkeit_${dateStr}.csv`, buildCSV(headers, rows), 'text/csv;charset=utf-8;');
          break;
        }
      }
      setMessage({ type: 'success', text: 'CSV-Export heruntergeladen!' });
    } catch {
      setMessage({ type: 'error', text: 'Export fehlgeschlagen' });
    } finally {
      setExporting(false);
    }
  }, [selectedReport, members, filteredProjects, filteredAllocations, availabilities, getMemberUtilization, getMemberAllocations, today, activeType, downloadFile, buildCSV, projects, filterType]);

  const handleExport = useCallback(() => {
    if (exportFormat === 'json') handleJsonExport();
    else handleCSVExport();
  }, [exportFormat, handleJsonExport, handleCSVExport]);

  // Preview data
  const previewData = useMemo(() => {
    switch (selectedReport) {
      case 'utilization':
        return members.slice(0, 8).map((m) => ({
          name: m.name,
          dept: m.department,
          util: getMemberUtilization(m.id, today, activeType),
          projects: getMemberAllocations(m.id, today, activeType).length,
        }));
      case 'members':
        return members.slice(0, 8).map((m) => ({
          name: m.name,
          role: m.role,
          dept: m.department,
          skills: (m.skills ?? []).length,
        }));
      case 'projects':
        return filteredProjects.slice(0, 8).map((p) => ({
          name: p.name,
          type: PROJECT_TYPE_CONFIG[p.type].label,
          status: p.status,
          members: p.memberIds.length,
        }));
      case 'availability':
        return availabilities.slice(0, 8).map((a) => ({
          member: members.find((m) => m.id === a.memberId)?.name ?? '?',
          date: a.date,
          status: a.status,
        }));
      default:
        return [];
    }
  }, [selectedReport, members, filteredProjects, availabilities, getMemberUtilization, getMemberAllocations, today, activeType]);

  const reportTypes: { type: ReportType; label: string; desc: string; icon: typeof Users; count: number }[] = [
    { type: 'utilization', label: 'Auslastung', desc: 'Kapazität & Projektzuweisungen pro Mitarbeiter', icon: BarChart3, count: members.length },
    { type: 'members', label: 'Mitarbeiter', desc: 'Stammdaten, Rollen und Skills', icon: Users, count: members.length },
    { type: 'projects', label: 'Projekte', desc: 'Projektliste mit Status und Zuweisungen', icon: Briefcase, count: filteredProjects.length },
    { type: 'availability', label: 'Verfügbarkeit', desc: 'Alle Status-Einträge als Zeitleiste', icon: CalendarDays, count: availabilities.length },
  ];

  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-500/20 to-pink-400/20 border border-violet-500/20 flex items-center justify-center">
            <FileDown size={20} className="text-violet-500" />
          </div>
          Reports & Export
        </h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
          Daten exportieren, importieren und als Report herunterladen
        </p>
      </div>

      {/* Feedback-Meldung (wie AppMonitor) */}
      {message && (
        <div className={`flex items-center gap-2 p-3 rounded-xl text-sm transition-all ${
          message.type === 'success'
            ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20'
            : 'bg-red-500/10 text-red-500 border border-red-500/20'
        }`}>
          {message.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {message.text}
          <button onClick={() => setMessage(null)} className="ml-auto text-current opacity-40 hover:opacity-100 transition-opacity">✕</button>
        </div>
      )}

      {/* ═══ Export & Import (wie AppMonitor Settings) ═══ */}
      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06]">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06]">
          <h2 className="text-sm font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <Download size={14} className="text-cyan-500" /> Daten-Export & Import
          </h2>
          <p className="text-[10px] dark:text-white/30 text-gray-400 mt-1">
            Exportiere alle TeamRadar-Daten als JSON oder importiere aus einer früheren Sicherung.
          </p>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex flex-wrap gap-3">
            <button onClick={handleJsonExport} disabled={exporting}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all disabled:opacity-50 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white border-black/[0.06] hover:border-cyan-500/30 hover:bg-cyan-500/5">
              <Download size={14} />
              {exporting ? 'Exportiere...' : 'Komplett-Export (JSON)'}
            </button>
            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer disabled:opacity-50 dark:bg-white/[0.03] dark:border-white/[0.06] dark:text-white border-black/[0.06] hover:border-violet-500/30 hover:bg-violet-500/5">
              <Upload size={14} />
              {importing ? 'Importiere...' : 'Daten importieren'}
              <input ref={fileInputRef} type="file" accept=".json,application/json" className="hidden" onChange={handleImport} disabled={importing} />
            </label>
          </div>

          {/* Import-Ergebnis (wie AppMonitor) */}
          {importResult && (
            <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 space-y-2">
              <div className="text-xs font-bold dark:text-white text-gray-900">Import-Ergebnis</div>
              <div className="grid grid-cols-5 gap-2 text-center">
                {([['Members', importResult.imported.members, importResult.total.members],
                  ['Teams', importResult.imported.teams, importResult.total.teams],
                  ['Projekte', importResult.imported.projects, importResult.total.projects],
                  ['Zuweisungen', importResult.imported.allocations, importResult.total.allocations],
                  ['Verfügb.', importResult.imported.availabilities, importResult.total.availabilities],
                ] as [string, number, number][]).map(([label, imp, total]) => (
                  <div key={label}>
                    <div className="text-sm font-black" style={{ color: imp > 0 ? '#22c55e' : '#6b7280' }}>{imp}/{total}</div>
                    <div className="text-[9px] dark:text-white/30 text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
              {importResult.errors.length > 0 && (
                <div className="mt-2 rounded-lg bg-amber-500/5 border border-amber-500/10 p-2.5 space-y-0.5">
                  <div className="text-[10px] font-semibold text-amber-500">Hinweise:</div>
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <div key={i} className="text-[10px] dark:text-amber-400/70 text-amber-600">{err}</div>
                  ))}
                  {importResult.errors.length > 10 && (
                    <div className="text-[10px] dark:text-amber-400/50 text-amber-500">
                      … und {importResult.errors.length - 10} weitere
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Intern/Extern Filter */}
      <ProjectTypeFilter value={filterType} onChange={setFilterType} counts={projectTypeCounts} />

      {/* Report Type Selection */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {reportTypes.map((rt) => (
          <button key={rt.type} onClick={() => setSelectedReport(rt.type)}
            className={`card-shimmer rounded-xl p-4 text-left transition-all ${
              selectedReport === rt.type
                ? 'ring-2 ring-violet-500/40 border-violet-500/20'
                : 'hover:border-violet-500/10'
            }`}>
            <rt.icon size={16} className={selectedReport === rt.type ? 'text-violet-500' : 'dark:text-white/30 text-gray-400'} />
            <div className="text-sm font-bold dark:text-white text-gray-900 mt-2">{rt.label}</div>
            <div className="text-[10px] dark:text-white/30 text-gray-400 mt-0.5">{rt.desc}</div>
            <div className="text-xs font-bold text-violet-500 mt-2">{rt.count} Einträge</div>
          </button>
        ))}
      </div>

      {/* Preview Table */}
      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        <div className="p-4 border-b border-black/[0.06] dark:border-white/[0.06] flex items-center justify-between">
          <h2 className="text-sm font-bold dark:text-white text-gray-900 flex items-center gap-2">
            <FileSpreadsheet size={14} /> Vorschau
          </h2>
          <span className="text-[10px] dark:text-white/30 text-gray-400">Erste 8 Einträge</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className="border-b border-black/[0.04] dark:border-white/[0.04]">
                {selectedReport === 'utilization' && (
                  <>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Name</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Abteilung</th>
                    <th className="text-right px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Auslastung</th>
                    <th className="text-right px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Projekte</th>
                  </>
                )}
                {selectedReport === 'members' && (
                  <>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Name</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Rolle</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Abteilung</th>
                    <th className="text-right px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Skills</th>
                  </>
                )}
                {selectedReport === 'projects' && (
                  <>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Projekt</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Typ</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Status</th>
                    <th className="text-right px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Mitarbeiter</th>
                  </>
                )}
                {selectedReport === 'availability' && (
                  <>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Mitarbeiter</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Datum</th>
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500">Status</th>
                  </>
                )}
              </tr>
            </thead>
            <tbody>
              {previewData.map((row, i) => (
                <tr key={i} className="border-b border-black/[0.03] dark:border-white/[0.03]">
                  {Object.values(row).map((val, j) => (
                    <td key={j} className={`px-4 py-2 dark:text-white/60 text-gray-700 ${j >= Object.keys(row).length - 1 ? 'text-right font-bold' : ''}`}>
                      {String(val)}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Export Controls */}
      <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
        {/* Format-Toggle */}
        <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl">
          {(['csv', 'json'] as ExportFormat[]).map((fmt) => (
            <button key={fmt} onClick={() => setExportFormat(fmt)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                exportFormat === fmt
                  ? 'bg-white dark:bg-white/10 text-violet-600 dark:text-violet-400 shadow-sm'
                  : 'dark:text-white/40 text-gray-500 hover:text-gray-700 dark:hover:text-white/60'
              }`}>
              {fmt === 'csv' ? '📊 CSV' : '📦 JSON'}
            </button>
          ))}
        </div>

        <button onClick={handleExport} disabled={exporting}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold hover:from-violet-600 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/20 disabled:opacity-50">
          <FileDown size={18} />
          {exporting
            ? 'Exportiere...'
            : exportFormat === 'json'
              ? 'Komplett-Export als JSON'
              : `${reportTypes.find((r) => r.type === selectedReport)?.label}-Report als CSV`
          }
        </button>
      </div>
    </div>
  );
}
