import {NextIntlClientProvider, hasLocale} from 'next-intl';
import {notFound} from 'next/navigation';
import {routing} from '@/i18n/routing';
import Footer from '@/components/footer';
import Navbar from '@/components/navbar';
 
export default async function LocaleLayout({
  children,
  params
}: {
  children: React.ReactNode;
  params: Promise<{locale: string}>;
}) {
  const {locale} = await params;
  if (!hasLocale(routing.locales, locale)) {
    notFound();
  }
 
  return (
    <NextIntlClientProvider>
        <Navbar />
        <main className="w-full min-h-[calc(100vh-4.25rem)] flex justify-center items-start">
          {children}
        </main>
        <Footer />
    </NextIntlClientProvider>
  );
}