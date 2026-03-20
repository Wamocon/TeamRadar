-- TeamRadar – Supabase Schema
-- Dieses Skript erstellt die Tabellen für das TeamRadar-Projekt.

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

-- Schnellzugriff nach User
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);

-- RLS aktivieren
ALTER TABLE members ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Eigene Members lesen"  ON members FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Eigene Members erstellen" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Members ändern" ON members FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Members löschen" ON members FOR DELETE USING (auth.uid() = user_id);

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

CREATE POLICY "Eigene Availabilities lesen"  ON availabilities FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Eigene Availabilities erstellen" ON availabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Availabilities ändern" ON availabilities FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Availabilities löschen" ON availabilities FOR DELETE USING (auth.uid() = user_id);

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

CREATE POLICY "Eigene Teams lesen"  ON teams FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Eigene Teams erstellen" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Eigene Teams ändern" ON teams FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Eigene Teams löschen" ON teams FOR DELETE USING (auth.uid() = user_id);
