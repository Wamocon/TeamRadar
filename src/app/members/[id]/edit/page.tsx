'use client';
import { useParams } from 'next/navigation';
import { MemberForm } from '@/components/team/MemberForm';
import { Pencil } from 'lucide-react';

export default function EditMemberPage() {
  const params = useParams();
  const memberId = params.id as string;

  return (
    <div className="p-6 w-full space-y-6">
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
            <Pencil size={20} className="text-blue-400" />
          </div>
          Mitarbeiter bearbeiten
        </h1>
      </div>

      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-6">
        <MemberForm memberId={memberId} />
      </div>
    </div>
  );
}
