-- ============================================================
-- Migration: RLS-Policies für Employee-Sichtbarkeit korrigieren
-- Datum: 2026-04-13
--
-- Problem: Normale Mitarbeiter (employee-Rolle) können keine
--   anderen Team-Mitglieder und deren Verfügbarkeiten sehen,
--   weil die bestehenden RLS-Policies auf user_id = auth.uid()
--   beschränkt sind.
--
-- Lösung: SELECT wird für alle authentifizierten User freigegeben.
--   INSERT/UPDATE/DELETE bleibt auf Admin/Lead/eigene Daten beschränkt.
--
-- Hinweis: Diese Migration gilt für teamradar-dev.
--   Für Prod: Schema-Name auf "teamradar-prod" ändern und neu ausführen.
-- ============================================================

SET search_path TO "teamradar-dev";

-- ============================================================
-- MEMBERS: Alle sehen alle Mitarbeiter (READ), Schreiben nur Admins
-- ============================================================
DROP POLICY IF EXISTS "RBAC Members"          ON members;
DROP POLICY IF EXISTS "Members SELECT all"    ON members;
DROP POLICY IF EXISTS "Members INSERT admin"  ON members;
DROP POLICY IF EXISTS "Members UPDATE admin"  ON members;
DROP POLICY IF EXISTS "Members DELETE admin"  ON members;

-- Lesen: alle eingeloggten User dürfen alle Mitarbeiter sehen
CREATE POLICY "Members SELECT all" ON members
  FOR SELECT USING (auth.role() = 'authenticated');

-- Erstellen: nur Admin/CIO oder eigener Datensatz
CREATE POLICY "Members INSERT admin" ON members
  FOR INSERT WITH CHECK (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio')
    OR auth.uid() = user_id
  );

-- Ändern: Admin/CIO/DL oder eigener Datensatz
CREATE POLICY "Members UPDATE admin" ON members
  FOR UPDATE USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
  );

-- Löschen: nur Admin/CIO
CREATE POLICY "Members DELETE admin" ON members
  FOR DELETE USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio')
  );

-- ============================================================
-- AVAILABILITIES: Alle sehen alle Verfügbarkeiten (READ),
-- Schreiben: Admin/Lead ODER eigene Einträge (member_id referenziert
-- den Mitarbeiter, nicht den Creator → eigene Einträge über member.user_id)
-- ============================================================
DROP POLICY IF EXISTS "RBAC Availabilities"        ON availabilities;
DROP POLICY IF EXISTS "Avail SELECT all"            ON availabilities;
DROP POLICY IF EXISTS "Avail INSERT own or admin"   ON availabilities;
DROP POLICY IF EXISTS "Avail UPDATE own or admin"   ON availabilities;
DROP POLICY IF EXISTS "Avail DELETE own or admin"   ON availabilities;

-- Lesen: alle sehen das gesamte Team-Kalender
CREATE POLICY "Avail SELECT all" ON availabilities
  FOR SELECT USING (auth.role() = 'authenticated');

-- Erstellen: Admin/Lead können für alle anlegen;
-- ein normaler Mitarbeiter nur für den eigenen Member-Datensatz
CREATE POLICY "Avail INSERT own or admin" ON availabilities
  FOR INSERT WITH CHECK (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_id AND m.user_id = auth.uid()
    )
  );

-- Ändern: Admin/Lead oder eigene Einträge
CREATE POLICY "Avail UPDATE own or admin" ON availabilities
  FOR UPDATE USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_id AND m.user_id = auth.uid()
    )
  );

-- Löschen: Admin/Lead oder eigene Einträge
CREATE POLICY "Avail DELETE own or admin" ON availabilities
  FOR DELETE USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
    OR EXISTS (
      SELECT 1 FROM members m
      WHERE m.id = member_id AND m.user_id = auth.uid()
    )
  );

-- ============================================================
-- TEAMS & PROJECTS: Alle sehen alle Teams/Projekte (READ)
-- ============================================================
DROP POLICY IF EXISTS "RBAC Teams"         ON teams;
DROP POLICY IF EXISTS "Teams SELECT all"   ON teams;
DROP POLICY IF EXISTS "Teams WRITE admin"  ON teams;
DROP POLICY IF EXISTS "RBAC Projects"      ON projects;
DROP POLICY IF EXISTS "Projects SELECT all" ON projects;
DROP POLICY IF EXISTS "Projects WRITE admin" ON projects;

CREATE POLICY "Teams SELECT all" ON teams
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Teams WRITE admin" ON teams
  FOR ALL USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
  );

CREATE POLICY "Projects SELECT all" ON projects
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Projects WRITE admin" ON projects
  FOR ALL USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
  );

-- ============================================================
-- ALLOCATIONS: Alle lesen, Admins schreiben
-- ============================================================
DROP POLICY IF EXISTS "RBAC Allocations"         ON allocations;
DROP POLICY IF EXISTS "Allocations SELECT all"   ON allocations;
DROP POLICY IF EXISTS "Allocations WRITE admin"  ON allocations;

CREATE POLICY "Allocations SELECT all" ON allocations
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Allocations WRITE admin" ON allocations
  FOR ALL USING (
    public.get_user_role_for_schema('teamradar-dev') IN ('super_admin', 'admin', 'cio', 'department_lead')
    OR auth.uid() = user_id
  );

-- ============================================================
-- FÜR PRODUKTION: Dieselben Policies für teamradar-prod
-- Einfach dieses Script mit `SET search_path TO "teamradar-prod"`
-- nochmal ausführen. Alle POLICY-Namen sind identisch.
-- ============================================================

DO $$ BEGIN
  RAISE NOTICE 'RLS-Policies für Employee-Sichtbarkeit erfolgreich aktualisiert.';
END $$;
