import { SeoPage } from "@/components/seo/seo-page";
import { adrFaqFuerFahrer, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrFaqFuerFahrer);

export default function Page() {
  return <SeoPage page={adrFaqFuerFahrer} />;
}
