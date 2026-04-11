'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

/**
 * Aktualisiert das Profil des aktuell angemeldeten Benutzers
 */
export async function updateUserProfileAction(data: {
  displayName?: string;
  avatarUrl?: string;
  statusMessage?: string;
  phone?: string;
  preferences?: any;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Nicht authentifiziert' };

    const sanitizeUrl = (url: string | undefined) =>
      url && /^https?:\/\//.test(url) ? url : undefined;

    const { error } = await supabase
      .from('profiles')
      .update({
        display_name: data.displayName,
        avatar_url: sanitizeUrl(data.avatarUrl),
        status_message: data.statusMessage,
        phone: data.phone,
        preferences: data.preferences
      })
      .eq('id', user.id);

    if (error) throw error;
    
    revalidatePath('/settings/profile');
    return { success: true };
  } catch (err: any) {
    console.error('Update Profile Error:', err);
    return { error: err.message || 'Fehler beim Aktualisieren des Profils' };
  }
}

/**
 * Aktualisiert die globalen Systemeinstellungen (Nur für Admins)
 */
export async function updateSystemSettingsAction(data: {
  orgName?: string;
  orgLogoUrl?: string;
  supportEmail?: string;
  maintenanceMode?: boolean;
}) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { error: 'Nicht authentifiziert' };

    // Rolle prüfen
    const { data: profile } = await supabase
      .from('profiles')
      .select('role')
      .eq('id', user.id)
      .single();

    if (profile?.role !== 'admin') {
      return { error: 'Nicht autorisiert' };
    }

    const sanitizeUrl = (url: string | undefined) =>
      url && /^https?:\/\//.test(url) ? url : undefined;

    const { error } = await supabase
      .from('system_settings')
      .update({
        org_name: data.orgName,
        org_logo_url: sanitizeUrl(data.orgLogoUrl),
        support_email: data.supportEmail,
        maintenance_mode: data.maintenanceMode,
        updated_at: new Date().toISOString()
      })
      .eq('id', 'global');

    if (error) throw error;

    revalidatePath('/settings/admin');
    return { success: true };
  } catch (err: any) {
    console.error('Update System Settings Error:', err);
    return { error: err.message || 'Fehler beim Aktualisieren der Einstellungen' };
  }
}

/**
 * Lädt die globalen Systemeinstellungen
 */
export async function getSystemSettingsAction() {
  try {
    const supabase = await createClient();
    const { data, error } = await supabase
      .from('system_settings')
      .select('*')
      .eq('id', 'global')
      .single();

    if (error) throw error;
    return { data };
  } catch (err) {
    console.error('Get System Settings Error:', err);
    return { error: 'Fehler beim Laden der Einstellungen' };
  }
}
