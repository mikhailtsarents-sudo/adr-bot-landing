import { SeoPage } from "@/components/seo/seo-page";
import { adrScheinKosten, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrScheinKosten);

export default function Page() {
  return <SeoPage page={adrScheinKosten} />;
}
