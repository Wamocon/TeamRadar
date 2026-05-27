# TeamRadar – Professionelles Produkthandbuch
**Version 1.2 | Mai 2026 | WAMOCON GmbH**

---

## 1. Executive Summary
TeamRadar ist eine hochspezialisierte Software-as-a-Service (SaaS) Lösung zur Echtzeit-Visualisierung der Mitarbeiterverfügbarkeit und zur strategischen Projektauslastungsplanung. Entwickelt für moderne Beratungs- und IT-Häuser, ermöglicht TeamRadar eine transparente Koordination von Teams über Abteilungen hinweg, minimiert Überbuchungsrisiken und optimiert die Ressourcenallokation. Durch die nahtlose Integration von Compliance-Vorgaben und einem robusten Rollenmodell bietet die Anwendung eine revisionssichere Grundlage für das operative Management.

---

## 2. Produktübersicht
### 2.1 Produktdefinition
TeamRadar agiert als zentrales Steuerungs-Instrument für die personelle Kapazitätsplanung. Es synergetisiert Stammdatenverwaltung mit dynamischen Verfügbarkeitsmetriken.

### 2.2 Kernnutzen
- **Echtzeit-Transparenz**: Sofortige Übersicht über den Anwesenheits- und Meetingstatus aller Mitarbeiter.
- **Strategische Planung**: Zuweisung von Mitarbeitern zu internen und externen Projekten mit prozentualer Kapazitätssteuerung.
- **Fehlzeitenmanagement**: Integrierte Erfassung von Urlaub, Krankheit und Remote-Arbeit.
- **Reporting & Export**: Automatisierte Generierung von Auslastungsberichten für Projektleiter und Geschäftsführung.
- **Compliance-by-Design**: Technisch erzwungene Zustimmung zu AGB und Datenschutz bei Registrierung.

### 2.3 Zielgruppen
- **Geschäftsführung (CIO/CTO)**: Überwachung der Gesamtauslastung und strategische Ressourcenplanung.
- **Abteilungsleiter (Department Leads)**: Operative Teamkoordination und Konfliktmanagement.
- **Projektleiter**: Projektbezogene Mitarbeiterallokation und Budget-Monitoring.
- **Endbenutzer (Employees)**: Statusselbstverwaltung und Projektübersicht.

---

## 3. Benutzerhandbuch
### 3.1 Registrierung & Onboarding
Der Registrierungsprozess ist ein zweistufiges Sicherheitsverfahren:
1. **Einladung**: Administratoren laden Nutzer per E-Mail ein.
2. **Aktivierung**: Der Nutzer setzt ein Passwort und muss **zwingend** den aktuellen AGB und der Datenschutzerklärung zustimmen. Ohne diese explizite Zustimmung (Opt-in) ist kein Zugriff auf die Plattform möglich.

### 3.2 Dashboard & Statusverwaltung
Das Dashboard bietet eine aggregierte Sicht auf das Team:
- **Statuskarten**: Schnelleinsicht in Verfügbar, Meeting, Krank, Urlaub etc.
- **Timeline-Ansicht**: Visualisierung der Verfügbarkeit über den Tagesverlauf.
- **Status-Eintrag**: Nutzer können ihren Status mit Zeitangaben und Notizen versehen.
- **Alerts**: Automatische Warnungen bei Überbuchung (>100 %) und Konflikten mit Urlaub/Krankheit.

#### 3.2.1 Statistiklogik und Konsistenzregeln
- **Urlaubstage (Jahr)** im Dashboard zählen die Anzahl der `vacation`-Einträge im aktuellen Kalenderjahr.
- Tageskarten wie **Verfügbar**, **Im Meeting** oder **Remote** beziehen sich auf den Status am aktuellen Tag.
- Zur Datenkonsistenz werden Legacy-Statuswerte (z. B. `urlaub`, `krank`, `homeoffice`, `vacation_day`) auf den aktuellen Statuskatalog normalisiert.
- Für Abteilungs-Auswertungen werden leere Werte auf **Ohne Abteilung** abgebildet, damit keine Mitarbeitenden aus Aggregationen herausfallen.

### 3.3 Projekt- & Teammanagement
- **Projekte**: Unterscheidung zwischen internen und externen Projekten mit Start- und Enddatum.
- **Teams**: Gruppierung von Mitarbeitern für schnellere Filterung und Berichterstellung.
- **Zuweisungen (Allocations)**: Festlegung, zu wie viel Prozent (z.B. 50 % für Projekt A) ein Mitarbeiter gebunden ist.
- **Auslastungsübersicht**: Prozentuale Darstellung der Kapazitätsauslastung je Mitarbeiter und Team.

### 3.4 Jahresübersicht
Die Jahresansicht (`/year`) bietet eine komprimierte 12-Monats-Übersicht aller Verfügbarkeiten:
- Farbcodierte Darstellung von Urlaub, Krankheit und anderen Statusarten je Monat.
- Gefilterte Anzeige nach Mitarbeitern und Teams.
- Automatische Einblendung gesetzlicher Feiertage des konfigurierten Bundeslandes.
- **Drag-to-select**: Mehrere Zellen durch gedrücktes Halten und Ziehen gleichzeitig auswählen.
- **Rollenbasierter Filter „Nur meine"**: Zeigt Mitarbeiter entsprechend der Rolle an (Mitarbeiter: eigene Zeile; Abteilungsleiter: eigene Abteilung; Admin/CIO: alle).

### 3.5 Feiertags-Management
TeamRadar wertet die gesetzlichen Feiertage automatisch aus:
- Konfigurierbar je Bundesland (16 Bundesländer unterstützt, inkl. regionaler Feiertage).
- Feiertage werden in der Kalender- und Jahresansicht hervorgehoben.
- Konflikte zwischen Projektallokation und Feiertagen können so frühzeitig erkannt werden.

### 3.6 Reporting
Im Report-Bereich können Daten als CSV (für Excel/BI-Tools) oder JSON (für technische Audits) exportiert werden. Reports umfassen Auslastung, Stammdaten, Projektlisten und Verfügbarkeitshistorien.

### 3.7 Verfügbarkeits-Status (v1.2)
TeamRadar unterstützt 14 Statusarten – darunter fünf neue Typen für Berater in Ausbildung und Studium:

| Kürzel | Status-Schlüssel | Label | Farbe |
| :---: | :--- | :--- | :--- |
| ✓ | `available` | Verfügbar | Grün |
| B | `busy` | Büro intern | Indigo |
| M | `meeting` | Im Meeting | Amber |
| U | `vacation` | Urlaub | Violett |
| K | `sick` | Krank | Pink |
| H | `remote` | **Homeoffice intern** (umbenannt) | Cyan |
| – | `offline` | Kein Status | Grau |
| eP | `extern-onsite` | Ext. Projekt | Orange |
| BeP | `extern-remote` | Büro ext. Projekt | Orange-hell |
| **HeP** | `home-extern` | **Homeoffice ext. Projekt** | Cyan-dunkel |
| **BS** | `berufsschule` | **Berufschule** | Gelb |
| **BBS** | `buero-berufsschule` | **Büro Berufschule** | Dunkelgelb |
| **BU** | `buero-uni` | **Büro Universität** | Blau |
| **U** | `uni` | **Universität** | Dunkelviolett |

> Fett markierte Einträge sind in v1.2 neu. `remote` wurde von „Remote" zu „Homeoffice intern" umbenannt.

### 3.8 Chat (Floating-Popup)
Ein persistentes Chat-Fenster ist über den Knopf unten rechts auf allen Seiten erreichbar. Es lässt sich auf- und zuklappen, zeigt ungelesene Nachrichten als Badge und unterstützt vollständiges Hell-/Dunkel-Theming.

### 3.9 Erweitertes Mitarbeiterprofil
Das Mitarbeiterprofil (`/settings/profile`) wurde um vier neue Sektionen erweitert:
- **HR & Vertragsdaten**: Mitarbeiternummer, Kostenstelle, Vertragsart, Probezeit, Urlaubsanspruch, Resturlaub, Austrittsdatum.
- **Notfallkontakt**: Name, Telefon, Verwandtschaftsverhältnis.
- **Heimatadresse**: Straße, PLZ, Ort, Staatsangehörigkeit, Familienstand.
- **Kommunikation & Team**: Slack, MS Teams, Durchwahl, Mentor, bevorzugte Projektarten, Schichtbereitschaft.

### 3.10 Modalgröße (S / M / L)
Modale Dialoge passen sich proportional in Breite **und** Höhe an die gewählte Größe an:
- **S (Klein)**: max-w-lg / max-h-[55vh]
- **M (Mittel)**: max-w-2xl / max-h-[75vh]
- **L (Groß)**: max-w-[95vw] / max-h-[92vh]

---

## 4. Rollen- und Berechtigungskonzept
TeamRadar nutzt ein hierarchisches Rollenmodell:
| Rolle | Beschreibung | Berechtigungen |
| :--- | :--- | :--- |
| **Admin** | Systemadministrator | Vollzugriff, Benutzermanagement, Compliance-Audit, Projekt-CRUD |
| **CIO** | Geschäftsführung | Lesender Zugriff auf alle Reports, globale Auslastungsübersicht |
| **Dept. Lead** | Abteilungsleiter | Teamverwaltung der eigenen Abteilung, Projektzuweisungen |
| **Employee** | Mitarbeiter | Statusänderung, Ansicht der eigenen Projekte und Team-Verfügbarkeit |

---

## 5. Technische Architektur
### 5.1 Systemübersicht
- **Frontend**: Next.js 16 (App Router) mit TypeScript und Tailwind CSS v4.
- **State Management**: Zustand mit Cloud-Synchronisation und lokalem Persist-Modus.
- **Backend / DB**: Supabase (PostgreSQL) mit Row Level Security (RLS).
- **Authentifizierung**: Supabase Auth mit Einladungs-Tokens.
- **Auth-Proxy**: `src/proxy.ts` schützt alle Routen mit session-basiertem Auth-Guard.
- **Testabdeckung**: 100 % Zeilen-, Branch-, Funktions- und Statement-Abdeckung (Vitest + v8).
- **Validierungs-Pipeline**:
	- `npm run validate`: Lint + Typecheck + Coverage-Tests
	- `npm run validate:strict`: erweitert um CI-Reporter und Artefakt-Generierung
- **Design-System**: CSS-Token-basiertes Hell-/Dunkel-Theming mit sichtbaren Kontraststufen (`--border`, `--shadow-sm/md/lg`, `--glass-border`). Weißer Kartengrund (`--bg-surface: #ffffff`) auf grauem Basis-Layout (`--bg-base: #e8edf4`) für klare visuelle Elementtrennung.

### 5.2 Offline-Konzept
TeamRadar nutzt einen hybriden Store-Ansatz. Daten werden im lokalen Browser-Speicher gepuffert, was eine unterbrechungsfreie Nutzung bei instabiler Internetverbindung erlaubt. Die Synchronisation erfolgt automatisch bei Wiederherstellung der Verbindung.

---

## 6. Datenverarbeitung und Datenschutz
### 6.1 Compliance-Governance
TeamRadar implementiert eine strikte **Consent-Engine**:
- **Timestamping**: Jede Zustimmung (AGB/Datenschutz) wird mit Version und Zeitstempel in einer separaten Audit-Tabelle (`user_consents`) gespeichert.
- **Bestandsnutzer-Regelung**: Nutzer aus der Zeit vor Einführung der Engine werden als "unvollständig" markiert und bei Bedarf zur Neuzustimmung aufgefordert.

---

## 7. Admin-Auswertung & Governance
Administratoren verfügen über eine dedizierte **Compliance-Ansicht**:
- Auswertung des Zustimmungsstatus pro Nutzer.
- Einsicht in akzeptierte Versionen der Rechtstexte.
- Filterung nach "Nicht-Konformität" zur gezielten organisatorischen Nachbearbeitung.

---

## 8. K6-Synthese: Compliance-Framework
Dieses Framework strukturiert die Reife der Anwendung in Bezug auf Governance:
1. **Produkt-Compliance**: Technisch erzwungene Prozesse statt organisatorischer Hoffnung.
2. **Rollen-Transparenz**: Eindeutige Trennung von administrativen und operativen Datenräumen über RLS.
3. **Nachweisbarkeit**: Lückenlose Historie der Nutzerzustimmungen für Audits.
4. **Resilienz**: Sicherstellung der Datenintegrität durch Validierungsschichten im Frontend und Backend.

---

## 9. Audit-Bericht & Fazit
### 9.1 Status-Quo
Frühere Dokumentationslücken wurden durch die Integration der Rechtstexte direkt in die Applikation geschlossen. Die Einführung der versionierten Zustimmungsspeicherung hebt den Produktreifegrat auf ein professionelles Enterprise-Niveau.

### 9.2 Offene Punkte (Organisatorisch)
- Letzte juristische Endprüfung der spezifischen AGB-Formulierungen durch einen Fachanwalt.
- Abschluss von AVV/DPA Verträgen mit Drittanbietern (z.B. Hosting-Provider).

**Fazit**: TeamRadar ist in der vorliegenden Version 1.2 technisch und administrativ bereit für den produktiven Einsatz in compliance-sensitiven Umgebungen. Die neue Jahresübersicht mit Drag-to-select und rollenbasiertem Filter, das erweiterte Berater-Statussystem (14 Statusarten), das Chat-Floating-Panel, die stark erweiterten Mitarbeiterprofile sowie das überarbeitete visuelle Kontrastsystem runden das Produkt zu einer vollständigen Kapazitätsplanungslösung ab. Die lückenlose Testabdeckung (430 Tests, 100 % nach allen Metriken) garantiert eine hohe Softwarequalität und Wartbarkeit.
