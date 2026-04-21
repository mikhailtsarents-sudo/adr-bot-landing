import { SeoPage } from "@/components/seo/seo-page";
import {
  adrPruefungFuerNichtMuttersprachler,
  buildSeoPageMetadata,
} from "@/lib/seo-pages";
import type { Metadata } from "next";

export const metadata: Metadata = buildSeoPageMetadata(
  adrPruefungFuerNichtMuttersprachler,
);

export default function Page() {
  return <SeoPage page={adrPruefungFuerNichtMuttersprachler} />;
}
