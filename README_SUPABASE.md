# TeamRadar – Supabase Setup & Betriebshandbuch

## Überblick

TeamRadar nutzt **drei Supabase-Schemas** für verschiedene Umgebungen:

| Schema   | Umgebung           | Env-Variable                    |
|----------|--------------------|---------------------------------|
| `public` | Lokal / Entwicklung| `NEXT_PUBLIC_DB_SCHEMA=public`  |
| `test`   | Vercel Preview     | `NEXT_PUBLIC_DB_SCHEMA=test`    |
| `prod`   | Vercel Production  | `NEXT_PUBLIC_DB_SCHEMA=prod`    |

---

## ⚠️ Wichtig: Custom Schemas & Berechtigungen

Supabase vergibt bei Custom Schemas (`test`, `prod`) **keine** Rechte automatisch. Ohne explizite Freigaben scheitert die App mit `permission denied`.

### 1. Schema-Ebene (GRANT USAGE)
Die Rollen müssen das Schema grundsätzlich "sehen" dürfen.
```sql
GRANT USAGE ON SCHEMA test TO anon, authenticated, authenticator, service_role;
GRANT USAGE ON SCHEMA prod TO anon, authenticated, authenticator, service_role;
```

### 2. Tabellen-Ebene (GRANT ALL)
Nachdem die Tabellen erstellt wurden, müssen sie für die Rollen freigegeben werden. **Wichtig:** Auch die Rolle `anon` benötigt Zugriff, damit der initiale Verbindungsaufbau klappt.
```sql
-- Beispiel für test
GRANT ALL ON ALL TABLES IN SCHEMA test TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO anon, authenticated, service_role;

-- Beispiel für prod
GRANT ALL ON ALL TABLES IN SCHEMA prod TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prod TO anon, authenticated, service_role;
```

---

## Schritt-für-Schritt: Ersteinrichtung

### Schritt 1 – Schemas anlegen & Grundrechte
Führe `supabase/migrations/000_schema_setup.sql` aus. Dieses Skript legt die Schemas an und vergibt die `USAGE`-Rechte.

### Schritt 2 – Tabellen erzeugen
Führe `supabase/migrations/002_apply_schema_to_all.sql` aus. 
**Hinweis:** Du musst den Block für jedes Schema einzeln ausführen, indem du oben `SET search_path TO <schema>;` anpasst.

### Schritt 3 – Tabellen-Rechte (Master-Fix)
Führe diesen Block aus, um sicherzustellen, dass alle Rollen auf die Tabellen zugreifen können:
```sql
-- prod
GRANT ALL ON ALL TABLES IN SCHEMA prod TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA prod TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA prod GRANT ALL ON TABLES TO anon, authenticated, service_role;

-- test
GRANT ALL ON ALL TABLES IN SCHEMA test TO anon, authenticated, service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA test TO anon, authenticated, service_role;
ALTER DEFAULT PRIVILEGES IN SCHEMA test GRANT ALL ON TABLES TO anon, authenticated, service_role;
```

---

## Kompletter Reset – Alle Schemas

> ⚠️ **ACHTUNG: Löscht alle Daten unwiderruflich!**

Verwende das Skript `supabase/migrations/999_reset_all_schemas.sql`.

---

## Umgebungsvariablen

### Vercel / Cloud Setup
Stelle sicher, dass in den Vercel Project Settings unter **Environment Variables** die Variable `NEXT_PUBLIC_DB_SCHEMA` für die jeweilige Umgebung (Preview/Production) gesetzt ist.

---

## Fehlerbehebung (Troubleshooting)

### "permission denied for schema ..."
-> `GRANT USAGE` aus Schritt 1 fehlt.

### "permission denied for table ..."
-> `GRANT ALL ON ALL TABLES` aus Schritt 3 fehlt.

### UI bleibt leer oder "Datenbankfehler" erscheint
-> Prüfe die Browser-Konsole (F12). Wenn dort ein `403` Fehler steht, sind es Berechtigungen.
-> Prüfe in `.env.local`, ob `NEXT_PUBLIC_DB_SCHEMA` korrekt auf `public`, `test` oder `prod` steht.

---
**Stand: 26.03.2026**
