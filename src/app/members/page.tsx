'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { MemberCard } from '@/components/team/MemberCard';
import { ExcelImportDialog } from '@/components/team/ExcelImportDialog';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { Users, Plus, Trash2, Pencil, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';

export default function MembersPage() {
  const members = useAppStore((s) => s.members);
  const deleteMember = useAppStore((s) => s.deleteMember);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const isAdmin = hasMinRole('admin');
  const router = useRouter();
  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showImport, setShowImport] = useState(false);

  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))];

  return (
    <div className="p-6 w-full space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
              <Users size={20} className="text-blue-400" />
            </div>
            Mitarbeiter
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            {members.length} Mitarbeiter verwalten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          {isAdmin && (
            <>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-white/10 border-gray-200 text-sm font-medium dark:text-white/70 text-gray-600 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30 transition-all bg-transparent cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                Excel-Import
              </button>
              <Link
                href="/members/new"
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors no-underline"
              >
                <Plus size={14} />
                Neu anlegen
              </Link>
            </>
          )}
        </div>
      </div>

      {members.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-center">
          <div className="w-20 h-20 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
            <Users size={36} className="text-blue-400" />
          </div>
          <h3 className="text-lg font-semibold dark:text-white/60 text-gray-500">
            Noch keine Mitarbeiter
          </h3>
          <p className="text-sm dark:text-white/30 text-gray-400 mt-1 max-w-sm">
            Lege deinen ersten Mitarbeiter an, um dessen Verfügbarkeit zu verwalten.
          </p>
          {isAdmin && (
            <Link
              href="/members/new"
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors no-underline"
            >
              <Plus size={14} />
              Ersten Mitarbeiter anlegen
            </Link>
          )}
        </div>
      ) : (
        <>
          {/* Alle Mitarbeiter */}
          {viewMode === 'list' ? (
            <div className="space-y-3">
              {members.map((member) => (
                <div
                  key={member.id}
                  className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 flex items-center gap-4"
                >
                  <div className="flex-1">
                    <MemberCard member={member} />
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {isAdmin && (
                      <>
                        <Link
                          href={`/members/${member.id}/edit`}
                          className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all no-underline"
                          title="Bearbeiten"
                        >
                          <Pencil size={14} />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`"${member.name}" wirklich löschen?`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-red-500 hover:bg-red-500/10 transition-all bg-transparent border-none cursor-pointer"
                          title="Löschen"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {members.map((member) => (
                <div key={member.id} className="relative group/card">
                  <MemberCard member={member} />
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                    {isAdmin && (
                      <>
                        <Link
                          href={`/members/${member.id}/edit`}
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-blue-500 transition-all no-underline shadow-sm"
                          title="Bearbeiten"
                        >
                          <Pencil size={12} />
                        </Link>
                        <button
                          onClick={() => {
                            if (confirm(`"${member.name}" wirklich löschen?`)) {
                              deleteMember(member.id);
                            }
                          }}
                          className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-red-500 transition-all border-none cursor-pointer shadow-sm"
                          title="Löschen"
                        >
                          <Trash2 size={12} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Nach Abteilung */}
          {departments.length > 1 && (
            <div>
              <h2 className="text-sm font-bold dark:text-white/50 text-gray-600 mb-3">Nach Abteilung</h2>
              <div className="space-y-6">
                {departments.map((dept) => (
                  <div key={dept}>
                    <h3 className="text-xs font-bold uppercase tracking-widest dark:text-white/25 text-gray-400 mb-2">{dept}</h3>
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {members
                        .filter((m) => m.department === dept)
                        .map((m) => (
                          <MemberCard key={m.id} member={m} />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {showImport && <ExcelImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}
