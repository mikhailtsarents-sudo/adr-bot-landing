import { SeoPage } from "@/components/seo/seo-page";
import { adrPruefungen, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrPruefungen);

export default function Page() {
  return <SeoPage page={adrPruefungen} />;
}
