import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle } from "lucide-react"

export default function HomePage() {
    const activeWarning = true
    return (
        <div className="w-full max-w-5xl h-auto flex flex-col space-y-5 pb-10">
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
            <div className="flex flex-col space-y-5">
                <h1 className="text-3xl font-semibold">Liukastumisvaroituspalvelu</h1>
                <p>Liukastumisvaroituspalvelu tarjoaa erittäin liukkaan jalankulkusään varoitukset tekstiviestillä</p>
            </div>
            <Statistics />
        </div>
    )
}