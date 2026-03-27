'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';
import { AvailabilityForm } from '@/components/team/AvailabilityForm';
import { AvailabilityTimeline } from '@/components/dashboard/AvailabilityTimeline';
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Clock } from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, addMonths, subMonths, isSameMonth, isToday,
} from 'date-fns';
import { de } from 'date-fns/locale';

export default function CalendarPage() {
  const members = useAppStore((s) => s.members);
  const availabilities = useAppStore((s) => s.availabilities);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'month' | 'timeline'>('month');

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const getStatusesForDay = (dateStr: string) => {
    const entries = availabilities.filter((a) => a.date === dateStr);
    const statuses: Partial<Record<AvailabilityStatus, number>> = {};
    entries.forEach((e) => { statuses[e.status] = (statuses[e.status] || 0) + 1; });
    return statuses;
  };

  const timelineDate = selectedDate || new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-blue-400" />
            </div>
            Kalender
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Verfügbarkeiten im Monatsüberblick</p>
        </div>
        <div className="flex gap-2">
          <div className="flex gap-1 p-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
            <button onClick={() => setViewMode('month')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border-none cursor-pointer ${viewMode === 'month' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent dark:text-white/40 text-gray-400'}`}>
              Monat
            </button>
            <button onClick={() => setViewMode('timeline')}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors border-none cursor-pointer ${viewMode === 'timeline' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent dark:text-white/40 text-gray-400'}`}>
              Timeline
            </button>
          </div>
          <button onClick={() => { setSelectedDate(null); setShowForm(!showForm); }}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-500/20">
            <Plus size={14} /> Eintragen
          </button>
        </div>
      </div>

      {showForm && (
        <div className="card-shimmer rounded-xl p-5 animate-fade-in">
          <AvailabilityForm date={selectedDate ?? undefined} onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Month Navigation */}
      <div className="flex items-center justify-center gap-4 animate-fade-in-delay-1">
        <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg dark:text-white/40 text-gray-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors bg-transparent border-none cursor-pointer">
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-gray-900 min-w-[180px] text-center">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg dark:text-white/40 text-gray-400 hover:bg-blue-500/10 hover:text-blue-500 transition-colors bg-transparent border-none cursor-pointer">
          <ChevronRight size={18} />
        </button>
      </div>

      {viewMode === 'month' ? (
        /* ── Month Grid ──────────────────────── */
        <div className="card-shimmer rounded-xl overflow-hidden animate-fade-in-delay-2">
          <div className="grid grid-cols-7 border-b" style={{ borderColor: 'var(--border)' }}>
            {weekdays.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold uppercase tracking-widest py-2.5 dark:text-white/25 text-gray-400">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const inMonth = isSameMonth(day, currentMonth);
              const todayFlag = isToday(day);
              const statuses = getStatusesForDay(dateStr);
              const entries = Object.entries(statuses) as [AvailabilityStatus, number][];
              const totalEntries = entries.reduce((sum, [, c]) => sum + c, 0);

              return (
                <button key={dateStr}
                  onClick={() => { setSelectedDate(dateStr); setShowForm(true); }}
                  className={`relative p-2 min-h-[80px] border-b border-r text-left transition-all bg-transparent cursor-pointer ${
                    inMonth ? 'dark:text-white/70 text-gray-700' : 'dark:text-white/15 text-gray-300'
                  } hover:bg-blue-500/5`}
                  style={{ borderColor: 'var(--border)' }}>
                  <div className={`text-xs font-bold ${
                    todayFlag ? 'w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center' : ''
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {entries.length > 0 && (
                    <div className="mt-1.5 space-y-0.5">
                      {entries.slice(0, 3).map(([status, count]) => (
                        <div key={status} className="flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full shrink-0" style={{ background: STATUS_CONFIG[status].color }} />
                          <span className="text-[8px] dark:text-white/30 text-gray-400 truncate">
                            {count}× {STATUS_CONFIG[status].label}
                          </span>
                        </div>
                      ))}
                      {entries.length > 3 && (
                        <span className="text-[8px] dark:text-white/20 text-gray-300">+{entries.length - 3} mehr</span>
                      )}
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      ) : (
        /* ── Timeline View ────────────────────── */
        <div className="card-shimmer rounded-xl p-5 animate-fade-in-delay-2">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="dark:text-white/40 text-gray-400" />
            <h2 className="text-xs font-bold dark:text-white/50 text-gray-600 uppercase tracking-wider">
              Timeline — {format(new Date(timelineDate), 'EEEE, d. MMMM', { locale: de })}
            </h2>
          </div>
          <AvailabilityTimeline members={members} date={timelineDate} />
        </div>
      )}

      {/* Legend */}
      <div className="flex flex-wrap gap-3 justify-center animate-fade-in-delay-3">
        {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(
          ([key, config]) => (
            <div key={key} className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full" style={{ background: config.color }} />
              <span className="text-[10px] dark:text-white/35 text-gray-500">{config.label}</span>
            </div>
          )
        )}
      </div>
    </div>
  );
}
