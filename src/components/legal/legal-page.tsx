import Link from "next/link";
import type { ReactNode } from "react";

type LegalPageProps = {
  title: string;
  intro: string;
  children: ReactNode;
};

export function LegalPage({ title, intro, children }: LegalPageProps) {
  return (
    <main className="min-h-screen bg-[var(--color-bg)] px-6 py-10 text-slate-700 sm:px-8 lg:px-10">
      <div className="mx-auto max-w-4xl">
        <div className="mb-8 flex items-center justify-between gap-4 rounded-full border border-slate-200 bg-white/90 px-5 py-3 shadow-sm backdrop-blur">
          <Link
            href="/"
            className="font-display text-lg font-semibold tracking-wide text-slate-900"
          >
            ADR Bot
          </Link>
          <div className="flex items-center gap-4 text-sm text-slate-500">
            <Link href="/impressum" className="hover:text-slate-900">
              Impressum
            </Link>
            <Link href="/datenschutz" className="hover:text-slate-900">
              Datenschutz
            </Link>
          </div>
        </div>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-7 shadow-sm sm:p-10">
          <h1 className="font-display text-4xl font-semibold tracking-[-0.03em] text-slate-900 sm:text-5xl">
            {title}
          </h1>
          <p className="mt-5 max-w-3xl text-base leading-8 text-slate-600">
            {intro}
          </p>
          <div className="mt-10 space-y-8 text-sm leading-7 text-slate-700">
            {children}
          </div>
        </section>
      </div>
    </main>
  );
}
