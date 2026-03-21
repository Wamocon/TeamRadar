'use client';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG, type AvailabilityStatus, type Member } from '@/types';
import { StatusDot } from '@/components/team/StatusBadge';

interface Props {
  members: Member[];
  date: string;
}

export function AvailabilityTimeline({ members, date }: Props) {
  const availabilities = useAppStore((s) => s.availabilities);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);

  const hours = Array.from({ length: 10 }, (_, i) => i + 8); // 08:00 – 17:00

  return (
    <div className="overflow-x-auto">
      <div className="min-w-[700px]">
        {/* Header */}
        <div className="flex items-center border-b border-black/[0.04] dark:border-white/[0.04] pb-2 mb-2">
          <div className="w-40 shrink-0" />
          {hours.map((h) => (
            <div key={h} className="flex-1 text-center text-[9px] font-mono dark:text-white/25 text-gray-400">
              {String(h).padStart(2, '0')}:00
            </div>
          ))}
        </div>

        {/* Rows */}
        {members.slice(0, 15).map((member, idx) => {
          const memberAvail = availabilities.filter(
            (a) => a.memberId === member.id && a.date === date
          );
          const currentStatus = getMemberStatus(member.id, date);

          return (
            <div key={member.id}
              className={`flex items-center py-1.5 ${idx % 2 === 0 ? 'bg-black/[0.01] dark:bg-white/[0.01]' : ''}`}
              style={{ animationDelay: `${idx * 30}ms` }}>
              {/* Name */}
              <div className="w-40 shrink-0 flex items-center gap-2 px-2">
                <StatusDot status={currentStatus} />
                <span className="text-xs dark:text-white/70 text-gray-700 truncate">{member.name}</span>
              </div>

              {/* Timeline */}
              <div className="flex-1 flex relative h-6">
                {memberAvail.length === 0 ? (
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full h-3 rounded bg-gray-500/10" />
                  </div>
                ) : (
                  memberAvail.map((avail) => {
                    const config = STATUS_CONFIG[avail.status];
                    const startH = avail.startTime
                      ? parseInt(avail.startTime.split(':')[0]) + parseInt(avail.startTime.split(':')[1]) / 60
                      : 8;
                    const endH = avail.endTime
                      ? parseInt(avail.endTime.split(':')[0]) + parseInt(avail.endTime.split(':')[1]) / 60
                      : 18;
                    const left = ((startH - 8) / 10) * 100;
                    const width = ((endH - startH) / 10) * 100;

                    return (
                      <div key={avail.id}
                        className="timeline-bar absolute top-1 h-4"
                        style={{ left: `${Math.max(0, left)}%`, width: `${Math.min(100, width)}%`, background: config.color + 'cc' }}
                        title={`${config.label}: ${avail.startTime ?? '08:00'} – ${avail.endTime ?? '18:00'}${avail.note ? ` — ${avail.note}` : ''}`} />
                    );
                  })
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
