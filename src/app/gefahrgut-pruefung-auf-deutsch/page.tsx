import { SeoPage } from "@/components/seo/seo-page";
import {
  buildSeoPageMetadata,
  gefahrgutPruefungAufDeutsch,
} from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(
  gefahrgutPruefungAufDeutsch,
);

export default function Page() {
  return <SeoPage page={gefahrgutPruefungAufDeutsch} />;
}
