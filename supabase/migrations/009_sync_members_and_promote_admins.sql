-- ============================================================
-- TeamRadar – Synchronisierung von Members zu Profiles & Admin-Promotion
-- 
-- Dieses Skript stellt sicher, dass alle Personen in der 'members' Tabelle 
-- ein entsprechendes Profil in 'profiles' haben und setzt die gewünschten 
-- Nutzer auf den Admin-Status.
-- ============================================================

DO $$
DECLARE
    s_name TEXT;
    schemas TEXT[] := ARRAY['public', 'test', 'prod'];
BEGIN
    FOREACH s_name IN ARRAY schemas LOOP
        -- Prüfen, ob das Schema existiert
        IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s_name) THEN
            EXECUTE format('SET search_path TO %I, auth', s_name);

            -- 0. Sicherstellen, dass die Spalte 'department' existiert
            ALTER TABLE profiles ADD COLUMN IF NOT EXISTS department TEXT;

            -- 1. Synchronisierung: Members zu Profiles (Backfill)
            -- Wir nutzen die Daten aus 'members', um fehlende Profile zu ergänzen.
            -- Wir nutzen DISTINCT ON (user_id), falls ein Nutzer mehrfach in 'members' steht.
            INSERT INTO profiles (id, email, display_name, department, role)
            SELECT DISTINCT ON (m.user_id)
                m.user_id, 
                m.email, 
                m.name, 
                m.department, 
                'employee' -- Standardrolle für den Import
            FROM members m
            ORDER BY m.user_id, m.created_at DESC
            ON CONFLICT (id) DO UPDATE SET
                email = EXCLUDED.email,
                -- Nur aktualisieren, wenn im Profil noch nichts steht (COALESCE)
                display_name = COALESCE(profiles.display_name, EXCLUDED.display_name),
                department = COALESCE(profiles.department, EXCLUDED.department);
            
            RAISE NOTICE 'Schema %: Members erfolgreich mit Profiles synchronisiert.', s_name;

            -- 2. Admin-Promotion: Spezifische Nutzer hochstufen
            UPDATE profiles 
            SET role = 'admin' 
            WHERE email IN (
                'erwin.moretz@wamocon.com', 
                'daniel.moretz@wamocon.com', 
                'waleri.moretz@wamocon.com'
            );
            
            RAISE NOTICE 'Schema %: Admin-Status für Moretz-Team aktualisiert.', s_name;
        END IF;
    END LOOP;
END $$;
