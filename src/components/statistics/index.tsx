import { unstable_noStore as noStore } from "next/cache";
import { getWinterStats, type WinterStats } from "@/actions/winterStats";
import StatisticsClient from "./StatisticsClient";

export const revalidate = 0;

export default async function Statistics() {
  noStore();

  const START_YEAR = 2024;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  // Initial selection is last started season (before Oct -> previous year)
  const initialYear = currentMonth >= 10 ? currentYear : currentYear - 1;

  // (Before Oct: show up to currentYear, Oct–Dec: still fine to show up to currentYear)
  const endYear = currentYear;

  const winterYears = Array.from(
    { length: endYear - START_YEAR + 1 },
    (_, i) => START_YEAR + i
  );

  const initialStats: WinterStats = await getWinterStats(initialYear);

  return (
    <StatisticsClient
      winterYears={winterYears}
      initialYear={initialYear}
      initialStats={initialStats}
      fetchStats={getWinterStats}
    />
  );
}
