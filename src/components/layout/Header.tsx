'use client';
import { useState } from 'react';
import { Menu, LogOut, Plane, Clock } from 'lucide-react';
import { useTheme } from '@/components/ui/ThemeProvider';
import { createClient } from '@/lib/supabase/client';
import { useRouter } from 'next/navigation';
import { AppPortal } from './AppPortal';
import Image from 'next/image';

export function Header({ onMenuToggle }: { onMenuToggle: () => void }) {
  const { theme } = useTheme();
  const router = useRouter();
  const [activeApp, setActiveApp] = useState<{ url: string; title: string; icon: any; color: string } | null>(null);

  const apps = [
    {
      id: 'away',
      title: 'AWAY Urlaubsplaner',
      label: 'AWAY',
      url: process.env.NEXT_PUBLIC_AWAY_URL || 'http://localhost:3001',
      icon: Plane,
      color: 'text-blue-400',
      hoverBg: 'hover:bg-blue-500/10',
    },
    {
      id: 'trace',
      title: 'TRACE Zeiterfassung',
      label: 'TRACE',
      url: process.env.NEXT_PUBLIC_TRACE_URL || 'http://localhost:3002',
      icon: Clock,
      color: 'text-teal-400',
      hoverBg: 'hover:bg-teal-500/10',
    }
  ];

  const handleLogout = async () => {
    try {
      const supabase = createClient();
      await supabase.auth.signOut();
    } catch {
      // Supabase nicht konfiguriert
    }
    router.push('/auth/login');
  };

  return (
    <header
      className="shrink-0 flex items-center justify-between px-4 py-3 border-b"
      style={{
        background: theme === 'dark' ? '#0a0f1a' : '#ffffff',
        borderColor: theme === 'dark' ? 'rgba(255,255,255,0.06)' : 'rgba(0,0,0,0.08)',
      }}
    >
      <div className="flex items-center gap-3">
        {/* Mobile Burger */}
        <button
          onClick={onMenuToggle}
          className="md:hidden text-gray-400 hover:text-white bg-transparent border-none cursor-pointer p-1"
          aria-label="Menü öffnen"
        >
          <Menu size={20} />
        </button>

        {/* Logo */}
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg overflow-hidden flex items-center justify-center relative">
            <Image src="/logo.png" alt="TeamRadar Logo" fill className="object-cover" />
          </div>
          <div>
            <div className="text-sm font-bold tracking-tight dark:text-white text-gray-900">
              Team<span className="text-blue-500">Radar</span>
            </div>
            <div className="text-[9px] tracking-widest uppercase dark:text-white/25 text-gray-400">
              Verfügbarkeit im Blick
            </div>
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {/* App Switcher Buttons */}
        <div className="hidden md:flex items-center gap-1.5 mr-4 px-2 py-1 rounded-xl dark:bg-white/[0.03] bg-black/[0.03] border dark:border-white/[0.05] border-black/[0.05]">
          {apps.map((app) => (
            <button
              key={app.id}
              onClick={() => setActiveApp(app)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-[11px] font-bold tracking-wide transition-all
                dark:text-white/40 dark:hover:text-white/80 ${app.hoverBg}
                text-gray-500 hover:text-gray-900
                bg-transparent border-none cursor-pointer group`}
              title={app.title}
            >
              <app.icon size={13} className={`${app.color} opacity-60 group-hover:opacity-100 transition-opacity`} />
              <span>{app.label}</span>
            </button>
          ))}
        </div>

        <button
          onClick={handleLogout}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-medium transition-all
            dark:text-white/40 dark:hover:text-white/70 dark:hover:bg-white/[0.05]
            text-gray-400 hover:text-gray-700 hover:bg-black/[0.05]
            bg-transparent border-none cursor-pointer"
        >
          <LogOut size={13} />
          <span className="hidden sm:inline">Abmelden</span>
        </button>
      </div>

      {activeApp && (
        <AppPortal
          isOpen={!!activeApp}
          onClose={() => setActiveApp(null)}
          url={activeApp.url}
          title={activeApp.title}
          icon={activeApp.icon}
          iconColor={activeApp.color}
        />
      )}
    </header>
  );
}
