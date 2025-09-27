// src/app/robots.ts
import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const host = (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.liukasbotti.fi").replace(/\/+$/, "");
  return {
    rules: { userAgent: "*", allow: "/", disallow: ['/admin'] },
    sitemap: `${host}/sitemap.xml`,
    host,
  };
}
