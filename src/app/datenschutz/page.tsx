import type { Metadata } from "next";
import { LegalPage } from "@/components/legal/legal-page";
import { legalContact } from "@/lib/legal";

export const metadata: Metadata = {
  title: "Datenschutz | ADR Bot",
  description: "Datenschutzhinweise für den Webauftritt von ADR Bot.",
};

export default function DatenschutzPage() {
  return (
    <LegalPage
      title="Datenschutzerklärung"
      intro="Diese Datenschutzerklärung ist eine allgemeine Basis für den aktuellen Projektstand ohne Kontaktformular, Newsletter oder Tracking-Tools. Falls später Analytics, Cookies, Pixel, eingebettete Videos oder Formulare dazukommen, muss sie erweitert werden."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          1. Verantwortlicher
        </h2>
        <div className="mt-4 space-y-1">
          <p>{legalContact.businessName}</p>
          <p>{legalContact.ownerName}</p>
          <p>{legalContact.street}</p>
          <p>
            {legalContact.postalCode} {legalContact.city}
          </p>
          <p>E-Mail: {legalContact.email}</p>
        </div>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          2. Zugriff auf die Website
        </h2>
        <p className="mt-4">
          Beim Aufruf dieser Website werden technisch notwendige Daten verarbeitet,
          damit die Seite ausgeliefert werden kann. Dazu können insbesondere
          IP-Adresse, Datum und Uhrzeit des Abrufs, aufgerufene URL, Browser- und
          Geräteinformationen sowie Logdaten des Hosting-Anbieters gehören.
        </p>
        <p className="mt-3">
          Die Verarbeitung erfolgt auf Grundlage von Art. 6 Abs. 1 lit. f DSGVO,
          da sie zur sicheren und stabilen Bereitstellung der Website erforderlich
          ist.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          3. Hosting
        </h2>
        <p className="mt-4">
          Diese Website wird über einen externen Hosting-Anbieter ausgeliefert.
          Dabei werden die zur Bereitstellung der Website erforderlichen Daten auf
          den Servern des Hosters verarbeitet. Vor dem Livegang sollte hier der
          konkret verwendete Anbieter eingetragen werden, zum Beispiel Vercel,
          Cloudflare Pages oder Netlify.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          4. Cookies und Tracking
        </h2>
        <p className="mt-4">
          Nach aktuellem Stand setzt diese Website keine optionalen Analyse- oder
          Marketing-Tools ein. Sollten später Cookies, Webanalyse, Pixel oder
          Drittanbieter-Einbindungen ergänzt werden, müssen diese hier ergänzt und
          gegebenenfalls ein Consent-Banner geprüft werden.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          5. Deine Rechte
        </h2>
        <p className="mt-4">
          Betroffene Personen haben nach der DSGVO insbesondere das Recht auf
          Auskunft, Berichtigung, Löschung, Einschränkung der Verarbeitung,
          Datenübertragbarkeit sowie Widerspruch gegen die Verarbeitung ihrer
          personenbezogenen Daten.
        </p>
        <p className="mt-3">
          Außerdem besteht das Recht, sich bei einer Datenschutz-Aufsichtsbehörde
          zu beschweren.
        </p>
      </section>

      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          6. Stand
        </h2>
        <p className="mt-4">Stand dieser Datenschutzerklärung: {legalContact.lastUpdated}</p>
      </section>
    </LegalPage>
  );
}
