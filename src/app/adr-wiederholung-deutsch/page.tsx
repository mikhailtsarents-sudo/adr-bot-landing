import { SeoPage } from "@/components/seo/seo-page";
import { adrWiederholungDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrWiederholungDeutsch);

export default function AdrWiederholungDeutschPage() {
  return <SeoPage page={adrWiederholungDeutsch} />;
}
