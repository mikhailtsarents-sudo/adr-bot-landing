import type { Metadata } from "next";
import Link from "next/link";
import { LegalPage } from "@/components/legal/legal-page";

export const metadata: Metadata = {
  title: { absolute: "Rechtliches | ADR Bot" },
  description: "Zentrale Seite mit Impressum und Datenschutzerklärung für ADR Bot.",
};

export default function LegalHubPage() {
  return (
    <LegalPage
      title="Rechtliches"
      intro="Diese Seite bündelt die wichtigsten rechtlichen Informationen für ADR Bot. Sie eignet sich auch als zentrale Profil- oder Bio-Link-Seite für Plattformen, auf denen nur ein Website-Link möglich ist."
    >
      <section>
        <h2 className="font-display text-2xl font-semibold text-slate-900">
          Rechtliche Seiten
        </h2>
        <div className="mt-5 grid gap-4 sm:grid-cols-2">
          <Link
            href="/impressum"
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="font-display text-xl font-semibold text-slate-900">
              Impressum
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Anbieterkennzeichnung und Kontaktangaben nach deutschem Recht.
            </p>
          </Link>
          <Link
            href="/datenschutz"
            className="rounded-[1.5rem] border border-slate-200 bg-slate-50 px-5 py-5 transition hover:border-slate-300 hover:bg-white"
          >
            <p className="font-display text-xl font-semibold text-slate-900">
              Datenschutzerklärung
            </p>
            <p className="mt-2 text-sm leading-6 text-slate-600">
              Informationen zur Verarbeitung personenbezogener Daten auf dieser
              Website.
            </p>
          </Link>
        </div>
      </section>
    </LegalPage>
  );
}
