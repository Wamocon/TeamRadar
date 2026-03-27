-- ============================================================
-- TeamRadar – Admin-Berechtigung für Nikolaj Schefner
-- 
-- Führe dieses Skript im Supabase SQL Editor aus.
-- Es setzt den Benutzer global (via public.profiles) zum Admin.
-- ============================================================

DO $$
DECLARE
    v_user_id TEXT;
BEGIN
    -- E-Mail-Adresse hier anpassen falls nötig
    SELECT id::text INTO v_user_id FROM auth.users WHERE email = 'nikolaj.schefner@wamocon.com';
    
    IF v_user_id IS NOT NULL THEN
        -- Profil anlegen oder aktualisieren
        INSERT INTO public.profiles (id, email, role, display_name)
        VALUES (v_user_id::uuid, 'nikolaj.schefner@wamocon.com', 'admin', 'Nikolaj Schefner')
        ON CONFLICT (id) DO UPDATE SET role = 'admin';
        
        RAISE NOTICE 'Erfolgreich: User % (Nikolaj) ist nun Admin.', v_user_id;
    ELSE
        RAISE EXCEPTION 'Fehler: User mit der Email nikolaj.schefner@wamocon.com wurde nicht in auth.users gefunden. Bitte stelle sicher, dass du dich bereits einmal in der App angemeldet hast.';
    END IF;
END $$;
