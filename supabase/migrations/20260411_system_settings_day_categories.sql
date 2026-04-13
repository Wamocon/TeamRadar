-- ============================================================
-- TeamRadar – system_settings, day_categories, profile_privacy
-- Datum: 2026-04-11
-- Idempotent: Alle Schritte nutzen IF NOT EXISTS / ON CONFLICT
-- ============================================================

SET search_path TO "teamradar-dev";

-- ============================================================
-- 1. system_settings – Globale Systemkonfiguration
-- ============================================================

CREATE TABLE IF NOT EXISTS "teamradar-dev".system_settings (
  id                TEXT PRIMARY KEY DEFAULT 'global',
  org_name          TEXT NOT NULL DEFAULT 'TeamRadar',
  org_logo_url      TEXT,
  support_email     TEXT,
  maintenance_mode  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at        TIMESTAMPTZ DEFAULT now()
);

-- Seed-Zeile (nur wenn noch nicht vorhanden)
INSERT INTO "teamradar-dev".system_settings (id, org_name, support_email)
VALUES ('global', 'Wamocon GmbH', 'info@wamocon.de')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE "teamradar-dev".system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "system_settings_read_all"  ON "teamradar-dev".system_settings;
DROP POLICY IF EXISTS "system_settings_admin_write" ON "teamradar-dev".system_settings;

-- Jeder eingeloggte User darf lesen (für Branding im Frontend)
CREATE POLICY "system_settings_read_all"
  ON "teamradar-dev".system_settings
  FOR SELECT
  USING (true);

-- Nur Admin darf schreiben
CREATE POLICY "system_settings_admin_write"
  ON "teamradar-dev".system_settings
  FOR UPDATE
  USING (public.get_user_role_for_schema('teamradar-dev') = 'admin');

GRANT ALL ON TABLE "teamradar-dev".system_settings TO authenticated, service_role;


-- ============================================================
-- 2. day_categories – Konfigurierbare Tages-Kürzel
-- ============================================================

CREATE TABLE IF NOT EXISTS "teamradar-dev".day_categories (
  id        UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kuerzel   TEXT NOT NULL UNIQUE,       -- z.B. 'U', 'K', 'eP'
  label     TEXT NOT NULL,              -- z.B. 'Urlaub'
  color     TEXT NOT NULL DEFAULT '#ffffff',    -- Textfarbe
  bg_color  TEXT NOT NULL DEFAULT '#8b5cf6',    -- Hintergrundfarbe
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE "teamradar-dev".day_categories ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "day_categories_read_all"    ON "teamradar-dev".day_categories;
DROP POLICY IF EXISTS "day_categories_admin_write" ON "teamradar-dev".day_categories;

CREATE POLICY "day_categories_read_all"
  ON "teamradar-dev".day_categories
  FOR SELECT
  USING (true);

CREATE POLICY "day_categories_admin_write"
  ON "teamradar-dev".day_categories
  FOR ALL
  USING (public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead'));

GRANT ALL ON TABLE "teamradar-dev".day_categories TO authenticated, service_role;

-- Default-Kürzel (Seed)
INSERT INTO "teamradar-dev".day_categories (kuerzel, label, color, bg_color, sort_order)
VALUES
  ('U',   'Urlaub',                '#ffffff', '#8b5cf6', 1),
  ('K',   'Krank',                 '#ffffff', '#ec4899', 2),
  ('H',   'Homeoffice',            '#ffffff', '#06b6d4', 3),
  ('B',   'Büro intern (kein eP)', '#ffffff', '#6366f1', 4),
  ('eP',  'Externes Projekt (Vor Ort)', '#ffffff', '#f97316', 5),
  ('BeP', 'Büro extern (mit eP)', '#ffffff', '#fb923c', 6),
  ('S',   'Sonstiges',             '#ffffff', '#6b7280', 7),
  ('P',   'Privat',                '#1e293b', '#e2e8f0', 8)
ON CONFLICT (kuerzel) DO NOTHING;


-- ============================================================
-- 3. profile_privacy – DSGVO Feld-Sichtbarkeit pro Nutzer
-- ============================================================

CREATE TABLE IF NOT EXISTS "teamradar-dev".profile_privacy (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  field_name TEXT NOT NULL,   -- z.B. 'phone', 'department', 'avatar_url'
  is_public  BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, field_name)
);

CREATE INDEX IF NOT EXISTS idx_profile_privacy_user_id ON "teamradar-dev".profile_privacy(user_id);

ALTER TABLE "teamradar-dev".profile_privacy ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "privacy_own"        ON "teamradar-dev".profile_privacy;
DROP POLICY IF EXISTS "privacy_admin_read" ON "teamradar-dev".profile_privacy;

-- User sieht und verwaltet nur eigene Privacy-Einstellungen
CREATE POLICY "privacy_own"
  ON "teamradar-dev".profile_privacy
  FOR ALL
  USING (auth.uid() = user_id);

-- Admin/CIO/DL kann alle lesen
CREATE POLICY "privacy_admin_read"
  ON "teamradar-dev".profile_privacy
  FOR SELECT
  USING (public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead'));

GRANT ALL ON TABLE "teamradar-dev".profile_privacy TO authenticated, service_role;
