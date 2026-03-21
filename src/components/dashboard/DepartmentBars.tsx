'use client';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';

interface Props {
  counts: Partial<Record<AvailabilityStatus, number>>;
  total: number;
}

export function DepartmentBars({ departments }: { departments: { name: string; counts: Partial<Record<AvailabilityStatus, number>>; total: number }[] }) {
  if (departments.length === 0) return null;

  return (
    <div className="space-y-3">
      {departments.map((dept) => (
        <div key={dept.name} className="flex items-center gap-3">
          <span className="text-xs dark:text-white/50 text-gray-500 w-28 truncate shrink-0" title={dept.name}>
            {dept.name}
          </span>
          <div className="flex-1 flex h-5 rounded-md overflow-hidden bg-black/[0.03] dark:bg-white/[0.03]">
            {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(
              ([key, config]) => {
                const count = dept.counts[key] || 0;
                if (count === 0) return null;
                const pct = (count / dept.total) * 100;
                return (
                  <div key={key}
                    className="progress-bar h-full flex items-center justify-center text-[8px] font-bold text-white/90"
                    style={{ width: `${pct}%`, background: config.color, minWidth: count > 0 ? '16px' : 0 }}
                    title={`${config.label}: ${count}`}>
                    {pct > 10 ? count : ''}
                  </div>
                );
              }
            )}
          </div>
          <span className="text-[10px] font-mono dark:text-white/30 text-gray-400 w-6 text-right">{dept.total}</span>
        </div>
      ))}
    </div>
  );
}
