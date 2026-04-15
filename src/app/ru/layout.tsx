import { Providers } from "@/components/providers";
import type { ReactNode } from "react";

export default function RussianLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <Providers initialLang="ru">{children}</Providers>;
}
