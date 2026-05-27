'use client';
import { useState, type ReactNode } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';

interface CollapsibleSectionProps {
  title: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  /** Wenn von außen gesteuert */
  isOpen?: boolean;
  onToggle?: () => void;
  /** Extra Klassen für den äußeren Container */
  className?: string;
  /** Extra Klassen für den Header */
  headerClassName?: string;
  /** Kleines Badge z.B. Anzahl */
  badge?: string | number;
}

export function CollapsibleSection({
  title,
  icon,
  defaultOpen = true,
  isOpen: controlledOpen,
  onToggle: controlledToggle,
  children,
  className = '',
  headerClassName = '',
  badge,
}: CollapsibleSectionProps) {
  const [internalOpen, setInternalOpen] = useState(defaultOpen);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : internalOpen;
  const toggle = isControlled ? (controlledToggle ?? (() => {})) : () => setInternalOpen((v) => !v);

  return (
    <div className={`card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden ${className}`}>
      <button
        onClick={toggle}
        className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors group ${open ? 'border-b dark:border-white/6 border-black/6' : ''} ${headerClassName}`}
        aria-expanded={open}
      >
        <div className="flex items-center gap-3 min-w-0">
          {icon && (
            <span className="text-(--primary) shrink-0">{icon}</span>
          )}
          <span className="text-sm font-black dark:text-white text-gray-900 text-left">{title}</span>
          {badge !== undefined && (
            <span className="px-2 py-0.5 rounded-full bg-(--primary-light) text-(--primary) text-[10px] font-bold shrink-0">
              {badge}
            </span>
          )}
        </div>
        <span className="shrink-0 dark:text-white/30 text-gray-400 group-hover:text-(--primary) transition-colors ml-3">
          {open ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </span>
      </button>

      {open && (
        <div className="p-5 space-y-4">
          {children}
        </div>
      )}
    </div>
  );
}
