import { SeoPage } from "@/components/seo/seo-page";
import { adrPruefungAufDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrPruefungAufDeutsch);

export default function Page() {
  return <SeoPage page={adrPruefungAufDeutsch} />;
}
