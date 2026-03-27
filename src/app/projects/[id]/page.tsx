'use client';
import { useParams } from 'next/navigation';
import { useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  STATUS_CONFIG,
  SKILL_LEVEL_CONFIG,
  type AvailabilityStatus,
} from '@/types';
import {
  Briefcase,
  Building2,
  CalendarDays,
  Users,
  ArrowLeft,
  BarChart3,
} from 'lucide-react';
import Link from 'next/link';

export default function ProjectDetailPage() {
  const params = useParams();
  const projectId = params.id as string;

  const projects = useAppStore((s) => s.projects);
  const members = useAppStore((s) => s.members);
  const getProjectAllocations = useAppStore((s) => s.getProjectAllocations);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);

  const project = projects.find((p) => p.id === projectId);
  const allocations = useMemo(() => getProjectAllocations(projectId), [getProjectAllocations, projectId]);

  if (!project) {
    return (
      <div className="p-6 w-full text-center py-20">
        <h2 className="text-lg font-bold dark:text-white/60 text-gray-500">Projekt nicht gefunden</h2>
        <Link href="/projects" className="text-sm text-blue-500 hover:text-blue-600 mt-2 inline-block">
          ← Zurück zu Projekte
        </Link>
      </div>
    );
  }

  const typeConf = PROJECT_TYPE_CONFIG[project.type];
  const statusConf = PROJECT_STATUS_CONFIG[project.status];
  const projMembers = members.filter((m) => project.memberIds.includes(m.id));

  // Timeline berechnen
  const startDate = project.startDate ? new Date(project.startDate) : null;
  const endDate = project.endDate ? new Date(project.endDate) : null;
  const today = new Date();
  const totalDays = startDate && endDate ? Math.max(1, Math.ceil((endDate.getTime() - startDate.getTime()) / 86400000)) : 0;
  const elapsedDays = startDate && endDate ? Math.max(0, Math.min(totalDays, Math.ceil((today.getTime() - startDate.getTime()) / 86400000))) : 0;
  const progressPercent = totalDays > 0 ? Math.round((elapsedDays / totalDays) * 100) : 0;

  // Gesamt-Auslastung des Projekts
  const totalAllocationPercent = allocations.reduce((s, a) => s + a.percentage, 0);

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in">
      {/* Top nav */}
      <Link href="/projects" className="inline-flex items-center gap-1.5 text-xs dark:text-white/40 text-gray-500 hover:text-blue-500 transition-colors">
        <ArrowLeft size={12} /> Zurück zu Projekte
      </Link>

      {/* Header */}
      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-6">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: typeConf.color, background: `${typeConf.color}15`, border: `1px solid ${typeConf.color}30` }}>
                {project.type === 'internal' ? '🏢' : '🌐'} {typeConf.label}
              </span>
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: statusConf.color, background: `${statusConf.color}15` }}>
                {statusConf.label}
              </span>
            </div>
            <h1 className="text-2xl font-black dark:text-white text-gray-900">{project.name}</h1>
            {project.client && (
              <div className="flex items-center gap-1.5 mt-1">
                <Building2 size={12} className="dark:text-white/30 text-gray-400" />
                <span className="text-sm dark:text-white/50 text-gray-600">{project.client}</span>
              </div>
            )}
            {project.description && (
              <p className="text-sm dark:text-white/40 text-gray-500 mt-2">{project.description}</p>
            )}
          </div>
          <div className="text-right">
            <div className="text-3xl font-black" style={{ color: statusConf.color }}>{projMembers.length}</div>
            <div className="text-[10px] dark:text-white/40 text-gray-500">Teammitglieder</div>
          </div>
        </div>

        {/* Timeline Progress */}
        {startDate && endDate && (
          <div className="mt-6">
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-[10px] dark:text-white/30 text-gray-400">
                <CalendarDays size={10} className="inline mr-1" />
                {startDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
              <span className="text-xs font-bold" style={{ color: progressPercent >= 100 ? '#6b7280' : '#3b82f6' }}>
                {progressPercent}% der Zeit
              </span>
              <span className="text-[10px] dark:text-white/30 text-gray-400">
                {endDate.toLocaleDateString('de-DE', { day: '2-digit', month: 'short', year: 'numeric' })}
              </span>
            </div>
            <div className="h-2.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
              <div className="h-full rounded-full transition-all bg-gradient-to-r from-blue-500 to-blue-400"
                style={{ width: `${Math.min(progressPercent, 100)}%` }} />
            </div>
            <div className="flex items-center justify-between mt-1">
              <span className="text-[10px] dark:text-white/30 text-gray-400">{elapsedDays} Tage vergangen</span>
              <span className="text-[10px] dark:text-white/30 text-gray-400">{Math.max(0, totalDays - elapsedDays)} Tage übrig</span>
            </div>
          </div>
        )}
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-blue-500">{projMembers.length}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Berater</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-500">{totalAllocationPercent}%</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Gesamt-Kapazität</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-amber-500">{totalDays}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Laufzeit (Tage)</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-indigo-500">{allocations.length}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Zuweisungen</div>
        </div>
      </div>

      {/* Team Members with Allocations */}
      <div>
        <h2 className="text-sm font-bold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
          <Users size={14} /> Zugeordnete Berater
        </h2>
        <div className="space-y-2">
          {projMembers.map((member) => {
            const status = getMemberStatus(member.id);
            const statusConf = STATUS_CONFIG[status];
            const alloc = allocations.find((a) => a.memberId === member.id);
            const initials = member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2);

            return (
              <div key={member.id} className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4">
                <div className="flex items-center gap-3">
                  <div className="relative shrink-0">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center text-xs font-bold"
                      style={{ background: `${statusConf.color}15`, color: statusConf.color, border: `2px solid ${statusConf.color}30` }}>
                      {initials}
                    </div>
                    <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 rounded-full border-2 dark:border-[#111827] border-white"
                      style={{ background: statusConf.color }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <Link href={`/members/${member.id}/edit`} className="text-sm font-bold dark:text-white text-gray-900 hover:text-blue-500 truncate transition-colors">
                        {member.name}
                      </Link>
                      <span className="text-[10px] dark:text-white/30 text-gray-400">{member.role}</span>
                    </div>
                    {/* Skills des Mitglieds */}
                    {member.skills && member.skills.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-1">
                        {member.skills.slice(0, 3).map((skill) => (
                          <span key={skill.name} className="px-1 py-0.5 rounded text-[8px] font-semibold"
                            style={{ color: SKILL_LEVEL_CONFIG[skill.level].color, background: `${SKILL_LEVEL_CONFIG[skill.level].color}10` }}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="text-right shrink-0">
                    {alloc ? (
                      <>
                        <div className="text-lg font-black" style={{ color: alloc.percentage > 80 ? '#f59e0b' : '#22c55e' }}>
                          {alloc.percentage}%
                        </div>
                        <div className="text-[9px] dark:text-white/30 text-gray-400">
                          {alloc.startDate} — {alloc.endDate}
                        </div>
                      </>
                    ) : (
                      <span className="text-xs dark:text-white/30 text-gray-400">Keine Alloc.</span>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
        {projMembers.length === 0 && (
          <div className="text-center py-10">
            <p className="text-sm dark:text-white/30 text-gray-400">Keine Berater zugeordnet.</p>
          </div>
        )}
      </div>

      {/* Allocation Gantt-like Timeline */}
      {startDate && endDate && allocations.length > 0 && (
        <div>
          <h2 className="text-sm font-bold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
            <BarChart3 size={14} /> Zuweisungs-Timeline
          </h2>
          <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 overflow-x-auto">
            <div className="min-w-[500px] space-y-2">
              {allocations.map((alloc) => {
                const member = members.find((m) => m.id === alloc.memberId);
                if (!member) return null;
                const allocStart = new Date(alloc.startDate);
                const allocEnd = new Date(alloc.endDate);
                const leftPercent = Math.max(0, ((allocStart.getTime() - startDate.getTime()) / (endDate.getTime() - startDate.getTime())) * 100);
                const widthPercent = Math.max(2, Math.min(100 - leftPercent, ((allocEnd.getTime() - allocStart.getTime()) / (endDate.getTime() - startDate.getTime())) * 100));
                const barColor = alloc.percentage > 80 ? '#f59e0b' : alloc.percentage > 50 ? '#3b82f6' : '#22c55e';

                return (
                  <div key={alloc.id} className="flex items-center gap-3">
                    <div className="w-28 text-[10px] dark:text-white/50 text-gray-600 truncate font-medium shrink-0">
                      {member.name}
                    </div>
                    <div className="flex-1 h-6 rounded bg-black/[0.04] dark:bg-white/[0.04] relative">
                      <div className="absolute h-full rounded flex items-center justify-center text-[9px] font-bold text-white"
                        style={{ left: `${leftPercent}%`, width: `${widthPercent}%`, background: barColor, minWidth: 20 }}>
                        {alloc.percentage}%
                      </div>
                    </div>
                  </div>
                );
              })}
              {/* Today marker */}
              {progressPercent > 0 && progressPercent < 100 && (
                <div className="relative h-0">
                  <div className="absolute top-0 h-full border-l-2 border-dashed border-red-400/60"
                    style={{ left: `calc(7rem + ${progressPercent}% * 0.86 + 0.75rem)` }} />
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
