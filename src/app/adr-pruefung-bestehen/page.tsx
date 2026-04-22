import { SeoPage } from "@/components/seo/seo-page";
import { adrPruefungBestehen, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrPruefungBestehen);

export default function AdrPruefungBestehenPage() {
  return <SeoPage page={adrPruefungBestehen} />;
}
