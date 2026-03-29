-- Migration: User Consent Tracking for TeamRadar
-- Erstellt am: 2026-03-29

-- Tabelle für die Speicherung der rechtlichen Zustimmungen
CREATE TABLE IF NOT EXISTS public.user_consents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    consent_type TEXT NOT NULL, -- 'agb', 'datenschutz', 'dsgvo'
    status BOOLEAN NOT NULL DEFAULT FALSE,
    version TEXT NOT NULL, -- Versionsnummer der Texte, z.B. '2026-03'
    ip_address TEXT,
    user_agent TEXT,
    accepted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    
    -- Ein Nutzer kann für einen Typ und eine Version nur eine aktive Zustimmung haben
    UNIQUE(user_id, consent_type, version)
);

-- RLS Policies
ALTER TABLE public.user_consents ENABLE ROW LEVEL SECURITY;

-- Nutzer können ihre eigenen Zustimmungen sehen
CREATE POLICY "Users can view own consents" 
ON public.user_consents FOR SELECT 
USING (auth.uid() = user_id);

-- Administratoren können alle Zustimmungen sehen
CREATE POLICY "Admins can view all consents" 
ON public.user_consents FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.profiles 
    WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
  )
);

-- Kommentar für die Tabelle
COMMENT ON TABLE public.user_consents IS 'Speichert die rechtlichen Zustimmungen (AGB, Datenschutz) der Nutzer versioniert und zeitgestempelt.';
