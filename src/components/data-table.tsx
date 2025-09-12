"use client"
import { useState, useEffect, useMemo } from "react"
import { Card } from "./ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "./ui/table"
import { Button } from "./ui/button"
import { ArrowUpDown, ArrowUp, ArrowDown } from "lucide-react"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "./ui/dropdown-menu"
import { useTranslations } from "next-intl"

interface Warning {
  id: string
  date: string
  time: string
  area: string
}

type DataTableProps = {
  year: number
  className?: string
}

type SortConfig = {
  key: keyof Warning | null
  direction: 'asc' | 'desc'
}

export default function DataTable({ year, className }: DataTableProps) {
  const [warnings, setWarnings] = useState<Warning[]>([])
  const [loading, setLoading] = useState(false)
  const [sortConfig, setSortConfig] = useState<SortConfig>({ key: null, direction: 'asc' })
  const t = useTranslations("DataTable")
  
  useEffect(() => {
    const fetchWarnings = async () => {
      setLoading(true)
      try {
        const res = await fetch(`/api/warnings?year=${year}`)
        if (!res.ok) throw new Error("Failed to fetch warnings")
          const data = await res.json()
          setWarnings(data.warnings)        
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }

    fetchWarnings()
  }, [year])

  const sortedWarnings = useMemo(() => {
    if (!sortConfig.key) return warnings

    return [...warnings].sort((a, b) => {
      let aValue = a[sortConfig.key!]
      let bValue = b[sortConfig.key!]

      if (sortConfig.key === 'date') {
        const [aDay, aMonth, aYear] = a.date.split('.').map(Number)
        const [bDay, bMonth, bYear] = b.date.split('.').map(Number)
        aValue = new Date(aYear, aMonth - 1, aDay).getTime().toString()
        bValue = new Date(bYear, bMonth - 1, bDay).getTime().toString()
      }

      if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1
      if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1
      return 0
    })
  }, [warnings, sortConfig])

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

  return (
    <Card className={className}>
      <div className="px-6 flex flex-col space-y-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>
              <Button
                  variant="ghost"
                  onClick={() => handleSort('date')}
                  className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                  {t("date")} {getSortIcon('date')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('time')}
                  className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                  {t("time")} {getSortIcon('time')}
                </Button>
              </TableHead>
              <TableHead>
                <Button
                  variant="ghost"
                  onClick={() => handleSort('area')}
                  className="h-auto !p-0 font-semibold hover:bg-transparent"
                >
                  {t("area")}  {getSortIcon('area')}
                </Button>
              </TableHead>
            </TableRow>
          </TableHeader>

          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                {t("loading")}
                </TableCell>
              </TableRow>
            ) : sortedWarnings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} className="text-center">
                {t("empty")}
                </TableCell>
              </TableRow>
            ) : (
              sortedWarnings.map((w) => (
                <TableRow key={w.id} className="hover:bg-muted/50">
                  <TableCell className="font-medium">{w.date}</TableCell>
                  <TableCell>{w.time}</TableCell>
                  <TableCell>{w.area}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </Card>
  )
}
