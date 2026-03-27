'use client';
import { useState } from 'react';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG, type AvailabilityStatus, type Member } from '@/types';
import { CalendarDays, Clock, Save, X } from 'lucide-react';

const statusOptions = Object.entries(STATUS_CONFIG).map(([key, val]) => ({
  value: key as AvailabilityStatus,
  label: val.label,
  color: val.color,
}));

interface Props {
  memberId?: string;
  date?: string;
  onClose?: () => void;
}

export function AvailabilityForm({ memberId, date, onClose }: Props) {
  const members = useAppStore((s) => s.members);
  const addAvailability = useAppStore((s) => s.addAvailability);

  const [selectedMember, setSelectedMember] = useState(memberId ?? '');
  const [selectedDate, setSelectedDate] = useState(date ?? new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(date ?? new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState<AvailabilityStatus>('available');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('17:00');
  const [note, setNote] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMember || !selectedDate) return;

    // Zeitraum-Logik
    const start = new Date(selectedDate);
    const end = new Date(endDate || selectedDate);
    
    const current = new Date(start);
    while (current <= end) {
      const dateStr = current.toISOString().slice(0, 10);
      addAvailability({
        memberId: selectedMember,
        status,
        date: dateStr,
        startTime: startTime || undefined,
        endTime: endTime || undefined,
        note: note || undefined,
      });
      current.setDate(current.getDate() + 1);
    }

    onClose?.();
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {!memberId && (
        <div>
          <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Mitarbeiter *</label>
          <select
            value={selectedMember}
            onChange={(e) => setSelectedMember(e.target.value)}
            className="w-full px-3 py-2 rounded-lg border text-sm"
            required
          >
            <option value="">Bitte wählen...</option>
            {members.map((m) => (
              <option key={m.id} value={m.id}>{m.name}</option>
            ))}
          </select>
        </div>
      )}

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Von Datum *</label>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              required
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Bis Datum *</label>
          <div className="relative">
            <CalendarDays size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
              required
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Status *</label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {statusOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setStatus(opt.value)}
              className={`px-2.5 py-1.5 rounded-lg text-[11px] font-semibold border transition-all ${
                status === opt.value
                  ? 'scale-[1.03]'
                  : 'border-black/[0.06] dark:border-white/[0.06] hover:scale-[1.02]'
              }`}
              style={
                status === opt.value
                  ? { background: `${opt.color}18`, borderColor: `${opt.color}40`, color: opt.color }
                  : { color: 'inherit' }
              }
            >
              {opt.label}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Von</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
            <input
              type="time"
              value={startTime}
              onChange={(e) => setStartTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
            />
          </div>
        </div>
        <div>
          <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Bis</label>
          <div className="relative">
            <Clock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
            <input
              type="time"
              value={endTime}
              onChange={(e) => setEndTime(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-lg border text-sm"
            />
          </div>
        </div>
      </div>

      <div>
        <label className="block text-xs font-semibold dark:text-white/50 text-gray-500 mb-1">Notiz</label>
        <input
          type="text"
          value={note}
          onChange={(e) => setNote(e.target.value)}
          className="w-full px-3 py-2 rounded-lg border text-sm"
          placeholder="z.B. Zahnarzttermin ab 14 Uhr"
        />
      </div>

      <div className="flex gap-3 pt-2">
        <button
          type="submit"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 transition-colors"
        >
          <Save size={14} />
          Eintragen
        </button>
        {onClose && (
          <button
            type="button"
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 rounded-lg border border-black/10 dark:border-white/10 text-sm font-medium dark:text-white/60 text-gray-600 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] transition-colors"
          >
            <X size={14} />
            Abbrechen
          </button>
        )}
      </div>
    </form>
  );
}
