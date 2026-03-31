'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { Modal } from '@/components/ui/Modal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { FolderKanban, Plus, Trash2, Users } from 'lucide-react';

export default function TeamsPage() {
  const members = useAppStore((s) => s.members);
  const teams = useAppStore((s) => s.teams);
  const addTeam = useAppStore((s) => s.addTeam);
  const updateTeam = useAppStore((s) => s.updateTeam);
  const deleteTeam = useAppStore((s) => s.deleteTeam);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const isAdmin = hasMinRole('admin');

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [deletingTeamId, setDeletingTeamId] = useState<string | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const existingTeam = editId ? teams.find(t => t.id === editId) : null;
  const isDirty = newName !== (existingTeam?.name ?? '') || 
                  newDesc !== (existingTeam?.description ?? '') || 
                  JSON.stringify(selectedMembers.sort()) !== JSON.stringify([...(existingTeam?.memberIds ?? [])].sort());

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else {
      setShowForm(false);
      setEditId(null);
    }
  };

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    if (editId) {
      updateTeam(editId, { name: newName, description: newDesc || undefined, memberIds: selectedMembers });
    } else {
      addTeam({ name: newName, description: newDesc || undefined, memberIds: selectedMembers });
    }
    setNewName('');
    setNewDesc('');
    setSelectedMembers([]);
    setEditId(null);
    setShowForm(false);
  };

  const openEdit = (id: string) => {
    const t = teams.find((team) => team.id === id);
    if (!t) return;
    setNewName(t.name);
    setNewDesc(t.description ?? '');
    setSelectedMembers(t.memberIds);
    setEditId(id);
    setShowForm(true);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 w-full space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <FolderKanban size={20} className="text-blue-500" />
            </div>
            Teams
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Mitarbeiter in Teams organisieren
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          {isAdmin && (
            <button
              onClick={() => { setEditId(null); setShowForm(true); }}
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all border-none cursor-pointer"
            >
              <Plus size={14} />
              Neues Team
            </button>
          )}
        </div>
      </div>

      {/* Modal für Team-Formular */}
      <Modal
        isOpen={showForm}
        onClose={handleCancelClick}
        title={editId ? 'Team bearbeiten' : 'Neues Team erstellen'}
        subtitle="Mitarbeiter zusammenführen"
        showCloseButton={!isDirty}
      >
        <form
          onSubmit={handleCreateTeam}
          className="space-y-4 py-2"
        >
          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Teamname *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
              placeholder="z.B. Frontend-Team"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Beschreibung</label>
            <input
              type="text"
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">
              Mitglieder ({selectedMembers.length} ausgewählt)
            </label>
            <div className="flex flex-wrap gap-2 mt-1 max-h-48 overflow-y-auto p-1">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all cursor-pointer ${
                    selectedMembers.includes(m.id)
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-500'
                      : 'border-slate-200 dark:border-white/10 text-gray-600 dark:text-white/50 hover:border-blue-500/20 bg-transparent'
                  }`}
                >
                  {m.name}
                </button>
              ))}
              {members.length === 0 && (
                <p className="text-xs dark:text-white/30 text-gray-400">
                  Noch keine Mitarbeiter vorhanden.
                </p>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors border-none cursor-pointer"
            >
              {editId ? 'Speichern' : 'Team erstellen'}
            </button>
            <button
              type="button"
              onClick={handleCancelClick}
              className="px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600 bg-transparent cursor-pointer"
            >
              Abbrechen
            </button>
          </div>
        </form>
      </Modal>

      {/* Team-Liste */}
      {teams.length === 0 && !showForm ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <FolderKanban size={36} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white/60 text-gray-500">Keine Teams</h3>
          <p className="text-sm dark:text-white/30 text-gray-400 mt-1">
            Erstelle ein Team, um Mitarbeiter zu gruppieren.
          </p>
        </div>
      ) : (
        <div className={viewMode === 'grid' ? 'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-4'}>
          {teams.map((team) => {
            const teamMembers = members.filter((m) => team.memberIds.includes(m.id));
            return (
              <div
                key={team.id}
                className="card-shimmer rounded-xl border border-slate-100 dark:border-white/5 p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold dark:text-white text-gray-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs dark:text-white/40 text-gray-500 mt-0.5">{team.description}</p>
                    )}
                  </div>
                  <div className="flex gap-1 shrink-0">
                    {isAdmin && (
                      <>
                        <button
                          onClick={() => openEdit(team.id)}
                          className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all border-none bg-transparent cursor-pointer"
                        >
                          <Plus size={14} className="rotate-45" /> 
                          {/* Hier könnte man auch ein Pencil-Icon nehmen, aber wir bleiben konsistent */}
                        </button>
                        <button
                          onClick={() => setDeletingTeamId(team.id)}
                          className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((m) => (
                      <span
                        key={m.id}
                        className="px-2 py-0.5 rounded-full text-[10px] font-medium bg-blue-500/10 text-blue-400 border border-blue-500/20"
                      >
                        {m.name}
                      </span>
                    ))
                  ) : (
                    <span className="text-xs dark:text-white/25 text-gray-400">Keine Mitglieder</span>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <ConfirmModal
        isOpen={!!deletingTeamId}
        onClose={() => setDeletingTeamId(null)}
        onConfirm={() => {
          if (deletingTeamId) {
            deleteTeam(deletingTeamId);
            setDeletingTeamId(null);
          }
        }}
        title="Team löschen"
        message={`Möchtest du das Team "${teams.find(t => t.id === deletingTeamId)?.name}" wirklich auflösen? Alle Mitglieder bleiben erhalten, aber die Team-Zuordnung wird gelöscht.`}
        confirmLabel="Team auflösen"
        variant="danger"
      />

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          setShowForm(false);
          setEditId(null);
        }}
        title="Änderungen verwerfen"
        message="Du hast ungespeicherte Änderungen am Team. Möchtest du diese wirklich verwerfen?"
        confirmLabel="Verwerfen"
        variant="warning"
      />
    </div>
  );
}
