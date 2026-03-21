'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { ALERT_TYPE_CONFIG, PROJECT_TYPE_CONFIG, type AlertType, type ProjectType } from '@/types';
import { ProjectTypeFilter } from '@/components/ui/ProjectTypeFilter';
import { AlertTriangle, CheckCircle, Users, Briefcase } from 'lucide-react';
import Link from 'next/link';

export default function AlertsPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const getAlerts = useAppStore((s) => s.getAlerts);

  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');

  const allAlerts = useMemo(() => getAlerts(), [getAlerts]);

  const projectTypeCounts = useMemo(() => ({
    internal: projects.filter((p) => p.type === 'internal').length,
    external: projects.filter((p) => p.type === 'external').length,
  }), [projects]);

  const alerts = useMemo(() => {
    if (filterType === 'all') return allAlerts;
    const typeProjectIds = new Set(projects.filter((p) => p.type === filterType).map((p) => p.id));
    return allAlerts.filter((a) => {
      if (!a.projectIds || a.projectIds.length === 0) {
        // no_allocation alerts: nicht relevant für Typ-Filter
        return false;
      }
      return a.projectIds.some((pid) => typeProjectIds.has(pid));
    });
  }, [allAlerts, filterType, projects]);

  const errors = alerts.filter((a) => a.severity === 'error');
  const warnings = alerts.filter((a) => a.severity === 'warning');

  const alertsByType = useMemo(() => {
    const grouped: Record<string, typeof alerts> = {};
    alerts.forEach((a) => {
      if (!grouped[a.type]) grouped[a.type] = [];
      grouped[a.type].push(a);
    });
    return grouped;
  }, [alerts]);

  return (
    <div className="p-4 sm:p-6 max-w-[1000px] mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-amber-400/20 border border-red-500/20 flex items-center justify-center">
            <AlertTriangle size={20} className="text-red-500" />
          </div>
          Alerts & Warnungen
        </h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
          Überbuchungen, Konflikte und Hinweise im Überblick
        </p>
      </div>

      {/* Intern/Extern Filter */}
      <ProjectTypeFilter value={filterType} onChange={setFilterType} counts={projectTypeCounts} />

      {/* Summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-red-500">{errors.length}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Fehler</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-amber-500">{warnings.length}</div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Warnungen</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black text-emerald-500">
            {members.length - alerts.filter((a) => a.type === 'overbooking').length}
          </div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">OK Mitarbeiter</div>
        </div>
        <div className="card-shimmer rounded-xl p-4 text-center">
          <div className="text-2xl font-black" style={{ color: alerts.length === 0 ? '#22c55e' : '#6b7280' }}>
            {alerts.length === 0 ? '✓' : alerts.length}
          </div>
          <div className="text-[10px] dark:text-white/40 text-gray-500">Gesamt</div>
        </div>
      </div>

      {/* All clear */}
      {alerts.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <div className="w-20 h-20 rounded-2xl bg-emerald-500/10 flex items-center justify-center mb-4">
            <CheckCircle size={36} className="text-emerald-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white/60 text-gray-500">Alles in Ordnung!</h3>
          <p className="text-sm dark:text-white/30 text-gray-400 mt-1">
            Keine Überbuchungen oder Konflikte erkannt.
          </p>
        </div>
      )}

      {/* Alerts grouped by type */}
      {(Object.entries(alertsByType) as [AlertType, typeof alerts][]).map(([type, typeAlerts]) => {
        const conf = ALERT_TYPE_CONFIG[type];
        return (
          <div key={type}>
            <h2 className="text-sm font-bold dark:text-white text-gray-900 mb-3 flex items-center gap-2">
              <span>{conf.icon}</span> {conf.label}
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded-full"
                style={{ color: conf.color, background: `${conf.color}15` }}>
                {typeAlerts.length}
              </span>
            </h2>
            <div className="space-y-2">
              {typeAlerts.map((alert) => {
                const member = members.find((m) => m.id === alert.memberId);
                const relatedProjects = (alert.projectIds ?? [])
                  .map((pid) => projects.find((p) => p.id === pid))
                  .filter(Boolean);

                return (
                  <div key={alert.id}
                    className="card-shimmer rounded-xl border p-4 transition-all"
                    style={{ borderColor: `${conf.color}20` }}>
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0 text-sm"
                        style={{ background: `${conf.color}12` }}>
                        {alert.severity === 'error' ? '🚨' : '⚠️'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm dark:text-white/80 text-gray-800">{alert.message}</p>
                        <div className="flex flex-wrap gap-2 mt-2">
                          {member && (
                            <Link href={`/members/${member.id}/edit`}
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full bg-blue-500/10 text-blue-500 hover:bg-blue-500/20 transition-colors">
                              <Users size={9} /> {member.name}
                            </Link>
                          )}
                          {relatedProjects.map((proj) => (
                            <Link key={proj!.id} href={`/projects/${proj!.id}`}
                              className="inline-flex items-center gap-1 text-[10px] font-medium px-2 py-0.5 rounded-full hover:bg-indigo-500/20 transition-colors"
                              style={{ color: PROJECT_TYPE_CONFIG[proj!.type].color, background: `${PROJECT_TYPE_CONFIG[proj!.type].color}10` }}>
                              <Briefcase size={9} /> {proj!.type === 'internal' ? '🏢' : '🌐'} {proj!.name}
                            </Link>
                          ))}
                          {alert.date && (
                            <span className="text-[10px] dark:text-white/30 text-gray-400 px-2 py-0.5">
                              {alert.date}
                            </span>
                          )}
                        </div>
                      </div>
                      <span className={`shrink-0 px-2 py-0.5 rounded-full text-[9px] font-bold ${
                        alert.severity === 'error'
                          ? 'bg-red-500/10 text-red-500'
                          : 'bg-amber-500/10 text-amber-500'
                      }`}>
                        {alert.severity === 'error' ? 'Fehler' : 'Warnung'}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}
