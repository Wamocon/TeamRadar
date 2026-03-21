'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { FolderKanban, Plus, Trash2, Users } from 'lucide-react';

export default function TeamsPage() {
  const members = useAppStore((s) => s.members);
  const teams = useAppStore((s) => s.teams);
  const addTeam = useAppStore((s) => s.addTeam);
  const updateTeam = useAppStore((s) => s.updateTeam);
  const deleteTeam = useAppStore((s) => s.deleteTeam);

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState('');
  const [newDesc, setNewDesc] = useState('');
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreateTeam = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim()) return;
    addTeam({ name: newName, description: newDesc || undefined, memberIds: selectedMembers });
    setNewName('');
    setNewDesc('');
    setSelectedMembers([]);
    setShowForm(false);
  };

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  return (
    <div className="p-6 max-w-5xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
              <FolderKanban size={20} className="text-blue-400" />
            </div>
            Teams
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Mitarbeiter in Teams organisieren
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          <button
            onClick={() => setShowForm(!showForm)}
            className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
          >
            <Plus size={14} />
            Neues Team
          </button>
        </div>
      </div>

      {showForm && (
        <form
          onSubmit={handleCreateTeam}
          className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5 space-y-4"
        >
          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Teamname *</label>
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border text-sm"
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
              className="w-full px-3 py-2 rounded-lg border text-sm"
              placeholder="Optional"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">
              Mitglieder ({selectedMembers.length} ausgewählt)
            </label>
            <div className="flex flex-wrap gap-2 mt-1">
              {members.map((m) => (
                <button
                  key={m.id}
                  type="button"
                  onClick={() => toggleMember(m.id)}
                  className={`px-2.5 py-1 rounded-lg text-xs font-medium border transition-all ${
                    selectedMembers.includes(m.id)
                      ? 'bg-blue-500/15 border-blue-500/40 text-blue-500'
                      : 'border-black/[0.06] dark:border-white/[0.06] dark:text-white/50 text-gray-600 hover:border-blue-500/20'
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
          <div className="flex gap-3">
            <button
              type="submit"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
            >
              Team erstellen
            </button>
            <button
              type="button"
              onClick={() => setShowForm(false)}
              className="px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600"
            >
              Abbrechen
            </button>
          </div>
        </form>
      )}

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
                className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5"
              >
                <div className="flex items-start justify-between">
                  <div>
                    <h3 className="text-sm font-bold dark:text-white text-gray-900">{team.name}</h3>
                    {team.description && (
                      <p className="text-xs dark:text-white/40 text-gray-500 mt-0.5">{team.description}</p>
                    )}
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Team "${team.name}" wirklich löschen?`)) {
                        deleteTeam(team.id);
                      }
                    }}
                    className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"
                  >
                    <Trash2 size={14} />
                  </button>
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
    </div>
  );
}
