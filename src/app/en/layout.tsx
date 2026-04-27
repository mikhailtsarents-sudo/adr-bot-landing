import { Providers } from "@/components/providers";
import type { ReactNode } from "react";

export default function EnglishLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  return <Providers initialLang="en">{children}</Providers>;
}
