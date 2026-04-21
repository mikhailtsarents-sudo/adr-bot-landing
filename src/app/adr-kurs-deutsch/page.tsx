import { SeoPage } from "@/components/seo/seo-page";
import { adrKursDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrKursDeutsch);

export default function AdrKursDeutschPage() {
  return <SeoPage page={adrKursDeutsch} />;
}
