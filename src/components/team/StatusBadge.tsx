'use client';
import { STATUS_CONFIG, type AvailabilityStatus } from '@/types';

export function StatusBadge({ status, size = 'md' }: { status: AvailabilityStatus; size?: 'sm' | 'md' | 'lg' }) {
  const config = STATUS_CONFIG[status];
  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5',
    md: 'text-[10px] px-2 py-0.5',
    lg: 'text-xs px-2.5 py-1',
  };

  return (
    <span
      className={`inline-flex items-center gap-1 rounded-full font-semibold ${sizeClasses[size]}`}
      style={{
        background: `${config.color}18`,
        color: config.color,
        border: `1px solid ${config.color}30`,
      }}
    >
      <span
        className="w-1.5 h-1.5 rounded-full animate-pulse"
        style={{ background: config.color }}
      />
      {config.label}
    </span>
  );
}

export function StatusDot({ status }: { status: AvailabilityStatus }) {
  const config = STATUS_CONFIG[status];
  return (
    <span
      className="inline-block w-2.5 h-2.5 rounded-full ring-2 ring-offset-1 dark:ring-offset-gray-900 ring-offset-white"
      style={{ background: config.color, boxShadow: `0 0 0 2px ${config.color}40` }}
      title={config.label}
    />
  );
}
