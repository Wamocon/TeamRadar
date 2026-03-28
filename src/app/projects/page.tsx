'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type ProjectType,
  type ProjectStatus,
} from '@/types';
import {
  Briefcase,
  Plus,
  Trash2,
  Edit3,
  Users,
  Building2,
  CalendarDays,
  Check,
  Filter,
} from 'lucide-react';

export default function ProjectsPage() {
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const addProject = useAppStore((s) => s.addProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const canCreate = hasMinRole('admin') || hasMinRole('department_lead');

  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<ViewMode>('grid');
  const [filterType, setFilterType] = useState<ProjectType | 'all'>('all');
  const [filterStatus, setFilterStatus] = useState<ProjectStatus | 'all'>('all');

  // Form state
  const [formName, setFormName] = useState('');
  const [formType, setFormType] = useState<ProjectType>('external');
  const [formStatus, setFormStatus] = useState<ProjectStatus>('active');
  const [formClient, setFormClient] = useState('');
  const [formDesc, setFormDesc] = useState('');
  const [formMembers, setFormMembers] = useState<string[]>([]);
  const [formStart, setFormStart] = useState('');
  const [formEnd, setFormEnd] = useState('');

  const resetForm = () => {
    setFormName('');
    setFormType('external');
    setFormStatus('active');
    setFormClient('');
    setFormDesc('');
    setFormMembers([]);
    setFormStart('');
    setFormEnd('');
    setEditId(null);
  };

  const openEdit = (id: string) => {
    const p = projects.find((pr) => pr.id === id);
    if (!p) return;
    setFormName(p.name);
    setFormType(p.type);
    setFormStatus(p.status);
    setFormClient(p.client ?? '');
    setFormDesc(p.description ?? '');
    setFormMembers(p.memberIds);
    setFormStart(p.startDate ?? '');
    setFormEnd(p.endDate ?? '');
    setEditId(id);
    setShowForm(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!formName.trim()) return;
    const data = {
      name: formName.trim(),
      type: formType,
      status: formStatus,
      client: formClient.trim() || undefined,
      description: formDesc.trim() || undefined,
      memberIds: formMembers,
      startDate: formStart || undefined,
      endDate: formEnd || undefined,
    };
    if (editId) {
      updateProject(editId, data);
    } else {
      addProject(data);
    }
    resetForm();
    setShowForm(false);
  };

  const toggleMember = (id: string) => {
    setFormMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const filtered = useMemo(() =>
    projects.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      return true;
    }),
    [projects, filterType, filterStatus]
  );

  const statuses = Object.keys(PROJECT_STATUS_CONFIG) as ProjectStatus[];
  const internalCount = projects.filter((p) => p.type === 'internal').length;
  const externalCount = projects.filter((p) => p.type === 'external').length;

  return (
    <div className="p-6 w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <Briefcase size={20} className="text-indigo-500" />
            </div>
            Projekte
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            {internalCount} interne · {externalCount} externe Projekte
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          {canCreate && (
            <button
              onClick={() => { resetForm(); setShowForm(!showForm); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-indigo-600 text-white text-sm font-semibold hover:from-indigo-600 hover:to-indigo-700 transition-all shadow-md shadow-indigo-500/20 shadow-none border-none cursor-pointer"
            >
              <Plus size={14} />
              Neues Projekt
            </button>
          )}
        </div>
      </div>

      {/* Filter */}
      <div className="flex flex-wrap gap-3">
        <div className="flex items-center gap-2">
          <Filter size={14} className="dark:text-white/30 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value as ProjectType | 'all')}
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-100 dark:border-white/5 bg-transparent cursor-pointer dark:text-white/60 text-gray-600"
            style={{ minWidth: 120 }}
          >
            <option value="all">Alle Typen</option>
            <option value="internal">🏢 Intern</option>
            <option value="external">🌐 Extern</option>
          </select>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value as ProjectStatus | 'all')}
            className="px-3 py-1.5 rounded-lg text-xs border border-slate-100 dark:border-white/5 bg-transparent cursor-pointer dark:text-white/60 text-gray-600"
            style={{ minWidth: 120 }}
          >
            <option value="all">Alle Status</option>
            {(Object.entries(PROJECT_STATUS_CONFIG) as [ProjectStatus, { label: string }][]).map(
              ([key, conf]) => <option key={key} value={key}>{conf.label}</option>
            )}
          </select>
        </div>
      </div>

      {/* Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="card-shimmer rounded-xl border border-slate-100 dark:border-white/5 p-5 space-y-4 animate-fade-in"
        >
          <h2 className="text-sm font-bold dark:text-white text-gray-900">
            {editId ? 'Projekt bearbeiten' : 'Neues Projekt anlegen'}
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Projektname *</label>
              <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm dark:text-white" placeholder="z.B. Cloud-Migration" required />
            </div>
            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Typ *</label>
              <div className="flex gap-2">
                {(['internal', 'external'] as ProjectType[]).map((t) => (
                  <button key={t} type="button" onClick={() => setFormType(t)}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                      formType === t
                        ? `border-current bg-opacity-10`
                        : 'border-black/[0.06] dark:border-white/[0.06] dark:text-white/50 text-gray-500 bg-transparent'
                    }`}
                    style={formType === t ? { color: PROJECT_TYPE_CONFIG[t].color, background: `${PROJECT_TYPE_CONFIG[t].color}15`, borderColor: `${PROJECT_TYPE_CONFIG[t].color}40` } : {}}>
                    {t === 'internal' ? '🏢' : '🌐'} {PROJECT_TYPE_CONFIG[t].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Status</label>
              <select value={formStatus} onChange={(e) => setFormStatus(e.target.value as ProjectStatus)}
                className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm cursor-pointer dark:text-white">
                {(Object.entries(PROJECT_STATUS_CONFIG) as [ProjectStatus, { label: string }][]).map(
                  ([key, conf]) => <option key={key} value={key}>{conf.label}</option>
                )}
              </select>
            </div>
            {formType === 'external' && (
              <div>
                <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Kunde</label>
                <input type="text" value={formClient} onChange={(e) => setFormClient(e.target.value)}
                  className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm dark:text-white" placeholder="z.B. BMW AG" />
              </div>
            )}
            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Startdatum</label>
              <input type="date" value={formStart} onChange={(e) => setFormStart(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm dark:text-white" />
            </div>
            <div>
              <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Enddatum</label>
              <input type="date" value={formEnd} onChange={(e) => setFormEnd(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm dark:text-white" />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Beschreibung</label>
            <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border dark:border-white/10 border-gray-200 bg-transparent text-sm dark:text-white" placeholder="Optional" />
          </div>

          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">
              Teammitglieder ({formMembers.length} ausgewählt)
            </label>
            <div className="flex flex-wrap gap-2 mt-1 max-h-32 overflow-y-auto p-1">
              {members.map((m) => (
                <button key={m.id} type="button" onClick={() => toggleMember(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    formMembers.includes(m.id)
                      ? 'bg-indigo-500/15 border-indigo-500/40 text-indigo-500'
                      : 'border-slate-100 dark:border-white/0.06 dark:text-white/50 text-gray-600 hover:border-indigo-500/20 bg-transparent'
                  }`}>
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-indigo-500 text-white text-sm font-semibold hover:bg-indigo-600 transition-colors border-none cursor-pointer">
              <Check size={14} />
              {editId ? 'Speichern' : 'Projekt erstellen'}
            </button>
            <button type="button" onClick={() => { resetForm(); setShowForm(false); }}
              className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600 bg-transparent cursor-pointer">
              Abbrechen
            </button>
          </div>
        </form>
      )}

      {/* Project List grouped by Status */}
      {filtered.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-indigo-500/10 flex items-center justify-center mb-4">
            <Briefcase size={36} className="text-indigo-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white/60 text-gray-500">Keine Projekte</h3>
          <p className="text-sm dark:text-white/30 text-gray-400 mt-1">
            {projects.length > 0 ? 'Kein Projekt passt zum Filter.' : 'Lege ein Projekt an, um Berater zuzuordnen.'}
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {statuses.map((status) => {
            const statusProjects = filtered.filter((p) => p.status === status);
            if (statusProjects.length === 0) return null;
            const statusConf = PROJECT_STATUS_CONFIG[status];

            return (
              <CollapsiblePanel 
                key={status} 
                title={statusConf.label} 
                count={statusProjects.length}
                accentColor={statusConf.color}
              >
                <div className={viewMode === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 gap-4' : 'space-y-4'}>
                  {statusProjects.map((project) => {
                    const projMembers = members.filter((m) => project.memberIds.includes(m.id));
                    const typeConf = PROJECT_TYPE_CONFIG[project.type];
                    return (
                      <div key={project.id} className="card-shimmer rounded-xl border border-slate-100 dark:border-white/5 p-5 hover:border-indigo-500/20 transition-all">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold"
                                style={{ color: typeConf.color, background: `${typeConf.color}15`, border: `1px solid ${typeConf.color}30` }}>
                                {project.type === 'internal' ? '🏢' : '🌐'} {typeConf.label}
                              </span>
                            </div>
                            <h3 className="text-sm font-bold dark:text-white text-gray-900 truncate">
                              <a href={`/projects/${project.id}`} className="hover:text-indigo-500 transition-colors no-underline">{project.name}</a>
                            </h3>
                            {project.client && (
                              <div className="flex items-center gap-1.5 mt-1">
                                <Building2 size={11} className="dark:text-white/30 text-gray-400" />
                                <span className="text-xs dark:text-white/40 text-gray-500">{project.client}</span>
                              </div>
                            )}
                          </div>
                          <div className="flex gap-1 shrink-0">
                            {canCreate && (
                              <>
                                <button onClick={() => openEdit(project.id)}
                                  className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-indigo-500 hover:bg-indigo-500/10 transition-all bg-transparent border-none cursor-pointer">
                                  <Edit3 size={14} />
                                </button>
                                <button onClick={() => { if (confirm(`Projekt "${project.name}" wirklich löschen?`)) deleteProject(project.id); }}
                                  className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer">
                                  <Trash2 size={14} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>

                        {/* Timeline */}
                        {(project.startDate || project.endDate) && (
                          <div className="flex items-center gap-1.5 mt-3">
                            <CalendarDays size={11} className="dark:text-white/25 text-gray-400" />
                            <span className="text-[11px] dark:text-white/30 text-gray-400">
                              {project.startDate ? new Date(project.startDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : '–'}
                              {' → '}
                              {project.endDate ? new Date(project.endDate).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' }) : '–'}
                            </span>
                          </div>
                        )}

                        {/* Members */}
                        <div className="mt-4 flex items-center gap-2">
                          <Users size={11} className="dark:text-white/25 text-gray-400 shrink-0" />
                          <div className="flex flex-wrap gap-1.5">
                            {projMembers.length > 0 ? (
                              projMembers.map((m) => (
                                <span key={m.id} className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">
                                  {m.name}
                                </span>
                              ))
                            ) : (
                              <span className="text-[11px] dark:text-white/25 text-gray-400">Keine Mitglieder</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </CollapsiblePanel>
            );
          })}
        </div>
      )}
    </div>
  );
}
