"use client";

import { useEffect, useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ChevronDown } from "lucide-react";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import DataTable from "../data-table";
import type { WinterStats } from "@/actions/winterStats";

type Props = {
  winterYears: number[];
  initialYear: number;
  initialStats: WinterStats;
  fetchStats: (year: number) => Promise<WinterStats>; // server action
};

export default function StatisticsClient({ winterYears, initialYear, initialStats, fetchStats }: Props) {
  const t = useTranslations("Statistics");

  const [selectedYear, setSelectedYear] = useState(initialYear);
  const [stats, setStats] = useState<WinterStats>(initialStats);
  const [isPending, startTransition] = useTransition();

  // Optional: refresh once on mount to ensure live numbers
  useEffect(() => {
    startTransition(async () => {
      const next = await fetchStats(initialYear);
      setStats(next);
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleSelectYear = (year: number) => {
    setSelectedYear(year);
    startTransition(async () => {
      const next = await fetchStats(year); // calls server action (server-side)
      setStats(next);
    });
  };

  return (
    <div className="space-y-6">
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
                <DropdownMenuItem key={year} onClick={() => handleSelectYear(year)}>
                  {year}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
        <Card className="h-full">
          <CardHeader><CardTitle>{t("warnings")}</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full flex justify-between items-center">
              <span className="text-3xl sm:text-4xl font-bold">{isPending ? "..." : stats.warnings}</span>
            </div>
          </CardContent>
        </Card>

        <Card className="h-full">
          <CardHeader><CardTitle>{t("users")}</CardTitle></CardHeader>
          <CardContent>
            <div className="w-full flex justify-between items-center">
              <span className="text-3xl sm:text-4xl font-bold">{isPending ? "..." : stats.users}</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* /api/warnings is public → table can keep using it */}
      <div className="w-full overflow-x-auto">
        <DataTable className="w-full" year={selectedYear} />
      </div>
    </div>
  );
}
