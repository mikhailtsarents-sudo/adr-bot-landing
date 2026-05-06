import { SeoPage } from "@/components/seo/seo-page";
import { adrScheinVerlaengern, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrScheinVerlaengern);

export default function Page() {
  return <SeoPage page={adrScheinVerlaengern} />;
}
