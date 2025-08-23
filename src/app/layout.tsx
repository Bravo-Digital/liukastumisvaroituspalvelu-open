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
  title: "Liukastumisvaroituspalvelu - Vältä loukkaantumiset talvella",
  description: "Vältä loukkaantumiset liukkaalla säällä. Ota käyttöön liukastumisvaroitukset.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${inter.variable} antialiased w-screen h-auto flex flex-col items-center justify-start`}
      >
        <ThemeProvider attribute={"class"}>
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
