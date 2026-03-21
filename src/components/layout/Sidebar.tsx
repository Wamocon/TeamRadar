'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import {
  LayoutDashboard,
  Users,
  CalendarDays,
  FolderKanban,
  Settings,
  X,
  Sun,
  Moon,
  UserPlus,
} from 'lucide-react';
import { STATUS_CONFIG } from '@/types';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = usePathname();
  const members = useAppStore((s) => s.members);
  const availabilities = useAppStore((s) => s.availabilities);
  const teams = useAppStore((s) => s.teams);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const { theme, setTheme } = useTheme();

  const today = new Date().toISOString().slice(0, 10);
  const availableCount = members.filter((m) => getMemberStatus(m.id, today) === 'available').length;
  const busyCount = members.filter((m) => ['busy', 'meeting'].includes(getMemberStatus(m.id, today))).length;
  const absentCount = members.filter((m) => ['vacation', 'sick'].includes(getMemberStatus(m.id, today))).length;

  const navItems = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/members', icon: Users, label: 'Mitarbeiter', exact: false },
    { href: '/members/new', icon: UserPlus, label: 'Neu anlegen', exact: true },
    { href: '/calendar', icon: CalendarDays, label: 'Kalender', exact: true },
    { href: '/teams', icon: FolderKanban, label: 'Teams', exact: false },
  ];

  return (
    <>
      <div className="flex-1 overflow-y-auto min-h-0">
        {/* Navigation */}
        <nav className="p-3 flex flex-col gap-0.5">
          <div className="text-[9px] font-bold uppercase tracking-widest px-2 pt-3 pb-1.5 text-black/30 dark:text-white/20">
            Navigation
          </div>
          {navItems.map((item) => {
            const active = item.exact
              ? pathname === item.href
              : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onNavigate}
                className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
                  active
                    ? 'bg-blue-500/12 border border-blue-500/20'
                    : 'dark:text-white/45 dark:hover:text-white/80 dark:hover:bg-white/[0.05] text-gray-600 hover:text-gray-900 hover:bg-black/[0.05]'
                }`}
                style={
                  active
                    ? {
                        boxShadow: '0 0 12px rgba(59,130,246,0.08)',
                        color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#374151',
                      }
                    : {}
                }
              >
                <item.icon size={14} className="shrink-0" />
                <span>{item.label}</span>
                {item.href === '/members' && members.length > 0 && (
                  <span className="ml-auto text-[9px] font-bold bg-black/5 dark:bg-white/8 text-gray-400 dark:text-white/35 px-1.5 py-0.5 rounded-full">
                    {members.length}
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Stats */}
        {members.length > 0 && (
          <div
            className="mx-3 mt-1 rounded-xl border p-3"
            style={{ borderColor: 'var(--border)', background: theme === 'dark' ? 'rgba(255,255,255,0.02)' : 'rgba(0,0,0,0.02)' }}
          >
            <div className="text-[9px] font-bold uppercase tracking-widest mb-3 text-black/30 dark:text-white/20">
              Heute
            </div>
            <div className="space-y-2.5">
              {[
                { label: 'Verfügbar', value: availableCount, total: members.length, color: '#22c55e' },
                { label: 'Beschäftigt', value: busyCount, total: members.length, color: '#f59e0b' },
                { label: 'Abwesend', value: absentCount, total: members.length, color: '#8b5cf6' },
              ].map((stat) => (
                <div key={stat.label}>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[10px] dark:text-white/40 text-gray-500">{stat.label}</span>
                    <span className="text-[10px] font-bold" style={{ color: stat.color }}>{stat.value}</span>
                  </div>
                  <div className="h-1 rounded-full bg-black/[0.04] dark:bg-white/[0.04]">
                    <div className="progress-bar h-full rounded-full" style={{ width: `${stat.total > 0 ? (stat.value / stat.total) * 100 : 0}%`, background: stat.color }} />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Teams */}
        {teams.length > 0 && (
          <div className="p-3 mt-2">
            <div className="text-[9px] font-bold uppercase tracking-widest px-2 pb-1.5 flex items-center gap-2 text-black/30 dark:text-white/20">
              <FolderKanban size={10} className="opacity-50" />
              Teams
            </div>
            <div className="flex flex-col gap-0.5">
              {teams.map((t) => {
                const active = pathname === `/teams/${t.id}`;
                return (
                  <Link
                    key={t.id}
                    href={`/teams/${t.id}`}
                    onClick={onNavigate}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg no-underline transition-all group ${
                      active
                        ? 'bg-black/[0.05] dark:bg-white/[0.06]'
                        : 'hover:bg-black/[0.04] dark:hover:bg-white/[0.04]'
                    }`}
                  >
                    <div className="w-1.5 h-1.5 rounded-full shrink-0 bg-blue-500" />
                    <span className="text-[11px] text-gray-400 group-hover:text-gray-600 dark:text-white/40 dark:group-hover:text-white/65 transition-colors truncate">
                      {t.name}
                    </span>
                    <span className="ml-auto text-[10px] font-bold shrink-0 text-blue-500/70">
                      {t.memberIds.length}
                    </span>
                  </Link>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t border-black/[0.05] dark:border-white/[0.04] flex flex-col gap-0.5">
        {/* Theme-Umschalter */}
        <div className="mb-2 p-0.5 rounded-lg bg-black/[0.04] dark:bg-white/[0.04] flex">
          <button
            onClick={() => setTheme('light')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              theme === 'light'
                ? 'bg-white text-blue-500 shadow-sm'
                : 'text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55'
            }`}
          >
            <Sun size={11} />
            <span>Hell</span>
          </button>
          <button
            onClick={() => setTheme('dark')}
            className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-md text-[11px] font-semibold transition-all ${
              theme === 'dark'
                ? 'bg-white/[0.12] text-blue-500'
                : 'text-gray-400 hover:text-gray-600 dark:text-white/30 dark:hover:text-white/55'
            }`}
          >
            <Moon size={11} />
            <span>Dunkel</span>
          </button>
        </div>

        <Link
          href="/settings"
          onClick={onNavigate}
          className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm font-medium no-underline transition-all duration-150 ${
            pathname === '/settings'
              ? 'bg-blue-500/12 border border-blue-500/20'
              : 'text-gray-600 hover:text-gray-900 hover:bg-black/[0.05] dark:text-white/45 dark:hover:text-white/80 dark:hover:bg-white/[0.05]'
          }`}
          style={
            pathname === '/settings'
              ? { boxShadow: '0 0 12px rgba(59,130,246,0.08)', color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#374151' }
              : {}
          }
        >
          <Settings size={14} className="shrink-0" />
          <span>Einstellungen</span>
        </Link>
      </div>
    </>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  const { theme } = useTheme();

  return (
    <>
      {/* Desktop */}
      <aside
        className="hidden md:flex flex-col w-56 shrink-0 border-r sidebar-scroll"
        style={{
          background: theme === 'dark' ? 'rgba(8,10,20,0.9)' : 'rgba(248,250,252,0.95)',
          borderColor: 'var(--border)',
          backdropFilter: 'blur(12px)',
        }}>
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <>
          <div className="fixed inset-0 bg-black/60 z-40 md:hidden" onClick={onClose} />
          <aside
            className="fixed inset-y-0 left-0 z-50 flex flex-col w-72 md:hidden"
            style={{
              background: theme === 'dark' ? 'rgba(8,10,20,0.98)' : '#ffffff',
              backdropFilter: 'blur(16px)',
            }}>
            <div className="flex items-center justify-between px-4 py-3 border-b border-black/[0.07] dark:border-white/[0.06] shrink-0">
              <span className="text-[9px] font-bold text-black/30 dark:text-white/30 uppercase tracking-widest">
                Navigation
              </span>
              <button
                onClick={onClose}
                className="text-gray-400 hover:text-gray-700 dark:text-white/40 dark:hover:text-white bg-transparent border-none cursor-pointer p-1 rounded transition-colors"
                aria-label="Menü schließen"
              >
                <X size={18} />
              </button>
            </div>
            <SidebarContent onNavigate={onClose} />
          </aside>
        </>
      )}
    </>
  );
}
