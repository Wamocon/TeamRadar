'use client';
import { useState, useEffect } from 'react';
import { useAppStore } from '@/stores/appStore';
import { createClient } from '@/lib/supabase/client';
import type { Member } from '@/types';
import {
  Building2, Plus, Edit3, Trash2, Users, Mail, Globe, Phone,
  Save, Loader, Lock, X, Check, Shield, CreditCard,
  Image as ImageIcon, AlertCircle, CheckCircle, ChevronDown, ChevronUp,
  UserCog,
} from 'lucide-react';
import Link from 'next/link';

interface OrgSettings {
  id: string;
  org_name: string;
  org_logo_url?: string;
  support_email?: string;
  website?: string;
  phone?: string;
  address?: string;
  city?: string;
  country?: string;
  tax_id?: string;
  billing_email?: string;
  plan?: string;
  max_members?: number;
  maintenance_mode: boolean;
}

interface OrgMember {
  id: string;
  name: string;
  email: string;
  role: string;
  department?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export default function OrganisationPage() {
  const hasMinRole = useAppStore((s) => s.hasMinRole);
  const members = useAppStore((s) => s.members);
  const userProfile = useAppStore((s) => s.userProfile);

  const isAdmin = hasMinRole('admin');

  const [activeTab, setActiveTab] = useState<'general' | 'members' | 'billing' | 'danger'>('general');
  const [settings, setSettings] = useState<OrgSettings>({
    id: 'global',
    org_name: '',
    maintenance_mode: false,
    plan: 'team',
  });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [searchMember, setSearchMember] = useState('');
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState('employee');
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);
  const [editMember, setEditMember] = useState<Member | null>(null);
  const [editForm, setEditForm] = useState<{ name: string; email: string; role: string; department: string; phone: string }>({ name: '', email: '', role: 'employee', department: '', phone: '' });
  const [editSaving, setEditSaving] = useState(false);
  const [editMsg, setEditMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  const updateMember = useAppStore((s) => s.updateMember);
  const [openIdentity, setOpenIdentity] = useState(true);
  const [openAddress, setOpenAddress] = useState(true);
  const [openQuickInfo, setOpenQuickInfo] = useState(true);
  const [openBillingInfo, setOpenBillingInfo] = useState(true);

  useEffect(() => {
    const supabase = createClient();
    supabase.from('system_settings').select('*').eq('id', 'global').single().then(({ data }) => {
      if (data) {
        setSettings({
          id: 'global',
          org_name: data.org_name || '',
          org_logo_url: data.org_logo_url || '',
          support_email: data.support_email || '',
          website: data.website || '',
          phone: data.phone || '',
          address: data.address || '',
          city: data.city || '',
          country: data.country || 'Deutschland',
          tax_id: data.tax_id || '',
          billing_email: data.billing_email || '',
          plan: data.plan || 'team',
          max_members: data.max_members || 50,
          maintenance_mode: data.maintenance_mode || false,
        });
      }
    });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setMsg(null);
    try {
      const supabase = createClient();
      const { error } = await supabase.from('system_settings').upsert({
        id: 'global',
        org_name: settings.org_name,
        org_logo_url: settings.org_logo_url,
        support_email: settings.support_email,
        website: settings.website,
        phone: settings.phone,
        address: settings.address,
        city: settings.city,
        country: settings.country,
        tax_id: settings.tax_id,
        billing_email: settings.billing_email,
        plan: settings.plan,
        max_members: settings.max_members,
        maintenance_mode: settings.maintenance_mode,
      });
      if (error) throw error;
      setMsg({ type: 'success', text: 'Organisations-Einstellungen gespeichert.' });
    } catch (e: any) {
      setMsg({ type: 'error', text: e.message || 'Fehler beim Speichern.' });
    }
    setSaving(false);
    setTimeout(() => setMsg(null), 3000);
  };

  const filteredMembers: OrgMember[] = members
    .filter((m) => !searchMember || m.name.toLowerCase().includes(searchMember.toLowerCase()) || m.email.toLowerCase().includes(searchMember.toLowerCase()))
    .map((m) => ({ id: m.id, name: m.name, email: m.email, role: m.role, department: m.department, avatarUrl: m.avatarUrl }));

  const PLAN_CONFIG = {
    free:       { label: 'Free', color: '#6b7280',  members: '5',  features: ['Grundfunktionen', 'WamoBook'] },
    team:       { label: 'Team', color: '#6366f1',  members: '25', features: ['Alle Free-Features', 'Jahresübersicht', 'Reports'] },
    business:   { label: 'Business', color: '#8b5cf6', members: '100', features: ['Alle Team-Features', 'API-Zugang', 'Custom Branding'] },
    enterprise: { label: 'Enterprise', color: '#f97316', members: '∞', features: ['Alle Features', 'On-Premise', 'SLA', 'Dedicated Support'] },
  };

  const ROLE_COLORS: Record<string, string> = {
    super_admin: '#ef4444', admin: '#6366f1', cio: '#8b5cf6', department_lead: '#06b6d4', employee: '#6b7280',
  };
  const ROLE_LABELS: Record<string, string> = {
    super_admin: 'Super Admin', admin: 'Administrator', cio: 'CIO', department_lead: 'Team-Lead', employee: 'Mitarbeiter',
  };

  const openEditModal = (m: Member) => {
    setEditMember(m);
    setEditForm({ name: m.name, email: m.email, role: m.role, department: m.department || '', phone: m.phone || '' });
    setEditMsg(null);
  };

  const handleEditSave = async () => {
    if (!editMember) return;
    setEditSaving(true);
    setEditMsg(null);
    try {
      await updateMember({ ...editMember, name: editForm.name, email: editForm.email, role: editForm.role, department: editForm.department, phone: editForm.phone });
      setEditMsg({ type: 'success', text: 'Mitarbeiter gespeichert.' });
      setTimeout(() => { setEditMember(null); setEditMsg(null); }, 900);
    } catch (e: any) {
      setEditMsg({ type: 'error', text: e.message || 'Fehler beim Speichern.' });
    }
    setEditSaving(false);
  };

  if (!isAdmin) {
    return (
      <div className="flex flex-1 flex-col items-center justify-center h-full min-h-[60vh] gap-4 text-center p-8">
        <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center">
          <Lock size={28} className="text-red-400" />
        </div>
        <h2 className="text-xl font-black dark:text-white text-gray-900">Kein Zugriff</h2>
        <p className="text-sm dark:text-white/40 text-gray-500 max-w-xs">Organisationsverwaltung ist nur für Administratoren zugänglich.</p>
        <Link href="/" className="px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity">Zum Dashboard</Link>
      </div>
    );
  }

  const tabs = [
    { id: 'general', label: 'Allgemein', icon: Building2 },
    { id: 'members', label: `Mitglieder (${members.length})`, icon: Users },
    { id: 'billing', label: 'Plan & Abrechnung', icon: CreditCard },
    { id: 'danger', label: 'Gefahrenzone', icon: AlertCircle },
  ] as const;

  return (
    <div className="p-4 sm:p-6 w-full space-y-5 animate-fade-in pb-20">
      {/* ─── Member-Edit-Modal ───────────────────────────── */}
      {editMember && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" style={{ background: 'rgba(0,0,0,0.55)' }} onClick={(e) => { if (e.target === e.currentTarget) setEditMember(null); }}>
          <div className="w-full max-w-md rounded-2xl border dark:border-white/[0.08] border-black/[0.08] bg-white dark:bg-[#111] shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between px-5 py-4 border-b dark:border-white/[0.06] border-black/[0.06]">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-xl bg-[var(--primary-light)] flex items-center justify-center">
                  <UserCog size={15} className="text-[var(--primary)]" />
                </div>
                <div>
                  <div className="text-sm font-black dark:text-white text-gray-900">Mitarbeiter bearbeiten</div>
                  <div className="text-[10px] dark:text-white/40 text-gray-500">{editMember.email}</div>
                </div>
              </div>
              <button onClick={() => setEditMember(null)} className="p-1.5 rounded-lg hover:bg-black/[0.05] dark:hover:bg-white/[0.05] dark:text-white/40 text-gray-400 transition-all border-none bg-transparent cursor-pointer"><X size={15} /></button>
            </div>
            {/* Form */}
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Name</label>
                  <input value={editForm.name} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                </div>
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Abteilung</label>
                  <input value={editForm.department} onChange={(e) => setEditForm({ ...editForm, department: e.target.value })}
                    placeholder="z. B. Engineering"
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Telefon</label>
                  <input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })}
                    placeholder="+49 ..."
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Rolle</label>
                  <select value={editForm.role} onChange={(e) => setEditForm({ ...editForm, role: e.target.value })}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all">
                    <option value="employee">Mitarbeiter</option>
                    <option value="department_lead">Team-Lead</option>
                    <option value="cio">CIO</option>
                    <option value="admin">Administrator</option>
                    <option value="super_admin">Super Admin</option>
                  </select>
                </div>
              </div>
              {editMsg && (
                <div className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold border ${
                  editMsg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                }`}>
                  {editMsg.type === 'success' ? <CheckCircle size={13} /> : <AlertCircle size={13} />}
                  {editMsg.text}
                </div>
              )}
              <div className="flex gap-2 pt-1">
                <button onClick={() => setEditMember(null)} className="flex-1 py-2.5 rounded-xl text-xs font-semibold dark:text-white/50 text-gray-600 border dark:border-white/10 border-gray-200 bg-transparent cursor-pointer hover:bg-gray-100 dark:hover:bg-white/5 transition-colors border-solid">Abbrechen</button>
                <button onClick={handleEditSave} disabled={editSaving}
                  className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-60">
                  {editSaving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />}
                  Speichern
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary-light)] border border-[rgba(99,102,241,0.2)] flex items-center justify-center">
              <Building2 size={20} className="text-[var(--primary)]" />
            </div>
            Organisationsverwaltung
          </h1>
          <p className="text-sm dark:text-white/40 text-gray-500 mt-1">Zentrale Verwaltung der Organisation, Mitglieder und Abonnement</p>
        </div>
        {activeTab !== 'members' && activeTab !== 'danger' && (
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-60">
            {saving ? <Loader size={14} className="animate-spin" /> : <Save size={14} />}
            Speichern
          </button>
        )}
      </div>

      {msg && (
        <div className={`flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-semibold border ${msg.type === 'success' ? 'bg-green-500/10 text-green-500 border-green-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'}`}>
          {msg.type === 'success' ? <CheckCircle size={16} /> : <AlertCircle size={16} />}
          {msg.text}
        </div>
      )}

      {/* Tabs */}
      <div className="flex gap-1 p-1 bg-black/[0.02] dark:bg-white/[0.02] rounded-xl w-fit border dark:border-white/[0.06] border-black/[0.06]">
        {tabs.map((tab) => (
          <button key={tab.id} onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all border-none cursor-pointer ${activeTab === tab.id ? 'bg-[var(--primary)] text-white shadow-sm' : 'dark:text-white/40 text-gray-500 hover:bg-black/[0.03] dark:hover:bg-white/[0.03] bg-transparent'}`}>
            <tab.icon size={13} /> {tab.label}
          </button>
        ))}
      </div>

      {/* ─── TAB: Allgemein ─────────────────────────────── */}
      {activeTab === 'general' && (
        <div className="grid lg:grid-cols-3 gap-5">
          {/* Main settings */}
          <div className="lg:col-span-2 space-y-5">
            <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenIdentity(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${openIdentity ? 'border-b dark:border-white/[0.06] border-black/[0.04]' : ''}`}
              >
                <h3 className="text-sm font-black dark:text-white text-gray-900">Organisations-Identität</h3>
                <span className="dark:text-white/30 text-gray-400">{openIdentity ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {openIdentity && (
              <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Organisationsname</label>
                  <div className="relative">
                    <Building2 size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input value={settings.org_name} onChange={(e) => setSettings({ ...settings, org_name: e.target.value })} placeholder="Wamocon GmbH"
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Logo URL</label>
                  <div className="relative">
                    <ImageIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input value={settings.org_logo_url || ''} onChange={(e) => setSettings({ ...settings, org_logo_url: e.target.value })} placeholder="https://..."
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Website</label>
                  <div className="relative">
                    <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input value={settings.website || ''} onChange={(e) => setSettings({ ...settings, website: e.target.value })} placeholder="https://wamocon.de"
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Support E-Mail</label>
                  <div className="relative">
                    <Mail size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input type="email" value={settings.support_email || ''} onChange={(e) => setSettings({ ...settings, support_email: e.target.value })} placeholder="support@firma.de"
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Telefon</label>
                  <div className="relative">
                    <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
                    <input value={settings.phone || ''} onChange={(e) => setSettings({ ...settings, phone: e.target.value })} placeholder="+49 ..."
                      className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                  </div>
                </div>
              </div>
              </div>
              )}
            </div>

            <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenAddress(v => !v)}
                className={`w-full flex items-center justify-between px-5 py-4 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${openAddress ? 'border-b dark:border-white/[0.06] border-black/[0.04]' : ''}`}
              >
                <h3 className="text-sm font-black dark:text-white text-gray-900">Adresse</h3>
                <span className="dark:text-white/30 text-gray-400">{openAddress ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {openAddress && (
              <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Straße & Hausnummer</label>
                  <input value={settings.address || ''} onChange={(e) => setSettings({ ...settings, address: e.target.value })} placeholder="Musterstr. 1"
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Stadt</label>
                  <input value={settings.city || ''} onChange={(e) => setSettings({ ...settings, city: e.target.value })} placeholder="Berlin"
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Land</label>
                  <select value={settings.country || 'Deutschland'} onChange={(e) => setSettings({ ...settings, country: e.target.value })}
                    className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all">
                    {['Deutschland', 'Österreich', 'Schweiz', 'USA', 'UK', 'Frankreich', 'Niederlande'].map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>
              </div>
              )}
            </div>
          </div>

          {/* Right: Logo preview + stats */}
          <div className="space-y-4">
            {settings.org_logo_url && /^https?:\/\//.test(settings.org_logo_url) && (
              <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4 flex flex-col items-center gap-3">
                <p className="text-[10px] font-bold uppercase tracking-widest dark:text-white/30 text-gray-500">Logo Vorschau</p>
                <img src={settings.org_logo_url} alt="Logo" className="max-h-20 object-contain" />
              </div>
            )}
            <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenQuickInfo(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${openQuickInfo ? 'border-b dark:border-white/[0.06] border-black/[0.04]' : ''}`}
              >
                <h4 className="text-xs font-black dark:text-white/40 text-gray-500 uppercase tracking-wide">Schnellinfo</h4>
                <span className="dark:text-white/30 text-gray-400">{openQuickInfo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {openQuickInfo && (
              <div className="p-4 space-y-3">
              {[
                { label: 'Mitglieder', value: members.length, icon: Users },
                { label: 'Aktiver Plan', value: PLAN_CONFIG[settings.plan as keyof typeof PLAN_CONFIG]?.label || settings.plan || 'Team', icon: CreditCard },
                { label: 'Admin', value: userProfile?.email?.split('@')[0] || '—', icon: Shield },
              ].map((s) => (
                <div key={s.label} className="flex items-center gap-2 text-xs">
                  <s.icon size={13} className="text-[var(--primary)] shrink-0" />
                  <span className="dark:text-white/40 text-gray-500 flex-1">{s.label}</span>
                  <span className="font-bold dark:text-white text-gray-900">{s.value}</span>
                </div>
              ))}
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Mitglieder ────────────────────────────── */}
      {activeTab === 'members' && (
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="relative flex-1 max-w-xs">
              <Users size={13} className="absolute left-3 top-1/2 -translate-y-1/2 dark:text-white/30 text-gray-400" />
              <input value={searchMember} onChange={(e) => setSearchMember(e.target.value)} placeholder="Name oder E-Mail suchen..."
                className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2 pl-9 pr-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
            </div>
            <button onClick={() => setShowInvite(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none">
              <Plus size={13} /> Einladen
            </button>
          </div>

          {showInvite && (
            <div className="card-shimmer rounded-xl border border-[rgba(99,102,241,0.2)] bg-[var(--primary-light)] p-4 space-y-3">
              <h4 className="text-xs font-black dark:text-white text-gray-900">Neues Mitglied einladen</h4>
              <div className="grid grid-cols-3 gap-3">
                <div className="col-span-2 space-y-1">
                  <label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">E-Mail</label>
                  <input type="email" value={inviteEmail} onChange={(e) => setInviteEmail(e.target.value)} placeholder="max@firma.de"
                    className="w-full bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg py-2 px-3 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]" />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-bold uppercase dark:text-white/40 text-gray-500">Rolle</label>
                  <select value={inviteRole} onChange={(e) => setInviteRole(e.target.value)}
                    className="w-full bg-white dark:bg-black border dark:border-white/20 border-gray-200 rounded-lg py-2 px-3 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)]">
                    <option value="employee">Mitarbeiter</option>
                    <option value="department_lead">Team-Lead</option>
                    <option value="cio">CIO</option>
                    <option value="admin">Admin</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={() => { setShowInvite(false); setInviteEmail(''); }}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold dark:text-white/50 text-gray-600 cursor-pointer border dark:border-white/10 border-gray-200 bg-transparent transition-colors hover:bg-gray-100 dark:hover:bg-white/5">Abbrechen</button>
                <Link href={`/members?action=invite&email=${encodeURIComponent(inviteEmail)}&role=${encodeURIComponent(inviteRole)}`}
                  className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg bg-[var(--primary)] text-white text-xs font-bold cursor-pointer no-underline hover:opacity-90 transition-opacity">
                  <Mail size={12} /> Einladung öffnen
                </Link>
              </div>
            </div>
          )}

          <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b dark:border-white/[0.05] border-black/[0.05] bg-black/[0.01] dark:bg-white/[0.01]">
                    <th className="text-left px-4 py-3 font-bold dark:text-white/40 text-gray-500">Mitglied</th>
                    <th className="text-left px-4 py-3 font-bold dark:text-white/40 text-gray-500">Abteilung</th>
                    <th className="text-left px-4 py-3 font-bold dark:text-white/40 text-gray-500">Rolle</th>
                    <th className="text-right px-4 py-3 font-bold dark:text-white/40 text-gray-500">Aktionen</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredMembers.map((m) => (
                    <tr key={m.id} className="border-b dark:border-white/[0.03] border-black/[0.03] hover:bg-black/[0.01] dark:hover:bg-white/[0.01] transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <div className="w-7 h-7 rounded-full bg-[var(--primary-light)] flex items-center justify-center text-[10px] font-black text-[var(--primary)] shrink-0">
                            {m.name.charAt(0)}
                          </div>
                          <div>
                            <div className="font-semibold dark:text-white text-gray-900">{m.name}</div>
                            <div className="dark:text-white/30 text-gray-400">{m.email}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3 dark:text-white/60 text-gray-600">{m.department || '—'}</td>
                      <td className="px-4 py-3">
                        <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ background: `${ROLE_COLORS[m.role] || '#6b7280'}20`, color: ROLE_COLORS[m.role] || '#6b7280' }}>
                          {ROLE_LABELS[m.role] || m.role}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center gap-1 justify-end">
                          <button
                            onClick={() => openEditModal(members.find(x => x.id === m.id)!)}
                            title="Bearbeiten"
                            className="p-1.5 rounded-lg hover:bg-[var(--primary-light)] text-[var(--primary)] transition-all border-none bg-transparent cursor-pointer">
                            <Edit3 size={12} />
                          </button>
                          {deleteConfirm === m.id ? (
                            <>
                              <button onClick={() => setDeleteConfirm(null)} className="p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-white/10 text-gray-400 transition-all border-none bg-transparent cursor-pointer"><X size={12} /></button>
                              <span className="text-[9px] text-red-400 font-bold">Entfernen?</span>
                              <button className="p-1.5 rounded-lg bg-red-500/10 text-red-500 transition-all border-none cursor-pointer hover:bg-red-500/20"><Check size={12} /></button>
                            </>
                          ) : (
                            <button onClick={() => setDeleteConfirm(m.id)} className="p-1.5 rounded-lg hover:bg-red-500/10 text-red-400 hover:text-red-500 transition-all border-none bg-transparent cursor-pointer">
                              <Trash2 size={12} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-3 border-t dark:border-white/[0.05] border-black/[0.05] text-xs dark:text-white/30 text-gray-400">
              {filteredMembers.length} von {members.length} Mitgliedern
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Billing ────────────────────────────────── */}
      {activeTab === 'billing' && (
        <div className="grid lg:grid-cols-2 gap-5">
          {/* Plan selection */}
          <div className="space-y-4">
            <h3 className="text-sm font-black dark:text-white text-gray-900">Aktueller Plan</h3>
            <div className="grid sm:grid-cols-2 gap-3">
              {Object.entries(PLAN_CONFIG).map(([key, plan]) => (
                <button key={key} onClick={() => setSettings({ ...settings, plan: key })}
                  className={`p-4 rounded-xl border-2 text-left transition-all cursor-pointer bg-transparent ${settings.plan === key ? 'border-[rgba(99,102,241,0.5)] bg-[var(--primary-light)]' : 'dark:border-white/[0.06] border-black/[0.06] hover:border-[rgba(99,102,241,0.2)]'}`}>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-black" style={{ color: plan.color }}>{plan.label}</span>
                    {settings.plan === key && <Check size={14} className="text-[var(--primary)]" />}
                  </div>
                  <div className="text-[10px] dark:text-white/40 text-gray-500">{plan.members} Mitglieder max.</div>
                  <ul className="mt-2 space-y-0.5">
                    {plan.features.map((f) => (
                      <li key={f} className="text-[10px] dark:text-white/60 text-gray-600 flex items-center gap-1"><Check size={9} className="text-green-500 shrink-0" />{f}</li>
                    ))}
                  </ul>
                </button>
              ))}
            </div>
          </div>

          {/* Billing info */}
          <div className="space-y-4">
            <h3 className="text-sm font-black dark:text-white text-gray-900">Rechnungsdetails</h3>
            <div className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] overflow-hidden">
              <button
                onClick={() => setOpenBillingInfo(v => !v)}
                className={`w-full flex items-center justify-between px-4 py-3 bg-transparent border-none cursor-pointer hover:bg-black/[0.02] dark:hover:bg-white/[0.02] transition-colors ${openBillingInfo ? 'border-b dark:border-white/[0.06] border-black/[0.04]' : ''}`}
              >
                <span className="text-xs font-bold dark:text-white/50 text-gray-600">Rechnungsfelder</span>
                <span className="dark:text-white/30 text-gray-400">{openBillingInfo ? <ChevronUp size={15} /> : <ChevronDown size={15} />}</span>
              </button>
              {openBillingInfo && (
              <div className="p-4 space-y-3">
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Rechnungs-E-Mail</label>
                <input type="email" value={settings.billing_email || ''} onChange={(e) => setSettings({ ...settings, billing_email: e.target.value })} placeholder="billing@firma.de"
                  className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">USt-IdNr.</label>
                <input value={settings.tax_id || ''} onChange={(e) => setSettings({ ...settings, tax_id: e.target.value })} placeholder="DE123456789"
                  className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
              <div className="space-y-1">
                <label className="text-[9px] font-bold uppercase tracking-widest dark:text-white/40 text-gray-500">Max. Mitglieder</label>
                <input type="number" value={settings.max_members || 50} onChange={(e) => setSettings({ ...settings, max_members: parseInt(e.target.value) || 50 })} min={1} max={10000}
                  className="w-full bg-black/[0.02] dark:bg-white/[0.02] border dark:border-white/[0.1] border-black/[0.1] rounded-xl py-2.5 px-4 text-sm dark:text-white text-gray-900 outline-none focus:border-[var(--primary)] transition-all" />
              </div>
              <button onClick={handleSave} disabled={saving}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl bg-[var(--primary)] text-white text-xs font-bold hover:opacity-90 transition-opacity cursor-pointer border-none disabled:opacity-50">
                {saving ? <Loader size={13} className="animate-spin" /> : <Save size={13} />} Abrechnungsdaten speichern
              </button>
              </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB: Danger Zone ───────────────────────────── */}
      {activeTab === 'danger' && (
        <div className="space-y-4 max-w-xl">
          <div className="p-4 rounded-xl bg-amber-500/5 border border-amber-500/20 text-xs text-amber-600 dark:text-amber-400 flex items-start gap-2">
            <AlertCircle size={14} className="shrink-0 mt-0.5" />
            Aktionen in diesem Bereich können nicht rückgängig gemacht werden. Bitte mit Vorsicht vorgehen.
          </div>

          {[
            {
              title: 'Wartungsmodus aktivieren',
              desc: 'Blockiert alle nicht-Admin-Benutzer. Sinnvoll für Migrations- oder Update-Phasen.',
              action: settings.maintenance_mode ? 'Deaktivieren' : 'Aktivieren',
              color: settings.maintenance_mode ? 'bg-green-500 text-white' : 'bg-amber-500 text-white',
              onClick: async () => {
                const newVal = !settings.maintenance_mode;
                setSettings({ ...settings, maintenance_mode: newVal });
                const supabase = createClient();
                await supabase.from('system_settings').upsert({ id: 'global', maintenance_mode: newVal });
              },
            },
          ].map((action, i) => (
            <div key={i} className="card-shimmer rounded-xl border dark:border-white/[0.06] border-black/[0.06] p-4 flex items-center justify-between gap-4">
              <div>
                <div className="text-sm font-bold dark:text-white text-gray-900">{action.title}</div>
                <div className="text-xs dark:text-white/40 text-gray-500 mt-0.5">{action.desc}</div>
              </div>
              <button onClick={action.onClick}
                className={`px-4 py-2 rounded-xl text-xs font-bold cursor-pointer border-none shrink-0 hover:opacity-90 transition-opacity ${action.color}`}>
                {action.action}
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
