# TeamRadar – Supabase Setup & Betriebshandbuch

## Überblick

TeamRadar nutzt **drei Supabase-Schemas** für verschiedene Umgebungen:

| Schema   | Umgebung           | Env-Variable                    |
|----------|--------------------|---------------------------------|
| `public` | Lokal / Entwicklung| `NEXT_PUBLIC_DB_SCHEMA=public`  |
| `test`   | Vercel Preview     | `NEXT_PUBLIC_DB_SCHEMA=test`    |
| `prod`   | Vercel Production  | `NEXT_PUBLIC_DB_SCHEMA=prod`    |

---

## ⚠️ Wichtig: Custom Schemas & GRANT USAGE

Supabase vergibt bei Custom Schemas (`test`, `prod`) **keine** Rechte automatisch.
Ohne explizite `GRANT USAGE`-Befehle schlägt jede DB-Anfrage mit einem
`permission denied for schema` Fehler fehl.

**Betroffene Rollen, die Grants benötigen:**
- `authenticator` – Supabase Auth-Flow
- `anon` – nicht authentifizierte Anfragen  
- `authenticated` – eingeloggte User
- `service_role` – Admin-Operationen & Seed-Skripte

---

## Schritt-für-Schritt: Ersteinrichtung

### Schritt 1 – Schemas & Grants (einmalig)

Im **Supabase SQL Editor** ausführen:

```sql
-- ── Schemas anlegen ──────────────────────────────────────────
CREATE SCHEMA IF NOT EXISTS test;
CREATE SCHEMA IF NOT EXISTS prod;

-- ── GRANT USAGE (PFLICHT für Custom Schemas!) ────────────────
GRANT USAGE ON SCHEMA test TO authenticator;
GRANT USAGE ON SCHEMA test TO anon;
GRANT USAGE ON SCHEMA test TO authenticated;
GRANT USAGE ON SCHEMA test TO service_role;

GRANT USAGE ON SCHEMA prod TO authenticator;
GRANT USAGE ON SCHEMA prod TO anon;
GRANT USAGE ON SCHEMA prod TO authenticated;
GRANT USAGE ON SCHEMA prod TO service_role;
```

> Datei: `supabase/migrations/000_schema_setup.sql`

---

### Schritt 2 – Tabellen & RLS-Policies für alle Schemas

Im **Supabase SQL Editor** die drei Blöcke **einzeln** ausführen:

**Block A – Schema: `public`**

```sql
SET search_path TO public;

CREATE TABLE IF NOT EXISTS members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, email TEXT NOT NULL,
  role TEXT DEFAULT '', department TEXT DEFAULT '',
  avatar_url TEXT, phone TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_members_user_id ON members(user_id);
ALTER TABLE members ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Members lesen" ON members;
CREATE POLICY "Eigene Members lesen" ON members FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members erstellen" ON members;
CREATE POLICY "Eigene Members erstellen" ON members FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members ändern" ON members;
CREATE POLICY "Eigene Members ändern" ON members FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Members löschen" ON members;
CREATE POLICY "Eigene Members löschen" ON members FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS availabilities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  member_id UUID NOT NULL REFERENCES members(id) ON DELETE CASCADE,
  status TEXT NOT NULL CHECK (status IN ('available','busy','meeting','vacation','sick','remote','offline')),
  date DATE NOT NULL, start_time TIME, end_time TIME, note TEXT,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_availabilities_user_id ON availabilities(user_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_member_id ON availabilities(member_id);
CREATE INDEX IF NOT EXISTS idx_availabilities_date ON availabilities(date);
ALTER TABLE availabilities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Availabilities lesen" ON availabilities;
CREATE POLICY "Eigene Availabilities lesen" ON availabilities FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities erstellen" ON availabilities;
CREATE POLICY "Eigene Availabilities erstellen" ON availabilities FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities ändern" ON availabilities;
CREATE POLICY "Eigene Availabilities ändern" ON availabilities FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Availabilities löschen" ON availabilities;
CREATE POLICY "Eigene Availabilities löschen" ON availabilities FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL, description TEXT,
  member_ids UUID[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_teams_user_id ON teams(user_id);
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Teams lesen" ON teams;
CREATE POLICY "Eigene Teams lesen" ON teams FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams erstellen" ON teams;
CREATE POLICY "Eigene Teams erstellen" ON teams FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams ändern" ON teams;
CREATE POLICY "Eigene Teams ändern" ON teams FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Teams löschen" ON teams;
CREATE POLICY "Eigene Teams löschen" ON teams FOR DELETE USING (auth.uid() = user_id);

CREATE TABLE IF NOT EXISTS projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('internal','external')),
  status TEXT NOT NULL CHECK (status IN ('planned','active','completed','on_hold')),
  client TEXT, description TEXT,
  member_ids UUID[] DEFAULT '{}',
  start_date DATE, end_date DATE,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_projects_user_id ON projects(user_id);
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Eigene Projects lesen" ON projects;
CREATE POLICY "Eigene Projects lesen" ON projects FOR SELECT USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects erstellen" ON projects;
CREATE POLICY "Eigene Projects erstellen" ON projects FOR INSERT WITH CHECK (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects ändern" ON projects;
CREATE POLICY "Eigene Projects ändern" ON projects FOR UPDATE USING (auth.uid() = user_id);
DROP POLICY IF EXISTS "Eigene Projects löschen" ON projects;
CREATE POLICY "Eigene Projects löschen" ON projects FOR DELETE USING (auth.uid() = user_id);
```

**Wiederhole Block A** für `test` und `prod` – ersetze nur die erste Zeile:
- Block B: `SET search_path TO test;`
- Block C: `SET search_path TO prod;`

> Vollständige SQL-Datei: `supabase/migrations/002_apply_schema_to_all.sql`

---

### Schritt 3 – Tabellen-Berechtigungen für Custom Schemas

Nach der Tabellenerstellung müssen für `test` und `prod` auch Tabellen-Grants gesetzt werden:

```sql
-- Für test-Schema
GRANT ALL ON ALL TABLES IN SCHEMA test TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA test TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO service_role;

-- Für prod-Schema
GRANT ALL ON ALL TABLES IN SCHEMA prod TO authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA prod TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prod TO authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prod TO service_role;
```

---

## Kompletter Reset – Alle Schemas

> ⚠️ **ACHTUNG: Löscht alle Daten unwiderruflich!**

```sql
-- Reset public
SET search_path TO public;
DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Reset test
SET search_path TO test;
DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;

-- Reset prod
SET search_path TO prod;
DROP TABLE IF EXISTS availabilities CASCADE;
DROP TABLE IF EXISTS projects CASCADE;
DROP TABLE IF EXISTS teams CASCADE;
DROP TABLE IF EXISTS members CASCADE;
```

> Datei: `supabase/migrations/999_reset_all_schemas.sql`

Nach dem Reset: Führe Schritte 1–3 erneut aus.

---

## Umgebungsvariablen

### Lokal (`.env.local`)

```env
NEXT_PUBLIC_SUPABASE_URL=https://<dein-projekt>.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=<anon-key>
SUPABASE_SERVICE_ROLE_KEY=<service-role-key>
NEXT_PUBLIC_DB_SCHEMA=public
```

### Vercel Preview (Test)

Im Vercel Dashboard unter **Settings → Environment Variables** für **Preview**:
```
NEXT_PUBLIC_DB_SCHEMA=test
```

### Vercel Production

Im Vercel Dashboard unter **Settings → Environment Variables** für **Production**:
```
NEXT_PUBLIC_DB_SCHEMA=prod
```

---

## Troubleshooting

### Fehler: `permission denied for schema test`
→ Schritt 1 (GRANT USAGE) wurde nicht ausgeführt. Wiederholen!

### Fehler: Daten nicht sichtbar nach Login
→ `NEXT_PUBLIC_DB_SCHEMA` auf das richtige Schema prüfen.  
→ RLS-Policies vorhanden? (`user_id = auth.uid()` muss greifen)

### Fehler: Daten nach Refresh weg
→ Die App nutzt keine LocalStorage mehr – alle Daten kommen aus einer echten DB-Verbindung.
→ Prüfe ob der User korrekt eingeloggt ist (Session aktiv).

### Daten im falschen Schema
→ Das aktive Schema prüfen in `Settings → Konfiguration` in der App.

---

## Datenschema-Übersicht

```
members          → Mitarbeiter (user_id, name, email, role, department)
availabilities   → Verfügbarkeit (member_id, date, status, start_time, end_time)
teams            → Teams (name, description, member_ids UUID[])
projects         → Projekte (name, type, status, client, member_ids UUID[])
```

Alle Tabellen sind mit **Row Level Security (RLS)** geschützt:
- Jeder User sieht nur eigene Daten (`user_id = auth.uid()`)
- INSERT/UPDATE/DELETE nur für eigene Datensätze

---

**Stand: 26.03.2026**
