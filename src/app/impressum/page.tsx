import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "Impressum | TeamRadar",
  description: "Impressum der TeamRadar der WAMOCON GmbH.",
};

export default function ImpressumPage() {
  return (
    <LegalPageShell title="Impressum" updatedAt="März 2026">
      <LegalSection title="Anbieter">
        <h3 className="text-lg font-bold">WAMOCON GmbH</h3>
        <div className="mt-4 space-y-1 text-sm leading-relaxed text-muted-foreground">
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Deutschland</p>
        </div>
      </LegalSection>

      <LegalSection title="Kontakt">
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>
            Telefon: <a className="font-medium text-blue-600 hover:underline" href="tel:+4961965838311">+49 6196 5838311</a>
          </p>
          <p>
            E-Mail: <a className="font-medium text-blue-600 hover:underline" href="mailto:info@wamocon.com">info@wamocon.com</a>
          </p>
          <p>
            Projektkontakt TeamRadar: <a className="font-medium text-blue-600 hover:underline" href="mailto:info@teamradar.app">info@teamradar.app</a>
          </p>
        </div>
      </LegalSection>

      <LegalSection title="Vertretungsberechtigter Geschäftsführer">
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">Dipl.-Ing. Waleri Moretz</p>
      </LegalSection>

      <LegalSection title="Registereintrag">
        <div className="mt-4 space-y-2 text-sm leading-relaxed text-muted-foreground">
          <p>Sitz der Gesellschaft: Eschborn</p>
          <p>Handelsregister: Eschborn HRB 123666</p>
          <p>Umsatzsteuer-Identifikationsnummer: DE344930486</p>
        </div>
      </LegalSection>

      <LegalSection title="Angaben zum Angebot">
        <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
          TeamRadar ist eine webbasierte Software-as-a-Service-Plattform für Personalverfügbarkeitsmanagement, Projektplanung und Auslastungssteuerung. Das Angebot richtet sich primär an Unternehmen, Beratungsagenturen, Entwicklerteams und sonstige gewerbliche Einheiten.
        </p>
      </LegalSection>
    </LegalPageShell>
  );
}
