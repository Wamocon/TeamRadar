-- ============================================================
-- TeamRadar – Tabellen für ALLE Schemas (public, test, prod)
-- 
-- WICHTIG: Führe zuerst 000_schema_setup.sql aus!
--
-- Dieses Skript erstellt identische Tabellen + RLS-Policies
-- in allen drei Schemas. Im Supabase SQL Editor jeden
-- SET search_path TO <schema>; Block separat ausführen.
-- ============================================================

-- ════════════════════════════════════════════════════════════
-- SCHEMA: public (Entwicklungsumgebung / lokal)
-- ════════════════════════════════════════════════════════════
SET search_path TO public;

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
DROP POLICY IF EXISTS "Eigene Members lesen" ON members;
CREATE POLICY "Eigene Members lesen"  ON members FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members erstellen" ON members;
CREATE POLICY "Eigene Members erstellen" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members ändern" ON members;
CREATE POLICY "Eigene Members ändern" ON members FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members löschen" ON members;
CREATE POLICY "Eigene Members löschen" ON members FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Availabilities lesen" ON availabilities;
CREATE POLICY "Eigene Availabilities lesen"  ON availabilities FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities erstellen" ON availabilities;
CREATE POLICY "Eigene Availabilities erstellen" ON availabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities ändern" ON availabilities;
CREATE POLICY "Eigene Availabilities ändern" ON availabilities FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities löschen" ON availabilities;
CREATE POLICY "Eigene Availabilities löschen" ON availabilities FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Teams lesen" ON teams;
CREATE POLICY "Eigene Teams lesen"  ON teams FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams erstellen" ON teams;
CREATE POLICY "Eigene Teams erstellen" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams ändern" ON teams;
CREATE POLICY "Eigene Teams ändern" ON teams FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams löschen" ON teams;
CREATE POLICY "Eigene Teams löschen" ON teams FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Projects lesen" ON projects;
CREATE POLICY "Eigene Projects lesen"  ON projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects erstellen" ON projects;
CREATE POLICY "Eigene Projects erstellen" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects ändern" ON projects;
CREATE POLICY "Eigene Projects ändern" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects löschen" ON projects;
CREATE POLICY "Eigene Projects löschen" ON projects FOR DELETE USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- SCHEMA: test (Testumgebung / Vercel Preview)
-- ════════════════════════════════════════════════════════════
SET search_path TO test;

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
DROP POLICY IF EXISTS "Eigene Members lesen" ON members;
CREATE POLICY "Eigene Members lesen"  ON members FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members erstellen" ON members;
CREATE POLICY "Eigene Members erstellen" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members ändern" ON members;
CREATE POLICY "Eigene Members ändern" ON members FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members löschen" ON members;
CREATE POLICY "Eigene Members löschen" ON members FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Availabilities lesen" ON availabilities;
CREATE POLICY "Eigene Availabilities lesen"  ON availabilities FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities erstellen" ON availabilities;
CREATE POLICY "Eigene Availabilities erstellen" ON availabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities ändern" ON availabilities;
CREATE POLICY "Eigene Availabilities ändern" ON availabilities FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities löschen" ON availabilities;
CREATE POLICY "Eigene Availabilities löschen" ON availabilities FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Teams lesen" ON teams;
CREATE POLICY "Eigene Teams lesen"  ON teams FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams erstellen" ON teams;
CREATE POLICY "Eigene Teams erstellen" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams ändern" ON teams;
CREATE POLICY "Eigene Teams ändern" ON teams FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams löschen" ON teams;
CREATE POLICY "Eigene Teams löschen" ON teams FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Projects lesen" ON projects;
CREATE POLICY "Eigene Projects lesen"  ON projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects erstellen" ON projects;
CREATE POLICY "Eigene Projects erstellen" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects ändern" ON projects;
CREATE POLICY "Eigene Projects ändern" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects löschen" ON projects;
CREATE POLICY "Eigene Projects löschen" ON projects FOR DELETE USING (auth.uid() = user_id);


-- ════════════════════════════════════════════════════════════
-- SCHEMA: prod (Produktionsumgebung / Vercel Production)
-- ════════════════════════════════════════════════════════════
SET search_path TO prod;

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
DROP POLICY IF EXISTS "Eigene Members lesen" ON members;
CREATE POLICY "Eigene Members lesen"  ON members FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members erstellen" ON members;
CREATE POLICY "Eigene Members erstellen" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members ändern" ON members;
CREATE POLICY "Eigene Members ändern" ON members FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members löschen" ON members;
CREATE POLICY "Eigene Members löschen" ON members FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Availabilities lesen" ON availabilities;
CREATE POLICY "Eigene Availabilities lesen"  ON availabilities FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities erstellen" ON availabilities;
CREATE POLICY "Eigene Availabilities erstellen" ON availabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities ändern" ON availabilities;
CREATE POLICY "Eigene Availabilities ändern" ON availabilities FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities löschen" ON availabilities;
CREATE POLICY "Eigene Availabilities löschen" ON availabilities FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Teams lesen" ON teams;
CREATE POLICY "Eigene Teams lesen"  ON teams FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams erstellen" ON teams;
CREATE POLICY "Eigene Teams erstellen" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams ändern" ON teams;
CREATE POLICY "Eigene Teams ändern" ON teams FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams löschen" ON teams;
CREATE POLICY "Eigene Teams löschen" ON teams FOR DELETE USING (auth.uid() = user_id);

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
DROP POLICY IF EXISTS "Eigene Projects lesen" ON projects;
CREATE POLICY "Eigene Projects lesen"  ON projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects erstellen" ON projects;
CREATE POLICY "Eigene Projects erstellen" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects ändern" ON projects;
CREATE POLICY "Eigene Projects ändern" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects löschen" ON projects;
CREATE POLICY "Eigene Projects löschen" ON projects FOR DELETE USING (auth.uid() = user_id);