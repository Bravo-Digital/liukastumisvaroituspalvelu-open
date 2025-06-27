"use client"
import { Bar, BarChart, CartesianGrid, LabelList, XAxis, YAxis, ResponsiveContainer } from "recharts"
import {
  Card,
  CardContent,
  CardDescription,
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
    { month: "Lokakuu", warnings: 0, shortMonth: "Loka" },
    { month: "Marraskuu", warnings: 1, shortMonth: "Marras" },
    { month: "Joulukuu", warnings: 3, shortMonth: "Joulu" },
    { month: "Tammikuu", warnings: 2, shortMonth: "Tammi" },
    { month: "Helmikuu", warnings: 2, shortMonth: "Helmi" },
    { month: "Maaliskuu", warnings: 1, shortMonth: "Maalis" },
  ],
  "2023": [
    { month: "Lokakuu", warnings: 1, shortMonth: "Loka" },
    { month: "Marraskuu", warnings: 1, shortMonth: "Marras" },
    { month: "Joulukuu", warnings: 4, shortMonth: "Joulu" },
    { month: "Tammikuu", warnings: 3, shortMonth: "Tammi" },
    { month: "Helmikuu", warnings: 1, shortMonth: "Helmi" },
    { month: "Maaliskuu", warnings: 0, shortMonth: "Maalis" },
  ],
  "2024": [
    { month: "Lokakuu", warnings: 1, shortMonth: "Loka" },
    { month: "Marraskuu", warnings: 2, shortMonth: "Marras" },
    { month: "Joulukuu", warnings: 5, shortMonth: "Joulu" },
    { month: "Tammikuu", warnings: 3, shortMonth: "Tammi" },
    { month: "Helmikuu", warnings: 0, shortMonth: "Helmi" },
    { month: "Maaliskuu", warnings: 1, shortMonth: "Maalis" },
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
        <CardTitle className="text-lg sm:text-xl">Varoitukset kuukausittain</CardTitle>
        <CardDescription className="text-sm">
          Lokakuu {year} – Maaliskuu {year + 1}
        </CardDescription>
      </CardHeader>
      <CardContent className="p-3 sm:p-6">
        {/* Mobile Chart - No Y-axis, short month names */}
        <div className="block sm:hidden">
          <ChartContainer config={chartConfig} className="min-h-[180px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer
                data={[...chartData[String(year) as keyof typeof chartData]]}
                margin={{ 
                  top: 15, 
                  right: 5, 
                  left: 5, 
                  bottom: 5 
                }}
                barCategoryGap="15%"
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="shortMonth"
                  tickLine={false}
                  tickMargin={6}
                  axisLine={false}
                  fontSize={10}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    hideLabel={false}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return data.month;
                      }
                      return label;
                    }}
                  />}
                />
                <Bar 
                  dataKey="warnings" 
                  fill="var(--color-warnings)" 
                  radius={[3, 3, 0, 0]}
                  maxBarSize={35}
                >
                  <LabelList
                    position="top"
                    offset={6}
                    className="fill-foreground"
                    fontSize={9}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>

        {/* Desktop Chart - With Y-axis, full month names */}
        <div className="hidden sm:block">
          <ChartContainer config={chartConfig} className="min-h-[250px] lg:min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                accessibilityLayer
                data={[...chartData[String(year) as keyof typeof chartData]]}
                margin={{ 
                  top: 20, 
                  right: 10, 
                  left: 10, 
                  bottom: 5 
                }}
              >
                <CartesianGrid vertical={false} strokeDasharray="3 3" />
                <XAxis
                  dataKey="month"
                  tickLine={false}
                  tickMargin={8}
                  axisLine={false}
                  fontSize={12}
                  angle={-45}
                  textAnchor="end"
                  height={60}
                />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tickMargin={8}
                  domain={[0, "dataMax + 1"]}
                  allowDecimals={false}
                  fontSize={12}
                  width={30}
                />
                <ChartTooltip
                  cursor={false}
                  content={<ChartTooltipContent 
                    hideLabel={false}
                    labelFormatter={(label, payload) => {
                      if (payload && payload.length > 0) {
                        const data = payload[0].payload;
                        return data.month;
                      }
                      return label;
                    }}
                  />}
                />
                <Bar 
                  dataKey="warnings" 
                  fill="var(--color-warnings)" 
                  radius={[4, 4, 0, 0]}
                  maxBarSize={60}
                >
                  <LabelList
                    position="top"
                    offset={8}
                    className="fill-foreground"
                    fontSize={11}
                  />
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  )
}