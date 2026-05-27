
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
- **Mitarbeiter** – CRUD für Mitarbeiterprofile inkl. HR-Daten, Notfallkontakt und Adresse
- **14 Verfügbarkeits-Status** – Verfügbar, Büro intern, Meeting, Urlaub, Krank, Homeoffice intern, Offline, Ext. Projekt, Büro ext. Projekt, **HeP/BS/BBS/BU/U** (v1.2 neu)
- **Kalender** – Monatsansicht mit farbcodierten Verfügbarkeits-Dots und Feiertagen
- **Jahresübersicht** – 12-Monats-Kompaktansicht mit Drag-to-select und rollenbasiertem Filter
- **Teams** – Mitarbeiter in Teams/Gruppen organisieren
- **Projekte & Allocations** – Projektbindung mit prozentualer Kapazitätssteuerung
- **Auslastung** – Visualisierung der Mitarbeiterauslastung über Zeiträume
- **Alerts** – Automatische Warnungen bei Überbuchung (>100 %) und Urlaubs-/Krankheitskonflikten
- **Reports** – Export von Auslastungs- und Stammdatenbericht (CSV / JSON)
- **Admin** – Compliance-Übersicht, Benutzerverwaltung und Organisationseinstellungen
- **Auth** – Login/Registrierung via Supabase Auth mit AGB/Datenschutz-Zustimmung
- **Chat** – Floating-Popup (unten rechts) mit Ungelesen-Badge, global verfügbar
- **Adaptive Modalgröße** – S/M/L mit proportionaler Breite und Höhe
- **Visueller Kontrast** – Sichtbare Borders, Schatten-Tokens und klare Oberflächenhierarchie
- **Dark/Light Mode** – Umschaltbar, alle UI-Elemente ausnahmslos themefähig
- **Hybrid Store** – Funktioniert lokal, synchronisiert optional mit Supabase
- **Feiertags-Management** – Gesetzliche Feiertage nach Bundesland (alle 16 Bundesländer)

## Projektstruktur

```
src/
├── app/                  # Next.js App Router Seiten
│   ├── auth/             # Login / Registrierung
│   ├── calendar/         # Kalenderansicht
│   ├── members/          # Mitarbeiter CRUD
│   ├── teams/            # Team-Verwaltung
│   ├── projects/         # Projektverwaltung
│   ├── year/             # Jahresübersicht (12-Monats-Ansicht)
│   ├── utilization/      # Auslastungsübersicht
│   ├── alerts/           # Warnungen & Konflikte
│   ├── reports/          # Export & Berichte
│   ├── admin/            # Admin-Bereich (Compliance, User)
│   ├── settings/         # Einstellungen
│   ├── agb/              # AGB (Rechtseite)
│   ├── datenschutz/      # Datenschutzerklärung
│   ├── impressum/        # Impressum
│   ├── layout.tsx        # Root-Layout
│   └── page.tsx          # Dashboard
├── components/
│   ├── layout/           # AppShell, Header, Sidebar, Footer
│   ├── team/             # MemberCard, StatusBadge, TeamGrid, Formulare
│   ├── dashboard/        # Dashboard-Komponenten
│   ├── ui/               # ThemeProvider, Modal-System
│   └── legal/            # AGB, Datenschutz, Impressum
├── lib/
│   ├── supabase/         # Client, Server, DB-Abstraktionsschicht
│   ├── holidays.ts       # Gesetzliche Feiertage nach Bundesland
│   ├── excel-import.ts   # Excel-Datei-Import für Mitarbeiter
│   └── utils.ts          # cn() Helper
├── stores/
│   └── appStore.ts       # Zustand Store
├── types/
│   └── index.ts          # TypeScript Interfaces
└── proxy.ts              # Auth-Guard (Session-Middleware)
```

## Supabase Setup & Umgebungsmanagement

- Die App nutzt Supabase als Datenbank mit den Schemas `teamradar-dev`, `teamradar-test` und `teamradar-prod`.
- Das aktive Schema wird über die Umgebungsvariable `NEXT_PUBLIC_DB_SCHEMA` gesteuert (siehe `.env.local`).
- Migrationen und Rechte siehe `README_SUPABASE.md` und `supabase/migrations/`.
- Nach Änderungen an Migrationen oder .env: Projekt neu starten!

## Validierung & Tests

- Prüfe im UI-Debug-Bereich (oben rechts), ob das gewünschte Schema aktiv ist.
- Die App zeigt nur Daten an, die zum eingeloggten Supabase-User gehören (user_id).
- Nach dem Start: LocalStorage leeren, um Demo-Daten zu vermeiden.
- Tests für Seed-Daten, Policies und Datenkonsistenz siehe `src/__tests__/`.
- **Testabdeckung: 100 %** auf allen Metriken (430 Tests) – geprüft mit Vitest + v8.

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
