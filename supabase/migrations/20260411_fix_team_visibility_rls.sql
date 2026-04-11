-- ═══════════════════════════════════════════════════════════════════════════
-- Migration: Team-Sichtbarkeit für alle Mitarbeiter
-- Problem: Normale Mitarbeiter (employees) konnten nur ihre eigenen Datensätze
--          sehen (user_id = auth.uid()), da alle Member-Records vom Admin
--          angelegt wurden. Dadurch war die Jahresübersicht für jeden
--          Mitarbeiter außer dem Admin leer.
-- Lösung:  SELECT-Policies für alle authentifizierten Nutzer öffnen.
--          Schreib-Rechte (INSERT/UPDATE/DELETE) bleiben beim Eigentümer/Admin.
-- ═══════════════════════════════════════════════════════════════════════════

DO $outer$
DECLARE
  schemas TEXT[] := ARRAY['teamradar-dev', 'teamradar-test', 'teamradar-prod'];
  s TEXT;
BEGIN
  FOREACH s IN ARRAY schemas LOOP
    IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = s) THEN
      EXECUTE format('SET search_path TO %I', s);

      -- ── Members: alle dürfen lesen, nur Eigentümer/Admin darf schreiben ──
      EXECUTE format('DROP POLICY IF EXISTS "RBAC Members"           ON %I.members', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Members lesen"     ON %I.members', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Members schreiben" ON %I.members', s);

      -- Alle authentifizierten Nutzer können alle Members lesen
      EXECUTE format(
        'CREATE POLICY "Team Members lesen" ON %I.members
         FOR SELECT USING (auth.role() = ''authenticated'')',
        s);

      -- Schreiben nur für Eigentümer oder Admin/CIO
      EXECUTE format(
        'CREATE POLICY "Team Members schreiben" ON %I.members
         FOR ALL USING (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'')
         )
         WITH CHECK (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'')
         )',
        s, s, s);

      -- ── Availabilities: alle dürfen lesen, jeder schreibt eigene ──────────
      EXECUTE format('DROP POLICY IF EXISTS "RBAC Availabilities"                ON %I.availabilities', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Availabilities lesen"          ON %I.availabilities', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Availabilities schreiben"      ON %I.availabilities', s);

      EXECUTE format(
        'CREATE POLICY "Team Availabilities lesen" ON %I.availabilities
         FOR SELECT USING (auth.role() = ''authenticated'')',
        s);

      EXECUTE format(
        'CREATE POLICY "Team Availabilities schreiben" ON %I.availabilities
         FOR ALL USING (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )
         WITH CHECK (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )',
        s, s, s);

      -- ── Teams: alle dürfen lesen ───────────────────────────────────────────
      EXECUTE format('DROP POLICY IF EXISTS "RBAC Teams"           ON %I.teams', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Teams lesen"     ON %I.teams', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Teams schreiben" ON %I.teams', s);

      EXECUTE format(
        'CREATE POLICY "Team Teams lesen" ON %I.teams
         FOR SELECT USING (auth.role() = ''authenticated'')',
        s);

      EXECUTE format(
        'CREATE POLICY "Team Teams schreiben" ON %I.teams
         FOR ALL USING (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )
         WITH CHECK (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )',
        s, s, s);

      -- ── Projects: alle dürfen lesen ────────────────────────────────────────
      EXECUTE format('DROP POLICY IF EXISTS "RBAC Projects"           ON %I.projects', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Projects lesen"     ON %I.projects', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Projects schreiben" ON %I.projects', s);

      EXECUTE format(
        'CREATE POLICY "Team Projects lesen" ON %I.projects
         FOR SELECT USING (auth.role() = ''authenticated'')',
        s);

      EXECUTE format(
        'CREATE POLICY "Team Projects schreiben" ON %I.projects
         FOR ALL USING (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )
         WITH CHECK (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )',
        s, s, s);

      -- ── Allocations: alle dürfen lesen ────────────────────────────────────
      EXECUTE format('DROP POLICY IF EXISTS "RBAC Allocations"           ON %I.allocations', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Allocations lesen"     ON %I.allocations', s);
      EXECUTE format('DROP POLICY IF EXISTS "Team Allocations schreiben" ON %I.allocations', s);

      EXECUTE format(
        'CREATE POLICY "Team Allocations lesen" ON %I.allocations
         FOR SELECT USING (auth.role() = ''authenticated'')',
        s);

      EXECUTE format(
        'CREATE POLICY "Team Allocations schreiben" ON %I.allocations
         FOR ALL USING (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )
         WITH CHECK (
           auth.uid() = user_id OR
           public.get_user_role_for_schema(%L) IN (''admin'', ''cio'', ''department_lead'')
         )',
        s, s, s);

      RAISE NOTICE 'RLS team-visibility policies updated for schema: %', s;
    END IF;
  END LOOP;

  RESET search_path;
END $outer$;
