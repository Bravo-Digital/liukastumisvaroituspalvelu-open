import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function HomePage() {
    const activeWarning = true
    return (
        <div className="w-full max-w-5xl h-auto flex flex-col space-y-5 pb-10 px-5">
            {activeWarning && (
                <Alert variant={"destructive"}>
                    <AlertTriangle />
                    <AlertTitle>
                        Erittäin liukasta Helsingissä
                    </AlertTitle>
                    <AlertDescription>
                        Suosittelemme erityistä varovaisuutta ulkona käydessä
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