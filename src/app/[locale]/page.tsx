import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"
import { getLocale } from "next-intl/server"

const localeMap = {
    fi: "fi-FI",
    sv: "sv-FI",
    en: "en-GB"
}

export default async function HomePage() {
    const locale = await getLocale() as keyof typeof localeMap
    const apiLocale = localeMap[locale]
    const result = await fetch(`http://localhost:3000/api/warnings/active?languages=${apiLocale}`).then(res => res.json())
    const activeWarning = result.warnings[0]
    const isActiveWarning = activeWarning !== undefined ? true : false
    return (
        <div className="w-full max-w-5xl h-auto flex flex-col space-y-5 pb-10 px-5">
            {isActiveWarning && (
                <Alert variant={activeWarning.severity} className="w-full">
                    <AlertTriangle />
                    <AlertTitle>
                        {activeWarning.details[0].event}
                    </AlertTitle>
                    <AlertDescription>
                        {activeWarning.details[0].description}
                    </AlertDescription>
                </Alert>
            )}
            <div className="flex flex-col space-y-3 md:space-x-3">
                <h1 className="text-xl md:text-3xl font-semibold">Liukastumisvaroituspalvelu</h1>
                <p className="text-sm md:text-base">Liukastumisvaroituspalvelu tarjoaa erittäin liukkaan jalankulkusään varoitukset tekstiviestillä</p>
            </div>
            <Statistics />
        </div>
    )
}