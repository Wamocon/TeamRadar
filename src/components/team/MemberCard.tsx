'use client';
import Image from 'next/image';
import { User, Mail, Phone, Building2, Zap } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { StatusBadge, StatusDot } from './StatusBadge';
import { STATUS_CONFIG, SKILL_LEVEL_CONFIG } from '@/types';
import type { Member } from '@/types';

export function MemberCard({ member }: { member: Member }) {
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const getMemberUtilization = useAppStore((s) => s.getMemberUtilization);
  const status = getMemberStatus(member.id);
  const config = STATUS_CONFIG[status];
  const utilization = getMemberUtilization(member.id);

  const initials = member.name
    .split(' ')
    .map((n) => n[0])
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const utilColor = utilization > 100 ? '#ef4444' : utilization >= 80 ? '#f59e0b' : '#22c55e';

  return (
    <div className="card-shimmer rounded-xl p-4 group">
      <div className="flex items-start gap-3">
        {/* Avatar with status ring */}
        <div className="relative shrink-0">
          <div className={`w-11 h-11 rounded-full flex items-center justify-center text-sm font-bold ${status === 'available' ? 'status-pulse-available' : ''}`}
            style={{ background: `${config.color}18`, color: config.color, border: `2px solid ${config.color}40` }}>
            {member.avatarUrl ? (
              <Image src={member.avatarUrl} alt={member.name}
                width={44} height={44} className="w-full h-full rounded-full object-cover" />
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

          {/* Utilization bar */}
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-black/[0.06] dark:bg-white/[0.06]">
              <div className="h-full rounded-full transition-all" style={{ width: `${Math.min(utilization, 100)}%`, background: utilColor }} />
            </div>
            <span className="text-[10px] font-bold" style={{ color: utilColor }}>{utilization}%</span>
          </div>

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

          {/* Skills */}
          {member.skills && member.skills.length > 0 && (
            <div className="mt-2 flex flex-wrap gap-1">
              {member.skills.slice(0, 4).map((skill) => (
                <span key={skill.name}
                  className="px-1.5 py-0.5 rounded text-[9px] font-semibold"
                  style={{ color: SKILL_LEVEL_CONFIG[skill.level].color, background: `${SKILL_LEVEL_CONFIG[skill.level].color}15` }}>
                  {skill.name}
                </span>
              ))}
              {member.skills.length > 4 && (
                <span className="px-1.5 py-0.5 rounded text-[9px] font-semibold dark:text-white/30 text-gray-400">
                  +{member.skills.length - 4}
                </span>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
