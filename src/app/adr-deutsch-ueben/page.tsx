import { SeoPage } from "@/components/seo/seo-page";
import { adrDeutschUeben, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrDeutschUeben);

export default function AdrDeutschUebenPage() {
  return <SeoPage page={adrDeutschUeben} />;
}
