import { SeoPage } from "@/components/seo/seo-page";
import { adrKlassenDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrKlassenDeutsch);

export default function AdrKlassenDeutschPage() {
  return <SeoPage page={adrKlassenDeutsch} />;
}
