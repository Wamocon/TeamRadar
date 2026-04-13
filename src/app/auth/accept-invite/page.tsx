'use client';
import { useState, useEffect, useRef, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Users, Eye, EyeOff, Loader, AlertCircle, Lock, CheckCircle } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { completeInvitationAction, saveConsentAction } from '@/lib/actions/authActions';

function AcceptInviteContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const role = searchParams.get('role');

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(false);
  const [checkingSession, setCheckingSession] = useState(true);
  const [agbAccepted, setAgbAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const checkingSessionRef = useRef(checkingSession);

  useEffect(() => {
    checkingSessionRef.current = checkingSession;
  }, [checkingSession]);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;

    console.log('TeamRadar: Component mounted, checking session...');

    const timeout = setTimeout(() => {
      if (mounted && checkingSessionRef.current) {
        console.warn('TeamRadar AcceptInvite: Session detection timed out.');
        setCheckingSession(false);
        setError('Keine aktive Einladung gefunden. Bitte stelle sicher, dass du den Link aus der E-Mail geklickt hast.');
      }
    }, 5000);

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log(`Auth Event in TeamRadar: ${event}`, session ? 'Session FOUND' : 'NO session');
      if (mounted && session) {
        setCheckingSession(false);
        setError(''); 
      }
    });

    const checkSessionManually = async () => {
      const { data: { session: existingSession } } = await supabase.auth.getSession();
      if (mounted && existingSession) {
        setCheckingSession(false);
        setError('');
        return;
      }

      if (typeof window !== 'undefined' && window.location.hash) {
        const params = new URLSearchParams(window.location.hash.substring(1));
        const accessToken = params.get('access_token');
        const refreshToken = params.get('refresh_token');

        const isJwt = (t: string) => /^[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+\.[A-Za-z0-9_-]+$/.test(t);
        if (accessToken && refreshToken && isJwt(accessToken) && isJwt(refreshToken)) {
          const { data: { session: newSession }, error: setSessionError } = await supabase.auth.setSession({
            access_token: accessToken,
            refresh_token: refreshToken,
          });
          if (!setSessionError && newSession && mounted) {
            setCheckingSession(false);
            setError('');
          }
        }
      }
    };

    checkSessionManually();

    return () => {
      mounted = false;
      subscription.unsubscribe();
      clearTimeout(timeout);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (password.length < 6) {
      setError('Das Passwort muss mindestens 6 Zeichen lang sein.');
      return;
    }

    if (password !== confirmPassword) {
      setError('Die Passwörter stimmen nicht überein.');
      return;
    }

    if (!role) {
      setError('Fehlende Einladungsdaten (Rolle).');
      return;
    }

    setLoading(true);
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error('Nutzer-ID nicht gefunden.');

      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;

      // 1. Profil vervollständigen (Rolle setzen)
      const result = await completeInvitationAction(role);
      if (result && 'error' in result && result.error) throw new Error(result.error as string);

      // 2. Zustimmungen speichern
      const consentResult = await saveConsentAction(user.id, ['agb', 'datenschutz', 'dsgvo']);
      if (consentResult.error) throw new Error(consentResult.error);

      setSuccess(true);
      setTimeout(() => {
        router.push('/'); // TeamRadar's home/dashboard
      }, 2000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Ein Fehler ist aufgetreten.');
    } finally {
      setLoading(false);
    }
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950">
        <Loader className="animate-spin text-indigo-600" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex bg-gray-50 dark:bg-slate-950">
      {/* Visual Panel */}
      <div className="hidden lg:flex flex-col justify-between p-12 w-[450px] shrink-0 bg-indigo-700 text-white">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-white/20 backdrop-blur flex items-center justify-center">
            <Users size={24} />
          </div>
          <div>
            <div className="font-bold text-xl leading-none">TeamRadar</div>
            <div className="text-[10px] opacity-60 uppercase tracking-widest mt-1">Verfügbarkeit</div>
          </div>
        </div>

        <div>
           <h2 className="text-4xl font-black mb-4 leading-tight">Willkommen im Team.</h2>
           <p className="opacity-70 text-sm leading-relaxed max-w-xs">
             Verwalte deine Verfügbarkeit und bleibe mit deinem Team in Verbindung.
           </p>
        </div>

        <div className="space-y-4">
          <div className="flex items-center gap-3 text-sm opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
            Einfache Zeitmeldung
          </div>
          <div className="flex items-center gap-3 text-sm opacity-60">
            <div className="w-1.5 h-1.5 rounded-full bg-indigo-300" />
            Team-Ansichten & Planung
          </div>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-sm">
          <h1 className="text-3xl font-black mb-2 text-slate-950 dark:text-white mt-12 lg:mt-0">Registrierung</h1>
          <p className="text-slate-500 text-sm mb-8">Setze dein Passwort, um deine Registrierung abzuschließen.</p>

          {success ? (
            <div className="bg-green-50 dark:bg-green-500/10 border border-green-200 dark:border-green-500/20 p-8 rounded-2xl text-center">
              <CheckCircle className="mx-auto mb-4 text-green-600 dark:text-green-500" size={48} />
              <h3 className="font-bold text-xl mb-1 text-green-700 dark:text-green-500">Fast geschafft!</h3>
              <p className="text-slate-500 dark:text-slate-400 text-sm">Dein Account wurde aktiviert. Wir leiten dich weiter...</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500">Neues Passwort</label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    className="w-full bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-xl py-3 pl-12 pr-12 text-sm focus:border-indigo-500 dark:focus:border-indigo-500 focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all"
                    placeholder="Minimal 6 Zeichen"
                    required
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-indigo-600 transition-colors">
                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="space-y-4 pt-2">
                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={agbAccepted}
                      onChange={e => setAgbAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                      required
                    />
                  </div>
                  <span className="text-xs text-slate-500 leading-normal group-hover:text-slate-700 transition-colors">
                    Ich akzeptiere die <a href="/agb" target="_blank" className="text-indigo-600 font-bold hover:underline">Allgemeinen Geschäftsbedingungen (AGB)</a> von TeamRadar.
                  </span>
                </label>

                <label className="flex items-start gap-3 cursor-pointer group">
                  <div className="pt-0.5">
                    <input
                      type="checkbox"
                      checked={privacyAccepted}
                      onChange={e => setPrivacyAccepted(e.target.checked)}
                      className="w-4 h-4 rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 transition-all cursor-pointer"
                      required
                    />
                  </div>
                  <span className="text-xs text-slate-500 leading-normal group-hover:text-slate-700 transition-colors">
                    Ich habe die <a href="/datenschutz" target="_blank" className="text-indigo-600 font-bold hover:underline">Datenschutzerklärung</a> zur Kenntnis genommen und willige in die Verarbeitung meiner Daten ein.
                  </span>
                </label>
              </div>

              {error && (
                <div className="bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-500 p-4 rounded-xl text-xs flex gap-3">
                  <AlertCircle size={16} className="shrink-0" />
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white font-bold py-4 rounded-xl transition-all shadow-lg shadow-indigo-600/20 disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {loading && <Loader size={18} className="animate-spin" />}
                {loading ? 'Aktivierung...' : 'Registrierung abschließen'}
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

export default function TeamRadarAcceptInvitePage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center"><Loader className="animate-spin text-indigo-600" size={32} /></div>}>
      <AcceptInviteContent />
    </Suspense>
  );
}
