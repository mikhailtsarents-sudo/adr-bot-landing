"use client";

import { LangProvider } from "@/lib/i18n/use-lang";
import type { LangCode } from "@/lib/i18n/translations";
import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

export function Providers({
  children,
  initialLang,
}: {
  children: ReactNode;
  initialLang?: LangCode;
}) {
  return (
    <LangProvider initialLang={initialLang}>
      {children}
      <Analytics />
    </LangProvider>
  );
}
