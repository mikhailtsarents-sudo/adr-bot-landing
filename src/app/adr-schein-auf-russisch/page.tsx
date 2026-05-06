import { SeoPage } from "@/components/seo/seo-page";
import { adrScheinAufRussisch, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrScheinAufRussisch);

export default function Page() {
  return <SeoPage page={adrScheinAufRussisch} />;
}
