import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "Impressum | TeamRadar",
  description: "Anbieterkennzeichnung der TeamRadar – Verfügbarkeit & Projektplanung der WAMOCON GmbH.",
};

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum" updatedAt="März 2026">
      <LegalSection title="Angaben gemäß § 5 TMG">
        <div className="space-y-1 pt-1 font-medium">
          <p>WAMOCON GmbH</p>
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Telefon: +49 6196 5838311</p>
          <p>E-Mail: info@wamocon.com</p>
        </div>
      </LegalSection>

      <LegalSection title="Vertretungsberechtigter Geschäftsführer">
        <p>Dipl.-Ing. Waleri Moretz</p>
      </LegalSection>

      <LegalSection title="Handelsregister und Registernummer">
        <p>HRB 123666</p>
        <p>Amtsgericht Frankfurt am Main</p>
      </LegalSection>

      <LegalSection title="Umsatzsteuer-Identifikationsnummer gemäß § 27 a UStG">
        <p>DE344930486</p>
      </LegalSection>

      <LegalSection title="Haftung für Inhalte">
        <p>Nach § 7 Abs. 1 TMG sind wir als Diensteanbieter für eigene Inhalte auf diesen Seiten nach den allgemeinen Gesetzen verantwortlich. Wir sind jedoch nicht verpflichtet, übermittelte oder gespeicherte fremde Informationen zu überwachen.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
