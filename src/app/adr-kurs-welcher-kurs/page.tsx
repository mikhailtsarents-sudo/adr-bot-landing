import { SeoPage } from "@/components/seo/seo-page";
import { adrKursWelcherKurs, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrKursWelcherKurs);

export default function Page() {
  return <SeoPage page={adrKursWelcherKurs} />;
}
