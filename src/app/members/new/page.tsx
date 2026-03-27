'use client';
import { MemberForm } from '@/components/team/MemberForm';
import { UserPlus } from 'lucide-react';

export default function NewMemberPage() {
  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
            <UserPlus size={20} className="text-blue-400" />
          </div>
          Neuer Mitarbeiter
        </h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
          Mitarbeiter zum Team hinzufügen
        </p>
      </div>

      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-6">
        <MemberForm />
      </div>
    </div>
  );
}
