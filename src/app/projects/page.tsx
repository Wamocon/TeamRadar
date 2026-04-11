'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  type ProjectType,
  type ProjectStatus,
  type Project,
} from '@/types';
import {
  Briefcase,
  Plus,
  X,
  Users,
  Building2,
  TrendingUp,
  CheckCircle2,
  Clock,
  Search,
  ExternalLink,
  Edit3,
  Trash2,
  Save,
  Loader,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';

function formatDateDE(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function ProjectsPage() {
  const projects = useAppStore((s) => s.projects);
  const members = useAppStore((s) => s.members);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const addProject = useAppStore((s) => s.addProject);
  const updateProject = useAppStore((s) => s.updateProject);
  const deleteProject = useAppStore((s) => s.deleteProject);

  const canManage = hasMinRole('department_lead');

  const [filterType, setFilterType] = useState<'all' | ProjectType>('all');
  const [filterStatus, setFilterStatus] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [editMode, setEditMode] = useState(false);
  const [deletingProjectId, setDeletingProjectId] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  // Edit form state
  const [editName, setEditName] = useState('');
  const [editType, setEditType] = useState<ProjectType>('internal');
  const [editStatus, setEditStatus] = useState<ProjectStatus>('active');
  const [editClient, setEditClient] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editStartDate, setEditStartDate] = useState('');
  const [editEndDate, setEditEndDate] = useState('');

  const openProject = (project: Project) => {
    setSelectedProject(project);
    setEditMode(false);
    setEditName(project.name);
    setEditType(project.type);
    setEditStatus(project.status);
    setEditClient(project.client || '');
    setEditDescription(project.description || '');
    setEditStartDate(project.startDate || '');
    setEditEndDate(project.endDate || '');
  };

  const isDirty = editMode && selectedProject && (
    editName !== selectedProject.name ||
    editType !== selectedProject.type ||
    editStatus !== selectedProject.status ||
    editClient !== (selectedProject.client || '')
  );

  const handleSave = async () => {
    if (!selectedProject) return;
    setIsSaving(true);
    await updateProject(selectedProject.id, {
      name: editName,
      type: editType,
      status: editStatus,
      client: editClient,
      description: editDescription,
      startDate: editStartDate,
      endDate: editEndDate,
    });
    setSelectedProject((prev) => prev ? { ...prev, name: editName, type: editType, status: editStatus, client: editClient, description: editDescription, startDate: editStartDate, endDate: editEndDate } : null);
    setEditMode(false);
    setIsSaving(false);
  };

  // KPIs
  const kpis = useMemo(() => ({
    total: projects.length,
    external: projects.filter((p) => p.type === 'external').length,
    internal: projects.filter((p) => p.type === 'internal').length,
    active: projects.filter((p) => p.status === 'active').length,
    completed: projects.filter((p) => p.status === 'completed').length,
    planned: projects.filter((p) => p.status === 'planned').length,
  }), [projects]);

  const filtered = useMemo(() => {
    return projects.filter((p) => {
      if (filterType !== 'all' && p.type !== filterType) return false;
      if (filterStatus !== 'all' && p.status !== filterStatus) return false;
      if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.client?.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [projects, filterType, filterStatus, search]);

  const internalFiltered = filtered.filter((p) => p.type === 'internal');
  const externalFiltered = filtered.filter((p) => p.type === 'external');

  const ProjectCard = ({ project }: { project: Project }) => {
    const typeConf = PROJECT_TYPE_CONFIG[project.type];
    const statusConf = PROJECT_STATUS_CONFIG[project.status];
    const assignedCount = project.memberIds.length;
    const isOverdue = project.endDate && project.endDate < new Date().toISOString().slice(0, 10) && project.status !== 'completed';

    return (
      <button onClick={() => openProject(project)}
        className="w-full text-left p-4 rounded-xl border dark:border-white/[0.06] border-black/[0.06] hover:border-[rgba(99,102,241,0.3)] hover:bg-[var(--primary-light)] transition-all cursor-pointer bg-transparent group relative overflow-hidden">
        {/* Color bar */}
        <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: typeConf.color }} />

        <div className="flex items-start justify-between mb-3">
          <div className="flex items-center gap-2 min-w-0 flex-1">
            <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${typeConf.color}20` }}>
              <Briefcase size={13} style={{ color: typeConf.color }} />
            </div>
            <span className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{project.name}</span>
          </div>
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border ml-2 shrink-0" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>
            {statusConf.label}
          </span>
        </div>

        {project.client && (
          <div className="text-[10px] dark:text-white/40 text-gray-500 truncate mb-2">{project.client}</div>
        )}

        <div className="flex items-center gap-3 text-[9px] dark:text-white/30 text-gray-400 mt-auto">
          <span className="flex items-center gap-1"><Users size={9} />{assignedCount}</span>
          {project.startDate && <span>{project.startDate.slice(0, 7)}</span>}
          {isOverdue && <span className="text-red-400 font-bold flex items-center gap-0.5"><Clock size={9} /> Überfällig</span>}
        </div>
      </button>
    );
  };

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in">
      {/* ── Header ───────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <Briefcase size={20} className="text-[var(--primary)]" />
            </div>
            Projekte
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Übersicht aller internen und externen Projekte</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
            <Plus size={14} /> Neues Projekt
          </button>
        )}
      </div>

      {/* ── KPI Bar ───────────────────────────────────── */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Gesamt', value: kpis.total, color: '#6366f1' },
          { label: 'Extern', value: kpis.external, color: '#f97316' },
          { label: 'Intern', value: kpis.internal, color: '#6366f1' },
          { label: 'Aktiv', value: kpis.active, color: '#22c55e' },
          { label: 'Abgeschlossen', value: kpis.completed, color: '#6b7280' },
          { label: 'Geplant', value: kpis.planned, color: '#f59e0b' },
        ].map((kpi) => (
          <div key={kpi.label} className="card-shimmer rounded-xl p-3 text-center">
            <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[9px] dark:text-white/40 text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* ── Filter ────────────────────────────────────── */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Suchen..."
            className="bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.08] border-black/[0.08] rounded-lg py-1.5 pl-7 pr-3 text-xs focus:border-[var(--primary)] outline-none dark:text-white text-gray-900" />
        </div>
        {(['all', 'active', 'planned', 'completed'] as const).map((s) => (
          <button key={s} onClick={() => setFilterStatus(s as any)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${filterStatus === s ? 'bg-[var(--primary)] text-white' : 'dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] bg-transparent'}`}>
            {s === 'all' ? 'Alle' : PROJECT_STATUS_CONFIG[s as ProjectStatus]?.label}
          </button>
        ))}
      </div>

      {/* ── Projekte Grid (Intern + Extern getrennt) ── */}
      <div className="grid lg:grid-cols-3 gap-5">
        {/* Interne Projekte (2/3 Breite) */}
        <div className="lg:col-span-2 card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] border-black/[0.04] flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PROJECT_TYPE_CONFIG.internal.color }} />
            <h3 className="text-sm font-black dark:text-white text-gray-900">Interne Projekte</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${PROJECT_TYPE_CONFIG.internal.color}15`, color: PROJECT_TYPE_CONFIG.internal.color }}>
              {internalFiltered.length}
            </span>
          </div>
          <div className="p-3 grid sm:grid-cols-2 gap-2">
            {internalFiltered.map((p) => <ProjectCard key={p.id} project={p} />)}
            {internalFiltered.length === 0 && (
              <div className="col-span-2 text-center py-10 text-xs dark:text-white/30 text-gray-400">
                Keine internen Projekte {search || filterStatus !== 'all' ? 'für diesen Filter' : ''}
              </div>
            )}
          </div>
        </div>

        {/* Externe Projekte (1/3 Breite) */}
        <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
          <div className="px-4 py-3 border-b dark:border-white/[0.06] border-black/[0.04] flex items-center gap-2">
            <div className="w-2.5 h-2.5 rounded-full" style={{ background: PROJECT_TYPE_CONFIG.external.color }} />
            <h3 className="text-sm font-black dark:text-white text-gray-900">Externe Projekte</h3>
            <span className="ml-auto px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${PROJECT_TYPE_CONFIG.external.color}15`, color: PROJECT_TYPE_CONFIG.external.color }}>
              {externalFiltered.length}
            </span>
          </div>
          <div className="p-3 space-y-2">
            {externalFiltered.map((p) => <ProjectCard key={p.id} project={p} />)}
            {externalFiltered.length === 0 && (
              <div className="text-center py-10 text-xs dark:text-white/30 text-gray-400">
                Keine externen Projekte {search || filterStatus !== 'all' ? 'für diesen Filter' : ''}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ── Projekt Detail Popup ──────────────────────── */}
      {selectedProject && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedProject(null)}>
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 border-b dark:border-white/10 border-gray-100 flex items-start justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${PROJECT_TYPE_CONFIG[selectedProject.type].color}, ${PROJECT_TYPE_CONFIG[selectedProject.type].color}99)` }}>
                  <Briefcase size={18} />
                </div>
                <div>
                  {editMode ? (
                    <input value={editName} onChange={(e) => setEditName(e.target.value)}
                      className="text-base font-black dark:text-white text-gray-900 bg-transparent border-b dark:border-white/20 border-gray-300 outline-none focus:border-[var(--primary)] pb-0.5 w-full" />
                  ) : (
                    <h2 className="text-base font-black dark:text-white text-gray-900">{selectedProject.name}</h2>
                  )}
                  <div className="flex items-center gap-2 mt-0.5">
                    {editMode ? (
                      <>
                        <select value={editType} onChange={(e) => setEditType(e.target.value as ProjectType)}
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="internal">Intern</option>
                          <option value="external">Extern</option>
                        </select>
                        <select value={editStatus} onChange={(e) => setEditStatus(e.target.value as ProjectStatus)}
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="planned">Geplant</option>
                          <option value="active">Aktiv</option>
                          <option value="completed">Abgeschlossen</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: PROJECT_TYPE_CONFIG[selectedProject.type].color }}>
                          {PROJECT_TYPE_CONFIG[selectedProject.type].label}
                        </span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border" style={{ color: PROJECT_STATUS_CONFIG[selectedProject.status].color, borderColor: `${PROJECT_STATUS_CONFIG[selectedProject.status].color}40` }}>
                          {PROJECT_STATUS_CONFIG[selectedProject.status].label}
                        </span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {canManage && !editMode && (
                  <button onClick={() => setEditMode(true)} className="p-2 rounded-lg hover:bg-[var(--primary-light)] text-[var(--primary)] transition-all border-none bg-transparent cursor-pointer">
                    <Edit3 size={14} />
                  </button>
                )}
                {canManage && (
                  <button onClick={() => { setDeletingProjectId(selectedProject.id); setSelectedProject(null); }}
                    className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={() => setSelectedProject(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-5 space-y-4">
              {editMode ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="col-span-2 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Beschreibung</label>
                    <textarea value={editDescription} onChange={(e) => setEditDescription(e.target.value)} rows={2}
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] resize-none" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Kunde</label>
                    <input value={editClient} onChange={(e) => setEditClient(e.target.value)}
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Start</label>
                    <input type="date" value={editStartDate} onChange={(e) => setEditStartDate(e.target.value)}
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Ende</label>
                    <input type="date" value={editEndDate} onChange={(e) => setEditEndDate(e.target.value)}
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
                  </div>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3 text-xs">
                  {selectedProject.description && <div className="col-span-2"><span className="dark:text-white/40 text-gray-500">Beschreibung</span><div className="font-medium dark:text-white text-gray-900 mt-0.5">{selectedProject.description}</div></div>}
                  {selectedProject.client && <div><span className="dark:text-white/40 text-gray-500">Kunde</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{selectedProject.client}</div></div>}
                  <div><span className="dark:text-white/40 text-gray-500">Laufzeit</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDE(selectedProject.startDate)} – {formatDateDE(selectedProject.endDate)}</div></div>
                  <div><span className="dark:text-white/40 text-gray-500">Berater</span><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{selectedProject.memberIds.length} Personen</div></div>
                </div>
              )}

              {/* Assigned Members */}
              {!editMode && selectedProject.memberIds.length > 0 && (
                <div>
                  <div className="text-xs dark:text-white/40 text-gray-500 mb-2">Zugewiesene Berater</div>
                  <div className="flex flex-wrap gap-1.5">
                    {members.filter((m) => selectedProject.memberIds.includes(m.id)).map((m) => (
                      <span key={m.id} className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">
                        {m.name}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            {editMode && (
              <div className="px-5 py-3 border-t dark:border-white/10 border-gray-100 flex items-center justify-end gap-2">
                <button onClick={() => isDirty ? setShowCancelConfirm(true) : setEditMode(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer transition-colors">
                  Abbrechen
                </button>
                <button onClick={handleSave} disabled={isSaving}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50">
                  {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                  Speichern
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Delete Confirm */}
      {deletingProjectId && (
        <ConfirmModal title="Projekt löschen" message="Möchtest du dieses Projekt wirklich löschen?" confirmLabel="Löschen" cancelLabel="Abbrechen" variant="danger"
          onConfirm={() => { deleteProject(deletingProjectId); setDeletingProjectId(null); }}
          onCancel={() => setDeletingProjectId(null)} />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Neues Projekt erstellen" onClose={() => setShowCreateModal(false)}>
          <ProjectCreateForm onSave={() => setShowCreateModal(false)} onCancel={() => setShowCreateModal(false)} />
        </Modal>
      )}
    </div>
  );
}

function ProjectCreateForm({ onSave, onCancel }: { onSave: () => void; onCancel: () => void }) {
  const addProject = useAppStore((s) => s.addProject);
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('internal');
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [client, setClient] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      await addProject({ name: name.trim(), type, status, client, description, startDate: startDate || undefined, endDate: endDate || undefined, memberIds: [] });
      onSave();
    } catch (err: any) {
      setSaveError(err?.message || 'Unbekannter Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4 p-1">
      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400">
          <strong>Fehler:</strong> {saveError}
          <div className="mt-1 text-[10px] opacity-70">Prüfe ob die Datenbank-Migration vollständig ausgeführt wurde.</div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Projektname *</label>
          <input value={name} onChange={(e) => setName(e.target.value)} placeholder="Projektname eingeben"
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Typ</label>
          <select value={type} onChange={(e) => setType(e.target.value as ProjectType)}
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]">
            <option value="internal">Intern</option>
            <option value="external">Extern</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Status</label>
          <select value={status} onChange={(e) => setStatus(e.target.value as ProjectStatus)}
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]">
            <option value="planned">Geplant</option>
            <option value="active">Aktiv</option>
            <option value="completed">Abgeschlossen</option>
          </select>
        </div>
        <div className="col-span-2 space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Beschreibung</label>
          <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] resize-none" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Start</label>
          <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)}
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Ende</label>
          <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)}
            className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
        </div>
      </div>
      <div className="flex gap-2 justify-end pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 border dark:border-white/10 border-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer bg-transparent transition-colors">Abbrechen</button>
        <button onClick={handleCreate} disabled={saving || !name.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Erstellen
        </button>
      </div>
    </div>
  );
}
