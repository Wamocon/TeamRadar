'use client';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { usePathname, useRouter } from 'next/navigation';
import { useAppStore } from '@/stores/appStore';
import { useTheme } from '@/components/ui/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import {
  LayoutDashboard,
  CalendarDays,
  FolderKanban,
  Briefcase,
  Settings,
  Sun,
  Moon,
  UserPlus,
  BarChart3,
  FileDown,
  CalendarRange,
  Shield,
  Plane,
  Clock,
  LogOut,
  Building2,
  X,
  BookOpen,
  User,
  GraduationCap,
  MessageSquare,
} from 'lucide-react';

import { AppPortal } from './AppPortal';

interface NavItem {
  href: string;
  icon: React.ElementType;
  label: string;
  exact?: boolean;
  badge?: number;
  activeColor?: string; // Override für aktive Farbe
}

function SidebarContent({
  onNavigate,
  isMobile,
}: {
  onNavigate?: () => void;
  isMobile?: boolean;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  const getAlerts = useAppStore((s) => s.getAlerts);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const [activePortal, setActivePortal] = useState<{
    url: string;
    title: string;
    icon: React.ElementType;
    color: string;
  } | null>(null);

  const [isElevatedMode, setIsElevatedMode] = useState(true);
  useEffect(() => {
    const saved = localStorage.getItem('tr-role-mode');
    if (saved === 'employee') setIsElevatedMode(false);
  }, []);

  // toggleMode wird vom Dual-Role-Switcher direkt inline aufgerufen (kein separates toggleMode mehr)

  const [orgName, setOrgName] = useState('TeamRadar');
  useEffect(() => {
    const load = async () => {
      try {
        const supabase = createClient();
        const { data } = await supabase.from('system_settings').select('org_name').eq('id', 'global').single();
        if (data?.org_name) setOrgName(data.org_name);
      } catch { /* Fallback */ }
    };
    load();
  }, []);

  const alertCount = mounted ? getAlerts().filter((a) => a.severity === 'error').length : 0;

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch { /* ignore */ }
    router.push('/auth/login');
  };

  const apps = [
    { id: 'away', title: 'AWAY Urlaubsplaner', label: 'AWAY', url: process.env.NEXT_PUBLIC_AWAY_URL || 'http://localhost:3001', icon: Plane, color: 'text-indigo-400' },
    { id: 'trace', title: 'TRACE Zeiterfassung', label: 'TRACE', url: process.env.NEXT_PUBLIC_TRACE_URL || 'http://localhost:3002', icon: Clock, color: 'text-violet-400' },
  ];

  const mainNav: NavItem[] = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/members', icon: BookOpen, label: 'WamoBook', exact: false },
    { href: '/year', icon: CalendarRange, label: 'Jahres\u00fcbersicht', exact: true },
    { href: '/projects', icon: Briefcase, label: 'Projekte', exact: false },
    { href: '/training', icon: GraduationCap, label: 'Ausbildung', exact: false },
    { href: '/chat', icon: MessageSquare, label: 'Chat', exact: false },
    { href: '/calendar', icon: CalendarDays, label: 'Kalender', exact: true },
  ];

  const privilegedNav: NavItem[] = [
    { href: '/members?action=invite', icon: UserPlus, label: 'Mitglied einladen', exact: false, activeColor: 'bg-blue-500/10 text-blue-500' },
    { href: '/utilization', icon: BarChart3, label: 'Auslastung', exact: true, badge: mounted && alertCount > 0 ? alertCount : undefined, activeColor: 'bg-purple-500/10 text-purple-500' },
    { href: '/reports', icon: FileDown, label: 'Reports', exact: true },
  ];

  const adminNav: NavItem[] = [
    { href: '/settings/admin', icon: Shield, label: 'Administration', exact: true },
  ];

  const isActive = (href: string, exact?: boolean) =>
    exact ? pathname === href : pathname.startsWith(href.split('?')[0]);

  const showPrivileged = isElevatedMode && hasMinRole('department_lead');
  const showAdmin = isElevatedMode && hasMinRole('admin');

  const NavLink = ({ item }: { item: NavItem }) => {
    const active = isActive(item.href, item.exact);
    const activeClass = item.activeColor ?? 'bg-[var(--primary-light)] border-[rgba(99,102,241,0.2)]';
    return (
      <Link
        href={item.href}
        onClick={onNavigate}
        className={`flex items-center gap-2.5 px-3 py-2 rounded-xl text-sm font-medium no-underline transition-all duration-150 group ${
          active
            ? `${activeClass} border`
            : 'text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] hover:bg-[var(--sidebar-item-hover)] border border-transparent'
        }`}
        style={active && !item.activeColor ? { color: theme === 'dark' ? 'rgba(255,255,255,0.9)' : '#374151' } : {}}
      >
        <item.icon size={15} className={`shrink-0 transition-colors ${active ? 'text-[var(--primary)]' : 'opacity-50 group-hover:opacity-80'}`} />
        <span className="flex-1">{item.label}</span>
        {item.badge !== undefined && item.badge > 0 && (
          <span className="text-[10px] font-bold bg-[var(--warning)] text-white px-1.5 py-0.5 rounded-full min-w-[18px] text-center">
            {item.badge}
          </span>
        )}
        {active && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] shrink-0" />}
      </Link>
    );
  };

  const SectionLabel = ({ label }: { label: string }) => (
    <div className="text-[9px] font-black uppercase tracking-[0.18em] px-3 mb-2 text-[var(--sidebar-text-muted)] opacity-40">
      {label}
    </div>
  );

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] text-[var(--sidebar-text-muted)] transition-colors duration-300" style={{ borderRight: '1px solid var(--sidebar-border)' }}>

      {/* Header */}
      <div className="shrink-0 flex items-center justify-between px-4 py-4 border-b" style={{ borderColor: 'var(--sidebar-border)' }}>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#6366f1] to-[#8b5cf6] flex items-center justify-center shadow-lg">
            <LayoutDashboard size={15} className="text-white" />
          </div>
          <div>
            <div className="text-sm font-black tracking-tight text-[var(--sidebar-text)]">
              <span className="text-[var(--primary)]">Team</span>Radar
            </div>
            <div className="text-[9px] uppercase tracking-widest text-[var(--sidebar-text-muted)] opacity-60">Verfügbarkeit</div>
          </div>
        </div>
        {isMobile && (
          <button onClick={onNavigate} className="p-1.5 rounded-lg hover:bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text-muted)] transition-all border-none bg-transparent cursor-pointer" aria-label="Menü schließen">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Org Box */}
      <div className="shrink-0 mx-3 mt-3">
        <div className="flex items-center gap-2.5 px-3 py-2.5 rounded-xl border" style={{ background: 'var(--bg-elevated, rgba(255,255,255,0.03))', borderColor: 'var(--sidebar-border)' }}>
          <div className="w-7 h-7 rounded-lg bg-[var(--primary-light)] flex items-center justify-center shrink-0">
            <Building2 size={13} className="text-[var(--primary)]" />
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-[var(--sidebar-text)] truncate">{orgName}</div>
            {mounted && hasMinRole('department_lead') && (
              <div className="text-[9px] text-[var(--primary)] font-semibold capitalize">
                {isElevatedMode ? (userProfile?.role || 'admin') : 'employee'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Dual-Role-Switcher: nur für privilegierte User (department_lead+) */}
      {mounted && hasMinRole('department_lead') && (
        <div className="shrink-0 mx-3 mt-2">
          <div className="flex gap-1 p-1 rounded-xl" style={{ background: 'var(--sidebar-item-hover)' }}>
            <button
              onClick={() => { setIsElevatedMode(true); localStorage.setItem('tr-role-mode', 'elevated'); window.dispatchEvent(new CustomEvent('tr-role-mode-change', { detail: { elevated: true } })); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                isElevatedMode
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--sidebar-text-muted)] bg-transparent hover:bg-[var(--sidebar-item-hover)]'
              }`}
              title={`Als ${userProfile?.role} arbeiten`}
            >
              <Shield size={10} />
              {userProfile?.role === 'admin' || userProfile?.role === 'super_admin' ? 'Admin' : userProfile?.role === 'cio' ? 'CIO' : 'Lead'}
            </button>
            <button
              onClick={() => { setIsElevatedMode(false); localStorage.setItem('tr-role-mode', 'employee'); window.dispatchEvent(new CustomEvent('tr-role-mode-change', { detail: { elevated: false } })); }}
              className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                !isElevatedMode
                  ? 'bg-[var(--primary)] text-white shadow-sm'
                  : 'text-[var(--sidebar-text-muted)] bg-transparent hover:bg-[var(--sidebar-item-hover)]'
              }`}
              title="Als normaler Mitarbeiter arbeiten"
            >
              <User size={10} />
              Mitarbeiter
            </button>
          </div>
        </div>
      )}

      {/* App Switcher */}
      <div className="shrink-0 grid grid-cols-2 gap-1.5 mx-3 mt-3">
        {apps.map((app) => (
          <button key={app.id} onClick={() => setActivePortal(app)} className="flex items-center gap-2 px-2.5 py-2 rounded-xl border transition-all text-[10px] font-semibold cursor-pointer bg-transparent hover:border-[rgba(99,102,241,0.3)] hover:bg-[var(--primary-light)]" style={{ borderColor: 'var(--sidebar-border)', color: 'var(--sidebar-text-muted)' }}>
            <app.icon size={12} className={app.color} />
            {app.label}
          </button>
        ))}
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 sidebar-scroll space-y-4">
        <div>
          <SectionLabel label="Hauptmenü" />
          <div className="flex flex-col gap-0.5">
            {mainNav.map((item) => <NavLink key={item.href} item={item} />)}
          </div>
        </div>
        {showPrivileged && (
          <div>
            <SectionLabel label="Analyse" />
            <div className="flex flex-col gap-0.5">
              {privilegedNav.map((item) => <NavLink key={item.href} item={item} />)}
            </div>
          </div>
        )}
        {showAdmin && (
          <div>
            <SectionLabel label="Administration" />
            <div className="flex flex-col gap-0.5">
              {adminNav.map((item) => <NavLink key={item.href} item={item} />)}
            </div>
          </div>
        )}
      </nav>

      {/* Footer */}
      <div className="shrink-0 p-3 border-t space-y-3" style={{ borderColor: 'var(--sidebar-border)', background: 'var(--bg-elevated, rgba(255,255,255,0.02))' }}>
        <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ borderColor: 'var(--sidebar-border)' }}>
          <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all border-none cursor-pointer ${theme === 'light' ? 'bg-white shadow-sm text-[var(--primary)]' : 'text-[var(--sidebar-text-muted)]'}`}><Sun size={12} /></button>
          <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all border-none cursor-pointer ${theme === 'dark' ? 'bg-[#1a2236] text-white shadow-lg' : 'text-[var(--sidebar-text-muted)]'}`}><Moon size={12} /></button>
        </div>
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl flex items-center justify-center overflow-hidden shrink-0 border" style={{ background: 'var(--primary-light)', borderColor: 'rgba(99,102,241,0.2)' }}>
            {userProfile?.avatarUrl ? (
              <div className="relative w-full h-full">
                <Image src={userProfile.avatarUrl} alt="User Avatar" fill className="object-cover" sizes="32px" />
              </div>
            ) : (
              <span className="text-[var(--primary)] font-black text-xs">
                {userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0) || '?'}
              </span>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-bold text-[var(--sidebar-text)] truncate">{userProfile?.displayName || userProfile?.email || 'Nutzer'}</div>
            <div className="text-[9px] text-[var(--sidebar-text-muted)] flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500 inline-block" />Online
            </div>
          </div>
          <div className="flex items-center gap-0.5 shrink-0">
            <Link href="/settings" onClick={onNavigate} className="p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--sidebar-text-muted)] hover:text-[var(--primary)] transition-all no-underline">
              <Settings size={14} />
            </Link>
            <button onClick={handleLogout} className="p-1.5 rounded-lg hover:bg-red-500/10 text-[var(--sidebar-text-muted)] hover:text-red-500 transition-all border-none bg-transparent cursor-pointer">
              <LogOut size={14} />
            </button>
          </div>
        </div>
      </div>

      {activePortal && (
        <AppPortal isOpen={!!activePortal} onClose={() => setActivePortal(null)} url={activePortal.url} title={activePortal.title} icon={activePortal.icon} iconColor={activePortal.color} />
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      <aside className="hidden md:flex flex-col w-64 h-screen shrink-0">
        <SidebarContent />
      </aside>
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative flex flex-col w-72 h-full shadow-2xl animate-fade-in">
            <SidebarContent onNavigate={onClose} isMobile />
          </aside>
        </div>
      )}
    </>
  );
}
