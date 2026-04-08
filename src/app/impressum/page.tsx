import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { hasValue, legalContact } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Impressum | ADR Bot",
  description: "Anbieterkennzeichnung und Kontaktangaben für ADR Bot.",
};

export default function ImpressumPage() {
  return (
    <LegalPage
      title="Impressum"
      intro="Diese Seite enthält die Anbieterkennzeichnung nach § 5 DDG. Die Platzhalter müssen vor der Veröffentlichung mit den echten Angaben ersetzt werden."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          Angaben gemäß § 5 DDG
        </h2>
        <div className="mt-4 space-y-1">
          <p>{legalContact.businessName}</p>
          <p>{legalContact.ownerName}</p>
          <p>{legalContact.street}</p>
          <p>
            {legalContact.postalCode} {legalContact.city}
          </p>
          <p>{legalContact.country}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          Kontakt
        </h2>
        <div className="mt-4 space-y-1">
          <p>E-Mail: {legalContact.email}</p>
          {hasValue(legalContact.phone) ? <p>Telefon: {legalContact.phone}</p> : null}
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          Verantwortlich für den Inhalt nach § 18 Abs. 2 MStV
        </h2>
        <p className="mt-4">{legalContact.responsiblePerson}</p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          Hinweis
        </h2>
        <p className="mt-4">
          Wenn du als Einzelunternehmer oder Privatperson öffentlich in Deutschland
          auftrittst, müssen Name, ladungsfähige Anschrift und eine schnelle
          Kontaktmöglichkeit korrekt angegeben sein. Vor dem Livegang sollten die
          Platzhalter daher durch echte Daten ersetzt und im Zweifel rechtlich
          geprüft werden.
        </p>
      </section>
    </LegalPage>
  );
}
