# Supabase Setup für TeamRadar

## 1. Schemas und Rechte
- Die Schemas `public`, `test` und `prod` werden genutzt.
- Custom Schemas (test, prod) benötigen explizit: `GRANT USAGE ON SCHEMA test TO authenticator;`
- Siehe: `supabase/migrations/000_schema_setup.sql`

## 2. Migrationen/Tabellen
- Tabellen werden für alle Schemas identisch angelegt.
- Migrationen können mit `002_apply_schema_to_all.sql` für alle Schemas ausgeführt werden (ggf. Skript-Inhalt kopieren, falls Supabase SQL Editor keine Includes unterstützt).

## 3. Projekt-Konfiguration
- Das aktive Schema wird über die Umgebungsvariable `NEXT_PUBLIC_DB_SCHEMA` gesetzt.
- In `src/lib/supabase/client.ts` und `server.ts` wird das Schema dynamisch verwendet.

## 4. Seed-Daten
- Seed-Daten werden nur im Development-Modus und im `public`-Schema geladen.
- In Tests und Produktion werden keine Seed-Daten geladen (siehe Guards in Tests).


## 5. Validierung & Troubleshooting
- Prüfe im UI-Debug-Bereich, ob das gewünschte Schema aktiv ist (z.B. `public`).
- Die App zeigt nur Daten an, die zum eingeloggten Supabase-User gehören (user_id).
- Nach Änderungen an Migrationen oder .env: Projekt neu starten!
- Bei Fehlern prüfen: Supabase-URL, Key, Schema, Policies, Authentifizierung.
- LocalStorage leeren, um Demo-Daten zu vermeiden.

## 6. Tests & Checks
- Tests für Seed-Daten, Policies und Datenkonsistenz siehe `src/__tests__/`.
- Policies: RLS muss für alle Tabellen aktiv sein, Insert/Update/Delete nur für eigene Daten erlaubt.
- Migrationen: Tabellen und Policies müssen in allen Schemas identisch sein.


---

**Stand: 25.03.2026**
