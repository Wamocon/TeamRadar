'use client';

import { useState, useEffect } from 'react';
import { 
  Settings, 
  Shield, 
  Database, 
  Palette, 
  Users, 
  PlusCircle, 
  Building, 
  Mail, 
  Image as ImageIcon,
  Power,
  Save,
  Loader,
  ChevronRight,
  Layout
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG } from '@/types';
import Link from 'next/link';
import { updateSystemSettingsAction } from '@/lib/actions/settingsActions';

export default function AdminSettingsPage() {
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const systemSettings = useAppStore((s) => s.systemSettings);
  const updateSystemSettings = useAppStore((s) => s.updateSystemSettings);
  const loadSystemSettings = useAppStore((s) => s.loadSystemSettings);
  
  const isAdmin = hasMinRole('admin');

  // Form states
  const [orgName, setOrgName] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    if (!systemSettings) {
      loadSystemSettings();
    } else {
      setOrgName(systemSettings.orgName || '');
      setOrgLogoUrl(systemSettings.orgLogoUrl || '');
      setSupportEmail(systemSettings.supportEmail || '');
      setMaintenanceMode(systemSettings.maintenanceMode || false);
    }
  }, [systemSettings, loadSystemSettings]);

  if (!isAdmin) {
    return (
      <div className="p-6 w-full flex items-center justify-center min-h-[50vh]">
        <div className="text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500">
            <Shield size={32} />
          </div>
          <h2 className="text-xl font-bold dark:text-white">Zugriff verweigert</h2>
          <p className="text-sm dark:text-white/40 text-gray-500 max-w-xs font-medium">
            Diese Seite ist nur für Administratoren zugänglich. Bitte wende dich an deinen IT-Verantwortlichen.
          </p>
          <Link href="/settings" className="inline-flex items-center gap-2 text-blue-500 text-sm font-bold no-underline hover:underline pt-4">
            Zurück zur Übersicht <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);

    const result = await updateSystemSettingsAction({
      orgName,
      orgLogoUrl,
      supportEmail,
      maintenanceMode
    });

    if (result.success) {
      updateSystemSettings({ orgName, orgLogoUrl, supportEmail, maintenanceMode });
      setMsg({ type: 'success', text: 'Systemeinstellungen erfolgreich gespeichert.' });
    } else {
      setMsg({ type: 'error', text: result.error || 'Fehler beim Speichern.' });
    }
    
    setIsSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="p-6 w-full space-y-10 max-w-6xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white text-gray-900 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-xl shadow-indigo-500/20">
              <Shield size={30} className="text-indigo-500" />
            </div>
            Administration
          </h1>
          <p className="text-base dark:text-white/40 text-gray-500 mt-2 font-medium">
            Zentrale Steuerung der TeamRadar Plattform und globales Branding.
          </p>
        </div>

        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold px-8 py-3 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50"
        >
          {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Speichere...' : 'System speichern'}
        </button>
      </div>

      {msg && (
        <div className={`p-4 rounded-xl text-sm font-bold border animate-slide-up ${
          msg.type === 'success' 
          ? 'bg-green-500/10 text-green-500 border-green-500/20' 
          : 'bg-red-500/10 text-red-500 border-red-500/20'
        }`}>
          {msg.text}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Left: Branding & Core Settings */}
        <div className="lg:col-span-8 space-y-8">
          <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-8 space-y-8">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center">
                <Building size={20} className="text-indigo-500" />
              </div>
              <h2 className="text-xl font-black dark:text-white">Organisations-Branding</h2>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-1.5 md:col-span-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Name der Organisation</label>
                <div className="relative">
                  <Building size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                    placeholder="Wamocon TeamRadar"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Logo URL</label>
                <div className="relative">
                  <ImageIcon size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="text"
                    value={orgLogoUrl}
                    onChange={(e) => setOrgLogoUrl(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.1] dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                    placeholder="https://..."
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Support E-Mail</label>
                <div className="relative">
                  <Mail size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="email"
                    value={supportEmail}
                    onChange={(e) => setSupportEmail(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.1] dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-indigo-500 outline-none transition-all"
                    placeholder="support@firma.de"
                  />
                </div>
              </div>
            </div>

            <div className="pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="flex items-center justify-between p-6 rounded-2xl bg-red-500/5 border border-red-500/10">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-red-500/10 flex items-center justify-center">
                    <Power size={24} className="text-red-500" />
                  </div>
                  <div>
                    <div className="text-base font-black text-red-500">Wartungsmodus</div>
                    <div className="text-xs text-red-500/60 font-medium">Deaktiviert den Zugriff für alle Nicht-Admins</div>
                  </div>
                </div>
                <button 
                  onClick={() => setMaintenanceMode(!maintenanceMode)}
                  className={`w-14 h-7 rounded-full transition-all relative ${maintenanceMode ? 'bg-red-500 shadow-lg shadow-red-500/30' : 'bg-slate-300 dark:bg-white/10'}`}
                >
                  <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`} />
                </button>
              </div>
            </div>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
                  <Users size={20} />
                </div>
                <h3 className="text-lg font-black dark:text-white">Benutzerverwaltung</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Verwalte Teammitglieder, bearbeite Rollen und lade neue Personen ein.
              </p>
              <div className="pt-2">
                <Link href="/members" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-blue-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg shadow-blue-500/20">
                  Mitglieder ansehen <ChevronRight size={14} />
                </Link>
              </div>
            </div>

            <div className="card-shimmer rounded-3xl border border-black/[0.06] dark:border-white/[0.06] p-6 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                  <Layout size={20} />
                </div>
                <h3 className="text-lg font-black dark:text-white">Organisation</h3>
              </div>
              <p className="text-xs text-slate-500 font-medium leading-relaxed">
                Strukturieren Sie Teams und definieren Sie Verantwortlichkeiten.
              </p>
              <div className="pt-2">
                <Link href="/teams" className="flex items-center justify-center gap-2 w-full py-3 rounded-xl bg-emerald-500 text-white text-xs font-bold uppercase tracking-widest hover:bg-emerald-600 transition-all shadow-lg shadow-emerald-500/20">
                  Teams verwalten <ChevronRight size={14} />
                </Link>
              </div>
            </div>
          </div>
        </div>

        {/* Right: System Status & Metrics */}
        <div className="lg:col-span-4 space-y-8">
          <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Gesundheit</h3>
            
            <div className="space-y-4">
              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Database size={14} className="text-indigo-500" />
                    <span className="text-xs font-bold dark:text-white">Datenbank</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500/10 text-green-500 tracking-widest">OK</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">Supabase Cloud / PostgreSQL</div>
              </div>

              <div className="p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.05]">
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <Shield size={14} className="text-purple-500" />
                    <span className="text-xs font-bold dark:text-white">Auth-Dienste</span>
                  </div>
                  <span className="px-2 py-0.5 rounded-full text-[9px] font-black bg-green-500/10 text-green-500 tracking-widest">OK</span>
                </div>
                <div className="text-[10px] text-slate-500 font-mono truncate">GoTrue / JWT Verification</div>
              </div>
            </div>

            <div className="space-y-4 pt-4 border-t border-slate-100 dark:border-white/5">
              <h4 className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status Legende</h4>
              <div className="grid grid-cols-2 gap-2">
                {Object.entries(STATUS_CONFIG).slice(0, 4).map(([key, conf]) => (
                  <div key={key} className="flex items-center gap-2 p-2 rounded-lg bg-black/[0.01] dark:bg-white/[0.01]">
                    <div className="w-2 h-2 rounded-full" style={{ background: conf.color }} />
                    <span className="text-[10px] font-bold text-slate-500 uppercase">{conf.label}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Quick Action Box */}
          <div className="rounded-3xl p-6 bg-gradient-to-br from-indigo-600 to-purple-700 text-white shadow-xl">
            <h4 className="font-black text-sm uppercase flex items-center gap-2 mb-2">
              <PlusCircle size={18} />
              Neuer User?
            </h4>
            <p className="text-xs opacity-70 font-medium leading-relaxed mb-4">
              Du kannst neue Teamkollegen direkt zur Plattform einladen. Sie erhalten eine E-Mail zur Registrierung.
            </p>
            <Link href="/members/new" className="flex items-center justify-center py-2 px-4 bg-white text-indigo-600 rounded-xl text-xs font-bold hover:bg-slate-100 transition-colors">
              Jetzt Einladen
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
