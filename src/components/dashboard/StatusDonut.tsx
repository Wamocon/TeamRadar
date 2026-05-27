'use client';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';

interface Props {
  counts: Partial<Record<AvailabilityStatus, number>>;
  total: number;
}

export function StatusDonut({ counts, total }: Props) {
  const entries = (Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][])
    .map(([key, config]) => ({ key, config, count: counts[key] || 0 }))
    .filter((e) => e.count > 0);

  const size = 112;
  const strokeWidth = 14;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  let offset = 0;
  const segments = entries.map((e) => {
    const pct = e.count / total;
    const dashArray = pct * circumference;
    const dashOffset = -offset;
    offset += dashArray;
    return { ...e, dashArray, dashOffset, pct };
  });

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative shrink-0" style={{ width: size, height: size }}>
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          <circle cx={size / 2} cy={size / 2} r={radius}
            fill="none" stroke="var(--border)" strokeWidth={strokeWidth} opacity={0.3} />
          {segments.map((seg) => (
            <circle key={seg.key} cx={size / 2} cy={size / 2} r={radius}
              fill="none" stroke={seg.config.color} strokeWidth={strokeWidth}
              strokeDasharray={`${seg.dashArray} ${circumference - seg.dashArray}`}
              strokeDashoffset={seg.dashOffset}
              strokeLinecap="round"
              className="donut-segment"
              transform={`rotate(-90 ${size / 2} ${size / 2})`} />
          ))}
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <span className="text-xl font-black dark:text-white text-gray-900">{total}</span>
          <span className="text-[9px] dark:text-white/30 text-gray-400 font-medium">Gesamt</span>
        </div>
        </div>
        <div className="text-[10px] dark:text-white/30 text-gray-400">Kompakte Verteilung</div>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-1.5">
        {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(([key, config]) => {
          const count = counts[key] || 0;
          return (
            <div key={key} className="flex items-center justify-between gap-2 px-2 py-1 rounded-md bg-black/3 dark:bg-white/4 border border-black/6 dark:border-white/6 text-[10px] min-w-0">
              <div className="flex items-center gap-1.5 min-w-0">
                <span className="w-2 h-2 rounded-full shrink-0" style={{ background: config.color }} />
                <span className="dark:text-white/55 text-gray-600 truncate">{config.label}</span>
              </div>
              <span className="font-black dark:text-white/85 text-gray-800 shrink-0">{count}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
