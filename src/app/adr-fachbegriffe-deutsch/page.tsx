import { SeoPage } from "@/components/seo/seo-page";
import { adrFachbegriffeDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrFachbegriffeDeutsch);

export default function Page() {
  return <SeoPage page={adrFachbegriffeDeutsch} />;
}
