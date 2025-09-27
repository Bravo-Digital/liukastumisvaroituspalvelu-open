// src/app/[locale]/subscribe/page.tsx
import { getLocale, getTranslations } from "next-intl/server";
import type { Metadata } from "next";
import SubscribeForm from "./SubscribeForm";

const ogLocaleMap: Record<string, string> = {
  fi: "fi_FI",
  sv: "sv_FI",
  en: "en_GB",
};

export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "fi" | "sv" | "en";
  const t = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: t("subscribeTitle"),
    description: t("subscribeDescription"),
    openGraph: {
      title: t("subscribeTitle"),
      description: t("subscribeDescription"),
      url: `/${locale}/subscribe`,
      locale: ogLocaleMap[locale] ?? "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("subscribeTitle"),
      description: t("subscribeDescription"),
    },
    alternates: {
      canonical: `/${locale}/subscribe`,
      languages: {
        fi: "/fi/subscribe",
        sv: "/sv/subscribe",
        en: "/en/subscribe",
        "x-default": "/en/subscribe",
      },
    },
  };
}

export default function SubscribePage() {
  return (
    <div className="w-full max-w-5xl min-h-[calc(100vh-76px)] mx-auto mt-6 flex flex-col p-4 md:p-6">
      <SubscribeForm />
    </div>
  );
}
