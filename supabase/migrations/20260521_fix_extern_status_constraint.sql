-- ============================================================
-- TeamRadar – Fix: extern-onsite / extern-remote in availabilities
-- Datum: 2026-05-21
-- Problem: teamradar-prod hatte eine alte CHECK-Constraint ohne
--          die Statuses 'extern-onsite' und 'extern-remote'.
--          Alle anderen Statuses wurden gespeichert, nur diese
--          zwei scheiterten mit einem Constraint-Violation-Fehler.
-- Idempotent: DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT
-- ============================================================

-- ── teamradar-prod ──────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "teamradar-prod".availabilities
    DROP CONSTRAINT IF EXISTS availabilities_status_check;
  ALTER TABLE "teamradar-prod".availabilities
    ADD CONSTRAINT availabilities_status_check
    CHECK (status IN (
      'available','busy','meeting','vacation','sick',
      'remote','offline','extern-onsite','extern-remote'
    ));
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-prod.availabilities existiert nicht – übersprungen.';
END $$;

-- ── teamradar-dev (Konsistenz sicherstellen) ────────────────
DO $$ BEGIN
  ALTER TABLE "teamradar-dev".availabilities
    DROP CONSTRAINT IF EXISTS availabilities_status_check;
  ALTER TABLE "teamradar-dev".availabilities
    ADD CONSTRAINT availabilities_status_check
    CHECK (status IN (
      'available','busy','meeting','vacation','sick',
      'remote','offline','extern-onsite','extern-remote'
    ));
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-dev.availabilities existiert nicht – übersprungen.';
END $$;
