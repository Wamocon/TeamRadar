'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type AvailabilityStatus,
  type ProjectType,
} from '@/types';
import { ProjectTypeFilter } from '@/components/ui/ProjectTypeFilter';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Users,
  Briefcase,
  BarChart3,
  Eye,
  CalendarDays,
} from 'lucide-react';
import Link from 'next/link';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTH_NAMES_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];

type ViewMode = 'overview' | 'heatmap' | 'projects' | 'absences' | 'consultants';

/* ── Tageskategorien für Beraterübersicht ─────────────── */
type DayCategory =
  | 'vacation'
  | 'sick'
  | 'extern-onsite'
  | 'extern-remote'
  | 'intern-onsite'
  | 'intern-remote'
  | 'available'
  | 'weekend'
  | 'free';

const DAY_CATEGORY_CONFIG: Record<DayCategory, { label: string; short: string; color: string; bg: string }> = {
  'vacation':      { label: 'Urlaub',          short: 'U',  color: '#fff',    bg: '#8b5cf6' },
  'sick':          { label: 'Krank',           short: 'K',  color: '#fff',    bg: '#ec4899' },
  'extern-onsite': { label: 'Vor Ort Extern',  short: 'VE', color: '#fff',    bg: '#f97316' },
  'extern-remote': { label: 'Homeoffice Ext.', short: 'HE', color: '#fff',    bg: '#fb923c' },
  'intern-onsite': { label: 'Vor Ort Intern',  short: 'VI', color: '#fff',    bg: '#6366f1' },
  'intern-remote': { label: 'Homeoffice Int.', short: 'HI', color: '#fff',    bg: '#818cf8' },
  'available':     { label: 'Verfügbar',       short: 'V',  color: '#166534', bg: '#bbf7d0' },
  'weekend':       { label: 'Wochenende',      short: '',   color: '#9ca3af', bg: 'rgba(156,163,175,0.15)' },
  'free':          { label: 'Kein Status',     short: '',   color: '#d1d5db', bg: 'transparent' },
};

const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

export default function YearOverviewPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const availabilities = useAppStore((s) => s.availabilities);
  const allocations = useAppStore((s) => s.allocations);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);

  const [year, setYear] = useState(new Date().getFullYear());
  const [viewMode, setViewMode] = useState<ViewMode>('overview');
  const [selectedMonth, setSelectedMonth] = useState<number | null>(null);
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');
  const [consultantMonth, setConsultantMonth] = useState(new Date().getMonth());

  const activeType = filterType === 'all' ? undefined : filterType;

  const projectTypeCounts = useMemo(() => ({
    internal: projects.filter((p) => p.type === 'internal').length,
    external: projects.filter((p) => p.type === 'external').length,
  }), [projects]);

  const filteredProjects = useMemo(() =>
    filterType === 'all' ? projects : projects.filter((p) => p.type === filterType),
    [projects, filterType]
  );

  // ── Monats-Statistiken ────────────────────────────────
  const monthlyStats = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = getDaysInMonth(year, month);
      // Mittlerer Tag des Monats für Auslastung
      const midDate = formatDate(year, month, Math.floor(daysInMonth / 2));

      // Verfügbarkeiten für diesen Monat
      const monthStart = formatDate(year, month, 1);
      const monthEnd = formatDate(year, month, daysInMonth);
      const monthAvails = availabilities.filter((a) => a.date >= monthStart && a.date <= monthEnd);

      // Status-Verteilung
      const statusCounts: Partial<Record<AvailabilityStatus, number>> = {};
      monthAvails.forEach((a) => { statusCounts[a.status] = (statusCounts[a.status] || 0) + 1; });

      // Durchschnittliche Auslastung
      const avgUtil = members.length > 0
        ? Math.round(members.reduce((sum, m) => sum + getMemberUtilization(m.id, midDate, activeType), 0) / members.length)
        : 0;

      // Aktive Projekte
      const activeProjects = filteredProjects.filter((p) => {
        if (!p.startDate || !p.endDate) return p.status === 'active';
        return p.startDate <= monthEnd && p.endDate >= monthStart;
      });

      // Urlaub & Krank
      const vacationDays = monthAvails.filter((a) => a.status === 'vacation').length;
      const sickDays = monthAvails.filter((a) => a.status === 'sick').length;

      return {
        month,
        statusCounts,
        avgUtil,
        activeProjects,
        totalEntries: monthAvails.length,
        vacationDays,
        sickDays,
        daysInMonth,
      };
    });
  }, [year, members, filteredProjects, availabilities, getMemberUtilization, activeType]);

  // ── Jahres-Gesamtstatistik ────────────────────────────
  const yearStats = useMemo(() => {
    const totalVacation = monthlyStats.reduce((s, m) => s + m.vacationDays, 0);
    const totalSick = monthlyStats.reduce((s, m) => s + m.sickDays, 0);
    const avgUtil = Math.round(monthlyStats.reduce((s, m) => s + m.avgUtil, 0) / 12);
    const uniqueProjects = new Set(monthlyStats.flatMap((m) => m.activeProjects.map((p) => p.id)));
    return { totalVacation, totalSick, avgUtil, totalProjects: uniqueProjects.size };
  }, [monthlyStats]);

  // ── Projekt-Gantt Daten ───────────────────────────────
  const projectGantt = useMemo(() => {
    const yearStart = new Date(year, 0, 1).getTime();
    const yearEnd = new Date(year, 11, 31).getTime();
    const totalMs = yearEnd - yearStart;

    return filteredProjects
      .filter((p) => {
        if (!p.startDate && !p.endDate) return false;
        const pStart = p.startDate ? new Date(p.startDate).getTime() : yearStart;
        const pEnd = p.endDate ? new Date(p.endDate).getTime() : yearEnd;
        return pEnd >= yearStart && pStart <= yearEnd;
      })
      .map((p) => {
        const pStart = Math.max(new Date(p.startDate!).getTime(), yearStart);
        const pEnd = Math.min(new Date(p.endDate!).getTime(), yearEnd);
        const leftPercent = ((pStart - yearStart) / totalMs) * 100;
        const widthPercent = Math.max(1, ((pEnd - pStart) / totalMs) * 100);
        return { project: p, leftPercent, widthPercent };
      })
      .sort((a, b) => a.leftPercent - b.leftPercent);
  }, [filteredProjects, year]);

  // ── Heatmap: Mitarbeiter × Monat (Auslastung) ────────
  const heatmapData = useMemo(() => {
    return members.map((member) => {
      const monthValues = Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = getDaysInMonth(year, month);
        const midDate = formatDate(year, month, Math.floor(daysInMonth / 2));
        return getMemberUtilization(member.id, midDate, activeType);
      });
      return { member, monthValues };
    });
  }, [members, year, getMemberUtilization, activeType]);

  // ── Abwesenheits-Heatmap: Mitarbeiter × Monat ────────
  const absenceData = useMemo(() => {
    return members.map((member) => {
      const monthValues = Array.from({ length: 12 }, (_, month) => {
        const daysInMonth = getDaysInMonth(year, month);
        const monthStart = formatDate(year, month, 1);
        const monthEnd = formatDate(year, month, daysInMonth);
        const absences = availabilities.filter(
          (a) => a.memberId === member.id && a.date >= monthStart && a.date <= monthEnd &&
            ['vacation', 'sick'].includes(a.status)
        );
        return {
          vacation: absences.filter((a) => a.status === 'vacation').length,
          sick: absences.filter((a) => a.status === 'sick').length,
          total: absences.length,
        };
      });
      return { member, monthValues };
    });
  }, [members, year, availabilities]);

  const getUtilColor = (util: number) => {
    if (util === 0) return 'rgba(107, 114, 128, 0.1)';
    if (util <= 50) return 'rgba(34, 197, 94, 0.3)';
    if (util <= 80) return 'rgba(34, 197, 94, 0.6)';
    if (util <= 100) return 'rgba(245, 158, 11, 0.6)';
    return 'rgba(239, 68, 68, 0.7)';
  };

  const getAbsenceColor = (days: number) => {
    if (days === 0) return 'transparent';
    if (days <= 2) return 'rgba(139, 92, 246, 0.2)';
    if (days <= 5) return 'rgba(139, 92, 246, 0.4)';
    return 'rgba(139, 92, 246, 0.7)';
  };

  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  /* ── Beraterübersicht: Tagesmatrix pro Monat ─────────── */
  const getDayCategory = (memberId: string, dateStr: string): DayCategory => {
    const dayOfWeek = new Date(dateStr).getDay();
    if (dayOfWeek === 0 || dayOfWeek === 6) return 'weekend';

    // Verfügbarkeitsstatus prüfen
    const avail = availabilities.find((a) => a.memberId === memberId && a.date === dateStr);
    if (avail?.status === 'vacation') return 'vacation';
    if (avail?.status === 'sick') return 'sick';

    const isRemote = avail?.status === 'remote';

    // Allocations prüfen
    const dayAllocs = allocations.filter(
      (a) => a.memberId === memberId && a.startDate <= dateStr && a.endDate >= dateStr
    );

    if (dayAllocs.length > 0) {
      const hasExternal = dayAllocs.some((a) => {
        const proj = projects.find((p) => p.id === a.projectId);
        return proj?.type === 'external';
      });
      const hasInternal = dayAllocs.some((a) => {
        const proj = projects.find((p) => p.id === a.projectId);
        return proj?.type === 'internal';
      });

      // Extern hat Priorität da abrechnungsrelevant
      if (hasExternal) return isRemote ? 'extern-remote' : 'extern-onsite';
      if (hasInternal) return isRemote ? 'intern-remote' : 'intern-onsite';
    }

    if (avail) return 'available';
    return 'free';
  };

  const consultantData = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, consultantMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = formatDate(year, consultantMonth, d);
      const dayOfWeek = new Date(dateStr).getDay();
      return { day: d, dateStr, weekday: WEEKDAY_SHORT[dayOfWeek], isWeekend: dayOfWeek === 0 || dayOfWeek === 6 };
    });

    const memberRows = members.map((member) => {
      const categories = days.map((d) => getDayCategory(member.id, d.dateStr));
      // Zusammenfassung
      const summary: Partial<Record<DayCategory, number>> = {};
      categories.forEach((c) => {
        if (c !== 'weekend' && c !== 'free') {
          summary[c] = (summary[c] || 0) + 1;
        }
      });
      return { member, categories, summary };
    });

    // Gesamt-Zusammenfassung (über alle Mitarbeiter)
    const totalSummary: Partial<Record<DayCategory, number>> = {};
    memberRows.forEach((row) => {
      Object.entries(row.summary).forEach(([cat, count]) => {
        totalSummary[cat as DayCategory] = (totalSummary[cat as DayCategory] || 0) + count;
      });
    });

    return { days, memberRows, totalSummary, daysInMonth };
  // getDayCategory is stable (depends only on closure state already tracked)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, consultantMonth, members, availabilities, allocations, projects]);

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-cyan-500/20 to-blue-400/20 border border-cyan-500/20 flex items-center justify-center">
              <CalendarRange size={20} className="text-cyan-500" />
            </div>
            Jahresübersicht
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Alles auf einen Blick — Auslastung, Projekte, Abwesenheiten
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear(year - 1)}
            className="p-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
            <ChevronLeft size={16} className="dark:text-white/50 text-gray-600" />
          </button>
          <span className="text-lg font-black dark:text-white text-gray-900 min-w-[60px] text-center">{year}</span>
          <button onClick={() => setYear(year + 1)}
            className="p-2 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
            <ChevronRight size={16} className="dark:text-white/50 text-gray-600" />
          </button>
        </div>
      </div>

      {/* Intern/Extern Filter */}
      <ProjectTypeFilter value={filterType} onChange={setFilterType} counts={projectTypeCounts} />

      {/* Jahr-Zusammenfassung */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
        {[
          { label: 'Ø Auslastung', value: `${yearStats.avgUtil}%`, color: yearStats.avgUtil > 100 ? '#ef4444' : yearStats.avgUtil > 70 ? '#f59e0b' : '#22c55e' },
          { label: 'Projekte', value: yearStats.totalProjects, color: '#6366f1' },
          { label: 'Mitarbeiter', value: members.length, color: '#3b82f6' },
          { label: 'Urlaubstage', value: yearStats.totalVacation, color: '#8b5cf6' },
          { label: 'Kranktage', value: yearStats.totalSick, color: '#ec4899' },
        ].map((stat) => (
          <div key={stat.label} className="card-shimmer rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] dark:text-white/40 text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* View Mode Tabs */}
      <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl w-fit">
        {([
          { mode: 'overview' as ViewMode, label: 'Übersicht', icon: Eye },
          { mode: 'heatmap' as ViewMode, label: 'Auslastung', icon: BarChart3 },
          { mode: 'projects' as ViewMode, label: 'Projekte', icon: Briefcase },
          { mode: 'absences' as ViewMode, label: 'Abwesenheiten', icon: Users },
          { mode: 'consultants' as ViewMode, label: 'Beraterübersicht', icon: CalendarDays },
        ]).map((tab) => (
          <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              viewMode === tab.mode
                ? 'bg-white dark:bg-white/10 text-cyan-600 dark:text-cyan-400 shadow-sm'
                : 'dark:text-white/40 text-gray-500 hover:text-gray-700 dark:hover:text-white/60'
            }`}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═══════════════════════════════════════════════════
          VIEW: Übersicht (12 Monatskarten)
          ═══════════════════════════════════════════════════ */}
      {viewMode === 'overview' && (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {monthlyStats.map((ms) => {
            const isCurrent = ms.month === currentMonth && year === currentYear;
            return (
              <div key={ms.month}
                className={`card-shimmer rounded-xl border p-4 transition-all cursor-pointer hover:scale-[1.02] ${
                  isCurrent ? 'ring-2 ring-cyan-500/30 border-cyan-500/20' : 'border-black/[0.06] dark:border-white/[0.06]'
                }`}
                onClick={() => setSelectedMonth(selectedMonth === ms.month ? null : ms.month)}>
                <div className="flex items-center justify-between mb-3">
                  <span className={`text-sm font-bold ${isCurrent ? 'text-cyan-500' : 'dark:text-white text-gray-900'}`}>
                    {MONTH_NAMES_LONG[ms.month]}
                  </span>
                  {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-cyan-500/10 text-cyan-500 text-[8px] font-bold">JETZT</span>}
                </div>

                {/* Mini-Auslastungsbalken */}
                <div className="mb-2">
                  <div className="flex items-center justify-between mb-0.5">
                    <span className="text-[9px] dark:text-white/30 text-gray-400">Auslastung</span>
                    <span className="text-[10px] font-bold" style={{ color: ms.avgUtil > 100 ? '#ef4444' : ms.avgUtil > 70 ? '#f59e0b' : '#22c55e' }}>
                      {ms.avgUtil}%
                    </span>
                  </div>
                  <div className="h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
                    <div className="h-full rounded-full transition-all"
                      style={{ width: `${Math.min(ms.avgUtil, 100)}%`, background: ms.avgUtil > 100 ? '#ef4444' : ms.avgUtil > 70 ? '#f59e0b' : '#22c55e' }} />
                  </div>
                </div>

                {/* Kennzahlen */}
                <div className="grid grid-cols-3 gap-1 text-center">
                  <div>
                    <div className="text-xs font-bold text-indigo-500">{ms.activeProjects.length}</div>
                    <div className="text-[8px] dark:text-white/25 text-gray-400">Projekte</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-violet-500">{ms.vacationDays}</div>
                    <div className="text-[8px] dark:text-white/25 text-gray-400">Urlaub</div>
                  </div>
                  <div>
                    <div className="text-xs font-bold text-pink-500">{ms.sickDays}</div>
                    <div className="text-[8px] dark:text-white/25 text-gray-400">Krank</div>
                  </div>
                </div>

                {/* Status-Dots für den Monat */}
                {ms.totalEntries > 0 && (
                  <div className="flex gap-0.5 mt-2 flex-wrap">
                    {(Object.entries(ms.statusCounts) as [AvailabilityStatus, number][]).map(([status, count]) => (
                      <div key={status} className="w-2 h-2 rounded-full" title={`${STATUS_CONFIG[status].label}: ${count}`}
                        style={{ background: STATUS_CONFIG[status].color, opacity: Math.min(1, 0.3 + (count / ms.totalEntries) * 0.7) }} />
                    ))}
                  </div>
                )}

                {/* Expanded detail on click */}
                {selectedMonth === ms.month && (
                  <div className="mt-3 pt-3 border-t border-black/[0.06] dark:border-white/[0.06] animate-fade-in">
                    <div className="text-[9px] font-bold dark:text-white/30 text-gray-400 mb-1.5">Projekte im {MONTH_NAMES[ms.month]}</div>
                    {ms.activeProjects.length > 0 ? ms.activeProjects.map((p) => (
                      <Link key={p.id} href={`/projects/${p.id}`}
                        className="flex items-center gap-1.5 py-0.5 text-[10px] dark:text-white/50 text-gray-600 hover:text-blue-500 transition-colors">
                        <div className="w-1.5 h-1.5 rounded-full" style={{ background: PROJECT_TYPE_CONFIG[p.type].color }} />
                        {p.name}
                      </Link>
                    )) : (
                      <span className="text-[10px] dark:text-white/25 text-gray-400">Keine Projekte</span>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW: Auslastungs-Heatmap (Mitarbeiter × Monat)
          ═══════════════════════════════════════════════════ */}
      {viewMode === 'heatmap' && (
        <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="text-left px-3 py-2 font-semibold dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-10">
                  Mitarbeiter
                </th>
                {MONTH_NAMES.map((m, i) => (
                  <th key={m} className={`text-center px-1 py-2 font-semibold min-w-[50px] ${
                    i === currentMonth && year === currentYear ? 'text-cyan-500' : 'dark:text-white/40 text-gray-500'
                  }`}>{m}</th>
                ))}
                <th className="text-center px-2 py-2 font-semibold dark:text-white/40 text-gray-500">Ø</th>
              </tr>
            </thead>
            <tbody>
              {heatmapData.map(({ member, monthValues }) => {
                const avg = Math.round(monthValues.reduce((s, v) => s + v, 0) / 12);
                return (
                  <tr key={member.id} className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium dark:text-white/70 text-gray-700 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900 z-10">
                      {member.name}
                    </td>
                    {monthValues.map((util, i) => (
                      <td key={i} className="text-center px-1 py-1.5">
                        <div className="mx-auto w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold"
                          style={{ background: getUtilColor(util), color: util > 80 ? '#fff' : util > 0 ? '#374151' : '#9ca3af' }}>
                          {util > 0 ? `${util}%` : '–'}
                        </div>
                      </td>
                    ))}
                    <td className="text-center px-2 py-1.5">
                      <span className="text-[10px] font-bold" style={{ color: avg > 100 ? '#ef4444' : avg > 70 ? '#f59e0b' : '#22c55e' }}>
                        {avg}%
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Legende */}
          <div className="px-3 py-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-3 text-[9px] dark:text-white/30 text-gray-400">
            <span>Legende:</span>
            {[
              { label: '0%', bg: 'rgba(107, 114, 128, 0.1)' },
              { label: '≤50%', bg: 'rgba(34, 197, 94, 0.3)' },
              { label: '≤80%', bg: 'rgba(34, 197, 94, 0.6)' },
              { label: '≤100%', bg: 'rgba(245, 158, 11, 0.6)' },
              { label: '>100%', bg: 'rgba(239, 68, 68, 0.7)' },
            ].map((l) => (
              <span key={l.label} className="flex items-center gap-1">
                <span className="w-3 h-3 rounded" style={{ background: l.bg }} />
                {l.label}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW: Projekt-Gantt (Timeline)
          ═══════════════════════════════════════════════════ */}
      {viewMode === 'projects' && (
        <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 overflow-x-auto">
          {/* Monats-Header */}
          <div className="flex items-center mb-4 min-w-[700px]">
            <div className="w-44 shrink-0" />
            <div className="flex-1 flex">
              {MONTH_NAMES.map((m, i) => (
                <div key={m} className={`flex-1 text-center text-[10px] font-semibold ${
                  i === currentMonth && year === currentYear ? 'text-cyan-500' : 'dark:text-white/30 text-gray-400'
                }`}>{m}</div>
              ))}
            </div>
          </div>

          {/* Projekt-Balken */}
          <div className="space-y-2 min-w-[700px]">
            {projectGantt.map(({ project, leftPercent, widthPercent }) => {
              const typeConf = PROJECT_TYPE_CONFIG[project.type];
              const statusConf = PROJECT_STATUS_CONFIG[project.status];
              return (
                <div key={project.id} className="flex items-center gap-2">
                  <div className="w-44 shrink-0 flex items-center gap-2 min-w-0">
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeConf.color }} />
                    <Link href={`/projects/${project.id}`}
                      className="text-[11px] font-medium dark:text-white/60 text-gray-700 truncate hover:text-blue-500 transition-colors">
                      {project.name}
                    </Link>
                  </div>
                  <div className="flex-1 h-7 rounded bg-black/[0.03] dark:bg-white/[0.03] relative">
                    <div className="absolute h-full rounded flex items-center px-2 text-[9px] font-bold text-white overflow-hidden whitespace-nowrap"
                      style={{
                        left: `${leftPercent}%`,
                        width: `${widthPercent}%`,
                        background: `linear-gradient(135deg, ${typeConf.color}, ${typeConf.color}cc)`,
                        minWidth: 4,
                      }}>
                      {widthPercent > 8 && (
                        <span className="truncate">{project.memberIds.length} Berater • {statusConf.label}</span>
                      )}
                    </div>
                    {/* Heute-Marker */}
                    {year === currentYear && (
                      <div className="absolute top-0 h-full w-px bg-red-400/50"
                        style={{ left: `${((new Date().getTime() - new Date(year, 0, 1).getTime()) / (new Date(year, 11, 31).getTime() - new Date(year, 0, 1).getTime())) * 100}%` }} />
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {projectGantt.length === 0 && (
            <div className="text-center py-10 text-sm dark:text-white/30 text-gray-400">
              Keine Projekte in {year} mit Zeitraum definiert.
            </div>
          )}

          {/* Legende */}
          <div className="mt-4 pt-3 border-t border-black/[0.04] dark:border-white/[0.04] flex flex-wrap items-center gap-4 text-[10px] dark:text-white/30 text-gray-400">
            {(Object.entries(PROJECT_TYPE_CONFIG) as [string, { label: string; color: string }][]).map(([, conf]) => (
              <span key={conf.label} className="flex items-center gap-1.5">
                <div className="w-3 h-3 rounded" style={{ background: conf.color }} />
                {conf.label}
              </span>
            ))}
            <span className="flex items-center gap-1.5">
              <div className="w-px h-3 bg-red-400" /> Heute
            </span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW: Abwesenheits-Heatmap (Mitarbeiter × Monat)
          ═══════════════════════════════════════════════════ */}
      {viewMode === 'absences' && (
        <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-x-auto">
          <table className="w-full text-xs min-w-[700px]">
            <thead>
              <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                <th className="text-left px-3 py-2 font-semibold dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-10">
                  Mitarbeiter
                </th>
                {MONTH_NAMES.map((m, i) => (
                  <th key={m} className={`text-center px-1 py-2 font-semibold min-w-[50px] ${
                    i === currentMonth && year === currentYear ? 'text-cyan-500' : 'dark:text-white/40 text-gray-500'
                  }`}>{m}</th>
                ))}
                <th className="text-center px-2 py-2 font-semibold dark:text-white/40 text-gray-500">Σ</th>
              </tr>
            </thead>
            <tbody>
              {absenceData.map(({ member, monthValues }) => {
                const total = monthValues.reduce((s, v) => s + v.total, 0);
                return (
                  <tr key={member.id} className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.02] dark:hover:bg-white/[0.02]">
                    <td className="px-3 py-1.5 font-medium dark:text-white/70 text-gray-700 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900 z-10">
                      {member.name}
                    </td>
                    {monthValues.map((val, i) => (
                      <td key={i} className="text-center px-1 py-1.5">
                        <div className="mx-auto w-10 h-6 rounded flex items-center justify-center text-[10px] font-bold relative"
                          style={{ background: getAbsenceColor(val.total) }}
                          title={`Urlaub: ${val.vacation}, Krank: ${val.sick}`}>
                          {val.total > 0 ? (
                            <span style={{ color: val.total > 5 ? '#fff' : '#8b5cf6' }}>
                              {val.vacation > 0 && <span>🏖️</span>}
                              {val.sick > 0 && <span>🤒</span>}
                              {val.total}
                            </span>
                          ) : (
                            <span className="text-gray-300 dark:text-white/10">–</span>
                          )}
                        </div>
                      </td>
                    ))}
                    <td className="text-center px-2 py-1.5">
                      <span className={`text-[10px] font-bold ${total > 10 ? 'text-violet-500' : 'dark:text-white/40 text-gray-500'}`}>
                        {total}
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {/* Gesamt-Zeile */}
          <div className="px-3 py-2 border-t border-black/[0.04] dark:border-white/[0.04] flex items-center gap-4 text-[9px] dark:text-white/30 text-gray-400">
            <span>🏖️ = Urlaub</span>
            <span>🤒 = Krank</span>
            <span>Zahl = Gesamttage Abwesenheit im Monat</span>
          </div>
        </div>
      )}

      {/* ═══════════════════════════════════════════════════
          VIEW: Beraterübersicht (Tagesmatrix à la Excel)
          ═══════════════════════════════════════════════════ */}
      {viewMode === 'consultants' && (
        <div className="space-y-4">
          {/* Monats-Navigation */}
          <div className="flex items-center gap-2">
            <button onClick={() => setConsultantMonth(Math.max(0, consultantMonth - 1))}
              disabled={consultantMonth === 0}
              className="p-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-30">
              <ChevronLeft size={14} className="dark:text-white/50 text-gray-600" />
            </button>
            <div className="flex gap-1 flex-wrap">
              {MONTH_NAMES.map((m, i) => (
                <button key={m} onClick={() => setConsultantMonth(i)}
                  className={`px-2 py-1 rounded-lg text-[10px] font-semibold transition-all ${
                    consultantMonth === i
                      ? 'bg-cyan-500 text-white shadow-sm'
                      : i === currentMonth && year === currentYear
                        ? 'bg-cyan-500/10 text-cyan-500 border border-cyan-500/30'
                        : 'dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setConsultantMonth(Math.min(11, consultantMonth + 1))}
              disabled={consultantMonth === 11}
              className="p-1.5 rounded-lg border border-black/[0.06] dark:border-white/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-30">
              <ChevronRight size={14} className="dark:text-white/50 text-gray-600" />
            </button>
          </div>

          {/* Monats-Zusammenfassung */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
              .filter(([cat]) => cat !== 'weekend' && cat !== 'free')
              .map(([cat, conf]) => {
                const count = consultantData.totalSummary[cat] || 0;
                if (count === 0) return null;
                return (
                  <div key={cat} className="flex items-center gap-1.5 px-2 py-1 rounded-lg text-[10px] font-semibold"
                    style={{ color: conf.bg, background: `${conf.bg}12` }}>
                    <span className="w-2.5 h-2.5 rounded-sm" style={{ background: conf.bg }} />
                    {conf.label}: {count}
                  </div>
                );
              })}
          </div>

          {/* ── Tagesmatrix ───────────────────────────── */}
          <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-x-auto">
            <table className="w-full text-[10px] border-collapse" style={{ minWidth: `${180 + consultantData.daysInMonth * 28}px` }}>
              <thead>
                {/* Tages-Nummern */}
                <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                  <th className="text-left px-2 py-1.5 font-semibold dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-20 min-w-[160px]"
                    rowSpan={2}>
                    {MONTH_NAMES_LONG[consultantMonth]} {year}
                  </th>
                  {consultantData.days.map((d) => (
                    <th key={d.day}
                      className={`text-center px-0 py-0.5 font-bold min-w-[26px] ${
                        d.isWeekend ? 'dark:text-white/15 text-gray-300' :
                        d.dateStr === new Date().toISOString().slice(0, 10) ? 'text-cyan-500' :
                        'dark:text-white/50 text-gray-600'
                      }`}>
                      {d.day}
                    </th>
                  ))}
                  <th className="text-center px-2 py-1.5 font-semibold dark:text-white/40 text-gray-500 min-w-[40px] sticky right-0 bg-white dark:bg-gray-900 z-20" rowSpan={2}>
                    Σ
                  </th>
                </tr>
                {/* Wochentage */}
                <tr className="border-b border-black/[0.08] dark:border-white/[0.08]">
                  {consultantData.days.map((d) => (
                    <th key={d.day}
                      className={`text-center px-0 py-0.5 font-medium ${
                        d.isWeekend ? 'dark:text-white/15 text-gray-300' : 'dark:text-white/25 text-gray-400'
                      }`}>
                      {d.weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {consultantData.memberRows.map(({ member, categories, summary }) => {
                  const workDays = categories.filter((c) => c !== 'weekend' && c !== 'free').length;
                  return (
                    <tr key={member.id} className="border-b border-black/[0.03] dark:border-white/[0.03] hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                      <td className="px-2 py-1 font-medium dark:text-white/70 text-gray-700 whitespace-nowrap sticky left-0 bg-white dark:bg-gray-900 z-10">
                        <div className="flex flex-col">
                          <span className="text-[11px] font-bold">{member.name}</span>
                          <span className="text-[8px] dark:text-white/25 text-gray-400">{member.department}</span>
                        </div>
                      </td>
                      {categories.map((cat, i) => {
                        const conf = DAY_CATEGORY_CONFIG[cat];
                        const isToday = consultantData.days[i].dateStr === new Date().toISOString().slice(0, 10);
                        return (
                          <td key={i} className="text-center px-0 py-0.5">
                            <div
                              className={`mx-auto w-[22px] h-[20px] rounded-sm flex items-center justify-center text-[8px] font-bold ${
                                isToday ? 'ring-1 ring-cyan-500' : ''
                              }`}
                              style={{
                                background: conf.bg,
                                color: cat === 'free' ? 'transparent' : conf.color,
                              }}
                              title={`${consultantData.days[i].day}. ${MONTH_NAMES_LONG[consultantMonth]} — ${member.name}: ${conf.label}`}
                            >
                              {conf.short}
                            </div>
                          </td>
                        );
                      })}
                      <td className="text-center px-2 py-1 font-bold dark:text-white/50 text-gray-600 sticky right-0 bg-white dark:bg-gray-900 z-10">
                        {workDays}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Legende */}
          <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-3">
            <div className="text-[10px] font-semibold dark:text-white/40 text-gray-500 mb-2">Legende</div>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
                .filter(([cat]) => cat !== 'free')
                .map(([cat, conf]) => (
                  <div key={cat} className="flex items-center gap-1.5 text-[10px] dark:text-white/50 text-gray-600">
                    <div className="w-5 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold"
                      style={{ background: conf.bg, color: conf.color }}>
                      {conf.short}
                    </div>
                    {conf.label}
                  </div>
                ))}
            </div>
          </div>

          {/* Abteilungs-Zusammenfassung */}
          <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
            <h3 className="text-sm font-bold dark:text-white text-gray-900 mb-3">
              Zusammenfassung {MONTH_NAMES_LONG[consultantMonth]} {year}
            </h3>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-black/[0.06] dark:border-white/[0.06]">
                    <th className="text-left px-2 py-1.5 font-semibold dark:text-white/40 text-gray-500">Berater</th>
                    {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
                      .filter(([cat]) => !['weekend', 'free'].includes(cat))
                      .map(([cat, conf]) => (
                        <th key={cat} className="text-center px-1 py-1.5 font-semibold min-w-[40px]"
                          style={{ color: conf.bg }}>
                          <div className="flex flex-col items-center">
                            <span className="text-[9px]">{conf.short}</span>
                          </div>
                        </th>
                      ))}
                    <th className="text-center px-2 py-1.5 font-semibold dark:text-white/40 text-gray-500">Σ Arbeit</th>
                  </tr>
                </thead>
                <tbody>
                  {consultantData.memberRows.map(({ member, summary, categories }) => {
                    const workDays = categories.filter((c) => c !== 'weekend' && c !== 'free').length;
                    return (
                      <tr key={member.id} className="border-b border-black/[0.03] dark:border-white/[0.03]">
                        <td className="px-2 py-1 font-medium dark:text-white/70 text-gray-700">{member.name}</td>
                        {(Object.keys(DAY_CATEGORY_CONFIG) as DayCategory[])
                          .filter((cat) => !['weekend', 'free'].includes(cat))
                          .map((cat) => {
                            const count = summary[cat] || 0;
                            const conf = DAY_CATEGORY_CONFIG[cat];
                            return (
                              <td key={cat} className="text-center px-1 py-1">
                                {count > 0 ? (
                                  <span className="text-[10px] font-bold" style={{ color: conf.bg }}>{count}</span>
                                ) : (
                                  <span className="text-[10px] dark:text-white/10 text-gray-200">–</span>
                                )}
                              </td>
                            );
                          })}
                        <td className="text-center px-2 py-1 font-bold dark:text-white/50 text-gray-600">{workDays}</td>
                      </tr>
                    );
                  })}
                  {/* Gesamt-Zeile */}
                  <tr className="border-t-2 border-black/[0.1] dark:border-white/[0.1] font-bold">
                    <td className="px-2 py-1.5 dark:text-white text-gray-900">Gesamt</td>
                    {(Object.keys(DAY_CATEGORY_CONFIG) as DayCategory[])
                      .filter((cat) => !['weekend', 'free'].includes(cat))
                      .map((cat) => {
                        const count = consultantData.totalSummary[cat] || 0;
                        const conf = DAY_CATEGORY_CONFIG[cat];
                        return (
                          <td key={cat} className="text-center px-1 py-1.5">
                            {count > 0 ? (
                              <span className="text-[10px] font-bold" style={{ color: conf.bg }}>{count}</span>
                            ) : (
                              <span className="text-[10px] dark:text-white/10 text-gray-200">–</span>
                            )}
                          </td>
                        );
                      })}
                    <td className="text-center px-2 py-1.5 text-cyan-500">
                      {consultantData.memberRows.reduce((s, r) => s + r.categories.filter((c) => c !== 'weekend' && c !== 'free').length, 0)}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Auslastungskurve (vereinfachter Sparkline-Balken) */}
      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
        <h3 className="text-sm font-bold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
          <BarChart3 size={14} /> Ø-Auslastung pro Monat
        </h3>
        <div className="flex items-end gap-1 h-24">
          {monthlyStats.map((ms) => {
            const height = Math.max(2, Math.min(100, ms.avgUtil));
            const isCurrent = ms.month === currentMonth && year === currentYear;
            const barColor = ms.avgUtil > 100 ? '#ef4444' : ms.avgUtil > 70 ? '#f59e0b' : '#22c55e';
            return (
              <div key={ms.month} className="flex-1 flex flex-col items-center gap-1">
                <span className="text-[9px] font-bold" style={{ color: barColor }}>{ms.avgUtil}%</span>
                <div className="w-full rounded-t relative" style={{ height: `${height}%`, background: barColor, opacity: isCurrent ? 1 : 0.6 }}>
                  {isCurrent && <div className="absolute -top-1 left-1/2 -translate-x-1/2 w-1.5 h-1.5 rounded-full bg-cyan-500" />}
                </div>
                <span className={`text-[8px] ${isCurrent ? 'text-cyan-500 font-bold' : 'dark:text-white/25 text-gray-400'}`}>
                  {MONTH_NAMES[ms.month]}
                </span>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
