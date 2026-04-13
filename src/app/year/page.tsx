'use client';
import { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  STATUS_CONFIG,
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type AvailabilityStatus,
  type ProjectType,
  type Project,
} from '@/types';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  Briefcase,
  Eye,
  CalendarDays,
  X,
  ExternalLink,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  Clock,
  MapPin,
} from 'lucide-react';
import Link from 'next/link';
import { getHolidays, BUNDESLAENDER, type Bundesland, type Holiday, getHolidayStatesLabel } from '@/lib/holidays';

const MONTH_NAMES = ['Jan', 'Feb', 'Mär', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTH_NAMES_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

type ViewMode = 'overview' | 'projects' | 'entry';

type DayCategory =
  | 'vacation' | 'sick' | 'extern-onsite' | 'extern-remote'
  | 'intern-onsite' | 'intern-remote' | 'available' | 'weekend' | 'free';

const DAY_CATEGORY_CONFIG: Record<DayCategory, { label: string; short: string; color: string; bg: string }> = {
  vacation:      { label: 'Urlaub',             short: 'U',   color: '#fff',    bg: '#8b5cf6' },
  sick:          { label: 'Krank',              short: 'K',   color: '#fff',    bg: '#ec4899' },
  'extern-onsite':{ label: 'Ext. Projekt (eP)', short: 'eP',  color: '#fff',    bg: '#f97316' },
  'extern-remote':{ label: 'Büro ext. (BeP)',   short: 'BeP', color: '#fff',    bg: '#fb923c' },
  'intern-onsite':{ label: 'Büro intern (B)',   short: 'B',   color: '#fff',    bg: '#6366f1' },
  'intern-remote':{ label: 'Homeoffice (H)',    short: 'H',   color: '#fff',    bg: '#06b6d4' },
  available:     { label: 'Verfügbar',          short: 'V',   color: '#166534', bg: '#bbf7d0' },
  weekend:       { label: 'Wochenende',         short: '',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  free:          { label: 'Kein Status',        short: '',    color: '#d1d5db', bg: 'transparent' },
};

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}
function formatDateDisplay(dateStr: string) {
  const d = new Date(dateStr);
  return `${d.getDate()}. ${MONTH_NAMES_LONG[d.getMonth()]} ${d.getFullYear()}`;
}

export default function YearOverviewPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const availabilities = useAppStore((s) => s.availabilities);
  const allocations = useAppStore((s) => s.allocations);
  const addAvailability = useAppStore((s) => s.addAvailability);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const userProfile = useAppStore((s) => s.userProfile);

  const [year, setYear] = useState(new Date().getFullYear());
  const [bundesland, setBundesland] = useState<Bundesland>('ALL');
  const [viewMode, setViewMode] = useState<ViewMode>('overview');

  // Bundesland aus localStorage laden
  useEffect(() => {
    const stored = typeof window !== 'undefined' ? localStorage.getItem('tr-bundesland') as Bundesland | null : null;
    if (stored && stored in BUNDESLAENDER) setBundesland(stored);
  }, []);

  const handleBundeslandChange = (bl: Bundesland) => {
    setBundesland(bl);
    if (typeof window !== 'undefined') localStorage.setItem('tr-bundesland', bl);
  };

  // Feiertage für aktuelles Jahr + Bundesland
  const holidays = useMemo(() => getHolidays(year, bundesland), [year, bundesland]);
  const [filterType] = useState<'all' | ProjectType>('all');
  const [quickStatus, setQuickStatus] = useState<{ memberId: string; date: string } | null>(null);
  const [entryMonth, setEntryMonth] = useState(new Date().getMonth());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bulkFill, setBulkFill] = useState<{ month: number; year: number } | null>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const bulkRef = useRef<HTMLDivElement>(null);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  // Close quick picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickStatus(null);
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) {
        setBulkFill(null);
      }
    };
    if (quickStatus || bulkFill) document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [quickStatus, bulkFill]);

  // ── getDayCategory ────────────────────────────────────
  const getDayCategory = useCallback((memberId: string, dateStr: string): DayCategory => {
    const dow = new Date(dateStr).getDay();
    if (dow === 0 || dow === 6) return 'weekend';

    const avail = [...availabilities].reverse().find((a) => a.memberId === memberId && a.date === dateStr);
    if (avail?.status === 'vacation') return 'vacation';
    if (avail?.status === 'sick') return 'sick';
    if (avail?.status === 'extern-onsite') return 'extern-onsite';
    if (avail?.status === 'extern-remote') return 'extern-remote';
    const isRemote = avail?.status === 'remote';

    const dayAllocs = allocations.filter(
      (a) => a.memberId === memberId && a.startDate <= dateStr && a.endDate >= dateStr
    );
    if (dayAllocs.length > 0) {
      const hasExt = dayAllocs.some((a) => projects.find((p) => p.id === a.projectId)?.type === 'external');
      const hasInt = dayAllocs.some((a) => projects.find((p) => p.id === a.projectId)?.type === 'internal');
      if (hasExt) return isRemote ? 'extern-remote' : 'extern-onsite';
      if (hasInt) return isRemote ? 'intern-remote' : 'intern-onsite';
    }
    if (avail?.status === 'remote') return 'intern-remote';
    if (avail?.status === 'busy' || avail?.status === 'meeting') return 'intern-onsite';
    if (avail?.status === 'offline') return 'free';
    return 'free';
  }, [availabilities, allocations, projects]);

  // ── canEditRow ── Nur eigener Account darf bearbeitet werden ───────
  // member.userId speichert die Eigentümer-UUID (RLS), nicht die persönliche Auth-ID.
  // Stattdessen: E-Mail-Vergleich mit dem eingeloggten UserProfile.
  const canEditRow = useCallback((memberEmail: string) => {
    if (!userProfile?.email || !memberEmail) return false;
    return userProfile.email.toLowerCase() === memberEmail.toLowerCase();
  }, [userProfile]);

  // ── Yearly matrix data (all 12 months) ───────────────
  const yearlyMatrixData = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = getDaysInMonth(year, month);
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const dateStr = formatDate(year, month, d);
        const dow = new Date(dateStr).getDay();
        const isWeekend = dow === 0 || dow === 6;
        const holiday = !isWeekend ? (holidays.get(dateStr) ?? null) : null;
        return { day: d, dateStr, weekday: WEEKDAY_SHORT[dow], isWeekend, holiday };
      });
      const memberRows = members.map((member) => {
        const categories = days.map((d) => getDayCategory(member.id, d.dateStr));
        return { member, categories };
      });
      return { month, days, memberRows };
    });
  }, [year, members, getDayCategory]);

  // ── Member Year KPIs ──────────────────────────────────
  const memberYearKPIs = useMemo(() => {
    return members.map((member) => {
      let extDays = 0, intDays = 0, sickDays = 0, vacationDays = 0;
      yearlyMatrixData.forEach(({ memberRows }) => {
        const row = memberRows.find((r) => r.member.id === member.id);
        row?.categories.forEach((cat) => {
          if (cat === 'vacation') vacationDays++;
          else if (cat === 'sick') sickDays++;
          else if (cat === 'extern-onsite' || cat === 'extern-remote') extDays++;
          else if (cat === 'intern-onsite' || cat === 'intern-remote') intDays++;
        });
      });
      return { member, extDays, intDays, sickDays, vacationDays };
    });
  }, [yearlyMatrixData, members]);

  // ── Entry month data ──────────────────────────────────
  const entryData = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, entryMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = formatDate(year, entryMonth, d);
      const dow = new Date(dateStr).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const holiday = !isWeekend ? (holidays.get(dateStr) ?? null) : null;
      return { day: d, dateStr, weekday: WEEKDAY_SHORT[dow], isWeekend, holiday };
    });
    const memberRows = members.map((member) => {
      const categories = days.map((d) => getDayCategory(member.id, d.dateStr));
      const summary: Partial<Record<DayCategory, number>> = {};
      categories.forEach((c) => { if (c !== 'weekend' && c !== 'free') summary[c] = (summary[c] || 0) + 1; });
      return { member, categories, summary };
    });
    const totalSummary: Partial<Record<DayCategory, number>> = {};
    memberRows.forEach(({ summary }) => {
      Object.entries(summary).forEach(([c, n]) => { totalSummary[c as DayCategory] = (totalSummary[c as DayCategory] || 0) + n; });
    });
    return { days, memberRows, totalSummary, daysInMonth };
  }, [year, entryMonth, members, getDayCategory]);

  // ── Project Gantt ─────────────────────────────────────
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year, 11, 31).getTime();
  const totalMs = yearEnd - yearStart;

  const projectGantt = useMemo(() => {
    return projects
      .filter((p) => filterType === 'all' || p.type === filterType)
      .filter((p) => {
        if (!p.startDate && !p.endDate) return false;
        const ps = p.startDate ? new Date(p.startDate).getTime() : yearStart;
        const pe = p.endDate ? new Date(p.endDate).getTime() : yearEnd;
        return pe >= yearStart && ps <= yearEnd;
      })
      .map((p) => {
        const ps = Math.max(new Date(p.startDate!).getTime(), yearStart);
        const pe = Math.min(new Date(p.endDate!).getTime(), yearEnd);
        return { project: p, leftPercent: ((ps - yearStart) / totalMs) * 100, widthPercent: Math.max(1, ((pe - ps) / totalMs) * 100) };
      })
      .sort((a, b) => a.leftPercent - b.leftPercent);
  }, [projects, filterType, year, yearStart, yearEnd, totalMs]);

  const internalProjects = projects.filter((p) => p.type === 'internal');
  const externalProjects = projects.filter((p) => p.type === 'external');

  // ── Status Picker ─────────────────────────────────────
  const STATUS_PICKER_OPTIONS: { key: AvailabilityStatus; cat: DayCategory }[] = [
    { key: 'vacation',      cat: 'vacation' },
    { key: 'sick',          cat: 'sick' },
    { key: 'extern-onsite', cat: 'extern-onsite' },
    { key: 'extern-remote', cat: 'extern-remote' },
    { key: 'busy',          cat: 'intern-onsite' },
    { key: 'remote',        cat: 'intern-remote' },
    { key: 'offline',       cat: 'free' },
  ];

  const handleSetStatus = (memberId: string, date: string, status: AvailabilityStatus) => {
    addAvailability({ memberId, date, status });
    setQuickStatus(null);
  };

  const handleBulkFillMonth = (month: number, yr: number, status: AvailabilityStatus) => {
    if (!userProfile) return;
    // Bulk-Fill nur für den eigenen Account – nie für andere Mitarbeiter
    const ownMember = members.find((m) => m.userId === userProfile.id);
    if (!ownMember) return;
    const daysInMonth = getDaysInMonth(yr, month);
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(yr, month, d);
      const dow = new Date(dateStr).getDay();
      if (dow !== 0 && dow !== 6) {
        addAvailability({ memberId: ownMember.id, date: dateStr, status });
      }
    }
    setBulkFill(null);
  };

  // ── Day Cell Component ────────────────────────────────
  const DayCell = ({ memberId, memberEmail, dateStr, category, isWeekend, dayNum, holiday }: {
    memberId: string; memberEmail: string; dateStr: string;
    category: DayCategory; isWeekend: boolean; dayNum: number; holiday: Holiday | null;
  }) => {
    const conf = DAY_CATEGORY_CONFIG[category];
    const isToday = dateStr === today;
    const isSelected = quickStatus?.memberId === memberId && quickStatus?.date === dateStr;
    const editable = !isWeekend && canEditRow(memberEmail);

    // Wochenende: schlichter grauer Streifen, keine Interaktion
    if (isWeekend) {
      return (
        <td className="p-0" style={{ background: 'rgba(156,163,175,0.07)' }}>
          <div className="w-full h-7" />
        </td>
      );
    }

    const isHoliday = !!holiday;
    const cellBg = isHoliday && category === 'free' ? 'rgba(239,68,68,0.09)' : conf.bg;
    const cellShadow = isHoliday && category === 'free'
      ? 'inset 0 0 0 1px rgba(239,68,68,0.35)'
      : category !== 'free' ? 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)';
    const titleText = isHoliday
      ? `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} — 🎉 ${holiday!.name}${getHolidayStatesLabel(holiday!) ? ` (${getHolidayStatesLabel(holiday!)})` : ''}${category !== 'free' ? ` · ${conf.label}` : ''}`
      : `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} — ${conf.label}`;

    return (
      <td className="text-center relative p-0.5">
        <button
          disabled={!editable}
          onClick={() => editable && setQuickStatus(isSelected ? null : { memberId, date: dateStr })}
          className={`w-7 h-7 rounded flex items-center justify-center text-[8px] font-bold transition-all mx-auto relative ${
            isToday ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
          } ${editable ? 'hover:scale-105 hover:brightness-110 cursor-pointer' : 'cursor-default'} border-none`}
          style={{
            background: cellBg,
            color: category === 'free' ? 'transparent' : conf.color,
            boxShadow: cellShadow,
          }}
          title={titleText}
        >
          {conf.short}
          {isHoliday && (
            <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
          )}
        </button>

        {isSelected && (
          <div ref={quickRef} className="absolute top-full left-0 mt-1 z-50 bg-white dark:bg-gray-900 shadow-2xl border dark:border-white/10 border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1 min-w-[160px]"
            onClick={e => e.stopPropagation()}>
            {STATUS_PICKER_OPTIONS.map(({ key, cat }) => {
              const c = DAY_CATEGORY_CONFIG[cat];
              return (
                <button key={key} onClick={() => handleSetStatus(memberId, dateStr, key)}
                  className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-left hover:bg-gray-50 dark:hover:bg-white/5 border-none cursor-pointer w-full transition-colors bg-transparent dark:text-white/70 text-gray-700">
                  <div className="w-3 h-3 rounded-sm shrink-0 flex items-center justify-center text-[6px] font-bold"
                    style={{ background: c.bg, color: c.color }}>{c.short}</div>
                  {c.label.replace(/ \(.*\)/, '')}
                </button>
              );
            })}
            <button onClick={() => setQuickStatus(null)}
              className="col-span-2 pt-1 text-[8px] font-bold uppercase tracking-wide text-gray-400 hover:text-gray-600 border-none cursor-pointer bg-transparent text-center">
              Schließen
            </button>
          </div>
        )}
      </td>
    );
  };

  // ── Month Matrix Component ────────────────────────────
  const MonthMatrix = ({ monthData }: { monthData: typeof yearlyMatrixData[0] }) => {
    const { month, days, memberRows } = monthData;
    const isCurrent = month === currentMonth && year === currentYear;

    return (
      <div className={`card-shimmer rounded-xl border overflow-hidden ${isCurrent ? 'border-[var(--primary)]/30 ring-1 ring-[var(--primary)]/20' : 'border-black/10 dark:border-white/10'}`}>
        <div className={`px-3 py-2 flex items-center justify-between border-b border-black/10 dark:border-white/10 ${isCurrent ? 'bg-[var(--primary-light)]' : ''}`}>
          <span className={`text-sm font-black ${isCurrent ? 'text-[var(--primary)]' : 'dark:text-white text-gray-900'}`}>
            {MONTH_NAMES_LONG[month]} {year}
          </span>
          <div className="flex items-center gap-2">
            {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[8px] font-bold">AKTUELL</span>}
            {/* Bulk-fill button */}
            <div className="relative">
              <button
                onClick={() => setBulkFill(bulkFill?.month === month ? null : { month, year })}
                className="px-2 py-1 rounded-lg text-[9px] font-bold border dark:border-white/10 border-black/10 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] dark:text-white/50 text-gray-500 transition-all bg-transparent cursor-pointer"
                title="Ganzen Monat mit Status füllen"
              >
                Monat füllen ▾
              </button>
              {bulkFill?.month === month && bulkFill?.year === year && (
                <div ref={bulkRef} className="absolute top-full right-0 mt-1 z-50 bg-white dark:bg-gray-900 shadow-2xl border dark:border-white/10 border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1 min-w-[170px]"
                  onClick={(e) => e.stopPropagation()}>
                  <div className="col-span-2 text-[9px] font-black uppercase tracking-wide dark:text-white/40 text-gray-400 px-1 pb-1 border-b dark:border-white/10 border-gray-100 mb-1">
                    Alle Werktage auf:
                  </div>
                  {STATUS_PICKER_OPTIONS.map(({ key, cat }) => {
                    const c = DAY_CATEGORY_CONFIG[cat];
                    return (
                      <button key={key} onClick={() => handleBulkFillMonth(month, year, key)}
                        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-left hover:bg-gray-50 dark:hover:bg-white/5 border-none cursor-pointer w-full transition-colors bg-transparent dark:text-white/70 text-gray-700">
                        <div className="w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold shrink-0"
                          style={{ background: c.bg, color: c.color, boxShadow: 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' }}>{c.short}</div>
                        {c.label.replace(/ \(.*\)/, '')}
                      </button>
                    );
                  })}
                  <button onClick={() => setBulkFill(null)}
                    className="col-span-2 pt-1 text-[8px] font-bold uppercase tracking-wide text-gray-400 hover:text-gray-600 border-none cursor-pointer bg-transparent text-center">
                    Abbrechen
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <div className="overflow-x-auto w-full">
          <table className="text-[10px] border-collapse w-full" style={{ borderSpacing: 0 }}>
            <colgroup>
              <col style={{ minWidth: '130px', width: '150px' }} />
              {days.map((d) => <col key={d.day} style={{ minWidth: d.isWeekend ? '20px' : '28px' }} />)}
            </colgroup>
            <thead>
              <tr className="border-b dark:border-white/10 border-gray-200">
                <th className="text-left px-2 py-1.5 font-black dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200" style={{ fontSize: '9px' }}>
                  Berater
                </th>
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-center font-black pb-0.5 pt-1 ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' :
                      d.holiday ? 'text-red-400 dark:text-red-400' :
                      d.dateStr === today ? 'text-[var(--primary)]' :
                      'dark:text-white/40 text-gray-500'
                    }`}
                    style={{ fontSize: '9px', background: d.holiday && !d.isWeekend ? 'rgba(239,68,68,0.04)' : undefined }}
                    title={d.holiday ? `🎉 ${d.holiday.name}` : undefined}>
                    {d.day}
                  </th>
                ))}
              </tr>
              <tr className="border-b-2 dark:border-white/10 border-gray-200">
                <th className="sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200" />
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-center font-medium pb-1 ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' : 'dark:text-white/20 text-gray-400'
                    }`}
                    style={{ fontSize: '7px', background: d.holiday && !d.isWeekend ? 'rgba(239,68,68,0.04)' : undefined }}>
                    {d.isWeekend ? d.weekday : (
                      <>
                        {d.weekday}
                        {d.holiday && !d.holiday.nationwide && bundesland === 'ALL' && (
                          <span className="block text-[5px] text-red-400 leading-none font-bold">
                            {getHolidayStatesLabel(d.holiday)}
                          </span>
                        )}
                      </>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberRows.map(({ member, categories }) => (
                <tr key={member.id} className="border-b dark:border-white/[0.06] border-gray-150 hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                  <td className="px-2 py-1 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200">
                    <div className="font-bold dark:text-white/80 text-gray-700 truncate" style={{ fontSize: '10px', maxWidth: 130 }}>
                      {member.name}
                    </div>
                  </td>
                  {days.map((d, i) => (
                    <DayCell key={d.dateStr} memberId={member.id} memberEmail={member.email}
                      dateStr={d.dateStr} category={categories[i]} isWeekend={d.isWeekend} dayNum={d.day} holiday={d.holiday} />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  };

  // ── Project Popup ─────────────────────────────────────
  const ProjectPopup = ({ project, onClose }: { project: Project; onClose: () => void }) => {
    const typeConf = PROJECT_TYPE_CONFIG[project.type];
    const statusConf = PROJECT_STATUS_CONFIG[project.status];
    const assignedMembers = members.filter((m) => project.memberIds.includes(m.id));
    const canManage = hasMinRole('department_lead');

    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 overflow-hidden animate-scale-up"
          onClick={e => e.stopPropagation()}>
          <div className="p-5 border-b dark:border-white/10 border-gray-100 flex items-start justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                style={{ background: `linear-gradient(135deg, ${typeConf.color}, ${typeConf.color}99)` }}>
                <Briefcase size={18} />
              </div>
              <div>
                <h2 className="text-base font-black dark:text-white text-gray-900">{project.name}</h2>
                <div className="flex items-center gap-2 mt-0.5">
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: typeConf.color }}>
                    {typeConf.label}
                  </span>
                  <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>
                    {statusConf.label}
                  </span>
                </div>
              </div>
            </div>
            <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500">
              <X size={16} />
            </button>
          </div>
          <div className="p-5 space-y-4">
            {project.description && (
              <p className="text-sm dark:text-white/60 text-gray-600">{project.description}</p>
            )}
            <div className="grid grid-cols-2 gap-3 text-xs">
              {project.client && (
                <div><span className="dark:text-white/40 text-gray-500">Kunde/Auftraggeber</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{project.client}</div></div>
              )}
              {project.startDate && (
                <div><span className="dark:text-white/40 text-gray-500">Start</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDisplay(project.startDate)}</div></div>
              )}
              {project.endDate && (
                <div><span className="dark:text-white/40 text-gray-500">Ende</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDisplay(project.endDate)}</div></div>
              )}
              <div>
                <span className="dark:text-white/40 text-gray-500">Berater</span>
                <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{assignedMembers.length} Personen</div>
              </div>
            </div>
            {assignedMembers.length > 0 && (
              <div>
                <div className="text-xs dark:text-white/40 text-gray-500 mb-2">Zugewiesene Berater</div>
                <div className="flex flex-wrap gap-1.5">
                  {assignedMembers.map((m) => (
                    <span key={m.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                      {m.name}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
          {canManage && (
            <div className="px-5 py-3 border-t dark:border-white/10 border-gray-100 flex justify-end gap-2">
              <Link href={`/projects`} onClick={onClose}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold no-underline hover:opacity-90 transition-opacity">
                <ExternalLink size={12} /> Verwalten
              </Link>
            </div>
          )}
        </div>
      </div>
    );
  };

  // ── Project Card ──────────────────────────────────────
  const ProjectCard = ({ project }: { project: Project }) => {
    const typeConf = PROJECT_TYPE_CONFIG[project.type];
    const statusConf = PROJECT_STATUS_CONFIG[project.status];
    const assignedCount = project.memberIds.length;

    return (
      <button onClick={() => setSelectedProject(project)}
        className="w-full text-left p-3 rounded-xl border dark:border-white/[0.06] border-black/[0.06] hover:border-[var(--primary)]/30 hover:bg-[var(--primary-light)] transition-all cursor-pointer bg-transparent group">
        <div className="flex items-start justify-between mb-2">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-2 h-2 rounded-full shrink-0" style={{ background: typeConf.color }} />
            <span className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{project.name}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border ml-2 shrink-0" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>
            {statusConf.label}
          </span>
        </div>
        {project.client && <div className="text-[10px] dark:text-white/40 text-gray-500 truncate">{project.client}</div>}
        <div className="flex items-center gap-3 mt-2 text-[9px] dark:text-white/30 text-gray-400">
          <span className="flex items-center gap-1"><Users size={9} />{assignedCount} Berater</span>
          {project.startDate && <span>{project.startDate.slice(0, 7)}</span>}
        </div>
      </button>
    );
  };

  const tabs: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
    { mode: 'overview', label: 'Übersicht', icon: Eye },
    { mode: 'projects', label: 'Projekte', icon: Briefcase },
    { mode: 'entry', label: 'Beraterübersicht', icon: CalendarDays },
  ];

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in" onClick={() => quickStatus && setQuickStatus(null)}>
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <CalendarRange size={20} className="text-[var(--primary)]" />
            </div>
            Jahresübersicht
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Auslastung, Projekte und Statuseingabe</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setYear((y) => y - 1)}
            className="p-2 rounded-lg border dark:border-white/[0.06] border-black/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
            <ChevronLeft size={16} className="dark:text-white/50 text-gray-600" />
          </button>
          <span className="text-xl font-black dark:text-white text-gray-900 min-w-[70px] text-center">{year}</span>
          <button onClick={() => setYear((y) => y + 1)}
            className="p-2 rounded-lg border dark:border-white/[0.06] border-black/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors">
            <ChevronRight size={16} className="dark:text-white/50 text-gray-600" />
          </button>
        </div>
      </div>

      {/* ── Tabs ─────────────────────────────────────── */}
      <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              viewMode === tab.mode
                ? 'bg-[var(--primary)] text-white shadow-sm'
                : 'dark:text-white/50 text-gray-500 hover:text-gray-700 dark:hover:text-white/70 bg-transparent'
            }`}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* ═════════════════════════════════════════════════
          VIEW: Übersicht – Jahres-KPI + 12 Monate
          ═════════════════════════════════════════════════ */}
      {viewMode === 'overview' && (
        <div className="space-y-6">
          {/* Jahr-KPI pro Mitarbeiter */}
          <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-white/[0.06] border-black/[0.04]">
              <h3 className="text-sm font-black dark:text-white text-gray-900">Jahresübersicht {year} pro Mitarbeiter</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b dark:border-white/[0.06] border-black/[0.04]">
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500 min-w-[150px]">Mitarbeiter</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#f97316] min-w-[90px]">Ext. Projekt</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#6366f1] min-w-[90px]">Int. Projekt</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#ec4899] min-w-[80px]">Krank</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#8b5cf6] min-w-[80px]">Urlaub</th>
                  </tr>
                </thead>
                <tbody>
                  {memberYearKPIs.map(({ member, extDays, intDays, sickDays, vacationDays }) => (
                    <tr key={member.id} className="border-b dark:border-white/[0.03] border-black/[0.02] hover:bg-black/[0.01] dark:hover:bg-white/[0.01]">
                      <td className="px-4 py-2 font-semibold dark:text-white/80 text-gray-800">{member.name}</td>
                      <td className="text-center px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: extDays > 0 ? '#f97316' : 'rgba(156,163,175,0.2)' }}>
                          {extDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: intDays > 0 ? '#6366f1' : 'rgba(156,163,175,0.2)' }}>
                          {intDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className="text-[10px] font-bold" style={{ color: sickDays > 5 ? '#ec4899' : sickDays > 0 ? '#e879a0' : '#9ca3af' }}>
                          {sickDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className="text-[10px] font-bold" style={{ color: vacationDays > 0 ? '#8b5cf6' : '#9ca3af' }}>
                          {vacationDays}d
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Bundesland-Auswahl + Feiertage-Legende */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-2">
              <MapPin size={12} className="dark:text-white/40 text-gray-400 shrink-0" />
              <label className="text-[10px] font-bold dark:text-white/40 text-gray-500 whitespace-nowrap">Feiertage:</label>
              <select
                title="Bundesland für Feiertagsanzeige"
                value={bundesland}
                onChange={(e) => handleBundeslandChange(e.target.value as Bundesland)}
                className="text-[10px] rounded-lg px-2 py-1 border dark:border-white/[0.08] border-black/[0.08] bg-transparent dark:text-white/70 text-gray-700 outline-none focus:border-[var(--primary)] cursor-pointer">
                {(Object.entries(BUNDESLAENDER) as [Bundesland, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{k === 'ALL' ? v : `${k} – ${v}`}</option>
                ))}
              </select>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] dark:text-white/40 text-gray-500">
              <span className="w-4 h-4 rounded-sm bg-red-50 dark:bg-red-950/30 border border-red-300/50 dark:border-red-700/40 flex items-center justify-center">
                <span className="w-1.5 h-1.5 rounded-full bg-red-400" />
              </span>
              Gesetzlicher Feiertag
            </div>
          </div>

          {/* Legende Kategorien */}
          <div className="flex flex-wrap gap-3">
            {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
              .filter(([cat]) => cat !== 'free' && cat !== 'weekend' && cat !== 'available')
              .map(([cat, conf]) => (
                <div key={cat} className="flex items-center gap-1.5 text-[10px] dark:text-white/50 text-gray-600">
                  <div className="w-5 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold"
                    style={{ background: conf.bg, color: conf.color }}>{conf.short}</div>
                  {conf.label}
                </div>
              ))}
          </div>

          {/* 12 Monate scrollbar */}
          <div className="space-y-4">
            {yearlyMatrixData.map((monthData) => (
              <MonthMatrix key={monthData.month} monthData={monthData} />
            ))}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════
          VIEW: Projekte – Intern/Extern getrennt
          ═════════════════════════════════════════════════ */}
      {viewMode === 'projects' && (
        <div className="space-y-5">
          {/* KPI Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Projekte gesamt', value: projects.length, color: '#6366f1', icon: Briefcase },
              { label: 'Extern', value: externalProjects.length, color: '#f97316', icon: TrendingUp },
              { label: 'Intern', value: internalProjects.length, color: '#6366f1', icon: Users },
              { label: 'Aktiv', value: projects.filter(p => p.status === 'active').length, color: '#22c55e', icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="card-shimmer rounded-xl p-4 flex items-center gap-3">
                <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${stat.color}15` }}>
                  <stat.icon size={16} style={{ color: stat.color }} />
                </div>
                <div>
                  <div className="text-xl font-black" style={{ color: stat.color }}>{stat.value}</div>
                  <div className="text-[10px] dark:text-white/40 text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Interne Projekte (größerer Bereich) */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] border-black/[0.04] flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                <h3 className="text-sm font-black dark:text-white text-gray-900">Interne Projekte</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-[10px] font-bold">{internalProjects.length}</span>
              </div>
              {/* Gantt für interne Projekte */}
              <div className="p-4 overflow-x-auto">
                <div className="flex mb-3 min-w-[500px]">
                  <div className="w-36 shrink-0" />
                  <div className="flex-1 flex">
                    {MONTH_NAMES.map((m, i) => (
                      <div key={m} className={`flex-1 text-center text-[9px] font-semibold ${i === currentMonth && year === currentYear ? 'text-[var(--primary)]' : 'dark:text-white/30 text-gray-400'}`}>{m}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 min-w-[500px]">
                  {projectGantt.filter(g => g.project.type === 'internal').map(({ project, leftPercent, widthPercent }) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <button onClick={() => setSelectedProject(project)} className="w-36 shrink-0 text-[10px] font-medium dark:text-white/70 text-gray-700 truncate text-left bg-transparent border-none cursor-pointer hover:text-[var(--primary)] transition-colors">
                        {project.name}
                      </button>
                      <div className="flex-1 h-6 rounded bg-black/[0.03] dark:bg-white/[0.03] relative">
                        <button onClick={() => setSelectedProject(project)} className="absolute h-full rounded flex items-center px-2 text-[8px] font-bold text-white overflow-hidden whitespace-nowrap border-none cursor-pointer hover:opacity-90 transition-opacity"
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: 'linear-gradient(135deg,#6366f1,#818cf8)', minWidth: 4 }}>
                          {widthPercent > 8 && project.name}
                        </button>
                        {year === currentYear && (
                          <div className="absolute top-0 h-full w-px bg-red-400/50"
                            style={{ left: `${((new Date().getTime() - yearStart) / totalMs) * 100}%` }} />
                        )}
                      </div>
                    </div>
                  ))}
                  {internalProjects.length === 0 && <div className="text-center py-6 text-xs dark:text-white/30 text-gray-400">Keine internen Projekte</div>}
                </div>
              </div>
              {/* Tile Grid für interne Projekte */}
              <div className="px-4 pb-4 grid sm:grid-cols-2 gap-2">
                {internalProjects.filter(p => !p.startDate && !p.endDate).map(p => <ProjectCard key={p.id} project={p} />)}
              </div>
            </div>

            {/* Externe Projekte (kleinerer Bereich) */}
            <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/[0.06] border-black/[0.04] flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                <h3 className="text-sm font-black dark:text-white text-gray-900">Externe Projekte</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] text-[10px] font-bold">{externalProjects.length}</span>
              </div>
              <div className="p-3 space-y-2">
                {externalProjects.map(p => <ProjectCard key={p.id} project={p} />)}
                {externalProjects.length === 0 && <div className="text-center py-8 text-xs dark:text-white/30 text-gray-400">Keine externen Projekte</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════
          VIEW: Beraterübersicht (monatliche Eingabe)
          ═════════════════════════════════════════════════ */}
      {viewMode === 'entry' && (
        <div className="space-y-4">
          {/* Monats-Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setEntryMonth((m) => Math.max(0, m - 1))} disabled={entryMonth === 0}
              className="p-1.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-30">
              <ChevronLeft size={14} className="dark:text-white/50 text-gray-600" />
            </button>
            <div className="flex gap-1 flex-wrap">
              {MONTH_NAMES.map((m, i) => (
                <button key={m} onClick={() => setEntryMonth(i)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${
                    entryMonth === i ? 'bg-[var(--primary)] text-white shadow-sm'
                    : i === currentMonth && year === currentYear ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[rgba(99,102,241,0.3)]'
                    : 'dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] bg-transparent'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setEntryMonth((m) => Math.min(11, m + 1))} disabled={entryMonth === 11}
              className="p-1.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors disabled:opacity-30">
              <ChevronRight size={14} className="dark:text-white/50 text-gray-600" />
            </button>
          </div>

          {/* Legende */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
              .filter(([cat]) => cat !== 'free' && cat !== 'weekend' && cat !== 'available')
              .map(([cat, conf]) => (
                <div key={cat} className="flex items-center gap-1.5 text-[10px] dark:text-white/50 text-gray-600">
                  <div className="w-5 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold" style={{ background: conf.bg, color: conf.color }}>{conf.short}</div>
                  {conf.label}
                </div>
              ))}
          </div>

          {/* Tagesmatrix */}
          <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-x-auto">
            <table className="border-collapse text-[9px]" style={{ minWidth: `${165 + entryData.daysInMonth * 24}px` }}>
              <thead>
                <tr className="border-b dark:border-white/[0.06] border-black/[0.04]">
                  <th className="text-left px-3 py-2 font-semibold dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-20 min-w-[150px]" rowSpan={2}>
                    {MONTH_NAMES_LONG[entryMonth]} {year}
                  </th>
                  {entryData.days.map((d) => (
                    <th key={d.day} className={`text-center font-bold min-w-[22px] pb-0.5 ${d.isWeekend ? 'dark:text-white/15 text-gray-300' : d.dateStr === today ? 'text-[var(--primary)]' : 'dark:text-white/50 text-gray-600'}`}>
                      {d.day}
                    </th>
                  ))}
                  <th className="text-center px-2 font-semibold dark:text-white/40 text-gray-500 sticky right-0 bg-white dark:bg-gray-900 z-20 min-w-[40px]" rowSpan={2}>Σ</th>
                </tr>
                <tr className="border-b dark:border-white/[0.08] border-black/[0.05]">
                  {entryData.days.map((d) => (
                    <th key={d.day} className={`text-center font-medium pb-1 ${d.isWeekend ? 'dark:text-white/10 text-gray-200' : 'dark:text-white/25 text-gray-400'}`} style={{ fontSize: '7px' }}>
                      {d.weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entryData.memberRows.map(({ member, categories, summary }) => {
                  const workDays = categories.filter((c) => c !== 'weekend' && c !== 'free').length;
                  const editable = canEditRow(member.email);
                  return (
                    <tr key={member.id} className={`border-b dark:border-white/[0.02] border-gray-50 ${editable ? 'hover:bg-black/[0.01] dark:hover:bg-white/[0.01]' : 'opacity-80'}`}>
                      <td className="px-3 py-1 sticky left-0 bg-white dark:bg-gray-900 z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold dark:text-white/80 text-gray-800">{member.name}</span>
                          <span className="text-[8px] dark:text-white/30 text-gray-400">{member.department}</span>
                        </div>
                      </td>
                      {entryData.days.map((d, i) => (
                        <DayCell key={d.dateStr} memberId={member.id} memberEmail={member.email}
                          dateStr={d.dateStr} category={categories[i]} isWeekend={d.isWeekend} dayNum={d.day} holiday={d.holiday} />
                      ))}
                      <td className="text-center px-2 font-bold dark:text-white/50 text-gray-600 sticky right-0 bg-white dark:bg-gray-900 z-10 text-[10px]">
                        {workDays}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Zusammenfassung */}
          <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4">
            <h3 className="text-sm font-black dark:text-white text-gray-900 mb-3">Zusammenfassung {MONTH_NAMES_LONG[entryMonth]} {year}</h3>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
                .filter(([cat]) => cat !== 'weekend' && cat !== 'free')
                .map(([cat, conf]) => {
                  const count = entryData.totalSummary[cat] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={cat} className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold" style={{ color: conf.bg, background: `${conf.bg}12` }}>
                      <span className="w-3 h-3 rounded-sm flex items-center justify-center text-[6px] font-bold" style={{ background: conf.bg, color: conf.color }}>{conf.short}</span>
                      {conf.label.replace(/ \(.*\)/, '')}: {count}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Project Popup */}
      {selectedProject && <ProjectPopup project={selectedProject} onClose={() => setSelectedProject(null)} />}
    </div>
  );
}
