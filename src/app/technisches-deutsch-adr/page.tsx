import { SeoPage } from "@/components/seo/seo-page";
import { buildSeoPageMetadata, technischesDeutschAdr } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(technischesDeutschAdr);

export default function Page() {
  return <SeoPage page={technischesDeutschAdr} />;
}
