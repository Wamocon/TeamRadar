'use client';
import { Settings, Shield, User, Database, Palette, ListChecks } from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { USER_ROLE_HIERARCHY, type UserRole, STATUS_CONFIG } from '@/types';

export default function SettingsPage() {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const hasMinRole = useAppStore((s) => s.hasMinRole);

  const isAdmin = hasMinRole('admin');
  const isCioOrLead = hasMinRole('cio') || hasMinRole('department_lead');

  const currentRole = userProfile?.role || 'employee';

  return (
    <div className="p-6 w-full space-y-8 max-w-5xl mx-auto animate-fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg shadow-blue-500/20">
              <Settings size={24} className="text-white" />
            </div>
            Einstellungen
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
            Personalisierung und System-Konfiguration
          </p>
        </div>
        
        {/* Role Switcher (Lokaler Dev-Modus) */}
        {process.env.NODE_ENV !== 'production' && process.env.NEXT_PUBLIC_DB_SCHEMA === 'public' && (
          <div className="flex items-center gap-2 p-1.5 rounded-xl bg-black/[0.03] dark:bg-white/[0.03] border border-black/[0.06] dark:border-white/[0.06]">
            <span className="text-[10px] font-bold uppercase tracking-widest dark:text-white/30 text-gray-400 px-2">Dev: Role Switch</span>
            {(Object.keys(USER_ROLE_HIERARCHY) as UserRole[]).map((r) => (
              <button
                key={r}
                onClick={() => setUserProfile(userProfile ? { ...userProfile, role: r } : null)}
                className={`px-3 py-1 rounded-lg text-[10px] font-bold transition-all border-none cursor-pointer ${
                  currentRole === r 
                    ? 'bg-blue-500 text-white shadow-md' 
                    : 'dark:text-white/30 text-gray-400 hover:bg-black/5 dark:hover:bg-white/5'
                }`}
              >
                {r.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Profile Section (Visible to all) */}
        <div className="card-shimmer rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-blue-500/10 flex items-center justify-center">
              <User size={16} className="text-blue-500" />
            </div>
            <h2 className="text-base font-bold dark:text-white text-gray-900">Mein Profil</h2>
          </div>
          <div className="space-y-3">
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-widest dark:text-white/20 text-gray-400 mb-1">Name</div>
              <div className="text-sm dark:text-white/80 text-gray-700 font-medium">{userProfile?.displayName || 'Gast'}</div>
            </div>
            <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
              <div className="text-[10px] font-bold uppercase tracking-widest dark:text-white/20 text-gray-400 mb-1">Rolle</div>
              <div className="flex items-center gap-2">
                <Shield size={12} className="text-blue-400" />
                <span className="text-sm font-bold text-blue-500">{currentRole.replace('_', ' ').toUpperCase()}</span>
              </div>
            </div>
          </div>
        </div>

        {/* System Settings (Admin Only) */}
        {isAdmin && (
          <div className="card-shimmer rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-indigo-500/10 flex items-center justify-center">
                <Database size={16} className="text-indigo-500" />
              </div>
              <h2 className="text-base font-bold dark:text-white text-gray-900">System-Datenbank</h2>
            </div>
            <p className="text-xs dark:text-white/40 text-gray-500 leading-relaxed">
              Die Cloud-Synchronisation wird über Umgebungsvariablen gesteuert.
            </p>
            <div className="rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-4 bg-black/[0.01] dark:bg-white/[0.01]">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs font-semibold dark:text-white/50 text-gray-600">Supabase Cloud</span>
                <span className={`px-2 py-0.5 rounded-full text-[9px] font-bold ${
                  process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-500/10 text-green-500' : 'bg-gray-400/10 text-gray-500'
                }`}>
                  {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'VERBUNDEN' : 'LOKALER MODUS'}
                </span>
              </div>
              <div className="text-[10px] dark:text-white/20 text-gray-400 font-mono truncate">
                {process.env.NEXT_PUBLIC_SUPABASE_URL || 'Keine URL konfiguriert'}
              </div>
            </div>
          </div>
        )}

        {/* Availability Types (Admin & Lead) */}
        {(isAdmin || isCioOrLead) && (
          <div className="card-shimmer rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center">
                <Palette size={16} className="text-emerald-500" />
              </div>
              <h2 className="text-base font-bold dark:text-white text-gray-900">Anwesenheits-Typen</h2>
            </div>
            <div className="grid grid-cols-2 gap-2">
              {Object.entries(STATUS_CONFIG).map(([key, conf]) => (
                <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.04] dark:border-white/[0.04]">
                  <div className="w-2.5 h-2.5 rounded-full shadow-sm" style={{ background: conf.color }} />
                  <span className="text-[11px] font-medium dark:text-white/70 text-gray-700">{conf.label}</span>
                </div>
              ))}
            </div>
            {isAdmin && (
              <button className="w-full mt-2 py-2 rounded-lg bg-emerald-500/10 text-emerald-500 text-[10px] font-bold uppercase tracking-widest hover:bg-emerald-500/20 transition-all border-none cursor-pointer">
                Status-Optionen bearbeiten
              </button>
            )}
          </div>
        )}

        {/* Global Configuration (Only Admin) */}
        {isAdmin && (
          <div className="card-shimmer rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <ListChecks size={16} className="text-purple-500" />
              </div>
              <h2 className="text-base font-bold dark:text-white text-gray-900">App-Optionen</h2>
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer group transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" defaultChecked />
                <div className="flex-1">
                  <div className="text-sm font-semibold dark:text-white/80 text-gray-700">Wochenenden ausblenden</div>
                  <div className="text-[10px] dark:text-white/30 text-gray-400">Verbirgt Samstage/Sonntage in der Übersicht</div>
                </div>
              </label>
              <label className="flex items-center gap-3 p-3 rounded-xl hover:bg-black/[0.02] dark:hover:bg-white/[0.02] cursor-pointer group transition-colors">
                <input type="checkbox" className="w-4 h-4 rounded border-gray-300 text-blue-500 focus:ring-blue-500" defaultChecked />
                <div className="flex-1">
                  <div className="text-sm font-semibold dark:text-white/80 text-gray-700">Abteilungs-Trennung</div>
                  <div className="text-[10px] dark:text-white/30 text-gray-400">Automatische Gruppierung nach Abteilung</div>
                </div>
              </label>
            </div>
          </div>
        )}

        {/* About (Visible to all) */}
        <div className="col-span-1 md:col-span-2 card-shimmer rounded-2xl border border-black/[0.06] dark:border-white/[0.06] p-6 flex flex-col items-center text-center space-y-2">
          <div className="text-xl font-black bg-gradient-to-r from-blue-500 to-indigo-600 bg-clip-text text-transparent">TeamRadar</div>
          <p className="text-xs dark:text-white/40 text-gray-500 max-w-lg">
            Die Software zum Überblick deines Teams. Einfach, schnell und intuitiv.
          </p>
          <div className="flex items-center gap-4 text-[10px] dark:text-white/20 text-gray-400 mt-2">
            <span>Version 1.2.0-Alpha</span>
            <span>Support: support@wamocon.de</span>
          </div>
        </div>
      </div>
    </div>
  );
}
