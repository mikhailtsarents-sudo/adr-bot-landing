import { SeoPage } from "@/components/seo/seo-page";
import {
  adrPruefungsfragenAppDeutsch,
  buildSeoPageMetadata,
} from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(
  adrPruefungsfragenAppDeutsch,
);

export default function Page() {
  return <SeoPage page={adrPruefungsfragenAppDeutsch} />;
}
