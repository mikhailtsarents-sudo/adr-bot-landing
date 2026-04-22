import { SeoPage } from "@/components/seo/seo-page";
import { adrLernhilfeDeutsch, buildSeoPageMetadata } from "@/lib/seo-pages";

export const metadata = buildSeoPageMetadata(adrLernhilfeDeutsch);

export default function AdrLernhilfeDeutschPage() {
  return <SeoPage page={adrLernhilfeDeutsch} />;
}
