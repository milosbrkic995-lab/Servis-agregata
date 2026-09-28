import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Servisni dnevnik agregata",
    short_name: "Servisni dnevnik",
    description: "Evidencija agregata, servisnih rokova i radnih sati.",
    start_url: "/dashboard",
    display: "standalone",
    background_color: "#f2f5f8",
    theme_color: "#234f75",
    orientation: "portrait",
    lang: "sr-Latn",
  };
}
