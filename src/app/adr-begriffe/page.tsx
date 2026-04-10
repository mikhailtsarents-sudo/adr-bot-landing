import { SeoPage } from "@/components/seo/seo-page";
import { adrBegriffeVocabulary, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrBegriffeVocabulary);

export default function Page() {
  return <SeoPage page={adrBegriffeVocabulary} />;
}
