'use client';
import { useState, ReactNode } from 'react';
import { ChevronDown } from 'lucide-react';

interface CollapsiblePanelProps {
  title: string;
  count?: number;
  icon?: ReactNode;
  children: ReactNode;
  defaultExpanded?: boolean;
  className?: string;
  headerClassName?: string;
  accentColor?: string;
}

export function CollapsiblePanel({
  title,
  count,
  icon,
  children,
  defaultExpanded = true,
  className = '',
  headerClassName = '',
  accentColor,
}: CollapsiblePanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);

  return (
    <div className={`overflow-hidden ${className}`}>
      <button
        onClick={() => setIsExpanded(!isExpanded)}
        className={`w-full flex items-center justify-between p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] hover:bg-black/[0.04] dark:hover:bg-white/[0.04] transition-all border border-black/[0.05] dark:border-white/[0.05] cursor-pointer ${headerClassName}`}
      >
        <div className="flex items-center gap-3">
          {accentColor && (
            <div className="w-1.5 h-6 rounded-full" style={{ background: accentColor }} />
          )}
          {icon && <div className="dark:text-white/40 text-gray-400">{icon}</div>}
          <div className="flex flex-col items-start translate-y-[1px]">
            <span className="text-[10px] font-black uppercase tracking-widest dark:text-white/70 text-gray-700 leading-none mb-1">
              {title}
            </span>
            {count !== undefined && (
              <span className="text-[10px] font-bold text-blue-500/60 leading-none">
                {count} {count === 1 ? 'Eintrag' : 'Einträge'}
              </span>
            )}
          </div>
        </div>
        <div className={`transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
          <ChevronDown size={16} className="dark:text-white/30 text-gray-400" />
        </div>
      </button>

      <div 
        className={`transition-all duration-300 ease-in-out ${
          isExpanded ? 'mt-4 opacity-100 max-h-[5000px]' : 'max-h-0 opacity-0 pointer-events-none'
        }`}
      >
        {children}
      </div>
    </div>
  );
}
