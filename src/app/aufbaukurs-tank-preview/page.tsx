import { SeoPage } from "@/components/seo/seo-page";
import { aufbaukursTankPreview, buildSeoPageMetadata } from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(aufbaukursTankPreview);

export default function Page() {
  return <SeoPage page={aufbaukursTankPreview} />;
}
