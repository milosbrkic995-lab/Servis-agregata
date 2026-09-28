import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    id: "/",
    name: "Servisni dnevnik agregata",
    short_name: "Servisni dnevnik",
    description: "Evidencija agregata, servisnih rokova i radnih sati.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f2f5f8",
    theme_color: "#234f75",
    orientation: "portrait",
    lang: "sr-Latn",
    icons: [
      {
        src: "/icons/icon-192",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icon",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
