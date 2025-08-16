import Link from "next/link"
import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { getLocale } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button";

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

  return (
    <div className="w-full max-w-5xl mx-auto flex flex-col space-y-10 pb-16 px-5">

      {/* Hero Section */}
      <section className="w-full rounded-xl  py-12 md:py-16 flex flex-col items-start space-y-6">
        <h1 className="text-3xl md:text-5xl font-bold leading-tight">
          Liukastumisvaroituspalvelu
        </h1>
        <p className="text-base md:text-lg  max-w-xl">
          Saat ilmoitukset erittäin liukkaasta jalankulkusäästä suoraan puhelimeesi. Palvelu on ilmainen.
        </p>
        <Link href="/sign-up" className={buttonVariants({ variant: "default", size: "lg" })}>
          Tilaa varoitukset
        </Link>
      </section>
 {/* Additional Info Section */}
<section className="w-full bg-card rounded-xl p-8 md:p-12 space-y-6 text-card-foreground border border-border">
  <h2 className="text-2xl md:text-3xl font-bold">Tietoa palvelusta</h2>
  
  <p className="text-base md:text-lg leading-relaxed text-card-foreground/90">
    Liukasvaroituspalvelun idea on tiedottaa sen käyttäjiä silloin, kun ulkona on erityisen liukasta, jotta liukastumisilta vältyttäisiin.
  </p>

  <h3 className="text-xl md:text-2xl font-semibold mt-4">Toimintaperiaatteet</h3>
  <ul className="list-disc list-inside space-y-2 text-card-foreground/90">
  <li className="flex items-start space-x-3 space-y-2">
        <CheckCircle className="text-green-300" />
        <span>Saat ilmoituksen puhelimeesi, kun ulkona on poikkeuksellisen liukasta, ja liikkuminen vaatii erityistä varovaisuutta.</span>
      </li>
      <li className="flex items-start space-x-3 space-y-2">
        <CheckCircle className="text-green-300" />
        <span>Liukkauden päättymisestä ei tiedoteta erikseen</span>
      </li>
      <li className="flex items-center space-x-3">
  <div className="bg-body border rounded p-2 flex-shrink-0">
    <CheckCircle className="text-green-400 w-5 h-5" />
  </div>
  <span>Palvelu on täysin ilmainen.</span>
</li>

  </ul>
</section>

      {/* Active Warning Alert */}
      {isActiveWarning && (
        <Alert variant={activeWarning.severity} className="w-full">
          <AlertTriangle />
          <AlertTitle>{activeWarning.details[0].event}</AlertTitle>
          <AlertDescription>{activeWarning.details[0].description}</AlertDescription>
        </Alert>
      )}

      {/* Statistics Section */}
      <section className="w-full">
        <Statistics />
      </section>

     

    </div>
  )
}
