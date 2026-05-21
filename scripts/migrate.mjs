#!/usr/bin/env node
/**
 * Migrations-Runner für TeamRadar
 *
 * Liest die SQL-Migration direkt aus dem Repo und führt sie
 * gegen die Supabase-Datenbank aus. Keine manuelle Copy-Paste nötig.
 *
 * Voraussetzung: SUPABASE_DB_URL in .env.local
 *   → Supabase Dashboard → Project Settings → Database
 *     → Connection string → URI → kopieren
 *
 * Verwendung:
 *   node scripts/migrate.mjs
 */

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import pg from 'pg';

const __dirname = dirname(fileURLToPath(import.meta.url));

// ── .env.local parsen ────────────────────────────────────────
function loadEnv() {
  const envPath = resolve(__dirname, '../.env.local');
  const content = readFileSync(envPath, 'utf8');
  const env = {};
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const idx = trimmed.indexOf('=');
    if (idx === -1) continue;
    env[trimmed.slice(0, idx).trim()] = trimmed.slice(idx + 1).trim();
  }
  return env;
}

const env = loadEnv();
const dbUrl = env.SUPABASE_DB_URL;

if (!dbUrl) {
  console.error('\n✗ SUPABASE_DB_URL fehlt in .env.local\n');
  console.error('  Wo findest du die URL:');
  console.error('  Supabase Dashboard → Project Settings → Database');
  console.error('  → Connection string → URI\n');
  console.error('  Dann in .env.local eintragen:');
  console.error('  SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres\n');
  process.exit(1);
}

// ── SQL laden ────────────────────────────────────────────────
// Argument: node scripts/migrate.mjs [pfad/zur/migration.sql]
// Default: 20260411_teamradar_schema_migration.sql
const sqlArg = process.argv[2];
const sqlPath = sqlArg
  ? resolve(process.cwd(), sqlArg)
  : resolve(__dirname, '../supabase/migrations/20260411_teamradar_schema_migration.sql');
const sql = readFileSync(sqlPath, 'utf8');

console.log(`\n📄 Migration: ${sqlPath.split(/[\\/]/).pop()}`);
console.log('🔌 Verbinde mit Datenbank...\n');

// ── Ausführen ────────────────────────────────────────────────
const client = new pg.Client({
  connectionString: dbUrl,
  ssl: { rejectUnauthorized: false },
});

try {
  await client.connect();
  console.log('✓ Verbindung hergestellt.\n');

  // PostgreSQL NOTICE-Meldungen direkt ausgeben
  client.on('notice', (msg) => console.log('  »', msg.message));

  await client.query(sql);
  console.log('\n✓ Migration erfolgreich abgeschlossen.\n');
} catch (err) {
  console.error('\n✗ Fehler:', err.message, '\n');
  process.exit(1);
} finally {
  await client.end();
}
