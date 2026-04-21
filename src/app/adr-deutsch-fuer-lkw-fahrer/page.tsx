import { SeoPage } from "@/components/seo/seo-page";
import {
  adrDeutschFuerLkwFahrer,
  buildSeoPageMetadata,
} from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(
  adrDeutschFuerLkwFahrer,
);

export default function Page() {
  return <SeoPage page={adrDeutschFuerLkwFahrer} />;
}
