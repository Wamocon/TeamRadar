-- ============================================================
-- TeamRadar – Schema Setup & Berechtigungen
-- 
-- SCHRITT 1: Führe dieses Skript als ERSTES aus!
--
-- WICHTIG: Custom Schemas (test, prod) bekommen in Supabase
-- NICHT automatisch GRANT USAGE. Das muss manuell erfolgen!
-- Ohne diese Grants können Auth-User nicht auf die Schemas zugreifen.
-- ============================================================

-- ── Schemas anlegen (falls nicht vorhanden) ───────────────────
CREATE SCHEMA IF NOT EXISTS test;
CREATE SCHEMA IF NOT EXISTS prod;

-- ── GRANT USAGE für Supabase-interne Rollen ───────────────────
-- KRITISCH: Diese Grants sind für Custom Schemas PFLICHT!
-- Ohne diese Grants schlägt jede DB-Anfrage mit Permission-Fehler fehl.

-- authenticator: Haupt-Supabase-Rolle für Auth-Flow
GRANT USAGE ON SCHEMA test TO authenticator;
GRANT USAGE ON SCHEMA prod TO authenticator;

-- anon: Verwendete Rolle für nicht-authentifizierte Anfragen
GRANT USAGE ON SCHEMA test TO anon;
GRANT USAGE ON SCHEMA prod TO anon;

-- authenticated: Verwendete Rolle für eingeloggte Users
GRANT USAGE ON SCHEMA test TO authenticated;
GRANT USAGE ON SCHEMA prod TO authenticated;

-- service_role: Verwendet von Seed-Skripten und Admin-Operationen
GRANT USAGE ON SCHEMA test TO service_role;
GRANT USAGE ON SCHEMA prod TO service_role;

-- ── Tabellen-Berechtigungen (nach Tabellenerstellung!) ────────
-- Diese Grants müssen NACH der Tabellenerstellung (002-Skript) ausgeführt werden.
-- Falls nötig, führe sie separat aus:

-- GRANT ALL ON ALL TABLES IN SCHEMA test TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA test TO service_role;
-- GRANT ALL ON ALL TABLES IN SCHEMA prod TO authenticated;
-- GRANT ALL ON ALL TABLES IN SCHEMA prod TO service_role;

-- Hinweis: public-Schema hat automatisch korrekte Grants in Supabase.