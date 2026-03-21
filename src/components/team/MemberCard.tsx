'use client';
import { User, Mail, Phone, Building2 } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge, StatusDot } from './StatusBadge';
import { STATUS_CONFIG } from '@/types';
import type { Member } from '@/types';

export function MemberCard({ member }: { member: Member }) {
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const status = getMemberStatus(member.id);
  const config = STATUS_CONFIG[status];

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  return (
    <div className="card-shimmer rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        {/* Avatar with status ring */}
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${status === 'available' ? 'status-pulse-available' : ''}`}
            style={{ background: `${config.color}18`, color: config.color, border: `2px solid ${config.color}40` }}>
            {member.avatarUrl ? (
              <img src={member.avatarUrl} alt={member.name}
                className="w-full h-full rounded-full object-cover" />
            ) : (
              <span>{initials}</span>
            )}
          </div>
          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 dark:border-[#111827] border-white"
            style={{ background: config.color }} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 justify-between">
            <h3 className="text-sm font-bold dark:text-white text-gray-900 truncate group-hover:text-blue-500 transition-colors">
              {member.name}
            </h3>
            <StatusBadge status={status} size="sm" />
          </div>

          <div className="text-[11px] dark:text-white/40 text-gray-500 mt-0.5">{member.role}</div>

          <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
            <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
              <Building2 size={10} className="shrink-0 opacity-60" />
              <span className="truncate">{member.department}</span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
              <Mail size={10} className="shrink-0 opacity-60" />
              <span className="truncate">{member.email}</span>
            </div>
            {member.phone && (
              <div className="flex items-center gap-1.5 text-[10px] dark:text-white/30 text-gray-400">
                <Phone size={10} className="shrink-0 opacity-60" />
                <span>{member.phone}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
