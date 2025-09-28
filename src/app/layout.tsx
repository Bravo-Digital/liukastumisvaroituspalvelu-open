import type { Metadata } from "next";
import { Inter } from "next/font/google"
import ThemeProvider from "@/components/theme-provider";
import Script from "next/script";
import "./globals.css";

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
  icons: {
    icon: [
      { url: "/photos/favicon.svg", type: "image/svg+xml" }
    ]
}
};



  export default function RootLayout({ children }: { children: React.ReactNode }) {
    return (
      <html lang="en" suppressHydrationWarning> 
        <head>
          <Script
            id="cookiebot"
            src="https://consent.cookiebot.com/uc.js"
            data-cbid="d223003a-5d0e-423f-bae4-d35d9f371403"
            data-blockingmode="auto"
            strategy="beforeInteractive"
          />
        </head>
      <meta name="theme-color" content="#0f172a" />
        <body
          className={`${inter.variable} antialiased w-screen h-auto flex flex-col items-center justify-start overflow-x-hidden`}>
          <ThemeProvider>
            {children}
          </ThemeProvider>
        </body>
      </html>
    );
  }
