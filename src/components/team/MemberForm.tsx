'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { Save, X } from 'lucide-react';

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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !email.trim()) return;

    if (existing) {
      updateMember(existing.id, { name, email, role, department, phone: phone || undefined });
    } else {
      addMember({ name, email, role, department, phone: phone || undefined });
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
