// src/app/[locale]/feedback/page.tsx
import FeedbackForm from "./FeedbackForm";
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";

const ogLocaleMap: Record<string, string> = { fi: "fi_FI", sv: "sv_FI", en: "en_GB" };

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "SEO" });
  return {
    title: t("feedbackTitle"),
    description: t("feedbackDescription"),
    openGraph: {
      title: t("feedbackTitle"),
      description: t("feedbackDescription"),
      url: `/${locale}/feedback`,
      locale: ogLocaleMap[locale as keyof typeof ogLocaleMap] ?? "en_GB",
      type: "website",
    },
    twitter: { card: "summary", title: t("feedbackTitle"), description: t("feedbackDescription") },
    alternates: {
      canonical: `/${locale}/feedback`,
      languages: { fi: "/fi/feedback", sv: "/sv/feedback", en: "/en/feedback", "x-default": "/en/feedback" },
    },
  };
}

export default function FeedbackPage() {
  return <FeedbackForm />;
}
