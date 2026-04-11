'use client';
import { useState, useMemo, useEffect, Suspense } from 'react';
import Image from 'next/image';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG, type UserRole } from '@/types';
import {
  Users,
  BookOpen,
  X,
  Mail,
  Shield,
  Search,
  UserPlus,
  AlertCircle,
  Eye,
  EyeOff,
  Loader,
  BadgeCheck,
  Clock,
  TrendingUp,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams, useRouter } from 'next/navigation';
import { Modal } from '@/components/ui/Modal';
import { MemberForm } from '@/components/team/MemberForm';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { ExcelImportDialog } from '@/components/team/ExcelImportDialog';
import { updateUserProfileAction } from '@/lib/actions/settingsActions';
import { createClient } from '@/lib/supabase/client';

const ROLE_LABELS: Record<string, string> = {
  admin: 'Admin',
  cio: 'CIO',
  department_lead: 'Abteilungsleiter',
  employee: 'Mitarbeiter',
};

const PRIVACY_FIELDS = [
  { key: 'phone', label: 'Telefonnummer' },
  { key: 'department', label: 'Abteilung' },
  { key: 'avatar_url', label: 'Profilbild' },
  { key: 'role', label: 'Position/Jobtitel' },
];

function WamoBookContent() {
  const members = useAppStore((s) => s.members);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const userProfile = useAppStore((s) => s.userProfile);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const deleteMember = useAppStore((s) => s.deleteMember);

  const canManage = hasMinRole('department_lead');
  const router = useRouter();
  const searchParams = useSearchParams();
  const action = searchParams.get('action');

  const [search, setSearch] = useState('');
  const [selectedMemberId, setSelectedMemberId] = useState<string | null>(null);
  const [showMemberModal, setShowMemberModal] = useState(false);
  const [editingMemberId, setEditingMemberId] = useState<string | null>(null);
  const [deletingMemberId, setDeletingMemberId] = useState<string | null>(null);
  const [showImport, setShowImport] = useState(false);
  const [privacySettings, setPrivacySettings] = useState<Record<string, boolean>>({});
  const [privacyLoading, setPrivacyLoading] = useState(false);
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileMsg, setProfileMsg] = useState<string | null>(null);
  const [dsgvoAck, setDsgvoAck] = useState(false);

  // Invite action from URL
  useEffect(() => {
    if (action === 'invite') {
      setEditingMemberId(null);
      setShowMemberModal(true);
      const p = new URLSearchParams(searchParams.toString());
      p.delete('action');
      router.replace('/members');
    }
  }, [action, router, searchParams]);

  // Load privacy settings for selected member (own profile only)
  useEffect(() => {
    if (!selectedMemberId) return;
    const member = members.find((m) => m.id === selectedMemberId);
    if (!member || member.email !== userProfile?.email) return;
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('profile_privacy').select('field_name,is_public').eq('user_id', userProfile?.id);
        if (data) {
          const map: Record<string, boolean> = {};
          data.forEach((d: any) => { map[d.field_name] = d.is_public; });
          setPrivacySettings(map);
        }
      } catch { /* ignore */ }
    };
    load();
  }, [selectedMemberId, userProfile, members]);

  const handlePrivacyToggle = async (field: string, isPublic: boolean) => {
    if (!userProfile?.id) return;
    setPrivacyLoading(true);
    try {
      const supabase = createClient();
      await supabase.from('profile_privacy').upsert({ user_id: userProfile.id, field_name: field, is_public: isPublic, updated_at: new Date().toISOString() }, { onConflict: 'user_id,field_name' });
      setPrivacySettings((prev) => ({ ...prev, [field]: isPublic }));
    } catch { /* ignore */ }
    setPrivacyLoading(false);
  };

  // HR KPIs
  const hrKPIs = useMemo(() => {
    const now = new Date();
    const thisMonthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
    const newThisMonth = members.filter((m) => m.createdAt >= thisMonthStart).length;
    const roleCount: Record<string, number> = {};
    members.forEach((m) => { roleCount[m.role] = (roleCount[m.role] || 0) + 1; });
    const topRole = Object.entries(roleCount).sort((a, b) => b[1] - a[1])[0];
    return { total: members.length, newThisMonth, topRole };
  }, [members]);

  const filteredMembers = useMemo(() =>
    members.filter((m) => {
      if (!search) return true;
      const s = search.toLowerCase();
      return m.name.toLowerCase().includes(s) || m.email.toLowerCase().includes(s) || m.department?.toLowerCase().includes(s);
    }), [members, search]);

  const selectedMember = members.find((m) => m.id === selectedMemberId);
  const isOwnProfile = selectedMember?.email === userProfile?.email;
  const canEdit = isOwnProfile || canManage;

  const today = new Date().toISOString().slice(0, 10);

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in">
      {/* ── Header ─────────────────────────────────────── */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <BookOpen size={20} className="text-[var(--primary)]" />
            </div>
            WamoBook
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Mitarbeiterverzeichnis & Profilmanagement</p>
        </div>
        {canManage && (
          <div className="flex items-center gap-2">
            <button onClick={() => setShowImport(true)} className="flex items-center gap-2 px-3 py-2 rounded-xl border dark:border-white/[0.08] border-gray-200 text-xs font-semibold dark:text-white/60 text-gray-600 hover:border-[var(--primary)]/30 hover:text-[var(--primary)] transition-all bg-transparent cursor-pointer">
              <TrendingUp size={14} /> Import
            </button>
            <button onClick={() => { setEditingMemberId(null); setShowMemberModal(true); }} className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
              <UserPlus size={14} /> Mitarbeiter einladen
            </button>
          </div>
        )}
      </div>

      {/* ── HR KPI Bar ──────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Mitarbeiter gesamt', value: hrKPIs.total, color: '#6366f1', icon: Users },
          { label: 'Neu diesen Monat', value: hrKPIs.newThisMonth, color: '#22c55e', icon: UserPlus },
          { label: 'Verfügbar heute', value: members.filter(m => getMemberStatus(m.id, today) === 'available').length, color: '#22c55e', icon: BadgeCheck },
          { label: 'Im Urlaub/Krank', value: members.filter(m => ['vacation','sick'].includes(getMemberStatus(m.id, today))).length, color: '#f59e0b', icon: Clock },
        ].map((kpi) => (
          <div key={kpi.label} className="card-shimmer rounded-xl p-4 flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${kpi.color}15` }}>
              <kpi.icon size={16} style={{ color: kpi.color }} />
            </div>
            <div>
              <div className="text-xl font-black" style={{ color: kpi.color }}>{kpi.value}</div>
              <div className="text-[10px] dark:text-white/40 text-gray-500">{kpi.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* ── Suche ───────────────────────────────────────── */}
      <div className="relative max-w-md">
        <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
        <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Nach Name, E-Mail oder Abteilung suchen..."
          className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.08] border-black/[0.08] rounded-xl py-2.5 pl-9 pr-4 text-sm focus:border-[var(--primary)] outline-none transition-all dark:text-white text-gray-900" />
      </div>

      {/* ── Member Grid ─────────────────────────────────── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
        {filteredMembers.map((member) => {
          const status = getMemberStatus(member.id, today);
          const statusConf = STATUS_CONFIG[status];
          const isOwn = member.email === userProfile?.email;

          return (
            <button key={member.id} onClick={() => setSelectedMemberId(member.id)}
              className="card-shimmer rounded-xl p-4 flex flex-col items-center gap-2.5 text-center cursor-pointer hover:border-[var(--primary)]/30 hover:ring-1 hover:ring-[var(--primary)]/10 transition-all group border-transparent border bg-transparent w-full">
              {/* Avatar */}
              <div className="relative w-14 h-14 rounded-2xl overflow-hidden shrink-0">
                {member.avatarUrl ? (
                  <Image src={member.avatarUrl} alt={member.name} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className="w-full h-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-lg">
                    {member.name.charAt(0)}
                  </div>
                )}
                {/* Status dot */}
                <div className="absolute bottom-0.5 right-0.5 w-3 h-3 rounded-full border-2 dark:border-gray-900 border-white"
                  style={{ background: statusConf.color }} title={statusConf.label} />
              </div>
              <div className="w-full min-w-0">
                <div className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-[var(--primary)] transition-colors">
                  {member.name}
                  {isOwn && <span className="ml-1 text-[8px] bg-[var(--primary-light)] text-[var(--primary)] px-1 py-0.5 rounded-full font-bold">Ich</span>}
                </div>
                <div className="text-[9px] dark:text-white/40 text-gray-500 truncate mt-0.5">{member.role || member.department || 'Mitarbeiter'}</div>
              </div>
            </button>
          );
        })}
        {filteredMembers.length === 0 && (
          <div className="col-span-full text-center py-16 dark:text-white/30 text-gray-400">
            <Users size={32} className="mx-auto mb-3 opacity-30" />
            <div className="text-sm font-medium">Keine Mitarbeiter gefunden</div>
          </div>
        )}
      </div>

      {/* ── Member Detail Popup ──────────────────────────── */}
      {selectedMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSelectedMemberId(null)}>
          <div className="relative w-full max-w-lg mx-4 bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 overflow-hidden animate-scale-up max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}>
            {/* Header */}
            <div className="p-5 flex items-start gap-4 border-b dark:border-white/10 border-gray-100">
              <div className="relative w-16 h-16 rounded-2xl overflow-hidden shrink-0">
                {selectedMember.avatarUrl ? (
                  <Image src={selectedMember.avatarUrl} alt={selectedMember.name} fill className="object-cover" sizes="64px" />
                ) : (
                  <div className="w-full h-full bg-[var(--primary-light)] flex items-center justify-center text-[var(--primary)] font-black text-2xl">
                    {selectedMember.name.charAt(0)}
                  </div>
                )}
                <div className="absolute bottom-1 right-1 w-3.5 h-3.5 rounded-full border-2 dark:border-gray-900 border-white"
                  style={{ background: STATUS_CONFIG[getMemberStatus(selectedMember.id, today)].color }} />
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-black dark:text-white text-gray-900">
                  {selectedMember.name}
                  {isOwnProfile && <span className="ml-2 text-[9px] bg-[var(--primary-light)] text-[var(--primary)] px-1.5 py-0.5 rounded-full font-bold">Mein Profil</span>}
                </h2>
                <div className="text-sm dark:text-white/50 text-gray-600 mt-0.5">{selectedMember.role}</div>
                <div className="flex items-center gap-1 mt-1">
                  <div className="w-1.5 h-1.5 rounded-full" style={{ background: STATUS_CONFIG[getMemberStatus(selectedMember.id, today)].color }} />
                  <span className="text-[10px] dark:text-white/40 text-gray-500">{STATUS_CONFIG[getMemberStatus(selectedMember.id, today)].label}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                {/* Kontakt aufnehmen */}
                <a href={`mailto:${encodeURIComponent(selectedMember.email)}`}
                  className="p-2 rounded-lg hover:bg-[var(--primary-light)] text-[var(--primary)] transition-all" title="E-Mail senden">
                  <Mail size={16} />
                </a>
                <button onClick={() => setSelectedMemberId(null)} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 transition-all border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500">
                  <X size={16} />
                </button>
              </div>
            </div>

            {/* Details */}
            <div className="p-5 space-y-4">
              {/* Read-only Info */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div>
                  <span className="dark:text-white/40 text-gray-500">E-Mail</span>
                  <div className="font-semibold dark:text-white text-gray-900 mt-0.5 truncate">{selectedMember.email}</div>
                </div>
                {selectedMember.department && (
                  <div>
                    <span className="dark:text-white/40 text-gray-500">Abteilung</span>
                    <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{selectedMember.department}</div>
                  </div>
                )}
                {selectedMember.phone && (
                  <div>
                    <span className="dark:text-white/40 text-gray-500">Telefon</span>
                    <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{selectedMember.phone}</div>
                  </div>
                )}
                {selectedMember.createdAt && (
                  <div>
                    <span className="dark:text-white/40 text-gray-500">Dabei seit</span>
                    <div className="font-semibold dark:text-white text-gray-900 mt-0.5">{new Date(selectedMember.createdAt).toLocaleDateString('de-DE', { year: 'numeric', month: 'long' })}</div>
                  </div>
                )}
              </div>

              {/* Edit Actions (nur für berechtigte) */}
              {canEdit && (
                <div className="pt-3 border-t dark:border-white/10 border-gray-100 flex items-center gap-2">
                  <button onClick={() => { setEditingMemberId(selectedMember.id); setShowMemberModal(true); setSelectedMemberId(null); }}
                    className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-[var(--primary)] text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 transition-opacity">
                    <Shield size={12} /> Profil bearbeiten
                  </button>
                  {canManage && selectedMember.email !== userProfile?.email && (
                    <button onClick={() => { setDeletingMemberId(selectedMember.id); setSelectedMemberId(null); }}
                      className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-red-500/10 text-red-500 text-xs font-semibold cursor-pointer border-none hover:bg-red-500/20 transition-colors">
                      Entfernen
                    </button>
                  )}
                </div>
              )}

              {/* DSGVO Privacy (nur eigenes Profil) */}
              {isOwnProfile && (
                <div className="pt-3 border-t dark:border-white/10 border-gray-100 space-y-3">
                  <div className="flex items-center gap-2">
                    <AlertCircle size={13} className="text-[var(--primary)] shrink-0" />
                    <span className="text-[10px] font-semibold dark:text-white/50 text-gray-600">
                      DSGVO-Datenschutz: Wähle was in WamoBook öffentlich sichtbar ist.
                    </span>
                  </div>
                  <div className="space-y-2">
                    {PRIVACY_FIELDS.map((field) => {
                      const isPublic = privacySettings[field.key] ?? false;
                      return (
                        <div key={field.key} className="flex items-center justify-between py-1.5 px-3 rounded-lg bg-black/[0.02] dark:bg-white/[0.02]">
                          <span className="text-xs dark:text-white/70 text-gray-700">{field.label}</span>
                          <button onClick={() => handlePrivacyToggle(field.key, !isPublic)} disabled={privacyLoading}
                            className={`flex items-center gap-1.5 text-[9px] font-bold px-2.5 py-1 rounded-full border-none cursor-pointer transition-all ${isPublic ? 'bg-green-500/15 text-green-500' : 'bg-gray-100 dark:bg-white/5 text-gray-500 dark:text-white/30'}`}>
                            {isPublic ? <Eye size={9} /> : <EyeOff size={9} />}
                            {isPublic ? 'Öffentlich' : 'Privat'}
                          </button>
                        </div>
                      );
                    })}
                  </div>
                  <p className="text-[9px] dark:text-white/30 text-gray-400">
                    Ihre Daten werden gemäß DSGVO verarbeitet. Änderungen sind jederzeit möglich.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Modals */}
      {showMemberModal && (
        <Modal title={editingMemberId ? 'Mitarbeiter bearbeiten' : 'Neues Mitglied einladen'} onClose={() => setShowMemberModal(false)}>
          <MemberForm memberId={editingMemberId ?? undefined} onSuccess={() => setShowMemberModal(false)} onCancel={() => setShowMemberModal(false)} />
        </Modal>
      )}
      {deletingMemberId && (
        <ConfirmModal isOpen={!!deletingMemberId} title="Mitarbeiter entfernen"
          message="Möchtest du diesen Mitarbeiter wirklich entfernen? Diese Aktion kann nicht rückgängig gemacht werden."
          confirmLabel="Ja, entfernen" cancelLabel="Abbrechen" variant="danger"
          onConfirm={() => { deleteMember(deletingMemberId); setDeletingMemberId(null); }}
          onCancel={() => setDeletingMemberId(null)} />
      )}
      {showImport && <ExcelImportDialog onClose={() => setShowImport(false)} />}
    </div>
  );
}

export default function WamoBookPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center h-64"><Loader className="animate-spin text-[var(--primary)]" size={24} /></div>}>
      <WamoBookContent />
    </Suspense>
  );
}
