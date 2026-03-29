import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | TeamRadar",
  description: "Datenschutzerklärung der TeamRadar – Verfügbarkeit & Projektplanung der WAMOCON GmbH.",
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung" updatedAt="März 2026">
      <LegalSection title="1. Verantwortlicher">
        <p>Verantwortlicher im Sinne der DSGVO und weiterer datenschutzrechtlicher Bestimmungen ist:</p>
        <div className="space-y-1 pt-1 font-medium">
          <p>WAMOCON GmbH</p>
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Telefon: +49 6196 5838311</p>
          <p>E-Mail: info@wamocon.com</p>
        </div>
      </LegalSection>

      <LegalSection title="2. Zweck der Datenverarbeitung">
        <p>TeamRadar dient der Verwaltung der Mitarbeiter-Verfügbarkeit und der projektspezifischen Auslastungsplanung. Personenbezogene Daten werden verarbeitet, um Team-Mitgliedern die Statusverfolgung und den Abgleich mit Projekten zu ermöglichen.</p>
      </LegalSection>

      <LegalSection title="3. Rechtsgrundlagen">
        <p>Die Verarbeitung erfolgt auf Basis von Art. 6 Abs. 1 lit. b DSGVO (Vertragserfüllung) sowie bei freiwilligen Angaben auf Basis von Art. 6 Abs. 1 lit. a DSGVO (Einwilligung).</p>
      </LegalSection>

      <LegalSection title="4. Verarbeitete Daten">
        <p>Folgende Kategorien personenbezogener Daten werden in TeamRadar verarbeitet:</p>
        <ul className="list-disc space-y-1 pl-5">
           <li>Name, E-Mail-Adresse, Telefonnummer</li>
           <li>Rolle, Abteilung, Skills</li>
           <li>Verfügbarkeitsstatus (z. B. Verfügbar, Meeting, Urlaub)</li>
           <li>Projektzuweisungen und prozentuale Auslastung</li>
           <li>Zeitstempel von Statuserfassungen</li>
        </ul>
      </LegalSection>

      <LegalSection title="5. Rechte der Betroffenen">
        <p>Sie haben das Recht auf Auskunft, Berichtigung, Löschung und Einschränkung der Verarbeitung Ihrer Daten gemäß der DSGVO. Sie können eine einmal erteilte Einwilligung jederzeit widerrufen.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
