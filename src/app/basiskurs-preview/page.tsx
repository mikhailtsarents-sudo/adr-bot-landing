import { SeoPage } from "@/components/seo/seo-page";
import { basiskursPreview, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(basiskursPreview);

export default function Page() {
  return <SeoPage page={basiskursPreview} />;
}
