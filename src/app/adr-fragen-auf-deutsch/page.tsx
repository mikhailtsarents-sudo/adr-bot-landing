import { SeoPage } from "@/components/seo/seo-page";
import { adrFragenAufDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrFragenAufDeutsch);

export default function Page() {
  return <SeoPage page={adrFragenAufDeutsch} />;
}
