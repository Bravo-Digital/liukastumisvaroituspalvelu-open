import { NextIntlClientProvider, hasLocale } from "next-intl";
import { notFound } from "next/navigation";
import { routing } from "@/i18n/routing";
import Footer from "@/components/footer";
import Navbar from "@/components/navbar";
import SetHtmlLang from "@/components/SetHtmlLang";

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
    <NextIntlClientProvider locale={locale}>
      <SetHtmlLang locale={locale} />
      <Navbar />
      <main className="w-full min-h-[calc(100vh-4.25rem)] flex justify-center items-start">
        {children}
      </main>
      <Footer />
    </NextIntlClientProvider>
  );
}
