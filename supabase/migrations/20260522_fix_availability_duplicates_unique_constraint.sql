-- ============================================================
-- TeamRadar – Fix: Duplikat-Einträge bereinigen + UNIQUE-Constraint
-- Datum: 2026-05-22
--
-- Problem:
--   Das server-seitige PostgREST Row-Limit (db_max_rows = 1000) führte
--   dazu, dass Einträge ab ca. Juli (Row 1001+) beim Lesen nicht
--   zurückgegeben wurden. Da der Store diese Einträge nicht kannte,
--   wurden bei erneuten Writes neue UUIDs generiert und die Einträge
--   als Duplikate gespeichert (onConflict: 'id' → INSERT statt UPDATE).
--
-- Diese Migration:
--   1. Entfernt doppelte Volltagseinträge (gleiche member_id + date,
--      start_time IS NULL, end_time IS NULL) – behält jeweils den neuesten.
--   2. Erstellt einen Partial Unique Index auf (member_id, date) für
--      Volltagseinträge, der zukünftige Duplikate auf DB-Ebene verhindert.
--
-- Schemas: teamradar-dev, teamradar-test, teamradar-prod
-- Idempotent: IF NOT EXISTS / DO block mit Exception-Handling
-- ============================================================

-- ── teamradar-dev ───────────────────────────────────────────
DO $$ BEGIN
  -- Schritt 1: Duplikate entfernen (ältere Einträge löschen, neueren behalten)
  DELETE FROM "teamradar-dev".availabilities a1
  USING "teamradar-dev".availabilities a2
  WHERE a1.member_id = a2.member_id
    AND a1.date = a2.date
    AND a1.start_time IS NULL AND a1.end_time IS NULL
    AND a2.start_time IS NULL AND a2.end_time IS NULL
    AND a1.created_at < a2.created_at;

  -- Schritt 2: Partial Unique Index für Volltagseinträge
  -- (Zeiteinträge mit start_time/end_time dürfen weiterhin mehrfach pro Tag existieren)
  DROP INDEX IF EXISTS "teamradar-dev".idx_avail_member_date_fullday_unique;
  CREATE UNIQUE INDEX idx_avail_member_date_fullday_unique
    ON "teamradar-dev".availabilities(member_id, date)
    WHERE start_time IS NULL AND end_time IS NULL;

  RAISE NOTICE 'teamradar-dev: Duplikate bereinigt + Unique-Index erstellt.';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-dev.availabilities existiert nicht – übersprungen.';
END $$;

-- ── teamradar-test ──────────────────────────────────────────
DO $$ BEGIN
  DELETE FROM "teamradar-test".availabilities a1
  USING "teamradar-test".availabilities a2
  WHERE a1.member_id = a2.member_id
    AND a1.date = a2.date
    AND a1.start_time IS NULL AND a1.end_time IS NULL
    AND a2.start_time IS NULL AND a2.end_time IS NULL
    AND a1.created_at < a2.created_at;

  DROP INDEX IF EXISTS "teamradar-test".idx_avail_member_date_fullday_unique;
  CREATE UNIQUE INDEX idx_avail_member_date_fullday_unique
    ON "teamradar-test".availabilities(member_id, date)
    WHERE start_time IS NULL AND end_time IS NULL;

  RAISE NOTICE 'teamradar-test: Duplikate bereinigt + Unique-Index erstellt.';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-test.availabilities existiert nicht – übersprungen.';
END $$;

-- ── teamradar-prod ──────────────────────────────────────────
DO $$ BEGIN
  DELETE FROM "teamradar-prod".availabilities a1
  USING "teamradar-prod".availabilities a2
  WHERE a1.member_id = a2.member_id
    AND a1.date = a2.date
    AND a1.start_time IS NULL AND a1.end_time IS NULL
    AND a2.start_time IS NULL AND a2.end_time IS NULL
    AND a1.created_at < a2.created_at;

  DROP INDEX IF EXISTS "teamradar-prod".idx_avail_member_date_fullday_unique;
  CREATE UNIQUE INDEX idx_avail_member_date_fullday_unique
    ON "teamradar-prod".availabilities(member_id, date)
    WHERE start_time IS NULL AND end_time IS NULL;

  RAISE NOTICE 'teamradar-prod: Duplikate bereinigt + Unique-Index erstellt.';
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-prod.availabilities existiert nicht – übersprungen.';
END $$;
