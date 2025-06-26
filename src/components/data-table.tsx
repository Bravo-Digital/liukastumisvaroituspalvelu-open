"use client"
import { useState, useMemo } from "react"
import { Card } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Badge } from "./ui/badge"
import { Button } from "./ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"

type Warning = {
  date: string
  time: string
  area: string
  severity: "Liukas" | "Erittäin liukas"
}

const randomAreas = ["Kallio", "Töölö", "Kontula", "Lauttasaari", "Vallila", "Itäkeskus"]
const severities: Warning["severity"][] = ["Liukas", "Erittäin liukas"]

// Utility to generate dummy warnings from total count
function generateWarnings(count: number, year: number, monthIndex: number): Warning[] {
  const warnings: Warning[] = []
  for (let i = 0; i < count; i++) {
    const day = Math.floor(Math.random() * 28) + 1
    const time = `${String(6 + Math.floor(Math.random() * 3)).padStart(2, "0")}:${Math.floor(Math.random() * 60).toString().padStart(2, "0")}`
    const area = randomAreas[Math.floor(Math.random() * randomAreas.length)]
    const severity = severities[Math.floor(Math.random() * severities.length)]
    warnings.push({
      date: `${day.toString().padStart(2, "0")}.${(monthIndex + 1).toString().padStart(2, "0")}.${year}`,
      time,
      area,
      severity
    })
  }
  return warnings
}

// Raw chartData with warning counts per month
type ChartDataYear = "2022" | "2023" | "2024";
const chartData: Record<ChartDataYear, { month: string; warnings: number }[]> = {
  "2022": [
    { month: "Lokakuu", warnings: 0 },
    { month: "Marraskuu", warnings: 1 },
    { month: "Joulukuu", warnings: 3 },
    { month: "Tammikuu", warnings: 2 },
    { month: "Helmikuu", warnings: 2 },
    { month: "Maaliskuu", warnings: 1 },
  ],
  "2023": [
    { month: "Lokakuu", warnings: 1 },
    { month: "Marraskuu", warnings: 1 },
    { month: "Joulukuu", warnings: 4 },
    { month: "Tammikuu", warnings: 3 },
    { month: "Helmikuu", warnings: 1 },
    { month: "Maaliskuu", warnings: 0 },
  ],
  "2024": [
    { month: "Lokakuu", warnings: 1 },
    { month: "Marraskuu", warnings: 2 },
    { month: "Joulukuu", warnings: 5 },
    { month: "Tammikuu", warnings: 3 },
    { month: "Helmikuu", warnings: 0 },
    { month: "Maaliskuu", warnings: 1 },
  ]
}

type DataTableProps = {
  year: number
  className?: string
}

type SortConfig = {
  key: keyof Warning | null
  direction: 'asc' | 'desc'
}

export default function DataTable({ className, year }: DataTableProps) {
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  const months = chartData[String(year) as ChartDataYear]
  const allWarnings = useMemo(() => {
    return months.flatMap((entry, index) =>
      generateWarnings(entry.warnings, year, index + (index < 3 ? 9 : -3))
    )
  }, [months, year])

  const sortedWarnings = useMemo(() => {
    if (!sortConfig.key) return allWarnings

    return [...allWarnings].sort((a, b) => {
      let aValue = a[sortConfig.key!]
      let bValue = b[sortConfig.key!]

      // Special handling for date sorting
      if (sortConfig.key === 'date') {
        const [aDay, aMonth, aYear] = a.date.split('.').map(Number)
        const [bDay, bMonth, bYear] = b.date.split('.').map(Number)
        const aDate = new Date(aYear, aMonth - 1, aDay)
        const bDate = new Date(bYear, bMonth - 1, bDay)
        aValue = aDate.getTime().toString()
        bValue = bDate.getTime().toString()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [allWarnings, sortConfig])

  const handleSort = (key: keyof Warning) => {
    setSortConfig(current => ({
      key,
      direction: current.key === key && current.direction === 'asc' ? 'desc' : 'asc'
    }))
  }

  const getSortIcon = (key: keyof Warning) => {
    if (sortConfig.key !== key) return <ArrowUpDown className="ml-2 h-4 w-4" />
    return sortConfig.direction === 'asc' 
      ? <ArrowUp className="ml-2 h-4 w-4" />
      : <ArrowDown className="ml-2 h-4 w-4" />
  }

  const getSeverityBadgeVariant = (severity: Warning["severity"]) => {
    return severity === "Erittäin liukas" ? "destructive" : "secondary"
  }

  return (
    <Card className={className}>
      <div className="px-6 flex flex-col space-y-4">
        <DropdownMenu>
            <DropdownMenuTrigger asChild className="w-fit">
                <Button>
                    Lataa taulukko
                </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
                <DropdownMenuItem>
                    CSV
                </DropdownMenuItem>
                <DropdownMenuItem>
                    Excel
                </DropdownMenuItem>
                <DropdownMenuItem>
                    PDF
                </DropdownMenuItem>
            </DropdownMenuContent>
        </DropdownMenu>
        <Table>
            <TableHeader>
            <TableRow>
                <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort('date')}
                    className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                    Päivämäärä
                    {getSortIcon('date')}
                </Button>
                </TableHead>
                <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort('time')}
                    className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                    Kellonaika
                    {getSortIcon('time')}
                </Button>
                </TableHead>
                <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort('area')}
                    className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                    Kaupunginosa
                    {getSortIcon('area')}
                </Button>
                </TableHead>
                <TableHead>
                <Button
                    variant="ghost"
                    onClick={() => handleSort('severity')}
                    className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                    Vakavuus
                    {getSortIcon('severity')}
                </Button>
                </TableHead>
            </TableRow>
            </TableHeader>
            <TableBody>
            {sortedWarnings.map((warning, idx) => (
                <TableRow key={idx} className="hover:bg-muted/50">
                <TableCell className="font-medium">{warning.date}</TableCell>
                <TableCell>{warning.time}</TableCell>
                <TableCell>{warning.area}</TableCell>
                <TableCell>
                    <Badge variant={getSeverityBadgeVariant(warning.severity)}>
                    {warning.severity}
                    </Badge>
                </TableCell>
                </TableRow>
            ))}
            </TableBody>
        </Table>
      </div>
    </Card>
  )
}