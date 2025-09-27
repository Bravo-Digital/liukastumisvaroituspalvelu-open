import Link from "next/link"
import { CheckCircle } from "lucide-react"
import { getLocale, getTranslations } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button";
import { FAQ } from "@/components/FAQ";
import type { Metadata } from "next";

const localeMap = {
  fi: "fi-FI",
  sv: "sv-FI",
  en: "en-GB"
}
const ogLocaleMap: Record<string, string> = {
  fi: "fi_FI",
  sv: "sv_FI",
  en: "en_GB",
};


export async function generateMetadata(): Promise<Metadata> {
  const locale = (await getLocale()) as "fi" | "sv" | "en";
  const t = await getTranslations({ locale, namespace: "SEO" });


  return {
    title: t("title"),
    description: t("description"),
    openGraph: {
      title: t("title"),
      description: t("description"),
      url: `/${locale}`,
      locale: ogLocaleMap[locale],
      type: "website",
    },
    twitter: {
      card: "summary",
      title: t("title"),
      description: t("description"),
    },
    alternates: {
      canonical: `/${locale}`,
      languages: {
        fi: "/fi",
        sv: "/sv",
        en: "/en",
        "x-default": "/en",
      },
    },
  };
}

export default async function HomePage() {
  const t = await getTranslations("Homepage")
  const locale = await getLocale() as keyof typeof localeMap
  const apiLocale = localeMap[locale];

  const faqItems = [
    {
      question: t("FAQ.q1"),
      answer: (
        <>
          {t("FAQ.a1/1")}
          <br />
          <a
            href="/subscribe"
            className="text-primary font-medium hover:underline"
          >
            {t("FAQ.from_here")}
          </a>
        </>
      )
      
    },
    {
      question: t("FAQ.q2"),
      answer: t("FAQ.a2")
    },
    {
      question: t("FAQ.q3"),
      answer:  t("FAQ.a3")
    },
    {
        question: t("FAQ.q4"),
        answer: t("FAQ.a4")
      },
      {
        question: t("FAQ.q5"),
        answer: t("FAQ.a5")
      }
  ];

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-10 pb-16 px-5">
    <section className="relative w-full text-center rounded-xl min-h-[75vh] 
    bg-[radial-gradient(ellipse_at_center,rgba(from_var(--primary)_r_g_b_/_0.19),transparent_40%)] 
    flex items-center justify-center overflow-hidden">

  {/* Hero content */}
  <div className="relative flex flex-col items-center space-y-6 px-5 md:px-0">
  <h1 className="text-3xl md:text-5xl font-bold leading-tight whitespace-normal [overflow-wrap:anywhere] [hyphens:auto]">
    {t("Hero.title1/2")}
    <span className="block relative px-1.5 mt-2">
      <span className="absolute inset-0 h-full border border-primary/60 bg-primary/15 group-hover:bg-primary/20 dark:border-primary/40 z-0 rounded-sm" />

      <svg width="5" height="5" viewBox="0 0 5 5" className="fill-primary dark:fill-primary/70 absolute top-[-2px] left-[-2px]">
        <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z" />
      </svg>
      <svg width="5" height="5" viewBox="0 0 5 5" className="fill-primary dark:fill-primary/70 absolute top-[-2px] right-[-2px]">
        <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z" />
      </svg>
      <svg width="5" height="5" viewBox="0 0 5 5" className="fill-primary dark:fill-primary/70 absolute bottom-[-2px] left-[-2px]">
        <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z" />
      </svg>
      <svg width="5" height="5" viewBox="0 0 5 5" className="fill-primary dark:fill-primary/70 absolute right-[-2px] bottom-[-2px]">
        <path d="M2 0h1v2h2v1h-2v2h-1v-2h-2v-1h2z" />
      </svg>

      <span className="relative z-10">{t("Hero.title2/2")}</span>
    </span>
  </h1>


    <p className="text-base md:text-lg max-w-xl">
      {t("Hero.desc")}
    </p>
    <Link
      href="/subscribe"
      className={buttonVariants({ variant: "default", size: "lg" })}
    >
      {t("Hero.subscibe")}
    </Link>
  </div>
</section>


 {/* Additional Info Section */}
<section className="relative w-full rounded-xl p-8 md:p-12 space-y-6 text-card-foreground border border-border overflow-hidden">
  
  {/* Grid background */}
  <div className="absolute inset-0 -z-10 
    bg-[linear-gradient(to_right,rgba(var(--muted-foreground-rgb)/0.05)_1px,transparent_1px),
        linear-gradient(to_bottom,rgba(var(--muted-foreground-rgb)/0.05)_1px,transparent_1px)]
    bg-[size:3rem_3rem]">
  </div>

  <h2 className="text-2xl md:text-3xl font-bold">{t("InfoBox.title")}</h2>
  
  <p className="text-base md:text-lg leading-relaxed text-card-foreground/90">
    {t("InfoBox.text")}
  </p>

  <h3 className="text-xl md:text-2xl font-semibold mt-4">{t("InfoBox.subtitle")}</h3>
  <ul className="list-disc list-inside space-y-2 text-card-foreground/90">
    <li className="flex items-start space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" aria-hidden="true"/>
      </div>
      <span>{t("InfoBox.p1")}</span>
    </li>
    <li className="flex items-center space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" aria-hidden="true"/>
      </div>
      <span>{t("InfoBox.p2")}</span>
    </li>
    <li className="flex items-center space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" aria-hidden="true"/>
      </div>
      <span>{t("InfoBox.p3")}</span>
    </li>
  </ul>
</section>

<section>
<FAQ items={faqItems} />
</section>
    </div>
  )
}
