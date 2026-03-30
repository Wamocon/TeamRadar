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
  Users,
  CalendarDays,
  FolderKanban,
  Briefcase,
  Settings,
  X,
  Sun,
  Moon,
  UserPlus,
  BarChart3,
  AlertTriangle,
  FileDown,
  CalendarRange,
  ChevronDown,
  ChevronRight,
  Shield,
  Plane,
  Clock,
  LogOut,
  Building,
  Menu
} from 'lucide-react';

import { STATUS_CONFIG, PROJECT_TYPE_CONFIG } from '@/types';
import { AppPortal } from './AppPortal';

function SidebarContent({ onNavigate }: { onNavigate?: () => void }) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const pathname = usePathname();
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  
  const members = useAppStore((s) => s.members);
  const teams = useAppStore((s) => s.teams);
  const projects = useAppStore((s) => s.projects);
  const getMemberStatus = useAppStore((s) => s.getMemberStatus);
  const getAlerts = useAppStore((s) => s.getAlerts);
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);

  const [isTodayOpen, setIsTodayOpen] = useState(false);
  const [isProjectsOpen, setIsProjectsOpen] = useState(false);
  const [activePortal, setActivePortal] = useState<{ url: string; title: string; icon: any; color: string } | null>(null);

  const alertCount = getAlerts().filter((a) => a.severity === 'error').length;

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase nicht konfiguriert
    }
    router.push('/auth/login');
  };

  const apps = [
    { id: 'away', title: 'AWAY Urlaubsplaner', label: 'AWAY', url: process.env.NEXT_PUBLIC_AWAY_URL || 'http://localhost:3001', icon: Plane, color: 'text-blue-400' },
    { id: 'trace', title: 'TRACE Zeiterfassung', label: 'TRACE', url: process.env.NEXT_PUBLIC_TRACE_URL || 'http://localhost:3002', icon: Clock, color: 'text-teal-400' }
  ];

  const mainNav = [
    { href: '/', icon: LayoutDashboard, label: 'Dashboard', exact: true },
    { href: '/members', icon: Users, label: 'Mitarbeiter', exact: false },
    { href: '/calendar', icon: CalendarDays, label: 'Kalender', exact: true },
    { href: '/teams', icon: FolderKanban, label: 'Teams', exact: false },
    { href: '/projects', icon: Briefcase, label: 'Projekte', exact: false },
    { href: '/utilization', icon: BarChart3, label: 'Auslastung', exact: true },
    { href: '/year', icon: CalendarRange, label: 'Jahresübersicht', exact: true },
    { href: '/alerts', icon: AlertTriangle, label: 'Alerts', exact: true, badge: mounted && alertCount > 0 ? alertCount : undefined },
    { href: '/reports', icon: FileDown, label: 'Reports', exact: true },
  ];

  const adminNav = [
    { href: '/members/new', icon: UserPlus, label: 'Mitarbeiter einladen', exact: true },
    { href: '/settings/admin', icon: Shield, label: 'Administration', exact: true },
  ];

  return (
    <div className="flex flex-col h-full bg-[var(--sidebar-bg)] text-[var(--sidebar-text-muted)] transition-colors duration-300">
      {/* 1. Header & Organization */}
      <div className="p-6 pb-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-600/20">
            <LayoutDashboard size={20} />
          </div>
          <div>
            <div className="text-sm font-black text-[var(--sidebar-text)] tracking-tight">TeamRadar</div>
            <div className="text-[10px] font-bold text-[var(--sidebar-text-muted)] opacity-60 uppercase tracking-widest">Verfügbarkeit</div>
          </div>
        </div>

        {/* Org Box */}
        <div className="p-3 rounded-2xl bg-[var(--bg-ghost)] border border-[var(--sidebar-border)] flex items-center justify-between mb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center text-indigo-500">
              <Building size={16} />
            </div>
            <div className="text-[11px] font-bold text-[var(--sidebar-text)] opacity-90">WAMOCON GmbH</div>
          </div>
          {hasMinRole('admin') && (
            <div className="px-2 py-0.5 rounded-md bg-red-500/10 text-red-500 text-[9px] font-black uppercase tracking-widest">
              Admin
            </div>
          )}
        </div>

        {/* App Switcher */}
        <div className="grid grid-cols-2 gap-2 mb-6">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActivePortal(app)}
              className="flex items-center gap-2 px-3 py-2 rounded-xl bg-[var(--bg-ghost)] border border-[var(--sidebar-border)] hover:bg-blue-500/5 hover:border-blue-500/20 transition-all text-[10px] font-bold text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)]"
            >
              <app.icon size={12} className={app.color} />
              {app.label}
            </button>
          ))}
        </div>
      </div>

      {/* 2. Navigation Section */}
      <div className="flex-1 overflow-y-auto px-4 pb-8 sidebar-scroll">
        <div className="space-y-6">
          {/* Main Nav */}
          <div>
            <div className="text-[9px] font-black uppercase tracking-[0.2em] px-3 mb-3 text-[var(--sidebar-text-muted)] opacity-40">Navigation</div>
            <div className="flex flex-col gap-1">
              {mainNav.map((item) => {
                const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                      active 
                        ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20 shadow-sm' 
                        : 'hover:bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] border border-transparent'
                    }`}
                  >
                    <item.icon size={15} className={active ? 'text-blue-500' : 'opacity-50'} />
                    {item.label}
                    {item.badge && <span className="ml-auto text-[9px] bg-red-500 text-white px-1.5 py-0.5 rounded-full">{item.badge}</span>}
                  </Link>
                );
              })}
            </div>
          </div>

          {/* Admin Nav */}
          {hasMinRole('admin') && (
            <div>
              <div className="text-[9px] font-black uppercase tracking-[0.2em] px-3 mb-3 text-[var(--sidebar-text-muted)] opacity-40">Administration</div>
              <div className="flex flex-col gap-1">
                {adminNav.map((item) => {
                  const active = item.exact ? pathname === item.href : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={onNavigate}
                      className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-bold transition-all no-underline ${
                        active 
                          ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' 
                          : 'hover:bg-[var(--sidebar-item-hover)] text-[var(--sidebar-text-muted)] hover:text-[var(--sidebar-text)] border border-transparent'
                      }`}
                    >
                      <item.icon size={15} className={active ? 'text-purple-500' : 'opacity-50'} />
                      {item.label}
                    </Link>
                  );
                })}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* 3. Footer Section (User & Config) */}
      <div className="p-4 bg-[var(--bg-ghost)] border-t border-[var(--sidebar-border)]">
        {/* Dev Tools (only dev) */}
        {process.env.NODE_ENV !== 'production' && (
          <div className="mb-4 space-y-2">
            <div className="flex items-center gap-1.5 p-1 rounded-xl bg-[var(--bg-ghost)] border border-[var(--sidebar-border)]">
              <button onClick={() => setTheme('light')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all border-none cursor-pointer ${theme === 'light' ? 'bg-white shadow-sm text-blue-600' : 'text-[var(--sidebar-text-muted)]'}`}><Sun size={12} /></button>
              <button onClick={() => setTheme('dark')} className={`flex-1 flex items-center justify-center py-1.5 rounded-lg transition-all border-none cursor-pointer ${theme === 'dark' ? 'bg-[#1a2236] text-white shadow-lg' : 'text-[var(--sidebar-text-muted)]'}`}><Moon size={12} /></button>
            </div>
            
            <div className="grid grid-cols-2 gap-1 px-1">
               {['admin', 'employee'].map(r => (
                 <button key={r} onClick={() => userProfile && setUserProfile({...userProfile, role: r as any})} className={`text-[9px] font-bold py-1 rounded border-none cursor-pointer ${userProfile?.role === r ? 'text-blue-500 bg-blue-500/10' : 'text-slate-600'}`}>
                   Dev: {r.toUpperCase()}
                 </button>
               ))}
            </div>
          </div>
        )}

        {/* User Profile Bar */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 border border-blue-500/20 flex items-center justify-center overflow-hidden">
            {userProfile?.avatarUrl ? (
              <div className="relative w-full h-full">
                <Image 
                  src={userProfile.avatarUrl} 
                  alt="User Avatar" 
                  fill 
                  className="object-cover" 
                  sizes="40px"
                />
              </div>
            ) : (
              <div className="text-blue-500 font-black text-xs">
                {userProfile?.displayName?.charAt(0) || userProfile?.email?.charAt(0)}
              </div>
            )}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-[11px] font-black text-[var(--sidebar-text)] truncate">{userProfile?.displayName || 'User'}</div>
            <div className="text-[9px] font-medium text-[var(--sidebar-text-muted)] flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-green-500" />
              Angemeldet
            </div>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/settings" className="p-2 rounded-lg hover:bg-blue-500/10 text-[var(--sidebar-text-muted)] hover:text-blue-500 transition-all">
              <Settings size={16} />
            </Link>
            <button onClick={handleLogout} className="p-2 rounded-lg hover:bg-red-500/10 text-[var(--sidebar-text-muted)] hover:text-red-500 transition-all bg-transparent border-none cursor-pointer">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </div>

      {activePortal && (
        <AppPortal
          isOpen={!!activePortal}
          onClose={() => setActivePortal(null)}
          url={activePortal.url}
          title={activePortal.title}
          icon={activePortal.icon}
          iconColor={activePortal.color}
        />
      )}
    </div>
  );
}

export function Sidebar({ isOpen, onClose }: { isOpen?: boolean; onClose?: () => void }) {
  return (
    <>
      {/* Desktop */}
      <aside className="hidden md:flex flex-col w-64 border-r border-[var(--sidebar-border)] h-screen">
        <SidebarContent />
      </aside>

      {/* Mobile Overlay */}
      {isOpen && (
        <div className="fixed inset-0 z-50 md:hidden flex">
          <div className="absolute inset-0 bg-slate-900/60 backdrop-blur-sm" onClick={onClose} />
          <aside className="relative flex flex-col w-72 h-full shadow-2xl animate-slide-right">
            <SidebarContent onNavigate={onClose} />
          </aside>
        </div>
      )}
    </>
  );
}
