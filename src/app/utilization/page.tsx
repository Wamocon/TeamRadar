'use client';
import { useMemo, useState, useCallback } from 'react';
import { useAppStore } from '@/stores/appStore';
import { normalizeAvailabilityStatus } from '@/lib/status-normalization';
import {
  BarChart3,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Users,
  TrendingUp,
  AlertTriangle,
  Briefcase,
} from 'lucide-react';
import Link from 'next/link';

const MONTH_NAMES_SHORT = ['Jan', 'Feb', 'M�r', 'Apr', 'Mai', 'Jun', 'Jul', 'Aug', 'Sep', 'Okt', 'Nov', 'Dez'];
const MONTH_NAMES_LONG  = ['Januar', 'Februar', 'M�rz', 'April', 'Mai', 'Juni', 'Juli', 'August', 'September', 'Oktober', 'November', 'Dezember'];
const WEEKDAY_SHORT = ['So', 'Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa'];

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate();
}
function formatDate(y: number, m: number, d: number) {
  return `${y}-${String(m + 1).padStart(2, '0')}-${String(d).padStart(2, '0')}`;
}

type CellKind = 'empty' | 'vacation' | 'sick' | 'extern' | 'intern' | 'overbooked';

function getCellStyle(kind: CellKind, pct: number): { bg: string; label: string } {
  switch (kind) {
    case 'vacation':   return { bg: '#8b5cf6', label: 'Urlaub' };
    case 'sick':       return { bg: '#ec4899', label: 'Krank' };
    case 'overbooked': return { bg: '#ef4444', label: `${pct}% � �berbuchung` };
    case 'extern':     return { bg: pct >= 100 ? '#f97316' : pct >= 60 ? '#fb923c' : '#fed7aa', label: `${pct}% Ext.` };
    case 'intern':     return { bg: pct >= 100 ? '#6366f1' : pct >= 60 ? '#818cf8' : '#c7d2fe', label: `${pct}% Int.` };
    default:           return { bg: 'transparent', label: 'Kein Status' };
  }
}

export default function UtilizationPage() {
  const members        = useAppStore((s) => s.members);
  const allocations    = useAppStore((s) => s.allocations);
  const projects       = useAppStore((s) => s.projects);
  const availabilities = useAppStore((s) => s.availabilities);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);
  const hasMinRole = useAppStore((s) => s.hasMinRole);

  const [year, setYear] = useState(new Date().getFullYear());
  const [collapsedMembers, setCollapsedMembers] = useState<Set<string>>(new Set());
  const toggleMember = useCallback((id: string) => {
    setCollapsedMembers((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }, []);

  const today = new Date().toISOString().slice(0, 10);

  function getDayData(memberId: string, dateStr: string): { kind: CellKind; pct: number } {
    const avail = availabilities.find((a) => a.memberId === memberId && a.date === dateStr);
    const status = avail ? normalizeAvailabilityStatus(avail.status) : undefined;
    if (status === 'vacation') return { kind: 'vacation', pct: 0 };
    if (status === 'sick')     return { kind: 'sick',     pct: 0 };

    const pct = getMemberUtilization(memberId, dateStr);

    if (pct === 0) {
      if (status === 'extern-onsite' || status === 'extern-remote') return { kind: 'extern', pct: 100 };
      if (status === 'busy' || status === 'meeting')                 return { kind: 'intern', pct: 80  };
      if (status === 'remote')                                        return { kind: 'intern', pct: 70  };
      return { kind: 'empty', pct: 0 };
    }

    const dayAllocs = allocations.filter(
      (a) => a.memberId === memberId && a.startDate <= dateStr && a.endDate >= dateStr
    );
    const hasExt = dayAllocs.some((a) => projects.find((p) => p.id === a.projectId)?.type === 'external');
    const kind: CellKind = pct > 100 ? 'overbooked' : hasExt ? 'extern' : 'intern';
    return { kind, pct };
  }

  // eslint-disable-next-line react-hooks/exhaustive-deps
  const memberData = useMemo(() => {
    return members.map((member) => {
      let extDays = 0, intDays = 0, vacDays = 0, sickDays = 0;
      let utilSum = 0, utilCount = 0;

      const monthGrids = Array.from({ length: 12 }, (_, month) => {
        const dim = getDaysInMonth(year, month);
        const days = Array.from({ length: dim }, (_, i) => {
          const d = i + 1;
          const dateStr = formatDate(year, month, d);
          const dow = new Date(dateStr).getDay();
          const isWeekend = dow === 0 || dow === 6;
          if (isWeekend) return { d, dateStr, isWeekend: true, kind: 'empty' as CellKind, pct: 0, weekday: WEEKDAY_SHORT[dow] };

          const { kind, pct } = getDayData(member.id, dateStr);
          if (kind === 'vacation') vacDays++;
          else if (kind === 'sick') sickDays++;
          else if (kind === 'extern' || kind === 'overbooked') extDays++;
          else if (kind === 'intern') intDays++;

          if (pct > 0) { utilSum += pct; utilCount++; }
          return { d, dateStr, isWeekend: false, kind, pct, weekday: WEEKDAY_SHORT[dow] };
        });
        return { month, days };
      });

      const avgUtil = utilCount > 0 ? Math.round(utilSum / utilCount) : 0;
      return { member, monthGrids, avgUtil, extDays, intDays, vacDays, sickDays };
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [members, year, availabilities, allocations, projects]);

  const teamKPIs = useMemo(() => ({
    totalMembers: members.length,
    avgUtil: memberData.length ? Math.round(memberData.reduce((s, m) => s + m.avgUtil, 0) / memberData.length) : 0,
    totalExtDays: memberData.reduce((s, m) => s + m.extDays, 0),
    totalIntDays: memberData.reduce((s, m) => s + m.intDays, 0),
  }), [memberData, members.length]);

  // -- RBAC Guard (nach allen Hooks) -----------------
  if (!hasMinRole('department_lead')) {
    return (
      <div className="p-6 w-full flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <AlertTriangle size={32} />
          </div>
          <h2 className="text-xl font-bold dark:text-white text-gray-900">Kein Zugriff</h2>
          <p className="text-sm dark:text-white/40 text-gray-500 max-w-xs">
            Die Auslastungs�bersicht ist nur f�r Abteilungsleiter, CIOs und Admins sichtbar.
          </p>
          <Link href="/" className="inline-block mt-4 px-4 py-2 rounded-xl bg-(--primary) text-white text-sm font-semibold no-underline hover:opacity-90">
            Zur�ck zum Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <BarChart3 size={20} className="text-(--primary)" />
            </div>
            Auslastung
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Jahres�bersicht der Berater-Auslastung {year}</p>
        </div>
        <div className="flex items-center gap-2">
          <button title="Vorheriges Jahr" onClick={() => setYear((y) => y - 1)}
            className="p-2 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
            <ChevronLeft size={16} className="dark:text-white/50 text-gray-600" />
          </button>
          <span className="text-xl font-black dark:text-white text-gray-900 min-w-[70px] text-center">{year}</span>
          <button title="N�chstes Jahr" onClick={() => setYear((y) => y + 1)}
            className="p-2 rounded-lg border dark:border-white/6 border-black/6 hover:bg-black/4 dark:hover:bg-white/4 transition-colors">
            <ChevronRight size={16} className="dark:text-white/50 text-gray-600" />
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Berater',               value: teamKPIs.totalMembers,  color: '#6366f1', icon: Users },
          { label: '� Team-Auslastung',     value: `${teamKPIs.avgUtil}%`, color: teamKPIs.avgUtil > 80 ? '#f59e0b' : '#6366f1', icon: TrendingUp },
          { label: 'Ext. Projekttage ges.', value: teamKPIs.totalExtDays,  color: '#f97316', icon: Briefcase },
          { label: 'Int. Projekttage ges.', value: teamKPIs.totalIntDays,  color: '#6366f1', icon: Briefcase },
        ].map((kpi) => (
          <div key={kpi.label} className="card-shimmer rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${kpi.color}15` }}>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[9px] dark:text-white/40 text-gray-500">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Legende */}
      <div className="flex flex-wrap items-center gap-3 text-[10px] dark:text-white/40 text-gray-500">
        {[
          { label: 'Kein Status',       bg: 'rgba(107,114,128,0.08)', border: 'rgba(107,114,128,0.2)' },
          { label: 'Int. <60%',         bg: '#c7d2fe', border: 'transparent' },
          { label: 'Int. 60�100%',      bg: '#6366f1', border: 'transparent' },
          { label: 'Ext. <60%',         bg: '#fed7aa', border: 'transparent' },
          { label: 'Ext. 60�100%',      bg: '#f97316', border: 'transparent' },
          { label: '>100% �berbuchung', bg: '#ef4444', border: 'transparent' },
          { label: 'Urlaub',            bg: '#8b5cf6', border: 'transparent' },
          { label: 'Krank',             bg: '#ec4899', border: 'transparent' },
        ].map((l) => (
          <span key={l.label} className="flex items-center gap-1.5">
            <span className="w-3.5 h-3.5 rounded-sm shrink-0 inline-block" style={{ background: l.bg, border: `1px solid ${l.border}` }} />
            {l.label}
          </span>
        ))}
      </div>

      {/* Alle ein-/ausklappen */}
      {memberData.length > 1 && (
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold dark:text-white/40 text-gray-500 uppercase tracking-wider">
            {memberData.length - collapsedMembers.size} / {memberData.length} Berater sichtbar
          </span>
          <div className="flex gap-1.5">
            <button
              onClick={() => setCollapsedMembers(new Set())}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border dark:border-white/10 border-black/10 hover:bg-(--primary-light) hover:text-(--primary) dark:text-white/40 text-gray-400 transition-all bg-transparent cursor-pointer"
            >
              Alle aufklappen
            </button>
            <button
              onClick={() => setCollapsedMembers(new Set(memberData.map(m => m.member.id)))}
              className="px-2.5 py-1 rounded-lg text-[10px] font-semibold border dark:border-white/10 border-black/10 hover:bg-(--primary-light) hover:text-(--primary) dark:text-white/40 text-gray-400 transition-all bg-transparent cursor-pointer"
            >
              Alle einklappen
            </button>
          </div>
        </div>
      )}

      {/* Pro Mitarbeiter */}
      <div className="space-y-5">
        {memberData.map(({ member, monthGrids, avgUtil, extDays, intDays, vacDays, sickDays }) => {
          const isCollapsed = collapsedMembers.has(member.id);
          return (
          <div key={member.id} className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">

            {/* Member Header � klickbar zum Ein-/Ausklappen */}
            <button
              onClick={() => toggleMember(member.id)}
              className={`w-full px-4 py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-2 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors text-left ${!isCollapsed ? 'border-b dark:border-white/6 border-black/4' : ''}`}
            >
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-(--primary-light) flex items-center justify-center text-(--primary) font-black text-sm shrink-0">
                  {member.name.charAt(0)}
                </div>
                <div>
                  <div className="text-sm font-black dark:text-white text-gray-900">{member.name}</div>
                  <div className="text-[10px] dark:text-white/40 text-gray-500">{member.department}</div>
                </div>
              </div>
              <div className="flex flex-wrap items-center gap-2 text-[10px] font-semibold">
                <span className="px-2 py-0.5 rounded-full"
                  style={{ background: avgUtil > 100 ? 'rgba(239,68,68,0.1)' : 'rgba(99,102,241,0.1)', color: avgUtil > 100 ? '#ef4444' : '#6366f1' }}>
                  � {avgUtil}% Auslastung
                </span>
                {extDays  > 0 && <span className="px-2 py-0.5 rounded-full bg-orange-500/10 text-orange-500">{extDays}d ext.</span>}
                {intDays  > 0 && <span className="px-2 py-0.5 rounded-full bg-indigo-500/10 text-indigo-500">{intDays}d int.</span>}
                {vacDays  > 0 && <span className="px-2 py-0.5 rounded-full bg-violet-500/10 text-violet-500">{vacDays}d Urlaub</span>}
                {sickDays > 0 && <span className="px-2 py-0.5 rounded-full bg-pink-500/10 text-pink-500">{sickDays}d Krank</span>}
                <span className="ml-1 dark:text-white/30 text-gray-400">
                  {isCollapsed ? <ChevronDown size={14} /> : <ChevronUp size={14} />}
                </span>
              </div>
            </button>

            {/* 12-Monate Raster � volle Breite */}
            {!isCollapsed && <div className="w-full">
              <div className="flex w-full border-b dark:border-white/4 border-black/3">
                {monthGrids.map(({ month, days }) => {
                  const workdayCount = days.filter((d) => !d.isWeekend).length;
                  let s = 0; let c = 0;
                  days.forEach((d) => { if (!d.isWeekend && d.pct > 0) { s += d.pct; c++; } });
                  const monthUtil = c > 0 ? Math.round(s / c) : 0;
                  const isCurMonth = month === new Date().getMonth() && year === new Date().getFullYear();

                  return (
                    <div key={month} className="flex flex-col flex-1 min-w-0">
                      {/* Monatstitel + %-Balken */}
                      <div className={`px-1 pt-2 pb-1 text-center border-r dark:border-white/4 border-black/3 ${isCurMonth ? 'bg-(--primary-light)' : ''}`}>
                        <div className={`text-[9px] font-black ${isCurMonth ? 'text-(--primary)' : 'dark:text-white/50 text-gray-500'}`}>
                          {MONTH_NAMES_SHORT[month]}
                        </div>
                        <div className={`text-[8px] font-semibold mt-0.5 ${monthUtil === 0 ? 'opacity-0' : ''}`}
                          style={{ color: monthUtil > 100 ? '#ef4444' : monthUtil >= 80 ? '#f97316' : '#6366f1' }}>
                          � {monthUtil}%
                        </div>
                        {/* Mini-Fortschrittsbalken */}
                        <div className="mt-1 h-1 rounded-full bg-black/6 dark:bg-white/6 mx-1 overflow-hidden">
                          <div className="h-full rounded-full transition-all"
                            style={{ width: `${Math.min(100, monthUtil)}%`, background: monthUtil > 100 ? '#ef4444' : monthUtil >= 80 ? '#f97316' : '#6366f1' }} />
                        </div>
                        <div className="text-[7px] dark:text-white/20 text-gray-300 mt-0.5">{workdayCount}AT</div>
                      </div>

                      {/* Tage-Spalte */}
                      <div className="flex flex-col gap-px p-px border-r dark:border-white/4 border-black/3">
                        {days.map((d) => {
                          const isToday = d.dateStr === today;
                          if (d.isWeekend) {
                            return (
                              <div key={d.d} className="h-[13px] rounded-sm"
                                style={{ background: 'rgba(156,163,175,0.06)' }}
                                title={`${d.d}. ${MONTH_NAMES_LONG[month]} (${d.weekday})`} />
                            );
                          }
                          const { bg, label } = getCellStyle(d.kind, d.pct);
                          const isEmpty = d.kind === 'empty';
                          return (
                            <div key={d.d}
                              className={`h-[13px] rounded-sm flex items-center justify-center transition-transform hover:scale-y-110 cursor-default relative ${isToday ? 'ring-1 ring-inset ring-(--primary)' : ''}`}
                              style={{
                                background: isEmpty ? 'rgba(107,114,128,0.07)' : bg,
                                boxShadow: isEmpty ? 'inset 0 0 0 1px rgba(0,0,0,0.05)' : 'inset 0 0 0 1px rgba(0,0,0,0.10)',
                              }}
                              title={`${d.d}. ${MONTH_NAMES_LONG[month]} (${d.weekday}) � ${label}`}
                            >
                              {!isEmpty && d.pct > 0 && d.kind !== 'vacation' && d.kind !== 'sick' && (
                                <span className="text-[5px] font-black text-white leading-none select-none pointer-events-none">
                                  {d.pct}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>}

          </div>
          );
        })}

        {members.length === 0 && (
          <div className="text-center py-16 dark:text-white/30 text-gray-400">
            <BarChart3 size={32} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm">Keine Mitarbeiter vorhanden</div>
          </div>
        )}
      </div>
    </div>
  );
}
