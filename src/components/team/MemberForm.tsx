'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { Save, X, Plus, Loader } from 'lucide-react';
import { SKILL_CATEGORIES, SKILL_LEVEL_CONFIG, CONSULTANT_TYPE_CONFIG, type Skill, type SkillLevel, type SkillCategory, type ConsultantType } from '@/types';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

export function MemberForm({ memberId, onSuccess, onCancel }: { 
  memberId?: string; 
  onSuccess?: () => void;
  onCancel?: () => void;
}) {
  const router = useRouter();
  const members = useAppStore((s) => s.members);
  const addMember = useAppStore((s) => s.addMember);
  const updateMember = useAppStore((s) => s.updateMember);

  const existing = memberId ? members.find((m) => m.id === memberId) : null;

  const [name, setName] = useState(existing?.name ?? '');
  const [email, setEmail] = useState(existing?.email ?? '');
  const [role, setRole] = useState(existing?.role ?? '');
  const [department, setDepartment] = useState(existing?.department ?? '');
  const [phone, setPhone] = useState(existing?.phone ?? '');
  const [consultantType, setConsultantType] = useState<ConsultantType>(existing?.consultantType ?? 'consultant');
  const [skills, setSkills] = useState<Skill[]>(existing?.skills ?? []);

  // Skill form
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillCategory, setNewSkillCategory] = useState<SkillCategory>('Frontend');
  const [newSkillLevel, setNewSkillLevel] = useState<SkillLevel>('intermediate');

  const addSkill = () => {
    if (!newSkillName.trim()) return;
    if (skills.some((s) => s.name.toLowerCase() === newSkillName.trim().toLowerCase())) return;
    setSkills([...skills, { name: newSkillName.trim(), category: newSkillCategory, level: newSkillLevel }]);
    setNewSkillName('');
  };

  const removeSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [msg, setMsg] = useState<{ type: 'error' | 'success', text: string } | null>(null);
  const [showCancelConfirm, setShowCancelConfirm] = useState(false);

  const isDirty = name !== (existing?.name ?? '') || 
                  email !== (existing?.email ?? '') || 
                  role !== (existing?.role ?? '') || 
                  department !== (existing?.department ?? '') || 
                  phone !== (existing?.phone ?? '') || 
                  consultantType !== (existing?.consultantType ?? 'consultant') ||
                  JSON.stringify(skills) !== JSON.stringify(existing?.skills ?? []);

  const handleCancelClick = () => {
    if (isDirty) {
      setShowCancelConfirm(true);
    } else if (onCancel) {
      onCancel();
    } else {
      router.back();
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    setIsSubmitting(true);
    setMsg(null);

    try {
      if (existing) {
        // Edit existing (local store for now, or db update)
        updateMember(existing.id, { name, email, role, department, phone: phone || undefined, consultantType, skills });
        if (onSuccess) onSuccess();
        else router.push('/members');
      } else {
        // REAL INVITATION
        const { inviteUserByEmail } = await import('@/lib/actions/authActions');
        const result = await inviteUserByEmail(
          email,
          'employee', // Default role for new members
          window.location.origin,
          name,
          department
        );

        if (result.error) {
          setMsg({ type: 'error', text: result.error });
        } else {
          setMsg({ type: 'success', text: `Einladung an ${email} wurde gesendet!` });
          // Optional: Add to store as "pending"
          addMember({ name, email, role, department, phone: phone || undefined, consultantType, skills });
          setTimeout(() => {
            if (onSuccess) onSuccess();
            else router.push('/members');
          }, 2000);
        }
      }
    } catch (err) {
      setMsg({ type: 'error', text: 'Ein interner Fehler ist aufgetreten.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold border animate-slide-up ${
          msg.type === 'success' 
          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
          : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {msg.text}
        </div>
      )}

      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
          placeholder="Max Mustermann"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">E-Mail *</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
          placeholder="max@firma.de"
          required
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Position / Rolle</label>
        <input
          type="text"
          value={role}
          onChange={(e) => setRole(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
          placeholder="Frontend-Entwickler"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Abteilung</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
          placeholder="Engineering"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-sm dark:text-white"
          placeholder="+49 151 12345678"
        />
      </div>

      {/* Berater-Typ */}
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-2">Berater-Typ</label>
        <div className="grid grid-cols-3 gap-2">
          {(Object.entries(CONSULTANT_TYPE_CONFIG) as [ConsultantType, typeof CONSULTANT_TYPE_CONFIG[ConsultantType]][]).map(([key, cfg]) => (
            <button key={key} type="button" onClick={() => setConsultantType(key)}
              className={`p-2.5 rounded-lg border-2 text-left transition-all cursor-pointer bg-transparent ${consultantType === key ? 'border-(--primary) bg-(--primary-light)' : 'border-slate-200 dark:border-white/10'}`}>
              <span className="text-[10px] font-black uppercase tracking-wide" style={{ color: cfg.color }}>{cfg.short}</span>
              <div className={`text-[10px] font-semibold mt-0.5 ${consultantType === key ? 'text-(--primary)' : 'dark:text-white/60 text-gray-600'}`}>{cfg.label}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Skills Section */}
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-2">
          Skills / Kompetenzen ({skills.length})
        </label>

        {/* Existing skills */}
        {skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {skills.map((skill) => (
              <span key={skill.name}
                className="inline-flex items-center gap-1 px-2 py-1 rounded-lg text-xs font-medium border"
                style={{ color: SKILL_LEVEL_CONFIG[skill.level].color, borderColor: `${SKILL_LEVEL_CONFIG[skill.level].color}30`, background: `${SKILL_LEVEL_CONFIG[skill.level].color}10` }}>
                {skill.name}
                <span className="text-[9px] opacity-60">({skill.category})</span>
                <button type="button" onClick={() => removeSkill(skill.name)} className="ml-0.5 opacity-40 hover:opacity-100">
                  <X size={10} />
                </button>
              </span>
            ))}
          </div>
        )}

        {/* Add skill */}
        <div className="flex gap-2 items-end">
          <div className="flex-1">
            <input type="text" value={newSkillName} onChange={(e) => setNewSkillName(e.target.value)}
              className="w-full px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs dark:text-white" placeholder="z.B. React, SAP, AWS..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
          </div>
          <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs cursor-pointer dark:text-white">
            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
            className="px-2 py-1.5 rounded-lg border border-slate-200 dark:border-white/10 bg-slate-50 dark:bg-white/5 text-xs cursor-pointer dark:text-white">
            {(Object.entries(SKILL_LEVEL_CONFIG) as [SkillLevel, { label: string }][]).map(
              ([k, v]) => <option key={k} value={k}>{v.label}</option>
            )}
          </select>
          <button type="button" onClick={addSkill}
            className="px-2.5 py-1.5 rounded-lg bg-blue-500/10 text-blue-500 text-xs font-semibold hover:bg-blue-500/20 transition-colors">
            <Plus size={12} />
          </button>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          disabled={isSubmitting}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors disabled:opacity-50"
        >
          {isSubmitting ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          {existing ? 'Speichern' : 'Anlegen & Einladen'}
        </button>
        <button
          type="button"
          onClick={handleCancelClick}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-slate-200 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600 hover:bg-slate-100 dark:hover:bg-white/5 transition-colors bg-transparent border-none cursor-pointer"
        >
          <X size={14} />
          Abbrechen
        </button>
      </div>

      <ConfirmModal
        isOpen={showCancelConfirm}
        onClose={() => setShowCancelConfirm(false)}
        onConfirm={() => {
          setShowCancelConfirm(false);
          if (onCancel) onCancel();
          else router.back();
        }}
        title="Änderungen verwerfen"
        message="Du hast ungespeicherte Änderungen. Möchtest du diese wirklich verwerfen?"
        confirmLabel="Verwerfen"
        variant="warning"
      />
    </form>
  );
}
