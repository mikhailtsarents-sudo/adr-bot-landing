import { SeoPage } from "@/components/seo/seo-page";
import { adrTelegramBotDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(adrTelegramBotDeutsch);

export default function Page() {
  return <SeoPage page={adrTelegramBotDeutsch} />;
}
