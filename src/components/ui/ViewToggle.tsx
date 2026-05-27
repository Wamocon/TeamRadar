'use client';
import { LayoutGrid, List } from 'lucide-react';

export type ViewMode = 'grid' | 'list';

interface Props {
  value: ViewMode;
  onChange: (mode: ViewMode) => void;
}

export function ViewToggle({ value, onChange }: Props) {
  return (
    <div className="flex gap-1 p-1 bg-black/4 dark:bg-white/4 rounded-xl">
      <button
        onClick={() => onChange('grid')}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          value === 'grid'
            ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
            : 'dark:text-white/40 text-gray-400 hover:text-gray-600 dark:hover:text-white/60'
        }`}
        title="Rasteransicht"
      >
        <LayoutGrid size={16} />
      </button>
      <button
        onClick={() => onChange('list')}
        className={`p-1.5 rounded-lg transition-all cursor-pointer ${
          value === 'list'
            ? 'bg-white dark:bg-white/10 shadow-sm text-blue-500'
            : 'dark:text-white/40 text-gray-400 hover:text-gray-600 dark:hover:text-white/60'
        }`}
        title="Listenansicht"
      >
        <List size={16} />
      </button>
    </div>
  );
}
