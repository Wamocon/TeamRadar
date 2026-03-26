-- ============================================================
-- TeamRadar – KOMPLETTER RESET aller Schemas und Tabellen
--
-- ⚠️  ACHTUNG: Dieses Skript LÖSCHT ALLE DATEN unwiderruflich!
-- Nur in Entwicklung/Test verwenden!
-- ============================================================

-- ── public Schema zurücksetzen ────────────────────────────────
SET search_path TO public;

DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- ── test Schema zurücksetzen ──────────────────────────────────
SET search_path TO test;

DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- ── prod Schema zurücksetzen ─────────────────────────────────
SET search_path TO prod;

DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- ── Schemas selbst löschen (optional) ────────────────────────
-- Nur ausführen wenn du komplett von vorne anfangen willst!
-- DROP SCHEMA IF EXISTS test CASCADE;
-- DROP SCHEMA IF EXISTS prod CASCADE;

-- ── Hinweis ──────────────────────────────────────────────────
-- Nach dem Reset: Führe folgende Skripte der Reihe nach aus:
-- 1. 000_schema_setup.sql  (Schemas + Grants)
-- 2. 002_apply_schema_to_all.sql  (Tabellen + RLS-Policies)
