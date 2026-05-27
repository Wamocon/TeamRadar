'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  PROJECT_TYPE_CONFIG,
  PROJECT_STATUS_CONFIG,
  PROJECT_MEMBER_ROLE_CONFIG,
  type ProjectType,
  type ProjectStatus,
  type ProjectMemberRole,
  type Project,
} from '@/types';
import {
  Briefcase,
  Plus,
  X,
  Users,
  Building2,
  Clock,
  Search,
  Edit3,
  Trash2,
  Save,
  Loader,
  ChevronDown,
  ChevronUp,
  MapPin,
  Target,
  AlertTriangle,
  Euro,
  Layers,
  Phone,
  Mail,
  StickyNote,
  Info,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';

function formatDateDE(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const INPUT_CLS = 'w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-(--primary)';
const LABEL_CLS = 'text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500';

const PRIORITY_CONFIG = {
  low:      { label: 'Niedrig',  color: '#22c55e' },
  medium:   { label: 'Mittel',   color: '#f59e0b' },
  high:     { label: 'Hoch',     color: '#f97316' },
  critical: { label: 'Kritisch', color: '#ef4444' },
} as const;

// ── ProjectCard ──────────────────────────────────────────────────────────────
function ProjectCard({ project, onOpen }: { project: Project; onOpen: (p: Project) => void }) {
  const typeConf = PROJECT_TYPE_CONFIG[project.type];
  const statusConf = PROJECT_STATUS_CONFIG[project.status];
  const priority = project.priority ? PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG] : null;
  const isOverdue = project.endDate && project.endDate < new Date().toISOString().slice(0, 10) && project.status !== 'completed';

  return (
    <button onClick={() => onOpen(project)}
      className="w-full text-left p-4 rounded-xl border dark:border-white/6 border-black/6 hover:border-[rgba(99,102,241,0.3)] hover:bg-(--primary-light) transition-all cursor-pointer bg-transparent group relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: typeConf.color }} />
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${typeConf.color}20` }}>
            <Briefcase size={13} style={{ color: typeConf.color }} />
          </div>
          <span className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-(--primary) transition-colors">{project.name}</span>
        </div>
        <div className="flex items-center gap-1 shrink-0 ml-2">
          {priority && <span className="w-1.5 h-1.5 rounded-full" style={{ background: priority.color }} title={priority.label} />}
          <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>
            {statusConf.label}
          </span>
        </div>
      </div>
      {project.client && <div className="text-[10px] dark:text-white/40 text-gray-500 truncate mb-1">{project.client}</div>}
      {project.projectNumber && <div className="text-[9px] dark:text-white/30 text-gray-400 truncate mb-1 font-mono">#{project.projectNumber}</div>}
      <div className="flex items-center gap-3 text-[9px] dark:text-white/30 text-gray-400 mt-auto">
        <span className="flex items-center gap-1"><Users size={9} />{project.memberIds.length}</span>
        {project.startDate && <span>{project.startDate.slice(0, 7)}</span>}
        {project.type === 'external' && project.maxDays != null && <span className="ml-auto font-bold text-orange-500">{project.maxDays}d</span>}
        {isOverdue && <span className="text-red-400 font-bold flex items-center gap-0.5"><Clock size={9} /> Überfällig</span>}
      </div>
    </button>
  );
}

// ── Detailliertes Projekt-Popup ──────────────────────────────────────────────
type DetailTab = 'overview' | 'details' | 'team' | 'budget' | 'notes';

function ProjectDetailPopup({
  project,
  onClose,
  canManage,
  onDelete,
}: {
  project: Project;
  onClose: () => void;
  canManage: boolean;
  onDelete: (id: string) => void;
}) {
  const members = useAppStore((s) => s.members);
  const updateProject = useAppStore((s) => s.updateProject);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [popupSize, setPopupSize] = useState<'S' | 'M' | 'L'>('M');
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);
  const [, setDeletingProjectId] = useState<string | null>(null);

  // Edit states
  const [editName, setEditName] = useState(project.name);
  const [editType, setEditType] = useState<ProjectType>(project.type);
  const [editStatus, setEditStatus] = useState<ProjectStatus>(project.status);
  const [editPriority, setEditPriority] = useState<string>(project.priority || 'medium');
  const [editClient, setEditClient] = useState(project.client || '');
  const [editClientContact, setEditClientContact] = useState(project.clientContact || '');
  const [editClientEmail, setEditClientEmail] = useState(project.clientEmail || '');
  const [editClientPhone, setEditClientPhone] = useState(project.clientPhone || '');
  const [editDescription, setEditDescription] = useState(project.description || '');
  const [editObjectives, setEditObjectives] = useState(project.objectives || '');
  const [editDeliverables, setEditDeliverables] = useState(project.keyDeliverables || '');
  const [editRisks, setEditRisks] = useState(project.risks || '');
  const [editNotes, setEditNotes] = useState(project.notes || '');
  const [editProjectNumber, setEditProjectNumber] = useState(project.projectNumber || '');
  const [editLocation, setEditLocation] = useState(project.location || '');
  const [editRemotePercentage, setEditRemotePercentage] = useState(project.remotePercentage != null ? String(project.remotePercentage) : '');
  const [editStartDate, setEditStartDate] = useState(project.startDate || '');
  const [editEndDate, setEditEndDate] = useState(project.endDate || '');
  const [editPlannedEndDate, setEditPlannedEndDate] = useState(project.plannedEndDate || '');
  const [editMaxDays, setEditMaxDays] = useState(project.maxDays != null ? String(project.maxDays) : '');
  const [editBudgetHours, setEditBudgetHours] = useState(project.budgetHours != null ? String(project.budgetHours) : '');
  const [editBudgetAmount, setEditBudgetAmount] = useState(project.budgetAmount != null ? String(project.budgetAmount) : '');
  const [editFramework, setEditFramework] = useState(project.framework || '');
  const [editReportingCycle, setEditReportingCycle] = useState(project.reportingCycle || '');
  const [editTags, setEditTags] = useState((project.tags || []).join(', '));
  const [editTechnologies, setEditTechnologies] = useState((project.technologies || []).join(', '));

  // Mitglieder mit Rollen
  const [memberRoles, setMemberRoles] = useState<Record<string, ProjectMemberRole>>(() => {
    const map: Record<string, ProjectMemberRole> = {};
    (project.projectMembers || []).forEach(pm => { map[pm.memberId] = pm.role; });
    project.memberIds.forEach(id => { if (!map[id]) map[id] = 'operative'; });
    return map;
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set(project.memberIds));

  const handleSave = async () => {
    setIsSaving(true);
    const memberIdsArr = Array.from(selectedMemberIds);
    const projectMembers = memberIdsArr.map(id => ({ memberId: id, role: memberRoles[id] || 'operative' as ProjectMemberRole }));
    await updateProject(project.id, {
      name: editName, type: editType, status: editStatus, priority: editPriority as any,
      client: editClient || undefined, clientContact: editClientContact || undefined,
      clientEmail: editClientEmail || undefined, clientPhone: editClientPhone || undefined,
      description: editDescription || undefined, objectives: editObjectives || undefined,
      keyDeliverables: editDeliverables || undefined, risks: editRisks || undefined, notes: editNotes || undefined,
      projectNumber: editProjectNumber || undefined, location: editLocation || undefined,
      remotePercentage: editRemotePercentage ? parseInt(editRemotePercentage) : undefined,
      startDate: editStartDate || undefined, endDate: editEndDate || undefined,
      plannedEndDate: editPlannedEndDate || undefined,
      maxDays: editMaxDays ? parseInt(editMaxDays) : undefined,
      budgetHours: editBudgetHours ? parseInt(editBudgetHours) : undefined,
      budgetAmount: editBudgetAmount ? parseFloat(editBudgetAmount) : undefined,
      framework: editFramework || undefined, reportingCycle: editReportingCycle || undefined,
      tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      technologies: editTechnologies ? editTechnologies.split(',').map(t => t.trim()).filter(Boolean) : [],
      memberIds: memberIdsArr, projectMembers,
    });
    setEditMode(false);
    setIsSaving(false);
  };

  const typeConf = PROJECT_TYPE_CONFIG[editType];
  const statusConf = PROJECT_STATUS_CONFIG[editStatus];
  const sizeClass = popupSize === 'S' ? 'max-w-lg' : popupSize === 'M' ? 'max-w-3xl' : 'max-w-[95vw]';

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Übersicht', icon: Info },
    { id: 'details',  label: 'Details',   icon: Layers },
    { id: 'team',     label: 'Team',      icon: Users },
    { id: 'budget',   label: 'Budget',    icon: Euro },
    { id: 'notes',    label: 'Notizen',   icon: StickyNote },
  ];

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
        <div
          className={`relative w-full ${sizeClass} mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] flex flex-col transition-all duration-300`}
          onClick={e => e.stopPropagation()}
        >
          {/* Header */}
          <div className="p-4 border-b dark:border-white/10 border-gray-100 shrink-0">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center text-white shrink-0"
                  style={{ background: `linear-gradient(135deg, ${typeConf.color}, ${typeConf.color}99)` }}>
                  <Briefcase size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  {editMode ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)} title="Name"
                      className="text-sm font-black dark:text-white text-gray-900 bg-transparent border-b dark:border-white/20 border-gray-300 outline-none focus:border-(--primary) pb-0.5 w-full" />
                  ) : (
                    <h2 className="text-sm font-black dark:text-white text-gray-900 truncate">{project.name}</h2>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {editMode ? (
                      <>
                        <select value={editType} onChange={e => setEditType(e.target.value as ProjectType)} title="Typ"
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="internal">Intern</option><option value="external">Extern</option>
                        </select>
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value as ProjectStatus)} title="Status"
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="planned">Geplant</option><option value="active">Aktiv</option><option value="completed">Abgeschlossen</option>
                        </select>
                        <select value={editPriority} onChange={e => setEditPriority(e.target.value)} title="Priorität"
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: typeConf.color }}>{typeConf.label}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>{statusConf.label}</span>
                        {project.priority && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold" style={{ color: PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG]?.color, background: `${PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG]?.color}15` }}>
                            {PRIORITY_CONFIG[project.priority as keyof typeof PRIORITY_CONFIG]?.label}
                          </span>
                        )}
                        {project.projectNumber && <span className="text-[9px] font-mono dark:text-white/30 text-gray-400">#{project.projectNumber}</span>}
                      </>
                    )}
                  </div>
                </div>
              </div>
              {/* Größen S/M/L */}
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {(['S', 'M', 'L'] as const).map(s => (
                  <button key={s} onClick={() => setPopupSize(s)}
                    className={`w-6 h-6 rounded text-[9px] font-black transition-all border-none cursor-pointer ${popupSize === s ? 'bg-(--primary) text-white' : 'dark:bg-white/5 bg-black/5 dark:text-white/40 text-gray-400 hover:bg-(--primary-light) hover:text-(--primary)'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {canManage && !editMode && (
                  <button onClick={() => setEditMode(true)} title="Bearbeiten" className="p-1.5 rounded-lg hover:bg-(--primary-light) text-(--primary) border-none bg-transparent cursor-pointer transition-colors">
                    <Edit3 size={14} />
                  </button>
                )}
                {canManage && !editMode && (
                  <button onClick={() => setConfirmDelete(true)} title="Löschen" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 border-none bg-transparent cursor-pointer transition-colors">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={onClose} title="Schließen" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500 transition-colors">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Tabs */}
            <div className="flex gap-0.5 flex-wrap">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${
                    activeTab === tab.id ? 'bg-(--primary) text-white' : 'dark:text-white/40 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'
                  }`}>
                  <tab.icon size={11} />{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── Tab: Übersicht ── */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                {editMode ? (
                  <div className="space-y-3">
                    <div>
                      <label className={LABEL_CLS}>Beschreibung</label>
                      <textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3}
                        className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Kurzbeschreibung des Projekts..." />
                    </div>
                    <div>
                      <label className={LABEL_CLS}>Projektziele</label>
                      <textarea value={editObjectives} onChange={e => setEditObjectives(e.target.value)} rows={2}
                        className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Was soll das Projekt erreichen?" />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={LABEL_CLS}>Startzeitpunkt</label><input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} title="Startdatum" className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Ende (geplant)</label><input type="date" value={editPlannedEndDate} onChange={e => setEditPlannedEndDate(e.target.value)} title="Geplantes Ende" className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Tatsächl. Ende</label><input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} title="Tatsaechliches Ende" className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Projektnummer</label><input value={editProjectNumber} onChange={e => setEditProjectNumber(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="PRJ-2024-001" /></div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={LABEL_CLS}>Framework / Methodik</label><input value={editFramework} onChange={e => setEditFramework(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Scrum, Kanban..." /></div>
                      <div><label className={LABEL_CLS}>Berichtsrhythmus</label><input value={editReportingCycle} onChange={e => setEditReportingCycle(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Wöchentlich..." /></div>
                    </div>
                    <div><label className={LABEL_CLS}>Tags (kommagetrennt)</label><input value={editTags} onChange={e => setEditTags(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Tag1, Tag2, Tag3" /></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {project.description && (
                      <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2">
                        <div className={LABEL_CLS}>Beschreibung</div>
                        <p className="text-xs dark:text-white/70 text-gray-700 mt-1 leading-relaxed">{project.description}</p>
                      </div>
                    )}
                    {project.objectives && (
                      <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2">
                        <div className={LABEL_CLS}>Projektziele</div>
                        <p className="text-xs dark:text-white/70 text-gray-700 mt-1 leading-relaxed">{project.objectives}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div className="p-2.5 rounded-lg border dark:border-white/6 border-black/6">
                        <div className={LABEL_CLS}>Laufzeit</div>
                        <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDE(project.startDate)} – {formatDateDE(project.endDate)}</div>
                      </div>
                      {project.plannedEndDate && (
                        <div className="p-2.5 rounded-lg border dark:border-white/6 border-black/6">
                          <div className={LABEL_CLS}>Geplantes Ende</div>
                          <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDE(project.plannedEndDate)}</div>
                        </div>
                      )}
                      {project.framework && (
                        <div className="p-2.5 rounded-lg border dark:border-white/6 border-black/6">
                          <div className={LABEL_CLS}>Methodik</div>
                          <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{project.framework}</div>
                        </div>
                      )}
                      {project.reportingCycle && (
                        <div className="p-2.5 rounded-lg border dark:border-white/6 border-black/6">
                          <div className={LABEL_CLS}>Berichtsrhythmus</div>
                          <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{project.reportingCycle}</div>
                        </div>
                      )}
                    </div>
                    {(project.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {project.tags!.map(tag => (
                          <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-(--primary-light) text-(--primary) border border-[rgba(99,102,241,0.2)]">{tag}</span>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Details ── */}
            {activeTab === 'details' && (
              <div className="space-y-3">
                {editMode ? (
                  <div className="space-y-3">
                    <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 space-y-2">
                      <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5">
                        <Building2 size={12} className="text-(--primary)" /> Kundeninformationen
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={LABEL_CLS}>Kundenname</label><input value={editClient} onChange={e => setEditClient(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Kunden GmbH" /></div>
                        <div><label className={LABEL_CLS}>Ansprechpartner</label><input value={editClientContact} onChange={e => setEditClientContact(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Max Mustermann" /></div>
                        <div><label className={LABEL_CLS}>E-Mail</label><input type="email" value={editClientEmail} onChange={e => setEditClientEmail(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="kontakt@kunde.de" /></div>
                        <div><label className={LABEL_CLS}>Telefon</label><input value={editClientPhone} onChange={e => setEditClientPhone(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="+49 123 456789" /></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 space-y-2">
                      <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5">
                        <MapPin size={12} className="text-(--primary)" /> Standort & Arbeitsweise
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div><label className={LABEL_CLS}>Projektstandort</label><input value={editLocation} onChange={e => setEditLocation(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="München, Berlin..." /></div>
                        <div><label className={LABEL_CLS}>Remote-Anteil (%)</label><input type="number" min={0} max={100} value={editRemotePercentage} onChange={e => setEditRemotePercentage(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="0-100" /></div>
                      </div>
                    </div>
                    <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 space-y-2">
                      <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5">
                        <Layers size={12} className="text-(--primary)" /> Technologien & Risiken
                      </div>
                      <div><label className={LABEL_CLS}>Technologien (kommagetrennt)</label><input value={editTechnologies} onChange={e => setEditTechnologies(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="React, Node.js..." /></div>
                      <div><label className={LABEL_CLS}>Risiken</label><textarea value={editRisks} onChange={e => setEditRisks(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Bekannte Risiken, Abhängigkeiten..." /></div>
                      <div><label className={LABEL_CLS}>Liefergegenstände / Deliverables</label><textarea value={editDeliverables} onChange={e => setEditDeliverables(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Welche Ergebnisse werden erwartet?" /></div>
                      {editType === 'external' && (
                        <div><label className={`${LABEL_CLS} text-orange-500`}>Max. Tage / Jahr</label><input type="number" min={0} value={editMaxDays} onChange={e => setEditMaxDays(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="220" /></div>
                      )}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3 text-xs">
                    {(project.client || project.clientContact) && (
                      <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 space-y-2">
                        <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5"><Building2 size={12} /> Kundeninformationen</div>
                        {project.client && <div className="flex items-center gap-2"><span className="dark:text-white/40 text-gray-500 w-20 shrink-0">Kunde</span><span className="font-semibold dark:text-white text-gray-900">{project.client}</span></div>}
                        {project.clientContact && <div className="flex items-center gap-2"><span className="dark:text-white/40 text-gray-500 w-20 shrink-0">Kontakt</span><span className="font-semibold dark:text-white text-gray-900">{project.clientContact}</span></div>}
                        {project.clientEmail && <div className="flex items-center gap-2"><Mail size={10} className="dark:text-white/30 shrink-0" /><a href={`mailto:${project.clientEmail}`} className="text-(--primary) hover:underline">{project.clientEmail}</a></div>}
                        {project.clientPhone && <div className="flex items-center gap-2"><Phone size={10} className="dark:text-white/30 shrink-0" /><span>{project.clientPhone}</span></div>}
                      </div>
                    )}
                    {(project.location || project.remotePercentage != null) && (
                      <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 space-y-1">
                        <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5"><MapPin size={12} /> Standort</div>
                        {project.location && <div className="font-semibold dark:text-white text-gray-900">{project.location}</div>}
                        {project.remotePercentage != null && <div className="dark:text-white/50 text-gray-600">{project.remotePercentage}% Remote-Anteil</div>}
                      </div>
                    )}
                    {(project.technologies?.length ?? 0) > 0 && (
                      <div className="p-3 rounded-xl border dark:border-white/6 border-black/6">
                        <div className="text-[10px] font-black dark:text-white/60 text-gray-600 mb-1.5 flex items-center gap-1.5"><Layers size={12} /> Technologien</div>
                        <div className="flex flex-wrap gap-1">
                          {project.technologies!.map(t => (
                            <span key={t} className="px-1.5 py-0.5 rounded-md text-[9px] font-semibold bg-black/5 dark:bg-white/5 dark:text-white/70 text-gray-700">{t}</span>
                          ))}
                        </div>
                      </div>
                    )}
                    {project.risks && (
                      <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30">
                        <div className="text-[10px] font-black text-amber-700 dark:text-amber-400 flex items-center gap-1.5 mb-1"><AlertTriangle size={12} /> Risiken</div>
                        <p className="text-xs text-amber-800 dark:text-amber-300 leading-relaxed">{project.risks}</p>
                      </div>
                    )}
                    {project.keyDeliverables && (
                      <div className="p-3 rounded-xl border dark:border-white/6 border-black/6">
                        <div className="text-[10px] font-black dark:text-white/60 text-gray-600 flex items-center gap-1.5 mb-1"><Target size={12} /> Deliverables</div>
                        <p className="text-xs dark:text-white/70 text-gray-700 leading-relaxed">{project.keyDeliverables}</p>
                      </div>
                    )}
                    {project.type === 'external' && project.maxDays != null && (
                      <div className="p-3 rounded-xl border border-orange-200 dark:border-orange-700/30 bg-orange-50 dark:bg-orange-900/10">
                        <div className="text-[10px] font-black text-orange-600 dark:text-orange-400">Max. Beauftragungstage / Jahr</div>
                        <div className="text-xl font-black text-orange-600 dark:text-orange-400 mt-0.5">{project.maxDays} Tage</div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Team ── */}
            {activeTab === 'team' && (
              <div className="space-y-2">
                <div className="text-xs dark:text-white/50 text-gray-600 p-2 rounded-lg bg-black/2 dark:bg-white/2">
                  Berater können als <strong className="text-(--primary)">Operativ</strong>, <strong className="text-amber-500">Unterstützend</strong> oder <strong className="text-gray-500">Informierend</strong> markiert werden.
                </div>
                {members.map(member => {
                  const isSelected = selectedMemberIds.has(member.id);
                  const role = memberRoles[member.id] || 'operative';
                  const roleConf = PROJECT_MEMBER_ROLE_CONFIG[role];
                  return (
                    <div key={member.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isSelected ? 'border-[rgba(99,102,241,0.3)] bg-(--primary-light)' : 'dark:border-white/6 border-black/6'}`}>
                      <div className="w-7 h-7 rounded-lg bg-(--primary-light) flex items-center justify-center shrink-0 text-[10px] font-black text-(--primary)">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold dark:text-white text-gray-900 truncate">{member.name}</div>
                        <div className="text-[9px] dark:text-white/40 text-gray-500 truncate">{member.role} · {member.department}</div>
                      </div>
                      {editMode ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input type="checkbox" title="Teilnehmer" checked={isSelected} onChange={e => {
                            setSelectedMemberIds(prev => { const n = new Set(prev); e.target.checked ? n.add(member.id) : n.delete(member.id); return n; });
                          }} className="w-4 h-4 rounded cursor-pointer accent-(--primary)" />
                          {isSelected && (
                            <select value={role} title="Rolle" onChange={e => setMemberRoles(prev => ({ ...prev, [member.id]: e.target.value as ProjectMemberRole }))}
                              className="text-[9px] rounded-md px-1 py-0.5 border dark:border-white/10 border-gray-200 bg-transparent dark:text-white text-gray-900 outline-none cursor-pointer">
                              <option value="operative">Operativ</option>
                              <option value="supporting">Unterstützend</option>
                              <option value="informed">Informierend</option>
                            </select>
                          )}
                        </div>
                      ) : (
                        isSelected && (
                          <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0" style={{ color: roleConf.color, borderColor: `${roleConf.color}40`, background: `${roleConf.color}10` }}>
                            {roleConf.label}
                          </span>
                        )
                      )}
                    </div>
                  );
                })}
                {members.length === 0 && <div className="text-center py-8 text-xs dark:text-white/30 text-gray-400">Keine Mitglieder vorhanden</div>}
              </div>
            )}

            {/* ── Tab: Budget ── */}
            {activeTab === 'budget' && (
              <div className="space-y-3">
                {editMode ? (
                  <div className="grid grid-cols-2 gap-3">
                    <div><label className={LABEL_CLS}>Budget (€)</label><input type="number" min={0} value={editBudgetAmount} onChange={e => setEditBudgetAmount(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="50000" /></div>
                    <div><label className={LABEL_CLS}>Stunden-Budget</label><input type="number" min={0} value={editBudgetHours} onChange={e => setEditBudgetHours(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="1000" /></div>
                    {editType === 'external' && (
                      <div className="col-span-2"><label className={`${LABEL_CLS} text-orange-500`}>Max. Beauftragungstage / Jahr</label><input type="number" min={0} value={editMaxDays} onChange={e => setEditMaxDays(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="220" /></div>
                    )}
                  </div>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {project.budgetAmount != null && (
                      <div className="p-4 rounded-xl border dark:border-white/6 border-black/6 text-center">
                        <div className={LABEL_CLS}>Budget</div>
                        <div className="text-2xl font-black dark:text-white text-gray-900 mt-1">{project.budgetAmount.toLocaleString('de-DE')} €</div>
                      </div>
                    )}
                    {project.budgetHours != null && (
                      <div className="p-4 rounded-xl border dark:border-white/6 border-black/6 text-center">
                        <div className={LABEL_CLS}>Stunden-Budget</div>
                        <div className="text-2xl font-black dark:text-white text-gray-900 mt-1">{project.budgetHours} h</div>
                      </div>
                    )}
                    {project.type === 'external' && project.maxDays != null && (
                      <div className="p-4 rounded-xl border border-orange-200 dark:border-orange-700/30 text-center col-span-2">
                        <div className={`${LABEL_CLS} text-orange-500`}>Max. Beauftragungstage / Jahr</div>
                        <div className="text-2xl font-black mt-1 text-orange-500">{project.maxDays} Tage</div>
                      </div>
                    )}
                    {!project.budgetAmount && !project.budgetHours && !project.maxDays && (
                      <div className="col-span-2 text-center py-8 text-xs dark:text-white/30 text-gray-400">
                        Keine Budget-Informationen hinterlegt.{canManage && ' Klicke auf "Bearbeiten" um Daten zu erfassen.'}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Tab: Notizen ── */}
            {activeTab === 'notes' && (
              <div className="space-y-3">
                {editMode ? (
                  <div>
                    <label className={LABEL_CLS}>Interne Notizen / How-Tos / Eckdaten</label>
                    <textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={10}
                      className={`${INPUT_CLS} mt-1 resize-none`}
                      placeholder="Interne Notizen, How-Tos, wichtige Ansprechpartner, Zugangsdaten-Hinweise, Abläufe..." />
                  </div>
                ) : project.notes ? (
                  <div className="p-4 rounded-xl border dark:border-white/6 border-black/6">
                    <div className={`${LABEL_CLS} mb-2`}>Interne Notizen</div>
                    <pre className="text-xs dark:text-white/70 text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{project.notes}</pre>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs dark:text-white/30 text-gray-400">
                    Keine Notizen vorhanden.{canManage && ' Klicke auf "Bearbeiten" um Notizen hinzuzufügen.'}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {editMode && (
            <div className="px-4 py-3 border-t dark:border-white/10 border-gray-100 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer transition-colors">
                Abbrechen
              </button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--primary) text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />}
                Speichern
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Delete Confirm */}
      {confirmDelete && (
        <ConfirmModal title="Projekt löschen" message={`Möchtest du "${project.name}" wirklich löschen?`} confirmLabel="Löschen" cancelLabel="Abbrechen" variant="danger"
          onConfirm={() => { setDeletingProjectId(null); onDelete(project.id); onClose(); }}
          onCancel={() => { setConfirmDelete(false); setDeletingProjectId(null); }} />
      )}

      {/* Cancel unsaved changes confirm */}
      {showCancelConfirm && (
        <ConfirmModal title="Änderungen verwerfen?" message="Es gibt ungespeicherte Änderungen. Wirklich abbrechen?" confirmLabel="Verwerfen" cancelLabel="Weiter bearbeiten" variant="danger"
          onConfirm={() => { setShowCancelConfirm(false); setEditMode(false); }}
          onCancel={() => setShowCancelConfirm(false)} />
      )}
    </>
  );
}

// ── Hauptseite ───────────────────────────────────────────────────────────────
export default function ProjectsPage() {
  const projects = useAppStore((s) => s.projects);
  const members = useAppStore((s) => s.members);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const deleteProject = useAppStore((s) => s.deleteProject);

  const canManage = hasMinRole('department_lead');

  const [filterStatus, setFilterStatus] = useState<'all' | ProjectStatus>('all');
  const [search, setSearch] = useState('');
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [openInternal, setOpenInternal] = useState(true);
  const [openExternal, setOpenExternal] = useState(true);

  const kpis = useMemo(() => ({
    total: projects.length,
    external: projects.filter(p => p.type === 'external').length,
    internal: projects.filter(p => p.type === 'internal').length,
    active: projects.filter(p => p.status === 'active').length,
    completed: projects.filter(p => p.status === 'completed').length,
    planned: projects.filter(p => p.status === 'planned').length,
  }), [projects]);

  const filtered = useMemo(() => projects.filter(p => {
    if (filterStatus !== 'all' && p.status !== filterStatus) return false;
    if (search && !p.name.toLowerCase().includes(search.toLowerCase()) && !p.client?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [projects, filterStatus, search]);

  const internalFiltered = filtered.filter(p => p.type === 'internal');
  const externalFiltered = filtered.filter(p => p.type === 'external');

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <Briefcase size={20} className="text-(--primary)" />
            </div>
            Projekte
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Übersicht aller internen und externen Projekte</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--primary) text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
            <Plus size={14} /> Neues Projekt
          </button>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Gesamt',        value: kpis.total,     cls: 'text-indigo-500' },
          { label: 'Extern',        value: kpis.external,  cls: 'text-orange-500' },
          { label: 'Intern',        value: kpis.internal,  cls: 'text-indigo-500' },
          { label: 'Aktiv',         value: kpis.active,    cls: 'text-green-500' },
          { label: 'Abgeschlossen', value: kpis.completed, cls: 'text-gray-500' },
          { label: 'Geplant',       value: kpis.planned,   cls: 'text-amber-500' },
        ].map(kpi => (
          <div key={kpi.label} className="card-shimmer rounded-xl p-3 text-center">
            <div className={`text-xl font-black ${kpi.cls}`}>{kpi.value}</div>
            <div className="text-[9px] dark:text-white/40 text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
            className="bg-black/2 dark:bg-white/2 border dark:border-white/8 border-black/8 rounded-lg py-1.5 pl-7 pr-3 text-xs focus:border-(--primary) outline-none dark:text-white text-gray-900" />
        </div>
        {(['all', 'active', 'planned', 'completed'] as const).map(s => (
          <button key={s} onClick={() => setFilterStatus(s as any)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${filterStatus === s ? 'bg-(--primary) text-white' : 'dark:text-white/40 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'}`}>
            {s === 'all' ? 'Alle' : PROJECT_STATUS_CONFIG[s as ProjectStatus]?.label}
          </button>
        ))}
      </div>

      {/* Projekte Grid */}
      <div className="grid lg:grid-cols-3 gap-5">
        <div className="lg:col-span-2 card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
          <button onClick={() => setOpenInternal(v => !v)}
            className={`w-full flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors ${openInternal ? 'border-b dark:border-white/6 border-black/4' : ''}`}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-indigo-500" />
            <h3 className="text-sm font-black dark:text-white text-gray-900">Interne Projekte</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-indigo-500/15 text-indigo-500">{internalFiltered.length}</span>
            <span className="ml-auto dark:text-white/30 text-gray-400">{openInternal ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
          </button>
          {openInternal && (
            <div className="p-3 grid sm:grid-cols-2 gap-2">
              {internalFiltered.map(p => <ProjectCard key={p.id} project={p} onOpen={setSelectedProject} />)}
              {internalFiltered.length === 0 && <div className="col-span-2 text-center py-10 text-xs dark:text-white/30 text-gray-400">Keine internen Projekte{search || filterStatus !== 'all' ? ' für diesen Filter' : ''}</div>}
            </div>
          )}
        </div>
        <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
          <button onClick={() => setOpenExternal(v => !v)}
            className={`w-full flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors ${openExternal ? 'border-b dark:border-white/6 border-black/4' : ''}`}>
            <div className="w-2.5 h-2.5 rounded-full shrink-0 bg-orange-500" />
            <h3 className="text-sm font-black dark:text-white text-gray-900">Externe Projekte</h3>
            <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-orange-500/15 text-orange-500">{externalFiltered.length}</span>
            <span className="ml-auto dark:text-white/30 text-gray-400">{openExternal ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
          </button>
          {openExternal && (
            <div className="p-3 space-y-2">
              {externalFiltered.map(p => <ProjectCard key={p.id} project={p} onOpen={setSelectedProject} />)}
              {externalFiltered.length === 0 && <div className="text-center py-10 text-xs dark:text-white/30 text-gray-400">Keine externen Projekte{search || filterStatus !== 'all' ? ' für diesen Filter' : ''}</div>}
            </div>
          )}
        </div>
      </div>

      {/* Projekt Detail Popup */}
      {selectedProject && (
        <ProjectDetailPopup
          project={selectedProject}
          onClose={() => setSelectedProject(null)}
          canManage={canManage}
          onDelete={id => { deleteProject(id); setSelectedProject(null); }}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Neues Projekt erstellen" subtitle="Alle Felder können später bearbeitet werden" onClose={() => setShowCreateModal(false)} defaultSize="L">
          <ProjectCreateForm onSave={() => setShowCreateModal(false)} onCancel={() => setShowCreateModal(false)} members={members} />
        </Modal>
      )}
    </div>
  );
}

// ── Erstellungs-Formular ─────────────────────────────────────────────────────
function ProjectCreateForm({
  onSave,
  onCancel,
  members,
}: {
  onSave: () => void;
  onCancel: () => void;
  members: import('@/types').Member[];
}) {
  const addProject = useAppStore((s) => s.addProject);
  const [activeTab, setActiveTab] = useState<'basic' | 'client' | 'team' | 'budget'>('basic');
  const [name, setName] = useState('');
  const [type, setType] = useState<ProjectType>('internal');
  const [status, setStatus] = useState<ProjectStatus>('planned');
  const [priority, setPriority] = useState('medium');
  const [client, setClient] = useState('');
  const [clientContact, setClientContact] = useState('');
  const [clientEmail, setClientEmail] = useState('');
  const [clientPhone, setClientPhone] = useState('');
  const [description, setDescription] = useState('');
  const [objectives, setObjectives] = useState('');
  const [location, setLocation] = useState('');
  const [remotePercentage, setRemotePercentage] = useState('');
  const [framework, setFramework] = useState('');
  const [projectNumber, setProjectNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [maxDays, setMaxDays] = useState('');
  const [budgetAmount, setBudgetAmount] = useState('');
  const [budgetHours, setBudgetHours] = useState('');
  const [tags, setTags] = useState('');
  const [technologies, setTechnologies] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberRoles, setMemberRoles] = useState<Record<string, ProjectMemberRole>>({});
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  const handleCreate = async () => {
    if (!name.trim()) return;
    setSaving(true);
    setSaveError(null);
    try {
      const memberIdsArr = Array.from(selectedMemberIds);
      const projectMembers = memberIdsArr.map(id => ({ memberId: id, role: memberRoles[id] || 'operative' as ProjectMemberRole }));
      await addProject({
        name: name.trim(), type, status, priority: priority as any,
        client: client || undefined, clientContact: clientContact || undefined,
        clientEmail: clientEmail || undefined, clientPhone: clientPhone || undefined,
        description: description || undefined, objectives: objectives || undefined,
        location: location || undefined, remotePercentage: remotePercentage ? parseInt(remotePercentage) : undefined,
        framework: framework || undefined, projectNumber: projectNumber || undefined,
        startDate: startDate || undefined, endDate: endDate || undefined,
        maxDays: maxDays ? parseInt(maxDays) : undefined,
        budgetAmount: budgetAmount ? parseFloat(budgetAmount) : undefined,
        budgetHours: budgetHours ? parseInt(budgetHours) : undefined,
        tags: tags ? tags.split(',').map(t => t.trim()).filter(Boolean) : [],
        technologies: technologies ? technologies.split(',').map(t => t.trim()).filter(Boolean) : [],
        memberIds: memberIdsArr, projectMembers,
      });
      onSave();
    } catch (err: any) {
      setSaveError(err?.message || 'Fehler beim Speichern');
    } finally {
      setSaving(false);
    }
  };

  const tabs = [
    { id: 'basic' as const, label: 'Basis' },
    { id: 'client' as const, label: 'Kunde' },
    { id: 'team' as const, label: 'Team' },
    { id: 'budget' as const, label: 'Budget' },
  ];

  return (
    <div className="space-y-4">
      {saveError && (
        <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-800/50 text-xs text-red-700 dark:text-red-400">
          <strong>Fehler:</strong> {saveError}
        </div>
      )}
      <div className="flex gap-1">
        {tabs.map(tab => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-(--primary) text-white' : 'dark:text-white/40 text-gray-500 hover:bg-black/4 dark:hover:bg-white/4 bg-transparent'}`}>
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'basic' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LABEL_CLS}>Projektname *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="Projektname" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Typ</label><select value={type} onChange={e => setType(e.target.value as ProjectType)} title="Typ" className={`${INPUT_CLS} mt-1`}><option value="internal">Intern</option><option value="external">Extern</option></select></div>
          <div><label className={LABEL_CLS}>Status</label><select value={status} onChange={e => setStatus(e.target.value as ProjectStatus)} title="Status" className={`${INPUT_CLS} mt-1`}><option value="planned">Geplant</option><option value="active">Aktiv</option><option value="completed">Abgeschlossen</option></select></div>
          <div><label className={LABEL_CLS}>Priorität</label><select value={priority} onChange={e => setPriority(e.target.value)} title="Prioritaet" className={`${INPUT_CLS} mt-1`}><option value="low">Niedrig</option><option value="medium">Mittel</option><option value="high">Hoch</option><option value="critical">Kritisch</option></select></div>
          <div><label className={LABEL_CLS}>Projektnummer</label><input value={projectNumber} onChange={e => setProjectNumber(e.target.value)} placeholder="PRJ-001" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Framework</label><input value={framework} onChange={e => setFramework(e.target.value)} placeholder="Scrum, Kanban..." className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Standort</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="München..." className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Start</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Start" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Ende</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} title="Ende" className={`${INPUT_CLS} mt-1`} /></div>
          <div className="col-span-2"><label className={LABEL_CLS}>Beschreibung</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Kurzbeschreibung..." /></div>
          <div className="col-span-2"><label className={LABEL_CLS}>Projektziele</label><textarea value={objectives} onChange={e => setObjectives(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Was soll erreicht werden?" /></div>
          <div className="col-span-2"><label className={LABEL_CLS}>Tags (kommagetrennt)</label><input value={tags} onChange={e => setTags(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Tag1, Tag2" /></div>
        </div>
      )}

      {activeTab === 'client' && (
        <div className="grid grid-cols-2 gap-3">
          <div className="col-span-2"><label className={LABEL_CLS}>Kundenname</label><input value={client} onChange={e => setClient(e.target.value)} title="Kundenname" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Ansprechpartner</label><input value={clientContact} onChange={e => setClientContact(e.target.value)} title="Ansprechpartner" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>E-Mail</label><input type="email" value={clientEmail} onChange={e => setClientEmail(e.target.value)} title="E-Mail" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Telefon</label><input value={clientPhone} onChange={e => setClientPhone(e.target.value)} title="Telefon" className={`${INPUT_CLS} mt-1`} /></div>
          <div><label className={LABEL_CLS}>Remote-Anteil (%)</label><input type="number" min={0} max={100} value={remotePercentage} onChange={e => setRemotePercentage(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="0-100" /></div>
          <div className="col-span-2"><label className={LABEL_CLS}>Technologien</label><input value={technologies} onChange={e => setTechnologies(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="React, Java, SAP..." /></div>
        </div>
      )}

      {activeTab === 'team' && (
        <div className="space-y-2">
          <p className="text-[10px] dark:text-white/50 text-gray-500">Mitglieder zuweisen und Rollen festlegen.</p>
          {members.map(member => {
            const isSelected = selectedMemberIds.has(member.id);
            const role = memberRoles[member.id] || 'operative';
            return (
              <div key={member.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isSelected ? 'border-[rgba(99,102,241,0.3)] bg-(--primary-light)' : 'dark:border-white/6 border-black/6'}`}>
                <input type="checkbox" title="Teilnehmer" checked={isSelected} onChange={e => {
                  setSelectedMemberIds(prev => { const n = new Set(prev); e.target.checked ? n.add(member.id) : n.delete(member.id); return n; });
                }} className="w-4 h-4 accent-(--primary) cursor-pointer" />
                <div className="flex-1 min-w-0">
                  <div className="text-xs font-semibold dark:text-white text-gray-900">{member.name}</div>
                  <div className="text-[9px] dark:text-white/40 text-gray-500">{member.role}</div>
                </div>
                {isSelected && (
                  <select value={role} title="Rolle" onChange={e => setMemberRoles(prev => ({ ...prev, [member.id]: e.target.value as ProjectMemberRole }))}
                    className="text-[9px] rounded px-1 py-0.5 border dark:border-white/10 border-gray-200 bg-transparent dark:text-white text-gray-900 outline-none cursor-pointer">
                    <option value="operative">Operativ</option>
                    <option value="supporting">Unterstützend</option>
                    <option value="informed">Informierend</option>
                  </select>
                )}
              </div>
            );
          })}
          {members.length === 0 && <p className="text-xs dark:text-white/30 text-gray-400 text-center py-4">Keine Mitglieder verfügbar.</p>}
        </div>
      )}

      {activeTab === 'budget' && (
        <div className="grid grid-cols-2 gap-3">
          <div><label className={LABEL_CLS}>Budget (€)</label><input type="number" min={0} value={budgetAmount} onChange={e => setBudgetAmount(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="50000" /></div>
          <div><label className={LABEL_CLS}>Stunden-Budget</label><input type="number" min={0} value={budgetHours} onChange={e => setBudgetHours(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="1000" /></div>
          {type === 'external' && (
            <div className="col-span-2"><label className={`${LABEL_CLS} text-orange-500`}>Max. Beauftragungstage / Jahr</label><input type="number" min={0} value={maxDays} onChange={e => setMaxDays(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="220" /></div>
          )}
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t dark:border-white/10 border-gray-100">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 border dark:border-white/10 border-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer bg-transparent transition-colors">Abbrechen</button>
        <button onClick={handleCreate} disabled={saving || !name.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-(--primary) text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50 transition-opacity">
          {saving ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Erstellen
        </button>
      </div>
    </div>
  );
}
