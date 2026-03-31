'use client';
import { useState, useEffect, Suspense } from 'react';
import { Loader } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { MemberCard } from '@/components/team/MemberCard';
import { ExcelImportDialog } from '@/components/team/ExcelImportDialog';
import { ViewToggle, type ViewMode } from '@/components/ui/ViewToggle';
import { Users, Plus, Trash2, Pencil, FileSpreadsheet } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';

import { CollapsiblePanel } from '@/components/ui/CollapsiblePanel';
import { Modal } from '@/components/ui/Modal';
import { MemberForm } from '@/components/team/MemberForm';

function MembersContent() {
  const members = useAppStore((s) => s.members);
  const deleteMember = useAppStore((s) => s.deleteMember);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const canCreate = hasMinRole('admin') || hasMinRole('department_lead');
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [viewMode, setViewMode] = useState<ViewMode>('list');
  const [showImport, setShowImport] = useState(false);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);

  // Handle cross-page modal trigger (e.g. from Sidebar)
  useEffect(() => {
    if (action === 'invite') {
      setEditingMemberId(null);
      setShowMemberModal(true);
      // Clean up the URL
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('action');
      router.replace(`/members${newParams.toString() ? '?' + newParams.toString() : ''}`);
    }
  }, [action, searchParams, router]);

  const departments = [...new Set(members.map((m) => m.department).filter(Boolean))].sort();

  return (
    <div className="p-6 w-full space-y-8 animate-fade-in">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
              <Users size={20} className="text-blue-500" />
            </div>
            Mitarbeiter
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            {members.length} Mitarbeiter verwalten
          </p>
        </div>
        <div className="flex items-center gap-3">
          <ViewToggle value={viewMode} onChange={setViewMode} />
          {canCreate && (
            <>
              <button
                onClick={() => setShowImport(true)}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border dark:border-white/10 border-gray-200 text-sm font-medium dark:text-white/70 text-gray-600 hover:bg-green-500/10 hover:text-green-500 hover:border-green-500/30 transition-all bg-transparent cursor-pointer"
              >
                <FileSpreadsheet size={14} />
                Excel-Import
              </button>
              <button
                onClick={() => { setEditingMemberId(null); setShowMemberModal(true); }}
                className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all border-none cursor-pointer"
              >
                <Plus size={14} />
                Neu anlegen
              </button>
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
          {canCreate && (
            <button
              onClick={() => { setEditingMemberId(null); setShowMemberModal(true); }}
              className="mt-6 flex items-center gap-2 px-5 py-2.5 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 shadow-lg shadow-blue-500/20 transition-all border-none cursor-pointer"
            >
              <Plus size={14} />
              Ersten Mitarbeiter anlegen
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Nach Abteilung gruppiert */}
          {departments.map((dept) => {
            const deptMembers = members.filter((m) => m.department === dept);
            return (
              <CollapsiblePanel 
                key={dept} 
                title={dept} 
                count={deptMembers.length}
                accentColor="rgba(59, 130, 246, 0.5)"
              >
                {viewMode === 'list' ? (
                  <div className="space-y-3">
                    {deptMembers.map((member) => (
                      <div
                        key={member.id}
                        className="card-shimmer rounded-xl border border-slate-100 dark:border-white/5 p-4 flex items-center gap-4"
                      >
                        <div className="flex-1">
                          <MemberCard member={member} />
                        </div>
                        <div className="flex gap-2 shrink-0">
                          {canCreate && (
                            <>
                              <button
                                onClick={() => { setEditingMemberId(member.id); setShowMemberModal(true); }}
                                className="p-2 rounded-lg dark:text-white/30 text-gray-400 hover:text-blue-500 hover:bg-blue-500/10 transition-all border-none bg-transparent cursor-pointer"
                                title="Bearbeiten"
                              >
                                <Pencil size={14} />
                              </button>
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
                    {deptMembers.map((member) => (
                      <div key={member.id} className="relative group/card">
                        <MemberCard member={member} />
                        <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover/card:opacity-100 transition-opacity">
                          {canCreate && (
                            <>
                              <button
                                onClick={() => { setEditingMemberId(member.id); setShowMemberModal(true); }}
                                className="p-1.5 rounded-lg bg-white/90 dark:bg-gray-800/90 text-gray-400 hover:text-blue-500 transition-all border-none cursor-pointer shadow-sm"
                                title="Bearbeiten"
                              >
                                <Pencil size={12} />
                              </button>
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
              </CollapsiblePanel>
            );
          })}
        </div>
      )}

      {showImport && <ExcelImportDialog onClose={() => setShowImport(false)} />}

      <Modal
        isOpen={showMemberModal}
        onClose={() => setShowMemberModal(false)}
        title={editingMemberId ? 'Mitarbeiter bearbeiten' : 'Neuer Mitarbeiter'}
        subtitle="Mitarbeiter verwalten & Einladungen versenden"
      >
        <div className="py-2">
          <MemberForm 
            memberId={editingMemberId || undefined} 
            onSuccess={() => setShowMemberModal(false)}
            onCancel={() => setShowMemberModal(false)}
          />
        </div>
      </Modal>
    </div>
  );
}
export default function MembersPage() {
  return (
    <Suspense 
      fallback={
        <div className="min-h-screen flex items-center justify-center">
          <Loader className="animate-spin text-blue-600" size={32} />
        </div>
      }
    >
      <MembersContent />
    </Suspense>
  );
}
