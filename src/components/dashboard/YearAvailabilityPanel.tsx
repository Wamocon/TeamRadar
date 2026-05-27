'use client';
import { useState, useMemo, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { ChevronDown, ChevronUp, CalendarRange, MapPin } from 'lucide-react';
import { getHolidays, BUNDESLAENDER, type Bundesland, type Holiday, getHolidayStatesLabel } from '@/lib/holidays';
import Link from 'next/link';

// ─── Types ─────────────────────────────────────────────────────────────────

type DayCategory =
  | 'vacation' | 'sick' | 'extern-onsite' | 'extern-remote'
  | 'intern-onsite' | 'intern-remote' | 'available' | 'weekend' | 'free';

const DAY_CATEGORY_CONFIG: Record<DayCategory, { label: string; short: string; color: string; bg: string }> = {
  vacation:       { label: 'Urlaub',           short: 'U',   color: '#fff',    bg: '#8b5cf6' },
  sick:           { label: 'Krank',             short: 'K',   color: '#fff',    bg: '#ec4899' },
  'extern-onsite':{ label: 'Ext. Projekt (eP)', short: 'eP',  color: '#fff',    bg: '#f97316' },
  'extern-remote':{ label: 'Büro ext. (BeP)',   short: 'BeP', color: '#fff',    bg: '#fb923c' },
  'intern-onsite':{ label: 'Büro intern (B)',   short: 'B',   color: '#fff',    bg: '#6366f1' },
  'intern-remote':{ label: 'Homeoffice (H)',     short: 'H',   color: '#fff',    bg: '#06b6d4' },
  available:      { label: 'Verfügbar',          short: 'V',   color: '#166534', bg: '#bbf7d0' },
  weekend:        { label: 'Wochenende',         short: '',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)' },
  free:           { label: 'Kein Status',        short: '',    color: '#d1d5db', bg: 'transparent' },
};

const MONTH_NAMES_LONG = ['Januar', 'Februar', 'März', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

// ─── Read-only DayCell ──────────────────────────────────────────────────────

interface ReadonlyDayCellProps {
  dateStr: string;
  category: DayCategory;
  isWeekend: boolean;
  dayNum: number;
  holiday: Holiday | null;
  today: string;
}

function ReadonlyDayCell({ dateStr, category, isWeekend, dayNum, holiday, today }: ReadonlyDayCellProps) {
  const conf = DAY_CATEGORY_CONFIG[category];
  const isToday = dateStr === today;

  if (isWeekend) {
    return (
      <td className="p-0" style={{ background: 'rgba(156,163,175,0.07)' }}>
        <div className="w-full h-6" />
      </td>
    );
  }

  const isHoliday = !!holiday;
  const cellBg = isHoliday && category === 'free' ? 'rgba(239,68,68,0.09)' : conf.bg;
  const cellShadow = isHoliday && category === 'free'
    ? 'inset 0 0 0 1px rgba(239,68,68,0.35)'
    : category !== 'free' ? 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)';
  const titleText = isHoliday
    ? `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} — 🎉 ${holiday!.name}`
    : `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} — ${conf.label}`;

  return (
    <td className="text-center relative p-0.5" title={titleText}>
      <div
        className={`w-6 h-6 rounded flex items-center justify-center text-[7px] font-bold mx-auto relative ${
          isToday ? 'ring-2 ring-[var(--primary)] ring-offset-1' : ''
        }`}
        style={{
          background: cellBg,
          color: category === 'free' ? 'transparent' : conf.color,
          boxShadow: cellShadow,
        }}
      >
        {conf.short}
        {isHoliday && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
        )}
      </div>
    </td>
  );
}

// ─── Read-only MonthMatrix ──────────────────────────────────────────────────

interface MonthMatrixReadonlyProps {
  monthData: {
    month: number;
    days: { day: number; dateStr: string; weekday: string; isWeekend: boolean; holiday: Holiday | null }[];
    memberRows: { member: { id: string; name: string }; categories: DayCategory[] }[];
  };
  year: number;
  currentMonth: number;
  currentYear: number;
  bundesland: Bundesland;
  today: string;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
}

function MonthMatrixReadonly({
  monthData, year, currentMonth, currentYear, bundesland, today, isCollapsed, onToggleCollapse,
}: MonthMatrixReadonlyProps) {
  const { month, days, memberRows } = monthData;
  const isCurrent = month === currentMonth && year === currentYear;

  return (
    <div className={`rounded-xl border overflow-hidden ${isCurrent ? 'border-[var(--primary)]/30 ring-1 ring-[var(--primary)]/20' : 'border-black/10 dark:border-white/10'}`}>
      <button
        onClick={onToggleCollapse}
        className={`w-full flex items-center justify-between px-3 py-2 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${isCurrent ? 'bg-[var(--primary-light)]' : ''}`}
      >
        <div className="flex items-center gap-2">
          {isCollapsed
            ? <ChevronDown size={13} className="dark:text-white/40 text-gray-400" />
            : <ChevronUp size={13} className="dark:text-white/40 text-gray-400" />}
          <span className={`text-xs font-black ${isCurrent ? 'text-[var(--primary)]' : 'dark:text-white text-gray-900'}`}>
            {MONTH_NAMES_LONG[month]} {year}
          </span>
          {isCurrent && (
            <span className="px-1.5 py-0.5 rounded-full bg-[var(--primary)] text-white text-[8px] font-bold">AKTUELL</span>
          )}
        </div>
      </button>

      {!isCollapsed && (
        <div className="overflow-x-auto w-full">
          <table className="text-[9px] border-collapse w-full" style={{ borderSpacing: 0 }}>
            <colgroup>
              <col style={{ minWidth: '110px', width: '120px' }} />
              {days.map((d) => <col key={d.day} style={{ minWidth: d.isWeekend ? '16px' : '24px' }} />)}
            </colgroup>
            <thead>
              <tr className="border-b dark:border-white/10 border-gray-200">
                <th className="text-left px-2 py-1 font-black dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200" style={{ fontSize: '8px' }}>
                  Berater
                </th>
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-center font-black pb-0.5 pt-0.5 ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' :
                      d.holiday ? 'text-red-400' :
                      d.dateStr === today ? 'text-[var(--primary)]' :
                      'dark:text-white/40 text-gray-500'
                    }`}
                    style={{ fontSize: '8px', background: d.holiday && !d.isWeekend ? 'rgba(239,68,68,0.04)' : undefined }}
                    title={d.holiday ? `🎉 ${d.holiday.name}` : undefined}
                  >
                    {d.day}
                  </th>
                ))}
              </tr>
              <tr className="border-b dark:border-white/10 border-gray-200">
                <th className="sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200" />
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-center font-medium pb-0.5 ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' : 'dark:text-white/20 text-gray-400'
                    }`}
                    style={{ fontSize: '6px', background: d.holiday && !d.isWeekend ? 'rgba(239,68,68,0.04)' : undefined }}
                  >
                    {!d.isWeekend && d.weekday}
                    {d.holiday && !d.isWeekend && !d.holiday.nationwide && bundesland === 'ALL' && (
                      <span className="block text-[5px] text-red-400 leading-none font-bold">
                        {getHolidayStatesLabel(d.holiday)}
                      </span>
                    )}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {memberRows.map(({ member, categories }) => (
                <tr key={member.id} className="border-b dark:border-white/[0.06] border-gray-100">
                  <td className="px-2 py-0.5 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200">
                    <div className="font-bold dark:text-white/70 text-gray-700 truncate" style={{ fontSize: '9px', maxWidth: 110 }}>
                      {member.name}
                    </div>
                  </td>
                  {days.map((d, i) => (
                    <ReadonlyDayCell
                      key={d.dateStr}
                      dateStr={d.dateStr}
                      category={categories[i]}
                      isWeekend={d.isWeekend}
                      dayNum={d.day}
                      holiday={d.holiday}
                      today={today}
                    />
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// ─── Main Panel Component ───────────────────────────────────────────────────

export function YearAvailabilityPanel() {
  const members = useAppStore((s) => s.members);
  const availabilities = useAppStore((s) => s.availabilities);
  const allocations = useAppStore((s) => s.allocations);
  const projects = useAppStore((s) => s.projects);

  const [year, setYear] = useState(new Date().getFullYear());
  const [bundesland, setBundesland] = useState<Bundesland>('ALL');
  const [panelOpen, setPanelOpen] = useState(false); // outer panel starts collapsed
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(new Set());
  const toggleMonth = useCallback((month: number) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const holidays = useMemo(() => getHolidays(year, bundesland), [year, bundesland]);

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
  }, [year, members, getDayCategory, holidays]);

  if (members.length === 0) return null;

  return (
    <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
      {/* Outer header */}
      <button
        onClick={() => setPanelOpen((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
        aria-expanded={panelOpen}
      >
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center shrink-0">
            <CalendarRange size={15} className="text-[var(--primary)]" />
          </div>
          <div className="text-left">
            <div className="text-sm font-black dark:text-white text-gray-900">Jahresverfügbarkeit</div>
            <div className="text-[10px] dark:text-white/40 text-gray-500">Nur Lesezugriff · Bearbeitung in Jahresübersicht</div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <Link
            href="/year"
            onClick={(e) => e.stopPropagation()}
            className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border dark:border-white/10 border-black/10 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] dark:text-white/50 text-gray-500 transition-all no-underline"
          >
            Bearbeiten →
          </Link>
          <span className="dark:text-white/30 text-gray-400 transition-transform duration-200" style={{ transform: panelOpen ? 'none' : 'rotate(-90deg)' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
          </span>
        </div>
      </button>

      {panelOpen && (
        <div className="border-t dark:border-white/[0.06] border-black/[0.06]">
          {/* Controls bar */}
          <div className="px-4 py-3 flex flex-wrap items-center gap-3 border-b dark:border-white/[0.06] border-black/[0.04] bg-black/[0.01] dark:bg-white/[0.01]">
            {/* Year navigation */}
            <div className="flex items-center gap-1.5">
              <button onClick={() => setYear((y) => y - 1)}
                className="p-1 rounded-lg border dark:border-white/10 border-black/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors bg-transparent cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white/50 text-gray-600"><path d="M15 18l-6-6 6-6"/></svg>
              </button>
              <span className="text-sm font-black dark:text-white text-gray-900 min-w-[44px] text-center">{year}</span>
              <button onClick={() => setYear((y) => y + 1)}
                className="p-1 rounded-lg border dark:border-white/10 border-black/10 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-colors bg-transparent cursor-pointer">
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="dark:text-white/50 text-gray-600"><path d="M9 18l6-6-6-6"/></svg>
              </button>
            </div>

            {/* Bundesland */}
            <div className="flex items-center gap-1.5">
              <MapPin size={11} className="dark:text-white/30 text-gray-400 shrink-0" />
              <select
                title="Bundesland für Feiertagsanzeige"
                value={bundesland}
                onChange={(e) => setBundesland(e.target.value as Bundesland)}
                className="text-[9px] rounded-lg px-2 py-1 border dark:border-white/[0.08] border-black/[0.08] bg-transparent dark:text-white/60 text-gray-600 outline-none focus:border-[var(--primary)] cursor-pointer"
              >
                {(Object.entries(BUNDESLAENDER) as [Bundesland, string][]).map(([k, v]) => (
                  <option key={k} value={k}>{k === 'ALL' ? v : `${k} – ${v}`}</option>
                ))}
              </select>
            </div>

            {/* Collapse all / expand all */}
            <div className="ml-auto flex gap-1.5">
              <button
                onClick={() => setCollapsedMonths(new Set())}
                className="px-2 py-1 rounded text-[9px] font-semibold border dark:border-white/10 border-black/10 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] dark:text-white/40 text-gray-400 transition-all bg-transparent cursor-pointer"
              >
                Alle aufklappen
              </button>
              <button
                onClick={() => setCollapsedMonths(new Set([0,1,2,3,4,5,6,7,8,9,10,11]))}
                className="px-2 py-1 rounded text-[9px] font-semibold border dark:border-white/10 border-black/10 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] dark:text-white/40 text-gray-400 transition-all bg-transparent cursor-pointer"
              >
                Alle einklappen
              </button>
            </div>
          </div>

          {/* Legende */}
          <div className="px-4 py-2 flex flex-wrap gap-2.5 border-b dark:border-white/[0.04] border-black/[0.04]">
            {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
              .filter(([cat]) => cat !== 'free' && cat !== 'weekend' && cat !== 'available')
              .map(([cat, conf]) => (
                <div key={cat} className="flex items-center gap-1 text-[9px] dark:text-white/40 text-gray-500">
                  <div className="w-4 h-3.5 rounded-sm flex items-center justify-center text-[6px] font-bold"
                    style={{ background: conf.bg, color: conf.color }}>{conf.short}</div>
                  {conf.label}
                </div>
              ))}
            <div className="flex items-center gap-1 text-[9px] dark:text-white/40 text-gray-500">
              <span className="w-4 h-3.5 rounded-sm bg-red-50 dark:bg-red-950/30 border border-red-300/50 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-red-400" />
              </span>
              Feiertag
            </div>
          </div>

          {/* Month grids */}
          <div className="p-4 space-y-3">
            {yearlyMatrixData.map((monthData) => (
              <MonthMatrixReadonly
                key={monthData.month}
                monthData={monthData}
                year={year}
                currentMonth={currentMonth}
                currentYear={currentYear}
                bundesland={bundesland}
                today={today}
                isCollapsed={collapsedMonths.has(monthData.month)}
                onToggleCollapse={() => toggleMonth(monthData.month)}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
