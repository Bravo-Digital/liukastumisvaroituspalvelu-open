import Link from "next/link"
import Statistics from "@/components/statistics"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import { getLocale } from "next-intl/server"
import { buttonVariants } from "@/components/ui/button";
import { DotPattern } from "@/components/ui/shadcn-io/dot-pattern";
import { cn } from "@/lib/utils";

const localeMap = {
  fi: "fi-FI",
  sv: "sv-FI",
  en: "en-GB"
}

export default async function StatisticsPage() {
      
      {/* Statistics Section */}
      <section className="w-full">
        <Statistics />
      </section>
}