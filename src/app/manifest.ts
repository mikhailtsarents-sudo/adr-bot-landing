import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ADR Bot",
    short_name: "ADR Bot",
    description:
      "ADR Bot hilft bei ADR-Begriffen, Prüfungsdeutsch und typischen ADR-Fragen direkt in Telegram.",
    start_url: "/",
    display: "standalone",
    background_color: "#fffaf0",
    theme_color: "#f6b548",
    categories: ["education", "productivity"],
    lang: "de-DE",
    icons: [
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/apple-icon",
        sizes: "256x256",
        type: "image/png",
      },
    ],
  };
}
