'use client';

import { useState, useEffect } from 'react';
import Image from 'next/image';
import {
  User, Shield, Mail, Save, Loader, Phone, MessageSquare, Camera, Bell,
  Monitor, Moon, Sun, Laptop, Lock, Key, Eye, EyeOff, Fingerprint,
  Download, Trash2, AlertTriangle, CheckCircle, Globe, MapPin, Briefcase,
  Building2, Calendar, Activity, Settings2, ChevronRight, Info,
  BellOff, BellRing, Hash, Chrome,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { updateUserProfileAction } from '@/lib/actions/settingsActions';
import { useTheme } from '@/components/ui/ThemeProvider';

// ── Helfer-Komponenten außerhalb der Seite definieren,
// damit React sie bei State-Änderungen NICHT unmountet ──────────────
const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
  <button onClick={() => onChange(!value)}
    className={`w-11 h-6 rounded-full transition-all relative shrink-0 border-none cursor-pointer ${value ? 'bg-[var(--primary)]' : 'bg-gray-200 dark:bg-white/10'}`}>
    <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
  </button>
);

const SectionCard = ({ title, icon: Icon, children, defaultOpen = true }: { title: string; icon: React.ElementType; children: React.ReactNode; defaultOpen?: boolean }) => {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${open ? 'border-b dark:border-white/[0.06] border-black/[0.06]' : ''}`}
        aria-expanded={open}
      >
        <h3 className="text-sm font-black dark:text-white text-gray-900 flex items-center gap-2 pointer-events-none">
          <Icon size={14} className="text-[var(--primary)]" />
          {title}
        </h3>
        <span className="dark:text-white/30 text-gray-400 shrink-0 transition-transform duration-200" style={{ transform: open ? 'rotate(0deg)' : 'rotate(-90deg)' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
};

const ToggleRow = ({ label, desc, value, onChange }: { label: string; desc?: string; value: boolean; onChange: (v: boolean) => void }) => (
  <div className="flex items-center justify-between py-3 border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
    <div>
      <div className="text-sm font-semibold dark:text-white text-gray-900">{label}</div>
      {desc && <div className="text-[10px] dark:text-white/30 text-gray-400 mt-0.5">{desc}</div>}
    </div>
    <Toggle value={value} onChange={onChange} />
  </div>
);

export default function ProfileSettingsPage() {
  const userProfile = useAppStore((s) => s.userProfile);
  const setUserProfile = useAppStore((s) => s.setUserProfile);
  const { setTheme: setGlobalTheme } = useTheme();

  const [activeTab, setActiveTab] = useState<'profil' | 'erscheinungsbild' | 'sicherheit' | 'benachrichtigungen' | 'datenschutz' | 'aktivitaet'>('profil');
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Profil
  const [displayName, setDisplayName] = useState('');
  const [statusMessage, setStatusMessage] = useState('');
  const [phone, setPhone] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [location, setLocation] = useState('');
  const [bio, setBio] = useState('');
  const [linkedIn, setLinkedIn] = useState('');
  const [website, setWebsite] = useState('');

  // Erweiterte Profilfelder
  const [birthDate, setBirthDate] = useState('');
  const [startDate, setStartDate] = useState('');
  const [emergencyContact, setEmergencyContact] = useState('');
  const [languages, setLanguages] = useState('');
  const [certifications, setCertifications] = useState('');
  const [education, setEducation] = useState('');
  const [travelWillingness, setTravelWillingness] = useState<'none' | 'low' | 'medium' | 'high'>('medium');
  const [hoursPerWeek, setHoursPerWeek] = useState('40');
  const [homeOfficePercentage, setHomeOfficePercentage] = useState('50');
  const [consultantType, setConsultantType] = useState<'consultant' | 'senior_consultant' | 'apprentice'>('consultant');
  const [skills, setSkills] = useState('');
  const [department, setDepartment] = useState('');
  const [xing, setXing] = useState('');
  const [twitter, setTwitter] = useState('');
  const [github, setGithub] = useState('');

  // Erscheinungsbild
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [compactMode, setCompactMode] = useState(false);
  const [showAvatars, setShowAvatars] = useState(true);
  const [animationsEnabled, setAnimationsEnabled] = useState(true);
  const [language, setLanguage] = useState('de');
  const [dateFormat, setDateFormat] = useState('DD.MM.YYYY');
  const [startPage, setStartPage] = useState('/dashboard');
  const [bundesland, setBundesland] = useState('ALL');

  // Bundesland aus localStorage laden
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('tr-bundesland');
      if (stored) setBundesland(stored);
    }
  }, []);

  const handleBundeslandChange = (bl: string) => {
    setBundesland(bl);
    if (typeof window !== 'undefined') localStorage.setItem('tr-bundesland', bl);
  };

  // Sicherheit
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showCurrentPw, setShowCurrentPw] = useState(false);
  const [showNewPw, setShowNewPw] = useState(false);
  const [mfaEnabled, setMfaEnabled] = useState(false);

  // Benachrichtigungen
  const [notifEmail, setNotifEmail] = useState(true);
  const [notifBrowser, setNotifBrowser] = useState(true);
  const [notifAvailChange, setNotifAvailChange] = useState(true);
  const [notifProjectAssign, setNotifProjectAssign] = useState(true);
  const [notifWeeklyReport, setNotifWeeklyReport] = useState(false);
  const [notifMentions, setNotifMentions] = useState(true);
  const [notifAdminMsg, setNotifAdminMsg] = useState(true);
  const [quietHoursFrom, setQuietHoursFrom] = useState('18:00');
  const [quietHoursTo, setQuietHoursTo] = useState('08:00');
  const [quietHoursEnabled, setQuietHoursEnabled] = useState(false);

  useEffect(() => {
    if (userProfile) {
      setDisplayName(userProfile.displayName || '');
      setStatusMessage(userProfile.statusMessage || '');
      setPhone(userProfile.phone || '');
      setAvatarUrl(userProfile.avatarUrl || '');
      if (userProfile.preferences) {
        setTheme(userProfile.preferences.theme || 'system');
      }
    }
  }, [userProfile]);

  const showMsg = (type: 'success' | 'error', text: string) => {
    setMsg({ type, text });
    setTimeout(() => setMsg(null), 3500);
  };

  const handleSave = async () => {
    setIsSaving(true);
    const result = await updateUserProfileAction({
      displayName, statusMessage, phone, avatarUrl,
      preferences: { theme, notifications: notifEmail },
    });
    if (result.success) {
      if (userProfile) setUserProfile({ ...userProfile, displayName, statusMessage, phone, avatarUrl, preferences: { theme, notifications: notifEmail } });
      showMsg('success', 'Profil gespeichert.');
    } else {
      showMsg('error', result.error || 'Fehler beim Speichern.');
    }
    setIsSaving(false);
  };

  const handleChangePassword = () => {
    if (!currentPassword || !newPassword) return showMsg('error', 'Bitte alle Felder ausfÃ¼llen.');
    if (newPassword !== confirmPassword) return showMsg('error', 'PasswÃ¶rter stimmen nicht Ã¼berein.');
    if (newPassword.length < 8) return showMsg('error', 'MindestlÃ¤nge: 8 Zeichen.');
    showMsg('success', 'Passwort erfolgreich geÃ¤ndert.');
    setCurrentPassword(''); setNewPassword(''); setConfirmPassword('');
  };

  const inputCls = 'w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all';

  const TABS = [
    { id: 'profil' as const, label: 'Profil', icon: User },
    { id: 'erscheinungsbild' as const, label: 'Erscheinungsbild', icon: Monitor },
    { id: 'sicherheit' as const, label: 'Sicherheit', icon: Lock },
    { id: 'benachrichtigungen' as const, label: 'Benachrichtigungen', icon: Bell },
    { id: 'datenschutz' as const, label: 'Datenschutz', icon: Shield },
    { id: 'aktivitaet' as const, label: 'AktivitÃ¤t', icon: Activity },
  ];

  return (
    <div className="p-4 sm:p-6 w-full animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-4">
          <div className="w-14 h-14 rounded-2xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center shrink-0 overflow-hidden">
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={56} height={56} className="object-cover w-full h-full" />
            ) : (
              <span className="text-xl font-black text-[var(--primary)]">
                {(displayName || userProfile?.email || '?').charAt(0).toUpperCase()}
              </span>
            )}
          </div>
          <div>
            <h1 className="text-2xl font-black dark:text-white text-gray-900">{displayName || 'Mein Profil'}</h1>
            <div className="flex items-center gap-2 mt-0.5">
              <span className="text-[10px] font-black px-2 py-0.5 rounded-full bg-[var(--primary-light)] text-[var(--primary)]">{userProfile?.role || 'employee'}</span>
              {userProfile?.email && <span className="text-xs dark:text-white/40 text-gray-500">{userProfile.email}</span>}
            </div>
          </div>
        </div>
        <button onClick={handleSave} disabled={isSaving}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity shadow-lg">
          {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
          Speichern
        </button>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${msg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Tab Nav */}
        <nav className="shrink-0 w-44 space-y-0.5">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-[var(--primary-light)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]' : 'dark:text-white/50 text-gray-600 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] bg-transparent'}`}>
              <tab.icon size={14} />
              {tab.label}
              {activeTab === tab.id && <div className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] ml-auto shrink-0" />}
            </button>
          ))}
          {/* Konto-Badge */}
          <div className="mt-4 p-3 rounded-xl bg-gradient-to-br from-[var(--primary)] to-[#8b5cf6] text-white space-y-1">
            <div className="text-[8px] font-black uppercase tracking-widest opacity-60">Konto-ID</div>
            <div className="text-[9px] font-mono opacity-70 break-all">{userProfile?.id?.slice(0, 16) || 'â€”'}â€¦</div>
            <div className="text-[8px] font-semibold opacity-60">Seit {userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('de') : 'â€”'}</div>
          </div>
        </nav>

        {/* Content */}
        <div className="flex-1 space-y-5 min-w-0">

          {/* â•â• PROFIL â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'profil' && (
            <>
              <SectionCard title="PersÃ¶nliche Daten" icon={User}>
                <div className="flex flex-col sm:flex-row gap-6 items-start">
                  <div className="relative shrink-0">
                    <div className="w-24 h-24 rounded-2xl bg-[var(--primary-light)] border-2 dark:border-white/10 border-gray-200 overflow-hidden flex items-center justify-center">
                      {avatarUrl ? (
                        <Image src={avatarUrl} alt="Avatar" width={96} height={96} className="object-cover w-full h-full" />
                      ) : (
                        <span className="text-3xl font-black text-[var(--primary)]">{(displayName || '?').charAt(0)}</span>
                      )}
                    </div>
                    <div className="mt-2 w-24">
                      <input type="text" value={avatarUrl} onChange={(e) => setAvatarUrl(e.target.value)}
                        title="Avatar-URL" placeholder="Bild-URL..."
                        className="w-full text-[9px] px-2 py-1.5 rounded-lg bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/10 border-gray-200 outline-none focus:border-[var(--primary)] dark:text-white/60 text-gray-500" />
                    </div>
                  </div>
                  <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 gap-3 w-full">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Anzeigename *</label>
                      <input type="text" value={displayName} onChange={(e) => setDisplayName(e.target.value)}
                        title="Anzeigename" placeholder="Max Mustermann" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Jobbezeichnung</label>
                      <input type="text" value={jobTitle} onChange={(e) => setJobTitle(e.target.value)}
                        title="Jobbezeichnung" placeholder="Senior Berater" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Standort</label>
                      <div className="relative">
                        <MapPin size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                        <input type="text" value={location} onChange={(e) => setLocation(e.target.value)}
                          title="Standort" placeholder="Berlin, DE" className={inputCls + ' pl-9'} />
                      </div>
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">E-Mail</label>
                      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.06] border-black/[0.06] opacity-60">
                        <Mail size={14} className="dark:text-white/40 text-gray-400 shrink-0" />
                        <span className="text-sm dark:text-white/70 text-gray-700 truncate">{userProfile?.email || 'â€”'}</span>
                      </div>
                    </div>
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Status-Nachricht</label>
                  <div className="relative">
                    <MessageSquare size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input type="text" value={statusMessage} onChange={(e) => setStatusMessage(e.target.value)}
                      title="Status-Nachricht" placeholder="Was machst du gerade? (HomeOffice, Kundenprojekt...)" className={inputCls + ' pl-9'} />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Ãœber mich</label>
                  <textarea value={bio} onChange={(e) => setBio(e.target.value)} rows={3} title="Ãœber mich"
                    placeholder="Kurze Beschreibung deiner Rolle und Expertise..."
                    className={inputCls + ' resize-none'} />
                </div>
              </SectionCard>

              <SectionCard title="Kontakt & Links" icon={Phone}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Telefon</label>
                    <div className="relative">
                      <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)}
                        title="Telefon" placeholder="+49 123 456789" className={inputCls + ' pl-9'} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">LinkedIn</label>
                    <div className="relative">
                      <Briefcase size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type="url" value={linkedIn} onChange={(e) => setLinkedIn(e.target.value)}
                        title="LinkedIn" placeholder="https://linkedin.com/in/..." className={inputCls + ' pl-9'} />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Website</label>
                    <div className="relative">
                      <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type="url" value={website} onChange={(e) => setWebsite(e.target.value)}
                        title="Website" placeholder="https://..." className={inputCls + ' pl-9'} />
                    </div>
                  </div>
                  <div className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.04] border-black/[0.04] space-y-1">
                    <div className="text-[9px] font-black uppercase tracking-wide dark:text-white/30 text-gray-400">Rolle</div>
                    <div className="text-sm font-black text-[var(--primary)]">{userProfile?.role || '—'}</div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Berater-Profil" icon={Briefcase}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Berater-Typ</label>
                    <div className="grid grid-cols-3 gap-2">
                      {([
                        { id: 'consultant',        label: 'Berater',         desc: 'Ext. + Int. Projekt + Uni' },
                        { id: 'senior_consultant', label: 'Senior Berater',  desc: 'Ext. + Int. Projekt' },
                        { id: 'apprentice',        label: 'Auszubildender',  desc: 'Int. Projekt + Berufsschule' },
                      ] as const).map(opt => (
                        <button key={opt.id} onClick={() => setConsultantType(opt.id)}
                          className={`p-3 rounded-xl border-2 transition-all cursor-pointer bg-transparent text-left ${consultantType === opt.id ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'dark:border-white/10 border-gray-200 hover:border-[rgba(99,102,241,0.3)]'}`}>
                          <div className={`text-xs font-black ${consultantType === opt.id ? 'text-[var(--primary)]' : 'dark:text-white text-gray-900'}`}>{opt.label}</div>
                          <div className="text-[9px] dark:text-white/40 text-gray-500 mt-0.5">{opt.desc}</div>
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Abteilung</label>
                    <input type="text" value={department} onChange={e => setDepartment(e.target.value)} title="Abteilung" placeholder="Beratung, IT, HR..." className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Eintrittsdatum</label>
                    <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} title="Eintrittsdatum" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Stunden / Woche</label>
                    <input type="number" min={0} max={60} value={hoursPerWeek} onChange={e => setHoursPerWeek(e.target.value)} title="Stunden pro Woche" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Homeoffice-Anteil (%)</label>
                    <input type="number" min={0} max={100} value={homeOfficePercentage} onChange={e => setHomeOfficePercentage(e.target.value)} title="Homeoffice-Anteil" className={inputCls} />
                  </div>
                  <div className="space-y-1 sm:col-span-2">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Reisebereitschaft</label>
                    <div className="grid grid-cols-4 gap-2">
                      {([
                        { id: 'none', label: 'Keine' }, { id: 'low', label: 'Gering' },
                        { id: 'medium', label: 'Mittel' }, { id: 'high', label: 'Hoch' },
                      ] as const).map(opt => (
                        <button key={opt.id} onClick={() => setTravelWillingness(opt.id)}
                          className={`py-2 rounded-xl border-2 text-[10px] font-black transition-all cursor-pointer bg-transparent ${travelWillingness === opt.id ? 'border-[var(--primary)] bg-[var(--primary-light)] text-[var(--primary)]' : 'dark:border-white/10 border-gray-200 dark:text-white/50 text-gray-500'}`}>
                          {opt.label}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Qualifikationen & Kompetenzen" icon={Activity} defaultOpen={false}>
                <div className="grid grid-cols-1 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Skills (kommagetrennt)</label>
                    <textarea value={skills} onChange={e => setSkills(e.target.value)} rows={2} title="Skills" placeholder="Projektmanagement, Java, SAP, Scrum..." className={inputCls + ' resize-none'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Zertifizierungen (kommagetrennt)</label>
                    <textarea value={certifications} onChange={e => setCertifications(e.target.value)} rows={2} title="Zertifizierungen" placeholder="PMP, ITIL, AWS Solutions Architect..." className={inputCls + ' resize-none'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Ausbildung / Studium</label>
                    <textarea value={education} onChange={e => setEducation(e.target.value)} rows={2} title="Ausbildung" placeholder="B.Sc. Informatik, TU München, 2019..." className={inputCls + ' resize-none'} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Sprachen (kommagetrennt)</label>
                    <input type="text" value={languages} onChange={e => setLanguages(e.target.value)} title="Sprachen" placeholder="Deutsch (C2), Englisch (C1), Spanisch (B2)" className={inputCls} />
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Persönliche Daten" icon={Shield} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Geburtsdatum</label>
                    <input type="date" value={birthDate} onChange={e => setBirthDate(e.target.value)} title="Geburtsdatum" className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Notfallkontakt</label>
                    <input type="text" value={emergencyContact} onChange={e => setEmergencyContact(e.target.value)} title="Notfallkontakt" placeholder="Name, Telefon..." className={inputCls} />
                  </div>
                  <div className="sm:col-span-2 p-3 rounded-xl bg-amber-50 dark:bg-amber-900/10 border border-amber-200 dark:border-amber-700/30 text-[10px] text-amber-700 dark:text-amber-400">
                    Diese Felder sind nur für die HR-Verwaltung sichtbar und werden vertraulich behandelt.
                  </div>
                </div>
              </SectionCard>

              <SectionCard title="Weitere Social-Links" icon={Globe} defaultOpen={false}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">XING</label>
                    <input type="url" value={xing} onChange={e => setXing(e.target.value)} title="XING" placeholder="https://xing.com/profile/..." className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">GitHub</label>
                    <input type="url" value={github} onChange={e => setGithub(e.target.value)} title="GitHub" placeholder="https://github.com/..." className={inputCls} />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">X / Twitter</label>
                    <input type="url" value={twitter} onChange={e => setTwitter(e.target.value)} title="Twitter" placeholder="https://x.com/..." className={inputCls} />
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* â•â• ERSCHEINUNGSBILD â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'erscheinungsbild' && (
            <>
              <SectionCard title="Farbschema" icon={Monitor}>
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { id: 'light' as const, label: 'Hell', icon: Sun, preview: 'bg-white border-gray-200' },
                    { id: 'dark' as const, label: 'Dunkel', icon: Moon, preview: 'bg-gray-900 border-gray-700' },
                    { id: 'system' as const, label: 'System', icon: Laptop, preview: 'bg-gradient-to-br from-white to-gray-900 border-gray-400' },
                  ].map((opt) => (
                    <button key={opt.id} onClick={() => { setTheme(opt.id); setGlobalTheme(opt.id); }}
                      className={`p-4 rounded-xl border-2 transition-all cursor-pointer bg-transparent flex flex-col items-center gap-2 ${theme === opt.id ? 'border-[var(--primary)] bg-[var(--primary-light)]' : 'dark:border-white/10 border-gray-200 hover:border-[rgba(99,102,241,0.3)]'}`}>
                      <div className={`w-full h-10 rounded-lg border ${opt.preview}`} />
                      <opt.icon size={14} className={theme === opt.id ? 'text-[var(--primary)]' : 'dark:text-white/50 text-gray-500'} />
                      <span className={`text-[10px] font-black uppercase tracking-wide ${theme === opt.id ? 'text-[var(--primary)]' : 'dark:text-white/50 text-gray-500'}`}>{opt.label}</span>
                    </button>
                  ))}
                </div>
              </SectionCard>

              <SectionCard title="Darstellungsoptionen" icon={Settings2}>
                <ToggleRow label="Kompakt-Modus" desc="Engere AbstÃ¤nde, mehr Inhalte auf einer Seite" value={compactMode} onChange={setCompactMode} />
                <ToggleRow label="Avatare anzeigen" desc="Profilbilder in Listen und Ãœbersichten" value={showAvatars} onChange={setShowAvatars} />
                <ToggleRow label="Animationen" desc="ÃœbergÃ¤nge und Effekte beim Navigieren" value={animationsEnabled} onChange={setAnimationsEnabled} />
                <div className="pt-2 space-y-1">
                  <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Startseite nach Login</label>
                  <select value={startPage} onChange={(e) => setStartPage(e.target.value)} title="Startseite" className={inputCls}>
                    <option value="/dashboard">Dashboard</option>
                    <option value="/year">JahresÃ¼bersicht</option>
                    <option value="/members">WamoBook</option>
                    <option value="/projects">Projekte</option>
                  </select>
                </div>
              </SectionCard>

              <SectionCard title="Region & Sprache" icon={Globe}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Sprache</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)} title="Sprache" className={inputCls}>
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Datumsformat</label>
                    <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} title="Datumsformat" className={inputCls}>
                      <option value="DD.MM.YYYY">31.12.2026</option>
                      <option value="YYYY-MM-DD">2026-12-31</option>
                      <option value="MM/DD/YYYY">12/31/2026</option>
                    </select>
                  </div>
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">
                      Standard-Bundesland (Feiertage)
                    </label>
                    <select value={bundesland} onChange={(e) => handleBundeslandChange(e.target.value)} title="Standard-Bundesland" className={inputCls}>
                      <option value="ALL">Deutschlandweit</option>
                      <option value="BW">BW – Baden-Württemberg</option>
                      <option value="BY">BY – Bayern</option>
                      <option value="BE">BE – Berlin</option>
                      <option value="BB">BB – Brandenburg</option>
                      <option value="HB">HB – Bremen</option>
                      <option value="HH">HH – Hamburg</option>
                      <option value="HE">HE – Hessen</option>
                      <option value="MV">MV – Mecklenburg-Vorpommern</option>
                      <option value="NI">NI – Niedersachsen</option>
                      <option value="NW">NW – Nordrhein-Westfalen</option>
                      <option value="RP">RP – Rheinland-Pfalz</option>
                      <option value="SL">SL – Saarland</option>
                      <option value="SN">SN – Sachsen</option>
                      <option value="ST">ST – Sachsen-Anhalt</option>
                      <option value="SH">SH – Schleswig-Holstein</option>
                      <option value="TH">TH – Thüringen</option>
                    </select>
                    <p className="text-[9px] dark:text-white/30 text-gray-400">Wird als Standard in der Jahresübersicht und Auslastung verwendet.</p>
                  </div>
                </div>
              </SectionCard>
            </>
          )}

          {/* â•â• SICHERHEIT â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'sicherheit' && (
            <>
              <SectionCard title="Passwort Ã¤ndern" icon={Key}>
                <div className="space-y-3 max-w-md">
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Aktuelles Passwort</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type={showCurrentPw ? 'text' : 'password'} value={currentPassword} onChange={(e) => setCurrentPassword(e.target.value)}
                        title="Aktuelles Passwort" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputCls + ' pl-9 pr-10'} />
                      <button onClick={() => setShowCurrentPw(!showCurrentPw)} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer dark:text-white/30 text-gray-400">
                        {showCurrentPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Neues Passwort (min. 8 Zeichen)</label>
                    <div className="relative">
                      <Lock size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type={showNewPw ? 'text' : 'password'} value={newPassword} onChange={(e) => setNewPassword(e.target.value)}
                        title="Neues Passwort" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputCls + ' pl-9 pr-10'} />
                      <button onClick={() => setShowNewPw(!showNewPw)} className="absolute right-3 top-1/2 -translate-y-1/2 border-none bg-transparent cursor-pointer dark:text-white/30 text-gray-400">
                        {showNewPw ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                    </div>
                    {newPassword && (
                      <div className="flex items-center gap-1 mt-1">
                        {[8, 12, 16].map((len) => (
                          <div key={len} className={`flex-1 h-1 rounded-full transition-all ${newPassword.length >= len ? 'bg-[var(--primary)]' : 'bg-gray-200 dark:bg-white/10'}`} />
                        ))}
                        <span className="text-[9px] dark:text-white/30 text-gray-400 ml-1 shrink-0">{newPassword.length < 8 ? 'Schwach' : newPassword.length < 12 ? 'Mittel' : 'Stark'}</span>
                      </div>
                    )}
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">BestÃ¤tigen</label>
                    <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
                      title="Passwort bestÃ¤tigen" placeholder="â€¢â€¢â€¢â€¢â€¢â€¢â€¢â€¢" className={inputCls + (confirmPassword && newPassword !== confirmPassword ? ' border-red-400' : '')} />
                    {confirmPassword && newPassword !== confirmPassword && (
                      <p className="text-[10px] text-red-400 font-semibold mt-0.5">PasswÃ¶rter stimmen nicht Ã¼berein</p>
                    )}
                  </div>
                  <button onClick={handleChangePassword}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
                    <Key size={14} /> Passwort aktualisieren
                  </button>
                </div>
              </SectionCard>

              <SectionCard title="Zwei-Faktor-Authentifizierung (2FA)" icon={Fingerprint}>
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-sm dark:text-white/70 text-gray-700 font-medium">Sichere dein Konto mit einem zweiten Faktor ab.</p>
                    <p className="text-[10px] dark:text-white/30 text-gray-400 mt-1">UnterstÃ¼tzt: Google Authenticator, Authy, 1Password</p>
                  </div>
                  <Toggle value={mfaEnabled} onChange={setMfaEnabled} />
                </div>
                {mfaEnabled && (
                  <div className="p-4 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] text-sm dark:text-white/70 text-gray-700 flex items-start gap-2">
                    <Info size={14} className="text-[var(--primary)] shrink-0 mt-0.5" />
                    Scanne den QR-Code in deiner Authenticator-App. (Feature in Vorbereitung)
                  </div>
                )}
              </SectionCard>

              <SectionCard title="Aktive Sitzungen" icon={Chrome}>
                <div className="space-y-2">
                  {[
                    { device: 'Chrome Â· Windows 11', location: 'Berlin, DE', time: 'Gerade jetzt', current: true },
                    { device: 'Safari Â· macOS', location: 'Hamburg, DE', time: 'Vor 2 Tagen', current: false },
                  ].map((s, i) => (
                    <div key={i} className="flex items-center justify-between p-3 rounded-xl border dark:border-white/[0.06] border-black/[0.06]">
                      <div className="flex items-center gap-3">
                        <Chrome size={16} className={s.current ? 'text-[var(--primary)]' : 'dark:text-white/30 text-gray-400'} />
                        <div>
                          <div className="text-xs font-bold dark:text-white text-gray-900 flex items-center gap-1.5">
                            {s.device} {s.current && <span className="text-[8px] font-black px-1.5 py-0.5 rounded-full bg-green-500/10 text-green-500">AKTIV</span>}
                          </div>
                          <div className="text-[10px] dark:text-white/30 text-gray-400">{s.location} Â· {s.time}</div>
                        </div>
                      </div>
                      {!s.current && (
                        <button className="text-[10px] font-bold text-red-400 hover:text-red-500 border-none bg-transparent cursor-pointer">Abmelden</button>
                      )}
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}

          {/* â•â• BENACHRICHTIGUNGEN â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'benachrichtigungen' && (
            <>
              <SectionCard title="KanÃ¤le" icon={Bell}>
                <ToggleRow label="E-Mail-Benachrichtigungen" desc="Wichtige Updates per E-Mail erhalten" value={notifEmail} onChange={setNotifEmail} />
                <ToggleRow label="Browser-Benachrichtigungen" desc="Push-Notifications im Browser" value={notifBrowser} onChange={setNotifBrowser} />
              </SectionCard>
              <SectionCard title="Ereignisse" icon={BellRing}>
                <ToggleRow label="VerfÃ¼gbarkeitsÃ¤nderungen" desc="Wenn jemand deinen Status Ã¤ndert" value={notifAvailChange} onChange={setNotifAvailChange} />
                <ToggleRow label="Projekt-Zuweisungen" desc="Wenn du einem Projekt zugewiesen wirst" value={notifProjectAssign} onChange={setNotifProjectAssign} />
                <ToggleRow label="ErwÃ¤hnungen" desc="Wenn du in Kommentaren erwÃ¤hnt wirst" value={notifMentions} onChange={setNotifMentions} />
                <ToggleRow label="Admin-Nachrichten" desc="Wichtige Mitteilungen des Admins" value={notifAdminMsg} onChange={setNotifAdminMsg} />
                <ToggleRow label="WÃ¶chentliche Reports" desc="Jeden Montag eine Zusammenfassung" value={notifWeeklyReport} onChange={setNotifWeeklyReport} />
              </SectionCard>
              <SectionCard title="Ruhemodus" icon={BellOff}>
                <ToggleRow label="Ruhemodus aktivieren" desc="In diesem Zeitraum keine Benachrichtigungen" value={quietHoursEnabled} onChange={setQuietHoursEnabled} />
                {quietHoursEnabled && (
                  <div className="grid grid-cols-2 gap-3 pt-1">
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Von</label>
                      <input type="time" value={quietHoursFrom} onChange={(e) => setQuietHoursFrom(e.target.value)} title="Ruhemodus von" className={inputCls} />
                    </div>
                    <div className="space-y-1">
                      <label className="text-[9px] font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Bis</label>
                      <input type="time" value={quietHoursTo} onChange={(e) => setQuietHoursTo(e.target.value)} title="Ruhemodus bis" className={inputCls} />
                    </div>
                  </div>
                )}
              </SectionCard>
            </>
          )}

          {/* â•â• DATENSCHUTZ â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'datenschutz' && (
            <>
              <SectionCard title="Sichtbarkeit" icon={Shield}>
                <ToggleRow label="Profil Ã¶ffentlich (im Team)" desc="Andere Teammitglieder kÃ¶nnen dein Profil sehen" value={true} onChange={() => {}} />
                <ToggleRow label="Status-Nachricht anzeigen" desc="Deine Status-Nachricht ist fÃ¼r alle sichtbar" value={true} onChange={() => {}} />
                <ToggleRow label="Online-Indikator" desc="Zeige an, wenn du aktiv bist" value={true} onChange={() => {}} />
                <ToggleRow label="VerfÃ¼gbarkeit automatisch teilen" desc="Projektstatus automatisch synchronisieren" value={false} onChange={() => {}} />
              </SectionCard>
              <SectionCard title="Daten exportieren (DSGVO)" icon={Download}>
                <p className="text-sm dark:text-white/60 text-gray-600">Lade eine Kopie aller deiner Daten herunter.</p>
                <div className="flex flex-wrap gap-2">
                  {['Profildaten (JSON)', 'VerfÃ¼gbarkeiten (CSV)', 'AktivitÃ¤tslog (PDF)'].map((label) => (
                    <button key={label}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold border dark:border-white/10 border-gray-200 hover:bg-[var(--primary-light)] hover:text-[var(--primary)] dark:text-white/70 text-gray-700 transition-all bg-transparent cursor-pointer">
                      <Download size={14} /> {label}
                    </button>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Konto lÃ¶schen" icon={Trash2}>
                <div className="p-4 rounded-xl bg-red-500/5 border border-red-500/20 space-y-3">
                  <p className="text-sm text-red-400 font-semibold">
                    Dein Konto und alle zugehÃ¶rigen Daten werden <strong>unwiderruflich gelÃ¶scht</strong>.
                  </p>
                  <button className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none cursor-pointer transition-colors">
                    <Trash2 size={14} /> Konto lÃ¶schen
                  </button>
                </div>
              </SectionCard>
            </>
          )}

          {/* â•â• AKTIVITÃ„T â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â• */}
          {activeTab === 'aktivitaet' && (
            <>
              <SectionCard title="Letzte AktivitÃ¤ten" icon={Activity}>
                <div className="space-y-0">
                  {[
                    { action: 'VerfÃ¼gbarkeit gesetzt', detail: 'BeP fÃ¼r 15.â€“20. April', time: 'Vor 2 Std.', color: '#f97316' },
                    { action: 'Projekt beigetreten', detail: 'TeamRadar v2 Weiterentwicklung', time: 'Gestern', color: '#6366f1' },
                    { action: 'Profil aktualisiert', detail: 'Anzeigename geÃ¤ndert', time: 'Vor 3 Tagen', color: '#06b6d4' },
                    { action: 'Anmeldung', detail: 'Chrome Â· Windows 11', time: 'Vor 5 Tagen', color: '#22c55e' },
                    { action: 'Passwort geÃ¤ndert', detail: 'â€”', time: 'Vor 2 Wochen', color: '#8b5cf6' },
                    { action: 'Konto erstellt', detail: 'Einladung akzeptiert', time: userProfile?.createdAt ? new Date(userProfile.createdAt).toLocaleDateString('de') : 'â€”', color: '#ec4899' },
                  ].map((item, i) => (
                    <div key={i} className="flex items-center gap-3 py-3 border-b dark:border-white/[0.04] border-black/[0.04] last:border-0">
                      <div className="w-2 h-2 rounded-full shrink-0" style={{ background: item.color }} />
                      <div className="flex-1">
                        <div className="text-xs font-bold dark:text-white text-gray-900">{item.action}</div>
                        {item.detail !== 'â€”' && <div className="text-[10px] dark:text-white/30 text-gray-400">{item.detail}</div>}
                      </div>
                      <div className="text-[10px] dark:text-white/30 text-gray-400 shrink-0">{item.time}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
              <SectionCard title="Nutzungsstatistik" icon={Hash}>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {[
                    { label: 'Tage eingetragen', value: '127', color: '#6366f1' },
                    { label: 'Projekte', value: '8', color: '#f97316' },
                    { label: 'Logins (Monat)', value: '43', color: '#22c55e' },
                    { label: 'Berichte', value: '5', color: '#8b5cf6' },
                  ].map((s) => (
                    <div key={s.label} className="p-3 rounded-xl bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.04] border-black/[0.04] text-center">
                      <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                      <div className="text-[9px] dark:text-white/30 text-gray-400 font-semibold mt-0.5">{s.label}</div>
                    </div>
                  ))}
                </div>
              </SectionCard>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
