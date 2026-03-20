'use client';
import { useAppStore } from '@/stores/appStore';
import { MemberCard } from './MemberCard';
import { Users } from 'lucide-react';

export function TeamGrid({ filterDepartment }: { filterDepartment?: string }) {
  const members = useAppStore((s) => s.members);

  const filtered = filterDepartment
    ? members.filter((m) => m.department === filterDepartment)
    : members;

  if (filtered.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <div className="w-16 h-16 rounded-2xl bg-blue-500/10 flex items-center justify-center mb-4">
          <Users size={28} className="text-blue-400" />
        </div>
        <h3 className="text-sm font-semibold dark:text-white/60 text-gray-500">
          Keine Mitarbeiter vorhanden
        </h3>
        <p className="text-xs dark:text-white/30 text-gray-400 mt-1">
          Lege deinen ersten Mitarbeiter an, um loszulegen.
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
      {filtered.map((member) => (
        <MemberCard key={member.id} member={member} />
      ))}
    </div>
  );
}
