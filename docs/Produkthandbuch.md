# TeamRadar – Professionelles Produkthandbuch
**Version 1.0 | März 2026 | WAMOCON GmbH**

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

### 3.3 Projekt- & Teammanagement
- **Projekte**: Unterscheidung zwischen internen und externen Projekten mit Start- und Enddatum.
- **Teams**: Gruppierung von Mitarbeitern für schnellere Filterung und Berichterstellung.
- **Zuweisungen (Allocations)**: Festlegung, zu wie viel Prozent (z.B. 50% für Projekt A) ein Mitarbeiter gebunden ist.

### 3.4 Reporting
Im Report-Bereich können Daten als CSV (für Excel/BI-Tools) oder JSON (für technische Audits) exportiert werden. Reports umfassen Auslastung, Stammdaten, Projektlisten und Verfügbarkeitshistorien.

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
- **Frontend**: Next.js 16 (App Router) mit TypeScript und Tailwind CSS.
- **State Management**: Zustand mit Cloud-Synchronisation und lokalem Persist-Modus.
- **Backend / DB**: Supabase (PostgreSQL) mit Row Level Security (RLS).
- **Authentifizierung**: Supabase Auth mit Einladungs-Tokens.

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

**Fazit**: TeamRadar ist in der vorliegenden Version 1.0 technisch und administrativ bereit für den produktiven Einsatz in compliance-sensitiven Umgebungen.
