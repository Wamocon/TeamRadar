import type { Metadata } from "next";
import { LegalPageShell, LegalSection } from "@/components/ui/LegalPageShell";

export const metadata: Metadata = {
  title: "Datenschutzerklärung | TeamRadar",
  description: "Datenschutzerklärung der TeamRadar der WAMOCON GmbH.",
};

export default function DatenschutzPage() {
  return (
    <LegalPageShell title="Datenschutzerklärung" updatedAt="März 2026">
      <LegalSection title="1. Verantwortlicher">
        <p>Verantwortlicher im Sinne der Datenschutz-Grundverordnung (DSGVO) und anderer nationaler Datenschutzgesetze der Mitgliedstaaten sowie sonstiger datenschutzrechtlicher Bestimmungen ist:</p>
        <div className="space-y-1 pt-1">
          <p className="font-medium text-foreground">WAMOCON GmbH</p>
          <p>Mergenthalerallee 79 – 81</p>
          <p>65760 Eschborn</p>
          <p>Telefon: <a className="font-medium text-blue-600 hover:underline" href="tel:+4961965838311">+49 6196 5838311</a></p>
          <p>E-Mail: <a className="font-medium text-blue-600 hover:underline" href="mailto:info@wamocon.com">info@wamocon.com</a></p>
          <p>Projektkontakt: <a className="font-medium text-blue-600 hover:underline" href="mailto:info@teamradar.app">info@teamradar.app</a></p>
          <p>Geschäftsführer: Dipl.-Ing. Waleri Moretz</p>
          <p>Handelsregister: Eschborn HRB 123666</p>
          <p>USt-ID: DE344930486</p>
        </div>
      </LegalSection>

      <LegalSection title="2. Überblick über die Datenverarbeitung">
        <p>Diese Datenschutzerklärung gilt für die Website und Webanwendung TeamRadar. TeamRadar ist eine digitale Plattform für Personalverfügbarkeitsmanagement, Projektdokumentation, Statusverfolgung, Teamkoordination und Auslastungssteuerung.</p>
        <p>Wir verarbeiten personenbezogene Daten unserer Nutzer grundsätzlich nur, soweit dies zur Bereitstellung einer funktionsfähigen Plattform sowie unserer Inhalte und Leistungen erforderlich ist. Die Verarbeitung personenbezogener Daten erfolgt regelmäßig nur nach Einwilligung des Nutzers oder auf einer anderen gesetzlichen Grundlage.</p>
      </LegalSection>

      <LegalSection title="3. Rechtsgrundlagen der Verarbeitung">
        <p>Soweit wir für Verarbeitungsvorgänge personenbezogener Daten eine Einwilligung einholen, dient Art. 6 Abs. 1 lit. a DSGVO als Rechtsgrundlage.</p>
        <p>Bei der Verarbeitung personenbezogener Daten, die zur Erfüllung eines Vertrages oder zur Durchführung vorvertraglicher Maßnahmen erforderlich ist, dient Art. 6 Abs. 1 lit. b DSGVO als Rechtsgrundlage.</p>
        <p>Soweit eine Verarbeitung personenbezogener Daten zur Erfüllung einer rechtlichen Verpflichtung erforderlich ist, dient Art. 6 Abs. 1 lit. c DSGVO als Rechtsgrundlage.</p>
        <p>Ist die Verarbeitung zur Wahrung eines berechtigten Interesses unseres Unternehmens oder eines Dritten erforderlich und überwiegen die Interessen, Grundrechte und Grundfreiheiten des Betroffenen nicht, dient Art. 6 Abs. 1 lit. f DSGVO als Rechtsgrundlage.</p>
      </LegalSection>

      <LegalSection title="4. Hosting und Infrastruktur">
        <p>Unsere Plattform wird über moderne Cloud-Infrastruktur bereitgestellt. Wir nutzen folgende Dienste:</p>
        <div>
          <p className="font-medium text-foreground">Vercel Inc.</p>
          <p>Die Website und Webanwendung werden über Vercel gehostet. Dabei verarbeitet Vercel technisch notwendige Verbindungsdaten wie IP-Adresse, Zeitstempel und Browserinformationen. Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Supabase Inc.</p>
          <p>Für Datenbank, Authentifizierung, Dateispeicher und Teile der Backend-Infrastruktur nutzen wir Supabase. Verarbeitet werden insbesondere Authentifizierungsdaten, Session-Informationen, Projektdaten sowie gespeicherte Medien (z.B. Profilbilder). Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        </div>
        <div>
          <p className="font-medium text-foreground">Resend Inc.</p>
          <p>Für den Versand von Einladungs-E-Mails nutzen wir Resend. Verarbeitet werden dabei insbesondere E-Mail-Adresse, Projektbezug und der Einladungsinhalt. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
        </div>
      </LegalSection>

      <LegalSection title="5. Registrierung und Authentifizierung">
        <p>Für die Nutzung von TeamRadar ist eine Registrierung erforderlich. Bei der Registrierung und Kontonutzung werden insbesondere folgende Daten verarbeitet:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>E-Mail-Adresse</li>
          <li>Vor- und Nachname</li>
          <li>Passwort in gehashter Form</li>
          <li>Projekt- und Teamrolle (z. B. Admin, Manager, Worker, Dept Lead)</li>
          <li>Session-Tokens und sicherheitsrelevante Authentifizierungsinformationen</li>
        </ul>
        <p>Die Authentifizierung erfolgt über Supabase Auth. Die Verarbeitung dient der Vertragserfüllung gemäß Art. 6 Abs. 1 lit. b DSGVO.</p>
      </LegalSection>

      <LegalSection title="6. Datenverarbeitung auf der Plattform">
        <p>Im Rahmen der Nutzung von TeamRadar werden insbesondere folgende Kategorien personenbezogener und projektbezogener Daten verarbeitet:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Projektstammdaten wie Projektname, Status und Zuweisungen</li>
          <li>Namens- und Kontaktdaten der Teammitglieder</li>
          <li>Abteilungszugehörigkeiten und Skill-Informationen</li>
          <li>Verfügbarkeitsstatus (z. B. Verfügbar, Meeting, Krank, Urlaub, Remote, Offline)</li>
          <li>Auslastungsdaten (prozentuale Planung pro Projekt und Mitarbeiter)</li>
          <li>Zeitstempel von Statuserfassungen und Änderungen</li>
        </ul>
        <p>Diese Daten werden zur Durchführung des Vertrags, zur Teamkoordination und zur effizienten Projektplanung verarbeitet. Rechtsgrundlage ist Art. 6 Abs. 1 lit. b DSGVO.</p>
      </LegalSection>

      <LegalSection title="7. Cookies und lokale Speicherung">
        <p>TeamRadar verwendet technisch notwendige Cookies und ähnliche Technologien (z.B. LocalStorage), soweit dies für Anmeldung, Sitzungsverwaltung, Sicherheit und den Betrieb der Plattform erforderlich ist.</p>
        <p>Tracking-, Werbe- oder Analyse-Cookies werden derzeit nicht eingesetzt.</p>
      </LegalSection>

      <LegalSection title="8. Kontaktaufnahme">
        <p>Wenn Sie uns per E-Mail kontaktieren, werden die von Ihnen mitgeteilten Daten wie Name, E-Mail-Adresse und Nachrichteninhalt verarbeitet, um Ihre Anfrage zu bearbeiten und für Anschlussfragen bereitzuhalten.</p>
        <p>Rechtsgrundlage ist Art. 6 Abs. 1 lit. f DSGVO. Sofern die Kontaktaufnahme auf den Abschluss oder die Durchführung eines Vertrags abzielt, ist zusätzliche Rechtsgrundlage Art. 6 Abs. 1 lit. b DSGVO.</p>
      </LegalSection>

      <LegalSection title="9. SSL- bzw. TLS-Verschlüsselung">
        <p>Diese Website und Webanwendung nutzt aus Sicherheitsgründen und zum Schutz der Übertragung vertraulicher Inhalte eine SSL- bzw. TLS-Verschlüsselung. Eine verschlüsselte Verbindung erkennen Sie an der sicheren Browserverbindung über https.</p>
      </LegalSection>

      <LegalSection title="10. Weitergabe von Daten an Dritte">
        <p>Eine Übermittlung Ihrer personenbezogenen Daten an Dritte findet grundsätzlich nur statt, wenn:</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Sie Ihre ausdrückliche Einwilligung erteilt haben,</li>
          <li>die Weitergabe zur Vertragserfüllung erforderlich ist,</li>
          <li>eine rechtliche Verpflichtung besteht oder</li>
          <li>berechtigte Interessen die Weitergabe erfordern und keine überwiegenden Schutzinteressen entgegenstehen.</li>
        </ul>
        <p>Im Rahmen der Auftragsverarbeitung setzen wir insbesondere Vercel, Supabase und Resend ein.</p>
      </LegalSection>

      <LegalSection title="11. Speicherdauer und Datenlöschung">
        <p>Personenbezogene Daten werden nur so lange gespeichert, wie dies für den jeweiligen Verarbeitungszweck erforderlich ist oder gesetzliche Aufbewahrungspflichten bestehen.</p>
        <ul className="list-disc space-y-1 pl-5">
          <li>Kontodaten werden mit Löschung des Benutzerkontos gelöscht, sofern keine gesetzlichen Pflichten entgegenstehen.</li>
          <li>Projekt- und Teamdaten werden grundsätzlich bis zur Löschung des jeweiligen Projekts oder Kontos gespeichert.</li>
          <li>Verfügbarkeitsverläufe werden für statistische Auswertungen gespeichert, solange dies für die Auslastungsplanung erforderlich ist.</li>
        </ul>
      </LegalSection>

      <LegalSection title="12. Rechte der betroffenen Personen">
        <p>Ihnen stehen als betroffene Person folgende Rechte gemäß der DSGVO zu: Recht auf Auskunft (Art. 15), Berichtigung (Art. 16), Löschung (Art. 17), Einschränkung der Verarbeitung (Art. 18), Datenübertragbarkeit (Art. 20), Widerspruch (Art. 21) sowie Recht auf Widerruf der Einwilligung (Art. 7 Abs. 3).</p>
      </LegalSection>

      <LegalSection title="13. Beschwerderecht bei einer Aufsichtsbehörde">
        <p>Unbeschadet eines anderweitigen verwaltungsrechtlichen oder gerichtlichen Rechtsbehelfs steht Ihnen das Recht auf Beschwerde bei einer Aufsichtsbehörde zu. Der Hessische Beauftragte für Datenschutz und Informationsfreiheit, Gustav-Stresemann-Ring 1, 65189 Wiesbaden.</p>
      </LegalSection>

      <LegalSection title="14. Änderungen dieser Datenschutzerklärung">
        <p>Wir behalten uns vor, diese Datenschutzerklärung anzupassen, um sie stets den aktuellen rechtlichen Anforderungen anzupassen oder Änderungen unserer Leistungen in der Datenschutzerklärung umzusetzen.</p>
      </LegalSection>
    </LegalPageShell>
  );
}
