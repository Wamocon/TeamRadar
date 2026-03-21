'use client';
import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { FileDown, FileSpreadsheet, Users, Briefcase, BarChart3, CalendarDays } from 'lucide-react';
import { PROJECT_TYPE_CONFIG, type ProjectType } from '@/types';
import { ProjectTypeFilter } from '@/components/ui/ProjectTypeFilter';

type ReportType = 'utilization' | 'members' | 'projects' | 'availability';

export default function ReportsPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const allocations = useAppStore((s) => s.allocations);
  const availabilities = useAppStore((s) => s.availabilities);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);
  const getMemberAllocations = useAppStore((s) => s.getMemberAllocations);

  const [selectedReport, setSelectedReport] = useState<ReportType>('utilization');
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');

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

  const downloadCSV = useCallback((filename: string, headers: string[], rows: string[][]) => {
    const bom = '\uFEFF';
    const csvContent = bom + [headers.join(';'), ...rows.map((r) => r.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = filename;
    link.click();
    URL.revokeObjectURL(url);
  }, []);

  const handleExport = useCallback(() => {
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
        downloadCSV(`auslastung${typeLabel}_${dateStr}.csv`, headers, rows);
        break;
      }
      case 'members': {
        const headers = ['Name', 'E-Mail', 'Rolle', 'Abteilung', 'Telefon', 'Skills'];
        const rows = members.map((m) => [
          m.name, m.email, m.role, m.department, m.phone ?? '',
          (m.skills ?? []).map((s) => `${s.name} (${s.level})`).join(' | '),
        ]);
        downloadCSV(`mitarbeiter_${dateStr}.csv`, headers, rows);
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
        downloadCSV(`projekte${typeLabel}_${dateStr}.csv`, headers, rows);
        break;
      }
      case 'availability': {
        const headers = ['Mitarbeiter', 'Datum', 'Status', 'Von', 'Bis', 'Notiz'];
        const rows = availabilities
          .sort((a, b) => a.date.localeCompare(b.date))
          .map((a) => {
            const member = members.find((m) => m.id === a.memberId);
            return [
              member?.name ?? 'Unbekannt', a.date, a.status,
              a.startTime ?? '', a.endTime ?? '', a.note ?? '',
            ];
          });
        downloadCSV(`verfuegbarkeit_${dateStr}.csv`, headers, rows);
        break;
      }
    }
  }, [selectedReport, members, filteredProjects, filteredAllocations, availabilities, getMemberUtilization, getMemberAllocations, today, activeType, downloadCSV, projects, filterType]);

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
          Daten als CSV exportieren für Management-Reports
        </p>
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

      {/* Export Button */}
      <div className="flex justify-center">
        <button onClick={handleExport}
          className="flex items-center gap-2 px-6 py-3 rounded-xl bg-gradient-to-r from-violet-500 to-violet-600 text-white font-bold hover:from-violet-600 hover:to-violet-700 transition-all shadow-lg shadow-violet-500/20">
          <FileDown size={18} />
          {reportTypes.find((r) => r.type === selectedReport)?.label}-Report als CSV exportieren
        </button>
      </div>
    </div>
  );
}
