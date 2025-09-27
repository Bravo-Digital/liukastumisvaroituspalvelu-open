import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import SetHtmlLang from "@/components/SetHtmlLang";
import { getTranslations } from "next-intl/server";
import ThemeProvider from "@/components/theme-provider";

export async function generateMetadata({ params }: { params: { locale: string } }) {
  const t = await getTranslations({ locale: params.locale, namespace: "SEO" });

  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      locale: params.locale === "fi" ? "fi_FI" : params.locale === "sv" ? "sv_FI" : "en_GB"
    }
  };
}


export default function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: { locale: string };
}) {
  const { locale } = params;

  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }

  return (
    <ThemeProvider>
      <NextIntlClientProvider locale={locale}>
        <SetHtmlLang locale={locale} />
        <Navbar />
        <main id="main" className="w-full min-h-[calc(100vh-4.25rem)] flex justify-center items-start">
          {children}
        </main>
        <Footer /> 
      </NextIntlClientProvider>
    </ThemeProvider>
  );
}
