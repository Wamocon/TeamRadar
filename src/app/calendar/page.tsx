'use client';
import { useState, useMemo, useCallback } from 'react';
import {
  CalendarDays, ChevronLeft, ChevronRight, Plus, X, BookOpen,
  Clock, MapPin, Upload, Info,
  Loader, Trash2, Edit3, ChevronDown, ChevronUp,
} from 'lucide-react';
import {
  startOfMonth, endOfMonth, startOfWeek, endOfWeek, eachDayOfInterval,
  format, addMonths, subMonths, isSameMonth, isToday, parseISO,
  isSameDay, addDays,
} from 'date-fns';
import { de } from 'date-fns/locale';

// -- Types -------------------------------------------------
interface CalendarEvent {
  id: string;
  title: string;
  date: string;       // YYYY-MM-DD
  startTime?: string; // HH:MM
  endTime?: string;
  location?: string;
  description?: string;
  attendees?: string[];
  color?: string;
  source?: 'manual' | 'ics_import' | 'google' | 'outlook';
}

const EVENT_COLORS = [
  '#6366f1', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#0ea5e9', '#f59e0b',
];

// -- ICS Parser (minimal) ----------------------------------
function parseICS(text: string): CalendarEvent[] {
  const events: CalendarEvent[] = [];
  const blocks = text.split('BEGIN:VEVENT');
  for (let i = 1; i < blocks.length; i++) {
    const block = blocks[i];
    const get = (key: string) => {
      const m = block.match(new RegExp(`${key}[^:]*:([^\r\n]+)`));
      return m ? m[1].trim() : '';
    };
    const dtstart = get('DTSTART');
    if (!dtstart) continue;
    const dateStr = dtstart.replace(/T.*/, '').replace(/(\d{4})(\d{2})(\d{2})/, '$1-$2-$3');
    const startTime = dtstart.includes('T') ? dtstart.replace(/.*T(\d{2})(\d{2}).*/, '$1:$2') : undefined;
    const dtend = get('DTEND');
    const endTime = dtend && dtend.includes('T') ? dtend.replace(/.*T(\d{2})(\d{2}).*/, '$1:$2') : undefined;
    const summary = get('SUMMARY').replace(/\\,/g, ',').replace(/\\n/g, ' ').replace(/\\;/g, ';');
    const location = get('LOCATION').replace(/\\,/g, ',');
    const description = get('DESCRIPTION').replace(/\\n/g, '\n').replace(/\\,/g, ',').slice(0, 300);
    events.push({
      id: `ics-${Date.now()}-${i}`,
      title: summary || '(Kein Titel)',
      date: dateStr,
      startTime,
      endTime,
      location: location || undefined,
      description: description || undefined,
      source: 'ics_import',
      color: '#6366f1',
    });
  }
  return events;
}

// -- How-To Popup ------------------------------------------
function HowToPopup({ onClose }: { onClose: () => void }) {
  const [tab, setTab] = useState<'google' | 'outlook'>('google');
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 w-full max-w-xl mx-4 max-h-[90vh] overflow-y-auto animate-scale-up"
        onClick={(e) => e.stopPropagation()}>
        <div className="p-5 border-b dark:border-white/10 border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-500/10 flex items-center justify-center">
              <BookOpen size={17} className="text-indigo-500" />
            </div>
            <div>
              <h2 className="text-base font-black dark:text-white text-gray-900">Kalender synchronisieren</h2>
              <p className="text-[10px] dark:text-white/40 text-gray-500">Anleitung f�r Google & Outlook</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500 transition-colors">
            <X size={16} />
          </button>
        </div>

        <div className="flex gap-1 p-4 pb-0">
          {(['google', 'outlook'] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition-all border-none cursor-pointer ${tab === t ? 'bg-(--primary) text-white' : 'dark:text-white/40 text-gray-500 hover:bg-gray-100 dark:hover:bg-white/5 bg-transparent'}`}>
              {t === 'google' ? '?? Google' : '?? Outlook'}
            </button>
          ))}
        </div>

        <div className="p-5 space-y-4">
          {tab === 'google' ? (
            <>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs dark:text-white/70 text-gray-700 leading-relaxed">
                <strong className="text-blue-500">Option A � ICS-Import (empfohlen):</strong>
                <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                  <li>�ffne <strong>calendar.google.com</strong></li>
                  <li>Klicke rechts oben auf das Zahnrad ? <strong>Einstellungen</strong></li>
                  <li>Links unter "Einstellungen f�r meine Kalender" deinen Kalender w�hlen</li>
                  <li>Ganz unten: <strong>"Kalender exportieren"</strong> ? .ics herunterladen</li>
                  <li>Zur�ck in TeamRadar: Schaltfl�che <strong>"ICS importieren"</strong> klicken und Datei w�hlen</li>
                </ol>
              </div>
              <div className="p-3 rounded-xl bg-blue-500/5 border border-blue-500/10 text-xs dark:text-white/70 text-gray-700 leading-relaxed">
                <strong className="text-blue-500">Option B � Direkt-Link (read-only):</strong>
                <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                  <li>Kalender-Einstellungen ? "Im iCal-Format" ? ICAL-Link kopieren</li>
                  <li>Den Link dem Administrator mitteilen f�r die Kalender-Integration</li>
                </ol>
              </div>
            </>
          ) : (
            <>
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs dark:text-white/70 text-gray-700 leading-relaxed">
                <strong className="text-orange-500">Outlook Desktop (Export):</strong>
                <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                  <li>Outlook �ffnen ? <strong>Datei ? �ffnen und Exportieren ? Importieren/Exportieren</strong></li>
                  <li>W�hle <strong>"In Datei exportieren"</strong> ? <strong>iCalendar-Format (.ics)"</strong></li>
                  <li>Kalender und Zeitraum w�hlen ? Speichern</li>
                  <li>Zur�ck in TeamRadar: <strong>"ICS importieren"</strong> klicken und die .ics-Datei w�hlen</li>
                </ol>
              </div>
              <div className="p-3 rounded-xl bg-orange-500/5 border border-orange-500/10 text-xs dark:text-white/70 text-gray-700 leading-relaxed">
                <strong className="text-orange-500">Outlook Web (OWA):</strong>
                <ol className="mt-2 space-y-1.5 list-decimal list-inside">
                  <li>Auf <strong>outlook.office.com</strong> anmelden ? Kalender-Ansicht</li>
                  <li>Oben rechts: Zahnrad ? <strong>Kalendereinstellungen</strong></li>
                  <li>ICS ? "Kalender ver�ffentlichen" ? Link generieren und hier einf�gen</li>
                </ol>
              </div>
            </>
          )}

          <div className="p-3 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] text-xs dark:text-white/70 text-gray-700 flex items-start gap-2">
            <Info size={13} className="text-(--primary) shrink-0 mt-0.5" />
            Importierte Termine werden lokal gespeichert. F�r Live-Sync bitte den Administrator kontaktieren.
          </div>
        </div>
      </div>
    </div>
  );
}

// -- Event Form --------------------------------------------
function EventForm({ initial, onSave, onCancel }: {
  initial?: Partial<CalendarEvent>;
  onSave: (ev: CalendarEvent) => void;
  onCancel: () => void;
}) {
  const [title, setTitle] = useState(initial?.title || '');
  const [date, setDate] = useState(initial?.date || new Date().toISOString().slice(0, 10));
  const [startTime, setStartTime] = useState(initial?.startTime || '');
  const [endTime, setEndTime] = useState(initial?.endTime || '');
  const [location, setLocation] = useState(initial?.location || '');
  const [description, setDescription] = useState(initial?.description || '');
  const [color, setColor] = useState(initial?.color || EVENT_COLORS[0]);

  const handleSave = () => {
    if (!title.trim()) return;
    onSave({
      id: initial?.id || `ev-${Date.now()}`,
      title: title.trim(),
      date,
      startTime: startTime || undefined,
      endTime: endTime || undefined,
      location: location || undefined,
      description: description || undefined,
      color,
      source: initial?.source || 'manual',
    });
  };

  return (
    <div className="space-y-3 p-1">
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Titel *</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} placeholder="Termintitel"
          className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
      </div>
      <div className="grid grid-cols-3 gap-2">
        <div className="col-span-1 space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Datum</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)}
            className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-xs dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Von</label>
          <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)}
            className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-xs dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
        </div>
        <div className="space-y-1">
          <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Bis</label>
          <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)}
            className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-xs dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
        </div>
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Ort</label>
        <input value={location} onChange={(e) => setLocation(e.target.value)} placeholder="z.B. Besprechungsraum A"
          className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
      </div>
      <div className="space-y-1">
        <label className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Notiz</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2}
          className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg p-2.5 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) resize-none" />
      </div>
      <div className="flex items-center gap-2">
        <span className="text-[9px] font-bold uppercase tracking-wide dark:text-white/40 text-gray-500">Farbe</span>
        {EVENT_COLORS.map((c) => (
          <button key={c} onClick={() => setColor(c)}
            className={`w-5 h-5 rounded-full border-2 transition-all cursor-pointer ${color === c ? 'border-gray-900 dark:border-white scale-110' : 'border-transparent'}`}
            style={{ background: c }} />
        ))}
      </div>
      <div className="flex items-center justify-end gap-2 pt-2">
        <button onClick={onCancel} className="px-4 py-2 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 border dark:border-white/10 border-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 cursor-pointer bg-transparent transition-colors">Abbrechen</button>
        <button onClick={handleSave} disabled={!title.trim()} className="px-4 py-2 rounded-lg bg-(--primary) text-white text-xs font-semibold cursor-pointer border-none hover:opacity-90 disabled:opacity-50 transition-opacity">
          {initial?.id ? 'Speichern' : 'Erstellen'}
        </button>
      </div>
    </div>
  );
}

// -- Event Detail Popup ------------------------------------
function EventDetailPopup({ event, onClose, onEdit, onDelete }: {
  event: CalendarEvent;
  onClose: () => void;
  onEdit: (ev: CalendarEvent) => void;
  onDelete: (id: string) => void;
}) {
  const [confirmDelete, setConfirmDelete] = useState(false);
  const sourceLabel = { manual: 'Manuell', ics_import: 'ICS Import', google: 'Google', outlook: 'Outlook' };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 w-full max-w-md mx-4 animate-scale-up"
        onClick={(e) => e.stopPropagation()}>
        {/* Color bar */}
        <div className="h-1 rounded-t-2xl" style={{ background: event.color || '#6366f1' }} />
        <div className="p-5">
          <div className="flex items-start justify-between mb-4">
            <h2 className="text-lg font-black dark:text-white text-gray-900 leading-tight pr-2">{event.title}</h2>
            <div className="flex items-center gap-1 shrink-0">
              <button onClick={() => onEdit(event)} className="p-2 rounded-lg hover:bg-(--primary-light) text-(--primary) transition-all border-none bg-transparent cursor-pointer">
                <Edit3 size={14} />
              </button>
              <button onClick={() => setConfirmDelete(true)} className="p-2 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer">
                <Trash2 size={14} />
              </button>
              <button onClick={onClose} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500 transition-colors">
                <X size={16} />
              </button>
            </div>
          </div>

          <div className="space-y-2.5">
            <div className="flex items-center gap-2 text-sm dark:text-white/70 text-gray-700">
              <CalendarDays size={14} className="text-(--primary) shrink-0" />
              <span className="font-semibold">
                {new Date(event.date).toLocaleDateString('de-DE', { weekday: 'long', day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>
            {(event.startTime || event.endTime) && (
              <div className="flex items-center gap-2 text-sm dark:text-white/60 text-gray-600">
                <Clock size={14} className="text-(--primary) shrink-0" />
                <span>{event.startTime || '�'}{event.endTime ? ` � ${event.endTime}` : ''}</span>
              </div>
            )}
            {event.location && (
              <div className="flex items-center gap-2 text-sm dark:text-white/60 text-gray-600">
                <MapPin size={14} className="text-(--primary) shrink-0" />
                <span>{event.location}</span>
              </div>
            )}
            {event.description && (
              <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2 border dark:border-white/6 border-black/6 text-xs dark:text-white/60 text-gray-600 whitespace-pre-line">
                {event.description}
              </div>
            )}
            {event.source && (
              <div className="text-[10px] dark:text-white/30 text-gray-400">
                Quelle: {sourceLabel[event.source] ?? event.source}
              </div>
            )}
          </div>

          {confirmDelete && (
            <div className="mt-4 p-3 rounded-xl bg-red-500/5 border border-red-500/10 flex items-center gap-3">
              <span className="text-xs text-red-500 flex-1">Termin wirklich l�schen?</span>
              <button onClick={() => { onDelete(event.id); onClose(); }} className="px-3 py-1.5 rounded-lg bg-red-500 text-white text-xs font-bold cursor-pointer border-none hover:bg-red-600 transition-colors">L�schen</button>
              <button onClick={() => setConfirmDelete(false)} className="px-3 py-1.5 rounded-lg bg-transparent text-gray-500 text-xs font-semibold cursor-pointer border dark:border-white/10 border-gray-200 hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Abbrechen</button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// -- Main Calendar Page ------------------------------------
export default function CalendarPage() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingEvent, setEditingEvent] = useState<CalendarEvent | null>(null);
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const [showHowTo, setShowHowTo] = useState(false);
  const [importing, setImporting] = useState(false);
  const [importMsg, setImportMsg] = useState<string | null>(null);
  const [openCalendar, setOpenCalendar] = useState(true);
  const [openUpcoming, setOpenUpcoming] = useState(true);
  const [openStats, setOpenStats] = useState(true);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const calStart = startOfWeek(monthStart, { weekStartsOn: 1 });
  const calEnd = endOfWeek(monthEnd, { weekStartsOn: 1 });
  const days = eachDayOfInterval({ start: calStart, end: calEnd });
  const weekdays = ['Mo', 'Di', 'Mi', 'Do', 'Fr', 'Sa', 'So'];

  const getEventsForDay = useCallback((dateStr: string) =>
    events.filter((e) => e.date === dateStr),
  [events]);

  const handleAddEvent = (ev: CalendarEvent) => {
    setEvents((prev) => {
      const exists = prev.find((e) => e.id === ev.id);
      return exists ? prev.map((e) => e.id === ev.id ? ev : e) : [...prev, ev];
    });
    setShowForm(false);
    setEditingEvent(null);
  };

  const handleDeleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((e) => e.id !== id));
  };

  const handleDayClick = (dateStr: string) => {
    setSelectedDate(dateStr);
    setShowForm(true);
  };

  const handleICSImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImporting(true);
    try {
      const text = await file.text();
      const imported = parseICS(text);
      setEvents((prev) => [...prev, ...imported]);
      setImportMsg(`${imported.length} Termin${imported.length !== 1 ? 'e' : ''} importiert.`);
      setTimeout(() => setImportMsg(null), 3000);
    } catch {
      setImportMsg('Fehler beim Importieren.');
    }
    setImporting(false);
    e.target.value = '';
  };

  const upcomingEvents = useMemo(() => {
    const today = new Date().toISOString().slice(0, 10);
    return events
      .filter((e) => e.date >= today)
      .sort((a, b) => a.date.localeCompare(b.date) || (a.startTime || '').localeCompare(b.startTime || ''))
      .slice(0, 5);
  }, [events]);

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center">
              <CalendarDays size={20} className="text-indigo-500" />
            </div>
            Kalender
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Termine und Meetings im �berblick</p>
        </div>

        <div className="flex items-center gap-2">
          {importMsg && (
            <span className="text-xs text-green-500 font-semibold px-3 py-1.5 bg-green-500/10 rounded-lg">{importMsg}</span>
          )}
          <label className={`flex items-center gap-2 px-3 py-2 rounded-xl border dark:border-white/8 border-black/8 text-xs font-semibold dark:text-white/60 text-gray-600 hover:bg-(--primary-light) hover:text-(--primary) hover:border-[rgba(99,102,241,0.3)] cursor-pointer transition-all ${importing ? 'opacity-50' : ''}`}>
            {importing ? <Loader size={13} className="animate-spin" /> : <Upload size={13} />}
            ICS importieren
            <input type="file" accept=".ics,text/calendar" className="hidden" onChange={handleICSImport} disabled={importing} />
          </label>
          <button onClick={() => setShowHowTo(true)}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border dark:border-white/8 border-black/8 text-xs font-semibold dark:text-white/60 text-gray-600 hover:bg-(--primary-light) hover:text-(--primary) hover:border-[rgba(99,102,241,0.3)] cursor-pointer transition-all bg-transparent">
            <BookOpen size={13} /> Anleitung
          </button>
          <button onClick={() => { setSelectedDate(null); setEditingEvent(null); setShowForm(true); }}
            className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--primary) text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
            <Plus size={14} /> Neuer Termin
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-5">
        {/* Calendar Grid */}
        <div className="lg:col-span-3 card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
          {/* Month Nav */}
          <div className="px-4 py-3 border-b dark:border-white/6 border-black/4 flex items-center justify-between">
            <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-(--primary-light) text-(--primary) transition-all border-none bg-transparent cursor-pointer">
              <ChevronLeft size={16} />
            </button>
            <button
              onClick={() => setOpenCalendar(v => !v)}
              className="flex items-center gap-2 bg-transparent border-none cursor-pointer hover:opacity-70 transition-opacity"
            >
              <h2 className="text-base font-black dark:text-white text-gray-900">
                {format(currentMonth, 'MMMM yyyy', { locale: de })}
              </h2>
              <span className="dark:text-white/30 text-gray-400">
                {openCalendar ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </span>
            </button>
            <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}
              className="p-2 rounded-lg hover:bg-(--primary-light) text-(--primary) transition-all border-none bg-transparent cursor-pointer">
              <ChevronRight size={16} />
            </button>
          </div>

          {openCalendar && (<>
          {/* Weekday header */}
          <div className="grid grid-cols-7 border-b dark:border-white/4 border-black/4">
            {weekdays.map((d) => (
              <div key={d} className="text-center text-[10px] font-bold dark:text-white/30 text-gray-400 py-2 uppercase tracking-wide">{d}</div>
            ))}
          </div>

          {/* Day cells */}
          <div className="grid grid-cols-7">
            {days.map((day) => {
              const dateStr = format(day, 'yyyy-MM-dd');
              const dayEvents = getEventsForDay(dateStr);
              const inMonth = isSameMonth(day, currentMonth);
              const today = isToday(day);

              return (
                <div
                  key={dateStr}
                  onClick={() => inMonth && handleDayClick(dateStr)}
                  className={`min-h-[80px] p-1.5 border-b border-r dark:border-white/3 border-black/3 transition-colors
                    ${inMonth ? 'hover:bg-(--primary-light) cursor-pointer' : 'opacity-30 cursor-default'}
                    ${today ? 'bg-(--primary-light)' : ''}`}
                >
                  <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold mb-1 mx-auto
                    ${today ? 'bg-(--primary) text-white' : 'dark:text-white/50 text-gray-600'}`}>
                    {format(day, 'd')}
                  </div>
                  <div className="space-y-0.5">
                    {dayEvents.slice(0, 3).map((ev) => (
                      <div key={ev.id}
                        onClick={(e) => { e.stopPropagation(); setSelectedEvent(ev); }}
                        className="text-[9px] font-semibold text-white rounded px-1 py-0.5 truncate cursor-pointer hover:opacity-80 transition-opacity"
                        style={{ background: ev.color || '#6366f1' }}>
                        {ev.startTime ? `${ev.startTime} ` : ''}{ev.title}
                      </div>
                    ))}
                    {dayEvents.length > 3 && (
                      <div className="text-[9px] dark:text-white/30 text-gray-400 pl-1">+{dayEvents.length - 3} mehr</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
          </>)}
        </div>

        {/* Sidebar: Upcoming Events */}
        <div className="space-y-4">
          <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
            <button
              onClick={() => setOpenUpcoming(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors ${openUpcoming ? 'border-b dark:border-white/6 border-black/4' : ''}`}
            >
              <h3 className="text-sm font-black dark:text-white text-gray-900">N�chste Termine</h3>
              <span className="dark:text-white/30 text-gray-400">
                {openUpcoming ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>
            {openUpcoming && (
              <div className="p-3 space-y-2">
                {upcomingEvents.length === 0 && (
                  <p className="text-xs dark:text-white/30 text-gray-400 text-center py-6">Keine bevorstehenden Termine</p>
                )}
                {upcomingEvents.map((ev) => (
                  <button key={ev.id} onClick={() => setSelectedEvent(ev)}
                    className="w-full text-left p-2.5 rounded-xl border dark:border-white/5 border-black/4 hover:bg-(--primary-light) transition-all cursor-pointer bg-transparent group relative overflow-hidden">
                    <div className="absolute left-0 top-0 bottom-0 w-0.5" style={{ background: ev.color || '#6366f1' }} />
                    <div className="pl-2">
                      <div className="text-xs font-bold dark:text-white text-gray-900 truncate group-hover:text-(--primary) transition-colors">{ev.title}</div>
                      <div className="text-[10px] dark:text-white/40 text-gray-500 mt-0.5">
                        {new Date(ev.date).toLocaleDateString('de-DE', { day: '2-digit', month: 'short' })}
                        {ev.startTime ? ` � ${ev.startTime}` : ''}
                      </div>
                      {ev.location && <div className="text-[10px] dark:text-white/30 text-gray-400 truncate">{ev.location}</div>}
                    </div>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Stats */}
          <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
            <button
              onClick={() => setOpenStats(v => !v)}
              className={`w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors ${openStats ? 'border-b dark:border-white/6 border-black/4' : ''}`}
            >
              <h3 className="text-xs font-black dark:text-white/40 text-gray-500 uppercase tracking-wide">Statistik</h3>
              <span className="dark:text-white/30 text-gray-400">
                {openStats ? <ChevronUp size={15} /> : <ChevronDown size={15} />}
              </span>
            </button>
            {openStats && (
              <div className="p-4 space-y-2">
                {[
                  { label: 'Termine gesamt', value: events.length },
                  { label: 'Diesen Monat', value: events.filter((e) => e.date.startsWith(format(currentMonth, 'yyyy-MM'))).length },
                  { label: 'Importiert (ICS)', value: events.filter((e) => e.source === 'ics_import').length },
                ].map((s) => (
                  <div key={s.label} className="flex items-center justify-between text-xs">
                    <span className="dark:text-white/40 text-gray-500">{s.label}</span>
                    <span className="font-black text-(--primary)">{s.value}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* New/Edit Termin Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => { setShowForm(false); setEditingEvent(null); }}>
          <div className="bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border dark:border-white/10 border-gray-200 w-full max-w-md mx-4 animate-scale-up"
            onClick={(e) => e.stopPropagation()}>
            <div className="p-5 border-b dark:border-white/10 border-gray-100 flex items-center justify-between">
              <h2 className="text-base font-black dark:text-white text-gray-900">{editingEvent ? 'Termin bearbeiten' : 'Neuer Termin'}</h2>
              <button onClick={() => { setShowForm(false); setEditingEvent(null); }} className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 border-none bg-transparent cursor-pointer dark:text-white/50 text-gray-500 transition-colors"><X size={16} /></button>
            </div>
            <div className="p-5">
              <EventForm
                initial={editingEvent ? editingEvent : (selectedDate ? { date: selectedDate } : undefined)}
                onSave={handleAddEvent}
                onCancel={() => { setShowForm(false); setEditingEvent(null); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Event Detail */}
      {selectedEvent && (
        <EventDetailPopup
          event={selectedEvent}
          onClose={() => setSelectedEvent(null)}
          onEdit={(ev) => { setEditingEvent(ev); setSelectedEvent(null); setShowForm(true); }}
          onDelete={handleDeleteEvent}
        />
      )}

      {/* How-To */}
      {showHowTo && <HowToPopup onClose={() => setShowHowTo(false)} />}
    </div>
  );
}
