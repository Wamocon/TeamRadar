-- ============================================================
-- TeamRadar – Fix: extern-onsite / extern-remote in availabilities
-- Datum: 2026-05-21
-- Problem: teamradar-test und teamradar-prod hatten eine alte
--          CHECK-Constraint ohne 'extern-onsite' und 'extern-remote'.
-- Schemas: teamradar-dev (lokal), teamradar-test (Preview),
--          teamradar-prod (Production)
-- Idempotent: DROP CONSTRAINT IF EXISTS + ADD CONSTRAINT
-- ============================================================

-- ── teamradar-dev ───────────────────────────────────────────
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

-- ── teamradar-test (Vercel Preview) ─────────────────────────
DO $$ BEGIN
  ALTER TABLE "teamradar-test".availabilities
    DROP CONSTRAINT IF EXISTS availabilities_status_check;
  ALTER TABLE "teamradar-test".availabilities
    ADD CONSTRAINT availabilities_status_check
    CHECK (status IN (
      'available','busy','meeting','vacation','sick',
      'remote','offline','extern-onsite','extern-remote'
    ));
EXCEPTION WHEN undefined_table THEN
  RAISE NOTICE 'teamradar-test.availabilities existiert nicht – übersprungen.';
END $$;

-- ── teamradar-prod (Production) ─────────────────────────────
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
