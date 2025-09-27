import { db } from "@/lib/db";
import { warningsTable } from "@/lib/schema";
import { lt, gt, eq, and } from "drizzle-orm";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle, CheckCircle } from "lucide-react";
import Statistics from "@/components/statistics";
import { cn } from "@/lib/utils";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
export const dynamic = "force-dynamic";
export const revalidate = 0; 
const ogLocaleMap: Record<string, string> = { fi: "fi_FI", sv: "sv_FI", en: "en_GB" };

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as keyof typeof ogLocaleMap;
  const tSEO = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: tSEO("warningsTitle"),
    description: tSEO("warningsDescription"),
    openGraph: {
      title: tSEO("warningsTitle"),
      description: tSEO("warningsDescription"),
      url: `/${locale}/warnings`,
      locale: ogLocaleMap[locale] ?? "en_GB",
      type: "website",
    },
    twitter: { card: "summary", title: tSEO("warningsTitle"), description: tSEO("warningsDescription") },
    alternates: {
      canonical: `/${locale}/warnings`,
      languages: { fi: "/fi/warnings", sv: "/sv/warnings", en: "/en/warnings", "x-default": "/en/warnings" },
    },
  };
}

export default async function WarningsPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "WarningsPage" });

  const now = new Date();
  const activeWarnings = await db
    .select()
    .from(warningsTable)
    .where(and(eq(warningsTable.status, "active"), gt(warningsTable.expiresAt, now), lt(warningsTable.onsetAt, now)));

  const hasActiveWarnings = activeWarnings.length > 0;

  return (
    <div className="w-full max-w-5xl mx-auto mt-6">
      <Alert variant={hasActiveWarnings ? "destructive" : "default"} className="flex items-center space-x-4 w-full border-0">
        <div className={cn("bg-primary/10 text-primary group-hover:bg-primary/40 flex w-30 h-30 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0")}>
          {hasActiveWarnings ? <AlertTriangle className="w-15 h-15" /> : <CheckCircle className="w-15 h-15" />}
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-xl font-bold">{hasActiveWarnings ? t("active.title") : t("none.title")}</h2>
          <AlertDescription>
            {hasActiveWarnings
              ? activeWarnings.length > 1
                ? t("active.description_plural", { count: activeWarnings.length })
                : t("active.description_singular")
              : t("none.description")}
          </AlertDescription>
        </div>
      </Alert>

      <section className="w-full">
        <Statistics />
      </section>
    </div>
  );
}
