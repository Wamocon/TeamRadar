
# TeamRadar

Mitarbeiter-Verfügbarkeit visualisieren und verwalten.

---

## Produkthandbuch Deployment (GitHub Pages)

Das Produkthandbuch liegt als statische HTML-Datei im Verzeichnis `docs/index.html` vor und wird automatisch über GitHub Actions auf GitHub Pages veröffentlicht.

**Wichtige Hinweise:**

- Es wird ausschließlich das `docs/`-Verzeichnis deployed (kein Next.js-Build, keine App-Abhängigkeit).
- Der Workflow `.github/workflows/gh-pages.yml` sorgt für das Deployment auf den Branch `gh-pages`.
- In den Repository-Einstellungen muss GitHub Pages auf den Branch `gh-pages` und das Verzeichnis `/` (root) zeigen.
- Die Seite ist nach erfolgreichem Deployment unter `https://<username>.github.io/<repo>/` erreichbar.

**Ablauf:**

1. Änderungen an `docs/index.html` committen und auf `main` pushen.
2. Der Workflow wird automatisch ausgelöst und deployed die Datei auf den Branch `gh-pages`.
3. Nach wenigen Minuten ist das Handbuch unter der GitHub Pages-URL verfügbar.

---

## Tech-Stack

- **Next.js 16** (App Router) + TypeScript
- **Tailwind CSS** (Dark/Light Mode)
- **Zustand** – State Management mit lokalem Persist
- **Supabase** – Auth, Datenbank, Row Level Security
- **Lucide React** – Icons
- **date-fns** – Datumsverarbeitung

## Features

- **Dashboard** – Echtzeit-Übersicht der Team-Verfügbarkeit mit Status-Karten
- **Mitarbeiter** – CRUD für Mitarbeiterprofile (Name, Rolle, Abteilung, Kontakt)
- **Verfügbarkeit** – Status eintragen (Verfügbar, Beschäftigt, Meeting, Urlaub, Krank, Remote, Offline)
- **Kalender** – Monatsansicht mit farbcodierten Verfügbarkeits-Dots
- **Teams** – Mitarbeiter in Teams/Gruppen organisieren
- **Auth** – Login/Registrierung via Supabase Auth
- **Dark/Light Mode** – Umschaltbar mit persistenter Einstellung
- **Hybrid Store** – Funktioniert lokal, synchronisiert optional mit Supabase

## Projektstruktur

```
src/
├── app/                  # Next.js App Router Seiten
│   ├── auth/login/       # Login/Registrierung
│   ├── calendar/         # Kalenderansicht
│   ├── members/          # Mitarbeiter CRUD
│   ├── teams/            # Team-Verwaltung
│   ├── settings/         # Einstellungen
│   ├── layout.tsx        # Root-Layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── layout/           # AppShell, Header, Sidebar, Footer
│   ├── team/             # MemberCard, StatusBadge, TeamGrid, Formulare
│   └── ui/               # ThemeProvider
├── lib/
│   ├── supabase/         # Client, Server, DB-Abstraktionsschicht
│   └── utils.ts          # cn() Helper
├── stores/
│   └── appStore.ts       # Zustand Store
├── types/
│   └── index.ts          # TypeScript Interfaces

└── middleware.ts          # Auth-Guard
```

## Supabase Setup & Umgebungsmanagement

- Die App nutzt Supabase als Datenbank mit den Schemas `public`, `test` und `prod`.
- Das aktive Schema wird über die Umgebungsvariable `NEXT_PUBLIC_DB_SCHEMA` gesteuert (siehe `.env.local`).
- Migrationen und Rechte siehe `README_SUPABASE.md` und `supabase/migrations/`.
- Nach Änderungen an Migrationen oder .env: Projekt neu starten!

## Validierung & Tests

- Prüfe im UI-Debug-Bereich (oben rechts), ob das gewünschte Schema aktiv ist.
- Die App zeigt nur Daten an, die zum eingeloggten Supabase-User gehören (user_id).
- Nach dem Start: LocalStorage leeren, um Demo-Daten zu vermeiden.
- Tests für Seed-Daten, Policies und Datenkonsistenz siehe `src/__tests__/`.

## Troubleshooting

- Hydration-Fehler: Badge-Rendering wurde angepasst, tritt nicht mehr auf.
- Demo-Daten werden nicht mehr automatisch geladen.
- Bei 404-Fehlern prüfen: Supabase-URL, Key, Schema, Policies, Authentifizierung.

## Setup

```bash
# Dependencies installieren
npm install

# Umgebungsvariablen anlegen
cp .env.example .env.local
# → Supabase-Credentials eintragen

# Datenbank-Schema erstellen
# → SQL aus supabase/migrations/001_initial_schema.sql im Supabase SQL-Editor ausführen

# Optional: Seed-Daten einfügen
npm run seed:supabase

# Entwicklungsserver starten
npm run dev
```

## Ohne Supabase (lokaler Modus)

Die App funktioniert auch ohne Supabase-Konfiguration. Daten werden dann nur lokal im Browser via Zustand Persist gespeichert. Die Auth-Middleware wird in diesem Fall übersprungen.
