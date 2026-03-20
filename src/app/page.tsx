'use client';
import { useAppStore } from '@/stores/appStore';
import { TeamGrid } from '@/components/team/TeamGrid';
import { AvailabilityForm } from '@/components/team/AvailabilityForm';
import { StatusBadge } from '@/components/team/StatusBadge';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';
import { Radar, Users, CalendarClock, Plus } from 'lucide-react';
import { useState } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const members = useAppStore((s) => s.members);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const [showForm, setShowForm] = useState(false);

  const today = new Date().toISOString().slice(0, 10);

  // Status-Zusammenfassung
  const statusCounts = members.reduce<Record<AvailabilityStatus, number>>(
    (acc, m) => {
      const s = getMemberStatus(m.id, today);
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    },
    {} as Record<AvailabilityStatus, number>
  );

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-8">
      {/* Hero */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center">
              <Radar size={20} className="text-white" />
            </div>
            Dashboard
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Übersicht der Team-Verfügbarkeit für heute
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            <CalendarClock size={14} />
            Status eintragen
          </button>
          <Link
            href="/members/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/30 text-blue-500 text-sm font-semibold hover:bg-blue-500/10 transition-colors no-underline"
          >
            <Plus size={14} />
            Mitarbeiter
          </Link>
        </div>
      </div>

      {/* Verfügbarkeits-Formular (einklappbar) */}
      {showForm && (
        <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5">
          <h2 className="text-sm font-bold dark:text-white text-gray-900 mb-4">Verfügbarkeit eintragen</h2>
          <AvailabilityForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* Status-Übersicht */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
          {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(
            ([key, config]) => {
              const count = statusCounts[key] || 0;
              return (
                <div
                  key={key}
                  className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-3 text-center"
                >
                  <div
                    className="text-2xl font-black leading-none"
                    style={{ color: count > 0 ? config.color : undefined }}
                  >
                    {count}
                  </div>
                  <div className="text-[10px] mt-1 dark:text-white/30 text-gray-400 font-medium">
                    {config.label}
                  </div>
                </div>
              );
            }
          )}
        </div>
      )}

      {/* Team-Grid */}
      <div>
        <div className="flex items-center gap-2 mb-4">
          <Users size={16} className="dark:text-white/40 text-gray-400" />
          <h2 className="text-sm font-bold dark:text-white/70 text-gray-700">
            Alle Mitarbeiter ({members.length})
          </h2>
        </div>
        <TeamGrid />
      </div>
    </div>
  );
}
