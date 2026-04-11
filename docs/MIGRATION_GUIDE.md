# TeamRadar – Datenbank-Migrations-Anleitung

> **Ziel:** Diese Anleitung führt Schritt für Schritt durch die Einrichtung und Aktualisierung der Supabase-Datenbank für alle bisherigen Weiterentwicklungen.

---

## Voraussetzungen

| Was | Wo finden |
|---|---|
| Supabase-Projekt | [supabase.com](https://supabase.com) → dein Projekt |
| Project URL + Anon Key | Dashboard → **Project Settings → API** |
| Service Role Key | Dashboard → **Project Settings → API** (geheim!) |
| DB Connection String | Dashboard → **Project Settings → Database → URI** |

---

## Schritt 1 – `.env.local` anlegen

Kopiere `.env.example` und fülle alle Werte aus:

```bash
cp .env.example .env.local
```

```env
NEXT_PUBLIC_SUPABASE_URL=https://DEIN-PROJEKT.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=dein-anon-key
SUPABASE_SERVICE_ROLE_KEY=dein-service-role-key
SUPABASE_DB_URL=postgresql://postgres:[PASSWORD]@db.[REF].supabase.co:5432/postgres
NEXT_PUBLIC_DB_SCHEMA=teamradar-dev
```

---

## Schritt 2 – Migration 1: Kern-Schema aufbauen

Öffne im Supabase Dashboard den **SQL Editor** und führe das folgende Skript aus:

> **Datei:** `supabase/migrations/20260411_teamradar_schema_migration.sql`

**Oder direkt im Terminal (Node-Migration-Runner):**

```bash
node scripts/migrate.mjs
```

### Was dieses Skript tut

1. Erstellt das Schema `teamradar-dev`
2. Richtet RBAC-Hilfsfunktionen ein (`get_user_role_for_schema`)
3. Erstellt alle Core-Tabellen:
   - `profiles` – Nutzerprofil mit Rolle, Avatar, Display Name, Preferences
   - `members` – Mitarbeiterliste mit Abteilung und Rolle
   - `teams` – Teams
   - `projects` – Projekte (intern/extern)
   - `availabilities` – Tagesstatus pro Mitarbeiter
   - `allocations` – Projektzuweisungen pro Zeitraum
   - `user_consents` – DSGVO Einwilligungen
4. Richtet Row Level Security (RLS) auf allen Tabellen ein
5. Setzt Auth-Trigger (auto-insert in `profiles` bei neuem User)

---

## Schritt 3 – Migration 2: Neue Tabellen (system_settings, day_categories)

Diese Migration ist für die Admin-Kürzel-Verwaltung und Organisations-Einstellungen notwendig.

> **Datei:** `supabase/migrations/20260411_system_settings_day_categories.sql`

**Im SQL Editor ausführen** oder via Node-Runner.

### Was dieses Skript tut

| Tabelle | Zweck |
|---|---|
| `system_settings` | Org-Name, Logo, Support-Mail, Wartungsmodus |
| `day_categories` | Konfigurierbare Kürzel (U=Urlaub, K=Krank, eP, BeP, B, H...) |
| `profile_privacy` | DSGVO – Sichtbarkeit von Profilfeldern |

### SQL – Direkt im Supabase SQL Editor ausführen

Falls du das Skript nicht als Datei hast, hier der minimale SQL-Block für `day_categories`:

```sql
-- Schema sicherstellen
CREATE SCHEMA IF NOT EXISTS "teamradar-dev";

-- Tabelle erstellen
CREATE TABLE IF NOT EXISTS "teamradar-dev".day_categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kuerzel    TEXT NOT NULL UNIQUE,
  label      TEXT NOT NULL,
  color      TEXT NOT NULL DEFAULT '#ffffff',
  bg_color   TEXT NOT NULL DEFAULT '#8b5cf6',
  sort_order INTEGER NOT NULL DEFAULT 0,
  is_active  BOOLEAN NOT NULL DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- RLS
ALTER TABLE "teamradar-dev".day_categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "day_categories_read_all"
  ON "teamradar-dev".day_categories FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "day_categories_admin_write"
  ON "teamradar-dev".day_categories FOR ALL
  USING (public.get_user_role_for_schema('teamradar-dev') IN ('admin', 'cio', 'department_lead'));

GRANT ALL ON TABLE "teamradar-dev".day_categories TO authenticated, service_role;

-- Standard-Kürzel einfügen
INSERT INTO "teamradar-dev".day_categories (kuerzel, label, color, bg_color, sort_order) VALUES
  ('U',   'Urlaub',              '#ffffff', '#8b5cf6', 1),
  ('K',   'Krank',               '#ffffff', '#ec4899', 2),
  ('eP',  'Ext. Projekt',        '#ffffff', '#f97316', 3),
  ('BeP', 'Büro ext.',           '#ffffff', '#fb923c', 4),
  ('B',   'Büro intern',         '#ffffff', '#6366f1', 5),
  ('H',   'Homeoffice',          '#ffffff', '#06b6d4', 6),
  ('S',   'Schulung',            '#ffffff', '#a855f7', 7),
  ('P',   'Presales',            '#ffffff', '#0ea5e9', 8)
ON CONFLICT (kuerzel) DO NOTHING;
```

---

## Schritt 4 – system_settings

```sql
SET search_path TO "teamradar-dev";

CREATE TABLE IF NOT EXISTS "teamradar-dev".system_settings (
  id               TEXT PRIMARY KEY DEFAULT 'global',
  org_name         TEXT NOT NULL DEFAULT 'TeamRadar',
  org_logo_url     TEXT,
  support_email    TEXT,
  maintenance_mode BOOLEAN NOT NULL DEFAULT FALSE,
  updated_at       TIMESTAMPTZ DEFAULT now()
);

INSERT INTO "teamradar-dev".system_settings (id, org_name, support_email)
VALUES ('global', 'Wamocon GmbH', 'info@wamocon.de')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE "teamradar-dev".system_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY IF NOT EXISTS "system_settings_read_all"
  ON "teamradar-dev".system_settings FOR SELECT USING (true);

CREATE POLICY IF NOT EXISTS "system_settings_admin_write"
  ON "teamradar-dev".system_settings FOR UPDATE
  USING (public.get_user_role_for_schema('teamradar-dev') = 'admin');

GRANT ALL ON TABLE "teamradar-dev".system_settings TO authenticated, service_role;
```

---

## Schritt 5 – AvailabilityStatus erweitern (extern-onsite / extern-remote)

Die neuen Status `extern-onsite` und `extern-remote` werden im Frontend als neue `AvailabilityStatus`-Werte gespeichert. Falls dein `availabilities`-Schema ein CHECK-Constraint auf den Status hat, führe folgendes aus:

```sql
-- Prüfen ob ein CHECK Constraint existiert
SELECT conname, pg_get_constraintdef(oid)
FROM pg_constraint
WHERE conrelid = '"teamradar-dev".availabilities'::regclass
  AND contype = 'c';

-- Constraint ggf. erweitern (Name anpassen):
ALTER TABLE "teamradar-dev".availabilities
  DROP CONSTRAINT IF EXISTS availabilities_status_check;

ALTER TABLE "teamradar-dev".availabilities
  ADD CONSTRAINT availabilities_status_check
  CHECK (status IN (
    'available', 'busy', 'meeting', 'vacation', 'sick',
    'remote', 'offline', 'extern-onsite', 'extern-remote'
  ));
```

---

## Schritt 6 – Auth-Trigger für neue User sicherstellen

Dieser Trigger legt automatisch ein `profile` an, wenn sich ein neuer User registriert:

```sql
-- Funktion (idempotent)
CREATE OR REPLACE FUNCTION public.handle_new_user_teamradar_dev()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO "teamradar-dev".profiles (
    id, email, display_name, role, created_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', split_part(NEW.email, '@', 1)),
    COALESCE(NEW.raw_user_meta_data->>'role', 'employee'),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END;
$$;

-- Trigger (idempotent)
DROP TRIGGER IF EXISTS on_auth_user_created_teamradar_dev ON auth.users;
CREATE TRIGGER on_auth_user_created_teamradar_dev
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user_teamradar_dev();
```

---

## Schritt 7 – Bestehenden User mit Admin-Rolle versehen

Ersetze `DEINE-USER-UUID` mit der UUID deines Supabase-Users (zu finden unter **Authentication → Users**):

```sql
UPDATE "teamradar-dev".profiles
SET role = 'admin'
WHERE id = 'DEINE-USER-UUID';
```

Außerdem den optionalen `members`-Eintrag anlegen:

```sql
INSERT INTO "teamradar-dev".members (user_id, name, department, role)
VALUES (
  'DEINE-USER-UUID',
  'Max Mustermann',
  'Management',
  'admin'
)
ON CONFLICT (user_id) DO UPDATE
  SET name = EXCLUDED.name,
      department = EXCLUDED.department,
      role = EXCLUDED.role;
```

---

## Schritt 8 – Alles prüfen

Nach Ausführung aller Schritte folgende Checks im SQL Editor:

```sql
-- Tabellen vorhanden?
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'teamradar-dev'
ORDER BY table_name;

-- Kürzel eingetragen?
SELECT * FROM "teamradar-dev".day_categories ORDER BY sort_order;

-- system_settings vorhanden?
SELECT * FROM "teamradar-dev".system_settings;

-- Eigenes Profil + Rolle prüfen:
SELECT id, email, role, display_name
FROM "teamradar-dev".profiles
ORDER BY created_at;
```

---

## Schritt 9 – App starten

```bash
npm install
npm run dev
```

Die App läuft auf [http://localhost:3000](http://localhost:3000).

---

## Häufige Fehler

| Fehler | Lösung |
|---|---|
| `relation "teamradar-dev.day_categories" does not exist` | Schritt 3 ausführen |
| `function public.get_user_role_for_schema does not exist` | Migration 1 (Schritt 2) zuerst ausführen |
| Admin hat keine erhöhten Rechte | Schritt 7: Rolle auf `admin` setzen |
| `permission denied for schema "teamradar-dev"` | `GRANT USAGE ON SCHEMA "teamradar-dev" TO authenticated;` ausführen |
| Kürzel-Tab leer nach Login | Schritt 3 ausführen + Seed-Daten aus Schritt 3 einfügen |

---

## Reihenfolge auf einen Blick

```
1. .env.local anlegen
2. Migration 1 ausführen  (teamradar_schema_migration.sql)
3. Migration 2 ausführen  (system_settings_day_categories.sql)
4. Status CHECK-Constraint erweitern
5. Auth-Trigger sicherstellen
6. Eigenen User als admin setzen
7. App starten + Kürzel über Admin-UI oder Seed-Button befüllen
```
