import type { Metadata } from "next";
import { Inter } from "next/font/google"
import { ThemeProvider } from 'next-themes'
import "./globals.css";
import Navbar from "../components/navbar";
import Footer from "../components/footer";
import { NextIntlClientProvider } from "next-intl";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

export const metadata: Metadata = {
  metadataBase: new URL("https://www.liukasbotti.fi"),
  title: {
    default: "Liukasbotti - Vältä loukkaantumiset talvella",
    template: "%s | Liukasbotti"
  },
  description: "Vältä loukkaantumiset liukkaalla säällä. Ota käyttöön liukastumisvaroitukset.",
  keywords: ["liukastuminen", "liukastumisvaroitukset", "talvi", "turvallisuus", "liukasbotti"],
  openGraph: {
    title: "Liukasbotti - Vältä loukkaantumiset talvella",
    description: "Tilaa liukastumisvaroitukset ja pysy pystyssä talvella.",
    url: "https://www.liukasbotti.fi",
    siteName: "Liukasbotti",
    locale: "fi_FI",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Liukasbotti - Vältä loukkaantumiset talvella",
    description: "Tilaa liukastumisvaroitukset ja pysy pystyssä talvella.",

  },
  robots: {
    index: true,
    follow: true,
  },
  alternates: {
    canonical: "https://www.liukasbotti.fi",
    languages: {
      "fi": "https://www.liukasbotti.fi/fi",
      "sv": "https://www.liukasbotti.fi/sv",
      "en": "https://www.liukasbotti.fi/en",
    },
  },
};


  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" suppressHydrationWarning> {/* fallback lang */}
        <body
          className={`${inter.variable} antialiased w-screen h-auto flex flex-col items-center justify-start overflow-x-hidden`}
        >
          <ThemeProvider attribute="class">
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }
