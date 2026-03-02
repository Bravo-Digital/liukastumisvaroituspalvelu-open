// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.liukasbotti.fi").replace(/\/+$/, "");

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: [
        "/admin",
        "/fi/license",
        "/sv/license",
        "/en/license",
        // optional: block any accidental nested paths
        "/fi/license/",
        "/sv/license/",
        "/en/license/",
      ],
    },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
