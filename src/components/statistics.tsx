"use client"
import { useState } from "react"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

import { ChevronDown, TrendingUp } from "lucide-react"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Button } from "@/components/ui/button"
import DataTable from "./data-table"

const yearlyStats = {
  2024: [
    { title: "Varoituksia", data: "12", trend: "+2 talvesta 2021" },
    { title: "Aktiivisia tilaajia", data: "4007", trend: "+20% talvesta 2021" },
    { title: "Rajapintakyselyitä", data: "3204", trend: "+45% talvesta 2021" },
  ],
  2023: [
    { title: "Varoituksia", data: "10", trend: "+1 talvesta 2022" },
    { title: "Aktiivisia tilaajia", data: "3672", trend: "+10% talvesta 2022" },
    { title: "Rajapintakyselyitä", data: "2210", trend: "+25% talvesta 2022" },
  ],
  2022: [
    { title: "Varoituksia", data: "9", trend: "-1 viime talvesta" },
    { title: "Aktiivisia tilaajia", data: "3340", trend: "+15% viime talvesta" },
    { title: "Rajapintakyselyitä", data: "1760", trend: "+30% viime talvesta" },
  ]
}

export default function Statistics() {
  const [selectedYear, setSelectedYear] = useState<2024 | 2023 | 2022>(2024)

  return (
    <div className="space-y-6">
      {/* Header - Mobile optimized */}
      <div className="sticky top-0 bg-background z-10 py-4 border-b">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
          <h1 className="text-xl sm:text-2xl font-semibold leading-tight">
            Tilastot talvikaudelta {selectedYear} – {selectedYear + 1}
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
              {[2024, 2023, 2022].map((year) => (
                <DropdownMenuItem
                  key={year}
                  onClick={() => setSelectedYear(year as 2024 | 2023 | 2022)}
                >
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Main Content - Original layout on desktop, stacked on mobile */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Statistics Cards */}
        <div className="md:col-span-1 flex flex-col space-y-4">
          {yearlyStats[selectedYear].map((statistic, index) => (
            <Card key={index} className="h-full">
              <CardHeader>
                <CardTitle>{statistic.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="w-full flex justify-between items-center">
                  <span className="text-xl font-bold">{statistic.data}</span>
                  <Badge>
                    <TrendingUp className="mr-1 h-4 w-4" />
                    <span>{statistic.trend}</span>
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

      </div>

      {/* Data Table - Full width */}
      <div className="w-full overflow-x-auto">
        <DataTable className="w-full" year={selectedYear} />
      </div>
    </div>
  )
}