import type { MetadataRoute } from "next";
import { LANDING_ROUTE_BY_LANG } from "@/lib/landing-locales";
import { siteUrl } from "@/lib/site";
import { seoPageList } from "@/lib/seo-pages";

const routes = [
  ...Object.values(LANDING_ROUTE_BY_LANG),
  "/impressum",
  "/datenschutz",
  "/legal",
  ...seoPageList.map((page) => page.path),
];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/adr-") ? 0.7 : 0.4,
  }));
}
