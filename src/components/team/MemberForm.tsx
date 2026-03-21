'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { SKILL_CATEGORIES, SKILL_LEVEL_CONFIG, type Skill, type SkillLevel, type SkillCategory } from '@/types';

export function MemberForm({ memberId }: { memberId?: string }) {
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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (existing) {
      updateMember(existing.id, { name, email, role, department, phone: phone || undefined, skills });
    } else {
      addMember({ name, email, role, department, phone: phone || undefined, skills });
    }
    router.push('/members');
  };

  return (
    <form onSubmit={handleSubmit} className="max-w-lg space-y-4">
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Name *</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
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
          className="w-full px-3 py-2 rounded-lg border text-sm"
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
          className="w-full px-3 py-2 rounded-lg border text-sm"
          placeholder="Frontend-Entwickler"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Abteilung</label>
        <input
          type="text"
          value={department}
          onChange={(e) => setDepartment(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          placeholder="Engineering"
        />
      </div>
      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Telefon</label>
        <input
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          placeholder="+49 151 12345678"
        />
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
              className="w-full px-2.5 py-1.5 rounded-lg border text-xs" placeholder="z.B. React, SAP, AWS..."
              onKeyDown={(e) => { if (e.key === 'Enter') { e.preventDefault(); addSkill(); } }} />
          </div>
          <select value={newSkillCategory} onChange={(e) => setNewSkillCategory(e.target.value as SkillCategory)}
            className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer">
            {SKILL_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
          </select>
          <select value={newSkillLevel} onChange={(e) => setNewSkillLevel(e.target.value as SkillLevel)}
            className="px-2 py-1.5 rounded-lg border text-xs cursor-pointer">
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
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Save size={14} />
          {existing ? 'Speichern' : 'Anlegen'}
        </button>
        <button
          type="button"
          onClick={() => router.back()}
          className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
        >
          <X size={14} />
          Abbrechen
        </button>
      </div>
    </form>
  );
}
