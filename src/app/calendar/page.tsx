'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';
import { AvailabilityForm } from '@/components/team/AvailabilityForm';
import { CalendarDays, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import {
  startOfMonth,
  endOfMonth,
  startOfWeek,
  endOfWeek,
  eachDayOfInterval,
  format,
  addMonths,
  subMonths,
  isSameMonth,
  isToday,
} from 'date-fns';
import { de } from 'date-fns/locale';

export default function CalendarPage() {
  const members = useAppStore((s) => s.members);
  const availabilities = useAppStore((s) => s.availabilities);
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [showForm, setShowForm] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calendarStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd });

  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const getStatusesForDay = (dateStr: string) => {
    const entries = availabilities.filter((a) => a.date === dateStr);
    const statuses: Record<AvailabilityStatus, number> = {} as Record<AvailabilityStatus, number>;
    entries.forEach((e) => {
      statuses[e.status] = (statuses[e.status] || 0) + 1;
    });
    return statuses;
  };

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-blue-400" />
            </div>
            Kalender
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Verfügbarkeiten im Monatsüberblick
          </p>
        </div>
        <button
          onClick={() => { setSelectedDate(null); setShowForm(!showForm); }}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Plus size={14} />
          Eintragen
        </button>
      </div>

      {showForm && (
        <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5">
          <AvailabilityForm
            date={selectedDate ?? undefined}
            onClose={() => setShowForm(false)}
          />
        </div>
      )}

      {/* Monats-Navigation */}
      <div className="flex items-center justify-center gap-4">
        <button
          onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
          className="p-2 rounded-lg dark:text-white/40 text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors bg-transparent border-none cursor-pointer"
        >
          <ChevronLeft size={18} />
        </button>
        <h2 className="text-lg font-bold dark:text-white text-gray-900 min-w-[180px] text-center">
          {format(currentMonth, 'MMMM yyyy', { locale: de })}
        </h2>
        <button
          onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
          className="p-2 rounded-lg dark:text-white/40 text-gray-400 hover:bg-black/[0.05] dark:hover:bg-white/[0.05] transition-colors bg-transparent border-none cursor-pointer"
        >
          <ChevronRight size={18} />
        </button>
      </div>

      {/* Kalender-Grid */}
      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
        {/* Wochentage */}
        <div className="grid grid-cols-7 border-b border-black/[0.06] dark:border-white/[0.06]">
          {weekdays.map((d) => (
            <div
              key={d}
              className="text-center text-[10px] font-bold uppercase tracking-widest py-2 dark:text-white/25 text-gray-400"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Tage */}
        <div className="grid grid-cols-7">
          {days.map((day) => {
            const dateStr = format(day, 'yyyy-MM-dd');
            const inMonth = isSameMonth(day, currentMonth);
            const todayClass = isToday(day);
            const statuses = getStatusesForDay(dateStr);
            const hasEntries = Object.keys(statuses).length > 0;

            return (
              <button
                key={dateStr}
                onClick={() => {
                  setSelectedDate(dateStr);
                  setShowForm(true);
                }}
                className={`relative p-2 min-h-[80px] border-b border-r border-black/[0.04] dark:border-white/[0.03] text-left transition-colors bg-transparent cursor-pointer ${
                  inMonth
                    ? 'dark:text-white/70 text-gray-700'
                    : 'dark:text-white/15 text-gray-300'
                } hover:bg-blue-500/5`}
              >
                <div
                  className={`text-xs font-bold ${
                    todayClass
                      ? 'w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center'
                      : ''
                  }`}
                >
                  {format(day, 'd')}
                </div>
                {hasEntries && (
                  <div className="mt-1 flex flex-wrap gap-0.5">
                    {(Object.entries(statuses) as [AvailabilityStatus, number][]).map(
                      ([status, count]) => (
                        <span
                          key={status}
                          className="w-2 h-2 rounded-full"
                          style={{ background: STATUS_CONFIG[status].color }}
                          title={`${STATUS_CONFIG[status].label}: ${count}`}
                        />
                      )
                    )}
                  </div>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Legende */}
      <div className="flex flex-wrap gap-3 justify-center">
        {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(
          ([key, config]) => (
            <div key={key} className="flex items-center gap-1.5 text-[10px] dark:text-white/40 text-gray-500">
              <span className="w-2 h-2 rounded-full" style={{ background: config.color }} />
              {config.label}
            </div>
          )
        )}
      </div>
    </div>
  );
}
