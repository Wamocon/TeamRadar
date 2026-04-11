-- ============================================================
-- TeamRadar – Konsolidierte Schema-Migration
-- 
-- Zweck: Überführt TeamRadar von public/test/prod in eigene
--        Schemas teamradar-dev/teamradar-test/teamradar-prod.
--        Das public-Schema verbleibt als Cross-App-Schema für
--        AWAY und TRACE (super_admins, is_super_admin etc.).
--
-- ============================================================
-- Reihenfolge:
--   1. test → teamradar-test umbenennen (Daten bleiben erhalten)
--   2. prod → teamradar-prod umbenennen (Daten bleiben erhalten)
--   3. teamradar-dev erstellen + Grants
--   4. RBAC-Hilfsfunktionen erstellen (MUSS vor Tabellen sein!)
--   5. Alle Tabellen in teamradar-dev aufbauen
--   6. Daten aus public → teamradar-dev kopieren
--   7. user_consents in teamradar-test + teamradar-prod nachrüsten
--   8. Auth-Trigger auf teamradar-* umstellen
--   9. TeamRadar-Objekte aus public entfernen
--
-- ⚠️  IDEMPOTENT: Alle Schritte nutzen IF NOT EXISTS / IF EXISTS
--     und ON CONFLICT -> Safe für wiederholte Ausführung.
-- ============================================================


-- ============================================================
-- SCHRITT 1+2: test → teamradar-test, prod → teamradar-prod
-- PostgreSQL ALTER SCHEMA RENAME behält Tabellen, Daten,
-- Indizes und Constraints vollständig erhalten.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'test')
     AND NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'teamradar-test') THEN
    ALTER SCHEMA test RENAME TO "teamradar-test";
    RAISE NOTICE 'Schema test → teamradar-test umbenannt.';
  ELSE
    RAISE NOTICE 'Schema test nicht gefunden oder teamradar-test existiert bereits – Umbenennung übersprungen.';
  END IF;
END $$;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'prod')
     AND NOT EXISTS (SELECT 1 FROM information_schema.schemata WHERE schema_name = 'teamradar-prod') THEN
    ALTER SCHEMA prod RENAME TO "teamradar-prod";
    RAISE NOTICE 'Schema prod → teamradar-prod umbenannt.';
  ELSE
    RAISE NOTICE 'Schema prod nicht gefunden oder teamradar-prod existiert bereits – Umbenennung übersprungen.';
  END IF;
END $$;


-- ============================================================
-- SCHRITT 3: teamradar-dev erstellen + GRANT USAGE
-- ============================================================

CREATE SCHEMA IF NOT EXISTS "teamradar-dev";

GRANT USAGE ON SCHEMA "teamradar-dev" TO authenticator;
GRANT USAGE ON SCHEMA "teamradar-dev" TO anon;
GRANT USAGE ON SCHEMA "teamradar-dev" TO authenticated;
GRANT USAGE ON SCHEMA "teamradar-dev" TO service_role;

-- teamradar-test + teamradar-prod Grants sicherstellen
-- (nach Umbenennung müssen Grants für neue Schemanamen gesetzt werden)
GRANT USAGE ON SCHEMA "teamradar-test" TO authenticator, anon, authenticated, service_role;
GRANT USAGE ON SCHEMA "teamradar-prod" TO authenticator, anon, authenticated, service_role;


-- ============================================================
-- SCHRITT 4: RBAC-Hilfsfunktionen erstellen
--
-- MUSS vor den Tabellen/Policies stehen, da die RLS-Policies
-- diese Funktionen referenzieren!
-- ============================================================

SET search_path TO public;

CREATE OR REPLACE FUNCTION public.get_user_role_for_schema(p_schema TEXT)
RETURNS TEXT AS $$
DECLARE
  v_role TEXT;
BEGIN
  EXECUTE format(
    'SELECT role FROM %I.profiles WHERE id = auth.uid()',
    p_schema
  ) INTO v_role;
  RETURN v_role;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION public.get_user_department_for_schema(p_schema TEXT)
RETURNS TEXT AS $$
DECLARE
  v_dept TEXT;
BEGIN
  EXECUTE format(
    'SELECT department FROM %I.profiles WHERE id = auth.uid()',
    p_schema
  ) INTO v_dept;
  RETURN v_dept;
END;
$$ LANGUAGE plpgsql STABLE SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION public.get_user_role_for_schema(TEXT)       TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.get_user_department_for_schema(TEXT) TO authenticated, service_role;


-- ============================================================
-- SCHRITT 5: Tabellen in teamradar-dev erstellen
-- ============================================================

SET search_path TO "teamradar-dev";

-- ── Members ──────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS members (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  email      TEXT NOT NULL,
  role       TEXT DEFAULT '',
  department TEXT DEFAULT '',
  avatar_url TEXT,
  phone      TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

ALTER TABLE members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Members lesen"     ON members;
DROP POLICY IF EXISTS "Eigene Members erstellen" ON members;
DROP POLICY IF EXISTS "Eigene Members ändern"    ON members;
DROP POLICY IF EXISTS "Eigene Members löschen"   ON members;
DROP POLICY IF EXISTS "RBAC Members"             ON members;

CREATE POLICY "RBAC Members" ON members FOR ALL USING (
  public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio') OR
  (public.get_user_role_for_schema('teamradar-dev') = 'department_lead'
     AND department = public.get_user_department_for_schema('teamradar-dev')) OR
  (auth.uid() = user_id)
);

GRANT ALL ON TABLE members TO authenticated, service_role;

-- ── Availabilities ───────────────────────────────────────────
CREATE TABLE IF NOT EXISTS availabilities (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id  UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status     TEXT NOT NULL CHECK (status IN ('available','busy','meeting','vacation','sick','remote','offline')),
  date       DATE NOT NULL,
  start_time TIME,
  end_time   TIME,
  note       TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_availabilities_user_id   ON availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_member_id ON availabilities(member_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_date      ON availabilities(date);

ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Availabilities lesen"     ON availabilities;
DROP POLICY IF EXISTS "Eigene Availabilities erstellen" ON availabilities;
DROP POLICY IF EXISTS "Eigene Availabilities ändern"    ON availabilities;
DROP POLICY IF EXISTS "Eigene Availabilities löschen"   ON availabilities;
DROP POLICY IF EXISTS "RBAC Availabilities"             ON availabilities;

CREATE POLICY "RBAC Availabilities" ON availabilities FOR ALL USING (
  public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead') OR
  (auth.uid() = user_id)
);

GRANT ALL ON TABLE availabilities TO authenticated, service_role;

-- ── Teams ────────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS teams (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  description TEXT,
  member_ids  UUID[] DEFAULT '{}',
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);

ALTER TABLE teams ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Teams lesen"     ON teams;
DROP POLICY IF EXISTS "Eigene Teams erstellen" ON teams;
DROP POLICY IF EXISTS "Eigene Teams ändern"    ON teams;
DROP POLICY IF EXISTS "Eigene Teams löschen"   ON teams;
DROP POLICY IF EXISTS "RBAC Teams"             ON teams;

CREATE POLICY "RBAC Teams" ON teams FOR ALL USING (
  public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead') OR
  (auth.uid() = user_id)
);

GRANT ALL ON TABLE teams TO authenticated, service_role;

-- ── Projects ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS projects (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id     UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name        TEXT NOT NULL,
  type        TEXT NOT NULL CHECK (type IN ('internal','external')),
  status      TEXT NOT NULL CHECK (status IN ('planned','active','completed','on_hold')),
  client      TEXT,
  description TEXT,
  member_ids  UUID[] DEFAULT '{}',
  start_date  DATE,
  end_date    DATE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);

ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Projects lesen"     ON projects;
DROP POLICY IF EXISTS "Eigene Projects erstellen" ON projects;
DROP POLICY IF EXISTS "Eigene Projects ändern"    ON projects;
DROP POLICY IF EXISTS "Eigene Projects löschen"   ON projects;
DROP POLICY IF EXISTS "RBAC Projects"             ON projects;

CREATE POLICY "RBAC Projects" ON projects FOR ALL USING (
  public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead') OR
  (auth.uid() = user_id)
);

GRANT ALL ON TABLE projects TO authenticated, service_role;

-- ── Allocations ──────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS allocations (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id    UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  project_id   UUID NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  percentage   INTEGER NOT NULL CHECK (percentage >= 0 AND percentage <= 200),
  start_date   DATE NOT NULL,
  end_date     DATE NOT NULL,
  created_at   TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_allocations_user_id    ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_member_id  ON allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_id ON allocations(project_id);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Eigene Allocations lesen"     ON allocations;
DROP POLICY IF EXISTS "Eigene Allocations erstellen" ON allocations;
DROP POLICY IF EXISTS "Eigene Allocations ändern"    ON allocations;
DROP POLICY IF EXISTS "Eigene Allocations löschen"   ON allocations;
DROP POLICY IF EXISTS "RBAC Allocations"             ON allocations;

CREATE POLICY "RBAC Allocations" ON allocations FOR ALL USING (
  public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead') OR
  (auth.uid() = user_id)
);

GRANT ALL ON TABLE allocations TO authenticated, service_role;

-- ── Profiles ─────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS profiles (
  id             UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email          TEXT NOT NULL,
  display_name   TEXT,
  role           TEXT NOT NULL DEFAULT 'employee' CHECK (role IN ('admin', 'cio', 'department_lead', 'employee')),
  department     TEXT,
  avatar_url     TEXT,
  status_message TEXT,
  phone          TEXT,
  preferences    JSONB DEFAULT '{"theme": "system", "notifications": true}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Profiles sind für alle Lesbar"         ON profiles;
DROP POLICY IF EXISTS "Eigene Profiles ändern"                ON profiles;
DROP POLICY IF EXISTS "Nutzer können eigene Profile lesen"    ON profiles;
DROP POLICY IF EXISTS "Nutzer können eigene Profile ändern"   ON profiles;
DROP POLICY IF EXISTS "Admins können alle Profile lesen"      ON profiles;

CREATE POLICY "Profiles sind für alle Lesbar" ON profiles FOR SELECT USING (true);
CREATE POLICY "Eigene Profiles ändern"        ON profiles FOR UPDATE USING (auth.uid() = id);

GRANT ALL ON TABLE profiles TO authenticated, service_role;

-- ── User Consents ─────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,  -- 'agb', 'datenschutz', 'dsgvo'
  status       BOOLEAN NOT NULL DEFAULT FALSE,
  version      TEXT NOT NULL,  -- z.B. '2026-03'
  ip_address   TEXT,
  user_agent   TEXT,
  accepted_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, consent_type, version)
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents"  ON user_consents;
DROP POLICY IF EXISTS "Admins can view all consents" ON user_consents;

CREATE POLICY "Users can view own consents" ON user_consents FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own consents" ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all consents" ON user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "teamradar-dev".profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT ALL ON TABLE user_consents TO authenticated, service_role;

-- Default Privileges für zukünftige Tabellen
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-dev" GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-dev" GRANT ALL ON SEQUENCES TO authenticated, service_role;


-- ============================================================
-- SCHRITT 6: Daten aus public → teamradar-dev kopieren
-- Nur ausführen wenn public noch TeamRadar-Tabellen hat.
-- ============================================================

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables
             WHERE table_schema = 'public' AND table_name = 'members') THEN

    INSERT INTO "teamradar-dev".members
      (id, user_id, name, email, role, department, avatar_url, phone, created_at)
    SELECT id, user_id, name, email, role, department, avatar_url, phone, created_at
    FROM public.members
    WHERE user_id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'members kopiert.';

    INSERT INTO "teamradar-dev".availabilities
      (id, user_id, member_id, status, date, start_time, end_time, note, created_at)
    SELECT id, user_id, member_id, status, date, start_time, end_time, note, created_at
    FROM public.availabilities
    WHERE user_id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'availabilities kopiert.';

    INSERT INTO "teamradar-dev".teams
      (id, user_id, name, description, member_ids, created_at)
    SELECT id, user_id, name, description, member_ids, created_at
    FROM public.teams
    WHERE user_id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'teams kopiert.';

    INSERT INTO "teamradar-dev".projects
      (id, user_id, name, type, status, client, description, member_ids, start_date, end_date, created_at)
    SELECT id, user_id, name, type, status, client, description, member_ids, start_date, end_date, created_at
    FROM public.projects
    WHERE user_id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'projects kopiert.';

    INSERT INTO "teamradar-dev".allocations
      (id, user_id, member_id, project_id, percentage, start_date, end_date, created_at)
    SELECT id, user_id, member_id, project_id, percentage, start_date, end_date, created_at
    FROM public.allocations
    WHERE user_id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'allocations kopiert.';

    INSERT INTO "teamradar-dev".profiles
      (id, email, display_name, role, department, avatar_url, status_message, phone, preferences, created_at)
    SELECT id, email, display_name, role, department, avatar_url, status_message, phone, preferences, created_at
    FROM public.profiles
    WHERE id IN (SELECT id FROM auth.users)
    ON CONFLICT (id) DO NOTHING;
    RAISE NOTICE 'profiles kopiert.';

    IF EXISTS (SELECT 1 FROM information_schema.tables
               WHERE table_schema = 'public' AND table_name = 'user_consents') THEN
      INSERT INTO "teamradar-dev".user_consents
        (id, user_id, consent_type, status, version, ip_address, user_agent, accepted_at)
      SELECT id, user_id, consent_type, status, version, ip_address, user_agent, accepted_at
      FROM public.user_consents
      WHERE user_id IN (SELECT id FROM auth.users)
      ON CONFLICT (user_id, consent_type, version) DO NOTHING;
      RAISE NOTICE 'user_consents kopiert.';
    END IF;

  ELSE
    RAISE NOTICE 'Keine TeamRadar-Tabellen in public gefunden – Daten-Copy übersprungen.';
  END IF;
END $$;


-- ============================================================
-- SCHRITT 7: user_consents in teamradar-test + teamradar-prod
--            nachrüsten (fehlte bisher in test/prod)
-- ============================================================

SET search_path TO "teamradar-test";

CREATE TABLE IF NOT EXISTS user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  status       BOOLEAN NOT NULL DEFAULT FALSE,
  version      TEXT NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  accepted_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, consent_type, version)
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents"   ON user_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
DROP POLICY IF EXISTS "Admins can view all consents"  ON user_consents;

CREATE POLICY "Users can view own consents" ON user_consents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all consents" ON user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "teamradar-test".profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT ALL ON TABLE user_consents TO authenticated, service_role;

-- ──

SET search_path TO "teamradar-prod";

CREATE TABLE IF NOT EXISTS user_consents (
  id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id      UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  consent_type TEXT NOT NULL,
  status       BOOLEAN NOT NULL DEFAULT FALSE,
  version      TEXT NOT NULL,
  ip_address   TEXT,
  user_agent   TEXT,
  accepted_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, consent_type, version)
);

ALTER TABLE user_consents ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view own consents"   ON user_consents;
DROP POLICY IF EXISTS "Users can insert own consents" ON user_consents;
DROP POLICY IF EXISTS "Admins can view all consents"  ON user_consents;

CREATE POLICY "Users can view own consents" ON user_consents FOR SELECT
  USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own consents" ON user_consents FOR INSERT
  WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all consents" ON user_consents FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM "teamradar-prod".profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

GRANT ALL ON TABLE user_consents TO authenticated, service_role;

-- Default Privileges für teamradar-test + teamradar-prod
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-test" GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-test" GRANT ALL ON SEQUENCES TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-prod" GRANT ALL ON TABLES    TO authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA "teamradar-prod" GRANT ALL ON SEQUENCES TO authenticated, service_role;


-- ============================================================
-- SCHRITT 8: Auth-Trigger auf teamradar-* umstellen
-- 
-- handle_new_user() schreibt ab jetzt in teamradar-dev/test/prod
-- statt public/test/prod.
-- ============================================================

SET search_path TO public;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  -- teamradar-dev
  INSERT INTO "teamradar-dev".profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    'employee'
  )
  ON CONFLICT (id) DO NOTHING;

  -- teamradar-test
  INSERT INTO "teamradar-test".profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    'employee'
  )
  ON CONFLICT (id) DO NOTHING;

  -- teamradar-prod
  INSERT INTO "teamradar-prod".profiles (id, email, display_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'display_name', new.raw_user_meta_data->>'full_name', ''),
    'employee'
  )
  ON CONFLICT (id) DO NOTHING;

  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- ============================================================
-- SCHRITT 9: TeamRadar-Objekte aus public entfernen

SET search_path TO public;

-- Funktionen entfernen (alte get_user_role/get_user_department
-- verwiesen auf public.profiles → werden durch schema-aware
-- Varianten ersetzt und sind damit obsolet)
DROP FUNCTION IF EXISTS public.get_user_role();
DROP FUNCTION IF EXISTS public.get_user_department();

-- TeamRadar-Tabellen aus public löschen
-- Reihenfolge wegen FK-Constraints: abhängige zuerst
DROP TABLE IF EXISTS public.user_consents  CASCADE;
DROP TABLE IF EXISTS public.allocations    CASCADE;
DROP TABLE IF EXISTS public.availabilities CASCADE;
DROP TABLE IF EXISTS public.projects       CASCADE;
DROP TABLE IF EXISTS public.teams          CASCADE;
DROP TABLE IF EXISTS public.members        CASCADE;
DROP TABLE IF EXISTS public.profiles       CASCADE;

DO $$ BEGIN
  RAISE NOTICE '✓ TeamRadar-Migration abgeschlossen: public ist nun sauber (nur Cross-App-Objekte).';
END $$;
