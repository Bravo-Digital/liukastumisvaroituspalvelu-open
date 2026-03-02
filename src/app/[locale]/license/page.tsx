// app/(locale)/license/page.tsx
import Link from "next/link";
import { getLocale, getTranslations } from "next-intl/server";

export const dynamic = "force-dynamic";
export const revalidate = 0;

const FMI_FEED_BY_LOCALE = {
  fi: "https://alerts.fmi.fi/cap/feed/rss_fi-FI.rss",
  sv: "https://alerts.fmi.fi/cap/feed/rss_sv-FI.rss",
  en: "https://alerts.fmi.fi/cap/feed/rss_en-GB.rss",
} as const;

type Lc = keyof typeof FMI_FEED_BY_LOCALE;

export default async function LicensePage() {
  const localeRaw = await getLocale();
  const locale: Lc = (["fi", "sv", "en"].includes(localeRaw) ? localeRaw : "en") as Lc;

  const t = await getTranslations({ locale, namespace: "LicensePage" });

  const alertsRoot = "https://alerts.fmi.fi/";
  const feedUrl = FMI_FEED_BY_LOCALE[locale];
  const ccUrl = "https://creativecommons.org/licenses/by/4.0/";
  const fmiTermsUrl = "https://www.ilmatieteenlaitos.fi/avoin-data-lisenssi";

  return (
    <div className="w-full max-w-3xl mx-auto mt-6 px-4 space-y-6">
      <div className="space-y-2">
        <h1 className="text-2xl font-bold">{t("title")}</h1>
        <p className="text-sm text-muted-foreground">{t("intro")}</p>
      </div>

      {/* FMI / dataset */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("sections.fmi.title")}</h2>

        <ul className="text-sm text-muted-foreground list-disc pl-5 space-y-1">
          <li>
            <span className="font-medium text-foreground">{t("sections.fmi.labels.licensor")}:</span>{" "}
            {t("sections.fmi.values.licensorName")}
          </li>

          <li>
            <span className="font-medium text-foreground">{t("sections.fmi.labels.dataset")}:</span>{" "}
            {t("sections.fmi.values.datasetName")}
          </li>

          <li>
            <span className="font-medium text-foreground">{t("sections.fmi.labels.source")}:</span>{" "}
            <a
              href={alertsRoot}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              {alertsRoot}
            </a>{" "}
            (
            <a
              href={feedUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              {feedUrl}
            </a>
            )
          </li>

          <li>
            <span className="font-medium text-foreground">{t("sections.fmi.labels.license")}:</span>{" "}
            <a href={ccUrl} target="_blank" rel="noreferrer" className="underline underline-offset-4 hover:no-underline">
              CC BY 4.0
            </a>
            {" · "}
            <a
              href={fmiTermsUrl}
              target="_blank"
              rel="noreferrer"
              className="underline underline-offset-4 hover:no-underline"
            >
              {t("sections.fmi.values.fmiTermsLinkLabel")}
            </a>
          </li>
        </ul>
      </section>

      {/* Changes */}
      <section className="space-y-2">
        <h2 className="text-lg font-semibold">{t("sections.changes.title")}</h2>
        <p className="text-sm text-muted-foreground">{t("sections.changes.text")}</p>
      </section>
    </div>
  );
}
