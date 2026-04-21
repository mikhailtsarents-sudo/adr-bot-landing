import { SeoPage } from "@/components/seo/seo-page";
import {
  adrPruefungsfragenLernen,
  buildSeoPageMetadata,
} from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(
  adrPruefungsfragenLernen,
);

export default function Page() {
  return <SeoPage page={adrPruefungsfragenLernen} />;
}
