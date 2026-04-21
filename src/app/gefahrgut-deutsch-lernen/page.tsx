import { SeoPage } from "@/components/seo/seo-page";
import { buildSeoPageMetadata, gefahrgutDeutschLernen } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(gefahrgutDeutschLernen);

export default function Page() {
  return <SeoPage page={gefahrgutDeutschLernen} />;
}
