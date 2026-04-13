'use client';
import { Settings, Shield, User, ChevronRight } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import Link from 'next/link';

export default function SettingsHubPage() {
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const isAdmin = hasMinRole('admin');

  const sections = [
    {
      title: 'Persönliches Profil',
      description: 'Anzeigename, E-Mail und Account-Status verwalten.',
      href: '/settings/profile',
      icon: User,
      color: 'blue',
    },
    {
      title: 'Administration',
      description: 'Benutzer einladen, System-Konfiguration und App-Optionen.',
      href: '/settings/admin',
      icon: Shield,
      color: 'indigo',
      adminOnly: true,
    },
  ];

  return (
    <div className="p-4 sm:p-6 w-full space-y-12 animate-fade-in">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-xl shadow-blue-500/20 mx-auto mb-6">
          <Settings size={32} className="text-white" />
        </div>
        <h1 className="text-4xl font-black dark:text-white text-gray-900">
          Einstellungen
        </h1>
        <p className="text-gray-500 dark:text-white/40 max-w-sm mx-auto">
          Wähle einen Bereich aus, um deine persönlichen oder systemweiten Einstellungen anzupassen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {sections.map((section) => {
          const isLocked = section.adminOnly && !isAdmin;

          if (isLocked) {
            return (
              <div key={section.title} className="relative group opacity-50 grayscale cursor-not-allowed">
                <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-8 h-full">
                  <div className={`w-12 h-12 rounded-2xl bg-gray-500/10 flex items-center justify-center mb-6`}>
                    <section.icon size={24} className="text-gray-500" />
                  </div>
                  <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-2">{section.title}</h2>
                  <p className="text-sm dark:text-white/40 text-gray-500 mb-6">{section.description}</p>
                  <div className="absolute top-4 right-4 bg-red-500/10 text-red-500 text-[10px] font-bold uppercase tracking-widest px-2 py-1 rounded-md border border-red-500/20">
                    Nur Admin
                  </div>
                </div>
              </div>
            );
          }

          return (
            <Link key={section.title} href={section.href} className="group no-underline block h-full">
              <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-8 h-full hover:border-blue-500/30 hover:shadow-2xl hover:shadow-blue-500/5 transition-all duration-300 relative overflow-hidden">
                <div className={`w-12 h-12 rounded-2xl ${section.color === 'blue' ? 'bg-blue-500/10' : 'bg-indigo-500/10'} flex items-center justify-center mb-6 group-hover:scale-110 transition-transform`}>
                  <section.icon size={24} className={section.color === 'blue' ? 'text-blue-500' : 'text-indigo-500'} />
                </div>
                <h2 className="text-xl font-bold dark:text-white text-gray-900 mb-2">{section.title}</h2>
                <p className="text-sm dark:text-white/40 text-gray-500 mb-6">{section.description}</p>
                <div className="flex items-center gap-2 text-blue-500 font-bold text-xs uppercase tracking-widest">
                  Öffnen <ChevronRight size={14} className="group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          );
        })}
      </div>

      {/* About Box */}
      <div className="pt-12 text-center border-t border-slate-100 dark:border-white/5">
          <div className="text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent mb-1">TeamRadar</div>
          <div className="text-[10px] dark:text-white/20 text-gray-400">Version 1.2.0 • Powered by Supabase</div>
      </div>
    </div>
  );
}
