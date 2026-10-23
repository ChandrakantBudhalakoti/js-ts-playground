import type { MetadataRoute } from "next";
import { ICON_BACKGROUND } from "@/lib/app-icon";
import { SITE_DESCRIPTION, SITE_NAME } from "@/lib/site";

/** Lets phones and tablets install the playground like an app. */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: SITE_NAME,
    short_name: SITE_NAME,
    description: SITE_DESCRIPTION,
    id: "/playground",
    start_url: "/playground",
    scope: "/",
    display: "standalone",
    orientation: "any",
    background_color: ICON_BACKGROUND,
    theme_color: ICON_BACKGROUND,
    categories: ["education", "developer", "productivity"],
    icons: [
      { src: "/icon/192", sizes: "192x192", type: "image/png" },
      { src: "/icon/512", sizes: "512x512", type: "image/png" },
      {
        src: "/icon/maskable",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
