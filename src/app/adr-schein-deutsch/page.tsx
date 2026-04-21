import { SeoPage } from "@/components/seo/seo-page";
import { adrScheinDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrScheinDeutsch);

export default function AdrScheinDeutschPage() {
  return <SeoPage page={adrScheinDeutsch} />;
}
