"use client";

import { LangProvider } from "@/lib/i18n/use-lang";
import { Analytics } from "@vercel/analytics/react";
import type { ReactNode } from "react";

export function Providers({ children }: { children: ReactNode }) {
  return (
    <LangProvider>
      {children}
      <Analytics />
    </LangProvider>
  );
}
