'use client';
import { useAppStore } from '@/stores/appStore';
import { TeamGrid } from '@/components/team/TeamGrid';
import { AvailabilityForm } from '@/components/team/AvailabilityForm';
import { StatusDonut } from '@/components/dashboard/StatusDonut';
import { DepartmentBars } from '@/components/dashboard/DepartmentBars';
import { AvailabilityTimeline } from '@/components/dashboard/AvailabilityTimeline';
import { SearchFilter } from '@/components/dashboard/SearchFilter';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';
import { Radar, CalendarClock, Plus, Clock, BarChart3, Users, LayoutGrid, List } from 'lucide-react';
import { useState, useMemo } from 'react';
import Link from 'next/link';

export default function DashboardPage() {
  const members = useAppStore((s) => s.members);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const [showForm, setShowForm] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'timeline'>('grid');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<AvailabilityStatus | 'all'>('all');
  const [selectedDept, setSelectedDept] = useState('');
  const [selectedProject, setSelectedProject] = useState('');

  const today = new Date().toISOString().slice(0, 10);

  const projects = useAppStore((s) => s.projects);

  const memberStatuses = useMemo(() =>
    members.map((m) => ({ member: m, status: getMemberStatus(m.id, today) })),
    [members, getMemberStatus, today]
  );

  const statusCounts = useMemo(() =>
    memberStatuses.reduce<Partial<Record<AvailabilityStatus, number>>>((acc, { status }) => {
      acc[status] = (acc[status] || 0) + 1;
      return acc;
    }, {}),
    [memberStatuses]
  );

  const departments = useMemo(() =>
    [...new Set(members.map((m) => m.department).filter(Boolean))].sort(),
    [members]
  );

  const departmentData = useMemo(() =>
    departments.map((name) => {
      const deptMembers = memberStatuses.filter((ms) => ms.member.department === name);
      const counts: Partial<Record<AvailabilityStatus, number>> = {};
      deptMembers.forEach(({ status }) => { counts[status] = (counts[status] || 0) + 1; });
      return { name, counts, total: deptMembers.length };
    }),
    [departments, memberStatuses]
  );

  const filteredMembers = useMemo(() =>
    memberStatuses
      .filter(({ member, status }) => {
        if (searchTerm && !member.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !member.email.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !member.department.toLowerCase().includes(searchTerm.toLowerCase())) return false;
        if (selectedStatus !== 'all' && status !== selectedStatus) return false;
        if (selectedDept && member.department !== selectedDept) return false;
        if (selectedProject) {
          const proj = projects.find((p) => p.id === selectedProject);
          if (proj && !proj.memberIds.includes(member.id)) return false;
        }
        return true;
      })
      .map(({ member }) => member),
    [memberStatuses, searchTerm, selectedStatus, selectedDept, selectedProject, projects]
  );

  const availableNow = statusCounts.available || 0;
  const inMeetings = statusCounts.meeting || 0;
  const onVacation = statusCounts.vacation || 0;
  const remoteCount = statusCounts.remote || 0;

  return (
    <div className="p-4 sm:p-6 max-w-[1400px] mx-auto space-y-6">
      {/* ── Header ──────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500 to-teal-400 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Radar size={20} className="text-white" />
            </div>
            Dashboard
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Verfügbarkeit deines Teams — {new Date().toLocaleDateString('de-DE', { weekday: 'long', day: 'numeric', month: 'long' })}
          </p>
        </div>
        <div className="flex gap-2">
          <button onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white text-xs font-semibold hover:from-blue-600 hover:to-blue-700 transition-all shadow-md shadow-blue-500/20">
            <CalendarClock size={14} />
            Status eintragen
          </button>
          <Link href="/members/new"
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-blue-500/20 text-blue-500 text-xs font-semibold hover:bg-blue-500/10 transition-colors no-underline">
            <Plus size={14} />
            Mitarbeiter
          </Link>
        </div>
      </div>

      {/* ── Form (collapsible) ─────────────────── */}
      {showForm && (
        <div className="card-shimmer rounded-xl p-5 animate-fade-in">
          <h2 className="text-sm font-bold dark:text-white text-gray-900 mb-4">Verfügbarkeit eintragen</h2>
          <AvailabilityForm onClose={() => setShowForm(false)} />
        </div>
      )}

      {/* ── Quick Stats ────────────────────────── */}
      {members.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 animate-fade-in-delay-1">
          {[
            { label: 'Verfügbar', value: availableNow, color: '#22c55e', icon: Users, gradient: 'from-green-500/10 to-green-500/5' },
            { label: 'Im Meeting', value: inMeetings, color: '#f59e0b', icon: Clock, gradient: 'from-amber-500/10 to-amber-500/5' },
            { label: 'Remote', value: remoteCount, color: '#3b82f6', icon: Radar, gradient: 'from-blue-500/10 to-blue-500/5' },
            { label: 'Urlaub / Krank', value: onVacation + (statusCounts.sick || 0), color: '#8b5cf6', icon: CalendarClock, gradient: 'from-violet-500/10 to-violet-500/5' },
          ].map((stat) => (
            <div key={stat.label} className={`stat-card card-shimmer rounded-xl p-4 bg-gradient-to-br ${stat.gradient}`}>
              <div className="flex items-center justify-between mb-2">
                <stat.icon size={16} style={{ color: stat.color }} className="opacity-70" />
                <span className="text-[10px] dark:text-white/30 text-gray-400 font-medium">{stat.label}</span>
              </div>
              <div className="text-3xl font-black" style={{ color: stat.color }}>{stat.value}</div>
              <div className="mt-1 h-1 rounded-full bg-black/[0.03] dark:bg-white/[0.03]">
                <div className="progress-bar h-full rounded-full" style={{ width: `${members.length > 0 ? (stat.value / members.length) * 100 : 0}%`, background: stat.color }} />
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ── Analytics Row ──────────────────────── */}
      {members.length > 0 && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 animate-fade-in-delay-2">
          {/* Status Distribution */}
          <div className="card-shimmer rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <BarChart3 size={14} className="dark:text-white/40 text-gray-400" />
              <h2 className="text-xs font-bold dark:text-white/60 text-gray-600 uppercase tracking-wider">Statusverteilung</h2>
            </div>
            <StatusDonut counts={statusCounts} total={members.length} />
          </div>

          {/* Department bars */}
          <div className="card-shimmer rounded-xl p-5">
            <div className="flex items-center gap-2 mb-4">
              <LayoutGrid size={14} className="dark:text-white/40 text-gray-400" />
              <h2 className="text-xs font-bold dark:text-white/60 text-gray-600 uppercase tracking-wider">Nach Abteilung</h2>
            </div>
            <DepartmentBars departments={departmentData} />
          </div>
        </div>
      )}

      {/* ── Search & View Toggle ───────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 animate-fade-in-delay-3">
        <div className="flex-1 w-full">
          <SearchFilter
            searchTerm={searchTerm} onSearchChange={setSearchTerm}
            selectedStatus={selectedStatus} onStatusChange={setSelectedStatus}
            selectedDepartment={selectedDept} onDepartmentChange={setSelectedDept}
            departments={departments}
            selectedProject={selectedProject} onProjectChange={setSelectedProject}
            projects={projects.filter((p) => p.status !== 'completed').map((p) => ({ id: p.id, name: p.name, type: p.type }))}
          />
        </div>
        <div className="flex gap-1 p-1 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
          <button onClick={() => setViewMode('grid')}
            className={`p-1.5 rounded-md transition-colors border-none cursor-pointer ${viewMode === 'grid' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent dark:text-white/40 text-gray-400 hover:text-blue-500'}`}>
            <LayoutGrid size={14} />
          </button>
          <button onClick={() => setViewMode('timeline')}
            className={`p-1.5 rounded-md transition-colors border-none cursor-pointer ${viewMode === 'timeline' ? 'bg-blue-500 text-white shadow-sm' : 'bg-transparent dark:text-white/40 text-gray-400 hover:text-blue-500'}`}>
            <List size={14} />
          </button>
        </div>
      </div>

      {/* ── Content ────────────────────────────── */}
      {viewMode === 'grid' ? (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <Users size={14} className="dark:text-white/40 text-gray-400" />
            <h2 className="text-xs font-bold dark:text-white/50 text-gray-600 uppercase tracking-wider">
              Team ({filteredMembers.length}{filteredMembers.length !== members.length ? ` von ${members.length}` : ''})
            </h2>
          </div>
          <TeamGrid members={filteredMembers} />
        </div>
      ) : (
        <div className="card-shimmer rounded-xl p-5">
          <div className="flex items-center gap-2 mb-4">
            <Clock size={14} className="dark:text-white/40 text-gray-400" />
            <h2 className="text-xs font-bold dark:text-white/50 text-gray-600 uppercase tracking-wider">
              Tages-Timeline — {new Date().toLocaleDateString('de-DE', { weekday: 'short', day: 'numeric', month: 'short' })}
            </h2>
          </div>
          <AvailabilityTimeline members={filteredMembers} date={today} />
        </div>
      )}
    </div>
  );
}
