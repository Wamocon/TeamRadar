'use client';
import { useState, useMemo } from 'react';
import { useAppStore } from '@/stores/appStore';
import {
  TRAINING_TYPE_CONFIG,
  type TrainingType,
  type TrainingStatus,
  type TrainingCourse,
  type ProjectMemberRole,
  PROJECT_MEMBER_ROLE_CONFIG,
} from '@/types';
import {
  GraduationCap,
  Plus,
  X,
  Users,
  Search,
  Edit3,
  Trash2,
  Save,
  Loader,
  ChevronDown,
  ChevronUp,
  MapPin,
  StickyNote,
  Info,
  Calendar,
  BookOpen,
  Target,
  Award,
} from 'lucide-react';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { Modal } from '@/components/ui/Modal';

function formatDateDE(dateStr?: string) {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('de-DE', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

const INPUT_CLS = 'w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-lg p-2 text-xs dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]';
const LABEL_CLS = 'text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500';

const TRAINING_STATUS_CONFIG: Record<TrainingStatus, { label: string; color: string }> = {
  planned:   { label: 'Geplant',        color: '#f59e0b' },
  active:    { label: 'Laufend',        color: '#22c55e' },
  completed: { label: 'Abgeschlossen',  color: '#6b7280' },
};

const TYPE_ICONS: Record<TrainingType, React.ElementType> = {
  university:       GraduationCap,
  vocational_school: BookOpen,
  seminar:          Info,
  certification:    Award,
  workshop:         Target,
};

// ── Training Card ────────────────────────────────────────────────────────────
function TrainingCard({ course, onOpen }: { course: TrainingCourse; onOpen: (c: TrainingCourse) => void }) {
  const typeConf = TRAINING_TYPE_CONFIG[course.type];
  const statusConf = TRAINING_STATUS_CONFIG[course.status];
  const Icon = TYPE_ICONS[course.type];

  return (
    <button onClick={() => onOpen(course)}
      className="w-full text-left p-4 rounded-xl border dark:border-white/[0.06] border-black/[0.06] hover:border-[rgba(99,102,241,0.3)] hover:bg-[var(--primary-light)] transition-all cursor-pointer bg-transparent group relative overflow-hidden">
      <div className="absolute top-0 left-0 right-0 h-0.5" style={{ background: typeConf.color }} />
      <div className="flex items-start justify-between mb-2">
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <div className="w-7 h-7 rounded-lg shrink-0 flex items-center justify-center" style={{ background: `${typeConf.color}20` }}>
            <Icon size={13} style={{ color: typeConf.color }} />
          </div>
          <span className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">{course.name}</span>
        </div>
        <span className="px-1.5 py-0.5 rounded-md text-[8px] font-bold border ml-2 shrink-0" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>
          {statusConf.label}
        </span>
      </div>
      <div className="text-[9px] font-semibold mb-1" style={{ color: typeConf.color }}>{typeConf.label}</div>
      {course.provider && <div className="text-[10px] dark:text-white/40 text-gray-500 truncate mb-1">{course.provider}</div>}
      <div className="flex items-center gap-3 text-[9px] dark:text-white/30 text-gray-400 mt-auto">
        <span className="flex items-center gap-1"><Users size={9} />{course.memberIds.length}</span>
        {course.startDate && <span className="flex items-center gap-1"><Calendar size={9} />{course.startDate.slice(0, 7)}</span>}
      </div>
    </button>
  );
}

// ── Detail Popup ─────────────────────────────────────────────────────────────
type DetailTab = 'overview' | 'team' | 'notes';

function TrainingDetailPopup({
  course,
  onClose,
  canManage,
  onDelete,
  onSave,
}: {
  course: TrainingCourse;
  onClose: () => void;
  canManage: boolean;
  onDelete: (id: string) => void;
  onSave: (id: string, updates: Partial<TrainingCourse>) => void;
}) {
  const members = useAppStore((s) => s.members);
  const [editMode, setEditMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('overview');
  const [popupSize, setPopupSize] = useState<'S' | 'M' | 'L'>('M');
  const [confirmDelete, setConfirmDelete] = useState(false);

  const [editName, setEditName] = useState(course.name);
  const [editType, setEditType] = useState<TrainingType>(course.type);
  const [editStatus, setEditStatus] = useState<TrainingStatus>(course.status);
  const [editProvider, setEditProvider] = useState(course.provider || '');
  const [editProviderContact, setEditProviderContact] = useState(course.providerContact || '');
  const [editDescription, setEditDescription] = useState(course.description || '');
  const [editObjectives, setEditObjectives] = useState(course.objectives || '');
  const [editLocation, setEditLocation] = useState(course.location || '');
  const [editRemotePercentage, setEditRemotePercentage] = useState(course.remotePercentage != null ? String(course.remotePercentage) : '');
  const [editStartDate, setEditStartDate] = useState(course.startDate || '');
  const [editEndDate, setEditEndDate] = useState(course.endDate || '');
  const [editHoursPerWeek, setEditHoursPerWeek] = useState(course.hoursPerWeek != null ? String(course.hoursPerWeek) : '');
  const [editNotes, setEditNotes] = useState(course.notes || '');
  const [editCertificationEarned, setEditCertificationEarned] = useState(course.certificationEarned || '');
  const [editTags, setEditTags] = useState((course.tags || []).join(', '));

  const [memberRoles, setMemberRoles] = useState<Record<string, ProjectMemberRole>>(() => {
    const map: Record<string, ProjectMemberRole> = {};
    (course.projectMembers || []).forEach(pm => { map[pm.memberId] = pm.role; });
    course.memberIds.forEach(id => { if (!map[id]) map[id] = 'operative'; });
    return map;
  });
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set(course.memberIds));

  const handleSave = async () => {
    setIsSaving(true);
    const memberIdsArr = Array.from(selectedMemberIds);
    const projectMembers = memberIdsArr.map(id => ({ memberId: id, role: memberRoles[id] || 'operative' as ProjectMemberRole }));
    onSave(course.id, {
      name: editName, type: editType, status: editStatus,
      provider: editProvider || undefined, providerContact: editProviderContact || undefined,
      description: editDescription || undefined, objectives: editObjectives || undefined,
      location: editLocation || undefined, remotePercentage: editRemotePercentage ? parseInt(editRemotePercentage) : undefined,
      startDate: editStartDate || undefined, endDate: editEndDate || undefined,
      hoursPerWeek: editHoursPerWeek ? parseInt(editHoursPerWeek) : undefined,
      notes: editNotes || undefined, certificationEarned: editCertificationEarned || undefined,
      tags: editTags ? editTags.split(',').map(t => t.trim()).filter(Boolean) : [],
      memberIds: memberIdsArr, projectMembers,
    });
    setEditMode(false);
    setIsSaving(false);
  };

  const typeConf = TRAINING_TYPE_CONFIG[editType];
  const statusConf = TRAINING_STATUS_CONFIG[editStatus];
  const sizeClass = popupSize === 'S' ? 'max-w-lg' : popupSize === 'M' ? 'max-w-3xl' : 'max-w-[95vw]';
  const Icon = TYPE_ICONS[editType];

  const tabs: { id: DetailTab; label: string; icon: React.ElementType }[] = [
    { id: 'overview', label: 'Übersicht', icon: Info },
    { id: 'team',     label: 'Teilnehmer', icon: Users },
    { id: 'notes',    label: 'Notizen', icon: StickyNote },
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
                  <Icon size={16} />
                </div>
                <div className="min-w-0 flex-1">
                  {editMode ? (
                    <input value={editName} onChange={e => setEditName(e.target.value)}
                      className="text-sm font-black dark:text-white text-gray-900 bg-transparent border-b dark:border-white/20 border-gray-300 outline-none focus:border-[var(--primary)] pb-0.5 w-full" />
                  ) : (
                    <h2 className="text-sm font-black dark:text-white text-gray-900 truncate">{course.name}</h2>
                  )}
                  <div className="flex items-center gap-1.5 mt-0.5 flex-wrap">
                    {editMode ? (
                      <>
                        <select value={editType} onChange={e => setEditType(e.target.value as TrainingType)}
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="university">Universität</option>
                          <option value="vocational_school">Berufsschule</option>
                          <option value="seminar">Seminar</option>
                          <option value="certification">Zertifizierung</option>
                          <option value="workshop">Workshop</option>
                        </select>
                        <select value={editStatus} onChange={e => setEditStatus(e.target.value as TrainingStatus)}
                          className="text-[9px] font-bold bg-transparent border dark:border-white/10 border-gray-200 rounded px-1 py-0.5 dark:text-white text-gray-900 outline-none">
                          <option value="planned">Geplant</option>
                          <option value="active">Laufend</option>
                          <option value="completed">Abgeschlossen</option>
                        </select>
                      </>
                    ) : (
                      <>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold text-white" style={{ background: typeConf.color }}>{typeConf.label}</span>
                        <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold border" style={{ color: statusConf.color, borderColor: `${statusConf.color}40` }}>{statusConf.label}</span>
                      </>
                    )}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0 ml-2">
                {(['S', 'M', 'L'] as const).map(s => (
                  <button key={s} onClick={() => setPopupSize(s)} title={`Größe ${s}`}
                    className={`w-6 h-6 rounded text-[9px] font-black transition-all border-none cursor-pointer ${popupSize === s ? 'bg-[var(--primary)] text-white' : 'dark:bg-white/5 bg-black/5 dark:text-white/40 text-gray-400'}`}>
                    {s}
                  </button>
                ))}
              </div>
              <div className="flex items-center gap-0.5 ml-1 shrink-0">
                {canManage && !editMode && (
                  <button onClick={() => setEditMode(true)} title="Bearbeiten" className="p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--primary)] border-none bg-transparent cursor-pointer">
                    <Edit3 size={14} />
                  </button>
                )}
                {canManage && !editMode && (
                  <button onClick={() => setConfirmDelete(true)} title="Löschen" className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 border-none bg-transparent cursor-pointer">
                    <Trash2 size={14} />
                  </button>
                )}
                <button onClick={onClose} title="Schließen" className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500">
                  <X size={16} />
                </button>
              </div>
            </div>
            <div className="flex gap-0.5">
              {tabs.map(tab => (
                <button key={tab.id} onClick={() => setActiveTab(tab.id)}
                  className={`flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-[var(--primary)] text-white' : 'dark:text-white/40 text-gray-500 hover:bg-black/[0.04] dark:hover:bg-white/[0.04] bg-transparent'}`}>
                  <tab.icon size={11} />{tab.label}
                </button>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">

            {/* ── Übersicht ── */}
            {activeTab === 'overview' && (
              <div className="space-y-3">
                {editMode ? (
                  <div className="space-y-3">
                    <div><label className={LABEL_CLS}>Beschreibung</label><textarea value={editDescription} onChange={e => setEditDescription(e.target.value)} rows={3} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Kurzbeschreibung..." /></div>
                    <div><label className={LABEL_CLS}>Lernziele</label><textarea value={editObjectives} onChange={e => setEditObjectives(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Was soll gelernt werden?" /></div>
                    <div className="grid grid-cols-2 gap-3">
                      <div><label className={LABEL_CLS}>Anbieter</label><input value={editProvider} onChange={e => setEditProvider(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="IHK, TU München..." /></div>
                      <div><label className={LABEL_CLS}>Anbieter-Kontakt</label><input value={editProviderContact} onChange={e => setEditProviderContact(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Standort</label><input value={editLocation} onChange={e => setEditLocation(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="München, Online..." /></div>
                      <div><label className={LABEL_CLS}>Remote-Anteil (%)</label><input type="number" min={0} max={100} value={editRemotePercentage} onChange={e => setEditRemotePercentage(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Start</label><input type="date" value={editStartDate} onChange={e => setEditStartDate(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Ende</label><input type="date" value={editEndDate} onChange={e => setEditEndDate(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
                      <div><label className={LABEL_CLS}>Stunden / Woche</label><input type="number" min={0} value={editHoursPerWeek} onChange={e => setEditHoursPerWeek(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="z.B. 8" /></div>
                      <div><label className={LABEL_CLS}>Zertifikat / Abschluss</label><input value={editCertificationEarned} onChange={e => setEditCertificationEarned(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="z.B. IHK-Zeugnis" /></div>
                    </div>
                    <div><label className={LABEL_CLS}>Tags (kommagetrennt)</label><input value={editTags} onChange={e => setEditTags(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="Tag1, Tag2" /></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {course.description && (
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                        <div className={LABEL_CLS}>Beschreibung</div>
                        <p className="text-xs dark:text-white/70 text-gray-700 mt-1 leading-relaxed">{course.description}</p>
                      </div>
                    )}
                    {course.objectives && (
                      <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02]">
                        <div className={LABEL_CLS}>Lernziele</div>
                        <p className="text-xs dark:text-white/70 text-gray-700 mt-1 leading-relaxed">{course.objectives}</p>
                      </div>
                    )}
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      {course.provider && <div className="p-2.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06]"><div className={LABEL_CLS}>Anbieter</div><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{course.provider}</div></div>}
                      <div className="p-2.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06]"><div className={LABEL_CLS}>Laufzeit</div><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{formatDateDE(course.startDate)} – {formatDateDE(course.endDate)}</div></div>
                      {course.location && <div className="p-2.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06]"><div className={LABEL_CLS}>Standort</div><div className="font-semibold dark:text-white text-gray-900 mt-0.5 flex items-center gap-1"><MapPin size={10} />{course.location}</div></div>}
                      {course.hoursPerWeek != null && <div className="p-2.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06]"><div className={LABEL_CLS}>Std. / Woche</div><div className="font-semibold dark:text-white text-gray-900 mt-0.5">{course.hoursPerWeek} h</div></div>}
                      {course.certificationEarned && <div className="p-2.5 rounded-lg border dark:border-white/[0.06] border-black/[0.06] col-span-2"><div className={LABEL_CLS}>Abschluss / Zertifikat</div><div className="font-semibold dark:text-white text-gray-900 mt-0.5 flex items-center gap-1"><Award size={10} className="text-amber-500" />{course.certificationEarned}</div></div>}
                    </div>
                    {(course.tags?.length ?? 0) > 0 && (
                      <div className="flex flex-wrap gap-1">
                        {course.tags!.map(tag => <span key={tag} className="px-2 py-0.5 rounded-full text-[9px] font-semibold bg-[var(--primary-light)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]">{tag}</span>)}
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ── Team ── */}
            {activeTab === 'team' && (
              <div className="space-y-2">
                <div className="text-xs dark:text-white/50 text-gray-600 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                  Teilnehmer können als <strong className="text-[var(--primary)]">Operativ</strong>, <strong className="text-amber-500">Unterstützend</strong> oder <strong className="text-gray-500">Informierend</strong> markiert werden.
                </div>
                {members.map(member => {
                  const isSelected = selectedMemberIds.has(member.id);
                  const role = memberRoles[member.id] || 'operative';
                  const roleConf = PROJECT_MEMBER_ROLE_CONFIG[role];
                  return (
                    <div key={member.id} className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all ${isSelected ? 'border-[rgba(99,102,241,0.3)] bg-[var(--primary-light)]' : 'dark:border-white/[0.06] border-black/[0.06]'}`}>
                      <div className="w-7 h-7 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0 text-[10px] font-black text-[var(--primary)]">
                        {member.name.slice(0, 2).toUpperCase()}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="text-xs font-semibold dark:text-white text-gray-900 truncate">{member.name}</div>
                        <div className="text-[9px] dark:text-white/40 text-gray-500">{member.role}</div>
                      </div>
                      {editMode ? (
                        <div className="flex items-center gap-1.5 shrink-0">
                          <input type="checkbox" checked={isSelected} title={member.name} onChange={e => {
                            setSelectedMemberIds(prev => { const n = new Set(prev); e.target.checked ? n.add(member.id) : n.delete(member.id); return n; });
                          }} className="w-4 h-4 rounded cursor-pointer accent-[var(--primary)]" />
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
              </div>
            )}

            {/* ── Notizen ── */}
            {activeTab === 'notes' && (
              <div>
                {editMode ? (
                  <><label className={LABEL_CLS}>Notizen</label><textarea value={editNotes} onChange={e => setEditNotes(e.target.value)} rows={10} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Interne Notizen, Hinweise, Abläufe..." /></>
                ) : course.notes ? (
                  <div className="p-4 rounded-xl border dark:border-white/[0.06] border-black/[0.06]">
                    <div className={`${LABEL_CLS} mb-2`}>Notizen</div>
                    <pre className="text-xs dark:text-white/70 text-gray-700 whitespace-pre-wrap font-sans leading-relaxed">{course.notes}</pre>
                  </div>
                ) : (
                  <div className="text-center py-10 text-xs dark:text-white/30 text-gray-400">Keine Notizen vorhanden.</div>
                )}
              </div>
            )}
          </div>

          {/* Footer */}
          {editMode && (
            <div className="px-4 py-3 border-t dark:border-white/10 border-gray-100 flex items-center justify-end gap-2 shrink-0">
              <button onClick={() => setEditMode(false)} className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 hover:bg-gray-100 dark:hover:bg-white/5 border-none bg-transparent cursor-pointer">Abbrechen</button>
              <button onClick={handleSave} disabled={isSaving}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50">
                {isSaving ? <Loader size={12} className="animate-spin" /> : <Save size={12} />} Speichern
              </button>
            </div>
          )}
        </div>
      </div>

      {confirmDelete && (
        <ConfirmModal title="Kurs löschen" message={`Möchtest du "${course.name}" wirklich löschen?`} confirmLabel="Löschen" cancelLabel="Abbrechen" variant="danger"
          onConfirm={() => { onDelete(course.id); onClose(); }}
          onCancel={() => setConfirmDelete(false)} />
      )}
    </>
  );
}

// ── Hauptseite ───────────────────────────────────────────────────────────────
export default function TrainingPage() {
  const members = useAppStore((s) => s.members);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const canManage = hasMinRole('department_lead');

  // Lokaler State für Kurse (appStore-Integration folgt mit DB-Migration)
  const [courses, setCourses] = useState<TrainingCourse[]>([]);
  const [search, setSearch] = useState('');
  const [filterType, setFilterType] = useState<'all' | TrainingType>('all');
  const [filterStatus] = useState<'all' | TrainingStatus>('all');
  const [selectedCourse, setSelectedCourse] = useState<TrainingCourse | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Kurs-Gruppen
  const filtered = useMemo(() => courses.filter(c => {
    if (filterType !== 'all' && c.type !== filterType) return false;
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (search && !c.name.toLowerCase().includes(search.toLowerCase()) && !c.provider?.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [courses, filterType, filterStatus, search]);

  const kpis = useMemo(() => ({
    total: courses.length,
    active: courses.filter(c => c.status === 'active').length,
    universities: courses.filter(c => c.type === 'university').length,
    vocational: courses.filter(c => c.type === 'vocational_school').length,
    seminars: courses.filter(c => c.type === 'seminar' || c.type === 'workshop').length,
    certs: courses.filter(c => c.type === 'certification').length,
  }), [courses]);

  const handleSave = (id: string, updates: Partial<TrainingCourse>) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
    setSelectedCourse(prev => prev?.id === id ? { ...prev, ...updates } as TrainingCourse : prev);
  };

  const handleDelete = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
  };

  const handleCreate = (data: Partial<TrainingCourse>) => {
    const newCourse: TrainingCourse = {
      id: crypto.randomUUID(),
      name: data.name || 'Neuer Kurs',
      type: data.type || 'seminar',
      status: data.status || 'planned',
      memberIds: data.memberIds || [],
      createdAt: new Date().toISOString(),
      ...data,
    };
    setCourses(prev => [...prev, newCourse]);
  };

  const typeGroups: { type: TrainingType; label: string }[] = [
    { type: 'university',       label: 'Universitäten / Hochschulen' },
    { type: 'vocational_school', label: 'Berufsschulen' },
    { type: 'seminar',          label: 'Seminare & Schulungen' },
    { type: 'workshop',         label: 'Workshops' },
    { type: 'certification',    label: 'Zertifizierungen' },
  ];

  const [openGroups, setOpenGroups] = useState<Record<string, boolean>>({ university: true, vocational_school: true, seminar: true });

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <GraduationCap size={20} className="text-[var(--primary)]" />
            </div>
            Ausbildung
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Berufsschulen, Unis, Seminare und Schulungen verwalten</p>
        </div>
        {canManage && (
          <button onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
            <Plus size={14} /> Neuer Kurs
          </button>
        )}
      </div>

      {/* KPI Bar */}
      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {[
          { label: 'Gesamt',        value: kpis.total,       color: '#6366f1' },
          { label: 'Laufend',       value: kpis.active,      color: '#22c55e' },
          { label: 'Universitäten', value: kpis.universities, color: '#8b5cf6' },
          { label: 'Berufsschulen', value: kpis.vocational,  color: '#f59e0b' },
          { label: 'Seminare',      value: kpis.seminars,    color: '#06b6d4' },
          { label: 'Zertifikate',   value: kpis.certs,       color: '#f97316' },
        ].map(kpi => (
          <div key={kpi.label} className="card-shimmer rounded-xl p-3 text-center">
            <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
            <div className="text-[9px] dark:text-white/40 text-gray-500 mt-0.5">{kpi.label}</div>
          </div>
        ))}
      </div>

      {/* Filter */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative">
          <Search size={13} className="absolute left-2.5 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Suchen..."
            className="bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.08] border-black/[0.08] rounded-lg py-1.5 pl-7 pr-3 text-xs focus:border-[var(--primary)] outline-none dark:text-white text-gray-900" />
        </div>
        <button onClick={() => setFilterType('all')}
          className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border-none cursor-pointer ${filterType === 'all' ? 'bg-[var(--primary)] text-white' : 'dark:text-white/40 text-gray-500 bg-transparent hover:bg-black/[0.04]'}`}>Alle Typen</button>
        {Object.entries(TRAINING_TYPE_CONFIG).map(([k, v]) => (
          <button key={k} onClick={() => setFilterType(k as TrainingType)}
            className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold border-none cursor-pointer ${filterType === k ? 'text-white' : 'dark:text-white/40 text-gray-500 bg-transparent hover:bg-black/[0.04]'}`}
            style={filterType === k ? { background: v.color } : {}}>
            {v.label}
          </button>
        ))}
      </div>

      {/* Kurs-Gruppen */}
      <div className="space-y-4">
        {typeGroups.map(group => {
          const groupCourses = filtered.filter(c => c.type === group.type);
          if (filterType !== 'all' && filterType !== group.type) return null;
          const typeConf = TRAINING_TYPE_CONFIG[group.type];
          const Icon = TYPE_ICONS[group.type];
          const isOpen = openGroups[group.type] ?? false;
          return (
            <div key={group.type} className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenGroups(prev => ({ ...prev, [group.type]: !prev[group.type] }))}
                className={`w-full flex items-center gap-2 px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${isOpen ? 'border-b dark:border-white/[0.06] border-black/[0.04]' : ''}`}
              >
                <Icon size={14} style={{ color: typeConf.color }} />
                <h3 className="text-sm font-black dark:text-white text-gray-900">{group.label}</h3>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${typeConf.color}15`, color: typeConf.color }}>{groupCourses.length}</span>
                <span className="ml-auto dark:text-white/30 text-gray-400">{isOpen ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {isOpen && (
                <div className="p-3 grid sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {groupCourses.map(c => <TrainingCard key={c.id} course={c} onOpen={setSelectedCourse} />)}
                  {groupCourses.length === 0 && (
                    <div className="col-span-3 text-center py-8 text-xs dark:text-white/30 text-gray-400">
                      Keine Einträge{search ? ' für diese Suche' : ''}
                      {canManage && (
                        <button onClick={() => setShowCreateModal(true)} className="ml-2 text-[var(--primary)] hover:underline cursor-pointer bg-transparent border-none">
                          + Erstellen
                        </button>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detail Popup */}
      {selectedCourse && (
        <TrainingDetailPopup
          course={selectedCourse}
          onClose={() => setSelectedCourse(null)}
          canManage={canManage}
          onDelete={handleDelete}
          onSave={handleSave}
        />
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <Modal title="Neuen Kurs erstellen" subtitle="Ausbildung, Seminar oder Zertifizierung anlegen" onClose={() => setShowCreateModal(false)} defaultSize="M">
          <TrainingCreateForm
            onSave={data => { handleCreate(data); setShowCreateModal(false); }}
            onCancel={() => setShowCreateModal(false)}
            members={members}
          />
        </Modal>
      )}
    </div>
  );
}

// ── Create Form ──────────────────────────────────────────────────────────────
function TrainingCreateForm({
  onSave,
  onCancel,
  members,
}: {
  onSave: (data: Partial<TrainingCourse>) => void;
  onCancel: () => void;
  members: import('@/types').Member[];
}) {
  const [name, setName] = useState('');
  const [type, setType] = useState<TrainingType>('seminar');
  const [status, setStatus] = useState<TrainingStatus>('planned');
  const [provider, setProvider] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [hoursPerWeek, setHoursPerWeek] = useState('');
  const [selectedMemberIds, setSelectedMemberIds] = useState<Set<string>>(new Set());
  const [memberRoles, setMemberRoles] = useState<Record<string, ProjectMemberRole>>({});

  const handleCreate = () => {
    if (!name.trim()) return;
    const memberIdsArr = Array.from(selectedMemberIds);
    onSave({
      name: name.trim(), type, status,
      provider: provider || undefined, description: description || undefined, location: location || undefined,
      startDate: startDate || undefined, endDate: endDate || undefined,
      hoursPerWeek: hoursPerWeek ? parseInt(hoursPerWeek) : undefined,
      memberIds: memberIdsArr,
      projectMembers: memberIdsArr.map(id => ({ memberId: id, role: memberRoles[id] || 'operative' as ProjectMemberRole })),
    });
  };

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-3">
        <div className="col-span-2"><label className={LABEL_CLS}>Name *</label><input value={name} onChange={e => setName(e.target.value)} placeholder="z.B. Java-Zertifizierung 2025" className={`${INPUT_CLS} mt-1`} /></div>
        <div><label className={LABEL_CLS}>Typ</label>
          <select value={type} onChange={e => setType(e.target.value as TrainingType)} className={`${INPUT_CLS} mt-1`}>
            <option value="university">Universität</option>
            <option value="vocational_school">Berufsschule</option>
            <option value="seminar">Seminar</option>
            <option value="workshop">Workshop</option>
            <option value="certification">Zertifizierung</option>
          </select>
        </div>
        <div><label className={LABEL_CLS}>Status</label>
          <select value={status} onChange={e => setStatus(e.target.value as TrainingStatus)} className={`${INPUT_CLS} mt-1`}>
            <option value="planned">Geplant</option>
            <option value="active">Laufend</option>
            <option value="completed">Abgeschlossen</option>
          </select>
        </div>
        <div><label className={LABEL_CLS}>Anbieter</label><input value={provider} onChange={e => setProvider(e.target.value)} placeholder="IHK, TU München..." className={`${INPUT_CLS} mt-1`} /></div>
        <div><label className={LABEL_CLS}>Standort</label><input value={location} onChange={e => setLocation(e.target.value)} placeholder="München, Online..." className={`${INPUT_CLS} mt-1`} /></div>
        <div><label className={LABEL_CLS}>Start</label><input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
        <div><label className={LABEL_CLS}>Ende</label><input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className={`${INPUT_CLS} mt-1`} /></div>
        <div><label className={LABEL_CLS}>Std. / Woche</label><input type="number" min={0} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} className={`${INPUT_CLS} mt-1`} placeholder="z.B. 8" /></div>
        <div className="col-span-2"><label className={LABEL_CLS}>Beschreibung</label><textarea value={description} onChange={e => setDescription(e.target.value)} rows={2} className={`${INPUT_CLS} mt-1 resize-none`} placeholder="Kurzbeschreibung..." /></div>
      </div>

      {/* Teilnehmer */}
      {members.length > 0 && (
        <div className="space-y-2">
          <label className={LABEL_CLS}>Teilnehmer</label>
          <div className="max-h-48 overflow-y-auto space-y-1.5">
            {members.map(member => {
              const isSelected = selectedMemberIds.has(member.id);
              const role = memberRoles[member.id] || 'operative';
              return (
                <div key={member.id} className={`flex items-center gap-2 p-2 rounded-lg border ${isSelected ? 'border-[rgba(99,102,241,0.3)] bg-[var(--primary-light)]' : 'dark:border-white/[0.06] border-black/[0.06]'}`}>
                  <input type="checkbox" checked={isSelected} title={member.name} onChange={e => {
                    setSelectedMemberIds(prev => { const n = new Set(prev); e.target.checked ? n.add(member.id) : n.delete(member.id); return n; });
                  }} className="w-4 h-4 accent-[var(--primary)] cursor-pointer" />
                  <span className="flex-1 text-xs dark:text-white text-gray-900">{member.name}</span>
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
          </div>
        </div>
      )}

      <div className="flex gap-2 justify-end pt-2 border-t dark:border-white/10 border-gray-100">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 border dark:border-white/10 border-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer bg-transparent">Abbrechen</button>
        <button onClick={handleCreate} disabled={!name.trim()} className="flex items-center gap-2 px-4 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50">
          <Plus size={12} /> Erstellen
        </button>
      </div>
    </div>
  );
}
