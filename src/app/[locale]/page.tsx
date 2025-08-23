import Link from "next/link"
import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { getLocale } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/shadcn-io/dot-pattern";
import { cn } from "@/lib/utils";
import { FAQ } from "@/components/FAQ";

const localeMap = {
  fi: "fi-FI",
  sv: "sv-FI",
  en: "en-GB"
}

export default async function HomePage() {
  const locale = await getLocale() as keyof typeof localeMap
  const apiLocale = localeMap[locale]
  const result = await fetch(`http://localhost:3000/api/warnings/active?languages=${apiLocale}`).then(res => res.json())
  const activeWarning = Array.isArray(result.warnings) && result.warnings.length > 0 ? result.warnings[0] : undefined;
  const isActiveWarning = activeWarning !== undefined


  const faqItems = [
    {
      question: "Miten saan varoitukset puhelimeeni?",
      answer: (
        <>
          Voit tilata varoitukset puhelimeesi{" "}
          <a
            href="/subscribe"
            className="text-primary font-medium hover:underline"
          >
            täältä
          </a>
          . Kun poikkeuksellista liukkautta havaitaan, saat varoituksen suoraan puhelimeesi.
        </>
      )
      
    },
    {
      question: "Onko palvelu ilmainen?",
      answer: "Kyllä, palvelu on täysin ilmainen."
    },
    {
      question: "Onko palvelu käytössä vain Helsingissä?",
      answer: "Tällä hetkellä liukkausvaroitukset ovat vain Helsingin alueelta."
    },
    {
        question: "Kuka vastaa Liukasbotin ylläpidosta?",
        answer: "Liukasbotin ylläpidosta vastaa Bravo Digital Oy."
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
    Vältä liukastumiset{" "}
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

      <span className="relative z-10">Liukasbotilla</span>
    </span>
  </h1>


    <p className="text-base md:text-lg max-w-xl">
      Saat ilmoitukset erittäin liukkaasta jalankulkusäästä suoraan puhelimeesi. Palvelu on ilmainen.
    </p>
    <Link
      href="/subscribe"
      className={buttonVariants({ variant: "default", size: "lg" })}
    >
      Tilaa varoitukset
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

  <h2 className="text-2xl md:text-3xl font-bold">Tietoa Liukasbotista</h2>
  
  <p className="text-base md:text-lg leading-relaxed text-card-foreground/90">
    Liukasbotin idea on tiedottaa sen käyttäjiä silloin, kun ulkona on erityisen liukasta, jotta liukastumisilta vältyttäisiin.
  </p>

  <h3 className="text-xl md:text-2xl font-semibold mt-4">Toimintaperiaatteet</h3>
  <ul className="list-disc list-inside space-y-2 text-card-foreground/90">
    <li className="flex items-start space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" />
      </div>
      <span>Saat ilmoituksen puhelimeesi, kun ulkona on poikkeuksellisen liukasta, ja liikkuminen vaatii erityistä varovaisuutta.</span>
    </li>
    <li className="flex items-center space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" />
      </div>
      <span>Varoitus lähetetään liukkaan sään alussa.</span>
    </li>
    <li className="flex items-center space-x-3">
      <div className="bg-primary/10 text-primary group-hover:bg-primary/20 flex w-12 h-12 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0">
        <CheckCircle className="w-5 h-5" />
      </div>
      <span>Palvelu on täysin ilmainen.</span>
    </li>
  </ul>
</section>

<section>
<FAQ items={faqItems} />
</section>

      {/* Active Warning Alert */}
      {isActiveWarning && (
        <Alert variant={activeWarning.severity} className="w-full">
          <AlertTriangle />
          <AlertTitle>{activeWarning.details[0].event}</AlertTitle>
          <AlertDescription>{activeWarning.details[0].description}</AlertDescription>
        </Alert>
      )}



     

    </div>
  )
}
