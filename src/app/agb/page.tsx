import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "AGB | TeamRadar",
  description: "Allgemeine Geschäftsbedingungen für TeamRadar – Verfügbarkeit & Projektplanung.",
};

export default function AgbPage() {
  return (
    <LegalPageShell title="Allgemeine Geschäftsbedingungen" updatedAt="März 2026">
      <LegalSection title="§ 1 Geltungsbereich">
        <p>(1) Diese Allgemeinen Geschäftsbedingungen (nachfolgend „AGB“) der WAMOCON GmbH, Mergenthalerallee 79 – 81, 65760 Eschborn (nachfolgend „Anbieter“), gelten für alle Verträge über die Nutzung der Software-as-a-Service-Plattform TeamRadar (nachfolgend „Plattform“), die über die Website teamradar.app bereitgestellt wird.</p>
        <p>(2) Die Plattform richtet sich an Unternehmen, Beratungsagenturen, Entwicklerteams und sonstige gewerbliche Einheiten (nachfolgend „Auftraggeber“) sowie deren Benutzer (nachfolgend „Nutzer“). Es handelt sich um ein B2B-Angebot.</p>
        <p>(3) Abweichende, entgegenstehende oder ergänzende AGB des Auftraggebers werden nicht Vertragsbestandteil, es sei denn, der Anbieter stimmt deren Geltung ausdrücklich schriftlich zu.</p>
        <p>(4) Die Plattform wird laufend weiterentwickelt. Soweit einzelne Funktionen im Rahmen einer Pilot- oder Testphase bereitgestellt werden, behält sich der Anbieter vor, den Funktionsumfang in diesen Bereichen zu ändern.</p>
      </LegalSection>

      <LegalSection title="§ 2 Vertragsschluss">
        <p>(1) Die Darstellung der Plattform auf der Website stellt kein verbindliches Angebot im Sinne des § 145 BGB dar, sondern eine Aufforderung zur Abgabe eines Angebots.</p>
        <p>(2) Der Auftraggeber gibt ein verbindliches Angebot ab, indem er den Registrierungsprozess abschließt oder einen Einladungsprozess annimmt und diese AGB akzeptiert.</p>
        <p>(3) Der Vertrag kommt zustande, wenn der Anbieter das Angebot durch Freischaltung des Zugangs annimmt oder der Zugang technisch bereitgestellt wird.</p>
      </LegalSection>

      <LegalSection title="§ 3 Leistungsbeschreibung">
        <p>(1) Der Anbieter stellt dem Auftraggeber TeamRadar als Software-as-a-Service (SaaS) zur Verfügung. Die Plattform ist eine digitale Lösung für Mitarbeiter-Verfügbarkeitsmanagement, Projektplanung und Auslastungssteuerung.</p>
        <p>(2) Die Plattform umfasst insbesondere folgende Funktionsbereiche:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Dashboard zur Echtzeit-Übersicht der Team-Verfügbarkeit</li>
          <li>Mitarbeiterverwaltung mit Rollen, Abteilungen und Skills</li>
          <li>Statusverfolgung (Verfügbar, Meeting, Urlaub, Krank, Remote, Offline)</li>
          <li>Projektverwaltung (intern/extern) mit Statusplanung</li>
          <li>Zuweisung von Mitarbeitern zu Projekten inkl. prozentualer Auslastung</li>
          <li>Berichterstellung und Datenexport (CSV, JSON)</li>
          <li>Kalenderansicht mit farbcodierten Verfügbarkeiten</li>
        </ul>
        <p>(3) Der Anbieter ist berechtigt, die Plattform technisch weiterzuentwickeln.</p>
      </LegalSection>

      <LegalSection title="§ 4 Nutzungsrechte">
        <p>(1) Der Anbieter räumt dem Auftraggeber für die Dauer des Vertrags ein einfaches, nicht übertragbares Recht ein, die Plattform bestimmungsgemäß zu nutzen.</p>
        <p>(2) Zugangsdaten sind ausschließlich den benannten Nutzern zur Verfügung zu stellen.</p>
        <p>(3) Alle Rechte an der Plattform verbleiben beim Anbieter. Vom Auftraggeber eingestellte Inhalte verbleiben in dessen Eigentum.</p>
      </LegalSection>

      <LegalSection title="§ 5 Datenschutz">
        <p>(1) Der Anbieter verarbeitet personenbezogene Daten im Einklang mit der DSGVO und weiteren anwendbaren Datenschutzvorschriften.</p>
        <p>(2) Einzelheiten ergeben sich aus der gesonderten Datenschutzerklärung.</p>
      </LegalSection>

      <LegalSection title="§ 6 Haftung">
        <p>(1) Der Anbieter haftet unbeschränkt für Schäden aus der Verletzung des Lebens, des Körpers oder der Gesundheit.</p>
        <p>(2) Bei leicht fahrlässiger Verletzung wesentlicher Vertragspflichten ist die Haftung auf den vertragstypischen, vorhersehbaren Schaden beschränkt.</p>
      </LegalSection>

      <LegalSection title="§ 7 Schlussbestimmungen">
        <p>(1) Es gilt das Recht der Bundesrepublik Deutschland unter Ausschluss des UN-Kaufrechts.</p>
        <p>(2) Sofern der Auftraggeber Kaufmann ist, ist ausschließlicher Gerichtsstand Frankfurt am Main.</p>
      </LegalSection>

      <LegalSection title="Kontakt">
        <p>Fragen zu den AGB an:</p>
        <div className="space-y-1 pt-1 font-medium">
          <p>WAMOCON GmbH</p>
          <p>Mergenthalerallee 79 – 81, 65760 Eschborn</p>
          <p>E-Mail: info@wamocon.com</p>
        </div>
      </LegalSection>
    </LegalPageShell>
  );
}
