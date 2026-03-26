-- ============================================================
-- TeamRadar – Allocations (Projekt-Zuweisungen)
-- 
-- Ergänzt die fehlende Zuweisungs-Tabelle in allen Schemas.
-- ============================================================

-- ── 1. PUBLIC ───────────────────────────────────────────────
SET search_path TO public;

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

CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_member_id ON allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_id ON allocations(project_id);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Allocations lesen" ON allocations;
CREATE POLICY "Eigene Allocations lesen"     ON allocations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations erstellen" ON allocations;
CREATE POLICY "Eigene Allocations erstellen" ON allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations ändern" ON allocations;
CREATE POLICY "Eigene Allocations ändern"    ON allocations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations löschen" ON allocations;
CREATE POLICY "Eigene Allocations löschen"    ON allocations FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE allocations TO anon, authenticated, service_role;

-- ── 2. TEST ─────────────────────────────────────────────────
SET search_path TO test;

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

CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_member_id ON allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_id ON allocations(project_id);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Allocations lesen" ON allocations;
CREATE POLICY "Eigene Allocations lesen"     ON allocations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations erstellen" ON allocations;
CREATE POLICY "Eigene Allocations erstellen" ON allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations ändern" ON allocations;
CREATE POLICY "Eigene Allocations ändern"    ON allocations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations löschen" ON allocations;
CREATE POLICY "Eigene Allocations löschen"    ON allocations FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE allocations TO anon, authenticated, service_role;

-- ── 3. PROD ─────────────────────────────────────────────────
SET search_path TO prod;

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

CREATE INDEX IF NOT EXISTS idx_allocations_user_id ON allocations(user_id);
CREATE INDEX IF NOT EXISTS idx_allocations_member_id ON allocations(member_id);
CREATE INDEX IF NOT EXISTS idx_allocations_project_id ON allocations(project_id);

ALTER TABLE allocations ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Allocations lesen" ON allocations;
CREATE POLICY "Eigene Allocations lesen"     ON allocations FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations erstellen" ON allocations;
CREATE POLICY "Eigene Allocations erstellen" ON allocations FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations ändern" ON allocations;
CREATE POLICY "Eigene Allocations ändern"    ON allocations FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Allocations löschen" ON allocations;
CREATE POLICY "Eigene Allocations löschen"    ON allocations FOR DELETE USING (auth.uid() = user_id);

GRANT ALL ON TABLE allocations TO anon, authenticated, service_role;
