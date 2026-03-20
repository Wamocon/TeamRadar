'use client';
import { Settings } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="p-6 max-w-3xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-black dark:text-white text-gray-900 flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-teal-400/20 border border-blue-500/20 flex items-center justify-center">
            <Settings size={20} className="text-blue-400" />
          </div>
          Einstellungen
        </h1>
        <p className="text-sm dark:text-white/40 text-gray-500 mt-1">
          App-Konfiguration und Verbindungen
        </p>
      </div>

      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5 space-y-4">
        <h2 className="text-sm font-bold dark:text-white/70 text-gray-700">Supabase-Verbindung</h2>
        <p className="text-xs dark:text-white/40 text-gray-500">
          Die Supabase-Konfiguration wird über Umgebungsvariablen in der <code>.env.local</code>-Datei gesteuert.
          Setze <code>NEXT_PUBLIC_SUPABASE_URL</code> und <code>NEXT_PUBLIC_SUPABASE_ANON_KEY</code>, um die
          Cloud-Synchronisation zu aktivieren.
        </p>
        <div className="rounded-lg border border-black/[0.06] dark:border-white/[0.06] p-3">
          <div className="text-[10px] font-bold uppercase tracking-widest dark:text-white/20 text-gray-400 mb-1.5">Status</div>
          <div className="flex items-center gap-2">
            <span className={`w-2 h-2 rounded-full ${
              process.env.NEXT_PUBLIC_SUPABASE_URL ? 'bg-green-500' : 'bg-gray-400'
            }`} />
            <span className="text-xs dark:text-white/60 text-gray-600">
              {process.env.NEXT_PUBLIC_SUPABASE_URL ? 'Verbunden' : 'Nicht konfiguriert (lokaler Modus)'}
            </span>
          </div>
        </div>
      </div>

      <div className="card-shimmer rounded-xl border border-black/[0.06] dark:border-white/[0.06] p-5 space-y-4">
        <h2 className="text-sm font-bold dark:text-white/70 text-gray-700">Über TeamRadar</h2>
        <p className="text-xs dark:text-white/40 text-gray-500">
          TeamRadar hilft dir, die Verfügbarkeit deiner Mitarbeiter im Blick zu behalten.
          Erstelle Mitarbeiterprofile, trage Verfügbarkeiten ein und organisiere dein Team in Gruppen.
        </p>
        <div className="text-[10px] dark:text-white/20 text-gray-400">Version 1.0.0</div>
      </div>
    </div>
  );
}
