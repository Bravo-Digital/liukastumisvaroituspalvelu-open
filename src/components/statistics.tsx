"use client"
import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ChevronDown } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import DataTable from "./data-table"
import { useTranslations } from "next-intl"

interface Stats {
  users: number
  warnings: number
}

export default function Statistics() {
  const t = useTranslations("Statistics")

  const START_YEAR = 2025 // Winter 2025-2026
  const currentYear = new Date().getFullYear()
  const currentMonth = new Date().getMonth() + 1 // Jan=1, Dec=12

// Determine the latest winter season (cannot go into the future)
let latestWinterYear: number
if (currentMonth >= 10) {
  // Winter just started, show currentYear if data exists
  latestWinterYear = currentYear
} else {
  // Winter started last year
  latestWinterYear = currentYear - 1
}

// Prevent going before START_YEAR
latestWinterYear = Math.max(latestWinterYear, START_YEAR)

  // Generate winter years from START_YEAR up to latestWinterYear
  const winterYears = Array.from(
    { length: latestWinterYear - START_YEAR + 1 },
    (_, i) => START_YEAR + i
  )

  const [selectedYear, setSelectedYear] = useState(latestWinterYear)
  const [stats, setStats] = useState<Stats>({ users: 0, warnings: 0 })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const fetchStats = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/winter-stats?year=${selectedYear}`)
        if (!res.ok) throw new Error("Failed to fetch stats")
        const data: Stats = await res.json()
        setStats(data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [selectedYear])

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="sticky top-0 bg-background z-10 py-4 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
          {t("title")} {selectedYear} – {selectedYear + 1}
          </h1>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" className="w-full sm:w-auto">
                <div className="flex space-x-2 items-center">
                  <span>{selectedYear}</span>
                  <ChevronDown className="h-4 w-4" />
                </div>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="min-w-auto">
              {winterYears.map((year) => (
                <DropdownMenuItem key={year} onClick={() => setSelectedYear(year)}>
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t("warnings")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-between items-center">
              <span className="text-3xl sm:text-4xl font-bold">{loading ? "..." : stats.warnings}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader>
            <CardTitle>{t("users")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="w-full flex justify-between items-center">
              <span className="text-3xl sm:text-4xl font-bold">{loading ? "..." : stats.users}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto">
        <DataTable className="w-full" year={selectedYear} />
      </div>
    </div>
  )
}
