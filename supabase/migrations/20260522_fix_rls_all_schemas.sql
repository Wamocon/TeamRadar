-- ============================================================
-- Migration: RLS für alle drei Schemas korrekt setzen
-- Datum: 2026-05-22
--
-- Problem:
--   1. Die vorherigen Migrations hatten 'teamradar-dev' fest
--      kodiert. teamradar-test und teamradar-prod hatten die
--      alten, restriktiven Policies aus der ursprünglichen
--      Schema-Migration.
--   2. Der Admin-Client wurde durch den fehlerhaften
--      startsWith('eyJ') Check nie verwendet (neue Keys
--      beginnen mit 'sb_secret_'). Server-Actions schrieben
--      deshalb über den Anon-Client und wurden von RLS geblockt.
--
-- Diese Migration:
--   - Setzt korrekte SELECT/INSERT/UPDATE/DELETE Policies
--     für alle drei Schemas idempotent.
--   - SELECT erlaubt allen authentifizierten Usern alles zu sehen.
--   - Schreibzugriff über Server Actions mit Service-Role-Key
--     umgeht RLS automatisch → Policies sind für Browser-Direkt-
--     zugriffe als Sicherheitsnetz gedacht.
-- ============================================================

-- ============================================================
-- Hilfsfunktion: Policies für ein Schema setzen
-- ============================================================
CREATE OR REPLACE FUNCTION public.setup_teamradar_rls(p_schema TEXT)
RETURNS void AS $$
BEGIN

  -- Sicherstellen dass RLS aktiviert ist
  EXECUTE format('ALTER TABLE %I.members         ENABLE ROW LEVEL SECURITY', p_schema);
  EXECUTE format('ALTER TABLE %I.availabilities  ENABLE ROW LEVEL SECURITY', p_schema);
  EXECUTE format('ALTER TABLE %I.teams           ENABLE ROW LEVEL SECURITY', p_schema);
  EXECUTE format('ALTER TABLE %I.projects        ENABLE ROW LEVEL SECURITY', p_schema);
  EXECUTE format('ALTER TABLE %I.allocations     ENABLE ROW LEVEL SECURITY', p_schema);

  -- ── MEMBERS ────────────────────────────────────────────────
  EXECUTE format('DROP POLICY IF EXISTS "RBAC Members"           ON %I.members', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Members SELECT all"     ON %I.members', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Members INSERT admin"   ON %I.members', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Members UPDATE admin"   ON %I.members', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Members DELETE admin"   ON %I.members', p_schema);

  -- Alle eingeloggten User dürfen alle Mitarbeiter sehen
  EXECUTE format(
    'CREATE POLICY "Members SELECT all" ON %I.members
     FOR SELECT USING (auth.role() = ''authenticated'')',
    p_schema
  );
  -- Erstellen: Admin/CIO oder eigener Datensatz
  EXECUTE format(
    'CREATE POLICY "Members INSERT admin" ON %I.members
     FOR INSERT WITH CHECK (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'')
       OR auth.uid() = user_id
     )',
    p_schema, p_schema
  );
  -- Ändern: Admin/CIO/DL oder eigener Datensatz
  EXECUTE format(
    'CREATE POLICY "Members UPDATE admin" ON %I.members
     FOR UPDATE USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
     )',
    p_schema, p_schema
  );
  -- Löschen: Admin/CIO
  EXECUTE format(
    'CREATE POLICY "Members DELETE admin" ON %I.members
     FOR DELETE USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'')
     )',
    p_schema, p_schema
  );

  -- ── AVAILABILITIES ─────────────────────────────────────────
  EXECUTE format('DROP POLICY IF EXISTS "RBAC Availabilities"        ON %I.availabilities', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Avail SELECT all"           ON %I.availabilities', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Avail INSERT own or admin"  ON %I.availabilities', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Avail UPDATE own or admin"  ON %I.availabilities', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Avail DELETE own or admin"  ON %I.availabilities', p_schema);

  -- Alle sehen den gesamten Team-Kalender
  EXECUTE format(
    'CREATE POLICY "Avail SELECT all" ON %I.availabilities
     FOR SELECT USING (auth.role() = ''authenticated'')',
    p_schema
  );
  -- Erstellen: Admin/Lead ODER eigener User-ID ODER eigener Member-Datensatz
  EXECUTE format(
    'CREATE POLICY "Avail INSERT own or admin" ON %I.availabilities
     FOR INSERT WITH CHECK (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
       OR EXISTS (
         SELECT 1 FROM %I.members m
         WHERE m.id = member_id AND m.user_id = auth.uid()
       )
     )',
    p_schema, p_schema, p_schema
  );
  -- Ändern: Admin/Lead ODER eigene Einträge (user_id ODER member-Zugehörigkeit)
  EXECUTE format(
    'CREATE POLICY "Avail UPDATE own or admin" ON %I.availabilities
     FOR UPDATE USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
       OR EXISTS (
         SELECT 1 FROM %I.members m
         WHERE m.id = member_id AND m.user_id = auth.uid()
       )
     )',
    p_schema, p_schema, p_schema
  );
  -- Löschen: Admin/Lead ODER eigene Einträge
  EXECUTE format(
    'CREATE POLICY "Avail DELETE own or admin" ON %I.availabilities
     FOR DELETE USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
       OR EXISTS (
         SELECT 1 FROM %I.members m
         WHERE m.id = member_id AND m.user_id = auth.uid()
       )
     )',
    p_schema, p_schema, p_schema
  );

  -- ── TEAMS ──────────────────────────────────────────────────
  EXECUTE format('DROP POLICY IF EXISTS "RBAC Teams"         ON %I.teams', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Teams SELECT all"   ON %I.teams', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Teams WRITE admin"  ON %I.teams', p_schema);

  EXECUTE format(
    'CREATE POLICY "Teams SELECT all" ON %I.teams
     FOR SELECT USING (auth.role() = ''authenticated'')',
    p_schema
  );
  EXECUTE format(
    'CREATE POLICY "Teams WRITE admin" ON %I.teams
     FOR ALL USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
     )',
    p_schema, p_schema
  );

  -- ── PROJECTS ───────────────────────────────────────────────
  EXECUTE format('DROP POLICY IF EXISTS "RBAC Projects"          ON %I.projects', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Projects SELECT all"    ON %I.projects', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Projects WRITE admin"   ON %I.projects', p_schema);

  EXECUTE format(
    'CREATE POLICY "Projects SELECT all" ON %I.projects
     FOR SELECT USING (auth.role() = ''authenticated'')',
    p_schema
  );
  EXECUTE format(
    'CREATE POLICY "Projects WRITE admin" ON %I.projects
     FOR ALL USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
     )',
    p_schema, p_schema
  );

  -- ── ALLOCATIONS ────────────────────────────────────────────
  EXECUTE format('DROP POLICY IF EXISTS "RBAC Allocations"         ON %I.allocations', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Allocations SELECT all"   ON %I.allocations', p_schema);
  EXECUTE format('DROP POLICY IF EXISTS "Allocations WRITE admin"  ON %I.allocations', p_schema);

  EXECUTE format(
    'CREATE POLICY "Allocations SELECT all" ON %I.allocations
     FOR SELECT USING (auth.role() = ''authenticated'')',
    p_schema
  );
  EXECUTE format(
    'CREATE POLICY "Allocations WRITE admin" ON %I.allocations
     FOR ALL USING (
       public.get_user_role_for_schema(%L) IN (''super_admin'', ''admin'', ''cio'', ''department_lead'')
       OR auth.uid() = user_id
     )',
    p_schema, p_schema
  );

  RAISE NOTICE 'RLS-Policies für Schema % erfolgreich gesetzt.', p_schema;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Funktion ausführen für alle drei Schemas
SELECT public.setup_teamradar_rls('teamradar-dev');
SELECT public.setup_teamradar_rls('teamradar-test');
SELECT public.setup_teamradar_rls('teamradar-prod');

-- Hilfsfunktion wieder entfernen (nur für diese Migration benötigt)
DROP FUNCTION IF EXISTS public.setup_teamradar_rls(TEXT);
