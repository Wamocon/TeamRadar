'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import { 
  User, 
  Shield, 
  Mail, 
  Save, 
  Loader, 
  Phone, 
  MessageSquare, 
  Camera,
  Bell,
  Monitor,
  Moon,
  Sun,
  Laptop
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { updateUserProfileAction } from '@/lib/actions/settingsActions';
import { useTheme } from '@/components/ui/ThemeProvider';

export default function ProfileSettingsPage() {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const { setTheme: setGlobalTheme } = useTheme();
  
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [notifications, setNotifications] = useState(true);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setStatusMessage(userProfile.statusMessage || '');
      setPhone(userProfile.phone || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      if (userProfile.preferences) {
        setTheme(userProfile.preferences.theme || 'system');
        setNotifications(userProfile.preferences.notifications !== false);
      }
    }
  }, [userProfile]);

  const handleSave = async () => {
    setIsSaving(true);
    setMsg(null);

    const result = await updateUserProfileAction({
      displayName,
      statusMessage,
      phone,
      avatarUrl,
      preferences: { theme, notifications }
    });

    if (result.success) {
      if (userProfile) {
        setUserProfile({
          ...userProfile,
          displayName,
          statusMessage,
          phone,
          avatarUrl,
          preferences: { theme, notifications }
        });
      }
      setMsg({ type: 'success', text: 'Profil erfolgreich aktualisiert.' });
    } else {
      setMsg({ type: 'error', text: result.error || 'Fehler beim Speichern.' });
    }
    
    setIsSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  return (
    <div className="p-6 w-full space-y-10 max-w-4xl mx-auto animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h1 className="text-4xl font-black dark:text-white text-gray-900 flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center shadow-xl shadow-blue-500/20">
              <User size={30} className="text-white" />
            </div>
            Mein Profil
          </h1>
          <p className="text-base dark:text-white/40 text-gray-500 mt-2 font-medium">
            Personalisiere dein TeamRadar Erlebnis und verwalte deine Daten.
          </p>
        </div>
        
        <button
          onClick={handleSave}
          disabled={isSaving}
          className="flex items-center gap-2 bg-blue-600 hover:bg-blue-700 text-white font-bold px-6 py-3 rounded-xl transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
        >
          {isSaving ? <Loader size={18} className="animate-spin" /> : <Save size={18} />}
          {isSaving ? 'Speichere...' : 'Änderungen speichern'}
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column: Essential Info & Avatar */}
        <div className="lg:col-span-2 space-y-8">
          {/* Personal Card */}
          <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-8 space-y-8 overflow-hidden relative">
            <div className="flex flex-col sm:flex-row gap-8 items-center sm:items-start relative z-10">
              {/* Avatar Section */}
              <div className="relative group">
                <div className="w-32 h-32 rounded-3xl bg-slate-100 dark:bg-white/5 border-4 border-white dark:border-white/10 shadow-xl overflow-hidden">
                  {avatarUrl ? (
                    <div className="relative w-full h-full">
                      <Image 
                        src={avatarUrl} 
                        alt="Avatar" 
                        fill 
                        className="object-cover" 
                        sizes="128px"
                      />
                    </div>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User size={48} />
                    </div>
                  )}
                </div>
                <button className="absolute -bottom-2 -right-2 p-2 bg-blue-600 text-white rounded-xl shadow-lg opacity-0 group-hover:opacity-100 transition-opacity">
                  <Camera size={16} />
                </button>
              </div>

              <div className="flex-1 w-full space-y-4">
                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Anzeigename</label>
                  <input
                    type="text"
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.1] rounded-xl py-3 px-4 text-base font-bold focus:border-blue-500 outline-none transition-all"
                    placeholder="Dein Name"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Status-Nachricht</label>
                  <div className="relative">
                    <MessageSquare size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      value={statusMessage}
                      onChange={(e) => setStatusMessage(e.target.value)}
                      className="w-full bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-500 outline-none transition-all"
                      placeholder="Was machst du gerade? (z.B. Remote im HomeOffice)"
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pt-6 border-t border-slate-100 dark:border-white/5">
              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">E-Mail</label>
                <div className="flex items-center gap-3 p-3 rounded-xl bg-slate-50 dark:bg-white/[0.02] border border-slate-100 dark:border-white/5 opacity-60">
                  <Mail size={16} className="text-slate-400" />
                  <span className="text-sm font-medium">{userProfile?.email}</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-400">Telefon</label>
                <div className="relative">
                  <Phone size={16} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
                  <input
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border border-black/[0.1] dark:border-white/[0.1] rounded-xl py-3 pl-10 pr-4 text-sm font-medium focus:border-blue-500 outline-none transition-all"
                    placeholder="+49 123 456789"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Preferences Section */}
          <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-8 space-y-6">
            <h3 className="text-lg font-black dark:text-white flex items-center gap-2">
              <Monitor size={20} className="text-blue-500" />
              Erscheinungsbild & System
            </h3>

            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {[
                { id: 'light', label: 'Hell', icon: Sun },
                { id: 'dark', label: 'Dunkel', icon: Moon },
                { id: 'system', label: 'System', icon: Laptop },
              ].map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => {
                    const newTheme = opt.id as any;
                    setTheme(newTheme);
                    setGlobalTheme(newTheme);
                  }}
                  className={`flex flex-col items-center gap-3 p-4 rounded-2xl border-2 transition-all ${
                    theme === opt.id 
                    ? 'border-blue-500 bg-blue-500/10 text-blue-500' 
                    : 'border-transparent bg-slate-50 dark:bg-white/[0.03] text-slate-500 hover:bg-slate-100 dark:hover:bg-white/[0.05]'
                  }`}
                >
                  <opt.icon size={24} />
                  <span className="text-xs font-bold uppercase tracking-widest">{opt.label}</span>
                </button>
              ))}
            </div>

            <div className="flex items-center justify-between p-4 rounded-2xl bg-slate-50 dark:bg-white/[0.03] border border-slate-100 dark:border-white/5">
              <div className="flex items-center gap-4">
                <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center">
                  <Bell size={20} className="text-blue-500" />
                </div>
                <div>
                  <div className="text-sm font-bold dark:text-white">Benachrichtigungen</div>
                  <div className="text-[10px] text-slate-500 font-medium">Informiere mich bei wichtigen Updates</div>
                </div>
              </div>
              <button 
                onClick={() => setNotifications(!notifications)}
                className={`w-12 h-6 rounded-full transition-all relative ${notifications ? 'bg-blue-500' : 'bg-slate-300 dark:bg-white/10'}`}
              >
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-all ${notifications ? 'right-1' : 'left-1'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Right Column: Roles & Security */}
        <div className="space-y-8">
          {/* Identity Card */}
          <div className="card-shimmer rounded-3xl border border-slate-100 dark:border-white/5 p-6 space-y-6">
            <h3 className="text-sm font-black uppercase tracking-widest text-slate-400">System Identität</h3>
            <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-700 text-white shadow-xl">
              <div className="flex items-center justify-between mb-4">
                <Shield size={24} className="opacity-60" />
                <div className="text-[10px] font-black uppercase tracking-widest opacity-60">Aktive Rolle</div>
              </div>
              <div className="text-xl font-black uppercase tracking-tight">{userProfile?.role}</div>
              <div className="text-[10px] font-bold opacity-60 mt-1">Berechtigungsebene 100% verifiziert</div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500 font-bold">Mitglied seit</span>
                <span className="dark:text-white font-medium">{userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString() : 'N/A'}</span>
              </div>
              <div className="flex items-center justify-between text-xs py-2 border-b border-slate-100 dark:border-white/5">
                <span className="text-slate-500 font-bold">Zuletzt online</span>
                <span className="dark:text-white font-medium">Jetzt</span>
              </div>
            </div>
          </div>

          {/* Quick Info Box */}
          <div className="rounded-3xl p-6 bg-amber-500/10 border border-amber-500/20">
            <h4 className="text-amber-500 font-black text-sm uppercase flex items-center gap-2 mb-2">
              <Shield size={16} />
              Hinweis
            </h4>
            <p className="text-xs text-amber-500/80 font-medium leading-relaxed">
              Bitte halte deine Kontaktdaten aktuell, damit deine Teamkollegen dich bei Rückfragen erreichen können.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
