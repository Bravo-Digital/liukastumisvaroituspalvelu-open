import type { MetadataRoute } from "next";

const BASE_URL =
  (process.env.NEXT_PUBLIC_SITE_URL ?? "https://www.liukasbotti.fi").replace(/\/+$/, "");

const LOCALES = ["fi", "sv", "en"] as const;

// Add every route that exists for each locale
const LOCALIZED_PATHS = ["", "/subscribe", "/feedback", "/warnings"] as const;

function urlFor(locale: (typeof LOCALES)[number], path: (typeof LOCALIZED_PATHS)[number]) {
  const suffix = path ? `/${path.replace(/^\//, "")}` : "";
  return `${BASE_URL}/${locale}${suffix}`;
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const entries: MetadataRoute.Sitemap = [];

  for (const path of LOCALIZED_PATHS) {
    // one entry per locale, each with hreflang alternates
    for (const locale of LOCALES) {
      entries.push({
        url: urlFor(locale, path),
        lastModified: new Date(),
        changeFrequency: "weekly",
        priority: path === "" ? 1 : 0.7,
        alternates: {
          languages: {
            fi: urlFor("fi", path),
            sv: urlFor("sv", path),
            en: urlFor("en", path),
            "x-default": urlFor("en", path),
          },
        },
      });
    }
  }


  return entries;
}

