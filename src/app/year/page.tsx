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
  type UserRole,
} from '@/types';
import {
  CalendarRange,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Briefcase,
  Eye,
  CalendarDays,
  X,
  ExternalLink,
  Users,
  TrendingUp,
  AlertCircle,
  CheckCircle2,
  CheckSquare,
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
  | 'intern-onsite' | 'intern-remote' | 'available' | 'weekend' | 'free'
  | 'home-extern' | 'berufsschule' | 'buero-berufsschule' | 'buero-uni' | 'uni';

const DAY_CATEGORY_CONFIG: Record<DayCategory, { label: string; short: string; color: string; bg: string; bgClass: string; textClass: string; badgeCls: string }> = {
  vacation:           { label: 'Urlaub',                   short: 'U',   color: '#fff',    bg: '#8b5cf6', bgClass: 'bg-violet-500',  textClass: 'text-white', badgeCls: 'text-violet-500 bg-violet-500/7' },
  sick:               { label: 'Krank',                    short: 'K',   color: '#fff',    bg: '#ec4899', bgClass: 'bg-pink-500',    textClass: 'text-white', badgeCls: 'text-pink-500 bg-pink-500/7' },
  'extern-onsite':    { label: 'Ext. Projekt (eP)',         short: 'eP',  color: '#fff',    bg: '#f97316', bgClass: 'bg-orange-500',  textClass: 'text-white', badgeCls: 'text-orange-500 bg-orange-500/7' },
  'extern-remote':    { label: 'Büro ext. Projekt (BeP)',  short: 'BeP', color: '#fff',    bg: '#fb923c', bgClass: 'bg-orange-400',  textClass: 'text-white', badgeCls: 'text-orange-400 bg-orange-400/7' },
  'intern-onsite':    { label: 'Büro intern (B)',          short: 'B',   color: '#fff',    bg: '#6366f1', bgClass: 'bg-indigo-500',  textClass: 'text-white', badgeCls: 'text-indigo-500 bg-indigo-500/7' },
  'intern-remote':    { label: 'Homeoffice intern (H)',     short: 'H',   color: '#fff',    bg: '#06b6d4', bgClass: 'bg-cyan-500',    textClass: 'text-white', badgeCls: 'text-cyan-500 bg-cyan-500/7' },
  available:          { label: 'Verfügbar',                short: 'V',   color: '#166534', bg: '#bbf7d0', bgClass: 'bg-green-200',   textClass: 'text-green-800', badgeCls: 'text-green-600 bg-green-500/7' },
  weekend:            { label: 'Wochenende',               short: '',    color: '#9ca3af', bg: 'rgba(156,163,175,0.1)', bgClass: 'bg-gray-400/10', textClass: 'text-gray-400', badgeCls: 'text-gray-400 bg-gray-400/7' },
  free:               { label: 'Kein Status',              short: '',    color: '#d1d5db', bg: 'transparent', bgClass: 'bg-transparent', textClass: 'text-gray-300', badgeCls: 'text-gray-400 bg-gray-400/7' },
  'home-extern':      { label: 'Homeoffice ext. Projekt (HeP)', short: 'HeP', color: '#fff', bg: '#0891b2', bgClass: 'bg-cyan-600',  textClass: 'text-white', badgeCls: 'text-cyan-600 bg-cyan-600/7' },
  berufsschule:       { label: 'Berufschule (BS)',          short: 'BS',  color: '#fff',    bg: '#ca8a04', bgClass: 'bg-yellow-600', textClass: 'text-white', badgeCls: 'text-yellow-600 bg-yellow-600/7' },
  'buero-berufsschule':{ label: 'Büro Berufschule (BBS)',  short: 'BBS', color: '#fff',    bg: '#a16207', bgClass: 'bg-yellow-700', textClass: 'text-white', badgeCls: 'text-yellow-700 bg-yellow-700/7' },
  'buero-uni':        { label: 'Büro Universität (BU)',    short: 'BU',  color: '#fff',    bg: '#1d4ed8', bgClass: 'bg-blue-700',   textClass: 'text-white', badgeCls: 'text-blue-700 bg-blue-700/7' },
  uni:                { label: 'Universität (Uni)',          short: 'Uni', color: '#fff',    bg: '#7c3aed', bgClass: 'bg-violet-700', textClass: 'text-white', badgeCls: 'text-violet-700 bg-violet-700/7' },
};

// -- Monats-Statistikspalten ---------------------------------------------------
interface StatCol { key: string; title: string; color: string; textClass: string; cat: DayCategory | null }
const MONTH_STATS_COLS: StatCol[] = [
  { key: 'S',   title: 'Arbeitstage gesamt',             color: '#374151', textClass: 'text-gray-700',   cat: null },
  { key: 'eP',  title: 'Ext. Präsenz',                  color: '#f97316', textClass: 'text-orange-500', cat: 'extern-onsite' },
  { key: 'BeP', title: 'Ext. HomeOffice',               color: '#fb923c', textClass: 'text-orange-400', cat: 'extern-remote' },
  { key: 'HeP', title: 'Homeoffice ext. Projekt',        color: '#0891b2', textClass: 'text-cyan-600',   cat: 'home-extern' },
  { key: 'B',   title: 'Büro intern',                   color: '#6366f1', textClass: 'text-indigo-500', cat: 'intern-onsite' },
  { key: 'H',   title: 'HomeOffice intern',             color: '#06b6d4', textClass: 'text-cyan-500',   cat: 'intern-remote' },
  { key: 'BS',  title: 'Berufschule',                   color: '#ca8a04', textClass: 'text-yellow-600', cat: 'berufsschule' },
  { key: 'BBS', title: 'Büro Berufschule',              color: '#a16207', textClass: 'text-yellow-700', cat: 'buero-berufsschule' },
  { key: 'BU',  title: 'Büro Universität',              color: '#1d4ed8', textClass: 'text-blue-700',   cat: 'buero-uni' },
  { key: 'Uni', title: 'Universität',                   color: '#7c3aed', textClass: 'text-violet-700', cat: 'uni' },
  { key: 'K',   title: 'Krank',                         color: '#ec4899', textClass: 'text-pink-500',   cat: 'sick' },
  { key: 'U',   title: 'Urlaub',                        color: '#8b5cf6', textClass: 'text-violet-500', cat: 'vacation' },
];

// Module-level constant – not recreated on every render
const STATUS_PICKER_OPTIONS: { key: AvailabilityStatus; cat: DayCategory }[] = [
  { key: 'vacation',           cat: 'vacation' },
  { key: 'sick',               cat: 'sick' },
  { key: 'extern-onsite',      cat: 'extern-onsite' },
  { key: 'extern-remote',      cat: 'extern-remote' },
  { key: 'home-extern',        cat: 'home-extern' },
  { key: 'busy',               cat: 'intern-onsite' },
  { key: 'remote',             cat: 'intern-remote' },
  { key: 'berufsschule',       cat: 'berufsschule' },
  { key: 'buero-berufsschule', cat: 'buero-berufsschule' },
  { key: 'buero-uni',          cat: 'buero-uni' },
  { key: 'uni',                cat: 'uni' },
  { key: 'offline',            cat: 'free' },
];

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

// -----------------------------------------------------------------------------
// Sub-components auf Modulebene → stabile Funktionsidentität → kein ungewolltes
// Unmount/Remount bei jedem State-Update → kein Scroll-Jump mehr
// -----------------------------------------------------------------------------

// Module-level drag state – kein re-render, kein State
const _dragState = { active: false };

interface DayCellProps {
  memberId: string; memberEmail: string; memberUserId?: string;
  dateStr: string; category: DayCategory; isWeekend: boolean;
  dayNum: number; holiday: Holiday | null;
  today: string;
  quickStatus: { memberId: string; date: string } | null;
  canEdit: boolean;
  onSelect: (memberId: string, date: string, x: number, y: number) => void;
  onDeselect: () => void;
  selectMode: boolean;
  isMultiSelected: boolean;
  onMultiToggle: (memberId: string, date: string) => void;
  onDragAdd: (memberId: string, date: string) => void;
}

function DayCell({ memberId, dateStr, category, isWeekend, dayNum, holiday, today, quickStatus, canEdit, onSelect, onDeselect, selectMode, isMultiSelected, onMultiToggle, onDragAdd }: DayCellProps) {
  const conf = DAY_CATEGORY_CONFIG[category];
  const isToday = dateStr === today;
  const isSelected = quickStatus?.memberId === memberId && quickStatus?.date === dateStr;

  if (isWeekend) {
    return (
      <td className={`p-0 relative ${holiday ? 'bg-red-500/7' : 'bg-gray-400/7'}`}
        title={holiday ? `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} – 🗓️ ${holiday.name}` : undefined}
      >
        <div className="w-full h-12" />
        {holiday && <span className="absolute top-0.5 right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />}
      </td>
    );
  }

  const isHoliday = !!holiday;
  const cellBg = isHoliday && category === 'free' ? 'rgba(239,68,68,0.09)' : conf.bg;
  const cellShadow = isHoliday && category === 'free'
    ? 'inset 0 0 0 1px rgba(239,68,68,0.35)'
    : category !== 'free' ? 'inset 0 0 0 1.5px rgba(0,0,0,0.15)' : 'inset 0 0 0 1px rgba(0,0,0,0.06)';
  const titleText = isHoliday
    ? `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} – 🗓️ ${holiday!.name}${getHolidayStatesLabel(holiday!) ? ` (${getHolidayStatesLabel(holiday!)})` : ''}${category !== 'free' ? ` – ${conf.label}` : ''}`
    : `${dayNum}. ${MONTH_NAMES_LONG[new Date(dateStr).getMonth()]} – ${conf.label}`;

  return (
    <td className="text-center relative p-1">
      <button
        disabled={!canEdit}
        onMouseDown={(e) => {
          if (!canEdit) return;
          e.stopPropagation();
          if (selectMode) {
            e.preventDefault(); // Kein Textselect beim Drag
            _dragState.active = true;
            onMultiToggle(memberId, dateStr);
            return;
          }
          if (isSelected) {
            onDeselect();
          } else {
            const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
            onSelect(memberId, dateStr, rect.left, rect.bottom);
          }
        }}
        onMouseEnter={() => {
          if (!canEdit || !selectMode || !_dragState.active) return;
          onDragAdd(memberId, dateStr);
        }}
        className={`w-11 h-11 rounded-md flex items-center justify-center text-[11px] font-bold transition-all mx-auto relative ${
          isToday ? 'ring-2 ring-(--primary) ring-offset-1' : ''
        } ${canEdit ? 'hover:scale-105 hover:brightness-110 cursor-pointer' : 'cursor-default'} border-none`}
        style={{
          background: cellBg,
          color: category === 'free' ? 'transparent' : conf.color,
          boxShadow: isMultiSelected ? '0 0 0 2.5px #22c55e' : isSelected ? `0 0 0 2px var(--primary)` : cellShadow,
        }}
        title={titleText}
      >
        {conf.short}
        {isHoliday && (
          <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 rounded-full bg-red-400" />
        )}
      </button>
    </td>
  );
}

type MemberRow = { member: { id: string; name: string; email: string; userId?: string }; categories: DayCategory[] };
type DayInfo = { day: number; dateStr: string; weekday: string; isWeekend: boolean; holiday: Holiday | null };

interface MonthMatrixProps {
  monthData: { month: number; days: DayInfo[]; memberRows: MemberRow[] };
  year: number;
  currentMonth: number;
  currentYear: number;
  bundesland: Bundesland;
  today: string;
  quickStatus: { memberId: string; date: string; x: number; y: number } | null;
  setQuickStatus: (v: { memberId: string; date: string; x: number; y: number } | null) => void;
  bulkFill: { month: number; year: number; x: number; y: number } | null;
  setBulkFill: (v: { month: number; year: number; x: number; y: number } | null) => void;
  canEditRow: (email: string, userId?: string) => boolean;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  selectMode: boolean;
  multiSelected: Set<string>;
  multiKey: (mId: string, date: string) => string;
  onMultiToggle: (memberId: string, date: string) => void;
  onDragAdd: (memberId: string, date: string) => void;
}

function MonthMatrix({ monthData, year, currentMonth, currentYear, bundesland, today, quickStatus, setQuickStatus, bulkFill, setBulkFill, canEditRow, isCollapsed, onToggleCollapse, selectMode, multiSelected, multiKey, onMultiToggle, onDragAdd }: MonthMatrixProps) {
  const { month, days, memberRows } = monthData;
  const isCurrent = month === currentMonth && year === currentYear;

  return (
    <div className={`card-shimmer rounded-xl border overflow-hidden ${isCurrent ? 'border-(--primary)/30 ring-1 ring-(--primary)/20' : 'border-black/10 dark:border-white/10'}`}>
      <div className={`px-3 py-2 flex items-center justify-between border-b border-black/10 dark:border-white/10 ${isCurrent ? 'bg-(--primary-light)' : ''}`}>
        <button
          onClick={onToggleCollapse}
          className="flex items-center gap-2 bg-transparent border-none cursor-pointer p-0 hover:opacity-70 transition-opacity"
        >
          {isCollapsed
            ? <ChevronDown size={14} className="dark:text-white/40 text-gray-400" />
            : <ChevronUp size={14} className="dark:text-white/40 text-gray-400" />}
          <span className={`text-sm font-black ${isCurrent ? 'text-(--primary)' : 'dark:text-white text-gray-900'}`}>
            {MONTH_NAMES_LONG[month]} {year}
          </span>
        </button>
        <div className="flex items-center gap-2">
          {isCurrent && <span className="px-1.5 py-0.5 rounded-full bg-(--primary) text-white text-[8px] font-bold">AKTUELL</span>}
          {!isCollapsed && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (bulkFill?.month === month) {
                  setBulkFill(null);
                } else {
                  const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                  setBulkFill({ month, year, x: rect.right, y: rect.bottom });
                }
              }}
              className="px-2 py-1 rounded-lg text-[9px] font-bold border dark:border-white/10 border-black/10 hover:bg-(--primary-light) hover:text-(--primary) dark:text-white/50 text-gray-500 transition-all bg-transparent cursor-pointer"
              title="Ganzen Monat mit Status füllen"
            >
              Monat füllen →
            </button>
          )}
        </div>
      </div>
      {!isCollapsed && (
        <div className="overflow-x-auto w-full">
          <table className="text-[10px] border-collapse border-spacing-0 w-full">
            <colgroup>
              <col className="min-w-35 w-40" />
              {days.map((d) => <col key={d.day} className={d.isWeekend ? 'min-w-8.5' : 'min-w-11.5'} />)}
              {MONTH_STATS_COLS.map((s) => <col key={s.key} className="w-9.5 min-w-9.5" />)}
            </colgroup>
            <thead>
              <tr className="border-b dark:border-white/10 border-gray-200">
                <th className="text-left px-2 py-2 text-[10px] font-black dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200">
                  Berater
                </th>
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-[11px] text-center font-black pb-0.5 pt-1.5 ${d.holiday ? 'bg-red-500/4' : ''} ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' :
                      d.holiday ? 'text-red-400 dark:text-red-400' :
                      d.dateStr === today ? 'text-(--primary)' :
                      'dark:text-white/40 text-gray-500'
                    }`}
                    title={d.holiday ? `🗓️ ${d.holiday.name}` : undefined}>
                    {d.day}
                  </th>
                ))}
                {MONTH_STATS_COLS.map((s, i) => (
                  <th key={s.key} rowSpan={2} title={s.title}
                    className={`text-[9px] text-center font-black align-middle ${s.textClass} ${i === 0 ? 'border-l-2 dark:border-white/15 border-black/8' : ''}`}>
                    {s.key}
                  </th>
                ))}
              </tr>
              <tr className="border-b-2 dark:border-white/10 border-gray-200">
                <th className="sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200" />
                {days.map((d) => (
                  <th key={d.day}
                    className={`text-[9px] text-center font-medium pb-1 ${d.holiday && !d.isWeekend ? 'bg-red-500/4' : ''} ${
                      d.isWeekend ? 'dark:text-white/15 text-gray-300' : 'dark:text-white/20 text-gray-400'
                    }`}>
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
                <tr key={member.id} className="border-b dark:border-white/6 border-gray-150 hover:bg-black/1 dark:hover:bg-white/1">
                  <td className="px-2 py-1.5 sticky left-0 bg-white dark:bg-gray-900 z-10 border-r dark:border-white/10 border-gray-200">
                    <div className="font-bold text-[11px] dark:text-white/80 text-gray-700 truncate max-w-35">
                      {member.name}
                    </div>
                  </td>
                  {days.map((d, i) => (
                    <DayCell key={d.dateStr}
                      memberId={member.id} memberEmail={member.email} memberUserId={member.userId}
                      dateStr={d.dateStr} category={categories[i]} isWeekend={d.isWeekend} dayNum={d.day} holiday={d.holiday}
                      today={today}
                      quickStatus={quickStatus}
                      canEdit={!d.isWeekend && canEditRow(member.email, member.userId)}
                      onSelect={(mId, date, x, y) => setQuickStatus({ memberId: mId, date, x, y })}
                      onDeselect={() => setQuickStatus(null)}
                      selectMode={selectMode}
                      isMultiSelected={selectMode && multiSelected.has(multiKey(member.id, d.dateStr))}
                      onMultiToggle={onMultiToggle}
                      onDragAdd={onDragAdd}
                    />
                  ))}
                  {MONTH_STATS_COLS.map((s, i) => {
                    const val = s.cat === null
                      ? categories.filter(c => c !== 'weekend' && c !== 'free').length
                      : categories.filter(c => c === s.cat).length;
                    return (
                      <td key={s.key}
                        className={`text-[11px] text-center font-bold py-1 ${val > 0 ? s.textClass : 'text-gray-300 dark:text-white/20'} ${i === 0 ? 'border-l-2 dark:border-white/15 border-black/8' : ''}`}>
                        {val > 0 ? val : '–'}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

// -- Module-level ProjectPopup -------------------------------------------------
interface ProjectPopupProps {
  project: Project;
  members: { id: string; name: string }[];
  hasMinRole: (role: UserRole) => boolean;
  onClose: () => void;
}

function ProjectPopup({ project, members, hasMinRole, onClose }: ProjectPopupProps) {
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
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 ${typeConf.gradientClass}`}>
              <Briefcase size={18} />
            </div>
            <div>
              <h2 className="text-base font-black dark:text-white text-gray-900">{project.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white ${typeConf.bgClass}`}>
                  {typeConf.label}
                </span>
                <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border ${statusConf.textClass} ${statusConf.borderLightClass}`}>
                  {statusConf.label}
                </span>
              </div>
            </div>
          </div>
          <button onClick={onClose} title="Schließen" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500">
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
                  <span key={m.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-(--primary-light) text-(--primary) border border-[rgba(99,102,241,0.2)]">
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
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--primary) text-white text-xs font-semibold no-underline hover:opacity-90 transition-opacity">
              <ExternalLink size={12} /> Verwalten
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

// -- Module-level ProjectCard --------------------------------------------------
interface ProjectCardProps {
  project: Project;
  onSelect: (project: Project) => void;
}

function ProjectCard({ project, onSelect }: ProjectCardProps) {
  const typeConf = PROJECT_TYPE_CONFIG[project.type];
  const statusConf = PROJECT_STATUS_CONFIG[project.status];
  const assignedCount = project.memberIds.length;

  return (
    <button onClick={() => onSelect(project)}
      className="w-full text-left p-3 rounded-xl border dark:border-white/6 border-black/6 hover:border-(--primary)/30 hover:bg-(--primary-light) transition-all cursor-pointer bg-transparent group">
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className={`w-2 h-2 rounded-full shrink-0 ${typeConf.bgClass}`} />
          <span className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-(--primary) transition-colors">{project.name}</span>
        </div>
        <span className={`px-1.5 py-0.5 rounded-md text-[8px] font-bold border ml-2 shrink-0 ${statusConf.textClass} ${statusConf.borderLightClass}`}>
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
}

export default function YearOverviewPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const availabilities = useAppStore((s) => s.availabilities);
  const allocations = useAppStore((s) => s.allocations);
  const addAvailability = useAppStore((s) => s.addAvailability);
  const bulkAddAvailabilities = useAppStore((s) => s.bulkAddAvailabilities);
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
  const [showOnlyMine, setShowOnlyMine] = useState(false);
  const [quickStatus, setQuickStatus] = useState<{ memberId: string; date: string; x: number; y: number } | null>(null);
  const [entryMonth, setEntryMonth] = useState(new Date().getMonth());
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [bulkFill, setBulkFill] = useState<{ month: number; year: number; x: number; y: number } | null>(null);
  const quickRef = useRef<HTMLDivElement>(null);
  const bulkRef = useRef<HTMLDivElement>(null);
  const [selectMode, setSelectMode] = useState(false);
  const [multiSelected, setMultiSelected] = useState<Set<string>>(new Set());
  const [multiPickerAnchor, setMultiPickerAnchor] = useState<{ x: number; y: number } | null>(null);
  const multiPickerRef = useRef<HTMLDivElement>(null);
  const multiKey = (mId: string, date: string) => `${mId}::${date}`;

  const today = new Date().toISOString().slice(0, 10);
  const currentMonth = new Date().getMonth();
  const currentYear = new Date().getFullYear();

  const ownMemberId = useMemo(() => {
    if (!userProfile) return null;
    const byEmail = members.find((m) =>
      userProfile.email && m.email.toLowerCase() === userProfile.email.toLowerCase()
    );
    if (byEmail) return byEmail.id;
    const byUserId = members.find((m) => m.userId && userProfile.id === m.userId);
    return byUserId?.id ?? null;
  }, [members, userProfile]);

  // Close quick picker on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (quickRef.current && !quickRef.current.contains(e.target as Node)) {
        setQuickStatus(null);
      }
      if (bulkRef.current && !bulkRef.current.contains(e.target as Node)) {
        setBulkFill(null);
      }
      if (multiPickerRef.current && !multiPickerRef.current.contains(e.target as Node)) {
        setMultiPickerAnchor(null);
      }
    };
    const stopDrag = () => { _dragState.active = false; };
    if (quickStatus || bulkFill || multiPickerAnchor) document.addEventListener('mousedown', handler);
    document.addEventListener('mouseup', stopDrag);
    return () => {
      document.removeEventListener('mousedown', handler);
      document.removeEventListener('mouseup', stopDrag);
    };
  }, [quickStatus, bulkFill, multiPickerAnchor]);

  // -- getDayCategory ------------------------------------
  const getDayCategory = useCallback((memberId: string, dateStr: string): DayCategory => {
    const dow = new Date(dateStr).getDay();
    if (dow === 0 || dow === 6) return 'weekend';

    const avail = [...availabilities].reverse().find((a) => a.memberId === memberId && a.date === dateStr);
    if (avail?.status === 'vacation') return 'vacation';
    if (avail?.status === 'sick') return 'sick';
    if (avail?.status === 'extern-onsite') return 'extern-onsite';
    if (avail?.status === 'extern-remote') return 'extern-remote';
    if (avail?.status === 'home-extern') return 'home-extern';
    if (avail?.status === 'berufsschule') return 'berufsschule';
    if (avail?.status === 'buero-berufsschule') return 'buero-berufsschule';
    if (avail?.status === 'buero-uni') return 'buero-uni';
    if (avail?.status === 'uni') return 'uni';
    const isRemote = avail?.status === 'remote';

    const dayAllocs = allocations.filter(
      (a) => a.memberId === memberId && a.startDate <= dateStr && a.endDate >= dateStr
    );
    if (dayAllocs.length > 0) {
      const hasExt = dayAllocs.some((a) => projects.find((p) => p.id === a.projectId)?.type === 'external');
      const hasInt = dayAllocs.some((a) => projects.find((p) => p.id === a.projectId)?.type === 'internal');
      if (hasExt) return isRemote ? 'home-extern' : 'extern-onsite';
      if (hasInt) return isRemote ? 'intern-remote' : 'intern-onsite';
    }
    if (avail?.status === 'remote') return 'intern-remote';
    if (avail?.status === 'busy' || avail?.status === 'meeting') return 'intern-onsite';
    if (avail?.status === 'offline') return 'free';
    return 'free';
  }, [availabilities, allocations, projects]);

  // -- canEditRow -- Admins können alle Zeilen bearbeiten, Mitarbeiter nur ihre eigene Zeile
  // Primär: E-Mail-Vergleich (zuverlässig). Sekundär: userId-UUID als Fallback.
  const canEditRow = useCallback((memberEmail: string, memberUserId?: string) => {
    if (hasMinRole('admin')) return true;
    if (!userProfile) return false;
    if (userProfile.email && memberEmail &&
        userProfile.email.toLowerCase() === memberEmail.toLowerCase()) return true;
    if (userProfile.id && memberUserId && userProfile.id === memberUserId) return true;
    return false;
  }, [userProfile, hasMinRole]);

  // -- filterRowForMine -- "Nur meine" zeigt immer nur die eigene Zeile
  const filterRowForMine = useCallback((row: { member: { id: string; email: string; userId?: string } }) => {
    if (ownMemberId) return row.member.id === ownMemberId;
    if (userProfile?.email && row.member.email.toLowerCase() === userProfile.email.toLowerCase()) return true;
    if (userProfile?.id && row.member.userId && userProfile.id === row.member.userId) return true;
    return false;
  }, [ownMemberId, userProfile]);

  // -- Yearly matrix data (all 12 months) ---------------
  const yearlyMatrixData = useMemo(() => {
    return Array.from({ length: 12 }, (_, month) => {
      const daysInMonth = getDaysInMonth(year, month);
      const days = Array.from({ length: daysInMonth }, (_, i) => {
        const d = i + 1;
        const dateStr = formatDate(year, month, d);
        const dow = new Date(dateStr).getDay();
        const isWeekend = dow === 0 || dow === 6;
        const holiday = holidays.get(dateStr) ?? null;
        return { day: d, dateStr, weekday: WEEKDAY_SHORT[dow], isWeekend, holiday };
      });
      const memberRows = members.map((member) => {
        const categories = days.map((d) => getDayCategory(member.id, d.dateStr));
        return { member, categories };
      });
      return { month, days, memberRows };
    });
  }, [year, members, getDayCategory, holidays]);

  // -- Member Year KPIs ----------------------------------
  const memberYearKPIs = useMemo(() => {
    return members.map((member) => {
      let extDays = 0, intDays = 0, sickDays = 0, vacationDays = 0;

      // Alle Werktage mit Kategorie für 39h-Berechnung sammeln
      const weekdayMap = new Map<string, Array<DayCategory>>();
      yearlyMatrixData.forEach(({ days, memberRows }) => {
        const row = memberRows.find((r) => r.member.id === member.id);
        if (!row) return;
        days.forEach((dayInfo, idx) => {
          const cat = row.categories[idx];
          if (cat === 'vacation') vacationDays++;
          else if (cat === 'sick') sickDays++;
          else if (cat === 'extern-onsite' || cat === 'extern-remote') extDays++;
          else if (cat === 'intern-onsite' || cat === 'intern-remote') intDays++;

          if (dayInfo.isWeekend) return; // Wochenenden ignorieren
          // Montag der Woche berechnen (Wochenschlüssel)
          const d = new Date(dayInfo.dateStr);
          const dow = d.getDay(); // 0=So,1=Mo,...,5=Fr,6=Sa
          const diff = dow === 0 ? -6 : 1 - dow;
          const monday = new Date(d);
          monday.setDate(d.getDate() + diff);
          const weekKey = monday.toISOString().slice(0, 10);
          if (!weekdayMap.has(weekKey)) weekdayMap.set(weekKey, []);
          weekdayMap.get(weekKey)!.push(cat);
        });
      });

      // 39h-Ausgleich: 1h Verlust pro Woche, in der ALLE 5 Werktage extern sind.
      // Feiertage/Urlaub/Krank/Büro an irgendeinem Tag → Woche hat <40h extern → kein Verlust.
      let fullExtWeeks = 0;
      weekdayMap.forEach((cats) => {
        if (
          cats.length === 5 &&
          cats.every((c) => c === 'extern-onsite' || c === 'extern-remote')
        ) fullExtWeeks++;
      });
      const hourLoss = fullExtWeeks;           // 1h pro Vollwoche extern (39h statt 40h)
      const extraDaysNeeded = Math.ceil(hourLoss / 8);
      // Effektiv geleistete Tage (39h-korrigiert): jede Vollwoche ext. = nur 7.875h statt 8h
      const effectiveDays = parseFloat((extDays - hourLoss / 8).toFixed(2));

      // Externes Budget
      const assignedExtProjects = projects.filter(
        (p) => p.type === 'external' && p.memberIds.includes(member.id) && p.maxDays != null
      );
      const extBudget = assignedExtProjects.length > 0
        ? assignedExtProjects.reduce((sum, p) => sum + (p.maxDays ?? 0), 0)
        : null;
      return { member, extDays, intDays, sickDays, vacationDays, extBudget, fullExtWeeks, hourLoss, extraDaysNeeded, effectiveDays };
    });
  }, [yearlyMatrixData, members, projects]);

  const visibleMemberYearKPIs = useMemo(() => {
    if (!showOnlyMine) return memberYearKPIs;
    return memberYearKPIs.filter((kpi) => filterRowForMine({ member: kpi.member }));
  }, [showOnlyMine, memberYearKPIs, filterRowForMine]);

  // -- Entry month data ----------------------------------
  const entryData = useMemo(() => {
    const daysInMonth = getDaysInMonth(year, entryMonth);
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const d = i + 1;
      const dateStr = formatDate(year, entryMonth, d);
      const dow = new Date(dateStr).getDay();
      const isWeekend = dow === 0 || dow === 6;
      const holiday = holidays.get(dateStr) ?? null;
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
  }, [year, entryMonth, members, getDayCategory, holidays]);

  const visibleEntryMemberRows = useMemo(() => {
    if (!showOnlyMine) return entryData.memberRows;
    return entryData.memberRows.filter((row) => filterRowForMine({ member: row.member }));
  }, [showOnlyMine, entryData.memberRows, filterRowForMine]);

  const visibleEntryTotalSummary = useMemo(() => {
    if (!showOnlyMine) return entryData.totalSummary;
    const totalSummary: Partial<Record<DayCategory, number>> = {};
    visibleEntryMemberRows.forEach(({ summary }) => {
      Object.entries(summary).forEach(([c, n]) => {
        totalSummary[c as DayCategory] = (totalSummary[c as DayCategory] || 0) + n;
      });
    });
    return totalSummary;
  }, [showOnlyMine, entryData.totalSummary, visibleEntryMemberRows]);

  const visibleProjects = useMemo(() => {
    if (!showOnlyMine || !ownMemberId) return projects;
    return projects.filter((p) => p.memberIds.includes(ownMemberId));
  }, [showOnlyMine, ownMemberId, projects]);

  // -- Project Gantt -------------------------------------
  const yearStart = new Date(year, 0, 1).getTime();
  const yearEnd = new Date(year, 11, 31).getTime();
  const totalMs = yearEnd - yearStart;

  const projectGantt = useMemo(() => {
    return visibleProjects
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
  }, [visibleProjects, filterType, year, yearStart, yearEnd, totalMs]);

  const internalProjects = visibleProjects.filter((p) => p.type === 'internal');
  const externalProjects = visibleProjects.filter((p) => p.type === 'external');

  // -- Status Picker & Bulk Fill -------------------------
  const handleSetStatus = (memberId: string, date: string, status: AvailabilityStatus) => {
    addAvailability({ memberId, date, status });
    setQuickStatus(null);
  };

  const handleBulkFillMonth = (month: number, yr: number, status: AvailabilityStatus) => {
    if (!userProfile) return;
    // Bulk-Fill: eigenen Member per Email finden (zuverlässiger als userId-Vergleich)
    const ownMember = members.find((m) =>
      userProfile.email && m.email.toLowerCase() === userProfile.email.toLowerCase()
    ) ?? members.find((m) => m.userId === userProfile.id);
    if (!ownMember) return;
    const daysInMonth = getDaysInMonth(yr, month);
    const entries: Array<{ memberId: string; date: string; status: AvailabilityStatus }> = [];
    for (let d = 1; d <= daysInMonth; d++) {
      const dateStr = formatDate(yr, month, d);
      const dow = new Date(dateStr).getDay();
      if (dow !== 0 && dow !== 6) {
        entries.push({ memberId: ownMember.id, date: dateStr, status });
      }
    }
    // Ein einziger Bulk-Write statt N einzelner Server-Action-Calls
    bulkAddAvailabilities(entries);
    setBulkFill(null);
  };

  // -- Collapsible months --------------------------------
  const [collapsedMonths, setCollapsedMonths] = useState<Set<number>>(new Set());

  const handleMultiToggle = useCallback((mId: string, date: string) => {
    setMultiSelected((prev) => {
      const next = new Set(prev);
      const k = multiKey(mId, date);
      next.has(k) ? next.delete(k) : next.add(k);
      return next;
    });
  }, []);

  // Drag-to-select: immer hinzufügen (nie entfernen während Drag)
  const handleDragAdd = useCallback((mId: string, date: string) => {
    setMultiSelected((prev) => {
      const k = multiKey(mId, date);
      if (prev.has(k)) return prev;
      const next = new Set(prev);
      next.add(k);
      return next;
    });
  }, []);

  const handleApplyMultiStatus = (status: AvailabilityStatus) => {
    const entries = Array.from(multiSelected).map((k) => {
      const [mId, date] = k.split('::');
      return { memberId: mId, date, status };
    });
    // Ein einziger Bulk-Write statt N einzelner Server-Action-Calls
    bulkAddAvailabilities(entries);
    setMultiSelected(new Set());
    setMultiPickerAnchor(null);
    setSelectMode(false);
  };

  const cancelMultiSelect = useCallback(() => {
    setMultiSelected(new Set());
    setSelectMode(false);
    setMultiPickerAnchor(null);
  }, []);
  const toggleMonth = useCallback((month: number) => {
    setCollapsedMonths((prev) => {
      const next = new Set(prev);
      next.has(month) ? next.delete(month) : next.add(month);
      return next;
    });
  }, []);

  const tabs: { mode: ViewMode; label: string; icon: React.ElementType }[] = [
    { mode: 'overview', label: 'Übersicht', icon: Eye },
    { mode: 'projects', label: 'Projekte', icon: Briefcase },
    { mode: 'entry', label: 'Beraterübersicht', icon: CalendarDays },
  ];

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in" onClick={() => { if (quickStatus) setQuickStatus(null); if (bulkFill) setBulkFill(null); if (multiPickerAnchor) setMultiPickerAnchor(null); }}>

      {/* -- Quick-Status Picker (fixed, außerhalb jedes overflow-Containers) -- */}
      {quickStatus && (
        <div
          ref={quickRef}
          className="fixed z-200 bg-white dark:bg-gray-900 shadow-2xl border dark:border-white/10 border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1 min-w-40"
          style={{
            top: Math.min(quickStatus.y + 4, window.innerHeight - 200),
            left: Math.min(quickStatus.x, window.innerWidth - 175),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {STATUS_PICKER_OPTIONS.map(({ key, cat }) => {
            const c = DAY_CATEGORY_CONFIG[cat];
            return (
              <button key={key} onClick={() => handleSetStatus(quickStatus.memberId, quickStatus.date, key)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-left hover:bg-gray-50 dark:hover:bg-white/5 border-none cursor-pointer w-full transition-colors bg-transparent dark:text-white/70 text-gray-700">
                <div className={`w-3 h-3 rounded-sm shrink-0 flex items-center justify-center text-[6px] font-bold ${c.bgClass} ${c.textClass}`}>{c.short}</div>
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

      {/* -- Bulk-Fill Picker (fixed, außerhalb jedes overflow-Containers) -- */}
      {bulkFill && (
        <div
          ref={bulkRef}
          className="fixed z-200 bg-white dark:bg-gray-900 shadow-2xl border dark:border-white/10 border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1 min-w-42.5"
          style={{
            top: Math.min(bulkFill.y + 4, window.innerHeight - 240),
            left: Math.min(bulkFill.x - 170, window.innerWidth - 185),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="col-span-2 text-[9px] font-black uppercase tracking-wide dark:text-white/40 text-gray-400 px-1 pb-1 border-b dark:border-white/10 border-gray-100 mb-1">
            Alle Werktage auf:
          </div>
          {STATUS_PICKER_OPTIONS.map(({ key, cat }) => {
            const c = DAY_CATEGORY_CONFIG[cat];
            return (
              <button key={key} onClick={() => handleBulkFillMonth(bulkFill.month, bulkFill.year, key)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-left hover:bg-gray-50 dark:hover:bg-white/5 border-none cursor-pointer w-full transition-colors bg-transparent dark:text-white/70 text-gray-700">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold shrink-0 shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.15)] ${c.bgClass} ${c.textClass}`}>{c.short}</div>
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

      {/* -- Multi-Select Picker (fixed, außerhalb jedes overflow-Containers) -- */}
      {multiPickerAnchor && (
        <div
          ref={multiPickerRef}
          className="fixed z-200 bg-white dark:bg-gray-900 shadow-2xl border dark:border-white/10 border-gray-200 rounded-xl p-2 grid grid-cols-2 gap-1 min-w-47.5"
          style={{
            top: Math.min(multiPickerAnchor.y + 4, window.innerHeight - 270),
            left: Math.min(multiPickerAnchor.x - 95, window.innerWidth - 200),
          }}
          onClick={(e) => e.stopPropagation()}
        >
          <div className="col-span-2 text-[9px] font-black uppercase tracking-wide dark:text-white/40 text-gray-400 px-1 pb-1 border-b dark:border-white/10 border-gray-100 mb-1">
            {multiSelected.size} Kästchen setzen auf:
          </div>
          {STATUS_PICKER_OPTIONS.map(({ key, cat }) => {
            const c = DAY_CATEGORY_CONFIG[cat];
            return (
              <button key={key} onClick={() => handleApplyMultiStatus(key)}
                className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg text-[9px] font-semibold text-left hover:bg-gray-50 dark:hover:bg-white/5 border-none cursor-pointer w-full transition-colors bg-transparent dark:text-white/70 text-gray-700">
                <div className={`w-4 h-4 rounded flex items-center justify-center text-[7px] font-bold shrink-0 shadow-[inset_0_0_0_1.5px_rgba(0,0,0,0.15)] ${c.bgClass} ${c.textClass}`}>{c.short}</div>
                {c.label.replace(/ \(.*\)/, '')}
              </button>
            );
          })}
          <button onClick={cancelMultiSelect}
            className="col-span-2 pt-1 text-[8px] font-bold uppercase tracking-wide text-gray-400 hover:text-gray-600 border-none cursor-pointer bg-transparent text-center">
            Abbrechen
          </button>
        </div>
      )}
      {/* -- Header ------------------------------------- */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <CalendarRange size={20} className="text-(--primary)" />
            </div>
            Jahresübersicht
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Auslastung, Projekte und Statuseingabe</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Nur-meine-Einträge Filter */}
          <button
            onClick={() => setShowOnlyMine(v => !v)}
            title="Nur eigene Einträge anzeigen – fokussiert auf deine Zeile"
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-semibold transition-all cursor-pointer ${
              showOnlyMine
                ? 'bg-(--primary) text-white border-(--primary)'
                : 'border-black/8 dark:border-white/8 dark:text-white/60 text-gray-600 hover:bg-(--primary-light) hover:text-(--primary) bg-transparent'
            }`}
          >
            <Eye size={13} />
            Nur meine
          </button>
          <button onClick={() => setYear((y) => y - 1)} title="Vorheriges Jahr"
            className="p-2 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
            <ChevronLeft size={16} className="dark:text-white/50 text-gray-600" />
          </button>
          <span className="text-xl font-black dark:text-white text-gray-900 min-w-17.5 text-center">{year}</span>
          <button onClick={() => setYear((y) => y + 1)} title="Nächstes Jahr"
            className="p-2 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
            <ChevronRight size={16} className="dark:text-white/50 text-gray-600" />
          </button>
        </div>
      </div>

      {/* -- Tabs --------------------------------------- */}
      <div className="flex gap-1 p-1 bg-black/4 dark:bg-white/4 rounded-xl w-fit">
        {tabs.map((tab) => (
          <button key={tab.mode} onClick={() => setViewMode(tab.mode)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${
              viewMode === tab.mode
                ? 'bg-(--primary) text-white shadow-sm'
                : 'dark:text-white/50 text-gray-500 hover:text-gray-700 dark:hover:text-white/70 bg-transparent'
            }`}>
            <tab.icon size={12} />
            {tab.label}
          </button>
        ))}
      </div>

      {/* -------------------------------------------------
          VIEW: Übersicht – Jahres-KPI + 12 Monate
          ------------------------------------------------- */}
      {viewMode === 'overview' && (
        <div className="space-y-6">

          {/* -- 39h-Effektiv-Bilanz pro ext. Berater --------------- */}
          {(() => {
            const extConsultants = visibleMemberYearKPIs.filter((k) => k.extBudget != null);
            if (extConsultants.length === 0) return null;
            return (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <TrendingUp size={13} className="text-[#f97316]" />
                  <h3 className="text-xs font-black dark:text-white/70 text-gray-700">39h-Effektivbilanz – Ext. Berater {year}</h3>
                  <span className="text-[10px] dark:text-white/30 text-gray-400">(geleistete Tage unter Berücksichtigung 39h/Woche-Regel)</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-3">
                  {extConsultants.map(({ member, effectiveDays, extBudget, extDays, fullExtWeeks, hourLoss }) => {
                    const plan = extBudget!;
                    const diff = parseFloat((effectiveDays - plan).toFixed(2));
                    const pct  = Math.min(100, Math.round((effectiveDays / plan) * 100));
                    const isOver   = diff >= 0;
                    const isWarn   = diff < 0 && diff >= -5;
                    const label    = isOver ? 'Im/Über Plan' : `${Math.abs(diff).toFixed(1)}d unter Plan`;
                    const cardCls  = isOver ? 'bg-green-500/8 border-green-500/25' : isWarn ? 'bg-amber-500/8 border-amber-500/25' : 'bg-red-500/8 border-red-500/35';
                    const barCls   = isOver ? 'bg-green-500' : isWarn ? 'bg-amber-500' : 'bg-red-500';
                    const numCls   = isOver ? 'text-green-500' : isWarn ? 'text-amber-500' : 'text-red-500';
                    const lblCls   = isOver ? 'text-green-600' : isWarn ? 'text-amber-600' : 'text-red-600';
                    return (
                      <div
                        key={member.id}
                        className={`rounded-xl p-4 border ${cardCls}`}
                        title={`${extDays} ext. Tage - ${hourLoss}h Verlust (${fullExtWeeks} Vollwochen × 1h) ÷ 8 = ${effectiveDays}d effektiv`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div>
                            <div className="text-[10px] font-semibold dark:text-white/50 text-gray-500 truncate max-w-32.5">{member.name}</div>
                            <div className={`text-2xl font-black mt-0.5 ${numCls}`}>
                              {effectiveDays.toFixed(1)}<span className="text-sm font-semibold ml-0.5 opacity-60">d</span>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-[9px] dark:text-white/30 text-gray-400">Plan</div>
                            <div className="text-sm font-black dark:text-white/60 text-gray-600">{plan}d</div>
                          </div>
                        </div>
                        {/* Fortschrittsbalken */}
                        <div className="w-full h-1.5 rounded-full bg-black/10 dark:bg-white/10 overflow-hidden mb-2">
                          <div className={`h-full rounded-full transition-all ${barCls}`} style={{ width: `${pct}%` }} />
                        </div>
                        <div className="flex items-center justify-between">
                          <span className={`text-[9px] font-bold ${lblCls}`}>
                            {isOver ? '↑' : '↓'} {label}
                          </span>
                          <span className="text-[9px] dark:text-white/30 text-gray-400">{pct}%</span>
                        </div>
                        {hourLoss > 0 && (
                          <div className="text-[8px] mt-1 dark:text-white/25 text-gray-400">
                            -{hourLoss}h durch {fullExtWeeks}×39h-Wo.
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })()}

          {/* Jahr-KPI pro Mitarbeiter */}
          <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
            <div className="px-4 py-3 border-b dark:border-white/6 border-black/4">
              <h3 className="text-sm font-black dark:text-white text-gray-900">Jahresübersicht {year} pro Mitarbeiter</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b dark:border-white/6 border-black/4">
                    <th className="text-left px-4 py-2 font-semibold dark:text-white/40 text-gray-500 min-w-37.5">Mitarbeiter</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#f97316] min-w-22.5">Ext. Projekt</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#6366f1] min-w-22.5">Int. Projekt</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#ec4899] min-w-20">Krank</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#8b5cf6] min-w-20">Urlaub</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#22c55e] min-w-30 border-l dark:border-white/6 border-black/4" title="Effektiv geleistete Tage (39h-korrigiert) vs. Plan">Eff. Tage / Plan</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#f59e0b] min-w-20 border-l dark:border-white/6 border-black/4" title="Kalenderwochen mit 5 externen Werktagen (39h statt 40h)">Ext. Wo.</th>
                    <th className="text-center px-3 py-2 font-semibold text-[#ef4444] min-w-27.5" title="39h-Regel: 1h Verlust pro Vollwoche extern → benötigte Zusatztage">39h-Ausgleich</th>
                  </tr>
                </thead>
                <tbody>
                  {visibleMemberYearKPIs.map(({ member, extDays, intDays, sickDays, vacationDays, extBudget, fullExtWeeks, hourLoss, extraDaysNeeded, effectiveDays }) => (
                    <tr key={member.id} className="border-b dark:border-white/3 border-black/2 hover:bg-black/1 dark:hover:bg-white/1">
                      <td className="px-4 py-2 font-semibold dark:text-white/80 text-gray-800">{member.name}</td>
                      <td className="text-center px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${extDays > 0 ? 'bg-orange-500' : 'bg-gray-400/20'}`}>
                          {extDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold text-white ${intDays > 0 ? 'bg-indigo-500' : 'bg-gray-400/20'}`}>
                          {intDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className={`text-[10px] font-bold ${sickDays > 5 ? 'text-pink-400' : sickDays > 0 ? 'text-[#e879a0]' : 'text-gray-400'}`}>
                          {sickDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2">
                        <span className={`text-[10px] font-bold ${vacationDays > 0 ? 'text-violet-500' : 'text-gray-400'}`}>
                          {vacationDays}d
                        </span>
                      </td>
                      <td className="text-center px-3 py-2 border-l dark:border-white/6 border-black/4">
                        {extBudget != null ? (() => {
                          const diff = effectiveDays - extBudget;
                          const isOver  = diff >= 0;
                          const isWarn  = diff < 0 && diff >= -5;
                          const colCls  = isOver ? 'text-green-500' : isWarn ? 'text-amber-500' : 'text-red-500';
                          return (
                            <span
                              className={`inline-flex flex-col items-center gap-0 text-[10px] font-bold ${colCls}`}
                              title={`Effektiv: ${effectiveDays.toFixed(2)}d von ${extBudget}d Plan (Differenz: ${diff >= 0 ? '+' : ''}${diff.toFixed(2)}d)`}
                            >
                              {!isOver && !isWarn && <AlertCircle size={9} />}
                              <span>{effectiveDays.toFixed(1)}/{extBudget}d</span>
                              <span className="text-[8px] opacity-80">{diff >= 0 ? '+' : ''}{diff.toFixed(1)}d</span>
                            </span>
                          );
                        })() : <span className="text-[10px] text-gray-400">–</span>}
                      </td>
                      {/* 39h-Ausgleich: volle externe Wochen zählen */}
                      <td className="text-center px-3 py-2 border-l dark:border-white/6 border-black/4">
                        {fullExtWeeks > 0
                          ? <span className="text-[10px] font-bold text-amber-500">{fullExtWeeks}</span>
                          : <span className="text-[10px] text-gray-400">–</span>}
                      </td>
                      <td className="text-center px-3 py-2">
                        {hourLoss > 0 ? (
                          <span
                            className="inline-flex flex-col items-center leading-tight"
                            title={`${fullExtWeeks} Vollwochen extern × 1h = ${hourLoss}h Verlust → ${extraDaysNeeded} Zusatztag${extraDaysNeeded !== 1 ? 'e' : ''} nötig`}
                          >
                            <span className="text-[10px] font-bold text-red-500">-{hourLoss}h</span>
                            <span className="text-[9px] font-semibold text-orange-500">+{extraDaysNeeded}d nötig</span>
                          </span>
                        ) : <span className="text-[10px] text-gray-400">–</span>}
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
                className="text-[10px] rounded-lg px-2 py-1 border dark:border-white/8 border-black/8 bg-transparent dark:text-white/70 text-gray-700 outline-none focus:border-(--primary) cursor-pointer">
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
                  <div className={`w-5 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold ${conf.bgClass} ${conf.textClass}`}>{conf.short}</div>
                  {conf.label}
                </div>
              ))}
          </div>

          {/* Multi-Auswahl Aktionsleiste */}
          {selectMode && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30" onClick={(e) => e.stopPropagation()}>
              <CheckSquare size={14} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                {multiSelected.size > 0 ? `${multiSelected.size} Kästchen ausgewählt` : 'Kästchen anklicken zum Auswählen'}
              </span>
              {multiSelected.size > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setMultiPickerAnchor({ x: rect.left + rect.width / 2, y: rect.bottom });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700 transition-colors border-none cursor-pointer"
                >
                  Status setzen →
                </button>
              )}
              <button onClick={cancelMultiSelect} title="Mehrfachauswahl beenden" className="ml-auto p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border-none cursor-pointer text-green-600 dark:text-green-400">
                <X size={12} />
              </button>
            </div>
          )}

          {/* 12 Monate scrollbar */}
          <div className="flex items-center justify-between mb-1">
            <span className="text-xs font-bold dark:text-white/40 text-gray-500 uppercase tracking-wider">
              {showOnlyMine ? 'Fokus: Meine Einträge' : `${12 - collapsedMonths.size} / 12 Monate sichtbar`}
            </span>
            <div className="flex gap-1.5">
              <button
                onClick={(e) => { e.stopPropagation(); selectMode ? cancelMultiSelect() : setSelectMode(true); }}
                title="Mehrere Kästchen auswählen und denselben Status setzen"
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                  selectMode
                    ? 'bg-green-600 text-white border-green-600'
                    : 'border-black/8 dark:border-white/8 dark:text-white/50 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'
                }`}
              >
                <CheckSquare size={12} />
                Mehrfachauswahl
              </button>
              <button
                onClick={() => setCollapsedMonths(new Set())}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border dark:border-white/10 border-black/10 hover:bg-(--primary-light) hover:text-(--primary) dark:text-white/50 text-gray-500 transition-all bg-transparent cursor-pointer"
              >
                Alle aufklappen
              </button>
              <button
                onClick={() => setCollapsedMonths(new Set([0,1,2,3,4,5,6,7,8,9,10,11]))}
                className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border dark:border-white/10 border-black/10 hover:bg-(--primary-light) hover:text-(--primary) dark:text-white/50 text-gray-500 transition-all bg-transparent cursor-pointer"
              >
                Alle einklappen
              </button>
            </div>
          </div>
          {showOnlyMine && (
            <div className="flex items-center gap-2 px-3 py-2 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] text-[11px] font-semibold text-(--primary)">
              <Eye size={12} />
              Nur deine Einträge werden angezeigt – alle anderen Berater ausgeblendet.
              {' '}Klicke &ldquo;Nur meine&rdquo; erneut, um alle anzuzeigen.
            </div>
          )}
          <div className="space-y-4">
            {yearlyMatrixData.map((monthData) => {
              const filteredMonthData = showOnlyMine
                ? { ...monthData, memberRows: monthData.memberRows.filter(row => filterRowForMine(row)) }
                : monthData;
              return (
                <MonthMatrix
                  key={monthData.month}
                  monthData={filteredMonthData}
                  year={year}
                  currentMonth={currentMonth}
                  currentYear={currentYear}
                  bundesland={bundesland}
                  today={today}
                  quickStatus={quickStatus}
                  setQuickStatus={setQuickStatus}
                  bulkFill={bulkFill}
                  setBulkFill={setBulkFill}
                  canEditRow={canEditRow}
                  isCollapsed={collapsedMonths.has(monthData.month)}
                  onToggleCollapse={() => toggleMonth(monthData.month)}
                  selectMode={selectMode}
                  multiSelected={multiSelected}
                  multiKey={multiKey}
                  onMultiToggle={handleMultiToggle}
                  onDragAdd={handleDragAdd}
                />
              );
            })}
          </div>
        </div>
      )}

      {/* -------------------------------------------------
          VIEW: Projekte – Intern/Extern getrennt
          ------------------------------------------------- */}
      {viewMode === 'projects' && (
        <div className="space-y-5">
          {/* KPI Header */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {[
              { label: 'Projekte gesamt', value: visibleProjects.length, textCls: 'text-indigo-500', bgLightCls: 'bg-indigo-500/8', icon: Briefcase },
              { label: 'Extern', value: externalProjects.length, textCls: 'text-orange-500', bgLightCls: 'bg-orange-500/8', icon: TrendingUp },
              { label: 'Intern', value: internalProjects.length, textCls: 'text-indigo-500', bgLightCls: 'bg-indigo-500/8', icon: Users },
              { label: 'Aktiv', value: visibleProjects.filter(p => p.status === 'active').length, textCls: 'text-green-500', bgLightCls: 'bg-green-500/8', icon: CheckCircle2 },
            ].map((stat) => (
              <div key={stat.label} className="card-shimmer rounded-xl p-4 flex items-center gap-3">
                <div className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 ${stat.bgLightCls}`}>
                  <stat.icon size={16} className={stat.textCls} />
                </div>
                <div>
                  <div className={`text-xl font-black ${stat.textCls}`}>{stat.value}</div>
                  <div className="text-[10px] dark:text-white/40 text-gray-500">{stat.label}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Interne Projekte (größerer Bereich) */}
          <div className="grid lg:grid-cols-3 gap-5">
            <div className="lg:col-span-2 card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/6 border-black/4 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#6366f1]" />
                <h3 className="text-sm font-black dark:text-white text-gray-900">Interne Projekte</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#6366f1]/10 text-[#6366f1] text-[10px] font-bold">{internalProjects.length}</span>
              </div>
              {/* Gantt für interne Projekte */}
              <div className="p-4 overflow-x-auto">
                <div className="flex mb-3 min-w-125">
                  <div className="w-36 shrink-0" />
                  <div className="flex-1 flex">
                    {MONTH_NAMES.map((m, i) => (
                      <div key={m} className={`flex-1 text-center text-[9px] font-semibold ${i === currentMonth && year === currentYear ? 'text-(--primary)' : 'dark:text-white/30 text-gray-400'}`}>{m}</div>
                    ))}
                  </div>
                </div>
                <div className="space-y-1.5 min-w-125">
                  {projectGantt.filter(g => g.project.type === 'internal').map(({ project, leftPercent, widthPercent }) => (
                    <div key={project.id} className="flex items-center gap-2">
                      <button onClick={() => setSelectedProject(project)} className="w-36 shrink-0 text-[10px] font-medium dark:text-white/70 text-gray-700 truncate text-left bg-transparent border-none cursor-pointer hover:text-(--primary) transition-colors">
                        {project.name}
                      </button>
                      <div className="flex-1 h-6 rounded bg-black/3 dark:bg-white/3 relative">
                        <button onClick={() => setSelectedProject(project)} className="absolute h-full rounded flex items-center px-2 text-[8px] font-bold text-white overflow-hidden whitespace-nowrap border-none cursor-pointer hover:opacity-90 transition-opacity bg-linear-to-br from-indigo-500 to-indigo-400 min-w-1"
                          style={{ left: `${leftPercent}%`, width: `${widthPercent}%` }}>
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
                {internalProjects.filter(p => !p.startDate && !p.endDate).map(p => <ProjectCard key={p.id} project={p} onSelect={setSelectedProject} />)}
              </div>
            </div>

            {/* Externe Projekte (kleinerer Bereich) */}
            <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
              <div className="px-4 py-3 border-b dark:border-white/6 border-black/4 flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-[#f97316]" />
                <h3 className="text-sm font-black dark:text-white text-gray-900">Externe Projekte</h3>
                <span className="ml-auto px-2 py-0.5 rounded-full bg-[#f97316]/10 text-[#f97316] text-[10px] font-bold">{externalProjects.length}</span>
              </div>
              <div className="p-3 space-y-2">
                {externalProjects.map(p => <ProjectCard key={p.id} project={p} onSelect={setSelectedProject} />)}
                {externalProjects.length === 0 && <div className="text-center py-8 text-xs dark:text-white/30 text-gray-400">Keine externen Projekte</div>}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* -------------------------------------------------
          VIEW: Beraterübersicht (monatliche Eingabe)
          ------------------------------------------------- */}
      {viewMode === 'entry' && (
        <div className="space-y-4">
          {/* Monats-Navigation */}
          <div className="flex items-center gap-2 flex-wrap">
            <button onClick={() => setEntryMonth((m) => Math.max(0, m - 1))} title="Vorheriger Monat" disabled={entryMonth === 0}
              className="p-1.5 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors disabled:opacity-30">
              <ChevronLeft size={14} className="dark:text-white/50 text-gray-600" />
            </button>
            <div className="flex gap-1 flex-wrap">
              {MONTH_NAMES.map((m, i) => (
                <button key={m} onClick={() => setEntryMonth(i)}
                  className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${
                    entryMonth === i ? 'bg-(--primary) text-white shadow-sm'
                    : i === currentMonth && year === currentYear ? 'bg-(--primary-light) text-(--primary) border border-[rgba(99,102,241,0.3)]'
                    : 'dark:text-white/40 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            <button onClick={() => setEntryMonth((m) => Math.min(11, m + 1))} title="Nächster Monat" disabled={entryMonth === 11}
              className="p-1.5 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors disabled:opacity-30">
              <ChevronRight size={14} className="dark:text-white/50 text-gray-600" />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); selectMode ? cancelMultiSelect() : setSelectMode(true); }}
              title="Mehrere Kästchen auswählen und denselben Status setzen"
              className={`ml-2 flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg border text-[10px] font-semibold transition-all cursor-pointer ${
                selectMode
                  ? 'bg-green-600 text-white border-green-600'
                  : 'border-black/8 dark:border-white/8 dark:text-white/50 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'
              }`}
            >
              <CheckSquare size={12} />
              Mehrfachauswahl
            </button>
          </div>

          {/* Legende */}
          <div className="flex flex-wrap gap-2">
            {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
              .filter(([cat]) => cat !== 'free' && cat !== 'weekend' && cat !== 'available')
              .map(([cat, conf]) => (
                <div key={cat} className="flex items-center gap-1.5 text-[10px] dark:text-white/50 text-gray-600">
                  <div className={`w-5 h-4 rounded-sm flex items-center justify-center text-[7px] font-bold ${conf.bgClass} ${conf.textClass}`}>{conf.short}</div>
                  {conf.label}
                </div>
              ))}
          </div>

          {/* Multi-Auswahl Aktionsleiste */}
          {selectMode && (
            <div className="flex items-center gap-3 px-3 py-2 rounded-xl bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700/30" onClick={(e) => e.stopPropagation()}>
              <CheckSquare size={14} className="text-green-600 dark:text-green-400 shrink-0" />
              <span className="text-xs font-bold text-green-700 dark:text-green-400">
                {multiSelected.size > 0 ? `${multiSelected.size} Kästchen ausgewählt` : 'Kästchen anklicken zum Auswählen'}
              </span>
              {multiSelected.size > 0 && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    const rect = (e.currentTarget as HTMLButtonElement).getBoundingClientRect();
                    setMultiPickerAnchor({ x: rect.left + rect.width / 2, y: rect.bottom });
                  }}
                  className="px-3 py-1.5 rounded-lg bg-green-600 text-white text-[10px] font-bold hover:bg-green-700 transition-colors border-none cursor-pointer"
                >
                  Status setzen →
                </button>
              )}
              <button onClick={cancelMultiSelect} title="Mehrfachauswahl beenden" className="ml-auto p-1 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/40 transition-colors border-none cursor-pointer text-green-600 dark:text-green-400">
                <X size={12} />
              </button>
            </div>
          )}

          {/* Tagesmatrix */}
          <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-x-auto">
            <table className="border-collapse text-[9px]" style={{ minWidth: `${165 + entryData.daysInMonth * 24}px` }}>
              <thead>
                <tr className="border-b dark:border-white/6 border-black/4">
                  <th className="text-left px-3 py-2 font-semibold dark:text-white/40 text-gray-500 sticky left-0 bg-white dark:bg-gray-900 z-20 min-w-37.5" rowSpan={2}>
                    {MONTH_NAMES_LONG[entryMonth]} {year}
                  </th>
                  {entryData.days.map((d) => (
                    <th key={d.day} className={`text-center font-bold min-w-5.5 pb-0.5 ${d.isWeekend ? 'dark:text-white/15 text-gray-300' : d.dateStr === today ? 'text-(--primary)' : 'dark:text-white/50 text-gray-600'}`}>
                      {d.day}
                    </th>
                  ))}
                  <th className="text-center px-2 font-semibold dark:text-white/40 text-gray-500 sticky right-0 bg-white dark:bg-gray-900 z-20 min-w-10" rowSpan={2}>S</th>
                </tr>
                <tr className="border-b dark:border-white/8 border-black/5">
                  {entryData.days.map((d) => (
                    <th key={d.day} className={`text-[7px] text-center font-medium pb-1 ${d.isWeekend ? 'dark:text-white/10 text-gray-200' : 'dark:text-white/25 text-gray-400'}`}>
                      {d.weekday}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {visibleEntryMemberRows.map(({ member, categories, summary }) => {
                  const workDays = categories.filter((c) => c !== 'weekend' && c !== 'free').length;
                  const editable = canEditRow(member.email);
                  return (
                    <tr key={member.id} className={`border-b dark:border-white/2 border-gray-50 ${editable ? 'hover:bg-black/1 dark:hover:bg-white/1' : 'opacity-80'}`}>
                      <td className="px-3 py-1 sticky left-0 bg-white dark:bg-gray-900 z-10">
                        <div className="flex flex-col">
                          <span className="text-[10px] font-bold dark:text-white/80 text-gray-800">{member.name}</span>
                          <span className="text-[8px] dark:text-white/30 text-gray-400">{member.department}</span>
                        </div>
                      </td>
                      {entryData.days.map((d, i) => (
                        <DayCell key={d.dateStr} memberId={member.id} memberEmail={member.email} memberUserId={member.userId}
                          dateStr={d.dateStr} category={categories[i]} isWeekend={d.isWeekend} dayNum={d.day} holiday={d.holiday}
                          today={today}
                          quickStatus={quickStatus}
                          canEdit={!d.isWeekend && canEditRow(member.email, member.userId)}
                          onSelect={(mId, date, x, y) => setQuickStatus({ memberId: mId, date, x, y })}
                          onDeselect={() => setQuickStatus(null)}
                          selectMode={selectMode}
                          isMultiSelected={selectMode && multiSelected.has(multiKey(member.id, d.dateStr))}
                          onMultiToggle={handleMultiToggle}
                          onDragAdd={handleDragAdd}
                        />
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
          <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 p-4">
            <h3 className="text-sm font-black dark:text-white text-gray-900 mb-3">Zusammenfassung {MONTH_NAMES_LONG[entryMonth]} {year}</h3>
            <div className="flex flex-wrap gap-3">
              {(Object.entries(DAY_CATEGORY_CONFIG) as [DayCategory, typeof DAY_CATEGORY_CONFIG[DayCategory]][])
                .filter(([cat]) => cat !== 'weekend' && cat !== 'free')
                .map(([cat, conf]) => {
                  const count = visibleEntryTotalSummary[cat] || 0;
                  if (count === 0) return null;
                  return (
                    <div key={cat} className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold ${conf.badgeCls}`}>
                      <span className={`w-3 h-3 rounded-sm flex items-center justify-center text-[6px] font-bold ${conf.bgClass} ${conf.textClass}`}>{conf.short}</span>
                      {conf.label.replace(/ \(.*\)/, '')}: {count}
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Project Popup */}
      {selectedProject && <ProjectPopup project={selectedProject} members={members} hasMinRole={hasMinRole} onClose={() => setSelectedProject(null)} />}
    </div>
  );
}
