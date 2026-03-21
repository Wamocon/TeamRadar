'use client';
import { PROJECT_TYPE_CONFIG, type ProjectType } from '@/types';

type FilterValue = ProjectType | 'all';

interface Props {
  value: FilterValue;
  onChange: (value: FilterValue) => void;
  counts?: { internal: number; external: number };
}

const OPTIONS: { value: FilterValue; label: string; icon: string; color?: string }[] = [
  { value: 'all', label: 'Alle', icon: '📊' },
  { value: 'internal', label: PROJECT_TYPE_CONFIG.internal.label, icon: '🏢', color: PROJECT_TYPE_CONFIG.internal.color },
  { value: 'external', label: PROJECT_TYPE_CONFIG.external.label, icon: '🌐', color: PROJECT_TYPE_CONFIG.external.color },
];

export function ProjectTypeFilter({ value, onChange, counts }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-black/[0.04] dark:bg-white/[0.04] rounded-xl w-fit">
      {OPTIONS.map((opt) => {
        const isActive = value === opt.value;
        const count = opt.value === 'all'
          ? counts ? counts.internal + counts.external : undefined
          : counts?.[opt.value as ProjectType];
        return (
          <button
            key={opt.value}
            onClick={() => onChange(opt.value)}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
              isActive
                ? 'bg-white dark:bg-white/10 shadow-sm'
                : 'dark:text-white/40 text-gray-500 hover:text-gray-700 dark:hover:text-white/60'
            }`}
            style={isActive && opt.color ? { color: opt.color } : undefined}
          >
            <span>{opt.icon}</span>
            {opt.label}
            {count !== undefined && (
              <span className={`text-[9px] px-1 py-0.5 rounded-full ${
                isActive ? 'bg-black/[0.06] dark:bg-white/[0.06]' : 'bg-black/[0.04] dark:bg-white/[0.04]'
              }`}>
                {count}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
