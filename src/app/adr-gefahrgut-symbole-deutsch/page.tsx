import { SeoPage } from "@/components/seo/seo-page";
import { adrGefahrgutSymboleDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrGefahrgutSymboleDeutsch);

export default function AdrGefahrgutSymboleDeutschPage() {
  return <SeoPage page={adrGefahrgutSymboleDeutsch} />;
}
