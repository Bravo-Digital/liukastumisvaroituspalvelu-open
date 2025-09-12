// app/[locale]/warnings/page.tsx
import { db } from "@/lib/db"
import { warningsTable } from "@/lib/schema"
import { lt, gt, eq, and } from "drizzle-orm"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { AlertTriangle, CheckCircle } from "lucide-react"
import Statistics from "@/components/statistics"
import { getMessages } from "next-intl/server"
import { cn } from "@/lib/utils"

export default async function WarningsPage(props: any) {
  const { params } = props
  const messages = await getMessages({ locale: params.locale })

  const t = (key: string) => {
    const keys = key.split(".")
    let result: any = messages?.WarningsPage
    for (const k of keys) {
      result = result?.[k]
      if (result === undefined) return key
    }
    return result
  }

  const now = new Date()

  const activeWarnings = await db
    .select()
    .from(warningsTable)
    .where(
      and(
        eq(warningsTable.status, "active"),
        gt(warningsTable.expiresAt, now),
        lt(warningsTable.onsetAt, now)
      )
    )

  const hasActiveWarnings = activeWarnings.length > 0

  return (
<     div className="w-full max-w-5xl mx-auto mt-6">
      <Alert
        variant={hasActiveWarnings ? "destructive" : "default"}
        className="flex items-center space-x-4 w-full border-0"
      >
        {/* Icon wrapper */}
        <div
          className={cn(
            "bg-primary/10 text-primary group-hover:bg-primary/40 flex w-30 h-30 items-center justify-center rounded-full transition-colors duration-300 flex-shrink-0"
          )}
        >
          {hasActiveWarnings ? (
            <AlertTriangle className="w-15 h-15" />
          ) : (
            <CheckCircle className="w-15 h-15" />
          )}
        </div>

        <div className="flex flex-col justify-center">
          <h2 className="text-xl font-bold">
            {hasActiveWarnings
              ? t("active.title")
              : t("none.title")}
          </h2>
          <AlertDescription>
            {hasActiveWarnings
              ? activeWarnings.length > 1
                ? t("active.description_plural").replace(
                    "{count}",
                    activeWarnings.length.toString()
                  )
                : t("active.description_singular")
              : t("none.description")}
          </AlertDescription>
        </div>
      </Alert>

      <section className="w-full">
        <Statistics />
      </section>
    </div>
  )
}
