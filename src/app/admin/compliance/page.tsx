'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, UserCheck, AlertOctagon, CheckCircle2, Clock, Search, Filter } from 'lucide-react';

interface UserConsent {
  user_id: string;
  email: string;
  display_name: string;
  consent_type: string;
  status: boolean;
  version: string;
  accepted_at: string;
}

export default function ComplianceDashboard() {
  const [consents, setConsents] = useState<UserConsent[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    async function fetchComplianceData() {
      try {
        const supabase = createClient();
        
        // Join profiles with user_consents
        const { data, error: fetchError } = await supabase
          .from('profiles')
          .select(`
            id,
            email,
            display_name,
            user_consents (
              consent_type,
              status,
              version,
              accepted_at
            )
          `);

        if (fetchError) throw fetchError;

        // Flatten data
        const flattened: UserConsent[] = [];
        data.forEach((profile: any) => {
          if (profile.user_consents && profile.user_consents.length > 0) {
            profile.user_consents.forEach((c: any) => {
              flattened.push({
                user_id: profile.id,
                email: profile.email,
                display_name: profile.display_name,
                ...c
              });
            });
          } else {
            // Profile without consent (Legacy or incomplete)
            flattened.push({
              user_id: profile.id,
              email: profile.email,
              display_name: profile.display_name,
              consent_type: 'ALL',
              status: false,
              version: 'none',
              accepted_at: ''
            });
          }
        });

        setConsents(flattened);
      } catch (err: any) {
        console.error('Compliance Data Fetch Error:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    }

    fetchComplianceData();
  }, []);

  const filteredConsents = consents.filter(c => 
    c.email.toLowerCase().includes(searchTerm.toLowerCase()) || 
    c.display_name?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-4 sm:p-6 w-full space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center text-white shadow-lg shadow-indigo-500/20 border border-white/10 dark:border-white/5">
            <ShieldCheck size={22} />
          </div>
          Compliance Governance
        </h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
          Administration und Auswertung der rechtlichen Zustimmungsdaten (AGB & Datenschutz).
        </p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {[
          { label: 'Gesamtnutzer', value: new Set(consents.map(c => c.user_id)).size, icon: UserCheck, color: 'text-blue-500', bg: 'bg-blue-500/10' },
          { label: 'Vollständig konform', value: new Set(consents.filter(c => c.status).map(c => c.user_id)).size, icon: CheckCircle2, color: 'text-emerald-500', bg: 'bg-emerald-500/10' },
          { label: 'Offene Zustimmungen', value: new Set(consents.filter(c => !c.status).map(c => c.user_id)).size, icon: AlertOctagon, color: 'text-amber-500', bg: 'bg-amber-500/10' },
        ].map((stat) => (
          <div key={stat.label} className="card-shimmer rounded-2xl p-5 border border-black/5 dark:border-white/5 bg-white dark:bg-white/2">
            <div className="flex items-center justify-between mb-3">
              <div className={`p-2 rounded-lg ${stat.bg} ${stat.color}`}>
                <stat.icon size={18} />
              </div>
              <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{stat.label}</span>
            </div>
            <div className="text-3xl font-black dark:text-white text-gray-900">{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter & Search */}
      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1 w-full">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" size={18} />
          <input 
            type="text" 
            placeholder="Nutzer suchen (E-Mail, Name)..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-black/8 dark:border-white/8 bg-white dark:bg-slate-900/50 text-sm outline-none focus:ring-2 focus:ring-indigo-500/20 transition-all"
          />
        </div>
        <button className="flex items-center gap-2 px-4 py-3 rounded-xl border border-black/8 dark:border-white/8 bg-white dark:bg-slate-900/50 text-sm font-semibold hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
          <Filter size={18} className="text-gray-400" />
          Filter
        </button>
      </div>

      {/* Table */}
      <div className="card-shimmer rounded-2xl border border-black/8 dark:border-white/8 overflow-hidden bg-white dark:bg-white/2">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm border-collapse">
            <thead>
              <tr className="border-b border-black/8 dark:border-white/8 bg-gray-50/50 dark:bg-white/2">
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">Nutzer</th>
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">E-Mail</th>
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">Typ</th>
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">Status</th>
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">Version</th>
                <th className="px-6 py-4 font-bold text-gray-500 dark:text-white/40 uppercase tracking-wider text-[10px]">Zeitpunkt</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-black/4 dark:divide-white/4">
              {loading ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">Lädt Compliance-Daten...</td>
                </tr>
              ) : error ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-red-500">Fehler: {error}</td>
                </tr>
              ) : filteredConsents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="px-6 py-20 text-center text-gray-400">Keine Daten gefunden.</td>
                </tr>
              ) : (
                filteredConsents.map((c, i) => (
                  <tr key={`${c.user_id}-${c.consent_type}-${i}`} className="hover:bg-gray-50 dark:hover:bg-white/2 transition-colors">
                    <td className="px-6 py-4 font-bold dark:text-white text-gray-900">{c.display_name || 'N/A'}</td>
                    <td className="px-6 py-4 text-gray-500 dark:text-white/60">{c.email}</td>
                    <td className="px-6 py-4">
                      <span className="px-2 py-1 rounded bg-slate-100 dark:bg-white/5 text-[10px] font-black uppercase text-slate-500 dark:text-white/40 border border-black/5 dark:border-white/5">
                        {c.consent_type}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      {c.status ? (
                        <div className="flex items-center gap-2 text-emerald-500 font-bold">
                          <CheckCircle2 size={14} />
                          <span>Akzeptiert</span>
                        </div>
                      ) : (
                        <div className="flex items-center gap-2 text-amber-500 font-bold italic">
                          <AlertOctagon size={14} />
                          <span>Unvollständig</span>
                        </div>
                      )}
                    </td>
                    <td className="px-6 py-4 text-gray-500 dark:text-white/40 font-mono text-xs">{c.version}</td>
                    <td className="px-6 py-4 text-gray-400 dark:text-white/30 text-xs">
                      {c.accepted_at ? new Date(c.accepted_at).toLocaleString('de-DE') : '—'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Note */}
      <div className="p-4 rounded-xl bg-blue-500/5 border border-blue-500/10 flex items-start gap-3">
        <Clock size={16} className="text-blue-500 shrink-0 mt-0.5" />
        <div className="text-xs text-blue-600/80 dark:text-blue-400/60 leading-relaxed">
          <strong>Hinweis:</strong> Bestandsnutzer, die vor der Einführung der Pflichtzustimmung registriert wurden, werden als "Unvollständig" markiert. Dies ist eine geplante Rollout-Entscheidung und stellt keinen Datenfehler dar.
        </div>
      </div>
    </div>
  );
}
