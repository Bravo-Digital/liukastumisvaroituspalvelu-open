"use client"

import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis } from "recharts"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  ChartConfig,
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart"

export const description = "A bar chart with a label"

const chartData = {
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
} as const


const chartConfig = {
  warnings: {
    label: "Varoituksia",
    color: "var(--chart-1)",
  },
} satisfies ChartConfig

type ChartProps = {
    year: number
    className?: string
}

export function Chart({ className, year }: ChartProps) {
  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle>Varoitukset kuukausittain</CardTitle>
        <CardDescription>Lokakuu {year} – Maaliskuu {year + 1}</CardDescription>
      </CardHeader>
      <CardContent>
        <ChartContainer config={chartConfig}>
          <BarChart
            accessibilityLayer
            data={[...chartData[String(year) as keyof typeof chartData]]}
            margin={{ top: 10 }}
          >
            <CartesianGrid vertical={false} />
            <XAxis
              dataKey="month"
              tickLine={false}
              tickMargin={5}
              axisLine={false}
            />
            <YAxis
              axisLine={false}
              tickLine={false}
              tickMargin={5}
              domain={[0, "dataMax + 1"]}
              allowDecimals={false}
            />
            <ChartTooltip
              cursor={false}
              content={<ChartTooltipContent hideLabel />}
            />
            <Bar dataKey="warnings" fill="var(--color-warnings)" radius={8}>
              <LabelList
                position="top"
                offset={12}
                className="fill-foreground"
                fontSize={12}
              />
            </Bar>
          </BarChart>
        </ChartContainer>
      </CardContent>
    </Card>
  )
}
