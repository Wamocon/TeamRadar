'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { BarChart3, AlertTriangle, Users, Filter, ChevronDown, ChevronUp } from 'lucide-react';
import { SKILL_LEVEL_CONFIG, PROJECT_TYPE_CONFIG, type ProjectType } from '@/types';
import { ProjectTypeFilter } from '@/components/ui/ProjectTypeFilter';
import Link from 'next/link';

export default function UtilizationPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);
  const getMemberAllocations = useAppStore((s) => s.getMemberAllocations);
  const allocations = useAppStore((s) => s.allocations);
  const addAllocation = useAppStore((s) => s.addAllocation);
  const deleteAllocation = useAppStore((s) => s.deleteAllocation);
  const updateAllocation = useAppStore((s) => s.updateAllocation);

  const [filterDept, setFilterDept] = useState('');
  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');
  const [sortBy, setSortBy] = useState<'name' | 'utilization'>('utilization');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [expandedMember, setExpandedMember] = useState<string | null>(null);

  // Allocation form
  const [showAllocForm, setShowAllocForm] = useState<string | null>(null);
  const [allocProjectId, setAllocProjectId] = useState('');
  const [allocPercent, setAllocPercent] = useState(50);
  const [allocStart, setAllocStart] = useState(new Date().toISOString().slice(0, 10));
  const [allocEnd, setAllocEnd] = useState('');

  const departments = useMemo(() =>
    [...new Set(members.map((m) => m.department).filter(Boolean))].sort(),
    [members]
  );

  const projectTypeCounts = useMemo(() => ({
    internal: projects.filter((p) => p.type === 'internal' && p.status !== 'completed').length,
    external: projects.filter((p) => p.type === 'external' && p.status !== 'completed').length,
  }), [projects]);

  const today = new Date().toISOString().slice(0, 10);
  const activeType = filterType === 'all' ? undefined : filterType;

  const memberData = useMemo(() => {
    let filtered = members;
    if (filterDept) filtered = filtered.filter((m) => m.department === filterDept);

    return filtered
      .map((m) => ({
        member: m,
        utilization: getMemberUtilization(m.id, today, activeType),
        totalUtilization: getMemberUtilization(m.id, today),
        allocations: getMemberAllocations(m.id, today, activeType),
      }))
      .sort((a, b) => {
        if (sortBy === 'utilization') {
          return sortDir === 'desc' ? b.utilization - a.utilization : a.utilization - b.utilization;
        }
        return sortDir === 'desc'
          ? b.member.name.localeCompare(a.member.name)
          : a.member.name.localeCompare(b.member.name);
      });
  }, [members, filterDept, sortBy, sortDir, getMemberUtilization, getMemberAllocations, today, activeType]);

  const avgUtil = memberData.length > 0
    ? Math.round(memberData.reduce((s, d) => s + d.utilization, 0) / memberData.length)
    : 0;
  const overbookedCount = memberData.filter((d) => d.utilization > 100).length;
  const unallocatedCount = memberData.filter((d) => d.utilization === 0).length;

  const handleAddAllocation = (memberId: string) => {
    if (!allocProjectId || !allocEnd) return;
    addAllocation({
      memberId,
      projectId: allocProjectId,
      percentage: allocPercent,
      startDate: allocStart,
      endDate: allocEnd,
    });
    setShowAllocForm(null);
    setAllocProjectId('');
    setAllocPercent(50);
    setAllocEnd('');
  };

  const getUtilColor = (util: number) =>
    util > 100 ? '#ef4444' : util >= 80 ? '#f59e0b' : util > 0 ? '#22c55e' : '#6b7280';

  return (
    <div className="p-4 sm:p-6 w-full space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-500/20 to-blue-400/20 border border-emerald-500/20 flex items-center justify-center">
              <BarChart3 size={20} className="text-emerald-500" />
            </div>
            Auslastung
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Projekt-Zuweisungen und Kapazitätsplanung
            {filterType !== 'all' && (
              <span className="ml-2 px-2 py-0.5 rounded-full text-[10px] font-bold"
                style={{ color: PROJECT_TYPE_CONFIG[filterType].color, background: `${PROJECT_TYPE_CONFIG[filterType].color}15` }}>
                {filterType === 'internal' ? '🏢' : '🌐'} nur {PROJECT_TYPE_CONFIG[filterType].label}
              </span>
            )}
          </p>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Ø Auslastung', value: `${avgUtil}%`, color: getUtilColor(avgUtil) },
          { label: 'Mitarbeiter', value: memberData.length, color: '#3b82f6' },
          { label: 'Überbucht', value: overbookedCount, color: '#ef4444' },
          { label: 'Ohne Zuweisung', value: unallocatedCount, color: '#6b7280' },
        ].map((stat) => (
          <div key={stat.label} className="card-shimmer rounded-xl p-4 text-center">
            <div className="text-2xl font-black" style={{ color: stat.color }}>{stat.value}</div>
            <div className="text-[10px] dark:text-white/40 text-gray-500 mt-0.5">{stat.label}</div>
          </div>
        ))}
      </div>

      {/* Intern/Extern Filter */}
      <ProjectTypeFilter value={filterType} onChange={setFilterType} counts={projectTypeCounts} />

      {/* Filter & Sort */}
      <div className="flex flex-wrap gap-3 items-center">
        <Filter size={14} className="dark:text-white/30 text-gray-400" />
        <select value={filterDept} onChange={(e) => setFilterDept(e.target.value)}
          className="px-3 py-1.5 rounded-lg text-xs border cursor-pointer">
          <option value="">Alle Abteilungen</option>
          {departments.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
        <button onClick={() => { setSortBy('utilization'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}
          className={`px-3 py-1.5 rounded-lg text-xs border cursor-pointer ${sortBy === 'utilization' ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-600' : ''}`}>
          Nach Auslastung {sortBy === 'utilization' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
        <button onClick={() => { setSortBy('name'); setSortDir(sortDir === 'desc' ? 'asc' : 'desc'); }}
          className={`px-3 py-1.5 rounded-lg text-xs border cursor-pointer ${sortBy === 'name' ? 'bg-blue-500/10 border-blue-500/30 text-blue-600' : ''}`}>
          Nach Name {sortBy === 'name' && (sortDir === 'desc' ? '↓' : '↑')}
        </button>
      </div>

      {/* Member Utilization List */}
      <div className="space-y-2">
        {memberData.map(({ member, utilization, allocations: memberAllocs }) => {
          const isExpanded = expandedMember === member.id;
          const utilColor = getUtilColor(utilization);

          return (
            <div key={member.id} className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] overflow-hidden">
              {/* Main Row */}
              <button
                onClick={() => setExpandedMember(isExpanded ? null : member.id)}
                className="w-full flex items-center gap-4 p-4 text-left hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors"
              >
                <div className="w-9 h-9 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                  style={{ background: `${utilColor}15`, color: utilColor, border: `2px solid ${utilColor}30` }}>
                  {member.name.split(' ').map((n) => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold dark:text-white text-gray-900 truncate">{member.name}</span>
                    <span className="text-[10px] dark:text-white/30 text-gray-400">{member.role}</span>
                  </div>
                  <div className="flex items-center gap-2 mt-1">
                    <div className="flex-1 h-2 rounded-full bg-black/[0.06] dark:bg-white/[0.06] max-w-xs">
                      <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%`, background: utilColor }} />
                    </div>
                    <span className="text-xs font-bold shrink-0" style={{ color: utilColor }}>
                      {utilization}%
                    </span>
                    {utilization > 100 && <AlertTriangle size={12} className="text-red-500 shrink-0" />}
                  </div>
                </div>
                <div className="text-[10px] dark:text-white/30 text-gray-400 shrink-0">
                  {memberAllocs.length} Projekt{memberAllocs.length !== 1 ? 'e' : ''}
                </div>
                {isExpanded ? <ChevronUp size={14} className="dark:text-white/30 text-gray-400" /> : <ChevronDown size={14} className="dark:text-white/30 text-gray-400" />}
              </button>

              {/* Expanded Detail */}
              {isExpanded && (
                <div className="px-4 pb-4 border-t border-black/[0.04] dark:border-white/[0.04] animate-fade-in">
                  {/* Current Allocations */}
                  {memberAllocs.length > 0 ? (
                    <div className="mt-3 space-y-2">
                      {memberAllocs.map((alloc) => {
                        const proj = projects.find((p) => p.id === alloc.projectId);
                        return (
                          <div key={alloc.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-black/[0.03] dark:bg-white/[0.03]">
                            <div className="flex-1 min-w-0">
                              <Link href={`/projects/${alloc.projectId}`} className="text-xs font-semibold dark:text-white text-gray-800 hover:text-blue-500 transition-colors">
                                {proj?.name ?? 'Unbekannt'}
                              </Link>
                              {proj && (
                                <span className="ml-1.5 text-[8px] font-bold px-1 py-0.5 rounded"
                                  style={{ color: PROJECT_TYPE_CONFIG[proj.type].color, background: `${PROJECT_TYPE_CONFIG[proj.type].color}12` }}>
                                  {proj.type === 'internal' ? '🏢' : '🌐'}
                                </span>
                              )}
                              <div className="text-[10px] dark:text-white/30 text-gray-400 mt-0.5">
                                {alloc.startDate} — {alloc.endDate}
                              </div>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-bold" style={{ color: getUtilColor(alloc.percentage) }}>
                                {alloc.percentage}%
                              </span>
                              <button onClick={() => deleteAllocation(alloc.id)}
                                className="text-red-400 hover:text-red-500 transition-colors p-1">
                                <span className="text-xs">✕</span>
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <p className="mt-3 text-xs dark:text-white/30 text-gray-400">
                      Keine aktiven Projektzuweisungen.
                    </p>
                  )}

                  {/* Skills */}
                  {member.skills && member.skills.length > 0 && (
                    <div className="mt-3">
                      <div className="text-[10px] font-semibold dark:text-white/30 text-gray-400 mb-1.5">Skills</div>
                      <div className="flex flex-wrap gap-1">
                        {member.skills.map((skill) => (
                          <span key={skill.name} className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                            style={{ color: SKILL_LEVEL_CONFIG[skill.level].color, background: `${SKILL_LEVEL_CONFIG[skill.level].color}12` }}>
                            {skill.name}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Add Allocation */}
                  {showAllocForm === member.id ? (
                    <div className="mt-3 p-3 rounded-lg border border-black/[0.06] dark:border-white/[0.06] space-y-2">
                      <div className="text-xs font-semibold dark:text-white text-gray-800">Neue Zuweisung</div>
                      <div className="grid grid-cols-2 gap-2">
                        <select value={allocProjectId} onChange={(e) => setAllocProjectId(e.target.value)}
                          className="px-2 py-1.5 rounded-lg border text-xs col-span-2 cursor-pointer">
                          <option value="">Projekt wählen...</option>
                          {projects.filter((p) => p.status !== 'completed').map((p) => (
                            <option key={p.id} value={p.id}>{p.name}</option>
                          ))}
                        </select>
                        <div>
                          <label className="text-[10px] dark:text-white/30 text-gray-400">Anteil %</label>
                          <input type="number" min={5} max={100} step={5} value={allocPercent}
                            onChange={(e) => setAllocPercent(Number(e.target.value))}
                            className="w-full px-2 py-1.5 rounded-lg border text-xs" />
                        </div>
                        <div>
                          <label className="text-[10px] dark:text-white/30 text-gray-400">Von</label>
                          <input type="date" value={allocStart} onChange={(e) => setAllocStart(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border text-xs" />
                        </div>
                        <div className="col-span-2">
                          <label className="text-[10px] dark:text-white/30 text-gray-400">Bis</label>
                          <input type="date" value={allocEnd} onChange={(e) => setAllocEnd(e.target.value)}
                            className="w-full px-2 py-1.5 rounded-lg border text-xs" />
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button onClick={() => handleAddAllocation(member.id)}
                          className="px-3 py-1.5 rounded-lg bg-emerald-500 text-white text-xs font-semibold hover:bg-emerald-600">
                          Zuweisen
                        </button>
                        <button onClick={() => setShowAllocForm(null)}
                          className="px-3 py-1.5 rounded-lg border text-xs dark:text-white/50 text-gray-500">
                          Abbrechen
                        </button>
                      </div>
                    </div>
                  ) : (
                    <button onClick={() => setShowAllocForm(member.id)}
                      className="mt-3 text-xs text-blue-500 hover:text-blue-600 font-semibold">
                      + Projekt zuweisen
                    </button>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
