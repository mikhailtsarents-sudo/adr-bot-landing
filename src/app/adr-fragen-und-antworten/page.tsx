import { SeoPage } from "@/components/seo/seo-page";
import { adrFragenUndAntworten, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrFragenUndAntworten);

export default function Page() {
  return <SeoPage page={adrFragenUndAntworten} />;
}
