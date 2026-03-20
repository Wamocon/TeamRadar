'use client';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge } from './StatusBadge';
import type { Member } from '@/types';

export function MemberCard({ member }: { member: Member }) {
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const status = getMemberStatus(member.id);

  return (
    <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 transition-all hover:scale-[1.02] hover:shadow-lg">
      <div className="flex items-start gap-3">
        {/* Avatar */}
        <div className="w-11 h-11 rounded-full bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center shrink-0">
          {member.avatarUrl ? (
            <img
              src={member.avatarUrl}
              alt={member.name}
              className="w-full h-full rounded-full object-cover"
            />
          ) : (
            <User size={18} className="text-blue-400" />
          )}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-sm font-bold dark:text-white text-gray-900 truncate">
              {member.name}
            </h3>
            <StatusBadge status={status} size="sm" />
          </div>

          <div className="text-[11px] dark:text-white/40 text-gray-500 mt-0.5">{member.role}</div>

          <div className="mt-2 flex flex-col gap-1">
            <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
              <Building2 size={10} className="shrink-0" />
              <span className="truncate">{member.department}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
              <Mail size={10} className="shrink-0" />
              <span className="truncate">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
                <Phone size={10} className="shrink-0" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
