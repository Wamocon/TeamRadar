-- Supabase Schema Setup Script
-- Erstellt die Schemas test und prod, setzt Rechte und gibt usage an die Rolle authenticator

-- Schema anlegen (falls nicht vorhanden)
CREATE SCHEMA IF NOT EXISTS test;
CREATE SCHEMA IF NOT EXISTS prod;

-- Rechte für authenticator vergeben (wichtig für Supabase)
GRANT USAGE ON SCHEMA test TO authenticator;
GRANT USAGE ON SCHEMA prod TO authenticator;

-- Optional: Rechte für andere Rollen vergeben
-- GRANT USAGE ON SCHEMA test TO anon;
-- GRANT USAGE ON SCHEMA prod TO anon;

-- Hinweis: Tabellen/Migrationen müssen pro Schema ausgeführt werden!