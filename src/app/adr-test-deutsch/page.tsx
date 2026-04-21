import { SeoPage } from "@/components/seo/seo-page";
import { adrTestDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrTestDeutsch);

export default function AdrTestDeutschPage() {
  return <SeoPage page={adrTestDeutsch} />;
}
