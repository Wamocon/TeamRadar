'use server';
import { createClient, createAdminClient } from '@/lib/supabase/server';

/**
 * Lädt einen Benutzer via Admin-API zu TeamRadar ein
 * Align with AWAY: Metadata includes role, display_name, and department.
 */
export async function inviteUserByEmail(email: string, role: string, origin: string, displayName?: string, department?: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Nicht authentifiziert' };

    // In TeamRadar prüfen wir die Rolle in 'profiles'
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { error: 'Nur Administratoren können Personen einladen.' };
    }

    const adminClient = await createAdminClient();
    const { error: inviteError } = await adminClient.auth.admin.inviteUserByEmail(email, {
      data: { 
        role: role,
        display_name: displayName || '',
        department: department || ''
      },
      redirectTo: `${origin}/auth/accept-invite?role=${role}`,
    });

    if (inviteError) {
      console.error('TeamRadar Invite Error:', inviteError);
      let msg = inviteError.message;
      if (msg.includes('email rate limit exceeded')) {
        msg = 'E-Mail-Limit überschritten. Bitte warte eine Stunde.';
      } else if (msg.includes('User already registered')) {
        msg = 'Dieser Benutzer ist bereits registriert.';
      }
      return { error: msg };
    }

    return { success: true };
  } catch (err) {
    console.error('TeamRadar Fehler bei der Einladung:', err);
    return { error: 'Server-Fehler bei der Einladung.' };
  }
}

/**
 * Registrierung abschließen für TeamRadar:
 * 1. Setzt die Rolle des Nutzers in der 'profiles' Tabelle (im aktuellen Schema)
 */
export async function completeInvitationAction(role: string) {
  try {
    const supabase = await createClient();
    const { data: { session }, error: authError } = await supabase.auth.getSession();
    
    if (authError || !session) {
      throw new Error('Nicht authentifiziert');
    }

    const userId = session.user.id;
    const admin = await createAdminClient();

    // 1. In 'profiles' einfügen (upsert)
    const { error: profileError } = await admin
      .from('profiles')
      .upsert({
        id: userId,
        email: session.user.email,
        display_name: session.user.user_metadata?.display_name || session.user.user_metadata?.name || 'Benutzer',
        department: session.user.user_metadata?.department || '',
        role: role
      }, { onConflict: 'id' });

    if (profileError) {
      console.error('Profile Upsert Error:', profileError);
      throw new Error(`Konnte Profil nicht setzen: ${profileError.message}`);
    }

    console.log(`[AUTH] TeamRadar: Invitation completed for user ${userId} (Role: ${role})`);
    return { success: true };
  } catch (err) {
    console.error('SERVER ACTION ERROR (TeamRadar completeInvitation):', err);
    throw err instanceof Error ? err : new Error('Ein unbekannter Fehler ist aufgetreten');
  }
}
