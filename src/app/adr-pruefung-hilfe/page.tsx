import { SeoPage } from "@/components/seo/seo-page";
import { adrPruefungHilfe, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrPruefungHilfe);

export default function AdrPruefungHilfePage() {
  return <SeoPage page={adrPruefungHilfe} />;
}
