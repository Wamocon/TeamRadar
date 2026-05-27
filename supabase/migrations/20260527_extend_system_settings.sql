-- ============================================================
-- TeamRadar – system_settings Erweiterung
-- Datum: 2026-05-27
-- Fügt fehlende Spalten für Organisationsverwaltung hinzu
-- ============================================================

SET search_path TO "teamradar-dev";

-- Fehlende Spalten hinzufügen (idempotent mit DO-Block)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'phone') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN phone TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'website') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN website TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'address') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN address TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'city') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN city TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'country') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN country TEXT DEFAULT 'Deutschland';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'tax_id') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN tax_id TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'billing_email') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN billing_email TEXT;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'plan') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN plan TEXT DEFAULT 'team';
  END IF;
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_schema = 'teamradar-dev' AND table_name = 'system_settings' AND column_name = 'max_members') THEN
    ALTER TABLE "teamradar-dev".system_settings ADD COLUMN max_members INTEGER DEFAULT 50;
  END IF;
END $$;

-- INSERT-Policy hinzufügen falls nicht vorhanden (benötigt für upsert)
DROP POLICY IF EXISTS "system_settings_admin_insert" ON "teamradar-dev".system_settings;
CREATE POLICY "system_settings_admin_insert"
  ON "teamradar-dev".system_settings
  FOR INSERT
  WITH CHECK (public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'super_admin'));

-- UPDATE-Policy erweitern für super_admin
DROP POLICY IF EXISTS "system_settings_admin_write" ON "teamradar-dev".system_settings;
CREATE POLICY "system_settings_admin_write"
  ON "teamradar-dev".system_settings
  FOR UPDATE
  USING (public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'super_admin'));
