'use client';

import { useState, useEffect } from 'react';
import {
  Shield, Database, Users, PlusCircle, Building, Mail, Image as ImageIcon,
  Power, Save, Loader, ChevronRight, Tag, Trash2, Plus, Edit3,
  Activity, Bell, Lock, Key, Palette, Globe, Zap, Server, Eye,
  EyeOff, RefreshCw, Download, AlertTriangle, CheckCircle, Info,
  ToggleLeft, ToggleRight, Cpu, HardDrive, Wifi, Clock, BarChart3,
  FileText, Settings2, Moon, Sun, Layers, UserPlus, Building2,
  MapPin, Phone, CreditCard, Crown, Trash,
} from 'lucide-react';
import { useAppStore } from '@/stores/appStore';
import { STATUS_CONFIG } from '@/types';
import Link from 'next/link';
import { updateSystemSettingsAction } from '@/lib/actions/settingsActions';
import { createClient } from '@/lib/supabase/client';

interface DayCategory {
  id: string;
  kuerzel: string;
  label: string;
  color: string;
  bg_color: string;
  sort_order: number;
  is_active: boolean;
}

const DEFAULT_KUERZEL = [
  { kuerzel: 'U',   label: 'Urlaub',        color: '#ffffff', bg_color: '#8b5cf6', sort_order: 1,  is_active: true },
  { kuerzel: 'K',   label: 'Krank',          color: '#ffffff', bg_color: '#ec4899', sort_order: 2,  is_active: true },
  { kuerzel: 'eP',  label: 'Ext. Projekt',   color: '#ffffff', bg_color: '#f97316', sort_order: 3,  is_active: true },
  { kuerzel: 'BeP', label: 'B�ro ext.',       color: '#ffffff', bg_color: '#fb923c', sort_order: 4,  is_active: true },
  { kuerzel: 'B',   label: 'B�ro intern',    color: '#ffffff', bg_color: '#6366f1', sort_order: 5,  is_active: true },
  { kuerzel: 'H',   label: 'Homeoffice',     color: '#ffffff', bg_color: '#06b6d4', sort_order: 6,  is_active: true },
  { kuerzel: 'V',   label: 'Verf�gbar',       color: '#166534', bg_color: '#bbf7d0', sort_order: 7,  is_active: true },
  { kuerzel: 'S',   label: 'Schulung',        color: '#ffffff', bg_color: '#a855f7', sort_order: 8,  is_active: true },
  { kuerzel: 'P',   label: 'Presales',        color: '#ffffff', bg_color: '#0ea5e9', sort_order: 9,  is_active: true },
];

type AdminTab =
  | 'overview'
  | 'members'
  | 'organisation'
  | 'branding'
  | 'security'
  | 'notifications'
  | 'appearance'
  | 'kuerzel'
  | 'integrations'
  | 'advanced'
  | 'logs';

// -- Helfer-Komponenten auf Modulebene (keine Remounts bei State-Updates) ------

function InputField({ label, value, onChange, type = 'text', placeholder, icon: Icon }: {
  label: string; value: string; onChange: (v: string) => void;
  type?: string; placeholder?: string; icon?: React.ElementType;
}) {
  return (
    <div className="space-y-1">
      <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">{label}</label>
      <div className="relative">
        {Icon && <Icon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />}
        <input type={type} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder}
          className={`w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 ${Icon ? 'pl-9' : 'pl-4'} pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all`} />
      </div>
    </div>
  );
}

function Toggle({ label, value, onChange, desc }: {
  label: string; value: boolean; onChange: (v: boolean) => void; desc?: string;
}) {
  return (
    <div className="flex items-center justify-between py-3 border-b dark:border-white/4 border-black/4 last:border-0">
      <div>
        <div className="text-sm font-semibold dark:text-white text-gray-900">{label}</div>
        {desc && <div className="text-[10px] dark:text-white/30 text-gray-400 mt-0.5">{desc}</div>}
      </div>
      <button onClick={() => onChange(!value)}
        className={`w-12 h-6 rounded-full transition-all relative shrink-0 border-none cursor-pointer ${value ? 'bg-(--primary)' : 'bg-gray-200 dark:bg-white/10'}`}>
        <div className={`absolute top-0.5 w-5 h-5 rounded-full bg-white shadow transition-all ${value ? 'right-0.5' : 'left-0.5'}`} />
      </button>
    </div>
  );
}

function AdminCard({ title, icon, children, defaultOpen = true, className = '' }: {
  title: React.ReactNode; icon?: React.ReactNode; defaultOpen?: boolean;
  children: React.ReactNode; className?: string;
}) {
  const [open, setOpen] = useState(defaultOpen);
  return (
    <div className={`card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden ${className}`}>
      <button
        onClick={() => setOpen(v => !v)}
        className={`w-full flex items-center justify-between px-5 py-3.5 bg-transparent border-none cursor-pointer hover:bg-black/2 dark:hover:bg-white/2 transition-colors ${open ? 'border-b dark:border-white/6 border-black/6' : ''}`}
        aria-expanded={open}
      >
        <h3 className="text-sm font-black dark:text-white text-gray-900 flex items-center gap-2 pointer-events-none">
          {icon}
          {title}
        </h3>
        <span className="dark:text-white/30 text-gray-400 shrink-0" style={{ transform: open ? 'none' : 'rotate(-90deg)', transition: 'transform 0.2s' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m6 9 6 6 6-6"/></svg>
        </span>
      </button>
      {open && <div className="p-5 space-y-4">{children}</div>}
    </div>
  );
}

export default function AdminSettingsPage() {
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const systemSettings = useAppStore((s) => s.systemSettings);
  const updateSystemSettings = useAppStore((s) => s.updateSystemSettings);
  const loadSystemSettings = useAppStore((s) => s.loadSystemSettings);
  const members = useAppStore((s) => s.members);
  const projects = useAppStore((s) => s.projects);
  const isAdmin = hasMinRole('admin');

  const [activeTab, setActiveTab] = useState<AdminTab>('overview');

  // Branding
  const [orgName, setOrgName] = useState('');
  const [orgLogoUrl, setOrgLogoUrl] = useState('');
  const [supportEmail, setSupportEmail] = useState('');
  const [maintenanceMode, setMaintenanceMode] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Security
  const [mfaRequired, setMfaRequired] = useState(false);
  const [sessionTimeout, setSessionTimeout] = useState(60);
  const [passwordMinLength, setPasswordMinLength] = useState(8);
  const [allowedDomains, setAllowedDomains] = useState('');
  const [ipWhitelist, setIpWhitelist] = useState('');

  // Notifications
  const [emailNotifNew, setEmailNotifNew] = useState(true);
  const [emailNotifLeave, setEmailNotifLeave] = useState(true);
  const [emailNotifReport, setEmailNotifReport] = useState(false);
  const [slackWebhook, setSlackWebhook] = useState('');
  const [teamsWebhook, setTeamsWebhook] = useState('');

  // Appearance
  const [primaryColor, setPrimaryColor] = useState('#6366f1');
  const [companyFont, setCompanyFont] = useState('Inter');
  const [defaultTheme, setDefaultTheme] = useState<'light' | 'dark' | 'system'>('system');
  const [sidebarCompact, setSidebarCompact] = useState(false);
  const [dateFormat, setDateFormat] = useState('DD.MM.YYYY');
  const [language, setLanguage] = useState('de');
  const [timezone, setTimezone] = useState('Europe/Berlin');

  // Integrations
  const [googleCalendarEnabled, setGoogleCalendarEnabled] = useState(false);
  const [outlookEnabled, setOutlookEnabled] = useState(false);
  const [jiraEnabled, setJiraEnabled] = useState(false);
  const [jiraUrl, setJiraUrl] = useState('');
  const [confluenceEnabled, setConfluenceEnabled] = useState(false);
  const [apiKeyVisible, setApiKeyVisible] = useState(false);
  const [apiKey] = useState(() => {
    const arr = new Uint8Array(12);
    crypto.getRandomValues(arr);
    return 'tr-' + Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
  });

  // Advanced
  const [dataRetentionDays, setDataRetentionDays] = useState(365);
  const [autoBackup, setAutoBackup] = useState(true);
  const [debugMode, setDebugMode] = useState(false);
  const [analyticsEnabled, setAnalyticsEnabled] = useState(true);
  const [gdprMode, setGdprMode] = useState(true);

  // Organisation
  const [orgAddress, setOrgAddress] = useState('');
  const [orgCity, setOrgCity] = useState('');
  const [orgCountry, setOrgCountry] = useState('Deutschland');
  const [orgPhone, setOrgPhone] = useState('');
  const [orgWebsite, setOrgWebsite] = useState('');
  const [orgPlan, setOrgPlan] = useState<'starter' | 'pro' | 'enterprise'>('pro');

  // Arbeitszeit & Feiertage
  const [workHoursPerDay, setWorkHoursPerDay] = useState('8');
  const [workDaysPerWeek, setWorkDaysPerWeek] = useState('5');
  const [weekStartDay, setWeekStartDay] = useState('1'); // 1=Mo
  const [defaultBundesland, setDefaultBundesland] = useState('BY');
  const [maxVacationDays, setMaxVacationDays] = useState('30');

  const [alertOverbookingThreshold, setAlertOverbookingThreshold] = useState('100');
  const [extConsultantWeeklyHours, setExtConsultantWeeklyHours] = useState('40');

  // Mitarbeiter einladen
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<'employee' | 'department_lead' | 'cio'>('employee');
  const [inviteDepartment, setInviteDepartment] = useState('');
  const [inviteMsg, setInviteMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [inviteLoading, setInviteLoading] = useState(false);

  // K�rzel
  const [categories, setCategories] = useState<DayCategory[]>([]);
  const [catLoading, setCatLoading] = useState(false);
  const [newKuerzel, setNewKuerzel] = useState('');
  const [newLabel, setNewLabel] = useState('');
  const [newBgColor, setNewBgColor] = useState('#6366f1');
  const [newTextColor, setNewTextColor] = useState('#ffffff');
  const [catMsg, setCatMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [editingCat, setEditingCat] = useState<DayCategory | null>(null);

  const loadCategories = async () => {
    try {
      const supabase = createClient();
      const { data, error } = await supabase.from('day_categories').select('*').order('sort_order');
      if (error) {
        setCatMsg({ type: 'error', text: `DB-Fehler: ${error.message} � Bitte Migration ausf�hren: npx supabase migration up` });
      } else if (data) {
        setCategories(data);
      }
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setCatMsg({ type: 'error', text: `Verbindungsfehler: ${msg}` });
    }
  };

  useEffect(() => { loadCategories(); }, []);

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
          <div className="w-16 h-16 rounded-2xl bg-red-500/10 flex items-center justify-center mx-auto text-red-500"><Shield size={32} /></div>
          <h2 className="text-xl font-bold dark:text-white">Zugriff verweigert</h2>
          <p className="text-sm dark:text-white/40 text-gray-500 max-w-xs font-medium">Diese Seite ist nur f�r Administratoren zug�nglich.</p>
          <Link href="/" className="inline-flex items-center gap-2 text-sm font-bold text-(--primary) no-underline hover:underline pt-4">
            Zum Dashboard <ChevronRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  const handleSaveBranding = async () => {
    setIsSaving(true);
    setMsg(null);
    const result = await updateSystemSettingsAction({ orgName, orgLogoUrl, supportEmail, maintenanceMode });
    if (result.success) {
      updateSystemSettings({ orgName, orgLogoUrl, supportEmail, maintenanceMode });
      setMsg({ type: 'success', text: 'Einstellungen gespeichert.' });
    } else {
      setMsg({ type: 'error', text: result.error || 'Fehler beim Speichern.' });
    }
    setIsSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const handleSeedDefaults = async () => {
    setCatLoading(true);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('day_categories').insert(DEFAULT_KUERZEL);
      if (!error) {
        setCatMsg({ type: 'success', text: 'Standard-K�rzel eingef�gt.' });
        await loadCategories();
      } else {
        setCatMsg({ type: 'error', text: error.message });
      }
    } catch (e: any) { setCatMsg({ type: 'error', text: e.message }); }
    setCatLoading(false);
    setTimeout(() => setCatMsg(null), 3000);
  };

  const handleAddCategory = async () => {
    if (!newKuerzel.trim() || !newLabel.trim()) return;
    setCatLoading(true);
    const supabase = createClient();
    const { error } = await supabase.from('day_categories').insert({
      kuerzel: newKuerzel.trim().slice(0, 4),
      label: newLabel.trim(),
      color: newTextColor,
      bg_color: newBgColor,
      sort_order: categories.length + 1,
      is_active: true,
    });
    if (!error) {
      setNewKuerzel(''); setNewLabel('');
      setCatMsg({ type: 'success', text: 'K�rzel gespeichert.' });
      await loadCategories();
    } else {
      setCatMsg({ type: 'error', text: error.message });
    }
    setCatLoading(false);
    setTimeout(() => setCatMsg(null), 3000);
  };

  const handleUpdateCategory = async (cat: DayCategory, updates: Partial<DayCategory>) => {
    const supabase = createClient();
    const { error } = await supabase.from('day_categories').update(updates).eq('id', cat.id);
    if (!error) {
      setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, ...updates } : c));
      setEditingCat(null);
      setCatMsg({ type: 'success', text: 'K�rzel aktualisiert.' });
      setTimeout(() => setCatMsg(null), 2000);
    }
  };

  const handleDeleteCategory = async (id: string) => {
    const supabase = createClient();
    await supabase.from('day_categories').delete().eq('id', id);
    setCategories((prev) => prev.filter((c) => c.id !== id));
  };

  const handleToggleActive = async (cat: DayCategory) => {
    const supabase = createClient();
    await supabase.from('day_categories').update({ is_active: !cat.is_active }).eq('id', cat.id);
    setCategories((prev) => prev.map((c) => c.id === cat.id ? { ...c, is_active: !c.is_active } : c));
  };

  const handleInvite = async () => {
    if (!inviteEmail.trim()) return;
    setInviteLoading(true);
    setInviteMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.auth.admin.inviteUserByEmail(inviteEmail.trim(), {
        data: { role: inviteRole, department: inviteDepartment.trim() || undefined },
      });
      if (error) throw error;
      setInviteMsg({ type: 'success', text: `Einladung an ${inviteEmail} gesendet.` });
      setInviteEmail('');
      setInviteDepartment('');
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : String(e);
      setInviteMsg({ type: 'error', text: msg });
    }
    setInviteLoading(false);
    setTimeout(() => setInviteMsg(null), 4000);
  };

  const TABS: { id: AdminTab; label: string; icon: any; badge?: number }[] = [
    { id: 'overview', label: '�bersicht', icon: BarChart3 },
    { id: 'members', label: 'Mitarbeiter', icon: UserPlus },
    { id: 'organisation', label: 'Organisation', icon: Building2 },
    { id: 'branding', label: 'Branding', icon: Building },
    { id: 'security', label: 'Sicherheit', icon: Lock },
    { id: 'notifications', label: 'Benachrichtigungen', icon: Bell },
    { id: 'appearance', label: 'Darstellung', icon: Palette },
    { id: 'kuerzel', label: 'K�rzel', icon: Tag },
    { id: 'integrations', label: 'Integrationen', icon: Zap },
    { id: 'advanced', label: 'Erweitert', icon: Settings2 },
    { id: 'logs', label: 'Aktivit�tslog', icon: FileText },
  ];

  return (
    <div className="p-4 sm:p-6 w-full animate-fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center shadow-lg shadow-indigo-500/10">
              <Shield size={20} className="text-indigo-500" />
            </div>
            Administration
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Systemkonfiguration, Sicherheit und Plattformsteuerung</p>
        </div>
      </div>

      {msg && (
        <div className={`mb-4 flex items-center gap-2 p-3 rounded-xl text-sm font-semibold border ${msg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertTriangle size={16} />}
          {msg.text}
        </div>
      )}

      <div className="flex gap-6">
        {/* Sidebar nav */}
        <nav className="shrink-0 w-44 space-y-0.5">
          {TABS.map((tab) => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id)}
              className={`w-full flex items-center gap-2 px-3 py-2 rounded-xl text-left text-xs font-semibold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-(--primary-light) text-(--primary) border border-[rgba(99,102,241,0.2)]' : 'dark:text-white/50 text-gray-600 hover:bg-black/3 dark:hover:bg-white/3 bg-transparent'}`}>
              <tab.icon size={14} />
              {tab.label}
              {tab.badge ? <span className="ml-auto px-1.5 py-0.5 rounded-full bg-red-500 text-white text-[9px] font-black">{tab.badge}</span> : null}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="flex-1 min-w-0">

          {/* --- �BERSICHT --------------------------------- */}
          {activeTab === 'overview' && (
            <div className="space-y-5">
              {/* System Health */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {[
                  { label: 'Mitglieder', value: members.length, icon: Users, color: '#6366f1' },
                  { label: 'Projekte', value: projects.length, icon: Layers, color: '#8b5cf6' },
                  { label: 'K�rzel', value: categories.length, icon: Tag, color: '#f97316' },
                  { label: 'Status', value: 'OK', icon: Activity, color: '#22c55e' },
                ].map((s) => (
                  <div key={s.label} className="card-shimmer rounded-xl p-4 border dark:border-white/6 border-black/6">
                    <div className="flex items-center gap-2 mb-2">
                      <s.icon size={14} style={{ color: s.color }} />
                      <span className="text-[10px] dark:text-white/40 text-gray-500">{s.label}</span>
                    </div>
                    <div className="text-2xl font-black" style={{ color: s.color }}>{s.value}</div>
                  </div>
                ))}
              </div>

              {/* Services */}
              <AdminCard title="System-Dienste" icon={<Server size={14} className="text-(--primary)" />}>
                <div className="space-y-3">
                {[
                  { name: 'Supabase Datenbank', status: 'OK', icon: Database, detail: 'PostgreSQL � teamradar-dev' },
                  { name: 'Authentifizierung', status: 'OK', icon: Key, detail: 'GoTrue / JWT' },
                  { name: 'Next.js App Router', status: 'OK', icon: Server, detail: 'v15 � React 19' },
                  { name: 'Wartungsmodus', status: maintenanceMode ? 'AKTIV' : 'Inaktiv', icon: Power, detail: maintenanceMode ? 'Nur Admins haben Zugriff' : 'Alle Nutzer aktiv', statusColor: maintenanceMode ? '#f59e0b' : '#22c55e' },
                ].map((s) => (
                  <div key={s.name} className="flex items-center justify-between p-3 rounded-xl bg-black/1 dark:bg-white/1 border dark:border-white/4 border-black/4">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-lg bg-(--primary-light) flex items-center justify-center">
                        <s.icon size={14} className="text-(--primary)" />
                      </div>
                      <div>
                        <div className="text-xs font-semibold dark:text-white text-gray-900">{s.name}</div>
                        <div className="text-[10px] dark:text-white/30 text-gray-400">{s.detail}</div>
                      </div>
                    </div>
                    <span className="px-2 py-0.5 rounded-full text-[9px] font-black" style={{ background: `${(s as any).statusColor || '#22c55e'}15`, color: (s as any).statusColor || '#22c55e' }}>{s.status}</span>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="grid sm:grid-cols-3 gap-3">
                {[
                  { href: '/admin/organisation', label: 'Organisation verwalten', icon: Building, color: '#6366f1' },
                  { href: '/members', label: 'Mitglieder & Rollen', icon: Users, color: '#8b5cf6' },
                  { href: '/reports', label: 'System-Reports', icon: BarChart3, color: '#06b6d4' },
                  { href: '/utilization', label: 'Auslastungsanalyse', icon: Activity, color: '#f97316' },
                  { href: '/members?action=invite', label: 'Nutzer einladen', icon: PlusCircle, color: '#22c55e' },
                  { href: '/year', label: 'Jahres�bersicht', icon: Layers, color: '#f59e0b' },
                ].map((q) => (
                  <Link key={q.href} href={q.href}
                    className="flex items-center gap-3 p-3 rounded-xl border dark:border-white/6 border-black/6 hover:border-[rgba(99,102,241,0.3)] hover:bg-(--primary-light) transition-all no-underline group">
                    <div className="w-8 h-8 rounded-lg flex items-center justify-center shrink-0" style={{ background: `${q.color}15` }}>
                      <q.icon size={14} style={{ color: q.color }} />
                    </div>
                    <span className="text-xs font-semibold dark:text-white text-gray-900 group-hover:text-(--primary) transition-colors">{q.label}</span>
                    <ChevronRight size={12} className="ml-auto dark:text-white/20 text-gray-300 group-hover:text-(--primary) transition-colors" />
                  </Link>
                ))}
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- MITARBEITER EINLADEN ---------------------- */}
          {activeTab === 'members' && (
            <div className="space-y-5">
              {/* Invite form */}
              <AdminCard title="Neuen Mitarbeiter einladen" icon={<UserPlus size={14} className="text-(--primary)" />}>
                {inviteMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold border ${inviteMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
                    {inviteMsg.text}
                  </div>
                )}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2 space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">E-Mail-Adresse *</label>
                    <div className="relative">
                      <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                      <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)}
                        placeholder="mitarbeiter@firma.de"
                        className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Rolle</label>
                    <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all">
                      <option value="employee">Mitarbeiter</option>
                      <option value="department_lead">Abteilungsleiter</option>
                      <option value="cio">CIO</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Abteilung (optional)</label>
                    <input value={inviteDepartment} onChange={(e) => setInviteDepartment(e.target.value)}
                      placeholder="z.B. Beratung, IT..."
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                  </div>
                </div>
                <button onClick={handleInvite} disabled={inviteLoading || !inviteEmail.trim()}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary) text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity">
                  {inviteLoading ? <Loader size={14} className="animate-spin" /> : <UserPlus size={14} />}
                  Einladung senden
                </button>
              </AdminCard>

              <AdminCard title={<>Aktuelle Mitarbeiter <span className="text-(--primary) font-black">({members.length})</span></>} icon={<Users size={14} className="text-(--primary)" />}>
                <div className="space-y-1 max-h-[400px] overflow-y-auto">
                  {members.map((m) => (
                    <div key={m.id} className="flex items-center justify-between p-2.5 rounded-lg hover:bg-black/2 dark:hover:bg-white/2 transition-colors">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-(--primary-light) flex items-center justify-center text-(--primary) font-black text-xs shrink-0">
                          {m.name.charAt(0)}
                        </div>
                        <div>
                          <div className="text-xs font-bold dark:text-white text-gray-900">{m.name}</div>
                          <div className="text-[10px] dark:text-white/30 text-gray-400">{m.department || 'Keine Abteilung'}</div>
                        </div>
                      </div>
                      <span className="text-[9px] font-black px-2 py-0.5 rounded-full bg-(--primary-light) text-(--primary)">{m.role || 'employee'}</span>
                    </div>
                  ))}
                  {members.length === 0 && <div className="text-center py-6 text-sm dark:text-white/30 text-gray-400">Keine Mitarbeiter vorhanden.</div>}
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- ORGANISATION ------------------------------ */}
          {activeTab === 'organisation' && (
            <div className="space-y-5">
              <AdminCard title="Allgemeine Informationen" icon={<Building2 size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="sm:col-span-2">
                    <InputField label="Organisationsname" value={orgName} onChange={setOrgName} placeholder="Meine GmbH" icon={Building2} />
                  </div>
                  <InputField label="Telefon" value={orgPhone} onChange={setOrgPhone} placeholder="+49 30 12345678" icon={Phone} />
                  <InputField label="Website" value={orgWebsite} onChange={setOrgWebsite} placeholder="https://firma.de" icon={Globe} />
                  <InputField label="Adresse" value={orgAddress} onChange={setOrgAddress} placeholder="Musterstra�e 1" icon={MapPin} />
                  <InputField label="Stadt" value={orgCity} onChange={setOrgCity} placeholder="Berlin" icon={MapPin} />
                  <InputField label="Land" value={orgCountry} onChange={setOrgCountry} placeholder="Deutschland" icon={Globe} />
                  <InputField label="Support E-Mail" value={supportEmail} onChange={setSupportEmail} type="email" placeholder="support@firma.de" icon={Mail} />
                </div>
                <button onClick={handleSaveBranding} disabled={isSaving}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary) text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 disabled:opacity-50 transition-opacity">
                  {isSaving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
                  Speichern
                </button>
              </AdminCard>

              <AdminCard title="Arbeitszeit & Arbeitswoche" icon={<Clock size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Arbeitsstunden / Tag</label>
                    <input type="number" min={1} max={24} value={workHoursPerDay} onChange={e => setWorkHoursPerDay(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Arbeitstage / Woche</label>
                    <input type="number" min={1} max={7} value={workDaysPerWeek} onChange={e => setWorkDaysPerWeek(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Wochenbeginn</label>
                    <select value={weekStartDay} onChange={e => setWeekStartDay(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)">
                      <option value="1">Montag</option>
                      <option value="0">Sonntag</option>
                      <option value="6">Samstag</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Std./Woche ext. Berater</label>
                    <input type="number" min={1} max={60} value={extConsultantWeeklyHours} onChange={e => setExtConsultantWeeklyHours(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
                  </div>
                </div>
              </AdminCard>

              <AdminCard title="Feiertage & Urlaub" icon={<Settings2 size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Standard Bundesland (Feiertage)</label>
                    <select value={defaultBundesland} onChange={e => setDefaultBundesland(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)">
                      <option value="BW">Baden-W�rttemberg</option>
                      <option value="BY">Bayern</option>
                      <option value="BE">Berlin</option>
                      <option value="BB">Brandenburg</option>
                      <option value="HB">Bremen</option>
                      <option value="HH">Hamburg</option>
                      <option value="HE">Hessen</option>
                      <option value="MV">Mecklenburg-Vorpommern</option>
                      <option value="NI">Niedersachsen</option>
                      <option value="NW">Nordrhein-Westfalen</option>
                      <option value="RP">Rheinland-Pfalz</option>
                      <option value="SL">Saarland</option>
                      <option value="SN">Sachsen</option>
                      <option value="ST">Sachsen-Anhalt</option>
                      <option value="SH">Schleswig-Holstein</option>
                      <option value="TH">Th�ringen</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Max. Urlaubstage / Jahr</label>
                    <input type="number" min={0} max={365} value={maxVacationDays} onChange={e => setMaxVacationDays(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
                  </div>
                  <div className="space-y-1 col-span-2">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Auslastungs-Alert ab (%) </label>
                    <input type="number" min={50} max={200} value={alertOverbookingThreshold} onChange={e => setAlertOverbookingThreshold(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary)" />
                    <p className="text-[9px] dark:text-white/30 text-gray-400">Ab diesem Auslastungswert wird eine Warnung angezeigt.</p>
                  </div>
                </div>
                <button onClick={() => { /* TODO: persistieren */ }}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-(--primary) text-white text-sm font-bold border-none cursor-pointer hover:opacity-90 transition-opacity">
                  <Save size={14} /> Speichern
                </button>
              </AdminCard>

              <AdminCard title="Plan & Abrechnung" icon={<CreditCard size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {[
                    { id: 'starter' as const, name: 'Starter', price: 'Kostenlos', features: ['Bis 5 Nutzer', 'Basis-Features'], color: '#6b7280' },
                    { id: 'pro' as const, name: 'Pro', price: '�29 / Monat', features: ['Bis 50 Nutzer', 'Alle Features', 'Support'], color: '#6366f1', recommended: true },
                    { id: 'enterprise' as const, name: 'Enterprise', price: 'Auf Anfrage', features: ['Unbegrenzte Nutzer', 'SLA', 'Dedicated Support'], color: '#8b5cf6' },
                  ].map((plan) => (
                    <button key={plan.id} onClick={() => setOrgPlan(plan.id)}
                      className={`relative p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-transparent ${orgPlan === plan.id ? 'border-(--primary) bg-(--primary-light)' : 'dark:border-white/10 border-gray-200 hover:border-[rgba(99,102,241,0.3)]'}`}>
                      {plan.recommended && <span className="absolute top-2 right-2 text-[8px] font-black px-1.5 py-0.5 rounded-full bg-(--primary) text-white">EMPFOHLEN</span>}
                      <Crown size={16} style={{ color: plan.color }} className="mb-2" />
                      <div className="font-black dark:text-white text-gray-900 text-sm">{plan.name}</div>
                      <div className="font-bold text-(--primary) text-xs mt-0.5">{plan.price}</div>
                      <ul className="mt-2 space-y-0.5">
                        {plan.features.map((f) => <li key={f} className="text-[10px] dark:text-white/50 text-gray-500">? {f}</li>)}
                      </ul>
                    </button>
                  ))}
                </div>
              </AdminCard>

              <AdminCard title="Gefahrenzone" icon={<Trash size={14} className="text-red-500" />} className="border-red-500/20">
                <div className="flex items-center justify-between p-3 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div>
                    <div className="text-xs font-bold dark:text-white text-gray-900">Organisation l�schen</div>
                    <div className="text-[10px] dark:text-white/40 text-gray-400">Alle Daten werden unwiderruflich gel�scht.</div>
                  </div>
                  <button className="px-3 py-1.5 rounded-lg text-xs font-bold bg-red-500/10 text-red-500 hover:bg-red-500/20 border-none cursor-pointer transition-colors">
                    L�schen
                  </button>
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- BRANDING ---------------------------------- */}
          {activeTab === 'branding' && (
            <div className="space-y-5">
              <AdminCard title="Organisations-Branding" icon={<Building size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><InputField label="Organisationsname" value={orgName} onChange={setOrgName} placeholder="Wamocon TeamRadar" icon={Building} /></div>
                  <InputField label="Logo URL" value={orgLogoUrl} onChange={setOrgLogoUrl} placeholder="https://..." icon={ImageIcon} />
                  <InputField label="Support E-Mail" value={supportEmail} onChange={setSupportEmail} type="email" placeholder="support@firma.de" icon={Mail} />
                </div>
                {orgLogoUrl && /^https?:\/\//.test(orgLogoUrl) && <div className="p-3 rounded-xl bg-black/2 dark:bg-white/2 border dark:border-white/6 border-black/6"><img src={orgLogoUrl} alt="Logo" className="max-h-16 object-contain" /></div>}
              </AdminCard>

              <AdminCard title="Wartungsmodus" icon={<Power size={14} className="text-red-500" />}>
                <div className="flex items-center justify-between p-4 rounded-xl bg-red-500/5 border border-red-500/10">
                  <div>
                    <div className="text-sm font-bold text-red-500">Wartungsmodus</div>
                    <div className="text-xs text-red-400/70 mt-0.5">Deaktiviert den Zugriff f�r alle Nicht-Admins</div>
                  </div>
                  <button onClick={() => setMaintenanceMode(!maintenanceMode)}
                    className={`w-14 h-7 rounded-full transition-all relative border-none cursor-pointer ${maintenanceMode ? 'bg-red-500' : 'bg-gray-300 dark:bg-white/10'}`}>
                    <div className={`absolute top-1 w-5 h-5 rounded-full bg-white transition-all ${maintenanceMode ? 'right-1' : 'left-1'}`} />
                  </button>
                </div>
              </AdminCard>

              <button onClick={handleSaveBranding} disabled={isSaving}
                className="flex items-center gap-2 px-6 py-3 rounded-xl bg-(--primary) text-white text-sm font-bold cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50">
                {isSaving ? <Loader size={15} className="animate-spin" /> : <Save size={15} />} Branding speichern
              </button>
            </div>
          )}

          {/* --- SICHERHEIT -------------------------------- */}
          {activeTab === 'security' && (
            <div className="space-y-5">
              <AdminCard title="Sicherheitsrichtlinien" icon={<Lock size={14} className="text-(--primary)" />}>
                <div className="space-y-0">
                <Toggle label="Zwei-Faktor-Authentifizierung (2FA) erzwingen" value={mfaRequired} onChange={setMfaRequired} desc="Alle Nutzer m�ssen 2FA aktivieren" />
                <Toggle label="DSGVO-Modus" value={gdprMode} onChange={setGdprMode} desc="Datenschutz-Popups und Einwilligungen aktiv" />
                <Toggle label="Analytics & Tracking" value={analyticsEnabled} onChange={setAnalyticsEnabled} desc="Anonymisierte Nutzungsstatistiken" />
                </div>
              </AdminCard>

              <AdminCard title="Passwort & Session" icon={<Key size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-2 gap-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Min. Passwort-L�nge</label>
                  <input type="number" value={passwordMinLength} onChange={(e) => setPasswordMinLength(parseInt(e.target.value) || 8)} min={6} max={32}
                    className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Session-Timeout (Minuten)</label>
                  <input type="number" value={sessionTimeout} onChange={(e) => setSessionTimeout(parseInt(e.target.value) || 60)} min={5} max={1440}
                    className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Erlaubte E-Mail-Domains</label>
                  <input value={allowedDomains} onChange={(e) => setAllowedDomains(e.target.value)} placeholder="firma.de, partner.com"
                    className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">IP-Whitelist (optional, kommagetrennt)</label>
                  <input value={ipWhitelist} onChange={(e) => setIpWhitelist(e.target.value)} placeholder="192.168.1.0/24, 10.0.0.0/8"
                    className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                </div>
                </div>
              </AdminCard>

              <div className="p-3 rounded-xl border dark:border-white/6 border-black/6 bg-amber-500/5 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
                <Info size={13} className="shrink-0 mt-0.5" />
                Sicherheitsrichtlinien werden lokal gespeichert und erfordern ggf. einen Backend-Neustart f�r volle Wirksamkeit.
              </div>
            </div>
          )}

          {/* --- BENACHRICHTIGUNGEN ------------------------ */}
          {activeTab === 'notifications' && (
            <div className="space-y-5">
              <AdminCard title="E-Mail-Benachrichtigungen" icon={<Bell size={14} className="text-(--primary)" />}>
                <div className="space-y-0">
                <Toggle label="Neues Mitglied" value={emailNotifNew} onChange={setEmailNotifNew} desc="E-Mail bei Neuanmeldung eines Nutzers" />
                <Toggle label="Abwesenheiten & Urlaub" value={emailNotifLeave} onChange={setEmailNotifLeave} desc="Eintragungen im Jahreskalender" />
                <Toggle label="Reporte verf�gbar" value={emailNotifReport} onChange={setEmailNotifReport} desc="Monatlicher Auslastungsbericht" />
                </div>
              </AdminCard>

              <AdminCard title="Webhook-Integrationen" icon={<Zap size={14} className="text-(--primary)" />}>
                <InputField label="Slack Webhook URL" value={slackWebhook} onChange={setSlackWebhook} placeholder="https://hooks.slack.com/..." icon={Globe} />
                <InputField label="Microsoft Teams Webhook URL" value={teamsWebhook} onChange={setTeamsWebhook} placeholder="https://outlook.office.com/webhook/..." icon={Globe} />
                <div className="p-3 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.15)] text-xs dark:text-white/60 text-gray-600 flex items-start gap-2">
                  <Info size={13} className="text-(--primary) shrink-0 mt-0.5" />
                  Webhooks werden bei relevanten Events (neue Mitglieder, Abwesenheiten) ausgel�st.
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- DARSTELLUNG ------------------------------- */}
          {activeTab === 'appearance' && (
            <div className="space-y-5">
              <AdminCard title="Theme & Farben" icon={<Palette size={14} className="text-(--primary)" />}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Standard-Thema</label>
                    <div className="flex gap-2">
                      {(['light','dark','system'] as const).map((t) => (
                        <button key={t} onClick={() => setDefaultTheme(t)}
                          className={`flex-1 flex items-center justify-center gap-1.5 py-2 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${defaultTheme === t ? 'border-[rgba(99,102,241,0.4)] bg-(--primary-light) text-(--primary)' : 'dark:border-white/8 border-black/8 dark:text-white/50 text-gray-600 hover:bg-black/2 dark:hover:bg-white/2 bg-transparent'}`}>
                          {t === 'light' ? <Sun size={12} /> : t === 'dark' ? <Moon size={12} /> : <Layers size={12} />}
                          {t === 'light' ? 'Hell' : t === 'dark' ? 'Dunkel' : 'System'}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Prim�rfarbe</label>
                    <div className="flex items-center gap-2">
                      <input type="color" value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-10 h-10 rounded-lg border dark:border-white/10 border-gray-200 cursor-pointer bg-transparent p-0.5" />
                      <input value={primaryColor} onChange={(e) => setPrimaryColor(e.target.value)}
                        className="flex-1 bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-3 text-sm font-mono dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Schriftart</label>
                    <select value={companyFont} onChange={(e) => setCompanyFont(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all">
                      {['Inter', 'Roboto', 'Open Sans', 'Poppins', 'Nunito', 'IBM Plex Sans'].map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Datumsformat</label>
                    <select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all">
                      {['DD.MM.YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'].map((f) => <option key={f}>{f}</option>)}
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Sprache</label>
                    <select value={language} onChange={(e) => setLanguage(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all">
                      <option value="de">Deutsch</option>
                      <option value="en">English</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Zeitzone</label>
                    <select value={timezone} onChange={(e) => setTimezone(e.target.value)}
                      className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all">
                      {['Europe/Berlin', 'Europe/Vienna', 'Europe/Zurich', 'UTC', 'America/New_York', 'America/Los_Angeles'].map((tz) => <option key={tz}>{tz}</option>)}
                    </select>
                  </div>
                </div>
                <Toggle label="Kompakte Sidebar" value={sidebarCompact} onChange={setSidebarCompact} desc="Schm�lere Navigation mit nur Icons" />
              </AdminCard>
            </div>
          )}

          {/* --- K�RZEL ------------------------------------ */}
          {activeTab === 'kuerzel' && (
            <div className="space-y-5">
              <AdminCard title="Tages-K�rzel" icon={<Tag size={14} className="text-(--primary)" />}>
                <div className="flex justify-end">
                  {categories.length === 0 && (
                    <button onClick={handleSeedDefaults} disabled={catLoading}
                      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-violet-500 text-white text-xs font-bold cursor-pointer border-none hover:opacity-90 transition-opacity disabled:opacity-50">
                      {catLoading ? <Loader size={12} className="animate-spin" /> : <Plus size={12} />} Standard einf�gen
                    </button>
                  )}
                </div>
                <div>

                {catMsg && (
                  <div className={`p-3 rounded-xl text-xs font-bold border ${catMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>{catMsg.text}</div>
                )}

                {categories.length === 0 && !catMsg && (
                  <div className="text-center py-8 space-y-2">
                    <div className="text-sm dark:text-white/30 text-gray-400">Noch keine K�rzel konfiguriert.</div>
                    <div className="text-[11px] dark:text-white/20 text-gray-400">
                      Falls die DB-Tabelle fehlt, bitte in der Supabase-Shell ausf�hren:
                      <code className="ml-1 px-1.5 py-0.5 rounded bg-gray-100 dark:bg-white/10 font-mono">npx supabase migration up</code>
                    </div>
                  </div>
                )}

                <div className="space-y-2">
                  {categories.map((cat) => (
                    <div key={cat.id}>
                      {editingCat?.id === cat.id ? (
                        <div className="p-3 rounded-xl border border-[rgba(99,102,241,0.3)] bg-(--primary-light) space-y-3">
                          <div className="grid grid-cols-4 gap-2">
                            <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">K�rzel</label>
                              <input value={editingCat.kuerzel} onChange={(e) => setEditingCat({ ...editingCat, kuerzel: e.target.value.slice(0, 4) })}
                                className="w-full bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg py-1.5 px-2 text-sm font-bold outline-none focus:border-(--primary)" /></div>
                            <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Bezeichnung</label>
                              <input value={editingCat.label} onChange={(e) => setEditingCat({ ...editingCat, label: e.target.value })}
                                className="w-full bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg py-1.5 px-2 text-sm outline-none focus:border-(--primary)" /></div>
                            <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Hintergrund</label>
                              <div className="flex items-center gap-1">
                                <input type="color" value={editingCat.bg_color} onChange={(e) => setEditingCat({ ...editingCat, bg_color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent p-0.5 border dark:border-white/10 border-gray-200" />
                                <input value={editingCat.bg_color} onChange={(e) => setEditingCat({ ...editingCat, bg_color: e.target.value })} className="flex-1 bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg p-1.5 text-xs font-mono outline-none" /></div></div>
                            <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Textfarbe</label>
                              <div className="flex items-center gap-1">
                                <input type="color" value={editingCat.color} onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })} className="w-8 h-8 rounded cursor-pointer bg-transparent p-0.5 border dark:border-white/10 border-gray-200" />
                                <input value={editingCat.color} onChange={(e) => setEditingCat({ ...editingCat, color: e.target.value })} className="flex-1 bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg p-1.5 text-xs font-mono outline-none" /></div></div>
                          </div>
                          <div className="flex items-center gap-2">
                            <div className="w-10 h-8 rounded-md flex items-center justify-center text-xs font-black" style={{ background: editingCat.bg_color, color: editingCat.color }}>{editingCat.kuerzel}</div>
                            <button onClick={() => handleUpdateCategory(cat, { kuerzel: editingCat.kuerzel, label: editingCat.label, bg_color: editingCat.bg_color, color: editingCat.color })}
                              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-(--primary) text-white text-xs font-bold cursor-pointer border-none hover:opacity-90 transition-opacity">
                              <Save size={12} /> Speichern
                            </button>
                            <button onClick={() => setEditingCat(null)} className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 cursor-pointer border dark:border-white/10 border-gray-200 bg-transparent hover:bg-gray-100 dark:hover:bg-white/5 transition-colors">Abbrechen</button>
                          </div>
                        </div>
                      ) : (
                        <div className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${cat.is_active ? 'dark:border-white/6 border-black/6' : 'border-dashed dark:border-white/4 border-black/4 opacity-50'}`}>
                          <div className="w-10 h-8 rounded-md flex items-center justify-center text-xs font-black shrink-0" style={{ background: cat.bg_color, color: cat.color }}>{cat.kuerzel}</div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold dark:text-white text-gray-900">{cat.label}</div>
                            <div className="text-[10px] dark:text-white/30 text-gray-400 font-mono">{cat.kuerzel}</div>
                          </div>
                          <div className="flex items-center gap-1.5 shrink-0">
                            <button onClick={() => handleToggleActive(cat)}
                              className={`text-[9px] font-bold px-2 py-0.5 rounded-full border-none cursor-pointer ${cat.is_active ? 'bg-green-500/10 text-green-500' : 'bg-gray-100 dark:bg-white/5 text-gray-400'}`}>
                              {cat.is_active ? 'Aktiv' : 'Inaktiv'}
                            </button>
                            <button onClick={() => setEditingCat({ ...cat })} className="p-1.5 rounded-lg hover:bg-(--primary-light) text-(--primary) border-none bg-transparent cursor-pointer transition-all"><Edit3 size={13} /></button>
                            <button onClick={() => handleDeleteCategory(cat.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 border-none bg-transparent cursor-pointer transition-all"><Trash2 size={13} /></button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>

                {/* Neues K�rzel */}
                <div className="pt-4 border-t dark:border-white/6 border-black/6 space-y-3">
                  <h4 className="text-xs font-black uppercase tracking-widest dark:text-white/40 text-gray-500">Neues K�rzel</h4>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">K�rzel (max. 4)</label>
                      <input value={newKuerzel} onChange={(e) => setNewKuerzel(e.target.value.slice(0, 4))} placeholder="z.B. eP"
                        className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg py-2 px-3 text-sm font-bold focus:border-(--primary) outline-none dark:text-white text-gray-900" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Bezeichnung</label>
                      <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)} placeholder="z.B. Ext. Projekt"
                        className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg py-2 px-3 text-sm focus:border-(--primary) outline-none dark:text-white text-gray-900" /></div>
                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Hintergrund</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} className="w-9 h-9 rounded-lg border dark:border-white/10 border-gray-200 cursor-pointer bg-transparent p-0.5" />
                        <input value={newBgColor} onChange={(e) => setNewBgColor(e.target.value)} className="flex-1 bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg py-2 px-2 text-xs font-mono focus:border-(--primary) outline-none dark:text-white text-gray-900" /></div></div>
                    <div className="space-y-1"><label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Textfarbe</label>
                      <div className="flex items-center gap-2">
                        <input type="color" value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="w-9 h-9 rounded-lg border dark:border-white/10 border-gray-200 cursor-pointer bg-transparent p-0.5" />
                        <input value={newTextColor} onChange={(e) => setNewTextColor(e.target.value)} className="flex-1 bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-lg py-2 px-2 text-xs font-mono focus:border-(--primary) outline-none dark:text-white text-gray-900" /></div></div>
                  </div>
                  <div className="flex items-center gap-3">
                    {newKuerzel && <div className="w-10 h-8 rounded-md flex items-center justify-center text-xs font-black" style={{ background: newBgColor, color: newTextColor }}>{newKuerzel}</div>}
                    <button onClick={handleAddCategory} disabled={catLoading || !newKuerzel.trim() || !newLabel.trim()}
                      className="flex items-center gap-2 px-4 py-2 rounded-xl bg-(--primary) text-white text-xs font-bold disabled:opacity-50 cursor-pointer border-none hover:opacity-90 transition-opacity">
                      {catLoading ? <Loader size={13} className="animate-spin" /> : <Plus size={13} />} K�rzel hinzuf�gen
                    </button>
                  </div>
                </div>
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- INTEGRATIONEN ------------------------------ */}
          {activeTab === 'integrations' && (
            <div className="space-y-5">
              <AdminCard title="Kalender-Integration" icon={<Zap size={14} className="text-(--primary)" />}>
                <Toggle label="Google Kalender (OAuth)" value={googleCalendarEnabled} onChange={setGoogleCalendarEnabled} desc="Termine aus Google Calendar synchronisieren" />
                <Toggle label="Microsoft Outlook/Teams" value={outlookEnabled} onChange={setOutlookEnabled} desc="Exchange-Termine importieren" />
                <div className="p-3 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.15)] text-xs dark:text-white/60 text-gray-600 flex items-start gap-2">
                  <Info size={13} className="text-(--primary) shrink-0 mt-0.5" />
                  F�r OAuth-Integration werden API-Credentials in den Umgebungsvariablen ben�tigt. Bitte die technische Dokumentation beachten. ICS-Import ist ohne Konfiguration verf�gbar.
                </div>
              </AdminCard>

              <AdminCard title="Projektmanagement" icon={<Layers size={14} className="text-(--primary)" />}>
                <Toggle label="Jira-Integration" value={jiraEnabled} onChange={setJiraEnabled} desc="Projekte und Tickets aus Jira synchronisieren" />
                {jiraEnabled && <InputField label="Jira URL" value={jiraUrl} onChange={setJiraUrl} placeholder="https://firma.atlassian.net" icon={Globe} />}
                <Toggle label="Confluence" value={confluenceEnabled} onChange={setConfluenceEnabled} desc="Dokumentation aus Confluence verlinken" />
              </AdminCard>

              <AdminCard title="API-Zugang" icon={<Key size={14} className="text-(--primary)" />}>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">API-Schl�ssel (Read-Only)</label>
                  <div className="flex items-center gap-2">
                    <input type={apiKeyVisible ? 'text' : 'password'} value={apiKey} readOnly
                      className="flex-1 bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm font-mono dark:text-white text-gray-900 outline-none" />
                    <button onClick={() => setApiKeyVisible(!apiKeyVisible)} className="p-2 rounded-xl border dark:border-white/10 border-gray-200 dark:text-white/50 text-gray-500 hover:bg-black/3 dark:hover:bg-white/3 cursor-pointer bg-transparent border-solid transition-colors">
                      {apiKeyVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                    </button>
                    <button onClick={() => navigator.clipboard.writeText(apiKey)}
                      className="p-2 rounded-xl bg-(--primary-light) border border-[rgba(99,102,241,0.2)] text-(--primary) hover:opacity-80 cursor-pointer border-solid transition-opacity">
                      <Download size={14} />
                    </button>
                  </div>
                </div>
              </AdminCard>
            </div>
          )}

          {/* --- ERWEITERT ---------------------------------- */}
          {activeTab === 'advanced' && (
            <div className="space-y-5">
              <AdminCard title="Daten & System" icon={<Settings2 size={14} className="text-(--primary)" />}>
                <div className="space-y-0">
                <Toggle label="Automatisches Backup" value={autoBackup} onChange={setAutoBackup} desc="T�gliche Sicherung aller Daten" />
                <Toggle label="Debug-Modus" value={debugMode} onChange={setDebugMode} desc="Erweiterte Log-Ausgabe (nur f�r Entwickler)" />
                <Toggle label="DSGVO-Modus" value={gdprMode} onChange={setGdprMode} desc="Datenschutz-Einwilligungen und Consent-Banner aktiv" />
                <Toggle label="Analytics aktiviert" value={analyticsEnabled} onChange={setAnalyticsEnabled} desc="Anonymisierte Performance-Daten" />
                </div>
              </AdminCard>

              <AdminCard title="Datenaufbewahrung" icon={<HardDrive size={14} className="text-(--primary)" />}>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Aufbewahrungszeitraum (Tage)</label>
                  <input type="number" value={dataRetentionDays} onChange={(e) => setDataRetentionDays(parseInt(e.target.value) || 365)} min={30} max={3650}
                    className="w-full bg-black/2 dark:bg-white/2 border dark:border-white/10 border-black/10 rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-(--primary) transition-all" />
                  <p className="text-[10px] dark:text-white/30 text-gray-400">Nach diesem Zeitraum werden inaktive Logs automatisch gel�scht.</p>
                </div>
              </AdminCard>

              <AdminCard title="Datenbank�bersicht" icon={<Database size={14} className="text-(--primary)" />} defaultOpen={false}>
                {[
                  { table: 'members', count: members.length },
                  { table: 'projects', count: projects.length },
                  { table: 'day_categories', count: categories.length },
                ].map((t) => (
                  <div key={t.table} className="flex items-center justify-between text-xs p-2 rounded-lg bg-black/1 dark:bg-white/1">
                    <span className="font-mono dark:text-white/50 text-gray-500">{t.table}</span>
                    <span className="font-bold dark:text-white text-gray-900">{t.count} Eintr�ge</span>
                  </div>
                ))}
              </AdminCard>
            </div>
          )}

          {/* --- LOGS --------------------------------------- */}
          {activeTab === 'logs' && (
            <div className="card-shimmer rounded-xl border dark:border-white/6 border-black/6 overflow-hidden">
              <div className="p-4 border-b dark:border-white/6 border-black/4 flex items-center justify-between">
                <h3 className="text-sm font-black dark:text-white text-gray-900 flex items-center gap-2"><FileText size={14} /> Aktivit�tslog</h3>
                <span className="text-[10px] dark:text-white/30 text-gray-400">Simulated � wird bei Datenbankanbindung live</span>
              </div>
              <div className="divide-y dark:divide-white/3 divide-black/3">
                {[
                  { time: '11.04.2026 09:44', user: 'n.schefner@wamocon.de', action: 'System-Einstellungen ge�ndert', type: 'info' },
                  { time: '11.04.2026 09:30', user: 'n.kukeyev@wamocon.de', action: 'K�rzel "eP" hinzugef�gt', type: 'success' },
                  { time: '11.04.2026 08:15', user: 'System', action: 'T�gliches Backup abgeschlossen', type: 'success' },
                  { time: '10.04.2026 17:22', user: 'w.moretz@wamocon.de', action: 'Anmeldung', type: 'info' },
                  { time: '10.04.2026 16:10', user: 'n.schefner@wamocon.de', action: 'Wartungsmodus aktiviert', type: 'warning' },
                  { time: '10.04.2026 15:45', user: 'System', action: 'Migration 20260411 ausgef�hrt', type: 'success' },
                  { time: '10.04.2026 14:22', user: 'n.kukeyev@wamocon.de', action: 'Neues Mitglied eingeladen: y.bhesaniya@wamocon.de', type: 'info' },
                ].map((log, i) => (
                  <div key={i} className="flex items-center gap-3 px-4 py-3 text-xs">
                    <div className={`w-1.5 h-1.5 rounded-full shrink-0 ${log.type === 'success' ? 'bg-green-500' : log.type === 'warning' ? 'bg-amber-500' : log.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`} />
                    <span className="dark:text-white/30 text-gray-400 shrink-0 font-mono">{log.time}</span>
                    <span className="dark:text-white/60 text-gray-600 truncate">{log.user}</span>
                    <span className="dark:text-white/80 text-gray-800 font-medium flex-1 truncate">{log.action}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}
