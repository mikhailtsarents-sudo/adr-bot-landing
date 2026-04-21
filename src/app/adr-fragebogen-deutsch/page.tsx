import { SeoPage } from "@/components/seo/seo-page";
import { adrFragebogenDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrFragebogenDeutsch);

export default function AdrFragebogenDeutschPage() {
  return <SeoPage page={adrFragebogenDeutsch} />;
}
