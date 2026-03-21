'use client';
import { Search, X } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import type { AvailabilityStatus } from '@/types';
import { STATUS_CONFIG } from '@/types';

interface Props {
  searchTerm: string;
  onSearchChange: (value: string) => void;
  selectedStatus: AvailabilityStatus | 'all';
  onStatusChange: (status: AvailabilityStatus | 'all') => void;
  selectedDepartment: string;
  onDepartmentChange: (dept: string) => void;
  departments: string[];
  selectedProject?: string;
  onProjectChange?: (projectId: string) => void;
  projects?: { id: string; name: string; type: 'internal' | 'external' }[];
}

export function SearchFilter({
  searchTerm, onSearchChange,
  selectedStatus, onStatusChange,
  selectedDepartment, onDepartmentChange,
  departments,
  selectedProject, onProjectChange,
  projects,
}: Props) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex flex-col sm:flex-row gap-3">
      {/* Search */}
      <div className="relative flex-1">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/25 text-gray-400" />
        <input
          ref={inputRef}
          type="text"
          placeholder="Mitarbeiter suchen..."
          value={searchTerm}
          onChange={(e) => onSearchChange(e.target.value)}
          className="search-input w-full pl-9 pr-8 py-2 rounded-lg text-xs"
        />
        {searchTerm && (
          <button onClick={() => { onSearchChange(''); inputRef.current?.focus(); }}
            className="absolute right-2 top-1/2 -translate-y-1/2 dark:text-white/25 text-gray-400 hover:text-red-400 bg-transparent border-none cursor-pointer p-0.5">
            <X size={12} />
          </button>
        )}
      </div>

      {/* Status Filter */}
      <select
        value={selectedStatus}
        onChange={(e) => onStatusChange(e.target.value as AvailabilityStatus | 'all')}
        className="px-3 py-2 rounded-lg text-xs border cursor-pointer"
        style={{ minWidth: 130 }}>
        <option value="all">Alle Status</option>
        {(Object.entries(STATUS_CONFIG) as [AvailabilityStatus, typeof STATUS_CONFIG[AvailabilityStatus]][]).map(
          ([key, config]) => (
            <option key={key} value={key}>{config.label}</option>
          )
        )}
      </select>

      {/* Department Filter */}
      {departments.length > 1 && (
        <select
          value={selectedDepartment}
          onChange={(e) => onDepartmentChange(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs border cursor-pointer"
          style={{ minWidth: 130 }}>
          <option value="">Alle Abteilungen</option>
          {departments.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
      )}

      {/* Project Filter */}
      {projects && projects.length > 0 && onProjectChange && (
        <select
          value={selectedProject ?? ''}
          onChange={(e) => onProjectChange(e.target.value)}
          className="px-3 py-2 rounded-lg text-xs border cursor-pointer"
          style={{ minWidth: 130 }}>
          <option value="">Alle Projekte</option>
          {projects.map((p) => (
            <option key={p.id} value={p.id}>{p.type === 'internal' ? '🏢' : '🌐'} {p.name}</option>
          ))}
        </select>
      )}
    </div>
  );
}
