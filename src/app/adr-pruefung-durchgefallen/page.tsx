import { SeoPage } from "@/components/seo/seo-page";
import { adrPruefungDurchgefallen, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrPruefungDurchgefallen);

export default function Page() {
  return <SeoPage page={adrPruefungDurchgefallen} />;
}
