// src/app/[locale]/gdpr/page.tsx
import type { Metadata } from "next";
import { getLocale, getTranslations } from "next-intl/server";
import {
  Card, CardContent, CardHeader, CardTitle
} from "@/components/ui/card";
import {
  Table, TableHeader, TableRow, TableHead, TableBody, TableCell
} from "@/components/ui/table";
import { Alert, AlertDescription } from "@/components/ui/alert";
import Script from "next/script"

// Map for Open Graph locale codes
const ogLocaleMap: Record<string, string> = { fi: "fi_FI", sv: "sv_FI", en: "en_GB" };

// Edit this when you update the page content
const LAST_UPDATED = "5.9.2025";

export async function generateMetadata(): Promise<Metadata> {
  const locale = await getLocale();
  const tSEO = await getTranslations({ locale, namespace: "SEO" });

  return {
    title: tSEO("gdprTitle"),
    description: tSEO("gdprDescription"),
    openGraph: {
      title: tSEO("gdprTitle"),
      description: tSEO("gdprDescription"),
      url: `/${locale}/gdpr`,
      locale: ogLocaleMap[locale] ?? "en_GB",
      type: "website",
    },
    twitter: {
      card: "summary",
      title: tSEO("gdprTitle"),
      description: tSEO("gdprDescription"),
    },
    alternates: {
      canonical: `/${locale}/gdpr`,
      languages: {
        fi: "/fi/gdpr",
        sv: "/sv/gdpr",
        en: "/en/gdpr",
        "x-default": "/en/gdpr",
      },
    },
  };
}

export default async function GDPRPage() {
  const locale = await getLocale();
  const t = await getTranslations({ locale, namespace: "GDPR" });

  return (
    <div className="mx-auto w-full max-w-5xl px-5 py-10 space-y-8">
      {/* Header */}
      <header className="space-y-2">
        <h1 className="text-3xl font-bold tracking-tight">{t("title")}</h1>
        <p className="text-muted-foreground">
          {t("lastUpdated", { date: LAST_UPDATED })}
        </p>
      </header>

      {/* Controller */}
      <Card>
        <CardHeader>
          <CardTitle>{t("controller.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-1">
          <p className="font-semibold">{t("controller.name")}</p>
          <p className="text-sm text-muted-foreground">
            {t("controller.scope")}
          </p>
        </CardContent>
      </Card>

      {/* Purpose */}
      <Card>
        <CardHeader>
          <CardTitle>{t("purpose.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p>{t("purpose.lead")}</p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>{t("purpose.items.delivery")}</li>
            <li>{t("purpose.items.subscription")}</li>
            <li>{t("purpose.items.logging")}</li>
            <li>{t("purpose.items.feedback")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Data categories */}
      <Card>
        <CardHeader>
          <CardTitle>{t("dataCategories.title")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>{t("dataCategories.table.head.group")}</TableHead>
                <TableHead>{t("dataCategories.table.head.desc")}</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              <TableRow>
                <TableCell>{t("dataCategories.table.rows.contact.group")}</TableCell>
                <TableCell>{t("dataCategories.table.rows.contact.desc")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("dataCategories.table.rows.subscription.group")}</TableCell>
                <TableCell>{t("dataCategories.table.rows.subscription.desc")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("dataCategories.table.rows.logs.group")}</TableCell>
                <TableCell>{t("dataCategories.table.rows.logs.desc")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("dataCategories.table.rows.feedback.group")}</TableCell>
                <TableCell>{t("dataCategories.table.rows.feedback.desc")}</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>{t("dataCategories.table.rows.special.group")}</TableCell>
                <TableCell><strong>{t("dataCategories.table.rows.special.desc")}</strong></TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Sources / Legal bases / Recipients */}
      <Card>
        <CardHeader>
          <CardTitle>{t("legal.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h3 className="font-semibold">{t("legal.sources.title")}</h3>
            <p className="text-sm">{t("legal.sources.desc")}</p>
          </div>

          <div>
            <h3 className="font-semibold">{t("legal.basis.title")}</h3>
            <p className="text-sm">{t("legal.basis.desc")}</p>
          </div>

          <div className="space-y-2">
            <h3 className="font-semibold">{t("legal.recipients.title")}</h3>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("legal.recipients.table.head.party")}</TableHead>
                  <TableHead>{t("legal.recipients.table.head.role")}</TableHead>
                  <TableHead>{t("legal.recipients.table.head.location")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                <TableRow>
                  <TableCell>{t("legal.recipients.table.rows.bravo.party")}</TableCell>
                  <TableCell>{t("legal.recipients.table.rows.bravo.role")}</TableCell>
                  <TableCell>{t("legal.recipients.table.rows.bravo.location")}</TableCell>
                </TableRow>
                <TableRow>
                  <TableCell>{t("legal.recipients.table.rows.gateway.party")}</TableCell>
                  <TableCell>{t("legal.recipients.table.rows.gateway.role")}</TableCell>
                  <TableCell>{t("legal.recipients.table.rows.gateway.location")}</TableCell>
                </TableRow>
              </TableBody>
            </Table>

            <Alert>
              <AlertDescription className="text-sm">
                {t("legal.notice")}
              </AlertDescription>
            </Alert>
          </div>
        </CardContent>
      </Card>

      {/* Retention */}
      <Card>
        <CardHeader>
          <CardTitle>{t("retention.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p>{t("retention.desc")}</p>
        </CardContent>
      </Card>

      {/* Data subject rights */}
      <Card>
        <CardHeader>
          <CardTitle>{t("rights.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>{t("rights.items.access")}</li>
            <li>{t("rights.items.rectification")}</li>
            <li>{t("rights.items.erasure")}</li>
            <li>{t("rights.items.restriction")}</li>
            <li>{t("rights.items.object")}</li>
            <li>{t("rights.items.withdraw")}</li>
            <li>{t("rights.items.complaint")}</li>
          </ul>
        </CardContent>
      </Card>

      {/* Contacts */}
      <Card>
        <CardHeader>
          <CardTitle>{t("contact.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2">
          <p className="text-sm">{t("contact.primary")}</p>
          <Alert>
            <AlertDescription className="text-sm">
              {t("contact.instructions")}
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>

    {/* Cookie declaration */}
      <Script
        id="cookie-declaration"
        src="https://consent.cookiebot.com/d223003a-5d0e-423f-bae4-d35d9f371403/cd.js"
        strategy="afterInteractive"
      />
      <div id="CookieDeclaration" />
    </div>
  );
}
