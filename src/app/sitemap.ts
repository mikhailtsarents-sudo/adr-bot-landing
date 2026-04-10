import type { MetadataRoute } from "next";
import { siteUrl } from "@/lib/site";
import { seoPageList } from "@/lib/seo-pages";

const routes = ["", "/impressum", "/datenschutz", "/legal", ...seoPageList.map((page) => page.path)];

export default function sitemap(): MetadataRoute.Sitemap {
  return routes.map((route) => ({
    url: `${siteUrl}${route}`,
    lastModified: new Date(),
    changeFrequency: route === "" ? "weekly" : "monthly",
    priority: route === "" ? 1 : route.startsWith("/adr-") ? 0.7 : 0.4,
  }));
}
