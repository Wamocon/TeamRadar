-- ============================================================
-- Migration: super_admin Rolle hinzufügen
-- Datum: 2026-04-13
--
-- Zweck: Fügt eine neue "super_admin"-Rolle hinzu, die über
--        "admin" steht (Hierarchie: super_admin > admin > cio
--        > department_lead > employee).
--
-- Diese Migration muss in allen aktiven Schemas ausgeführt
-- werden. Standardmäßig wird "teamradar-dev" angepasst.
-- Für Produktion zusätzlich "teamradar-prod" verwenden.
--
-- ⚠️  PROD: Nach dem Ausführen dieser Migration kann Nikolaj
--     Schefners Rolle auf 'super_admin' gesetzt werden (s.u.)
-- ============================================================

-- ── 1. CHECK-Constraint in teamradar-dev erweitern ────────
DO $$
BEGIN
  -- Alten Constraint entfernen (Name aus Migration bekannt)
  ALTER TABLE "teamradar-dev".user_profiles
    DROP CONSTRAINT IF EXISTS user_profiles_role_check;

  -- Neuen Constraint mit super_admin hinzufügen
  ALTER TABLE "teamradar-dev".user_profiles
    ADD CONSTRAINT user_profiles_role_check
    CHECK (role IN ('super_admin', 'admin', 'cio', 'department_lead', 'employee'));

  RAISE NOTICE 'teamradar-dev: CHECK-Constraint für role aktualisiert.';
END $$;

-- ── 2. CHECK-Constraint in teamradar-test erweitern ───────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'teamradar-test') THEN
    ALTER TABLE "teamradar-test".user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_role_check;

    ALTER TABLE "teamradar-test".user_profiles
      ADD CONSTRAINT user_profiles_role_check
      CHECK (role IN ('super_admin', 'admin', 'cio', 'department_lead', 'employee'));

    RAISE NOTICE 'teamradar-test: CHECK-Constraint für role aktualisiert.';
  END IF;
END $$;

-- ── 3. CHECK-Constraint in teamradar-prod erweitern ───────
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'teamradar-prod') THEN
    ALTER TABLE "teamradar-prod".user_profiles
      DROP CONSTRAINT IF EXISTS user_profiles_role_check;

    ALTER TABLE "teamradar-prod".user_profiles
      ADD CONSTRAINT user_profiles_role_check
      CHECK (role IN ('super_admin', 'admin', 'cio', 'department_lead', 'employee'));

    RAISE NOTICE 'teamradar-prod: CHECK-Constraint für role aktualisiert.';
  END IF;
END $$;

-- ── 4. RLS-Policy: super_admin hat dieselben Rechte wie admin ─
-- Die bestehenden Policies prüfen role = 'admin'. Da super_admin
-- eine neue separate Rolle ist, müssen die Policies erweitert werden.
-- Dies betrifft alle Tabellen mit admin-spezifischen Policies.

-- Hinweis: Falls die Policies dynamisch per Funktion prüfen
-- (get_user_role_for_schema), muss auch diese Funktion angepasst
-- werden, wenn sie speziell nur 'admin' erlaubt.

-- Beispielhafte Policy-Erweiterung für system_settings (admin-only):
DO $$
DECLARE
  target_schema TEXT := 'teamradar-dev';
BEGIN
  -- system_settings: SELECT + UPDATE nur für admin/super_admin
  EXECUTE format('
    DROP POLICY IF EXISTS "admin_manage_settings" ON %I.system_settings;
    CREATE POLICY "admin_manage_settings" ON %I.system_settings
      USING (public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin''));
  ', target_schema, target_schema, target_schema);
  RAISE NOTICE 'Policy system_settings für super_admin erweitert.';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'Policy system_settings nicht gefunden, wird übersprungen.';
END $$;

-- ── 5. PROD: Nikolaj Schefners Rolle auf super_admin setzen ─
-- !!! NUR IN PRODUKTION AUSFÜHREN !!!
-- Vorher sicherstellen dass der CHECK-Constraint (Schritt 3)
-- bereits ausgeführt wurde.
--
-- UPDATE "teamradar-prod".user_profiles
-- SET role = 'super_admin'
-- WHERE email = 'nikolaj.schefner@wamocon.de'   -- E-Mail ggf. anpassen
--    OR display_name ILIKE 'Nikolaj Schefner';
--
-- Ergebnis prüfen:
-- SELECT id, email, display_name, role
-- FROM "teamradar-prod".user_profiles
-- WHERE email = 'nikolaj.schefner@wamocon.de'
--    OR display_name ILIKE 'Nikolaj Schefner';
