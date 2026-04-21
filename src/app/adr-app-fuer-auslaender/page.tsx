import { SeoPage } from "@/components/seo/seo-page";
import { adrAppFuerAuslaender, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrAppFuerAuslaender);

export default function Page() {
  return <SeoPage page={adrAppFuerAuslaender} />;
}
