'use client';
import { useAppStore } from '@/stores/appStore';
import { MemberCard } from './MemberCard';
import { Users } from 'lucide-react';
import type { Member } from '@/types';

export function TeamGrid({ filterDepartment, members: membersProp }: { filterDepartment?: string; members?: Member[] }) {
  const storeMembers = useAppStore((s) => s.members);
  const source = membersProp ?? storeMembers;

  const filtered = filterDepartment
    ? source.filter((m) => m.department === filterDepartment)
    : source;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <Users size={28} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold dark:text-white/60 text-gray-500">
          Keine Mitarbeiter gefunden
        </h3>
        <p className="text-xs dark:text-white/30 text-gray-400 mt-1">
          Passe deine Filter an oder lege neue Mitarbeiter an.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map((member, idx) => (
        <div key={member.id} className="animate-fade-in" style={{ animationDelay: `${idx * 30}ms` }}>
          <MemberCard member={member} />
        </div>
      ))}
    </div>
  );
}
