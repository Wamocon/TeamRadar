'use client';
import { useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from './Sidebar';
import { Footer } from './Footer';
import { useAppStore } from '@/stores/appStore';
import { AlertTriangle, Loader2, Menu } from 'lucide-react';

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const pathname = usePathname();
  const loadFromSupabase = useAppStore((s) => s.loadFromSupabase);
  const isLoading = useAppStore((s) => s.isLoading);
  const dbError = useAppStore((s) => s.dbError);

  const isAuthPage = pathname.startsWith('/auth/');

  useEffect(() => {
    if (!isAuthPage) {
      void loadFromSupabase();
    }
  }, [isAuthPage, loadFromSupabase]);

  if (isAuthPage) return <>{children}</>;

  return (
    <div className="flex overflow-hidden h-screen bg-slate-100 dark:bg-[#060810]">
      <Sidebar isOpen={mobileMenuOpen} onClose={() => setMobileMenuOpen(false)} />
      
      <main className="flex-1 overflow-y-auto main-content bg-slate-50 dark:bg-transparent">
        <div className="min-h-full flex flex-col">
          {/* Mobile Menu Toggle (Floating) */}
          <button 
            onClick={() => setMobileMenuOpen(true)}
            className="md:hidden fixed top-4 right-4 z-40 p-2 rounded-xl bg-blue-600 text-white shadow-lg border-none"
          >
            <Menu size={20} />
          </button>

          <div className="flex-1">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 gap-3">
                <Loader2 size={20} className="animate-spin text-blue-500" />
                <span className="text-sm text-white/40">Daten werden geladen…</span>
              </div>
            ) : dbError ? (
              <div className="m-6 p-4 rounded-xl border border-red-500/20 bg-red-500/10 flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-400 mt-0.5 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-red-400">Datenbankfehler</p>
                  <p className="text-xs text-red-400/70 mt-1">{dbError}</p>
                </div>
              </div>
            ) : children}
          </div>
          <Footer />
        </div>
      </main>
    </div>
  );
}
